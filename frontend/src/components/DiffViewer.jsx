import React from 'react';
import { Plus, Minus, ArrowLeftRight } from 'lucide-react';

/**
 * Computes line-by-line diff using Longest Common Subsequence (LCS) algorithm
 */
const diffLines = (oldText = '', newText = '') => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const m = oldLines.length;
  const n = newLines.length;

  // Initialize DP table
  const dp = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find differences
  const diffs = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffs.unshift({ type: 'unchanged', text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.unshift({ type: 'added', text: newLines[j - 1] });
      j--;
    } else {
      diffs.unshift({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }

  return diffs;
};

export const DiffViewer = ({ oldText = '', newText = '', oldVersion = 'A', newVersion = 'B' }) => {
  const diffs = diffLines(oldText, newText);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden dark:border-slate-800 dark:bg-slate-900/50">
      
      {/* Header Info */}
      <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700">
        <ArrowLeftRight className="h-4 w-4 text-iitgn-maroon dark:text-red-400" />
        <span>Comparing Version {oldVersion} (Removed) vs. Version {newVersion} (Added)</span>
      </div>

      {/* Diff Output */}
      <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
        <div className="space-y-0.5 min-w-[600px]">
          {diffs.map((line, idx) => {
            if (line.type === 'added') {
              return (
                <div key={idx} className="flex bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 py-0.5 px-2 rounded border-l-4 border-emerald-500">
                  <span className="w-6 select-none text-emerald-400 font-bold flex items-center shrink-0">
                    <Plus className="h-3 w-3" />
                  </span>
                  <pre className="whitespace-pre-wrap break-all font-mono">{line.text || ' '}</pre>
                </div>
              );
            }
            if (line.type === 'removed') {
              return (
                <div key={idx} className="flex bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 py-0.5 px-2 rounded border-l-4 border-rose-500">
                  <span className="w-6 select-none text-rose-400 font-bold flex items-center shrink-0">
                    <Minus className="h-3 w-3" />
                  </span>
                  <pre className="whitespace-pre-wrap break-all font-mono">{line.text || ' '}</pre>
                </div>
              );
            }
            // Unchanged line
            return (
              <div key={idx} className="flex text-gray-600 dark:text-slate-400 py-0.5 px-2">
                <span className="w-6 select-none text-gray-300 dark:text-slate-600 shrink-0"> </span>
                <pre className="whitespace-pre-wrap break-all font-mono">{line.text || ' '}</pre>
              </div>
            );
          })}

          {diffs.length === 0 && (
            <p className="text-gray-400 italic text-center py-6">No differences detected between these versions.</p>
          )}
        </div>
      </div>

      {/* Colors Legend */}
      <div className="flex gap-4 px-4 py-2 border-t border-gray-150 bg-gray-50/50 text-xs text-gray-505 dark:border-slate-800 dark:bg-slate-900/20">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-rose-500"></span> Removed line</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-500"></span> Added line</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-gray-300 dark:bg-slate-600"></span> Unchanged line</span>
      </div>

    </div>
  );
};

export default DiffViewer;
