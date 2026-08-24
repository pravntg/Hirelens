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
      <header className="sticky top-0 z-40 bg-[#0A0A0E]/90 backdrop-blur-2xl border-b border-[#FF1744]/25 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* RESUMIND Crimson Brand Logo */}
            <div 
              onClick={() => handleTabSelect('upload')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {/* Rounded Squircle Container with Crimson Katana Gradient */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF1744] via-[#E60039] to-[#900C3F] p-0.5 shadow-lg shadow-[#FF1744]/30 group-hover:scale-105 transition-all flex-shrink-0">
                <div className="w-full h-full bg-[#0F0F16] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#FF1744] drop-shadow-[0_0_8px_rgba(255,23,68,0.8)] group-hover:rotate-12 transition-all" />
                </div>
              </div>
              
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  RESUMIND <span className="text-xs bg-gradient-to-r from-[#FF1744] via-[#FF5252] to-[#D50000] bg-clip-text text-transparent font-extrabold px-2 py-0.5 bg-[#FF1744]/10 rounded-lg border border-[#FF1744]/30">ATS</span>
                </span>
                <span className="text-[10px] text-[#FF1744] font-extrabold block tracking-widest uppercase -mt-0.5 drop-shadow-[0_0_6px_rgba(255,23,68,0.6)]">
                  CRIMSON AI SCREENER
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center space-x-2 bg-[#12121A]/80 border border-[#FF1744]/20 p-1.5 rounded-2xl shadow-inner">
              <button
                onClick={() => handleTabSelect('upload')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-lg shadow-[#FF1744]/40 border border-[#FF5252]/40'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A1A26]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Screen & Match</span>
              </button>

              <button
                onClick={() => handleTabSelect('candidates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all relative ${
                  activeTab === 'candidates'
                    ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-lg shadow-[#FF1744]/40 border border-[#FF5252]/40'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A1A26]'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Candidate Pipeline</span>
                {candidateCount > 0 && (
                  <span className="ml-1 bg-[#FF1744]/20 text-[#FF5252] border border-[#FF1744]/40 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(255,23,68,0.4)]">
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
                    className="flex items-center space-x-2.5 bg-[#12121A] hover:bg-[#1A1A26] border border-[#FF1744]/30 px-3 py-1.5 rounded-2xl transition-all shadow-sm"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-xl object-cover border border-[#FF1744]/50"
                    />
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-white line-clamp-1">{user.name}</p>
                      <p className="text-[10px] text-[#FF5252] flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        @{user.username || 'signed_in'}
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#12121A] border border-[#FF1744]/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in duration-150">
                      <div className="px-3 py-2 border-b border-[#FF1744]/20">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">@{user.username || user.email}</p>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full mt-1 flex items-center space-x-2 px-3 py-2 text-xs font-bold text-[#FF5252] hover:bg-[#FF1744]/10 rounded-xl transition-all"
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
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#FF1744] via-[#E60039] to-[#D50000] hover:from-[#E60039] hover:to-[#FF1744] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-[#FF1744]/40 border border-[#FF5252]/40"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Sign Up</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};
