import React, { useState } from 'react';
import { X, CheckCircle2, Mail, Phone, Briefcase, Sparkles, FileText, BookOpen, Building2, Printer, ChevronDown, ChevronUp, MapPin, Linkedin, Github } from 'lucide-react';
import { Candidate } from '../types';
import { exportCandidatePdf } from '../utils/pdfExporter';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
}

// Helper to convert any value (strings, objects {code, message}, numbers) safely into readable text
function safeText(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.message || val.text || val.description || val.title || JSON.stringify(val);
  }
  return String(val);
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const [leftTab, setLeftTab] = useState<'resume' | 'jd'>('resume');
  const [expandedSection, setExpandedSection] = useState<string | null>('skills');

  const profile = candidate.candidate_profile || {};
  const contact = profile?.contact || { email: null, phone: null };
  const evaluation = candidate.evaluation || {};
  const breakdown = evaluation?.breakdown || { skills_score: 0, experience_score: 0, education_score: 0, tone_and_relevance_score: 0 };
  const overallPercentage = (evaluation?.overall_score || 0) * 10;

  // Safe Array Wrappers to prevent React runtime crashes
  const technicalSkills = Array.isArray(profile?.skills?.technical) ? profile.skills.technical : [];
  const strengthsList = Array.isArray(evaluation?.strengths) ? evaluation.strengths : [];
  const recruiterNotesList = Array.isArray(evaluation?.recruiter_notes) ? evaluation.recruiter_notes : [];
  const missingReqsList = Array.isArray(evaluation?.missing_requirements) ? evaluation.missing_requirements : [];

  const handlePrintPdf = () => {
    exportCandidatePdf(candidate);
  };

  const getPill = (score: number) => {
    if (score >= 80) return <span className="bg-emerald-50 text-[#059669] border border-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Strong Match</span>;
    if (score >= 60) return <span className="bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Good Match</span>;
    return <span className="bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Needs Work</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-300 flex-shrink-0">
              {profile?.name ? safeText(profile.name).charAt(0) : 'C'}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <span>{safeText(profile?.name) || 'Unnamed Candidate'}</span>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  candidate.is_valid_resume === false || evaluation?.overall_score <= 1
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : evaluation?.shortlisted
                    ? 'bg-emerald-50 border-emerald-300 text-[#059669]'
                    : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}>
                  {candidate.is_valid_resume === false || evaluation?.overall_score <= 1
                    ? 'Invalid Document Type'
                    : evaluation?.shortlisted ? 'Shortlisted Candidate' : 'Under Review'}
                </span>
              </h2>
              
              {/* SEPARATED ROLE AND COMPANY DISPLAY */}
              <div className="flex items-center space-x-3 text-xs text-slate-600 mt-0.5 font-medium">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Briefcase className="w-3.5 h-3.5 text-[#10B981]" />
                  {safeText(candidate.target_role) || 'Software Role'}
                </span>
                {candidate.target_company && (
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {safeText(candidate.target_company)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Export PDF Button */}
            <button
              onClick={handlePrintPdf}
              className="flex items-center space-x-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm border border-emerald-400"
              title="Print / Export Candidate PDF Report"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Split Screen Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-y-auto">
          
          {/* LEFT PANEL */}
          <div className="p-6 flex flex-col h-full bg-slate-50/70 space-y-4">
            
            <div className="flex flex-wrap items-center gap-2 text-xs bg-white p-3 rounded-2xl border border-slate-200 shadow-sm font-medium">
              {contact.email && (
                <span className="flex items-center gap-1 text-slate-700">
                  <Mail className="w-3 h-3 text-[#10B981]" />
                  {safeText(contact.email)}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1 text-slate-700">
                  <Phone className="w-3 h-3 text-[#10B981]" />
                  {safeText(contact.phone)}
                </span>
              )}
              {contact.location && (
                <span className="flex items-center gap-1 text-slate-700">
                  <MapPin className="w-3 h-3 text-[#10B981]" />
                  {safeText(contact.location)}
                </span>
              )}
              {contact.linkedin_url && (
                <a href={safeText(contact.linkedin_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#10B981] hover:underline font-bold">
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                </a>
              )}
              {contact.portfolio_github_url && (
                <a href={safeText(contact.portfolio_github_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#10B981] hover:underline font-bold">
                  <Github className="w-3 h-3" />
                  GitHub/Portfolio
                </a>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex bg-slate-200/80 border border-slate-300 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setLeftTab('resume')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    leftTab === 'resume' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume Content</span>
                </button>
                <button
                  onClick={() => setLeftTab('jd')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    leftTab === 'jd' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Target Requirements</span>
                </button>
              </div>

              <span className="text-[11px] text-[#059669] font-mono font-bold">
                {leftTab === 'resume' ? safeText(candidate.filename) : 'Target JD'}
              </span>
            </div>

            <div className="flex-1 bg-white border border-slate-300 rounded-2xl p-5 overflow-y-auto max-h-[500px] font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
              {leftTab === 'resume' ? safeText(candidate.raw_text) : safeText(candidate.job_description)}
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[700px]">
            
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                <div className="relative w-32 h-20 flex items-center justify-center overflow-hidden">
                  <div className="w-32 h-32 rounded-full border-[10px] border-slate-200 absolute top-0"></div>
                  <div 
                    className="w-32 h-32 rounded-full border-[10px] border-[#10B981] absolute top-0 transform -rotate-90 transition-all duration-1000 shadow-sm"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% 50%, 0 50%)`,
                      transform: `rotate(${Math.min(180, (overallPercentage / 100) * 180 - 180)}deg)`
                    }}
                  ></div>
                  <div className="absolute bottom-1 flex flex-col items-center">
                    <span className="text-xl font-black text-slate-900">{overallPercentage}/100</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">Your Resume Score</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">This score is calculated based on the variables listed below.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 pt-4 border-t border-slate-200 text-xs">
                
                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Tone & Style</span>
                    {getPill(breakdown.tone_and_relevance_score || 0)}
                  </div>
                  <span className="font-black text-slate-900 text-sm">{breakdown.tone_and_relevance_score || 0}<span className="text-slate-400 text-xs font-normal">/100</span></span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Content & Experience</span>
                    {getPill(breakdown.experience_score || 0)}
                  </div>
                  <span className="font-black text-slate-900 text-sm">{breakdown.experience_score || 0}<span className="text-slate-400 text-xs font-normal">/100</span></span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Structure & Education</span>
                    {getPill(breakdown.education_score || 0)}
                  </div>
                  <span className="font-black text-slate-900 text-sm">{breakdown.education_score || 0}<span className="text-slate-400 text-xs font-normal">/100</span></span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">Skills Match</span>
                    {getPill(breakdown.skills_score || 0)}
                  </div>
                  <span className="font-black text-slate-900 text-sm">{breakdown.skills_score || 0}<span className="text-slate-400 text-xs font-normal">/100</span></span>
                </div>

              </div>

            </div>

            {/* INVALID DOCUMENT DETAILED DIAGNOSTICS CARD */}
            {(candidate.is_valid_resume === false || evaluation?.overall_score <= 1) ? (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center font-black text-xl flex-shrink-0">
                    !
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Invalid Document Type Detected</h4>
                    <p className="text-xs font-bold text-rose-600">Document Rejection Audit & Classification Details</p>
                  </div>
                </div>

                {/* Primary Reason */}
                <div className="bg-white border border-rose-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider block">Primary Rejection Cause</span>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">
                    {safeText(candidate.invalid_resume_reason || evaluation?.justification || evaluation?.ai_summary) || 'The uploaded file does not match individual candidate resume/CV structure.'}
                  </p>
                </div>

                {/* Audit Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white border border-rose-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Document Classification</span>
                    <span className="font-bold text-rose-700">
                      {candidate.raw_text?.toLowerCase().includes('lab sheet') ? 'University Lab Sheet / Worksheet'
                        : candidate.raw_text?.toLowerCase().includes('job description') ? 'Job Description Specification'
                        : candidate.raw_text?.toLowerCase().includes('certificate') ? 'Course Completion Certificate'
                        : 'Non-Resume Academic File'}
                    </span>
                  </div>

                  <div className="bg-white border border-rose-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Employment History Audit</span>
                    <span className="font-bold text-rose-600">❌ Missing Candidate Work History</span>
                  </div>
                </div>

                {/* Detailed Missing Criteria Checklist */}
                <div className="space-y-2 pt-2 border-t border-rose-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase block">ATS Verification Failures:</span>
                  <ul className="space-y-1.5 text-xs text-rose-700">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>No individual employment history, role progression, or professional career timeline found.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>Document contains instructional/academic content (e.g. lab tasks, question paper queries, or JD requirements).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>Lacks candidate personal contact credentials or verified individual project achievements.</span>
                    </li>
                  </ul>
                </div>

                {/* Actionable Solution */}
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#059669]">
                    <span>💡 Action Required:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Please upload a valid <strong className="text-[#059669]">individual candidate's Resume or CV (.pdf format)</strong> containing work experience, skills, and education to perform ATS screening.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`rounded-3xl p-6 border ${
                overallPercentage >= 70 
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                  : 'bg-amber-50 border-amber-300 shadow-sm'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${
                    overallPercentage >= 70 ? 'bg-emerald-100 text-[#059669] border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}>
                    !
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      ATS Score - {overallPercentage}/100
                    </h4>
                    <p className={`text-xs font-bold ${
                      overallPercentage >= 70 ? 'text-[#059669]' : 'text-amber-700'
                    }`}>
                      {overallPercentage >= 70 ? 'Strong Fit' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 mb-4 font-medium">
                  {safeText(evaluation?.ai_summary) || 'This score represents how well the candidate\'s resume is likely to perform in Applicant Tracking Systems.'}
                </p>

                <ul className="space-y-2 text-xs">
                  {missingReqsList.slice(0, 4).map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-700 font-medium">
                      <span>⚠️</span>
                      <span>{safeText(req)}</span>
                    </li>
                  ))}
                  {missingReqsList.length === 0 && (
                    <li className="flex items-start gap-2 text-[#059669] font-semibold">
                      <span className="text-[#059669]">✓</span>
                      <span>Candidate satisfies all core requirements for the target role!</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>Technical & Soft Skills Breakdown</span>
                    {getPill(breakdown.skills_score || 0)}
                  </span>
                  {expandedSection === 'skills' ? <ChevronUp className="w-4 h-4 text-[#10B981]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedSection === 'skills' && (
                  <div className="p-5 border-t border-slate-200 text-xs space-y-3 bg-white">
                    <p className="text-slate-700 font-semibold">Extracted Technical Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {technicalSkills.map((skill, i) => (
                        <span key={i} className="bg-emerald-50 border border-emerald-200 text-[#059669] text-xs px-2.5 py-1 rounded-md font-semibold">
                          {safeText(skill)}
                        </span>
                      ))}
                      {technicalSkills.length === 0 && <span className="text-slate-400 italic">No specific technical skills extracted</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'strengths' ? null : 'strengths')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>Highlighted Candidate Strengths</span>
                    <span className="bg-emerald-50 text-[#059669] border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{strengthsList.length} Highlights</span>
                  </span>
                  {expandedSection === 'strengths' ? <ChevronUp className="w-4 h-4 text-[#10B981]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedSection === 'strengths' && (
                  <div className="p-5 border-t border-slate-200 text-xs space-y-2 bg-white">
                    {strengthsList.map((str, i) => (
                      <p key={i} className="flex items-start gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                        <span>{safeText(str)}</span>
                      </p>
                    ))}
                    {strengthsList.length === 0 && <p className="text-slate-400 italic">No specific strengths highlighted</p>}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'recruiter' ? null : 'recruiter')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>Recruiter Action Notes & Recommendations</span>
                  </span>
                  {expandedSection === 'recruiter' ? <ChevronUp className="w-4 h-4 text-[#10B981]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedSection === 'recruiter' && (
                  <div className="p-5 border-t border-slate-200 text-xs space-y-2 bg-white">
                    {recruiterNotesList.map((note, i) => (
                      <p key={i} className="flex items-start gap-2 text-slate-700 font-medium">
                        <Sparkles className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                        <span>{safeText(note)}</span>
                      </p>
                    ))}
                    {recruiterNotesList.length === 0 && <p className="text-slate-400 italic">No recruiter action notes provided</p>}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
