import { describe, expect, it } from 'vitest';
import {
  binaryEntropy,
  calculateAlOtaibiUnified,
  complexAbs,
  complexAdd,
  complexExp,
  complexMul,
  computeDarkSectorFactor,
  computeEnergySpectrum,
  computePhotonEnergy,
  computeQuantumAmplification,
  computeWaveBridge,
  runQuantumCoreVerification,
} from '../core/quantum-core';
import { ALOTAIBI_CONSTANTS, PHYSICAL_CONSTANTS } from '../types/quantum.types';

const _EPSILON = 1e-10;

// ─── Complex arithmetic ───────────────────────────────────────────────────────

describe('complexAdd', () => {
  it('adds two real numbers', () => {
    expect(complexAdd({ real: 1, imag: 0 }, { real: 2, imag: 0 })).toEqual({ real: 3, imag: 0 });
  });

  it('adds two purely imaginary numbers', () => {
    expect(complexAdd({ real: 0, imag: 3 }, { real: 0, imag: 4 })).toEqual({ real: 0, imag: 7 });
  });

  it('adds mixed complex numbers', () => {
    const result = complexAdd({ real: 1, imag: 2 }, { real: 3, imag: -1 });
    expect(result).toEqual({ real: 4, imag: 1 });
  });

  it('handles negative components', () => {
    const result = complexAdd({ real: -2, imag: -3 }, { real: 2, imag: 3 });
    expect(result).toEqual({ real: 0, imag: 0 });
  });
});

describe('complexMul', () => {
  it('multiplies two real numbers', () => {
    expect(complexMul({ real: 3, imag: 0 }, { real: 4, imag: 0 })).toEqual({ real: 12, imag: 0 });
  });

  it('i × i = -1', () => {
    const result = complexMul({ real: 0, imag: 1 }, { real: 0, imag: 1 });
    expect(result.real).toBeCloseTo(-1, 10);
    expect(result.imag).toBeCloseTo(0, 10);
  });

  it('(1+i)(1-i) = 2', () => {
    const result = complexMul({ real: 1, imag: 1 }, { real: 1, imag: -1 });
    expect(result.real).toBeCloseTo(2, 10);
    expect(result.imag).toBeCloseTo(0, 10);
  });

  it('(2+3i)(4+5i) = -7+22i', () => {
    const result = complexMul({ real: 2, imag: 3 }, { real: 4, imag: 5 });
    expect(result.real).toBeCloseTo(-7, 10);
    expect(result.imag).toBeCloseTo(22, 10);
  });

  it('multiplying by zero gives zero', () => {
    const result = complexMul({ real: 5, imag: 7 }, { real: 0, imag: 0 });
    expect(result).toEqual({ real: 0, imag: 0 });
  });
});

describe('complexAbs', () => {
  it('|0+0i| = 0', () => {
    expect(complexAbs({ real: 0, imag: 0 })).toBe(0);
  });

  it('|1+0i| = 1', () => {
    expect(complexAbs({ real: 1, imag: 0 })).toBeCloseTo(1, 10);
  });

  it('|0+1i| = 1', () => {
    expect(complexAbs({ real: 0, imag: 1 })).toBeCloseTo(1, 10);
  });

  it('|3+4i| = 5', () => {
    expect(complexAbs({ real: 3, imag: 4 })).toBeCloseTo(5, 10);
  });

  it('|-1+0i| = 1', () => {
    expect(complexAbs({ real: -1, imag: 0 })).toBeCloseTo(1, 10);
  });
});

describe('complexExp', () => {
  it('e^(i·0) = 1', () => {
    const r = complexExp(0);
    expect(r.real).toBeCloseTo(1, 10);
    expect(r.imag).toBeCloseTo(0, 10);
  });

  it('e^(iπ) = -1 (Euler)', () => {
    const r = complexExp(Math.PI);
    expect(r.real).toBeCloseTo(-1, 10);
    expect(r.imag).toBeCloseTo(0, 10);
  });

  it('e^(iπ/2) = i', () => {
    const r = complexExp(Math.PI / 2);
    expect(r.real).toBeCloseTo(0, 10);
    expect(r.imag).toBeCloseTo(1, 10);
  });

  it('|e^(iθ)| = 1 for any θ', () => {
    for (const theta of [0, 0.5, 1.2, Math.PI, 5.0]) {
      expect(complexAbs(complexExp(theta))).toBeCloseTo(1, 10);
    }
  });
});

// ─── binaryEntropy ────────────────────────────────────────────────────────────

describe('binaryEntropy', () => {
  it('H₂(0.5) = 1 (maximum entropy)', () => {
    expect(binaryEntropy(0.5)).toBeCloseTo(1.0, 10);
  });

  it('H₂(0) = 0 (boundary)', () => {
    expect(binaryEntropy(0)).toBe(0);
  });

  it('H₂(1) = 0 (boundary)', () => {
    expect(binaryEntropy(1)).toBe(0);
  });

  it('H₂(0.1) is between 0 and 1', () => {
    const h = binaryEntropy(0.1);
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThan(1);
  });

  it('is symmetric: H₂(p) = H₂(1-p)', () => {
    for (const p of [0.1, 0.25, 0.4]) {
      expect(binaryEntropy(p)).toBeCloseTo(binaryEntropy(1 - p), 10);
    }
  });

  it('negative p returns 0', () => {
    expect(binaryEntropy(-0.1)).toBe(0);
  });

  it('p > 1 returns 0', () => {
    expect(binaryEntropy(1.1)).toBe(0);
  });
});

// ─── computePhotonEnergy ─────────────────────────────────────────────────────

describe('computePhotonEnergy', () => {
  it('green light (~550nm) gives ~2.25 eV', () => {
    const freq = 5.454e14;
    const energy = computePhotonEnergy(freq);
    const eV = energy * PHYSICAL_CONSTANTS.JOULE_TO_EV;
    expect(eV).toBeGreaterThan(2.0);
    expect(eV).toBeLessThan(2.5);
  });

  it('returns h*frequency', () => {
    const freq = 1e14;
    expect(computePhotonEnergy(freq)).toBeCloseTo(PHYSICAL_CONSTANTS.PLANCK_H * freq, 40);
  });

  it('throws for zero frequency', () => {
    expect(() => computePhotonEnergy(0)).toThrow(RangeError);
  });

  it('throws for negative frequency', () => {
    expect(() => computePhotonEnergy(-1e14)).toThrow(RangeError);
  });

  it('scales linearly with frequency', () => {
    const e1 = computePhotonEnergy(1e14);
    const e2 = computePhotonEnergy(2e14);
    expect(e2).toBeCloseTo(2 * e1, 10);
  });
});

// ─── computeQuantumAmplification ─────────────────────────────────────────────

describe('computeQuantumAmplification', () => {
  it('returns α(α+β²) ≈ 665.31', () => {
    const result = computeQuantumAmplification();
    const expected = ALOTAIBI_CONSTANTS.ALPHA * (ALOTAIBI_CONSTANTS.ALPHA + ALOTAIBI_CONSTANTS.BETA ** 2);
    expect(result).toBeCloseTo(expected, 6);
  });

  it('result is within [665, 666]', () => {
    const result = computeQuantumAmplification();
    expect(result).toBeGreaterThan(665);
    expect(result).toBeLessThan(666);
  });

  it('is deterministic (same value every call)', () => {
    expect(computeQuantumAmplification()).toBe(computeQuantumAmplification());
  });
});

// ─── computeDarkSectorFactor ──────────────────────────────────────────────────

describe('computeDarkSectorFactor', () => {
  it('gives expected value with Planck 2018 densities', () => {
    const result = computeDarkSectorFactor(0.2589, 0.6847);
    const expected = 1 + 0.26 * 0.2589 + 0.7 * 0.6847;
    expect(result).toBeCloseTo(expected, 8);
  });

  it('returns 1 when both densities are 0', () => {
    expect(computeDarkSectorFactor(0, 0)).toBeCloseTo(1.0, 10);
  });

  it('throws for omegaDM < 0', () => {
    expect(() => computeDarkSectorFactor(-0.1, 0.5)).toThrow(RangeError);
  });

  it('throws for omegaDM > 1', () => {
    expect(() => computeDarkSectorFactor(1.1, 0.5)).toThrow(RangeError);
  });

  it('throws for omegaDE < 0', () => {
    expect(() => computeDarkSectorFactor(0.3, -0.1)).toThrow(RangeError);
  });

  it('throws for omegaDE > 1', () => {
    expect(() => computeDarkSectorFactor(0.3, 1.2)).toThrow(RangeError);
  });

  it('boundary values 0 and 1 are accepted', () => {
    expect(() => computeDarkSectorFactor(0, 1)).not.toThrow();
    expect(() => computeDarkSectorFactor(1, 0)).not.toThrow();
  });
});

// ─── computeWaveBridge ────────────────────────────────────────────────────────

describe('computeWaveBridge', () => {
  it('|ψ|=1, S=1 → bridge=1', () => {
    expect(computeWaveBridge(1, 0, 1)).toBeCloseTo(1.0, 12);
  });

  it('|ψ|=0 → bridge=0', () => {
    expect(computeWaveBridge(0, 0, 5)).toBe(0);
  });

  it('S=0 → bridge=0', () => {
    expect(computeWaveBridge(3, 4, 0)).toBe(0);
  });

  it('uses magnitude of ψ (Pythagorean)', () => {
    const result = computeWaveBridge(3, 4, 2);
    expect(result).toBeCloseTo(5 * 2, 10);
  });

  it('|S| is absolute (negative S allowed)', () => {
    expect(computeWaveBridge(1, 0, -1)).toBeCloseTo(1.0, 10);
    expect(computeWaveBridge(1, 0, 1)).toBeCloseTo(1.0, 10);
  });
});

// ─── calculateAlOtaibiUnified ─────────────────────────────────────────────────

const BASE_INPUT = {
  waveFunctionReal: 1,
  waveFunctionImag: 0,
  sphericalHarmonic: 1,
  fineTuning: 1,
};

describe('calculateAlOtaibiUnified', () => {
  it('returns correct structure', () => {
    const result = calculateAlOtaibiUnified({ ...BASE_INPUT, frequency: 1e14 });
    expect(result).toHaveProperty('totalEnergyJoules');
    expect(result).toHaveProperty('totalEnergyEV');
    expect(result).toHaveProperty('photonEnergyJ');
    expect(result).toHaveProperty('quantumAmplification');
    expect(result).toHaveProperty('darkSectorFactor');
    expect(result).toHaveProperty('waveBridgeFactor');
    expect(result).toHaveProperty('fineTuningFactor');
    expect(result).toHaveProperty('singularitySuppressed');
    expect(result).toHaveProperty('log');
    expect(Array.isArray(result.log)).toBe(true);
  });

  it('fineTuning=0 → totalEnergy=0', () => {
    const result = calculateAlOtaibiUnified({ ...BASE_INPUT, frequency: 1e14, fineTuning: 0 });
    expect(result.totalEnergyJoules).toBe(0);
  });

  it('uses default dark matter/energy when not provided', () => {
    const r1 = calculateAlOtaibiUnified({ ...BASE_INPUT, frequency: 1e14 });
    const r2 = calculateAlOtaibiUnified({
      ...BASE_INPUT,
      frequency: 1e14,
      darkMatterDensity: ALOTAIBI_CONSTANTS.OMEGA_DM,
      darkEnergyDensity: ALOTAIBI_CONSTANTS.OMEGA_DE,
    });
    expect(r1.totalEnergyJoules).toBeCloseTo(r2.totalEnergyJoules, 30);
  });

  it('singularity suppression: energy > Planck capped', () => {
    const result = calculateAlOtaibiUnified({
      ...BASE_INPUT,
      frequency: 1e50,
      fineTuning: 1e20,
    });
    expect(result.singularitySuppressed).toBe(true);
    expect(result.totalEnergyJoules).toBe(PHYSICAL_CONSTANTS.PLANCK_ENERGY);
  });

  it('singularitySuppressed=false for normal input', () => {
    const result = calculateAlOtaibiUnified({ ...BASE_INPUT, frequency: 1e14 });
    expect(result.singularitySuppressed).toBe(false);
  });

  it('energy in eV consistent with joules', () => {
    const result = calculateAlOtaibiUnified({ ...BASE_INPUT, frequency: 1e14 });
    const expected = result.totalEnergyJoules * PHYSICAL_CONSTANTS.JOULE_TO_EV;
    expect(result.totalEnergyEV).toBeCloseTo(expected, 5);
  });

  it('log contains 8 entries', () => {
    const result = calculateAlOtaibiUnified({ ...BASE_INPUT, frequency: 1e14 });
    expect(result.log.length).toBe(8);
  });
});

// ─── computeEnergySpectrum ────────────────────────────────────────────────────

describe('computeEnergySpectrum', () => {
  it('returns correct number of points', () => {
    const spectrum = computeEnergySpectrum(1e13, 1e15, 5, BASE_INPUT);
    expect(spectrum).toHaveLength(5);
  });

  it('first point has freqMin frequency', () => {
    const spectrum = computeEnergySpectrum(1e13, 1e15, 5, BASE_INPUT);
    expect(spectrum[0].frequency).toBeCloseTo(1e13, 5);
  });

  it('last point has freqMax frequency', () => {
    const spectrum = computeEnergySpectrum(1e13, 1e15, 5, BASE_INPUT);
    expect(spectrum[4].frequency).toBeCloseTo(1e15, 5);
  });

  it('energy increases with frequency (monotone for flat wave input)', () => {
    const spectrum = computeEnergySpectrum(1e13, 1e15, 10, BASE_INPUT);
    for (let i = 1; i < spectrum.length; i++) {
      expect(spectrum[i].energyEV).toBeGreaterThan(spectrum[i - 1].energyEV);
    }
  });

  it('throws for steps < 2', () => {
    expect(() => computeEnergySpectrum(1e13, 1e15, 1, BASE_INPUT)).toThrow(RangeError);
  });

  it('throws for freqMin <= 0', () => {
    expect(() => computeEnergySpectrum(0, 1e15, 5, BASE_INPUT)).toThrow(RangeError);
  });

  it('throws when freqMax <= freqMin', () => {
    expect(() => computeEnergySpectrum(1e15, 1e13, 5, BASE_INPUT)).toThrow(RangeError);
    expect(() => computeEnergySpectrum(1e14, 1e14, 5, BASE_INPUT)).toThrow(RangeError);
  });
});

// ─── runQuantumCoreVerification ───────────────────────────────────────────────

describe('runQuantumCoreVerification', () => {
  it('all internal checks pass', () => {
    const { passed, results } = runQuantumCoreVerification();
    expect(passed).toBe(true);
    for (const r of results) {
      expect(r.passed).toBe(true);
    }
  });

  it('returns 6 verification results', () => {
    const { results } = runQuantumCoreVerification();
    expect(results).toHaveLength(6);
  });

  it('each result has name, passed, detail fields', () => {
    const { results } = runQuantumCoreVerification();
    for (const r of results) {
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('passed');
      expect(r).toHaveProperty('detail');
    }
  });
});
