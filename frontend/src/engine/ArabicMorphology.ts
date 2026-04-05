/**
 * ArabicMorphology — محرك التحليل الصرفي الكمومي العربي
 *
 * أول محرك يحوّل البنية الصرفية العربية إلى حالات كمومية.
 * يعتمد على المبدأ الأساسي: الجذر الثلاثي العربي = تراكب كمومي
 *
 * ك-ت-ب → |ψ⟩ = α|كِتَاب⟩ + β|كَاتِب⟩ + γ|مَكْتُوب⟩ + δ|مَكْتَبَة⟩
 *
 * المراحل:
 * 1. تجريد السوابق واللواحق
 * 2. استخراج الجذر الثلاثي
 * 3. تحديد الوزن الصرفي
 * 4. تحويل لحالة كمومية
 */

// ═══════════════════════════════════════════════════════════════
// الأنواع (Types)
// ═══════════════════════════════════════════════════════════════

/** الحقل الدلالي للجذر */
export type SemanticField =
  | 'knowledge' | 'creation' | 'movement' | 'speech' | 'emotion'
  | 'nature' | 'body' | 'society' | 'religion' | 'commerce'
  | 'warfare' | 'thought' | 'perception' | 'existence' | 'unknown';

/** نتيجة تحليل كلمة واحدة */
export interface MorphAnalysis {
  /** الكلمة الأصلية */
  word: string;
  /** الجذر الثلاثي المستخرج */
  root: string;
  /** أحرف الجذر مفرّقة */
  rootLetters: [string, string, string];
  /** الوزن الصرفي */
  pattern: string;
  /** اسم الوزن بالعربية */
  patternName: string;
  /** المعنى الأساسي للجذر */
  rootMeaning: string;
  /** الحقل الدلالي */
  semanticField: SemanticField;
  /** المشتقات المحتملة من نفس الجذر — حالات التراكب */
  superpositionStates: string[];
  /** درجة الثقة في التحليل (0-1) */
  confidence: number;
  /** هل الكلمة معرّفة بأل */
  isDefinite: boolean;
  /** نوع الكلمة */
  wordType: 'noun' | 'verb' | 'adjective' | 'particle' | 'unknown';
}

/** نتيجة تحليل جملة كاملة */
export interface SentenceAnalysis {
  /** النص الأصلي */
  text: string;
  /** تحليل كل كلمة */
  words: MorphAnalysis[];
  /** عدد الجذور الفريدة */
  uniqueRoots: number;
  /** الحقول الدلالية المكتشفة */
  semanticFields: SemanticField[];
  /** درجة التماسك الدلالي (مدى ترابط الكلمات) */
  semanticCoherence: number;
  /** زمن التحليل بالمللي ثانية */
  processingTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════
// قاعدة بيانات الجذور العربية
// ═══════════════════════════════════════════════════════════════

interface RootEntry {
  meaning: string;
  field: SemanticField;
  derivatives: string[];
}

/**
 * قاعدة بيانات مختارة من الجذور العربية الأكثر شيوعاً
 * كل جذر مع معناه الأساسي وحقله الدلالي ومشتقاته
 */
const ROOTS_DB: Record<string, RootEntry> = {
  // ─── العلم والمعرفة ───
  'كتب': { meaning: 'الكتابة والتدوين', field: 'knowledge', derivatives: ['كتاب', 'كاتب', 'مكتوب', 'مكتبة', 'كتابة', 'مكاتبة'] },
  'علم': { meaning: 'العلم والمعرفة', field: 'knowledge', derivatives: ['عالم', 'معلوم', 'علوم', 'تعليم', 'معلم', 'عليم'] },
  'قرأ': { meaning: 'القراءة والتلاوة', field: 'knowledge', derivatives: ['قارئ', 'قراءة', 'قرآن', 'مقروء', 'قراء'] },
  'درس': { meaning: 'الدراسة والتعلم', field: 'knowledge', derivatives: ['دارس', 'دراسة', 'مدرسة', 'مدرّس', 'دروس'] },
  'فهم': { meaning: 'الفهم والإدراك', field: 'thought', derivatives: ['فاهم', 'مفهوم', 'فهيم', 'تفاهم', 'فهم'] },
  'فكر': { meaning: 'التفكير والتأمل', field: 'thought', derivatives: ['فكرة', 'مفكر', 'تفكير', 'أفكار', 'فكري'] },
  'بحث': { meaning: 'البحث والتنقيب', field: 'knowledge', derivatives: ['باحث', 'بحث', 'أبحاث', 'مبحث', 'بحوث'] },

  // ─── الخلق والإبداع ───
  'خلق': { meaning: 'الخلق والإبداع', field: 'creation', derivatives: ['خالق', 'مخلوق', 'خلق', 'خليقة', 'إبداع'] },
  'بنى': { meaning: 'البناء والتشييد', field: 'creation', derivatives: ['بناء', 'بانٍ', 'مبنى', 'بنيان', 'بنية'] },
  'صنع': { meaning: 'الصنع والتصنيع', field: 'creation', derivatives: ['صانع', 'مصنوع', 'صناعة', 'مصنع', 'صنعة'] },
  'بدع': { meaning: 'الابتداع والإنشاء', field: 'creation', derivatives: ['مبدع', 'إبداع', 'بدعة', 'بديع', 'ابتداع'] },

  // ─── الحركة والانتقال ───
  'ذهب': { meaning: 'الذهاب والمسير', field: 'movement', derivatives: ['ذاهب', 'مذهب', 'ذهاب'] },
  'رجع': { meaning: 'الرجوع والعودة', field: 'movement', derivatives: ['راجع', 'مرجع', 'رجوع', 'مراجعة', 'ترجيع'] },
  'سفر': { meaning: 'السفر والترحال', field: 'movement', derivatives: ['مسافر', 'سفر', 'سفارة', 'سفير', 'أسفار'] },
  'دخل': { meaning: 'الدخول والولوج', field: 'movement', derivatives: ['داخل', 'مدخل', 'دخول', 'دخيل', 'تداخل'] },
  'خرج': { meaning: 'الخروج والبروز', field: 'movement', derivatives: ['خارج', 'مخرج', 'خروج', 'إخراج', 'مخرجات'] },

  // ─── الكلام والتواصل ───
  'قول': { meaning: 'القول والكلام', field: 'speech', derivatives: ['قائل', 'مقولة', 'قول', 'أقوال', 'مقال'] },
  'كلم': { meaning: 'الكلام والحديث', field: 'speech', derivatives: ['كلمة', 'متكلم', 'كلام', 'تكلم', 'محادثة'] },
  'سأل': { meaning: 'السؤال والاستفهام', field: 'speech', derivatives: ['سائل', 'مسألة', 'سؤال', 'تساؤل'] },
  'جوب': { meaning: 'الإجابة والرد', field: 'speech', derivatives: ['مجيب', 'إجابة', 'جواب', 'استجابة'] },
  'سمع': { meaning: 'السماع والإنصات', field: 'perception', derivatives: ['سامع', 'مسموع', 'سمع', 'سماع', 'سميع'] },

  // ─── المشاعر والعواطف ───
  'حبب': { meaning: 'الحب والمودة', field: 'emotion', derivatives: ['حبيب', 'محبوب', 'حب', 'محبة', 'أحباب'] },
  'فرح': { meaning: 'الفرح والسرور', field: 'emotion', derivatives: ['فرحان', 'مفرح', 'فرح', 'فرحة', 'أفراح'] },
  'حزن': { meaning: 'الحزن والأسى', field: 'emotion', derivatives: ['حزين', 'محزن', 'حزن', 'أحزان'] },
  'خوف': { meaning: 'الخوف والرهبة', field: 'emotion', derivatives: ['خائف', 'مخوف', 'خوف', 'تخويف', 'مخاوف'] },
  'رجو': { meaning: 'الرجاء والأمل', field: 'emotion', derivatives: ['راجٍ', 'مرجو', 'رجاء', 'أرجوحة'] },

  // ─── الطبيعة والكون ───
  'نور': { meaning: 'النور والضياء', field: 'nature', derivatives: ['منير', 'نور', 'أنوار', 'تنوير', 'نوراني'] },
  'شمس': { meaning: 'الشمس والإشراق', field: 'nature', derivatives: ['شمس', 'شمسي', 'مشمس'] },
  'بحر': { meaning: 'البحر والمحيط', field: 'nature', derivatives: ['بحر', 'بحار', 'بحري', 'بحيرة', 'إبحار'] },
  'جبل': { meaning: 'الجبل والرسوخ', field: 'nature', derivatives: ['جبل', 'جبال', 'جبلي', 'جبلة'] },
  'نهر': { meaning: 'النهر والجريان', field: 'nature', derivatives: ['نهر', 'أنهار', 'نهري', 'نهار'] },
  'سمو': { meaning: 'السمو والعلو', field: 'nature', derivatives: ['سماء', 'سامي', 'سمو', 'تسامٍ'] },
  'ارض': { meaning: 'الأرض والتراب', field: 'nature', derivatives: ['أرض', 'أرضي', 'أراضي'] },

  // ─── الجسم والصحة ───
  'قلب': { meaning: 'القلب والتحول', field: 'body', derivatives: ['قلب', 'قالب', 'مقلوب', 'انقلاب', 'تقلب'] },
  'عين': { meaning: 'العين والرؤية', field: 'perception', derivatives: ['عين', 'عيون', 'معاينة', 'عيان'] },
  'يدي': { meaning: 'اليد والعطاء', field: 'body', derivatives: ['يد', 'أيدي', 'تأييد'] },

  // ─── المجتمع والسياسة ───
  'حكم': { meaning: 'الحكم والقضاء', field: 'society', derivatives: ['حاكم', 'محكوم', 'حكم', 'حكمة', 'محكمة', 'حكيم'] },
  'ملك': { meaning: 'الملك والسلطة', field: 'society', derivatives: ['ملك', 'مالك', 'مملكة', 'ملكي', 'تملك'] },
  'عدل': { meaning: 'العدل والإنصاف', field: 'society', derivatives: ['عادل', 'معدل', 'عدالة', 'عدل', 'تعديل'] },
  'شرع': { meaning: 'الشريعة والقانون', field: 'society', derivatives: ['شارع', 'مشروع', 'شريعة', 'تشريع'] },
  'جمع': { meaning: 'الجمع والاجتماع', field: 'society', derivatives: ['جامع', 'مجموع', 'جمعية', 'اجتماع', 'جامعة'] },
  'وحد': { meaning: 'الوحدة والتوحيد', field: 'society', derivatives: ['واحد', 'موحد', 'وحدة', 'توحيد', 'اتحاد'] },

  // ─── الدين والروحانية ───
  'عبد': { meaning: 'العبادة والخضوع', field: 'religion', derivatives: ['عابد', 'معبود', 'عبادة', 'عبد', 'معبد'] },
  'صلو': { meaning: 'الصلاة والدعاء', field: 'religion', derivatives: ['مصلي', 'صلاة', 'صلوات'] },
  'ذكر': { meaning: 'الذكر والتذكير', field: 'religion', derivatives: ['ذاكر', 'مذكور', 'ذكر', 'تذكير', 'ذكرى'] },
  'شكر': { meaning: 'الشكر والامتنان', field: 'religion', derivatives: ['شاكر', 'مشكور', 'شكر', 'شكور'] },
  'رحم': { meaning: 'الرحمة والعطف', field: 'religion', derivatives: ['راحم', 'مرحوم', 'رحمة', 'رحيم', 'رحمن'] },
  'امن': { meaning: 'الأمان والإيمان', field: 'religion', derivatives: ['مؤمن', 'أمان', 'إيمان', 'أمين', 'آمن'] },

  // ─── التجارة والاقتصاد ───
  'بيع': { meaning: 'البيع والتجارة', field: 'commerce', derivatives: ['بائع', 'مبيع', 'بيع', 'مبايعة'] },
  'شرى': { meaning: 'الشراء والاقتناء', field: 'commerce', derivatives: ['مشترٍ', 'شراء', 'اشتراك'] },
  'ربح': { meaning: 'الربح والكسب', field: 'commerce', derivatives: ['رابح', 'ربح', 'أرباح', 'مربح'] },
  'عمل': { meaning: 'العمل والإنتاج', field: 'commerce', derivatives: ['عامل', 'معمول', 'عمل', 'عملي', 'معمل'] },
  'كسب': { meaning: 'الكسب والاكتساب', field: 'commerce', derivatives: ['كاسب', 'مكتسب', 'كسب', 'اكتساب'] },

  // ─── الحرب والقوة ───
  'نصر': { meaning: 'النصر والغلبة', field: 'warfare', derivatives: ['ناصر', 'منصور', 'نصر', 'انتصار', 'نصير'] },
  'جهد': { meaning: 'الجهد والاجتهاد', field: 'warfare', derivatives: ['مجاهد', 'جهد', 'اجتهاد', 'مجهود'] },
  'قوي': { meaning: 'القوة والمتانة', field: 'warfare', derivatives: ['قوي', 'قوة', 'تقوية', 'أقوياء'] },
  'حرب': { meaning: 'الحرب والقتال', field: 'warfare', derivatives: ['محارب', 'حرب', 'حروب', 'محاربة'] },

  // ─── الوجود والكينونة ───
  'كون': { meaning: 'الكون والوجود', field: 'existence', derivatives: ['كائن', 'مكون', 'كون', 'تكوين', 'كينونة'] },
  'وجد': { meaning: 'الوجود والكيان', field: 'existence', derivatives: ['واجد', 'موجود', 'وجود', 'إيجاد', 'وجدان'] },
  'حيي': { meaning: 'الحياة والعيش', field: 'existence', derivatives: ['حي', 'حياة', 'محيا', 'إحياء', 'أحياء'] },
  'موت': { meaning: 'الموت والفناء', field: 'existence', derivatives: ['ميت', 'موت', 'ممات', 'إماتة'] },
  'بدأ': { meaning: 'البداية والشروع', field: 'existence', derivatives: ['بادئ', 'مبتدأ', 'بداية', 'ابتداء'] },

  // ─── الإدراك والحواس ───
  'نظر': { meaning: 'النظر والمشاهدة', field: 'perception', derivatives: ['ناظر', 'منظور', 'نظر', 'نظرة', 'نظرية', 'منظار'] },
  'بصر': { meaning: 'البصر والرؤية', field: 'perception', derivatives: ['بصير', 'مبصر', 'بصر', 'بصيرة', 'أبصار'] },
  'لمس': { meaning: 'اللمس والمساس', field: 'perception', derivatives: ['لامس', 'ملموس', 'لمس', 'لمسة'] },
  'شعر': { meaning: 'الشعور والإحساس', field: 'perception', derivatives: ['شاعر', 'مشاعر', 'شعور', 'شعر', 'شعري'] },

  // ─── تقنية وحوسبة ───
  'حسب': { meaning: 'الحساب والعد', field: 'knowledge', derivatives: ['حاسب', 'محسوب', 'حساب', 'حاسوب', 'حسبان'] },
  'برمج': { meaning: 'البرمجة والتكويد', field: 'knowledge', derivatives: ['مبرمج', 'برمجة', 'برنامج', 'برامج'] },
  'شفر': { meaning: 'التشفير والترميز', field: 'knowledge', derivatives: ['مشفر', 'تشفير', 'شفرة', 'شيفرة'] },
  'ذكو': { meaning: 'الذكاء والفطنة', field: 'thought', derivatives: ['ذكي', 'ذكاء', 'أذكياء'] },
};

// ═══════════════════════════════════════════════════════════════
// الأوزان الصرفية (Morphological Patterns)
// ═══════════════════════════════════════════════════════════════

interface PatternEntry {
  name: string;
  type: 'noun' | 'verb' | 'adjective';
  /** المعنى الصرفي */
  morphMeaning: string;
}

/**
 * الأوزان الصرفية الأساسية
 * كل وزن يُعرَّف بنمط: ف = الحرف الأول، ع = الثاني، ل = الثالث
 * الحروف الزائدة (ا، ت، م، ن، ي، و، س، هـ) تُكتب كما هي
 */
const PATTERNS: Record<string, PatternEntry> = {
  'فعل': { name: 'فَعَلَ', type: 'verb', morphMeaning: 'الفعل الثلاثي المجرد' },
  'فاعل': { name: 'فَاعِل', type: 'adjective', morphMeaning: 'اسم الفاعل' },
  'مفعول': { name: 'مَفْعُول', type: 'adjective', morphMeaning: 'اسم المفعول' },
  'فعال': { name: 'فِعَال', type: 'noun', morphMeaning: 'مصدر / جمع تكسير' },
  'فعيل': { name: 'فَعِيل', type: 'adjective', morphMeaning: 'صفة مشبهة' },
  'فعول': { name: 'فَعُول', type: 'adjective', morphMeaning: 'صيغة مبالغة' },
  'فعلة': { name: 'فَعْلَة', type: 'noun', morphMeaning: 'المرة / الهيئة' },
  'مفعل': { name: 'مَفْعَل', type: 'noun', morphMeaning: 'اسم المكان / الزمان' },
  'مفعلة': { name: 'مَفْعَلَة', type: 'noun', morphMeaning: 'اسم المكان / الآلة' },
  'تفعيل': { name: 'تَفْعِيل', type: 'noun', morphMeaning: 'مصدر التفعيل' },
  'افعال': { name: 'أَفْعَال', type: 'noun', morphMeaning: 'جمع تكسير' },
  'فعالة': { name: 'فَعَالَة', type: 'noun', morphMeaning: 'المصدر / الحرفة' },
  'افتعال': { name: 'اِفْتِعَال', type: 'noun', morphMeaning: 'مصدر الافتعال' },
  'انفعال': { name: 'اِنْفِعَال', type: 'noun', morphMeaning: 'مصدر الانفعال' },
  'استفعال': { name: 'اِسْتِفْعَال', type: 'noun', morphMeaning: 'مصدر الاستفعال' },
  'تفاعل': { name: 'تَفَاعُل', type: 'noun', morphMeaning: 'مصدر التفاعل' },
  'تفعل': { name: 'تَفَعُّل', type: 'noun', morphMeaning: 'مصدر التفعّل' },
  'فعلي': { name: 'فَعْلِي', type: 'adjective', morphMeaning: 'نسبة' },
  'فواعل': { name: 'فَوَاعِل', type: 'noun', morphMeaning: 'جمع تكسير' },
};

// ═══════════════════════════════════════════════════════════════
// السوابق واللواحق
// ═══════════════════════════════════════════════════════════════

/** السوابق — يجب ترتيبها من الأطول للأقصر */
const PREFIXES = ['وال', 'بال', 'كال', 'فال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل', 'س'] as const;

/** اللواحق — يجب ترتيبها من الأطول للأقصر */
const SUFFIXES = ['ات', 'ون', 'ين', 'ان', 'هم', 'هن', 'كم', 'كن', 'نا', 'ها', 'ية', 'وا', 'تم', 'تن', 'ة', 'ي', 'ه', 'ك'] as const;

/** الأحرف الصامتة العربية (ليست حروف علة) */
const CONSONANTS = new Set('بتثجحخدذرزسشصضطظعغفقكلمنهء');

/** حروف العلة */
const VOWEL_LETTERS = new Set('اويى');

// ═══════════════════════════════════════════════════════════════
// دوال التحليل الأساسية
// ═══════════════════════════════════════════════════════════════

/** تطبيع النص العربي — إزالة التشكيل وتوحيد الأشكال */
export function normalizeArabic(text: string): string {
  return text
    // إزالة التشكيل (harakat)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // توحيد أشكال الألف
    .replace(/[أإآ]/g, 'ا')
    // توحيد الياء
    .replace(/ى/g, 'ي')
    // توحيد الهمزة على كرسي
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // إزالة التطويل (tatweel)
    .replace(/ـ/g, '');
}

/** تجريد السوابق من الكلمة */
function stripPrefixes(word: string): { stem: string; prefix: string } {
  for (const prefix of PREFIXES) {
    if (word.startsWith(prefix) && word.length - prefix.length >= 2) {
      return { stem: word.slice(prefix.length), prefix };
    }
  }
  return { stem: word, prefix: '' };
}

/** تجريد اللواحق من الكلمة */
function stripSuffixes(word: string): { stem: string; suffix: string } {
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 2) {
      return { stem: word.slice(0, -suffix.length), suffix };
    }
  }
  return { stem: word, suffix: '' };
}

/** استخراج الهيكل الصامت (الحروف الصحيحة فقط) */
function extractConsonantSkeleton(word: string): string[] {
  return [...word].filter(c => CONSONANTS.has(c));
}

/**
 * استخراج الجذر الثلاثي من الكلمة
 * يجرّب عدة استراتيجيات بالتسلسل
 */
function extractRoot(word: string): { root: string; confidence: number } {
  const normalized = normalizeArabic(word);

  // الاستراتيجية 1: البحث المباشر في القاموس
  for (const [root, entry] of Object.entries(ROOTS_DB)) {
    const normalizedRoot = normalizeArabic(root);
    // هل الكلمة من مشتقات هذا الجذر؟
    for (const deriv of entry.derivatives) {
      if (normalizeArabic(deriv) === normalized) {
        return { root: normalizedRoot, confidence: 1.0 };
      }
    }
  }

  // الاستراتيجية 2: تجريد السوابق واللواحق ثم البحث
  const { stem: stem1 } = stripPrefixes(normalized);
  const { stem: stem2 } = stripSuffixes(stem1);
  const stemNormalized = stem2;

  // البحث في الجذور مباشرة
  for (const [root] of Object.entries(ROOTS_DB)) {
    const nr = normalizeArabic(root);
    if (nr === stemNormalized) {
      return { root: nr, confidence: 0.95 };
    }
  }

  // الاستراتيجية 3: استخراج الحروف الصامتة ومطابقتها
  const consonants = extractConsonantSkeleton(stemNormalized);

  if (consonants.length >= 3) {
    // نجرّب كل تركيبة من 3 أحرف متتالية
    for (let i = 0; i <= consonants.length - 3; i++) {
      const candidate = consonants[i] + consonants[i + 1] + consonants[i + 2];
      for (const [root] of Object.entries(ROOTS_DB)) {
        const nr = normalizeArabic(root);
        const rootConsonants = extractConsonantSkeleton(nr);
        if (rootConsonants.length >= 3 &&
          rootConsonants[0] === consonants[i] &&
          rootConsonants[1] === consonants[i + 1] &&
          rootConsonants[2] === consonants[i + 2]) {
          return { root: nr, confidence: 0.75 };
        }
      }
      // إذا لم نجد في القاموس، نستخدم الأحرف الصامتة كجذر
      if (i === 0) {
        return { root: candidate, confidence: 0.4 };
      }
    }
  }

  // الاستراتيجية 4: أخذ أول 3 أحرف صامتة من الكلمة الأصلية
  const allConsonants = extractConsonantSkeleton(normalized);
  if (allConsonants.length >= 3) {
    return { root: allConsonants[0] + allConsonants[1] + allConsonants[2], confidence: 0.3 };
  }

  // حالة أخيرة: نأخذ الكلمة كما هي
  return { root: normalized.slice(0, 3) || normalized, confidence: 0.1 };
}

/** تحديد الوزن الصرفي */
function identifyPattern(word: string, root: string): { pattern: string; patternName: string; morphMeaning: string } {
  const normalized = normalizeArabic(word);
  const rootLetters = [...normalizeArabic(root)];

  if (rootLetters.length < 3) {
    return { pattern: 'فعل', patternName: 'فَعَلَ', morphMeaning: 'الفعل الثلاثي المجرد' };
  }

  const [f, ain, lam] = rootLetters;

  // دالة مساعدة لتحويل PatternEntry إلى النتيجة
  const toResult = (patternKey: string, entry: PatternEntry) => ({
    pattern: patternKey,
    patternName: entry.name,
    morphMeaning: entry.morphMeaning,
  });

  // محاولة مطابقة الأنماط الشائعة
  const stripped = stripPrefixes(normalized).stem;
  const len = stripped.length;

  // م + فعول = مفعول
  if (normalized.startsWith('م') && len >= 5) {
    const entry = PATTERNS['مفعول'] || PATTERNS['مفعل'] || PATTERNS['مفعلة'];
    if (entry) return toResult('مفعول', entry);
  }

  // تفعيل
  if (normalized.startsWith('ت') && normalized.includes('ي') && len >= 5) {
    const entry = PATTERNS['تفعيل'];
    if (entry) return toResult('تفعيل', entry);
  }

  // فاعل
  if (len >= 4 && !normalized.startsWith('م') && !normalized.startsWith('ت')) {
    // ابحث عن ألف بعد الحرف الأول
    const afterFirst = normalized.indexOf('ا', 1);
    if (afterFirst === 1) {
      const entry = PATTERNS['فاعل'];
      if (entry) return toResult('فاعل', entry);
    }
  }

  // فعيل
  if (len >= 4 && normalized.includes('ي')) {
    const yIndex = normalized.lastIndexOf('ي');
    if (yIndex >= 2 && yIndex < len - 1) {
      const entry = PATTERNS['فعيل'];
      if (entry) return toResult('فعيل', entry);
    }
  }

  // فعالة
  if (normalized.endsWith('ة') && len >= 4) {
    const entry = PATTERNS['فعالة'] || PATTERNS['فعلة'];
    if (entry) return toResult('فعالة', entry);
  }

  // افتراضي: فعل
  return { pattern: 'فعل', patternName: 'فَعَلَ', morphMeaning: 'الفعل الثلاثي المجرد' };
}

/** تحديد نوع الكلمة */
function classifyWordType(word: string, pattern: string): MorphAnalysis['wordType'] {
  const normalized = normalizeArabic(word);

  // الحروف (أدوات)
  const particles = new Set(['في', 'من', 'الى', 'على', 'عن', 'مع', 'بين', 'حتى', 'منذ', 'خلال',
    'هل', 'ما', 'لا', 'لم', 'لن', 'قد', 'اذا', 'ان', 'لكن', 'او', 'ام', 'ثم', 'بل',
    'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي', 'الذين', 'اللذين', 'اللتين',
    'انا', 'انت', 'هو', 'هي', 'نحن', 'انتم', 'هم', 'هن', 'كل', 'بعض', 'اي']);
  if (particles.has(normalized)) return 'particle';

  const patternEntry = PATTERNS[pattern];
  if (patternEntry) return patternEntry.type;

  return 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// الدوال العامة (Public API)
// ═══════════════════════════════════════════════════════════════

/**
 * تحليل كلمة عربية واحدة — استخراج الجذر والوزن والحالة الكمومية
 */
export function analyzeWord(word: string): MorphAnalysis {
  const cleaned = word.trim();
  if (!cleaned) {
    return emptyAnalysis(word);
  }

  // التحقق من أن الكلمة عربية
  const hasArabic = /[\u0600-\u06FF]/.test(cleaned);
  if (!hasArabic) {
    return emptyAnalysis(word);
  }

  const normalized = normalizeArabic(cleaned);

  // هل الكلمة معرّفة بأل؟
  const isDefinite = normalized.startsWith('ال') || cleaned.startsWith('ال');

  // استخراج الجذر
  const { root, confidence } = extractRoot(cleaned);
  const rootNorm = normalizeArabic(root);

  // البحث في قاعدة البيانات
  const rootEntry = findRootEntry(rootNorm);

  // تحديد الوزن
  const { pattern, patternName, morphMeaning } = identifyPattern(cleaned, root);

  // تحديد نوع الكلمة
  const wordType = classifyWordType(cleaned, pattern);

  // حروف الجذر
  const letters = [...rootNorm];
  const rootLetters: [string, string, string] = [
    letters[0] || '؟',
    letters[1] || '؟',
    letters[2] || '؟',
  ];

  return {
    word: cleaned,
    root: rootNorm,
    rootLetters,
    pattern,
    patternName,
    rootMeaning: rootEntry?.meaning || 'معنى غير معروف',
    semanticField: rootEntry?.field || 'unknown',
    superpositionStates: rootEntry?.derivatives || [cleaned],
    confidence,
    isDefinite,
    wordType,
  };
}

/** البحث عن جذر في القاعدة */
function findRootEntry(rootNorm: string): RootEntry | undefined {
  // بحث مباشر
  for (const [key, entry] of Object.entries(ROOTS_DB)) {
    if (normalizeArabic(key) === rootNorm) return entry;
  }
  // بحث بالحروف الصامتة
  const rootCons = extractConsonantSkeleton(rootNorm);
  if (rootCons.length >= 3) {
    for (const [key, entry] of Object.entries(ROOTS_DB)) {
      const keyCons = extractConsonantSkeleton(normalizeArabic(key));
      if (keyCons.length >= 3 &&
        keyCons[0] === rootCons[0] &&
        keyCons[1] === rootCons[1] &&
        keyCons[2] === rootCons[2]) {
        return entry;
      }
    }
  }
  return undefined;
}

/** تحليل فارغ */
function emptyAnalysis(word: string): MorphAnalysis {
  return {
    word,
    root: '',
    rootLetters: ['؟', '؟', '؟'],
    pattern: '',
    patternName: '',
    rootMeaning: '',
    semanticField: 'unknown',
    superpositionStates: [],
    confidence: 0,
    isDefinite: false,
    wordType: 'unknown',
  };
}

/**
 * تحليل جملة عربية كاملة
 * يفصل الكلمات ويحلل كل واحدة ثم يحسب التماسك الدلالي
 */
export function analyzeSentence(text: string): SentenceAnalysis {
  const start = performance.now();

  // تقسيم النص إلى كلمات
  const rawWords = text.split(/\s+/).filter(w => w.length > 0);

  // تحليل كل كلمة
  const words = rawWords.map(analyzeWord);

  // الجذور الفريدة
  const rootSet = new Set(words.filter(w => w.root).map(w => w.root));

  // الحقول الدلالية
  const fieldSet = new Set(words.filter(w => w.semanticField !== 'unknown').map(w => w.semanticField));

  // حساب التماسك الدلالي — كلما تكررت الحقول الدلالية زاد التماسك
  const fieldCounts = new Map<string, number>();
  for (const w of words) {
    if (w.semanticField !== 'unknown') {
      fieldCounts.set(w.semanticField, (fieldCounts.get(w.semanticField) || 0) + 1);
    }
  }
  const totalAnalyzed = words.filter(w => w.semanticField !== 'unknown').length;
  let coherence = 0;
  if (totalAnalyzed > 1) {
    // نسبة أكبر حقل دلالي إلى المجموع — كلما زادت زاد التماسك
    const maxFieldCount = Math.max(...fieldCounts.values(), 0);
    coherence = maxFieldCount / totalAnalyzed;
  }

  return {
    text,
    words,
    uniqueRoots: rootSet.size,
    semanticFields: [...fieldSet],
    semanticCoherence: coherence,
    processingTimeMs: performance.now() - start,
  };
}

/**
 * الحصول على جميع الجذور المتاحة في القاعدة
 * (مفيد للعرض والبحث)
 */
export function getAllRoots(): Array<{ root: string; meaning: string; field: SemanticField; derivativeCount: number }> {
  return Object.entries(ROOTS_DB).map(([root, entry]) => ({
    root,
    meaning: entry.meaning,
    field: entry.field,
    derivativeCount: entry.derivatives.length,
  }));
}

/**
 * الحصول على الحقول الدلالية المتاحة مع أسمائها بالعربية
 */
export const SEMANTIC_FIELD_NAMES: Record<SemanticField, string> = {
  knowledge: 'العلم والمعرفة',
  creation: 'الخلق والإبداع',
  movement: 'الحركة والانتقال',
  speech: 'الكلام والتواصل',
  emotion: 'المشاعر والعواطف',
  nature: 'الطبيعة والكون',
  body: 'الجسم والصحة',
  society: 'المجتمع والسياسة',
  religion: 'الدين والروحانية',
  commerce: 'التجارة والاقتصاد',
  warfare: 'القوة والصراع',
  thought: 'التفكير والتأمل',
  perception: 'الإدراك والحواس',
  existence: 'الوجود والكينونة',
  unknown: 'غير محدد',
};
