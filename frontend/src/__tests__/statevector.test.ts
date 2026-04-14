import { describe, expect, it } from 'vitest';
import { GATE_H, GATE_X } from '../core/quantum-gates';
import {
  applyCNOT,
  applyGate,
  createBasisState,
  createZeroState,
  getProbabilities,
  runCircuit,
  vonNeumannEntropy,
} from '../core/statevector';

// ─── createZeroState ──────────────────────────────────────────────────────────

describe('createZeroState', () => {
  it('1-qubit |0⟩ has amplitude 1 at index 0', () => {
    const sv = createZeroState(1);
    expect(sv.amplitudes[0]).toEqual({ real: 1, imag: 0 });
    expect(sv.amplitudes[1]).toEqual({ real: 0, imag: 0 });
  });

  it('2-qubit |00⟩ has amplitude 1 at index 0 only', () => {
    const sv = createZeroState(2);
    expect(sv.amplitudes[0]).toEqual({ real: 1, imag: 0 });
    expect(sv.amplitudes.slice(1).every((a) => a.real === 0 && a.imag === 0)).toBe(true);
  });

  it('allocates 2^n amplitudes', () => {
    expect(createZeroState(1).amplitudes).toHaveLength(2);
    expect(createZeroState(3).amplitudes).toHaveLength(8);
    expect(createZeroState(4).amplitudes).toHaveLength(16);
  });

  it('throws for 0 qubits', () => {
    expect(() => createZeroState(0)).toThrow(RangeError);
  });

  it('throws for > 16 qubits', () => {
    expect(() => createZeroState(17)).toThrow(RangeError);
  });

  it('stores numQubits', () => {
    expect(createZeroState(3).numQubits).toBe(3);
  });
});

// ─── createBasisState ─────────────────────────────────────────────────────────

describe('createBasisState', () => {
  it('creates |1⟩ for 1 qubit', () => {
    const sv = createBasisState(1, 1);
    expect(sv.amplitudes[1]).toEqual({ real: 1, imag: 0 });
    expect(sv.amplitudes[0]).toEqual({ real: 0, imag: 0 });
  });

  it('creates |010⟩ (index 2) for 3 qubits', () => {
    const sv = createBasisState(3, 2);
    expect(sv.amplitudes[2]).toEqual({ real: 1, imag: 0 });
    sv.amplitudes.forEach((a, i) => {
      if (i !== 2) expect(a).toEqual({ real: 0, imag: 0 });
    });
  });

  it('throws for negative basisState', () => {
    expect(() => createBasisState(2, -1)).toThrow(RangeError);
  });

  it('throws for basisState >= 2^n', () => {
    expect(() => createBasisState(2, 4)).toThrow(RangeError);
  });
});

// ─── applyGate ────────────────────────────────────────────────────────────────

describe('applyGate', () => {
  it('H on qubit 0 of |0⟩ creates superposition', () => {
    const sv = createZeroState(1);
    const result = applyGate(sv, GATE_H, 0);
    const probs = getProbabilities(result);
    expect(probs[0]).toBeCloseTo(0.5, 10);
    expect(probs[1]).toBeCloseTo(0.5, 10);
  });

  it('X on qubit 0 of |0⟩ flips to |1⟩', () => {
    const sv = createZeroState(1);
    const result = applyGate(sv, GATE_X, 0);
    const probs = getProbabilities(result);
    expect(probs[0]).toBeCloseTo(0, 10);
    expect(probs[1]).toBeCloseTo(1, 10);
  });

  it('throws for out-of-range target qubit', () => {
    const sv = createZeroState(2);
    expect(() => applyGate(sv, GATE_H, 2)).toThrow(RangeError);
    expect(() => applyGate(sv, GATE_H, -1)).toThrow(RangeError);
  });

  it('H applied to qubit 1 of 2-qubit |00⟩', () => {
    const sv = createZeroState(2);
    const result = applyGate(sv, GATE_H, 1);
    const probs = getProbabilities(result);
    // |00⟩ and |10⟩ should each have probability 0.5
    expect(probs[0]).toBeCloseTo(0.5, 10); // |00⟩
    expect(probs[2]).toBeCloseTo(0.5, 10); // |10⟩
    expect(probs[1]).toBeCloseTo(0, 10);
    expect(probs[3]).toBeCloseTo(0, 10);
  });
});

// ─── applyCNOT ───────────────────────────────────────────────────────────────

describe('applyCNOT', () => {
  it('CNOT on |10⟩ → |11⟩', () => {
    let sv = createZeroState(2);
    sv = applyGate(sv, GATE_X, 1); // set qubit 1 to |1⟩ → state |10⟩ (index 2)
    const result = applyCNOT(sv, 1, 0);
    const probs = getProbabilities(result);
    expect(probs[3]).toBeCloseTo(1, 10); // |11⟩
  });

  it('CNOT on |00⟩ → |00⟩ (no change)', () => {
    const sv = createZeroState(2);
    const result = applyCNOT(sv, 0, 1);
    const probs = getProbabilities(result);
    expect(probs[0]).toBeCloseTo(1, 10);
  });

  it('throws when control === target', () => {
    const sv = createZeroState(2);
    expect(() => applyCNOT(sv, 0, 0)).toThrow();
  });
});

// ─── getProbabilities ─────────────────────────────────────────────────────────

describe('getProbabilities', () => {
  it('sums to 1 for |0⟩', () => {
    const sv = createZeroState(1);
    const probs = getProbabilities(sv);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('sums to 1 after H gate', () => {
    const sv = applyGate(createZeroState(1), GATE_H, 0);
    const probs = getProbabilities(sv);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('length equals 2^n', () => {
    expect(getProbabilities(createZeroState(3))).toHaveLength(8);
  });
});

// ─── runCircuit ───────────────────────────────────────────────────────────────

describe('runCircuit', () => {
  it('empty circuit returns |0...0⟩', () => {
    const sv = runCircuit(2, []);
    const probs = getProbabilities(sv);
    expect(probs[0]).toBeCloseTo(1, 10);
  });

  it('H then H on qubit 0 restores |0⟩', () => {
    const sv = runCircuit(1, [
      { gate: 'H', target: 0 },
      { gate: 'H', target: 0 },
    ]);
    const probs = getProbabilities(sv);
    expect(probs[0]).toBeCloseTo(1, 10);
    expect(probs[1]).toBeCloseTo(0, 10);
  });

  it('H + CNOT creates Bell state', () => {
    const sv = runCircuit(2, [
      { gate: 'H', target: 1 },
      { gate: 'CNOT', target: 0, control: 1 },
    ]);
    const probs = getProbabilities(sv);
    // Bell state: equal probability for |00⟩ and |11⟩
    expect(probs[0]).toBeCloseTo(0.5, 10);
    expect(probs[3]).toBeCloseTo(0.5, 10);
    expect(probs[1]).toBeCloseTo(0, 10);
    expect(probs[2]).toBeCloseTo(0, 10);
  });

  it('CNOT without control throws', () => {
    expect(() => runCircuit(2, [{ gate: 'CNOT', target: 0 }])).toThrow();
  });

  it('RZ without angle throws', () => {
    expect(() => runCircuit(1, [{ gate: 'RZ', target: 0 }])).toThrow();
  });

  it('RX with angle applies rotation', () => {
    const sv = runCircuit(1, [{ gate: 'RX', target: 0, angle: Math.PI }]);
    const probs = getProbabilities(sv);
    expect(probs[1]).toBeCloseTo(1, 10);
  });

  it('RY with angle applies rotation', () => {
    const sv = runCircuit(1, [{ gate: 'RY', target: 0, angle: Math.PI }]);
    const probs = getProbabilities(sv);
    expect(probs[1]).toBeCloseTo(1, 10);
  });

  it('applies X, Y, Z, S, T gates without error', () => {
    expect(() =>
      runCircuit(1, [
        { gate: 'X', target: 0 },
        { gate: 'Y', target: 0 },
        { gate: 'Z', target: 0 },
        { gate: 'S', target: 0 },
        { gate: 'T', target: 0 },
      ]),
    ).not.toThrow();
  });
});

// ─── vonNeumannEntropy ────────────────────────────────────────────────────────

describe('vonNeumannEntropy', () => {
  it('pure state |0⟩ has entropy 0', () => {
    const sv = createZeroState(1);
    expect(vonNeumannEntropy(sv)).toBeCloseTo(0, 10);
  });

  it('maximally mixed |+⟩ state has entropy 1', () => {
    const sv = applyGate(createZeroState(1), GATE_H, 0);
    expect(vonNeumannEntropy(sv)).toBeCloseTo(1, 10);
  });

  it('2-qubit Bell state has entropy 1', () => {
    const sv = runCircuit(2, [
      { gate: 'H', target: 1 },
      { gate: 'CNOT', target: 0, control: 1 },
    ]);
    expect(vonNeumannEntropy(sv)).toBeCloseTo(1, 10);
  });

  it('entropy is non-negative', () => {
    const sv = runCircuit(3, [
      { gate: 'H', target: 0 },
      { gate: 'H', target: 2 },
    ]);
    expect(vonNeumannEntropy(sv)).toBeGreaterThanOrEqual(0);
  });
});
