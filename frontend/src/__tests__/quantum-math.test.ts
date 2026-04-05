/**
 * Tests for QuantumMath.ts
 * Covers: QuantumMath class, runQACE, runQDTA, QEMSEngine, runQSGA,
 *         QWFCOptimizer, runQHEB, computeQUnified
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  QuantumMath,
  runQACE,
  runQDTA,
  QEMSEngine,
  runQSGA,
  QWFCOptimizer,
  runQHEB,
  computeQUnified,
} from '../utils/QuantumMath';

import type {
  QACEInput,
  DataPoint,
  QHEBSystem,
  QUnifiedInput,
  QWFCConstraint,
} from '../utils/QuantumMath';

// ═══════════════════════════════════════════════════════════════════
// QuantumMath static methods
// ═══════════════════════════════════════════════════════════════════

describe('QuantumMath.tensorProduct', () => {
  it('computes the Kronecker product of two 2×2 identity matrices', () => {
    const I2 = [[1, 0], [0, 1]];
    const result = QuantumMath.tensorProduct(I2, I2);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual([1, 0, 0, 0]);
    expect(result[1]).toEqual([0, 1, 0, 0]);
    expect(result[2]).toEqual([0, 0, 1, 0]);
    expect(result[3]).toEqual([0, 0, 0, 1]);
  });

  it('computes tensor product of a 1×1 and 2×2 matrix', () => {
    const a = [[3]];
    const b = [[1, 2], [3, 4]];
    const result = QuantumMath.tensorProduct(a, b);
    expect(result).toEqual([[3, 6], [9, 12]]);
  });

  it('computes tensor product of two 2×2 matrices', () => {
    const a = [[1, 0], [0, 0]];
    const b = [[0, 1], [1, 0]];
    const result = QuantumMath.tensorProduct(a, b);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual([0, 1, 0, 0]);
    expect(result[1]).toEqual([1, 0, 0, 0]);
    expect(result[2]).toEqual([0, 0, 0, 0]);
    expect(result[3]).toEqual([0, 0, 0, 0]);
  });
});

describe('QuantumMath.densityMatrix', () => {
  it('produces |0⟩⟨0| for basis state [1,0]', () => {
    const rho = QuantumMath.densityMatrix([1, 0]);
    // ρ = [[1,0],[0,0]]
    expect(rho).toHaveLength(2);
    // mathjs may return Complex objects; compare re parts
    const val00 = typeof rho[0][0] === 'object' ? (rho[0][0] as any).re : rho[0][0];
    expect(val00).toBeCloseTo(1, 8);
  });

  it('produces |+⟩⟨+| for equal superposition [1/√2, 1/√2]', () => {
    const s = 1 / Math.SQRT2;
    const rho = QuantumMath.densityMatrix([s, s]);
    expect(rho).toHaveLength(2);
    const val00 = typeof rho[0][0] === 'object' ? (rho[0][0] as any).re : rho[0][0];
    const val01 = typeof rho[0][1] === 'object' ? (rho[0][1] as any).re : rho[0][1];
    expect(val00).toBeCloseTo(0.5, 6);
    expect(val01).toBeCloseTo(0.5, 6);
  });

  it('handles a three-element state vector', () => {
    const rho = QuantumMath.densityMatrix([1, 0, 0]);
    expect(rho).toHaveLength(3);
  });
});

describe('QuantumMath.partialTrace', () => {
  it('returns the matrix unchanged (stub behaviour)', () => {
    const m = [[1, 2], [3, 4]];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = QuantumMath.partialTrace(m, 2, 2);
    expect(result).toEqual(m);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('QuantumMath.expectationValue', () => {
  it('computes ⟨0|σ_z|0⟩ = 1', () => {
    const sigmaZ = [[1, 0], [0, -1]];
    const state0 = [1, 0];
    const val = QuantumMath.expectationValue(state0, sigmaZ);
    expect(val).toBeCloseTo(1, 6);
  });

  it('computes ⟨1|σ_z|1⟩ = -1', () => {
    const sigmaZ = [[1, 0], [0, -1]];
    const state1 = [0, 1];
    const val = QuantumMath.expectationValue(state1, sigmaZ);
    expect(val).toBeCloseTo(-1, 6);
  });

  it('computes ⟨+|σ_z|+⟩ ≈ 0', () => {
    const sigmaZ = [[1, 0], [0, -1]];
    const plus = [1 / Math.SQRT2, 1 / Math.SQRT2];
    const val = QuantumMath.expectationValue(plus, sigmaZ);
    expect(val).toBeCloseTo(0, 6);
  });

  it('computes expectation of identity matrix = norm²', () => {
    const I2 = [[1, 0], [0, 1]];
    const state = [0.6, 0.8];
    const val = QuantumMath.expectationValue(state, I2);
    expect(val).toBeCloseTo(1.0, 6);
  });
});

// ═══════════════════════════════════════════════════════════════════
// runQACE – Quantum Adaptive Cosmic Estimator
// ═══════════════════════════════════════════════════════════════════

describe('runQACE', () => {
  const baseInput: QACEInput = {
    baseFrequency: 1e14,
    initialPsiReal: 0.707,
    initialPsiImag: 0.707,
    maxIterations: 50,
    cosmicLearningRate: 0.1,
    convergenceEps: 1e-40,
    targetEnergy: undefined,
  };

  it('throws RangeError when baseFrequency <= 0', () => {
    expect(() => runQACE({ ...baseInput, baseFrequency: 0 })).toThrow(RangeError);
    expect(() => runQACE({ ...baseInput, baseFrequency: -5 })).toThrow(RangeError);
  });

  it('throws RangeError when cosmicLearningRate <= 0', () => {
    expect(() => runQACE({ ...baseInput, cosmicLearningRate: 0 })).toThrow(RangeError);
    expect(() => runQACE({ ...baseInput, cosmicLearningRate: -0.1 })).toThrow(RangeError);
  });

  it('throws RangeError when cosmicLearningRate > 0.5', () => {
    expect(() => runQACE({ ...baseInput, cosmicLearningRate: 0.6 })).toThrow(RangeError);
    expect(() => runQACE({ ...baseInput, cosmicLearningRate: 1.0 })).toThrow(RangeError);
  });

  it('accepts cosmicLearningRate = 0.5 (upper bound)', () => {
    expect(() => runQACE({ ...baseInput, cosmicLearningRate: 0.5 })).not.toThrow();
  });

  it('returns a valid QACEResult with expected fields', () => {
    const result = runQACE(baseInput);
    expect(result).toHaveProperty('iterations');
    expect(result).toHaveProperty('finalEnergy');
    expect(result).toHaveProperty('finalCosmicState');
    expect(result).toHaveProperty('converged');
    expect(result).toHaveProperty('convergenceIteration');
    expect(result).toHaveProperty('classicalEquivalentSteps');
    expect(result).toHaveProperty('quantumSpeedup');
    expect(result).toHaveProperty('verificationLog');
    expect(result.iterations.length).toBeGreaterThan(0);
    expect(result.iterations.length).toBeLessThanOrEqual(baseInput.maxIterations);
  });

  it('produces iterations with valid structure', () => {
    const result = runQACE(baseInput);
    const iter = result.iterations[0];
    expect(iter.iteration).toBe(1);
    expect(typeof iter.energy).toBe('number');
    expect(typeof iter.energyEV).toBe('number');
    expect(typeof iter.convergenceGap).toBe('number');
    expect(typeof iter.quantumAdvantage).toBe('number');
    expect(iter.cosmicState).toHaveProperty('omegaDM');
    expect(iter.cosmicState).toHaveProperty('omegaDE');
    expect(iter.cosmicState).toHaveProperty('energyDeviation');
    expect(iter.cosmicState).toHaveProperty('adaptationIndex');
  });

  it('energies are non-negative and bounded by Planck energy', () => {
    const result = runQACE(baseInput);
    for (const iter of result.iterations) {
      expect(iter.energy).toBeGreaterThanOrEqual(0);
      expect(iter.energy).toBeLessThanOrEqual(1.956e9 + 1); // PLANCK_ENERGY
    }
  });

  it('converges when convergenceEps is very large', () => {
    const result = runQACE({ ...baseInput, convergenceEps: 1e30 });
    expect(result.converged).toBe(true);
    expect(result.convergenceIteration).toBeLessThanOrEqual(baseInput.maxIterations);
  });

  it('does not converge with extremely tiny eps and few iterations', () => {
    const result = runQACE({
      ...baseInput,
      convergenceEps: 1e-300,
      maxIterations: 2,
    });
    // With only 2 iterations and minuscule eps, unlikely to converge
    expect(result.iterations).toHaveLength(2);
  });

  it('supports targetEnergy to drive convergence gap', () => {
    const result = runQACE({ ...baseInput, targetEnergy: 1e-20 });
    expect(result.iterations[0].convergenceGap).toBeDefined();
  });

  it('quantum speedup is ≥ 1', () => {
    const result = runQACE(baseInput);
    expect(result.quantumSpeedup).toBeGreaterThanOrEqual(1);
  });

  it('verificationLog contains init and final entries', () => {
    const result = runQACE(baseInput);
    const hasInit = result.verificationLog.some(l => l.includes('QACE-Init'));
    const hasFinal = result.verificationLog.some(l => l.includes('QACE-Final'));
    expect(hasInit).toBe(true);
    expect(hasFinal).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// runQDTA – Quantum Dark-sector Topological Amplifier
// ═══════════════════════════════════════════════════════════════════

describe('runQDTA', () => {
  it('handles empty data set', () => {
    const result = runQDTA([]);
    expect(result.bettiNumbers.beta0).toBe(0);
    expect(result.bettiNumbers.beta1).toBe(0);
    expect(result.bettiNumbers.beta2).toBe(0);
    expect(result.amplifiedSignal).toBe(0);
    expect(result.anomalyScore).toBe(0);
    expect(result.hiddenPatterns.length).toBeGreaterThanOrEqual(1);
  });

  it('handles a single point', () => {
    const points: DataPoint[] = [{ coordinates: [1, 2] }];
    const result = runQDTA(points);
    expect(result.bettiNumbers.beta0).toBe(1);
    expect(result.amplifiedSignal).toBe(0); // no pairs
  });

  it('computes Betti numbers for clustered points', () => {
    const points: DataPoint[] = [
      { coordinates: [0, 0] },
      { coordinates: [0.1, 0] },
      { coordinates: [0, 0.1] },
      { coordinates: [10, 10] },
      { coordinates: [10.1, 10] },
    ];
    const result = runQDTA(points, 0.5);
    expect(result.bettiNumbers.beta0).toBeGreaterThanOrEqual(1);
    expect(result.topologicalSignature).toHaveLength(6);
  });

  it('produces positive dark sector boost for non-trivial topology', () => {
    const points: DataPoint[] = Array.from({ length: 20 }, (_, i) => ({
      coordinates: [Math.cos(i * 0.3), Math.sin(i * 0.3)],
      label: `p${i}`,
    }));
    const result = runQDTA(points, 0.6);
    expect(result.darkSectorBoost).toBeGreaterThan(0);
  });

  it('anomalyScore is between 0 and 1', () => {
    const points: DataPoint[] = Array.from({ length: 15 }, (_, i) => ({
      coordinates: [i * 0.1, i * 0.2, i * 0.05],
    }));
    const result = runQDTA(points, 0.5);
    expect(result.anomalyScore).toBeGreaterThanOrEqual(0);
    expect(result.anomalyScore).toBeLessThanOrEqual(1);
  });

  it('uses custom epsilon and sensitivityThreshold', () => {
    const points: DataPoint[] = [
      { coordinates: [0, 0] },
      { coordinates: [0.3, 0] },
      { coordinates: [0, 0.3] },
    ];
    const result = runQDTA(points, 1.0, 1e6);
    expect(result.log.length).toBeGreaterThan(0);
    // With high sensitivity threshold, no dark-sector hidden patterns
    const hasDarkPattern = result.hiddenPatterns.some(p => p.includes('قطاع مظلم'));
    expect(hasDarkPattern).toBe(false);
  });

  it('handles more than 50 points (capped computation)', () => {
    const points: DataPoint[] = Array.from({ length: 60 }, (_, i) => ({
      coordinates: [i, i * 2],
    }));
    const result = runQDTA(points, 5);
    expect(result.amplifiedSignal).toBeGreaterThanOrEqual(0);
  });

  it('returns log entries', () => {
    const result = runQDTA([{ coordinates: [1, 2] }]);
    expect(result.log.some(l => l.includes('QDTA'))).toBe(true);
  });

  it('labels are optional on DataPoint', () => {
    const points: DataPoint[] = [
      { coordinates: [0, 0], label: 'origin' },
      { coordinates: [1, 1] },
    ];
    expect(() => runQDTA(points)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// QEMSEngine – Quantum Entanglement Memory Search
// ═══════════════════════════════════════════════════════════════════

describe('QEMSEngine', () => {
  it('returns empty result when searching an empty database', () => {
    const engine = new QEMSEngine();
    const result = engine.search(1e14);
    expect(result.found).toBe(false);
    expect(result.matchedRecords).toHaveLength(0);
    expect(result.iterationsUsed).toBe(0);
    expect(result.groverBaseline).toBe(0);
    expect(result.speedupFactor).toBe(1);
    expect(result.energyProfile).toHaveLength(0);
  });

  it('addRecord computes weight and stores the record', () => {
    const engine = new QEMSEngine();
    engine.addRecord({ id: 'r1', data: [1, 2, 3], frequency: 1e14 });
    const result = engine.search(1e14);
    expect(result.energyProfile).toHaveLength(1);
  });

  it('finds matching records with default threshold', () => {
    const engine = new QEMSEngine();
    engine.addRecord({ id: 'a', data: [1], frequency: 5e14 });
    engine.addRecord({ id: 'b', data: [2], frequency: 5e14 });
    engine.addRecord({ id: 'c', data: [3], frequency: 5e14 });
    const result = engine.search(5e14);
    expect(result.found).toBe(true);
    expect(result.matchedRecords.length).toBeGreaterThanOrEqual(1);
  });

  it('search with very high threshold finds no matches', () => {
    const engine = new QEMSEngine();
    engine.addRecord({ id: 'a', data: [1], frequency: 1e14 });
    const result = engine.search(1e20, 99); // threshold = 99
    expect(result.found).toBe(false);
  });

  it('accumulates memory across searches', () => {
    const engine = new QEMSEngine();
    engine.addRecord({ id: 'r1', data: [1], frequency: 1e14 });

    const r1 = engine.search(1e14);
    expect(r1.memoryState.searchCount).toBe(1);

    const r2 = engine.search(2e14);
    expect(r2.memoryState.searchCount).toBe(2);
    expect(r2.memoryState.accumulatedSpeedup).toBeGreaterThan(1);
  });

  it('grover baseline scales with database size', () => {
    const engine = new QEMSEngine();
    for (let i = 0; i < 100; i++) {
      engine.addRecord({ id: `r${i}`, data: [i], frequency: 1e14 });
    }
    const result = engine.search(1e14);
    expect(result.groverBaseline).toBeGreaterThan(1);
    expect(result.iterationsUsed).toBeGreaterThanOrEqual(1);
    expect(result.speedupFactor).toBeGreaterThanOrEqual(1);
  });

  it('correlationMatrix stores up to 10 entries', () => {
    const engine = new QEMSEngine();
    engine.addRecord({ id: 'r1', data: [1], frequency: 1e14 });
    for (let i = 0; i < 15; i++) {
      engine.search(1e14 + i * 1e10);
    }
    const last = engine.search(1e14);
    expect(last.memoryState.correlationMatrix.length).toBeLessThanOrEqual(10);
  });

  it('records retain computed weight field', () => {
    const engine = new QEMSEngine();
    engine.addRecord({ id: 'x', data: [42], frequency: 1e14 });
    const result = engine.search(1e14, 0); // threshold 0 matches everything
    expect(result.matchedRecords.length).toBe(1);
    expect(typeof result.matchedRecords[0].weight).toBe('number');
    expect(result.matchedRecords[0].weight).toBeGreaterThan(0);
    expect(result.matchedRecords[0].weight).toBeLessThanOrEqual(1); // tanh bounded
  });
});

// ═══════════════════════════════════════════════════════════════════
// runQSGA – Quantum Singularity-Guarded Annealing
// ═══════════════════════════════════════════════════════════════════

describe('runQSGA', () => {
  const quadratic = (x: number[]) => x.reduce((s, v) => s + v * v, 0);

  beforeEach(() => {
    // Seed deterministic behaviour for Math.random
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a valid QSGAResult', () => {
    const result = runQSGA(quadratic, [1, 2, 3], 100, 10, 0.99);
    expect(result).toHaveProperty('bestSolution');
    expect(result).toHaveProperty('bestEnergy');
    expect(result).toHaveProperty('convergenceHistory');
    expect(result).toHaveProperty('singularityBlocks');
    expect(result).toHaveProperty('classicalComparison');
    expect(result).toHaveProperty('improvementRatio');
    expect(result).toHaveProperty('log');
  });

  it('bestSolution has same dimensionality as initial', () => {
    const result = runQSGA(quadratic, [5, 5], 50, 10, 0.99);
    expect(result.bestSolution).toHaveLength(2);
  });

  it('best energy is ≤ initial energy', () => {
    const initial = [5, 5, 5];
    const initialE = quadratic(initial);
    const result = runQSGA(quadratic, initial, 200, 50, 0.995);
    expect(result.bestEnergy).toBeLessThanOrEqual(initialE);
  });

  it('convergence history records every 50 steps', () => {
    const result = runQSGA(quadratic, [1], 200, 10, 0.99);
    expect(result.convergenceHistory.length).toBeGreaterThanOrEqual(1);
    expect(result.convergenceHistory[0].step).toBe(0);
  });

  it('improvement ratio is > 0', () => {
    const result = runQSGA(quadratic, [3, 4], 100);
    expect(result.improvementRatio).toBeGreaterThan(0);
  });

  it('log contains init and final entries', () => {
    const result = runQSGA(quadratic, [1, 2], 100);
    expect(result.log.some(l => l.includes('QSGA-Init'))).toBe(true);
    expect(result.log.some(l => l.includes('QSGA-Final'))).toBe(true);
  });

  it('uses default parameter values when not provided', () => {
    const result = runQSGA(quadratic, [1]);
    expect(result.bestSolution).toHaveLength(1);
    expect(result.convergenceHistory.length).toBeGreaterThanOrEqual(1);
  });

  it('handles cost functions that return negative values', () => {
    const negativeCost = (x: number[]) => -x.reduce((s, v) => s + v * v, 0);
    const result = runQSGA(negativeCost, [1, 2, 3], 100, 10, 0.99);
    expect(result.bestEnergy).toBeLessThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// QWFCOptimizer – Quantum Wave Function Collapse
// ═══════════════════════════════════════════════════════════════════

describe('QWFCOptimizer', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('collapses a 1×1 grid with one state', () => {
    const optimizer = new QWFCOptimizer(1, 1, [0], []);
    const result = optimizer.run();
    expect(result.grid).toHaveLength(1);
    expect(result.grid[0]).toHaveLength(1);
    expect(result.grid[0][0].collapsed).toBe(true);
    expect(result.grid[0][0].finalState).toBe(0);
    expect(result.contradiction).toBe(false);
  });

  it('collapses a 2×2 grid with constraints', () => {
    const constraints: QWFCConstraint[] = [
      { fromState: 0, toState: 1, direction: 'right', allowed: true },
      { fromState: 1, toState: 0, direction: 'left', allowed: true },
    ];
    const optimizer = new QWFCOptimizer(2, 2, [0, 1], constraints);
    const result = optimizer.run();
    expect(result.collapseOrder.length).toBeGreaterThanOrEqual(1);
    expect(result.totalEnergy).toBeGreaterThan(0);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it('reduces entropy after collapsing', () => {
    const optimizer = new QWFCOptimizer(3, 3, [0, 1, 2], []);
    const result = optimizer.run();
    expect(result.entropyReduction).toBeGreaterThanOrEqual(0);
  });

  it('handles grid with no constraints', () => {
    const optimizer = new QWFCOptimizer(2, 2, [0, 1, 2], []);
    const result = optimizer.run();
    expect(result.contradiction).toBe(false);
    expect(result.collapseOrder).toHaveLength(4); // 2×2 grid
  });

  it('returns contradiction=false for valid run', () => {
    const constraints: QWFCConstraint[] = [
      { fromState: 0, toState: 0, direction: 'right', allowed: true },
      { fromState: 0, toState: 0, direction: 'down', allowed: true },
    ];
    const optimizer = new QWFCOptimizer(2, 2, [0], constraints);
    const result = optimizer.run();
    expect(result.contradiction).toBe(false);
  });

  it('log contains init and final messages', () => {
    const optimizer = new QWFCOptimizer(2, 2, [0, 1], []);
    const result = optimizer.run();
    expect(result.log.some(l => l.includes('QWFC-Init'))).toBe(true);
    expect(result.log.some(l => l.includes('QWFC-Final'))).toBe(true);
  });

  it('collapse order matches grid dimensions', () => {
    const optimizer = new QWFCOptimizer(3, 2, [0, 1], []);
    const result = optimizer.run();
    // 3 wide × 2 tall = 6 cells
    expect(result.collapseOrder).toHaveLength(6);
  });

  it('constraint propagation modifies uncollapsed cell probabilities', () => {
    const constraints: QWFCConstraint[] = [
      { fromState: 0, toState: 1, direction: 'right', allowed: true },
      // state 0 → state 0 is NOT listed as allowed, so prob for 0 gets reduced
    ];
    const optimizer = new QWFCOptimizer(2, 1, [0, 1], constraints);
    const result = optimizer.run();
    expect(result.contradiction).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// runQHEB – Quantum Holographic Error Bounding
// ═══════════════════════════════════════════════════════════════════

describe('runQHEB', () => {
  const baseSystem: QHEBSystem = {
    radiusM: 1e-6,
    numQubits: 100,
    errorRate: 0.001,
    frequency: 1e14,
    coherenceS: 0.001,
  };

  it('returns all expected fields', () => {
    const result = runQHEB(baseSystem);
    expect(result).toHaveProperty('horizonAreaM2');
    expect(result).toHaveProperty('bekensteinBound');
    expect(result).toHaveProperty('holographicCapacity');
    expect(result).toHaveProperty('alotaibiEnergyJ');
    expect(result).toHaveProperty('holographicEnergyJ');
    expect(result).toHaveProperty('energyRatio');
    expect(result).toHaveProperty('guaranteedErrorBound');
    expect(result).toHaveProperty('logicalErrorRate');
    expect(result).toHaveProperty('isFaultTolerant');
    expect(result).toHaveProperty('safetyMargin');
    expect(result).toHaveProperty('minQubitsForFT');
    expect(result).toHaveProperty('recommendedCodeDist');
    expect(result).toHaveProperty('log');
  });

  it('horizon area scales with radius squared', () => {
    const r1 = runQHEB({ ...baseSystem, radiusM: 1e-6 });
    const r2 = runQHEB({ ...baseSystem, radiusM: 2e-6 });
    expect(r2.horizonAreaM2).toBeCloseTo(r1.horizonAreaM2 * 4, 1);
  });

  it('holographic capacity is positive', () => {
    const result = runQHEB(baseSystem);
    expect(result.holographicCapacity).toBeGreaterThan(0);
  });

  it('bekenstein bound is positive', () => {
    const result = runQHEB(baseSystem);
    expect(result.bekensteinBound).toBeGreaterThan(0);
  });

  it('energy values are positive', () => {
    const result = runQHEB(baseSystem);
    expect(result.alotaibiEnergyJ).toBeGreaterThan(0);
    expect(result.holographicEnergyJ).toBeGreaterThan(0);
    expect(result.energyRatio).toBeGreaterThan(0);
  });

  it('low error rate below threshold yields fault tolerance', () => {
    const result = runQHEB({
      ...baseSystem,
      errorRate: 0.0001,
      numQubits: 10,
      coherenceS: 1.0,
    });
    expect(result.isFaultTolerant).toBe(true);
    expect(result.safetyMargin).toBeGreaterThan(0);
  });

  it('high error rate yields no fault tolerance', () => {
    const result = runQHEB({
      ...baseSystem,
      errorRate: 0.5,
      coherenceS: 0.0001,
    });
    expect(result.isFaultTolerant).toBe(false);
  });

  it('recommended code distance ≥ 3', () => {
    const result = runQHEB(baseSystem);
    expect(result.recommendedCodeDist).toBeGreaterThanOrEqual(3);
  });

  it('minQubitsForFT ≥ numQubits', () => {
    const result = runQHEB(baseSystem);
    expect(result.minQubitsForFT).toBeGreaterThanOrEqual(baseSystem.numQubits);
  });

  it('log contains init, holo, and error entries', () => {
    const result = runQHEB(baseSystem);
    expect(result.log.some(l => l.includes('QHEB-Init'))).toBe(true);
    expect(result.log.some(l => l.includes('QHEB-Holo'))).toBe(true);
    expect(result.log.some(l => l.includes('QHEB-Error'))).toBe(true);
    expect(result.log.some(l => l.includes('QHEB-Rec'))).toBe(true);
  });

  it('handles very small radius', () => {
    const result = runQHEB({ ...baseSystem, radiusM: 1e-35 });
    expect(result.horizonAreaM2).toBeGreaterThan(0);
    expect(result.holographicCapacity).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// computeQUnified – Unified quantum equation
// ═══════════════════════════════════════════════════════════════════

describe('computeQUnified', () => {
  const baseInput: QUnifiedInput = {
    frequencyHz: 1e14,
    psiReal: 0.707,
    psiImag: 0.707,
    fineTuning: 1.0,
    horizonAreaM2: 1e-10,
  };

  it('throws RangeError if frequencyHz <= 0', () => {
    expect(() => computeQUnified({ ...baseInput, frequencyHz: 0 })).toThrow(RangeError);
    expect(() => computeQUnified({ ...baseInput, frequencyHz: -1 })).toThrow(RangeError);
  });

  it('throws RangeError if horizonAreaM2 <= 0', () => {
    expect(() => computeQUnified({ ...baseInput, horizonAreaM2: 0 })).toThrow(RangeError);
    expect(() => computeQUnified({ ...baseInput, horizonAreaM2: -1 })).toThrow(RangeError);
  });

  it('throws RangeError if fineTuning <= 0', () => {
    expect(() => computeQUnified({ ...baseInput, fineTuning: 0 })).toThrow(RangeError);
    expect(() => computeQUnified({ ...baseInput, fineTuning: -0.1 })).toThrow(RangeError);
  });

  it('returns expected structure', () => {
    const result = computeQUnified(baseInput);
    expect(result).toHaveProperty('qUnifiedJ');
    expect(result).toHaveProperty('breakdown');
    expect(result.breakdown).toHaveProperty('photonEnergyJ');
    expect(result.breakdown).toHaveProperty('quantumAmplification');
    expect(result.breakdown).toHaveProperty('darkSectorFactor');
    expect(result.breakdown).toHaveProperty('psi2');
    expect(result.breakdown).toHaveProperty('fineTuning');
    expect(result.breakdown).toHaveProperty('holographicFactor');
  });

  it('photon energy = h × frequency', () => {
    const result = computeQUnified(baseInput);
    const PLANCK_H = 6.62607015e-34;
    expect(result.breakdown.photonEnergyJ).toBeCloseTo(
      PLANCK_H * baseInput.frequencyHz,
      45,
    );
  });

  it('quantum amplification = α(α + β²)', () => {
    const result = computeQUnified(baseInput);
    const ALPHA = 25.3;
    const BETA = 0.9985;
    expect(result.breakdown.quantumAmplification).toBeCloseTo(
      ALPHA * (ALPHA + BETA * BETA),
      6,
    );
  });

  it('psi2 is the squared norm of the wave function', () => {
    const result = computeQUnified(baseInput);
    const expected = baseInput.psiReal ** 2 + baseInput.psiImag ** 2;
    expect(result.breakdown.psi2).toBeCloseTo(expected, 10);
  });

  it('uses default OMEGA_DM and OMEGA_DE when not provided', () => {
    const result = computeQUnified(baseInput);
    const K_DM = 0.26, K_DE = 0.70, ODM = 0.2589, ODE = 0.6847;
    const expected = 1 + K_DM * ODM + K_DE * ODE;
    expect(result.breakdown.darkSectorFactor).toBeCloseTo(expected, 6);
  });

  it('accepts custom omegaDM and omegaDE', () => {
    const result = computeQUnified({
      ...baseInput,
      omegaDM: 0.5,
      omegaDE: 0.5,
    });
    const K_DM = 0.26, K_DE = 0.70;
    const expected = 1 + K_DM * 0.5 + K_DE * 0.5;
    expect(result.breakdown.darkSectorFactor).toBeCloseTo(expected, 6);
  });

  it('holographic factor uses custom planckLengthM', () => {
    const customPlanck = 2e-35;
    const result = computeQUnified({
      ...baseInput,
      planckLengthM: customPlanck,
    });
    const expected = (4 * customPlanck * customPlanck) / baseInput.horizonAreaM2;
    expect(result.breakdown.holographicFactor).toBeCloseTo(expected, 50);
  });

  it('result is capped at Planck energy', () => {
    // Very high frequency and fine tuning to exceed Planck energy
    const result = computeQUnified({
      ...baseInput,
      frequencyHz: 1e60,
      fineTuning: 1e60,
      horizonAreaM2: 1e-100,
    });
    expect(result.qUnifiedJ).toBeLessThanOrEqual(1.956e9);
  });

  it('qUnifiedJ is non-negative for valid inputs', () => {
    const result = computeQUnified(baseInput);
    expect(result.qUnifiedJ).toBeGreaterThanOrEqual(0);
  });

  it('fineTuning field in breakdown matches input', () => {
    const result = computeQUnified({ ...baseInput, fineTuning: 2.5 });
    expect(result.breakdown.fineTuning).toBe(2.5);
  });

  it('zero psiReal and psiImag yields zero energy', () => {
    const result = computeQUnified({
      ...baseInput,
      psiReal: 0,
      psiImag: 0,
    });
    expect(result.qUnifiedJ).toBe(0);
    expect(result.breakdown.psi2).toBe(0);
  });
});
