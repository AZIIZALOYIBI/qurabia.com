/**
 * ============================================================
 * ui-store.test.ts - Tests for UI Store
 * QURABIA
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useUIStore,
  useUIActions,
  useTheme,
  useToasts,
} from '../../stores/ui-store';

describe('UIStore', () => {
  beforeEach(() => {
    // Clear toasts before each test
    const store = useUIStore.getState();
    act(() => {
      store.clearToasts();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.theme).toBe('dark');
      expect(result.current.language).toBe('ar');
      expect(result.current.sidebarOpen).toBe(true);
      expect(result.current.modalOpen).toBe(false);
      expect(result.current.modalContent).toBeNull();
      expect(result.current.toasts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadingMessage).toBeNull();
    });
  });

  describe('Theme Management', () => {
    it('should set theme', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle theme', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should update through selector', () => {
      const { result: actionsResult } = renderHook(() => useUIActions());
      const { result: themeResult } = renderHook(() => useTheme());

      expect(themeResult.current).toBe('dark');

      act(() => {
        actionsResult.current.setTheme('light');
      });

      expect(themeResult.current).toBe('light');
    });
  });

  describe('Language Management', () => {
    it('should set language', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.sidebarOpen).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(true);
    });

    it('should set sidebar state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarOpen(false);
      });

      expect(result.current.sidebarOpen).toBe(false);

      act(() => {
        result.current.setSidebarOpen(true);
      });

      expect(result.current.sidebarOpen).toBe(true);
    });
  });

  describe('Modal Management', () => {
    it('should open modal', () => {
      const { result } = renderHook(() => useUIStore());
      const content = <div>Modal Content</div>;

      act(() => {
        result.current.openModal(content);
      });

      expect(result.current.modalOpen).toBe(true);
      expect(result.current.modalContent).toBe(content);
    });

    it('should close modal', () => {
      const { result } = renderHook(() => useUIStore());
      const content = <div>Modal Content</div>;

      act(() => {
        result.current.openModal(content);
      });

      expect(result.current.modalOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalOpen).toBe(false);
      expect(result.current.modalContent).toBeNull();
    });
  });

  describe('Toast Management', () => {
    it('should add toast', () => {
      const { result: actionsResult } = renderHook(() => useUIActions());
      const { result: toastsResult } = renderHook(() => useToasts());

      act(() => {
        actionsResult.current.addToast({
          message: 'Test message',
          type: 'success',
        });
      });

      expect(toastsResult.current).toHaveLength(1);
      expect(toastsResult.current[0].message).toBe('Test message');
      expect(toastsResult.current[0].type).toBe('success');
      expect(toastsResult.current[0].id).toBeDefined();
    });

    it('should add multiple toasts', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ message: 'Toast 1', type: 'info' });
        result.current.addToast({ message: 'Toast 2', type: 'warning' });
        result.current.addToast({ message: 'Toast 3', type: 'error' });
      });

      expect(result.current.toasts).toHaveLength(3);
    });

    it('should remove toast', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ message: 'Toast 1', type: 'info' });
        result.current.addToast({ message: 'Toast 2', type: 'warning' });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Toast 2');
    });

    it('should clear all toasts', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ message: 'Toast 1', type: 'info' });
        result.current.addToast({ message: 'Toast 2', type: 'warning' });
        result.current.addToast({ message: 'Toast 3', type: 'error' });
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.clearToasts();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Loading Management', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading(true, 'Loading...');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingMessage).toBe('Loading...');
    });

    it('should clear loading state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading(true, 'Loading...');
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadingMessage).toBeNull();
    });
  });
});
