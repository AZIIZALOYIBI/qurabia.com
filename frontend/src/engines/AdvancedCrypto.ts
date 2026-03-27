/**
 * AdvancedCrypto.ts – نظام التشفير الكمي المتقدم
 * Ultimate Quantum SuperSystem v5.0
 *
 * يطبّق بروتوكولات التوزيع الكمي للمفاتيح:
 * - BB84 (بينيت-براسار 1984)
 * - E91 (إيكيرت 1991)
 * - CRYSTALS-Kyber (تشفير ما بعد الكم)
 * - McEliece (شبكة رمزية)
 */

import type { SimulationInput, AlOtaibiResult } from '../types/quantum.types';
import { calculateAlOtaibiUnified, binaryEntropy } from '../core/quantum-core';
import type { SimulationStrategy } from './SimulationFactory';
import { SimulationFactory } from './SimulationFactory';

// ================================================================
// أنواع البيانات
// ================================================================

export type QKDProtocol = 'BB84' | 'E91' | 'CRYSTALS-Kyber' | 'McEliece';

export interface CryptoResult extends AlOtaibiResult {
  metadata: {
    protocol:         QKDProtocol;
    keyLengthBits:    number;
    qber:             number;        // معدل الخطأ في البت الكمي (0-1)
    secureKeyRate:    number;        // معدل توليد مفاتيح آمنة (bps)
    isSecure:         boolean;
    shannonEntropy:   number;        // إنتروبيا شانون للمفتاح
    mutualInfo:       number;        // المعلومة المشتركة Eve-Alice
    privacyAmpFactor: number;        // معامل تضخيم الخصوصية
    postQuantumSafe:  boolean;
  };
}

// ================================================================
// ثوابت البروتوكولات
// ================================================================

const PROTOCOL_PARAMS: Record<QKDProtocol, {
  keyBits:      number;
  baseQBER:     number;
  qberThreshold: number;
  postQuantum:  boolean;
}> = {
  'BB84':            { keyBits:   256, baseQBER: 0.008, qberThreshold: 0.11, postQuantum: false },
  'E91':             { keyBits:   256, baseQBER: 0.012, qberThreshold: 0.07, postQuantum: false },
  'CRYSTALS-Kyber':  { keyBits:  3168, baseQBER: 0.000, qberThreshold: 0.00, postQuantum: true  },
  'McEliece':        { keyBits:  8192, baseQBER: 0.000, qberThreshold: 0.00, postQuantum: true  },
};

// ================================================================
// حساب أمان البروتوكول
// ================================================================

/**
 * نظرية Shannon–Pirandola لأمان QKD
 * المعدل الأمن = 1 - 2·H₂(QBER)
 * حيث H₂ هي الإنتروبيا الثنائية
 */
function computeSecureKeyRate(qber: number, rawKeyBitsPerSec = 1_000_000): number {
  if (qber >= 0.11) return 0; // فوق العتبة → لا أمان
  const siftingFactor = 0.5; // BB84: نحتفظ بـ 50% من البتات
  const errorCorrection = binaryEntropy(qber);
  const privacyAmplification = 1 - 2 * binaryEntropy(qber);

  return Math.max(0, rawKeyBitsPerSec * siftingFactor * (1 - errorCorrection - privacyAmplification));
}

// ================================================================
// استراتيجية التشفير الكمي
// ================================================================

export class AdvancedCryptoStrategy implements SimulationStrategy {
  readonly name = 'نظام التشفير الكمي المتقدم';
  readonly mode = 'cryptography' as const;

  private readonly protocol: QKDProtocol;

  constructor(protocol: QKDProtocol = 'BB84') {
    this.protocol = protocol;
  }

  async execute(input: SimulationInput): Promise<CryptoResult> {
    await new Promise(r => setTimeout(r, 25));

    const params = PROTOCOL_PARAMS[this.protocol];

    // إضافة ضجيج عشوائي ضمن حدود الأمان
    const qber = params.postQuantum ? 0 : Math.max(
      0,
      params.baseQBER + (Math.random() - 0.5) * 0.003
    );

    const isSecure     = qber < params.qberThreshold || params.postQuantum;
    const shannonEnt   = params.postQuantum ? 1.0 : 1 - binaryEntropy(qber);
    const mutualInfo   = params.postQuantum ? 0 : qber * 0.15; // تسرب معلومة حوّا
    const privacyAmp   = params.postQuantum ? 1.0 : 1 - 2 * binaryEntropy(qber);
    const secureRate   = params.postQuantum ? params.keyBits * 100 : computeSecureKeyRate(qber);

    const baseResult = calculateAlOtaibiUnified({
      ...input,
      fineTuning: isSecure ? 1.0 : 0.5,
    });

    return {
      ...baseResult,
      metadata: {
        protocol:         this.protocol,
        keyLengthBits:    params.keyBits,
        qber,
        secureKeyRate:    secureRate,
        isSecure,
        shannonEntropy:   Number(shannonEnt.toFixed(6)),
        mutualInfo:       Number(mutualInfo.toFixed(6)),
        privacyAmpFactor: Number(privacyAmp.toFixed(6)),
        postQuantumSafe:  params.postQuantum,
      },
    };
  }
}

// تسجيل الاستراتيجية
SimulationFactory.register(new AdvancedCryptoStrategy());
