export interface ContactInfo {
  email: string | null;
  phone: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  portfolio_github_url?: string | null;
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
  current_or_latest_role?: string | null;
  current_or_latest_company?: string | null;
  education: EducationEntry[];
  skills: SkillsProfile;
  certifications?: string[];
}

export interface ScoreBreakdown {
  skills_score: number;
  experience_score: number;
  education_score: number;
  tone_and_relevance_score: number;
}

export interface EvaluationResult {
  overall_score: number;
  shortlisted: boolean;
  breakdown: ScoreBreakdown;
  justification: string;
  ai_summary?: string;
  strengths: string[];
  missing_requirements: string[];
  recruiter_notes: string[];
}

export interface Candidate {
  _id: string;
  filename: string;
  file_type?: string;
  raw_text: string;
  target_role: string;
  target_company?: string;
  job_description: string;
  candidate_profile: CandidateProfile;
  evaluation: EvaluationResult;
  provider_used: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JobDescription {
  _id?: string;
  title: string;
  company?: string;
  department?: string;
  description: string;
  required_skills?: string[];
  createdAt?: string;
}
