/**
 * statevector.ts – محاكي متجه الحالة الكمية
 * QURABIA
 *
 * يدير متجه الحالة الكاملة لـ n كيوبت
 * الحالة: مصفوفة من 2^n عدد مركب
 * يدعم تطبيق البوابات والقياس والتشابك
 */

import type { Complex } from '../types/quantum.types';
import { complexAdd, complexAbs, complexMul } from './quantum-core';
import {
  GATE_H,
  GATE_S,
  GATE_T,
  GATE_X,
  GATE_Y,
  GATE_Z,
  type GateMatrix1Q,
  gateRX,
  gateRY,
  gateRZ,
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
    i === 0 ? { real: 1, imag: 0 } : { real: 0, imag: 0 },
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
    i === basisState ? { real: 1, imag: 0 } : { real: 0, imag: 0 },
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
export function applyGate(sv: StateVectorData, gate: GateMatrix1Q, targetQubit: number): StateVectorData {
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
export function applyCNOT(sv: StateVectorData, controlQubit: number, targetQubit: number): StateVectorData {
  if (controlQubit === targetQubit) throw new Error('الكيوبت المتحكم والهدف يجب أن يكونا مختلفَين');

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const cBit = 1 << controlQubit;
  const tBit = 1 << targetQubit;

  for (let i = 0; i < size; i++) {
    if (i & cBit && !(i & tBit)) {
      const j = i | tBit;
      [newAmps[i], newAmps[j]] = [newAmps[j], newAmps[i]];
    }
  }

  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

/**
 * تطبيق بوابة SWAP — مستوحاة من Quirk (Strilanc/Quirk)
 * تبادل حالتي كيوبتين
 * SWAP = CNOT(a,b) · CNOT(b,a) · CNOT(a,b)
 *
 * @param sv - متجه الحالة
 * @param qubitA - الكيوبت الأول
 * @param qubitB - الكيوبت الثاني
 */
export function applySWAP(sv: StateVectorData, qubitA: number, qubitB: number): StateVectorData {
  if (qubitA === qubitB) throw new Error('الكيوبتان يجب أن يكونا مختلفَين');
  if (qubitA < 0 || qubitA >= sv.numQubits) throw new RangeError(`الكيوبت ${qubitA} خارج النطاق`);
  if (qubitB < 0 || qubitB >= sv.numQubits) throw new RangeError(`الكيوبت ${qubitB} خارج النطاق`);

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const bitA = 1 << qubitA;
  const bitB = 1 << qubitB;

  for (let i = 0; i < size; i++) {
    const hasA = !!(i & bitA);
    const hasB = !!(i & bitB);

    // نحتاج فقط مبادلة الحالات التي فيها A≠B
    if (hasA !== hasB) {
      // حساب الفهرس المقابل (مع عكس البتين)
      const j = i ^ bitA ^ bitB;
      if (i < j) {
        // تجنب المبادلة المزدوجة
        [newAmps[i], newAmps[j]] = [newAmps[j], newAmps[i]];
      }
    }
  }

  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

/**
 * تطبيق بوابة CZ (Controlled-Z) — مستوحاة من Quirk
 * تطبق Phase(-1) على |11⟩ فقط
 *
 * @param sv - متجه الحالة
 * @param controlQubit - الكيوبت المتحكم
 * @param targetQubit - الكيوبت الهدف
 */
export function applyCZ(sv: StateVectorData, controlQubit: number, targetQubit: number): StateVectorData {
  if (controlQubit === targetQubit) throw new Error('الكيوبت المتحكم والهدف يجب أن يكونا مختلفَين');

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const cBit = 1 << controlQubit;
  const tBit = 1 << targetQubit;

  for (let i = 0; i < size; i++) {
    // تطبيق -1 فقط عندما يكون كلا الكيوبتين = |1⟩
    if (i & cBit && i & tBit) {
      newAmps[i] = { real: -newAmps[i].real, imag: -newAmps[i].imag };
    }
  }

  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

/**
 * تطبيق بوابة Toffoli (CCX) — مستوحاة من Quirk
 * بوابة NOT مشروطة بكيوبتين
 *
 * @param sv - متجه الحالة
 * @param control1 - الكيوبت المتحكم الأول
 * @param control2 - الكيوبت المتحكم الثاني
 * @param target - الكيوبت الهدف
 */
export function applyToffoli(sv: StateVectorData, control1: number, control2: number, target: number): StateVectorData {
  const qubits = [control1, control2, target];
  if (new Set(qubits).size !== 3) throw new Error('جميع الكيوبتات يجب أن تكون مختلفة');

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const c1Bit = 1 << control1;
  const c2Bit = 1 << control2;
  const tBit = 1 << target;

  for (let i = 0; i < size; i++) {
    // تطبيق X على الهدف فقط عندما يكون كلا المتحكمَين = |1⟩
    if (i & c1Bit && i & c2Bit && !(i & tBit)) {
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
  qubit: number,
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
  return sv.amplitudes.map((a) => a.real * a.real + a.imag * a.imag);
}

// ================================================================
// أدوات بناء الدوائر
// ================================================================

export type GateName = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RZ' | 'RX' | 'RY' | 'CNOT' | 'SWAP' | 'CZ' | 'CCX';

export interface GateOperation {
  gate: GateName;
  target: number;
  control?: number;
  /** الكيوبت المتحكم الثاني (لبوابة Toffoli/CCX) */
  control2?: number;
  angle?: number;
}

// ================================================================
// مقاييس الدائرة الكمية
// ================================================================

export interface CircuitMetrics {
  /** إجمالي عدد البوابات */
  totalGates: number;
  /** بوابات الكيوبت الواحد */
  singleQubitGates: number;
  /** بوابات الكيوبتين */
  twoQubitGates: number;
  /** بوابات ثلاثة كيوبتات */
  threeQubitGates: number;
  /** عمق الدائرة التقديري (عدد الطبقات) */
  estimatedDepth: number;
}

const TWO_QUBIT_GATES = new Set<GateName>(['CNOT', 'SWAP', 'CZ']);
const THREE_QUBIT_GATES = new Set<GateName>(['CCX']);

/**
 * حساب مقاييس الدائرة الكمية
 * @param operations - قائمة عمليات البوابات
 */
export function computeCircuitMetrics(operations: GateOperation[]): CircuitMetrics {
  let singleQubitGates = 0;
  let twoQubitGates = 0;
  let threeQubitGates = 0;

  for (const op of operations) {
    if (THREE_QUBIT_GATES.has(op.gate)) {
      threeQubitGates++;
    } else if (TWO_QUBIT_GATES.has(op.gate)) {
      twoQubitGates++;
    } else {
      singleQubitGates++;
    }
  }

  // تقدير العمق: بوابات متعددة الكيوبتات تزيد العمق بنسبة أكبر
  const estimatedDepth = singleQubitGates + twoQubitGates * 2 + threeQubitGates * 3;

  return {
    totalGates: operations.length,
    singleQubitGates,
    twoQubitGates,
    threeQubitGates,
    estimatedDepth,
  };
}

// ================================================================
// استخراج بيانات الطور (Phase) من متجه الحالة
// ================================================================

export interface StatePhaseInfo {
  /** فهرس الحالة الحسابية */
  state: number;
  /** شعاع السعة |ψ|² */
  magnitude: number;
  /** زاوية الطور بالراديان */
  phase: number;
}

/**
 * استخراج معلومات الطور لكل حالة في متجه الحالة
 * @returns مصفوفة من معلومات الطور لكل حالة ذات احتمال غير صفري
 */
export function getStatePhases(sv: StateVectorData): StatePhaseInfo[] {
  return sv.amplitudes
    .map((amp, i) => {
      const mag = amp.real * amp.real + amp.imag * amp.imag;
      const phase = Math.atan2(amp.imag, amp.real);
      return { state: i, magnitude: mag, phase };
    })
    .filter((s) => s.magnitude > 1e-10);
}

// ================================================================
// تحويل فورييه الكمي (QFT - Quantum Fourier Transform)
// ================================================================

/**
 * تطبيق بوابة الطور المتحكم CP(θ) على كيوبتين
 * تطبق e^(iθ) على الحالة |11⟩ فقط
 */
function applyControlledPhase(
  sv: StateVectorData,
  controlQubit: number,
  targetQubit: number,
  angle: number,
): StateVectorData {
  if (controlQubit === targetQubit) throw new Error('الكيوبت المتحكم والهدف يجب أن يكونا مختلفَين');

  const size = sv.amplitudes.length;
  const newAmps = [...sv.amplitudes];
  const cBit = 1 << controlQubit;
  const tBit = 1 << targetQubit;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  for (let i = 0; i < size; i++) {
    if (i & cBit && i & tBit) {
      const { real, imag } = newAmps[i];
      newAmps[i] = {
        real: real * cosA - imag * sinA,
        imag: real * sinA + imag * cosA,
      };
    }
  }

  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

/**
 * تطبيق تحويل فورييه الكمي (QFT) على مجموعة من الكيوبتات
 *
 * QFT هو المكافئ الكمي لتحويل فورييه السريع (FFT).
 * يحوّل الحالات الحسابية إلى تكرارات طورية.
 *
 * التعقيد: O(n²) بوابة لـ n كيوبت
 *
 * @param sv - متجه الحالة
 * @param qubits - الكيوبتات المستهدفة (افتراضياً جميع الكيوبتات)
 */
export function applyQFT(sv: StateVectorData, qubits?: number[]): StateVectorData {
  const targets = qubits ?? Array.from({ length: sv.numQubits }, (_, i) => i);
  const m = targets.length;
  let state = sv;

  for (let i = m - 1; i >= 0; i--) {
    state = applyGate(state, GATE_H, targets[i]);
    for (let j = i - 1; j >= 0; j--) {
      const k = i - j + 1;
      const angle = (2 * Math.PI) / (1 << k); // 2π/2^k للبوابة R_k
      state = applyControlledPhase(state, targets[j], targets[i], angle);
    }
  }

  // عكس ترتيب الكيوبتات (مخرج QFT القياسي)
  for (let i = 0; i < Math.floor(m / 2); i++) {
    state = applySWAP(state, targets[i], targets[m - 1 - i]);
  }

  return state;
}

// ================================================================
// أدوات Grover المساعدة
// ================================================================

/**
 * عكس طور الحالة المستهدفة (Oracle)
 * يطبق -1 على سعة الحالة المحددة
 */
export function applyPhaseFlip(sv: StateVectorData, targetState: number): StateVectorData {
  if (targetState < 0 || targetState >= sv.amplitudes.length) {
    throw new RangeError(`الحالة ${targetState} خارج النطاق`);
  }
  const newAmps = [...sv.amplitudes];
  newAmps[targetState] = { real: -newAmps[targetState].real, imag: -newAmps[targetState].imag };
  return { numQubits: sv.numQubits, amplitudes: newAmps };
}

/**
 * تطبيق عملية الانعكاس (Diffusion Operator) لخوارزمية Grover
 * D = 2|+⟩⟨+| - I
 * يضخّم احتمال الحالة المستهدفة
 */
export function applyGroverDiffusion(sv: StateVectorData): StateVectorData {
  const n = sv.amplitudes.length;
  let sumReal = 0;
  let sumImag = 0;

  for (const amp of sv.amplitudes) {
    sumReal += amp.real;
    sumImag += amp.imag;
  }

  const avgReal = sumReal / n;
  const avgImag = sumImag / n;

  return {
    numQubits: sv.numQubits,
    amplitudes: sv.amplitudes.map((a) => ({
      real: 2 * avgReal - a.real,
      imag: 2 * avgImag - a.imag,
    })),
  };
}

const GATE_MAP: Record<Exclude<GateName, 'RZ' | 'RX' | 'RY' | 'CNOT' | 'SWAP' | 'CZ' | 'CCX'>, GateMatrix1Q> = {
  H: GATE_H,
  X: GATE_X,
  Y: GATE_Y,
  Z: GATE_Z,
  S: GATE_S,
  T: GATE_T,
};

/**
 * تنفيذ سلسلة من العمليات على متجه الحالة
 */
export function runCircuit(numQubits: number, operations: GateOperation[]): StateVectorData {
  let sv = createZeroState(numQubits);

  for (const op of operations) {
    if (op.gate === 'CNOT') {
      if (op.control === undefined) throw new Error('CNOT تحتاج إلى كيوبت تحكم');
      sv = applyCNOT(sv, op.control, op.target);
    } else if (op.gate === 'SWAP') {
      if (op.control === undefined) throw new Error('SWAP تحتاج إلى كيوبتين');
      sv = applySWAP(sv, op.control, op.target);
    } else if (op.gate === 'CZ') {
      if (op.control === undefined) throw new Error('CZ تحتاج إلى كيوبت تحكم');
      sv = applyCZ(sv, op.control, op.target);
    } else if (op.gate === 'CCX') {
      if (op.control === undefined || op.control2 === undefined) {
        throw new Error('CCX (Toffoli) تحتاج إلى كيوبتي تحكم');
      }
      sv = applyToffoli(sv, op.control, op.control2, op.target);
    } else if (op.gate === 'RZ' || op.gate === 'RX' || op.gate === 'RY') {
      if (op.angle === undefined) throw new Error(`${op.gate} تحتاج إلى زاوية`);
      const g = op.gate === 'RZ' ? gateRZ(op.angle) : op.gate === 'RX' ? gateRX(op.angle) : gateRY(op.angle);
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

// ================================================================
// قياس القاعدة الإقليدية (Norm)
// ================================================================

/**
 * حساب القاعدة الإقليدية (L2 norm) لمتجه الحالة الكمية
 * norm = sqrt( Σ |α_i|² )
 * للحالة الكمية الصالحة يجب أن تكون ≈ 1
 *
 * @param sv - متجه الحالة
 * @returns القاعدة الإقليدية
 */
export function measureNorm(sv: StateVectorData): number {
  return Math.sqrt(sv.amplitudes.reduce((sum, amp) => {
    const abs = complexAbs(amp);
    return sum + abs * abs;
  }, 0));
}

/**
 * التحقق من أن متجه الحالة مُوحَّد (normalized)
 * |measureNorm(sv) - 1| <= tolerance
 *
 * @param sv - متجه الحالة
 * @param tolerance - هامش الخطأ المقبول (افتراضي: 1e-9)
 * @returns true إذا كان المتجه مُوحَّداً
 */
export function isNormalized(sv: StateVectorData, tolerance = 1e-9): boolean {
  return Math.abs(measureNorm(sv) - 1) <= tolerance;
}
