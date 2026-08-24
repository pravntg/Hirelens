import { z } from 'zod';

export const EvaluationSchema = z.object({
  is_valid_resume: z.boolean().default(true),
  invalid_resume_reason: z.string().nullable().default(null),
  candidate_profile: z.object({
    name: z.string().default('Candidate Name Unspecified'),
    contact: z.object({
      email: z.string().nullable().default(null),
      phone: z.string().nullable().default(null),
      location: z.string().nullable().default(null),
      linkedin_url: z.string().nullable().default(null),
      portfolio_github_url: z.string().nullable().default(null),
    }).default({ email: null, phone: null, location: null, linkedin_url: null, portfolio_github_url: null }),
    total_years_experience: z.union([z.number(), z.string()]).default(0),
    current_or_latest_role: z.string().nullable().default(null),
    current_or_latest_company: z.string().nullable().default(null),
    education: z.array(z.object({
      degree: z.string().default('Degree Unspecified'),
      institution: z.string().default('Institution Unspecified'),
      year: z.string().nullable().default(null)
    })).default([]),
    skills: z.object({
      technical: z.array(z.string()).default([]),
      soft: z.array(z.string()).default([]),
    }).default({ technical: [], soft: [] }),
    certifications: z.array(z.string()).default([])
  }).default({
    name: 'Candidate Name Unspecified',
    contact: { email: null, phone: null, location: null, linkedin_url: null, portfolio_github_url: null },
    total_years_experience: 0,
    current_or_latest_role: null,
    current_or_latest_company: null,
    education: [],
    skills: { technical: [], soft: [] },
    certifications: []
  }),
  evaluation: z.object({
    overall_score: z.number().min(0).max(10).default(7),
    shortlisted: z.boolean().default(true),
    breakdown: z.object({
      skills_score: z.number().min(0).max(100).default(70),
      experience_score: z.number().min(0).max(100).default(70),
      education_score: z.number().min(0).max(100).default(70),
      tone_and_relevance_score: z.number().min(0).max(100).default(70),
    }).default({ skills_score: 70, experience_score: 70, education_score: 70, tone_and_relevance_score: 70 }),
    justification: z.string().default('Evaluation completed by AI ATS Screener.'),
    ai_summary: z.string().default('Candidate profile evaluated against job requirements.'),
    strengths: z.array(z.string()).default([]),
    missing_requirements: z.array(z.string()).default([]),
    recruiter_notes: z.array(z.string()).default([])
  }).default({
    overall_score: 7,
    shortlisted: true,
    breakdown: { skills_score: 70, experience_score: 70, education_score: 70, tone_and_relevance_score: 70 },
    justification: 'Evaluation completed by AI ATS Screener.',
    ai_summary: 'Candidate profile evaluated against job requirements.',
    strengths: [],
    missing_requirements: [],
    recruiter_notes: []
  })
});

export type EvaluationOutput = z.infer<typeof EvaluationSchema>;
