'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@chat-app/shared';
import { api } from './api';
interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue>({ user: null, token: null, loading: true, login: () => {}, logout: async () => {} });
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('chat_token');
    if (saved) {
      setToken(saved);
      api.auth
        .me()
        .then(({ user }) => setUser(user))
        .catch(() => {
          localStorage.removeItem('chat_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);
  const login = useCallback((t: string, u: User) => {
    localStorage.setItem('chat_token', t);
    setToken(t);
    setUser(u);
  }, []);
  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {}
    localStorage.removeItem('chat_token');
    setToken(null);
    setUser(null);
  }, []);
  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  return useContext(AuthContext);
}
