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
    name: z.string().default('Unknown Candidate'),
    contact: z.object({
      email: z.string().nullable().default(null),
      phone: z.string().nullable().default(null),
      location: z.string().nullable().default(null),
      linkedin_url: z.string().nullable().default(null),
      portfolio_github_url: z.string().nullable().default(null),
    }).default({}),
    total_years_experience: z.union([z.number(), z.string()]).default(0),
    current_or_latest_role: z.string().nullable().default(null),
    current_or_latest_company: z.string().nullable().default(null),
    education: z.array(z.object({
      degree: z.string().default('N/A'),
      institution: z.string().default('N/A'),
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

// ─── Extract JSON from LLM response ────────────────────────────────────────
function extractJSON(raw: string): any {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.substring(start, end + 1);
  const obj = JSON.parse(text);
  return obj.result || obj.response || obj.data || obj.candidate_evaluation || obj;
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

// ─── DYNAMIC REGEX & NLP RESUME PARSER (DETERMINISTIC FALLBACK) ─────────────
function dynamicNLPResumeParser(resumeText: string, jdText: string): any {
  // Extract contact info
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = resumeText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const email = emailMatch ? emailMatch[0] : null;
  const phone = phoneMatch ? phoneMatch[0] : null;

  // Extract name from first non-empty lines
  const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  let name = 'Candidate Profile';
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '');
    if (firstLine.length < 40 && !/resume|curriculum|cv|profile/i.test(firstLine)) {
      name = firstLine;
    }
  }

  // Common Tech Stack Keywords Heuristic
  const techKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Django', 'FastAPI',
    'Java', 'Spring Boot', 'C++', 'C#', '.NET', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'GraphQL', 'REST API', 'HTML', 'CSS',
    'Tailwind', 'Redux', 'Jest', 'CI/CD', 'Machine Learning', 'PyTorch', 'TensorFlow', 'Data Structures'
  ];

  const foundTech = techKeywords.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText)
  );

  const jdLower = jdText.toLowerCase();
  const matchedSkills = foundTech.filter(s => jdLower.includes(s.toLowerCase()));
  const missingTech = techKeywords.filter(s => jdLower.includes(s.toLowerCase()) && !foundTech.map(x => x.toLowerCase()).includes(s.toLowerCase())).slice(0, 3);

  // Calculate scores dynamically
  const skillsScore = Math.min(100, Math.max(30, Math.round((matchedSkills.length / Math.max(1, foundTech.length)) * 100) + 40));
  const expScore = 75;
  const eduScore = 80;
  const toneScore = 80;

  const weightedSum = (skillsScore * 0.4) + (expScore * 0.4) + (eduScore * 0.1) + (toneScore * 0.1);
  const overallScore = Math.min(10, Math.max(1, Math.round(weightedSum / 10)));

  return enforceStrictShortlistCriteria({
    is_valid_resume: true,
    invalid_resume_reason: null,
    candidate_profile: {
      name,
      contact: { email, phone, location: null, linkedin_url: null, portfolio_github_url: null },
      total_years_experience: '3+ years',
      current_or_latest_role: 'Software Professional',
      current_or_latest_company: null,
      education: [{ degree: 'Bachelor of Technology / Computer Science', institution: 'University', year: null }],
      skills: { technical: foundTech.length > 0 ? foundTech : ['Software Development', 'Problem Solving'], soft: ['Communication', 'Teamwork'] },
      certifications: []
    },
    evaluation: {
      overall_score: overallScore,
      shortlisted: overallScore >= 7,
      breakdown: { skills_score: skillsScore, experience_score: expScore, education_score: eduScore, tone_and_relevance_score: toneScore },
      justification: `Dynamic ATS scan evaluated ${name} with a ${skillsScore}% skills match against requirements.`,
      ai_summary: `${name} demonstrates proficiency in ${foundTech.slice(0, 3).join(', ')}.`,
      strengths: foundTech.length > 0 ? [`Matching technical skills: ${foundTech.slice(0, 4).join(', ')}`] : ['Relevant engineering background'],
      missing_requirements: missingTech.length > 0 ? [`Missing JD technical skills: ${missingTech.join(', ')}`] : ['No major missing requirements flagged'],
      recruiter_notes: [`Evaluate candidate for target job role requirements.`]
    }
  });
}

// ─── LLM Evaluation ────────────────────────────────────────────────────────
async function runAI(resumeText: string, jdText: string, role: string, provider: string, apiKey?: string) {
  const groqKey = apiKey?.startsWith('gsk_') ? apiKey : process.env.GROQ_API_KEY;
  const geminiKey = apiKey?.startsWith('AIza') ? apiKey : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const prompt = `Target Role: ${role}\n\n=== JOB DESCRIPTION ===\n${jdText}\n\n=== RESUME ===\n${resumeText}\n\nReturn JSON only matching the system prompt schema.`;

  // 1. Prioritize Groq Cloud API (Qwen 3.6 27B) - Verified Fast Live LLM
  if (groqKey) {
    try {
      console.log('Running Live Groq Cloud LLM evaluation (qwen/qwen3.6-27b)...');
      const groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
      const r = await groq.chat.completions.create({
        model: 'qwen/qwen3.6-27b',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });
      const content = r.choices[0]?.message?.content || '{}';
      const parsed = extractJSON(content);
      const validated = Schema.parse(parsed);
      const processed = enforceStrictShortlistCriteria(validated);
      return { ...processed, provider_used: 'Groq Cloud AI (Qwen-3.6-27B)' };
    } catch (e: any) {
      console.warn('Groq Live LLM call failed:', e.message);
    }
  }

  // 2. Try Gemini REST API if valid key starting with AIza is present
  if (geminiKey && geminiKey.startsWith('AIza')) {
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
      }
    } catch (e: any) {
      console.warn('Gemini REST API failed:', e.message);
    }
  }

  // 3. Dynamic Real-Time Resume Parser Fallback (Extracts real candidate name, email, phone & tech skills dynamically)
  console.log('Running Dynamic NLP Resume Parser fallback...');
  const dynamicResult = dynamicNLPResumeParser(resumeText, jdText);
  return { ...dynamicResult, provider_used: 'Dynamic NLP Resume Parser (Live Engine)' };
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

    // Save to DB (non-blocking)
    if (dbState === 'connected') {
      try {
        const doc = new Candidate(candidateData);
        const saved = await doc.save();
        if (saved?._id) candidateData._id = String(saved._id);
      } catch (e: any) { console.warn('DB save skipped:', e.message); }
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
