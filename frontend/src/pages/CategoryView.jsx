import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Calendar, Eye, Compass } from 'lucide-react';
import api from '../utils/api.js';
import { stripMarkdown } from '../utils/helpers.js';
import { useCategory } from '../context/CategoryContext.jsx';

export const CategoryView = () => {
  const { categorySlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const { categories } = useCategory();

  // Reset page to 1 when category slug changes
  useEffect(() => {
    setPage(1);
  }, [categorySlug]);

  useEffect(() => {
    const fetchCategoryArticles = async () => {
      setLoading(true);
      try {
        // Match name/description using categories from context
        const currentCat = categories?.find(c => c.slug === categorySlug);
        if (currentCat) {
          setCategoryName(currentCat.name);
          setCategoryDesc(currentCat.description);
        } else {
          // Treat custom slug maps cleanly (e.g. Hostels -> hostels, Research -> research-labs)
          const cleanSlug = categorySlug.toLowerCase();
          const matched = categories?.find(c => c.slug.includes(cleanSlug) || cleanSlug.includes(c.slug));
          if (matched) {
            setCategoryName(matched.name);
            setCategoryDesc(matched.description);
          } else {
            setCategoryName(categorySlug.replace(/-/g, ' '));
          }
        }

        // Fetch articles matching category slug with pagination (limit to 10 articles per page)
        const { data: artData } = await api.get(`/articles?category=${categorySlug}&page=${page}&limit=10`);
        if (artData.success) {
          setArticles(artData.articles || []);
          setTotalPages(artData.pagination?.pages || 1);
          setHasNext(artData.pagination?.hasNext || false);
          setHasPrev(artData.pagination?.hasPrev || false);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load category articles');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryArticles();
  }, [categorySlug, page, categories]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Category Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-iitgn-maroon dark:text-red-400" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white capitalize font-serif">
            Category: {categoryName}
          </h1>
        </div>
        {categoryDesc && (
          <p className="text-sm text-gray-500 dark:text-slate-400 italic">{categoryDesc}</p>
        )}
      </div>

      {/* Articles List */}
      {articles.length > 0 ? (
        <div className="space-y-4">
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {articles.map((art) => (
              <div
                key={art._id}
                className="pt-5 pb-5 space-y-2 first:pt-0"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">
                  <Link to={`/articles/${art.slug}`} className="hover:underline hover:text-iitgn-maroon dark:hover:text-red-405 text-iitgn-maroon dark:text-red-400">
                    {art.title}
                  </Link>
                </h2>

                <p className="text-sm text-gray-600 dark:text-slate-350 leading-relaxed text-justify">
                  {stripMarkdown(art.content).slice(0, 350)}...
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                  <span className="bg-red-50 text-iitgn-maroon dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    v{art.version}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {new Date(art.updatedAt).toLocaleDateString()}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-850 pt-6 mt-8">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={!hasPrev}
                className="rounded-lg border border-gray-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer dark:text-white"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-500 font-medium dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={!hasNext}
                className="rounded-lg border border-gray-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer dark:text-white"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 p-6 border border-dashed rounded-xl space-y-3 dark:border-slate-800">
          <Compass className="h-12 w-12 text-gray-300 mx-auto dark:text-slate-700" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Articles Listed</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto dark:text-slate-400">There are currently no live wiki pages filed under this academic category. You can start by writing the first one!</p>
          <Link
            to="/editor"
            className="inline-block rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-4 py-2 font-semibold text-sm transition-all"
          >
            Create First Page
          </Link>
        </div>
      )}

    </div>
  );
};

export default CategoryView;
