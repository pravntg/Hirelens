import { Candidate } from '../types';

export function safeString(val: any, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (typeof val.message === 'string') return val.message;
    if (typeof val.text === 'string') return val.text;
    if (typeof val.name === 'string') return val.name;
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return String(val);
}

export function sanitizeCandidate(c: any): Candidate {
  if (!c || typeof c !== 'object') {
    return {
      _id: safeString(Date.now()),
      filename: 'resume.txt',
      raw_text: '',
      target_role: 'Target Role',
      target_company: '',
      job_description: '',
      candidate_profile: {
        name: 'Unknown Candidate',
        contact: { email: null, phone: null, location: null, linkedin_url: null, portfolio_github_url: null },
        total_years_experience: 0,
        education: [],
        skills: { technical: [], soft: [] },
        certifications: []
      },
      evaluation: {
        overall_score: 7,
        shortlisted: false,
        breakdown: { skills_score: 70, experience_score: 70, education_score: 70, tone_and_relevance_score: 70 },
        justification: '',
        ai_summary: '',
        strengths: [],
        missing_requirements: [],
        recruiter_notes: []
      },
      provider_used: 'AI Screener',
      createdAt: new Date().toISOString()
    };
  }

  const profile = c.candidate_profile || {};
  const evalObj = c.evaluation || {};
  const breakdown = evalObj.breakdown || {};
  const contact = profile.contact || {};

  const cleanArray = (arr: any): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item: any) => safeString(item)).filter(Boolean);
  };

  const cleanEducation = (arr: any) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((e: any) => ({
      degree: safeString(e?.degree, 'Degree Unspecified'),
      institution: safeString(e?.institution, 'Institution Unspecified'),
      year: e?.year ? safeString(e.year) : null
    }));
  };

  return {
    _id: safeString(c._id, String(Date.now())),
    filename: safeString(c.filename, 'resume.txt'),
    file_type: safeString(c.file_type, 'pdf'),
    raw_text: safeString(c.raw_text, ''),
    target_role: safeString(c.target_role, 'Software Role'),
    target_company: safeString(c.target_company, ''),
    job_description: safeString(c.job_description, ''),
    provider_used: safeString(c.provider_used, 'AI Screener'),
    createdAt: safeString(c.createdAt, new Date().toISOString()),
    candidate_profile: {
      name: safeString(profile.name, 'Unnamed Candidate'),
      contact: {
        email: contact.email ? safeString(contact.email) : null,
        phone: contact.phone ? safeString(contact.phone) : null,
        location: contact.location ? safeString(contact.location) : null,
        linkedin_url: contact.linkedin_url ? safeString(contact.linkedin_url) : null,
        portfolio_github_url: contact.portfolio_github_url ? safeString(contact.portfolio_github_url) : null,
      },
      total_years_experience: typeof profile.total_years_experience === 'number' ? profile.total_years_experience : safeString(profile.total_years_experience, '0'),
      current_or_latest_role: profile.current_or_latest_role ? safeString(profile.current_or_latest_role) : null,
      current_or_latest_company: profile.current_or_latest_company ? safeString(profile.current_or_latest_company) : null,
      education: cleanEducation(profile.education),
      skills: {
        technical: cleanArray(profile?.skills?.technical),
        soft: cleanArray(profile?.skills?.soft),
      },
      certifications: cleanArray(profile.certifications)
    },
    evaluation: {
      overall_score: typeof evalObj.overall_score === 'number' ? evalObj.overall_score : (Number(evalObj.overall_score) || 7),
      shortlisted: Boolean(evalObj.shortlisted),
      breakdown: {
        skills_score: typeof breakdown.skills_score === 'number' ? breakdown.skills_score : 70,
        experience_score: typeof breakdown.experience_score === 'number' ? breakdown.experience_score : 70,
        education_score: typeof breakdown.education_score === 'number' ? breakdown.education_score : 70,
        tone_and_relevance_score: typeof breakdown.tone_and_relevance_score === 'number' ? breakdown.tone_and_relevance_score : 70,
      },
      justification: safeString(evalObj.justification, 'Evaluation completed.'),
      ai_summary: safeString(evalObj.ai_summary, ''),
      strengths: cleanArray(evalObj.strengths),
      missing_requirements: cleanArray(evalObj.missing_requirements),
      recruiter_notes: cleanArray(evalObj.recruiter_notes)
    }
  };
}
