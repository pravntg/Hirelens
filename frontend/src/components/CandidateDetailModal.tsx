import React, { useState } from 'react';
import { X, CheckCircle2, User, Mail, Phone, Briefcase, GraduationCap, Sparkles, FileText, BookOpen, Building2, Printer, ChevronDown, ChevronUp, MapPin, Linkedin, Github, Award } from 'lucide-react';
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
    if (score >= 80) return <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Strong Match</span>;
    if (score >= 60) return <span className="bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Good Start</span>;
    return <span className="bg-[#FFEDD5] text-[#C2410C] border border-[#FB923C]/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Needs Work</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      
      <div className="bg-white border border-[#FFEDD5] rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#FFEDD5] flex items-center justify-between bg-[#FFF8F5]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F97316] via-[#FB923C] to-[#EC4899] text-white font-black text-xl flex items-center justify-center shadow-md shadow-[#F97316]/20 flex-shrink-0">
              {profile?.name ? safeText(profile.name).charAt(0) : 'C'}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#9A3412] flex items-center gap-2 tracking-tight">
                <span>{safeText(profile?.name) || 'Unnamed Candidate'}</span>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  evaluation?.shortlisted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-[#FFEDD5] border-[#FB923C]/40 text-[#C2410C]'
                }`}>
                  {evaluation?.shortlisted ? 'Shortlisted Candidate' : 'Under Review'}
                </span>
              </h2>
              
              {/* SEPARATED ROLE AND COMPANY DISPLAY */}
              <div className="flex items-center space-x-3 text-xs text-[#C2410C] mt-0.5">
                <span className="flex items-center gap-1 font-semibold text-[#9A3412]">
                  <Briefcase className="w-3.5 h-3.5 text-[#F97316]" />
                  {safeText(candidate.target_role) || 'Software Role'}
                </span>
                {candidate.target_company && (
                  <span className="flex items-center gap-1 font-medium text-[#C2410C]">
                    <Building2 className="w-3.5 h-3.5 text-[#FB923C]" />
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
              className="flex items-center space-x-1.5 bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#F97316]/20"
              title="Print / Export Candidate PDF Report"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#C2410C] hover:text-[#9A3412] hover:bg-[#FFF8F5] rounded-2xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Split Screen Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#FFEDD5] overflow-y-auto">
          
          {/* LEFT PANEL */}
          <div className="p-6 flex flex-col h-full bg-[#FFF8F5]/60 space-y-4">
            
            <div className="flex flex-wrap items-center gap-2 text-xs bg-white p-3 rounded-2xl border border-[#FFEDD5]">
              {contact.email && (
                <span className="flex items-center gap-1 text-[#9A3412]">
                  <Mail className="w-3 h-3 text-[#F97316]" />
                  {safeText(contact.email)}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1 text-[#9A3412]">
                  <Phone className="w-3 h-3 text-[#FB923C]" />
                  {safeText(contact.phone)}
                </span>
              )}
              {contact.location && (
                <span className="flex items-center gap-1 text-[#9A3412]">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {safeText(contact.location)}
                </span>
              )}
              {contact.linkedin_url && (
                <a href={safeText(contact.linkedin_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#F97316] hover:underline">
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                </a>
              )}
              {contact.portfolio_github_url && (
                <a href={safeText(contact.portfolio_github_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#FB923C] hover:underline">
                  <Github className="w-3 h-3" />
                  GitHub/Portfolio
                </a>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex bg-white border border-[#FFEDD5] rounded-xl p-1 text-xs">
                <button
                  onClick={() => setLeftTab('resume')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    leftTab === 'resume' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume Content</span>
                </button>
                <button
                  onClick={() => setLeftTab('jd')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    leftTab === 'jd' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Target Requirements</span>
                </button>
              </div>

              <span className="text-[11px] text-[#C2410C] font-mono">
                {leftTab === 'resume' ? safeText(candidate.filename) : 'Target JD'}
              </span>
            </div>

            <div className="flex-1 bg-white border border-[#FFEDD5] rounded-2xl p-5 overflow-y-auto max-h-[500px] font-mono text-xs text-[#9A3412] whitespace-pre-wrap leading-relaxed shadow-inner">
              {leftTab === 'resume' ? safeText(candidate.raw_text) : safeText(candidate.job_description)}
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[700px]">
            
            <div className="bg-[#FFF8F5] border border-[#FFEDD5] rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                <div className="relative w-32 h-20 flex items-center justify-center overflow-hidden">
                  <div className="w-32 h-32 rounded-full border-[10px] border-[#FFEDD5] absolute top-0"></div>
                  <div 
                    className="w-32 h-32 rounded-full border-[10px] border-[#F97316] absolute top-0 transform -rotate-90 transition-all duration-1000"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% 50%, 0 50%)`,
                      transform: `rotate(${Math.min(180, (overallPercentage / 100) * 180 - 180)}deg)`
                    }}
                  ></div>
                  <div className="absolute bottom-1 flex flex-col items-center">
                    <span className="text-xl font-black text-[#9A3412]">{overallPercentage}/100</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#9A3412]">Your Resume Score</h3>
                  <p className="text-xs text-[#C2410C] mt-1">This score is calculated based on the variables listed below.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 pt-4 border-t border-[#FFEDD5] text-xs">
                
                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#FFEDD5]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#9A3412]">Tone & Style</span>
                    {getPill(breakdown.tone_and_relevance_score || 0)}
                  </div>
                  <span className="font-black text-[#9A3412] text-sm">{breakdown.tone_and_relevance_score || 0}<span className="text-[#C2410C]/60 text-xs font-normal">/100</span></span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#FFEDD5]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#9A3412]">Content & Experience</span>
                    {getPill(breakdown.experience_score || 0)}
                  </div>
                  <span className="font-black text-[#9A3412] text-sm">{breakdown.experience_score || 0}<span className="text-[#C2410C]/60 text-xs font-normal">/100</span></span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#FFEDD5]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#9A3412]">Structure & Education</span>
                    {getPill(breakdown.education_score || 0)}
                  </div>
                  <span className="font-black text-[#9A3412] text-sm">{breakdown.education_score || 0}<span className="text-[#C2410C]/60 text-xs font-normal">/100</span></span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#FFEDD5]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#9A3412]">Skills Match</span>
                    {getPill(breakdown.skills_score || 0)}
                  </div>
                  <span className="font-black text-[#9A3412] text-sm">{breakdown.skills_score || 0}<span className="text-[#C2410C]/60 text-xs font-normal">/100</span></span>
                </div>

              </div>

            </div>

            <div className={`rounded-3xl p-6 border ${
              overallPercentage >= 70 
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-[#FFF8F5] border-[#FFEDD5]'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${
                  overallPercentage >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#FFEDD5] text-[#C2410C]'
                }`}>
                  !
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#9A3412]">ATS Score - {overallPercentage}/100</h4>
                  <p className={`text-xs font-bold ${overallPercentage >= 70 ? 'text-emerald-700' : 'text-[#C2410C]'}`}>
                    {overallPercentage >= 70 ? 'Strong Fit' : 'Needs Improvement'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#C2410C] mb-4">
                {safeText(evaluation?.ai_summary) || 'This score represents how well the candidate\'s resume is likely to perform in Applicant Tracking Systems.'}
              </p>

              <ul className="space-y-2 text-xs">
                {missingReqsList.slice(0, 4).map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#C2410C]">
                    <span>⚠️</span>
                    <span>{safeText(req)}</span>
                  </li>
                ))}
                {missingReqsList.length === 0 && (
                  <li className="flex items-start gap-2 text-emerald-700">
                    <span className="text-emerald-600">✓</span>
                    <span>Candidate satisfies all core requirements for the target role!</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              
              <div className="bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-[#9A3412] hover:bg-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>Technical & Soft Skills Breakdown</span>
                    {getPill(breakdown.skills_score || 0)}
                  </span>
                  {expandedSection === 'skills' ? <ChevronUp className="w-4 h-4 text-[#F97316]" /> : <ChevronDown className="w-4 h-4 text-[#C2410C]" />}
                </button>
                {expandedSection === 'skills' && (
                  <div className="p-5 border-t border-[#FFEDD5] text-xs space-y-3 bg-white">
                    <p className="text-[#C2410C] font-semibold">Extracted Technical Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {technicalSkills.map((skill, i) => (
                        <span key={i} className="bg-[#FFEDD5] border border-[#FB923C]/40 text-[#C2410C] text-xs px-2.5 py-1 rounded-md font-semibold">
                          {safeText(skill)}
                        </span>
                      ))}
                      {technicalSkills.length === 0 && <span className="text-gray-400 italic">No specific technical skills extracted</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'strengths' ? null : 'strengths')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-[#9A3412] hover:bg-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>Highlighted Candidate Strengths</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{strengthsList.length} Highlights</span>
                  </span>
                  {expandedSection === 'strengths' ? <ChevronUp className="w-4 h-4 text-[#F97316]" /> : <ChevronDown className="w-4 h-4 text-[#C2410C]" />}
                </button>
                {expandedSection === 'strengths' && (
                  <div className="p-5 border-t border-[#FFEDD5] text-xs space-y-2 bg-white">
                    {strengthsList.map((str, i) => (
                      <p key={i} className="flex items-start gap-2 text-[#9A3412]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{safeText(str)}</span>
                      </p>
                    ))}
                    {strengthsList.length === 0 && <p className="text-gray-400 italic">No specific strengths highlighted</p>}
                  </div>
                )}
              </div>

              <div className="bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'recruiter' ? null : 'recruiter')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-[#9A3412] hover:bg-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>Recruiter Action Notes & Recommendations</span>
                  </span>
                  {expandedSection === 'recruiter' ? <ChevronUp className="w-4 h-4 text-[#F97316]" /> : <ChevronDown className="w-4 h-4 text-[#C2410C]" />}
                </button>
                {expandedSection === 'recruiter' && (
                  <div className="p-5 border-t border-[#FFEDD5] text-xs space-y-2 bg-white">
                    {recruiterNotesList.map((note, i) => (
                      <p key={i} className="flex items-start gap-2 text-[#9A3412]">
                        <Sparkles className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                        <span>{safeText(note)}</span>
                      </p>
                    ))}
                    {recruiterNotesList.length === 0 && <p className="text-gray-400 italic">No recruiter action notes provided</p>}
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
