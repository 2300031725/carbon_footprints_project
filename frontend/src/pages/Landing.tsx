import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Target, Trophy, ArrowRight, Activity, MessageSquare } from 'lucide-react';

const Landing: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold text-eco-600 dark:text-eco-400 text-2xl">
          <Leaf className="w-7 h-7 fill-eco-500 text-eco-500" />
          <span>EcoTrack</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            {['en', 'es', 'fr'].map((lng) => (
              <button 
                key={lng} 
                onClick={() => i18n.changeLanguage(lng)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  i18n.language === lng 
                    ? 'bg-eco-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>

          <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-eco-600 dark:hover:text-eco-400 transition-colors">
            {t('login')}
          </Link>
          <Link to="/register" className="eco-gradient text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-eco-600/15 hover:shadow-xl hover:shadow-eco-600/25 transition-all">
            {t('register')}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 flex flex-col gap-6 text-left">
          <span className="self-start text-xs font-bold text-eco-700 dark:text-eco-300 bg-eco-100 dark:bg-eco-950/40 px-3 py-1.5 rounded-full border border-eco-200/30">
            🌱 Join the Green Revolution
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900 dark:text-white tracking-tight">
            {t('landing_title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-350 max-w-2xl leading-relaxed">
            {t('landing_subtitle')}
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Link to="/register" className="eco-gradient hover:opacity-95 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-eco-600/20 flex items-center gap-2 group transition-all">
              <span>{t('get_started')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 border-t border-slate-200/60 dark:border-slate-800 pt-8 mt-6">
            <div>
              <p className="text-3xl font-extrabold text-eco-600 dark:text-eco-400">12,450+</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Active Eco-Warriors</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-eco-600 dark:text-eco-400">85,200 kg</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total CO2 Saved</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-eco-600 dark:text-eco-400">1,500+</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Goals Completed</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3 shadow-lg shadow-slate-100/50 dark:shadow-none hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Smart Calculator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-normal">
              Input transportation, energy, and food activities to log carbon footprints instantly.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3 shadow-lg shadow-slate-100/50 dark:shadow-none hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-xl bg-eco-500/10 text-eco-600 dark:text-eco-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Eco Goals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-normal">
              Set custom target reductions and watch your progress update dynamically as you log data.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3 shadow-lg shadow-slate-100/50 dark:shadow-none hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Eco Challenges</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-normal">
              Join weekly group activities like 'No Plastic Week' to earn points, raise your score, and secure badges.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-3 shadow-lg shadow-slate-100/50 dark:shadow-none hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">AI EcoBot & ML</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-normal">
              Consult our interactive chatbot advisor and simulate futures with Machine Learning prediction sliders.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/80 py-8 text-center text-xs font-semibold text-slate-550">
        &copy; {new Date().getFullYear()} EcoTrack Platform. All Rights Reserved. Built to WOW you.
      </footer>
    </div>
  );
};

export default Landing;
