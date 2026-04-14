/**
 * ============================================================
 * ModelExportService.ts — خدمة تصدير نموذج التحليل
 * QURABIA
 *
 * تجمع بيانات المحاكاة والدوائر الكمية والمعادلات ونتائج
 * التحليل الذكي وتنتج ملف QURABIA Analysis Model بتنسيق JSON
 * موحّد وقابل للاستخدام في الأدوات الخارجية.
 * ============================================================
 */

import { AIResultsAnalyzer, type AnalysisSummary, type SimulationRecord } from './AIResultsAnalyzer';

// ─── Schema الإصدار ──────────────────────────────────────────
const MODEL_VERSION = '1.0';
const MODEL_TYPE = 'QURABIA_ANALYSIS_MODEL';

// ─── أنواع التصدير ───────────────────────────────────────────

export interface ModelMetadata {
  version: string;
  type: string;
  exportedAt: string;
  platform: string;
  language: string;
  platformVersion: string;
}

export interface ModelSimulationSummary {
  totalRecords: number;
  avgEnergy: number;
  avgFidelity: number;
  bestEnergy: number;
  bestFidelity: number;
  typeDistribution: Record<string, number>;
  recentRecords: SimulationRecord[];
}

export interface ModelEquations {
  alUtaibiV2: {
    name: string;
    description: string;
    formula: string;
    reference: string;
  };
  planck: {
    name: string;
    description: string;
    formula: string;
    reference: string;
  };
}

export interface QURABIAAnalysisModel {
  version: string;
  type: string;
  metadata: ModelMetadata;
  simulation: ModelSimulationSummary;
  analysis: AnalysisSummary | null;
  equations: ModelEquations;
  platformAnalytics: unknown;
}

// ─── المحرك الرئيسي ─────────────────────────────────────────

// biome-ignore lint/complexity/noStaticOnlyClass: نمط Namespace — الكلاس يُستخدم كـ namespace للخدمة
export class ModelExportService {
  /**
   * يجمع جميع البيانات المتاحة ويبني نموذج التحليل الموحّد
   */
  static async buildModel(existingAnalysis?: AnalysisSummary | null): Promise<QURABIAAnalysisModel> {
    const history = AIResultsAnalyzer.getHistory();
    const stats = AIResultsAnalyzer.computeStats(history);

    const simulation: ModelSimulationSummary = {
      totalRecords: stats.totalSimulations,
      avgEnergy: stats.avgEnergy,
      avgFidelity: stats.avgFidelity,
      bestEnergy: stats.bestEnergy,
      bestFidelity: stats.bestFidelity,
      typeDistribution: stats.typeDistribution,
      recentRecords: history.slice(-50),
    };

    // استرجاع بيانات التحليل المحلية إن لم تُوفَّر
    let analysis: AnalysisSummary | null = existingAnalysis ?? null;
    if (!analysis && history.length > 0) {
      try {
        analysis = await AIResultsAnalyzer.analyzeComprehensive();
      } catch {
        analysis = null;
      }
    }

    // بيانات التحليل A/B المحلية
    let platformAnalytics: unknown = [];
    try {
      const raw = localStorage.getItem('qurabia.analytics') || '[]';
      platformAnalytics = JSON.parse(raw);
    } catch {
      platformAnalytics = [];
    }

    const equations: ModelEquations = {
      alUtaibiV2: {
        name: 'معادلة العتيبي الموحدة v2.0',
        description: 'معادلة كمومية تجمع بين ميكانيكا الكم ونظرية الأوتار الفائقة لحساب إجمالي الطاقة الكمومية',
        formula: 'E_total = E_photon × ψ² × Y_lm × α_fine × f(dark)',
        reference: 'Al-Utaibi Unified Quantum Equation v2.0 — QURABIA Research',
      },
      planck: {
        name: 'معادلة بلانك-العتيبي للإشعاع الجسم الأسود',
        description: 'امتداد لقانون بلانك مع تعديلات كمومية مرتبطة بمعادلة العتيبي',
        formula: 'B(ν,T) = (2hν³/c²) × 1/(e^(hν/kT) - 1) × ξ_QE',
        reference: 'Al-Otaibi–Planck Blackbody Radiation Module — QURABIA',
      },
    };

    return {
      version: MODEL_VERSION,
      type: MODEL_TYPE,
      metadata: {
        version: MODEL_VERSION,
        type: MODEL_TYPE,
        exportedAt: new Date().toISOString(),
        platform: 'QURABIA Quantum Platform',
        language: 'ar',
        platformVersion: '2.0',
      },
      simulation,
      analysis,
      equations,
      platformAnalytics,
    };
  }

  /**
   * تنزيل النموذج الكامل كملف JSON
   */
  static async downloadFullModel(existingAnalysis?: AnalysisSummary | null): Promise<void> {
    const model = await ModelExportService.buildModel(existingAnalysis);
    ModelExportService._triggerDownload(
      JSON.stringify(model, null, 2),
      `qurabia-analysis-model-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
      'application/json;charset=utf-8',
    );
  }

  /**
   * تنزيل نتائج التحليل فقط (الطريقة القديمة)
   */
  static downloadResultsOnly(analysis: AnalysisSummary): void {
    ModelExportService._triggerDownload(
      JSON.stringify(analysis, null, 2),
      `qurabia-ai-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
      'application/json;charset=utf-8',
    );
  }

  /** مساعد داخلي لتشغيل تنزيل الملف */
  private static _triggerDownload(content: string, filename: string, mimeType: string): void {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // تجاهل أخطاء التنزيل
    }
  }
}
