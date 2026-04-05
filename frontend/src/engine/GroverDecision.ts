/**
 * GroverDecision — محلل القرارات الكمومي
 *
 * يطبّق خوارزمية Grover المبسّطة على تحليل القرارات بالعربية.
 * الفكرة: كل خيار في القرار = حالة كمومية، والتحليل اللغوي يحدد
 * "أوراكل" القرار الذي يُعزز الحلول المثلى.
 *
 * المراحل:
 * 1. استخراج الخيارات من السؤال العربي
 * 2. تحليل كل خيار لغوياً وحساب "الوزن الدلالي"
 * 3. بناء مساحة حلول كمومية
 * 4. تطبيق تكرارات Grover (amplification) بناءً على الأوزان
 * 5. عرض توزيع الاحتمالات والتوصيات
 */

import { analyzeWord, type MorphAnalysis, type SemanticField, SEMANTIC_FIELD_NAMES } from './ArabicMorphology';

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** خيار واحد في القرار */
export interface DecisionOption {
  /** النص الأصلي للخيار */
  text: string;
  /** الكلمات المحللة */
  analyzedWords: MorphAnalysis[];
  /** الوزن الدلالي (0-1) */
  semanticWeight: number;
  /** الاحتمال قبل Grover */
  initialProbability: number;
  /** الاحتمال بعد Grover (المعزّز) */
  amplifiedProbability: number;
  /** الحقول الدلالية المهيمنة */
  dominantFields: SemanticField[];
  /** درجة الإيجابية (0-1) */
  positivityScore: number;
  /** درجة العملية (0-1) */
  practicalityScore: number;
  /** درجة الثقة (0-1) */
  confidenceScore: number;
}

/** نتيجة تحليل القرار */
export interface DecisionResult {
  /** السؤال الأصلي */
  question: string;
  /** الخيارات المحللة */
  options: DecisionOption[];
  /** الخيار المُوصى به (فهرس) */
  recommendedIndex: number;
  /** عدد تكرارات Grover المُطبّقة */
  groverIterations: number;
  /** حجم مساحة البحث */
  searchSpaceSize: number;
  /** درجة وضوح القرار (0-1): كلما زادت كان القرار أوضح */
  decisionClarity: number;
  /** نص التوصية بالعربية */
  recommendation: string;
  /** التحليل المفصّل */
  detailedAnalysis: string;
  /** زمن المعالجة */
  processingTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════
// كلمات مفتاحية للتحليل
// ═══════════════════════════════════════════════════════════════

/** كلمات إيجابية */
const POSITIVE_WORDS = new Set([
  'نجاح', 'ربح', 'تقدم', 'نمو', 'تطور', 'ازدهار', 'حرية', 'إبداع', 'ابتكار',
  'أمان', 'سعادة', 'فرح', 'قوة', 'عدل', 'حكمة', 'علم', 'نور', 'أمل', 'حب',
  'جمال', 'صحة', 'سلام', 'رخاء', 'تعاون', 'وحدة', 'انجاز', 'تميز', 'جودة',
  'مطعم', 'متجر', 'مشروع', 'شركة', 'عمل', 'تجارة', 'استثمار', 'دخل',
]);

/** كلمات سلبية */
const NEGATIVE_WORDS = new Set([
  'خسارة', 'فشل', 'خطر', 'مخاطرة', 'ضرر', 'خوف', 'قلق', 'صعوبة', 'مشكلة',
  'أزمة', 'حرب', 'فقر', 'مرض', 'موت', 'ظلم', 'جهل', 'ضعف', 'تراجع', 'انحدار',
]);

/** كلمات عملية (تدل على قابلية التنفيذ) */
const PRACTICAL_WORDS = new Set([
  'مشروع', 'خطة', 'تنفيذ', 'بناء', 'إنشاء', 'تأسيس', 'إطلاق', 'تطوير',
  'متجر', 'مطعم', 'شركة', 'موقع', 'تطبيق', 'منتج', 'خدمة', 'سوق',
  'الكتروني', 'رقمي', 'تقني', 'عملي', 'واقعي', 'ملموس', 'محدد',
  'استثمار', 'تجارة', 'صناعة', 'زراعة', 'تعليم', 'برمجة',
]);

/** أنماط استخراج الخيارات */
const OPTION_SEPARATORS = /\s+(?:أو|أم|ولا|أو أن|أم أن|أو أنني|مقابل|بدلاً من|عوضاً عن|أو بدلاً)\s+/;
const QUESTION_PREFIX = /^(?:هل\s+|ما\s+|أي\s+|أيهما\s+|أيها\s+|ماذا\s+|كيف\s+|لماذا\s+|متى\s+|أين\s+)/;

// ═══════════════════════════════════════════════════════════════
// محرك التحليل
// ═══════════════════════════════════════════════════════════════

/**
 * استخراج الخيارات من سؤال عربي
 * يدعم أنماط مثل:
 * - "هل أفتح مطعم أو متجر إلكتروني؟"
 * - "أيهما أفضل: البرمجة أم التصميم؟"
 * - "مشروع مطعم أم مشروع متجر؟"
 */
export function extractOptions(question: string): string[] {
  // تنظيف السؤال
  let cleaned = question
    .replace(/[؟?!.،,]/g, '')
    .replace(QUESTION_PREFIX, '')
    .trim();

  // محاولة التقسيم بالفواصل
  const parts = cleaned.split(OPTION_SEPARATORS).map(s => s.trim()).filter(s => s.length > 0);

  if (parts.length >= 2) return parts;

  // محاولة التقسيم بالنقطتين
  if (cleaned.includes(':') || cleaned.includes('：')) {
    const colonParts = cleaned.split(/[:：]/).map(s => s.trim()).filter(s => s.length > 0);
    if (colonParts.length >= 2) {
      // الجزء بعد النقطتين قد يحتوي على خيارات
      const afterColon = colonParts.slice(1).join(' ');
      const subParts = afterColon.split(OPTION_SEPARATORS).map(s => s.trim()).filter(s => s.length > 0);
      if (subParts.length >= 2) return subParts;
    }
  }

  // إذا لم نجد خيارات واضحة، نقسم بالمسافات إلى مجموعتين
  const words = cleaned.split(/\s+/);
  if (words.length >= 4) {
    const mid = Math.floor(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  // خيار واحد فقط
  return [cleaned];
}

/** حساب الوزن الدلالي لخيار */
function computeSemanticWeight(words: MorphAnalysis[]): number {
  if (words.length === 0) return 0;

  const validWords = words.filter(w => w.confidence > 0);
  if (validWords.length === 0) return 0.3;

  // عوامل الوزن:
  // 1. متوسط الثقة في التحليل
  const avgConfidence = validWords.reduce((s, w) => s + w.confidence, 0) / validWords.length;

  // 2. تنوع الحقول الدلالية (أكثر تنوعاً = أغنى معنى)
  const fields = new Set(validWords.map(w => w.semanticField).filter(f => f !== 'unknown'));
  const fieldDiversity = Math.min(fields.size / 3, 1);

  // 3. وجود مشتقات (يدل على غنى لغوي)
  const avgDerivatives = validWords.reduce((s, w) => s + w.superpositionStates.length, 0) / validWords.length;
  const derivativeRichness = Math.min(avgDerivatives / 5, 1);

  return avgConfidence * 0.4 + fieldDiversity * 0.3 + derivativeRichness * 0.3;
}

/** حساب درجة الإيجابية */
function computePositivity(words: MorphAnalysis[], originalText: string): number {
  const textWords = originalText.split(/\s+/);
  let positive = 0;
  let negative = 0;

  for (const w of textWords) {
    const clean = w.replace(/[^\u0600-\u06FF]/g, '');
    if (POSITIVE_WORDS.has(clean)) positive++;
    if (NEGATIVE_WORDS.has(clean)) negative++;
  }

  // أيضاً تحقق من الجذور
  for (const w of words) {
    if (w.semanticField === 'emotion') {
      // كلمات العاطفة: تحقق إيجابي/سلبي
      if (['حبب', 'فرح', 'رجو'].includes(w.root)) positive++;
      if (['حزن', 'خوف'].includes(w.root)) negative++;
    }
  }

  const total = positive + negative;
  if (total === 0) return 0.5; // محايد
  return positive / total;
}

/** حساب درجة العملية */
function computePracticality(originalText: string): number {
  const textWords = originalText.split(/\s+/);
  let practical = 0;

  for (const w of textWords) {
    const clean = w.replace(/[^\u0600-\u06FF]/g, '');
    if (PRACTICAL_WORDS.has(clean)) practical++;
  }

  return Math.min(practical / Math.max(textWords.length * 0.3, 1), 1);
}

/**
 * تطبيق خوارزمية Grover المبسطة
 *
 * في خوارزمية Grover الأصلية، "الأوراكل" يعكس طور الحالة المطلوبة.
 * هنا، "الأوراكل" هو التحليل اللغوي — الخيار الأغنى دلالياً وإيجابياً يُعزَّز.
 *
 * الخطوات:
 * 1. البداية: توزيع متساوٍ (تراكب)
 * 2. تطبيق الأوراكل (عكس طور الأفضل)
 * 3. تطبيق الانتشار (diffusion) لتعزيز الاحتمال
 * 4. تكرار √N مرات
 */
function applyGroverAmplification(options: DecisionOption[]): { iterations: number } {
  const n = options.length;
  if (n <= 1) {
    if (n === 1) options[0].amplifiedProbability = 1;
    return { iterations: 0 };
  }

  // عدد التكرارات المثالي ≈ π/4 × √N
  const optimalIterations = Math.max(1, Math.round(Math.PI / 4 * Math.sqrt(n)));

  // حساب الدرجة المركّبة لكل خيار
  const scores = options.map(opt =>
    opt.semanticWeight * 0.3 +
    opt.positivityScore * 0.25 +
    opt.practicalityScore * 0.25 +
    opt.confidenceScore * 0.2
  );

  // التطبيع
  const totalScore = scores.reduce((s, v) => s + v, 0);
  const normalizedScores = totalScore > 0
    ? scores.map(s => s / totalScore)
    : scores.map(() => 1 / n);

  // تطبيق Grover: تعزيز الخيارات بناءً على درجاتها
  let amplitudes = normalizedScores.map(s => Math.sqrt(s));

  for (let iter = 0; iter < optimalIterations; iter++) {
    // الخطوة 1: الأوراكل — عكس طور الخيار الأفضل
    const maxIdx = amplitudes.indexOf(Math.max(...amplitudes));
    amplitudes[maxIdx] = -amplitudes[maxIdx]; // عكس الطور

    // الخطوة 2: الانتشار — 2|ψ⟩⟨ψ| - I
    const mean = amplitudes.reduce((s, a) => s + a, 0) / n;
    amplitudes = amplitudes.map(a => 2 * mean - a);
  }

  // تحويل السعات إلى احتمالات
  const probabilities = amplitudes.map(a => a * a);
  const totalProb = probabilities.reduce((s, p) => s + p, 0);

  for (let i = 0; i < options.length; i++) {
    options[i].amplifiedProbability = totalProb > 0 ? probabilities[i] / totalProb : 1 / n;
  }

  return { iterations: optimalIterations };
}

/** بناء نص التوصية */
function buildRecommendation(options: DecisionOption[], recommendedIndex: number): string {
  if (options.length === 0) return 'لم يتم العثور على خيارات لتحليلها.';
  if (options.length === 1) return `الخيار الوحيد المتاح: "${options[0].text}"`;

  const best = options[recommendedIndex];
  const prob = (best.amplifiedProbability * 100).toFixed(1);

  const parts: string[] = [];
  parts.push(`التوصية الكمومية: "${best.text}" باحتمال ${prob}%.`);

  if (best.positivityScore > 0.6) {
    parts.push('يتميز هذا الخيار بدلالات إيجابية قوية.');
  }
  if (best.practicalityScore > 0.5) {
    parts.push('يتسم بقابلية عملية عالية للتنفيذ.');
  }
  if (best.dominantFields.length > 0) {
    const fieldNames = best.dominantFields.map(f => SEMANTIC_FIELD_NAMES[f]).join('، ');
    parts.push(`الحقول الدلالية المهيمنة: ${fieldNames}.`);
  }

  return parts.join(' ');
}

/** بناء التحليل المفصّل */
function buildDetailedAnalysis(options: DecisionOption[], groverIterations: number): string {
  const parts: string[] = [];

  parts.push(`تم تحليل ${options.length} خيارات عبر ${groverIterations} تكرار من خوارزمية Grover.`);
  parts.push('');

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    parts.push(`⟨${i + 1}⟩ "${opt.text}":`);
    parts.push(`  • الوزن الدلالي: ${(opt.semanticWeight * 100).toFixed(0)}%`);
    parts.push(`  • الإيجابية: ${(opt.positivityScore * 100).toFixed(0)}%`);
    parts.push(`  • العملية: ${(opt.practicalityScore * 100).toFixed(0)}%`);
    parts.push(`  • الاحتمال الأولي: ${(opt.initialProbability * 100).toFixed(1)}%`);
    parts.push(`  • الاحتمال المعزّز (Grover): ${(opt.amplifiedProbability * 100).toFixed(1)}%`);
    parts.push('');
  }

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// الدالة الرئيسية
// ═══════════════════════════════════════════════════════════════

/**
 * تحليل قرار بالعربية باستخدام خوارزمية Grover الكمومية
 *
 * مثال:
 * analyzeDecision("هل أفتح مشروع مطعم أم متجر إلكتروني؟")
 */
export function analyzeDecision(question: string): DecisionResult {
  const start = performance.now();

  // استخراج الخيارات
  const optionTexts = extractOptions(question);

  // تحليل كل خيار
  const options: DecisionOption[] = optionTexts.map(text => {
    const words = text.split(/\s+/).map(w => analyzeWord(w));
    const validWords = words.filter(w => w.confidence > 0);

    const semanticWeight = computeSemanticWeight(validWords);
    const positivityScore = computePositivity(validWords, text);
    const practicalityScore = computePracticality(text);

    // درجة الثقة = متوسط ثقة التحليل الصرفي
    const confidenceScore = validWords.length > 0
      ? validWords.reduce((s, w) => s + w.confidence, 0) / validWords.length
      : 0.3;

    // الحقول الدلالية المهيمنة
    const fieldCounts = new Map<SemanticField, number>();
    for (const w of validWords) {
      if (w.semanticField !== 'unknown') {
        fieldCounts.set(w.semanticField, (fieldCounts.get(w.semanticField) || 0) + 1);
      }
    }
    const dominantFields = [...fieldCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([field]) => field);

    return {
      text,
      analyzedWords: words,
      semanticWeight,
      initialProbability: 1 / optionTexts.length,
      amplifiedProbability: 1 / optionTexts.length,
      dominantFields,
      positivityScore,
      practicalityScore,
      confidenceScore,
    };
  });

  // تطبيق Grover
  const { iterations } = applyGroverAmplification(options);

  // تحديد الخيار المُوصى به
  const recommendedIndex = options.reduce((bestIdx, opt, idx) =>
    opt.amplifiedProbability > options[bestIdx].amplifiedProbability ? idx : bestIdx, 0);

  // حساب وضوح القرار
  const maxProb = Math.max(...options.map(o => o.amplifiedProbability));
  const minProb = Math.min(...options.map(o => o.amplifiedProbability));
  const decisionClarity = options.length > 1 ? maxProb - minProb : 1;

  return {
    question,
    options,
    recommendedIndex,
    groverIterations: iterations,
    searchSpaceSize: Math.pow(2, options.length),
    decisionClarity,
    recommendation: buildRecommendation(options, recommendedIndex),
    detailedAnalysis: buildDetailedAnalysis(options, iterations),
    processingTimeMs: performance.now() - start,
  };
}
