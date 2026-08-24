import React, { useState } from 'react';
import { Sparkles, FileText, Award, LogIn, LogOut, User, CheckCircle2 } from 'lucide-react';
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-[#FDBA74]/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* RESUMIND Brand Logo matching User Image 1 */}
            <div 
              onClick={() => handleTabSelect('upload')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {/* Rounded Squircle Container with Gradient Border */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#EC4899] p-0.5 shadow-lg shadow-[#EA580C]/20 group-hover:scale-105 transition-all flex-shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#EA580C] group-hover:rotate-12 transition-all" />
                </div>
              </div>
              
              <div>
                <span className="text-xl font-black tracking-tight text-[#7C2D12] flex items-center gap-1">
                  RESUMIND <span className="text-xs bg-gradient-to-r from-[#EA580C] to-[#EC4899] bg-clip-text text-transparent font-extrabold ml-0.5">ATS</span>
                </span>
                <span className="text-[10px] text-[#EA580C] font-extrabold block tracking-wider uppercase -mt-0.5">
                  AI APPLICANT SCREENER
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center space-x-2 bg-[#FFF7ED] border border-[#FDBA74]/50 p-1.5 rounded-2xl shadow-inner">
              <button
                onClick={() => handleTabSelect('upload')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white shadow-md shadow-[#EA580C]/30'
                    : 'text-[#9A3412] hover:text-[#7C2D12] hover:bg-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Screen & Match</span>
              </button>

              <button
                onClick={() => handleTabSelect('candidates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all relative ${
                  activeTab === 'candidates'
                    ? 'bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white shadow-md shadow-[#EA580C]/30'
                    : 'text-[#9A3412] hover:text-[#7C2D12] hover:bg-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Candidate Pipeline</span>
                {candidateCount > 0 && (
                  <span className="ml-1 bg-[#EA580C]/20 text-[#EA580C] border border-[#EA580C]/30 text-[10px] font-black px-1.5 py-0.5 rounded-full">
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
                    className="flex items-center space-x-2.5 bg-white hover:bg-[#FFF7ED] border border-[#FDBA74]/50 px-3 py-1.5 rounded-2xl transition-all shadow-sm"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-xl object-cover border border-[#EA580C]/50"
                    />
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-[#7C2D12] line-clamp-1">{user.name}</p>
                      <p className="text-[10px] text-[#EA580C] flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        @{user.username || 'signed_in'}
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#FDBA74]/50 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in duration-150">
                      <div className="px-3 py-2 border-b border-[#FFEDD5]">
                        <p className="text-xs font-bold text-[#7C2D12] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#9A3412] truncate">@{user.username || user.email}</p>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full mt-1 flex items-center space-x-2 px-3 py-2 text-xs font-bold text-[#EA580C] hover:bg-[#FFF7ED] rounded-xl transition-all"
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
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-[#EA580C]/30"
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
