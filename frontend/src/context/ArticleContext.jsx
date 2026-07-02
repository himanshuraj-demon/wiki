import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const ArticleContext = createContext();

export const ArticleProvider = ({ children }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(0);

  const refreshArticles = async (force = false) => {
    // If not forced and we already have cached articles, use them
    if (!force && articles.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/articles');
      if (data.success) {
        setArticles(data.articles || []);
        setLastFetched(Date.now());
      }
    } catch (err) {
      console.error('Error fetching articles list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshArticles();
  }, []);

  return (
    <ArticleContext.Provider value={{ articles, refreshArticles, loading }}>
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticle = () => useContext(ArticleContext);
export default ArticleContext;
