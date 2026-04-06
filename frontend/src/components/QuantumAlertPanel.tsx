/**
 * QuantumAlertPanel — لوحة تنبيهات نظام الكم
 * تعرض تنبيهات النظام بألوان تدل على مستوى الخطورة
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Info, AlertCircle, X, Trash2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** نوع التنبيه */
export type AlertLevel = 'info' | 'warning' | 'critical';

/** بنية التنبيه */
export interface QuantumAlert {
  /** معرف فريد */
  id: string;
  /** نوع التنبيه */
  level: AlertLevel;
  /** عنوان التنبيه */
  title: string;
  /** رسالة التفاصيل */
  message: string;
  /** وقت الإنشاء (timestamp) */
  timestamp: number;
  /** مصدر التنبيه */
  source: string;
}

// ═══════════════════════════════════════════════════════════════
// ثوابت التصميم
// ═══════════════════════════════════════════════════════════════

const ALERT_STYLES: Record<AlertLevel, {
  bg: string; border: string; text: string; icon: React.ElementType;
}> = {
  info: {
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: Info,
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: AlertTriangle,
  },
  critical: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: AlertCircle,
  },
};

/** توليد معرف فريد */
function generateId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** تنسيق الوقت */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════════════
// hook: useQuantumAlerts
// ═══════════════════════════════════════════════════════════════

/** قائمة التنبيهات الدورية المحاكاة */
const SIMULATED_ALERTS: Array<Omit<QuantumAlert, 'id' | 'timestamp'>> = [
  {
    level: 'info',
    title: 'حالة النظام مستقرة',
    message: 'جميع محاكيات الكم تعمل بكفاءة طبيعية. لا توجد أخطاء منطقية.',
    source: 'QEC-Monitor',
  },
  {
    level: 'warning',
    title: 'معدل التقاط التشفير مرتفع',
    message: 'معدل التقاط بروتوكول BB84 تجاوز 87%. يُنصح بمراجعة قناة الاتصال.',
    source: 'QKD-Engine',
  },
  {
    level: 'info',
    title: 'اكتمل تدريب QNN',
    message: 'وصلت دقة الشبكة العصبية الكمومية إلى 94.7% بعد 150 دورة.',
    source: 'QNN-Trainer',
  },
  {
    level: 'critical',
    title: 'دقة QNN تحت الحد الأدنى',
    message: 'الدقة انخفضت إلى 54.2% — أقل من الحد المطلوب (60%). يُنصح بإعادة ضبط المعاملات.',
    source: 'QNN-Trainer',
  },
  {
    level: 'warning',
    title: 'مستوى الضوضاء الكمومية مرتفع',
    message: 'ضوضاء الإزالة المستقطبة وصلت إلى 15%. قد تتأثر نتائج المحاكاة.',
    source: 'Noise-Simulator',
  },
  {
    level: 'info',
    title: 'تحديث PQC',
    message: 'تم توليد أزواج مفاتيح Kyber-768 جديدة. مستوى الأمان: 192 بت.',
    source: 'PQC-Engine',
  },
];

/**
 * Hook لإدارة تنبيهات النظام الكمومي
 * يُولّد تنبيهات عشوائية كل 30 ثانية محاكاةً للنظام
 */
export function useQuantumAlerts() {
  const [alerts, setAlerts] = useState<QuantumAlert[]>([
    // تنبيه افتراضي عند البداية
    {
      id: generateId(),
      level: 'info',
      title: 'المنصة جاهزة',
      message: 'تم تشغيل جميع محركات الكم بنجاح. النظام جاهز للعمل.',
      timestamp: Date.now(),
      source: 'System',
    },
  ]);

  const addAlert = useCallback((alert: Omit<QuantumAlert, 'id' | 'timestamp'>) => {
    setAlerts((prev) => {
      // الحد الأقصى 10 تنبيهات — يحذف الأقدم
      const newAlert: QuantumAlert = {
        ...alert,
        id: generateId(),
        timestamp: Date.now(),
      };
      const updated = [newAlert, ...prev];
      return updated.slice(0, 10);
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // توليد تنبيهات عشوائية كل 30 ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      const randomAlert = SIMULATED_ALERTS[
        Math.floor(Math.random() * SIMULATED_ALERTS.length)
      ];
      addAlert(randomAlert);
    }, 30000);

    return () => clearInterval(timer);
  }, [addAlert]);

  return { alerts, addAlert, dismissAlert, clearAlerts };
}

// ═══════════════════════════════════════════════════════════════
// مكوّن QuantumAlertPanel
// ═══════════════════════════════════════════════════════════════

interface QuantumAlertPanelProps {
  alerts: QuantumAlert[];
  onDismiss: (id: string) => void;
  onClear: () => void;
}

/** مكوّن عرض تنبيه واحد */
const AlertItem: React.FC<{ alert: QuantumAlert; onDismiss: (id: string) => void }> = ({
  alert,
  onDismiss,
}) => {
  const style = ALERT_STYLES[alert.level];
  const Icon = style.icon;

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border ${style.bg} ${style.border} transition-all animate-in fade-in duration-200`}
      role="alert"
      aria-live={alert.level === 'critical' ? 'assertive' : 'polite'}
    >
      <Icon size={16} className={`${style.text} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${style.text}`}>{alert.title}</span>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-slate-600 hover:text-slate-400 flex-shrink-0"
            aria-label="إغلاق التنبيه"
          >
            <X size={12} />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{alert.message}</p>
        <div className="flex gap-3 mt-1 text-[9px] font-mono text-slate-600">
          <span>{alert.source}</span>
          <span>{formatTime(alert.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * لوحة تنبيهات نظام الكم
 */
export const QuantumAlertPanel: React.FC<QuantumAlertPanelProps> = ({
  alerts,
  onDismiss,
  onClear,
}) => {
  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount = alerts.filter((a) => a.level === 'warning').length;

  return (
    <div
      className="bg-slate-900/80 rounded-xl border border-white/10 p-4"
      dir="rtl"
      role="region"
      aria-label="تنبيهات النظام الكمومي"
    >
      {/* ─── الرأس ─── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-400" />
          <span className="text-sm font-semibold text-white">تنبيهات النظام</span>
          {/* عدادات */}
          {criticalCount > 0 && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
              {criticalCount} حرج
            </span>
          )}
          {warningCount > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
              {warningCount} تحذير
            </span>
          )}
        </div>
        {alerts.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="مسح جميع التنبيهات"
          >
            <Trash2 size={11} />
            مسح الكل
          </button>
        )}
      </div>

      {/* ─── القائمة ─── */}
      {alerts.length === 0 ? (
        <div className="text-center py-4 text-[11px] font-mono text-slate-600">
          لا توجد تنبيهات نشطة
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuantumAlertPanel;
