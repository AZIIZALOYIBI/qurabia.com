/**
 * Post-Quantum Cryptography Engine — محرك التشفير ما بعد الكمومي
 *
 * مستوحى من:
 * - pq-crystals/kyber (CRYSTALS-Kyber — اتفاقية المفاتيح القائمة على الشبكات)
 * - sz3/libmcleece (McEliece — التشفير القائم على الأكواد)
 * - aabmets/quantcrypt (quantcrypt — مكتبة Python متعددة المنصات)
 * - terra-quantum-public/tq42-pqc-oss (TQ42 PQC)
 *
 * التشفير ما بعد الكمومي (PQC) هو مجموعة من الخوارزميات المقاومة
 * لهجمات الحواسيب الكمومية (على عكس RSA و ECC التي تنهار أمام خوارزمية شور).
 *
 * الخوارزميات المدعومة (محاكاة):
 * 1. CRYSTALS-Kyber: تبادل المفاتيح القائم على مسألة LWE في الشبكات
 * 2. McEliece: تشفير قائم على نظرية الأكواد (Goppa codes)
 * 3. CRYSTALS-Dilithium: توقيع رقمي (اختياري)
 */

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** مستوى أمان Kyber */
export type KyberSecurityLevel = 512 | 768 | 1024;

/** نتيجة توليد المفتاح */
export interface PQCKeyPair {
  /** المفتاح العام (بايتات محاكاة) */
  publicKeySize: number;
  /** المفتاح الخاص (بايتات محاكاة) */
  privateKeySize: number;
  /** خوارزمية التوليد */
  algorithm: string;
  /** مستوى الأمان بالبتات */
  securityLevel: number;
  /** معلمات الشبكة (للعرض) */
  latticeParams?: KyberLatticeParams;
}

/** معلمات شبكة Kyber */
export interface KyberLatticeParams {
  /** البُعد k (عدد كتل المصفوفة) */
  k: number;
  /** معامل المعادل q = 3329 */
  q: number;
  /** معامل الضوضاء η1 */
  eta1: number;
  /** معامل الضوضاء η2 */
  eta2: number;
  /** معامل الضغط du */
  du: number;
  /** معامل الضغط dv */
  dv: number;
}

/** نتيجة تبادل المفتاح (KEM) */
export interface KEMResult {
  /** المفتاح المشترك (محاكاة) */
  sharedSecretSize: number;
  /** النص المشفّر (ciphertext) */
  ciphertextSize: number;
  /** هل نجح تبادل المفتاح؟ */
  success: boolean;
  /** وقت التنفيذ (مللي ثانية محاكاة) */
  executionTimeMs: number;
  /** مستوى الأمان المحقق */
  achievedSecurityBits: number;
}

/** نتيجة التشفير بـ McEliece */
export interface McElieceResult {
  /** حجم المفتاح العام (كيلوبايت) */
  publicKeySizeKB: number;
  /** حجم المفتاح الخاص (كيلوبايت) */
  privateKeySizeKB: number;
  /** حجم النص المشفر */
  ciphertextBytes: number;
  /** معدل الكود (code rate) */
  codeRate: number;
  /** قدرة تصحيح الأخطاء (t) */
  errorCorrectionCapacity: number;
  /** مستوى الأمان */
  securityBits: number;
}

/** نتيجة المقارنة بين خوارزميتين */
export interface PQCComparison {
  /** اسم الخوارزمية */
  algorithm: string;
  /** حجم المفتاح العام (بايت) */
  publicKeyBytes: number;
  /** حجم المفتاح الخاص (بايت) */
  privateKeyBytes: number;
  /** حجم النص المشفر (بايت) */
  ciphertextBytes: number;
  /** مستوى الأمان (بت) */
  securityBits: number;
  /** سرعة التوليد النسبية (1=مرجع) */
  keygenSpeed: number;
  /** سرعة التشفير النسبية */
  encapsSpeed: number;
  /** سرعة فك التشفير النسبية */
  decapsSpeed: number;
  /** مقاومة الكم */
  quantumResistant: boolean;
  /** نوع المسألة الرياضية */
  hardnessProblem: string;
}

/** نتائج تحليل شامل لـ PQC */
export interface PQCAnalysisResult {
  /** الخوارزمية المختارة */
  algorithm: 'kyber' | 'mceliece';
  /** زوج المفاتيح */
  keyPair: PQCKeyPair;
  /** نتيجة KEM (لـ Kyber) أو McEliece */
  kemResult?: KEMResult;
  mcElieceResult?: McElieceResult;
  /** المقارنة مع الخوارزميات الأخرى */
  comparison: PQCComparison[];
  /** توصية الاستخدام */
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════
// ثوابت Kyber (وفق معيار NIST)
// ═══════════════════════════════════════════════════════════════

/** معلمات Kyber لكل مستوى أمان */
const KYBER_PARAMS: Record<KyberSecurityLevel, KyberLatticeParams & {
  publicKeyBytes: number;
  privateKeyBytes: number;
  ciphertextBytes: number;
  sharedSecretBytes: number;
  securityBits: number;
}> = {
  512: {
    k: 2, q: 3329, eta1: 3, eta2: 2, du: 10, dv: 4,
    publicKeyBytes: 800, privateKeyBytes: 1632,
    ciphertextBytes: 768, sharedSecretBytes: 32,
    securityBits: 128,
  },
  768: {
    k: 3, q: 3329, eta1: 2, eta2: 2, du: 10, dv: 4,
    publicKeyBytes: 1184, privateKeyBytes: 2400,
    ciphertextBytes: 1088, sharedSecretBytes: 32,
    securityBits: 192,
  },
  1024: {
    k: 4, q: 3329, eta1: 2, eta2: 2, du: 11, dv: 5,
    publicKeyBytes: 1568, privateKeyBytes: 3168,
    ciphertextBytes: 1568, sharedSecretBytes: 32,
    securityBits: 256,
  },
};

// ═══════════════════════════════════════════════════════════════
// محاكاة توزيع ضوضاء Kyber (Centered Binomial Distribution)
// ═══════════════════════════════════════════════════════════════

/**
 * محاكاة معامل عشوائي من التوزيع المركزي ذي الحدين
 * CBD(η) — كما في مواصفة Kyber
 *
 * الفكرة: مجموع عينتين عشوائيتين ثنائيتين ناقص η
 * يُعطي توزيعاً منخفض الضوضاء حول الصفر
 */
function sampleCBD(eta: number): number {
  let sum = 0;
  for (let i = 0; i < eta; i++) {
    sum += (Math.random() < 0.5 ? 1 : 0) - (Math.random() < 0.5 ? 1 : 0);
  }
  return sum;
}

/**
 * محاكاة مصفوفة LWE (Learning With Errors)
 * A·s + e حيث A مصفوفة عامة، s متجه سري، e ضوضاء
 *
 * هذا هو جوهر أمان Kyber
 */
function simulateLWESecurity(k: number, eta1: number, q: number): {
  noiseVariance: number;
  securityMargin: number;
} {
  // محاكاة تباين الضوضاء
  const samples = Array.from({ length: 256 * k }, () => sampleCBD(eta1));
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((sum, s) => sum + (s - mean) ** 2, 0) / samples.length;

  // هامش الأمان = q / (2 * σ_noise * √(n * k))
  const securityMargin = q / (2 * Math.sqrt(variance) * Math.sqrt(256 * k));

  return { noiseVariance: variance, securityMargin };
}

// ═══════════════════════════════════════════════════════════════
// محرك CRYSTALS-Kyber
// ═══════════════════════════════════════════════════════════════

export class KyberEngine {
  private securityLevel: KyberSecurityLevel;
  private params: typeof KYBER_PARAMS[KyberSecurityLevel];

  constructor(securityLevel: KyberSecurityLevel = 768) {
    this.securityLevel = securityLevel;
    this.params = KYBER_PARAMS[securityLevel];
  }

  /**
   * توليد زوج المفاتيح (KeyGen)
   * مستوحى من pq-crystals/kyber
   *
   * الخوارزمية:
   * 1. توليد مصفوفة A عشوائية في Zq^{k×k}
   * 2. أخذ عينة s و e من CBD(η1)
   * 3. حساب t = A·s + e (المفتاح العام)
   * 4. المفتاح الخاص = (s, t)
   */
  generateKeyPair(): PQCKeyPair {
    const { k, q, eta1 } = this.params;

    // محاكاة جودة المفتاح
    const { noiseVariance, securityMargin } = simulateLWESecurity(k, eta1, q);

    return {
      publicKeySize: this.params.publicKeyBytes,
      privateKeySize: this.params.privateKeyBytes,
      algorithm: `CRYSTALS-Kyber${this.securityLevel}`,
      securityLevel: this.params.securityBits,
      latticeParams: {
        k: this.params.k,
        q: this.params.q,
        eta1: this.params.eta1,
        eta2: this.params.eta2,
        du: this.params.du,
        dv: this.params.dv,
      },
    };
  }

  /**
   * تغليف المفتاح (Encapsulation — KEM)
   * مستوحى من pq-crystals/kyber — kyber.c
   *
   * الخوارزمية:
   * 1. توليد رسالة عشوائية m ∈ {0,1}^256
   * 2. حساب (K, r) = G(m || H(pk))
   * 3. تشفير m باستخدام pk و r لإنتاج النص المشفر c
   * 4. تشفير K بـ KDF لإنتاج المفتاح المشترك
   */
  encapsulate(): KEMResult {
    const startTime = performance.now();

    // محاكاة تكاليف الحساب
    const computeOps = this.params.k * 256 * Math.log2(this.params.q);
    const simulatedMs = computeOps / 10000 + Math.random() * 0.5;

    const endTime = startTime + simulatedMs;

    return {
      sharedSecretSize: this.params.sharedSecretBytes,
      ciphertextSize: this.params.ciphertextBytes,
      success: true,
      executionTimeMs: simulatedMs,
      achievedSecurityBits: this.params.securityBits,
    };
  }

  /**
   * فك تغليف المفتاح (Decapsulation)
   * يُستخدم المفتاح الخاص لاستعادة المفتاح المشترك من النص المشفر
   */
  decapsulate(): { success: boolean; executionTimeMs: number } {
    const computeOps = this.params.k * 256 * Math.log2(this.params.q) * 1.2;
    const simulatedMs = computeOps / 10000 + Math.random() * 0.3;

    return {
      success: Math.random() > 0.0001, // معدل فشل منخفض جداً
      executionTimeMs: simulatedMs,
    };
  }

  getSecurityLevel(): KyberSecurityLevel {
    return this.securityLevel;
  }
}

// ═══════════════════════════════════════════════════════════════
// محرك McEliece (التشفير القائم على الأكواد)
// ═══════════════════════════════════════════════════════════════

/** معلمات McEliece الكلاسيكية */
const MCELIECE_PARAMS = {
  348864: {
    n: 3488, k: 2720, t: 64,
    publicKeyKB: 261, privateKeyKB: 6.5,
    ciphertextBytes: 128, securityBits: 128,
  },
  460896: {
    n: 4608, k: 3360, t: 96,
    publicKeyKB: 524, privateKeyKB: 13.6,
    ciphertextBytes: 188, securityBits: 192,
  },
  6688128: {
    n: 6688, k: 5024, t: 128,
    publicKeyKB: 1044, privateKeyKB: 13.9,
    ciphertextBytes: 208, securityBits: 256,
  },
} as const;

export class McElieceEngine {
  private variant: keyof typeof MCELIECE_PARAMS;

  constructor(variant: keyof typeof MCELIECE_PARAMS = 348864) {
    this.variant = variant;
  }

  /**
   * توليد مفتاح McEliece
   * يستند إلى أكواد Goppa — مسألة فك التشفير العام NP-Hard
   *
   * مستوحى من sz3/libmcleece
   */
  generateKeyPair(): McElieceResult {
    const p = MCELIECE_PARAMS[this.variant];
    const codeRate = p.k / p.n;

    return {
      publicKeySizeKB: p.publicKeyKB,
      privateKeySizeKB: p.privateKeyKB,
      ciphertextBytes: p.ciphertextBytes,
      codeRate,
      errorCorrectionCapacity: p.t,
      securityBits: p.securityBits,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// مقارنة الخوارزميات
// ═══════════════════════════════════════════════════════════════

/**
 * جدول مقارنة شامل بين خوارزميات PQC والتشفير الكلاسيكي
 * مستوحى من NIST PQC Standardization Round 3 Results
 */
export function comparePQCAlgorithms(): PQCComparison[] {
  return [
    {
      algorithm: 'RSA-2048',
      publicKeyBytes: 256,
      privateKeyBytes: 2048,
      ciphertextBytes: 256,
      securityBits: 112,
      keygenSpeed: 1.0,
      encapsSpeed: 1.0,
      decapsSpeed: 1.0,
      quantumResistant: false,
      hardnessProblem: 'Integer Factorization',
    },
    {
      algorithm: 'Kyber-512',
      publicKeyBytes: 800,
      privateKeyBytes: 1632,
      ciphertextBytes: 768,
      securityBits: 128,
      keygenSpeed: 18.5,
      encapsSpeed: 17.2,
      decapsSpeed: 16.8,
      quantumResistant: true,
      hardnessProblem: 'Module-LWE (Lattice)',
    },
    {
      algorithm: 'Kyber-768',
      publicKeyBytes: 1184,
      privateKeyBytes: 2400,
      ciphertextBytes: 1088,
      securityBits: 192,
      keygenSpeed: 13.1,
      encapsSpeed: 12.4,
      decapsSpeed: 12.0,
      quantumResistant: true,
      hardnessProblem: 'Module-LWE (Lattice)',
    },
    {
      algorithm: 'Kyber-1024',
      publicKeyBytes: 1568,
      privateKeyBytes: 3168,
      ciphertextBytes: 1568,
      securityBits: 256,
      keygenSpeed: 9.8,
      encapsSpeed: 9.1,
      decapsSpeed: 8.9,
      quantumResistant: true,
      hardnessProblem: 'Module-LWE (Lattice)',
    },
    {
      algorithm: 'McEliece-348864',
      publicKeyBytes: 261120,
      privateKeyBytes: 6492,
      ciphertextBytes: 128,
      securityBits: 128,
      keygenSpeed: 0.8,
      encapsSpeed: 22.0,
      decapsSpeed: 19.5,
      quantumResistant: true,
      hardnessProblem: 'Decoding Linear Codes (NP-Hard)',
    },
    {
      algorithm: 'NTRU-HPS2048509',
      publicKeyBytes: 699,
      privateKeyBytes: 935,
      ciphertextBytes: 699,
      securityBits: 128,
      keygenSpeed: 6.5,
      encapsSpeed: 8.3,
      decapsSpeed: 7.9,
      quantumResistant: true,
      hardnessProblem: 'NTRU Problem (Ring-LWE variant)',
    },
    {
      algorithm: 'BIKE-L1',
      publicKeyBytes: 1541,
      privateKeyBytes: 3110,
      ciphertextBytes: 1573,
      securityBits: 128,
      keygenSpeed: 3.2,
      encapsSpeed: 4.1,
      decapsSpeed: 3.8,
      quantumResistant: true,
      hardnessProblem: 'Quasi-Cyclic Syndrome Decoding',
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// التحليل الشامل
// ═══════════════════════════════════════════════════════════════

/**
 * تشغيل تحليل PQC شامل
 * يدمج بين Kyber و McEliece مع مقارنة كاملة
 */
export function runPQCAnalysis(
  algorithm: 'kyber' | 'mceliece',
  kyberLevel: KyberSecurityLevel = 768,
): PQCAnalysisResult {
  const comparison = comparePQCAlgorithms();

  if (algorithm === 'kyber') {
    const engine = new KyberEngine(kyberLevel);
    const keyPair = engine.generateKeyPair();
    const kemResult = engine.encapsulate();

    const recommendations: Record<KyberSecurityLevel, string> = {
      512: 'مناسب للتطبيقات ذات الحساسية المنخفضة (IoT، أجهزة محدودة). يعادل AES-128.',
      768: 'الخيار الموصى به للاستخدام العام. أعتمده NIST كمعيار. يعادل AES-192.',
      1024: 'للتطبيقات عالية الحساسية والبيانات طويلة الأمد. يعادل AES-256.',
    };

    return {
      algorithm: 'kyber',
      keyPair,
      kemResult,
      comparison,
      recommendation: recommendations[kyberLevel],
    };
  } else {
    const engine = new McElieceEngine(348864);
    const mcElieceResult = engine.generateKeyPair();

    const keyPair: PQCKeyPair = {
      publicKeySize: Math.round(mcElieceResult.publicKeySizeKB * 1024),
      privateKeySize: Math.round(mcElieceResult.privateKeySizeKB * 1024),
      algorithm: 'Classic McEliece-348864',
      securityLevel: mcElieceResult.securityBits,
    };

    return {
      algorithm: 'mceliece',
      keyPair,
      mcElieceResult,
      comparison,
      recommendation:
        'McEliece هو الأقدم والأكثر ثقةً (منذ 1978). عيبه الرئيسي: حجم المفتاح العام الضخم. ' +
        'الأفضل للتطبيقات التي تُولي الأمان على حساب الحجم.',
    };
  }
}

/**
 * تقرير موجز عن قوة التشفير
 * مستوحى من quantcrypt — security_strength()
 */
export function securityStrengthReport(securityBits: number): {
  level: 'low' | 'medium' | 'high' | 'maximum';
  label: string;
  description: string;
  yearsToBreak: string;
} {
  if (securityBits < 128) {
    return {
      level: 'low',
      label: 'منخفض',
      description: 'غير كافٍ للاستخدام الحالي',
      yearsToBreak: '< 1 سنة بحاسوب كمومي',
    };
  } else if (securityBits < 192) {
    return {
      level: 'medium',
      label: 'متوسط',
      description: 'مناسب للتطبيقات العامة حتى 2030+',
      yearsToBreak: '> 10,000 سنة بحاسوب كمومي',
    };
  } else if (securityBits < 256) {
    return {
      level: 'high',
      label: 'عالٍ',
      description: 'يُعادل AES-192، مناسب للبيانات الحساسة',
      yearsToBreak: '> 10^30 سنة',
    };
  } else {
    return {
      level: 'maximum',
      label: 'أقصى درجة',
      description: 'يُعادل AES-256، للبيانات الحساسة للغاية',
      yearsToBreak: '> 10^57 سنة (غير قابل للكسر عملياً)',
    };
  }
}
