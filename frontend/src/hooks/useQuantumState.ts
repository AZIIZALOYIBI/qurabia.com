/**
 * ============================================================
 * useQuantumState.ts - نظام إدارة الحالة الكمومية (State Machine)
 * QURABIA
 * 
 * يطبق دورة حياة النظام: IDLE -> INIT -> CALIBRATION -> PROCESSING -> COMPLETED
 * ============================================================
 */

import { useState, useCallback, useMemo } from 'react';
import type { SimulationResult } from '../engine/SimulationFactory';

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

export const useQuantumState = () => {
  const [state, setState] = useState<QuantumState>({
    status: 'IDLE',
    progress: 0,
    lastResult: null,
    error: null,
    activeQubits: 50
  });

  // --- دالة تحويل الحالة (State Transition) ---
  const setStatus = useCallback((newStatus: SystemStatus) => {
    console.log(`[QuantumState] Transitioning to ${newStatus}`);
    setState(prev => ({ ...prev, status: newStatus }));
  }, []);

  // --- تحديث التقدم (Progress Update) ---
  const updateProgress = useCallback((p: number) => {
    setState(prev => ({ ...prev, progress: Math.min(100, p) }));
  }, []);

  // --- معالجة النتائج ---
  const setLastResult = useCallback((result: SimulationResult) => {
    setState(prev => ({ 
      ...prev, 
      lastResult: result, 
      status: 'COMPLETED',
      progress: 100 
    }));
  }, []);

  // --- تصفير الحالة ---
  const resetState = useCallback(() => {
    setState({
      status: 'IDLE',
      progress: 0,
      lastResult: null,
      error: null,
      activeQubits: 50
    });
  }, []);

  return useMemo(() => ({
    ...state,
    setStatus,
    updateProgress,
    setLastResult,
    resetState
  }), [state, setStatus, updateProgress, setLastResult, resetState]);
};
