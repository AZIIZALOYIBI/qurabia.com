/**
 * QuantumAlgorithmsVisualEngine.tsx — محرك خوارزميات الكم المرئي
 * QURABIA
 *
 * مكوّن تعليمي تفاعلي يعرض خوارزميات الكم الأساسية:
 * - حالات Bell الأربع (تشابك كمي)
 * - تحويل فورييه الكمي (QFT)
 * - خوارزمية Grover للبحث الكمي
 * - دوائر جاهزة (GHZ، Bell، QFT، Deutsch-Jozsa)
 */

import { Atom, BookOpen, Play, RefreshCw, Search, Sparkles, Zap } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  applyQFT,
  applyCNOT,
  applyGate,
  applyGroverDiffusion,
  applyPhaseFlip,
  createBasisState,
  createZeroState,
  getProbabilities,
  getStatePhases,
  vonNeumannEntropy,
} from '../core/statevector';
import { GATE_H, GATE_X } from '../core/quantum-gates';

// ================================================================
// الأنواع
// ================================================================

type EngineTab = 'bell' | 'qft' | 'grover' | 'templates';

interface ProbBar {
  label: string;
  prob: number;
  phase?: number;
}

// ================================================================
// مساعد عرض أشرطة الاحتمال
// ================================================================

const ProbabilityBars: React.FC<{ bars: ProbBar[]; maxProb?: number; showPhase?: boolean }> = ({
  bars,
  maxProb,
  showPhase,
}) => {
  const max = maxProb ?? Math.max(...bars.map((b) => b.prob), 0.001);
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {bars.map((bar) => (
        <div key={bar.label} style={{ display: 'grid', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', minWidth: 64 }}>
              {bar.label}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {showPhase && bar.phase !== undefined && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
                  ∠{((bar.phase * 180) / Math.PI).toFixed(0)}°
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                {(bar.prob * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div
            style={{ height: 8, borderRadius: 4, background: 'var(--bg)', overflow: 'hidden' }}
            role="progressbar"
            aria-valuenow={Math.round(bar.prob * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                height: '100%',
                width: `${(bar.prob / max) * 100}%`,
                borderRadius: 4,
                background: 'linear-gradient(90deg, var(--p-primary), var(--p-secondary, #8b5cf6))',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ================================================================
// تبويب حالات Bell
// ================================================================

const BELL_STATES = [
  {
    id: 'phi_plus',
    label: '|Φ+⟩',
    desc: '(|00⟩ + |11⟩)/√2',
    arabic: 'حالة Bell الأولى',
    circuit: ['H على Q0', 'CNOT (Q0→Q1)'],
  },
  {
    id: 'phi_minus',
    label: '|Φ-⟩',
    desc: '(|00⟩ - |11⟩)/√2',
    arabic: 'حالة Bell الثانية',
    circuit: ['X على Q0', 'H على Q0', 'CNOT (Q0→Q1)'],
  },
  {
    id: 'psi_plus',
    label: '|Ψ+⟩',
    desc: '(|01⟩ + |10⟩)/√2',
    arabic: 'حالة Bell الثالثة',
    circuit: ['H على Q0', 'CNOT (Q0→Q1)', 'X على Q0'],
  },
  {
    id: 'psi_minus',
    label: '|Ψ-⟩',
    desc: '(|01⟩ - |10⟩)/√2',
    arabic: 'حالة Bell الرابعة',
    circuit: ['X على Q0', 'H على Q0', 'CNOT (Q0→Q1)', 'X على Q0'],
  },
] as const;

type BellStateId = (typeof BELL_STATES)[number]['id'];

import type { StateVectorData } from '../core/statevector';

function prepareBellStateSV(id: BellStateId): StateVectorData {
  let sv = createZeroState(2);
  if (id === 'phi_plus') {
    sv = applyGate(sv, GATE_H, 0);
    sv = applyCNOT(sv, 0, 1);
  } else if (id === 'phi_minus') {
    sv = applyGate(sv, GATE_X, 0);
    sv = applyGate(sv, GATE_H, 0);
    sv = applyCNOT(sv, 0, 1);
  } else if (id === 'psi_plus') {
    sv = applyGate(sv, GATE_H, 0);
    sv = applyCNOT(sv, 0, 1);
    sv = applyGate(sv, GATE_X, 0);
  } else {
    sv = applyGate(sv, GATE_X, 0);
    sv = applyGate(sv, GATE_H, 0);
    sv = applyCNOT(sv, 0, 1);
    sv = applyGate(sv, GATE_X, 0);
  }
  return sv;
}

function prepareBellState(id: BellStateId): number[] {
  return getProbabilities(prepareBellStateSV(id));
}

const BellStatesTab: React.FC = () => {
  const [selected, setSelected] = useState<BellStateId>('phi_plus');
  const sv = prepareBellStateSV(selected);
  const probs = getProbabilities(sv);
  const entropy = vonNeumannEntropy(sv);
  const info = BELL_STATES.find((s) => s.id === selected)!;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
        حالات Bell هي أقصى حالات التشابك الكمي لكيوبتين. إنشاؤها يتطلب بوابة هادامارد وبوابة CNOT فقط.
      </div>

      {/* أزرار الاختيار */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {BELL_STATES.map((bs) => (
          <button
            type="button"
            key={bs.id}
            onClick={() => setSelected(bs.id)}
            aria-pressed={selected === bs.id}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 900,
              padding: '6px 14px',
              borderRadius: 10,
              border: '2px solid',
              cursor: 'pointer',
              borderColor: selected === bs.id ? 'var(--p-primary)' : 'var(--border)',
              background: selected === bs.id ? 'rgba(var(--p-primary-rgb,79,70,229),0.15)' : 'transparent',
              color: selected === bs.id ? 'var(--p-primary)' : 'var(--fg-2)',
              transition: 'all 0.15s',
            }}
          >
            {bs.label}
          </button>
        ))}
      </div>

      {/* المعلومات والنتائج */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* معلومات الحالة */}
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-2,rgba(255,255,255,0.03))',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 900 }}>{info.arabic}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--p-primary)' }}>{info.desc}</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginBottom: 4 }}>
              خطوات الدائرة:
            </div>
            {info.circuit.map((step, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)', marginBottom: 2 }}>
                {i + 1}. {step}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="ui-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              S ≈ {entropy.toFixed(3)} bit
            </span>
            <span className="ui-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--q-success,#10b981)' }}>
              تشابك كامل
            </span>
          </div>
        </div>

        {/* أشرطة الاحتمال */}
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-2,rgba(255,255,255,0.03))',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 10 }}>
            توزيع الاحتماليات:
          </div>
          <ProbabilityBars
            bars={probs.map((p, i) => ({
              label: `|${i.toString(2).padStart(2, '0')}⟩`,
              prob: p,
            }))}
          />
        </div>
      </div>
    </div>
  );
};

// ================================================================
// تبويب تحويل فورييه الكمي (QFT)
// ================================================================

const QFTTab: React.FC = () => {
  const [numQubits, setNumQubits] = useState(3);
  const [basisState, setBasisState] = useState(1);
  const [result, setResult] = useState<{ inputProbs: number[]; outputProbs: number[]; phases: number[] } | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    try {
      const N = 1 << numQubits;
      const safeState = Math.max(0, Math.min(basisState, N - 1));
      const input = createBasisState(numQubits, safeState);
      const inputProbs = getProbabilities(input);
      const output = applyQFT(input);
      const outputProbs = getProbabilities(output);
      const phases = getStatePhases(output).map((s) => s.phase);
      setResult({ inputProbs, outputProbs, phases });
    } finally {
      setRunning(false);
    }
  }, [numQubits, basisState]);

  const N = 1 << numQubits;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
        تحويل فورييه الكمي (QFT) هو المكافئ الكمي لخوارزمية FFT. يحوّل الحالات الحسابية إلى تكرارات طورية ويُستخدم في خوارزميات Shor وقدر المراحل الكمي.
      </div>

      {/* الإعدادات */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="qft-qubits"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}
          >
            الكيوبتات:
          </label>
          {[2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => {
                setNumQubits(n);
                setBasisState(Math.min(basisState, (1 << n) - 1));
                setResult(null);
              }}
              aria-pressed={numQubits === n}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 8,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: numQubits === n ? 'var(--p-primary)' : 'var(--border)',
                background: numQubits === n ? 'var(--p-primary)' : 'transparent',
                color: numQubits === n ? '#fff' : 'var(--fg-2)',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="qft-basis"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}
          >
            الحالة الابتدائية |k⟩:
          </label>
          <input
            id="qft-basis"
            type="number"
            min={0}
            max={N - 1}
            value={basisState}
            onChange={(e) => {
              setBasisState(Math.max(0, Math.min(Number(e.target.value), N - 1)));
              setResult(null);
            }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              width: 70,
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-2,#111)',
              color: 'var(--fg)',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
            (0 – {N - 1})
          </span>
        </div>

        <button
          type="button"
          className="ui-btn"
          onClick={handleRun}
          disabled={running}
          style={{ background: 'var(--p-primary)', color: '#fff', border: 'none' }}
          aria-label="تشغيل QFT"
        >
          <Play size={14} />
          تشغيل QFT
        </button>
      </div>

      {/* النتائج */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-2,rgba(255,255,255,0.03))',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>
              الحالة الابتدائية |{basisState}⟩:
            </div>
            <ProbabilityBars
              bars={result.inputProbs
                .map((p, i) => ({
                  label: `|${i.toString(2).padStart(numQubits, '0')}⟩`,
                  prob: p,
                }))
                .filter((b) => b.prob > 1e-6)}
            />
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-2,rgba(255,255,255,0.03))',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>
              بعد QFT (توزيع متساوٍ + أطوار):
            </div>
            <ProbabilityBars
              bars={result.outputProbs.map((p, i) => ({
                label: `|${i.toString(2).padStart(numQubits, '0')}⟩`,
                prob: p,
                phase: result.phases[i],
              }))}
              showPhase
            />
          </div>
        </div>
      )}

      {!result && (
        <div
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: 12,
            color: 'var(--fg-3)',
            textAlign: 'center',
            padding: 12,
          }}
        >
          اختر الكيوبتات والحالة الابتدائية ثم اضغط "تشغيل QFT"
        </div>
      )}
    </div>
  );
};

// ================================================================
// تبويب خوارزمية Grover
// ================================================================

interface GroverSnapshot {
  iteration: number;
  targetProb: number;
  probs: number[];
}

const GroverTab: React.FC = () => {
  const [numQubits, setNumQubits] = useState(3);
  const [target, setTarget] = useState(5);
  const [snapshots, setSnapshots] = useState<GroverSnapshot[]>([]);
  const [running, setRunning] = useState(false);

  const N = 1 << numQubits;
  const safeTarget = Math.max(0, Math.min(target, N - 1));
  const optIter = Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)));

  const handleRun = useCallback(() => {
    setRunning(true);
    const snaps: GroverSnapshot[] = [];
    try {
      let sv = createZeroState(numQubits);
      for (let q = 0; q < numQubits; q++) {
        sv = applyGate(sv, GATE_H, q);
      }
      const initProbs = getProbabilities(sv);
      snaps.push({ iteration: 0, targetProb: initProbs[safeTarget], probs: initProbs });

      for (let i = 1; i <= optIter; i++) {
        sv = applyPhaseFlip(sv, safeTarget);
        sv = applyGroverDiffusion(sv);
        const probs = getProbabilities(sv);
        snaps.push({ iteration: i, targetProb: probs[safeTarget], probs });
      }
      setSnapshots(snaps);
    } finally {
      setRunning(false);
    }
  }, [numQubits, safeTarget, optIter]);

  const finalSnapshot = snapshots[snapshots.length - 1];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
        خوارزمية Grover للبحث في قاعدة بيانات غير مرتبة بتعقيد <strong>O(√N)</strong> بدلاً من O(N) الكلاسيكي.
        تضخّم سعة الحالة المستهدفة عبر Oracle + Diffusion بشكل متكرر.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>الكيوبتات (n):</span>
          {[2, 3, 4].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => {
                setNumQubits(n);
                setTarget(Math.min(target, (1 << n) - 1));
                setSnapshots([]);
              }}
              aria-pressed={numQubits === n}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 8,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: numQubits === n ? 'var(--p-primary)' : 'var(--border)',
                background: numQubits === n ? 'var(--p-primary)' : 'transparent',
                color: numQubits === n ? '#fff' : 'var(--fg-2)',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="grover-target-ve"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}
          >
            الهدف:
          </label>
          <input
            id="grover-target-ve"
            type="number"
            min={0}
            max={N - 1}
            value={target}
            onChange={(e) => {
              setTarget(Math.max(0, Math.min(Number(e.target.value), N - 1)));
              setSnapshots([]);
            }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              width: 60,
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-2,#111)',
              color: 'var(--fg)',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
            N={N} | √N={Math.sqrt(N).toFixed(1)} | تكرارات أمثل={optIter}
          </span>
        </div>

        <button
          type="button"
          className="ui-btn"
          onClick={handleRun}
          disabled={running}
          style={{ background: 'var(--p-primary)', color: '#fff', border: 'none' }}
          aria-label="تشغيل خوارزمية Grover"
        >
          <Search size={14} />
          تشغيل Grover
        </button>
      </div>

      {/* رسم بياني لاحتمال الهدف عبر التكرارات */}
      {snapshots.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-2,rgba(255,255,255,0.03))',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 10 }}>
              احتمال الهدف |{safeTarget}⟩ عبر التكرارات:
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {snapshots.map((snap) => (
                <div
                  key={snap.iteration}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${snap.targetProb * 100}%`,
                      minHeight: 2,
                      borderRadius: '3px 3px 0 0',
                      background:
                        snap.targetProb > 0.9
                          ? 'var(--q-success,#10b981)'
                          : 'linear-gradient(180deg, var(--p-primary), var(--p-secondary,#8b5cf6))',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-3)' }}>
                    {snap.iteration}
                  </span>
                </div>
              ))}
            </div>
            {finalSnapshot && (
              <div
                style={{
                  marginTop: 10,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color:
                    finalSnapshot.targetProb > 0.9 ? 'var(--q-success,#10b981)' : 'var(--fg-2)',
                }}
              >
                احتمال الهدف النهائي: {(finalSnapshot.targetProb * 100).toFixed(1)}%
                {finalSnapshot.targetProb > 0.9 && ' ✓ '}
              </div>
            )}
          </div>

          {/* مقارنة الكفاءة */}
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-2,rgba(255,255,255,0.03))',
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              مقارنة الكفاءة:
            </div>
            {[
              { label: 'كلاسيكي O(N)', value: `${Math.floor(N / 2)} خطوة (متوسط)`, color: '#ef4444' },
              { label: 'كمي O(√N)', value: `${optIter} خطوات`, color: 'var(--q-success,#10b981)' },
              {
                label: 'التحسين',
                value: `${(Math.floor(N / 2) / optIter).toFixed(1)}× أسرع`,
                color: 'var(--p-primary)',
              },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                  {row.label}:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: row.color }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshots.length === 0 && (
        <div
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: 12,
            color: 'var(--fg-3)',
            textAlign: 'center',
            padding: 12,
          }}
        >
          اختر عدد الكيوبتات والعنصر المستهدف ثم اضغط "تشغيل Grover"
        </div>
      )}
    </div>
  );
};

// ================================================================
// تبويب الدوائر الجاهزة (Templates)
// ================================================================

interface CircuitTemplateInfo {
  name: string;
  arabic: string;
  desc: string;
  qubits: number;
  gates: {
    gate: string;
    qubit: number;
    control?: number;
    params?: { angle?: number };
  }[];
  runDemo: () => number[];
}

const CIRCUIT_TEMPLATES: CircuitTemplateInfo[] = [
  {
    name: 'Bell State |Φ+⟩',
    arabic: 'حالة Bell',
    desc: 'أبسط دائرة تشابك كمي',
    qubits: 2,
    gates: [
      { gate: 'H', qubit: 0 },
      { gate: 'CNOT', qubit: 1, control: 0 },
    ],
    runDemo: () => {
      let sv = createZeroState(2);
      sv = applyGate(sv, GATE_H, 0);
      sv = applyCNOT(sv, 0, 1);
      return getProbabilities(sv);
    },
  },
  {
    name: 'GHZ State (3Q)',
    arabic: 'حالة GHZ ثلاثية',
    desc: 'تشابك متعدد الأطراف',
    qubits: 3,
    gates: [
      { gate: 'H', qubit: 0 },
      { gate: 'CNOT', qubit: 1, control: 0 },
      { gate: 'CNOT', qubit: 2, control: 1 },
    ],
    runDemo: () => {
      let sv = createZeroState(3);
      sv = applyGate(sv, GATE_H, 0);
      sv = applyCNOT(sv, 0, 1);
      sv = applyCNOT(sv, 1, 2);
      return getProbabilities(sv);
    },
  },
  {
    name: 'Superposition (3Q)',
    arabic: 'تراكب ثلاثي',
    desc: 'H على 3 كيوبتات',
    qubits: 3,
    gates: [
      { gate: 'H', qubit: 0 },
      { gate: 'H', qubit: 1 },
      { gate: 'H', qubit: 2 },
    ],
    runDemo: () => {
      let sv = createZeroState(3);
      sv = applyGate(sv, GATE_H, 0);
      sv = applyGate(sv, GATE_H, 1);
      sv = applyGate(sv, GATE_H, 2);
      return getProbabilities(sv);
    },
  },
  {
    name: 'QFT (3Q)',
    arabic: 'تحويل فورييه الكمي',
    desc: 'QFT على 3 كيوبتات',
    qubits: 3,
    gates: [
      { gate: 'H', qubit: 0 },
      { gate: 'H', qubit: 1 },
      { gate: 'H', qubit: 2 },
    ],
    runDemo: () => {
      let sv = createZeroState(3);
      sv = applyGate(sv, GATE_H, 0);
      sv = applyQFT(sv);
      return getProbabilities(sv);
    },
  },
  {
    name: 'Half-Adder',
    arabic: 'جامع نصفي كمي',
    desc: 'CNOT + CNOT لجمع بتين مع carry',
    qubits: 4,
    gates: [
      { gate: 'X', qubit: 0 },
      { gate: 'X', qubit: 1 },
      { gate: 'CNOT', qubit: 2, control: 0 },
      { gate: 'CNOT', qubit: 2, control: 1 },
    ],
    runDemo: () => {
      let sv = createZeroState(4);
      sv = applyGate(sv, GATE_X, 0);
      sv = applyGate(sv, GATE_X, 1);
      sv = applyCNOT(sv, 0, 2);
      sv = applyCNOT(sv, 1, 2);
      return getProbabilities(sv);
    },
  },
  {
    name: 'Teleportation Setup',
    arabic: 'إعداد نقل كمي',
    desc: 'إعداد قناة Bell للنقل الكمي',
    qubits: 3,
    gates: [
      { gate: 'H', qubit: 1 },
      { gate: 'CNOT', qubit: 2, control: 1 },
      { gate: 'CNOT', qubit: 1, control: 0 },
      { gate: 'H', qubit: 0 },
    ],
    runDemo: () => {
      let sv = createZeroState(3);
      sv = applyGate(sv, GATE_H, 1);
      sv = applyCNOT(sv, 1, 2);
      sv = applyCNOT(sv, 0, 1);
      sv = applyGate(sv, GATE_H, 0);
      return getProbabilities(sv);
    },
  },
];

const TemplatesTab: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [demoProbs, setDemoProbs] = useState<number[] | null>(null);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected === idx) {
        setSelected(null);
        setDemoProbs(null);
      } else {
        setSelected(idx);
        setDemoProbs(CIRCUIT_TEMPLATES[idx].runDemo());
      }
    },
    [selected],
  );

  const handleExport = useCallback(
    (template: CircuitTemplateInfo) => {
      const data = { qubits: template.qubits, gates: template.gates };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
        دوائر جاهزة يمكن تنزيلها كـ JSON واستيرادها في مصمّم الدوائر الكمية أعلاه.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
        {CIRCUIT_TEMPLATES.map((tpl, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              borderRadius: 14,
              border: '2px solid',
              borderColor: selected === idx ? 'var(--p-primary)' : 'var(--border)',
              background:
                selected === idx ? 'rgba(var(--p-primary-rgb,79,70,229),0.08)' : 'var(--bg-2,rgba(255,255,255,0.02))',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'grid',
              gap: 8,
            }}
            onClick={() => handleSelect(idx)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(idx); } }}
            role="button"
            tabIndex={0}
            aria-pressed={selected === idx}
            aria-label={`قالب ${tpl.arabic}`}
          >
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 900 }}>{tpl.arabic}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--p-primary)' }}>{tpl.name}</div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)' }}>{tpl.desc}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="ui-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {tpl.qubits}Q
              </span>
              <span className="ui-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {tpl.gates.length} بوابة
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected !== null && demoProbs && (
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--bg-2,rgba(255,255,255,0.02))',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>
                {CIRCUIT_TEMPLATES[selected].arabic}
              </div>
              <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
                {CIRCUIT_TEMPLATES[selected].desc}
              </div>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn-outlined"
              onClick={() => handleExport(CIRCUIT_TEMPLATES[selected])}
              aria-label="تنزيل القالب كـ JSON"
              style={{ fontSize: 12 }}
            >
              <Sparkles size={13} />
              تنزيل JSON
            </button>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>
              نتيجة المحاكاة:
            </div>
            <ProbabilityBars
              bars={demoProbs
                .map((p, i) => ({
                  label: `|${i.toString(2).padStart(CIRCUIT_TEMPLATES[selected].qubits, '0')}⟩`,
                  prob: p,
                }))
                .filter((b) => b.prob > 1e-6)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ================================================================
// المكوّن الرئيسي
// ================================================================

const TAB_CONFIG: { id: EngineTab; label: string; icon: React.ElementType; ariaLabel: string }[] = [
  { id: 'bell', label: 'حالات Bell', icon: Atom, ariaLabel: 'حالات Bell والتشابك الكمي' },
  { id: 'qft', label: 'QFT', icon: Zap, ariaLabel: 'تحويل فورييه الكمي' },
  { id: 'grover', label: 'Grover', icon: Search, ariaLabel: 'خوارزمية Grover' },
  { id: 'templates', label: 'قوالب', icon: BookOpen, ariaLabel: 'دوائر جاهزة' },
];

export const QuantumAlgorithmsVisualEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EngineTab>('bell');

  return (
    <div className="ui-card" style={{ padding: 16, borderRadius: 22, display: 'grid', gap: 16 }}>
      {/* ─── الرأس ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="ui-icon-btn" aria-hidden="true" style={{ color: 'var(--p-primary)' }}>
          <Sparkles size={18} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>
            محرك الخوارزميات الكمية المرئي
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
            Quantum Algorithms Visual Engine
          </div>
        </div>
      </div>

      {/* ─── تبويبات ─── */}
      <div
        role="tablist"
        aria-label="تبويبات محرك الخوارزميات الكمية"
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
      >
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`qave-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.ariaLabel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 10,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: activeTab === tab.id ? 'var(--p-primary)' : 'var(--border)',
                background: activeTab === tab.id ? 'rgba(var(--p-primary-rgb,79,70,229),0.15)' : 'transparent',
                color: activeTab === tab.id ? 'var(--p-primary)' : 'var(--fg-2)',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── محتوى التبويب ─── */}
      <div
        id={`qave-panel-${activeTab}`}
        role="tabpanel"
        aria-label={TAB_CONFIG.find((t) => t.id === activeTab)?.ariaLabel}
      >
        {activeTab === 'bell' && <BellStatesTab />}
        {activeTab === 'qft' && <QFTTab />}
        {activeTab === 'grover' && <GroverTab />}
        {activeTab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
};

export default QuantumAlgorithmsVisualEngine;
