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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-[#FFEDD5] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#C2410C] hover:text-[#9A3412] rounded-xl hover:bg-[#FFF8F5] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F97316] via-[#FB923C] to-[#EC4899] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#F97316]/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[#9A3412] tracking-tight">Recruiter Account</h2>
          <p className="text-xs text-[#C2410C] font-medium">
            Sign in or create an account with username & password
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl p-1 text-xs">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`flex-1 py-2 rounded-xl font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow'
                : 'text-[#C2410C] hover:text-[#9A3412]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`flex-1 py-2 rounded-xl font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white shadow'
                : 'text-[#C2410C] hover:text-[#9A3412]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-700 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-bold text-[#9A3412] block mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#C2410C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#9A3412] focus:outline-none focus:border-[#F97316] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A3412] block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C2410C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#9A3412] focus:outline-none focus:border-[#F97316] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-lg shadow-[#F97316]/30 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* TAB 2: SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-[#9A3412] block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Jane Recruiter"
                className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl px-4 py-2 text-xs text-[#9A3412] focus:outline-none focus:border-[#F97316] font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A3412] block mb-1">Username</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#C2410C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="janedoe"
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#9A3412] focus:outline-none focus:border-[#F97316] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A3412] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#C2410C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#9A3412] focus:outline-none focus:border-[#F97316] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#9A3412] block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#C2410C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-[#FFF8F5] border border-[#FFEDD5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#9A3412] focus:outline-none focus:border-[#F97316] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-lg shadow-[#F97316]/30 flex items-center justify-center space-x-2 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-[#C2410C] flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Password Authentication</span>
        </div>

      </div>
    </div>
  );
};
