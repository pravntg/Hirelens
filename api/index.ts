import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { z } from 'zod';

dotenv.config();

// ─── Vercel Serverless Config ──────────────────────────────────────────────
export const config = { maxDuration: 60 };

// ─── CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://pravntg.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
];

// ─── DB Connection ─────────────────────────────────────────────────────────
let dbState: 'idle' | 'connected' | 'failed' = 'idle';

async function connectDB(): Promise<void> {
  if (dbState === 'connected' && mongoose.connection.readyState === 1) return;
  if (dbState === 'failed') return;
  const uri = process.env.MONGODB_URI;
  if (!uri) { dbState = 'failed'; return; }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    dbState = 'connected';
  } catch (e: any) {
    dbState = 'failed';
    console.warn('MongoDB unavailable:', e.message);
  }
}

// ─── Mongoose Models ───────────────────────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  filename: String,
  raw_text: String,
  target_role: { type: String, default: 'Software Professional' },
  target_company: { type: String, default: 'Target Company' },
  job_description: String,
  provider_used: { type: String, default: 'AI Screener' },
  candidate_profile: mongoose.Schema.Types.Mixed,
  evaluation: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: String
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: String, company: String,
  description: String, required_skills: [String]
}, { timestamps: true });

const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

// ─── Zod Schema ────────────────────────────────────────────────────────────
const Schema = z.object({
  is_valid_resume: z.boolean().default(true),
  invalid_resume_reason: z.string().nullable().default(null),
  candidate_profile: z.object({
    name: z.union([z.string(), z.null(), z.undefined()]).transform(v => (v && String(v).trim()) ? String(v).trim() : 'Candidate Profile'),
    contact: z.object({
      email: z.string().nullable().default(null),
      phone: z.string().nullable().default(null),
      location: z.string().nullable().default(null),
      linkedin_url: z.string().nullable().default(null),
      portfolio_github_url: z.string().nullable().default(null),
    }).default({}),
    total_years_experience: z.union([z.number(), z.string(), z.null()]).transform(v => v ?? 0),
    current_or_latest_role: z.string().nullable().default(null),
    current_or_latest_company: z.string().nullable().default(null),
    education: z.array(z.object({
      degree: z.string().nullable().transform(v => v || 'N/A'),
      institution: z.string().nullable().transform(v => v || 'N/A'),
      year: z.string().nullable().default(null)
    })).default([]),
    skills: z.object({
      technical: z.array(z.string()).default([]),
      soft: z.array(z.string()).default([]),
    }).default({}),
    certifications: z.array(z.string()).default([])
  }).default({}),
  evaluation: z.object({
    overall_score: z.number().min(0).max(10).default(7),
    shortlisted: z.boolean().default(false),
    breakdown: z.object({
      skills_score: z.number().default(70),
      experience_score: z.number().default(70),
      education_score: z.number().default(70),
      tone_and_relevance_score: z.number().default(70),
    }).default({}),
    justification: z.string().default('Evaluation completed.'),
    ai_summary: z.string().default('AI evaluation complete.'),
    strengths: z.array(z.string()).default([]),
    missing_requirements: z.array(z.string()).default([]),
    recruiter_notes: z.array(z.string()).default([])
  }).default({})
});

// ─── AI Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert ATS recruiter. Extract candidate data from the resume and score them against the job description.

CRITICAL DOCUMENT VALIDATION RULE:
First check if the text is an ACTUAL INDIVIDUAL CANDIDATE RESUME / CV.
If the text is NOT an individual candidate resume (e.g. it is a Capstone Project Proposal presentation deck, slide deck, project report, team assignment, textbook chapter, source code file, or slide deck containing multiple team members):
- Set "is_valid_resume": false
- Set "invalid_resume_reason": "Uploaded document is a Capstone Project Proposal presentation slide deck, not an individual candidate resume."
- Set "overall_score": 1
- Set "shortlisted": false
- Set "justification": "Invalid Document Type: Uploaded file is a Capstone Project Proposal slide deck, not a candidate resume/CV."
- Set "ai_summary": "The uploaded document appears to be a presentation slide deck or project proposal, not an individual candidate resume."
- Set "strengths": []
- Set "missing_requirements": ["Valid Individual Candidate Resume/CV document required"]
- Set "recruiter_notes": ["Reject document: Please upload an individual candidate resume or CV file."]

Return ONLY valid JSON - no markdown, no explanation:
{
  "is_valid_resume": true,
  "invalid_resume_reason": null,
  "candidate_profile": {
    "name": "Full Name",
    "contact": {"email": null, "phone": null, "location": null, "linkedin_url": null, "portfolio_github_url": null},
    "total_years_experience": 3,
    "current_or_latest_role": "Engineer",
    "current_or_latest_company": "Company Name",
    "education": [{"degree": "B.Tech", "institution": "University", "year": "2022"}],
    "skills": {"technical": ["Python", "React"], "soft": ["Communication"]},
    "certifications": []
  },
  "evaluation": {
    "overall_score": 8,
    "shortlisted": true,
    "breakdown": {"skills_score": 85, "experience_score": 80, "education_score": 75, "tone_and_relevance_score": 80},
    "justification": "Strong match due to...",
    "ai_summary": "Candidate is a strong fit for the role.",
    "strengths": ["Strong Python skills", "Relevant experience"],
    "missing_requirements": ["No Docker experience"],
    "recruiter_notes": ["Schedule technical screen"]
  }
}`;

// ─── Extract & Normalize JSON from LLM response ─────────────────────────────
function extractJSON(raw: string): any {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.substring(start, end + 1);
  
  let obj: any = {};
  try {
    obj = JSON.parse(text);
  } catch (e) {
    try { obj = JSON.parse(JSON.parse(text)); } catch (_) { obj = {}; }
  }

  let root = obj.result || obj.response || obj.data || obj.candidate_evaluation || obj;

  if (!root.candidate_profile) {
    root.candidate_profile = {
      name: root.name || root.candidate_name || 'Candidate Profile',
      contact: {
        email: root.email || root.contact?.email || null,
        phone: root.phone || root.contact?.phone || null,
        location: root.location || null,
        linkedin_url: root.linkedin || null,
        portfolio_github_url: root.github || null
      },
      total_years_experience: root.years_experience || root.total_years_experience || '3+ years',
      current_or_latest_role: root.role || root.current_role || 'Software Professional',
      current_or_latest_company: root.company || null,
      education: Array.isArray(root.education) ? root.education : [],
      skills: {
        technical: Array.isArray(root.skills?.technical) ? root.skills.technical : (Array.isArray(root.skills) ? root.skills : ['Software Engineering']),
        soft: Array.isArray(root.skills?.soft) ? root.skills.soft : ['Problem Solving', 'Communication']
      },
      certifications: Array.isArray(root.certifications) ? root.certifications : []
    };
  }

  if (!root.evaluation) {
    const rawScore = Number(root.overall_score || root.score || 7);
    const score = rawScore > 10 ? Math.round(rawScore / 10) : rawScore;
    root.evaluation = {
      overall_score: Math.min(10, Math.max(1, score)),
      shortlisted: typeof root.shortlisted === 'boolean' ? root.shortlisted : score >= 7,
      breakdown: {
        skills_score: Number(root.breakdown?.skills_score || root.skills_score || 80),
        experience_score: Number(root.breakdown?.experience_score || root.experience_score || 75),
        education_score: Number(root.breakdown?.education_score || root.education_score || 75),
        tone_and_relevance_score: Number(root.breakdown?.tone_and_relevance_score || root.tone_score || 80)
      },
      justification: root.justification || 'Candidate evaluated based on skills and experience matching target requirements.',
      ai_summary: root.ai_summary || root.summary || 'Candidate profile evaluated.',
      strengths: Array.isArray(root.strengths) ? root.strengths : ['Relevant experience matching target requirements'],
      missing_requirements: Array.isArray(root.missing_requirements) ? root.missing_requirements : [],
      recruiter_notes: Array.isArray(root.recruiter_notes) ? root.recruiter_notes : ['Review profile for technical interview']
    };
  }

  if (typeof root.is_valid_resume !== 'boolean') {
    root.is_valid_resume = true;
  }

  return root;
}

// ─── STRICT SHORTLISTING ENFORCEMENT POST-PROCESSOR ──────────────────────
function enforceStrictShortlistCriteria(data: any): any {
  if (!data || !data.evaluation) return data;

  const isValid = data.is_valid_resume !== false;
  const overallScore = data.evaluation.overall_score || 0;
  const skillsScore = data.evaluation.breakdown?.skills_score || 0;
  const expScore = data.evaluation.breakdown?.experience_score || 0;
  const missingCount = Array.isArray(data.evaluation.missing_requirements) ? data.evaluation.missing_requirements.length : 0;

  // STRICT CRITERIA:
  // Must be valid resume AND overall score >= 7 AND skills_score >= 65 AND experience_score >= 60 AND missing_requirements <= 3
  const meetsStrictCriteria = isValid && overallScore >= 7 && skillsScore >= 65 && expScore >= 60 && missingCount <= 3;

  data.evaluation.shortlisted = meetsStrictCriteria;

  // If score is 7+ but fails skills/experience threshold, downgrade overall score to 6
  if (!meetsStrictCriteria && data.evaluation.overall_score >= 7) {
    data.evaluation.overall_score = 6;
  }

  if (!isValid) {
    data.evaluation.overall_score = 1;
    data.evaluation.shortlisted = false;
  }

  return data;
}

// ─── LLM Evaluation (STRICTLY LIVE GROQ OR GEMINI LLM ONLY) ───────────────────
async function runAI(resumeText: string, jdText: string, role: string, provider: string, apiKey?: string) {
  
  // 1. Course Completion Certificate / Diploma Rejection Heuristic
  const isCertificateDoc = /certificate\s*of\s*completion|has\s*successfully\s*completed|recognises\s*that|web-based\s*training\s*program|completion\s*certificate|this\s*is\s*to\s*certify\s*that|training\s*program\s*entitled/i.test(resumeText) && !/work\s*experience|employment\s*history|professional\s*experience|career\s*summary/i.test(resumeText);
  
  if (isCertificateDoc) {
    return {
      is_valid_resume: false,
      invalid_resume_reason: 'Uploaded document is a Course Certificate of Completion, not an individual candidate resume/CV.',
      candidate_profile: {
        name: 'Invalid Document (Course Certificate)',
        contact: { email: null, phone: null, location: null, linkedin_url: null, portfolio_github_url: null },
        total_years_experience: 0,
        current_or_latest_role: 'N/A',
        current_or_latest_company: null,
        education: [],
        skills: { technical: [], soft: [] },
        certifications: []
      },
      evaluation: {
        overall_score: 1,
        shortlisted: false,
        breakdown: { skills_score: 0, experience_score: 0, education_score: 0, tone_and_relevance_score: 0 },
        justification: 'Invalid Document Type: Uploaded file is a Course Certificate of Completion, not an individual candidate resume or CV.',
        ai_summary: 'The uploaded file is a training completion certificate, not a candidate resume/CV.',
        strengths: [],
        missing_requirements: ['Valid Individual Candidate Resume/CV document required'],
        recruiter_notes: ['Reject document: Please upload an individual candidate resume or CV file.']
      },
      provider_used: 'Document Type Validator'
    };
  }

  // 2. Job Description Specification File Uploaded as Candidate Resume Heuristic
  const isJdAsResume = /job\s*description|job\s*opening|key\s*responsibilities|required\s*qualifications|responsibilities:|requirements:|about\s*the\s*role|salary\s*range|how\s*to\s*apply|job\s*requisition/i.test(resumeText) && !/work\s*experience|employment\s*history|professional\s*experience|curriculum\s*vitae|my\s*skills|resume\s*of/i.test(resumeText);

  if (isJdAsResume) {
    return {
      is_valid_resume: false,
      invalid_resume_reason: 'Uploaded document is a Job Description file, not an individual candidate resume/CV.',
      candidate_profile: {
        name: 'Invalid Document (Job Description File)',
        contact: { email: null, phone: null, location: null, linkedin_url: null, portfolio_github_url: null },
        total_years_experience: 0,
        current_or_latest_role: 'N/A',
        current_or_latest_company: null,
        education: [],
        skills: { technical: [], soft: [] },
        certifications: []
      },
      evaluation: {
        overall_score: 1,
        shortlisted: false,
        breakdown: { skills_score: 0, experience_score: 0, education_score: 0, tone_and_relevance_score: 0 },
        justification: 'Invalid Document Type: Uploaded file is a Job Description specification, not an individual candidate resume or CV.',
        ai_summary: 'The uploaded file is a Job Description document, not a candidate resume/CV.',
        strengths: [],
        missing_requirements: ['Valid Individual Candidate Resume/CV document required'],
        recruiter_notes: ['Reject document: Please upload an individual candidate resume or CV file.']
      },
      provider_used: 'Document Type Validator'
    };
  }

  // 3. Academic Lab Sheet / Question Paper / Assignment Rejection Heuristic
  const isLabSheetOrQuestionPaper = /lab\s*sheet|question\s*paper|faculty\s*name:|student\s*name:|reg\.?\s*no\.?:|solve\s*the\s*following|lab\s*manual|worksheet|assignment\s*\d+|school:\s*scope|course\s*syllabus|answer\s*key/i.test(resumeText) && !/work\s*experience|employment\s*history|professional\s*experience|career\s*summary/i.test(resumeText);

  if (isLabSheetOrQuestionPaper) {
    return {
      is_valid_resume: false,
      invalid_resume_reason: 'Uploaded document is an Academic Lab Sheet or Question Paper, not an individual candidate resume/CV.',
      candidate_profile: {
        name: 'Invalid Document (Academic Lab Sheet / Question Paper)',
        contact: { email: null, phone: null, location: null, linkedin_url: null, portfolio_github_url: null },
        total_years_experience: 0,
        current_or_latest_role: 'N/A',
        current_or_latest_company: null,
        education: [],
        skills: { technical: [], soft: [] },
        certifications: []
      },
      evaluation: {
        overall_score: 1,
        shortlisted: false,
        breakdown: { skills_score: 0, experience_score: 0, education_score: 0, tone_and_relevance_score: 0 },
        justification: 'Invalid Document Type: Uploaded file is an Academic Lab Sheet / Question Paper, not an individual candidate resume or CV.',
        ai_summary: 'The uploaded file is a university lab worksheet or question paper, not a candidate resume/CV.',
        strengths: [],
        missing_requirements: ['Valid Individual Candidate Resume/CV document required'],
        recruiter_notes: ['Reject document: Please upload an individual candidate resume or CV file.']
      },
      provider_used: 'Document Type Validator'
    };
  }

  // 3. Truncate Input Texts to prevent 413 Groq Token Limit (8,000 TPM limit) errors
  const safeResumeText = resumeText.length > 8000 ? resumeText.slice(0, 8000) + '\n[Resume text truncated for LLM token limit]' : resumeText;
  const safeJdText = jdText.length > 6000 ? jdText.slice(0, 6000) + '\n[JD text truncated for LLM token limit]' : jdText;

  const groqKey = apiKey?.startsWith('gsk_') ? apiKey : process.env.GROQ_API_KEY;
  const geminiKey = (apiKey?.startsWith('AIza') || apiKey?.startsWith('AQ')) ? apiKey : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const prompt = `Target Role: ${role}\n\n=== JOB DESCRIPTION ===\n${safeJdText}\n\n=== RESUME ===\n${safeResumeText}\n\nReturn JSON only matching the system prompt schema.`;

  let lastError = '';

  // A. IF PROVIDER IS GEMINI OR GEMINI KEY IS PREFERRED
  if (provider === 'gemini') {
    if (geminiKey) {
      try {
        console.log('Running Live Gemini REST API evaluation...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            const parsed = extractJSON(text);
            const validated = Schema.parse(parsed);
            const processed = enforceStrictShortlistCriteria(validated);
            return { ...processed, provider_used: 'Google Gemini AI (gemini-1.5-flash)' };
          }
        } else {
          const errText = await res.text();
          lastError = `Gemini API HTTP ${res.status}: ${errText}`;
        }
      } catch (e: any) {
        lastError = `Gemini API Error: ${e.message}`;
      }
    } else {
      lastError = 'No Google Gemini API key configured.';
    }
  }

  // B. IF PROVIDER IS GROQ (DEFAULT) OR GEMINI FALLBACK TO GROQ
  if (groqKey) {
    try {
      console.log('Running Live Groq Cloud LLM evaluation (qwen/qwen3.6-27b)...');
      const groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
      let content = '';

      try {
        const r = await groq.chat.completions.create({
          model: 'qwen/qwen3.6-27b',
          messages: [{ role: 'system', content: SYSTEM_PROMPT + '\nReturn ONLY valid JSON.' }, { role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2
        });
        content = r.choices[0]?.message?.content || '{}';
      } catch (jsonErr: any) {
        console.warn('Groq json_object mode failed, retrying standard completion mode:', jsonErr.message);
        const r2 = await groq.chat.completions.create({
          model: 'qwen/qwen3.6-27b',
          messages: [{ role: 'system', content: SYSTEM_PROMPT + '\nReturn ONLY valid JSON.' }, { role: 'user', content: prompt }],
          temperature: 0.2
        });
        content = r2.choices[0]?.message?.content || '{}';
      }

      const parsed = extractJSON(content);
      const validated = Schema.parse(parsed);
      const processed = enforceStrictShortlistCriteria(validated);
      return { ...processed, provider_used: 'Groq Cloud AI (Qwen-3.6-27B)' };
    } catch (e: any) {
      console.warn('Groq Live LLM call failed:', e.message);
      lastError = `Groq API Error: ${e.message}`;
    }
  }

  // C. SECONDARY FALLBACK TO GEMINI IF GROQ WAS SELECTED BUT FAILED
  if (geminiKey && provider !== 'gemini') {
    try {
      console.log('Fallback: Running Live Gemini REST API evaluation...');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          const parsed = extractJSON(text);
          const validated = Schema.parse(parsed);
          const processed = enforceStrictShortlistCriteria(validated);
          return { ...processed, provider_used: 'Google Gemini AI (gemini-1.5-flash)' };
        }
      }
    } catch (e: any) {
      lastError = `Gemini API Error: ${e.message}`;
    }
  }

  // STRICT RULE: THROW EXPLICIT ERROR — NO MOCK / DEFAULT FALLBACK ALLOWED!
  throw new Error(`Live AI Evaluation Failed: ${lastError || 'Unable to reach Groq or Gemini AI endpoints. Please verify API key.'}`);
}

// ─── PDF Text Extraction ────────────────────────────────────────────────────
async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    try {
      const { default: pdfParse } = await import('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();
    } catch (e) {
      return buffer.toString('utf-8');
    }
  }
  return buffer.toString('utf-8').replace(/\r\n/g, '\n').trim();
}

// ─── Password Hashing ───────────────────────────────────────────────────────
function hashPwd(pwd: string): string {
  return crypto.pbkdf2Sync(pwd, 'resumind_ats_salt_2026', 1000, 64, 'sha512').toString('hex');
}

// ─── Express App ────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins for API endpoints
  },
  credentials: true
}));

// Body parser — skip for multipart so Multer can handle it
app.use((req: Request, res: Response, next: NextFunction) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) return next();
  express.json({ limit: '10mb' })(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Invalid JSON body' });
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  });
});

// DB middleware (non-blocking)
app.use((_req: Request, _res: Response, next: NextFunction) => {
  connectDB().catch(() => {});
  next();
});

// ─── File Upload ────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const resumeUpload = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'job_description_file', maxCount: 1 }
]);

// ─── Routes (Support BOTH /path AND /api/path for Vercel Rewrites) ───────────

// Health check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({ status: 'ok', db: dbState, timestamp: new Date().toISOString() });
});

// POST /screen or /api/screen — Resume analysis
app.post(['/screen', '/api/screen'], resumeUpload, async (req: Request, res: Response) => {
  try {
    const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
    const resumeFile = files?.['resume']?.[0];
    const jdFile = files?.['job_description_file']?.[0];
    const { job_description, target_role, target_company, provider, raw_resume_text, api_key } = req.body;

    // Extract resume text
    let resumeText = '';
    let resumeFilename = 'resume.txt';
    if (resumeFile) {
      resumeFilename = resumeFile.originalname;
      resumeText = await extractText(resumeFile.buffer, resumeFile.mimetype, resumeFile.originalname);
    } else if (raw_resume_text?.trim()) {
      resumeFilename = 'pasted_resume.txt';
      resumeText = raw_resume_text.trim();
    } else {
      return res.status(400).json({ error: 'Please provide a resume file or paste resume text.' });
    }

    // Extract JD text
    let jdText = '';
    if (jdFile) {
      jdText = await extractText(jdFile.buffer, jdFile.mimetype, jdFile.originalname);
    } else if (job_description?.trim()) {
      jdText = job_description.trim();
    } else {
      return res.status(400).json({ error: 'Please provide a job description.' });
    }

    if (resumeText.length < 15) return res.status(400).json({ error: 'Resume text too short to analyze.' });
    if (jdText.length < 15) return res.status(400).json({ error: 'Job description too short to analyze.' });

    // Run AI evaluation
    const analysis = await runAI(resumeText, jdText, target_role || 'Target Role', provider || 'auto', api_key);

    const candidateData: any = {
      _id: Date.now().toString(),
      filename: resumeFilename,
      raw_text: resumeText,
      target_role: target_role || 'Target Role',
      target_company: target_company || 'Target Company',
      job_description: jdText,
      candidate_profile: analysis.candidate_profile,
      evaluation: analysis.evaluation,
      provider_used: analysis.provider_used
    };

    // Save to DB (Awaited for guaranteed MongoDB Atlas persistence)
    try {
      await connectDB();
      if (mongoose.connection.readyState === 1) {
        const doc = new Candidate(candidateData);
        const saved = await doc.save();
        if (saved?._id) {
          candidateData._id = String(saved._id);
          candidateData.saved_to_db = true;
        }
        console.log(`✅ Candidate record saved to MongoDB Atlas! ID: ${candidateData._id}`);
      }
    } catch (e: any) {
      console.warn('DB save note:', e.message);
    }

    return res.status(201).json({ message: 'Resume compared successfully', candidate: candidateData });
  } catch (err: any) {
    console.error('Screen error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /candidates or /api/candidates
app.get(['/candidates', '/api/candidates'], async (_req: Request, res: Response) => {
  try {
    if (dbState !== 'connected') return res.json([]);
    const docs = await Candidate.find().sort({ createdAt: -1 }).lean();
    return res.json(docs);
  } catch { return res.json([]); }
});

// DELETE /candidates/:id or /api/candidates/:id
app.delete(['/candidates/:id', '/api/candidates/:id'], async (req: Request, res: Response) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Candidate deleted' });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// GET /jobs or /api/jobs
app.get(['/jobs', '/api/jobs'], async (_req: Request, res: Response) => {
  try {
    if (dbState !== 'connected') return res.json([]);
    const docs = await Job.find().sort({ createdAt: -1 }).lean();
    return res.json(docs);
  } catch { return res.json([]); }
});

// POST /jobs or /api/jobs
app.post(['/jobs', '/api/jobs'], async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description required.' });
    const job = new Job(req.body);
    const saved = await job.save();
    return res.status(201).json(saved);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// POST /auth/signup or /api/auth/signup
app.post(['/auth/signup', '/api/auth/signup'], async (req: Request, res: Response) => {
  try {
    const { username, email, password, name } = req.body;
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (dbState !== 'connected') {
      return res.status(201).json({
        message: 'Account created successfully',
        user: { id: Date.now().toString(), username, email, name, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` }
      });
    }
    const existing = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
    if (existing) return res.status(400).json({ error: 'Username or email already exists.' });
    const user = new User({
      username: username.toLowerCase(), email: email.toLowerCase(),
      password: hashPwd(password), name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });
    const saved = await user.save();
    return res.status(201).json({
      message: 'Account created successfully',
      user: { id: saved._id, username: saved.username, email: saved.email, name: saved.name, avatar: saved.avatar }
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// POST /auth/login or /api/auth/login
app.post(['/auth/login', '/api/auth/login'], async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Username/email and password required.' });
    if (dbState !== 'connected') return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
    const user = await User.findOne({ $or: [{ username: usernameOrEmail.toLowerCase() }, { email: usernameOrEmail.toLowerCase() }] });
    if (!user || (user as any).password !== hashPwd(password)) return res.status(401).json({ error: 'Invalid credentials.' });
    return res.json({
      message: 'Signed in successfully',
      user: { id: (user as any)._id, username: (user as any).username, email: (user as any).email, name: (user as any).name, avatar: (user as any).avatar }
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
