/**
 * QuantumCircuitDesigner.tsx — مصمّم الدوائر الكمية المرئي
 * QURABIA
 *
 * يتيح للمستخدم بناء دائرة كمية باختيار البوابات ووضعها
 * على خطوط الكيوبتات، ثم تشغيل المحاكاة وعرض النتائج.
 *
 * نظام "نقرتين": نقر على بوابة لتحديدها → نقر على موضع في الدائرة لإضافتها
 * الميزات:
 * - 13 بوابة: H, X, Y, Z, S, T, RX, RY, RZ, CNOT, SWAP, CZ, CCX
 * - استيراد/تصدير JSON
 * - وضع خطوة بخطوة لعرض تطور الحالة
 * - مقاييس الدائرة (عدد البوابات، العمق)
 * - عرض انتروبيا فون نيومان
 */

import { Cpu, Download, Play, StepForward, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  type CircuitMetrics,
  computeCircuitMetrics,
  getProbabilities,
  runCircuit,
  vonNeumannEntropy,
} from '../core/statevector';
import type { GateName, GateOperation } from '../core/statevector';

// ================================================================
// الأنواع والثوابت
// ================================================================

/** معلومات البوابة في شريط الأدوات */
interface GateInfo {
  name: GateName;
  label: string;
  color: string;
  hasAngle: boolean;
  is2Q: boolean; // بوابة كيوبتين
  description: string;
}

const GATE_PALETTE: GateInfo[] = [
  { name: 'H', label: 'H', color: 'var(--p-primary)', hasAngle: false, is2Q: false, description: 'هادامارد — تراكب' },
  { name: 'X', label: 'X', color: '#ef4444', hasAngle: false, is2Q: false, description: 'بولي-X — NOT كمي' },
  { name: 'Y', label: 'Y', color: '#f59e0b', hasAngle: false, is2Q: false, description: 'بولي-Y' },
  { name: 'Z', label: 'Z', color: '#10b981', hasAngle: false, is2Q: false, description: 'بولي-Z — مرحلة' },
  { name: 'S', label: 'S', color: '#8b5cf6', hasAngle: false, is2Q: false, description: 'S — مرحلة π/2' },
  { name: 'T', label: 'T', color: '#ec4899', hasAngle: false, is2Q: false, description: 'T — مرحلة π/4' },
  { name: 'RX', label: 'RX', color: 'var(--p-secondary)', hasAngle: true, is2Q: false, description: 'تدوير حول X' },
  { name: 'RY', label: 'RY', color: '#06b6d4', hasAngle: true, is2Q: false, description: 'تدوير حول Y' },
  { name: 'RZ', label: 'RZ', color: '#84cc16', hasAngle: true, is2Q: false, description: 'تدوير حول Z' },
  {
    name: 'CNOT',
    label: 'CX',
    color: 'var(--p-tertiary, #f59e0b)',
    hasAngle: false,
    is2Q: true,
    description: 'CNOT — تحكم-NOT',
  },
  { name: 'SWAP', label: 'SW', color: '#f97316', hasAngle: false, is2Q: true, description: 'SWAP — تبادل الكيوبتين' },
  { name: 'CZ', label: 'CZ', color: '#a78bfa', hasAngle: false, is2Q: true, description: 'CZ — تحكم-Z' },
  {
    name: 'CCX',
    label: 'CCX',
    color: '#fb923c',
    hasAngle: false,
    is2Q: true,
    description: 'Toffoli — تحكم-تحكم-NOT',
  },
];

/** عملية في الدائرة الكمية */
interface CircuitStep {
  gate: GateName;
  qubit: number; // الكيوبت الهدف
  control?: number; // كيوبت التحكم (بوابات ثنائية)
  angle?: number; // الزاوية بالراديان (RX/RY/RZ)
}

/** قالب دائرة من ملف JSON */
interface CircuitTemplate {
  qubits: number;
  gates: {
    gate: GateName;
    qubit: number;
    control?: number;
    params?: { angle?: number };
  }[];
}
// ================================================================
// المكوّن الرئيسي
// ================================================================

export const QuantumCircuitDesigner: React.FC = () => {
  // ─── الحالة ───────────────────────────────────────────────────
  const [numQubits, setNumQubits] = useState<number>(3);
  const [circuit, setCircuit] = useState<CircuitStep[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateInfo | null>(null);
  const [angleInput, setAngleInput] = useState<number>(Math.PI / 2);
  const [controlQubit, setControlQubit] = useState<number>(0);
  const [probabilities, setProbabilities] = useState<number[] | null>(null);
  const [entropy, setEntropy] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<CircuitMetrics | null>(null);
  const [stepProbs, setStepProbs] = useState<{ step: number; probs: number[] }[]>([]);
  const [stepMode, setStepMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // ─── تحديد البوابة من شريط الأدوات ───────────────────────────
  const handleSelectGate = useCallback((gate: GateInfo) => {
    setSelectedGate((prev) => (prev?.name === gate.name ? null : gate));
    setError(null);
  }, []);

  // ─── إضافة البوابة إلى موضع في الدائرة ───────────────────────
  const handlePlaceGate = useCallback(
    (qubitIndex: number) => {
      if (!selectedGate) return;

      const newStep: CircuitStep = {
        gate: selectedGate.name,
        qubit: qubitIndex,
      };

      if (selectedGate.hasAngle) {
        newStep.angle = angleInput;
      }

      if (selectedGate.is2Q) {
        if (controlQubit === qubitIndex) {
          setError('كيوبت التحكم والهدف يجب أن يكونا مختلفَين');
          return;
        }
        newStep.control = controlQubit;
      }

      setError(null);
      const updated = [...circuit, newStep];
      setCircuit(updated);
      setMetrics(computeCircuitMetrics(updated.map((s) => ({ gate: s.gate, target: s.qubit, control: s.control, angle: s.angle }))));
    },
    [selectedGate, angleInput, controlQubit, circuit],
  );

  // ─── حذف خطوة من الدائرة ─────────────────────────────────────
  const handleRemoveStep = useCallback((index: number) => {
    setCircuit((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setMetrics(computeCircuitMetrics(updated.map((s) => ({ gate: s.gate, target: s.qubit, control: s.control, angle: s.angle }))));
      return updated;
    });
  }, []);

  // ─── مسح الدائرة كاملاً ──────────────────────────────────────
  const handleClear = useCallback(() => {
    setCircuit([]);
    setProbabilities(null);
    setEntropy(null);
    setMetrics(null);
    setStepProbs([]);
    setError(null);
    setSelectedGate(null);
  }, []);

  // ─── تشغيل المحاكاة ──────────────────────────────────────────
  const handleRun = useCallback(() => {
    setRunning(true);
    setError(null);

    try {
      const ops: GateOperation[] = circuit.map((step) => ({
        gate: step.gate,
        target: step.qubit,
        control: step.control,
        angle: step.angle,
      }));

      if (stepMode) {
        // وضع خطوة بخطوة: تشغيل الدائرة تدريجياً
        const snapshots: { step: number; probs: number[] }[] = [];
        for (let i = 1; i <= ops.length; i++) {
          const sv = runCircuit(numQubits, ops.slice(0, i));
          snapshots.push({ step: i, probs: getProbabilities(sv) });
        }
        setStepProbs(snapshots);
        if (snapshots.length > 0) {
          setProbabilities(snapshots[snapshots.length - 1].probs);
        }
      } else {
        const sv = runCircuit(numQubits, ops);
        const probs = getProbabilities(sv);
        setProbabilities(probs);
        setEntropy(vonNeumannEntropy(sv));
        setStepProbs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setRunning(false);
    }
  }, [circuit, numQubits, stepMode]);

  // ─── تصدير JSON ──────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const data: CircuitTemplate = {
      qubits: numQubits,
      gates: circuit.map((step) => ({
        gate: step.gate,
        qubit: step.qubit,
        ...(step.control !== undefined && { control: step.control }),
        ...(step.angle !== undefined && { params: { angle: step.angle } }),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-circuit.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [circuit, numQubits]);

  // ─── استيراد JSON ────────────────────────────────────────────
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string) as CircuitTemplate;
        if (!json.qubits || !Array.isArray(json.gates)) throw new Error('صيغة JSON غير صحيحة');
        const steps: CircuitStep[] = json.gates.map((g) => ({
          gate: g.gate,
          qubit: g.qubit,
          control: g.control,
          angle: g.params?.angle,
        }));
        setNumQubits(Math.min(8, Math.max(1, json.qubits)));
        setCircuit(steps);
        setMetrics(computeCircuitMetrics(steps.map((s) => ({ gate: s.gate, target: s.qubit, control: s.control, angle: s.angle }))));
        setProbabilities(null);
        setEntropy(null);
        setError(null);
      } catch {
        setError('خطأ في استيراد الملف — تأكد من صحة صيغة JSON');
      }
      // إعادة ضبط input للسماح باستيراد نفس الملف مجدداً
      if (importRef.current) importRef.current.value = '';
    };
    reader.readAsText(file);
  }, []);

  // ─── مساعدات عرض الدائرة ─────────────────────────────────────
  /** البوابات على كل كيوبت مرتبة حسب ترتيب الإضافة */
  const gatesByQubit = useCallback(
    (qIndex: number) => circuit.map((step, idx) => ({ step, idx })).filter(({ step }) => step.qubit === qIndex),
    [circuit],
  );

  const getGateInfo = (name: GateName): GateInfo => GATE_PALETTE.find((g) => g.name === name) ?? GATE_PALETTE[0];

  // ─── عدد الأعمدة في الدائرة ──────────────────────────────────
  const _maxSteps = Math.max(circuit.length + 1, 4);

  // ─── label الحالة ─────────────────────────────────────────────
  const basisLabel = (idx: number) => {
    return `|${idx.toString(2).padStart(numQubits, '0')}⟩`;
  };

  const maxProb = probabilities ? Math.max(...probabilities, 0.001) : 1;

  // ================================================================
  // العرض
  // ================================================================
  return (
    <div className="ui-card" style={{ padding: 16, borderRadius: 22, display: 'grid', gap: 16 }}>
      {/* ─── الرأس ─────────────────────────────────────────── */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ui-icon-btn" aria-hidden="true" style={{ color: 'var(--p-primary)' }}>
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>مصمّم الدوائر الكمية</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              Quantum Circuit Designer
            </div>
          </div>
        </div>

        {/* عدد الكيوبتات */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>الكيوبتات:</span>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => {
                setNumQubits(n);
                setCircuit([]);
                setProbabilities(null);
              }}
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
              aria-label={`${n} كيوبت`}
              aria-pressed={numQubits === n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ─── شريط البوابات ──────────────────────────────────── */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 6 }}>
          1. اختر بوابة:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {GATE_PALETTE.map((gate) => (
            <button
              type="button"
              key={gate.name}
              onClick={() => handleSelectGate(gate)}
              title={gate.description}
              aria-label={`بوابة ${gate.label}: ${gate.description}`}
              aria-pressed={selectedGate?.name === gate.name}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 900,
                padding: '5px 12px',
                borderRadius: 10,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: selectedGate?.name === gate.name ? gate.color : 'var(--border)',
                background: selectedGate?.name === gate.name ? `${gate.color}22` : 'transparent',
                color: gate.color,
                transition: 'all 0.15s',
                minWidth: 42,
              }}
            >
              {gate.label}
            </button>
          ))}
        </div>

        {/* إعدادات إضافية للبوابة المحددة */}
        {selectedGate && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              البوابة: <strong style={{ color: selectedGate.color }}>{selectedGate.label}</strong> —{' '}
              {selectedGate.description}
            </span>

            {selectedGate.hasAngle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label
                  htmlFor="qcd-angle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}
                >
                  الزاوية (rad):
                </label>
                <input
                  id="qcd-angle"
                  type="number"
                  value={angleInput}
                  onChange={(e) => setAngleInput(Number.parseFloat(e.target.value) || 0)}
                  step={0.1}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    width: 80,
                    padding: '3px 6px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-2, #111)',
                    color: 'var(--fg)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                  ({(angleInput / Math.PI).toFixed(2)}π)
                </span>
              </div>
            )}

            {selectedGate.is2Q && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label
                  htmlFor="qcd-ctrl"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}
                >
                  كيوبت التحكم:
                </label>
                <select
                  id="qcd-ctrl"
                  value={controlQubit}
                  onChange={(e) => setControlQubit(Number(e.target.value))}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    padding: '3px 6px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-2, #111)',
                    color: 'var(--fg)',
                  }}
                >
                  {Array.from({ length: numQubits }, (_, i) => (
                    <option key={i} value={i}>
                      Q{i}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── الدائرة الكمية ──────────────────────────────────── */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>
          2. انقر على خط الكيوبت لإضافة البوابة المحددة:
        </div>
        <div
          style={{
            overflowX: 'auto',
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--bg-2, rgba(255,255,255,0.03))',
            padding: '12px 8px',
          }}
        >
          {Array.from({ length: numQubits }, (_, qIdx) => (
            <div
              key={qIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                marginBottom: qIdx < numQubits - 1 ? 12 : 0,
              }}
            >
              {/* تسمية الكيوبت */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--fg-3)',
                  minWidth: 36,
                  textAlign: 'left',
                }}
              >
                Q{qIdx}
              </div>

              {/* خط الكيوبت */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
                {/* الخط الأفقي */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'var(--border)',
                    transform: 'translateY(-50%)',
                  }}
                />

                {/* البوابات على هذا الكيوبت */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                  {gatesByQubit(qIdx).map(({ step, idx }) => {
                    const gInfo = getGateInfo(step.gate);
                    const is2QGate = step.control !== undefined;
                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* رابط خط للبوابات ثنائية الكيوبت */}
                        {is2QGate && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '50%',
                              top: step.control! < qIdx ? -16 : 'auto',
                              bottom: step.control! > qIdx ? -16 : 'auto',
                              width: 2,
                              height: 16,
                              background: gInfo.color,
                              transform: 'translateX(-50%)',
                            }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          title={`احذف ${step.gate} من Q${qIdx}`}
                          aria-label={`احذف بوابة ${step.gate} من الكيوبت ${qIdx}`}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: 8,
                            border: `2px solid ${gInfo.color}`,
                            background: `${gInfo.color}22`,
                            color: gInfo.color,
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          {step.gate === 'CNOT' ? '⊕' : step.gate === 'SWAP' ? '↔' : step.gate === 'CZ' ? 'CZ' : step.gate}
                          {step.angle !== undefined && (
                            <span style={{ fontSize: 9, opacity: 0.8 }}> ({(step.angle / Math.PI).toFixed(1)}π)</span>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {/* زر الإضافة */}
                  <button
                    type="button"
                    onClick={() => handlePlaceGate(qIdx)}
                    disabled={!selectedGate}
                    aria-label={
                      selectedGate ? `أضف بوابة ${selectedGate.label} إلى الكيوبت ${qIdx}` : 'اختر بوابة أولاً'
                    }
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: '1px dashed',
                      borderColor: selectedGate ? selectedGate.color : 'var(--border)',
                      background: selectedGate ? `${selectedGate.color}11` : 'transparent',
                      color: selectedGate ? selectedGate.color : 'var(--fg-3)',
                      cursor: selectedGate ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── رسالة الخطأ ─────────────────────────────────────── */}
      {error && (
        <div
          className="ui-chip"
          role="alert"
          style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', fontFamily: 'var(--font-ar)', fontSize: 13 }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ─── مقاييس الدائرة ──────────────────────────────────── */}
      {metrics && circuit.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 12,
            background: 'var(--bg-2, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
          }}
          aria-label="مقاييس الدائرة الكمية"
        >
          {[
            { label: 'البوابات', value: metrics.totalGates },
            { label: '1-كيوبت', value: metrics.singleQubitGates },
            { label: '2-كيوبت', value: metrics.twoQubitGates },
            { label: 'العمق', value: metrics.estimatedDepth },
          ].map((m) => (
            <div key={m.label} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>{m.label}:</span>
              <span className="ui-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── الأزرار ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {/* وضع خطوة بخطوة */}
        <button
          type="button"
          className="ui-btn ui-btn-tonal"
          onClick={() => setStepMode((v) => !v)}
          aria-pressed={stepMode}
          aria-label="تبديل وضع خطوة بخطوة"
          style={{ fontSize: 12, opacity: stepMode ? 1 : 0.6 }}
        >
          <StepForward size={14} />
          {stepMode ? 'خطوة بخطوة ✓' : 'خطوة بخطوة'}
        </button>

        <button
          type="button"
          className="ui-btn"
          onClick={handleRun}
          disabled={running || circuit.length === 0}
          aria-label="تشغيل الدائرة الكمية"
          style={{
            background: 'var(--p-primary)',
            color: '#fff',
            border: 'none',
            opacity: running || circuit.length === 0 ? 0.5 : 1,
          }}
        >
          <Play size={15} />
          {running ? 'جارٍ التشغيل…' : 'تشغيل الدائرة'}
        </button>

        <button
          type="button"
          className="ui-btn ui-btn-outlined"
          onClick={handleExport}
          disabled={circuit.length === 0}
          aria-label="تصدير الدائرة كـ JSON"
          style={{ opacity: circuit.length === 0 ? 0.5 : 1 }}
        >
          <Download size={15} />
          تصدير
        </button>

        {/* استيراد JSON */}
        <label className="ui-btn ui-btn-outlined" style={{ cursor: 'pointer' }} aria-label="استيراد دائرة من JSON">
          <Upload size={15} />
          استيراد
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>

        <button type="button" className="ui-btn ui-btn-tonal" onClick={handleClear} aria-label="مسح الدائرة">
          <Trash2 size={15} />
          مسح
        </button>
      </div>

      {/* ─── النتائج: التوزيع الاحتمالي ─────────────────────── */}
      {probabilities && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              توزيع الاحتماليات (Probability Distribution):
            </span>
            {entropy !== null && !stepMode && (
              <span
                className="ui-badge"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                title="انتروبيا فون نيومان التقريبية"
              >
                S ≈ {entropy.toFixed(3)} bit
              </span>
            )}
          </div>

          {/* عرض لقطات الخطوات إن وُجدت */}
          {stepMode && stepProbs.length > 1 && (
            <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stepProbs.map(({ step }) => (
                <span key={step} className="ui-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  بوابة {step}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gap: 6,
              maxHeight: 320,
              overflowY: 'auto',
              borderRadius: 14,
              border: '1px solid var(--border)',
              padding: '10px 12px',
              background: 'var(--bg-2, rgba(255,255,255,0.02))',
            }}
            aria-label="نتائج توزيع الاحتماليات"
          >
            {probabilities.map((prob, idx) =>
              prob > 1e-6 ? (
                <div key={idx} style={{ display: 'grid', gap: 3 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', minWidth: 60 }}>
                      {basisLabel(idx)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                  {/* شريط التقدم */}
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'var(--bg)',
                      overflow: 'hidden',
                    }}
                    role="progressbar"
                    aria-valuenow={Math.round(prob * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`احتمال الحالة ${basisLabel(idx)}`}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(prob / maxProb) * 100}%`,
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, var(--p-primary), var(--p-secondary, #8b5cf6))',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ) : null,
            )}
            {probabilities.every((p) => p <= 1e-6) && (
              <div
                style={{
                  fontFamily: 'var(--font-ar)',
                  fontSize: 12,
                  color: 'var(--fg-3)',
                  textAlign: 'center',
                  padding: 8,
                }}
              >
                جميع الاحتماليات صفر — تحقق من الدائرة
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ملاحظة المساعدة ─────────────────────────────────── */}
      {circuit.length === 0 && !probabilities && (
        <div
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: 12,
            color: 'var(--fg-3)',
            textAlign: 'center',
            padding: '10px 0',
            lineHeight: 1.8,
          }}
        >
          اختر بوابة من شريط الأدوات، ثم انقر على خط الكيوبت لإضافتها.
          <br />
          انقر على بوابة موجودة لحذفها. يمكنك استيراد دائرة جاهزة بصيغة JSON.
        </div>
      )}
    </div>
  );
};

export default QuantumCircuitDesigner;
