/**
 * ============================================================
 * BlackbodyEngine.ts – محرك الطيف الحراري (Blackbody)
 * QURABIA
 * ============================================================
 *
 * يحسب طيف الجسم الأسود (Planck) مع تصحيحات كمية:
 *  • QED – تصحيح الديناميكا الكهربائية الكمية
 *  • LQG – تصحيح الجاذبية الكمية الحلقية
 *  • GUP – تصحيح مبدأ عدم اليقين المعمّم
 *
 * يعمل بالكامل في المتصفح بدون الحاجة لخادم خلفي.
 */

// ─── الثوابت الفيزيائية (NIST CODATA 2018) ───────────────────
const h   = 6.62607015e-34;   // ثابت بلانك (J·s)
const hbar = 1.054571817e-34; // ثابت بلانك المختزل (J·s)
const c   = 299_792_458.0;    // سرعة الضوء (m/s)
const kB  = 1.380649e-23;     // ثابت بولتزمان (J/K)
const alpha_em = 7.2973525693e-3; // ثابت البنية الدقيقة
const m_e = 9.1093837015e-31; // كتلة الإلكترون (kg)
const G   = 6.67430e-11;      // ثابت الجاذبية (m³/(kg·s²))
const l_P = Math.sqrt(hbar * G / (c ** 3)); // طول بلانك (m)
const T_e = (m_e * c ** 2) / kB; // حرارة كومبتون (K)

// ─── الأنواع ──────────────────────────────────────────────────
export interface SpectrumPoint {
  freq_Hz: number;
  wavelength_m: number;
  B_planck: number;
  delta_total: number;
  B_corrected: number;
}

export interface SpectrumResult {
  temperature_K: number;
  num_points: number;
  freq_range_Hz: [number, number];
  peak_frequency_Hz: number;
  peak_wavelength_nm: number;
  spectrum: SpectrumPoint[];
}

export interface BlackbodyOptions {
  enable_qed?: boolean;
  enable_lqg?: boolean;
  enable_gup?: boolean;
  gup_beta0?: number;
  lqg_C2?: number;
}

// ─── دوال الحساب الفيزيائي ────────────────────────────────────

/**
 * قانون بلانك: B(ν,T) = (2hν³/c²) / (exp(hν/kBT) − 1)
 */
function planck(nu: number, T: number): number {
  if (T <= 0 || nu <= 0) return 0;
  const x = (h * nu) / (kB * T);
  if (x > 500) return 0; // تجنب overflow
  const pref = (2 * h * nu ** 3) / (c ** 2);
  return pref / Math.expm1(x);
}

/**
 * توزيع بوز-آينشتاين: n(ν,T) = 1/(exp(hν/kBT) − 1)
 */
function boseEinstein(nu: number, T: number): number {
  if (T <= 0 || nu <= 0) return 0;
  const x = (h * nu) / (kB * T);
  if (x > 500) return 0;
  return 1 / Math.expm1(x);
}

/**
 * تصحيح QED: يراعي إنتاج أزواج إلكترون-بوزيترون الافتراضية
 */
function correctionQED(nu: number, T: number): number {
  if (T <= 0 || nu <= 0) return 0;
  const n = boseEinstein(nu, T);
  const coeff = (44 * Math.PI ** 2 * alpha_em ** 2) / 2025;
  return (1 + n) * coeff * ((h * nu) / (m_e * c ** 2)) * (T / T_e) ** 3;
}

/**
 * تصحيح GUP: يعدّل علاقة التشتت عند مقياس بلانك
 */
function correctionGUP(nu: number, beta0: number): number {
  if (nu <= 0) return 0;
  const k = (2 * Math.PI * nu) / c;
  return -2 * beta0 * (l_P * k) ** 2;
}

/**
 * تصحيح LQG: تأثيرات هندسية كمية على الإشعاع
 */
function correctionLQG(nu: number, T: number, C2: number): number {
  if (T <= 0 || nu <= 0) return 0;
  const x = (h * nu) / (kB * T);
  const C2_eff = C2 * ((kB * T * l_P) / (hbar * c)) ** 2;
  return C2_eff * x ** 2;
}

/**
 * توليد مصفوفة ترددات بتباعد هندسي (geomspace)
 */
function geomspace(start: number, end: number, n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [start];
  const logStart = Math.log(start);
  const logEnd   = Math.log(end);
  const step     = (logEnd - logStart) / (n - 1);
  const result: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = Math.exp(logStart + i * step);
  }
  return result;
}

// ─── الصنف الرئيسي ───────────────────────────────────────────

export class BlackbodyEngine {
  /**
   * يحسب نقطة طيف واحدة مع كل التصحيحات الكمية
   */
  point(nu: number, T: number, opts: BlackbodyOptions = {}): SpectrumPoint {
    const enableQED  = opts.enable_qed ?? true;
    const enableLQG  = opts.enable_lqg ?? true;
    const enableGUP  = opts.enable_gup ?? true;
    const beta0      = opts.gup_beta0 ?? 1.0;
    const C2         = opts.lqg_C2 ?? 1.0;

    const B0 = planck(nu, T);

    let delta = 0;
    if (enableQED) delta += correctionQED(nu, T);
    if (enableLQG) delta += correctionLQG(nu, T, C2);
    if (enableGUP) delta += correctionGUP(nu, beta0);

    return {
      freq_Hz: nu,
      wavelength_m: nu > 0 ? c / nu : Infinity,
      B_planck: B0,
      delta_total: delta,
      B_corrected: B0 * (1 + delta),
    };
  }

  /**
   * يولّد طيف الجسم الأسود الكامل
   */
  spectrum(
    T: number,
    nuMin: number,
    nuMax: number,
    nPoints: number,
    opts: BlackbodyOptions = {},
  ): SpectrumResult {
    const freqs = geomspace(nuMin, nuMax, Math.trunc(nPoints));
    const spec  = freqs.map((nu) => this.point(nu, T, opts));

    let peakIdx = 0;
    let peakVal = -1;
    for (let i = 0; i < spec.length; i++) {
      if (spec[i].B_planck > peakVal) {
        peakVal = spec[i].B_planck;
        peakIdx = i;
      }
    }

    const peakFreq = spec.length > 0 ? spec[peakIdx].freq_Hz : 0;

    return {
      temperature_K: T,
      num_points: Math.trunc(nPoints),
      freq_range_Hz: [nuMin, nuMax],
      peak_frequency_Hz: peakFreq,
      peak_wavelength_nm: peakFreq > 0 ? (c / peakFreq) * 1e9 : 0,
      spectrum: spec,
    };
  }
}

// ─── تصدير ثابت واحد ─────────────────────────────────────────
export const blackbodyEngine = new BlackbodyEngine();
