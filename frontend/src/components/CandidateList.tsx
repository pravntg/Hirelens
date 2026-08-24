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
        `"${String(profile?.current_or_latest_role || c.target_role || 'N/A').replace(/"/g, '""')}"`,
        `"${String(profile?.current_or_latest_company || c.target_company || 'N/A').replace(/"/g, '""')}"`,
        `"${String(profile?.total_years_experience || '0').replace(/"/g, '""')}"`,
        `"${String(education.degree || 'N/A').replace(/"/g, '""')}"`,
        `"${String(education.institution || 'N/A').replace(/"/g, '""')}"`,
        `"${techSkills.join(', ').replace(/"/g, '""')}"`,
        `"${certs.join(', ').replace(/"/g, '""')}"`,
        `${fitScorePct}`,
        `"${String(c.evaluation?.ai_summary || c.evaluation?.justification || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `candidates_ats_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', fileName);
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
          <h2 className="text-2xl font-black text-[#9A3412] tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-[#F97316]" />
            Candidate Directory & Leaderboard
          </h2>
          <p className="text-xs text-[#C2410C] mt-1">Filter by status, search by role or company, and export custom role/company spreadsheets to Excel.</p>
        </div>

        {/* Resumind Warm Orange Excel Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#F97316]/25"
        >
          <Download className="w-4 h-4" />
          <span>Export to Excel / CSV</span>
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-[#FFEDD5] rounded-3xl p-4 sm:p-5 shadow-lg shadow-[#F97316]/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#C2410C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, role, company, or skill..."
            className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#9A3412] placeholder:text-[#C2410C]/60 focus:outline-none focus:border-[#F97316] font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl p-1.5 text-xs w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'all' ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow' : 'text-[#C2410C] hover:text-[#9A3412]'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            onClick={() => setStatusFilter('shortlisted')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === 'shortlisted' ? 'bg-emerald-600 text-white shadow' : 'text-[#C2410C] hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Shortlisted ({candidates.filter(c => c.evaluation?.shortlisted).length})
          </button>
          <button
            onClick={() => setStatusFilter('under_review')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'under_review' ? 'bg-[#F97316] text-white font-black shadow' : 'text-[#C2410C] hover:text-[#F97316]'
            }`}
          >
            Under Review ({candidates.filter(c => !c.evaluation?.shortlisted).length})
          </button>
        </div>

        {/* Min Score Slider */}
        <div className="flex items-center space-x-3 text-xs text-[#9A3412] w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#F97316]" />
          <span className="font-semibold">Min Score: <strong className="text-[#9A3412] font-extrabold">{minScore * 10}%</strong></span>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-[#F97316] bg-[#FFF8F5]"
          />
        </div>

      </div>

      {/* Candidate Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white border border-[#FFEDD5] rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-lg shadow-[#F97316]/5">
          <div className="w-14 h-14 rounded-2xl bg-[#F97316]/15 border border-[#FB923C]/30 flex items-center justify-center mx-auto text-[#F97316] mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#9A3412]">No Candidates Found</h3>
          <p className="text-xs text-[#C2410C] mt-1">
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
                className="bg-white border border-[#FFEDD5] hover:border-[#F97316]/60 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Row: Avatar Initials, Name & Match Meter */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F97316] via-[#FB923C] to-[#EC4899] text-white font-black text-lg flex items-center justify-center shadow-md shadow-[#F97316]/20 flex-shrink-0">
                        {profile?.name ? String(profile.name).charAt(0) : 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#9A3412] tracking-tight group-hover:text-[#F97316] transition-colors line-clamp-1">
                          {String(profile?.name || 'Unnamed Candidate')}
                        </h3>
                        
                        {/* SEPARATED ROLE AND COMPANY DISPLAY */}
                        <div className="space-y-0.5 mt-0.5">
                          <p className="text-xs font-semibold text-[#9A3412] flex items-center gap-1 line-clamp-1">
                            <Briefcase className="w-3 h-3 text-[#F97316] flex-shrink-0" />
                            <span>{safeString(candidate.target_role, 'Software Role')}</span>
                          </p>
                          {candidate.target_company && (
                            <p className="text-[11px] font-medium text-[#C2410C] flex items-center gap-1 line-clamp-1">
                              <Building2 className="w-3 h-3 text-[#FB923C] flex-shrink-0" />
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
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-[#FFEDD5] border-[#FB923C]/40 text-[#C2410C]'
                    }`}>
                      {shortlisted ? 'Shortlisted' : 'Under Review'}
                    </span>

                    {profile?.total_years_experience && (
                      <span className="text-[11px] font-semibold bg-[#FFF8F5] border border-[#FFEDD5] text-[#9A3412] px-2.5 py-1 rounded-full">
                        {safeString(profile.total_years_experience)} Exp
                      </span>
                    )}

                    <span className="text-[11px] text-[#C2410C] bg-[#FFF8F5] border border-[#FFEDD5] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#F97316]" />
                      {safeString(candidate.provider_used, 'AI')}
                    </span>
                  </div>

                  {/* Skills Badges */}
                  <div className="mb-4">
                    <p className="text-[10px] font-extrabold text-[#C2410C]/70 uppercase tracking-widest mb-2">Key Skills Extracted</p>
                    <div className="flex flex-wrap gap-1.5">
                        {techSkills.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          className="bg-[#FFEDD5] border border-[#FB923C]/30 text-[#C2410C] text-[11px] font-semibold px-2.5 py-0.5 rounded-lg"
                        >
                          {safeString(skill)}
                        </span>
                      ))}
                      {techSkills.length > 5 && (
                        <span className="text-[10px] text-[#C2410C] font-bold self-center">
                          +{techSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Justification Snippet */}
                  <p className="text-xs text-[#9A3412] line-clamp-2 italic mb-4 bg-[#FFF8F5] p-3 rounded-2xl border border-[#FFEDD5]">
                    "{safeString(candidate.evaluation?.justification, 'Evaluation completed by AI ATS Screener.')}"
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-[#FFEDD5] flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center text-[#C2410C] gap-1.5 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-[#F97316]" />
                    <span className="truncate max-w-[110px]" title={safeString(candidate.filename)}>{safeString(candidate.filename)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDeleteCandidate(candidate._id)}
                      className="p-2 text-[#C2410C] hover:text-[#F97316] hover:bg-[#FFEDD5] rounded-xl transition-all"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onSelectCandidate(candidate)}
                      className="flex items-center space-x-1.5 bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] text-white font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-[#F97316]/20 text-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFEDD5] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-[#FFEDD5] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 border border-[#FB923C]/30 text-[#F97316] flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#9A3412] text-base">Export to Excel / CSV</h3>
                  <p className="text-xs text-[#C2410C]">Configure role & company export filters</p>
                </div>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 text-[#C2410C] hover:text-[#9A3412] rounded-xl hover:bg-[#FFF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#9A3412] mb-1.5 block">Filter by Target Role:</label>
                <select
                  value={exportRole}
                  onChange={(e) => setExportRole(e.target.value)}
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl px-3.5 py-2.5 text-xs text-[#9A3412] font-semibold focus:outline-none focus:border-[#F97316]"
                >
                  <option value="all">All Roles ({candidates.length} candidates)</option>
                  {uniqueRoles.map((role, idx) => (
                    <option key={idx} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#9A3412] mb-1.5 block">Filter by Target Company:</label>
                <select
                  value={exportCompany}
                  onChange={(e) => setExportCompany(e.target.value)}
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl px-3.5 py-2.5 text-xs text-[#9A3412] font-semibold focus:outline-none focus:border-[#F97316]"
                >
                  <option value="all">All Companies</option>
                  {uniqueCompanies.map((comp, idx) => (
                    <option key={idx} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2 bg-[#FFF8F5] p-3 rounded-xl border border-[#FFEDD5]">
                <input
                  type="checkbox"
                  id="shortlistedOnlyToggle"
                  checked={exportShortlistedOnly}
                  onChange={(e) => setExportShortlistedOnly(e.target.checked)}
                  className="accent-[#F97316] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="shortlistedOnlyToggle" className="font-bold text-[#9A3412] cursor-pointer">
                  Export Shortlisted Candidates Only (Score &ge; 70%)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 font-semibold text-[#C2410C] hover:text-[#9A3412] text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeExcelExport}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#F97316]/25"
              >
                <Download className="w-4 h-4" />
                <span>Download Spreadsheet (.csv/.xlsx)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
