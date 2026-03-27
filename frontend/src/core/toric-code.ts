/**
 * toric-code.ts – محاكي كود توريك لتصحيح الأخطاء الطوبولوجي
 */

import type { ProcessorState } from '../types/quantum.types';

type PauliError = 'I' | 'X' | 'Y' | 'Z';

interface ToricCell {
  qubitIndex: number;
  row: number;
  col: number;
  error: PauliError;
}

interface SyndromeResult {
  stabilizers: number[];
  detectedErrors: number[];
  correctionApplied: boolean;
  residualErrorRate: number;
}

export class ToricCodeSimulator {
  private readonly d: number;
  private readonly numQubits: number;
  private grid: ToricCell[][];

  constructor(d = 5) {
    if (d < 3) throw new RangeError('مسافة الكود d يجب أن تكون ≥ 3');
    this.d = d;
    this.numQubits = 2 * d * d;
    this.grid = Array.from({ length: d }, (_, row) =>
      Array.from({ length: d }, (_, col) => ({
        qubitIndex: row * d + col,
        row,
        col,
        error: 'I' as PauliError,
      }))
    );
  }

  injectErrors(errorRate: number): void {
    const options: PauliError[] = ['X', 'Y', 'Z'];
    this.grid.forEach((row) => row.forEach((cell) => {
      if (Math.random() < errorRate) {
        cell.error = options[Math.floor(Math.random() * options.length)];
      } else {
        cell.error = 'I';
      }
    }));
  }

  measureSyndrome(): SyndromeResult {
    const stabilizers: number[] = [];
    const detectedErrors: number[] = [];

    for (let r = 0; r < this.d; r++) {
      for (let c = 0; c < this.d; c++) {
        const neighborhood = this.getNeighbors(r, c);
        const parity = neighborhood.filter((n) => n.error !== 'I').length % 2;
        stabilizers.push(parity);
        if (parity === 1) detectedErrors.push(r * this.d + c);
      }
    }

    const correctionApplied = detectedErrors.length > 0;
    if (correctionApplied) this.applyCorrection(detectedErrors);

    const currentErrors = this.grid.flat().filter((c) => c.error !== 'I').length;
    const physicalErrorRate = currentErrors / this.numQubits;
    const p_th = 0.11;
    const residualErrorRate = physicalErrorRate < p_th
      ? Math.pow(Math.max(physicalErrorRate, 1e-6) / p_th, Math.floor(this.d / 2))
      : 1;

    return {
      stabilizers,
      detectedErrors,
      correctionApplied,
      residualErrorRate,
    };
  }

  getProcessorState(): ProcessorState {
    const syndrome = this.measureSyndrome();
    return {
      numQubits: this.numQubits,
      coherenceTimeMs: 2.5,
      errorRate: syndrome.residualErrorRate,
      qopsPerSecond: 31_250_000,
      temperature: 0.015,
      toricCodeActive: true,
    };
  }

  private getNeighbors(r: number, c: number): ToricCell[] {
    const d = this.d;
    return [
      this.grid[r][c],
      this.grid[r][(c + 1) % d],
      this.grid[(r + 1) % d][c],
      this.grid[(r + 1) % d][(c + 1) % d],
    ];
  }

  private applyCorrection(errorPositions: number[]): void {
    errorPositions.forEach((pos) => {
      const r = Math.floor(pos / this.d);
      const c = pos % this.d;
      if (this.grid[r]?.[c]) this.grid[r][c].error = 'I';
    });
  }
}
