import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Bell, User, LogOut, LayoutDashboard, Settings, Menu, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';
import useDarkMode from '../hooks/useDarkMode.js';
import api from '../utils/api.js';

export const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { dashboard } = useDashboard();
  const [isDark, toggleDarkMode] = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const notifications = dashboard?.notifications?.filter(n => !n.readStatus) || [];

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch search suggestions
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        if (data.success) {
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.error(err);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery]);



  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (slug) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/articles/${slug}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#a2a9b1] bg-white/95 dark:border-slate-850 dark:bg-slate-950/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Brand Logo and Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            {/* IITGN logo shape */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-iitgn-maroon text-white font-bold text-lg font-serif">
              W
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-xl font-bold tracking-tight text-iitgn-maroon dark:text-red-500">
                IITGN
              </span>
              <span className="ml-1 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Wiki
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-lg mx-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search IITGN Wiki..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-4 pr-12 text-sm outline-none transition-all focus:border-iitgn-maroon focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:focus:border-red-500 dark:focus:bg-slate-950 dark:text-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-iitgn-maroon border-t-transparent dark:border-red-500"></div>
              )}
              <button
                type="submit"
                className="text-gray-400 hover:text-iitgn-maroon dark:hover:text-red-500"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50">
              {searchLoading ? (
                <div className="flex items-center justify-center py-4 text-xs text-gray-500 dark:text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-iitgn-maroon border-t-transparent dark:border-red-500 mr-2"></div>
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Search Suggestions
                  </p>
                  <ul className="space-y-1">
                    {suggestions.map((s) => (
                      <li key={s.slug}>
                        <button
                          onClick={() => handleSuggestionClick(s.slug)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{s.title}</span>
                          <span className="text-xs text-iitgn-maroon dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                            {s.category}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="px-3 py-4 text-center text-xs text-gray-550 dark:text-slate-400">
                  No suggestions found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Quick Tools */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Dark Mode Toggler */}
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications Bell */}
          {user && (
            <Link
              to="/dashboard?tab=notifications"
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </Link>
          )}

          {/* User Profile Dropdown */}
          <div ref={userMenuRef} className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 p-1 pr-3 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 md:block max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    
                    <ul className="space-y-1">
                      <li>
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          User Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={`/profile/${user.email}`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                        >
                          <User className="h-4 w-4" />
                          View Profile
                        </Link>
                      </li>

                      {/* Admin Links */}
                      {(user.role === 'Admin' || user.role === 'Moderator') && (
                        <li>
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-iitgn-maroon dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40"
                          >
                            <ShieldAlert className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        </li>
                      )}

                      <li className="border-t border-gray-100 dark:border-slate-800 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800 sm:block"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
