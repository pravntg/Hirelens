import React, { useState } from 'react';
import { X, Sparkles, User, Lock, Mail, ArrowRight, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { safeString } from '../utils/sanitize';
import axios from 'axios';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up form state
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/auth/login', {
        usernameOrEmail: loginIdentifier.trim(),
        password: loginPassword
      });

      onLoginSuccess(res.data.user);
      onClose();
    } catch (err: any) {
      console.error(err);
      const rawErr = err.response?.data?.error;
      const errMsg = typeof rawErr === 'string'
        ? rawErr
        : (rawErr?.message || err.message || 'Invalid username/email or password.');
      setError(safeString(errMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (signupPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/auth/signup', {
        name: signupName.trim(),
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        password: signupPassword
      });

      onLoginSuccess(res.data.user);
      onClose();
    } catch (err: any) {
      console.error(err);
      const rawErr = err.response?.data?.error;
      const errMsg = typeof rawErr === 'string'
        ? rawErr
        : (rawErr?.message || err.message || 'Failed to create account.');
      setError(safeString(errMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="cyber-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1A1A26] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF1744] via-[#E60039] to-[#900C3F] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#FF1744]/30 border border-[#FF5252]/40">
            <Sparkles className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,23,68,0.4)]">Recruiter Account</h2>
          <p className="text-xs text-slate-400 font-medium">
            Sign in or create an account with username & password
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0D0D14] border border-[#FF1744]/30 rounded-2xl p-1 text-xs">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`flex-1 py-2 rounded-xl font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-md shadow-[#FF1744]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`flex-1 py-2 rounded-xl font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white shadow-md shadow-[#FF1744]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 text-rose-300 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#FF5252] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#FF5252] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF1744] to-[#D50000] hover:from-[#E60039] hover:to-[#FF1744] text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-lg shadow-[#FF1744]/30 border border-[#FF5252]/40 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* TAB 2: SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Jane Recruiter"
                className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744] font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">Username</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#FF5252] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="janedoe"
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#FF5252] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#FF5252] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-[#0D0D14] border border-[#FF1744]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF1744] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF1744] to-[#D50000] hover:from-[#E60039] hover:to-[#FF1744] text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-lg shadow-[#FF1744]/30 border border-[#FF5252]/40 flex items-center justify-center space-x-2 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Password Authentication</span>
        </div>

      </div>
    </div>
  );
};
