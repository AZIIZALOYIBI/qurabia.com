/**
 * ============================================================
 * auth-store.ts - Zustand Store for Authentication State
 * QURABIA
 *
 * Manages authentication state including:
 * - User information
 * - Login/logout
 * - Token management
 * - Registration
 * - OAuth (Google)
 * ============================================================
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

// --- Types ---

export type PlanId = 'explorer' | 'researcher' | 'professional' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: PlanId;
  provider: 'google' | 'email' | 'guest';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// --- Actions ---

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updatePlan: (plan: PlanId) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  checkTokenExpiration: () => void;
}

// --- Store ---

export type AuthStore = AuthState & AuthActions;

// JWT Payload interface
interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  avatar?: string;
  plan?: PlanId;
  provider?: 'google' | 'email' | 'guest';
  exp: number;
}

// Helper function to decode user from token
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

// API Base URL
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

// Default state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // --- Set User ---
        setUser: (user) => {
          set(
            { user, isAuthenticated: !!user },
            false,
            'setUser',
          );
        },

        // --- Set Token ---
        setToken: (token) => {
          if (token) {
            try {
              const user = userFromToken(token);
              set(
                { token, user, isAuthenticated: true, error: null },
                false,
                'setToken',
              );
            } catch (error) {
              console.error('[AuthStore] Invalid token:', error);
              set(
                { token: null, user: null, isAuthenticated: false, error: 'توكن غير صالح' },
                false,
                'setTokenError',
              );
            }
          } else {
            set(
              { token: null, user: null, isAuthenticated: false },
              false,
              'clearToken',
            );
          }
        },

        // --- Set Error ---
        setError: (error) => {
          set({ error }, false, 'setError');
        },

        // --- Login ---
        login: async (email, password) => {
          set({ isLoading: true, error: null }, false, 'loginStart');
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
            const token = data.token;
            get().setToken(token);

            set({ isLoading: false }, false, 'loginSuccess');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'فشل تسجيل الدخول';
            set(
              { isLoading: false, error: message },
              false,
              'loginError',
            );
            throw error;
          }
        },

        // --- Register ---
        register: async (name, email, password) => {
          set({ isLoading: true, error: null }, false, 'registerStart');
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
            const token = data.token;
            get().setToken(token);

            set({ isLoading: false }, false, 'registerSuccess');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'فشل إنشاء الحساب';
            set(
              { isLoading: false, error: message },
              false,
              'registerError',
            );
            throw error;
          }
        },

        // --- Login with Google ---
        loginWithGoogle: async (credential) => {
          set({ isLoading: true, error: null }, false, 'googleLoginStart');
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
            const token = data.token;
            get().setToken(token);

            set({ isLoading: false }, false, 'googleLoginSuccess');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'فشل تسجيل الدخول عبر Google';
            set(
              { isLoading: false, error: message },
              false,
              'googleLoginError',
            );
            throw error;
          }
        },

        // --- Logout ---
        logout: () => {
          console.log('[AuthStore] Logging out');
          set(
            {
              user: null,
              token: null,
              isAuthenticated: false,
              error: null,
            },
            false,
            'logout',
          );
        },

        // --- Update Plan ---
        updatePlan: (plan) => {
          set(
            (state) => ({
              user: state.user ? { ...state.user, plan } : null,
            }),
            false,
            'updatePlan',
          );
        },

        // --- Check Token Expiration ---
        checkTokenExpiration: () => {
          const { token } = get();
          if (!token) return;

          try {
            const decoded = jwtDecode<JWTPayload>(token);
            if (decoded.exp * 1000 < Date.now()) {
              console.log('[AuthStore] Token expired, logging out');
              get().logout();
            }
          } catch (error) {
            console.error('[AuthStore] Error checking token expiration:', error);
            get().logout();
          }
        },
      }),
      {
        name: 'qurabia-auth-store',
        // Persist token and user
        partialize: (state) => ({
          token: state.token,
          user: state.user,
        }),
        // Rehydrate token and check expiration on load
        onRehydrateStorage: () => (state) => {
          if (state?.token) {
            state.checkTokenExpiration();
          }
        },
      },
    ),
    {
      name: 'AuthStore',
      enabled: import.meta.env.DEV,
    },
  ),
);

// --- Selectors (for optimized access) ---

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthToken = () => useAuthStore((state) => state.token);

// Selector for auth actions
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    register: state.register,
    loginWithGoogle: state.loginWithGoogle,
    logout: state.logout,
    updatePlan: state.updatePlan,
    setError: state.setError,
    checkTokenExpiration: state.checkTokenExpiration,
  }));
