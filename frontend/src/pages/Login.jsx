import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleGoogleSuccess = async (response) => {
    if (response.credential) {
      const res = await loginWithGoogle(response.credential);
      if (res.success) {
        toast.success('Logged in successfully!');
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || 'Google authentication failed');
      }
    }
  };

  const handleDevBypass = async (mockToken, label) => {
    const res = await loginWithGoogle(mockToken);
    if (res.success) {
      toast.success(`Logged in as ${label}!`);
      navigate(from, { replace: true });
    } else {
      toast.error('Mock authentication failed');
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 p-8 border border-[#a2a9b1] bg-white dark:border-slate-800 dark:bg-slate-950">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-iitgn-maroon dark:bg-red-950/20 dark:text-red-400">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-serif">
            Sign in to IITGN Wiki
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Please log in to edit articles, submit comments, or bookmark pages.
          </p>
        </div>

        {/* Google OAuth Login Button */}
        <div className="flex justify-center border-t border-gray-200 dark:border-slate-800 pt-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Sign-In failed')}
            useOneTap
          />
        </div>

        {/* Local Development Bypass */}
        <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Local Dev Bypass
          </div>
          <p className="text-[11px] text-center text-gray-400 dark:text-slate-500">
            Instantly authenticate local seeded roles without configuring Google credentials.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleDevBypass('mock-google-token-admin', 'Admin')}
              className="px-2 py-1.5 text-[11px] font-bold text-white bg-iitgn-maroon hover:bg-iitgn-maroon-dark rounded transition-colors text-center"
            >
              Admin
            </button>
            <button
              onClick={() => handleDevBypass('mock-google-token-moderator', 'Moderator')}
              className="px-2 py-1.5 text-[11px] font-bold text-gray-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/20 dark:text-amber-300 rounded transition-colors text-center"
            >
              Moderator
            </button>
            <button
              onClick={() => handleDevBypass('mock-google-token-student', 'Student')}
              className="px-2 py-1.5 text-[11px] font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 rounded transition-colors text-center"
            >
              Student
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
