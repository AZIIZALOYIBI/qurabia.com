/**
 * ============================================================
 * quantum-store.ts - Zustand Store for Quantum Simulation State
 * QURABIA
 *
 * Manages quantum simulation state with:
 * - TypeScript type safety
 * - Persist middleware for important data
 * - DevTools integration
 * - Optimized selectors
 * ============================================================
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SimulationResult } from '../engine/SimulationFactory';

// --- Types ---

export type SystemStatus =
  | 'IDLE'
  | 'QUANTUM_INIT'
  | 'CALIBRATION'
  | 'AUDIO_TRAINING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR';

export interface QuantumState {
  status: SystemStatus;
  progress: number;
  lastResult: SimulationResult | null;
  error: string | null;
  activeQubits: number;
  maxQubits: number;
  isRunning: boolean;
}

// --- Actions ---

export interface QuantumActions {
  setStatus: (status: SystemStatus) => void;
  updateProgress: (progress: number) => void;
  setLastResult: (result: SimulationResult) => void;
  setError: (error: string | null) => void;
  setActiveQubits: (qubits: number) => void;
  resetState: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}

// --- Store ---

export type QuantumStore = QuantumState & QuantumActions;

// Default state
const initialState: QuantumState = {
  status: 'IDLE',
  progress: 0,
  lastResult: null,
  error: null,
  activeQubits: 16,
  maxQubits: 16, // الحد الأقصى المدعوم من محاكي statevector
  isRunning: false,
};

export const useQuantumStore = create<QuantumStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // --- State Transition ---
        setStatus: (status) => {
          console.log(`[QuantumStore] Transitioning to ${status}`);
          set({ status }, false, 'setStatus');
        },

        // --- Progress Update ---
        updateProgress: (progress) => {
          set({ progress: Math.min(100, Math.max(0, progress)) }, false, 'updateProgress');
        },

        // --- Set Result ---
        setLastResult: (result) => {
          set(
            {
              lastResult: result,
              status: 'COMPLETED',
              progress: 100,
              isRunning: false,
            },
            false,
            'setLastResult',
          );
        },

        // --- Set Error ---
        setError: (error) => {
          set(
            {
              error,
              status: error ? 'ERROR' : 'IDLE',
              isRunning: false,
            },
            false,
            'setError',
          );
        },

        // --- Set Active Qubits ---
        setActiveQubits: (qubits) => {
          const maxQubits = 16;
          const validQubits = Math.min(Math.max(1, qubits), maxQubits);
          set({ activeQubits: validQubits }, false, 'setActiveQubits');
        },

        // --- Reset State ---
        resetState: () => {
          console.log('[QuantumStore] Resetting state');
          set(initialState, false, 'resetState');
        },

        // --- Start Simulation ---
        startSimulation: () => {
          set(
            {
              status: 'QUANTUM_INIT',
              isRunning: true,
              error: null,
              progress: 0,
            },
            false,
            'startSimulation',
          );
        },

        // --- Stop Simulation ---
        stopSimulation: () => {
          set(
            {
              status: 'IDLE',
              isRunning: false,
              progress: 0,
            },
            false,
            'stopSimulation',
          );
        },
      }),
      {
        name: 'qurabia-quantum-store',
        // Persist only important data, not transient state
        partialize: (state) => ({
          activeQubits: state.activeQubits,
          lastResult: state.lastResult,
        }),
      },
    ),
    {
      name: 'QuantumStore',
      enabled: import.meta.env.DEV,
    },
  ),
);

// --- Selectors (for optimized access) ---

export const useQuantumStatus = () => useQuantumStore((state) => state.status);
export const useQuantumProgress = () => useQuantumStore((state) => state.progress);
export const useQuantumResult = () => useQuantumStore((state) => state.lastResult);
export const useQuantumError = () => useQuantumStore((state) => state.error);
export const useQuantumQubits = () => useQuantumStore((state) => state.activeQubits);
export const useQuantumIsRunning = () => useQuantumStore((state) => state.isRunning);

// Selector for read-only state
export const useQuantumState = () =>
  useQuantumStore((state) => ({
    status: state.status,
    progress: state.progress,
    lastResult: state.lastResult,
    error: state.error,
    activeQubits: state.activeQubits,
    maxQubits: state.maxQubits,
    isRunning: state.isRunning,
  }));

// Selector for actions
export const useQuantumActions = () =>
  useQuantumStore((state) => ({
    setStatus: state.setStatus,
    updateProgress: state.updateProgress,
    setLastResult: state.setLastResult,
    setError: state.setError,
    setActiveQubits: state.setActiveQubits,
    resetState: state.resetState,
    startSimulation: state.startSimulation,
    stopSimulation: state.stopSimulation,
  }));
