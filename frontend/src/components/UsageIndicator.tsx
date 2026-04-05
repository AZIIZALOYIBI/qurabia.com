/**
 * UsageIndicator — مؤشر الاستهلاك اليومي
 *
 * يعرض نسبة استهلاك المستخدم من حدود خطته اليومية.
 * يتصل بـ usage_tracker في الباك-إند لجلب البيانات.
 */
import React from 'react';
import { Zap } from 'lucide-react';

// ─── أنواع ───────────────────────────────────────────────────────

export type PlanId = 'explorer' | 'researcher' | 'professional' | 'enterprise';

export interface UsageData {
  /** اسم الخاصية (مثل: "تحليل AI", "توائم كمومية") */
  label: string;
  /** الاستهلاك الحالي */
  used: number;
  /** الحد الأقصى (-1 = غير محدود) */
  limit: number;
  /** لون شريط التقدم */
  color?: string;
}

export interface UsageIndicatorProps {
  /** بيانات الاستهلاك */
  items: UsageData[];
  /** الخطة الحالية */
  plan: PlanId;
  /** رد الاتصال عند الضغط على الترقية */
  onUpgrade?: () => void;
  /** عرض مضغوط (بدون تفاصيل) */
  compact?: boolean;
}

// ─── حدود الخطط (مرجع محلي) ────────────────────────────────────

export const PLAN_LIMITS: Record<PlanId, Record<string, number>> = {
  explorer: {
    ai_analysis: 0,
    twin_create: 10,
    forge_ops: 20,
    cipher: 5,
    similarity: 0,
    decision: 0,
    fingerprint: 0,
    projects: 0,
  },
  researcher: {
    ai_analysis: 20,
    twin_create: 100,
    forge_ops: -1,
    cipher: 50,
    similarity: 50,
    decision: 20,
    fingerprint: 30,
    projects: 10,
  },
  professional: {
    ai_analysis: 100,
    twin_create: -1,
    forge_ops: -1,
    cipher: -1,
    similarity: -1,
    decision: -1,
    fingerprint: -1,
    projects: -1,
  },
  enterprise: {
    ai_analysis: -1,
    twin_create: -1,
    forge_ops: -1,
    cipher: -1,
    similarity: -1,
    decision: -1,
    fingerprint: -1,
    projects: -1,
  },
};

// ─── أسماء الخطط بالعربية ─────────────────────────────────────

export const PLAN_NAMES: Record<PlanId, string> = {
  explorer: 'مستكشف',
  researcher: 'باحث',
  professional: 'محترف',
  enterprise: 'مؤسسي',
};

// ─── المكون ──────────────────────────────────────────────────────

const UsageIndicator: React.FC<UsageIndicatorProps> = ({ items, plan, onUpgrade, compact }) => {
  const hasWarning = items.some(item => item.limit > 0 && item.used / item.limit >= 0.8);
  const hasExhausted = items.some(item => item.limit > 0 && item.used >= item.limit);

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 10,
          background: hasExhausted
            ? 'rgba(239, 68, 68, 0.1)'
            : hasWarning
              ? 'rgba(255, 176, 0, 0.1)'
              : 'var(--surface)',
          border: `1px solid ${hasExhausted ? 'rgba(239, 68, 68, 0.25)' : hasWarning ? 'rgba(255, 176, 0, 0.25)' : 'var(--outline)'}`,
          cursor: onUpgrade ? 'pointer' : undefined,
        }}
        onClick={onUpgrade}
        role={onUpgrade ? 'button' : undefined}
        tabIndex={onUpgrade ? 0 : undefined}
        onKeyDown={onUpgrade ? (e) => e.key === 'Enter' && onUpgrade() : undefined}
        aria-label={`خطة ${PLAN_NAMES[plan]} — ${hasExhausted ? 'تم استنفاد بعض الحدود' : 'نشط'}`}
      >
        <Zap size={14} style={{ color: hasExhausted ? 'var(--q-error)' : 'var(--p-primary)' }} />
        <span style={{ fontFamily: 'var(--font-ar)', fontSize: 12, fontWeight: 700, color: 'var(--fg-2)' }}>
          {PLAN_NAMES[plan]}
        </span>
      </div>
    );
  }

  return (
    <div
      className="ui-card"
      style={{
        padding: 20,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* العنوان */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} style={{ color: 'var(--p-primary)' }} />
          <span style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>
            الاستهلاك اليومي — {PLAN_NAMES[plan]}
          </span>
        </div>
        {onUpgrade && plan !== 'enterprise' && (
          <button
            className="ui-btn ui-btn-tonal"
            onClick={onUpgrade}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 8 }}
          >
            ترقية
          </button>
        )}
      </div>

      {/* أشرطة الاستهلاك */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => {
          const isUnlimited = item.limit === -1;
          const hasLimit = !isUnlimited && item.limit > 0;
          const percentage = hasLimit ? Math.min((item.used / item.limit) * 100, 100) : 0;
          const isExhausted = hasLimit && item.used >= item.limit;
          const isWarning = hasLimit && percentage >= 80;
          const barColor = isExhausted
            ? 'var(--q-error)'
            : isWarning
              ? 'var(--p-tertiary)'
              : item.color ?? 'var(--p-primary)';

          return (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-2)' }}>
                  {item.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isExhausted ? 'var(--q-error)' : 'var(--fg-3)' }}>
                  {isUnlimited ? '∞' : `${item.used} / ${item.limit}`}
                </span>
              </div>
              {hasLimit && (
                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--surface-2)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: barColor,
                      borderRadius: 999,
                      transition: 'width var(--dur-3) var(--ease-standard)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsageIndicator;
