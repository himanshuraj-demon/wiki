import { useEffect, useState } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check local storage or fallback to system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) {
        return stored === 'dark';
      }
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
      return systemPreference.matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  return [isDark, toggleDarkMode];
};

export default useDarkMode;
