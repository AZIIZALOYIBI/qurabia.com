/**
 * ============================================================
 * quantum.types.ts – تعريفات الأنواع الكمية الشاملة
 * Ultimate Quantum SuperSystem v5.0
 * ============================================================
 */

// ─── الثوابت الفيزيائية (NIST CODATA 2018) ───────────────────
export const PHYSICAL_CONSTANTS = {
  /** ثابت بلانك h = 6.626×10⁻³⁴ J·s */
  PLANCK_H:            6.62607015e-34,
  /** ثابت بلانك المختزل ℏ = 1.055×10⁻³⁴ J·s */
  HBAR:                1.054571817e-34,
  /** سرعة الضوء c = 2.998×10⁸ m/s */
  SPEED_OF_LIGHT:      2.99792458e8,
  /** ثابت الجاذبية G = 6.674×10⁻¹¹ m³/(kg·s²) */
  GRAVITATIONAL_G:     6.67430e-11,
  /**
   * طاقة بلانك E_P = √(ℏc⁵/G) = 1.956×10⁹ J
   * هذا هو الحد الأعلى الفيزيائي الصحيح (وليس طول بلانك 1.616e-35m)
   */
  PLANCK_ENERGY:       1.956e9,
  /** تحويل هارتري إلى إلكترون فولت: 1 Ha = 27.2114 eV */
  HARTREE_TO_EV:       27.211396,
  /** تحويل جول إلى إلكترون فولت */
  JOULE_TO_EV:         6.241509074e18,
} as const;

// ─── ثوابت نموذج العتيبي ─────────────────────────────────────
export const ALOTAIBI_CONSTANTS = {
  /**
   * α = 25.3 – معامل التضخيم الكمي
   * الدور الفيزيائي: يرفع نسبة الإشارة إلى الضوضاء (SNR)
   * بمعادلة: SNR_boost = α(α+β²) / (4·k_B·T·Δf)
   * عند α=25.3: Q_amplification = 25.3×(25.3+0.9970) = 665.31
   */
  ALPHA:          25.3,
  /**
   * β = 0.9985 – معامل الكفاءة التشغيلية
   * الدور: تحقيق دقة 99.85% في عمليات البوابات الكمية
   * β² = 0.99700225 (يُستخدم في حساب Q_amplification)
   */
  BETA:           0.9985,
  /** k_dm = 0.26 – معامل المادة المظلمة (بلا وحدة) */
  K_DARK_MATTER:  0.26,
  /** k_de = 0.70 – معامل الطاقة المظلمة (بلا وحدة) */
  K_DARK_ENERGY:  0.70,
  /** Ω_dm = 0.2589 – كثافة المادة المظلمة النسبية (Planck 2018) */
  OMEGA_DM:       0.2589,
  /** Ω_de = 0.6847 – كثافة الطاقة المظلمة النسبية (Planck 2018) */
  OMEGA_DE:       0.6847,
} as const;

// ─── أنواع الأعداد المركبة ────────────────────────────────────
export interface Complex {
  real: number;
  imag: number;
}

// ─── حالة الكيوبت ─────────────────────────────────────────────
export interface QubitState {
  /** سعة الحالة |0⟩ */
  alpha: Complex;
  /** سعة الحالة |1⟩ */
  beta: Complex;
}

// ─── نتيجة معادلة العتيبي ────────────────────────────────────
export interface AlOtaibiResult {
  /** الطاقة الكلية بوحدة الجول */
  totalEnergyJoules:      number;
  /** الطاقة الكلية بوحدة إلكترون فولت */
  totalEnergyEV:          number;
  /** الحد الأول: h·ν */
  photonEnergyJ:          number;
  /** الحد الثاني: α(α+β²) = 665.31 */
  quantumAmplification:   number;
  /** الحد الثالث: 1 + k_dm·Ω_dm + k_de·Ω_de */
  darkSectorFactor:       number;
  /** الحد الرابع: |ψ(r,t)·S(θ,φ)| */
  waveBridgeFactor:       number;
  /** الحد الخامس: F_fine-tuning */
  fineTuningFactor:       number;
  /** هل تجاوزت طاقة بلانك؟ */
  singularitySuppressed:  boolean;
  /** سجل الحسابات للتحقق */
  log:                    string[];
}

// ─── حالة معالج الكم ─────────────────────────────────────────
export interface ProcessorState {
  numQubits:        number;
  coherenceTimeMs:  number;
  errorRate:        number;
  qopsPerSecond:    number;
  temperature:      number;
  toricCodeActive:  boolean;
}

// ─── إدخال نموذج المحاكاة ─────────────────────────────────────
export interface SimulationInput {
  frequency:          number;
  waveFunctionReal:   number;
  waveFunctionImag:   number;
  sphericalHarmonic:  number;
  fineTuning:         number;
  darkMatterDensity?: number;
  darkEnergyDensity?: number;
}

// ─── أوضاع التشغيل ───────────────────────────────────────────
export type SimulationMode =
  | 'physics'
  | 'chemistry'
  | 'cryptography'
  | 'genomics'
  | 'agi'
  | 'hybrid';

// ─── حالة الأخلاق ────────────────────────────────────────────
export interface EthicsState {
  nonMaleficence: number;  // 0–1
  beneficence:    number;
  autonomy:       number;
  justice:        number;
  overallScore:   number;
  isViolation:    boolean;
  reason:         string;
}
