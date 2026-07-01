import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';

export const Register = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 p-8 border border-[#a2a9b1] bg-white dark:border-slate-800 dark:bg-slate-950 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-iitgn-maroon dark:bg-red-950/20 dark:text-red-400">
          <UserPlus className="h-6 w-6" />
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-serif">
          Registration is Automatic
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          IITGN Wiki now uses **Google Sign-In** for all authentication. Manual account registration is no longer required.
        </p>
        
        <p className="text-xs text-gray-405 dark:text-slate-500">
          Signing in with your Google account for the first time will automatically create and register your Student Editor profile.
        </p>
        
        <div className="pt-4">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white py-2.5 text-sm font-semibold transition-all shadow-sm"
          >
            Go to Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
