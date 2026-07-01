import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Calendar, Eye, Compass, Award } from 'lucide-react';
import api from '../utils/api.js';
import { stripMarkdown } from '../utils/helpers.js';

export const CategoryView = () => {
  const { categorySlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryArticles = async () => {
      setLoading(true);
      try {
        // 1. Fetch categories list to match name/description
        const { data: catData } = await api.get('/categories');
        if (catData.success) {
          const currentCat = catData.categories?.find(c => c.slug === categorySlug);
          if (currentCat) {
            setCategoryName(currentCat.name);
            setCategoryDesc(currentCat.description);
          } else {
            // Treat custom slug maps cleanly (e.g. Hostels -> hostels, Research -> research-labs)
            // Normalize slashes
            const cleanSlug = categorySlug.toLowerCase();
            const matched = catData.categories?.find(c => c.slug.includes(cleanSlug) || cleanSlug.includes(c.slug));
            if (matched) {
              setCategoryName(matched.name);
              setCategoryDesc(matched.description);
            } else {
              setCategoryName(categorySlug.replace(/-/g, ' '));
            }
          }
        }

        // 2. Fetch articles matching category slug
        const { data: artData } = await api.get(`/articles?category=${categorySlug}`);
        if (artData.success) {
          setArticles(artData.articles || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load category articles');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryArticles();
  }, [categorySlug]);

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
        <div className="space-y-4 divide-y divide-gray-200 dark:divide-slate-800">
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
      ) : (
        <div className="text-center py-16 p-6 border border-dashed rounded-xl space-y-3">
          <Compass className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Articles Listed</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">There are currently no live wiki pages filed under this academic category. You can start by writing the first one!</p>
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
