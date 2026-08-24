import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Check, AlertCircle, Loader2, BookOpen, ArrowRight, Zap, Building2, Briefcase, Cpu } from 'lucide-react';
import { screenResume } from '../services/api';
import { Candidate } from '../types';
import { safeString } from '../utils/sanitize';

interface UploadSectionProps {
  onScreenSuccess: (newCandidate: Candidate) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onScreenSuccess }) => {
  // Candidate Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeInputMode, setResumeInputMode] = useState<'file' | 'text'>('file');
  const [rawResumeText, setRawResumeText] = useState('');

  // Job Description state
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdInputMode, setJdInputMode] = useState<'file' | 'text'>('file');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');

  // AI Provider Choice state
  const [provider, setProvider] = useState<'gemini' | 'groq'>('groq');

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setResumeInputMode('file');
      setError(null);
    }
  };

  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
      setJdInputMode('file');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasResumeFile = resumeInputMode === 'file' && resumeFile !== null;
    const hasResumeText = rawResumeText.trim().length > 10;
    const hasJdFile = jdInputMode === 'file' && jdFile !== null;
    const hasJdText = jobDescriptionText.trim().length > 10;

    if (!hasResumeFile && !hasResumeText) {
      setError('Please attach a candidate Resume PDF/TXT file OR paste candidate resume text.');
      return;
    }

    if (!hasJdFile && !hasJdText) {
      setError('Please attach a Job Description PDF/TXT file OR paste job description text.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('Parsing resume & job description files...');

    try {
      setTimeout(() => setLoadingStage(`Sending to ${provider === 'gemini' ? 'Google Gemini' : 'Groq Cloud'} AI Engine...`), 1200);
      setTimeout(() => setLoadingStage('Computing match score & generating recruiter report...'), 2400);

      const res = await screenResume(
        hasResumeFile ? resumeFile : null,
        hasJdText ? jobDescriptionText : '',
        targetRole.trim() || 'Target Position',
        provider,
        hasResumeText ? rawResumeText : undefined,
        undefined,
        hasJdFile ? jdFile : null,
        targetCompany.trim() || 'Target Company'
      );

      onScreenSuccess(res.candidate);
    } catch (err: any) {
      console.error(err);
      const rawErr = err.response?.data?.error;
      const errMsg = typeof rawErr === 'string'
        ? rawErr
        : (rawErr?.message || err.message || 'Comparison request failed. Please check backend connection.');
      setError(safeString(errMsg));
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Hero Header with Warm Orange Glow */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#FFEDD5] border border-[#FB923C]/40 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#C2410C] shadow-sm">
          <Zap className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Automated Live AI Resume Matching</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[#9A3412] tracking-tight">
          Compare Candidate Resume & Job Description
        </h1>

        <p className="text-sm text-[#C2410C] font-medium">
          Upload or paste candidate resume & job description. Extract structured JSON profiles, compute ATS match scores with Gemini or Groq AI, and export to Excel.
        </p>
      </div>

      {/* Main Crisp White Card (#FFFFFF) */}
      <div className="bg-white border border-[#FFEDD5] rounded-3xl p-6 sm:p-10 shadow-xl shadow-[#F97316]/5 max-w-5xl mx-auto">
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* AI MODEL SELECTOR DROPDOWN */}
          <div className="bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 border border-[#FB923C]/30 flex items-center justify-center text-[#F97316]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#9A3412]">Select Live AI Engine</p>
                <p className="text-[11px] text-[#C2410C]">Choose between Google Gemini or Groq Cloud AI</p>
              </div>
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="bg-white border border-[#FB923C]/40 rounded-xl px-4 py-2.5 text-xs text-[#9A3412] font-black focus:outline-none focus:border-[#F97316] cursor-pointer w-full sm:w-auto shadow-sm"
            >
              <option value="groq">Groq Cloud AI (Qwen-3.6-27B Live LLM)</option>
              <option value="gemini">Google Gemini AI</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* BOX 1: CANDIDATE RESUME */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#9A3412] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F97316]" />
                  1. Candidate Resume
                </label>
                
                <div className="flex bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('file')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      resumeInputMode === 'file' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('text')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      resumeInputMode === 'text' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {resumeInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[250px] cursor-pointer ${
                  resumeFile
                    ? 'border-emerald-500/50 bg-emerald-50 shadow-sm'
                    : 'border-[#FFEDD5] hover:border-[#F97316] bg-[#FFF8F5] hover:bg-[#FFF1EC]'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleResumeFileChange}
                    className="hidden"
                    id="resume-file-input"
                  />
                  <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                      resumeFile 
                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-300' 
                        : 'bg-[#F97316]/15 text-[#F97316] border border-[#FB923C]/30'
                    }`}>
                      {resumeFile ? <Check className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                    </div>
                    {resumeFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-700">{resumeFile.name}</p>
                        <p className="text-[11px] text-[#C2410C] mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-2 text-[11px] text-[#F97316] hover:underline font-semibold">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-[#9A3412]">Upload Candidate Resume (PDF / TXT)</p>
                        <p className="text-[11px] text-[#C2410C] mt-1">Drag and drop file here or click to browse</p>
                        <span className="inline-block mt-3 bg-[#FFEDD5] hover:bg-[#F97316] text-[#C2410C] hover:text-white border border-[#FB923C]/30 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                          Select Resume File
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <textarea
                  value={rawResumeText}
                  onChange={(e) => setRawResumeText(e.target.value)}
                  placeholder="Paste candidate resume plain text here..."
                  rows={9}
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-3xl p-4 text-xs font-mono text-[#9A3412] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all placeholder:text-[#C2410C]/60 resize-none"
                />
              )}
            </div>

            {/* BOX 2: JOB DESCRIPTION & SEPARATED ROLE / COMPANY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#9A3412] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#F97316]" />
                  2. Target Job Description (JD)
                </label>
                
                <div className="flex bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJdInputMode('file')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      jdInputMode === 'file' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdInputMode('text')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      jdInputMode === 'text' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {/* Separated Role Title & Company Name inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[#C2410C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Job Role / Title (e.g. Full Stack Developer)"
                    className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#9A3412] font-bold focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-[#C2410C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="Company Name (e.g. Google / Microsoft)"
                    className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#9A3412] font-bold focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              {jdInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[180px] cursor-pointer ${
                  jdFile
                    ? 'border-emerald-500/50 bg-emerald-50 shadow-sm'
                    : 'border-[#FFEDD5] hover:border-[#F97316] bg-[#FFF8F5] hover:bg-[#FFF1EC]'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleJdFileChange}
                    className="hidden"
                    id="jd-file-input"
                  />
                  <label htmlFor="jd-file-input" className="cursor-pointer flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                      jdFile 
                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-300' 
                        : 'bg-[#F97316]/15 text-[#F97316] border border-[#FB923C]/30'
                    }`}>
                      {jdFile ? <Check className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    {jdFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-700">{jdFile.name}</p>
                        <p className="text-[11px] text-[#C2410C] mt-0.5">{(jdFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-2 text-[11px] text-[#F97316] hover:underline font-semibold">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-[#9A3412]">Upload Job Description File (PDF / TXT)</p>
                        <p className="text-[11px] text-[#C2410C] mt-1">Drag and drop file here or click to browse</p>
                        <span className="inline-block mt-3 bg-[#FFEDD5] hover:bg-[#F97316] text-[#C2410C] hover:text-white border border-[#FB923C]/30 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                          Select JD File
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <textarea
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  placeholder="Paste job description requirements & tech stack here..."
                  rows={6}
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-3xl p-4 text-xs font-mono text-[#9A3412] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all placeholder:text-[#C2410C]/60 resize-none"
                />
              )}

            </div>

          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Warm Orange Action Button */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto min-w-[340px] bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F97316] hover:from-[#EA580C] hover:to-[#F97316] text-white font-black text-sm px-10 py-4 rounded-2xl shadow-xl shadow-[#F97316]/30 transition-all flex items-center justify-center gap-3 ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-[0.97]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>AI Semantic Comparison...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Compare Resume & Job Description</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {loadingStage && (
              <p className="text-xs text-[#F97316] mt-4 font-semibold animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97316]"></span>
                {loadingStage}
              </p>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};
