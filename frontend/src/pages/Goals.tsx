import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Target, Calendar, Trash2, Plus, Sparkles
} from 'lucide-react';

interface Goal {
  id: string;
  category: string;
  title: string;
  target_value: number;
  progress: number;
  status: string;
  deadline: string;
}

const Goals: React.FC = () => {
  const { refreshUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Goal Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('transportation');
  const [targetValue, setTargetValue] = useState(10);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await api.goals.list();
      setGoals(res);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setSubmitting(true);
      await api.goals.create({
        category,
        title,
        target_value: Number(targetValue),
        deadline: new Date(deadline).toISOString()
      });
      setTitle('');
      setDeadline('');
      await loadGoals();
    } catch (err) {
      console.error(err);
      alert('Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (id: string, newProgress: number) => {
    try {
      const status = newProgress >= 100 ? 'completed' : 'active';
      await api.goals.update(id, { progress: newProgress, status });
      // Update local state quickly for visual feedback
      setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: newProgress, status } : g));
      if (newProgress >= 100) {
        await refreshUser(); // Sync awarded points
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.goals.delete(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete goal.');
    }
  };

  const categoryColors: Record<string, string> = {
    transportation: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400',
    energy: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
    food: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
    lifestyle: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Sustainability Goals</h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Set custom targets, track progress, and earn Eco Points.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Goals List Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Your Reduction Goals</h3>
          
          {loading ? (
            <div className="text-sm text-slate-450 py-8">Loading Goals...</div>
          ) : goals.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
              <Target className="w-12 h-12 text-slate-350 dark:text-slate-700 stroke-1" />
              <p className="text-sm font-bold text-slate-950 dark:text-white">No active goals yet</p>
              <p className="text-xs text-slate-500 max-w-xs leading-normal">
                Define a goal on the right panel, like reducing electricity or taking transit, to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal) => {
                const isCompleted = goal.status === 'completed';
                return (
                  <div 
                    key={goal.id}
                    className={`glass-panel p-5 rounded-3xl flex flex-col gap-3 shadow-sm border transition-all ${
                      isCompleted ? 'border-eco-500/25 bg-eco-50/10' : 'border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-md uppercase ${
                            categoryColors[goal.category] || 'bg-slate-100 text-slate-650'
                          }`}>
                            {goal.category}
                          </span>
                          {isCompleted && (
                            <span className="flex items-center gap-1 text-2xs font-extrabold text-eco-600 dark:text-eco-400 bg-eco-50 dark:bg-eco-950/20 px-2 py-0.5 rounded-md uppercase">
                              <Sparkles className="w-3 h-3 fill-current" /> Completed (+150 pts)
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-950 dark:text-white mt-1">{goal.title}</h4>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Slider bar */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex justify-between text-2xs font-bold text-slate-450 uppercase tracking-wide">
                        <span>Progress: {goal.progress}%</span>
                        <span>Target: Reduce {goal.target_value}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="eco-gradient h-full rounded-full transition-all duration-300"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      
                      {!isCompleted && (
                        <div className="flex items-center gap-3 mt-2">
                          <input 
                            type="range" min="0" max="100"
                            value={goal.progress}
                            onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                            className="w-full accent-eco-600"
                          />
                          <button
                            onClick={() => handleUpdateProgress(goal.id, 100)}
                            className="text-2xs font-bold text-eco-600 hover:text-eco-700 bg-eco-50 dark:bg-eco-950/20 px-2 py-1 rounded-md border border-eco-200/20 shrink-0"
                          >
                            Mark Complete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Deadline Details */}
                    <div className="flex items-center gap-1 text-2xs font-semibold text-slate-400 mt-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Goal Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Create Custom Goal</h3>
          
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800">
            <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Goal Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Reduce driving, eat vegetarian"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                >
                  <option value="transportation">Transportation</option>
                  <option value="energy">Energy Consumption</option>
                  <option value="food">Food Habits</option>
                  <option value="lifestyle">Shopping & Lifestyle</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  <span>Reduction Target</span>
                  <span className="text-eco-600">{targetValue}%</span>
                </div>
                <input 
                  type="range" min="5" max="95" step="5"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full accent-eco-600 mt-1"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Target Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="eco-gradient text-white font-bold py-3 rounded-xl shadow-md shadow-eco-600/10 hover:shadow-lg mt-2 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Creating...' : 'Add Goal'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Goals;
