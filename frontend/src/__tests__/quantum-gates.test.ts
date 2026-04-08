import { describe, expect, it } from 'vitest';
import { complexAbs } from '../core/quantum-core';
import {
  GATE_H,
  GATE_S,
  GATE_T,
  GATE_X,
  GATE_Y,
  GATE_Z,
  type StateVector1Q,
  type StateVector2Q,
  applyGate1Q,
  applyGateCNOT,
  createBellState,
  gateRX,
  gateRY,
  gateRZ,
} from '../core/quantum-gates';

const SQRT2_INV = 1 / Math.sqrt(2);

// Helper: probability of measuring |0⟩ for a single-qubit state
const _prob0 = (sv: StateVector1Q) => complexAbs(sv[0]) ** 2;
const _prob1 = (sv: StateVector1Q) => complexAbs(sv[1]) ** 2;

// ─── Gate matrices ───────────────────────────────────────────────────────────

describe('GATE_H (Hadamard)', () => {
  it('has correct matrix entries', () => {
    expect(GATE_H[0][0].real).toBeCloseTo(SQRT2_INV, 10);
    expect(GATE_H[0][1].real).toBeCloseTo(SQRT2_INV, 10);
    expect(GATE_H[1][0].real).toBeCloseTo(SQRT2_INV, 10);
    expect(GATE_H[1][1].real).toBeCloseTo(-SQRT2_INV, 10);
  });

  it('H|0⟩ → |+⟩ (equal superposition)', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(GATE_H, state);
    expect(complexAbs(result[0])).toBeCloseTo(SQRT2_INV, 10);
    expect(complexAbs(result[1])).toBeCloseTo(SQRT2_INV, 10);
  });

  it('H|1⟩ → |-⟩ (equal superposition)', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const result = applyGate1Q(GATE_H, state);
    expect(complexAbs(result[0])).toBeCloseTo(SQRT2_INV, 10);
    expect(complexAbs(result[1])).toBeCloseTo(SQRT2_INV, 10);
  });

  it('H is self-inverse (H·H = I)', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const once = applyGate1Q(GATE_H, state);
    const twice = applyGate1Q(GATE_H, once);
    expect(twice[0].real).toBeCloseTo(1, 10);
    expect(twice[0].imag).toBeCloseTo(0, 10);
    expect(twice[1].real).toBeCloseTo(0, 10);
    expect(twice[1].imag).toBeCloseTo(0, 10);
  });
});

describe('GATE_X (Pauli-X / NOT)', () => {
  it('X|0⟩ = |1⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(GATE_X, state);
    expect(result[0].real).toBeCloseTo(0, 10);
    expect(result[1].real).toBeCloseTo(1, 10);
  });

  it('X|1⟩ = |0⟩', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const result = applyGate1Q(GATE_X, state);
    expect(result[0].real).toBeCloseTo(1, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
  });

  it('X is self-inverse (X·X = I)', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const twice = applyGate1Q(GATE_X, applyGate1Q(GATE_X, state));
    expect(twice[0].real).toBeCloseTo(1, 10);
    expect(twice[1].real).toBeCloseTo(0, 10);
  });
});

describe('GATE_Y (Pauli-Y)', () => {
  it('Y|0⟩ = i|1⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(GATE_Y, state);
    expect(result[0].real).toBeCloseTo(0, 10);
    expect(result[0].imag).toBeCloseTo(0, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
    expect(result[1].imag).toBeCloseTo(1, 10);
  });

  it('Y|1⟩ = -i|0⟩', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const result = applyGate1Q(GATE_Y, state);
    expect(result[0].real).toBeCloseTo(0, 10);
    expect(result[0].imag).toBeCloseTo(-1, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
    expect(result[1].imag).toBeCloseTo(0, 10);
  });
});

describe('GATE_Z (Pauli-Z)', () => {
  it('Z|0⟩ = |0⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(GATE_Z, state);
    expect(result[0].real).toBeCloseTo(1, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
  });

  it('Z|1⟩ = -|1⟩', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const result = applyGate1Q(GATE_Z, state);
    expect(result[0].real).toBeCloseTo(0, 10);
    expect(result[1].real).toBeCloseTo(-1, 10);
  });
});

describe('GATE_S (Phase π/2)', () => {
  it('S|0⟩ = |0⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(GATE_S, state);
    expect(result[0].real).toBeCloseTo(1, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
  });

  it('S|1⟩ = i|1⟩', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const result = applyGate1Q(GATE_S, state);
    expect(result[1].imag).toBeCloseTo(1, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
  });
});

describe('GATE_T (Phase π/4)', () => {
  it('T|0⟩ = |0⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(GATE_T, state);
    expect(result[0].real).toBeCloseTo(1, 10);
  });

  it('T|1⟩ has |amplitude|=1', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const result = applyGate1Q(GATE_T, state);
    expect(complexAbs(result[1])).toBeCloseTo(1, 10);
  });

  it('T applied twice = S', () => {
    const state: StateVector1Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
    ];
    const t2 = applyGate1Q(GATE_T, applyGate1Q(GATE_T, state));
    const s = applyGate1Q(GATE_S, state);
    expect(t2[1].real).toBeCloseTo(s[1].real, 10);
    expect(t2[1].imag).toBeCloseTo(s[1].imag, 10);
  });
});

// ─── Rotation gates ───────────────────────────────────────────────────────────

describe('gateRZ', () => {
  it('RZ(0) is identity', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(gateRZ(0), state);
    expect(complexAbs(result[0])).toBeCloseTo(1, 10);
    expect(complexAbs(result[1])).toBeCloseTo(0, 10);
  });

  it('preserves norm for |+⟩ state', () => {
    const state: StateVector1Q = [
      { real: SQRT2_INV, imag: 0 },
      { real: SQRT2_INV, imag: 0 },
    ];
    const result = applyGate1Q(gateRZ(Math.PI / 4), state);
    const norm = complexAbs(result[0]) ** 2 + complexAbs(result[1]) ** 2;
    expect(norm).toBeCloseTo(1, 10);
  });

  it('RZ(2π) ≈ identity (up to global phase)', () => {
    const gate = gateRZ(2 * Math.PI);
    expect(complexAbs(gate[0][0])).toBeCloseTo(1, 10);
    expect(complexAbs(gate[1][1])).toBeCloseTo(1, 10);
    expect(complexAbs(gate[0][1])).toBeCloseTo(0, 10);
    expect(complexAbs(gate[1][0])).toBeCloseTo(0, 10);
  });
});

describe('gateRX', () => {
  it('RX(π) flips |0⟩ → -i|1⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(gateRX(Math.PI), state);
    expect(complexAbs(result[0])).toBeCloseTo(0, 10);
    expect(complexAbs(result[1])).toBeCloseTo(1, 10);
  });

  it('preserves norm for arbitrary angle', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(gateRX(1.23), state);
    const norm = complexAbs(result[0]) ** 2 + complexAbs(result[1]) ** 2;
    expect(norm).toBeCloseTo(1, 10);
  });
});

describe('gateRY', () => {
  it('RY(π) flips |0⟩ → |1⟩', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(gateRY(Math.PI), state);
    expect(complexAbs(result[0])).toBeCloseTo(0, 10);
    expect(complexAbs(result[1])).toBeCloseTo(1, 10);
  });

  it('RY(π/2)|0⟩ gives equal superposition', () => {
    const state: StateVector1Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGate1Q(gateRY(Math.PI / 2), state);
    expect(complexAbs(result[0])).toBeCloseTo(SQRT2_INV, 10);
    expect(complexAbs(result[1])).toBeCloseTo(SQRT2_INV, 10);
  });
});

// ─── CNOT gate ────────────────────────────────────────────────────────────────

describe('GATE_CNOT', () => {
  it('CNOT|00⟩ = |00⟩', () => {
    const state: StateVector2Q = [
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGateCNOT(state);
    expect(result[0].real).toBeCloseTo(1, 10);
    expect(result[1].real).toBeCloseTo(0, 10);
    expect(result[2].real).toBeCloseTo(0, 10);
    expect(result[3].real).toBeCloseTo(0, 10);
  });

  it('CNOT|10⟩ = |11⟩ (flips target when control=1)', () => {
    const state: StateVector2Q = [
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGateCNOT(state);
    expect(result[2].real).toBeCloseTo(0, 10);
    expect(result[3].real).toBeCloseTo(1, 10);
  });

  it('CNOT|01⟩ = |01⟩ (no change when control=0)', () => {
    const state: StateVector2Q = [
      { real: 0, imag: 0 },
      { real: 1, imag: 0 },
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
    ];
    const result = applyGateCNOT(state);
    expect(result[1].real).toBeCloseTo(1, 10);
    expect(result[0].real).toBeCloseTo(0, 10);
    expect(result[2].real).toBeCloseTo(0, 10);
    expect(result[3].real).toBeCloseTo(0, 10);
  });
});

// ─── createBellState ─────────────────────────────────────────────────────────

describe('createBellState', () => {
  it('creates |Φ+⟩ = (|00⟩+|11⟩)/√2', () => {
    const bell = createBellState();
    // Only |00⟩ and |11⟩ have amplitude
    expect(complexAbs(bell[0])).toBeCloseTo(SQRT2_INV, 10); // |00⟩
    expect(complexAbs(bell[1])).toBeCloseTo(0, 10); // |01⟩
    expect(complexAbs(bell[2])).toBeCloseTo(0, 10); // |10⟩
    expect(complexAbs(bell[3])).toBeCloseTo(SQRT2_INV, 10); // |11⟩
  });

  it('is normalized (total probability = 1)', () => {
    const bell = createBellState();
    const total = bell.reduce((sum, c) => sum + complexAbs(c) ** 2, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});
