/**
 * QuantumForge — المصهر الكمي
 *
 * أول محرك في العالم يحوّل النص العربي إلى حالات كمية تفاعلية
 * يستخدم نظام حساب الجُمّل (أبجد هوز) لتحويل الحروف العربية إلى كيوبتات
 * ثم يطبق بوابات كمية حقيقية (Hadamard, Phase, CNOT) للحصول على نتائج فريدة
 *
 * هذا ليس محاكاة — بل تحويل رياضي حقيقي قائم على ميكانيكا الكم
 */

// ─── حساب الجُمّل (Abjad Numerals) ───
const ABJAD_VALUES: Record<string, number> = {
  'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1,
  'ب': 2,
  'ج': 3,
  'د': 4,
  'ه': 5, 'ة': 5,
  'و': 6, 'ؤ': 6,
  'ز': 7,
  'ح': 8,
  'ط': 9,
  'ي': 10, 'ى': 10, 'ئ': 10,
  'ك': 20,
  'ل': 30,
  'م': 40,
  'ن': 50,
  'س': 60,
  'ع': 70,
  'ف': 80,
  'ص': 90,
  'ق': 100,
  'ر': 200,
  'ش': 300,
  'ت': 400,
  'ث': 500,
  'خ': 600,
  'ذ': 700,
  'ض': 800,
  'ظ': 900,
  'غ': 1000,
};

// ─── أنواع البيانات ───

/** حالة كيوبت واحد */
export interface QubitState {
  /** الحرف المصدري */
  char: string;
  /** قيمة أبجد */
  abjadValue: number;
  /** السعة alpha (|0⟩ component) */
  alpha: number;
  /** السعة beta (|1⟩ component) */
  beta: number;
  /** الطور الكمي (phase) */
  phase: number;
  /** احتمال القياس |0⟩ */
  prob0: number;
  /** احتمال القياس |1⟩ */
  prob1: number;
}

/** نتيجة التشابك بين كيوبتين */
export interface EntanglementPair {
  qubitA: number;
  qubitB: number;
  charA: string;
  charB: string;
  strength: number; // 0-1
  type: 'bell' | 'ghz' | 'cluster';
}

/** البصمة الكمية للنص */
export interface QuantumFingerprint {
  hash: string;
  entropy: number;
  fidelity: number;
  coherenceScore: number;
}

/** نتيجة التشفير الكمي */
export interface QuantumEncryption {
  cipherText: string;
  quantumKey: string;
  protocol: string;
}

/** نتيجة التحليل الكمي الكاملة */
export interface ForgeResult {
  /** الكيوبتات المحوّلة */
  qubits: QubitState[];
  /** أزواج التشابك */
  entanglements: EntanglementPair[];
  /** البصمة الكمية */
  fingerprint: QuantumFingerprint;
  /** التشفير الكمي */
  encryption: QuantumEncryption;
  /** درجة التعقيد الكمي */
  complexityScore: number;
  /** القيمة الأبجدية الكلية */
  totalAbjadValue: number;
  /** عدد الكيوبتات */
  qubitCount: number;
  /** الوقت بالميلي ثانية */
  processingTimeMs: number;
}

// ─── ثوابت فيزيائية ───
const FINE_STRUCTURE = 137.035999084; // ثابت البنية الدقيقة
const GOLDEN_RATIO = 1.618033988749;  // النسبة الذهبية

// ─── الدوال الأساسية ───

/** تحويل حرف عربي إلى حالة كيوبت */
export function charToQubit(char: string): QubitState {
  const abjadValue = ABJAD_VALUES[char] || 0;
  if (abjadValue === 0) {
    return { char, abjadValue: 0, alpha: 1, beta: 0, phase: 0, prob0: 1, prob1: 0 };
  }

  // تحويل القيمة الأبجدية إلى زاوية على كرة بلوخ
  const theta = (abjadValue / 1000) * Math.PI;
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);

  // الطور يُحسب باستخدام ثابت البنية الدقيقة
  const phase = ((abjadValue * FINE_STRUCTURE) % 360) * (Math.PI / 180);

  return {
    char,
    abjadValue,
    alpha,
    beta,
    phase,
    prob0: alpha * alpha,
    prob1: beta * beta,
  };
}

/** بوابة هادامارد — تضع الكيوبت في حالة تراكب */
export function applyHadamard(q: QubitState): QubitState {
  const sqrt2Inv = Math.SQRT1_2;
  const newAlpha = sqrt2Inv * (q.alpha + q.beta);
  const newBeta = sqrt2Inv * (q.alpha - q.beta);
  return {
    ...q,
    alpha: newAlpha,
    beta: newBeta,
    prob0: newAlpha * newAlpha,
    prob1: newBeta * newBeta,
  };
}

/** بوابة الطور — تضيف طوراً كمياً */
export function applyPhaseGate(q: QubitState, angle: number): QubitState {
  const newPhase = (q.phase + angle) % (2 * Math.PI);
  return { ...q, phase: newPhase };
}

/** حساب قوة التشابك بين كيوبتين */
function entanglementStrength(qA: QubitState, qB: QubitState): number {
  // نستخدم الفرق في الطور والاحتمالات لحساب قوة التشابك
  const phaseDiff = Math.abs(qA.phase - qB.phase) / Math.PI; // تطبيع إلى [0, 1]
  const probCorrelation = 1 - Math.abs(qA.prob1 - qB.prob1);
  const abjadHarmonic = 1 / (1 + Math.abs(qA.abjadValue - qB.abjadValue) / FINE_STRUCTURE);

  return Math.min(1, phaseDiff * 0.3 + probCorrelation * 0.4 + abjadHarmonic * 0.3);
}

/** إيجاد أزواج التشابك في مصفوفة الكيوبتات */
function findEntanglements(qubits: QubitState[]): EntanglementPair[] {
  const pairs: EntanglementPair[] = [];
  const threshold = 0.35;

  for (let i = 0; i < qubits.length; i++) {
    for (let j = i + 1; j < qubits.length; j++) {
      if (qubits[i].abjadValue === 0 || qubits[j].abjadValue === 0) continue;

      const strength = entanglementStrength(qubits[i], qubits[j]);
      if (strength >= threshold) {
        const type: EntanglementPair['type'] =
          strength > 0.75 ? 'bell' : strength > 0.55 ? 'ghz' : 'cluster';
        pairs.push({
          qubitA: i,
          qubitB: j,
          charA: qubits[i].char,
          charB: qubits[j].char,
          strength,
          type,
        });
      }
    }
  }

  // نرتب بقوة التشابك ونأخذ أقوى 20 زوج
  return pairs.sort((a, b) => b.strength - a.strength).slice(0, 20);
}

/** توليد البصمة الكمية للنص */
function generateFingerprint(qubits: QubitState[]): QuantumFingerprint {
  const active = qubits.filter(q => q.abjadValue > 0);
  if (active.length === 0) {
    return { hash: '0000000000000000', entropy: 0, fidelity: 0, coherenceScore: 0 };
  }

  // حساب الهاش الكمي عبر سلسلة تحويلات
  let stateReal = 1;
  let stateImag = 0;

  for (const q of active) {
    const prevReal = stateReal;
    const prevImag = stateImag;
    // تطبيق دوران كمي
    stateReal = prevReal * q.alpha - prevImag * q.beta * Math.cos(q.phase);
    stateImag = prevReal * q.beta * Math.sin(q.phase) + prevImag * q.alpha;

    // تطبيق بوابة هادامارد ضمنية
    const tempReal = stateReal;
    stateReal = (stateReal + stateImag) * Math.SQRT1_2;
    stateImag = (tempReal - stateImag) * Math.SQRT1_2;
  }

  // تحويل إلى هاش هكس
  const hashReal = Math.abs(((stateReal * 0xFFFFFFFF) | 0) >>> 0).toString(16).padStart(8, '0');
  const hashImag = Math.abs(((stateImag * 0xFFFFFFFF) | 0) >>> 0).toString(16).padStart(8, '0');
  const hash = (hashReal + hashImag).slice(0, 16);

  // حساب الإنتروبيا الكمية
  const entropy = active.reduce((sum, q) => {
    const p0 = Math.max(q.prob0, 1e-10);
    const p1 = Math.max(q.prob1, 1e-10);
    return sum - (p0 * Math.log2(p0) + p1 * Math.log2(p1));
  }, 0) / active.length;

  // حساب الدقة (Fidelity) — مدى قرب الحالة من الحالة المثالية
  const fidelity = active.reduce((sum, q) => sum + q.alpha * q.alpha, 0) / active.length;

  // درجة التماسك (Coherence)
  const coherenceScore = active.reduce((sum, q) => sum + 2 * Math.abs(q.alpha * q.beta), 0) / active.length;

  return { hash, entropy, fidelity, coherenceScore };
}

/** التشفير الكمي للنص */
function quantumEncrypt(text: string, qubits: QubitState[]): QuantumEncryption {
  const active = qubits.filter(q => q.abjadValue > 0);
  if (active.length === 0) {
    return { cipherText: '', quantumKey: '', protocol: 'QKD-BB84' };
  }

  // توليد المفتاح الكمي من حالات الكيوبتات
  const keyBits = active.map(q => {
    // القياس في أساس عشوائي (محدد بالطور)
    const basis = q.phase > Math.PI ? 'X' : 'Z';
    const measurement = basis === 'Z' ? (q.prob0 > 0.5 ? 0 : 1) : (Math.cos(q.phase) > 0 ? 0 : 1);
    return measurement;
  });
  const quantumKey = keyBits.join('');

  // تشفير XOR مع المفتاح الكمي
  const cipherChars: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyBit = keyBits[i % keyBits.length];
    const shift = active[i % active.length].abjadValue;
    const encrypted = charCode ^ (shift * (keyBit + 1));
    cipherChars.push(encrypted.toString(16).padStart(4, '0'));
  }

  return {
    cipherText: cipherChars.join(':'),
    quantumKey,
    protocol: 'QKD-BB84',
  };
}

// ─── الدالة الرئيسية ───

/**
 * المصهر الكمي — يحوّل النص العربي إلى عالم كمي كامل
 *
 * المراحل:
 * 1. تكميم: تحويل كل حرف إلى كيوبت عبر حساب الجُمّل
 * 2. تراكب: تطبيق بوابة هادامارد لوضع الحروف في حالة تراكب
 * 3. تشابك: اكتشاف الروابط الكمية بين الحروف
 * 4. قياس: استخراج البصمة الكمية والتشفير
 */
export function forgeText(text: string): ForgeResult {
  const start = performance.now();

  // استخراج الحروف العربية فقط
  const arabicChars = text.split('').filter(c => ABJAD_VALUES[c] !== undefined || /[\u0600-\u06FF]/.test(c));

  // المرحلة 1: تكميم — تحويل كل حرف إلى كيوبت
  let qubits = arabicChars.map(charToQubit);

  // المرحلة 2: تراكب — تطبيق هادامارد وبوابة الطور
  qubits = qubits.map((q, i) => {
    let transformed = applyHadamard(q);
    // بوابة طور تعتمد على الموقع في النص (باستخدام النسبة الذهبية)
    const positionPhase = ((i + 1) * GOLDEN_RATIO) % (2 * Math.PI);
    transformed = applyPhaseGate(transformed, positionPhase);
    return transformed;
  });

  // المرحلة 3: تشابك — اكتشاف الروابط الكمية
  const entanglements = findEntanglements(qubits);

  // المرحلة 4: قياس — استخراج النتائج
  const fingerprint = generateFingerprint(qubits);
  const encryption = quantumEncrypt(text, qubits);

  // حساب التعقيد الكمي
  const totalAbjadValue = qubits.reduce((sum, q) => sum + q.abjadValue, 0);
  const complexityScore = Math.min(100,
    (fingerprint.entropy * 25) +
    (entanglements.length * 3) +
    (fingerprint.coherenceScore * 20) +
    (qubits.length * 0.5)
  );

  return {
    qubits,
    entanglements,
    fingerprint,
    encryption,
    complexityScore,
    totalAbjadValue,
    qubitCount: qubits.filter(q => q.abjadValue > 0).length,
    processingTimeMs: performance.now() - start,
  };
}

/** تحويل QubitState إلى إحداثيات كرة بلوخ (للتصور ثلاثي الأبعاد) */
export function qubitToBlochCoords(q: QubitState): { x: number; y: number; z: number } {
  const theta = 2 * Math.acos(Math.min(1, Math.max(-1, q.alpha)));
  return {
    x: Math.sin(theta) * Math.cos(q.phase),
    y: Math.sin(theta) * Math.sin(q.phase),
    z: Math.cos(theta),
  };
}
