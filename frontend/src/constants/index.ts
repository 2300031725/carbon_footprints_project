export const BADGE_COLORS: Record<string, string> = {
  "Green Beginner": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/40",
  "Carbon Reducer": "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200/40",
  "Eco Warrior": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/40",
  "Sustainability Champion": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/40"
};

export const CATEGORY_BADGES: Record<string, string> = {
  transportation: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400',
  energy: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
  food: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
  lifestyle: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
};

export const CATEGORY_COLORS: Record<string, string> = {
  transportation: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400',
  energy: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
  food: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
  lifestyle: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
};

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const LOCAL_TOKEN_KEY = 'eco-token';
export const SANDBOX_DB_KEY = 'ecotrack_sandbox_db';
export const THEME_KEY = 'eco-theme';
export const LANGUAGE_KEY = 'i18nextLng';
export const REFETCH_INTERVAL = 300000; // 5 minutes cache refresh
