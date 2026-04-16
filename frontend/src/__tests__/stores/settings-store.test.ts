/**
 * ============================================================
 * settings-store.test.ts - Tests for Settings Store
 * QURABIA
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSettingsStore,
  useSettingsActions,
  useVisualizationSettings,
  useQuantumSettings,
} from '../../stores/settings-store';

describe('SettingsStore', () => {
  beforeEach(() => {
    // Reset to defaults
    const { resetSettings } = useSettingsStore.getState();
    resetSettings();
  });

  describe('Initial State', () => {
    it('should have correct visualization defaults', () => {
      const { result } = renderHook(() => useVisualizationSettings());

      expect(result.current.showGrid).toBe(true);
      expect(result.current.showAxes).toBe(true);
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.particleCount).toBe(1000);
      expect(result.current.renderQuality).toBe('high');
      expect(result.current.fps).toBe(60);
    });

    it('should have correct quantum defaults', () => {
      const { result } = renderHook(() => useQuantumSettings());

      expect(result.current.defaultQubits).toBe(8);
      expect(result.current.maxQubits).toBe(16);
      expect(result.current.enableOptimizations).toBe(true);
      expect(result.current.enableCaching).toBe(true);
      expect(result.current.simulationTimeout).toBe(30000);
    });
  });

  describe('Visualization Settings', () => {
    it('should update visualization settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateVisualization({
          showGrid: false,
          renderQuality: 'medium',
        });
      });

      expect(result.current.visualization.showGrid).toBe(false);
      expect(result.current.visualization.renderQuality).toBe('medium');
      // Other properties should remain unchanged
      expect(result.current.visualization.showAxes).toBe(true);
    });

    it('should update through actions', () => {
      const { result: actionsResult } = renderHook(() => useSettingsActions());
      const { result: vizResult } = renderHook(() => useVisualizationSettings());

      act(() => {
        actionsResult.current.updateVisualization({
          particleCount: 500,
          fps: 30,
        });
      });

      expect(vizResult.current.particleCount).toBe(500);
      expect(vizResult.current.fps).toBe(30);
    });

    it('should reset visualization settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateVisualization({
          showGrid: false,
          renderQuality: 'low',
        });
      });

      expect(result.current.visualization.showGrid).toBe(false);

      act(() => {
        result.current.resetVisualization();
      });

      expect(result.current.visualization.showGrid).toBe(true);
      expect(result.current.visualization.renderQuality).toBe('high');
    });
  });

  describe('Quantum Settings', () => {
    it('should update quantum settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateQuantum({
          defaultQubits: 12,
          enableOptimizations: false,
        });
      });

      expect(result.current.quantum.defaultQubits).toBe(12);
      expect(result.current.quantum.enableOptimizations).toBe(false);
    });

    it('should reset quantum settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateQuantum({
          defaultQubits: 4,
          enableCaching: false,
        });
      });

      expect(result.current.quantum.defaultQubits).toBe(4);

      act(() => {
        result.current.resetQuantum();
      });

      expect(result.current.quantum.defaultQubits).toBe(8);
      expect(result.current.quantum.enableCaching).toBe(true);
    });
  });

  describe('Performance Settings', () => {
    it('should update performance settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updatePerformance({
          enableWorkers: false,
          maxWorkers: 2,
        });
      });

      expect(result.current.performance.enableWorkers).toBe(false);
      expect(result.current.performance.maxWorkers).toBe(2);
    });

    it('should reset performance settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updatePerformance({
          enableGPU: false,
        });
      });

      expect(result.current.performance.enableGPU).toBe(false);

      act(() => {
        result.current.resetPerformance();
      });

      expect(result.current.performance.enableGPU).toBe(true);
    });
  });

  describe('Accessibility Settings', () => {
    it('should update accessibility settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateAccessibility({
          highContrast: true,
          fontSize: 'large',
        });
      });

      expect(result.current.accessibility.highContrast).toBe(true);
      expect(result.current.accessibility.fontSize).toBe('large');
    });
  });

  describe('Notification Settings', () => {
    it('should update notification settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateNotifications({
          enableSound: false,
          enableDesktopNotifications: true,
        });
      });

      expect(result.current.notifications.enableSound).toBe(false);
      expect(result.current.notifications.enableDesktopNotifications).toBe(true);
    });
  });

  describe('Reset All Settings', () => {
    it('should reset all settings to defaults', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Change multiple settings
      act(() => {
        result.current.updateVisualization({ showGrid: false });
        result.current.updateQuantum({ defaultQubits: 4 });
        result.current.updatePerformance({ enableGPU: false });
      });

      expect(result.current.visualization.showGrid).toBe(false);
      expect(result.current.quantum.defaultQubits).toBe(4);
      expect(result.current.performance.enableGPU).toBe(false);

      // Reset all
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.visualization.showGrid).toBe(true);
      expect(result.current.quantum.defaultQubits).toBe(8);
      expect(result.current.performance.enableGPU).toBe(true);
    });
  });
});
