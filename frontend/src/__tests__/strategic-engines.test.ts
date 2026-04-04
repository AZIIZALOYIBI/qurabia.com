import { describe, it, expect } from 'vitest';
import { AlOtaibiPlanck } from '../engine/AlOtaibiPlanck';
import {
  AlUtaibiEquationV2,
  CosmicConstants,
  DarkSectorModel,
  QuantumGravityUnification,
} from '../engine/AlUtaibiEquationV2';
import { AUTDIESecurityFunction } from '../engine/QuantumCrypto';
import { GroverSimulator } from '../engine/GroverAlgorithm';
import { ToricCodeSimulator } from '../engine/TopologicalQEC';
import { trainQNN } from '../engine/QuantumNeuralNetwork';
import { SimulationFactory } from '../engine/SimulationFactory';

// ── AlOtaibiPlanck ──────────────────────────────────────────────────────────

describe('AlOtaibiPlanck', () => {
  const planck = new AlOtaibiPlanck();

  it('returns 0 for non-positive temperature or frequency', () => {
    expect(planck.planckClassical(0, 5778)).toBe(0);
    expect(planck.planckClassical(1e14, 0)).toBe(0);
    expect(planck.planckClassical(-1e14, 5778)).toBe(0);
    expect(planck.planckClassical(1e14, -100)).toBe(0);
  });

  it('returns a positive value for classical Planck at solar temperature', () => {
    const result = planck.planckClassical(5.45e14, 5778);
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 for extremely high exponent (overflow protection)', () => {
    // Very high frequency, very low temperature → exponent > 100
    const result = planck.planckClassical(1e20, 1);
    expect(result).toBe(0);
  });

  it('alOtaibiPlanck returns positive and >= classical for lambda >= 0', () => {
    const freq = 5e14;
    const temp = 5778;
    const classical = planck.planckClassical(freq, temp);
    const enhanced = planck.alOtaibiPlanck(freq, temp, 0.5);
    expect(enhanced).toBeGreaterThan(0);
    expect(enhanced).toBeGreaterThanOrEqual(classical);
  });

  it('alOtaibiPlanck with lambda=0 equals classical', () => {
    const freq = 5e14;
    const temp = 5778;
    const classical = planck.planckClassical(freq, temp);
    const enhanced = planck.alOtaibiPlanck(freq, temp, 0);
    expect(enhanced).toBeCloseTo(classical, 10);
  });
});

// ── AlUtaibiEquationV2 ──────────────────────────────────────────────────────

describe('AlUtaibiEquationV2', () => {
  const engine = new AlUtaibiEquationV2();

  it('computes total energy with default parameters', () => {
    const result = engine.compute_total_energy(1.616e-35);
    expect(result.E_basic).toBeGreaterThan(0);
    expect(result.otaibi_factor).toBeGreaterThan(1);
    expect(result.E_v1).toBeGreaterThan(result.E_basic);
    expect(result.E_total).toBeGreaterThan(0);
    expect(result.eV).toBeGreaterThan(0);
  });

  it('applies singularity suppression at Planck scale', () => {
    const result = engine.compute_total_energy(1.616e-35);
    expect(result.qm_effect).toBe(0.539);
  });

  it('no suppression above Planck length', () => {
    const result = engine.compute_total_energy(1e-10);
    expect(result.qm_effect).toBe(1.0);
  });

  it('dark correction increases with higher density', () => {
    const low = DarkSectorModel.calculate_dark_correction(1e5, 1e-10);
    const high = DarkSectorModel.calculate_dark_correction(1e10, 1e-10);
    expect(high).toBeGreaterThan(low);
  });

  it('QuantumGravityUnification returns correct values', () => {
    expect(QuantumGravityUnification.calculate_bridge(1e-36)).toBe(0.539);
    expect(QuantumGravityUnification.calculate_bridge(1e-10)).toBe(1.0);
  });

  it('CosmicConstants are within expected ranges', () => {
    expect(CosmicConstants.alpha).toBe(25.3);
    expect(CosmicConstants.beta).toBeLessThan(1);
    expect(CosmicConstants.k_dm + CosmicConstants.k_de).toBeCloseTo(0.96, 2);
  });

  it('returns finite results for very large density values', () => {
    const result = engine.compute_total_energy(1e-35, 1e20, 1e20);
    expect(Number.isFinite(result.E_total)).toBe(true);
    expect(Number.isFinite(result.eV)).toBe(true);
  });

  it('returns finite results for zero densities', () => {
    const result = engine.compute_total_energy(1e-10, 0, 0);
    expect(Number.isFinite(result.E_total)).toBe(true);
    expect(result.dark_correction).toBe(1);
  });

  it('E_total respects the fine-tuning constant', () => {
    const result = engine.compute_total_energy(1e-10, 0, 0);
    // With zero densities and r > planck, dark_correction=1 and qm_effect=1
    expect(result.E_total).toBeCloseTo(result.E_v1 * CosmicConstants.fine_tuning, 10);
  });
});

// ── AUTDIESecurityFunction ──────────────────────────────────────────────────

describe('AUTDIESecurityFunction', () => {
  const crypto = new AUTDIESecurityFunction();

  it('returns secure=true for default kappa=π/4', () => {
    const result = crypto.compute(0, Math.PI / 4, 1.0);
    expect(result.secure).toBe(true);
    expect(result.S_AUTDIE).toBeGreaterThanOrEqual(0.35);
  });

  it('returns insecure for kappa near 0', () => {
    const result = crypto.compute(0, 0.01, 1.0);
    expect(result.S_AUTDIE).toBeLessThan(0.35);
    expect(result.secure).toBe(false);
  });

  it('S_AUTDIE is between 0 and 1', () => {
    for (const k of [0, 0.1, 0.5, Math.PI / 4, Math.PI / 2, Math.PI]) {
      const result = crypto.compute(0, k, 1.0);
      expect(result.S_AUTDIE).toBeGreaterThanOrEqual(0);
      expect(result.S_AUTDIE).toBeLessThanOrEqual(1);
    }
  });

  it('QBER_AUTDIE is between 0 and 0.25', () => {
    for (const k of [0, 0.5, Math.PI / 4, Math.PI / 2, Math.PI]) {
      const result = crypto.compute(0, k, 1.0);
      expect(result.QBER_AUTDIE).toBeGreaterThanOrEqual(0);
      expect(result.QBER_AUTDIE).toBeLessThanOrEqual(0.25);
    }
  });

  it('QBER decreases as S_AUTDIE increases', () => {
    const low = crypto.compute(0, 0.01, 1.0);
    const high = crypto.compute(0, Math.PI / 2, 1.0);
    expect(high.S_AUTDIE).toBeGreaterThan(low.S_AUTDIE);
    expect(high.QBER_AUTDIE).toBeLessThan(low.QBER_AUTDIE);
  });
});

// ── GroverSimulator ─────────────────────────────────────────────────────────

describe('GroverSimulator', () => {
  it('initializes with uniform amplitudes', () => {
    const sim = new GroverSimulator(4, 2);
    const probs = sim.getProbabilities();
    expect(probs.length).toBe(4);
    for (const p of probs) {
      expect(p).toBeCloseTo(0.25, 4);
    }
  });

  it('computes optimal steps correctly for N=64', () => {
    const sim = new GroverSimulator(64, 42);
    const optimal = sim.getOptimalSteps();
    // π/4 * √64 = π/4 * 8 ≈ 6.28 → floor = 6
    expect(optimal).toBe(6);
  });

  it('amplifies target probability after optimal steps', () => {
    const sim = new GroverSimulator(64, 42);
    const optimal = sim.getOptimalSteps();
    for (let i = 0; i < optimal; i++) {
      sim.step();
    }
    const probs = sim.getProbabilities();
    expect(probs[42]).toBeGreaterThan(0.9);
  });

  it('non-target probabilities decrease after steps', () => {
    const sim = new GroverSimulator(16, 5);
    const initialProb = sim.getProbabilities()[0];
    const optimal = sim.getOptimalSteps();
    for (let i = 0; i < optimal; i++) {
      sim.step();
    }
    const finalProb = sim.getProbabilities()[0]; // not target
    expect(finalProb).toBeLessThan(initialProb);
  });

  it('handles edge case of targetIndex = 0', () => {
    const sim = new GroverSimulator(16, 0);
    sim.step();
    const probs = sim.getProbabilities();
    expect(probs[0]).toBeGreaterThan(probs[1]);
  });
});

// ── ToricCodeSimulator ──────────────────────────────────────────────────────

describe('ToricCodeSimulator', () => {
  it('initializes with clean grid', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 5, physicalErrorRate: 0.05 });
    sim.initializeGroundState();
    for (const row of sim.grid) {
      for (const cell of row) {
        expect(cell).toBe(0);
      }
    }
  });

  it('produces errors and corrections in a cycle', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 10, physicalErrorRate: 0.5 });
    sim.initializeGroundState();
    const result = sim.simulateErrorCorrectionCycle();
    // With 50% error rate on 100 cells, we should get some errors
    expect(result.correctedCount).toBeGreaterThan(0);
    expect(result.errorsCorrected).toBe(true);
  });

  it('grid dimensions match lattice size', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 7, physicalErrorRate: 0.05 });
    expect(sim.grid.length).toBe(7);
    for (const row of sim.grid) {
      expect(row.length).toBe(7);
    }
  });

  it('zero error rate produces no errors', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 5, physicalErrorRate: 0 });
    sim.initializeGroundState();
    const result = sim.simulateErrorCorrectionCycle();
    expect(result.errorCount).toBe(0);
  });
});

// ── trainQNN ────────────────────────────────────────────────────────────────

describe('trainQNN', () => {
  it('reaches high accuracy within 20 epochs', async () => {
    let lastAccuracy = 0;
    const result = await trainQNN(20, 5.0, (_epoch, accuracy) => {
      lastAccuracy = accuracy;
    });
    expect(result.finalAccuracy).toBeGreaterThan(80);
    expect(lastAccuracy).toBeGreaterThan(80);
  });

  it('calls onProgress for each epoch', async () => {
    let callCount = 0;
    await trainQNN(10, 2.8, () => {
      callCount++;
    });
    expect(callCount).toBe(10);
  });

  it('accuracy improves over training', async () => {
    const accuracies: number[] = [];
    await trainQNN(10, 3.0, (_epoch, accuracy) => {
      accuracies.push(accuracy);
    });
    // Last accuracy should be higher than first
    expect(accuracies[accuracies.length - 1]).toBeGreaterThan(accuracies[0]);
  });
});

// ── SimulationFactory ───────────────────────────────────────────────────────

describe('SimulationFactory', () => {
  it('runs PHYSICS strategy with properly typed data', async () => {
    const result = await SimulationFactory.run('PHYSICS', { frequency: 5.45e14 });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('totalEnergyEV');
    expect(result.data).toHaveProperty('photonEnergyJ');
    expect(typeof result.energy).toBe('number');
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('runs CRYPTO strategy and returns valid QBER', async () => {
    const result = await SimulationFactory.run('CRYPTO', {});
    expect(result.success).toBe(true);
    expect(result.fidelity).toBeGreaterThan(0);
    expect(result.fidelity).toBeLessThanOrEqual(1);
  });

  it('throws for unknown strategy type', async () => {
    await expect(
      SimulationFactory.run('UNKNOWN' as never, {})
    ).rejects.toThrow('Strategy UNKNOWN not found');
  });
});

// ── GroverSimulator (edge cases) ────────────────────────────────────────────

describe('GroverSimulator — edge cases', () => {
  it('handles dbSize = 16 with target at boundary', () => {
    const sim = new GroverSimulator(16, 15);
    const optimal = sim.getOptimalSteps();
    for (let i = 0; i < optimal; i++) sim.step();
    expect(sim.getProbabilities()[15]).toBeGreaterThan(0.8);
  });

  it('maintains valid probability distribution (sums to ~1)', () => {
    const sim = new GroverSimulator(32, 10);
    sim.step();
    sim.step();
    const total = sim.getProbabilities().reduce((s, p) => s + p, 0);
    expect(total).toBeCloseTo(1, 4);
  });
});
