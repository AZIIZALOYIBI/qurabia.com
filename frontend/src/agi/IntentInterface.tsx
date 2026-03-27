/**
 * IntentInterface.tsx – واجهة النية التفاعلية
 * Ultimate Quantum SuperSystem v5.0
 *
 * مكوّن React يعرض:
 * - واجهة إدخال النية للمستخدم
 * - نتائج تحليل AGI لكل طلب
 * - مستوى الوعي ونقاط الأخلاق
 */

import React, { useState, useCallback } from 'react';
import { agiBridge, type AGIDecision, type ConsciousnessLevel } from './QuantumAGIBridge';
import { perceptionMatrix } from './PerceptionMatrix';

// ================================================================
// تكوين الألوان حسب الحالة
// ================================================================

const INTENT_COLORS: Record<string, string> = {
  DRUG_DISCOVERY:     'var(--quantum-green)',
  CRYPTOGRAPHY:       'var(--quantum-gold)',
  GENOMICS:           'var(--quantum-purple)',
  PHYSICS_SIMULATION: 'var(--quantum-cyan)',
  CODE_OPTIMIZATION:  'var(--quantum-blue)',
  UNKNOWN:            'var(--text-muted)',
};

const CONSCIOUSNESS_COLORS: Record<ConsciousnessLevel, string> = {
  DORMANT:      '#666',
  REACTIVE:     'var(--quantum-blue)',
  ADAPTIVE:     'var(--quantum-cyan)',
  GENERATIVE:   'var(--quantum-gold)',
  CONSCIOUS:    'var(--quantum-green)',
  TRANSCENDENT: 'var(--quantum-purple)',
};

// ================================================================
// مكوّن عرض قرار AGI
// ================================================================

interface DecisionCardProps {
  decision: AGIDecision;
}

const DecisionCard: React.FC<DecisionCardProps> = ({ decision }) => {
  const intentColor = INTENT_COLORS[decision.intent] ?? 'var(--text-muted)';
  const ethicsColor = decision.ethicsScore > 0.85
    ? 'var(--quantum-green)'
    : decision.ethicsScore > 0.70
    ? 'var(--quantum-gold)'
    : 'var(--quantum-red)';

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 8,
      background: decision.isAllowed ? 'rgba(0,255,136,0.03)' : 'rgba(255,51,102,0.05)',
      border: `1px solid ${decision.isAllowed ? 'rgba(0,255,136,0.12)' : 'rgba(255,51,102,0.2)'}`,
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: intentColor, fontWeight: 600 }}>{decision.intent}</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {new Date(decision.timestamp).toLocaleTimeString('en-GB')}
        </span>
      </div>

      <div style={{ color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4, direction: 'rtl' }}>
        {decision.recommendedAction}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>ثقة: <span style={{ color: 'var(--quantum-cyan)' }}>{(decision.confidence * 100).toFixed(0)}%</span></span>
        <span>أخلاق: <span style={{ color: ethicsColor }}>{(decision.ethicsScore * 100).toFixed(1)}%</span></span>
        <span style={{ color: decision.isAllowed ? 'var(--quantum-green)' : 'var(--quantum-red)' }}>
          {decision.isAllowed ? '✓ مسموح' : '✗ مرفوض'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{decision.processingTimeMs.toFixed(1)} ms</span>
      </div>

      {decision.preloadedModules.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {decision.preloadedModules.map(mod => (
            <span key={mod} style={{
              padding: '2px 6px',
              background: 'rgba(0,255,255,0.08)',
              borderRadius: 4,
              color: 'var(--quantum-cyan)',
              fontSize: 9,
            }}>{mod}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// ================================================================
// المكوّن الرئيسي
// ================================================================

interface IntentInterfaceProps {
  maxHistory?: number;
  className?:  string;
}

export const IntentInterface: React.FC<IntentInterfaceProps> = ({
  maxHistory = 5,
  className  = '',
}) => {
  const [input,     setInput]     = useState('');
  const [decisions, setDecisions] = useState<AGIDecision[]>([]);
  const [isProcessing, setProcessing] = useState(false);
  const [session]                 = useState(agiBridge.getSession);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    setProcessing(true);
    try {
      // تحليل الإدراك أولاً
      const perception = perceptionMatrix.perceive(input);

      // ثم معالجة النية عبر AGI Bridge
      const decision = await agiBridge.processIntent(input);

      setDecisions(prev => [decision, ...prev].slice(0, maxHistory));
    } finally {
      setProcessing(false);
      setInput('');
    }
  }, [input, isProcessing, maxHistory]);

  const consciousnessColor = CONSCIOUSNESS_COLORS[agiBridge.getConsciousnessLevel()];

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* شريط الحالة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>
          مستوى الوعي:{' '}
          <span style={{ color: consciousnessColor }}>
            {agiBridge.getConsciousnessLevel()}
          </span>
        </span>
        <span>معدل الموافقة: {(agiBridge.getApprovalRate() * 100).toFixed(0)}%</span>
      </div>

      {/* حقل الإدخال */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="صِف مهمتك للـ AGI (مثال: محاكاة جزيء H₂ / تشفير BB84)..."
          disabled={isProcessing}
          dir="rtl"
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(0,255,255,0.05)',
            border: '1px solid rgba(0,255,255,0.2)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !input.trim()}
          style={{
            padding: '8px 16px',
            background: isProcessing ? 'rgba(157,0,255,0.1)' : 'rgba(0,255,136,0.1)',
            border: `1px solid ${isProcessing ? 'rgba(157,0,255,0.3)' : 'rgba(0,255,136,0.3)'}`,
            borderRadius: 6,
            color: isProcessing ? 'var(--quantum-purple)' : 'var(--quantum-green)',
            cursor: isProcessing ? 'wait' : 'pointer',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {isProcessing ? '⏳' : '⟩ إرسال'}
        </button>
      </div>

      {/* سجل القرارات */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {decisions.map(d => (
          <DecisionCard key={d.decisionId} decision={d} />
        ))}
        {decisions.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '16px 0' }}>
            لا توجد قرارات بعد – أدخل طلبك أعلاه
          </div>
        )}
      </div>
    </div>
  );
};

export default IntentInterface;
