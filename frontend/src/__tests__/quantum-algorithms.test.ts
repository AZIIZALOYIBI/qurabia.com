/**
 * QuantumAlgorithms.ts — اختبارات خوارزميات الكم الأساسية
 */

import { describe, it, expect } from 'vitest';
import { QuantumAlgorithms } from '../utils/QuantumAlgorithms';

describe('QuantumAlgorithms', () => {
  describe('runVQE', () => {
    it('returns the expected H2 ground state energy', async () => {
      const energy = await QuantumAlgorithms.runVQE({}, {});
      expect(energy).toBe(-1.1372);
    });
  });

  describe('groverSearch', () => {
    it('returns the target index', async () => {
      const result = await QuantumAlgorithms.groverSearch(7, 4);
      expect(result).toBe(7);
    });

    it('works with index 0', async () => {
      const result = await QuantumAlgorithms.groverSearch(0, 3);
      expect(result).toBe(0);
    });
  });

  describe('shorFactorization', () => {
    it('returns factors [3, 5] for 15', async () => {
      const factors = await QuantumAlgorithms.shorFactorization(15);
      expect(factors).toEqual([3, 5]);
    });
  });

  describe('bb84Protocol', () => {
    it('returns a key and low QBER', async () => {
      const result = await QuantumAlgorithms.bb84Protocol();
      expect(result.key).toBe('10101100101');
      expect(result.qber).toBe(0.002);
    });
  });
});
