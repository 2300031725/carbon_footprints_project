export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  badges: string[];
  sustainability_score?: number;
  profile: {
    age: number;
    country: string;
    city: string;
    occupation: string;
    household_size: number;
    transportation_preference: string;
    sustainability_interests: string[];
  };
  blocked?: boolean;
  created_at?: string;
}

export interface CarbonCategoryBreakdown {
  car_km?: number;
  bike_km?: number;
  public_transit_km?: number;
  flights_per_year?: number;
  electricity_kwh?: number;
  gas_lpg?: number;
  renewable_pct?: number;
  diet_type?: string;
  meat_servings?: number;
  food_waste_level?: string;
  online_purchases?: number;
  clothing_purchases?: number;
  electronics_purchases?: number;
  waste_generation?: number;
  emission_co2: number;
}

export interface CarbonRecord {
  id: string;
  user_id: string;
  date: string;
  transportation: CarbonCategoryBreakdown;
  energy: CarbonCategoryBreakdown;
  food: CarbonCategoryBreakdown;
  lifestyle: CarbonCategoryBreakdown;
  total_emission: number;
  sustainability_score: number;
  created_at: string;
}

export interface DashboardSummary {
  monthly_emissions: number;
  yearly_emissions: number;
  sustainability_score: number;
  points: number;
  badges: string[];
}

export interface MLPredictionInput {
  car_km: number;
  electricity: number;
  meat_servings: number;
  online_purchases: number;
}

export interface MLPredictionResult {
  predicted_emissions: number;
  reduced_predicted_emissions: number;
  potential_monthly_saving: number;
}

export interface Goal {
  id: string;
  user_id?: string;
  category: string;
  title: string;
  target_value: number;
  progress: number;
  status: string;
  deadline: string;
  created_at?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  duration_days: number;
  category: string;
  active: boolean;
}

export interface Participation {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'joined' | 'completed';
  joined_at: string;
  completed_at?: string;
}

export interface Comment {
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  likes: string[];
  comments: Comment[];
  created_at: string;
}

export interface LeaderboardItem {
  rank: number;
  user_id: string;
  name: string;
  points: number;
  sustainability_score: number;
  badges_count: number;
  is_self: boolean;
}

export interface AnalyticsData {
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

export interface EmissionFactor {
  key: string;
  value: number;
  unit: string;
  category: string;
}
