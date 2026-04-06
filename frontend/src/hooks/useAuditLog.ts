/**
 * useAuditLog — Hook لتسجيل عمليات النظام الكمومي
 * يوفر دوال لإضافة السجلات وتصديرها بصيغ CSV و JSON
 */
import { useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** حالة سجل العملية */
export type LogStatus = 'success' | 'error' | 'info';

/** وحدات النظام */
export type LogModule =
  | 'QNN'
  | 'QEC'
  | 'PQC'
  | 'QKD'
  | 'Grover'
  | 'QAOA'
  | 'VQE'
  | 'Analytics'
  | 'System';

/** بنية سجل عملية */
export interface AuditLogEntry {
  /** معرف فريد */
  id: string;
  /** وقت التسجيل (timestamp) */
  timestamp: number;
  /** اسم العملية */
  operation: string;
  /** الوحدة المصدر */
  module: LogModule;
  /** تفاصيل العملية */
  details: string;
  /** حالة العملية */
  status: LogStatus;
}

/** إدخال جديد في السجل (بدون id و timestamp) */
export type NewAuditLogEntry = Omit<AuditLogEntry, 'id' | 'timestamp'>;

// ═══════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════

/** توليد معرف فريد */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * تحويل مصفوفة السجلات إلى CSV
 */
function toCSV(entries: AuditLogEntry[]): string {
  const headers = ['id', 'timestamp', 'operation', 'module', 'details', 'status'];
  const rows = entries.map((e) => [
    e.id,
    new Date(e.timestamp).toISOString(),
    `"${e.operation.replace(/"/g, '""')}"`,
    e.module,
    `"${e.details.replace(/"/g, '""')}"`,
    e.status,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ═══════════════════════════════════════════════════════════════
// سجلات افتراضية للتهيئة
// ═══════════════════════════════════════════════════════════════

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: generateLogId(),
    timestamp: Date.now() - 120000,
    operation: 'system_startup',
    module: 'System',
    details: 'تم تشغيل منصة QURABIA بنجاح — جميع المحركات جاهزة',
    status: 'success',
  },
  {
    id: generateLogId(),
    timestamp: Date.now() - 90000,
    operation: 'qnn_training_start',
    module: 'QNN',
    details: 'بدء تدريب الشبكة العصبية الكمومية — المعمارية: Standard, 16 كيوبت',
    status: 'info',
  },
  {
    id: generateLogId(),
    timestamp: Date.now() - 60000,
    operation: 'pqc_keygen',
    module: 'PQC',
    details: 'توليد زوج مفاتيح Kyber-768 — مستوى الأمان: 192 بت',
    status: 'success',
  },
  {
    id: generateLogId(),
    timestamp: Date.now() - 30000,
    operation: 'qec_cycle',
    module: 'QEC',
    details: 'اكتملت دورة تصحيح الأخطاء — نوع الكود: Toric, تم تصحيح 12 خطأ',
    status: 'success',
  },
];

// ═══════════════════════════════════════════════════════════════
// Hook الرئيسي
// ═══════════════════════════════════════════════════════════════

/**
 * Hook لإدارة سجل تدقيق النظام الكمومي
 *
 * @returns دوال ومتغيرات إدارة السجل
 */
export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);

  /**
   * إضافة سجل جديد
   * @param entry - إدخال السجل (بدون id و timestamp)
   */
  const log = useCallback((entry: NewAuditLogEntry) => {
    setLogs((prev) => {
      const newEntry: AuditLogEntry = {
        ...entry,
        id: generateLogId(),
        timestamp: Date.now(),
      };
      // الاحتفاظ بآخر 50 سجلاً فقط
      const updated = [newEntry, ...prev];
      return updated.slice(0, 50);
    });
  }, []);

  /**
   * مسح جميع السجلات
   */
  const clearLog = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * تصدير السجلات بصيغة CSV
   * @returns محتوى CSV كـ string
   */
  const exportCSV = useCallback((): string => {
    return toCSV(logs);
  }, [logs]);

  /**
   * تصدير السجلات بصيغة JSON
   * @returns محتوى JSON كـ string منسّق
   */
  const exportJSON = useCallback((): string => {
    return JSON.stringify(
      logs.map((e) => ({ ...e, timestampISO: new Date(e.timestamp).toISOString() })),
      null,
      2,
    );
  }, [logs]);

  return { logs, log, clearLog, exportCSV, exportJSON };
}
