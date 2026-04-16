/**
 * Vitest Test Setup
 * ================
 * Global test configuration for the QURABIA frontend
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock WebGL context for Three.js
const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  getExtension: vi.fn(),
  getParameter: vi.fn(),
  getContextAttributes: vi.fn(() => ({ antialias: true })),
  getShaderPrecisionFormat: vi.fn(() => ({
    precision: 23,
    rangeMin: 127,
    rangeMax: 127,
  })),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  viewport: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
}) as any;

// Suppress console warnings in tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: any[]) => {
  // Filter out specific warnings if needed
  const message = args[0]?.toString() || '';
  if (
    message.includes('Warning: ReactDOM.render') ||
    message.includes('Warning: useLayoutEffect')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

console.error = (...args: any[]) => {
  // Filter out specific errors if needed
  const message = args[0]?.toString() || '';
  if (message.includes('Not implemented: HTMLFormElement.prototype.submit')) {
    return;
  }
  originalError.call(console, ...args);
};

// Global test utilities
declare global {
  var TEST_ENV: boolean;
}

globalThis.TEST_ENV = true;

// Export additional setup utilities
export const setupGlobalMocks = () => {
  // Add any additional global mock setup here
};

export const resetGlobalMocks = () => {
  vi.clearAllMocks();
  localStorageMock.clear();
};
