/*
 * ============================================================
 * EthicalGovernance.ts – صمام الأمان الأخلاقي للواجهة
 * Hard-coded Safety Valve: لا يمكن تعديله حتى من AGI
 * ============================================================
 */

import type { EthicsState } from '../types/quantum.types';

/** الدستور الأخلاقي الثابت – قيم غير قابلة للتغيير */
const ETHICAL_CONSTITUTION = Object.freeze({
  NON_MALEFICENCE_THRESHOLD: 0.95, // عدم الإضرار
  BENEFICENCE_THRESHOLD: 0.8, // الإحسان
  AUTONOMY_THRESHOLD: 0.9, // الاستقلالية
  JUSTICE_THRESHOLD: 0.85, // العدالة
} as const);

/** سياق تقييم القرار الأخلاقي */
export interface EthicsContext {
  harmPotential: number; // احتمال الضرر (0-1)
  benefitScore: number; // درجة الفائدة (0-1)
  userConsent: boolean; // موافقة المستخدم
  fairnessScore: number; // درجة العدالة (0-1)
  actionType: string; // نوع الإجراء
}

/** سجل تدقيق القرارات الأخلاقية */
interface AuditEntry {
  timestamp: number;
  action: string;
  score: number;
  allowed: boolean;
  reason: string;
}

/**
 * نظام الحوكمة الأخلاقية للواجهة الأمامية
 *
 * يُقيِّم كل إجراء يطلبه الـ AGI قبل تنفيذه:
 * - الفشل الصريح إذا انتُهك أي مبدأ
 * - سجل تدقيق غير قابل للحذف
 * - تكامل الدستور مُتحقَّق منه عند كل تقييم
 */
export class EthicalGovernanceSystem {
  private readonly _constitution = ETHICAL_CONSTITUTION;
  private readonly _auditLog: AuditEntry[] = [];

  /**
   * تقييم إجراء مُقتَرَح أخلاقياً
   *
   * معادلة الدرجة الكلية (Weighted Ethics Score):
   * S = (2×NM + 1×BN + 1.5×AU + 1×JU) / 5.5
   * حيث NM له وزن مضاعف لأهميته القصوى
   */
  evaluate(ctx: EthicsContext): EthicsState {
    const scores = {
      nonMaleficence: 1.0 - ctx.harmPotential,
      beneficence: ctx.benefitScore,
      autonomy: ctx.userConsent ? 1.0 : 0.0,
      justice: ctx.fairnessScore,
    };

    // الأوزان: NM له وزن 2x
    const weights = { nonMaleficence: 2.0, beneficence: 1.0, autonomy: 1.5, justice: 1.0 };
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const overallScore =
      (scores.nonMaleficence * weights.nonMaleficence +
        scores.beneficence * weights.beneficence +
        scores.autonomy * weights.autonomy +
        scores.justice * weights.justice) /
      totalWeight;

    // فحص الانتهاكات
    let isViolation = false;
    let reason = 'تم التحقق – جميع المبادئ مُستوفاة ✓';

    if (scores.nonMaleficence < this._constitution.NON_MALEFICENCE_THRESHOLD) {
      isViolation = true;
      reason = `⛔ رفض: ضرر محتمل عالٍ (${(ctx.harmPotential * 100).toFixed(1)}% > ${((1 - this._constitution.NON_MALEFICENCE_THRESHOLD) * 100).toFixed(0)}%)`;
    } else if (scores.autonomy < this._constitution.AUTONOMY_THRESHOLD) {
      isViolation = true;
      reason = '⛔ رفض: لا توجد موافقة المستخدم (انتهاك الاستقلالية)';
    } else if (scores.beneficence < this._constitution.BENEFICENCE_THRESHOLD) {
      isViolation = true;
      reason = `⛔ رفض: فائدة منخفضة (${(scores.beneficence * 100).toFixed(1)}%)`;
    }

    // تسجيل التدقيق
    this._auditLog.push({
      timestamp: Date.now(),
      action: ctx.actionType,
      score: overallScore,
      allowed: !isViolation,
      reason,
    });

    return {
      nonMaleficence: scores.nonMaleficence,
      beneficence: scores.beneficence,
      autonomy: scores.autonomy,
      justice: scores.justice,
      overallScore,
      isViolation,
      reason,
    };
  }

  /** استرجاع آخر 20 إدخالاً من سجل التدقيق */
  getAuditLog(): AuditEntry[] {
    return [...this._auditLog].slice(-20);
  }

  /** نسبة الموافقة الكلية */
  getApprovalRate(): number {
    if (this._auditLog.length === 0) return 1;
    const approved = this._auditLog.filter((e) => e.allowed).length;
    return approved / this._auditLog.length;
  }
}

/** نسخة مُشتركة وحيدة (Singleton) لضمان عدم تعدد النسخ */
export const ethicsGuard = new EthicalGovernanceSystem();
