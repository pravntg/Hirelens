import React from 'react';
import { Users, CheckCircle2, Award, TrendingUp, Sparkles } from 'lucide-react';
import { Candidate } from '../types';

interface StatsOverviewProps {
  candidates: Candidate[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ candidates }) => {
  const total = candidates.length;
  const shortlisted = candidates.filter(c => c.evaluation?.shortlisted).length;
  const shortlistRate = total > 0 ? Math.round((shortlisted / total) * 100) : 0;
  
  const avgScore = total > 0
    ? ((candidates.reduce((acc, c) => acc + (c.evaluation?.overall_score || 0), 0) / total) * 10).toFixed(0)
    : '0';

  const topMatchScore = total > 0
    ? Math.max(...candidates.map(c => c.evaluation?.overall_score || 0)) * 10
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      
      {/* Total Candidates Screened */}
      <div className="relative overflow-hidden bg-white border border-[#FCE7F3] hover:border-[#EC4899]/60 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#9F1239] uppercase tracking-widest flex items-center gap-1.5">
              <span>Total Applications</span>
            </p>
            <p className="text-3xl font-black text-[#831843] mt-1 tracking-tight">{total}</p>
            <p className="text-xs text-[#9F1239]/70 mt-1">Screened resumes in DB</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/15 border border-[#F472B6]/30 flex items-center justify-center text-[#EC4899] shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Shortlisted Candidates */}
      <div className="relative overflow-hidden bg-white border border-[#FCE7F3] hover:border-emerald-400 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#9F1239] uppercase tracking-widest">Shortlisted Candidates</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">{shortlisted}</span>
              <span className="text-xs font-bold text-emerald-600/80">({shortlistRate}%)</span>
            </div>
            <p className="text-xs text-[#9F1239]/70 mt-1">Score &ge; 70% match threshold</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Average Fit Score */}
      <div className="relative overflow-hidden bg-white border border-[#FCE7F3] hover:border-amber-400 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#9F1239] uppercase tracking-widest">Average ATS Score</p>
            <p className="text-3xl font-black text-amber-600 mt-1 tracking-tight">{avgScore}%</p>
            <p className="text-xs text-[#9F1239]/70 mt-1">Weighted semantic match</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Candidate Fit */}
      <div className="relative overflow-hidden bg-white border border-[#FCE7F3] hover:border-[#EC4899] rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#9F1239] uppercase tracking-widest">Top Candidate Fit</p>
            <p className="text-3xl font-black text-[#EC4899] mt-1 tracking-tight">{topMatchScore}%</p>
            <p className="text-xs text-[#9F1239]/70 mt-1">Highest candidate fit score</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/15 border border-[#F472B6]/30 flex items-center justify-center text-[#EC4899] shadow-inner">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

    </div>
  );
};
