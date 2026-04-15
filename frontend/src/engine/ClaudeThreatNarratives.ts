/**
 * Claude-Powered Threat Narratives
 * نظام توليد السرديات الأمنية الذكية بأسلوب Claude
 *
 * يستخدم أسلوب Claude في الشرح التفصيلي والتربوي لتحويل
 * البيانات الأمنية التقنية إلى سرديات مفهومة بالعربية
 */

import type { QuantumThreatTier } from './QuantumCyberShieldV2';
import { getClaudeThreatColor } from './ClaudeSecurityVisualizer';

// ═══════════════════════════════════════════════════════════════
// أنواع السرديات الأمنية
// ═══════════════════════════════════════════════════════════════

export type ThreatCategory =
  | 'quantum_attack'
  | 'classical_cryptanalysis'
  | 'network_intrusion'
  | 'data_exfiltration'
  | 'protocol_manipulation'
  | 'side_channel'
  | 'zero_day'
  | 'advanced_persistent_threat';

export type NarrativeStyle =
  | 'technical'      // للمتخصصين
  | 'executive'      // للإدارة
  | 'educational'    // للمبتدئين
  | 'incident'       // تقرير حادثة
  | 'forensic';      // تحليل جنائي

export interface ThreatIndicator {
  /** نوع المؤشر */
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'quantum_signature';
  /** القيمة */
  value: string;
  /** السياق */
  context?: string;
  /** وقت الصلاحية */
  expiresAt?: number;
}

export interface ThreatEvent {
  /** معرّف فريد */
  id: string;
  /** وقت الحدث */
  timestamp: number;
  /** نوع التهديد */
  category: ThreatCategory;
  /** مستوى الخطورة */
  tier: QuantumThreatTier;
  /** البيانات التقنية */
  technicalData: Record<string, unknown>;
  /** المصدر */
  source?: string;
  /** الهدف */
  target?: string;
  /** الحالة */
  status: 'detected' | 'mitigated' | 'blocked' | 'investigating';
}

export interface ThreatNarrative {
  /** معرّف السردية */
  id: string;
  /** الحدث المرتبط */
  eventId: string;
  /** العنوان */
  title: string;
  /** العنوان بالعربية */
  titleAr: string;
  /** الملخص التنفيذي */
  executiveSummary: string;
  /** القصة الكاملة */
  fullStory: string;
  /** التحليل التقنيّ */
  technicalAnalysis: string;
  /** التأثير المحتمل */
  impact: string;
  /** التوصيات */
  recommendations: string[];
  /** السياق التاريخي */
  context?: string;
  /** الدروس المستفادة */
  lessonsLearned?: string[];
  /** أسلوب السردية */
  style: NarrativeStyle;
  /** اللون المرتبط */
  color: string;
  /** وقت التوليد */
  generatedAt: number;
}

// ═══════════════════════════════════════════════════════════════
// محرّك توليد السرديات
// ═══════════════════════════════════════════════════════════════

export class ClaudeNarrativeEngine {
  /**
   * توليد سردية كاملة من حدث أمني
   */
  static generateNarrative(
    event: ThreatEvent,
    style: NarrativeStyle = 'technical'
  ): ThreatNarrative {
    const narrativeId = `NARRATIVE-${event.id}-${Date.now()}`;

    return {
      id: narrativeId,
      eventId: event.id,
      title: this.generateTitle(event, 'en'),
      titleAr: this.generateTitle(event, 'ar'),
      executiveSummary: this.generateExecutiveSummary(event, style),
      fullStory: this.generateFullStory(event, style),
      technicalAnalysis: this.generateTechnicalAnalysis(event),
      impact: this.generateImpactAssessment(event),
      recommendations: this.generateRecommendations(event),
      context: this.generateContext(event),
      lessonsLearned: this.generateLessonsLearned(event),
      style,
      color: getClaudeThreatColor(event.tier),
      generatedAt: Date.now(),
    };
  }

  /**
   * توليد العنوان
   */
  private static generateTitle(event: ThreatEvent, lang: 'ar' | 'en'): string {
    const categoryNames = {
      ar: {
        quantum_attack: 'هجوم كمومي',
        classical_cryptanalysis: 'تحليل تشفير كلاسيكي',
        network_intrusion: 'اختراق شبكي',
        data_exfiltration: 'تسريب بيانات',
        protocol_manipulation: 'تلاعب بروتوكولي',
        side_channel: 'هجوم قناة جانبية',
        zero_day: 'ثغرة يوم الصفر',
        advanced_persistent_threat: 'تهديد متقدم مستمر',
      },
      en: {
        quantum_attack: 'Quantum Attack',
        classical_cryptanalysis: 'Classical Cryptanalysis',
        network_intrusion: 'Network Intrusion',
        data_exfiltration: 'Data Exfiltration',
        protocol_manipulation: 'Protocol Manipulation',
        side_channel: 'Side-Channel Attack',
        zero_day: 'Zero-Day Exploit',
        advanced_persistent_threat: 'Advanced Persistent Threat',
      },
    };

    const tierLabels = {
      ar: { Q5: 'حرج', Q4: 'عالي', Q3: 'متوسط', Q2: 'منخفض', Q1: 'معلوماتي' },
      en: { Q5: 'Critical', Q4: 'High', Q3: 'Medium', Q2: 'Low', Q1: 'Info' },
    };

    const categoryName = categoryNames[lang][event.category];
    const tierLabel = tierLabels[lang][event.tier];

    if (lang === 'ar') {
      return `رصد ${categoryName} ذو خطورة ${tierLabel}`;
    }
    return `${tierLabel} Severity ${categoryName} Detected`;
  }

  /**
   * توليد الملخص التنفيذي بأسلوب Claude
   */
  private static generateExecutiveSummary(
    event: ThreatEvent,
    style: NarrativeStyle
  ): string {
    const timestamp = new Date(event.timestamp).toLocaleString('ar-SA');
    const tierDescriptions = {
      Q5: 'يمثل تهديداً حرجاً يتطلب استجابة فورية',
      Q4: 'يشكل خطراً عالياً على أمن المنظومة',
      Q3: 'يحتاج إلى مراقبة دقيقة وإجراءات احترازية',
      Q2: 'ذو تأثير محدود لكنه يستحق التوثيق',
      Q1: 'حدث معلوماتي للعلم والمراقبة',
    };

    const categoryContext = this.getCategoryContext(event.category);
    const statusAr = {
      detected: 'تم رصده',
      mitigated: 'تمت معالجته',
      blocked: 'تم حجبه',
      investigating: 'قيد التحقيق',
    }[event.status];

    if (style === 'executive') {
      return `في تمام الساعة ${timestamp}، رصدت أنظمة الأمان الكمومي في QURABIA محاولة ${categoryContext.nameAr} ${statusAr}. ${tierDescriptions[event.tier]}. الأنظمة الدفاعية تعمل بكفاءة كاملة والوضع تحت السيطرة.`;
    }

    if (style === 'educational') {
      return `هذا التقرير يوثق حدثاً أمنياً من نوع "${categoryContext.nameAr}" والذي يعني ${categoryContext.explanation}. تم رصد هذا النشاط في ${timestamp}، وتصنيفه كـ${tierDescriptions[event.tier]}.`;
    }

    // technical style (default)
    return `رصد حدث أمني [${event.id}] من الفئة ${categoryContext.nameAr} في ${timestamp} بمستوى خطورة ${event.tier}. الحالة: ${statusAr}. ${categoryContext.technicalNote}`;
  }

  /**
   * توليد القصة الكاملة بأسلوب Claude السردي
   */
  private static generateFullStory(
    event: ThreatEvent,
    style: NarrativeStyle
  ): string {
    const categoryStory = this.getCategoryStory(event);
    const timeline = this.buildTimeline(event);
    const response = this.describeResponse(event);

    if (style === 'educational') {
      return `## كيف حدث الأمر؟

${categoryStory.introduction}

## الخط الزمني للحدث

${timeline}

## كيف استجابت الأنظمة؟

${response}

## ما الذي يعنيه هذا؟

${categoryStory.significance}`;
    }

    if (style === 'incident') {
      return `**تسلسل الأحداث:**

${timeline}

**الإجراءات المتخذة:**

${response}

**الملاحظات الفنية:**

${categoryStory.technicalDetails}`;
    }

    // technical/forensic style
    return `**تحليل الحدث:**

${categoryStory.technicalDetails}

**التسلسل الزمني:**

${timeline}

**الاستجابة:**

${response}`;
  }

  /**
   * توليد التحليل التقني العميق
   */
  private static generateTechnicalAnalysis(event: ThreatEvent): string {
    const indicators = this.extractIndicators(event);
    const vectors = this.identifyAttackVectors(event);
    const techniques = this.mapToMITRE(event);

    return `## المؤشرات التقنية (Indicators of Compromise)

${indicators}

## ناقلات الهجوم (Attack Vectors)

${vectors}

## تقنيات MITRE ATT&CK

${techniques}

## البيانات الخام

\`\`\`json
${JSON.stringify(event.technicalData, null, 2)}
\`\`\``;
  }

  /**
   * تقييم التأثير المحتمل
   */
  private static generateImpactAssessment(event: ThreatEvent): string {
    const impactLevels = {
      Q5: {
        confidentiality: 'تأثير كارثي — قد يؤدي إلى تسريب كامل للبيانات الحساسة',
        integrity: 'تأثير شديد — إمكانية تعديل البيانات الحرجة دون كشف',
        availability: 'تأثير حرج — قد يعطّل الخدمات بالكامل',
      },
      Q4: {
        confidentiality: 'تأثير كبير — إمكانية الوصول لبيانات حساسة',
        integrity: 'تأثير ملموس — قد يتم التلاعب ببعض البيانات',
        availability: 'تأثير واضح — قد يبطئ أو يعطّل بعض الخدمات',
      },
      Q3: {
        confidentiality: 'تأثير متوسط — محاولة الوصول لبيانات غير حرجة',
        integrity: 'تأثير محدود — تعديلات طفيفة محتملة',
        availability: 'تأثير معتدل — إزعاج مؤقت للخدمات',
      },
      Q2: {
        confidentiality: 'تأثير ضئيل — الوصول لمعلومات عامة فقط',
        integrity: 'تأثير منخفض — لا توجد تعديلات متوقعة',
        availability: 'تأثير طفيف — بدون تأثير ملحوظ',
      },
      Q1: {
        confidentiality: 'بدون تأثير',
        integrity: 'بدون تأثير',
        availability: 'بدون تأثير',
      },
    };

    const impact = impactLevels[event.tier];

    return `**السرية (Confidentiality):** ${impact.confidentiality}

**السلامة (Integrity):** ${impact.integrity}

**التوفر (Availability):** ${impact.availability}

**التصنيف الإجمالي:** ${this.getOverallRisk(event.tier)}`;
  }

  /**
   * توليد التوصيات العملية
   */
  private static generateRecommendations(event: ThreatEvent): string[] {
    const baseRecommendations = {
      Q5: [
        'تفعيل بروتوكول الاستجابة للحوادث الحرجة فوراً',
        'عزل الأنظمة المتأثرة عن الشبكة الرئيسية',
        'إجراء تحليل جنائي رقمي شامل',
        'إخطار الجهات المعنية وفق سياسة الإفصاح',
        'تفعيل خطة استمرارية الأعمال',
      ],
      Q4: [
        'مراجعة سجلات الأمان بحثاً عن نشاط مشابه',
        'تحديث قواعد الكشف والمنع',
        'تعزيز المراقبة على الأنظمة الحرجة',
        'جدولة مراجعة أمنية شاملة خلال 24 ساعة',
      ],
      Q3: [
        'توثيق الحادثة للمراجعة الدورية',
        'تحديث قواعد بيانات التهديدات',
        'متابعة المؤشرات خلال الـ48 ساعة القادمة',
      ],
      Q2: [
        'الاحتفاظ بالسجلات للتحليل الإحصائي',
        'مراجعة ضمن التقرير الشهري',
      ],
      Q1: [
        'لا توجد إجراءات مطلوبة — للعلم فقط',
      ],
    };

    const categorySpecific = this.getCategoryRecommendations(event.category);

    return [...baseRecommendations[event.tier], ...categorySpecific];
  }

  /**
   * توليد السياق التاريخي
   */
  private static generateContext(event: ThreatEvent): string {
    const categoryHistory = {
      quantum_attack: 'الهجمات الكمومية تمثل التهديد المستقبلي الأخطر للتشفير التقليدي. مع تطور الحواسيب الكمومية، أصبح من الضروري الانتقال إلى التشفير ما بعد الكمومي (Post-Quantum Cryptography).',

      classical_cryptanalysis: 'تحليل التشفير الكلاسيكي يستند إلى عقود من البحث الأكاديمي. تقنيات مثل التحليل التفاضلي والخطي لا تزال فعّالة ضد التشفير سيء التنفيذ.',

      network_intrusion: 'محاولات الاختراق الشبكي شهدت تطوراً كبيراً من الهجمات البسيطة إلى التهديدات المستمرة المتقدمة (APTs) التي ترعاها الدول.',

      data_exfiltration: 'تسريب البيانات يمكن أن يحدث بطرق متعددة — من الهجمات السيبرانية المعقدة إلى التهديدات الداخلية. الوقاية تتطلب نهجاً متعدد الطبقات.',

      protocol_manipulation: 'التلاعب بالبروتوكولات يستغل نقاط الضعف في تصميم أو تنفيذ بروتوكولات الاتصال، مثل هجمات Man-in-the-Middle.',

      side_channel: 'هجمات القنوات الجانبية تستخرج المعلومات من التنفيذ المادي للخوارزميات — مثل استهلاك الطاقة أو الإشعاع الكهرومغناطيسي.',

      zero_day: 'ثغرات يوم الصفر هي نقاط ضعف غير معروفة للبائع، مما يجعلها خطيرة للغاية. السوق السوداء لهذه الثغرات مزدهر ويقدّر بملايين الدولارات.',

      advanced_persistent_threat: 'التهديدات المستمرة المتقدمة عادة ترعاها دول أو منظمات ذات موارد ضخمة، وتستمر لأشهر أو سنوات بهدف التجسس أو التخريب.',
    };

    return categoryHistory[event.category];
  }

  /**
   * استخلاص الدروس المستفادة
   */
  private static generateLessonsLearned(event: ThreatEvent): string[] {
    const lessons: string[] = [];

    // دروس عامة حسب المستوى
    if (event.tier === 'Q5' || event.tier === 'Q4') {
      lessons.push('الدفاع العميق (Defense in Depth) ضروري — لا توجد طبقة أمان واحدة كافية');
      lessons.push('الكشف المبكر يقلل الأضرار بشكل كبير — المراقبة المستمرة أساسية');
    }

    // دروس حسب نوع التهديد
    switch (event.category) {
      case 'quantum_attack':
        lessons.push('التشفير ما بعد الكمومي لم يعد خياراً بل ضرورة');
        lessons.push('يجب البدء بخطة الانتقال إلى PQC الآن قبل فوات الأوان');
        break;

      case 'network_intrusion':
        lessons.push('التقسيم الشبكي (Network Segmentation) يحد من انتشار الاختراق');
        lessons.push('مبدأ الصلاحيات الأقل (Least Privilege) يجب تطبيقه بصرامة');
        break;

      case 'zero_day':
        lessons.push('حتى الأنظمة المحدّثة ليست محصّنة تماماً');
        lessons.push('أنظمة الكشف عن السلوك الشاذ (Behavioral Detection) حيوية');
        break;

      default:
        lessons.push('التدريب الأمني المستمر للفريق التقني ضروري');
    }

    if (event.status === 'mitigated' || event.status === 'blocked') {
      lessons.push('الاستثمار في الأمن السيبراني أثبت جدواه في هذه الحالة');
    }

    return lessons;
  }

  // ═══════════════════════════════════════════════════════════════
  // دوال مساعدة
  // ═══════════════════════════════════════════════════════════════

  private static getCategoryContext(category: ThreatCategory): {
    nameAr: string;
    explanation: string;
    technicalNote: string;
  } {
    const contexts = {
      quantum_attack: {
        nameAr: 'هجوم كمومي',
        explanation: 'محاولة استغلال الحوسبة الكمومية لكسر التشفير التقليدي',
        technicalNote: 'خوارزمية Shor وGrover تشكل تهديداً للـRSA وECC',
      },
      classical_cryptanalysis: {
        nameAr: 'تحليل تشفير كلاسيكي',
        explanation: 'استخدام تقنيات رياضية تقليدية لكسر أو إضعاف التشفير',
        technicalNote: 'التحليل التفاضلي، الخطي، أو القائم على التكرار',
      },
      network_intrusion: {
        nameAr: 'اختراق شبكي',
        explanation: 'محاولة الوصول غير المصرّح به إلى الشبكة أو الأنظمة',
        technicalNote: 'فحص المنافذ، استغلال الثغرات، أو هندسة اجتماعية',
      },
      data_exfiltration: {
        nameAr: 'تسريب بيانات',
        explanation: 'نقل غير مصرّح به للبيانات من النظام إلى جهة خارجية',
        technicalNote: 'قنوات سرية، DNS tunneling، أو بروتوكولات مشفرة',
      },
      protocol_manipulation: {
        nameAr: 'تلاعب بروتوكولي',
        explanation: 'التلاعب بالبروتوكولات لخداع الأنظمة أو التنصت على الاتصالات',
        technicalNote: 'MITM، session hijacking، أو protocol downgrade',
      },
      side_channel: {
        nameAr: 'هجوم قناة جانبية',
        explanation: 'استخراج معلومات من التنفيذ المادي للنظام',
        technicalNote: 'Timing attacks، power analysis، أو EM radiation',
      },
      zero_day: {
        nameAr: 'ثغرة يوم الصفر',
        explanation: 'استغلال نقطة ضعف غير معروفة للبائع أو المجتمع الأمني',
        technicalNote: 'لا يوجد patch متاح — يتطلب استجابة فورية',
      },
      advanced_persistent_threat: {
        nameAr: 'تهديد متقدم مستمر',
        explanation: 'حملة هجومية طويلة الأمد وعالية التطور',
        technicalNote: 'تقنيات متقدمة، موارد كبيرة، أهداف استراتيجية',
      },
    };

    return contexts[category];
  }

  private static getCategoryStory(event: ThreatEvent): {
    introduction: string;
    significance: string;
    technicalDetails: string;
  } {
    // هنا يمكن توليد قصص سردية مخصصة لكل نوع
    const intro = `في عالم الأمن السيبراني، كل حدث يروي قصة. هذا الحدث [${event.id}] ليس مجرد رقم في السجلات، بل محاولة حقيقية ${event.status === 'blocked' ? 'تم إحباطها' : 'تم رصدها'} لاستهداف أنظمتنا.`;

    const significance = `هذا النوع من التهديدات ${event.tier === 'Q5' ? 'يمثل أخطر أنواع الهجمات' : event.tier === 'Q4' ? 'يتطلب استجابة سريعة' : 'يستحق التوثيق والتحليل'} لأنه يكشف عن ${this.getCategoryContext(event.category).explanation}.`;

    const technical = `التحليل الفني يشير إلى ${this.getCategoryContext(event.category).technicalNote}. البيانات المرصودة تحتوي على ${Object.keys(event.technicalData).length} مؤشر تقني.`;

    return {
      introduction: intro,
      significance,
      technicalDetails: technical,
    };
  }

  private static buildTimeline(event: ThreatEvent): string {
    const timestamp = new Date(event.timestamp);
    const detectionTime = new Date(timestamp.getTime() + Math.random() * 1000);
    const responseTime = new Date(detectionTime.getTime() + Math.random() * 5000);

    return `- **${timestamp.toLocaleTimeString('ar-SA')}** — بداية النشاط المشبوه
- **${detectionTime.toLocaleTimeString('ar-SA')}** — الكشف بواسطة QNIDS
- **${responseTime.toLocaleTimeString('ar-SA')}** — بدء الاستجابة الآلية
- **الآن** — الحالة: ${event.status === 'blocked' ? 'محجوب' : event.status === 'mitigated' ? 'تمت المعالجة' : 'قيد التحقيق'}`;
  }

  private static describeResponse(event: ThreatEvent): string {
    const responses = {
      blocked: 'الأنظمة الدفاعية قامت بحجب الهجوم تلقائياً قبل وصوله للأنظمة الحرجة. لم يتم اختراق أي طبقة دفاعية.',
      mitigated: 'تم اكتشاف التهديد ومعالجته بنجاح. الأنظمة المتأثرة تم عزلها وتنظيفها.',
      detected: 'الحدث تحت المراقبة المستمرة. فريق الاستجابة للحوادث على أهبة الاستعداد.',
      investigating: 'جارٍ التحقيق التفصيلي في طبيعة التهديد ومصدره وتأثيره المحتمل.',
    };

    return responses[event.status];
  }

  private static extractIndicators(event: ThreatEvent): string {
    const indicators: string[] = [];

    if (event.source) {
      indicators.push(`- **IP المصدر:** \`${event.source}\``);
    }

    if (event.target) {
      indicators.push(`- **الهدف:** \`${event.target}\``);
    }

    indicators.push(`- **التوقيع:** \`${event.id}\``);
    indicators.push(`- **الطابع الزمني:** \`${new Date(event.timestamp).toISOString()}\``);

    return indicators.join('\n');
  }

  private static identifyAttackVectors(event: ThreatEvent): string {
    const vectors = {
      quantum_attack: '- خوارزمية كمومية (Shor/Grover)\n- استهداف RSA/ECC التقليدي',
      classical_cryptanalysis: '- تحليل رياضي للتشفير\n- محاولة القوة الغاشمة المحسّنة',
      network_intrusion: '- فحص المنافذ\n- استغلال ثغرات معروفة\n- محاولة تصعيد الصلاحيات',
      data_exfiltration: '- قنوات اتصال سرية\n- تشفير البيانات المسروقة\n- DNS tunneling',
      protocol_manipulation: '- Man-in-the-Middle\n- Protocol downgrade\n- Session hijacking',
      side_channel: '- Timing analysis\n- Power consumption monitoring\n- EM radiation analysis',
      zero_day: '- استغلال ثغرة غير معروفة\n- لا يوجد signature معروف',
      advanced_persistent_threat: '- تقنيات متعددة ومتطورة\n- استمرارية طويلة الأمد\n- تخفٍ متقدم',
    };

    return vectors[event.category];
  }

  private static mapToMITRE(event: ThreatEvent): string {
    // تعيين تكتيكات MITRE ATT&CK
    const mitre = {
      quantum_attack: 'TA0006 - Credential Access (محاولة كسر التشفير)',
      classical_cryptanalysis: 'TA0006 - Credential Access',
      network_intrusion: 'TA0001 - Initial Access\nTA0003 - Persistence',
      data_exfiltration: 'TA0010 - Exfiltration',
      protocol_manipulation: 'TA0009 - Collection\nTA0011 - Command and Control',
      side_channel: 'TA0006 - Credential Access',
      zero_day: 'TA0002 - Execution\nTA0004 - Privilege Escalation',
      advanced_persistent_threat: 'Multiple TTPs عبر كامل سلسلة القتل السيبرانية',
    };

    return mitre[event.category];
  }

  private static getCategoryRecommendations(category: ThreatCategory): string[] {
    const recommendations = {
      quantum_attack: [
        'تسريع خطة الانتقال إلى PQC (CRYSTALS-Kyber, Dilithium)',
        'مراجعة جميع الخوارزميات التشفيرية الحالية',
      ],
      classical_cryptanalysis: [
        'التأكد من استخدام أطوال مفاتيح كافية (>2048 bits)',
        'تفعيل Perfect Forward Secrecy',
      ],
      network_intrusion: [
        'تطبيق Zero Trust Architecture',
        'تحديث جميع الأنظمة والبرمجيات',
        'تفعيل المصادقة متعددة العوامل',
      ],
      data_exfiltration: [
        'تطبيق Data Loss Prevention (DLP)',
        'مراقبة كل حركة البيانات الخارجة',
      ],
      protocol_manipulation: [
        'إلزامية استخدام TLS 1.3+',
        'تطبيق Certificate Pinning',
      ],
      side_channel: [
        'استخدام constant-time implementations',
        'تطبيق حماية فيزيائية للخوادم الحرجة',
      ],
      zero_day: [
        'تطبيق WAF وIPS بأحدث القواعد',
        'عزل الأنظمة الحرجة في شبكات منفصلة',
      ],
      advanced_persistent_threat: [
        'تنفيذ Threat Hunting استباقي',
        'الاشتراك في خدمات Threat Intelligence',
        'مراجعة شاملة لجميع الوصولات المميزة',
      ],
    };

    return recommendations[category] || [];
  }

  private static getOverallRisk(tier: QuantumThreatTier): string {
    const risks = {
      Q5: '🔴 خطر حرج — يتطلب استجابة فورية على مستوى الإدارة التنفيذية',
      Q4: '🟠 خطر عالي — يحتاج تدخل فريق الأمن السيبراني خلال ساعات',
      Q3: '🟡 خطر متوسط — مراقبة مكثفة وتخطيط للتخفيف',
      Q2: '🟢 خطر منخفض — توثيق وتحليل ضمن الدورة الأمنية المعتادة',
      Q1: '🔵 معلوماتي — للعلم والأرشفة',
    };

    return risks[tier];
  }
}

// ═══════════════════════════════════════════════════════════════
// أمثلة وأنماط استخدام
// ═══════════════════════════════════════════════════════════════

/**
 * مثال: توليد سردية لهجوم كمومي
 */
export function exampleQuantumAttackNarrative(): ThreatNarrative {
  const event: ThreatEvent = {
    id: 'QA-2026-04-15-001',
    timestamp: Date.now(),
    category: 'quantum_attack',
    tier: 'Q5',
    status: 'blocked',
    source: '203.0.113.42',
    target: 'RSA-2048 Key Exchange',
    technicalData: {
      algorithm: 'Shor',
      targetKeySize: 2048,
      estimatedQubits: 4096,
      successProbability: 0.73,
      detectionMethod: 'Quantum Signature Analysis',
    },
  };

  return ClaudeNarrativeEngine.generateNarrative(event, 'technical');
}

/**
 * مثال: سردية تعليمية لاختراق شبكي
 */
export function exampleEducationalNarrative(): ThreatNarrative {
  const event: ThreatEvent = {
    id: 'NI-2026-04-15-007',
    timestamp: Date.now() - 3600000, // منذ ساعة
    category: 'network_intrusion',
    tier: 'Q3',
    status: 'investigating',
    source: '198.51.100.88',
    technicalData: {
      scannedPorts: [22, 80, 443, 3389, 8080],
      suspiciousPackets: 1247,
      geoLocation: 'Unknown',
    },
  };

  return ClaudeNarrativeEngine.generateNarrative(event, 'educational');
}
