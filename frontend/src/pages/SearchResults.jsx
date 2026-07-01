import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Compass, Eye, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import api from '../utils/api.js';
import { stripMarkdown } from '../utils/helpers.js';

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
        if (data.success) {
          setResults(data.articles || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (q) {
      performSearch();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [q]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 pb-3 flex items-center gap-2">
        <Search className="h-6 w-6 text-iitgn-maroon dark:text-red-400" />
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">
          Search Results
        </h1>
      </div>

      <p className="text-sm text-gray-550 dark:text-slate-400">
        Showing matches for: <strong className="text-gray-900 dark:text-white">"{q}"</strong>
      </p>

      {/* Results List */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4 divide-y divide-gray-200 dark:divide-slate-800">
          {results.map((art) => (
            <div
              key={art._id}
              className="pt-5 pb-5 space-y-2 first:pt-0"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">
                <Link to={`/articles/${art.slug}`} className="hover:underline text-iitgn-maroon hover:text-iitgn-maroon-dark dark:text-red-400">
                  {art.title}
                </Link>
              </h2>
              
              {/* Content snippet */}
              <p className="text-sm text-gray-600 dark:text-slate-350 leading-relaxed text-justify">
                {stripMarkdown(art.content).slice(0, 350)}...
              </p>

              {/* Tags list */}
              {art.tags && art.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {art.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-350 px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                <span className="text-xs text-iitgn-maroon bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {art.category?.name || 'Wiki Page'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Updated {new Date(art.updatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {art.views} views
                </span>
                <Link
                  to={`/articles/${art.slug}`}
                  className="font-bold text-iitgn-maroon hover:underline dark:text-red-400 flex items-center gap-1 ml-auto"
                >
                  Read Article →
                </Link>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-905 dark:text-white font-serif">No matches found</h2>
          <p className="text-gray-500 text-sm">There are no wiki pages matching your search query. Try checking spelling or search using another keyword.</p>
          <Link to="/" className="inline-block text-sm font-semibold text-iitgn-maroon hover:underline dark:text-red-400 pt-2">
            Return to Main Page
          </Link>
        </div>
      )}

    </div>
  );
};

export default SearchResults;
