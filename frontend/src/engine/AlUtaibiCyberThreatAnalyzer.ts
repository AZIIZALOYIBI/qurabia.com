/**
 * Al-Utaibi Cyber Threat Analyzer
 * محلل التهديدات السيبرانية باستخدام معادلة العتيبي
 *
 * يستخدم معادلة العتيبي الكونية الموحدة لتحليل وتقييم التهديدات السيبرانية
 * عبر تحويل خصائص التهديدات إلى معاملات فيزيائية كمومية.
 */

import { AlUtaibiEquationV2, CosmicConstants } from './AlUtaibiEquationV2';

/**
 * مستويات التهديد السيبراني — مستوحاة من NIST Cybersecurity Framework
 */
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical' | 'existential';

/**
 * أنواع التهديدات السيبرانية
 */
export type ThreatCategory =
  | 'malware'
  | 'phishing'
  | 'ransomware'
  | 'ddos'
  | 'injection'
  | 'mitm'
  | 'zero-day'
  | 'apt'
  | 'insider';

/**
 * خصائص التهديد السيبراني
 */
export interface CyberThreat {
  id: string;
  category: ThreatCategory;
  sourceIP: string;
  targetPort: number;
  timestamp: number;

  // معاملات التهديد (0-1)
  severity: number;        // خطورة الهجوم
  velocity: number;        // سرعة الانتشار
  sophistication: number;  // مستوى التعقيد
  persistence: number;     // الثبات والتكرار
}

/**
 * نتيجة تحليل التهديد باستخدام معادلة العتيبي
 */
export interface ThreatAnalysisResult {
  threat: CyberThreat;
  threatLevel: ThreatLevel;
  threatScore: number;      // 0-100
  quantumRisk: number;      // مخاطر كمومية (eV)

  // معاملات معادلة العتيبي المحسوبة
  r_param: number;          // معامل المسافة الكمومية
  rho_dm: number;           // كثافة المادة المظلمة (خطورة)
  rho_de: number;           // كثافة الطاقة المظلمة (انتشار)
  Q_coherence: number;      // تماسك التهديد

  // توصيات الاستجابة
  recommendedAction: 'monitor' | 'alert' | 'block' | 'isolate' | 'shutdown';
  confidence: number;       // ثقة التحليل (0-1)
}

/**
 * محلل التهديدات السيبرانية باستخدام معادلة العتيبي
 */
export class AlUtaibiCyberThreatAnalyzer {
  private equation: AlUtaibiEquationV2;

  constructor() {
    this.equation = new AlUtaibiEquationV2();
  }

  /**
   * تحليل تهديد سيبراني باستخدام معادلة العتيبي
   *
   * الفكرة الرئيسية:
   * - نعامل كل تهديد كجسيم كمومي في فضاء الأمن السيبراني
   * - نستخدم معادلة العتيبي لحساب "الطاقة الكامنة" للتهديد
   * - الطاقة الأعلى = تهديد أخطر يتطلب استجابة فورية
   */
  analyzeThreat(threat: CyberThreat): ThreatAnalysisResult {
    // 1. تحويل خصائص التهديد إلى معاملات فيزيائية
    const r_param = this.computeQuantumDistance(threat);
    const rho_dm = this.computeDarkMatterDensity(threat);
    const rho_de = this.computeDarkEnergyDensity(threat);
    const Q_coherence = this.computeThreatCoherence(threat);

    // 2. حساب الطاقة الكمومية للتهديد باستخدام معادلة العتيبي
    const result = this.equation.compute_total_energy(r_param, rho_dm, rho_de, Q_coherence);

    // 3. تحويل الطاقة إلى درجة تهديد (0-100)
    const threatScore = this.normalizeToThreatScore(result.eV);

    // 4. تحديد مستوى التهديد
    const threatLevel = this.classifyThreatLevel(threatScore);

    // 5. تحديد الإجراء الموصى به
    const recommendedAction = this.recommendAction(threatLevel, threat.category);

    // 6. حساب ثقة التحليل
    const confidence = this.computeConfidence(threat, result);

    return {
      threat,
      threatLevel,
      threatScore,
      quantumRisk: result.eV,
      r_param,
      rho_dm,
      rho_de,
      Q_coherence,
      recommendedAction,
      confidence,
    };
  }

  /**
   * حساب المسافة الكمومية من التهديد
   *
   * كلما كان التهديد أكثر تعقيداً، كلما اقتربنا من طول بلانك
   * (التهديدات المعقدة تشبه الظواهر الكمومية على مقياس بلانك)
   */
  private computeQuantumDistance(threat: CyberThreat): number {
    const planckLength = CosmicConstants.PLANCK_LENGTH;

    // التعقيد العالي → مسافة أقرب لطول بلانك
    // التعقيد المنخفض → مسافة كلاسيكية أكبر
    const sophisticationFactor = threat.sophistication;

    // نطاق: [planckLength, 1e-30] متر
    return planckLength + (1e-30 - planckLength) * (1 - sophisticationFactor);
  }

  /**
   * حساب كثافة المادة المظلمة (تمثل الخطورة والثبات)
   *
   * المادة المظلمة في الكون تمثل 26% من الكتلة الكلية
   * نستخدمها هنا لتمثيل "الخطورة المخفية" للتهديد
   */
  private computeDarkMatterDensity(threat: CyberThreat): number {
    const baseDensity = 1.8e10; // kg/m³ — كثافة المادة المظلمة الحقيقية

    // الخطورة والثبات يزيدان الكثافة
    const severityFactor = threat.severity;
    const persistenceFactor = threat.persistence;

    return baseDensity * (1 + severityFactor * persistenceFactor);
  }

  /**
   * حساب كثافة الطاقة المظلمة (تمثل الانتشار والسرعة)
   *
   * الطاقة المظلمة تسبب تمدد الكون المتسارع
   * نستخدمها لتمثيل "سرعة انتشار" التهديد
   */
  private computeDarkEnergyDensity(threat: CyberThreat): number {
    const baseDensity = 1e-10; // kg/m³ — كثافة الطاقة المظلمة الحقيقية

    // السرعة العالية تزيد كثافة الطاقة المظلمة
    const velocityFactor = threat.velocity;

    return baseDensity * (1 + velocityFactor * 10);
  }

  /**
   * حساب التماسك الكمومي للتهديد (Q parameter)
   *
   * التهديدات المنسقة والمتقدمة (APT) لها تماسك كمومي عالٍ
   */
  private computeThreatCoherence(threat: CyberThreat): number {
    // التهديدات المتقدمة (APT, Zero-Day) لها تماسك عالي
    const categoryCoherence: Record<ThreatCategory, number> = {
      apt: 1.5,
      'zero-day': 1.4,
      ransomware: 1.2,
      mitm: 1.1,
      injection: 1.0,
      insider: 0.9,
      malware: 0.8,
      phishing: 0.6,
      ddos: 0.5,
    };

    const baseQ = categoryCoherence[threat.category] || 1.0;

    // التعقيد يزيد التماسك
    return baseQ * (1 + threat.sophistication * 0.5);
  }

  /**
   * تطبيع الطاقة الكمومية إلى درجة تهديد (0-100)
   */
  private normalizeToThreatScore(energyEV: number): number {
    // نطاق الطاقة المتوقع: [1e-23, 1e-20] eV
    // نحولها إلى [0, 100]

    const minEnergy = 1e-23;
    const maxEnergy = 1e-20;

    // لوغاريتمي للتعامل مع النطاق الواسع
    const logMin = Math.log10(minEnergy);
    const logMax = Math.log10(maxEnergy);
    const logEnergy = Math.log10(Math.max(energyEV, minEnergy));

    const normalized = ((logEnergy - logMin) / (logMax - logMin)) * 100;

    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * تصنيف مستوى التهديد بناءً على الدرجة
   */
  private classifyThreatLevel(score: number): ThreatLevel {
    if (score >= 90) return 'existential';
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  /**
   * التوصية بالإجراء المناسب
   */
  private recommendAction(
    level: ThreatLevel,
    category: ThreatCategory
  ): 'monitor' | 'alert' | 'block' | 'isolate' | 'shutdown' {
    // التهديدات الوجودية → إيقاف فوري
    if (level === 'existential') return 'shutdown';

    // التهديدات الحرجة → عزل
    if (level === 'critical') return 'isolate';

    // التهديدات العالية → حظر
    if (level === 'high') return 'block';

    // الفدية والـ APT دائماً → حظر على الأقل
    if (category === 'ransomware' || category === 'apt') {
      return level === 'medium' ? 'block' : 'alert';
    }

    // التهديدات المتوسطة → تنبيه
    if (level === 'medium') return 'alert';

    // التهديدات المنخفضة → مراقبة
    return 'monitor';
  }

  /**
   * حساب ثقة التحليل
   */
  private computeConfidence(threat: CyberThreat, result: any): number {
    let confidence = 0.85; // ثقة أساسية

    // التهديدات المعروفة → ثقة أعلى
    const knownCategories: ThreatCategory[] = ['malware', 'phishing', 'ddos', 'ransomware'];
    if (knownCategories.includes(threat.category)) {
      confidence += 0.1;
    }

    // التماسك العالي → ثقة أعلى
    if (result.otaibi_factor > 20) {
      confidence += 0.05;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * تحليل دفعة من التهديدات
   */
  analyzeThreats(threats: CyberThreat[]): ThreatAnalysisResult[] {
    return threats.map(threat => this.analyzeThreat(threat));
  }

  /**
   * الحصول على ملخص إحصائي للتهديدات
   */
  getThreatSummary(results: ThreatAnalysisResult[]): {
    total: number;
    byLevel: Record<ThreatLevel, number>;
    avgScore: number;
    maxScore: number;
    criticalThreats: ThreatAnalysisResult[];
  } {
    const byLevel: Record<ThreatLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      existential: 0,
    };

    let totalScore = 0;
    let maxScore = 0;

    for (const result of results) {
      byLevel[result.threatLevel]++;
      totalScore += result.threatScore;
      maxScore = Math.max(maxScore, result.threatScore);
    }

    const criticalThreats = results.filter(
      r => r.threatLevel === 'critical' || r.threatLevel === 'existential'
    );

    return {
      total: results.length,
      byLevel,
      avgScore: results.length > 0 ? totalScore / results.length : 0,
      maxScore,
      criticalThreats,
    };
  }
}

/**
 * مثال على استخدام المحلل
 */
export function createSampleThreat(): CyberThreat {
  return {
    id: `threat-${Date.now()}`,
    category: 'ransomware',
    sourceIP: '192.168.1.100',
    targetPort: 443,
    timestamp: Date.now(),
    severity: 0.85,
    velocity: 0.7,
    sophistication: 0.9,
    persistence: 0.8,
  };
}
