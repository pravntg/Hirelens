import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Check, AlertCircle, Loader2, BookOpen, ArrowRight, Building2, Briefcase, Cpu, ShieldCheck } from 'lucide-react';
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
      
      {/* Enhancv Hero Header Banner */}
      <div className="text-center space-y-3 pt-4 pb-2">
        <span className="text-xs font-black tracking-widest text-[#059669] uppercase bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          AI RESUME CHECKER & ATS SCREENER
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Is the candidate <span className="text-[#10B981]">good enough?</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-medium">
          Upload candidate resumes in PDF format and compare them against target job specifications to get instant ATS scores, skills match breakdowns, and shortlist status.
        </p>
      </div>

      {/* Main Enhancv Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* AI Model Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#059669]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">Select Live AI Engine</p>
                <p className="text-[11px] text-slate-500 font-medium">Choose between Google Gemini or Groq Cloud AI</p>
              </div>
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#10B981] cursor-pointer w-full sm:w-auto shadow-sm"
            >
              <option value="groq">Groq Cloud AI (Qwen-3.6-27B Live LLM)</option>
              <option value="gemini">Google Gemini AI (gemini-1.5-flash Live LLM)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* BOX 1: CANDIDATE RESUME */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#10B981]" />
                  1. Candidate Resume (PDF ONLY)
                </label>
                
                <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('file')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      resumeInputMode === 'file' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeInputMode('text')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      resumeInputMode === 'text' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {resumeInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[220px] cursor-pointer ${
                  resumeFile
                    ? 'border-[#10B981] bg-emerald-50/50'
                    : 'border-emerald-300 hover:border-[#10B981] bg-slate-50/70 hover:bg-emerald-50/30'
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
                        ? 'bg-emerald-100 text-[#059669] border border-emerald-300' 
                        : 'bg-emerald-50 text-[#10B981] border border-emerald-200'
                    }`}>
                      {resumeFile ? <Check className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    {resumeFile ? (
                      <div>
                        <p className="text-xs font-bold text-[#059669]">{resumeFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-2 text-[11px] text-[#10B981] font-bold hover:underline">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">Drop your resume here or choose a file</p>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">PDF ONLY. Max 10MB file size.</p>
                        <span className="inline-block mt-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-extrabold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20">
                          Upload Your Resume
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
                  className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#10B981] resize-none shadow-sm"
                />
              )}
            </div>

            {/* BOX 2: JOB DESCRIPTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#10B981]" />
                  2. Target Job Description (JD) (PDF ONLY)
                </label>
                
                <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJdInputMode('file')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      jdInputMode === 'file' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdInputMode('text')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      jdInputMode === 'text' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {/* Role & Company Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Job Role / Title (e.g. Full Stack)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#10B981] placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="Company Name (e.g. Google)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#10B981] placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {jdInputMode === 'file' ? (
                <div className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] cursor-pointer ${
                  jdFile
                    ? 'border-[#10B981] bg-emerald-50/50'
                    : 'border-emerald-300 hover:border-[#10B981] bg-slate-50/70 hover:bg-emerald-50/30'
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
                        ? 'bg-emerald-100 text-[#059669] border border-emerald-300' 
                        : 'bg-emerald-50 text-[#10B981] border border-emerald-200'
                    }`}>
                      {jdFile ? <Check className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                    </div>
                    {jdFile ? (
                      <div>
                        <p className="text-xs font-bold text-[#059669]">{jdFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{(jdFile.size / 1024).toFixed(1)} KB • Ready for AI comparison</p>
                        <span className="inline-block mt-1 text-[11px] text-[#10B981] font-bold hover:underline">Click to replace file</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">Upload Job Description File (PDF ONLY)</p>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">Drag and drop PDF file here or click to browse</p>
                        <span className="inline-block mt-2 bg-emerald-100 hover:bg-[#10B981] text-[#059669] hover:text-white border border-emerald-300 text-xs font-extrabold px-3.5 py-1 rounded-xl transition-all shadow-sm">
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
                  className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#10B981] resize-none shadow-sm"
                />
              )}

            </div>

          </div>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] font-medium pt-1">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>We never share your data with 3rd parties or use it for AI model training.</span>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-700 text-xs flex items-center justify-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto min-w-[280px] bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 border border-emerald-400 flex items-center justify-center gap-2 ${
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
              <p className="text-xs text-[#059669] mt-3 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                {loadingStage}
              </p>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};
