import { Router, Request, Response } from 'express';
import multer from 'multer';
import { extractTextFromFile } from '../services/parser.service.js';
import { evaluateResumeWithLLM } from '../services/llm.service.js';
import { CandidateModel } from '../models/candidate.model.js';
import { JobModel } from '../models/job.model.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const cpUpload = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'job_description_file', maxCount: 1 }
]);

export const router = Router();

// POST /api/screen - Ingest Resume + Job Description, run LLM comparison, save candidate
router.post('/screen', cpUpload, async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const resumeFile = files?.['resume']?.[0];
    const jdFile = files?.['job_description_file']?.[0];

    const { job_description, target_role, target_company, provider, raw_resume_text, api_key } = req.body;

    // 1. Extract Resume Text
    let resumeText = '';
    let resumeFilename = 'resume.txt';

    if (resumeFile) {
      resumeFilename = resumeFile.originalname;
      resumeText = await extractTextFromFile(resumeFile.buffer, resumeFile.mimetype, resumeFile.originalname);
    } else if (raw_resume_text && raw_resume_text.trim().length > 0) {
      resumeFilename = 'pasted_resume.txt';
      resumeText = raw_resume_text.trim();
    } else {
      res.status(400).json({ error: 'Please provide candidate resume text or upload a resume file.' });
      return;
    }

    // 2. Extract Job Description Text
    let jdText = '';
    if (jdFile) {
      jdText = await extractTextFromFile(jdFile.buffer, jdFile.mimetype, jdFile.originalname);
    } else if (job_description && job_description.trim().length > 0) {
      jdText = job_description.trim();
    } else {
      res.status(400).json({ error: 'Please provide job description text or upload a job description file.' });
      return;
    }

    if (!resumeText || resumeText.length < 15) {
      res.status(400).json({ error: 'Could not extract sufficient text from the provided resume.' });
      return;
    }

    if (!jdText || jdText.length < 15) {
      res.status(400).json({ error: 'Could not extract sufficient text from the job description.' });
      return;
    }

    // 3. Run semantic LLM screening automatically via Gemini / OpenAI
    const analysis = await evaluateResumeWithLLM(
      resumeText,
      jdText,
      target_role || 'Target Role',
      provider || 'auto',
      api_key
    );

    // 4. Create candidate document
    const candidateData: any = {
      _id: new Date().getTime().toString(),
      filename: resumeFilename,
      raw_text: resumeText,
      target_role: target_role || 'Target Role',
      target_company: target_company || 'Target Company',
      job_description: jdText,
      candidate_profile: analysis.candidate_profile,
      evaluation: analysis.evaluation,
      provider_used: analysis.provider_used
    };

    // Save to MongoDB if available (non-blocking fallback)
    try {
      const candidateDoc = new CandidateModel(candidateData);
      const savedDoc = await candidateDoc.save();
      if (savedDoc && savedDoc._id) {
        candidateData._id = savedDoc._id;
      }
    } catch (dbErr: any) {
      console.warn('MongoDB save note (proceeding with calculated result):', dbErr.message);
    }

    res.status(201).json({
      message: 'Resume & Job Description compared successfully',
      candidate: candidateData
    });
  } catch (err: any) {
    console.error('Error screening resume:', err);
    res.status(500).json({ error: err.message || 'Internal server error during screening.', details: err.message });
  }
});

// GET /api/candidates - Get all candidates with filtering
router.get('/candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, minScore, search } = req.query;
    const filter: any = {};

    if (status === 'shortlisted') {
      filter['evaluation.shortlisted'] = true;
    } else if (status === 'under_review') {
      filter['evaluation.shortlisted'] = false;
    }

    if (minScore) {
      const scoreNum = Number(minScore);
      if (!isNaN(scoreNum)) {
        filter['evaluation.overall_score'] = { $gte: scoreNum };
      }
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      filter['$or'] = [
        { 'candidate_profile.name': searchRegex },
        { 'target_role': searchRegex },
        { 'target_company': searchRegex },
        { 'filename': searchRegex },
        { 'candidate_profile.skills.technical': searchRegex }
      ];
    }

    const candidates = await CandidateModel.find(filter).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err: any) {
    console.error('Error fetching candidates:', err);
    res.json([]);
  }
});

// GET /api/candidates/:id - Get candidate deep-dive details
router.get('/candidates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const candidate = await CandidateModel.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found.' });
      return;
    }
    res.json(candidate);
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching candidate details.', details: err.message });
  }
});

// DELETE /api/candidates/:id - Delete candidate record
router.delete('/candidates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CandidateModel.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Candidate not found.' });
      return;
    }
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error deleting candidate.', details: err.message });
  }
});

// GET /api/jobs - List saved Job Descriptions
router.get('/jobs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await JobModel.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err: any) {
    res.json([]);
  }
});

// POST /api/jobs - Save a new target JD
router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, company, department, description, required_skills } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required.' });
      return;
    }
    const job = new JobModel({ title, company, department, description, required_skills });
    const saved = await job.save();
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: 'Error creating job.', details: err.message });
  }
});
