/**
 * اختبارات محرك التحليل الذكي للنتائج
 * QURABIA
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIResultsAnalyzer, type SimulationRecord } from '../engine/AIResultsAnalyzer';

// ─── محاكاة localStorage ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ─── بيانات اختبارية ─────────────────────────────────────────────
function makeMockRecords(count: number): SimulationRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    type: i % 3 === 0 ? 'PHYSICS' : i % 3 === 1 ? 'CHEMISTRY' : 'CRYPTO',
    energy: -1.1 + Math.random() * 0.2,
    fidelity: 0.95 + Math.random() * 0.04,
    data: { iter: i + 1 },
    timestamp: Date.now() - (count - i) * 60000,
  }));
}

// ─── الاختبارات ──────────────────────────────────────────────────

describe('AIResultsAnalyzer', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('recordSimulation', () => {
    it('يسجل محاكاة جديدة في localStorage', () => {
      const record: SimulationRecord = {
        type: 'PHYSICS',
        energy: -1.137,
        fidelity: 0.9985,
        data: { test: true },
        timestamp: Date.now(),
      };

      AIResultsAnalyzer.recordSimulation(record);

      const stored = JSON.parse(localStorageMock.getItem('qurabia.simulation_history') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].type).toBe('PHYSICS');
      expect(stored[0].energy).toBe(-1.137);
    });

    it('يحتفظ بحد أقصى 200 سجل', () => {
      // سجل 210 محاكاة
      for (let i = 0; i < 210; i++) {
        AIResultsAnalyzer.recordSimulation({
          type: 'PHYSICS',
          energy: -1 - i * 0.001,
          fidelity: 0.99,
          data: { i },
          timestamp: Date.now() + i,
        });
      }

      const stored = JSON.parse(localStorageMock.getItem('qurabia.simulation_history') || '[]');
      expect(stored.length).toBeLessThanOrEqual(200);
    });
  });

  describe('getHistory', () => {
    it('يُرجع مصفوفة فارغة عند عدم وجود بيانات', () => {
      expect(AIResultsAnalyzer.getHistory()).toEqual([]);
    });

    it('يُرجع السجلات المخزنة', () => {
      const records = makeMockRecords(5);
      localStorageMock.setItem('qurabia.simulation_history', JSON.stringify(records));

      const result = AIResultsAnalyzer.getHistory();
      expect(result).toHaveLength(5);
    });

    it('يتعامل مع بيانات فاسدة بأمان', () => {
      localStorageMock.setItem('qurabia.simulation_history', 'invalid json');
      expect(AIResultsAnalyzer.getHistory()).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('يمسح السجل بالكامل', () => {
      const records = makeMockRecords(3);
      localStorageMock.setItem('qurabia.simulation_history', JSON.stringify(records));

      AIResultsAnalyzer.clearHistory();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('qurabia.simulation_history');
    });
  });

  describe('computeStats', () => {
    it('يُرجع إحصائيات فارغة عند عدم وجود بيانات', () => {
      const stats = AIResultsAnalyzer.computeStats([]);
      expect(stats.totalSimulations).toBe(0);
      expect(stats.avgEnergy).toBe(0);
      expect(stats.avgFidelity).toBe(0);
      expect(stats.trends).toEqual([]);
    });

    it('يحسب المتوسطات بدقة', () => {
      const records: SimulationRecord[] = [
        { type: 'PHYSICS', energy: -1.0, fidelity: 0.95, data: {}, timestamp: 1000 },
        { type: 'PHYSICS', energy: -1.2, fidelity: 0.99, data: {}, timestamp: 2000 },
      ];

      const stats = AIResultsAnalyzer.computeStats(records);
      expect(stats.totalSimulations).toBe(2);
      expect(stats.avgEnergy).toBeCloseTo(-1.1, 5);
      expect(stats.avgFidelity).toBeCloseTo(0.97, 5);
    });

    it('يحسب أفضل النتائج', () => {
      const records: SimulationRecord[] = [
        { type: 'PHYSICS', energy: -1.0, fidelity: 0.9, data: {}, timestamp: 1000 },
        { type: 'CHEMISTRY', energy: -1.5, fidelity: 0.99, data: {}, timestamp: 2000 },
        { type: 'CRYPTO', energy: -0.8, fidelity: 0.95, data: {}, timestamp: 3000 },
      ];

      const stats = AIResultsAnalyzer.computeStats(records);
      expect(stats.bestEnergy).toBeCloseTo(-1.5, 5);
      expect(stats.bestFidelity).toBeCloseTo(0.99, 5);
    });

    it('يحسب توزيع الأنواع', () => {
      const records: SimulationRecord[] = [
        { type: 'PHYSICS', energy: -1.0, data: {}, timestamp: 1000 },
        { type: 'PHYSICS', energy: -1.1, data: {}, timestamp: 2000 },
        { type: 'CRYPTO', energy: -0.5, data: {}, timestamp: 3000 },
      ];

      const stats = AIResultsAnalyzer.computeStats(records);
      expect(stats.typeDistribution).toEqual({ PHYSICS: 2, CRYPTO: 1 });
    });

    it('يبني بيانات الاتجاه', () => {
      const records = makeMockRecords(10);
      const stats = AIResultsAnalyzer.computeStats(records);
      expect(stats.trends).toHaveLength(10);
      expect(stats.trends[0]).toHaveProperty('label');
      expect(stats.trends[0]).toHaveProperty('energy');
      expect(stats.trends[0]).toHaveProperty('fidelity');
    });

    it('يتعامل مع قيم غير معرفة', () => {
      const records: SimulationRecord[] = [
        { type: 'AI', data: {}, timestamp: 1000 },
        { type: 'AI', energy: undefined, fidelity: undefined, data: {}, timestamp: 2000 },
      ];

      const stats = AIResultsAnalyzer.computeStats(records);
      expect(stats.avgEnergy).toBe(0);
      expect(stats.avgFidelity).toBe(0);
    });
  });

  describe('generateInsights', () => {
    it('يُولد رؤية عدم وجود بيانات', () => {
      const stats = AIResultsAnalyzer.computeStats([]);
      const insights = AIResultsAnalyzer.generateInsights(stats);
      expect(insights).toHaveLength(1);
      expect(insights[0].id).toBe('no-data');
      expect(insights[0].severity).toBe('info');
    });

    it('يُولد رؤى متعددة من بيانات حقيقية', () => {
      const records = makeMockRecords(10);
      const stats = AIResultsAnalyzer.computeStats(records);
      const insights = AIResultsAnalyzer.generateInsights(stats);

      expect(insights.length).toBeGreaterThan(0);

      // كل رؤية لها المعرف والعنوان والوصف والخطورة
      for (const insight of insights) {
        expect(insight.id).toBeTruthy();
        expect(insight.title).toBeTruthy();
        expect(insight.description).toBeTruthy();
        expect(['info', 'success', 'warning', 'critical']).toContain(insight.severity);
      }
    });

    it('يكتشف الدقة العالية', () => {
      const records: SimulationRecord[] = [
        { type: 'PHYSICS', energy: -1.137, fidelity: 0.999, data: {}, timestamp: 1000 },
      ];
      const stats = AIResultsAnalyzer.computeStats(records);
      const insights = AIResultsAnalyzer.generateInsights(stats);

      const fidelityInsight = insights.find((i) => i.id === 'fidelity-avg');
      expect(fidelityInsight).toBeTruthy();
      expect(fidelityInsight?.severity).toBe('success');
    });

    it('يحذر عند دقة منخفضة', () => {
      const records: SimulationRecord[] = [
        { type: 'PHYSICS', energy: -0.5, fidelity: 0.85, data: {}, timestamp: 1000 },
      ];
      const stats = AIResultsAnalyzer.computeStats(records);
      const insights = AIResultsAnalyzer.generateInsights(stats);

      const fidelityInsight = insights.find((i) => i.id === 'fidelity-avg');
      expect(fidelityInsight).toBeTruthy();
      expect(fidelityInsight?.severity).toBe('critical');
      expect(fidelityInsight?.recommendation).toBeTruthy();
    });
  });

  describe('computeOverallScore', () => {
    it('يُعيد 0 عند عدم وجود بيانات', () => {
      const stats = AIResultsAnalyzer.computeStats([]);
      expect(AIResultsAnalyzer.computeOverallScore(stats)).toBe(0);
    });

    it('يُعيد نتيجة عالية لمحاكاات جيدة', () => {
      const records: SimulationRecord[] = Array.from({ length: 20 }, () => ({
        type: 'PHYSICS',
        energy: -1.137,
        fidelity: 0.998,
        data: {},
        timestamp: Date.now(),
      }));
      const stats = AIResultsAnalyzer.computeStats(records);
      const score = AIResultsAnalyzer.computeOverallScore(stats);
      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('النتيجة تكون بين 0 و 100', () => {
      const records = makeMockRecords(50);
      const stats = AIResultsAnalyzer.computeStats(records);
      const score = AIResultsAnalyzer.computeOverallScore(stats);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeComprehensive', () => {
    it('يُعيد تحليلاً شاملاً مع بيانات فارغة', async () => {
      const result = await AIResultsAnalyzer.analyzeComprehensive();

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('totalSimulations');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('aiNarrative');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('generatedAt');
      expect(result.totalSimulations).toBe(0);
      expect(result.aiNarrative).toBeTruthy();
    });

    it('يُعيد تحليلاً مع بيانات محاكاة', async () => {
      const records = makeMockRecords(5);
      localStorageMock.setItem('qurabia.simulation_history', JSON.stringify(records));

      const result = await AIResultsAnalyzer.analyzeComprehensive();

      expect(result.totalSimulations).toBe(5);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.generatedAt).toBeGreaterThan(0);
    });
  });
});
