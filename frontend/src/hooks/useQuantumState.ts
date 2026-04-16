/**
 * ============================================================
 * useQuantumState.ts - نظام إدارة الحالة الكمومية (State Machine)
 * QURABIA
 *
 * يطبق دورة حياة النظام: IDLE -> INIT -> CALIBRATION -> PROCESSING -> COMPLETED
 *
 * DEPRECATED: This hook is now a compatibility wrapper around Zustand store.
 * For new code, use the store directly:
 * import { useQuantumStore, useQuantumActions } from '../stores';
 * ============================================================
 */

import { useCallback, useMemo } from 'react';
import type { SimulationResult } from '../engine/SimulationFactory';
import { useQuantumStore } from '../stores/quantum-store';

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
}

/**
 * Backward compatible hook that wraps Zustand store
 * @deprecated Use useQuantumStore directly for better performance
 */
export const useQuantumState = () => {
  // Get state and actions from Zustand store
  const status = useQuantumStore((state) => state.status);
  const progress = useQuantumStore((state) => state.progress);
  const lastResult = useQuantumStore((state) => state.lastResult);
  const error = useQuantumStore((state) => state.error);
  const activeQubits = useQuantumStore((state) => state.activeQubits);

  const setStatusStore = useQuantumStore((state) => state.setStatus);
  const updateProgressStore = useQuantumStore((state) => state.updateProgress);
  const setLastResultStore = useQuantumStore((state) => state.setLastResult);
  const resetStateStore = useQuantumStore((state) => state.resetState);

  // Wrap actions to maintain exact same API
  const setStatus = useCallback(
    (newStatus: SystemStatus) => {
      setStatusStore(newStatus);
    },
    [setStatusStore],
  );

  const updateProgress = useCallback(
    (p: number) => {
      updateProgressStore(p);
    },
    [updateProgressStore],
  );

  const setLastResult = useCallback(
    (result: SimulationResult) => {
      setLastResultStore(result);
    },
    [setLastResultStore],
  );

  const resetState = useCallback(() => {
    resetStateStore();
  }, [resetStateStore]);

  // Return in same format as original hook
  return useMemo(
    () => ({
      status,
      progress,
      lastResult,
      error,
      activeQubits,
      setStatus,
      updateProgress,
      setLastResult,
      resetState,
    }),
    [
      status,
      progress,
      lastResult,
      error,
      activeQubits,
      setStatus,
      updateProgress,
      setLastResult,
      resetState,
    ],
  );
};
