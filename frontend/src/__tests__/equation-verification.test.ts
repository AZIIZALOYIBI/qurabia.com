/**
 * اختبارات التحقق من دقة المعادلات الفيزيائية
 * Equation Verification Tests — Physics Accuracy
 *
 * يتحقق من:
 * - ثوابت NIST CODATA 2018
 * - قانون بلانك للإشعاع الحراري
 * - قانون فين للإزاحة
 * - قانون ستيفان-بولتزمان
 * - خوارزمية جروفر (عدد التكرارات المثالي)
 * - الاستقرار العددي (Math.expm1)
 * - بوابات الكم (الوحدوية والهرمتية)
 * - معادلة العتيبي الموحدة
 */
import { describe, expect, it } from 'vitest';
import { computeDarkSectorFactor, computePhotonEnergy, computeQuantumAmplification } from '../core/quantum-core';
import { complexAbs } from '../core/quantum-core';
import { GATE_H, GATE_X, GATE_Y, GATE_Z, type StateVector1Q, applyGate1Q } from '../core/quantum-gates';
import { AlOtaibiPlanck } from '../engine/AlOtaibiPlanck';
import { AlUtaibiEquationV2, CosmicConstants } from '../engine/AlUtaibiEquationV2';
import { BlackbodyEngine } from '../engine/BlackbodyEngine';
import { GroverSimulator } from '../engine/GroverAlgorithm';
import { PHYSICAL_CONSTANTS } from '../types/quantum.types';

// ═══════════════════════════════════════════════════════════════════
// 1. التحقق من ثوابت NIST CODATA 2018
// ═══════════════════════════════════════════════════════════════════

describe('NIST CODATA 2018 Constants Verification', () => {
  it('ثابت بلانك h = 6.62607015e-34 J·s (دقيق)', () => {
    expect(PHYSICAL_CONSTANTS.PLANCK_H).toBe(6.62607015e-34);
    expect(CosmicConstants.h).toBe(6.62607015e-34);
  });

  it('ثابت بلانك المختزل ℏ = h/(2π)', () => {
    const expected = 6.62607015e-34 / (2 * Math.PI);
    expect(PHYSICAL_CONSTANTS.HBAR).toBeCloseTo(expected, 20);
  });

  it('تحويل J→eV = 6.241509074e18 (دقيق)', () => {
    expect(PHYSICAL_CONSTANTS.JOULE_TO_EV).toBe(6.241509074e18);
    expect(CosmicConstants.JOULE_TO_EV).toBe(6.241509074e18);
  });

  it('سرعة الضوء c = 299792458 m/s (دقيق)', () => {
    expect(PHYSICAL_CONSTANTS.SPEED_OF_LIGHT).toBe(2.99792458e8);
  });

  it('طول بلانك l_P = √(ℏG/c³) ≈ 1.616e-35 m', () => {
    const { HBAR, SPEED_OF_LIGHT, GRAVITATIONAL_G } = PHYSICAL_CONSTANTS;
    const computed = Math.sqrt((HBAR * GRAVITATIONAL_G) / SPEED_OF_LIGHT ** 3);
    expect(computed).toBeCloseTo(1.616255e-35, 15);
    expect(CosmicConstants.PLANCK_LENGTH).toBeCloseTo(computed, 15);
  });

  it('طاقة بلانك E_P = √(ℏc⁵/G) ≈ 1.956e9 J', () => {
    const { HBAR, SPEED_OF_LIGHT, GRAVITATIONAL_G } = PHYSICAL_CONSTANTS;
    const computed = Math.sqrt((HBAR * SPEED_OF_LIGHT ** 5) / GRAVITATIONAL_G);
    const relativeError = Math.abs(computed - PHYSICAL_CONSTANTS.PLANCK_ENERGY) / computed;
    expect(relativeError).toBeLessThan(0.001);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. التحقق من قانون بلانك — Planck's Law
// ═══════════════════════════════════════════════════════════════════

describe('Planck Law Verification', () => {
  const _planck = new AlOtaibiPlanck();
  const bbEngine = new BlackbodyEngine();

  it('طاقة فوتون أخضر (550nm) ≈ 2.25 eV', () => {
    const c = 299792458;
    const lambda = 550e-9; // 550 nm
    const freq = c / lambda;
    const E = computePhotonEnergy(freq);
    const eV = E * PHYSICAL_CONSTANTS.JOULE_TO_EV;
    expect(eV).toBeGreaterThan(2.2);
    expect(eV).toBeLessThan(2.3);
  });

  it('طاقة فوتون أحمر (700nm) ≈ 1.77 eV', () => {
    const c = 299792458;
    const lambda = 700e-9;
    const freq = c / lambda;
    const E = computePhotonEnergy(freq);
    const eV = E * PHYSICAL_CONSTANTS.JOULE_TO_EV;
    expect(eV).toBeGreaterThan(1.7);
    expect(eV).toBeLessThan(1.85);
  });

  it('قانون فين: ν_max = 2.821 kBT/h للشمس (T=5778K)', () => {
    const T = 5778;
    const h = 6.62607015e-34;
    const kB = 1.380649e-23;
    const nuWien = (2.821 * kB * T) / h;
    // ≈ 3.4e14 Hz → λ ≈ 880 nm (قمة في مجال التردد)
    expect(nuWien).toBeGreaterThan(3.3e14);
    expect(nuWien).toBeLessThan(3.5e14);

    // التحقق من محرك الطيف
    const result = bbEngine.spectrum(T, 1e11, 1e15, 200);
    const ratio = result.peak_frequency_Hz / nuWien;
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('الطيف يتناقص عند الترددات العالية جداً (قطع فين)', () => {
    const T = 5778;
    const p1 = bbEngine.point(1e14, T);
    const p2 = bbEngine.point(1e15, T);
    // عند تردد أعلى بكثير من القمة، الإشعاع يتناقص أسياً
    expect(p2.B_planck).toBeLessThan(p1.B_planck);
  });

  it('الطيف يتناسب مع ν² عند الترددات المنخفضة (حد رايلي-جينز)', () => {
    const T = 5778;
    const nu1 = 1e10;
    const nu2 = 2e10;
    const p1 = bbEngine.point(nu1, T);
    const p2 = bbEngine.point(nu2, T);
    // في حد رايلي-جينز (hν << kBT): B(ν) ≈ 2kBTν²/c² → B(2ν)/B(ν) ≈ 4
    const ratio = p2.B_planck / p1.B_planck;
    expect(ratio).toBeCloseTo(4, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. الاستقرار العددي — Numerical Stability
// ═══════════════════════════════════════════════════════════════════

describe('Numerical Stability (Math.expm1)', () => {
  const planck = new AlOtaibiPlanck();
  const bbEngine = new BlackbodyEngine();

  it('لا يُرجع NaN أو Infinity عند أي تردد فيزيائي', () => {
    const T = 5778;
    for (const freq of [1e8, 1e10, 1e12, 1e14, 1e15]) {
      const result = planck.planckClassical(freq, T);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });

  it('يعالج الترددات المنخفضة جداً بشكل صحيح (x → 0)', () => {
    const T = 5778;
    const freq = 1e8; // تردد منخفض جداً
    const result = bbEngine.point(freq, T);
    expect(result.B_planck).toBeGreaterThan(0);
    expect(Number.isFinite(result.B_planck)).toBe(true);
  });

  it('يعالج الترددات العالية بشكل صحيح (x → ∞)', () => {
    const T = 300;
    const freq = 1e16; // تردد عالٍ جداً
    const result = bbEngine.point(freq, T);
    expect(Number.isFinite(result.B_planck)).toBe(true);
    // عند x كبير، B_planck يكاد يكون صفراً
    expect(result.B_planck).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. خوارزمية جروفر — Grover's Algorithm
// ═══════════════════════════════════════════════════════════════════

describe('Grover Algorithm — Mathematical Verification', () => {
  it('عدد التكرارات المثالي = ⌊π/4 × √N⌋', () => {
    const testCases = [
      { N: 4, expected: Math.floor((Math.PI / 4) * 2) }, // 1
      { N: 16, expected: Math.floor((Math.PI / 4) * 4) }, // 3
      { N: 64, expected: Math.floor((Math.PI / 4) * 8) }, // 6
      { N: 256, expected: Math.floor((Math.PI / 4) * 16) }, // 12
      { N: 1024, expected: Math.floor((Math.PI / 4) * 32) }, // 25
    ];

    for (const { N, expected } of testCases) {
      const sim = new GroverSimulator(N, 0);
      expect(sim.getOptimalSteps()).toBe(expected);
    }
  });

  it('التوزيع الاحتمالي يُجمع إلى 1 بعد أي عدد من الخطوات', () => {
    const N = 64;
    const sim = new GroverSimulator(N, 42);
    for (let step = 0; step < 10; step++) {
      sim.step();
      const total = sim.getProbabilities().reduce((s, p) => s + p, 0);
      expect(total).toBeCloseTo(1.0, 10);
    }
  });

  it('الاحتمال المستهدف > 90% بعد العدد المثالي من الخطوات (N=256)', () => {
    const N = 256;
    const target = 123;
    const sim = new GroverSimulator(N, target);
    const optimal = sim.getOptimalSteps();
    for (let i = 0; i < optimal; i++) sim.step();
    const probs = sim.getProbabilities();
    expect(probs[target]).toBeGreaterThan(0.9);
  });

  it('يرفض حجم قاعدة بيانات صفري أو سالب', () => {
    expect(() => new GroverSimulator(0, 0)).toThrow(RangeError);
    expect(() => new GroverSimulator(-1, 0)).toThrow(RangeError);
  });

  it('يرفض فهرساً خارج النطاق', () => {
    expect(() => new GroverSimulator(10, 10)).toThrow(RangeError);
    expect(() => new GroverSimulator(10, -1)).toThrow(RangeError);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. بوابات الكم — Unitarity Verification
// ═══════════════════════════════════════════════════════════════════

describe('Quantum Gates — Unitarity & Properties', () => {
  const C = (r: number, i = 0) => ({ real: r, imag: i });

  it('بوابة هادامارد: H² = I (تطبيقها مرتين يُعيد الحالة)', () => {
    const state: StateVector1Q = [C(1), C(0)]; // |0⟩
    const afterH = applyGate1Q(GATE_H, state);
    const afterHH = applyGate1Q(GATE_H, afterH);
    expect(afterHH[0].real).toBeCloseTo(1, 10);
    expect(afterHH[0].imag).toBeCloseTo(0, 10);
    expect(afterHH[1].real).toBeCloseTo(0, 10);
    expect(afterHH[1].imag).toBeCloseTo(0, 10);
  });

  it('بوابة بولي-X: X² = I', () => {
    const state: StateVector1Q = [C(0.6), C(0.8)];
    const afterX = applyGate1Q(GATE_X, state);
    const afterXX = applyGate1Q(GATE_X, afterX);
    expect(afterXX[0].real).toBeCloseTo(0.6, 10);
    expect(afterXX[1].real).toBeCloseTo(0.8, 10);
  });

  it('بوابة بولي-Y: Y² = I', () => {
    const state: StateVector1Q = [C(1), C(0)];
    const afterY = applyGate1Q(GATE_Y, state);
    const afterYY = applyGate1Q(GATE_Y, afterY);
    // Y² = -I but global phase doesn't matter: |afterYY| = |state|
    expect(complexAbs(afterYY[0])).toBeCloseTo(1, 10);
    expect(complexAbs(afterYY[1])).toBeCloseTo(0, 10);
  });

  it('بوابة بولي-Z: Z² = I', () => {
    const state: StateVector1Q = [C(0.6), C(0.8)];
    const afterZ = applyGate1Q(GATE_Z, state);
    const afterZZ = applyGate1Q(GATE_Z, afterZ);
    expect(afterZZ[0].real).toBeCloseTo(0.6, 10);
    expect(afterZZ[1].real).toBeCloseTo(0.8, 10);
  });

  it('هادامارد يحافظ على التطبيع: |α|² + |β|² = 1', () => {
    const state: StateVector1Q = [C(1), C(0)];
    const afterH = applyGate1Q(GATE_H, state);
    const norm = afterH[0].real ** 2 + afterH[0].imag ** 2 + afterH[1].real ** 2 + afterH[1].imag ** 2;
    expect(norm).toBeCloseTo(1, 10);
  });

  it('H|0⟩ = |+⟩ = (|0⟩+|1⟩)/√2', () => {
    const state: StateVector1Q = [C(1), C(0)];
    const result = applyGate1Q(GATE_H, state);
    expect(result[0].real).toBeCloseTo(Math.SQRT1_2, 10);
    expect(result[1].real).toBeCloseTo(Math.SQRT1_2, 10);
  });

  it('X|0⟩ = |1⟩', () => {
    const state: StateVector1Q = [C(1), C(0)];
    const result = applyGate1Q(GATE_X, state);
    expect(result[0].real).toBeCloseTo(0, 10);
    expect(result[1].real).toBeCloseTo(1, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. معادلة العتيبي الكونية — Al-Utaibi Equation V2
// ═══════════════════════════════════════════════════════════════════

describe('Al-Utaibi Equation V2 — Constants Precision', () => {
  const engine = new AlUtaibiEquationV2();

  it('E_basic = h × ν = 6.62607015e-34 × 5e9', () => {
    const result = engine.compute_total_energy(1e-10);
    const expected = 6.62607015e-34 * 5e9;
    expect(result.E_basic).toBeCloseTo(expected, 40);
  });

  it('تحويل eV يستخدم الثابت الدقيق 6.241509074e18', () => {
    const result = engine.compute_total_energy(1e-10);
    const expectedEV = result.E_total * 6.241509074e18;
    expect(result.eV).toBeCloseTo(expectedEV, 10);
  });

  it('طول بلانك يُستخدم بدقة 1.616255e-35', () => {
    // عند r = 1.616255e-35 (بالضبط طول بلانك)، يجب أن يكون qm_effect = 0.539
    const result = engine.compute_total_energy(CosmicConstants.PLANCK_LENGTH);
    expect(result.qm_effect).toBe(0.539);
  });

  it('E_total يتسق مع الحدود الأربعة', () => {
    const r = 1e-10; // فوق طول بلانك
    const result = engine.compute_total_energy(r, 0, 0);
    // مع كثافات صفرية: dark_correction = 1, qm_effect = 1
    expect(result.dark_correction).toBe(1);
    expect(result.qm_effect).toBe(1.0);
    expect(result.E_total).toBeCloseTo(result.E_v1 * CosmicConstants.fine_tuning, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. النواة الفيزيائية — quantum-core.ts
// ═══════════════════════════════════════════════════════════════════

describe('Quantum Core — Cross-Verification', () => {
  it('α(α+β²) في النطاق [665, 666]', () => {
    const result = computeQuantumAmplification();
    // 25.3 × (25.3 + 0.9985²) = 25.3 × (25.3 + 0.99700225) = 25.3 × 26.29700225 ≈ 665.31
    expect(result).toBeCloseTo(665.314, 2);
    expect(result).toBeGreaterThan(665);
    expect(result).toBeLessThan(666);
  });

  it('العامل الكوني مع بيانات بلانك 2018: D ≈ 1.547', () => {
    // Ω_dm = 0.2589, Ω_de = 0.6847
    const result = computeDarkSectorFactor(0.2589, 0.6847);
    const expected = 1 + 0.26 * 0.2589 + 0.7 * 0.6847;
    expect(result).toBeCloseTo(expected, 8);
    expect(result).toBeCloseTo(1.5463, 3);
  });

  it('طاقة فوتون خطية مع التردد: E(2ν) = 2·E(ν)', () => {
    const E1 = computePhotonEnergy(1e14);
    const E2 = computePhotonEnergy(2e14);
    expect(E2 / E1).toBeCloseTo(2, 10);
  });
});
