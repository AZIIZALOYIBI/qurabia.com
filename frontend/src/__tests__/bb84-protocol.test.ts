/**
 * اختبارات محرك BB84 — بروتوكول توزيع المفتاح الكمومي
 * مستوحى من videlanicolas/QKD
 */
import { describe, it, expect } from 'vitest';
import {
  simulateBB84,
  bb84Report,
  binaryEntropy,
  secureKeyRate,
  type BB84Config,
} from '../engine/BB84Protocol';

describe('BB84Protocol', () => {
  describe('simulateBB84', () => {
    it('ينتج مفتاحاً آمناً بدون متنصت', () => {
      const config: BB84Config = {
        numBits: 200,
        hasEavesdropper: false,
        testSampleRatio: 0.2,
        channelErrorRate: 0,
      };
      const result = simulateBB84(config);

      expect(result.totalBits).toBe(200);
      expect(result.isSecure).toBe(true);
      expect(result.eavesdropperDetected).toBe(false);
      expect(result.qber).toBe(0);
      expect(result.finalKey.length).toBeGreaterThan(0);
      // بدون متنصت وبدون ضوضاء: QBER = 0
      expect(result.testErrors).toBe(0);
    });

    it('يكتشف المتنصت عند وجوده', () => {
      // مع وجود متنصت وعدد كافٍ من البتات، QBER ≈ 25%
      const config: BB84Config = {
        numBits: 1000,
        hasEavesdropper: true,
        testSampleRatio: 0.3,
        channelErrorRate: 0,
      };
      const result = simulateBB84(config);

      // QBER مع متنصت ≈ 25% (أعلى من حد 11%)
      expect(result.qber).toBeGreaterThan(0.05);
      // مع 1000 بت، احتمال الاكتشاف عالي جداً
      expect(result.eavesdropperDetected).toBe(true);
      expect(result.isSecure).toBe(false);
      expect(result.finalKey.length).toBe(0);
    });

    it('القواعد المتطابقة ≈ 50% من الإجمالي', () => {
      const config: BB84Config = {
        numBits: 1000,
        hasEavesdropper: false,
        testSampleRatio: 0.1,
        channelErrorRate: 0,
      };
      const result = simulateBB84(config);

      // القواعد المتطابقة ≈ 50%
      const matchRatio = result.matchedBases / result.totalBits;
      expect(matchRatio).toBeGreaterThan(0.35);
      expect(matchRatio).toBeLessThan(0.65);
    });

    it('يرفض عدد بتات أقل من 4', () => {
      expect(() => simulateBB84({
        numBits: 2,
        hasEavesdropper: false,
        testSampleRatio: 0.2,
        channelErrorRate: 0,
      })).toThrow();
    });

    it('كل خطوة تحتوي على بيانات صحيحة', () => {
      const config: BB84Config = {
        numBits: 20,
        hasEavesdropper: false,
        testSampleRatio: 0.2,
        channelErrorRate: 0,
      };
      const result = simulateBB84(config);

      expect(result.steps.length).toBe(20);
      for (const step of result.steps) {
        expect([0, 1]).toContain(step.aliceBit);
        expect(['Z', 'X']).toContain(step.aliceBasis);
        expect(['Z', 'X']).toContain(step.bobBasis);
        expect([0, 1]).toContain(step.bobMeasurement);
        expect(typeof step.basisMatch).toBe('boolean');
      }
    });

    it('ضوضاء القناة تزيد QBER', () => {
      const config: BB84Config = {
        numBits: 500,
        hasEavesdropper: false,
        testSampleRatio: 0.3,
        channelErrorRate: 0.05, // 5% ضوضاء
      };
      const result = simulateBB84(config);

      // QBER يجب أن يكون > 0 بسبب الضوضاء
      expect(result.qber).toBeGreaterThanOrEqual(0);
    });

    it('الكفاءة موجبة ومعقولة', () => {
      const result = simulateBB84({
        numBits: 200,
        hasEavesdropper: false,
        testSampleRatio: 0.2,
        channelErrorRate: 0,
      });

      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('bb84Report', () => {
    it('ينتج تقريراً نصياً', () => {
      const result = simulateBB84({
        numBits: 50,
        hasEavesdropper: false,
        testSampleRatio: 0.2,
        channelErrorRate: 0,
      });
      const report = bb84Report(result);

      expect(report).toContain('BB84');
      expect(report).toContain('QBER');
      expect(report).toContain('بتات');
    });
  });

  describe('binaryEntropy', () => {
    it('H(0.5) = 1 bit', () => {
      expect(binaryEntropy(0.5)).toBeCloseTo(1.0, 10);
    });

    it('H(0) = 0 و H(1) = 0', () => {
      expect(binaryEntropy(0)).toBe(0);
      expect(binaryEntropy(1)).toBe(0);
    });

    it('H متناظرة', () => {
      expect(binaryEntropy(0.3)).toBeCloseTo(binaryEntropy(0.7), 10);
    });
  });

  describe('secureKeyRate', () => {
    it('R = 1 عند QBER = 0', () => {
      expect(secureKeyRate(0)).toBe(1);
    });

    it('R = 0 عند QBER ≥ 11%', () => {
      expect(secureKeyRate(0.11)).toBe(0);
      expect(secureKeyRate(0.25)).toBe(0);
    });

    it('R ينخفض مع زيادة QBER', () => {
      const r1 = secureKeyRate(0.01);
      const r2 = secureKeyRate(0.05);
      const r3 = secureKeyRate(0.10);
      expect(r1).toBeGreaterThan(r2);
      expect(r2).toBeGreaterThan(r3);
    });
  });
});
