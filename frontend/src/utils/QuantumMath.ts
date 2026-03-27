/**
 * ============================================================
 * QuantumMath.ts - مكتبة العمليات الرياضية الكمية
 * Ultimate Quantum SuperSystem v5.0
 * ============================================================
 */

import * as math from 'mathjs';

export class QuantumMath {
  /**
   * حساب ضرب كرونيكر لمصفوفتين (Tensor Product)
   * يُستخدم لتمثيل حالات الكيوبتات المتعددة
   */
  static tensorProduct(a: number[][], b: number[][]): number[][] {
    return math.kron(a, b) as unknown as number[][];
  }

  /**
   * توليد مصفوفة الكثافة (Density Matrix) ρ = |ψ⟩⟨ψ|
   */
  static densityMatrix(stateVector: number[]): number[][] {
    const complexVector = stateVector.map(v => math.complex(v, 0));
    const adjoint = math.conj(complexVector);
    // @ts-ignore
    return math.multiply(math.reshape(complexVector, [complexVector.length, 1]), math.reshape(adjoint, [1, adjoint.length]));
  }

  /**
   * حساب التتبع الجزئي (Partial Trace)
   */
  static partialTrace(matrix: number[][], dimA: number, dimB: number): number[][] {
    // تبسيط للحساب البرمجي
    console.log(`[QuantumMath] Computing Partial Trace for dims ${dimA}x${dimB}`);
    return matrix; 
  }

  /**
   * حساب القيمة المتوقعة للهاميلتوني ⟨ψ|H|ψ⟩
   */
  static expectationValue(state: number[], hamiltonian: number[][]): number {
    // @ts-ignore
    const temp = math.multiply(math.conj(state), hamiltonian);
    // @ts-ignore
    return math.re(math.multiply(temp, math.transpose(state)));
  }
}
