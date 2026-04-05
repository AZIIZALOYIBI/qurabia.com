/**
 * PricingPage — صفحة التسعير لمنصة QURABIA
 *
 * نموذج Freemium + Usage-Based + Enterprise:
 * 1. مستكشف (مجاني) — للتجربة والاستكشاف
 * 2. باحث ($9/شهر) — للطلاب والباحثين
 * 3. محترف ($29/شهر) — للمطورين والمحترفين
 * 4. مؤسسي (تواصل معنا) — للشركات والمؤسسات
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowRight, Sparkles, Zap, Crown, Building2,
  Check, X, Atom, Lock, BrainCircuit, Fingerprint,
  Terminal, Download, Cpu, Globe, Shield,
  Search, ChevronDown, MessageCircle,
} from 'lucide-react';
import CommandPalette, { useCommandPalette, type CommandItem } from './CommandPalette';

// ─── أنواع ───────────────────────────────────────────────────────
interface PricingPageProps {
  onBack: () => void;
  onEnterPlatform: () => void;
}

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'explorer' | 'researcher' | 'professional' | 'enterprise';

interface PlanFeature {
  label: string;
  explorer: string | boolean;
  researcher: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

interface PlanConfig {
  id: PlanId;
  name: string;
  nameEn: string;
  icon: React.ElementType;
  iconColor: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  description: string;
  badge?: string;
  highlight?: boolean;
  cta: string;
  features: string[];
}

// ─── بيانات الخطط ─────────────────────────────────────────────

const PLANS: PlanConfig[] = [
  {
    id: 'explorer',
    name: 'مستكشف',
    nameEn: 'Explorer',
    icon: Sparkles,
    iconColor: 'var(--p-tertiary)',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'ابدأ رحلتك في الحوسبة الكمية — مجاناً بالكامل',
    cta: 'ابدأ مجاناً',
    features: [
      'صفحة الهبوط والعروض التوضيحية',
      '10 توائم كمومية / يوم',
      'محاكاة كرة Bloch غير محدودة',
      '20 عملية Quantum Forge / يوم',
      'خوارزمية Grover التعليمية',
      '5 عمليات تشفير BB84 / يوم',
      'رفيق كمومي (شكل ثابت)',
      'محطة طرفية (قراءة فقط)',
    ],
  },
  {
    id: 'researcher',
    name: 'باحث',
    nameEn: 'Researcher',
    icon: Zap,
    iconColor: 'var(--p-secondary)',
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: 'للطلاب والباحثين — أدوات تحليل AI وتصدير النتائج',
    badge: 'الأكثر شعبية',
    highlight: true,
    cta: 'ابدأ تجربة مجانية',
    features: [
      'كل ميزات المستكشف',
      '100 توأم كمومي / يوم',
      '50 مقارنة تشابه دلالي / يوم',
      '20 تحليل قرار كمومي / يوم',
      '30 بصمة كمومية / يوم',
      '20 استدعاء AI (Gemini/Grok) / يوم',
      '10 مشاريع محفوظة',
      'رفيق كمومي قابل للتخصيص',
      'GENESIS v4 (أساسي)',
      'تصدير النتائج (JSON)',
    ],
  },
  {
    id: 'professional',
    name: 'محترف',
    nameEn: 'Professional',
    icon: Crown,
    iconColor: 'var(--p-primary)',
    monthlyPrice: 29,
    yearlyPrice: 24,
    description: 'للمطورين والمحترفين — وصول كامل مع API',
    cta: 'ابدأ تجربة مجانية',
    features: [
      'كل ميزات الباحث',
      'توائم كمومية غير محدودة',
      'تشفير دلالي كمومي غير محدود',
      'مولّد كمومي للنصوص غير محدود',
      '100 استدعاء AI / يوم',
      '20 تشابك كمومي (جسر) / يوم',
      'GENESIS v4 الكامل',
      'المعادلة الكونية + الكيمياء الكمية',
      'API Access — 1,000 طلب / يوم',
      'حفظ مشاريع غير محدود',
      'أولوية الدعم',
    ],
  },
  {
    id: 'enterprise',
    name: 'مؤسسي',
    nameEn: 'Enterprise',
    icon: Building2,
    iconColor: '#A78BFA',
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'للشركات والمؤسسات — تكامل مخصص وبدون حدود',
    cta: 'تواصل معنا',
    features: [
      'كل شيء غير محدود',
      'API بدون حدود',
      'تكامل مخصص',
      'نشر خاص (On-Premise)',
      'SLA مضمون 99.9%',
      'دعم مخصص بالعربية',
      'تدريب الفريق',
      'تخصيص الأدوات',
    ],
  },
];

// ─── جدول المقارنة التفصيلي ──────────────────────────────────

const COMPARISON_FEATURES: PlanFeature[] = [
  { label: 'صفحة الهبوط + العروض التوضيحية', explorer: 'غير محدود', researcher: 'غير محدود', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'التوأم الكمومي اللغوي', explorer: '10 / يوم', researcher: '100 / يوم', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'محاكاة كرة Bloch', explorer: 'غير محدود', researcher: 'غير محدود', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'Quantum Forge (نص → كيوبت)', explorer: '20 / يوم', researcher: 'غير محدود', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'خوارزمية Grover التعليمية', explorer: 'غير محدود', researcher: 'غير محدود', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'التشفير الكمومي (BB84)', explorer: '5 / يوم', researcher: '50 / يوم', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'مقارنة التشابه الدلالي', explorer: false, researcher: '50 / يوم', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'تحليل القرار الكمومي', explorer: false, researcher: '20 / يوم', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'البصمة الكمومية للنصوص', explorer: false, researcher: '30 / يوم', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'تحليل AI (Gemini/Grok)', explorer: false, researcher: '20 / يوم', professional: '100 / يوم', enterprise: 'غير محدود' },
  { label: 'حفظ المشاريع', explorer: false, researcher: '10 مشاريع', professional: 'غير محدود', enterprise: 'غير محدود' },
  { label: 'تصدير النتائج (JSON/PDF)', explorer: false, researcher: true, professional: true, enterprise: true },
  { label: 'الرفيق الكمومي', explorer: 'شكل ثابت', researcher: 'قابل للتخصيص', professional: 'قابل للتخصيص', enterprise: 'قابل للتخصيص' },
  { label: 'GENESIS v4', explorer: false, researcher: 'أساسي', professional: 'كامل', enterprise: 'كامل + مخصص' },
  { label: 'المعادلة الكونية + الكيمياء الكمية', explorer: false, researcher: false, professional: true, enterprise: true },
  { label: 'الجسر الكمومي (تشابك التوائم)', explorer: false, researcher: false, professional: '20 / يوم', enterprise: 'غير محدود' },
  { label: 'API Access', explorer: false, researcher: false, professional: '1,000 طلب / يوم', enterprise: 'غير محدود' },
  { label: 'أولوية الدعم', explorer: false, researcher: false, professional: true, enterprise: true },
  { label: 'نشر خاص (On-Premise)', explorer: false, researcher: false, professional: false, enterprise: true },
  { label: 'SLA مضمون', explorer: false, researcher: false, professional: false, enterprise: '99.9%' },
  { label: 'تدريب الفريق', explorer: false, researcher: false, professional: false, enterprise: true },
];

// ─── الأسئلة الشائعة ─────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'هل يمكنني البدء مجاناً بالفعل؟',
    a: 'نعم! خطة المستكشف مجانية بالكامل ولا تحتاج بطاقة ائتمان. تتضمن أدوات كمية حقيقية تعمل بالكامل في المتصفح.',
  },
  {
    q: 'ماذا يحدث عند الوصول للحد اليومي؟',
    a: 'ستظهر رسالة ودية تخبرك بالحد المتبقي مع اقتراح الترقية. لن تفقد أي عمل — فقط ستنتظر حتى اليوم التالي أو تترقى.',
  },
  {
    q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
    a: 'بالتأكيد. لا يوجد عقد أو التزام. يمكنك إلغاء اشتراكك في أي لحظة من إعدادات حسابك.',
  },
  {
    q: 'هل تدعمون طرق دفع عربية؟',
    a: 'نعم، نقبل بطاقات Visa و Mastercard ومدى وApple Pay. نعمل أيضاً على إضافة STC Pay و Tamara قريباً.',
  },
  {
    q: 'ما الفرق بين خطة الباحث والمحترف؟',
    a: 'خطة المحترف تمنحك وصولاً غير محدود لمعظم الأدوات، بالإضافة لـ API Access وGENESIS v4 الكامل والمعادلة الكونية. مثالية للمطورين الذين يبنون تطبيقات.',
  },
  {
    q: 'هل التحليلات الكمية تتم فعلاً؟',
    a: 'نعم! كل الحسابات الكمية في الخطة المجانية تتم فعلياً في متصفحك باستخدام محركات statevector.ts الحقيقية — ليست محاكاة وهمية.',
  },
];

// ─── مكونات فرعية ─────────────────────────────────────────────

/** بطاقة خطة تسعير واحدة */
const PlanCard: React.FC<{
  plan: PlanConfig;
  billing: BillingCycle;
  onSelect: (id: PlanId) => void;
}> = ({ plan, billing, onSelect }) => {
  const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const isEnterprise = plan.id === 'enterprise';
  const isFree = price === 0;

  return (
    <div
      className="ui-card"
      style={{
        padding: 0,
        borderRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        border: plan.highlight
          ? '2px solid rgba(0, 212, 255, 0.4)'
          : '2px solid var(--outline-2)',
        background: plan.highlight
          ? 'linear-gradient(180deg, rgba(0, 212, 255, 0.08), rgba(0, 212, 255, 0.02))'
          : undefined,
        transition: 'transform var(--dur-3) var(--ease-emphasized), box-shadow var(--dur-3) var(--ease-standard)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* شارة "الأكثر شعبية" */}
      {plan.badge && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '6px 0',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'var(--font-ar)',
            letterSpacing: 1,
            color: 'var(--p-on-secondary, #001417)',
            background: 'linear-gradient(90deg, var(--p-secondary), rgba(0, 212, 255, 0.8))',
          }}
        >
          ⭐ {plan.badge}
        </div>
      )}

      <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* أيقونة + اسم الخطة */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: plan.badge ? 8 : 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: `${plan.iconColor}15`,
              border: `1px solid ${plan.iconColor}30`,
            }}
          >
            <plan.icon size={22} style={{ color: plan.iconColor }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>
              {plan.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1 }}>
              {plan.nameEn.toUpperCase()}
            </div>
          </div>
        </div>

        {/* السعر */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {isEnterprise ? (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--fg)' }}>
              تواصل معنا
            </span>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 900, color: 'var(--fg)', lineHeight: 1 }}>
                {isFree ? 'مجاني' : `$${price}`}
              </span>
              {!isFree && (
                <span style={{ fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)' }}>
                  / شهر
                </span>
              )}
            </>
          )}
        </div>

        {/* الخصم السنوي */}
        {!isFree && !isEnterprise && billing === 'yearly' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: 12,
              color: 'var(--q-success)',
              fontFamily: 'var(--font-ar)',
              fontWeight: 700,
              width: 'fit-content',
            }}
          >
            وفّر {plan.id === 'researcher' ? '22%' : '17%'} مع الاشتراك السنوي
          </div>
        )}

        {/* الوصف */}
        <p style={{ fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)', margin: 0, lineHeight: 1.7 }}>
          {plan.description}
        </p>

        {/* زر الإجراء */}
        <button
          className={`ui-btn ${plan.highlight ? 'ui-btn-filled' : plan.id === 'explorer' ? 'ui-btn-tonal' : 'ui-btn-outlined'}`}
          onClick={() => onSelect(plan.id)}
          style={{
            width: '100%',
            fontSize: 14,
            padding: '12px 20px',
            borderRadius: 14,
            gap: 8,
          }}
        >
          <span>{plan.cta}</span>
          {plan.id !== 'enterprise' && <ArrowRight size={16} style={{ transform: 'scaleX(-1)' }} />}
          {plan.id === 'enterprise' && <MessageCircle size={16} />}
        </button>

        {/* قائمة الميزات */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plan.features.map(feature => (
            <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Check
                size={16}
                style={{
                  color: plan.highlight ? 'var(--p-secondary)' : 'var(--p-primary)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6 }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** سؤال شائع قابل للطي */
const FAQItem: React.FC<{
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}> = ({ question, answer, open, onToggle }) => (
  <div
    className="ui-card"
    style={{
      padding: 0,
      borderRadius: 16,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'border-color var(--dur-2) var(--ease-standard)',
    }}
    onClick={onToggle}
    onKeyDown={e => e.key === 'Enter' && onToggle()}
    role="button"
    tabIndex={0}
    aria-expanded={open}
  >
    <div
      style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span style={{ fontFamily: 'var(--font-ar)', fontSize: 15, fontWeight: 700, color: 'var(--fg)' }}>
        {question}
      </span>
      <ChevronDown
        size={18}
        style={{
          color: 'var(--fg-3)',
          flexShrink: 0,
          transition: 'transform var(--dur-3) var(--ease-emphasized)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    </div>
    <div
      style={{
        maxHeight: open ? 200 : 0,
        overflow: 'hidden',
        transition: 'max-height var(--dur-4) var(--ease-emphasized)',
      }}
    >
      <div style={{ padding: '0 20px 16px', fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.8 }}>
        {answer}
      </div>
    </div>
  </div>
);

/** خلية في جدول المقارنة */
const ComparisonCell: React.FC<{ value: string | boolean }> = ({ value }) => {
  if (value === true) {
    return <Check size={18} style={{ color: 'var(--q-success)' }} />;
  }
  if (value === false) {
    return <X size={16} style={{ color: 'var(--fg-3)', opacity: 0.4 }} />;
  }
  return (
    <span style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>
      {value}
    </span>
  );
};

// ─── الصفحة الرئيسية ─────────────────────────────────────────

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onEnterPlatform }) => {
  const [billing, setBilling] = useState<BillingCycle>('yearly');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // لوحة الأوامر
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const handleSelectPlan = useCallback((planId: PlanId) => {
    if (planId === 'explorer') {
      onEnterPlatform();
    }
    // الخطط المدفوعة والمؤسسية — سيتم ربطها بـ Stripe لاحقاً
  }, [onEnterPlatform]);

  // أوامر لوحة الأوامر
  const cmdItems: CommandItem[] = useMemo(() => [
    {
      id: 'pricing-back',
      label: 'العودة للرئيسية',
      description: 'ارجع إلى صفحة الهبوط',
      icon: ArrowRight,
      iconColor: '#EF4444',
      action: onBack,
      keywords: ['رئيسية', 'عودة', 'back'],
    },
    {
      id: 'pricing-platform',
      label: 'ادخل المنصة',
      description: 'ابدأ استخدام المنصة مجاناً',
      icon: Sparkles,
      iconColor: '#C6FF2E',
      action: onEnterPlatform,
      keywords: ['منصة', 'platform', 'start'],
    },
    {
      id: 'pricing-compare',
      label: 'مقارنة الخطط',
      description: 'عرض جدول المقارنة التفصيلي',
      icon: Shield,
      iconColor: '#00D4FF',
      action: () => setShowComparison(v => !v),
      keywords: ['مقارنة', 'compare', 'جدول'],
    },
  ], [onBack, onEnterPlatform]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-ar)',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* لوحة الأوامر */}
      <CommandPalette items={cmdItems} open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* ═══ الشريط العلوي ═══ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(7, 10, 15, 0.85)',
          borderBottom: '1px solid var(--outline)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="app-brand-mark"
            aria-hidden="true"
            style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 900 }}
          >
            Q
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
            التسعير
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="ui-icon-btn"
            onClick={() => setCmdOpen(true)}
            aria-label="لوحة الأوامر (Ctrl+K)"
            title="بحث سريع — Ctrl+K"
            style={{
              border: '1px solid var(--outline)',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--surface)',
              cursor: 'pointer',
              color: 'var(--fg-3)',
            }}
          >
            <Search size={16} />
          </button>
          <button
            className="ui-btn"
            onClick={onBack}
            style={{
              fontSize: 13,
              padding: '6px 16px',
              borderRadius: 10,
              border: '1px solid var(--outline)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>الرئيسية</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ═══ العنوان الرئيسي ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '64px 24px 32px',
          maxWidth: 700,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 999,
            background: 'rgba(198, 255, 46, 0.1)',
            border: '1px solid rgba(198, 255, 46, 0.2)',
            fontSize: 13,
            color: 'var(--p-primary)',
            fontFamily: 'var(--font-ar)',
            marginBottom: 20,
          }}
        >
          <Sparkles size={14} />
          ابدأ مجاناً — بدون بطاقة ائتمان
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 700,
            margin: '0 0 16px',
            lineHeight: 1.3,
            background: 'linear-gradient(135deg, var(--fg) 0%, var(--p-primary) 50%, var(--p-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          خطط تناسب كل مرحلة من رحلتك الكمية
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            color: 'var(--fg-3)',
            margin: 0,
            lineHeight: 1.8,
          }}
        >
          من الاستكشاف المجاني إلى الحلول المؤسسية — اختر الخطة التي تناسبك
        </p>
      </section>

      {/* ═══ مبدّل الفوترة (شهري / سنوي) ═══ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 48,
        }}
      >
        <button
          onClick={() => setBilling('monthly')}
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            border: `1px solid ${billing === 'monthly' ? 'var(--p-secondary)' : 'var(--outline)'}`,
            background: billing === 'monthly' ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
            color: billing === 'monthly' ? 'var(--p-secondary)' : 'var(--fg-3)',
            fontFamily: 'var(--font-ar)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all var(--dur-2) var(--ease-standard)',
          }}
        >
          شهري
        </button>
        <button
          onClick={() => setBilling('yearly')}
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            border: `1px solid ${billing === 'yearly' ? 'var(--p-primary)' : 'var(--outline)'}`,
            background: billing === 'yearly' ? 'rgba(198, 255, 46, 0.1)' : 'transparent',
            color: billing === 'yearly' ? 'var(--p-primary)' : 'var(--fg-3)',
            fontFamily: 'var(--font-ar)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all var(--dur-2) var(--ease-standard)',
          }}
        >
          سنوي
          <span
            style={{
              marginRight: 6,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--q-success)',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            وفّر حتى 22%
          </span>
        </button>
      </div>

      {/* ═══ بطاقات الخطط ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 24px 64px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* ═══ جدول المقارنة التفصيلي ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 24px 64px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button
            className="ui-btn ui-btn-tonal"
            onClick={() => setShowComparison(v => !v)}
            style={{ fontSize: 14, padding: '10px 24px', borderRadius: 14, gap: 8 }}
          >
            <span>{showComparison ? 'إخفاء المقارنة التفصيلية' : 'عرض المقارنة التفصيلية'}</span>
            <ChevronDown
              size={16}
              style={{
                transition: 'transform var(--dur-3) var(--ease-emphasized)',
                transform: showComparison ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>
        </div>

        <div
          style={{
            maxHeight: showComparison ? 2000 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.5s var(--ease-emphasized)',
          }}
        >
          <div style={{ overflowX: 'auto', borderRadius: 20 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-ar)',
                minWidth: 700,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '14px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--fg-3)',
                      borderBottom: '2px solid var(--outline-2)',
                      background: 'var(--surface)',
                      position: 'sticky',
                      right: 0,
                    }}
                  >
                    الميزة
                  </th>
                  {PLANS.map(plan => (
                    <th
                      key={plan.id}
                      style={{
                        textAlign: 'center',
                        padding: '14px 12px',
                        fontSize: 14,
                        fontWeight: 800,
                        color: plan.highlight ? 'var(--p-secondary)' : 'var(--fg)',
                        borderBottom: '2px solid var(--outline-2)',
                        background: plan.highlight ? 'rgba(0, 212, 255, 0.06)' : 'var(--surface)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, idx) => (
                  <tr
                    key={feature.label}
                    style={{
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px 16px',
                        fontSize: 13,
                        color: 'var(--fg-2)',
                        borderBottom: '1px solid var(--outline)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {feature.label}
                    </td>
                    {(['explorer', 'researcher', 'professional', 'enterprise'] as const).map(planId => (
                      <td
                        key={planId}
                        style={{
                          textAlign: 'center',
                          padding: '12px',
                          borderBottom: '1px solid var(--outline)',
                          background: planId === 'researcher' ? 'rgba(0, 212, 255, 0.03)' : undefined,
                        }}
                      >
                        <ComparisonCell value={feature[planId]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ الأسئلة الشائعة ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 24px 80px',
          maxWidth: 700,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 700,
            textAlign: 'center',
            margin: '0 0 32px',
            color: 'var(--fg)',
          }}
        >
          أسئلة شائعة
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ_ITEMS.map((item, idx) => (
            <FAQItem
              key={idx}
              question={item.q}
              answer={item.a}
              open={openFAQ === idx}
              onToggle={() => setOpenFAQ(prev => prev === idx ? null : idx)}
            />
          ))}
        </div>
      </section>

      {/* ═══ الدعوة النهائية ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 24px 80px',
          textAlign: 'center',
        }}
      >
        <div
          className="ui-card"
          style={{
            maxWidth: 600,
            margin: '0 auto',
            padding: 48,
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(198, 255, 46, 0.05), rgba(0, 212, 255, 0.05))',
            border: '1px solid rgba(198, 255, 46, 0.15)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: '0 0 16px' }}>
            ابدأ رحلتك الكمية الآن
          </h2>
          <p style={{ fontFamily: 'var(--font-ar)', fontSize: 16, color: 'var(--fg-3)', margin: '0 0 28px', lineHeight: 1.8 }}>
            لا تحتاج بطاقة ائتمان — ابدأ مجاناً واستكشف القوة الكمية العربية.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="ui-btn ui-btn-filled"
              onClick={onEnterPlatform}
              style={{ fontSize: 16, padding: '14px 32px', borderRadius: 16, gap: 10 }}
            >
              <span>ابدأ مجاناً</span>
              <Sparkles size={18} />
            </button>
            <button
              className="ui-btn ui-btn-outlined"
              onClick={onBack}
              style={{ fontSize: 16, padding: '14px 32px', borderRadius: 16, gap: 10 }}
            >
              <span>الرئيسية</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ التذييل ═══ */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 24,
          borderTop: '1px solid var(--outline)',
          textAlign: 'center',
          fontFamily: 'var(--font-ar)',
          fontSize: 13,
          color: 'var(--fg-3)',
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} QURABIA — AI & Quantum Technology
          <br />
          <span style={{ fontSize: 11 }}>عبدالعزيز بن سلطان العتيبي</span>
        </p>
      </footer>
    </div>
  );
};

export default PricingPage;
