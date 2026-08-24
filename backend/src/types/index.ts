export interface ContactInfo {
  email: string | null;
  phone: string | null;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string | null;
}

export interface SkillsProfile {
  technical: string[];
  soft: string[];
}

export interface CandidateProfile {
  name: string;
  contact: ContactInfo;
  total_years_experience: number | string;
  education: EducationEntry[];
  skills: SkillsProfile;
}

export interface ScoreBreakdown {
  skills_score: number; // 0-100
  experience_score: number; // 0-100
  education_score: number; // 0-100
  tone_and_relevance_score: number; // 0-100
}

export interface EvaluationResult {
  overall_score: number; // 1-10 integer
  shortlisted: boolean; // true if overall_score >= 7
  breakdown: ScoreBreakdown;
  justification: string;
  strengths: string[];
  missing_requirements: string[];
  recruiter_notes: string[];
}

export interface CandidateDocument {
  _id?: string;
  filename: string;
  file_type?: string;
  raw_text: string;
  target_role: string;
  job_description: string;
  is_valid_resume?: boolean;
  invalid_resume_reason?: string | null;
  candidate_profile: CandidateProfile;
  evaluation: EvaluationResult;
  provider_used: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobDocument {
  _id?: string;
  title: string;
  company?: string;
  department?: string;
  description: string;
  required_skills?: string[];
  createdAt?: string;
}

export interface ScreeningRequest {
  job_description: string;
  target_role?: string;
  provider?: 'gemini' | 'openai' | 'mock';
}
