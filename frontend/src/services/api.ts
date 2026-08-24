import axios from 'axios';
import { Candidate, JobDescription } from '../types';
import { sanitizeCandidate } from '../utils/sanitize';

// Vite replaces import.meta.env.VITE_API_URL at build time
// GitHub Pages build passes: VITE_API_URL=https://resumind-lake-two.vercel.app/api
// Vercel build uses: /api (same-domain proxy)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function screenResume(
  resumeFile: File | null,
  jobDescriptionText: string,
  targetRole: string,
  provider: string,
  rawResumeText?: string,
  apiKey?: string,
  jdFile?: File | null,
  targetCompany?: string
): Promise<{ message: string; candidate: Candidate }> {
  const formData = new FormData();
  if (resumeFile) formData.append('resume', resumeFile);
  if (jdFile) formData.append('job_description_file', jdFile);
  formData.append('job_description', jobDescriptionText);
  formData.append('target_role', targetRole);
  if (targetCompany) formData.append('target_company', targetCompany);
  formData.append('provider', provider);
  if (rawResumeText) formData.append('raw_resume_text', rawResumeText);
  if (apiKey) formData.append('api_key', apiKey);

  const response = await axios.post(`${API_BASE}/screen`, formData);
  const rawCandidate = response.data?.candidate;
  const sanitized = sanitizeCandidate(rawCandidate);
  return { ...response.data, candidate: sanitized };
}

export async function getCandidates(filters?: { status?: string; minScore?: number; search?: string }): Promise<Candidate[]> {
  const params: any = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.minScore) params.minScore = filters.minScore;
  if (filters?.search) params.search = filters.search;
  const response = await axios.get(`${API_BASE}/candidates`, { params });
  const rawList = Array.isArray(response.data) ? response.data : [];
  return rawList.map((c: any) => sanitizeCandidate(c));
}

export async function getCandidateById(id: string): Promise<Candidate> {
  const response = await axios.get(`${API_BASE}/candidates/${id}`);
  return sanitizeCandidate(response.data);
}

export async function deleteCandidate(id: string): Promise<{ message: string }> {
  const response = await axios.delete(`${API_BASE}/candidates/${id}`);
  return response.data;
}

export async function getJobs(): Promise<JobDescription[]> {
  const response = await axios.get(`${API_BASE}/jobs`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function createJob(job: Partial<JobDescription>): Promise<JobDescription> {
  const response = await axios.post(`${API_BASE}/jobs`, job);
  return response.data;
}
