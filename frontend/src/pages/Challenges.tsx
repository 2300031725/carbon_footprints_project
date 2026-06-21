import React, { useState } from 'react';
import { 
  useChallengesQuery, 
  useParticipationsQuery, 
  useJoinChallengeMutation, 
  useCompleteChallengeMutation 
} from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_BADGES } from '../constants';
import { 
  CheckCircle2, Flame
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Challenges: React.FC = () => {
  const { refreshUser } = useAuth();
  
  // React Query Queries
  const { data: challenges = [], isLoading: challengesLoading } = useChallengesQuery();
  const { data: participations = [], isLoading: participationsLoading } = useParticipationsQuery();
  
  // Mutations
  const joinChallengeMutation = useJoinChallengeMutation();
  const completeChallengeMutation = useCompleteChallengeMutation();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleJoinChallenge = async (id: string) => {
    try {
      setActionLoadingId(id);
      await joinChallengeMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
      alert('Failed to join challenge.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteChallenge = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await completeChallengeMutation.mutateAsync(id);
      alert(res.message);
      await refreshUser(); // Sync awarded points in context
    } catch (err) {
      console.error(err);
      alert('Failed to complete challenge.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getChallengeStatus = (id: string): 'none' | 'joined' | 'completed' => {
    const found = participations.find(p => p.challenge_id === id);
    if (!found) return 'none';
    return found.status as 'joined' | 'completed';
  };

  const loading = challengesLoading || participationsLoading;

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto font-semibold">
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
        <LoadingSpinner message="Loading Eco Challenges..." className="min-h-[300px]" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge.id);
            const joined = status === 'joined';
            const completed = status === 'completed';
            const actionLoading = actionLoadingId === challenge.id;
            
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
                      CATEGORY_BADGES[challenge.category] || 'bg-slate-100 text-slate-655'
                    }`}>
                      {challenge.category}
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
                      +{challenge.points} Eco Points
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-955 dark:text-white text-lg mt-1">{challenge.title}</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mt-1 font-medium">
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
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-eco-600 hover:bg-eco-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-eco-600/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? 'Completing...' : 'Mark Completed'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? 'Joining...' : 'Accept Challenge'}
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
