import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import { 
  TrendingDown, FileSpreadsheet, FileDown, Leaf, Award, Trophy, Star, ArrowRight, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

interface DashboardData {
  monthly_emissions: number;
  yearly_emissions: number;
  sustainability_score: number;
  points: number;
  badges: string[];
}

interface HistoryItem {
  id: string;
  date: string;
  total_emission: number;
  transportation: { emission_co2: number };
  energy: { emission_co2: number };
  food: { emission_co2: number };
  lifestyle: { emission_co2: number };
}

interface RecItem {
  category: string;
  title: string;
  tip: string;
  impact: string;
  potential_saving: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  
  const [summary, setSummary] = useState<DashboardData>({
    monthly_emissions: 0,
    yearly_emissions: 0,
    sustainability_score: 0,
    points: 0,
    badges: []
  });
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [recs, setRecs] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, histRes, recRes] = await Promise.all([
        api.carbon.getDashboardSummary(),
        api.carbon.getHistory(),
        api.carbon.getRecommendations()
      ]);
      setSummary(sumRes);
      setHistory(histRes.reverse()); // Chronological order
      setRecs(recRes);
      await refreshUser(); // sync score/points
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format pie chart data
  const pieData = history.length > 0 ? [
    { name: t('transportation'), value: history[history.length - 1].transportation?.emission_co2 || 0, color: '#06B6D4' },
    { name: t('energy'), value: history[history.length - 1].energy?.emission_co2 || 0, color: '#F59E0B' },
    { name: t('food'), value: history[history.length - 1].food?.emission_co2 || 0, color: '#10B981' },
    { name: t('lifestyle'), value: history[history.length - 1].lifestyle?.emission_co2 || 0, color: '#8B5CF6' }
  ].filter(item => item.value > 0) : [];

  // Format historical bar chart data
  const barData = history.map(item => ({
    name: item.date,
    CO2: item.total_emission,
    Transportation: item.transportation?.emission_co2 || 0,
    Energy: item.energy?.emission_co2 || 0,
    Food: item.food?.emission_co2 || 0,
    Lifestyle: item.lifestyle?.emission_co2 || 0
  }));

  const handleDownloadPDF = () => {
    api.carbon.downloadPDF();
  };

  const handleDownloadExcel = () => {
    api.carbon.downloadExcel();
  };

  const badgeColors: Record<string, string> = {
    "Green Beginner": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/40",
    "Carbon Reducer": "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200/40",
    "Eco Warrior": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/40",
    "Sustainability Champion": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/40"
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center font-bold text-eco-600 dark:text-eco-400">
        Loading Eco Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Banner Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Eco Dashboard</h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Analyze your environmental footprint and review carbon offsets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Emissions</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.monthly_emissions > 0 ? `${summary.monthly_emissions} kg` : '0 kg'}
            </span>
            <span className="text-2xs font-semibold text-slate-450 dark:text-slate-400">CO2 Equivalent</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Annual</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.yearly_emissions > 0 ? `${(summary.yearly_emissions / 1000).toFixed(2)} tons` : '0 tons'}
            </span>
            <span className="text-2xs font-semibold text-slate-450 dark:text-slate-400">CO2 Equivalent</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-eco-500/10 text-eco-600 dark:text-eco-400 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-eco-500" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sustainability Score</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.sustainability_score > 0 ? `${summary.sustainability_score}/100` : 'N/A'}
            </span>
            <span className="text-2xs font-semibold text-slate-450 dark:text-slate-400">Calculated Index</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Dashboard Chart & Info Panels */}
      {history.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-4 mt-2">
          <Leaf className="w-16 h-16 text-slate-300 dark:text-slate-700 stroke-1 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">No Carbon Calculations Found</h3>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed">
            Begin by calculating your carbon footprint using our Multi-step questionnaire to unlock dashboard analytics and insights.
          </p>
          <a href="/calculator" className="eco-gradient text-white text-sm font-bold px-6 py-3 rounded-xl mt-2 shadow-lg shadow-eco-600/15">
            Run Calculator Now
          </a>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Breakdown (Pie) */}
            <div className="glass-panel p-6 rounded-3xl lg:col-span-5 flex flex-col justify-between shadow-sm min-h-[350px]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Emissions by Category</h3>
                <p className="text-2xs text-slate-450 uppercase font-semibold mt-1">Breakdown of latest footprint log</p>
              </div>
              <div className="h-56 relative flex items-center justify-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} kg CO2`} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center score labels */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Score</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{summary.sustainability_score}</span>
                </div>
              </div>
              
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 mt-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}: {item.value} kg</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Progress (Bar) */}
            <div className="glass-panel p-6 rounded-3xl lg:col-span-7 flex flex-col justify-between shadow-sm min-h-[350px]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Carbon History Trend</h3>
                <p className="text-2xs text-slate-450 uppercase font-semibold mt-1">Monthly emissions logs over time</p>
              </div>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => `${value} kg`} />
                    <Bar dataKey="Transportation" stackId="a" fill="#06B6D4" />
                    <Bar dataKey="Energy" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="Food" stackId="a" fill="#10B981" />
                    <Bar dataKey="Lifestyle" stackId="a" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gamification & AI Recommendations Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gamification shelf (Achievements, Badges) */}
            <div className="glass-panel p-6 rounded-3xl lg:col-span-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/20" /> Unlocked Achievements
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-1">Complete goals and challenges to secure badges</p>
              </div>

              <div className="flex flex-col gap-3 my-5">
                {summary.badges.length === 0 ? (
                  <p className="text-xs text-slate-450 text-center py-4 font-semibold">No achievements unlocked yet. Keep working!</p>
                ) : (
                  summary.badges.map((badge, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold ${
                        badgeColors[badge] || 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Star className="w-4.5 h-4.5 fill-current" />
                        <span>{badge}</span>
                      </div>
                      <span className="text-2xs opacity-75 font-black uppercase">Unlocked</span>
                    </div>
                  ))
                )}
              </div>

              <a href="/challenges" className="flex items-center justify-between text-xs font-bold text-eco-600 hover:text-eco-700 dark:text-eco-400 dark:hover:text-eco-350 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span>View Eco Challenges</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* AI Advisor Card */}
            <div className="glass-panel p-6 rounded-3xl lg:col-span-7 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-eco-600 animate-pulse" /> AI Sustainability Recommendations
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-1">Personalized action points matching your activity</p>
              </div>

              <div className="flex flex-col gap-3.5 my-4">
                {recs.length === 0 ? (
                  <p className="text-xs text-slate-450 text-center py-6">Calculating tips...</p>
                ) : (
                  recs.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-extrabold text-eco-700 dark:text-eco-300 bg-eco-50 dark:bg-eco-950/20 px-2 py-0.5 rounded-md">
                          {rec.category}
                        </span>
                        <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-md uppercase ${
                          rec.impact === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450'
                        }`}>
                          {rec.impact} Impact
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rec.title}</h4>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-normal">{rec.tip}</p>
                      <p className="text-2xs text-slate-400 font-bold uppercase tracking-wider mt-2">Potential Saving: {rec.potential_saving}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
