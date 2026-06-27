import { describe, expect, it } from 'vitest';
import { getProbabilities } from '../core/statevector';
import { compileQuantumProgram, executeCompiledProgram, parseQuantumSource } from '../core/quantum-compiler';

describe('parseQuantumSource', () => {
  it('parses a simple Bell-prep program', () => {
    const circuit = parseQuantumSource('H q0\nCNOT q0,q1');
    expect(circuit.numQubits).toBe(2);
    expect(circuit.instructions).toHaveLength(2);
    expect(circuit.instructions[0]).toMatchObject({ kind: 'gate', gate: 'H', targets: [0] });
    expect(circuit.instructions[1]).toMatchObject({ kind: 'gate', gate: 'CNOT', targets: [0, 1] });
  });
});

describe('compileQuantumProgram', () => {
  it('removes redundant H-H pairs with an optimization pass', () => {
    const compiled = compileQuantumProgram('H q0\nH q0');
    expect(compiled.optimizationsApplied).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'cancel-pair-H', applied: true })]),
    );
    expect(compiled.operations).toHaveLength(0);
    expect(compiled.gateSummary.totalGates).toBe(0);
  });

  it('creates a rotation execution plan for RX gates', () => {
    const compiled = compileQuantumProgram('RX(0.5) q0');
    expect(compiled.operations).toEqual([{ gate: 'RX', target: 0, angle: 0.5 }]);
    expect(compiled.estimatedDepth).toBeGreaterThanOrEqual(1);
  });
});

describe('executeCompiledProgram', () => {
  it('executes a Bell circuit and produces the expected probabilities', () => {
    const compiled = compileQuantumProgram('H q0\nCNOT q0,q1');
    const result = executeCompiledProgram(compiled);
    const probabilities = getProbabilities(result.stateVector);

    expect(probabilities[0]).toBeCloseTo(0.5, 10);
    expect(probabilities[3]).toBeCloseTo(0.5, 10);
    expect(probabilities[1]).toBeCloseTo(0, 10);
    expect(probabilities[2]).toBeCloseTo(0, 10);
  });

  it('collects measurement results for measurement instructions', () => {
    const compiled = compileQuantumProgram('H q0\nMEASURE q0');
    const result = executeCompiledProgram(compiled);
    expect(result.measurementResults).toHaveLength(1);
    expect(result.measurementResults[0].qubit).toBe(0);
    expect([0, 1]).toContain(result.measurementResults[0].value);
  });
});
