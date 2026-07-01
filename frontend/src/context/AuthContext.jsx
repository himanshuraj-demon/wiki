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

  const checkMe = async () => {
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
      checkMe();
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

  // Profile Update local synchronizer
  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        googleClientId,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout,
        updateLocalUser,
        checkMe,
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
