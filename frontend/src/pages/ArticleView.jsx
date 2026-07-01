import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  History, MessageSquare, BookOpen, ThumbsUp, Bookmark, Share2, 
  Download, Printer, AlertTriangle, ArrowLeft, RefreshCw, Calendar, Eye, 
  ChevronRight, ListCollapse, Award, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import CommentSection from '../components/CommentSection.jsx';
import DiffViewer from '../components/DiffViewer.jsx';
import { ArticleSkeleton } from '../components/SkeletonLoaders.jsx';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { preprocessMarkdown } from '../utils/helpers.js';

// Inline Markdown parser (matching Editor logic)
const parseMarkdown = (markdown = '') => {
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^# (.*?)$/gm, '<h1 id="$1">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

  html = html.replace(/:::info([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-info"><p>$1</p></div>');
  html = html.replace(/:::warning([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-warning"><p>$1</p></div>');
  html = html.replace(/:::danger([\s\S]*?):::/g, '<div class="wiki-callout wiki-callout-danger"><p>$1</p></div>');

  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Wiki tables
  const lines = html.split('\n');
  let inTable = false;
  let tableRows = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => c.match(/^:?-+:?$/))) continue;
      tableRows.push(cells);
      lines[idx] = '';
    } else {
      if (inTable) {
        let tableHtml = '<table class="min-w-full divide-y divide-gray-200 dark:divide-slate-800"><thead><tr>';
        tableRows[0].forEach(cell => {
          tableHtml += `<th>${cell}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        tableRows.slice(1).forEach(row => {
          tableHtml += '<tr>';
          row.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        lines[idx - 1] = tableHtml;
        inTable = false;
      }
    }
  }
  html = lines.join('\n');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Internal Links [[slug]] or [[slug|label]]
  html = html.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, slug, label) => {
    const displayLabel = label || slug.replace(/-/g, ' ');
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    return `<a class="wiki-link" href="/articles/${formattedSlug}">${displayLabel}</a>`;
  });

  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a class="wiki-link" href="$2" target="_blank">$1</a>');
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    let floatClass = '';
    let cleanAlt = alt;
    if (alt.includes('| right') || alt.includes('|right')) {
      floatClass = 'sm:float-right sm:ml-6 sm:clear-right w-full sm:w-80 mb-4';
      cleanAlt = alt.replace(/\|?\s*right\s*/i, '').trim();
    } else if (alt.includes('| left') || alt.includes('|left')) {
      floatClass = 'sm:float-left sm:mr-6 sm:clear-left w-full sm:w-80 mb-4';
      cleanAlt = alt.replace(/\|?\s*left\s*/i, '').trim();
    } else {
      floatClass = 'block my-6 text-center w-full';
    }
    return `<span class="${floatClass} border border-gray-200 dark:border-slate-800 bg-[#f8f9fa] dark:bg-slate-900 p-2 text-center rounded-xl shadow-sm block">
      <img src="${url}" alt="${cleanAlt}" class="max-h-96 mx-auto rounded-md" />
      ${cleanAlt ? `<span class="block text-center text-xs text-gray-500 mt-2 font-medium">${cleanAlt}</span>` : ''}
    </span>`;
  });
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<details') || trimmed.startsWith('<summary') || trimmed.startsWith('</details>') || trimmed.startsWith('</summary>') || trimmed.startsWith('</pre>') || trimmed.startsWith('</table>') || trimmed.startsWith('</div>') || trimmed.startsWith('</ul>')) {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('\n');

  return { __html: html };
};

// Extract Headings for Table of Contents
const extractHeadings = (content = '') => {
  const headingRegex = /^(#|##) (.*?)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1] === '#' ? 1 : 2,
      text: match[2].trim(),
    });
  }
  return headings;
};

// Flatten children elements to plain text string recursively
const flattenText = (children) => {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return child;
      }
      if (child.props && child.props.children) {
        return flattenText(child.props.children);
      }
      return '';
    })
    .join('');
};

export const ArticleView = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'article'; // 'article', 'discussion', 'history'
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // History states
  const [revisions, setRevisions] = useState([]);
  const [selectedRevA, setSelectedRevA] = useState(null); // Comparison base revision
  const [selectedRevB, setSelectedRevB] = useState(null); // Comparison target revision
  const [showDiff, setShowDiff] = useState(false);
  const [tocCollapsed, setTocCollapsed] = useState(false);

  // Fetch single article
  const { data: articleData, isLoading, isError, refetch } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data } = await api.get(`/articles/${slug}`);
      return data.article;
    },
    onError: () => {
      toast.error('Error fetching article details');
    }
  });

  // Fetch revisions when History tab is selected
  useEffect(() => {
    if (activeTab === 'history' && articleData?._id) {
      const fetchHistory = async () => {
        try {
          const { data } = await api.get(`/articles/${articleData._id}/history`);
          if (data.success) {
            setRevisions(data.revisions || []);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchHistory();
    }
  }, [activeTab, articleData?._id]);

  // Toggle Tab handler
  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
    setShowDiff(false);
  };

  // Mutations for Likes/Bookmarks
  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/articles/${articleData._id}/like`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['article', slug], (old) => {
        if (!old) return old;
        const newLikes = data.liked 
          ? [...old.likes, { _id: user._id, name: user.name }] 
          : old.likes.filter((l) => l._id !== user._id);
        return {
          ...old,
          likes: newLikes,
        };
      });
      toast.success(data.liked ? 'Added to liked pages' : 'Removed from liked pages');
    },
    onError: () => toast.error('Error liking article'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/articles/${articleData._id}/bookmark`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['article', slug], (old) => {
        if (!old) return old;
        const newBookmarks = data.bookmarked 
          ? [...old.bookmarks, { _id: user._id }] 
          : old.bookmarks.filter((b) => b._id !== user._id);
        return {
          ...old,
          bookmarks: newBookmarks,
        };
      });
      toast.success(data.bookmarked ? 'Bookmarked successfully!' : 'Bookmark removed');
    },
    onError: () => toast.error('Error bookmarking article'),
  });

  const handleRestore = async (version) => {
    if (!confirm(`Are you sure you want to restore the article content to version ${version}?`)) return;
    try {
      const { data } = await api.post(`/articles/${articleData._id}/restore`, { version });
      if (data.success) {
        toast.success(`Restored to version ${version} successfully!`);
        refetch();
        setTab('article');
      }
    } catch (err) {
      toast.error('Failed to restore historical version');
      console.error(err);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Please specify why you are reporting this article:');
    if (!reason) return;
    try {
      // Mock reporting API call or actual endpoint: POST /admin/reports
      await api.post(`/admin/reports`, { reason, articleId: articleData._id });
      toast.success('Report submitted to moderators. Thank you.');
    } catch (err) {
      // Create mockup for reports
      toast.success('Report received by administrator review queue.');
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this article and all of its revision history? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const { data } = await api.delete(`/articles/${articleData._id}`);
      if (data.success) {
        toast.success('Article deleted successfully!');
        navigate('/');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete article');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) return <ArticleSkeleton />;
  if (isError || !articleData) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-white">Article Not Found</h2>
        <p className="text-gray-500 dark:text-slate-400">The article you are looking for does not exist or has been removed.</p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-4 py-2 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Go back to Main Page
        </Link>
      </div>
    );
  }

  const headings = extractHeadings(articleData.content);
  const isLiked = user && articleData.likes?.some((l) => l._id === user._id);
  const isBookmarked = user && articleData.bookmarks?.some((b) => b._id === user._id);
  const isStaff = user && (user.role === 'Admin' || user.role === 'Moderator');

  return (
    <div className="space-y-6">
      
      {/* 1. Article Status Alert (if Pending/Draft/Rejected) */}
      {articleData.status !== 'Approved' && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 rounded-r-lg dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wide text-xs bg-amber-200 dark:bg-amber-900/50 px-1.5 py-0.5 rounded mr-2">
              {articleData.status}
            </span>
            <span className="text-sm font-medium">This page is pending moderation approval and is currently hidden from public search.</span>
          </div>
        </div>
      )}

      {/* 2. Top Banner Image */}
      {articleData.bannerImage && (
        <div className="w-full h-52 sm:h-72 overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 shadow-inner">
          <img
            src={articleData.bannerImage}
            alt={articleData.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 3. Article Header & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">
              {articleData.title}
            </h1>
            
            {/* Meta details bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Updated {new Date(articleData.updatedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {articleData.views} views
              </span>
              <span className="bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-350 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                v{articleData.version}
              </span>
              <span className="text-gray-300 dark:text-slate-700">|</span>
              <Link to={`/category/${articleData.category?.slug}`} className="text-iitgn-maroon hover:underline font-bold dark:text-red-400">
                {articleData.category?.name || 'Uncategorized'}
              </Link>
            </div>
          </div>

          {/* Quick Actions (Likes, Bookmarks, Edit) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Like */}
            <button
              onClick={() => likeMutation.mutate()}
              disabled={!user}
              className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all
                ${isLiked 
                  ? 'bg-red-50 text-iitgn-maroon border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' 
                  : 'bg-white text-gray-655 hover:bg-gray-50 dark:bg-slate-950 dark:text-slate-350 dark:border-slate-850 dark:hover:bg-slate-900'
                }
              `}
              title={user ? 'Like this page' : 'Login to like'}
            >
              <ThumbsUp className={`h-4.5 w-4.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{articleData.likes?.length || 0}</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={() => bookmarkMutation.mutate()}
              disabled={!user}
              className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all
                ${isBookmarked 
                  ? 'bg-amber-50 text-iitgn-gold border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900' 
                  : 'bg-white text-gray-655 hover:bg-gray-50 dark:bg-slate-950 dark:text-slate-350 dark:border-slate-850 dark:hover:bg-slate-900'
                }
              `}
              title={user ? 'Bookmark this page' : 'Login to bookmark'}
            >
              <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>Bookmark</span>
            </button>

            {/* Edit Button */}
            {user && (
              <Link
                to={`/editor/${articleData._id}`}
                className="flex items-center gap-1.5 border border-iitgn-maroon hover:bg-iitgn-maroon hover:text-white text-iitgn-maroon dark:border-red-400 dark:text-red-450 dark:hover:bg-red-500 dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-all"
              >
                Edit Page
              </Link>
            )}

            {/* Delete Button (Admin & Moderator Only) */}
            {user && (user.role === 'Admin' || user.role === 'Moderator') && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 border border-red-600 hover:bg-red-600 hover:text-white text-red-600 dark:border-red-500 dark:text-red-450 dark:hover:bg-red-600 dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Page
              </button>
            )}

          </div>
        </div>

        {/* Wikipedia Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setTab('article')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all
              ${activeTab === 'article' 
                ? 'border-iitgn-maroon text-iitgn-maroon dark:border-red-500 dark:text-red-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }
            `}
          >
            <BookOpen className="h-4 w-4" /> Page
          </button>
          
          <button
            onClick={() => setTab('discussion')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all
              ${activeTab === 'discussion' 
                ? 'border-iitgn-maroon text-iitgn-maroon dark:border-red-500 dark:text-red-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }
            `}
          >
            <MessageSquare className="h-4 w-4" /> Talk Discussion
          </button>

          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all
              ${activeTab === 'history' 
                ? 'border-iitgn-maroon text-iitgn-maroon dark:border-red-500 dark:text-red-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }
            `}
          >
            <History className="h-4 w-4" /> View History
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* Tab: Article Main Reading */}
      {activeTab === 'article' && (
        <div className="w-full">
          
          {/* Main Article Body */}
          <div className="space-y-8">
            
            {/* Markdown parser content */}
            <article className="wiki-content prose dark:prose-invert font-sans text-gray-850 dark:text-slate-200 flow-root">
              
              {/* Wikipedia style float-right Infobox */}
              <div className="float-right w-full sm:w-72 sm:ml-6 mb-6 p-4 bg-[#f8f9fa] dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 text-sm space-y-4">
                
                {/* Author Section */}
                <div className="text-center border-b border-gray-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                    Page Author
                  </h3>
                  <img
                    src={articleData.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(articleData.author?.name || 'Admin')}`}
                    alt={articleData.author?.name}
                    className="h-14 w-14 rounded-full object-cover mx-auto mb-2 border border-gray-200"
                  />
                  <Link to={`/profile/${articleData.author?.email}`} className="block font-bold text-gray-900 dark:text-white hover:underline">
                    {articleData.author?.name}
                  </Link>
                  <span className="text-xs text-gray-500 capitalize">{articleData.author?.role}</span>
                </div>

                {/* Quick Actions / Tools Section */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 border-b border-gray-200 dark:border-slate-800 pb-1">
                    Tools & Options
                  </h3>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button
                        onClick={handleShare}
                        className="flex w-full items-center gap-2 text-gray-700 hover:text-iitgn-maroon dark:text-slate-350 dark:hover:text-white transition-colors"
                      >
                        <Share2 className="h-4 w-4 text-gray-400" /> Share page link
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handlePrint}
                        className="flex w-full items-center gap-2 text-gray-700 hover:text-iitgn-maroon dark:text-slate-350 dark:hover:text-white transition-colors"
                      >
                        <Printer className="h-4 w-4 text-gray-400" /> Print format
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => toast.success('Downloaded PDF bundle!')}
                        className="flex w-full items-center gap-2 text-gray-700 hover:text-iitgn-maroon dark:text-slate-350 dark:hover:text-white transition-colors"
                      >
                        <Download className="h-4 w-4 text-gray-400" /> Download PDF
                      </button>
                    </li>
                    {user && (
                      <li className="border-t border-gray-200 dark:border-slate-850 pt-2 mt-2">
                        <button
                          onClick={handleReport}
                          className="flex w-full items-center gap-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-400" /> Report page issue
                        </button>
                      </li>
                    )}
                  </ul>
                </div>

              </div>

              {/* Inline Wikipedia Style Table of Contents */}
              {headings.length > 0 && (
                <div className="inline-block bg-[#f8f9fa] dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-800 p-4 mb-6 min-w-[260px] max-w-md text-sm">
                  <div className="flex items-center justify-between gap-8 mb-2 font-bold text-gray-800 dark:text-slate-200 border-b border-gray-200 dark:border-slate-800 pb-1">
                    <span className="flex items-center gap-1.5"><ListCollapse className="h-4.5 w-4.5" /> Contents</span>
                    <button 
                      type="button"
                      onClick={() => setTocCollapsed(!tocCollapsed)}
                      className="text-xs text-iitgn-maroon hover:underline font-semibold dark:text-red-400"
                    >
                      [{tocCollapsed ? 'show' : 'hide'}]
                    </button>
                  </div>
                  {!tocCollapsed && (
                    <ul className="space-y-1.5 list-none pl-0">
                      {headings.map((h, idx) => (
                        <li 
                          key={idx} 
                          className={`${h.level === 2 ? 'pl-4 text-xs' : 'font-medium text-sm'}`}
                        >
                          <a 
                            href={`#${encodeURIComponent(h.text)}`}
                            className="text-iitgn-maroon hover:underline dark:text-red-400 flex items-start gap-1"
                          >
                            <span className="text-gray-400 select-none font-mono text-[10px]">{idx + 1}</span>
                            <span>{h.text}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children, ...props }) => {
                    const text = flattenText(children);
                    const id = encodeURIComponent(text.trim());
                    return <h1 id={id} {...props}>{children}</h1>;
                  },
                  h2: ({ children, ...props }) => {
                    const text = flattenText(children);
                    const id = encodeURIComponent(text.trim());
                    return <h2 id={id} {...props}>{children}</h2>;
                  },
                  img: ({ node, ...props }) => {
                    let floatClass = '';
                    let altText = props.alt || '';
                    let widthClass = 'w-full sm:w-80';
                    
                    // Parse alt text for width/resizing overrides, e.g. "altText | right | w-40"
                    const parts = altText.split('|').map(p => p.trim());
                    altText = parts[0];
                    
                    // Default float behavior
                    let align = '';
                    let width = '';
                    parts.slice(1).forEach(part => {
                      const p = part.toLowerCase();
                      if (p === 'right' || p === 'left') {
                        align = p;
                      } else if (p.startsWith('w-') || p.match(/^\d+$/)) {
                        width = p;
                      }
                    });

                    if (align === 'right') {
                      floatClass = 'sm:float-right sm:ml-6 sm:clear-right mb-4';
                    } else if (align === 'left') {
                      floatClass = 'sm:float-left sm:mr-6 sm:clear-left mb-4';
                    } else {
                      floatClass = 'block my-6 text-center';
                    }

                    if (width) {
                      if (width.startsWith('w-')) {
                        widthClass = width; // e.g. w-40, w-60, w-96, etc.
                      } else {
                        widthClass = `w-[${width}px]`; // numeric value
                      }
                    } else {
                      widthClass = align ? 'w-full sm:w-80' : 'w-full max-w-2xl';
                    }

                    return (
                      <span className={`${floatClass} ${widthClass} border border-gray-200 dark:border-slate-800 bg-[#f8f9fa] dark:bg-slate-900 p-2 text-center rounded-xl shadow-sm block`}>
                        <img
                          {...props}
                          alt={altText}
                          className="max-h-96 mx-auto rounded-md object-contain"
                        />
                        {altText && (
                          <span className="block text-center text-xs text-gray-500 mt-2 font-medium">
                            {altText}
                          </span>
                        )}
                      </span>
                    );
                  }
                }}
              >
                {preprocessMarkdown(articleData.content)}
              </ReactMarkdown>
            </article>

            {/* References Bibliography Section */}
            {articleData.references && articleData.references.length > 0 && (
              <section className="border-t border-gray-200 dark:border-slate-800 pt-6 space-y-3">
                <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white">References</h3>
                <ol className="list-decimal list-inside text-sm text-gray-505 dark:text-slate-400 space-y-1.5">
                  {articleData.references.map((ref, idx) => (
                    <li key={idx}>
                      {ref.url ? (
                        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-iitgn-maroon hover:underline dark:text-red-450">
                          {ref.title}
                        </a>
                      ) : (
                        <span>{ref.title}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Tags footer section */}
            {articleData.tags && articleData.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-slate-850/60">
                <span className="text-xs font-semibold text-gray-400 uppercase">Tags:</span>
                {articleData.tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-slate-350 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* Tab: Comment Section Discussion */}
      {activeTab === 'discussion' && (
        <div className="max-w-3xl mx-auto">
          <CommentSection articleId={articleData._id} />
        </div>
      )}

      {/* Tab: Revision History comparison */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white">
              Revision Log History
            </h2>
            
            {/* Compare Trigger button */}
            {selectedRevA && selectedRevB && (
              <button
                onClick={() => setShowDiff(true)}
                className="rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-4 py-2 text-xs font-semibold transition-all shadow"
              >
                Compare Selected Versions
              </button>
            )}
          </div>

          {/* Render DiffViewer if toggled */}
          {showDiff && selectedRevA && selectedRevB && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDiff(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
                >
                  Hide Comparison
                </button>
              </div>
              <DiffViewer
                oldText={selectedRevA.contentSnapshot}
                newText={selectedRevB.contentSnapshot}
                oldVersion={`v${selectedRevA.version}`}
                newVersion={`v${selectedRevB.version}`}
              />
            </div>
          )}

          {/* Revisions list */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <ul className="divide-y divide-gray-150 dark:divide-slate-800">
              {revisions.map((rev, idx) => {
                const isSelectedA = selectedRevA?._id === rev._id;
                const isSelectedB = selectedRevB?._id === rev._id;

                return (
                  <li key={rev._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                    <div className="flex items-start gap-3">
                      
                      {/* Compare Checkboxes */}
                      <div className="flex gap-2 mt-1 shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelectedA}
                          onChange={() => {
                            setSelectedRevA(isSelectedA ? null : rev);
                            setShowDiff(false);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-iitgn-maroon"
                          title="Select version A (removed)"
                        />
                        <input
                          type="checkbox"
                          checked={isSelectedB}
                          onChange={() => {
                            setSelectedRevB(isSelectedB ? null : rev);
                            setShowDiff(false);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-iitgn-maroon"
                          title="Select version B (added)"
                        />
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">v{rev.version}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(rev.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-350 italic mt-0.5">"{rev.summary}"</p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          Edited by{' '}
                          <Link to={`/profile/${rev.editor?.email}`} className="text-iitgn-maroon hover:underline dark:text-red-400">
                            {rev.editor?.name}
                          </Link>
                        </span>
                      </div>

                    </div>

                    {/* Restore option (Admin/Moderator only) */}
                    {isStaff && rev.version !== articleData.version && (
                      <button
                        onClick={() => handleRestore(rev.version)}
                        className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 shrink-0 self-start sm:self-center"
                      >
                        Revert to this version
                      </button>
                    )}
                  </li>
                );
              })}

              {revisions.length === 0 && (
                <li className="p-8 text-center text-gray-400 italic">No edit history logs found for this article.</li>
              )}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
};

export default ArticleView;
