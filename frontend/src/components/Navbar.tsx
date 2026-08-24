import React, { useState } from 'react';
import { Sparkles, FileText, Award, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { AuthModal } from './AuthModal';

interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
}

interface NavbarProps {
  activeTab: string;
  onTabChange?: (tab: any) => void;
  setActiveTab?: (tab: any) => void;
  candidateCount: number;
  shortlistedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, setActiveTab, candidateCount }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('smart_resume_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleTabSelect = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    if (setActiveTab) setActiveTab(tab);
  };

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setUser(userProfile);
    localStorage.setItem('smart_resume_user', JSON.stringify(userProfile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smart_resume_user');
    setShowUserDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* HIRELENS Enhancv Emerald Mint Brand Logo */}
            <div 
              onClick={() => handleTabSelect('upload')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {/* Rounded Container with Mint Emerald Gradient */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10B981] via-[#059669] to-[#047857] p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all flex-shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#10B981] group-hover:rotate-12 transition-all" />
                </div>
              </div>
              
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  HireLens <span className="text-xs bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold px-2 py-0.5 rounded-lg shadow-sm">ATS</span>
                </span>
                <span className="text-[10px] text-[#059669] font-extrabold block tracking-widest uppercase -mt-0.5">
                  AI RESUME CHECKER & SCREENER
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl shadow-inner">
              <button
                onClick={() => handleTabSelect('upload')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Screen & Match</span>
              </button>

              <button
                onClick={() => handleTabSelect('candidates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all relative ${
                  activeTab === 'candidates'
                    ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Candidate Pipeline</span>
                {candidateCount > 0 && (
                  <span className="ml-1 bg-emerald-100 text-[#059669] border border-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {candidateCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-2xl transition-all shadow-sm"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-xl object-cover border border-emerald-500/40"
                    />
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-extrabold text-slate-800 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">{user.provider === 'google' ? 'Google Account' : 'Verified Recruiter'}</p>
                    </div>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-black text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Recruiter Login</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};
