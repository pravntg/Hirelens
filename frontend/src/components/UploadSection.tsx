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
      setTimeout(() => setLoadingStage(`Sending to ${provider === 'gemini' ? 'Google Gemini 3.6 Flash' : 'Groq Cloud Qwen-3.6'} AI Engine...`), 1200);
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
      
      {/* Hero Header with Crimson Glow */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#FF1744]/10 border border-[#FF1744]/30 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#FF5252] shadow-[0_0_12px_rgba(255,23,68,0.3)]">
          <Zap className="w-3.5 h-3.5 text-[#FF1744]" />
          <span>Automated Live Crimson AI Resume Matching</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,23,68,0.4)]">
          Compare Candidate Resume & Job Description
        </h1>

        <p className="text-sm text-slate-400 font-medium">
          Upload candidate resume & job description. Extract structured profiles, compute ATS match scores with Gemini or Groq AI, and generate recruiter reports.
        </p>
      </div>

      {/* Main Cyber Glass Card */}
      <div className="cyber-card rounded-3xl p-6 sm:p-10 shadow-2xl max-w-5xl mx-auto">
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* AI MODEL SELECTOR DROPDOWN */}
          <div className="bg-[#0D0D14]/80 border border-[#FF1744]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center text-[#FF1744] shadow-[0_0_10px_rgba(255,23,68,0.3)]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Select Live AI Engine</p>
                <p className="text-[11px] text-slate-400">Choose between Google Gemini or Groq Cloud AI</p>
              </div>
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="bg-[#161622] border border-[#FF1744]/40 rounded-xl px-4 py-2.5 text-xs text-white font-black focus:outline-none focus:border-[#FF1744] cursor-pointer w-full sm:w-auto shadow-sm"
            >
              <option value="groq">Groq Cloud AI (Qwen-3.6-27B Live LLM)</option>
              <option value="gemini">Google Gemini AI (gemini-3.6-flash)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* BOX 1: CANDIDATE RESUME */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#FF5252] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF1744]" />
                  1. Candidate Resume
                </label>
                
                <div className="flex bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('file')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      resumeInputMode === 'file' ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-md shadow-[#FF1744]/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('text')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      resumeInputMode === 'text' ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-md shadow-[#FF1744]/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {resumeInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[250px] cursor-pointer ${
                  resumeFile
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-[#FF1744]/30 hover:border-[#FF1744] bg-[#0D0D14]/70 hover:bg-[#161622]'
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
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                        : 'bg-[#FF1744]/15 text-[#FF1744] border border-[#FF1744]/30 shadow-[0_0_12px_rgba(255,23,68,0.3)]'
                    }`}>
                      {resumeFile ? <Check className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                    </div>
                    {resumeFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{resumeFile.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-2 text-[11px] text-[#FF5252] hover:underline font-semibold">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-white">Upload Candidate Resume (PDF / TXT)</p>
                        <p className="text-[11px] text-slate-400 mt-1">Drag and drop file here or click to browse</p>
                        <span className="inline-block mt-3 bg-[#FF1744]/15 hover:bg-[#FF1744] text-[#FF5252] hover:text-white border border-[#FF1744]/40 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(255,23,68,0.2)]">
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
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-3xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#FF1744] focus:ring-1 focus:ring-[#FF1744] transition-all placeholder:text-slate-500 resize-none"
                />
              )}
            </div>

            {/* BOX 2: JOB DESCRIPTION & SEPARATED ROLE / COMPANY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#FF5252] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#FF1744]" />
                  2. Target Job Description (JD)
                </label>
                
                <div className="flex bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJdInputMode('file')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      jdInputMode === 'file' ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-md shadow-[#FF1744]/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdInputMode('text')}
                    className={`px-3 py-1 rounded-lg transition-all font-bold ${
                      jdInputMode === 'text' ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-md shadow-[#FF1744]/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {/* Separated Role Title & Company Name inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[#FF5252] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Job Role / Title (e.g. Full Stack)"
                    className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#FF1744] placeholder:text-slate-500"
                  />
                </div>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-[#FF5252] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="Company Name (e.g. Google)"
                    className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#FF1744] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {jdInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[180px] cursor-pointer ${
                  jdFile
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-[#FF1744]/30 hover:border-[#FF1744] bg-[#0D0D14]/70 hover:bg-[#161622]'
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
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                        : 'bg-[#FF1744]/15 text-[#FF1744] border border-[#FF1744]/30 shadow-[0_0_12px_rgba(255,23,68,0.3)]'
                    }`}>
                      {jdFile ? <Check className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    {jdFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{jdFile.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{(jdFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-2 text-[11px] text-[#FF5252] hover:underline font-semibold">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-white">Upload Job Description File (PDF / TXT)</p>
                        <p className="text-[11px] text-slate-400 mt-1">Drag and drop file here or click to browse</p>
                        <span className="inline-block mt-3 bg-[#FF1744]/15 hover:bg-[#FF1744] text-[#FF5252] hover:text-white border border-[#FF1744]/40 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(255,23,68,0.2)]">
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
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-3xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#FF1744] focus:ring-1 focus:ring-[#FF1744] transition-all placeholder:text-slate-500 resize-none"
                />
              )}

            </div>

          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-rose-300 text-xs flex items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Glowing Crimson Action Button */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto min-w-[340px] bg-gradient-to-r from-[#FF1744] via-[#E60039] to-[#D50000] hover:from-[#E60039] hover:to-[#FF1744] text-white font-black text-sm px-10 py-4 rounded-2xl shadow-[0_0_30px_rgba(255,23,68,0.6)] border border-[#FF5252]/40 transition-all flex items-center justify-center gap-3 ${
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
                  <Sparkles className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  <span>Compare Resume & Job Description</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {loadingStage && (
              <p className="text-xs text-[#FF5252] mt-4 font-semibold animate-pulse flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,23,68,0.6)]">
                <span className="w-2 h-2 rounded-full bg-[#FF1744] shadow-[0_0_8px_#FF1744]"></span>
                {loadingStage}
              </p>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};
