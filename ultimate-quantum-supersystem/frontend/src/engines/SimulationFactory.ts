/**
 * SimulationFactory.ts – مصنع المحاكيات الكمية
 * Ultimate Quantum SuperSystem v5.0
 *
 * نمط التصميم: Strategy + Factory
 * يختار المحاكي المناسب بناءً على نوع المشكلة
 */

import type { SimulationInput, AlOtaibiResult, SimulationMode } from '../types/quantum.types';
import { calculateAlOtaibiUnified } from '../core/quantum-core';

// ================================================================
// الواجهة الأساسية للاستراتيجية
// ================================================================

export interface SimulationStrategy {
  readonly name: string;
  readonly mode: SimulationMode;
  execute(input: SimulationInput): Promise<AlOtaibiResult & { metadata?: Record<string, unknown> }>;
}

// ================================================================
// المصنع الرئيسي
// ================================================================

export class SimulationFactory {
  private static readonly _strategies = new Map<SimulationMode, SimulationStrategy>();

  static register(strategy: SimulationStrategy): void {
    this._strategies.set(strategy.mode, strategy);
  }

  static getStrategy(mode: SimulationMode): SimulationStrategy {
    const strategy = this._strategies.get(mode);
    if (!strategy) {
      throw new Error(`لا توجد استراتيجية مسجّلة للوضع: ${mode}`);
    }
    return strategy;
  }

  static listModes(): SimulationMode[] {
    return Array.from(this._strategies.keys());
  }

  static async simulate(
    mode: SimulationMode,
    input: SimulationInput
  ): Promise<AlOtaibiResult & { metadata?: Record<string, unknown> }> {
    const strategy = this.getStrategy(mode);
    return strategy.execute(input);
  }
}

// ================================================================
// استراتيجية الفيزياء الأساسية (fallback)
// ================================================================

class BasePhysicsStrategy implements SimulationStrategy {
  readonly name = 'معادلة العتيبي v2.0 – الفيزياء الأساسية';
  readonly mode: SimulationMode = 'physics';

  async execute(input: SimulationInput): Promise<AlOtaibiResult> {
    // محاكاة تأخير غير متزامن (كما لو كانت عملية حسابية مكثفة)
    await new Promise(r => setTimeout(r, 50));
    return calculateAlOtaibiUnified(input);
  }
}

// تسجيل الاستراتيجية الافتراضية عند تحميل الوحدة
SimulationFactory.register(new BasePhysicsStrategy());
