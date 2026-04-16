/**
 * Test Utilities for React Components
 * ===================================
 * Custom render functions and test helpers
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * All Providers Wrapper
 * Wraps components with all necessary providers for testing
 */
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Router Wrapper (for tests that only need routing)
 */
export function RouterWrapper({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * Create mock user for authentication tests
 */
export function createMockUser(overrides = {}) {
  return {
    id: '1',
    email: 'test@qurabia.com',
    name: 'اختبار المستخدم',
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock fetch response helper
 */
export function mockFetchResponse(data: any, options = { ok: true, status: 200 }) {
  return vi.fn().mockResolvedValue({
    ok: options.ok,
    status: options.status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  });
}

/**
 * Mock fetch error helper
 */
export function mockFetchError(error: string, status = 400) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ detail: error }),
    text: () => Promise.resolve(JSON.stringify({ detail: error })),
    headers: new Headers(),
  });
}

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create mock quantum state
 */
export function createMockQuantumState(numQubits: number) {
  const dim = 2 ** numQubits;
  const amplitudes = new Array(dim).fill(0);
  amplitudes[0] = { re: 1, im: 0 }; // |0...0⟩ state
  return { amplitudes, numQubits };
}

/**
 * Mock canvas context for visualization tests
 */
export function mockCanvasContext() {
  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,

    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),

    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    rect: vi.fn(),

    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),

    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),

    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(),

    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(),

    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };

  return context;
}

/**
 * Test data generators
 */
export const testData = {
  /**
   * Generate random Arabic text
   */
  arabicText: (length = 10) => {
    const arabicChars = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
    return Array.from({ length }, () =>
      arabicChars.charAt(Math.floor(Math.random() * arabicChars.length))
    ).join('');
  },

  /**
   * Generate test equation
   */
  equation: () => ({
    id: `eq_${Date.now()}`,
    expression: 'E = mc²',
    variables: { E: 'energy', m: 'mass', c: 'speed of light' },
    result: null,
  }),

  /**
   * Generate quantum circuit
   */
  quantumCircuit: (numQubits = 2) => ({
    numQubits,
    gates: [
      { type: 'H', qubit: 0 },
      { type: 'CNOT', control: 0, target: 1 },
    ],
  }),
};

/**
 * Performance testing helper
 */
export function measurePerformance(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

/**
 * Async performance testing
 */
export async function measureAsyncPerformance(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/**
 * Assert performance is within threshold
 */
export function expectPerformance(duration: number, threshold: number, label = 'Operation') {
  if (duration > threshold) {
    console.warn(`${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
  }
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
