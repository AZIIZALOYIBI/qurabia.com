/**
 * ============================================================
 * memory/types.ts – أنواع نظام الذاكرة المهيكلة
 * Structured Memory System – مُقتبس من نظام memdir
 * ============================================================
 * نظام ذاكرة ملفات مهيكل مع أنواع (user/feedback/project/reference)،
 * ترويسة frontmatter، وتحذيرات حداثة.
 */

// ─── أنواع الذاكرة ──────────────────────────────────────────
export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

// ─── ترويسة الذاكرة (frontmatter) ──────────────────────────
export interface MemoryHeader {
  filename: string;
  filePath: string;
  mtimeMs: number;
  description: string | null;
  type: MemoryType | undefined;
}

// ─── ذاكرة ذات صلة ──────────────────────────────────────────
export interface RelevantMemory {
  path: string;
  mtimeMs: number;
  content?: string;
}

// ─── عنصر ذاكرة كامل ────────────────────────────────────────
export interface MemoryEntry {
  id: string;
  name: string;
  description: string;
  type: MemoryType;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

// ─── ما لا يجب حفظه ─────────────────────────────────────────
export const WHAT_NOT_TO_SAVE = [
  'أنماط الكود أو البنية (يمكن استنتاجها بقراءة الكود)',
  'تاريخ Git أو التغييرات الأخيرة',
  'حلول تصحيح الأخطاء (الإصلاح في الكود)',
  'تفاصيل المهام المؤقتة',
  'أي أسرار أو بيانات حساسة',
];

// ─── متى يجب الوصول للذاكرة ─────────────────────────────────
export const WHEN_TO_ACCESS = [
  'عند بدء مهمة جديدة تتطلب سياق المشروع',
  'عند الحاجة لمعرفة تفضيلات المستخدم',
  'عند مراجعة ملاحظات سابقة عن المشروع',
  'عند البحث عن مراجع خارجية (Linear, Grafana, etc.)',
];
