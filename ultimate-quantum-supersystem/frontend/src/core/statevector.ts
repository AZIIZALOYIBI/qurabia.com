/**
 * statevector.ts – محاكي متجه الحالة الكمية
 * Ultimate Quantum SuperSystem v5.0
 *
 * يدير متجه الحالة الكاملة لـ n كيوبت
 * الحالة: مصفوفة من 2^n عدد مركب
 * يدعم تطبيق البوابات والقياس والتشابك
 */

import type { Complex } from '../types/quantum.types';
import { complexAdd, complexMul, complexAbs } from './quantum-core';
import {
  GATE_H, GATE_X, GATE_Y, GATE_Z, GATE_S, GATE_T,
  gateRZ, gateRX, gateRY,
  type GateMatrix1Q,
} from './quantum-gates';

// ================================================================
// نوع متجه الحالة (StateVector)
// ================================================================

/**
 * متجه الحالة الكمية لـ n كيوبت
 * الحجم: 2^n
 */
export interface StateVectorData {
  readonly numQubits: number;
  amplitudes: Complex[];
}

// ================================================================
// بناء متجه الحالة
// ================================================================

/**
 * إنشاء متجه حالة ابتدائي |0...0⟩
 * @param numQubits - عدد الكيوبتات (1-16)
 */
export function createZeroState(numQubits: number): StateVectorData {
  if (numQubits < 1 || numQubits > 16) {
    throw new RangeError(`عدد الكيوبتات يجب أن يكون بين 1 و16، القيمة: ${numQubits}`);
  }
  const size = 1 << numQubits; // 2^numQubits
  const amplitudes: Complex[] = Array.from({ length: size }, (_, i) =>
    i === 0 ? { real: 1, imag: 0 } : { real: 0, imag: 0 }
  );
  return { numQubits, amplitudes };
}

/**
 * إنشاء متجه حالة من حالة حسابية محددة
 * @param numQubits - عدد الكيوبتات
 * @param basisState - الحالة الحسابية (0 إلى 2^n - 1)
 */
export function createBasisState(numQubits: number, basisState: number): StateVectorData {
  const size = 1 << numQubits;
  if (basisState < 0 || basisState >= size) {
    throw new RangeError(`الحالة ${basisState} خارج النطاق [0, ${size - 1}]`);
  }
  const amplitudes: Complex[] = Array.from({ length: size }, (_, i) =>
    i === basisState ? { real: 1, imag: 0 } : { real: 0, imag: 0 }
  );
  return { numQubits, amplitudes };
}

// ================================================================
// تطبيق البوابات
// ================================================================

/**
 * تطبيق بوابة كيوبت واحد على كيوبت محدد في المتجه
 * @param sv - متجه الحالة
 * @param gate - مصفوفة البوابة 2×2
 * @param targetQubit - رقم الكيوبت (0 = الأدنى مرتبةً)
 */
export function applyGate(
  sv: StateVectorData,
  gate: GateMatrix1Q,
  targetQubit: number
): StateVectorData {
  if (targetQubit < 0 || targetQubit >= sv.numQubits) {
    throw new RangeError(`الكيوبت ${targetQubit} خارج النطاق [0, ${sv.numQubits - 1}]`);
  }

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const bit = 1 << targetQubit;

  for (let i = 0; i < size; i++) {
    if (i & bit) continue; // معالجة كل زوج مرة واحدة

    const j = i | bit; // الرقم المقابل مع البت مضبوطاً
    const a = sv.amplitudes[i]; // |...0...⟩
    const b = sv.amplitudes[j]; // |...1...⟩

    newAmps[i] = complexAdd(complexMul(gate[0][0], a), complexMul(gate[0][1], b));
    newAmps[j] = complexAdd(complexMul(gate[1][0], a), complexMul(gate[1][1], b));
  }

  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

/**
 * تطبيق بوابة CNOT
 * @param sv - متجه الحالة
 * @param controlQubit - الكيوبت المتحكم
 * @param targetQubit - الكيوبت الهدف
 */
export function applyCNOT(
  sv: StateVectorData,
  controlQubit: number,
  targetQubit: number
): StateVectorData {
  if (controlQubit === targetQubit) throw new Error('الكيوبت المتحكم والهدف يجب أن يكونا مختلفَين');

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const cBit = 1 << controlQubit;
  const tBit = 1 << targetQubit;

  for (let i = 0; i < size; i++) {
    if ((i & cBit) && !(i & tBit)) {
      const j = i | tBit;
      [newAmps[i], newAmps[j]] = [newAmps[j], newAmps[i]];
    }
  }

  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

// ================================================================
// القياس
// ================================================================

/**
 * قياس كيوبت واحد (يُنهار متجه الحالة)
 * @returns نتيجة القياس (0 أو 1) والمتجه المُنهار
 */
export function measureQubit(
  sv: StateVectorData,
  qubit: number
): { result: 0 | 1; postMeasurementState: StateVectorData } {
  const bit = 1 << qubit;
  let prob0 = 0;

  for (let i = 0; i < sv.amplitudes.length; i++) {
    if (!(i & bit)) {
      const amp = sv.amplitudes[i];
      prob0 += amp.real * amp.real + amp.imag * amp.imag;
    }
  }

  const result: 0 | 1 = Math.random() < prob0 ? 0 : 1;
  const normFactor = result === 0 ? prob0 : 1 - prob0;
  const norm = Math.sqrt(Math.max(normFactor, 1e-15));

  const newAmps = sv.amplitudes.map((amp, i) => {
    const hasBit = !!(i & bit);
    if (hasBit !== (result === 1)) return { real: 0, imag: 0 };
    return { real: amp.real / norm, imag: amp.imag / norm };
  });

  return {
    result,
    postMeasurementState: { numQubits: sv.numQubits, amplitudes: newAmps },
  };
}

/**
 * حساب التوزيع الاحتمالي لجميع الحالات
 * @returns مصفوفة من الاحتماليات [|⟨i|ψ⟩|²]
 */
export function getProbabilities(sv: StateVectorData): number[] {
  return sv.amplitudes.map(a => a.real * a.real + a.imag * a.imag);
}

// ================================================================
// أدوات بناء الدوائر
// ================================================================

export type GateName = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RZ' | 'RX' | 'RY' | 'CNOT';

export interface GateOperation {
  gate: GateName;
  target: number;
  control?: number;
  angle?: number;
}

const GATE_MAP: Record<Exclude<GateName, 'RZ' | 'RX' | 'RY' | 'CNOT'>, GateMatrix1Q> = {
  H: GATE_H, X: GATE_X, Y: GATE_Y, Z: GATE_Z, S: GATE_S, T: GATE_T,
};

/**
 * تنفيذ سلسلة من العمليات على متجه الحالة
 */
export function runCircuit(
  numQubits: number,
  operations: GateOperation[]
): StateVectorData {
  let sv = createZeroState(numQubits);

  for (const op of operations) {
    if (op.gate === 'CNOT') {
      if (op.control === undefined) throw new Error('CNOT تحتاج إلى كيوبت تحكم');
      sv = applyCNOT(sv, op.control, op.target);
    } else if (op.gate === 'RZ' || op.gate === 'RX' || op.gate === 'RY') {
      if (op.angle === undefined) throw new Error(`${op.gate} تحتاج إلى زاوية`);
      const g = op.gate === 'RZ' ? gateRZ(op.angle)
              : op.gate === 'RX' ? gateRX(op.angle)
              : gateRY(op.angle);
      sv = applyGate(sv, g, op.target);
    } else {
      sv = applyGate(sv, GATE_MAP[op.gate], op.target);
    }
  }

  return sv;
}

/**
 * حساب انتروبيا فون نيومان التقريبية
 * S ≈ -Σ p_i · log₂(p_i) على توزيع الاحتماليات
 */
export function vonNeumannEntropy(sv: StateVectorData): number {
  const probs = getProbabilities(sv);
  return -probs.reduce((sum, p) => {
    if (p < 1e-15) return sum;
    return sum + p * Math.log2(p);
  }, 0);
}
