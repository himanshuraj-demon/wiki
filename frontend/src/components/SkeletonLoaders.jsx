import React from 'react';

export const ArticleSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Title */}
      <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
      
      {/* Metadata bar */}
      <div className="flex gap-4 border-b border-gray-100 dark:border-slate-800 pb-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-32"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16"></div>
      </div>

      {/* Banner */}
      <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-xl w-full"></div>

      {/* Body text paragraphs */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-5/6"></div>
      </div>

      <div className="space-y-3 pt-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-4/5"></div>
      </div>
    </div>
  );
};

export const GridSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="h-48 bg-gray-200 dark:bg-slate-800 rounded-xl p-4 space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded w-2/3"></div>
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-1/2 pt-2"></div>
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-slate-800">
          <div className="h-12 w-12 bg-gray-200 dark:bg-slate-800 rounded-lg shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
