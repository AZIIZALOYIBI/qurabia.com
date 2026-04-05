/**
 * Al-Otaibi-Planck Enhanced Radiation Engine
 * معادلة العتيبي-بلانك المحسّنة للإشعاع الكمومي
 */

export interface PhysicalConstants {
  h: number;
  hBar: number;
  c: number;
  kB: number;
}

export class AlOtaibiPlanck {
  private constants: PhysicalConstants;

  constructor() {
    this.constants = {
      h: 6.62607015e-34,
      hBar: 1.054571817e-34,
      c: 299792458,
      kB: 1.380649e-23,
    };
  }

  planckClassical(frequency: number, temperature: number): number {
    const { h, c, kB } = this.constants;
    if (temperature <= 0 || frequency <= 0) return 0;
    const exponent = (h * frequency) / (kB * temperature);
    if (exponent > 100) return 0;

    const denominator = Math.expm1(exponent);
    const numerator =
      (8 * Math.PI * h * (frequency * frequency * frequency)) / (c * c * c);
    return numerator / denominator;
  }

  private quantumCorrectionFirst(x: number): number {
    if (x < 0.1) return 0;
    if (x > 50) return Math.exp(-x);
    return x / Math.expm1(x) - Math.exp(-x);
  }

  alOtaibiPlanck(
    frequency: number,
    temperature: number,
    lambdaParameter: number = 0.5,
  ): number {
    const classical = this.planckClassical(frequency, temperature);
    const x =
      (this.constants.h * frequency) / (this.constants.kB * temperature);

    const q1 = this.quantumCorrectionFirst(x);
    const q2 = ((x * x) / 24) * (1 - Math.exp(-x));
    const weight = Math.tanh(x / 2);
    const quantumCorrection = weight * (q1 + 0.5 * q2);

    const alOtaibiCoefficient = 1 + lambdaParameter * quantumCorrection;
    return classical * alOtaibiCoefficient;
  }
}
