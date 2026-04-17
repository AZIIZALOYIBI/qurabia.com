/**
 * SimulationPlayground — ملعب محاكاة تفاعلي ثلاثي الأبعاد
 *
 * مساحة تفاعلية لبناء وتشغيل التجارب الكمومية مع تصور 3D
 * بألوان Claude الدافئة وتجربة مستخدم ثورية
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Zap, Play, Pause, RotateCcw, Download, Share2, Save, Sparkles, Eye, EyeOff } from 'lucide-react';

interface ExperimentStep {
  id: string;
  type: 'gate' | 'measurement' | 'reset';
  gate?: string;
  qubit?: number;
  timestamp: number;
}

interface PlaygroundState {
  steps: ExperimentStep[];
  isRunning: boolean;
  currentStep: number;
  qubits: number;
  results: number[];
  fidelity: number;
}

const SimulationPlayground: React.FC = () => {
  const [state, setState] = useState<PlaygroundState>({
    steps: [],
    isRunning: false,
    currentStep: 0,
    qubits: 3,
    results: [],
    fidelity: 0,
  });

  const [showHelp, setShowHelp] = useState(true);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  // قوائم البوابات الكمومية مع ألوان Claude
  const QUANTUM_GATES = useMemo(() => [
    { id: 'H', name: 'Hadamard', icon: 'H', color: '#CC785C', desc: 'يخلق حالة تراكب' },
    { id: 'X', name: 'Pauli-X', icon: 'X', color: '#D4A574', desc: 'قلب الحالة (NOT)' },
    { id: 'Y', name: 'Pauli-Y', icon: 'Y', color: '#E8DCC8', desc: 'دوران حول محور Y' },
    { id: 'Z', name: 'Pauli-Z', icon: 'Z', color: '#BF9B6E', desc: 'انزياح الطور' },
    { id: 'CNOT', name: 'CNOT', icon: '⊕', color: '#CC785C', desc: 'بوابة التحكم الكمومي' },
    { id: 'T', name: 'T-Gate', icon: 'T', color: '#D4A574', desc: 'بوابة π/8' },
  ], []);

  const addStep = useCallback((gateId: string, qubitIndex: number) => {
    const newStep: ExperimentStep = {
      id: `${gateId}-${Date.now()}`,
      type: 'gate',
      gate: gateId,
      qubit: qubitIndex,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  }, []);

  const runSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true, currentStep: 0 }));

    // محاكاة تشغيل تدريجي
    const totalSteps = state.steps.length;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        clearInterval(interval);
        // محاكاة نتائج
        const mockResults = Array.from({ length: 8 }, () => Math.floor(Math.random() * 100));
        setState(prev => ({
          ...prev,
          isRunning: false,
          currentStep: totalSteps,
          results: mockResults,
          fidelity: 0.95 + Math.random() * 0.05,
        }));
      } else {
        setState(prev => ({ ...prev, currentStep: step }));
      }
    }, 300);
  }, [state.steps]);

  const resetSimulation = useCallback(() => {
    setState({
      steps: [],
      isRunning: false,
      currentStep: 0,
      qubits: 3,
      results: [],
      fidelity: 0,
    });
  }, []);

  const saveExperiment = useCallback(() => {
    const data = JSON.stringify(state.steps, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-experiment-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.steps]);

  return (
    <div
      className="simulation-playground"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, rgba(204, 120, 92, 0.03) 0%, rgba(212, 165, 116, 0.05) 100%)',
        border: '1px solid rgba(204, 120, 92, 0.15)',
        borderRadius: 'var(--r-3)',
        padding: 'var(--sp-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
        minHeight: 600,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .gate-card {
          transition: all var(--dur-2) var(--ease-standard);
        }
        .gate-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(204, 120, 92, 0.2);
        }
        .qubit-line {
          position: relative;
          background: linear-gradient(90deg, transparent, rgba(204, 120, 92, 0.3), transparent);
          height: 2px;
          margin: var(--sp-3) 0;
        }
      `}</style>

      {/* رأس الملعب */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: '#CC785C',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Sparkles size={24} />
            ملعب المحاكاة التفاعلي
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--fg-3)', fontSize: 'var(--fs-sm)' }}>
            ابنِ دائرتك الكمومية خطوة بخطوة وشاهد النتائج مباشرة
          </p>
        </div>

        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: 'rgba(204, 120, 92, 0.1)',
            border: '1px solid rgba(204, 120, 92, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-3)',
            color: '#CC785C',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--fs-sm)',
          }}
        >
          {showHelp ? <EyeOff size={16} /> : <Eye size={16} />}
          {showHelp ? 'إخفاء المساعدة' : 'إظهار المساعدة'}
        </button>
      </header>

      {/* رسالة المساعدة */}
      {showHelp && (
        <div
          style={{
            background: 'rgba(232, 220, 200, 0.08)',
            border: '1px solid rgba(232, 220, 200, 0.2)',
            borderRadius: 'var(--r-2)',
            padding: 'var(--sp-4)',
            animation: 'slide-in 0.3s ease-out',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--fs-sm)', lineHeight: 1.6, color: 'var(--fg-2)' }}>
            💡 <strong>كيف تستخدم الملعب:</strong> اختر بوابة كمومية من الأسفل، ثم اضغط على الكيوبت المستهدف.
            استخدم زر التشغيل لمشاهدة المحاكاة، والإعادة لمسح كل شيء.
          </p>
        </div>
      )}

      {/* لوحة التحكم */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
          padding: 'var(--sp-4)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--r-2)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={runSimulation}
          disabled={state.isRunning || state.steps.length === 0}
          style={{
            background: state.isRunning
              ? 'rgba(204, 120, 92, 0.1)'
              : 'linear-gradient(135deg, rgba(204, 120, 92, 0.15), rgba(204, 120, 92, 0.08))',
            border: '1px solid rgba(204, 120, 92, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-4)',
            color: '#CC785C',
            fontWeight: 600,
            cursor: state.isRunning || state.steps.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {state.isRunning ? <Pause size={16} /> : <Play size={16} />}
          {state.isRunning ? 'جارٍ التشغيل...' : 'تشغيل'}
        </button>

        <button
          onClick={resetSimulation}
          style={{
            background: 'rgba(191, 155, 110, 0.1)',
            border: '1px solid rgba(191, 155, 110, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-4)',
            color: '#BF9B6E',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <RotateCcw size={16} />
          إعادة
        </button>

        <button
          onClick={saveExperiment}
          disabled={state.steps.length === 0}
          style={{
            background: 'rgba(212, 165, 116, 0.1)',
            border: '1px solid rgba(212, 165, 116, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-4)',
            color: '#D4A574',
            fontWeight: 600,
            cursor: state.steps.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Save size={16} />
          حفظ
        </button>

        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-3)' }}>
            الخطوات: {state.steps.length}
          </span>
          {state.fidelity > 0 && (
            <span
              style={{
                fontSize: 'var(--fs-sm)',
                color: '#CC785C',
                fontWeight: 700,
              }}
            >
              الدقة: {(state.fidelity * 100).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* منطقة الكيوبتات */}
      <div
        style={{
          flex: 1,
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 'var(--r-2)',
          padding: 'var(--sp-5)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-3)' }}>الكيوبتات المستخدمة</span>
        </div>

        {Array.from({ length: state.qubits }).map((_, i) => (
          <div key={i} style={{ marginBottom: 'var(--sp-4)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
                marginBottom: 'var(--sp-2)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, rgba(204, 120, 92, 0.2), rgba(212, 165, 116, 0.2))`,
                  border: '2px solid rgba(204, 120, 92, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#CC785C',
                  cursor: selectedGate ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (selectedGate) {
                    addStep(selectedGate, i);
                    setSelectedGate(null);
                  }
                }}
              >
                q{i}
              </div>
              <div className="qubit-line" style={{ flex: 1 }}>
                {/* عرض البوابات المطبقة على هذا الكيوبت */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {state.steps
                    .filter(s => s.qubit === i)
                    .map((step, idx) => (
                      <div
                        key={step.id}
                        style={{
                          background: QUANTUM_GATES.find(g => g.id === step.gate)?.color || '#CC785C',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          opacity: idx < state.currentStep ? 1 : 0.4,
                          animation: idx < state.currentStep ? 'none' : 'pulse-glow 1.5s infinite',
                        }}
                      >
                        {step.gate}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* لوحة البوابات */}
      <div
        style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--r-2)',
          padding: 'var(--sp-4)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--fg-2)' }}>
            اختر بوابة كمومية:
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 'var(--sp-3)',
          }}
        >
          {QUANTUM_GATES.map(gate => (
            <button
              key={gate.id}
              className="gate-card"
              onClick={() => setSelectedGate(selectedGate === gate.id ? null : gate.id)}
              style={{
                background: selectedGate === gate.id
                  ? `linear-gradient(135deg, ${gate.color}30, ${gate.color}18)`
                  : 'rgba(255,255,255,0.04)',
                border: `2px solid ${selectedGate === gate.id ? gate.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 'var(--r-1)',
                padding: 'var(--sp-3)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: gate.color,
                  marginBottom: 4,
                }}
              >
                {gate.icon}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--fg-2)',
                  fontWeight: 600,
                }}
              >
                {gate.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--fg-3)',
                  marginTop: 4,
                  lineHeight: 1.3,
                }}
              >
                {gate.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* النتائج */}
      {state.results.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(204, 120, 92, 0.08), rgba(212, 165, 116, 0.04))',
            border: '1px solid rgba(204, 120, 92, 0.25)',
            borderRadius: 'var(--r-2)',
            padding: 'var(--sp-4)',
            animation: 'slide-in 0.4s ease-out',
          }}
        >
          <h3
            style={{
              margin: '0 0 var(--sp-3)',
              fontSize: 'var(--fs-base)',
              fontWeight: 700,
              color: '#CC785C',
            }}
          >
            📊 نتائج القياس
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 'var(--sp-2)',
            }}
          >
            {state.results.map((count, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  padding: 'var(--sp-2)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>
                  |{idx.toString(2).padStart(3, '0')}⟩
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#D4A574' }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPlayground;
