import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as api from '../api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('orbix_token');
    if (stored) {
      setToken(stored);
      api
        .getMe()
        .then((u) => {
          setUser(u);
        })
        .catch(() => {
          localStorage.removeItem('orbix_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.login(username, password);
    localStorage.setItem('orbix_token', result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const result = await api.register(username, password);
    localStorage.setItem('orbix_token', result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('orbix_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
