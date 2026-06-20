import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
  Leaf, LayoutDashboard, Calculator, Target, Trophy, Users, User, ShieldAlert,
  LogOut, Sun, Moon, Globe, Menu, X, Bot
} from 'lucide-react';
import { api } from './services/api';

// Pages lazy imports or components
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CarbonCalculator from './pages/Calculator';
import Goals from './pages/Goals';
import Challenges from './pages/Challenges';
import Community from './pages/Community';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin';

// Route guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center font-semibold text-eco-600">Loading EcoTrack...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center font-semibold text-eco-600">Loading EcoTrack...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Sidebar / Layout Component
const MainLayout: React.FC = () => {
  const { user, logout, isSandboxMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);

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

  // Chatbot Drawer States
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'Hello! I am EcoBot, your sustainability AI advisor. Ask me anything about reducing emissions or your EcoTrack achievements!' }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const res = await api.carbon.chat(userMsg);
      setChatMessages(prev => [...prev, { sender: 'bot', text: res.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I had trouble connecting to the advisory model. Please try again!' }]);
    } finally {
      setChatLoading(false);
    }
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
                  <ul className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-50">
                    {['en', 'es', 'fr'].map((lng) => (
                      <li key={lng}>
                        <button 
                          onClick={() => changeLanguage(lng)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
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
                <ul className="absolute bottom-full left-0 mb-1 w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 z-50">
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
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calculator" element={<CarbonCalculator />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Floating AI Chatbot Advisor Drawer */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-eco-600 text-white shadow-xl shadow-eco-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 border border-white/10"
        title="EcoBot Advisory AI"
      >
        <Bot className="w-6 h-6" />
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 max-h-[500px] h-[450px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 overflow-hidden text-left">
          {/* Header */}
          <div className="bg-eco-600 text-white px-5 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 fill-current" />
              <div>
                <h4 className="font-extrabold text-sm leading-tight">EcoBot AI Advisor</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                  <span className="text-3xs font-black opacity-80 uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white hover:opacity-85 text-xs font-bold px-1.5 py-0.5 rounded border border-white/20">Close</button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 font-semibold text-xs leading-normal">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.sender === 'user'
                    ? 'self-end bg-eco-600 text-white rounded-br-none'
                    : 'self-start bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-2.5 italic">
                EcoBot is drafting advice...
              </div>
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your emissions or tips..."
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 bg-eco-600 text-white rounded-xl shadow-md shadow-eco-600/10 hover:bg-eco-700 disabled:opacity-40 text-xs font-bold"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// Router Root
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
