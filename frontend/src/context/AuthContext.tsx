import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPreferences } from '../types';
import apiClient from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('logicforge_token');
    const savedUser = localStorage.getItem('logicforge_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse cached user', err);
        localStorage.removeItem('logicforge_token');
        localStorage.removeItem('logicforge_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('logicforge_token', newToken);
    localStorage.setItem('logicforge_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('logicforge_token');
    localStorage.removeItem('logicforge_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get<User>('/auth/me');
      setUser(res.data);
      localStorage.setItem('logicforge_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Error refreshing user details', err);
    }
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    try {
      const res = await apiClient.post<User>('/users/preferences', preferences);
      setUser(res.data);
      localStorage.setItem('logicforge_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to update preferences', err);
      // Fallback for offline/demo: update local state
      if (user) {
        const updated = { ...user, preferences };
        setUser(updated);
        localStorage.setItem('logicforge_user', JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updatePreferences,
        refreshUser,
      }}
    >
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
