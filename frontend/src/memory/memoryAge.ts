/**
 * ============================================================
 * memory/memoryAge.ts – نظام حداثة الذاكرة
 * Structured Memory System
 * ============================================================
 * دوال بحتة لحساب عمر الذاكرة وتحذيرات الحداثة.
 */

const MS_PER_DAY = 86_400_000;

/**
 * عدد الأيام منذ آخر تعديل (تقريب لأسفل).
 */
export function memoryAgeDays(mtimeMs: number): number {
  return Math.max(0, Math.floor((Date.now() - mtimeMs) / MS_PER_DAY));
}

/**
 * نص عمر الذاكرة القابل للقراءة.
 */
export function memoryAge(mtimeMs: number): string {
  const days = memoryAgeDays(mtimeMs);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  return `منذ ${days} يوم`;
}

/**
 * نص تحذير الحداثة (فارغ إذا كانت الذاكرة حديثة).
 */
export function memoryFreshnessText(mtimeMs: number): string {
  const days = memoryAgeDays(mtimeMs);
  if (days <= 1) return '';
  return `هذه الذاكرة عمرها ${days} يوم. الذكريات هي ملاحظات لحظية وليست حالة حية — الادعاءات حول سلوك الكود أو اقتباسات الملفات قد تكون قديمة. تحقق من الكود الحالي قبل التأكيد كحقيقة.`;
}

/**
 * تحذير الحداثة مغلّف في وسم نظام.
 */
export function memoryFreshnessNote(mtimeMs: number): string {
  const text = memoryFreshnessText(mtimeMs);
  if (!text) return '';
  return `⚠️ ${text}`;
}
