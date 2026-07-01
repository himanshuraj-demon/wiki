import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/Layout.jsx';

// Pages
import Home from './pages/Home.jsx';
import ArticleView from './pages/ArticleView.jsx';
import ArticleEdit from './pages/ArticleEdit.jsx';
import CategoryView from './pages/CategoryView.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import UserProfile from './pages/UserProfile.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Context
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Staff Route Wrapper (Admin or Moderator)
const StaffRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
      </div>
    );
  }

  const isStaff = isAuthenticated && (user.role === 'Admin' || user.role === 'Moderator');
  return isStaff ? children : <Navigate to="/" replace />;
};

export const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'articles/:slug', element: <ArticleView /> },
        { path: 'category/:categorySlug', element: <CategoryView /> },
        { path: 'profile/:email', element: <UserProfile /> },
        { path: 'search', element: <SearchResults /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        {
          path: 'editor',
          element: (
            <ProtectedRoute>
              <ArticleEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: 'editor/:id',
          element: (
            <ProtectedRoute>
              <ArticleEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: 'dashboard',
          element: (
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin',
          element: (
            <StaffRoute>
              <AdminPanel />
            </StaffRoute>
          ),
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#14532d',
            },
          },
          error: {
            style: {
              background: '#7f1d1d',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;
