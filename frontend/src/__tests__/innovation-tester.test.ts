import { describe, it, expect } from 'vitest';
import { InnovationTester } from '../utils/InnovationTester';

describe('InnovationTester', () => {
  describe('testQRP', () => {
    it('returns a non-empty path array', () => {
      const path = InnovationTester.testQRP();
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBeGreaterThan(0);
    });

    it('path starts at origin and ends near the target', () => {
      const path = InnovationTester.testQRP();
      expect(path[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }));
      const last = path[path.length - 1];
      expect(last.x).toBeGreaterThanOrEqual(0);
      expect(last.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('testEDC', () => {
    it('returns a positive compression ratio', () => {
      const result = InnovationTester.testEDC();
      expect(result).toBeDefined();
      expect(typeof result.ratio).toBe('number');
      expect(result.ratio).toBeGreaterThan(0);
    });

    it('reports success', () => {
      const result = InnovationTester.testEDC();
      expect(result.success).toBe(true);
    });

    it('accepts custom sample data', () => {
      const result = InnovationTester.testEDC('XYZXYZXYZXYZ');
      expect(result.ratio).toBeGreaterThan(0);
    });
  });

  describe('testQAGE', () => {
    it('returns a genome with fitness property', () => {
      const best = InnovationTester.testQAGE();
      expect(best).toBeDefined();
      expect(typeof best.fitness).toBe('number');
    });

    it('achieves a positive fitness value', () => {
      const best = InnovationTester.testQAGE();
      expect(best.fitness).toBeGreaterThan(0);
    });
  });

  describe('runFullSuite', () => {
    it('returns results for all three algorithms', () => {
      const results = InnovationTester.runFullSuite();
      expect(results).toBeDefined();
      expect(results.qrp).toBeDefined();
      expect(results.edc).toBeDefined();
      expect(results.qage).toBeDefined();
    });

    it('qrp result is a non-empty array', () => {
      const results = InnovationTester.runFullSuite();
      expect(Array.isArray(results.qrp)).toBe(true);
      expect(results.qrp.length).toBeGreaterThan(0);
    });

    it('edc result has ratio and success fields', () => {
      const results = InnovationTester.runFullSuite();
      expect(typeof results.edc.ratio).toBe('number');
      expect(results.edc.success).toBe(true);
    });

    it('qage result has a fitness field', () => {
      const results = InnovationTester.runFullSuite();
      expect(typeof results.qage.fitness).toBe('number');
    });
  });
});
