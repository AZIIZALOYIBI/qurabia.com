/**
 * ============================================================
 * output-styles/types.ts - انواع نظام انماط المخرجات
 * Output Styles System - مقتبس من نظام Output Styles
 * ============================================================
 */

export interface OutputStyleConfig {
  name: string;
  description: string;
  prompt: string;
  keepCodingInstructions?: boolean;
}

export const BUILT_IN_STYLES: OutputStyleConfig[] = [
  {
    name: 'technical',
    description: 'مخرجات تقنية مفصلة مع ارقام وبيانات دقيقة',
    prompt: 'قدم المخرجات بتنسيق تقني مفصل يتضمن: القيم العددية الدقيقة، وحدات القياس، هوامش الخطا، والمعادلات المستخدمة. استخدم الترميز العلمي للارقام الكبيرة والصغيرة.',
    keepCodingInstructions: true,
  },
  {
    name: 'simplified',
    description: 'مخرجات مبسطة وسهلة الفهم',
    prompt: 'قدم المخرجات بلغة بسيطة وواضحة يفهمها غير المتخصصين. استخدم تشبيهات من الحياة اليومية لشرح المفاهيم الكمية المعقدة. تجنب المصطلحات التقنية قدر الامكان.',
    keepCodingInstructions: false,
  },
  {
    name: 'academic',
    description: 'مخرجات بتنسيق اكاديمي للابحاث',
    prompt: 'قدم المخرجات بتنسيق ورقة بحثية اكاديمية: ملخص، مقدمة، منهجية، نتائج، مناقشة، واستنتاج. اضف مراجع وهمية ذات صلة. استخدم تنسيق LaTeX للمعادلات.',
    keepCodingInstructions: true,
  },
  {
    name: 'visual',
    description: 'مخرجات مرئية مع رسوم ASCII وجداول',
    prompt: 'قدم المخرجات بشكل مرئي جذاب باستخدام: رسوم ASCII، جداول منظمة، اشرطة تقدم نصية، ومخططات بسيطة. ركز على العرض البصري للبيانات.',
    keepCodingInstructions: false,
  },
  {
    name: 'concise',
    description: 'مخرجات مختصرة وموجزة',
    prompt: 'قدم المخرجات في اقل عدد ممكن من الكلمات. استخدم نقاط مختصرة وجداول صغيرة. تجنب الشروحات الطويلة. المطلوب: البيانات الاساسية فقط.',
    keepCodingInstructions: true,
  },
];
