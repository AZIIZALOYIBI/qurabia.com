/**
 * AgentsDashboard — لوحة تحكم الوكلاء الذكيين لمنصة QURABIA
 *
 * يعرض الوكلاء الأربعة (الإبداع، التطوير، البحث، الجودة)
 * مع إمكانية التفاعل الكامل وعرض نتائج مفصّلة.
 *
 * التصميم: Dark Theme + RTL + ClaudeDesignSystem.css
 */

import React, { useCallback, useMemo, useState } from 'react';
import '../styles/ClaudeDesignSystem.css';

// ── أنواع البيانات ────────────────────────────────────────────────────────────

type AgentType = 'creativity' | 'development' | 'research' | 'quality';

type AgentStatus = 'idle' | 'thinking' | 'acting' | 'reflecting' | 'done' | 'error';

interface AgentInfo {
  id: AgentType;
  label: string;
  icon: string;
  description: string;
  color: string;
  accentColor: string;
}

interface AgentResult {
  agent_id: string;
  agent_type: string;
  status: AgentStatus;
  thought: string;
  action: string;
  reflection: string;
  result: Record<string, unknown>;
  duration_ms: number;
  timestamp: number;
}

interface AgentState {
  status: AgentStatus;
  result: AgentResult | null;
  error: string | null;
}

// ── بيانات الوكلاء ────────────────────────────────────────────────────────────

const AGENTS: AgentInfo[] = [
  {
    id: 'creativity',
    label: 'وكيل الإبداع',
    icon: '💡',
    description: 'يولّد أفكاراً إبداعية وجلسات عصف ذهني ومبادرات قابلة للتنفيذ',
    color: 'rgba(232, 155, 126, 0.08)', // Claude copper-bright
    accentColor: '#E89B7E',
  },
  {
    id: 'development',
    label: 'وكيل التطوير',
    icon: '⚙️',
    description: 'يقترح تحسينات هندسية ويراجع الكود والبنية المعمارية',
    color: 'rgba(212, 165, 116, 0.08)', // Claude amber
    accentColor: '#D4A574',
  },
  {
    id: 'research',
    label: 'وكيل البحث',
    icon: '🔬',
    description: 'يحلل البيانات ويقدم توصيات مبنية على الأدلة والمصادر',
    color: 'rgba(204, 120, 92, 0.08)', // Claude copper
    accentColor: '#CC785C',
  },
  {
    id: 'quality',
    label: 'وكيل الجودة',
    icon: '🛡️',
    description: 'يُجري تدقيقاً أمنياً ويقيس الأداء ويتحقق من الجودة',
    color: 'rgba(191, 155, 110, 0.08)', // Claude amber-brown
    accentColor: '#BF9B6E',
  },
];

// ── الحالة الأولية ────────────────────────────────────────────────────────────

const INITIAL_STATE: Record<AgentType, AgentState> = {
  creativity: { status: 'idle', result: null, error: null },
  development: { status: 'idle', result: null, error: null },
  research: { status: 'idle', result: null, error: null },
  quality: { status: 'idle', result: null, error: null },
};

// ── مكوّن بطاقة الوكيل ───────────────────────────────────────────────────────

interface AgentCardProps {
  agent: AgentInfo;
  state: AgentState;
  prompt: string;
  onRun: (agentId: AgentType) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, state, prompt, onRun }) => {
  const isLoading = ['thinking', 'acting', 'reflecting'].includes(state.status);
  const [expanded, setExpanded] = useState(false);

  // تسمية الحالة بالعربية
  const statusLabel: Record<AgentStatus, string> = {
    idle: 'جاهز',
    thinking: 'يُفكّر...',
    acting: 'يُنفّذ...',
    reflecting: 'يُراجع...',
    done: 'اكتمل',
    error: 'خطأ',
  };

  const statusColor: Record<AgentStatus, string> = {
    idle: '#888',
    thinking: '#E89B7E', // Claude copper-bright
    acting: '#D4A574', // Claude amber
    reflecting: '#CC785C', // Claude copper
    done: '#22c55e', // Keep green for success
    error: '#ef4444', // Keep red for error
  };

  return (
    <article
      className="agents-card"
      style={{
        background: agent.color,
        border: `1px solid ${state.status === 'done' ? agent.accentColor + '55' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 'var(--r-2)',
        padding: 'var(--sp-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
        transition: 'border-color var(--dur-3) var(--ease-standard)',
      }}
      aria-label={`بطاقة ${agent.label}`}
    >
      {/* ── رأس البطاقة ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
        <span
          style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}
          role="img"
          aria-label={agent.label}
        >
          {agent.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--fs-lg)',
              fontWeight: 700,
              color: agent.accentColor,
              fontFamily: 'var(--font-ar)',
            }}
          >
            {agent.label}
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--fs-sm)',
              color: 'var(--p-on-surface-muted)',
              lineHeight: 1.5,
            }}
          >
            {agent.description}
          </p>
        </div>

        {/* مؤشر الحالة */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--fs-xs)',
            color: statusColor[state.status],
            fontWeight: 600,
            flexShrink: 0,
          }}
          aria-live="polite"
          aria-label={`الحالة: ${statusLabel[state.status]}`}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor[state.status],
              boxShadow: state.status !== 'idle' ? `0 0 8px ${statusColor[state.status]}` : 'none',
              animation: isLoading ? 'agents-pulse 1s ease-in-out infinite' : 'none',
            }}
          />
          {statusLabel[state.status]}
        </span>
      </header>

      {/* ── زر التشغيل ── */}
      <button
        className="agents-run-btn"
        onClick={() => onRun(agent.id)}
        disabled={isLoading || !prompt.trim()}
        style={{
          background: isLoading
            ? 'rgba(255,255,255,0.05)'
            : `linear-gradient(135deg, ${agent.accentColor}22, ${agent.accentColor}11)`,
          border: `1px solid ${agent.accentColor}44`,
          borderRadius: 'var(--r-1)',
          color: isLoading ? 'var(--p-on-surface-muted)' : agent.accentColor,
          padding: 'var(--sp-3) var(--sp-4)',
          fontFamily: 'var(--font-ar)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
          transition: 'all var(--dur-2) var(--ease-standard)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        aria-busy={isLoading}
        aria-disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: `2px solid ${agent.accentColor}44`,
                borderTopColor: agent.accentColor,
                borderRadius: '50%',
                animation: 'agents-spin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
            جارٍ التشغيل...
          </>
        ) : (
          <>▶ تشغيل الوكيل</>
        )}
      </button>

      {/* ── نتائج الوكيل ── */}
      {state.error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-3)',
            color: '#ef4444',
            fontSize: 'var(--fs-sm)',
          }}
          role="alert"
        >
          ⚠ {state.error}
        </div>
      )}

      {state.result && state.status === 'done' && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
          }}
          aria-label="نتائج الوكيل"
        >
          {/* التفكير */}
          <div>
            <span
              style={{
                fontSize: 'var(--fs-xs)',
                color: agent.accentColor,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              💭 التفكير
            </span>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 'var(--fs-sm)',
                color: 'var(--p-on-surface)',
                lineHeight: 1.6,
              }}
            >
              {state.result.thought}
            </p>
          </div>

          {/* التأمل */}
          <div>
            <span
              style={{
                fontSize: 'var(--fs-xs)',
                color: agent.accentColor,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🔄 التأمل والتقييم
            </span>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 'var(--fs-sm)',
                color: 'var(--p-on-surface)',
                lineHeight: 1.6,
              }}
            >
              {state.result.reflection}
            </p>
          </div>

          {/* زمن التنفيذ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--sp-2)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--p-on-surface-muted)' }}>
              ⏱ {state.result.duration_ms.toFixed(0)} مللي ثانية
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                color: agent.accentColor,
                fontSize: 'var(--fs-xs)',
                cursor: 'pointer',
                fontFamily: 'var(--font-ar)',
              }}
              aria-expanded={expanded}
            >
              {expanded ? '▲ إخفاء التفاصيل' : '▼ عرض التفاصيل'}
            </button>
          </div>

          {/* تفاصيل النتائج الكاملة */}
          {expanded && (
            <pre
              style={{
                margin: 0,
                padding: 'var(--sp-3)',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                fontSize: 11,
                color: '#aaa',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                direction: 'ltr',
                textAlign: 'left',
                maxHeight: 300,
              }}
              aria-label="بيانات النتائج الخام"
            >
              {JSON.stringify(state.result.result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </article>
  );
};

// ── المكوّن الرئيسي AgentsDashboard ──────────────────────────────────────────

const AgentsDashboard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [agentStates, setAgentStates] =
    useState<Record<AgentType, AgentState>>(INITIAL_STATE);
  const [isOrchestratingAll, setIsOrchestratingAll] = useState(false);
  const [orchestratorSummary, setOrchestratorSummary] = useState<string | null>(null);

  const apiBase = useMemo(() => {
    const normalize = (value: string) => value.trim().replace(/\/+$/, '');
    try {
      const override = localStorage.getItem('qurabia.apiBase') || '';
      if (override) return normalize(override);
    } catch {
      /* ignore */
    }
    const fromEnv = normalize(import.meta.env.VITE_API_BASE_URL || '');
    if (fromEnv) return fromEnv;
    return normalize('https://api.qurabia.com');
  }, []);

  // ── تشغيل وكيل واحد ─────────────────────────────────────────────────────

  const runAgent = useCallback(
    async (agentId: AgentType) => {
      if (!prompt.trim()) return;

      // تعيين حالة "يُفكّر"
      setAgentStates((prev) => ({
        ...prev,
        [agentId]: { status: 'thinking', result: null, error: null },
      }));

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

      try {
        // محاكاة التقدم: thinking → acting → reflecting
        await new Promise((r) => setTimeout(r, 300));
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: 'acting' },
        }));

        const response = await fetch(`${apiBase}/api/agents/${agentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim(), language: 'ar' }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || `خطأ HTTP ${response.status}`);
        }

        setAgentStates((prev) => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: 'reflecting' },
        }));
        await new Promise((r) => setTimeout(r, 200));

        const data: AgentResult = await response.json() as AgentResult;
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: { status: 'done', result: data, error: null },
        }));
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        const message = isAbort
          ? 'استغرق الخادم وقتاً طويلاً للاستجابة (30 ثانية). يرجى المحاولة مرة أخرى.'
          : err instanceof Error
            ? err.message
            : 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: { status: 'error', result: null, error: message },
        }));
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [apiBase, prompt],
  );

  // ── تشغيل جميع الوكلاء (المُنسِّق) ────────────────────────────────────────

  const runAllAgents = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsOrchestratingAll(true);
    setOrchestratorSummary(null);

    // تعيين جميع الوكلاء على "يُفكّر"
    setAgentStates(
      AGENTS.reduce(
        (acc, a) => ({ ...acc, [a.id]: { status: 'thinking', result: null, error: null } }),
        {} as Record<AgentType, AgentState>,
      ),
    );

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${apiBase}/api/agents/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          agents: ['creativity', 'development', 'research', 'quality'],
          language: 'ar',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`خطأ HTTP ${response.status}`);
      }

      const data = await response.json() as {
        session_id: string;
        results: Record<AgentType, AgentResult>;
        summary: string;
        total_duration_ms: number;
      };

      // تحديث حالة كل وكيل
      const newStates: Record<AgentType, AgentState> = {} as Record<AgentType, AgentState>;
      for (const agent of AGENTS) {
        const result = data.results[agent.id];
        if (result) {
          newStates[agent.id] = { status: 'done', result, error: null };
        } else {
          newStates[agent.id] = {
            status: 'error',
            result: null,
            error: 'لم يُرجع الوكيل نتيجة',
          };
        }
      }
      setAgentStates(newStates);
      setOrchestratorSummary(data.summary);
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const message = isAbort
        ? 'استغرق الخادم وقتاً طويلاً للاستجابة (60 ثانية). يرجى المحاولة مرة أخرى.'
        : err instanceof Error
          ? err.message
          : 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
      setAgentStates(
        AGENTS.reduce(
          (acc, a) => ({ ...acc, [a.id]: { status: 'error', result: null, error: message } }),
          {} as Record<AgentType, AgentState>,
        ),
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsOrchestratingAll(false);
    }
  }, [apiBase, prompt]);

  // ── إعادة التهيئة ─────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setAgentStates(INITIAL_STATE);
    setOrchestratorSummary(null);
    setPrompt('');
  }, []);

  // ── حساب الإحصائيات ───────────────────────────────────────────────────────

  const doneCount = Object.values(agentStates).filter((s) => s.status === 'done').length;
  const hasAnyResult = doneCount > 0;

  return (
    <section
      className="agents-dashboard"
      dir="rtl"
      lang="ar"
      style={{
        padding: 'var(--sp-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-5)',
        maxWidth: 1400,
        margin: '0 auto',
      }}
    >
      {/* ── أنماط CSS المدمجة ── */}
      <style>{`
        @keyframes agents-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes agents-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .agents-run-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }
        .agents-run-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .agents-card {
          transition: box-shadow var(--dur-3) var(--ease-standard);
        }
        .agents-card:hover {
          box-shadow: var(--sh-1);
        }
        .agents-prompt-input {
          outline: none;
          transition: border-color var(--dur-2) var(--ease-standard);
        }
        .agents-prompt-input:focus {
          border-color: var(--p-primary) !important;
          box-shadow: 0 0 0 3px rgba(198, 255, 46, 0.12);
        }
      `}</style>

      {/* ── رأس اللوحة ── */}
      <header
        className="ui-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--sp-4)',
          padding: 'var(--sp-5)',
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(232,155,126,0.08), rgba(212,165,116,0.04))', // Claude copper-bright & amber
          borderColor: 'rgba(232,155,126,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* خلفية متحركة */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, rgba(232,155,126,0.15), transparent 70%)', // Claude copper-bright
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--p-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            🤖 الوكلاء الذكيون
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--p-on-surface-muted)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            أربعة وكلاء متخصصون يعملون معاً لتحليل طلبك وتقديم حلول شاملة
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-4)',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {[
            { label: 'وكيل متاح', value: AGENTS.length, color: '#E89B7E' }, // Claude copper-bright
            { label: 'اكتملت', value: doneCount, color: '#22c55e' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                textAlign: 'center',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--r-2)',
                padding: 'var(--sp-3) var(--sp-4)',
                minWidth: 90,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{ fontSize: 26, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}
              >
                {value}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--p-on-surface-muted)', marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── منطقة الإدخال ── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-2)',
          padding: 'var(--sp-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-4)',
        }}
      >
        <label
          htmlFor="agents-prompt"
          style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            color: 'var(--p-on-surface)',
          }}
        >
          📝 طلبك للوكلاء
        </label>
        <textarea
          id="agents-prompt"
          className="agents-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب طلبك هنا... مثال: حلل إمكانية بناء نظام توصيات ذكي بالعربية لمنصة التجارة الإلكترونية"
          rows={3}
          maxLength={2000}
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--r-1)',
            color: 'var(--p-on-surface)',
            fontFamily: 'var(--font-ar)',
            fontSize: 'var(--fs-base)',
            padding: 'var(--sp-3)',
            resize: 'vertical',
            boxSizing: 'border-box',
            direction: 'rtl',
          }}
          aria-label="نص الطلب للوكلاء الذكيين"
          aria-describedby="agents-prompt-hint"
        />
        <div
          id="agents-prompt-hint"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
          }}
        >
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--p-on-surface-muted)' }}>
            {prompt.length}/2000 حرف
          </span>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            {hasAnyResult && (
              <button
                onClick={resetAll}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--r-1)',
                  color: 'var(--p-on-surface-muted)',
                  padding: 'var(--sp-2) var(--sp-4)',
                  fontFamily: 'var(--font-ar)',
                  fontSize: 'var(--fs-sm)',
                  cursor: 'pointer',
                }}
                aria-label="إعادة تعيين جميع الوكلاء"
              >
                ↺ إعادة تعيين
              </button>
            )}
            <button
              onClick={runAllAgents}
              disabled={isOrchestratingAll || !prompt.trim()}
              style={{
                background: isOrchestratingAll
                  ? 'rgba(232, 155, 126, 0.1)' // Claude copper-bright
                  : 'linear-gradient(135deg, rgba(232,155,126,0.13), rgba(232,155,126,0.07))',
                border: '1px solid rgba(232,155,126,0.27)',
                borderRadius: 'var(--r-1)',
                color: isOrchestratingAll ? 'rgba(232,155,126,0.53)' : '#E89B7E',
                padding: 'var(--sp-2) var(--sp-5)',
                fontFamily: 'var(--font-ar)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                cursor: isOrchestratingAll || !prompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              aria-busy={isOrchestratingAll}
              aria-label="تشغيل جميع الوكلاء معاً"
            >
              {isOrchestratingAll ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(232,155,126,0.27)',
                      borderTopColor: '#E89B7E', // Claude copper-bright
                      borderRadius: '50%',
                      animation: 'agents-spin 0.8s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  جاري التنسيق...
                </>
              ) : (
                '⚡ تشغيل الكل'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── ملخص المُنسِّق ── */}
      {orchestratorSummary && (
        <div
          style={{
            background: 'rgba(232, 155, 126, 0.06)', // Claude copper-bright
            border: '1px solid rgba(232, 155, 126, 0.2)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-4)',
            fontSize: 'var(--fs-sm)',
            color: '#E89B7E', // Claude copper-bright
            lineHeight: 1.6,
          }}
          role="status"
          aria-live="polite"
        >
          📊 <strong>ملخص المُنسِّق:</strong> {orchestratorSummary}
        </div>
      )}

      {/* ── شبكة بطاقات الوكلاء ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
          gap: 'var(--sp-5)',
        }}
        role="list"
        aria-label="بطاقات الوكلاء الذكيين"
      >
        {AGENTS.map((agent) => (
          <div key={agent.id} role="listitem">
            <AgentCard
              agent={agent}
              state={agentStates[agent.id]}
              prompt={prompt}
              onRun={runAgent}
            />
          </div>
        ))}
      </div>

      {/* ── تذييل اللوحة ── */}
      <footer
        style={{
          textAlign: 'center',
          color: 'var(--p-on-surface-muted)',
          fontSize: 'var(--fs-xs)',
          paddingTop: 'var(--sp-4)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        QURABIA Agents v1.0 — مدعوم بمحرك الوكلاء الذكيين ©{' '}
        {new Date().getFullYear()}
      </footer>
    </section>
  );
};

export default AgentsDashboard;
