/**
 * quantum-gates.ts – بوابات كمية أساسية
 * QURABIA
 *
 * تطبيقات مصفوفات البوابات الكمية:
 * Hadamard, Pauli X/Y/Z, CNOT, RZ, Phase
 */

import type { Complex } from '../types/quantum.types';
import { complexAdd, complexExp, complexMul } from './quantum-core';

// ================================================================
// أنواع البيانات
// ================================================================

/** مصفوفة بوابة كمية 2×2 (حالة كيوبت واحد) */
export type GateMatrix1Q = [[Complex, Complex], [Complex, Complex]];

/** مصفوفة بوابة كمية 4×4 (حالة كيوبتين) */
export type GateMatrix2Q = [
  [Complex, Complex, Complex, Complex],
  [Complex, Complex, Complex, Complex],
  [Complex, Complex, Complex, Complex],
  [Complex, Complex, Complex, Complex],
];

/** متجه حالة كيوبت واحد [α, β] بحيث |α|²+|β|²=1 */
export type StateVector1Q = [Complex, Complex];

/** متجه حالة كيوبتين [α₀₀, α₀₁, α₁₀, α₁₁] */
export type StateVector2Q = [Complex, Complex, Complex, Complex];

// ================================================================
// ثوابت مساعدة
// ================================================================

const C = (real: number, imag = 0): Complex => ({ real, imag });
const SQRT2_INV = 1 / Math.sqrt(2);

// ================================================================
// بوابات كيوبت واحد (Single-Qubit Gates)
// ================================================================

/**
 * بوابة هادامارد (H)
 * H = (1/√2) [[1, 1], [1, -1]]
 * تحوّل |0⟩ → |+⟩ و |1⟩ → |-⟩
 */
export const GATE_H: GateMatrix1Q = [
  [C(SQRT2_INV), C(SQRT2_INV)],
  [C(SQRT2_INV), C(-SQRT2_INV)],
];

/**
 * بوابة بولي-X (NOT الكمي)
 * X = [[0, 1], [1, 0]]
 */
export const GATE_X: GateMatrix1Q = [
  [C(0), C(1)],
  [C(1), C(0)],
];

/**
 * بوابة بولي-Y
 * Y = [[0, -i], [i, 0]]
 */
export const GATE_Y: GateMatrix1Q = [
  [C(0, 0), C(0, -1)],
  [C(0, 1), C(0, 0)],
];

/**
 * بوابة بولي-Z
 * Z = [[1, 0], [0, -1]]
 */
export const GATE_Z: GateMatrix1Q = [
  [C(1), C(0)],
  [C(0), C(-1)],
];

/**
 * بوابة S (المرحلة π/2)
 * S = [[1, 0], [0, i]]
 */
export const GATE_S: GateMatrix1Q = [
  [C(1), C(0)],
  [C(0), C(0, 1)],
];

/**
 * بوابة T (المرحلة π/4)
 * T = [[1, 0], [0, e^(iπ/4)]]
 */
export const GATE_T: GateMatrix1Q = [
  [C(1), C(0)],
  [C(0), complexExp(Math.PI / 4)],
];

/**
 * بوابة RZ(θ) – تدوير حول محور Z
 * RZ(θ) = [[e^(-iθ/2), 0], [0, e^(iθ/2)]]
 * @param theta - زاوية التدوير بالراديان
 */
export const gateRZ = (theta: number): GateMatrix1Q => {
  const half = theta / 2;
  return [
    [{ real: Math.cos(-half), imag: Math.sin(-half) }, C(0)],
    [C(0), { real: Math.cos(half), imag: Math.sin(half) }],
  ];
};

/**
 * بوابة RX(θ) – تدوير حول محور X
 * RX(θ) = [[cos(θ/2), -i·sin(θ/2)], [-i·sin(θ/2), cos(θ/2)]]
 */
export const gateRX = (theta: number): GateMatrix1Q => {
  const half = theta / 2;
  const c = Math.cos(half);
  const s = Math.sin(half);
  return [
    [C(c), C(0, -s)],
    [C(0, -s), C(c)],
  ];
};

/**
 * بوابة RY(θ) – تدوير حول محور Y
 * RY(θ) = [[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]
 */
export const gateRY = (theta: number): GateMatrix1Q => {
  const half = theta / 2;
  const c = Math.cos(half);
  const s = Math.sin(half);
  return [
    [C(c), C(-s)],
    [C(s), C(c)],
  ];
};

// ================================================================
// بوابة CNOT (كيوبتان)
// ================================================================

/**
 * بوابة CNOT (التحكم-NOT)
 * تطبّق X على الكيوبت الهدف عندما يكون الكيوبت المتحكم = |1⟩
 * CNOT = I ⊗ |0⟩⟨0| + X ⊗ |1⟩⟨1|
 *
 * في الأساس |00⟩,|01⟩,|10⟩,|11⟩:
 * [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]
 */
export const GATE_CNOT: GateMatrix2Q = [
  [C(1), C(0), C(0), C(0)],
  [C(0), C(1), C(0), C(0)],
  [C(0), C(0), C(0), C(1)],
  [C(0), C(0), C(1), C(0)],
];

/**
 * بوابة SWAP — تبادل حالتي كيوبتين
 * تبادل السعات بين الحالتين |01⟩ و|10⟩
 *
 * في الأساس |00⟩,|01⟩,|10⟩,|11⟩:
 * [[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]]
 */
export const GATE_SWAP: GateMatrix2Q = [
  [C(1), C(0), C(0), C(0)],
  [C(0), C(0), C(1), C(0)],
  [C(0), C(1), C(0), C(0)],
  [C(0), C(0), C(0), C(1)],
];

// ================================================================
// تطبيق البوابة على متجه الحالة
// ================================================================

/**
 * تطبيق بوابة كيوبت واحد على متجه الحالة
 * |ψ'⟩ = G·|ψ⟩
 */
export function applyGate1Q(gate: GateMatrix1Q, state: StateVector1Q): StateVector1Q {
  return [
    complexAdd(complexMul(gate[0][0], state[0]), complexMul(gate[0][1], state[1])),
    complexAdd(complexMul(gate[1][0], state[0]), complexMul(gate[1][1], state[1])),
  ];
}

/**
 * تطبيق بوابة CNOT على متجه حالة كيوبتين
 * |ψ'⟩ = CNOT·|ψ⟩
 */
export function applyGateCNOT(state: StateVector2Q): StateVector2Q {
  return [
    complexAdd(
      complexAdd(complexMul(GATE_CNOT[0][0], state[0]), complexMul(GATE_CNOT[0][1], state[1])),
      complexAdd(complexMul(GATE_CNOT[0][2], state[2]), complexMul(GATE_CNOT[0][3], state[3])),
    ),
    complexAdd(
      complexAdd(complexMul(GATE_CNOT[1][0], state[0]), complexMul(GATE_CNOT[1][1], state[1])),
      complexAdd(complexMul(GATE_CNOT[1][2], state[2]), complexMul(GATE_CNOT[1][3], state[3])),
    ),
    complexAdd(
      complexAdd(complexMul(GATE_CNOT[2][0], state[0]), complexMul(GATE_CNOT[2][1], state[1])),
      complexAdd(complexMul(GATE_CNOT[2][2], state[2]), complexMul(GATE_CNOT[2][3], state[3])),
    ),
    complexAdd(
      complexAdd(complexMul(GATE_CNOT[3][0], state[0]), complexMul(GATE_CNOT[3][1], state[1])),
      complexAdd(complexMul(GATE_CNOT[3][2], state[2]), complexMul(GATE_CNOT[3][3], state[3])),
    ),
  ];
}

/**
 * إنشاء حالة Bell (التشابك الكامل)
 * |Φ+⟩ = (|00⟩ + |11⟩) / √2
 * تطبق: H على الكيوبت الأول، ثم CNOT
 */
export function createBellState(): StateVector2Q {
  // |ψ₀⟩ = |00⟩
  const initial: StateVector1Q = [C(1), C(0)];

  // تطبيق H على |0⟩ → |+⟩ = (|0⟩+|1⟩)/√2
  const afterH = applyGate1Q(GATE_H, initial);

  // بناء ⊗ |0⟩: [α|0⟩+β|1⟩] ⊗ |0⟩ = α|00⟩ + β|10⟩
  const twoQubit: StateVector2Q = [afterH[0], C(0), afterH[1], C(0)];

  // تطبيق CNOT
  return applyGateCNOT(twoQubit);
}
