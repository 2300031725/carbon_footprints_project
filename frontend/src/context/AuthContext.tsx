import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, isOfflineSandbox } from '../services/api';

interface UserProfile {
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
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isSandboxMode: boolean;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('eco-token'));
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const profile = await api.auth.getMe();
      setUser(profile);
      setIsSandboxMode(isOfflineSandbox);
    } catch (err) {
      console.error('Failed to load user session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }

    // Bind token expiry hook
    const handleExpiry = () => {
      logout();
      alert('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth-expired', handleExpiry);
    return () => window.removeEventListener('auth-expired', handleExpiry);
  }, [token]);

  const login = async (credentials: any) => {
    const data = await api.auth.login(credentials);
    localStorage.setItem('eco-token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setIsSandboxMode(isOfflineSandbox);
  };

  const register = async (credentials: any) => {
    const data = await api.auth.register(credentials);
    localStorage.setItem('eco-token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setIsSandboxMode(isOfflineSandbox);
  };

  const logout = () => {
    localStorage.removeItem('eco-token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const profile = await api.auth.getMe();
      setUser(profile);
      setIsSandboxMode(isOfflineSandbox);
    }
  };

  const updateProfile = async (profileData: any) => {
    const updatedUser = await api.auth.updateProfile(profileData);
    setUser(updatedUser);
    setIsSandboxMode(isOfflineSandbox);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isSandboxMode,
      login,
      register,
      logout,
      refreshUser,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
