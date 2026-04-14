import { Crown, Lock, Sparkles, Zap } from 'lucide-react';
/**
 * SubscriptionGate — بوابة الميزات المقفلة
 *
 * تغلّف أي ميزة مدفوعة وتعرض نافذة ترقية ذكية عندما لا يمتلك المستخدم الصلاحية.
 * تُستخدم لتطبيق استراتيجية "الحدود الذكية" لتحويل المستخدمين.
 */
import type React from 'react';
import type { PlanId } from './UsageIndicator';

// ─── أنواع ───────────────────────────────────────────────────────

interface SubscriptionGateProps {
  /** هل المستخدم لديه صلاحية لهذه الميزة؟ */
  allowed: boolean;
  /** الخطة المطلوبة لفتح الميزة */
  requiredPlan: PlanId;
  /** اسم الميزة (للعرض في رسالة الترقية) */
  featureName: string;
  /** وصف قصير لقيمة الميزة */
  featureDescription?: string;
  /** رد الاتصال عند طلب الترقية */
  onUpgrade?: () => void;
  /** المحتوى المغلّف */
  children: React.ReactNode;
  /** نوع البوابة: overlay (طبقة شفافة) أو replace (استبدال كامل) */
  variant?: 'overlay' | 'replace';
}

// ─── أسماء الخطط بالعربية ─────────────────────────────────────

const PLAN_DISPLAY: Record<PlanId, { name: string; icon: React.ElementType; color: string }> = {
  explorer: { name: 'مستكشف', icon: Sparkles, color: 'var(--p-tertiary)' },
  researcher: { name: 'باحث', icon: Zap, color: 'var(--p-secondary)' },
  professional: { name: 'محترف', icon: Crown, color: 'var(--p-primary)' },
  enterprise: { name: 'مؤسسي', icon: Crown, color: '#A78BFA' },
};

// ─── المكون ──────────────────────────────────────────────────────

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  allowed,
  requiredPlan,
  featureName,
  featureDescription,
  onUpgrade,
  children,
  variant = 'overlay',
}) => {
  // إذا كان المستخدم لديه صلاحية — أظهر المحتوى مباشرة
  if (allowed) {
    return <>{children}</>;
  }

  const planInfo = PLAN_DISPLAY[requiredPlan];
  const PlanIcon = planInfo.icon;

  // ═══ نمط الاستبدال: يحل محل المحتوى بالكامل ═══
  if (variant === 'replace') {
    return (
      <div
        className="ui-card"
        style={{
          padding: 32,
          borderRadius: 20,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            display: 'grid',
            placeItems: 'center',
            background: `${planInfo.color}15`,
            border: `1px solid ${planInfo.color}30`,
          }}
        >
          <Lock size={24} style={{ color: planInfo.color }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <h3
            style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--fg)' }}
          >
            {featureName}
          </h3>
          <p style={{ fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)', margin: 0, lineHeight: 1.7 }}>
            {featureDescription ?? `هذه الميزة متاحة لمشتركي خطة ${planInfo.name} وما فوقها.`}
          </p>
        </div>

        {onUpgrade && (
          <button
            type="button"
            className="ui-btn ui-btn-filled"
            onClick={onUpgrade}
            style={{ fontSize: 14, padding: '10px 24px', borderRadius: 14, gap: 8 }}
          >
            <PlanIcon size={16} />
            <span>ترقية إلى {planInfo.name}</span>
          </button>
        )}

        <p style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)', margin: 0 }}>
          ابدأ تجربة مجانية لمدة 7 أيام — بدون بطاقة ائتمان
        </p>
      </div>
    );
  }

  // ═══ نمط الطبقة الشفافة: يعرض المحتوى بشفافية مع قفل فوقه ═══
  return (
    <div style={{ position: 'relative' }}>
      {/* المحتوى المقفل (شفاف وغير قابل للتفاعل) */}
      <div
        style={{
          opacity: 0.3,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'blur(2px)',
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* طبقة القفل */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          borderRadius: 16,
          background: 'rgba(7, 10, 15, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        role="dialog"
        aria-label={`${featureName} — ميزة مقفلة`}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: `${planInfo.color}15`,
            border: `1px solid ${planInfo.color}30`,
          }}
        >
          <Lock size={20} style={{ color: planInfo.color }} />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 260, padding: '0 16px' }}>
          <div
            style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}
          >
            {featureName}
          </div>
          <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>
            متاحة في خطة {planInfo.name}
          </div>
        </div>

        {onUpgrade && (
          <button
            type="button"
            className="ui-btn ui-btn-filled"
            onClick={onUpgrade}
            style={{ fontSize: 12, padding: '8px 18px', borderRadius: 10, gap: 6 }}
          >
            <PlanIcon size={14} />
            <span>ترقية</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionGate;
