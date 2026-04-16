/**
 * ============================================================
 * index.ts - Centralized Store Exports
 * QURABIA
 *
 * Central export point for all Zustand stores
 * ============================================================
 */

// --- Quantum Store ---
export {
  useQuantumStore,
  useQuantumStatus,
  useQuantumProgress,
  useQuantumResult,
  useQuantumError,
  useQuantumQubits,
  useQuantumIsRunning,
  useQuantumState,
  useQuantumActions,
  type QuantumState,
  type QuantumActions,
  type QuantumStore,
  type SystemStatus,
} from './quantum-store';

// --- UI Store ---
export {
  useUIStore,
  useTheme,
  useLanguage,
  useSidebarOpen,
  useModalState,
  useToasts,
  useLoadingState,
  useUIActions,
  type UIState,
  type UIActions,
  type UIStore,
  type Theme,
  type Language,
  type Toast,
} from './ui-store';

// --- Auth Store ---
export {
  useAuthStore,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthToken,
  useAuthActions,
  type AuthState,
  type AuthActions,
  type AuthStore,
  type User,
  type PlanId,
} from './auth-store';

// --- Settings Store ---
export {
  useSettingsStore,
  useVisualizationSettings,
  useQuantumSettings,
  usePerformanceSettings,
  useAccessibilitySettings,
  useNotificationSettings,
  useSettingsActions,
  type SettingsState,
  type SettingsActions,
  type SettingsStore,
  type VisualizationSettings,
  type QuantumSettings,
  type PerformanceSettings,
  type AccessibilitySettings,
  type NotificationSettings,
} from './settings-store';
