/**
 * LandingPage — صفحة الهبوط الرئيسية لمنصة QURABIA
 *
 * تتضمن:
 * - بطل الصفحة (Hero) مع تحريكات كمية
 * - أداة "المصهر الكمي" التفاعلية — الابتكار الرئيسي
 * - عرض الخدمات الستة
 * - زر الدخول إلى المنصة
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Atom, BrainCircuit, Shield, BarChart3, Globe, Code2,
  ArrowLeft, Sparkles, Lock, Fingerprint, Zap, Copy, Check,
  ChevronDown,
} from 'lucide-react';
import { forgeText, qubitToBlochCoords, type ForgeResult, type QubitState } from '../engine/QuantumForge';

// ─── أنواع ─────────────────────────────────────────────────────
interface LandingPageProps {
  onEnterPlatform: () => void;
  onEnterForge: () => void;
}

type ForgeStage = 'idle' | 'quantizing' | 'superposing' | 'entangling' | 'measuring' | 'done';

const STAGE_LABELS: Record<ForgeStage, string> = {
  idle: 'في انتظار النص...',
  quantizing: 'تكميم الحروف ← كيوبتات...',
  superposing: 'تطبيق بوابات هادامارد...',
  entangling: 'اكتشاف التشابك الكمي...',
  measuring: 'قياس الحالة الكمية...',
  done: 'اكتمل التحليل الكمي ✓',
};

// ─── مكونات فرعية ─────────────────────────────────────────────

/** بطاقة خدمة واحدة */
const ServiceCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}> = ({ icon: Icon, title, description, color, delay }) => (
  <div
    className="ui-card"
    style={{
      padding: 24,
      borderRadius: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      animation: `uiPopIn var(--dur-4) var(--ease-emphasized) ${delay}ms both`,
      transition: 'transform var(--dur-3) var(--ease-standard), box-shadow var(--dur-3) var(--ease-standard)',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 12px 32px ${color}22`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: `${color}18`,
        display: 'grid',
        placeItems: 'center',
        color,
      }}
    >
      <Icon size={24} />
    </div>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
      {title}
    </h3>
    <p style={{ fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)', margin: 0, lineHeight: 1.8 }}>
      {description}
    </p>
  </div>
);

/** شريحة كيوبت واحدة — تعرض الحرف وحالته */
const QubitChip: React.FC<{ qubit: QubitState; index: number; active: boolean }> = ({ qubit, index, active }) => {
  const coords = qubitToBlochCoords(qubit);
  const hue = (qubit.abjadValue / 1000) * 360;
  const color = `hsl(${hue}, 80%, 60%)`;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 6px',
        borderRadius: 12,
        background: active ? `${color}18` : 'var(--surface)',
        border: `1px solid ${active ? color : 'var(--outline)'}`,
        minWidth: 44,
        transition: 'all var(--dur-2) var(--ease-standard)',
        animation: active ? `uiPopIn var(--dur-3) var(--ease-snap) ${index * 40}ms both` : 'none',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: active ? color : 'var(--fg)' }}>
        {qubit.char}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-3)' }}>
        {qubit.abjadValue}
      </span>
      {active && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${color} ${qubit.prob0 * 360}deg, var(--surface-2) 0deg)`,
            border: '2px solid var(--outline)',
            position: 'relative',
          }}
          title={`|0⟩: ${(qubit.prob0 * 100).toFixed(1)}% — |1⟩: ${(qubit.prob1 * 100).toFixed(1)}%`}
        >
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#fff',
              top: `${50 - coords.z * 40}%`,
              left: `${50 + coords.x * 40}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
    </div>
  );
};

/** خريطة التشابك — تعرض الروابط بين الحروف */
const EntanglementMap: React.FC<{ result: ForgeResult }> = ({ result }) => {
  if (result.entanglements.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {result.entanglements.slice(0, 12).map((pair, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 10,
            background: pair.type === 'bell' ? 'rgba(198, 255, 46, 0.1)' :
              pair.type === 'ghz' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 176, 0, 0.1)',
            border: `1px solid ${pair.type === 'bell' ? 'rgba(198, 255, 46, 0.3)' :
              pair.type === 'ghz' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 176, 0, 0.3)'}`,
            fontSize: 13,
            fontFamily: 'var(--font-display)',
            animation: `uiPopIn var(--dur-3) var(--ease-snap) ${i * 60}ms both`,
          }}
        >
          <span style={{ color: 'var(--fg)' }}>{pair.charA}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
            ⟷ {(pair.strength * 100).toFixed(0)}%
          </span>
          <span style={{ color: 'var(--fg)' }}>{pair.charB}</span>
        </div>
      ))}
    </div>
  );
};

// ─── الصفحة الرئيسية ─────────────────────────────────────────

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPlatform, onEnterForge }) => {
  // حالة المصهر الكمي
  const [forgeInput, setForgeInput] = useState('');
  const [forgeStage, setForgeStage] = useState<ForgeStage>('idle');
  const [forgeResult, setForgeResult] = useState<ForgeResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const forgeRef = useRef<HTMLDivElement>(null);

  // عرض الخدمات
  const services = useMemo(() => [
    { icon: BrainCircuit, title: 'الذكاء الاصطناعي', description: 'نماذج ذكاء اصطناعي متقدمة تدعم اللغة العربية بدقة عالية — معالجة لغوية، تحليل دلالي، وتوليد محتوى.', color: '#C6FF2E' },
    { icon: Atom, title: 'الحوسبة الكمية', description: 'محاكاة دوائر كمية حقيقية — خوارزميات Grover وShor وVQE مع تصور تفاعلي ثلاثي الأبعاد.', color: '#00D4FF' },
    { icon: Shield, title: 'الأمن السيبراني', description: 'تشفير ما بعد الكم (Post-Quantum Crypto) — حماية بياناتك بخوارزميات مقاومة للحوسبة الكمية.', color: '#EF4444' },
    { icon: BarChart3, title: 'تحليل البيانات', description: 'لوحات تحكم ذكية وتصورات بيانية متقدمة — تحليل كمي للبيانات مع رؤى تنبؤية.', color: '#FFB000' },
    { icon: Globe, title: 'الحلول الرقمية', description: 'منصات رقمية متكاملة — واجهات عربية احترافية، تطبيقات ويب تقدمية، وتجارب مستخدم فريدة.', color: '#10B981' },
    { icon: Code2, title: 'تطوير البرمجيات', description: 'بنية برمجية نظيفة وقابلة للتوسع — APIs متقدمة، أنظمة موزعة، وأتمتة ذكية.', color: '#A78BFA' },
  ], []);

  // تشغيل المصهر الكمي مع تحريكات المراحل
  const runForge = useCallback(() => {
    if (!forgeInput.trim()) return;

    setForgeResult(null);
    setForgeStage('quantizing');

    const stages: ForgeStage[] = ['quantizing', 'superposing', 'entangling', 'measuring', 'done'];
    const timers: ReturnType<typeof setTimeout>[] = [];

    stages.forEach((stage, i) => {
      if (i === 0) return; // المرحلة الأولى بدأت فعلاً
      timers.push(setTimeout(() => {
        setForgeStage(stage);
        if (stage === 'done') {
          const result = forgeText(forgeInput);
          setForgeResult(result);
        }
      }, i * 600));
    });

    return () => timers.forEach(clearTimeout);
  }, [forgeInput]);

  // نسخ إلى الحافظة
  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => { /* silent fail — قد لا يكون HTTPS */ });
  }, []);

  // الانتقال السلس إلى المصهر
  const scrollToForge = useCallback(() => {
    forgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // الجسيمات الكمية المتحركة في الخلفية
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
      opacity: 0.1 + Math.random() * 0.3,
    })),
    []
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-ar)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ═══ الجسيمات الكمية المتحركة ═══ */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.id % 3 === 0 ? 'var(--p-primary)' : p.id % 3 === 1 ? 'var(--p-secondary)' : 'var(--p-tertiary)',
              opacity: p.opacity,
              animation: `qfloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ═══ الشريط العلوي ═══ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(7, 10, 15, 0.8)',
          borderBottom: '1px solid var(--outline)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="app-brand-mark"
            aria-hidden="true"
            style={{ width: 36, height: 36, borderRadius: 10, fontSize: 14, fontWeight: 900 }}
          >
            Q
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 900, letterSpacing: 2 }}>
            QURABIA
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onEnterForge}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-2)',
              fontFamily: 'var(--font-ar)',
              fontSize: 14,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 8,
              transition: 'color var(--dur-2)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-2)')}
          >
            المصهر الكمي
          </button>
          <button
            className="ui-btn ui-btn-filled"
            onClick={onEnterPlatform}
            style={{ fontSize: 13, padding: '8px 20px', borderRadius: 12 }}
          >
            <span>ادخل المنصة</span>
            <ArrowLeft size={14} />
          </button>
        </nav>
      </header>

      {/* ═══ بطل الصفحة (Hero) ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 24px',
          gap: 32,
        }}
      >
        {/* الشعار المتوهج */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))',
            display: 'grid',
            placeItems: 'center',
            fontSize: 40,
            fontWeight: 900,
            fontFamily: 'var(--font-ui)',
            color: 'var(--p-on-primary)',
            boxShadow: '0 0 60px rgba(198, 255, 46, 0.3), 0 0 120px rgba(0, 212, 255, 0.15)',
            animation: 'uiPopIn var(--dur-4) var(--ease-emphasized)',
          }}
        >
          Q
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 6vw, 56px)',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              background: 'linear-gradient(135deg, var(--fg) 0%, var(--p-primary) 50%, var(--p-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'uiPopIn var(--dur-4) var(--ease-emphasized) 100ms both',
            }}
          >
            نبني جسراً بين الحضارة العربية وتقنيات الغد
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-ar)',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: 'var(--fg-3)',
              margin: 0,
              lineHeight: 1.8,
              animation: 'uiPopIn var(--dur-4) var(--ease-emphasized) 200ms both',
            }}
          >
            منصة عربية مبتكرة تجمع الذكاء الاصطناعي والحوسبة الكمية والأمن السيبراني
            <br />
            في تجربة واحدة لم يسبق لها مثيل
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            animation: 'uiPopIn var(--dur-4) var(--ease-emphasized) 300ms both',
          }}
        >
          <button
            className="ui-btn ui-btn-filled"
            onClick={scrollToForge}
            style={{ fontSize: 16, padding: '14px 32px', borderRadius: 16, gap: 10 }}
          >
            <Sparkles size={18} />
            <span>جرّب المصهر الكمي</span>
          </button>
          <button
            className="ui-btn"
            onClick={onEnterPlatform}
            style={{
              fontSize: 16,
              padding: '14px 32px',
              borderRadius: 16,
              border: '1px solid var(--outline-2)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <span>ادخل المنصة</span>
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* سهم الانتقال */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            animation: 'qfloat 2s ease-in-out infinite',
            color: 'var(--fg-3)',
            cursor: 'pointer',
          }}
          onClick={scrollToForge}
          role="button"
          tabIndex={0}
          aria-label="انتقل إلى الأسفل"
          onKeyDown={e => e.key === 'Enter' && scrollToForge()}
        >
          <ChevronDown size={28} />
        </div>
      </section>

      {/* ═══ المصهر الكمي — الابتكار الرئيسي ═══ */}
      <section
        ref={forgeRef}
        id="quantum-forge"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '80px 24px',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} />
            ابتكار حصري — لم يسبق له مثيل
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700,
              margin: '0 0 12px',
              color: 'var(--fg)',
            }}
          >
            المصهر الكمي
          </h2>
          <p style={{ fontFamily: 'var(--font-ar)', fontSize: 16, color: 'var(--fg-3)', margin: 0, lineHeight: 1.8 }}>
            اكتب أي نص عربي وشاهد كل حرف يتحول إلى كيوبت حقيقي — باستخدام حساب الجُمّل (أبجد هوز)
            <br />
            وميكانيكا الكم لتوليد بصمة كمية فريدة وتشفير لا يمكن كسره
          </p>
        </div>

        {/* حقل الإدخال */}
        <div className="ui-card" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label
              htmlFor="forge-input"
              style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 600, color: 'var(--fg-2)' }}
            >
              اكتب نصاً عربياً
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <textarea
                id="forge-input"
                dir="rtl"
                value={forgeInput}
                onChange={e => setForgeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runForge(); } }}
                placeholder="مثال: بسم الله الرحمن الرحيم"
                rows={2}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  color: 'var(--fg)',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color var(--dur-2)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--p-primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--outline)')}
              />
              <button
                className="ui-btn ui-btn-filled"
                onClick={runForge}
                disabled={!forgeInput.trim() || (forgeStage !== 'idle' && forgeStage !== 'done')}
                style={{
                  padding: '14px 28px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  gap: 8,
                  alignSelf: 'stretch',
                }}
              >
                <Zap size={18} />
                <span>صهر</span>
              </button>
            </div>
          </div>
        </div>

        {/* شريط المراحل */}
        {forgeStage !== 'idle' && (
          <div
            className="ui-card"
            style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: '100%',
                height: 4,
                borderRadius: 999,
                background: 'var(--surface-2)',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--p-primary), var(--p-secondary))',
                  transition: 'width 500ms var(--ease-emphasized)',
                  width: forgeStage === 'quantizing' ? '20%' :
                    forgeStage === 'superposing' ? '40%' :
                      forgeStage === 'entangling' ? '60%' :
                        forgeStage === 'measuring' ? '80%' : '100%',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: forgeStage === 'done' ? 'var(--p-success)' : 'var(--p-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {STAGE_LABELS[forgeStage]}
            </span>
          </div>
        )}

        {/* نتائج المصهر */}
        {forgeResult && forgeStage === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'uiPopIn var(--dur-4) var(--ease-emphasized)' }}>

            {/* بطاقات الإحصائيات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { label: 'كيوبتات', value: forgeResult.qubitCount, icon: Atom, color: 'var(--p-secondary)' },
                { label: 'قيمة أبجد', value: forgeResult.totalAbjadValue, icon: Fingerprint, color: 'var(--p-primary)' },
                { label: 'التعقيد', value: `${forgeResult.complexityScore.toFixed(0)}%`, icon: Zap, color: 'var(--p-tertiary)' },
                { label: 'التشابكات', value: forgeResult.entanglements.length, icon: Lock, color: '#A78BFA' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="ui-card"
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    animation: `uiPopIn var(--dur-3) var(--ease-snap) ${i * 80}ms both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <stat.icon size={16} style={{ color: stat.color }} />
                    <span style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)' }}>{stat.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* الكيوبتات المحوّلة */}
            <div className="ui-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 15, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 12px' }}>
                الحروف ← كيوبتات
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {forgeResult.qubits.filter(q => q.abjadValue > 0).map((q, i) => (
                  <QubitChip key={i} qubit={q} index={i} active={true} />
                ))}
              </div>
            </div>

            {/* خريطة التشابك */}
            {forgeResult.entanglements.length > 0 && (
              <div className="ui-card" style={{ padding: 20, borderRadius: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 15, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 12px' }}>
                  خريطة التشابك الكمي
                </h3>
                <EntanglementMap result={forgeResult} />
              </div>
            )}

            {/* البصمة الكمية */}
            <div className="ui-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 15, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 16px' }}>
                البصمة الكمية
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <Fingerprint size={16} style={{ color: 'var(--p-primary)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--p-primary)', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {forgeResult.fingerprint.hash}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(forgeResult.fingerprint.hash, 'hash')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedField === 'hash' ? 'var(--p-success)' : 'var(--fg-3)',
                      cursor: 'pointer',
                      padding: 4,
                      flexShrink: 0,
                    }}
                    aria-label="نسخ البصمة"
                  >
                    {copiedField === 'hash' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'الإنتروبيا', value: forgeResult.fingerprint.entropy.toFixed(3), color: 'var(--p-secondary)' },
                    { label: 'الدقة', value: `${(forgeResult.fingerprint.fidelity * 100).toFixed(1)}%`, color: 'var(--p-primary)' },
                    { label: 'التماسك', value: `${(forgeResult.fingerprint.coherenceScore * 100).toFixed(1)}%`, color: 'var(--p-tertiary)' },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--font-ar)' }}>{m.label}:</span>
                      <span style={{ fontSize: 13, color: m.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* التشفير الكمي */}
            <div className="ui-card" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 15, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 16px' }}>
                التشفير الكمي ({forgeResult.encryption.protocol})
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 6, fontFamily: 'var(--font-ar)' }}>النص المشفّر</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--surface)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      overflow: 'hidden',
                    }}
                  >
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--p-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        direction: 'ltr',
                      }}
                    >
                      {forgeResult.encryption.cipherText}
                    </code>
                    <button
                      onClick={() => copyToClipboard(forgeResult.encryption.cipherText, 'cipher')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedField === 'cipher' ? 'var(--p-success)' : 'var(--fg-3)',
                        cursor: 'pointer',
                        padding: 4,
                        flexShrink: 0,
                      }}
                      aria-label="نسخ النص المشفّر"
                    >
                      {copiedField === 'cipher' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 6, fontFamily: 'var(--font-ar)' }}>المفتاح الكمي</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--surface)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        color: 'var(--p-primary)',
                        letterSpacing: 2,
                        direction: 'ltr',
                      }}
                    >
                      {forgeResult.encryption.quantumKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(forgeResult.encryption.quantumKey, 'key')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedField === 'key' ? 'var(--p-success)' : 'var(--fg-3)',
                        cursor: 'pointer',
                        padding: 4,
                        flexShrink: 0,
                      }}
                      aria-label="نسخ المفتاح الكمي"
                    >
                      {copiedField === 'key' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* زمن المعالجة */}
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>
              ⚡ تمت المعالجة في {forgeResult.processingTimeMs.toFixed(2)} مللي ثانية
            </div>
          </div>
        )}
      </section>

      {/* ═══ قسم الخدمات ═══ */}
      <section
        id="services"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '80px 24px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              margin: '0 0 12px',
              color: 'var(--fg)',
            }}
          >
            خدماتنا
          </h2>
          <p style={{ fontFamily: 'var(--font-ar)', fontSize: 16, color: 'var(--fg-3)', margin: 0 }}>
            ستة محاور تقنية متكاملة لبناء مستقبل رقمي عربي
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {services.map((s, i) => (
            <ServiceCard key={s.title} {...s} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* ═══ قسم الدعوة للعمل (CTA) ═══ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '80px 24px',
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
            جاهز لاستكشاف القوة الكمية؟
          </h2>
          <p style={{ fontFamily: 'var(--font-ar)', fontSize: 16, color: 'var(--fg-3)', margin: '0 0 28px', lineHeight: 1.8 }}>
            ادخل منصة QURABIA الموحّدة — محاكاة كمية حقيقية، محركات استراتيجية، وتحليل ذكي بالعربية.
          </p>
          <button
            className="ui-btn ui-btn-filled"
            onClick={onEnterPlatform}
            style={{ fontSize: 18, padding: '16px 40px', borderRadius: 16, gap: 10 }}
          >
            <span>ادخل المنصة</span>
            <ArrowLeft size={20} />
          </button>
        </div>
      </section>

      {/* ═══ التذييل ═══ */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '24px',
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

      {/* ═══ تحريكات CSS ═══ */}
      <style>{`
        @keyframes qfloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: var(--qf-op, 0.2); }
          25% { transform: translate(10px, -20px) scale(1.2); }
          50% { transform: translate(-5px, -40px) scale(0.8); opacity: calc(var(--qf-op, 0.2) * 1.5); }
          75% { transform: translate(15px, -20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
