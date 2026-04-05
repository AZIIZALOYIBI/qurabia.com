/**
 * Grover's Quantum Search Algorithm Simulator
 * محاكاة خوارزمية جروفر للبحث الكمومي
 */

export class GroverSimulator {
  size: number;
  targetIndex: number;
  amplitudes: number[];
  sum: number;

  constructor(size: number, targetIndex: number) {
    if (size <= 0) throw new RangeError(`حجم قاعدة البيانات يجب أن يكون > 0، القيمة: ${size}`);
    if (targetIndex < 0 || targetIndex >= size) {
      throw new RangeError(`الفهرس المستهدف ${targetIndex} خارج النطاق [0, ${size - 1}]`);
    }
    this.size = size;
    this.targetIndex = targetIndex;
    const initialAmp = 1 / Math.sqrt(size);
    this.amplitudes = new Array(size).fill(initialAmp);
    this.sum = initialAmp * size;
  }

  applyOracle(): void {
    if (this.targetIndex >= 0 && this.targetIndex < this.size) {
      this.amplitudes[this.targetIndex] *= -1;
      this.sum += 2 * this.amplitudes[this.targetIndex];
    }
  }

  applyDiffusion(): void {
    const mean = this.sum / this.size;
    let newSum = 0;

    for (let i = 0; i < this.size; i++) {
      this.amplitudes[i] = 2 * mean - this.amplitudes[i];
      newSum += this.amplitudes[i];
    }
    this.sum = newSum;
  }

  step(): void {
    this.applyOracle();
    this.applyDiffusion();
  }

  getProbabilities(): number[] {
    return this.amplitudes.map((amp) => amp * amp);
  }

  getOptimalSteps(): number {
    return Math.floor((Math.PI / 4) * Math.sqrt(this.size));
  }
}
