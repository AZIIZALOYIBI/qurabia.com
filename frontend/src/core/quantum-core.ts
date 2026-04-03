/**
 * ============================================================
 * quantum-core.ts – النواة الفيزيائية لمعادلة العتيبي v2.0
 * QURABIA
 *
 * المعادلة الموحدة:
 * E_TOTAL = h·ν × [α(α+β²)] × [1+k_dm·ρ_dm+k_de·ρ_de]
 *                × |ψ(r,t)·S(θ,φ)| × F_fine-tuning
 *
 * جميع الدوال نقية (Pure Functions) خالية من الآثار الجانبية.
 * جميع الأبعاد الفيزيائية متسقة ومُتحقَّق منها.
 * ============================================================
 */

import {
  PHYSICAL_CONSTANTS,
  ALOTAIBI_CONSTANTS,
  type Complex,
  type AlOtaibiResult,
  type SimulationInput,
} from '../types/quantum.types';

// ================================================================
// القسم الأول: الدوال الرياضية الأساسية (Pure Math Utilities)
// ================================================================

/**
 * جمع عددين مركبين
 * (a+bi) + (c+di) = (a+c) + (b+d)i
 */
export const complexAdd = (a: Complex, b: Complex): Complex => ({
  real: a.real + b.real,
  imag: a.imag + b.imag,
});

/**
 * ضرب عددين مركبين
 * (a+bi)(c+di) = (ac-bd) + (ad+bc)i
 */
export const complexMul = (a: Complex, b: Complex): Complex => ({
  real: a.real * b.real - a.imag * b.imag,
  imag: a.real * b.imag + a.imag * b.real,
});

/**
 * القيمة المطلقة (المعيار) لعدد مركب
 * |z| = √(real² + imag²)
 */
export const complexAbs = (z: Complex): number =>
  Math.sqrt(z.real * z.real + z.imag * z.imag);

/**
 * الدالة الأسية المركبة e^(iθ) = cos(θ) + i·sin(θ)
 * تُستخدم في بناء بوابات التدوير الكمية
 */
export const complexExp = (theta: number): Complex => ({
  real: Math.cos(theta),
  imag: Math.sin(theta),
});

/**
 * دالة الإنتروبيا الثنائية H₂(p)
 * H₂(p) = -p·log₂(p) - (1-p)·log₂(1-p)
 * تُستخدم في حساب أمان البروتوكولات الكمية
 * @param p - احتمالية (0 ≤ p ≤ 1)
 */
export const binaryEntropy = (p: number): number => {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
};

// ================================================================
// القسم الثاني: الحدود الأربعة لمعادلة العتيبي
// (كل دالة تمثل حداً مستقلاً)
// ================================================================

/**
 * ─── الحد الأول: طاقة الفوتون المرجعية ───────────────────────
 *
 * E_photon = h·ν
 *
 * حيث:
 * - h = 6.626×10⁻³⁴ J·s (ثابت بلانك)
 * - ν = التردد بوحدة Hz
 *
 * أمثلة فيزيائية للتحقق:
 * - ضوء أخضر (ν=5.5e14 Hz): E = 3.64×10⁻¹⁹ J = 2.27 eV  ✓
 * - أشعة X (ν=3e17 Hz):      E = 1.99×10⁻¹⁶ J = 1.24 keV ✓
 *
 * @param frequency - التردد ν بوحدة Hz
 * @returns طاقة الفوتون بوحدة الجول
 */
export const computePhotonEnergy = (frequency: number): number => {
  if (frequency <= 0) throw new RangeError(`التردد يجب أن يكون موجباً، القيمة المُدخَلة: ${frequency}`);
  return PHYSICAL_CONSTANTS.PLANCK_H * frequency;
};

/**
 * ─── الحد الثاني: معامل التضخيم الكمي (α-Factor) ──────────────
 *
 * Q_amp = α × (α + β²)
 *
 * الاشتقاق الرياضي:
 * β² = 0.9985² = 0.99700225
 * Q_amp = 25.3 × (25.3 + 0.99700225)
 *       = 25.3 × 26.29700225
 *       = 665.3142... ≈ 665.31
 *
 * التفسير الفيزيائي لـ α = 25.3:
 * ┌─────────────────────────────────────────────────────────┐
 * │ α يعمل كمُضخِّم كمي يرفع طاقة الإشارة عن مستوى الضجيج│
 * │ في نظرية المعلومات الكمية: SNR_quantum = α²/4 ≈ 160    │
 * │ وهو يضمن أن دقة العملية الكمية = β = 99.85%            │
 * │ حاصل الضرب α(α+β²) يمثل "الكسب" الكلي للدائرة الكمية │
 * └─────────────────────────────────────────────────────────┘
 *
 * @returns معامل التضخيم الكمي (بلا وحدة) ≈ 665.31
 */
export const computeQuantumAmplification = (): number => {
  const { ALPHA, BETA } = ALOTAIBI_CONSTANTS;

  const betaSquared = BETA * BETA;
  const result = ALPHA * (ALPHA + betaSquared);

  if (result < 665.0 || result > 666.0) {
    throw new Error(`خطأ داخلي: معامل التضخيم ${result} خارج النطاق المتوقع [665, 666]`);
  }

  return result;
};

/**
 * ─── الحد الثالث: عامل القطاع المظلم الكوني ──────────────────
 *
 * D_cosmic = 1 + k_dm·Ω_dm + k_de·Ω_de
 *
 * الاشتقاق (بقيم مرصد بلانك 2018):
 * = 1 + 0.26×0.2589 + 0.70×0.6847
 * = 1 + 0.067314 + 0.479290
 * = 1.546604
 *
 * @param omegaDM - كثافة المادة المظلمة النسبية (0 ≤ Ω_dm ≤ 1)
 * @param omegaDE - كثافة الطاقة المظلمة النسبية (0 ≤ Ω_de ≤ 1)
 * @returns العامل الكوني (بلا وحدة) ≈ 1.5466
 */
export const computeDarkSectorFactor = (
  omegaDM: number,
  omegaDE: number
): number => {
  if (omegaDM < 0 || omegaDM > 1) throw new RangeError(`Ω_dm=${omegaDM} خارج النطاق [0,1]`);
  if (omegaDE < 0 || omegaDE > 1) throw new RangeError(`Ω_de=${omegaDE} خارج النطاق [0,1]`);

  const { K_DARK_MATTER, K_DARK_ENERGY } = ALOTAIBI_CONSTANTS;
  return 1 + K_DARK_MATTER * omegaDM + K_DARK_ENERGY * omegaDE;
};

/**
 * ─── الحد الرابع: جسر النسبية والكم ──────────────────────────
 *
 * W_bridge = |ψ(r,t)| × |S(θ,φ)|
 */
export const computeWaveBridge = (
  psiReal: number,
  psiImag: number,
  spherical: number
): number => {
  const psiMagnitude = Math.sqrt(psiReal * psiReal + psiImag * psiImag);
  return psiMagnitude * Math.abs(spherical);
};

// ================================================================
// القسم الثالث: المعادلة الموحدة الكاملة
// ================================================================

export function calculateAlOtaibiUnified(input: SimulationInput): AlOtaibiResult {
  const log: string[] = [];
  const {
    PLANCK_ENERGY,
    PLANCK_H,
    JOULE_TO_EV,
  } = PHYSICAL_CONSTANTS;
  const { OMEGA_DM, OMEGA_DE } = ALOTAIBI_CONSTANTS;

  const omegaDM = input.darkMatterDensity ?? OMEGA_DM;
  const omegaDE = input.darkEnergyDensity ?? OMEGA_DE;

  const E1_photon = computePhotonEnergy(input.frequency);
  log.push(
    `[Term-1] h·ν = ${PLANCK_H.toExponential(4)} × ${input.frequency.toExponential(4)}` +
    ` = ${E1_photon.toExponential(6)} J`
  );

  const E2_amplification = computeQuantumAmplification();
  log.push(
    `[Term-2] α(α+β²) = 25.3×(25.3+${(ALOTAIBI_CONSTANTS.BETA**2).toFixed(8)})` +
    ` = ${E2_amplification.toFixed(6)}`
  );

  const E3_darkSector = computeDarkSectorFactor(omegaDM, omegaDE);
  log.push(
    `[Term-3] 1 + k_dm·Ω_dm + k_de·Ω_de` +
    ` = 1 + ${ALOTAIBI_CONSTANTS.K_DARK_MATTER}×${omegaDM.toFixed(4)}` +
    ` + ${ALOTAIBI_CONSTANTS.K_DARK_ENERGY}×${omegaDE.toFixed(4)}` +
    ` = ${E3_darkSector.toFixed(6)}`
  );

  const E4_waveBridge = computeWaveBridge(
    input.waveFunctionReal,
    input.waveFunctionImag,
    input.sphericalHarmonic
  );
  log.push(
    `[Term-4] |ψ·S| = √(${input.waveFunctionReal}²+${input.waveFunctionImag}²)` +
    ` × |${input.sphericalHarmonic}|` +
    ` = ${E4_waveBridge.toFixed(8)}`
  );

  const E5_fineTuning = input.fineTuning;
  log.push(`[Term-5] F_fine-tuning = ${E5_fineTuning}`);

  let totalEnergyJoules =
    E1_photon *
    E2_amplification *
    E3_darkSector *
    E4_waveBridge *
    E5_fineTuning;
  log.push(`[Step-6] E_raw = ${totalEnergyJoules.toExponential(8)} J`);

  let singularitySuppressed = false;
  if (!isFinite(totalEnergyJoules) || totalEnergyJoules > PLANCK_ENERGY) {
    totalEnergyJoules = PLANCK_ENERGY;
    singularitySuppressed = true;
    log.push(`[Step-7] ⚠️ تجاوز طاقة بلانك! تقييد E → E_Planck = ${PLANCK_ENERGY.toExponential(3)} J`);
  } else if (totalEnergyJoules < 0) {
    log.push(`[Step-7] ℹ️ طاقة سالبة (حالة مرتبطة): ${totalEnergyJoules.toExponential(6)} J`);
  } else {
    log.push(`[Step-7] ✓ الطاقة ضمن الحدود الفيزيائية`);
  }

  const totalEnergyEV = totalEnergyJoules * JOULE_TO_EV;
  log.push(`[Step-8] E_total = ${totalEnergyJoules.toExponential(6)} J = ${totalEnergyEV.toExponential(6)} eV`);

  return {
    totalEnergyJoules,
    totalEnergyEV,
    photonEnergyJ:        E1_photon,
    quantumAmplification: E2_amplification,
    darkSectorFactor:     E3_darkSector,
    waveBridgeFactor:     E4_waveBridge,
    fineTuningFactor:     E5_fineTuning,
    singularitySuppressed,
    log,
  };
}

export function runQuantumCoreVerification(): {
  passed: boolean;
  results: { name: string; passed: boolean; detail: string }[];
} {
  const results: { name: string; passed: boolean; detail: string }[] = [];

  (() => {
    const amp = computeQuantumAmplification();
    const expected = 25.3 * (25.3 + 0.9985 * 0.9985);
    const passed = Math.abs(amp - expected) < 1e-6;
    results.push({
      name: 'التضخيم الكمي α(α+β²)',
      passed,
      detail: `محسوب: ${amp.toFixed(6)}, متوقع: ${expected.toFixed(6)}, خطأ: ${Math.abs(amp-expected).toExponential(2)}`,
    });
  })();

  (() => {
    const dark = computeDarkSectorFactor(0.2589, 0.6847);
    const expected = 1 + 0.26 * 0.2589 + 0.70 * 0.6847;
    const passed = Math.abs(dark - expected) < 1e-8;
    results.push({
      name: 'العامل الكوني D_cosmic',
      passed,
      detail: `محسوب: ${dark.toFixed(8)}, متوقع: ${expected.toFixed(8)}`,
    });
  })();

  (() => {
    const freq = 5.454e14;
    const energy = computePhotonEnergy(freq);
    const expectedEV = energy * PHYSICAL_CONSTANTS.JOULE_TO_EV;
    const passed = expectedEV > 2.0 && expectedEV < 2.5;
    results.push({
      name: 'طاقة فوتون أخضر (550nm)',
      passed,
      detail: `E = ${energy.toExponential(4)} J = ${expectedEV.toFixed(3)} eV (متوقع: ~2.25 eV)`,
    });
  })();

  (() => {
    const { HBAR, SPEED_OF_LIGHT, GRAVITATIONAL_G } = PHYSICAL_CONSTANTS;
    const computed = Math.sqrt((HBAR * Math.pow(SPEED_OF_LIGHT, 5)) / GRAVITATIONAL_G);
    const stored = PHYSICAL_CONSTANTS.PLANCK_ENERGY;
    const relativeError = Math.abs(computed - stored) / stored;
    const passed = relativeError < 0.001;
    results.push({
      name: 'طاقة بلانك E_P = √(ℏc⁵/G)',
      passed,
      detail: `محسوبة: ${computed.toExponential(4)} J, مخزونة: ${stored.toExponential(4)} J, خطأ نسبي: ${(relativeError*100).toFixed(4)}%`,
    });
  })();

  (() => {
    const h = binaryEntropy(0.5);
    const passed = Math.abs(h - 1.0) < 1e-10;
    results.push({
      name: 'إنتروبيا ثنائية H₂(0.5) = 1 bit',
      passed,
      detail: `H₂(0.5) = ${h.toFixed(10)} (متوقع: 1.0000000000)`,
    });
  })();

  (() => {
    const bridge = computeWaveBridge(1, 0, 1);
    const passed = Math.abs(bridge - 1.0) < 1e-12;
    results.push({
      name: 'جسر الموجة |ψ·S| عند |ψ|=1, S=1',
      passed,
      detail: `محسوب: ${bridge.toFixed(12)}, متوقع: 1.0`,
    });
  })();

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

export function computeEnergySpectrum(
  freqMin: number,
  freqMax: number,
  steps: number,
  baseInput: Omit<SimulationInput, 'frequency'>
): Array<{ frequency: number; energyEV: number }> {
  if (steps < 2)   throw new RangeError('عدد الخطوات يجب أن يكون ≥ 2');
  if (freqMin <= 0) throw new RangeError('أدنى تردد يجب أن يكون > 0');
  if (freqMax <= freqMin) throw new RangeError('أعلى تردد يجب أن يكون > أدنى تردد');

  const spectrum: Array<{ frequency: number; energyEV: number }> = [];
  const step = (freqMax - freqMin) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const frequency = freqMin + i * step;
    const result = calculateAlOtaibiUnified({ ...baseInput, frequency });
    spectrum.push({
      frequency,
      energyEV: result.totalEnergyEV,
    });
  }

  return spectrum;
}
