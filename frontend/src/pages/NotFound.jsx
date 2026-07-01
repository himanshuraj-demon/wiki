import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      
      {/* Icon */}
      <div className="h-20 w-20 rounded-full bg-red-50 text-iitgn-maroon flex items-center justify-center dark:bg-red-950/20 dark:text-red-400">
        <HelpCircle className="h-10 w-10 animate-bounce" />
      </div>

      {/* Message */}
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold font-serif text-gray-900 dark:text-white">
          404 - Page Not Found
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed dark:text-slate-400">
          The wiki page or resource you are looking for does not exist. It may have been moved, deleted, or you might have mistyped the URL slug.
        </p>
      </div>

      {/* Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-5 py-2.5 font-semibold text-sm transition-all shadow"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Main Page</span>
      </Link>

    </div>
  );
};

export default NotFound;
