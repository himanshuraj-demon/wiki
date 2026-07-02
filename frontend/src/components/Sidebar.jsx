import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Users, Compass, Tent, Map, Shield, HelpCircle, 
  HelpCircle as AboutIcon, Mail, Settings, PlusCircle, ArrowLeftRight, HelpCircle as HelpIcon, Sparkles, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useArticle } from '../context/ArticleContext.jsx';
import api from '../utils/api.js';

export const Sidebar = ({ sidebarOpen, setSidebarOpen, collapsed }) => {
  const { user } = useAuth();
  const { articles } = useArticle();
  const navigate = useNavigate();

  // Helper to close sidebar on mobile click
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleRandomArticle = () => {
    if (articles && articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * articles.length);
      const article = articles[randomIndex];
      navigate(`/articles/${article.slug}`);
    } else {
      navigate('/');
    }
    closeSidebarOnMobile();
  };

  const navGroups = [
    {
      title: "Navigation",
      items: [
        { name: "Main Page", path: "/", icon: Home },
        { name: "Random Article", onClick: handleRandomArticle, icon: Sparkles },
      ]
    },
    {
      title: "Browse Wiki",
      items: [
        { name: "Departments", path: "/category/departments", icon: BookOpen },
        { name: "Faculty Profiles", path: "/category/faculty", icon: Users },
        { name: "Courses Info", path: "/category/courses", icon: BookOpen },
        { name: "Research & Labs", path: "/category/research-labs", icon: Compass },
      ]
    },
    {
      title: "Residential & Life",
      items: [
        { name: "Hostels Guide", path: "/category/hostels", icon: Tent },
        { name: "Campus Facilities", path: "/category/campus-facilities", icon: Map },
        { name: "Student Clubs", path: "/category/student-clubs-gymkhana", icon: Compass },
        { name: "Student Life (Fests)", path: "/category/student-life", icon: Compass },
      ]
    },
    {
      title: "Institute Details",
      items: [
        { name: "Academic Calendar", path: "/articles/academic-calendar", icon: BookOpen },
        { name: "Institute Policies", path: "/articles/institute-policies", icon: Shield },
        { name: "Placement Stats", path: "/articles/placement-stats", icon: ArrowLeftRight },
      ]
    },
    {
      title: "Contribute",
      items: [
        { name: "Create Article", path: "/editor", icon: PlusCircle },
        { name: "Recent Changes", path: "/recent-changes", icon: ArrowLeftRight },
      ]
    },
    {
      title: "System Support",
      items: [
        { name: "Help Center", path: "/articles/help-center", icon: HelpIcon },
        { name: "About IITGN Wiki", path: "/articles/about-iitgn-wiki", icon: AboutIcon },
        { name: "Contact Admins", path: "/articles/contact-admins", icon: Mail },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed bottom-0 top-16 z-30 flex flex-col border-r border-[#a2a9b1] bg-[#f6f6f6] transition-all duration-300 dark:border-slate-800 dark:bg-slate-950
          ${sidebarOpen ? 'left-0 w-64' : '-left-full lg:left-0'}
          ${collapsed ? 'lg:w-16 lg:overflow-hidden' : 'lg:w-60'}
        `}
      >
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {/* Group Title */}
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  {group.title}
                </h3>
              )}
              
              <ul className="space-y-0.5">
                {group.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    {item.onClick ? (
                      <button
                        onClick={item.onClick}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white
                          ${collapsed ? 'justify-center' : ''}
                        `}
                      >
                        <item.icon className="h-5 w-5 shrink-0 text-gray-400 dark:text-slate-500 group-hover:text-gray-900" />
                        {!collapsed && <span>{item.name}</span>}
                      </button>
                    ) : (
                      <NavLink
                        to={item.path}
                        onClick={closeSidebarOnMobile}
                        className={({ isActive }) => `
                          flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                          ${collapsed ? 'justify-center' : ''}
                          ${isActive 
                            ? 'bg-red-50 text-iitgn-maroon dark:bg-red-950/20 dark:text-red-400' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white'
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer in Sidebar */}
        {!collapsed && (
          <div className="border-t border-gray-100 p-4 text-center text-xs text-gray-400 dark:border-slate-800">
            <p>© {new Date().getFullYear()} IIT Gandhinagar</p>
            <p className="mt-0.5">Community maintained</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
