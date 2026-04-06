/**
 * QuantumAuditLog — جدول سجل تدقيق النظام الكمومي
 * يعرض آخر 50 عملية مع إمكانية الفلترة والتصدير
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Download, Trash2, Filter, FileText } from 'lucide-react';
import { useAuditLog, type LogStatus, type LogModule } from '../hooks/useAuditLog';

// ═══════════════════════════════════════════════════════════════
// ثوابت التصميم
// ═══════════════════════════════════════════════════════════════

const STATUS_STYLES: Record<LogStatus, { bg: string; text: string; label: string }> = {
  success: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', label: 'نجاح' },
  error: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'خطأ' },
  info: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'معلومات' },
};

const ALL_MODULES: (LogModule | 'all')[] = [
  'all', 'QNN', 'QEC', 'PQC', 'QKD', 'Grover', 'QAOA', 'VQE', 'Analytics', 'System',
];
const ALL_STATUSES: (LogStatus | 'all')[] = ['all', 'success', 'error', 'info'];

/** تنسيق الوقت */
function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

/** تنزيل نص كملف */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
// مكوّن QuantumAuditLog
// ═══════════════════════════════════════════════════════════════

/**
 * جدول سجل التدقيق الكمومي
 */
export const QuantumAuditLog: React.FC = () => {
  const { logs, clearLog, exportCSV, exportJSON } = useAuditLog();
  const [moduleFilter, setModuleFilter] = useState<LogModule | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LogStatus | 'all'>('all');

  /** السجلات المفلترة */
  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (moduleFilter !== 'all' && entry.module !== moduleFilter) return false;
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      return true;
    });
  }, [logs, moduleFilter, statusFilter]);

  const handleExportCSV = useCallback(() => {
    const csv = exportCSV();
    downloadFile(csv, `qurabia-audit-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  }, [exportCSV]);

  const handleExportJSON = useCallback(() => {
    const json = exportJSON();
    downloadFile(json, `qurabia-audit-${Date.now()}.json`, 'application/json');
  }, [exportJSON]);

  return (
    <div
      className="bg-slate-900/80 rounded-xl border border-white/10 p-5"
      dir="rtl"
      role="region"
      aria-label="سجل تدقيق النظام الكمومي"
    >
      {/* ─── الرأس ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white">سجل التدقيق</h2>
          <span className="text-[10px] font-mono text-slate-500">
            {filteredLogs.length} / {logs.length} سجل
          </span>
        </div>

        {/* أزرار التصدير */}
        <div className="flex gap-2 mr-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-900/20 hover:bg-emerald-900/40 transition-colors"
            aria-label="تصدير CSV"
          >
            <Download size={11} />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-blue-400 border border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 transition-colors"
            aria-label="تصدير JSON"
          >
            <Download size={11} />
            JSON
          </button>
          <button
            onClick={clearLog}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-red-400 border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 transition-colors"
            aria-label="مسح السجل"
          >
            <Trash2 size={11} />
            مسح
          </button>
        </div>
      </div>

      {/* ─── الفلاتر ─── */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* فلتر الوحدة */}
        <div className="flex items-center gap-1.5">
          <Filter size={11} className="text-slate-500" />
          <span className="text-[10px] font-mono text-slate-500">الوحدة:</span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as LogModule | 'all')}
            className="bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300 px-2 py-1 focus:outline-none focus:border-violet-500"
            aria-label="فلتر الوحدة"
          >
            {ALL_MODULES.map((m) => (
              <option key={m} value={m}>{m === 'all' ? 'الكل' : m}</option>
            ))}
          </select>
        </div>

        {/* فلتر الحالة */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LogStatus | 'all')}
            className="bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300 px-2 py-1 focus:outline-none focus:border-violet-500"
            aria-label="فلتر الحالة"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'الكل' : STATUS_STYLES[s as LogStatus].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── الجدول ─── */}
      <div className="overflow-auto max-h-96 rounded-lg border border-white/5">
        <table className="w-full text-[11px] font-mono" role="table">
          <thead className="bg-slate-800/80 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-right text-slate-400 font-semibold whitespace-nowrap">الوقت</th>
              <th className="px-3 py-2 text-right text-slate-400 font-semibold whitespace-nowrap">العملية</th>
              <th className="px-3 py-2 text-right text-slate-400 font-semibold whitespace-nowrap">الوحدة</th>
              <th className="px-3 py-2 text-right text-slate-400 font-semibold">التفاصيل</th>
              <th className="px-3 py-2 text-right text-slate-400 font-semibold whitespace-nowrap">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-600">
                  لا توجد سجلات تطابق الفلتر المحدد
                </td>
              </tr>
            ) : (
              filteredLogs.map((entry) => {
                const statusStyle = STATUS_STYLES[entry.status];
                return (
                  <tr
                    key={entry.id}
                    className="border-t border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                      {entry.operation}
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-slate-800 text-violet-400 px-1.5 py-0.5 rounded text-[9px]">
                        {entry.module}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 max-w-xs truncate">
                      {entry.details}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuantumAuditLog;
