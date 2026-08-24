import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Check, AlertCircle, Loader2, BookOpen, ArrowRight, Building2, Briefcase, Cpu } from 'lucide-react';
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
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid PDF document (.pdf). Non-PDF files are not supported.');
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
      setResumeInputMode('file');
      setError(null);
    }
  };

  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid PDF document (.pdf). Non-PDF files are not supported.');
        setJdFile(null);
        return;
      }
      setJdFile(file);
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
      setError('Please attach a candidate Resume PDF file OR paste candidate resume text.');
      return;
    }

    if (!hasJdFile && !hasJdText) {
      setError('Please attach a Job Description PDF file OR paste job description text.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('Parsing PDF files...');

    try {
      setTimeout(() => setLoadingStage(`Evaluating with ${provider === 'gemini' ? 'Google Gemini AI' : 'Groq Cloud AI'}...`), 1200);
      setTimeout(() => setLoadingStage('Generating evaluation report...'), 2400);

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
        : (rawErr?.message || err.message || 'Comparison request failed.');
      setError(safeString(errMsg));
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Main Card */}
      <div className="cyber-card rounded-3xl p-6 sm:p-8 shadow-xl">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* AI Model Selector */}
          <div className="bg-[#0D0D14] border border-[#FF1744]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center text-[#FF5252]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Select Live AI Engine</p>
                <p className="text-[11px] text-slate-400">Choose between Google Gemini or Groq Cloud AI</p>
              </div>
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="bg-[#0D0D14] border border-[#FF1744]/40 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-[#FF1744] cursor-pointer w-full sm:w-auto"
            >
              <option value="groq">Groq Cloud AI (Qwen-3.6-27B Live LLM)</option>
              <option value="gemini">Google Gemini AI (gemini-1.5-flash Live LLM)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* BOX 1: CANDIDATE RESUME */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF1744]" />
                  1. Candidate Resume (PDF ONLY)
                </label>
                
                <div className="flex bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('file')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      resumeInputMode === 'file' ? 'bg-[#FF1744] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('text')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      resumeInputMode === 'text' ? 'bg-[#FF1744] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {resumeInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[220px] cursor-pointer ${
                  resumeFile
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-[#FF1744]/40 hover:border-[#FF1744] bg-[#0D0D14]'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeFileChange}
                    className="hidden"
                    id="resume-file-input"
                  />
                  <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                      resumeFile 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-[#FF1744]/15 text-[#FF5252] border border-[#FF1744]/30'
                    }`}>
                      {resumeFile ? <Check className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    {resumeFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{resumeFile.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-2 text-[11px] text-[#FF5252] hover:underline">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-white">Upload Candidate Resume (PDF ONLY)</p>
                        <p className="text-[11px] text-slate-400 mt-1">Drag and drop PDF file here or click to browse</p>
                        <span className="inline-block mt-3 bg-[#FF1744]/20 hover:bg-[#FF1744] text-[#FF5252] hover:text-white border border-[#FF1744]/40 text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-md">
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
                  rows={8}
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#FF1744] resize-none"
                />
              )}
            </div>

            {/* BOX 2: JOB DESCRIPTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#FF1744]" />
                  2. Target Job Description (JD) (PDF ONLY)
                </label>
                
                <div className="flex bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJdInputMode('file')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      jdInputMode === 'file' ? 'bg-[#FF1744] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdInputMode('text')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      jdInputMode === 'text' ? 'bg-[#FF1744] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {/* Role & Company Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[#FF5252] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Job Role / Title (e.g. Full Stack)"
                    className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#FF1744] placeholder:text-slate-500"
                  />
                </div>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-[#FF5252] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="Company Name (e.g. Google)"
                    className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#FF1744] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {jdInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] cursor-pointer ${
                  jdFile
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-[#FF1744]/40 hover:border-[#FF1744] bg-[#0D0D14]'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleJdFileChange}
                    className="hidden"
                    id="jd-file-input"
                  />
                  <label htmlFor="jd-file-input" className="cursor-pointer flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                      jdFile 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-[#FF1744]/15 text-[#FF5252] border border-[#FF1744]/30'
                    }`}>
                      {jdFile ? <Check className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                    </div>
                    {jdFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{jdFile.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{(jdFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-1 text-[11px] text-[#FF5252] hover:underline">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-white">Upload Job Description File (PDF ONLY)</p>
                        <p className="text-[11px] text-slate-400 mt-1">Drag and drop PDF file here or click to browse</p>
                        <span className="inline-block mt-2 bg-[#FF1744]/20 hover:bg-[#FF1744] text-[#FF5252] hover:text-white border border-[#FF1744]/40 text-xs font-bold px-3.5 py-1 rounded-xl transition-all shadow-md">
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
                  placeholder="Paste job requirements text here..."
                  rows={5}
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#FF1744] resize-none"
                />
              )}

            </div>

          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 text-rose-300 text-xs flex items-center justify-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-[#FF1744] to-[#D50000] hover:from-[#E60039] hover:to-[#FF1744] text-white font-extrabold text-xs px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#FF1744]/30 border border-[#FF5252]/40 flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate Candidate Match</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {loadingStage && (
              <p className="text-xs text-[#FF5252] mt-3 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF1744] animate-ping"></span>
                {loadingStage}
              </p>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};
