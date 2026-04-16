/**
 * Mock Services
 * =============
 * Mock implementations of external services for testing
 */

import { vi } from 'vitest';

/**
 * Mock API Service
 */
export const mockApiService = {
  /**
   * Mock health check
   */
  health: vi.fn().mockResolvedValue({ status: 'ok', timestamp: Date.now() }),

  /**
   * Mock AUTDIE engine call
   */
  autdie: vi.fn().mockResolvedValue({
    decision: 'approve',
    confidence: 0.95,
    reasoning: 'تحليل استراتيجي إيجابي',
    timestamp: Date.now(),
  }),

  /**
   * Mock Al-Utaibi equation call
   */
  alUtaibi: vi.fn().mockResolvedValue({
    result: 42,
    equation: 'E = mc²',
    timestamp: Date.now(),
  }),

  /**
   * Mock DSA signature
   */
  dsaSign: vi.fn().mockResolvedValue({
    signature: 'mock_signature_xyz',
    message: 'test message',
    timestamp: Date.now(),
  }),

  /**
   * Mock KEM encryption
   */
  kemEncrypt: vi.fn().mockResolvedValue({
    ciphertext: 'encrypted_data',
    encapsulated_key: 'key_xyz',
    timestamp: Date.now(),
  }),

  /**
   * Reset all mocks
   */
  reset: () => {
    mockApiService.health.mockClear();
    mockApiService.autdie.mockClear();
    mockApiService.alUtaibi.mockClear();
    mockApiService.dsaSign.mockClear();
    mockApiService.kemEncrypt.mockClear();
  },
};

/**
 * Mock Authentication Service
 */
export const mockAuthService = {
  currentUser: null as any,

  login: vi.fn().mockImplementation((email: string, password: string) => {
    if (email === 'test@qurabia.com' && password === 'password123') {
      mockAuthService.currentUser = {
        id: '1',
        email,
        name: 'مستخدم اختبار',
        token: 'mock_jwt_token',
      };
      return Promise.resolve(mockAuthService.currentUser);
    }
    return Promise.reject(new Error('بيانات الدخول غير صحيحة'));
  }),

  logout: vi.fn().mockImplementation(() => {
    mockAuthService.currentUser = null;
    return Promise.resolve();
  }),

  register: vi.fn().mockResolvedValue({
    id: '2',
    email: 'new@qurabia.com',
    name: 'مستخدم جديد',
  }),

  getProfile: vi.fn().mockImplementation(() => {
    if (mockAuthService.currentUser) {
      return Promise.resolve(mockAuthService.currentUser);
    }
    return Promise.reject(new Error('غير مصرح'));
  }),

  reset: () => {
    mockAuthService.currentUser = null;
    mockAuthService.login.mockClear();
    mockAuthService.logout.mockClear();
    mockAuthService.register.mockClear();
    mockAuthService.getProfile.mockClear();
  },
};

/**
 * Mock Quantum Service
 */
export const mockQuantumService = {
  /**
   * Create quantum state
   */
  createState: vi.fn().mockImplementation((numQubits: number) => ({
    numQubits,
    amplitudes: Array.from({ length: 2 ** numQubits }, (_, i) =>
      i === 0 ? { re: 1, im: 0 } : { re: 0, im: 0 }
    ),
  })),

  /**
   * Apply gate
   */
  applyGate: vi.fn().mockImplementation((state, gate) => ({
    ...state,
    amplitudes: state.amplitudes.map((amp: any, i: number) => ({
      re: Math.cos(i * 0.1),
      im: Math.sin(i * 0.1),
    })),
  })),

  /**
   * Measure qubit
   */
  measure: vi.fn().mockImplementation(() => ({
    outcome: Math.random() > 0.5 ? 1 : 0,
    probability: 0.5,
  })),

  /**
   * Run circuit
   */
  runCircuit: vi.fn().mockResolvedValue({
    results: { '00': 500, '11': 500 },
    shots: 1000,
    executionTime: 123,
  }),

  reset: () => {
    mockQuantumService.createState.mockClear();
    mockQuantumService.applyGate.mockClear();
    mockQuantumService.measure.mockClear();
    mockQuantumService.runCircuit.mockClear();
  },
};

/**
 * Mock Storage Service
 */
export const mockStorageService = {
  store: new Map<string, any>(),

  get: vi.fn().mockImplementation((key: string) => {
    return mockStorageService.store.get(key);
  }),

  set: vi.fn().mockImplementation((key: string, value: any) => {
    mockStorageService.store.set(key, value);
  }),

  remove: vi.fn().mockImplementation((key: string) => {
    mockStorageService.store.delete(key);
  }),

  clear: vi.fn().mockImplementation(() => {
    mockStorageService.store.clear();
  }),

  reset: () => {
    mockStorageService.store.clear();
    mockStorageService.get.mockClear();
    mockStorageService.set.mockClear();
    mockStorageService.remove.mockClear();
    mockStorageService.clear.mockClear();
  },
};

/**
 * Mock WebSocket Service
 */
export class MockWebSocket {
  url: string;
  readyState = 1; // OPEN
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  static instances: MockWebSocket[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send = vi.fn((data: any) => {
    // Simulate echo
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }));
      }
    }, 10);
  });

  close = vi.fn(() => {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  });

  addEventListener = vi.fn((event: string, handler: any) => {
    if (event === 'open') this.onopen = handler;
    if (event === 'message') this.onmessage = handler;
    if (event === 'error') this.onerror = handler;
    if (event === 'close') this.onclose = handler;
  });

  removeEventListener = vi.fn();

  static reset() {
    MockWebSocket.instances = [];
  }
}

// Replace global WebSocket with mock
if (typeof window !== 'undefined') {
  (window as any).WebSocket = MockWebSocket;
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  mockApiService.reset();
  mockAuthService.reset();
  mockQuantumService.reset();
  mockStorageService.reset();
  MockWebSocket.reset();
}
