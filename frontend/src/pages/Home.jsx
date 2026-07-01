import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, BookOpen, Users, GraduationCap, Tent, MapPin, Award, 
  Activity, Landmark, Landmark as LabIcon, Calendar, ArrowRight, Eye, ThumbsUp, History
} from 'lucide-react';
import api from '../utils/api.js';
import { ArticleSkeleton } from '../components/SkeletonLoaders.jsx';
import { stripMarkdown } from '../utils/helpers.js';

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    articles: 0,
    contributors: 42, // Seed + static estimates
    departments: 5,
    students: 3200
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch articles list to populate recent, popular, and stats
        const { data } = await api.get('/articles');
        if (data.success) {
          const allArticles = data.articles || [];
          setRecentArticles(allArticles.slice(0, 4));
          
          // Sort by views for popular
          const sortedByViews = [...allArticles].sort((a, b) => b.views - a.views);
          setPopularArticles(sortedByViews.slice(0, 4));

          // Set featured article
          const featured = allArticles.find(a => a.slug === 'indian-institute-of-technology-gandhinagar') || allArticles[0];
          setFeaturedArticle(featured);

          // Update stats dynamically
          setStats(prev => ({
            ...prev,
            articles: data.pagination?.total || allArticles.length,
          }));
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickLinks = [
    { name: 'Departments', icon: Landmark, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20', path: '/category/departments' },
    { name: 'Faculty', icon: Users, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20', path: '/category/faculty' },
    { name: 'Courses', icon: GraduationCap, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20', path: '/category/courses' },
    { name: 'Clubs', icon: Activity, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20', path: '/category/student-clubs-gymkhana' },
    { name: 'Hostels', icon: Tent, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20', path: '/category/hostels' },
    { name: 'Campus Facilities', icon: MapPin, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20', path: '/category/campus-facilities' },
    { name: 'Research Labs', icon: LabIcon, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20', path: '/category/research-labs' },
    { name: 'Student Life', icon: Calendar, color: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/20', path: '/category/student-life' },
  ];

  return (
    <div className="space-y-10 pb-16">
      
      {/* 1. Branding Header & Search */}
      <section className="text-center py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex justify-center">
          {/* Large stylized IITGN logo emblem */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-iitgn-maroon text-white font-bold text-4xl shadow-md border-4 border-iitgn-gold font-serif">
            W
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">
            IIT Gandhinagar Wiki
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400">
            The community maintained encyclopedia for IIT Gandhinagar
          </p>
        </div>

        {/* Large Home Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search departments, courses, faculty, hostels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white py-3.5 pl-6 pr-12 text-sm outline-none transition-all shadow-md focus:border-iitgn-maroon dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-red-500"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white p-2 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </section>

      {/* 2. Quick Links Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif border-b border-gray-200 dark:border-slate-800 pb-2">
          Quick Portals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">{link.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Featured & About */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Featured Article Card */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">
                Featured Article
              </h2>
              <span className="flex items-center gap-1 text-xs font-semibold text-iitgn-gold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                <Award className="h-3.5 w-3.5" /> Special Feature
              </span>
            </div>
            
            {loading ? (
              <div className="h-48 bg-gray-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
            ) : featuredArticle ? (
              <div className="p-5 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-4 shadow-sm">
                <h3 className="text-2xl font-bold font-serif text-iitgn-maroon dark:text-red-400">
                  <Link to={`/articles/${featuredArticle.slug}`} className="hover:underline">
                    {featuredArticle.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-4 leading-relaxed text-justify">
                  {stripMarkdown(featuredArticle.content).slice(0, 320)}...
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {featuredArticle.views} views
                  </span>
                  <Link
                    to={`/articles/${featuredArticle.slug}`}
                    className="text-xs font-bold text-iitgn-maroon dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    Read article <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No articles available. Please seed the database.</p>
            )}
          </section>

          {/* About Wiki Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif border-b border-gray-200 dark:border-slate-800 pb-2">
              About IITGN Wiki
            </h2>
            <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                IITGN Wiki is a student-driven initiative designed to act as the central reference repository for 
                <strong> Indian Institute of Technology Gandhinagar</strong>. From detailed hostel guides to coursework 
                reviews and syllabus information, it operates under the principle of collective campus knowledge.
              </p>
              <p>
                Anyone with an active <code>@iitgn.ac.in</code> account can log in, edit pages, update histories, and create 
                new articles. Edits submitted by students undergo community moderation to ensure high academic standards 
                and reliable guidelines.
              </p>
            </div>
          </section>

        </div>

        {/* Right Column: Statistics & Trending */}
        <div className="space-y-8">
          
          {/* Statistics Card */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif border-b border-gray-200 dark:border-slate-800 pb-2">
              Wiki Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-150 bg-white dark:border-slate-800 dark:bg-slate-950 text-center">
                <span className="block text-2xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.articles}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</span>
              </div>
              <div className="p-4 rounded-xl border border-gray-150 bg-white dark:border-slate-800 dark:bg-slate-950 text-center">
                <span className="block text-2xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.contributors}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Editors</span>
              </div>
              <div className="p-4 rounded-xl border border-gray-150 bg-white dark:border-slate-800 dark:bg-slate-950 text-center">
                <span className="block text-2xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.departments}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Departments</span>
              </div>
              <div className="p-4 rounded-xl border border-gray-150 bg-white dark:border-slate-800 dark:bg-slate-950 text-center">
                <span className="block text-2xl font-extrabold text-iitgn-maroon dark:text-red-400">{stats.students}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Students</span>
              </div>
            </div>
          </section>

          {/* Trending & Recently Updated */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif border-b border-gray-200 dark:border-slate-800 pb-2">
              Trending Articles
            </h2>
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <ul className="space-y-3">
                {popularArticles.map((art) => (
                  <li key={art._id} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-slate-850 text-xs font-bold text-gray-500 dark:text-slate-400">
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <Link to={`/articles/${art.slug}`} className="font-semibold text-sm hover:underline hover:text-iitgn-maroon dark:hover:text-red-400">
                        {art.title}
                      </Link>
                      <span className="block text-xs text-gray-400">{art.views} views • {art.readingTime} min read</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recently Updated */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif border-b border-gray-200 dark:border-slate-800 pb-2">
              Recently Updated
            </h2>
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentArticles.map((art) => (
                  <li key={art._id} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-slate-850 text-xs font-bold text-gray-500 dark:text-slate-400">
                      <History className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <Link to={`/articles/${art.slug}`} className="font-semibold text-sm hover:underline hover:text-iitgn-maroon dark:hover:text-red-400">
                        {art.title}
                      </Link>
                      <span className="block text-xs text-gray-400">
                        By {art.author?.name || 'Admin'} • {new Date(art.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>

      </div>

    </div>
  );
};

export default Home;
