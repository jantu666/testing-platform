'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiFetch,
  clearStoredTokens,
  getStoredUser,
  setStoredTokens,
  setStoredUser,
  type AuthUser,
  API,
} from './api';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { message?: string }).message || 'Login failed');
    }
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    };
    setStoredTokens(data.accessToken, data.refreshToken);
    setStoredUser(data.user);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, nickname: string) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { message?: string }).message || 'Register failed');
    }
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    };
    setStoredTokens(data.accessToken, data.refreshToken);
    setStoredUser(data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await apiFetch<AuthUser & { createdAt?: string }>('/users/me');
    const u: AuthUser = {
      id: me.id,
      email: me.email,
      nickname: me.nickname,
      avatarUrl: me.avatarUrl,
      blocked: me.blocked,
      roles: me.roles,
    };
    setStoredUser(u);
    setUser(u);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
