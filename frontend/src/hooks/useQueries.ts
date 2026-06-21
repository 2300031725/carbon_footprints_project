import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { 
  CarbonRecord, DashboardSummary, Goal, Challenge, 
  Participation, Post, LeaderboardItem, UserProfile, 
  EmissionFactor, AnalyticsData 
} from '../types';

// Query Keys
export const queryKeys = {
  dashboardSummary: ['dashboard-summary'] as const,
  carbonHistory: ['carbon-history'] as const,
  recommendations: ['recommendations'] as const,
  goals: ['goals'] as const,
  challenges: ['challenges'] as const,
  participations: ['participations'] as const,
  leaderboard: ['leaderboard'] as const,
  posts: ['posts'] as const,
  adminUsers: ['admin-users'] as const,
  adminFactors: ['admin-factors'] as const,
  adminAnalytics: ['admin-analytics'] as const,
};

// ==========================================
// CARBON & DASHBOARD QUERIES & MUTATIONS
// ==========================================

export const useDashboardSummaryQuery = (enabled = true) => {
  return useQuery<DashboardSummary>({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => api.carbon.getDashboardSummary(),
    enabled,
  });
};

export const useCarbonHistoryQuery = (enabled = true) => {
  return useQuery<CarbonRecord[]>({
    queryKey: queryKeys.carbonHistory,
    queryFn: () => api.carbon.getHistory(),
    enabled,
  });
};

export const useRecommendationsQuery = (enabled = true) => {
  return useQuery<any[]>({
    queryKey: queryKeys.recommendations,
    queryFn: () => api.carbon.getRecommendations(),
    enabled,
  });
};

export const useCalculateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.carbon.calculate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.carbonHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
};

export const usePredictMutation = () => {
  return useMutation({
    mutationFn: (data: any) => api.carbon.predict(data),
  });
};

// ==========================================
// GOALS & CHALLENGES QUERIES & MUTATIONS
// ==========================================

export const useGoalsQuery = (enabled = true) => {
  return useQuery<Goal[]>({
    queryKey: queryKeys.goals,
    queryFn: () => api.goals.list(),
    enabled,
  });
};

export const useCreateGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.goals.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
};

export const useUpdateGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.goals.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
};

export const useDeleteGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.goals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
};

export const useChallengesQuery = (enabled = true) => {
  return useQuery<Challenge[]>({
    queryKey: queryKeys.challenges,
    queryFn: () => api.goals.listChallenges(),
    enabled,
  });
};

export const useParticipationsQuery = (enabled = true) => {
  return useQuery<Participation[]>({
    queryKey: queryKeys.participations,
    queryFn: () => api.goals.getParticipations(),
    enabled,
  });
};

export const useJoinChallengeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.goals.joinChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participations });
    },
  });
};

export const useCompleteChallengeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.goals.completeChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participations });
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
};

// ==========================================
// COMMUNITY & POSTS QUERIES & MUTATIONS
// ==========================================

export const useLeaderboardQuery = (enabled = true) => {
  return useQuery<LeaderboardItem[]>({
    queryKey: queryKeys.leaderboard,
    queryFn: () => api.community.getLeaderboard(),
    enabled,
  });
};

export const usePostsQuery = (enabled = true) => {
  return useQuery<Post[]>({
    queryKey: queryKeys.posts,
    queryFn: () => api.community.getPosts(),
    enabled,
  });
};

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.community.createPost(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
};

export const useLikePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.community.likePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

export const useCommentPostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string, content: string }) => api.community.commentPost(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
};

// ==========================================
// ADMIN DASHBOARD QUERIES & MUTATIONS
// ==========================================

export const useAdminUsersQuery = (enabled = true) => {
  return useQuery<UserProfile[]>({
    queryKey: queryKeys.adminUsers,
    queryFn: () => api.admin.getUsers(),
    enabled,
  });
};

export const useAdminFactorsQuery = (enabled = true) => {
  return useQuery<EmissionFactor[]>({
    queryKey: queryKeys.adminFactors,
    queryFn: () => api.admin.getFactors(),
    enabled,
  });
};

export const useAdminAnalyticsQuery = (enabled = true) => {
  return useQuery<AnalyticsData>({
    queryKey: queryKeys.adminAnalytics,
    queryFn: () => api.admin.getAnalytics(),
    enabled,
  });
};

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string, blocked: boolean }) => api.admin.blockUser(id, blocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAnalytics });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAnalytics });
    },
  });
};

export const useUpdateFactorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.admin.updateFactor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminFactors });
    },
  });
};

export const useCreateChallengeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.admin.createChallenge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAnalytics });
    },
  });
};
