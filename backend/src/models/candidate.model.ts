import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateDocument extends Document {
  filename: string;
  file_type?: string;
  raw_text: string;
  target_role: string;
  target_company?: string;
  job_description: string;
  provider_used: string;
  candidate_profile: {
    name: string;
    contact: { 
      email: string | null; 
      phone: string | null;
      location?: string | null;
      linkedin_url?: string | null;
      portfolio_github_url?: string | null;
    };
    total_years_experience: number | string;
    current_or_latest_role?: string | null;
    current_or_latest_company?: string | null;
    education: Array<{ degree: string; institution: string; year: string | null }>;
    skills: { technical: string[]; soft: string[] };
    certifications?: string[];
  };
  evaluation: {
    overall_score: number;
    shortlisted: boolean;
    breakdown: {
      skills_score: number;
      experience_score: number;
      education_score: number;
      tone_and_relevance_score: number;
    };
    justification: string;
    ai_summary?: string;
    strengths: string[];
    missing_requirements: string[];
    recruiter_notes: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const CandidateSchema: Schema = new Schema(
  {
    filename: { type: String, required: true },
    file_type: { type: String, default: 'pdf' },
    raw_text: { type: String, required: true },
    target_role: { type: String, default: 'Software Professional' },
    target_company: { type: String, default: 'Target Company' },
    job_description: { type: String, required: true },
    provider_used: { type: String, default: 'AI Screener' },
    candidate_profile: {
      name: { type: String, default: 'Unknown Candidate' },
      contact: {
        email: { type: String, default: null },
        phone: { type: String, default: null },
        location: { type: String, default: null },
        linkedin_url: { type: String, default: null },
        portfolio_github_url: { type: String, default: null }
      },
      total_years_experience: { type: Schema.Types.Mixed, default: 'N/A' },
      current_or_latest_role: { type: String, default: null },
      current_or_latest_company: { type: String, default: null },
      education: [
        {
          degree: { type: String },
          institution: { type: String },
          year: { type: String, default: null }
        }
      ],
      skills: {
        technical: [{ type: String }],
        soft: [{ type: String }]
      },
      certifications: [{ type: String }]
    },
    evaluation: {
      overall_score: { type: Number, required: true, min: 1, max: 10 },
      shortlisted: { type: Boolean, required: true, default: false },
      breakdown: {
        skills_score: { type: Number, default: 0 },
        experience_score: { type: Number, default: 0 },
        education_score: { type: Number, default: 0 },
        tone_and_relevance_score: { type: Number, default: 0 }
      },
      justification: { type: String, required: true },
      ai_summary: { type: String, default: '' },
      strengths: [{ type: String }],
      missing_requirements: [{ type: String }],
      recruiter_notes: [{ type: String }]
    }
  },
  { timestamps: true }
);

export const CandidateModel = mongoose.model<ICandidateDocument>('Candidate', CandidateSchema);
