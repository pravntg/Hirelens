import React, { useState } from 'react';
import { Search, Filter, Trash2, Eye, AlertCircle, FileText, CheckCircle2, Award, Zap, Download, Building2, Briefcase, X } from 'lucide-react';
import { Candidate } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { safeString } from '../utils/sanitize';

interface CandidateListProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onSelectCandidate,
  onDeleteCandidate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shortlisted' | 'under_review'>('all');
  const [minScore, setMinScore] = useState<number>(0);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRole, setExportRole] = useState<string>('all');
  const [exportCompany, setExportCompany] = useState<string>('all');
  const [exportShortlistedOnly, setExportShortlistedOnly] = useState<boolean>(true);

  const uniqueRoles = Array.from(new Set(candidates.map(c => c.target_role).filter(Boolean)));
  const uniqueCompanies = Array.from(new Set(candidates.map(c => c.target_company).filter(Boolean)));

  const filteredCandidates = candidates.filter(candidate => {
    if (statusFilter === 'shortlisted' && !candidate.evaluation?.shortlisted) return false;
    if (statusFilter === 'under_review' && candidate.evaluation?.shortlisted) return false;

    if ((candidate.evaluation?.overall_score || 0) < minScore) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = candidate.candidate_profile?.name?.toLowerCase().includes(term);
      const roleMatch = candidate.target_role?.toLowerCase().includes(term);
      const companyMatch = candidate.target_company?.toLowerCase().includes(term);
      const fileMatch = candidate.filename?.toLowerCase().includes(term);
      const skillMatch = candidate.candidate_profile?.skills?.technical?.some(s => s.toLowerCase().includes(term));
      return nameMatch || roleMatch || companyMatch || fileMatch || skillMatch;
    }

    return true;
  });

  const executeExcelExport = () => {
    let listToExport = candidates;

    if (exportShortlistedOnly) {
      listToExport = listToExport.filter(c => c.evaluation?.shortlisted);
    }
    if (exportRole !== 'all') {
      listToExport = listToExport.filter(c => c.target_role === exportRole);
    }
    if (exportCompany !== 'all') {
      listToExport = listToExport.filter(c => c.target_company === exportCompany);
    }

    if (listToExport.length === 0) {
      alert('No candidates match the selected export criteria.');
      return;
    }

    const headers = [
      'Candidate Name',
      'Phone Number',
      'Email Address',
      'LinkedIn URL',
      'Portfolio / GitHub',
      'Location',
      'Current / Recent Role',
      'Current / Recent Company',
      'Total Experience (Years)',
      'Highest Degree',
      'Institution',
      'Key Technical Skills',
      'Certifications',
      'AI Fit Score (%)',
      'AI Quick Summary'
    ];

    const rows = listToExport.map(c => {
      const profile = c.candidate_profile;
      const contact = profile?.contact || { email: null, phone: null };
      const education = profile?.education?.[0] || { degree: 'N/A', institution: 'N/A' };
      const techSkills = profile?.skills?.technical || [];
      const certs = profile?.certifications || [];
      const fitScorePct = (c.evaluation?.overall_score || 0) * 10;

      return [
        `"${String(profile?.name || 'Unnamed Candidate').replace(/"/g, '""')}"`,
        `"${String(contact.phone || 'N/A').replace(/"/g, '""')}"`,
        `"${String(contact.email || 'N/A').replace(/"/g, '""')}"`,
        `"${String(contact.linkedin_url || 'N/A').replace(/"/g, '""')}"`,
        `"${String(contact.portfolio_github_url || 'N/A').replace(/"/g, '""')}"`,
        `"${String(contact.location || 'N/A').replace(/"/g, '""')}"`,
        `"${String(profile?.current_or_latest_role || 'N/A').replace(/"/g, '""')}"`,
        `"${String(profile?.current_or_latest_company || 'N/A').replace(/"/g, '""')}"`,
        `"${String(profile?.total_years_experience || 'N/A').replace(/"/g, '""')}"`,
        `"${String(education.degree || 'N/A').replace(/"/g, '""')}"`,
        `"${String(education.institution || 'N/A').replace(/"/g, '""')}"`,
        `"${techSkills.join(', ').replace(/"/g, '""')}"`,
        `"${certs.join(', ').replace(/"/g, '""')}"`,
        `"${fitScorePct}%"`,
        `"${String(c.evaluation?.ai_summary || c.evaluation?.justification || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `HireLens_Candidates_${exportRole.replace(/\s+/g, '_')}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Directory Title & Export Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-[#10B981]" />
            Candidate Directory & Leaderboard
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Filter by status, search by role or company, and export custom role/company spreadsheets to Excel.</p>
        </div>

        {/* HireLens Mint Excel Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center space-x-2 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 border border-emerald-400"
        >
          <Download className="w-4 h-4" />
          <span>Export to Excel / CSV</span>
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, role, company, or skill..."
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] font-medium shadow-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 border border-slate-200 rounded-2xl p-1.5 text-xs w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'all' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            onClick={() => setStatusFilter('shortlisted')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === 'shortlisted' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-[#059669]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Shortlisted ({candidates.filter(c => c.evaluation?.shortlisted).length})
          </button>
          <button
            onClick={() => setStatusFilter('under_review')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'under_review' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Under Review ({candidates.filter(c => !c.evaluation?.shortlisted).length})
          </button>
        </div>

        {/* Min Score Slider */}
        <div className="flex items-center space-x-3 text-xs text-slate-700 w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="font-semibold">Min Score: <strong className="text-[#059669] font-extrabold">{minScore * 10}%</strong></span>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-[#10B981] bg-slate-200"
          />
        </div>

      </div>

      {/* Candidate Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#10B981] mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Candidates Found</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {candidates.length === 0
              ? 'No resumes screened yet. Compare your first candidate resume above!'
              : 'No candidate matches the selected filter parameters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => {
            const overallScore = candidate.evaluation?.overall_score || 0;
            const shortlisted = candidate.evaluation?.shortlisted;
            const profile = candidate.candidate_profile;
            const techSkills = profile?.skills?.technical || [];

            return (
              <div
                key={candidate._id}
                className="bg-white border border-slate-200 hover:border-[#10B981] rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Row: Avatar Initials, Name & Match Meter */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-300 flex-shrink-0">
                        {profile?.name ? String(profile.name).charAt(0) : 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 tracking-tight group-hover:text-[#059669] transition-colors line-clamp-1">
                          {String(profile?.name || 'Unnamed Candidate')}
                        </h3>
                        
                        {/* SEPARATED ROLE AND COMPANY DISPLAY */}
                        <div className="space-y-0.5 mt-0.5">
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 line-clamp-1">
                            <Briefcase className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                            <span>{safeString(candidate.target_role, 'Software Role')}</span>
                          </p>
                          {candidate.target_company && (
                            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 line-clamp-1">
                              <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{safeString(candidate.target_company)}</span>
                            </p>
                          )}
                        </div>

                      </div>
                    </div>

                    <ScoreGauge score={overallScore} size="sm" showLabel={false} />
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                      shortlisted
                        ? 'bg-emerald-50 border-emerald-300 text-[#059669]'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}>
                      {shortlisted ? 'Shortlisted' : 'Under Review'}
                    </span>

                    {Boolean(profile?.total_years_experience) ? (
                      <span className="text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
                        {safeString(profile.total_years_experience)} Exp
                      </span>
                    ) : null}

                    <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#10B981]" />
                      {safeString(candidate.provider_used, 'AI')}
                    </span>
                  </div>

                  {/* Skills Badges */}
                  <div className="mb-4">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Key Skills Extracted</p>
                    <div className="flex flex-wrap gap-1.5">
                        {techSkills.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          className="bg-emerald-50 border border-emerald-200 text-[#059669] text-[11px] font-semibold px-2.5 py-0.5 rounded-lg"
                        >
                          {safeString(skill)}
                        </span>
                      ))}
                      {techSkills.length > 5 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center">
                          +{techSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Justification Snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 italic mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    "{safeString(candidate.evaluation?.justification, 'Evaluation completed by AI ATS Screener.')}"
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center text-slate-500 gap-1.5 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="truncate max-w-[110px]" title={safeString(candidate.filename)}>{safeString(candidate.filename)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDeleteCandidate(candidate._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onSelectCandidate(candidate)}
                      className="flex items-center space-x-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm border border-emerald-400 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Deep Dive</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* EXCEL EXPORT OPTIONS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Export Candidate Spreadsheet</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Shortlist Filter Checkbox */}
              <label className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportShortlistedOnly}
                  onChange={(e) => setExportShortlistedOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#10B981] rounded cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Export Shortlisted Candidates Only</span>
                  <span className="text-slate-500 text-[11px] block">Uncheck to include candidates under review</span>
                </div>
              </label>

              {/* Target Role Dropdown */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Filter by Target Role</label>
                <select
                  value={exportRole}
                  onChange={(e) => setExportRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#10B981]"
                >
                  <option value="all">All Target Roles ({uniqueRoles.length})</option>
                  {uniqueRoles.map((role, i) => (
                    <option key={i} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Target Company Dropdown */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Filter by Target Company</label>
                <select
                  value={exportCompany}
                  onChange={(e) => setExportCompany(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#10B981]"
                >
                  <option value="all">All Target Companies ({uniqueCompanies.length})</option>
                  {uniqueCompanies.map((comp, i) => (
                    <option key={i} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeExcelExport}
                className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel (.CSV)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
