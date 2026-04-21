/**
 * Tests for the local BlackbodyEngine (frontend/src/engine/BlackbodyEngine.ts)
 */
import { describe, expect, it } from 'vitest';
import { BlackbodyEngine, blackbodyEngine } from '../engine/BlackbodyEngine';

// Physical constants for verification
const h = 6.62607015e-34;
const c = 299_792_458.0;
const kB = 1.380649e-23;

describe('BlackbodyEngine', () => {
  const engine = new BlackbodyEngine();

  // ─── Planck function ─────────────────────────────────────────

  describe('point – Planck basics', () => {
    it('returns zero B for T = 0', () => {
      const p = engine.point(1e14, 0);
      expect(p.B_planck).toBe(0);
    });

    it('returns zero B for negative T', () => {
      const p = engine.point(1e14, -100);
      expect(p.B_planck).toBe(0);
    });

    it('returns zero B for ν = 0', () => {
      const p = engine.point(0, 5778);
      expect(p.B_planck).toBe(0);
    });

    it('returns positive B for valid inputs', () => {
      const p = engine.point(5e14, 5778);
      expect(p.B_planck).toBeGreaterThan(0);
    });

    it('wavelength × frequency = c', () => {
      const p = engine.point(5e14, 5778);
      expect(p.wavelength_m * p.freq_Hz).toBeCloseTo(c, 0);
    });

    it('B_corrected = B_planck × (1 + delta_total)', () => {
      const p = engine.point(5e14, 5778);
      const expected = p.B_planck * (1 + p.delta_total);
      expect(Math.abs(p.B_corrected - expected)).toBeLessThan(1e-30);
    });
  });

  // ─── Corrections ─────────────────────────────────────────────

  describe('quantum corrections', () => {
    it('with all corrections disabled, delta_total = 0', () => {
      const p = engine.point(5e14, 5778, {
        enable_qed: false,
        enable_lqg: false,
        enable_gup: false,
      });
      expect(p.delta_total).toBe(0);
      expect(p.B_corrected).toBe(p.B_planck);
    });

    it('with corrections enabled, delta_total ≠ 0', () => {
      const p = engine.point(5e14, 5778, {
        enable_qed: true,
        enable_lqg: true,
        enable_gup: true,
      });
      expect(p.delta_total).not.toBe(0);
    });

    it('QED correction is tiny at optical frequencies', () => {
      const p = engine.point(5e14, 5778, {
        enable_qed: true,
        enable_lqg: false,
        enable_gup: false,
      });
      expect(Math.abs(p.delta_total)).toBeLessThan(1e-10);
    });

    it('GUP correction is negative', () => {
      const p = engine.point(5e14, 5778, {
        enable_qed: false,
        enable_lqg: false,
        enable_gup: true,
      });
      expect(p.delta_total).toBeLessThanOrEqual(0);
    });
  });

  // ─── Spectrum generation ─────────────────────────────────────

  describe('spectrum', () => {
    it('returns correct number of points', () => {
      const result = engine.spectrum(5778, 1e11, 1e15, 50);
      expect(result.spectrum).toHaveLength(50);
      expect(result.num_points).toBe(50);
    });

    it('returns correct temperature', () => {
      const result = engine.spectrum(5778, 1e11, 1e15, 50);
      expect(result.temperature_K).toBe(5778);
    });

    it('returns correct frequency range', () => {
      const result = engine.spectrum(5778, 1e11, 1e15, 50);
      expect(result.freq_range_Hz[0]).toBe(1e11);
      expect(result.freq_range_Hz[1]).toBe(1e15);
    });

    it('peak frequency near Wien law for Sun (T = 5778 K)', () => {
      const T = 5778;
      const result = engine.spectrum(T, 1e11, 1e15, 200);
      const nuWien = (2.821 * kB * T) / h;
      const ratio = result.peak_frequency_Hz / nuWien;
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);
    });

    it('peak wavelength at ν-domain peak ~870 nm for solar spectrum', () => {
      const result = engine.spectrum(5778, 1e11, 1e15, 200);
      // Peak is in frequency domain: λ = c/ν_max ≈ c/(2.821·kB·T/h) ≈ 870 nm
      expect(result.peak_wavelength_nm).toBeGreaterThan(750);
      expect(result.peak_wavelength_nm).toBeLessThan(1000);
    });

    it('frequencies are geometrically spaced', () => {
      const result = engine.spectrum(5778, 1e11, 1e15, 100);
      const freqs = result.spectrum.map((p) => p.freq_Hz);
      const r0 = freqs[1] / freqs[0];
      for (let i = 1; i < freqs.length - 1; i++) {
        const ri = freqs[i + 1] / freqs[i];
        expect(Math.abs(ri / r0 - 1)).toBeLessThan(1e-10);
      }
    });

    it('all spectrum points have required fields', () => {
      const result = engine.spectrum(5778, 1e11, 1e15, 10);
      for (const p of result.spectrum) {
        expect(p).toHaveProperty('freq_Hz');
        expect(p).toHaveProperty('wavelength_m');
        expect(p).toHaveProperty('B_planck');
        expect(p).toHaveProperty('delta_total');
        expect(p).toHaveProperty('B_corrected');
      }
    });
  });

  // ─── Singleton export ────────────────────────────────────────

  describe('singleton', () => {
    it('blackbodyEngine is an instance of BlackbodyEngine', () => {
      expect(blackbodyEngine).toBeInstanceOf(BlackbodyEngine);
    });
  });
});
