import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, Flame
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  duration_days: number;
  category: string;
}

interface Participation {
  id: string;
  challenge_id: string;
  status: string;
}

const Challenges: React.FC = () => {
  const { refreshUser } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chalRes, partRes] = await Promise.all([
        api.goals.listChallenges(),
        api.goals.getParticipations()
      ]);
      setChallenges(chalRes);
      setParticipations(partRes);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoinChallenge = async (id: string) => {
    try {
      setActionLoading(id);
      await api.goals.joinChallenge(id);
      // Reload participations
      const updatedParts = await api.goals.getParticipations();
      setParticipations(updatedParts);
    } catch (err) {
      console.error(err);
      alert('Failed to join challenge.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteChallenge = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await api.goals.completeChallenge(id);
      alert(res.message);
      
      // Reload everything to sync points/badges
      await Promise.all([
        loadData(),
        refreshUser()
      ]);
    } catch (err) {
      console.error(err);
      alert('Failed to complete challenge.');
    } finally {
      setActionLoading(null);
    }
  };

  const getChallengeStatus = (id: string): 'none' | 'joined' | 'completed' => {
    const found = participations.find(p => p.challenge_id === id);
    if (!found) return 'none';
    return found.status as 'joined' | 'completed';
  };

  const categoryBadges: Record<string, string> = {
    transportation: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400',
    energy: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
    food: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
    lifestyle: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Eco Challenges</h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Join group activities, reduce your footprint, and earn badges.
          </p>
        </div>
        <div className="bg-amber-500 text-slate-950 rounded-2xl px-4 py-2 flex items-center gap-1.5 font-black text-sm shadow-md shadow-amber-500/10">
          <Flame className="w-5 h-5 fill-current" />
          <span>Weekly Event</span>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-450 py-12">Loading Eco Challenges...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge.id);
            const joined = status === 'joined';
            const completed = status === 'completed';
            
            return (
              <div 
                key={challenge.id}
                className={`glass-panel p-6 rounded-3xl flex flex-col justify-between shadow-sm border transition-all ${
                  completed 
                    ? 'border-eco-500 bg-eco-50/5' 
                    : joined 
                      ? 'border-blue-500/30 bg-blue-50/5' 
                      : 'border-slate-200/50 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-2xs font-extrabold px-2.5 py-1 rounded-md uppercase ${
                      categoryBadges[challenge.category] || 'bg-slate-100 text-slate-650'
                    }`}>
                      {challenge.category}
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
                      +{challenge.points} Eco Points
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-950 dark:text-white text-lg mt-1">{challenge.title}</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mt-1">
                    {challenge.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex justify-between items-center">
                  <span className="text-2xs font-bold text-slate-400">Duration: {challenge.duration_days} Days</span>
                  
                  {completed ? (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-eco-600 dark:text-eco-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </span>
                  ) : joined ? (
                    <button
                      onClick={() => handleCompleteChallenge(challenge.id)}
                      disabled={actionLoading === challenge.id}
                      className="px-5 py-2.5 bg-eco-600 hover:bg-eco-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-eco-600/10 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === challenge.id ? 'Completing...' : 'Mark Completed'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={actionLoading === challenge.id}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {actionLoading === challenge.id ? 'Joining...' : 'Accept Challenge'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Challenges;
