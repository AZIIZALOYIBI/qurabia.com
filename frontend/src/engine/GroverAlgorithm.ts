/**
 * Grover's Quantum Search Algorithm Simulator
 * محاكاة خوارزمية جروفر للبحث الكمومي
 *
 * مستوحى من microsoft/QuantumKatas — VisualizingGroversAlgorithm
 * و Qiskit/textbook — grover.ipynb
 *
 * تحسينات:
 * - تتبع السعات خطوة بخطوة (للتصوير المرئي)
 * - دعم البحث عن أهداف متعددة
 * - حساب العدد الأمثل من التكرارات تلقائياً
 * - تصدير بيانات الرسم البياني
 */

/** خطوة واحدة في تنفيذ جروفر */
export interface GroverStep {
  /** رقم التكرار */
  iteration: number;
  /** السعات بعد هذا التكرار */
  amplitudes: number[];
  /** الاحتمالات بعد هذا التكرار */
  probabilities: number[];
  /** احتمال العنصر المستهدف */
  targetProbability: number;
  /** متوسط السعة */
  meanAmplitude: number;
}

/** نتيجة البحث الكاملة */
export interface GroverResult {
  /** فهرس العنصر المُكتشف */
  foundIndex: number;
  /** الاحتمال النهائي */
  probability: number;
  /** عدد التكرارات المُنفّذة */
  iterations: number;
  /** العدد الأمثل من التكرارات */
  optimalIterations: number;
  /** سجل الخطوات (للتصوير المرئي) */
  steps: GroverStep[];
  /** التسريع الكمومي مقارنة بالبحث الكلاسيكي */
  speedup: number;
}

export class GroverSimulator {
  size: number;
  targetIndex: number;
  /** أهداف متعددة (للبحث عن أكثر من عنصر) */
  targetIndices: number[];
  amplitudes: number[];
  sum: number;

  constructor(size: number, targetIndex: number) {
    if (size <= 0) throw new RangeError(`حجم قاعدة البيانات يجب أن يكون > 0، القيمة: ${size}`);
    if (targetIndex < 0 || targetIndex >= size) {
      throw new RangeError(`الفهرس المستهدف ${targetIndex} خارج النطاق [0, ${size - 1}]`);
    }
    this.size = size;
    this.targetIndex = targetIndex;
    this.targetIndices = [targetIndex];
    const initialAmp = 1 / Math.sqrt(size);
    this.amplitudes = new Array(size).fill(initialAmp);
    this.sum = initialAmp * size;
  }

  /**
   * إنشاء محاكي بأهداف متعددة
   * (مستوحى من QuantumKatas — Multi-target Grover)
   */
  static withMultipleTargets(size: number, targetIndices: number[]): GroverSimulator {
    if (targetIndices.length === 0) throw new Error('يجب تحديد هدف واحد على الأقل');
    if (targetIndices.length >= size) throw new Error('عدد الأهداف يجب أن يكون أقل من حجم الفضاء');

    for (const idx of targetIndices) {
      if (idx < 0 || idx >= size) {
        throw new RangeError(`الفهرس ${idx} خارج النطاق [0, ${size - 1}]`);
      }
    }

    const sim = new GroverSimulator(size, targetIndices[0]);
    sim.targetIndices = [...targetIndices];
    return sim;
  }

  applyOracle(): void {
    // عكس السعة لجميع العناصر المستهدفة
    for (const idx of this.targetIndices) {
      if (idx >= 0 && idx < this.size) {
        this.sum -= this.amplitudes[idx]; // أزل القيمة القديمة
        this.amplitudes[idx] *= -1;
        this.sum += this.amplitudes[idx]; // أضف القيمة الجديدة
      }
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
    // العدد الأمثل مع أهداف متعددة: π/(4·arcsin(√(M/N))) - 1/2
    const M = this.targetIndices.length; // عدد الأهداف
    const N = this.size;
    return Math.floor((Math.PI / 4) * Math.sqrt(N / M));
  }

  /**
   * تنفيذ الخوارزمية بالكامل مع تتبع كل خطوة
   * (مستوحى من QuantumKatas — VisualizingGroversAlgorithm)
   */
  runWithTracking(): GroverResult {
    const optimalIter = this.getOptimalSteps();
    const steps: GroverStep[] = [];

    // تسجيل الحالة الأولية
    steps.push(this.captureStep(0));

    // تنفيذ التكرارات
    for (let i = 1; i <= optimalIter; i++) {
      this.step();
      steps.push(this.captureStep(i));
    }

    // النتيجة النهائية
    const probs = this.getProbabilities();
    const totalTargetProb = this.targetIndices.reduce(
      (sum, idx) => sum + probs[idx], 0
    );

    // البحث الكلاسيكي: O(N)، الكمومي: O(√N)
    const classicalSteps = this.size / 2; // المتوسط
    const speedup = classicalSteps / Math.max(1, optimalIter);

    return {
      foundIndex: this.targetIndex,
      probability: totalTargetProb,
      iterations: optimalIter,
      optimalIterations: optimalIter,
      steps,
      speedup,
    };
  }

  /** التقاط حالة الخطوة الحالية */
  private captureStep(iteration: number): GroverStep {
    const probabilities = this.getProbabilities();
    const targetProb = this.targetIndices.reduce(
      (sum, idx) => sum + probabilities[idx], 0
    );
    const meanAmp = this.sum / this.size;

    return {
      iteration,
      amplitudes: [...this.amplitudes],
      probabilities,
      targetProbability: targetProb,
      meanAmplitude: meanAmp,
    };
  }
}

/**
 * تصدير بيانات الرسم البياني لخوارزمية جروفر
 * (مستوحى من QuantumKatas visualization)
 *
 * يُنتج بيانات جاهزة لـ Recharts:
 * - كل نقطة: رقم التكرار + احتمال الهدف + احتمال البقية
 */
export function groverChartData(result: GroverResult): Array<{
  iteration: number;
  targetProbability: number;
  otherProbability: number;
  meanAmplitude: number;
}> {
  return result.steps.map(step => ({
    iteration: step.iteration,
    targetProbability: step.targetProbability,
    otherProbability: 1 - step.targetProbability,
    meanAmplitude: step.meanAmplitude,
  }));
}

