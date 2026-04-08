/**
 * BB84Protocol — محاكي بروتوكول توزيع المفتاح الكمومي
 *
 * مستوحى من videlanicolas/QKD و aws-samples/sample-BB84-qkd-on-amazon-braket
 *
 * بروتوكول BB84 (Bennett-Brassard 1984):
 * - أليس ترسل كيوبتات مُرمّزة بقواعد عشوائية (Z أو X)
 * - بوب يقيس بقواعد عشوائية
 * - يقارنان القواعد عبر قناة كلاسيكية
 * - عند التطابق: البتات المتفق عليها تشكّل المفتاح السري
 * - وجود متنصت (حواء) يُكتشف عبر معدل خطأ الكم (QBER)
 *
 * الحد الأقصى الآمن لـ QBER = 11% (بعده يُلغى البروتوكول)
 */

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** القاعدة: Z (حسابية) أو X (هادامارد) */
export type Basis = 'Z' | 'X';

/** البت الكمومي */
export type QBit = 0 | 1;

/** خطوة واحدة في البروتوكول */
export interface BB84Step {
  /** رقم الخطوة */
  index: number;
  /** بت أليس الأصلي */
  aliceBit: QBit;
  /** قاعدة أليس */
  aliceBasis: Basis;
  /** قاعدة بوب */
  bobBasis: Basis;
  /** نتيجة قياس بوب */
  bobMeasurement: QBit;
  /** هل تطابقت القواعد؟ */
  basisMatch: boolean;
  /** هل تدخلت حواء في هذه الخطوة؟ */
  eveIntercepted: boolean;
  /** قاعدة حواء (إن وُجدت) */
  eveBasis?: Basis;
  /** قياس حواء (إن وُجدت) */
  eveMeasurement?: QBit;
}

/** نتيجة البروتوكول الكاملة */
export interface BB84Result {
  /** جميع الخطوات */
  steps: BB84Step[];
  /** المفتاح الأولي (قبل التصحيح) — بتات القواعد المتطابقة */
  siftedKeyAlice: QBit[];
  siftedKeyBob: QBit[];
  /** المفتاح النهائي */
  finalKey: QBit[];
  /** عدد البتات المرسلة */
  totalBits: number;
  /** عدد القواعد المتطابقة */
  matchedBases: number;
  /** معدل خطأ الكم (QBER) */
  qber: number;
  /** هل البروتوكول آمن؟ */
  isSecure: boolean;
  /** هل تم اكتشاف متنصت؟ */
  eavesdropperDetected: boolean;
  /** طول المفتاح النهائي */
  keyLength: number;
  /** عدد عينات الاختبار المستخدمة */
  testSampleSize: number;
  /** عدد الأخطاء في عينة الاختبار */
  testErrors: number;
  /** نسبة الكفاءة (بتات المفتاح / بتات مرسلة) */
  efficiency: number;
}

/** إعدادات المحاكاة */
export interface BB84Config {
  /** عدد البتات المرسلة */
  numBits: number;
  /** هل يوجد متنصت؟ */
  hasEavesdropper: boolean;
  /** نسبة عينة الاختبار (0-1) لاكتشاف التنصت */
  testSampleRatio: number;
  /** نسبة خطأ القناة (ضوضاء طبيعية) */
  channelErrorRate: number;
}

// ═══════════════════════════════════════════════════════════════
// الثوابت
// ═══════════════════════════════════════════════════════════════

/** حد QBER الآمن — أعلى من 11% = تنصت مؤكد */
const QBER_SECURITY_THRESHOLD = 0.11;

// ═══════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════

/** توليد بت عشوائي */
function randomBit(): QBit {
  return Math.random() < 0.5 ? 0 : 1;
}

/** اختيار قاعدة عشوائية */
function randomBasis(): Basis {
  return Math.random() < 0.5 ? 'Z' : 'X';
}

/**
 * محاكاة القياس الكمومي
 * إذا تطابقت القاعدة: النتيجة = البت الأصلي (حتمي)
 * إذا اختلفت القاعدة: النتيجة عشوائية (50/50)
 */
function quantumMeasure(bit: QBit, prepareBasis: Basis, measureBasis: Basis, errorRate: number): QBit {
  let result: QBit;

  if (prepareBasis === measureBasis) {
    // القواعد متطابقة — النتيجة حتمية
    result = bit;
  } else {
    // القواعد مختلفة — النتيجة عشوائية تماماً
    result = randomBit();
  }

  // إضافة ضوضاء القناة
  if (Math.random() < errorRate) {
    result = result === 0 ? 1 : 0;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// المحاكي الرئيسي
// ═══════════════════════════════════════════════════════════════

/**
 * تشغيل محاكاة بروتوكول BB84 الكاملة
 *
 * المراحل:
 * 1. أليس تُعدّ كيوبتات بقواعد وبتات عشوائية
 * 2. (اختياري) حواء تعترض وتقيس وتعيد الإرسال
 * 3. بوب يقيس بقواعد عشوائية
 * 4. مقارنة القواعد عبر قناة كلاسيكية (sifting)
 * 5. اختبار عينة لاكتشاف التنصت
 * 6. استخلاص المفتاح النهائي
 */
export function simulateBB84(config: BB84Config): BB84Result {
  const { numBits, hasEavesdropper, testSampleRatio, channelErrorRate } = config;

  if (numBits < 4) {
    throw new RangeError(`عدد البتات يجب أن يكون ≥ 4، القيمة: ${numBits}`);
  }
  if (testSampleRatio < 0 || testSampleRatio > 0.5) {
    throw new RangeError('نسبة عينة الاختبار يجب أن تكون بين 0 و 0.5');
  }

  const steps: BB84Step[] = [];

  // ─── المرحلة 1-3: الإرسال والقياس ───
  for (let i = 0; i < numBits; i++) {
    const aliceBit = randomBit();
    const aliceBasis = randomBasis();
    const bobBasis = randomBasis();

    let transmittedBit = aliceBit;
    let transmittedBasis = aliceBasis;
    let eveIntercepted = false;
    let eveBasis: Basis | undefined;
    let eveMeasurement: QBit | undefined;

    // حواء تعترض
    if (hasEavesdropper) {
      eveIntercepted = true;
      eveBasis = randomBasis();

      // حواء تقيس — هذا يُنهار الحالة الكمومية
      eveMeasurement = quantumMeasure(aliceBit, aliceBasis, eveBasis, 0);

      // حواء تعيد إرسال ما قاسته بقاعدتها
      transmittedBit = eveMeasurement;
      transmittedBasis = eveBasis;
    }

    // بوب يقيس
    const bobMeasurement = quantumMeasure(transmittedBit, transmittedBasis, bobBasis, channelErrorRate);

    const basisMatch = aliceBasis === bobBasis;

    steps.push({
      index: i,
      aliceBit,
      aliceBasis,
      bobBasis,
      bobMeasurement,
      basisMatch,
      eveIntercepted,
      eveBasis,
      eveMeasurement,
    });
  }

  // ─── المرحلة 4: غربلة القواعد (Sifting) ───
  const matchedSteps = steps.filter((s) => s.basisMatch);
  const siftedKeyAlice: QBit[] = matchedSteps.map((s) => s.aliceBit);
  const siftedKeyBob: QBit[] = matchedSteps.map((s) => s.bobMeasurement);

  // ─── المرحلة 5: اختبار عينة لاكتشاف التنصت ───
  const testSampleSize = Math.max(1, Math.floor(matchedSteps.length * testSampleRatio));
  let testErrors = 0;

  // نستخدم أول testSampleSize بتات للاختبار
  for (let i = 0; i < testSampleSize && i < siftedKeyAlice.length; i++) {
    if (siftedKeyAlice[i] !== siftedKeyBob[i]) {
      testErrors++;
    }
  }

  const qber = testSampleSize > 0 ? testErrors / testSampleSize : 0;
  const isSecure = qber < QBER_SECURITY_THRESHOLD;
  const eavesdropperDetected = qber >= QBER_SECURITY_THRESHOLD;

  // ─── المرحلة 6: استخلاص المفتاح النهائي ───
  // نستخدم البتات بعد عينة الاختبار كمفتاح (إذا كان آمناً)
  let finalKey: QBit[] = [];
  if (isSecure) {
    finalKey = siftedKeyAlice.slice(testSampleSize);
  }

  return {
    steps,
    siftedKeyAlice,
    siftedKeyBob,
    finalKey,
    totalBits: numBits,
    matchedBases: matchedSteps.length,
    qber,
    isSecure,
    eavesdropperDetected,
    keyLength: finalKey.length,
    testSampleSize,
    testErrors,
    efficiency: numBits > 0 ? finalKey.length / numBits : 0,
  };
}

/**
 * إنشاء تقرير نصي مفصل لنتائج BB84
 */
export function bb84Report(result: BB84Result): string {
  const lines: string[] = [];

  lines.push('╔══════════════════════════════════════════════╗');
  lines.push('║   تقرير بروتوكول BB84 — توزيع المفتاح الكمومي  ║');
  lines.push('╚══════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`📡 بتات مُرسلة: ${result.totalBits}`);
  lines.push(
    `🔀 قواعد متطابقة: ${result.matchedBases} (${((result.matchedBases / result.totalBits) * 100).toFixed(1)}%)`,
  );
  lines.push(`🧪 عينة الاختبار: ${result.testSampleSize} بت`);
  lines.push(`❌ أخطاء في العينة: ${result.testErrors}`);
  lines.push(`📊 معدل خطأ الكم (QBER): ${(result.qber * 100).toFixed(2)}%`);
  lines.push(`🔑 طول المفتاح النهائي: ${result.keyLength} بت`);
  lines.push(`⚡ الكفاءة: ${(result.efficiency * 100).toFixed(1)}%`);
  lines.push('');

  if (result.eavesdropperDetected) {
    lines.push('🚨 تحذير: تم اكتشاف متنصت! QBER أعلى من الحد الآمن (11%)');
    lines.push('⛔ البروتوكول غير آمن — المفتاح مُلغى');
  } else {
    lines.push('✅ البروتوكول آمن — لا يوجد دليل على التنصت');
    if (result.finalKey.length > 0) {
      lines.push(`🔐 المفتاح: ${result.finalKey.join('')}`);
    }
  }

  return lines.join('\n');
}

/**
 * حساب الإنتروبيا الثنائية — تُستخدم في حساب معدل المفتاح الآمن
 * H(p) = -p·log₂(p) - (1-p)·log₂(1-p)
 */
export function binaryEntropy(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

/**
 * معدل المفتاح الآمن (Secure Key Rate)
 * R = 1 - H(QBER) - H(QBER)
 * في غياب التنصت: R ≈ 1 (كل بتة مفيدة)
 * عند QBER = 11%: R ≈ 0 (لا مفتاح آمن)
 */
export function secureKeyRate(qber: number): number {
  if (qber >= QBER_SECURITY_THRESHOLD) return 0;
  return Math.max(0, 1 - 2 * binaryEntropy(qber));
}
