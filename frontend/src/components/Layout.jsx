import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse

  // Toggle handlers
  const handleHamburgerClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f6f6] dark:bg-slate-900 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar toggleSidebar={handleHamburgerClick} sidebarOpen={sidebarOpen} />

      <div className="flex">
        {/* Collapsible Left Sidebar */}
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          collapsed={sidebarCollapsed} 
        />

        {/* Main Content Area */}
        <main
          className={`flex-grow min-w-0 bg-white dark:bg-slate-950 border-l border-[#a2a9b1] dark:border-slate-800 transition-all duration-300
            ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
          `}
        >
          {/* Wikipedia page content pad */}
          <div className="p-6 sm:p-8 lg:p-10 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
