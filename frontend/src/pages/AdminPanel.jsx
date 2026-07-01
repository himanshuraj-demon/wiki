import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  ShieldAlert, BarChart3, UserCheck, AlertOctagon, History, 
  Megaphone, Check, X, Shield, Award, Calendar, Eye, Edit3
} from 'lucide-react';
import api from '../utils/api.js';

export const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics';

  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register: announceRegister, handleSubmit: handleAnnounceSubmit, reset: resetAnnounce } = useForm();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch data based on the active tab to keep API queries efficient
      if (activeTab === 'analytics') {
        const { data } = await api.get('/admin/analytics');
        if (data.success) setAnalytics(data);
      } else if (activeTab === 'pending') {
        const { data } = await api.get('/admin/pending');
        if (data.success) setPending(data.pending || []);
      } else if (activeTab === 'users') {
        const { data } = await api.get('/users');
        if (data.success) setUsers(data.users || []);
      } else if (activeTab === 'reports') {
        const { data } = await api.get('/admin/reports');
        if (data.success) setReports(data.reports || []);
      } else if (activeTab === 'logs') {
        const { data } = await api.get('/admin/logs');
        if (data.success) setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve admin details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Moderation Handlers
  const handleApprove = async (id) => {
    try {
      const { data } = await api.post(`/admin/pending/${id}/approve`);
      if (data.success) {
        toast.success('Article approved successfully!');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please specify why you are rejecting this article submission:');
    if (reason === null) return; // cancelled
    try {
      const { data } = await api.post(`/admin/pending/${id}/reject`, { reason });
      if (data.success) {
        toast.success('Submission rejected and notification sent.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Rejection failed');
    }
  };

  // User Role & Badge Updates
  const handleUpdateRole = async (userId, oldRole) => {
    const roles = ['Guest', 'Student', 'Moderator', 'Admin'];
    const newRole = prompt(`Change role from "${oldRole}". Enter new role: (${roles.join(', ')})`);
    if (!newRole || !roles.includes(newRole)) {
      if (newRole) toast.error('Invalid role specified');
      return;
    }

    try {
      const { data } = await api.patch(`/users/${userId}`, { role: newRole });
      if (data.success) {
        toast.success(`Role updated to ${newRole}`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Role update failed');
    }
  };

  const handleUpdateBadges = async (userId, currentBadges = []) => {
    const badgeStr = prompt('Enter comma-separated badges for this user:', currentBadges.join(', '));
    if (badgeStr === null) return;

    try {
      const { data } = await api.patch(`/users/${userId}`, { badges: badgeStr });
      if (data.success) {
        toast.success('User badges updated successfully!');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Badges update failed');
    }
  };

  // Resolve Reports
  const handleResolveReport = async (id) => {
    const notes = prompt('Enter resolution notes:');
    if (notes === null) return;
    try {
      const { data } = await api.patch(`/admin/reports/${id}`, {
        status: 'Resolved',
        adminNotes: notes,
      });
      if (data.success) {
        toast.success('Report resolved');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve report');
    }
  };

  // Announcement Poster
  const onSubmitAnnouncement = async (data) => {
    try {
      const { data: resData } = await api.post('/admin/announcements', data);
      if (resData.success) {
        toast.success('Site-wide announcement posted successfully!');
        resetAnnounce();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to post announcement');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-3">
        <ShieldAlert className="h-7 w-7 text-iitgn-maroon dark:text-red-400" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">
            Administrative Control Panel
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Moderate submissions, review reports, and view system logs</p>
        </div>
      </div>

      {/* Admin Tab Menu */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-slate-800">
        {[
          { id: 'analytics', name: 'Analytics', icon: BarChart3 },
          { id: 'pending', name: 'Review Queue', icon: UserCheck },
          { id: 'users', name: 'User Management', icon: Shield },
          { id: 'reports', name: 'User Reports', icon: AlertOctagon },
          { id: 'logs', name: 'Edit Logs', icon: History },
          { id: 'announce', name: 'Post Announcement', icon: Megaphone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all
              ${activeTab === tab.id 
                ? 'border-iitgn-maroon text-iitgn-maroon dark:border-red-500 dark:text-red-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }
            `}
          >
            <tab.icon className="h-4 w-4" /> {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{analytics.summary.totalArticles}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Articles</span>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{analytics.summary.pendingArticles}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Moderation</span>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{analytics.summary.totalUsers}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Accounts</span>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 text-center">
                  <span className="block text-3xl font-extrabold text-iitgn-maroon dark:text-red-400">{analytics.summary.totalEdits}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Edit History</span>
                </div>
              </div>

              {/* Advanced Grids: Most Viewed / Top Contributors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Most Viewed */}
                <div className="p-5 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b pb-2 flex items-center gap-1.5">
                    <Eye className="h-4.5 w-4.5 text-gray-400" /> Most Viewed Pages
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {analytics.analytics.mostViewed.map((art) => (
                      <li key={art._id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <Link to={`/articles/${art.slug}`} className="font-semibold text-gray-800 dark:text-slate-200 hover:underline">
                          {art.title}
                        </Link>
                        <span className="text-xs text-gray-400 font-medium">{art.views} views</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Contributors */}
                <div className="p-5 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b pb-2 flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-gray-400" /> Top Editors
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {analytics.analytics.topContributors.map((contrib, idx) => (
                      <li key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{contrib.user?.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                          {contrib.editCount} edits
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* TAB: REVIEW QUEUE */}
          {activeTab === 'pending' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-gray-700 text-sm dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-800">
                Pending Student Submissions
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {pending.map((art) => (
                  <li key={art._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div>
                      <Link to={`/articles/${art.slug}?tab=article`} className="font-bold text-sm text-gray-800 dark:text-slate-200 hover:underline">
                        {art.title}
                      </Link>
                      <span className="block text-xs text-gray-400 mt-1">
                        Submitted by {art.author?.name} ({art.author?.role}) • Category: {art.category?.name}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(art._id)}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white p-2 flex items-center justify-center shadow-sm"
                        title="Approve Submission"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(art._id)}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white p-2 flex items-center justify-center shadow-sm"
                        title="Reject Submission"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
                {pending.length === 0 && (
                  <li className="p-8 text-center text-gray-400 italic">Review queue is empty. Good job!</li>
                )}
              </ul>
            </div>
          )}

          {/* TAB: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-700 dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-850">
                    <th className="px-4 py-3">User Details</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Badges</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="block font-bold text-gray-900 dark:text-white">{u.name}</span>
                            <span className="block text-xs text-gray-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-755 dark:text-slate-300">
                        {u.role}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.badges?.map((b) => (
                            <span key={b} className="text-[10px] bg-red-50 text-iitgn-maroon dark:bg-red-950/20 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateRole(u._id, u.role)}
                          className="text-xs font-semibold text-iitgn-maroon hover:underline dark:text-red-400"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleUpdateBadges(u._id, u.badges)}
                          className="text-xs font-semibold text-gray-500 hover:underline dark:text-slate-400"
                        >
                          Badges
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: REPORTED ISSUES */}
          {activeTab === 'reports' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-700 dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-850">
                    <th className="px-4 py-3">Reporter</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {reports.map((rep) => (
                    <tr key={rep._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3">
                        <span className="block font-bold text-gray-900 dark:text-white">{rep.reporter?.name}</span>
                        <span className="block text-xs text-gray-400">{rep.reporter?.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        {rep.article ? (
                          <Link to={`/articles/${rep.article.slug}`} className="text-xs text-iitgn-maroon font-semibold hover:underline dark:text-red-400">
                            Article: {rep.article.title}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-550 italic">Comment ID: {rep.comment?._id || 'N/A'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs italic text-gray-600 dark:text-slate-400 max-w-[200px] truncate">
                        "{rep.reason}"
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                          ${rep.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}
                        `}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rep.status === 'Pending' && (
                          <button
                            onClick={() => handleResolveReport(rep._id)}
                            className="text-xs font-semibold text-iitgn-maroon hover:underline dark:text-red-400"
                          >
                            Resolve Issue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 italic">No reports filed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: SYSTEM REVISIONS LOG */}
          {activeTab === 'logs' && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-gray-700 text-sm dark:bg-slate-900/60 dark:text-slate-350 dark:border-slate-800">
                System Revisions Log
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <li key={log._id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-2">
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-slate-200">
                        {log.editor?.name} ({log.editor?.role})
                      </span>
                      <span className="text-gray-450 ml-1">edited</span>{' '}
                      {log.article ? (
                        <Link to={`/articles/${log.article.slug}`} className="font-semibold text-iitgn-maroon hover:underline dark:text-red-400">
                          {log.article.title}
                        </Link>
                      ) : (
                        <span className="text-gray-450 italic">[Deleted Article]</span>
                      )}{' '}
                      <span className="text-xs text-gray-400">(v{log.version})</span>
                      <span className="block text-xs text-gray-505 dark:text-slate-450 mt-1 italic">
                        Summary: "{log.summary}"
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="p-8 text-center text-gray-400 italic">No activity logs found.</li>
                )}
              </ul>
            </div>
          )}

          {/* TAB: POST ANNOUNCEMENT */}
          {activeTab === 'announce' && (
            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-6">
              <h3 className="text-lg font-bold font-serif text-gray-800 dark:text-white border-b pb-2 flex items-center gap-1.5">
                <Megaphone className="h-5 w-5 text-iitgn-maroon dark:text-red-400" /> Post Campus Announcement
              </h3>

              <form onSubmit={handleAnnounceSubmit(onSubmitAnnouncement)} className="space-y-4">
                <div>
                  <label htmlFor="announce-title" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                    Announcement Title
                  </label>
                  <input
                    id="announce-title"
                    type="text"
                    {...announceRegister('title', { required: true })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. Wiki Server Maintenance Scheduled"
                  />
                </div>

                <div>
                  <label htmlFor="announce-content" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
                    Content Details
                  </label>
                  <textarea
                    id="announce-content"
                    rows="4"
                    {...announceRegister('content', { required: true })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                    placeholder="Provide details about dates, schedules or notices..."
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="submit"
                    className="rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-5 py-2.5 text-sm font-semibold shadow transition-all"
                  >
                    Post Announcement
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AdminPanel;
