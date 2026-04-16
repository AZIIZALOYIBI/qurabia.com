/**
 * ============================================================
 * settings-store.ts - Zustand Store for Application Settings
 * QURABIA
 *
 * Manages application settings including:
 * - Quantum simulation preferences
 * - Visualization settings
 * - Performance settings
 * - User preferences
 * ============================================================
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// --- Types ---

export interface VisualizationSettings {
  showGrid: boolean;
  showAxes: boolean;
  enableAnimations: boolean;
  particleCount: number;
  renderQuality: 'low' | 'medium' | 'high';
  fps: number;
}

export interface QuantumSettings {
  defaultQubits: number;
  maxQubits: number;
  enableOptimizations: boolean;
  enableCaching: boolean;
  simulationTimeout: number; // in milliseconds
}

export interface PerformanceSettings {
  enableWorkers: boolean;
  maxWorkers: number;
  enableGPU: boolean;
  memoryLimit: number; // in MB
}

export interface AccessibilitySettings {
  enableScreenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface NotificationSettings {
  enableSound: boolean;
  enableDesktopNotifications: boolean;
  enableEmailNotifications: boolean;
}

export interface SettingsState {
  visualization: VisualizationSettings;
  quantum: QuantumSettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  notifications: NotificationSettings;
}

// --- Actions ---

export interface SettingsActions {
  updateVisualization: (settings: Partial<VisualizationSettings>) => void;
  updateQuantum: (settings: Partial<QuantumSettings>) => void;
  updatePerformance: (settings: Partial<PerformanceSettings>) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
  resetVisualization: () => void;
  resetQuantum: () => void;
  resetPerformance: () => void;
}

// --- Store ---

export type SettingsStore = SettingsState & SettingsActions;

// Default settings
const defaultVisualization: VisualizationSettings = {
  showGrid: true,
  showAxes: true,
  enableAnimations: true,
  particleCount: 1000,
  renderQuality: 'high',
  fps: 60,
};

const defaultQuantum: QuantumSettings = {
  defaultQubits: 8,
  maxQubits: 16,
  enableOptimizations: true,
  enableCaching: true,
  simulationTimeout: 30000, // 30 seconds
};

const defaultPerformance: PerformanceSettings = {
  enableWorkers: true,
  maxWorkers: navigator.hardwareConcurrency || 4,
  enableGPU: true,
  memoryLimit: 512, // 512 MB
};

const defaultAccessibility: AccessibilitySettings = {
  enableScreenReader: false,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
};

const defaultNotifications: NotificationSettings = {
  enableSound: true,
  enableDesktopNotifications: false,
  enableEmailNotifications: false,
};

const initialState: SettingsState = {
  visualization: defaultVisualization,
  quantum: defaultQuantum,
  performance: defaultPerformance,
  accessibility: defaultAccessibility,
  notifications: defaultNotifications,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // --- Update Visualization Settings ---
        updateVisualization: (settings) => {
          set(
            (state) => ({
              visualization: { ...state.visualization, ...settings },
            }),
            false,
            'updateVisualization',
          );
        },

        // --- Update Quantum Settings ---
        updateQuantum: (settings) => {
          set(
            (state) => ({
              quantum: { ...state.quantum, ...settings },
            }),
            false,
            'updateQuantum',
          );
        },

        // --- Update Performance Settings ---
        updatePerformance: (settings) => {
          set(
            (state) => ({
              performance: { ...state.performance, ...settings },
            }),
            false,
            'updatePerformance',
          );
        },

        // --- Update Accessibility Settings ---
        updateAccessibility: (settings) => {
          set(
            (state) => {
              const newSettings = { ...state.accessibility, ...settings };

              // Apply accessibility settings to document
              if (settings.highContrast !== undefined) {
                document.documentElement.classList.toggle('high-contrast', settings.highContrast);
              }

              if (settings.reducedMotion !== undefined) {
                document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
              }

              if (settings.fontSize !== undefined) {
                document.documentElement.setAttribute('data-font-size', settings.fontSize);
              }

              return { accessibility: newSettings };
            },
            false,
            'updateAccessibility',
          );
        },

        // --- Update Notification Settings ---
        updateNotifications: (settings) => {
          set(
            (state) => ({
              notifications: { ...state.notifications, ...settings },
            }),
            false,
            'updateNotifications',
          );
        },

        // --- Reset All Settings ---
        resetSettings: () => {
          console.log('[SettingsStore] Resetting all settings to defaults');
          set(initialState, false, 'resetSettings');
        },

        // --- Reset Visualization Settings ---
        resetVisualization: () => {
          set(
            { visualization: defaultVisualization },
            false,
            'resetVisualization',
          );
        },

        // --- Reset Quantum Settings ---
        resetQuantum: () => {
          set({ quantum: defaultQuantum }, false, 'resetQuantum');
        },

        // --- Reset Performance Settings ---
        resetPerformance: () => {
          set({ performance: defaultPerformance }, false, 'resetPerformance');
        },
      }),
      {
        name: 'qurabia-settings-store',
        // Persist all settings
        partialize: (state) => ({
          visualization: state.visualization,
          quantum: state.quantum,
          performance: state.performance,
          accessibility: state.accessibility,
          notifications: state.notifications,
        }),
        // Apply accessibility settings on rehydration
        onRehydrateStorage: () => (state) => {
          if (state?.accessibility) {
            const { highContrast, reducedMotion, fontSize } = state.accessibility;

            if (highContrast) {
              document.documentElement.classList.add('high-contrast');
            }

            if (reducedMotion) {
              document.documentElement.classList.add('reduced-motion');
            }

            if (fontSize) {
              document.documentElement.setAttribute('data-font-size', fontSize);
            }
          }
        },
      },
    ),
    {
      name: 'SettingsStore',
      enabled: import.meta.env.DEV,
    },
  ),
);

// --- Selectors (for optimized access) ---

export const useVisualizationSettings = () =>
  useSettingsStore((state) => state.visualization);

export const useQuantumSettings = () =>
  useSettingsStore((state) => state.quantum);

export const usePerformanceSettings = () =>
  useSettingsStore((state) => state.performance);

export const useAccessibilitySettings = () =>
  useSettingsStore((state) => state.accessibility);

export const useNotificationSettings = () =>
  useSettingsStore((state) => state.notifications);

// Selector for settings actions
export const useSettingsActions = () =>
  useSettingsStore((state) => ({
    updateVisualization: state.updateVisualization,
    updateQuantum: state.updateQuantum,
    updatePerformance: state.updatePerformance,
    updateAccessibility: state.updateAccessibility,
    updateNotifications: state.updateNotifications,
    resetSettings: state.resetSettings,
    resetVisualization: state.resetVisualization,
    resetQuantum: state.resetQuantum,
    resetPerformance: state.resetPerformance,
  }));
