import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, Users, Activity, Target, Trophy, Ban, UserX, Check, Edit3, Plus, Volume2
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  blocked: boolean;
  created_at: string;
}

interface FactorItem {
  id?: string;
  key: string;
  value: number;
  unit: string;
  category: string;
}

interface AnalyticsData {
  total_users: number;
  active_users: number;
  total_emissions_calculations: number;
  estimated_carbon_saved_kg: number;
  challenges: {
    total_participants: number;
    total_completions: number;
    completion_rate_pct: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'factors' | 'challenges'>('users');
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [factorsList, setFactorsList] = useState<FactorItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    total_users: 0,
    active_users: 0,
    total_emissions_calculations: 0,
    estimated_carbon_saved_kg: 0,
    challenges: { total_participants: 0, total_completions: 0, completion_rate_pct: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  
  // Custom Challenge Form State
  const [chalTitle, setChalTitle] = useState('');
  const [chalDesc, setChalDesc] = useState('');
  const [chalPoints, setChalPoints] = useState(100);
  const [chalDuration, setChalDuration] = useState(7);
  const [chalCat, setChalCat] = useState('lifestyle');
  const [chalCreating, setChalCreating] = useState(false);

  // Edit Factor State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, factorsRes, analyticRes] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getFactors(),
        api.admin.getAnalytics()
      ]);
      setUsersList(usersRes);
      setFactorsList(factorsRes);
      setAnalytics(analyticRes);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      await api.admin.blockUser(userId, !currentBlocked);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, blocked: !currentBlocked } : u));
    } catch (err) {
      console.error(err);
      alert('Failed to update user block status.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? All their carbon records will be erased.')) return;
    try {
      await api.admin.deleteUser(userId);
      setUsersList(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  const handleSaveFactorValue = async (key: string) => {
    try {
      const targetFactor = factorsList.find(f => f.key === key);
      if (!targetFactor) return;

      await api.admin.updateFactor({
        key,
        value: editValue,
        unit: targetFactor.unit,
        category: targetFactor.category
      });
      
      setFactorsList(prev => prev.map(f => f.key === key ? { ...f, value: editValue } : f));
      setEditingKey(null);
      alert('Emission factor updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update emission factor.');
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chalTitle || !chalDesc) {
      alert('Please fill in all challenge fields.');
      return;
    }

    try {
      setChalCreating(true);
      await api.admin.createChallenge({
        title: chalTitle,
        description: chalDesc,
        points: Number(chalPoints),
        duration_days: Number(chalDuration),
        category: chalCat
      });
      setChalTitle('');
      setChalDesc('');
      alert('Weekly Challenge created and announced to the community feed!');
      // Refresh analytics
      const analyticRes = await api.admin.getAnalytics();
      setAnalytics(analyticRes);
    } catch (err) {
      console.error(err);
      alert('Failed to create challenge.');
    } finally {
      setChalCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center font-bold text-eco-600">
        Loading Admin Panel...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-eco-600" /> Admin Command Center
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Monitor platforms carbon counts, edit emission metrics, and manage user bases.
        </p>
      </div>

      {/* Analytics KPI Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Total Users</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">{analytics.total_users}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Calculations Logged</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">{analytics.total_emissions_calculations}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Carbon Offset</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">{analytics.estimated_carbon_saved_kg} kg</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-eco-500/10 text-eco-600 dark:text-eco-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Challenge Completions</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {analytics.challenges.total_completions}/{analytics.challenges.total_participants} ({analytics.challenges.completion_rate_pct}%)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 mt-4">
        {[
          { id: 'users', label: 'User Accounts' },
          { id: 'factors', label: 'Emission Factors' },
          { id: 'challenges', label: 'Weekly Challenges' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3.5 text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? 'text-eco-600 dark:text-eco-400'
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-eco-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Panels content */}
      <div className="min-h-[300px]">
        {activeTab === 'users' && (
          <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-450 uppercase font-black tracking-wide border-b border-slate-100 dark:border-slate-850">
                    <th className="px-5 py-4">User Details</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Points</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-850/60 last:border-none hover:bg-slate-50/50 dark:hover:bg-slate-900/10 font-semibold text-slate-650 dark:text-slate-300">
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-950 dark:text-white">{user.name}</p>
                        <p className="text-3xs text-slate-400 mt-0.5">{user.email}</p>
                      </td>
                      <td className="px-5 py-4 capitalize">{user.role}</td>
                      <td className="px-5 py-4 text-eco-600 dark:text-eco-400">{user.points} pts</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-3xs font-extrabold uppercase ${
                          user.blocked 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450' 
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        }`}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-right flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleToggleBlock(user.id, user.blocked)}
                          className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${
                            user.blocked 
                              ? 'border-emerald-200/50 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800/40 dark:text-emerald-450 dark:hover:bg-emerald-950/20' 
                              : 'border-rose-200/50 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:text-rose-450 dark:hover:bg-rose-950/20'
                          }`}
                          title={user.blocked ? "Unblock Account" : "Block Account"}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-850"
                          title="Delete User"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-450 uppercase font-black tracking-wide border-b border-slate-100 dark:border-slate-850">
                    <th className="px-5 py-4">Factor Key</th>
                    <th className="px-5 py-4">Value (kg CO2)</th>
                    <th className="px-5 py-4">Measurement Unit</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {factorsList.map((factor) => {
                    const isEditing = editingKey === factor.key;
                    return (
                      <tr key={factor.key} className="border-b border-slate-100 dark:border-slate-850/60 last:border-none hover:bg-slate-50/50 dark:hover:bg-slate-900/10 font-semibold text-slate-650 dark:text-slate-300">
                        <td className="px-5 py-4 font-extrabold text-slate-950 dark:text-white">{factor.key}</td>
                        <td className="px-5 py-4 text-sm font-black">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.001"
                              value={editValue}
                              onChange={(e) => setEditValue(Number(e.target.value))}
                              className="w-24 px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-lg text-xs font-bold"
                            />
                          ) : (
                            factor.value
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-400">{factor.unit}</td>
                        <td className="px-5 py-4 capitalize">{factor.category}</td>
                        <td className="px-5 py-4 text-right flex justify-end">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveFactorValue(factor.key)}
                              className="p-1.5 text-eco-600 bg-eco-50 dark:bg-eco-950/20 border border-eco-200 rounded-lg hover:bg-eco-100"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingKey(factor.key);
                                setEditValue(factor.value);
                              }}
                              className="p-1.5 text-slate-400 hover:text-eco-650 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-105 pb-3">
                <Volume2 className="w-5 h-5 text-eco-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Write Challenge Announcement</h3>
              </div>
              <p className="text-xs text-slate-500 leading-normal mb-1">
                Creating a weekly eco challenge automatically publishes an announcement on the global Community board, alerting all active users.
              </p>

              <form onSubmit={handleCreateChallenge} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Challenge Title</label>
                  <input
                    type="text" value={chalTitle} onChange={(e) => setChalTitle(e.target.value)}
                    placeholder="e.g. No Plastic Week"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Description & Terms</label>
                  <textarea
                    rows={3} value={chalDesc} onChange={(e) => setChalDesc(e.target.value)}
                    placeholder="Provide rules for logging completion..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Points Awarded</label>
                    <input
                      type="number" value={chalPoints} onChange={(e) => setChalPoints(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Duration (Days)</label>
                    <input
                      type="number" value={chalDuration} onChange={(e) => setChalDuration(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Category</label>
                    <select
                      value={chalCat} onChange={(e) => setChalCat(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                    >
                      <option value="transportation">Transportation</option>
                      <option value="energy">Energy</option>
                      <option value="food">Food</option>
                      <option value="lifestyle">Lifestyle</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={chalCreating}
                  className="eco-gradient text-white font-bold py-3 rounded-xl shadow-md shadow-eco-600/10 hover:shadow-lg mt-3 flex items-center justify-center gap-1.5 self-end px-8 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{chalCreating ? 'Publishing...' : 'Publish Challenge'}</span>
                </button>
              </form>
            </div>
            
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-950 dark:text-white text-sm mb-2">Announcing System</h4>
              <p className="text-xs text-slate-500 leading-normal">
                When you publish a challenge here:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-500 flex flex-col gap-2 mt-3 pl-1">
                <li>It goes live in the user **Eco Challenges** section immediately.</li>
                <li>An automated bulletin post gets pinned to the top of the **Community Board** feed.</li>
                <li>Users earn the designated Eco Points upon completing tasks.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
