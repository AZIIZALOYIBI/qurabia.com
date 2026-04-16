/**
 * ============================================================
 * ui-store.ts - Zustand Store for UI State Management
 * QURABIA
 *
 * Manages UI state including:
 * - Theme (dark/light)
 * - Sidebar state
 * - Modal state
 * - Toast notifications
 * - Loading states
 * ============================================================
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// --- Types ---

export type Theme = 'dark' | 'light';
export type Language = 'ar' | 'en';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface UIState {
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: React.ReactNode | null;
  toasts: Toast[];
  isLoading: boolean;
  loadingMessage: string | null;
}

// --- Actions ---

export interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

// --- Store ---

export type UIStore = UIState & UIActions;

// Default state
const initialState: UIState = {
  theme: 'dark', // Dark theme is the default
  language: 'ar', // Arabic is the default
  sidebarOpen: true,
  modalOpen: false,
  modalContent: null,
  toasts: [],
  isLoading: false,
  loadingMessage: null,
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // --- Theme Management ---
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
          // Update document class for CSS
          document.documentElement.className = theme;
        },

        toggleTheme: () => {
          set(
            (state) => {
              const newTheme = state.theme === 'dark' ? 'light' : 'dark';
              document.documentElement.className = newTheme;
              return { theme: newTheme };
            },
            false,
            'toggleTheme',
          );
        },

        // --- Language Management ---
        setLanguage: (language) => {
          set({ language }, false, 'setLanguage');
          // Update document attributes
          document.documentElement.lang = language;
          document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        },

        // --- Sidebar Management ---
        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar');
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open }, false, 'setSidebarOpen');
        },

        // --- Modal Management ---
        openModal: (content) => {
          set({ modalOpen: true, modalContent: content }, false, 'openModal');
        },

        closeModal: () => {
          set({ modalOpen: false, modalContent: null }, false, 'closeModal');
        },

        // --- Toast Management ---
        addToast: (toast) => {
          const id = `toast-${Date.now()}-${Math.random()}`;
          const newToast: Toast = { ...toast, id };

          set(
            (state) => ({ toasts: [...state.toasts, newToast] }),
            false,
            'addToast',
          );

          // Auto-remove toast after duration
          const duration = toast.duration || 3000;
          setTimeout(() => {
            set(
              (state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
              }),
              false,
              'autoRemoveToast',
            );
          }, duration);
        },

        removeToast: (id) => {
          set(
            (state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }),
            false,
            'removeToast',
          );
        },

        clearToasts: () => {
          set({ toasts: [] }, false, 'clearToasts');
        },

        // --- Loading Management ---
        setLoading: (isLoading, message) => {
          set(
            { isLoading, loadingMessage: message || null },
            false,
            'setLoading',
          );
        },
      }),
      {
        name: 'qurabia-ui-store',
        // Persist user preferences
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          sidebarOpen: state.sidebarOpen,
        }),
      },
    ),
    {
      name: 'UIStore',
      enabled: import.meta.env.DEV,
    },
  ),
);

// --- Selectors (for optimized access) ---

export const useTheme = () => useUIStore((state) => state.theme);
export const useLanguage = () => useUIStore((state) => state.language);
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useModalState = () =>
  useUIStore((state) => ({
    open: state.modalOpen,
    content: state.modalContent,
  }));
export const useToasts = () => useUIStore((state) => state.toasts);
export const useLoadingState = () =>
  useUIStore((state) => ({
    isLoading: state.isLoading,
    message: state.loadingMessage,
  }));

// Selector for UI actions
export const useUIActions = () =>
  useUIStore((state) => ({
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    setLanguage: state.setLanguage,
    toggleSidebar: state.toggleSidebar,
    setSidebarOpen: state.setSidebarOpen,
    openModal: state.openModal,
    closeModal: state.closeModal,
    addToast: state.addToast,
    removeToast: state.removeToast,
    clearToasts: state.clearToasts,
    setLoading: state.setLoading,
  }));
