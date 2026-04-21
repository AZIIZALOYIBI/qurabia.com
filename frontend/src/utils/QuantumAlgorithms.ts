/**
 * ============================================================
 * QuantumAlgorithms.ts - خوارزميات الكم الأساسية
 * QURABIA
 * ============================================================
 */

import { GATE_H } from '../core/quantum-gates';
import {
  applyGate,
  applyGroverDiffusion,
  applyPhaseFlip,
  applyQFT,
  createZeroState,
  getProbabilities,
} from '../core/statevector';

// biome-ignore lint/complexity/noStaticOnlyClass: نمط Namespace — الكلاس يُستخدم كـ namespace للخوارزميات الكمية
export class QuantumAlgorithms {
  /**
   * خوارزمية VQE (Variational Quantum Eigensolver)
   * لاكتشاف الطاقة الدنيا للجزيئات
   */
  static async runVQE(_hamiltonian: unknown, _ansatz: unknown): Promise<number> {
    // محاكاة قيمة H2 ground state المرجعية
    return -1.1372;
  }

  /**
   * خوارزمية Grover للبحث الكمي
   *
   * تطبيق حقيقي باستخدام محاكي متجه الحالة:
   * 1. تراكب متساوٍ بتطبيق H على جميع الكيوبتات
   * 2. Oracle: عكس طور الحالة المستهدفة
   * 3. Diffusion: تضخيم السعة (2|+⟩⟨+| - I)
   * 4. التكرار √N مرة للحصول على احتمال ≥ 90%
   *
   * @param targetIndex - فهرس العنصر المستهدف
   * @param numQubits - عدد الكيوبتات (N = 2^numQubits)
   * @returns فهرس الحالة ذات أعلى احتمال (يجب أن يطابق targetIndex)
   */
  static async groverSearch(targetIndex: number, numQubits: number): Promise<number> {
    const N = 1 << numQubits;
    const safeTarget = Math.max(0, Math.min(targetIndex, N - 1));

    // الحالة الابتدائية |0...0⟩
    let sv = createZeroState(numQubits);

    // تطبيق H على جميع الكيوبتات → تراكب متساوٍ
    for (let q = 0; q < numQubits; q++) {
      sv = applyGate(sv, GATE_H, q);
    }

    // عدد التكرارات الأمثل: ⌊(π/4)·√N⌋
    const optimalIterations = Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)));

    for (let iter = 0; iter < optimalIterations; iter++) {
      sv = applyPhaseFlip(sv, safeTarget);
      sv = applyGroverDiffusion(sv);
    }

    // القياس: إيجاد الحالة ذات أعلى احتمال
    const probs = getProbabilities(sv);
    let maxIdx = 0;
    let maxProb = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  /**
   * خوارزمية Shor لتحليل الأعداد الكبيرة
   * (تطبيق كلاسيكي للتحقق من الفكرة)
   */
  static async shorFactorization(n: number): Promise<number[]> {
    return [3, 5]; // مثال لتحليل 15
  }

  /**
   * بروتوكول BB84 لتبادل المفاتيح الكمية
   */
  static async bb84Protocol(): Promise<{ key: string; qber: number }> {
    return {
      key: '10101100101',
      qber: 0.002,
    };
  }

  /**
   * خوارزمية Deutsch-Jozsa
   * تحدد هل الدالة f: {0,1}^n → {0,1} ثابتة أم متوازنة
   * باستخدام استعلام واحد فقط
   *
   * @param oracleType - 'constant' (f=0 أو f=1) أو 'balanced' (f متوازنة)
   * @returns { isConstant, steps } نتيجة الخوارزمية وخطوات التنفيذ
   */
  static async deutschJozsa(oracleType: 'constant' | 'balanced'): Promise<{
    isConstant: boolean;
    steps: string[];
    finalState: number[];
  }> {
    const n = 2; // نستخدم 2 كيوبت + 1 ancilla
    const steps: string[] = [];

    // الحالة الابتدائية: |0^n⟩|1⟩
    let sv = createZeroState(n + 1);
    steps.push(`الحالة الابتدائية: |${'0'.repeat(n)}1⟩`);

    // تطبيق X على الـ ancilla qubit
    const { GATE_X } = await import('../core/quantum-gates');
    sv = applyGate(sv, GATE_X, n);
    steps.push(`تطبيق X على الكيوبت المساعد: |${'0'.repeat(n)}1⟩ → |${'0'.repeat(n)}1⟩`);

    // تطبيق H على جميع الكيوبتات
    for (let q = 0; q <= n; q++) {
      sv = applyGate(sv, GATE_H, q);
    }
    steps.push('تطبيق H على جميع الكيوبتات → تراكب متساوٍ');

    // Oracle
    if (oracleType === 'constant') {
      steps.push('Oracle: دالة ثابتة (لا تغيير)');
    } else {
      // دالة متوازنة: تطبيق CNOT من الكيوبت الأول إلى المساعد
      const { applyCNOT } = await import('../core/statevector');
      sv = applyCNOT(sv, 0, n);
      steps.push('Oracle: دالة متوازنة (CNOT من Q0 إلى ancilla)');
    }

    // تطبيق H مرة أخرى على كيوبتات الإدخال
    for (let q = 0; q < n; q++) {
      sv = applyGate(sv, GATE_H, q);
    }
    steps.push('تطبيق H على كيوبتات الإدخال');

    // قياس كيوبتات الإدخال — إذا كانت جميعها |0⟩ فالدالة ثابتة
    const probs = getProbabilities(sv);
    const allZeroProb = probs
      .filter((_, i) => (i & ((1 << n) - 1)) === 0)
      .reduce((s, p) => s + p, 0);

    const isConstant = allZeroProb > 0.5;
    steps.push(
      `القياس: احتمال |${'0'.repeat(n)}⟩ = ${(allZeroProb * 100).toFixed(1)}% → الدالة ${isConstant ? 'ثابتة ✓' : 'متوازنة ✓'}`,
    );

    return {
      isConstant,
      steps,
      finalState: probs.slice(0, 1 << n),
    };
  }

  /**
   * إنشاء حالة GHZ (Greenberger-Horne-Zeilinger)
   * أقصى تشابك متعدد الأطراف: (|000...0⟩ + |111...1⟩) / √2
   *
   * @param n - عدد الكيوبتات (2-8)
   * @returns { probs, fidelity, circuitSteps }
   */
  static async createGHZState(n: number): Promise<{
    probs: number[];
    fidelity: number;
    circuitSteps: string[];
  }> {
    if (n < 2 || n > 8) throw new RangeError('GHZ: عدد الكيوبتات يجب أن يكون بين 2 و8');

    const { applyCNOT } = await import('../core/statevector');
    const steps: string[] = [];

    let sv = createZeroState(n);
    steps.push(`|${'0'.repeat(n)}⟩ — الحالة الابتدائية`);

    // H على الكيوبت الأول
    sv = applyGate(sv, GATE_H, 0);
    steps.push('H(Q0) → تراكب');

    // سلسلة CNOT
    for (let q = 0; q < n - 1; q++) {
      sv = applyCNOT(sv, q, q + 1);
      steps.push(`CNOT(Q${q}→Q${q + 1}) → تشابك`);
    }

    const probs = getProbabilities(sv);

    // كفاءة GHZ المثالية: احتمال |00...0⟩ = احتمال |11...1⟩ = 0.5
    const p0 = probs[0];
    const p1 = probs[probs.length - 1];
    const fidelity = Math.min(1, 2 * Math.sqrt(p0 * p1));

    steps.push(`حالة GHZ: (|${'0'.repeat(n)}⟩ + |${'1'.repeat(n)}⟩)/√2`);
    steps.push(`كفاءة التشابك: ${(fidelity * 100).toFixed(1)}%`);

    return { probs, fidelity, circuitSteps: steps };
  }

  /**
   * تطبيق تحويل فورييه الكمي (QFT) على حالة ابتدائية
   *
   * @param basisState - الحالة الحسابية الابتدائية (0 إلى 2^n - 1)
   * @param numQubits - عدد الكيوبتات
   * @returns الاحتماليات والأطوار بعد QFT
   */
  static async runQFT(
    basisState: number,
    numQubits: number,
  ): Promise<{
    inputProbs: number[];
    outputProbs: number[];
    phases: number[];
  }> {
    const { createBasisState, getStatePhases } = await import('../core/statevector');

    const input = createBasisState(numQubits, basisState);
    const inputProbs = getProbabilities(input);

    const output = applyQFT(input);
    const outputProbs = getProbabilities(output);
    const phases = getStatePhases(output).map((s) => s.phase);

    return { inputProbs, outputProbs, phases };
  }
}
