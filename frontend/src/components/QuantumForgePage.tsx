/**
 * QuantumForgePage — صفحة المصهر الكمومي الشاملة
 *
 * تضم 4 أدوات تفاعلية فريدة:
 * 1. تكميم النص: تحليل صرفي → دوائر كمومية → تصور مرئي
 * 2. التشفير الكمومي: تشفير BB84 للنصوص العربية
 * 3. محلل القرارات: خوارزمية Grover لتحليل القرارات
 * 4. البصمة الكمومية: بصمة فريدة لكل نص عربي
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  ArrowRight, Atom, Lock, Fingerprint, BrainCircuit, Sparkles,
  Copy, Check, Zap, ChevronDown,
} from 'lucide-react';
import { analyzeSentence, type SentenceAnalysis, SEMANTIC_FIELD_NAMES, type SemanticField } from '../engine/ArabicMorphology';
import { buildSemanticCircuit, circuitToASCII, type SemanticCircuit, type CircuitGate } from '../engine/QuantumSemanticCircuit';
import { analyzeDecision, extractOptions, type DecisionResult } from '../engine/GroverDecision';
import { forgeText, type ForgeResult } from '../engine/QuantumForge';

// ─── أنواع ───
interface Props { onBack: () => void; }
type ToolTab = 'quantize' | 'cipher' | 'decision' | 'fingerprint';

const TAB_CONFIG: { id: ToolTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'quantize', label: 'تكميم النص', icon: Atom, desc: 'حوّل النص العربي إلى دائرة كمومية' },
  { id: 'cipher', label: 'التشفير الكمومي', icon: Lock, desc: 'شفّر رسالتك ببروتوكول BB84' },
  { id: 'decision', label: 'محلل القرارات', icon: BrainCircuit, desc: 'حلّل قرارك بخوارزمية Grover' },
  { id: 'fingerprint', label: 'البصمة الكمومية', icon: Fingerprint, desc: 'ولّد بصمة فريدة لنصك' },
];

// ─── مكونات مشتركة ───

const InputArea: React.FC<{
  value: string; onChange: (v: string) => void; onSubmit: () => void;
  placeholder: string; buttonLabel: string; disabled?: boolean;
}> = ({ value, onChange, onSubmit, placeholder, buttonLabel, disabled }) => (
  <div style={{ display: 'flex', gap: 12 }}>
    <textarea
      dir="rtl"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
      placeholder={placeholder}
      rows={2}
      style={{
        flex: 1, fontFamily: 'var(--font-display)', fontSize: 18,
        background: 'var(--surface)', border: '1px solid var(--outline)',
        borderRadius: 14, padding: '12px 16px', color: 'var(--fg)',
        resize: 'none', outline: 'none', transition: 'border-color var(--dur-2)',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = 'var(--p-primary)')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--outline)')}
    />
    <button
      className="ui-btn ui-btn-filled"
      onClick={onSubmit}
      disabled={disabled || !value.trim()}
      style={{ padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 700, gap: 8, alignSelf: 'stretch' }}
    >
      <Zap size={16} />
      <span>{buttonLabel}</span>
    </button>
  </div>
);

const CopyButton: React.FC<{ text: string; field: string; copiedField: string | null; onCopy: (t: string, f: string) => void }> = ({ text, field, copiedField, onCopy }) => (
  <button
    onClick={() => onCopy(text, field)}
    style={{ background: 'none', border: 'none', color: copiedField === field ? 'var(--p-success)' : 'var(--fg-3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
    aria-label="نسخ"
  >
    {copiedField === field ? <Check size={14} /> : <Copy size={14} />}
  </button>
);

const StatCard: React.FC<{ label: string; value: string | number; color: string; icon: React.ElementType }> = ({ label, value, color, icon: Icon }) => (
  <div className="ui-card" style={{ padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontFamily: 'var(--font-ar)', fontSize: 11, color: 'var(--fg-3)' }}>{label}</span>
    </div>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color }}>{value}</span>
  </div>
);

const FieldBadge: React.FC<{ field: SemanticField }> = ({ field }) => {
  const colors: Record<string, string> = {
    knowledge: '#C6FF2E', creation: '#00D4FF', movement: '#FFB000', speech: '#A78BFA',
    emotion: '#EF4444', nature: '#10B981', body: '#F97316', society: '#6366F1',
    religion: '#FBBF24', commerce: '#8B5CF6', warfare: '#DC2626', thought: '#06B6D4',
    perception: '#14B8A6', existence: '#EC4899', unknown: '#6B7280',
  };
  const c = colors[field] || '#6B7280';
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 8, fontSize: 11,
      fontFamily: 'var(--font-ar)', background: `${c}18`, color: c, border: `1px solid ${c}33`,
    }}>
      {SEMANTIC_FIELD_NAMES[field]}
    </span>
  );
};

// ─── أدوات التكميم (Tab 1) ───

const QuantizeTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [circuit, setCircuit] = useState<SemanticCircuit | null>(null);

  const run = useCallback(() => {
    if (!input.trim()) return;
    const a = analyzeSentence(input);
    const c = buildSemanticCircuit(a);
    setAnalysis(a);
    setCircuit(c);
  }, [input]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InputArea value={input} onChange={setInput} onSubmit={run} placeholder="اكتب جملة عربية... مثال: العلم نور والجهل ظلام" buttonLabel="كمّم" />

      {analysis && circuit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'uiPopIn var(--dur-4) var(--ease-emphasized)' }}>
          {/* إحصائيات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <StatCard label="كيوبتات" value={circuit.qubits.length} color="var(--p-secondary)" icon={Atom} />
            <StatCard label="بوابات" value={circuit.gates.length} color="var(--p-primary)" icon={Zap} />
            <StatCard label="جذور فريدة" value={analysis.uniqueRoots} color="var(--p-tertiary)" icon={Sparkles} />
            <StatCard label="التشابك" value={`${(circuit.entanglementDegree * 100).toFixed(0)}%`} color="#A78BFA" icon={Lock} />
          </div>

          {/* التحليل الصرفي */}
          <div className="ui-card" style={{ padding: 18, borderRadius: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 14px' }}>
              التحليل الصرفي — الجذور الثلاثية
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {analysis.words.filter(w => w.confidence > 0).map((w, i) => (
                <div key={i} className="ui-card" style={{
                  padding: '10px 14px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6,
                  minWidth: 120, animation: `uiPopIn var(--dur-3) var(--ease-snap) ${i * 50}ms both`,
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--fg)' }}>{w.word}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    {w.rootLetters.map((l, j) => (
                      <span key={j} style={{
                        width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center',
                        background: 'rgba(198, 255, 46, 0.12)', color: 'var(--p-primary)',
                        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                      }}>{l}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-ar)', textAlign: 'center' }}>
                    {w.patternName || w.pattern}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-ar)', textAlign: 'center' }}>
                    {w.rootMeaning}
                  </div>
                  <FieldBadge field={w.semanticField} />
                  {/* حالات التراكب */}
                  {w.superpositionStates.length > 1 && (
                    <div style={{ fontSize: 10, color: 'var(--p-secondary)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                      |ψ⟩ = {w.superpositionStates.slice(0, 4).map((s, k) => (
                        <span key={k}>{k > 0 ? ' + ' : ''}{s}</span>
                      ))}
                      {w.superpositionStates.length > 4 && <span> +...</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* الدائرة الكمومية (ASCII) */}
          <div className="ui-card" style={{ padding: 18, borderRadius: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 10px' }}>
              الدائرة الكمومية الدلالية
            </h3>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--p-secondary)',
              background: 'var(--surface)', borderRadius: 10, padding: 14, overflow: 'auto',
              direction: 'ltr', textAlign: 'left', whiteSpace: 'pre', lineHeight: 1.8,
            }}>
              {circuitToASCII(circuit)}
            </pre>
          </div>

          {/* البوابات المفصّلة */}
          <div className="ui-card" style={{ padding: 18, borderRadius: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 10px' }}>
              البوابات الكمومية — الشرح اللغوي
            </h3>
            <div style={{ display: 'grid', gap: 8, maxHeight: 300, overflow: 'auto' }}>
              {circuit.gates.map((g, i) => (
                <GateRow key={i} gate={g} />
              ))}
            </div>
          </div>

          {/* شرح الدائرة */}
          <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.8 }}>
            {circuit.explanation}
          </div>
        </div>
      )}
    </div>
  );
};

const GateRow: React.FC<{ gate: CircuitGate }> = ({ gate }) => {
  const colorMap: Record<string, string> = {
    primary: 'var(--p-primary)', secondary: 'var(--p-secondary)',
    tertiary: 'var(--p-tertiary)', error: 'var(--p-error)', success: 'var(--p-success)',
  };
  const c = colorMap[gate.color] || 'var(--fg-3)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      borderRadius: 10, background: 'var(--surface)',
    }}>
      <span style={{
        width: 36, height: 24, borderRadius: 6, display: 'grid', placeItems: 'center',
        background: `${c}22`, color: c, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
      }}>
        {gate.label.slice(0, 5)}
      </span>
      <span style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-2)', flex: 1 }}>
        {gate.linguisticMeaning}
      </span>
    </div>
  );
};

// ─── أداة التشفير (Tab 2) ───

const CipherTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ForgeResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const run = useCallback(() => {
    if (!input.trim()) return;
    setResult(forgeText(input));
  }, [input]);

  const copy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => { /* clipboard may not be available */ });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InputArea value={input} onChange={setInput} onSubmit={run} placeholder="اكتب رسالة لتشفيرها... مثال: السلام عليكم" buttonLabel="شفّر" />

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'uiPopIn var(--dur-4) var(--ease-emphasized)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <StatCard label="كيوبتات" value={result.qubitCount} color="var(--p-secondary)" icon={Atom} />
            <StatCard label="بروتوكول" value="BB84" color="var(--p-primary)" icon={Lock} />
            <StatCard label="التعقيد" value={`${result.complexityScore.toFixed(0)}%`} color="var(--p-tertiary)" icon={Zap} />
            <StatCard label="التشابكات" value={result.entanglements.length} color="#A78BFA" icon={Sparkles} />
          </div>

          {/* النص المشفر */}
          <div className="ui-card" style={{ padding: 18, borderRadius: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)', margin: '0 0 12px' }}>
              النص المشفّر ({result.encryption.protocol})
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4, fontFamily: 'var(--font-ar)' }}>النص المشفّر</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--p-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, direction: 'ltr' }}>
                    {result.encryption.cipherText}
                  </code>
                  <CopyButton text={result.encryption.cipherText} field="cipher" copiedField={copiedField} onCopy={copy} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4, fontFamily: 'var(--font-ar)' }}>المفتاح الكمومي</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--p-primary)', letterSpacing: 2, direction: 'ltr' }}>
                    {result.encryption.quantumKey}
                  </code>
                  <CopyButton text={result.encryption.quantumKey} field="key" copiedField={copiedField} onCopy={copy} />
                </div>
              </div>
            </div>
          </div>

          {/* البصمة */}
          <div className="ui-card" style={{ padding: 18, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Fingerprint size={16} style={{ color: 'var(--p-primary)' }} />
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--p-primary)', letterSpacing: 1 }}>
                  {result.fingerprint.hash}
                </code>
              </div>
              <CopyButton text={result.fingerprint.hash} field="hash" copiedField={copiedField} onCopy={copy} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              <MetricChip label="الإنتروبيا" value={result.fingerprint.entropy.toFixed(3)} color="var(--p-secondary)" />
              <MetricChip label="الدقة" value={`${(result.fingerprint.fidelity * 100).toFixed(1)}%`} color="var(--p-primary)" />
              <MetricChip label="التماسك" value={`${(result.fingerprint.coherenceScore * 100).toFixed(1)}%`} color="var(--p-tertiary)" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-ar)' }}>{label}:</span>
    <span style={{ fontSize: 12, color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{value}</span>
  </div>
);

// ─── محلل القرارات (Tab 3) ───

const DecisionTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DecisionResult | null>(null);

  const run = useCallback(() => {
    if (!input.trim()) return;
    setResult(analyzeDecision(input));
  }, [input]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InputArea value={input} onChange={setInput} onSubmit={run} placeholder="اكتب سؤال قرارك... مثال: هل أفتح مشروع مطعم أم متجر إلكتروني؟" buttonLabel="حلّل" />

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'uiPopIn var(--dur-4) var(--ease-emphasized)' }}>
          {/* التوصية */}
          <div className="ui-card" style={{
            padding: 20, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(198, 255, 46, 0.06), rgba(0, 212, 255, 0.06))',
            border: '1px solid rgba(198, 255, 46, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BrainCircuit size={18} style={{ color: 'var(--p-primary)' }} />
              <span style={{ fontFamily: 'var(--font-ar)', fontSize: 15, fontWeight: 700, color: 'var(--fg)' }}>
                التوصية الكمومية
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-2)', margin: 0, lineHeight: 1.8 }}>
              {result.recommendation}
            </p>
          </div>

          {/* إحصائيات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <StatCard label="الخيارات" value={result.options.length} color="var(--p-secondary)" icon={Atom} />
            <StatCard label="تكرارات Grover" value={result.groverIterations} color="var(--p-primary)" icon={Zap} />
            <StatCard label="مساحة البحث" value={result.searchSpaceSize} color="var(--p-tertiary)" icon={Sparkles} />
            <StatCard label="الوضوح" value={`${(result.decisionClarity * 100).toFixed(0)}%`} color="#A78BFA" icon={BrainCircuit} />
          </div>

          {/* الخيارات */}
          <div style={{ display: 'grid', gap: 12 }}>
            {result.options.map((opt, i) => (
              <div key={i} className="ui-card" style={{
                padding: 18, borderRadius: 16,
                border: i === result.recommendedIndex ? '1px solid rgba(198, 255, 46, 0.3)' : undefined,
                animation: `uiPopIn var(--dur-3) var(--ease-snap) ${i * 80}ms both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {i === result.recommendedIndex && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: 'rgba(198, 255, 46, 0.15)', color: 'var(--p-primary)', fontFamily: 'var(--font-ar)',
                      }}>
                        الأفضل ✓
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--fg)' }}>
                      {opt.text}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
                    color: i === result.recommendedIndex ? 'var(--p-primary)' : 'var(--fg-2)',
                  }}>
                    {(opt.amplifiedProbability * 100).toFixed(1)}%
                  </span>
                </div>

                {/* شريط الاحتمال */}
                <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${opt.amplifiedProbability * 100}%`,
                    background: i === result.recommendedIndex
                      ? 'linear-gradient(90deg, var(--p-primary), var(--p-secondary))'
                      : 'var(--fg-3)',
                    transition: 'width 600ms var(--ease-emphasized)',
                  }} />
                </div>

                {/* تفاصيل */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <MetricChip label="الدلالة" value={`${(opt.semanticWeight * 100).toFixed(0)}%`} color="var(--p-secondary)" />
                  <MetricChip label="الإيجابية" value={`${(opt.positivityScore * 100).toFixed(0)}%`} color="var(--p-success)" />
                  <MetricChip label="العملية" value={`${(opt.practicalityScore * 100).toFixed(0)}%`} color="var(--p-tertiary)" />
                  <MetricChip label="الثقة" value={`${(opt.confidenceScore * 100).toFixed(0)}%`} color="var(--p-primary)" />
                </div>

                {/* الحقول الدلالية */}
                {opt.dominantFields.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {opt.dominantFields.map((f, j) => <FieldBadge key={j} field={f} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── البصمة الكمومية (Tab 4) ───

const FingerprintTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ForgeResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const run = useCallback(() => {
    if (!input.trim()) return;
    setResult(forgeText(input));
  }, [input]);

  const copy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => { /* clipboard may not be available */ });
  }, []);

  // توليد البصمة المرئية — شبكة ألوان فريدة من الهاش
  const visualGrid = useMemo(() => {
    if (!result) return null;
    const hash = result.fingerprint.hash;
    const cells: { color: string; opacity: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const charCode = hash.charCodeAt(i % hash.length);
      const hue = (charCode * 23 + i * 47) % 360;
      const sat = 60 + (charCode % 30);
      const light = 40 + (i * 3);
      const opacity = 0.5 + (charCode % 50) / 100;
      cells.push({ color: `hsl(${hue}, ${sat}%, ${light}%)`, opacity });
    }
    return cells;
  }, [result]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InputArea value={input} onChange={setInput} onSubmit={run} placeholder="اكتب نصاً لتوليد بصمته الكمومية..." buttonLabel="ولّد" />

      {result && visualGrid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'uiPopIn var(--dur-4) var(--ease-emphasized)', alignItems: 'center' }}>
          {/* البصمة المرئية */}
          <div className="ui-card" style={{ padding: 28, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)' }}>
              البصمة الكمومية المرئية
            </div>

            {/* الشبكة المرئية */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
              width: 160, height: 160, borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 0 40px rgba(198, 255, 46, 0.15)',
            }}>
              {visualGrid.map((cell, i) => (
                <div key={i} style={{
                  background: cell.color, opacity: cell.opacity,
                  borderRadius: 4, transition: 'transform var(--dur-2)',
                  animation: `uiPopIn var(--dur-3) var(--ease-snap) ${i * 30}ms both`,
                }} />
              ))}
            </div>

            {/* الهاش */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--p-primary)', letterSpacing: 2 }}>
                {result.fingerprint.hash}
              </code>
              <CopyButton text={result.fingerprint.hash} field="fp-hash" copiedField={copiedField} onCopy={copy} />
            </div>
          </div>

          {/* المقاييس */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, width: '100%' }}>
            <StatCard label="الإنتروبيا" value={result.fingerprint.entropy.toFixed(3)} color="var(--p-secondary)" icon={Sparkles} />
            <StatCard label="الدقة" value={`${(result.fingerprint.fidelity * 100).toFixed(1)}%`} color="var(--p-primary)" icon={Fingerprint} />
            <StatCard label="التماسك" value={`${(result.fingerprint.coherenceScore * 100).toFixed(1)}%`} color="var(--p-tertiary)" icon={Atom} />
            <StatCard label="الكيوبتات" value={result.qubitCount} color="#A78BFA" icon={Lock} />
          </div>

          {/* معلومات إضافية */}
          <div style={{
            fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.8,
            maxWidth: 500,
          }}>
            هذه البصمة فريدة لهذا النص — أي تغيير ولو بحرف واحد سينتج بصمة مختلفة تماماً.
            يمكن استخدامها للتحقق من أصالة المحتوى العربي وحماية حقوق النشر.
          </div>
        </div>
      )}
    </div>
  );
};

// ─── الصفحة الرئيسية ───

const QuantumForgePage: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('quantize');

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)',
      fontFamily: 'var(--font-ar)',
    }}>
      {/* الشريط العلوي */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(7, 10, 15, 0.85)', borderBottom: '1px solid var(--outline)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="app-brand-mark" aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 900 }}>Q</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>المصهر الكمومي</span>
        </div>
        <button
          className="ui-btn"
          onClick={onBack}
          style={{ fontSize: 13, padding: '6px 16px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>الرئيسية</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* التبويبات */}
      <div style={{
        display: 'flex', gap: 8, padding: '16px 20px', overflowX: 'auto',
        borderBottom: '1px solid var(--outline)',
      }}>
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-ar)', whiteSpace: 'nowrap', cursor: 'pointer',
              border: activeTab === tab.id ? '1px solid rgba(198, 255, 46, 0.3)' : '1px solid var(--outline)',
              background: activeTab === tab.id ? 'rgba(198, 255, 46, 0.08)' : 'var(--surface)',
              color: activeTab === tab.id ? 'var(--p-primary)' : 'var(--fg-2)',
              transition: 'all var(--dur-2) var(--ease-standard)',
            }}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {/* وصف الأداة */}
        <div style={{
          textAlign: 'center', marginBottom: 24,
          fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)',
        }}>
          {TAB_CONFIG.find(t => t.id === activeTab)?.desc}
        </div>

        {activeTab === 'quantize' && <QuantizeTab />}
        {activeTab === 'cipher' && <CipherTab />}
        {activeTab === 'decision' && <DecisionTab />}
        {activeTab === 'fingerprint' && <FingerprintTab />}
      </main>
    </div>
  );
};

export default QuantumForgePage;
