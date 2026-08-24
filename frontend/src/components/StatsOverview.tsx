import React from 'react';
import { Users, CheckCircle2, Award, TrendingUp } from 'lucide-react';
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
      
      {/* Total Applications */}
      <div className="cyber-card rounded-3xl p-6 transition-all duration-300 group hover:translate-y-[-2px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>Total Applications</span>
            </p>
            <p className="text-3xl font-black text-white mt-1 tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Screened resumes in DB</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center text-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.3)]">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Shortlisted Candidates */}
      <div className="cyber-card rounded-3xl p-6 transition-all duration-300 group hover:translate-y-[-2px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Shortlisted Candidates</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">{shortlisted}</span>
              <span className="text-xs font-bold text-emerald-400/80">({shortlistRate}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Score &ge; 70% match threshold</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Average ATS Score */}
      <div className="cyber-card rounded-3xl p-6 transition-all duration-300 group hover:translate-y-[-2px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Average ATS Score</p>
            <p className="text-3xl font-black text-amber-400 mt-1 tracking-tight drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">{avgScore}%</p>
            <p className="text-xs text-slate-500 mt-1">Weighted semantic match</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Candidate Fit */}
      <div className="cyber-card rounded-3xl p-6 transition-all duration-300 group hover:translate-y-[-2px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Candidate Fit</p>
            <p className="text-3xl font-black text-[#FF5252] mt-1 tracking-tight drop-shadow-[0_0_12px_rgba(255,82,82,0.5)]">{topMatchScore}%</p>
            <p className="text-xs text-slate-500 mt-1">Highest candidate fit score</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FF1744]/15 border border-[#FF1744]/30 flex items-center justify-center text-[#FF5252] shadow-[0_0_12px_rgba(255,23,68,0.3)]">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

    </div>
  );
};
