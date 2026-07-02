import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(0);

  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

  const refreshDashboard = async (force = false) => {
    if (!user) return;
    
    const now = Date.now();
    // Use cached version if not forced and cache has not expired yet
    if (!force && dashboard && (now - lastFetched < CACHE_EXPIRY_MS)) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/dashboard');
      if (data.success) {
        setDashboard(data);
        setLastFetched(Date.now());
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when user logs in or is re-loaded
  useEffect(() => {
    if (user) {
      refreshDashboard();
    } else {
      setDashboard(null);
      setLastFetched(0);
    }
  }, [user]);

  return (
    <DashboardContext.Provider value={{ dashboard, refreshDashboard, loading }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
export default DashboardContext;
