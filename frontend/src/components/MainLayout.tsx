import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
  Leaf, LayoutDashboard, Calculator, Target, Trophy, Users, User, ShieldAlert,
  LogOut, Sun, Moon, Globe, Menu, X
} from 'lucide-react';
import EcoBot from './EcoBot';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, isSandboxMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('calculator'), path: '/calculator', icon: Calculator },
    { name: t('goals'), path: '/goals', icon: Target },
    { name: t('challenges'), path: '/challenges', icon: Trophy },
    { name: t('community'), path: '/community', icon: Users },
    { name: t('profile'), path: '/profile', icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: t('admin_dashboard'), path: '/admin', icon: ShieldAlert });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sandbox Alert Bar */}
      {isSandboxMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 text-xs font-bold text-center py-1">
          Running in Offline Sandbox Mode (Local Storage Simulating Database)
        </div>
      )}

      {/* Mobile Header */}
      <header className={`md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 ${isSandboxMode ? 'mt-6' : ''}`}>
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-eco-600 text-lg">
          <Leaf className="w-5 h-5 fill-eco-500" />
          <span>EcoTrack</span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <nav 
            className="w-64 max-w-xs h-full bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-eco-600 text-lg flex items-center gap-2">
                  <Leaf className="w-5 h-5 fill-eco-500" /> EcoTrack
                </span>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              {/* User badge score */}
              {user && (
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">Eco Score & Points</p>
                  <p className="text-sm font-bold text-eco-600">{user.points} pts | Score: {user.sustainability_score || 'N/A'}</p>
                </div>
              )}

              <ul className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                          active 
                            ? 'bg-eco-600 text-white shadow-lg shadow-eco-600/20' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> {i18n.language.toUpperCase()}</span>
                </button>
                {langMenuOpen && (
                  <ul className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-50">
                    {['en', 'es', 'fr'].map((lng) => (
                      <li key={lng}>
                        <button 
                          onClick={() => changeLanguage(lng)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-250"
                        >
                          {lng === 'en' ? 'English' : lng === 'es' ? 'Español' : 'Français'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl font-medium text-sm w-full transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col justify-between w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 ${isSandboxMode ? 'pt-12' : ''}`}>
        <div className="flex flex-col gap-8">
          <Link to="/dashboard" className="flex items-center gap-3 font-bold text-eco-600 text-2xl">
            <Leaf className="w-6 h-6 fill-eco-500 text-eco-600" />
            <span>EcoTrack</span>
          </Link>

          {/* User Score widget */}
          {user && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Hello, {user.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-eco-600 bg-eco-50 dark:bg-eco-950/30 px-2 py-1 rounded-lg">
                  {user.points} pts
                </span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                  Score: {user.sustainability_score || 'N/A'}
                </span>
              </div>
            </div>
          )}

          <nav>
            <ul className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                        active 
                          ? 'bg-eco-600 text-white shadow-lg shadow-eco-600/15' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-850/60'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            {/* Language Selection */}
            <div className="relative">
              <button 
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                <Globe className="w-4.5 h-4.5" /> {i18n.language.toUpperCase()}
              </button>
              {langMenuOpen && (
                <ul className="absolute bottom-full left-0 mb-1 w-28 bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-705 rounded-lg shadow-xl p-1 z-50">
                  {['en', 'es', 'fr'].map((lng) => (
                    <li key={lng}>
                      <button 
                        onClick={() => changeLanguage(lng)}
                        className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200"
                      >
                        {lng === 'en' ? 'English' : lng === 'es' ? 'Español' : 'Français'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4.5 py-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl font-bold text-sm w-full transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className={`flex-1 p-6 md:p-8 overflow-y-auto ${isSandboxMode ? 'pt-16 md:pt-14' : ''}`}>
        {children}
      </main>

      {/* Floating AI Chatbot Advisor */}
      <EcoBot />
    </div>
  );
};

export default MainLayout;
