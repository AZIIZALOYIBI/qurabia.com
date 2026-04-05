/**
 * ============================================================
 * AIResultsAnalyzer.ts — محرك التحليل الذكي للنتائج
 * QURABIA
 *
 * يجمع نتائج جميع المحاكاات والمحركات الاستراتيجية
 * ويحللها باستخدام الذكاء الاصطناعي لتقديم رؤى عميقة
 * ============================================================
 */

import { GrokService } from './GrokService';
import { GeminiService } from './GeminiService';

// ─── أنواع التحليل ────────────────────────────────────────────

/** فئات التحليل المتاحة */
export type AnalysisCategory =
  | 'performance'      // أداء المحاكاة
  | 'convergence'      // تقارب الطاقة
  | 'security'         // المؤشرات الأمنية
  | 'innovation'       // نتائج الابتكار
  | 'comprehensive';   // تحليل شامل

/** مستوى الأهمية */
export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';

/** رؤية ذكية واحدة */
export interface AIInsight {
  id: string;
  category: AnalysisCategory;
  title: string;
  description: string;
  severity: InsightSeverity;
  metric?: string;
  value?: number | string;
  recommendation?: string;
  timestamp: number;
}

/** بيانات الأداء عبر الزمن */
export interface PerformanceTrend {
  label: string;
  energy: number;
  fidelity: number;
  timestamp: number;
}

/** ملخص التحليل الشامل */
export interface AnalysisSummary {
  overallScore: number;         // 0–100 نقاط تقييم شامل
  totalSimulations: number;
  avgEnergy: number;
  avgFidelity: number;
  insights: AIInsight[];
  trends: PerformanceTrend[];
  aiNarrative: string;          // السرد الذكي المولّد بالذكاء الاصطناعي
  provider: string;             // مزود الذكاء الاصطناعي المستخدم
  generatedAt: number;
}

/** سجل محاكاة يُخزَّن محلياً */
export interface SimulationRecord {
  type: string;
  energy?: number;
  fidelity?: number;
  data: Record<string, unknown>;
  timestamp: number;
}

// ─── ثوابت ──────────────────────────────────────────────────────
const STORAGE_KEY = 'qurabia.simulation_history';
const MAX_RECORDS = 200;

// ─── المحرك الرئيسي ─────────────────────────────────────────────

export class AIResultsAnalyzer {

  /**
   * تسجيل نتيجة محاكاة جديدة في السجل المحلي
   */
  static recordSimulation(record: SimulationRecord): void {
    try {
      const history = this.getHistory();
      history.push(record);
      // الاحتفاظ بآخر MAX_RECORDS سجل فقط
      const trimmed = history.slice(-MAX_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // localStorage قد لا يكون متاحاً
    }
  }

  /**
   * استرجاع سجل المحاكاات
   */
  static getHistory(): SimulationRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * مسح السجل
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * حساب إحصائيات أساسية من السجل
   */
  static computeStats(history?: SimulationRecord[]): {
    totalSimulations: number;
    avgEnergy: number;
    avgFidelity: number;
    bestEnergy: number;
    bestFidelity: number;
    typeDistribution: Record<string, number>;
    trends: PerformanceTrend[];
  } {
    const records = history ?? this.getHistory();

    if (records.length === 0) {
      return {
        totalSimulations: 0,
        avgEnergy: 0,
        avgFidelity: 0,
        bestEnergy: 0,
        bestFidelity: 0,
        typeDistribution: {},
        trends: [],
      };
    }

    const energies = records
      .map(r => r.energy)
      .filter((e): e is number => typeof e === 'number' && Number.isFinite(e));
    const fidelities = records
      .map(r => r.fidelity)
      .filter((f): f is number => typeof f === 'number' && Number.isFinite(f));

    const avgEnergy = energies.length > 0
      ? energies.reduce((a, b) => a + b, 0) / energies.length
      : 0;
    const avgFidelity = fidelities.length > 0
      ? fidelities.reduce((a, b) => a + b, 0) / fidelities.length
      : 0;

    const typeDistribution: Record<string, number> = {};
    for (const r of records) {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    }

    // بناء بيانات الاتجاه (آخر 30 نقطة)
    const recentRecords = records.slice(-30);
    const trends: PerformanceTrend[] = recentRecords.map((r, i) => ({
      label: `#${i + 1}`,
      energy: typeof r.energy === 'number' && Number.isFinite(r.energy) ? r.energy : 0,
      fidelity: typeof r.fidelity === 'number' && Number.isFinite(r.fidelity) ? r.fidelity : 0,
      timestamp: r.timestamp,
    }));

    return {
      totalSimulations: records.length,
      avgEnergy,
      avgFidelity,
      bestEnergy: energies.length > 0 ? Math.min(...energies) : 0,
      bestFidelity: fidelities.length > 0 ? Math.max(...fidelities) : 0,
      typeDistribution,
      trends,
    };
  }

  /**
   * توليد رؤى ذكية من الإحصائيات
   */
  static generateInsights(stats: ReturnType<typeof AIResultsAnalyzer.computeStats>): AIInsight[] {
    const insights: AIInsight[] = [];
    const now = Date.now();

    // تقييم عدد المحاكاات
    if (stats.totalSimulations === 0) {
      insights.push({
        id: 'no-data',
        category: 'comprehensive',
        title: 'لا توجد بيانات بعد',
        description: 'لم يتم تسجيل أي محاكاة حتى الآن. قم بتشغيل محاكاة للحصول على تحليلات ذكية.',
        severity: 'info',
        timestamp: now,
      });
      return insights;
    }

    // تحليل الطاقة
    if (stats.avgEnergy !== 0) {
      const energyStatus = stats.avgEnergy < -1.0 ? 'success' : stats.avgEnergy < 0 ? 'info' : 'warning';
      insights.push({
        id: 'energy-avg',
        category: 'convergence',
        title: 'متوسط تقارب الطاقة',
        description: energyStatus === 'success'
          ? 'الطاقة المتوسطة تشير إلى تقارب ممتاز نحو الحالة الأرضية.'
          : energyStatus === 'info'
            ? 'الطاقة المتوسطة ضمن النطاق المقبول ولكن يمكن تحسينها.'
            : 'الطاقة المتوسطة مرتفعة — قد يحتاج المُحسِّن إلى مزيد من التكرارات.',
        severity: energyStatus,
        metric: 'الطاقة (Ha)',
        value: Number(stats.avgEnergy.toFixed(6)),
        recommendation: energyStatus !== 'success'
          ? 'جرب زيادة عدد التكرارات أو تعديل معاملات التباين (Variational Parameters).'
          : undefined,
        timestamp: now,
      });
    }

    // تحليل الدقة
    if (stats.avgFidelity !== 0) {
      const fidelityPct = stats.avgFidelity * 100;
      const fidelityStatus: InsightSeverity = fidelityPct >= 99 ? 'success' : fidelityPct >= 95 ? 'info' : fidelityPct >= 90 ? 'warning' : 'critical';
      insights.push({
        id: 'fidelity-avg',
        category: 'performance',
        title: 'متوسط دقة البوابات الكمومية',
        description: fidelityStatus === 'success'
          ? 'الدقة ممتازة — النظام يعمل فوق عتبة تصحيح الأخطاء الكمية.'
          : fidelityStatus === 'info'
            ? 'الدقة جيدة ولكن تقع تحت عتبة 99% المطلوبة للحوسبة الكمية المقاومة للأخطاء.'
            : 'الدقة منخفضة — يُوصى بتحسين معايرة البوابات الكمومية.',
        severity: fidelityStatus,
        metric: 'الدقة (%)',
        value: `${fidelityPct.toFixed(2)}%`,
        recommendation: fidelityStatus !== 'success'
          ? 'تحقق من معايرة البوابات الكمومية وزمن التماسك (Coherence Time).'
          : undefined,
        timestamp: now,
      });
    }

    // تحليل أفضل نتيجة
    if (stats.bestFidelity > 0) {
      insights.push({
        id: 'best-fidelity',
        category: 'performance',
        title: 'أعلى دقة مُحققة',
        description: `أفضل دقة بوابة كمومية تم تسجيلها: ${(stats.bestFidelity * 100).toFixed(2)}%.`,
        severity: stats.bestFidelity >= 0.99 ? 'success' : 'info',
        metric: 'أفضل دقة',
        value: `${(stats.bestFidelity * 100).toFixed(2)}%`,
        timestamp: now,
      });
    }

    // تحليل توزيع الأنواع
    const topType = Object.entries(stats.typeDistribution)
      .sort(([, a], [, b]) => b - a)[0];
    if (topType) {
      insights.push({
        id: 'type-dist',
        category: 'comprehensive',
        title: 'النوع الأكثر استخداماً',
        description: `أكثر نوع محاكاة تم تشغيله: ${topType[0]} (${topType[1]} مرة من أصل ${stats.totalSimulations}).`,
        severity: 'info',
        metric: 'النوع المفضل',
        value: topType[0],
        recommendation: Object.keys(stats.typeDistribution).length < 3
          ? 'جرب أنواع محاكاة مختلفة مثل CRYPTO أو AI لاستكشاف مجالات أخرى.'
          : undefined,
        timestamp: now,
      });
    }

    // تحليل الاتجاه
    if (stats.trends.length >= 5) {
      const recentEnergies = stats.trends.slice(-5).map(t => t.energy).filter(e => e !== 0);
      if (recentEnergies.length >= 3) {
        const isImproving = recentEnergies.every((e, i) => i === 0 || e <= recentEnergies[i - 1]);
        insights.push({
          id: 'trend-energy',
          category: 'convergence',
          title: isImproving ? 'اتجاه تقارب إيجابي' : 'اتجاه متذبذب',
          description: isImproving
            ? 'الطاقة تتناقص باستمرار عبر آخر المحاكاات — مسار التقارب مثالي.'
            : 'الطاقة تتذبذب بين المحاكاات — قد يحتاج المُحسِّن إلى ضبط.',
          severity: isImproving ? 'success' : 'warning',
          recommendation: !isImproving
            ? 'جرب تقليل معدل التعلم أو استخدام optimizer مختلف مثل COBYLA أو L-BFGS-B.'
            : undefined,
          timestamp: now,
        });
      }
    }

    return insights;
  }

  /**
   * حساب النقاط الشاملة (0–100)
   */
  static computeOverallScore(stats: ReturnType<typeof AIResultsAnalyzer.computeStats>): number {
    if (stats.totalSimulations === 0) return 0;

    let score = 50; // نقطة بداية

    // مكافأة عدد المحاكاات (حتى 15 نقطة)
    score += Math.min(stats.totalSimulations, 30) * 0.5;

    // مكافأة الدقة (حتى 20 نقطة)
    if (stats.avgFidelity > 0) {
      score += stats.avgFidelity * 20;
    }

    // مكافأة تقارب الطاقة (حتى 15 نقطة)
    if (stats.avgEnergy < 0) {
      score += Math.min(Math.abs(stats.avgEnergy), 1.5) * 10;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * إجراء تحليل شامل بالذكاء الاصطناعي
   */
  static async analyzeComprehensive(): Promise<AnalysisSummary> {
    const history = this.getHistory();
    const stats = this.computeStats(history);
    const insights = this.generateInsights(stats);
    const overallScore = this.computeOverallScore(stats);

    // بناء ملخص للذكاء الاصطناعي
    const summaryForAI = {
      totalSimulations: stats.totalSimulations,
      avgEnergy: Number(stats.avgEnergy.toFixed(6)),
      avgFidelity: Number((stats.avgFidelity * 100).toFixed(2)),
      bestEnergy: Number(stats.bestEnergy.toFixed(6)),
      bestFidelity: Number((stats.bestFidelity * 100).toFixed(2)),
      typeDistribution: stats.typeDistribution,
      overallScore,
      insightCount: insights.length,
      criticalInsights: insights.filter(i => i.severity === 'critical').length,
    };

    // طلب تحليل ذكي من الـ AI
    let aiNarrative = '';
    let provider = 'محلي';

    try {
      aiNarrative = await GrokService.analyzeSimulation(summaryForAI);
      provider = 'xAI Grok';
    } catch {
      try {
        aiNarrative = await GeminiService.analyzeSimulation(summaryForAI);
        provider = 'Gemini AI';
      } catch {
        aiNarrative = this.generateLocalNarrative(stats, insights);
        provider = 'محلي';
      }
    }

    // إذا حصلنا على نص فارغ، استخدم التحليل المحلي
    if (!aiNarrative.trim()) {
      aiNarrative = this.generateLocalNarrative(stats, insights);
      provider = 'محلي';
    }

    return {
      overallScore,
      totalSimulations: stats.totalSimulations,
      avgEnergy: stats.avgEnergy,
      avgFidelity: stats.avgFidelity,
      insights,
      trends: stats.trends,
      aiNarrative,
      provider,
      generatedAt: Date.now(),
    };
  }

  /**
   * توليد سرد تحليلي محلي عند عدم توفر AI
   */
  private static generateLocalNarrative(
    stats: ReturnType<typeof AIResultsAnalyzer.computeStats>,
    insights: AIInsight[],
  ): string {
    if (stats.totalSimulations === 0) {
      return 'لم يتم إجراء أي محاكاة بعد. قم بتشغيل محاكاة من مختبر المحاكاة للحصول على تحليل ذكي لنتائجك.';
    }

    const parts: string[] = [];

    parts.push(
      `تم تحليل ${stats.totalSimulations} محاكاة. ` +
      `متوسط الطاقة: ${stats.avgEnergy.toFixed(4)} Ha، ` +
      `ومتوسط الدقة: ${(stats.avgFidelity * 100).toFixed(2)}%.`
    );

    const critical = insights.filter(i => i.severity === 'critical');
    const warnings = insights.filter(i => i.severity === 'warning');

    if (critical.length > 0) {
      parts.push(`⚠️ يوجد ${critical.length} تنبيه حرج يتطلب الانتباه.`);
    }
    if (warnings.length > 0) {
      parts.push(`تم رصد ${warnings.length} تحذير قابل للتحسين.`);
    }
    if (critical.length === 0 && warnings.length === 0) {
      parts.push('جميع المؤشرات ضمن النطاق الصحي — النظام يعمل بكفاءة.');
    }

    const types = Object.keys(stats.typeDistribution);
    if (types.length > 0) {
      parts.push(`أنواع المحاكاة المُستخدمة: ${types.join('، ')}.`);
    }

    return parts.join(' ');
  }
}
