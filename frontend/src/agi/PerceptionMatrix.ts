/**
 * PerceptionMatrix.ts – مصفوفة الإدراك الكمية
 * Ultimate Quantum SuperSystem v5.0
 *
 * تحوّل الإدخال الخام (نصي/رقمي) إلى
 * تمثيل كمي داخلي (Feature Embedding)
 * باستخدام تحويل فورييه الكمي (QFT)
 */

import type { Complex } from '../types/quantum.types';
import { complexExp, complexAbs } from '../core/quantum-core';
import type { IntentCategory } from './QuantumAGIBridge';

// ================================================================
// تمثيل المُتجه الكمي للمدخل
// ================================================================

export interface PerceptionVector {
  rawText:        string;
  tokenCount:     number;
  featureVector:  number[];       // تمثيل رقمي مُطبَّع [0, 1]
  qftAmplitudes:  Complex[];      // تضخيمات تحويل فورييه الكمي
  dominantFreq:   number;         // التردد السائد (مؤشر دلالي)
  entropyScore:   number;         // تنوع المعلومات (0-1)
  urgencyScore:   number;         // مدى إلحاح الطلب (0-1)
}

// ================================================================
// تحويل فورييه الكمي المُبسَّط (DFT)
// ================================================================

/**
 * تحويل فورييه الكمي (QFT) للإشارة بطول N
 * X[k] = Σₙ x[n] · e^(-i·2π·k·n/N)
 */
function computeQFT(signal: number[]): Complex[] {
  const N     = signal.length;
  const result: Complex[] = [];

  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im += signal[n] * Math.sin(angle);
    }
    result.push({ real: re / N, imag: im / N });
  }

  return result;
}

// ================================================================
// مصفوفة الإدراك
// ================================================================

export class PerceptionMatrix {
  private readonly _featureDim: number;

  constructor(featureDim = 16) {
    this._featureDim = Math.max(4, Math.min(64, featureDim));
  }

  /**
   * تحويل النص إلى متجه إدراكي كمي
   */
  perceive(text: string): PerceptionVector {
    const tokens = text.trim().split(/\s+/).filter(Boolean);

    // ─── استخراج المميزات الأولية ─────────────────────────────
    const featureVector = this._extractFeatures(text, tokens);

    // ─── تطبيق QFT على المتجه ────────────────────────────────
    const qftAmplitudes = computeQFT(featureVector);

    // ─── إيجاد التردد السائد ──────────────────────────────────
    let maxMag = 0;
    let dominantFreq = 0;
    qftAmplitudes.forEach((c, k) => {
      const mag = complexAbs(c);
      if (mag > maxMag) { maxMag = mag; dominantFreq = k; }
    });

    // ─── حساب الإنتروبيا ──────────────────────────────────────
    const probs = qftAmplitudes.map(c => {
      const p = complexAbs(c);
      return p * p;
    });
    const total = probs.reduce((a, b) => a + b, 0) + 1e-10;
    const norm  = probs.map(p => p / total);
    const entropyScore = -norm.reduce((s, p) =>
      p > 1e-12 ? s + p * Math.log2(p) : s, 0
    ) / Math.log2(this._featureDim);

    // ─── حساب درجة الإلحاح ───────────────────────────────────
    const urgencyKeywords = /urgent|عاجل|critical|حرج|immediate|فوري|danger|خطر/i;
    const urgencyScore    = urgencyKeywords.test(text) ? 0.9 : 0.3 + maxMag * 0.4;

    return {
      rawText:       text,
      tokenCount:    tokens.length,
      featureVector,
      qftAmplitudes,
      dominantFreq,
      entropyScore:  Math.min(1, entropyScore),
      urgencyScore:  Math.min(1, urgencyScore),
    };
  }

  /**
   * حساب تشابه بين متجهَي إدراك (cosine similarity)
   */
  similarity(a: PerceptionVector, b: PerceptionVector): number {
    const va = a.featureVector;
    const vb = b.featureVector;
    let dot = 0, na = 0, nb = 0;
    const len = Math.min(va.length, vb.length);

    for (let i = 0; i < len; i++) {
      dot += va[i] * vb[i];
      na  += va[i] * va[i];
      nb  += vb[i] * vb[i];
    }

    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
  }

  // ─── دوال خاصة ─────────────────────────────────────────────

  private _extractFeatures(text: string, tokens: string[]): number[] {
    const d   = this._featureDim;
    const vec = new Array<number>(d).fill(0);
    const t   = text.toLowerCase();

    // المميزة 0: تطبيع طول النص
    vec[0] = Math.min(1, tokens.length / 50);

    // المميزة 1: نسبة الأحرف الأبجدية
    const alphaCount = (t.match(/[a-zأ-ي]/g) ?? []).length;
    vec[1] = alphaCount / (t.length + 1);

    // المميزة 2-5: وجود كلمات مفتاحية لكل فئة
    vec[2] = /drug|دواء|protein/.test(t) ? 1 : 0;
    vec[3] = /crypto|تشفير|bb84/.test(t)  ? 1 : 0;
    vec[4] = /physics|كم|quantum/.test(t) ? 1 : 0;
    vec[5] = /code|refactor|تحسين/.test(t) ? 1 : 0;

    // المميزة 6: مؤشر الإلحاح
    vec[6] = /urgent|عاجل|critical/.test(t) ? 1 : 0;

    // المميزات 7-15: هاش بسيط للتوكنات
    tokens.slice(0, d - 7).forEach((token, i) => {
      let hash = 0;
      for (const ch of token) hash = (hash * 31 + ch.charCodeAt(0)) & 0xFFFF;
      vec[7 + i] = (hash % 100) / 100;
    });

    return vec;
  }
}

// Singleton
export const perceptionMatrix = new PerceptionMatrix(16);
