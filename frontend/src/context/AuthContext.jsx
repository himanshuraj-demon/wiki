import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api.js';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [googleClientId, setGoogleClientId] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch client configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/auth/config');
        if (data.success) {
          setGoogleClientId(data.googleClientId || '');
        }
      } catch (err) {
        console.error('Error loading Google OAuth Client ID:', err);
      }
    };
    fetchConfig();
  }, []);

  // Fetch authenticated user profile only once
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching auth user:', error);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Google authentication handler
  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential });
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Google login failed.',
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  // Profile Update local synchronizer (alias of setUser for compatibility)
  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const [profileCache, setProfileCache] = useState({});

  const getCachedProfile = async (email, force = false) => {
    if (!force && profileCache[email]) {
      return profileCache[email];
    }
    const { data } = await api.get(`/users/profile/${encodeURIComponent(email)}`);
    if (data.success) {
      setProfileCache((prev) => ({
        ...prev,
        [email]: data,
      }));
      return data;
    }
    throw new Error('Failed to load profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        googleClientId,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout,
        updateLocalUser,
        refreshUser,
        profileCache,
        getCachedProfile,
      }}
    >
      <GoogleOAuthProvider clientId={googleClientId || "your-mock-id.apps.googleusercontent.com"}>
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
