import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  User, Award, Calendar, BookOpen, Edit3, Briefcase, GraduationCap, 
  Hash, Heart, Shield, Sparkles, Compass
} from 'lucide-react';
import api from '../utils/api.js';

export const UserProfile = () => {
  const { email } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/profile/${encodeURIComponent(email)}`);
        if (data.success) {
          setProfileData(data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white">Profile Not Found</h2>
        <p className="text-gray-500 mt-1">The user you are looking for does not exist in our database.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-iitgn-maroon dark:text-red-400 hover:underline">
          Go to Main Page
        </Link>
      </div>
    );
  }

  const { user, stats } = profileData;

  // Badge mapping to colors
  const getBadgeStyle = (badge) => {
    const b = badge.toLowerCase();
    if (b.includes('admin') || b.includes('founder')) {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900';
    }
    if (b.includes('moderator') || b.includes('leader')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900';
    }
    if (b.includes('gold') || b.includes('expert')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
    }
    // Default badge
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
        
        {/* Avatar */}
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
          alt={user.name}
          className="h-24 w-24 rounded-full object-cover border-4 border-iitgn-maroon/20 shadow-inner"
        />

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">
                {user.name}
              </h1>
              
              {/* Role badge */}
              <span className="inline-block self-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-iitgn-maroon dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded">
                {user.role}
              </span>
            </div>

            {/* Department & Batch */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
              {user.department && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-gray-400" /> {user.department}
                </span>
              )}
              {user.batch && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4 text-gray-400" /> Batch of {user.batch}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-400" /> Joined {new Date(user.joinedDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-1 text-gray-600 dark:text-slate-350 text-sm max-w-2xl leading-relaxed">
            <h3 className="font-bold text-gray-800 dark:text-slate-200">About Me</h3>
            <p>{user.bio || 'This user has not written a biography yet.'}</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Stats & Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stats Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl border border-gray-250 bg-gray-50 dark:border-slate-805 dark:bg-slate-900/30 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Contribution Stats
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 shadow-sm border border-gray-150 dark:border-slate-850">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-350">
                  <BookOpen className="h-4 w-4 text-emerald-500" /> Articles Created
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{stats.articlesCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 shadow-sm border border-gray-150 dark:border-slate-850">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-350">
                  <Edit3 className="h-4 w-4 text-blue-500" /> Revisions Edited
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{stats.editsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges and Interests Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Badges Section */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Award className="h-4.5 w-4.5" /> Earned Badges
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {user.badges && user.badges.length > 0 ? (
                user.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${getBadgeStyle(badge)}`}
                  >
                    {badge}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No badges earned yet.</p>
              )}
            </div>
          </div>

          {/* Interests Section */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Compass className="h-4.5 w-4.5" /> Research & Academic Interests
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-slate-850 dark:text-slate-350 rounded-lg text-xs font-semibold"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No academic interests specified.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default UserProfile;
