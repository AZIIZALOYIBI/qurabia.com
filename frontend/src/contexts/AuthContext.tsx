import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: PlanId;
  provider: 'google' | 'email' | 'guest';
}

type PlanId = 'explorer' | 'researcher' | 'professional' | 'enterprise';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updatePlan: (plan: PlanId) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = (() => {
  try {
    const override = localStorage.getItem('qurabia.apiBase') || '';
    if (override) return override.trim().replace(/\/+$/, '');
  } catch {}
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '';
  return 'https://api.qurabia.com';
})();

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  avatar?: string;
  plan?: PlanId;
  provider?: 'google' | 'email' | 'guest';
  exp: number;
}

function userFromToken(token: string): User {
  const decoded = jwtDecode<JWTPayload>(token);
  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.name,
    avatar: decoded.avatar,
    plan: decoded.plan || 'explorer',
    provider: decoded.provider || 'email',
  };
}

const TOKEN_KEY = 'qurabia.auth.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) return userFromToken(t);
    } catch {}
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    } else {
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      if (decoded.exp * 1000 < Date.now()) {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || 'فشل تسجيل الدخول');
      }
      const data = await resp.json();
      const t = data.token;
      setToken(t);
      setUser(userFromToken(t));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || 'فشل إنشاء الحساب');
      }
      const data = await resp.json();
      const t = data.token;
      setToken(t);
      setUser(userFromToken(t));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || 'فشل تسجيل الدخول عبر Google');
      }
      const data = await resp.json();
      const t = data.token;
      setToken(t);
      setUser(userFromToken(t));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  }, []);

  const updatePlan = useCallback((plan: PlanId) => {
    setUser(prev => prev ? { ...prev, plan } : prev);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updatePlan,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { User, PlanId };
export { AuthContext };
