/**
 * ============================================================
 * quantum-store.test.ts - Tests for Quantum Store
 * QURABIA
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useQuantumStore,
  useQuantumActions,
  useQuantumStatus,
  useQuantumProgress,
} from '../../stores/quantum-store';

describe('QuantumStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetState } = useQuantumStore.getState();
    resetState();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useQuantumStore());

      expect(result.current.status).toBe('IDLE');
      expect(result.current.progress).toBe(0);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.activeQubits).toBe(16);
      expect(result.current.maxQubits).toBe(16);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('Status Management', () => {
    it('should update status', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.setStatus('QUANTUM_INIT');
      });

      expect(result.current.status).toBe('QUANTUM_INIT');
    });

    it('should update status through action', () => {
      const { result: actionsResult } = renderHook(() => useQuantumActions());
      const { result: statusResult } = renderHook(() => useQuantumStatus());

      act(() => {
        actionsResult.current.setStatus('PROCESSING');
      });

      expect(statusResult.current).toBe('PROCESSING');
    });
  });

  describe('Progress Management', () => {
    it('should update progress', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.updateProgress(50);
      });

      expect(result.current.progress).toBe(50);
    });

    it('should clamp progress to 0-100', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.updateProgress(150);
      });

      expect(result.current.progress).toBe(100);

      act(() => {
        result.current.updateProgress(-10);
      });

      expect(result.current.progress).toBe(0);
    });

    it('should update progress through selector', () => {
      const { result: actionsResult } = renderHook(() => useQuantumActions());
      const { result: progressResult } = renderHook(() => useQuantumProgress());

      act(() => {
        actionsResult.current.updateProgress(75);
      });

      expect(progressResult.current).toBe(75);
    });
  });

  describe('Simulation Control', () => {
    it('should start simulation', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.startSimulation();
      });

      expect(result.current.status).toBe('QUANTUM_INIT');
      expect(result.current.isRunning).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });

    it('should stop simulation', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.startSimulation();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        result.current.stopSimulation();
      });

      expect(result.current.status).toBe('IDLE');
      expect(result.current.isRunning).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  describe('Result Management', () => {
    it('should set last result and complete', () => {
      const { result } = renderHook(() => useQuantumStore());
      const mockResult = {
        probabilities: [0.5, 0.5],
        executionTime: 100,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.setLastResult(mockResult);
      });

      expect(result.current.lastResult).toEqual(mockResult);
      expect(result.current.status).toBe('COMPLETED');
      expect(result.current.progress).toBe(100);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('Error Management', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.status).toBe('ERROR');
      expect(result.current.isRunning).toBe(false);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('IDLE');
    });
  });

  describe('Qubits Management', () => {
    it('should set active qubits', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.setActiveQubits(8);
      });

      expect(result.current.activeQubits).toBe(8);
    });

    it('should clamp qubits to valid range', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.setActiveQubits(20);
      });

      expect(result.current.activeQubits).toBe(16); // max

      act(() => {
        result.current.setActiveQubits(0);
      });

      expect(result.current.activeQubits).toBe(1); // min
    });
  });

  describe('State Reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useQuantumStore());

      act(() => {
        result.current.setStatus('PROCESSING');
        result.current.updateProgress(75);
        result.current.setError('Error');
        result.current.startSimulation();
      });

      expect(result.current.status).not.toBe('IDLE');
      expect(result.current.progress).not.toBe(0);

      act(() => {
        result.current.resetState();
      });

      expect(result.current.status).toBe('IDLE');
      expect(result.current.progress).toBe(0);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isRunning).toBe(false);
    });
  });
});
