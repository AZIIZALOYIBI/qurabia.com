/**
 * QuantumAlgorithms.ts — اختبارات خوارزميات الكم الأساسية
 */

import { describe, expect, it } from 'vitest';
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

    it('works with 2-qubit search (N=4)', async () => {
      const result = await QuantumAlgorithms.groverSearch(3, 2);
      expect(result).toBe(3);
    });

    it('clamps out-of-range target to valid range', async () => {
      // targetIndex=10 with 2 qubits (N=4) should clamp to 3
      const result = await QuantumAlgorithms.groverSearch(10, 2);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(4);
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

  describe('deutschJozsa', () => {
    it('correctly identifies a constant function', async () => {
      const result = await QuantumAlgorithms.deutschJozsa('constant');
      expect(result.isConstant).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('correctly identifies a balanced function', async () => {
      const result = await QuantumAlgorithms.deutschJozsa('balanced');
      expect(result.isConstant).toBe(false);
    });

    it('returns finalState probabilities', async () => {
      const result = await QuantumAlgorithms.deutschJozsa('constant');
      expect(Array.isArray(result.finalState)).toBe(true);
      expect(result.finalState.length).toBeGreaterThan(0);
    });
  });

  describe('createGHZState', () => {
    it('creates 2-qubit GHZ (Bell state)', async () => {
      const result = await QuantumAlgorithms.createGHZState(2);
      expect(result.fidelity).toBeCloseTo(1.0, 3);
      // |00⟩ and |11⟩ each ~50%
      expect(result.probs[0]).toBeCloseTo(0.5, 5);
      expect(result.probs[3]).toBeCloseTo(0.5, 5);
    });

    it('creates 3-qubit GHZ state', async () => {
      const result = await QuantumAlgorithms.createGHZState(3);
      expect(result.fidelity).toBeCloseTo(1.0, 3);
      // |000⟩ and |111⟩ each ~50%
      expect(result.probs[0]).toBeCloseTo(0.5, 5);
      expect(result.probs[7]).toBeCloseTo(0.5, 5);
    });

    it('throws for invalid qubit count', async () => {
      await expect(QuantumAlgorithms.createGHZState(1)).rejects.toThrow();
      await expect(QuantumAlgorithms.createGHZState(9)).rejects.toThrow();
    });

    it('includes circuit steps', async () => {
      const result = await QuantumAlgorithms.createGHZState(3);
      expect(result.circuitSteps.length).toBeGreaterThan(0);
    });
  });

  describe('runQFT', () => {
    it('produces uniform distribution for basis state', async () => {
      // QFT on |1⟩ in 2-qubit space → uniform distribution
      const result = await QuantumAlgorithms.runQFT(1, 2);
      // After QFT, all 4 states should have equal probability ~0.25
      const totalProb = result.outputProbs.reduce((s, p) => s + p, 0);
      expect(totalProb).toBeCloseTo(1.0, 5);
      result.outputProbs.forEach((p) => {
        expect(p).toBeCloseTo(0.25, 3);
      });
    });

    it('returns inputProbs with 1 at basisState', async () => {
      const result = await QuantumAlgorithms.runQFT(2, 3);
      expect(result.inputProbs[2]).toBeCloseTo(1.0, 8);
      expect(result.inputProbs[0]).toBeCloseTo(0.0, 8);
    });
  });
});
