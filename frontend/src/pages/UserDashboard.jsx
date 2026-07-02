import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, FileText, Bookmark, History, 
  Bell, Settings, Save, CheckCircle2, ChevronRight, Eye, Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';
import api from '../utils/api.js';

export const UserDashboard = () => {
  const { user, updateLocalUser, getCachedProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview'; // 'overview', 'articles', 'drafts', 'bookmarks', 'notifications', 'profile'

  const { dashboard: dashboardData, refreshDashboard, loading: dashboardLoading } = useDashboard();
  const [profileSaving, setProfileSaving] = useState(false);

  const { register: profileRegister, handleSubmit: handleProfileSubmit, setValue } = useForm();

  // Pre-populate profile fields
  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('avatar', user.avatar);
      setValue('bio', user.bio);
      setValue('department', user.department);
      setValue('batch', user.batch);
      setValue('interests', user.interests?.join(', ') || '');
    }
  }, [user, setValue, dashboardData]);

  useEffect(() => {
    refreshDashboard();
  }, [user, activeTab]);

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const handleMarkNotification = async (id) => {
    try {
      const { data } = await api.patch(`/dashboard/notifications/${id}`);
      if (data.success) {
        refreshDashboard(true);
        toast.success('Notification marked as read');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      const { data } = await api.post('/dashboard/notifications/read-all');
      if (data.success) {
        refreshDashboard(true);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onUpdateProfile = async (data) => {
    setProfileSaving(true);
    try {
      const { data: resData } = await api.patch(`/users/${user._id}`, data);
      if (resData.success) {
        updateLocalUser(resData.user);
        if (getCachedProfile) {
          await getCachedProfile(user.email, true);
        }
        toast.success('Profile details updated successfully!');
        setTab('overview');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile details');
    } finally {
      setProfileSaving(false);
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
      </div>
    );
  }

  const { stats, articles = [], drafts = [], bookmarks = [], notifications = [], editedArticles = [] } = dashboardData || {};

  const unreadNotifications = notifications.filter(n => !n.readStatus);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-iitgn-maroon to-iitgn-maroon-dark text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Welcome, {user.name}!</h1>
          <p className="text-sm text-red-105 mt-1">Manage your contributions, notifications, and profile details</p>
        </div>
        <Link
          to="/editor"
          className="rounded-lg bg-white text-iitgn-maroon font-bold text-sm hover:bg-red-50 px-4 py-2 shadow-md transition-all"
        >
          Create New Article
        </Link>
      </div>

      {/* 2. Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar menu */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/10 space-y-1">
            <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Workspace</h3>
            
            <button
              onClick={() => setTab('overview')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-all
                ${activeTab === 'overview' 
                  ? 'bg-iitgn-maroon text-white shadow' 
                  : 'text-gray-655 hover:bg-gray-105 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              <LayoutDashboard className="h-4.5 w-4.5" /> Dashboard Overview
            </button>

            <button
              onClick={() => setTab('articles')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-all
                ${activeTab === 'articles' 
                  ? 'bg-iitgn-maroon text-white shadow' 
                  : 'text-gray-655 hover:bg-gray-105 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              <BookOpen className="h-4.5 w-4.5" /> My Articles ({articles.length})
            </button>

            <button
              onClick={() => setTab('drafts')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-all
                ${activeTab === 'drafts' 
                  ? 'bg-iitgn-maroon text-white shadow' 
                  : 'text-gray-655 hover:bg-gray-105 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              <FileText className="h-4.5 w-4.5" /> My Drafts ({drafts.length})
            </button>

            <button
              onClick={() => setTab('bookmarks')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-all
                ${activeTab === 'bookmarks' 
                  ? 'bg-iitgn-maroon text-white shadow' 
                  : 'text-gray-655 hover:bg-gray-105 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              <Bookmark className="h-4.5 w-4.5" /> Bookmarks ({bookmarks.length})
            </button>

            <button
              onClick={() => setTab('notifications')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-all
                ${activeTab === 'notifications' 
                  ? 'bg-iitgn-maroon text-white shadow' 
                  : 'text-gray-655 hover:bg-gray-105 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              <span className="flex items-center gap-3">
                <Bell className="h-4.5 w-4.5" /> Notifications
              </span>
              {unreadNotifications.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'notifications' ? 'bg-white text-iitgn-maroon' : 'bg-red-500 text-white'}`}>
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('profile')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-all
                ${activeTab === 'profile' 
                  ? 'bg-iitgn-maroon text-white shadow' 
                  : 'text-gray-655 hover:bg-gray-105 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              <Settings className="h-4.5 w-4.5" /> Edit Profile Details
            </button>

          </div>
        </div>

        {/* Tab content panel */}
        <div className="lg:col-span-3">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.articlesCreatedCount}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages Created</span>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.totalEditsCount}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Edits</span>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.draftsCount}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Drafts</span>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.bookmarksCount}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bookmarks</span>
                </div>
              </div>

              {/* Split SubGrid: Recent Activity & notifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Edited articles history */}
                <div className="p-5 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b pb-2">
                    <History className="h-4.5 w-4.5 text-gray-400" /> Recent Page Edits
                  </h3>
                  
                  <ul className="space-y-3">
                    {editedArticles.slice(0, 5).map((art) => (
                      <li key={art._id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                        <Link to={`/articles/${art.slug}`} className="font-semibold text-gray-800 dark:text-slate-200 hover:underline truncate max-w-[200px]">
                          {art.title}
                        </Link>
                        <span className="text-xs text-gray-450">v{art.version} • {new Date(art.timestamp).toLocaleDateString()}</span>
                      </li>
                    ))}
                    {editedArticles.length === 0 && (
                      <p className="text-xs text-gray-450 italic text-center py-6">No page edits registered yet.</p>
                    )}
                  </ul>
                </div>

                {/* Notifications preview */}
                <div className="p-5 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Bell className="h-4.5 w-4.5 text-gray-400" /> Notifications
                    </h3>
                    <button onClick={() => setTab('notifications')} className="text-xs text-iitgn-maroon hover:underline dark:text-red-400">
                      View all
                    </button>
                  </div>

                  <ul className="space-y-3">
                    {notifications.slice(0, 4).map((notif) => (
                      <li key={notif._id} className={`p-2.5 rounded-lg text-xs flex justify-between gap-3 border
                        ${notif.readStatus 
                          ? 'bg-gray-50 border-gray-150 text-gray-500' 
                          : 'bg-red-50/50 border-red-100 text-gray-850 font-medium'
                        }
                      `}>
                        <Link to={notif.link || '/dashboard'} className="hover:underline">
                          {notif.message}
                        </Link>
                      </li>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-xs text-gray-450 italic text-center py-6">No notifications received.</p>
                    )}
                  </ul>
                </div>

              </div>

            </div>
          )}

          {/* TAB: ARTICLES */}
          {activeTab === 'articles' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-gray-700 text-sm dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-800">
                Created Articles Log
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {articles.map((art) => (
                  <li key={art._id} className="flex justify-between items-center p-4">
                    <div>
                      <Link to={`/articles/${art.slug}`} className="font-bold text-sm text-gray-800 dark:text-slate-200 hover:underline">
                        {art.title}
                      </Link>
                      <span className="block text-xs text-gray-400 mt-1">
                        Category: {art.category?.name} • Updated {new Date(art.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                        ${art.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
                      `}>
                        {art.status}
                      </span>
                      <Link to={`/editor/${art._id}`} className="text-xs font-semibold text-iitgn-maroon hover:underline dark:text-red-400">
                        Edit
                      </Link>
                    </div>
                  </li>
                ))}
                {articles.length === 0 && (
                  <p className="p-8 text-center text-gray-400 italic">No approved or pending pages created yet.</p>
                )}
              </ul>
            </div>
          )}

          {/* TAB: DRAFTS */}
          {activeTab === 'drafts' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-gray-700 text-sm dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-800">
                Draft Wiki Pages
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {drafts.map((art) => (
                  <li key={art._id} className="flex justify-between items-center p-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">{art.title}</h4>
                      <span className="block text-xs text-gray-450 mt-1">
                        Last edited {new Date(art.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <Link
                      to={`/editor/${art._id}`}
                      className="flex items-center gap-1 text-xs font-bold text-iitgn-maroon hover:underline dark:text-red-400"
                    >
                      <Edit className="h-3.5 w-3.5" /> Continue writing
                    </Link>
                  </li>
                ))}
                {drafts.length === 0 && (
                  <p className="p-8 text-center text-gray-400 italic">No active drafts saved.</p>
                )}
              </ul>
            </div>
          )}

          {/* TAB: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-gray-700 text-sm dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-800">
                Bookmarked Encyclopedia Pages
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {bookmarks.map((art) => (
                  <li key={art._id} className="flex justify-between items-center p-4">
                    <div>
                      <Link to={`/articles/${art.slug}`} className="font-bold text-sm text-gray-800 dark:text-slate-200 hover:underline">
                        {art.title}
                      </Link>
                      <span className="block text-xs text-gray-450 mt-1">
                        By {art.author?.name || 'Admin'} • {art.views} views
                      </span>
                    </div>
                    <Link
                      to={`/articles/${art.slug}`}
                      className="text-xs font-bold text-iitgn-maroon hover:underline dark:text-red-400 flex items-center"
                    >
                      Read <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
                {bookmarks.length === 0 && (
                  <p className="p-8 text-center text-gray-400 italic">No bookmarks registered.</p>
                )}
              </ul>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-serif text-gray-850 dark:text-white">All Alerts</h3>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllNotifications}
                    className="text-xs font-semibold text-iitgn-maroon hover:underline dark:text-red-400"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                  {notifications.map((notif) => (
                    <li key={notif._id} className={`p-4 flex justify-between items-start gap-4 hover:bg-gray-50/50
                      ${notif.readStatus ? 'text-gray-400 dark:text-slate-500' : 'bg-red-50/30 dark:bg-red-950/10 text-gray-800 dark:text-slate-200 font-medium'}
                    `}>
                      <div className="space-y-1">
                        <Link to={notif.link || '#'} className="text-sm hover:underline block leading-relaxed">
                          {notif.message}
                        </Link>
                        <span className="block text-[10px] text-gray-400">
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {!notif.readStatus && (
                        <button
                          onClick={() => handleMarkNotification(notif._id)}
                          className="text-xs font-bold text-iitgn-maroon hover:underline dark:text-red-400 shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  ))}
                  {notifications.length === 0 && (
                    <p className="p-8 text-center text-gray-400 italic">No notifications found.</p>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-6">
              <h3 className="text-lg font-bold font-serif text-gray-800 dark:text-white border-b pb-2">
                Edit Biography & Settings
              </h3>

              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
                
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                    Display Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...profileRegister('name', { required: true })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label htmlFor="avatar" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                    Avatar Image URL
                  </label>
                  <input
                    id="avatar"
                    type="text"
                    {...profileRegister('avatar')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                    placeholder="https://example.com/avatar.png"
                  />
                </div>

                {/* Department & Batch Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                      Department
                    </label>
                    <input
                      id="department"
                      type="text"
                      {...profileRegister('department')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="batch" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                      Batch / Year
                    </label>
                    <input
                      id="batch"
                      type="text"
                      {...profileRegister('batch')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                    Short Bio
                  </label>
                  <textarea
                    id="bio"
                    rows="3"
                    {...profileRegister('bio')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Interests */}
                <div>
                  <label htmlFor="interests" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                    Interests (comma separated)
                  </label>
                  <input
                    id="interests"
                    type="text"
                    {...profileRegister('interests')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-5 py-2.5 text-sm font-semibold shadow transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Profile</span>
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default UserDashboard;
