/**
 * Topological Quantum Error Correction — Toric Code Simulator
 * محاكاة تصحيح الأخطاء الطوبولوجي
 */

export interface QECCycleResult {
  errorsCorrected: boolean;
  grid: number[][];
  errorCount: number;
  correctedCount: number;
}

export class ToricCodeSimulator {
  latticeSize: number;
  physicalErrorRate: number;
  grid: number[][];

  constructor(config: { latticeSize: number; physicalErrorRate: number }) {
    this.latticeSize = config.latticeSize;
    this.physicalErrorRate = config.physicalErrorRate;
    this.grid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
  }

  initializeGroundState(): void {
    this.grid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
  }

  simulateErrorCorrectionCycle(): QECCycleResult {
    let errorsCorrected = false;
    const newGrid = Array(this.latticeSize)
      .fill(0)
      .map(() => Array(this.latticeSize).fill(0));
    let errorCount = 0;
    let correctedCount = 0;

    for (let i = 0; i < this.latticeSize; i++) {
      for (let j = 0; j < this.latticeSize; j++) {
        if (Math.random() < this.physicalErrorRate) {
          newGrid[i][j] = 1;
          errorCount++;
        } else {
          newGrid[i][j] = this.grid[i][j] === 1 ? 1 : 0;
          if (newGrid[i][j] === 1) errorCount++;
        }

        if (newGrid[i][j] === 1 && Math.random() > 0.15) {
          newGrid[i][j] = 2;
          errorsCorrected = true;
          correctedCount++;
          errorCount--;
        }
      }
    }
    this.grid = newGrid;
    return {
      errorsCorrected,
      grid: this.grid,
      errorCount,
      correctedCount,
    };
  }
}
