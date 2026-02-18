import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { UserAuth } from "../context/AuthContext";

const Layout = () => {
  const { signOut } = UserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "bg-emerald-800 text-white shadow-sm"
      : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white";

  // New helper for mobile links to ensure they all share the exact same hover style
  const mobileLinkClass = (path: string) =>
    `block px-3 py-2 rounded-md text-base font-medium mb-1 transition-colors ${location.pathname === path
      ? "bg-emerald-900 text-white"
      : "text-emerald-100 hover:bg-emerald-700 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900 transition-colors duration-300 flex flex-col">

      {/* Top Navigation Bar */}
      <nav className="bg-emerald-900 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:animate-wiggle">🌿</span>
                <span className="font-bold text-xl tracking-wider text-white">Prop-A-Bility</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/dashboard')}`}
              >
                My Garden
              </Link>

              <Link
                to="/upload"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/upload')}`}
              >
                Analyze Plant
              </Link>

              <div className="h-6 w-px bg-emerald-800 mx-2"></div>

              <button
                onClick={handleSignOut}
                className="text-emerald-200 hover:text-white text-sm font-medium transition-colors hover:cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button (Hamburger) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-emerald-100 hover:text-white hover:bg-emerald-800 p-2 rounded-md focus:outline-none transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-emerald-800 pb-4 px-4 pt-2 shadow-inner">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileLinkClass('/dashboard')}
            >
              My Garden
            </Link>
            <Link
              to="/upload"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileLinkClass('/upload')}
            >
              Analyze Plant
            </Link>
            <button
              onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-emerald-100 hover:bg-emerald-700 hover:text-white hover:cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-stone-800 border-t border-gray-200 dark:border-stone-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 dark:text-stone-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Prop-A-Bility Lab. All roots reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
