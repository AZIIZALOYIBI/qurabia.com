/**
 * Quantum Threat Intelligence Network (QTIN)
 * شبكة استخبارات التهديدات الكمومية
 *
 * نظام موزع لجمع وتحليل ومشاركة معلومات التهديدات الكمومية عالمياً
 * يستخدم التشابك الكمومي للتحقق من صحة البيانات ومنع التلاعب
 */

import type { QuantumThreatTier } from './QuantumCyberShieldV2';
import type { ThreatCategory } from './ClaudeThreatNarratives';

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

export interface ThreatIntelligenceReport {
  /** معرّف فريد عالمي */
  uuid: string;
  /** وقت الرصد */
  timestamp: number;
  /** المصدر (منظمة مساهمة) */
  source: string;
  /** نوع التهديد */
  category: ThreatCategory;
  /** مستوى الخطورة */
  severity: QuantumThreatTier;
  /** المؤشرات التقنية (IoCs) */
  indicators: ThreatIndicator[];
  /** TTPs (Tactics, Techniques, Procedures) */
  ttps: MITRETTA[];
  /** التوقيع الكمومي للتحقق */
  quantumSignature: string;
  /** التشابك الكمومي للمصادقة */
  entanglementProof: EntanglementProof;
  /** مستوى الثقة (0-1) */
  confidence: number;
  /** الانتشار الجغرافي */
  geoDistribution: GeoData[];
  /** الأهداف المحتملة */
  targets: string[];
  /** الحملة المرتبطة (إن وُجدت) */
  campaignId?: string;
  /** جهة التهديد (Attribution) */
  attribution?: ThreatActor;
}

export interface ThreatIndicator {
  /** نوع المؤشر */
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'quantum_signature';
  /** القيمة */
  value: string;
  /** السياق */
  context?: string;
  /** وقت الصلاحية */
  expiresAt?: number;
}

export interface MITRETTA {
  /** معرّف التكتيك */
  tacticId: string;
  /** اسم التكتيك */
  tacticName: string;
  /** معرّف التقنية */
  techniqueId: string;
  /** اسم التقنية */
  techniqueName: string;
  /** معرّف الإجراء الفرعي */
  subTechniqueId?: string;
}

export interface EntanglementProof {
  /** معرّف الكيوبت المتشابك */
  qubitPairId: string;
  /** قياس الحالة */
  measurement: string;
  /** الطابع الزمني */
  timestamp: number;
  /** توقيع Bell State */
  bellState: 'Φ+' | 'Φ-' | 'Ψ+' | 'Ψ-';
}

export interface GeoData {
  /** رمز الدولة ISO */
  countryCode: string;
  /** اسم الدولة */
  countryName: string;
  /** نسبة الانتشار */
  prevalence: number;
}

export interface ThreatActor {
  /** معرّف الجهة */
  id: string;
  /** الاسم (أو اسم رمزي) */
  name: string;
  /** النوع */
  type: 'nation_state' | 'cybercrime' | 'hacktivist' | 'insider' | 'unknown';
  /** الدوافع */
  motivation: string[];
  /** مستوى التطور (1-5) */
  sophistication: number;
}

// ═══════════════════════════════════════════════════════════════
// شبكة QTIN الموزعة
// ═══════════════════════════════════════════════════════════════

export interface QTINNode {
  /** معرّف العقدة */
  nodeId: string;
  /** المنظمة المالكة */
  organization: string;
  /** الموقع الجغرافي */
  location: string;
  /** حالة الاتصال */
  status: 'online' | 'offline' | 'syncing';
  /** آخر نبضة قلب */
  lastHeartbeat: number;
  /** عدد التقارير المساهمة */
  contributedReports: number;
  /** مستوى الثقة (0-1) */
  trustScore: number;
  /** التوقيع العام الكمومي */
  publicQuantumKey: string;
}

export class QuantumThreatIntelligenceNetwork {
  private nodes: Map<string, QTINNode> = new Map();
  private reports: Map<string, ThreatIntelligenceReport> = new Map();
  private campaigns: Map<string, ThreatCampaign> = new Map();

  /**
   * إضافة عقدة جديدة للشبكة
   */
  registerNode(node: QTINNode): void {
    this.nodes.set(node.nodeId, node);
    console.log(`[QTIN] عقدة جديدة: ${node.organization} (${node.location})`);
  }

  /**
   * نشر تقرير استخباراتي جديد
   */
  publishReport(report: ThreatIntelligenceReport): void {
    // التحقق من التوقيع الكمومي
    if (!this.verifyQuantumSignature(report)) {
      console.error(`[QTIN] فشل التحقق من التوقيع: ${report.uuid}`);
      return;
    }

    // التحقق من التشابك الكمومي
    if (!this.verifyEntanglement(report.entanglementProof)) {
      console.error(`[QTIN] فشل التحقق من التشابك: ${report.uuid}`);
      return;
    }

    this.reports.set(report.uuid, report);

    // ربط بحملة إن وُجدت
    if (report.campaignId) {
      this.linkToCampaign(report);
    }

    // تحديث نقاط الثقة للمصدر
    this.updateTrustScore(report.source, report.confidence);

    console.log(`[QTIN] تقرير جديد: ${report.uuid} من ${report.source}`);
  }

  /**
   * البحث عن تقارير حسب معايير
   */
  queryReports(criteria: {
    category?: ThreatCategory;
    severity?: QuantumThreatTier;
    minConfidence?: number;
    since?: number;
    geoRegion?: string;
  }): ThreatIntelligenceReport[] {
    const results: ThreatIntelligenceReport[] = [];

    for (const report of this.reports.values()) {
      if (criteria.category && report.category !== criteria.category) continue;
      if (criteria.severity && report.severity !== criteria.severity) continue;
      if (criteria.minConfidence && report.confidence < criteria.minConfidence) continue;
      if (criteria.since && report.timestamp < criteria.since) continue;

      if (criteria.geoRegion) {
        const hasRegion = report.geoDistribution.some(
          (geo) => geo.countryCode === criteria.geoRegion
        );
        if (!hasRegion) continue;
      }

      results.push(report);
    }

    // ترتيب حسب الوقت (الأحدث أولاً)
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * الحصول على أكثر المؤشرات انتشاراً
   */
  getTopIndicators(limit = 10): Array<{ indicator: ThreatIndicator; count: number }> {
    const indicatorCounts = new Map<string, { indicator: ThreatIndicator; count: number }>();

    for (const report of this.reports.values()) {
      for (const indicator of report.indicators) {
        const key = `${indicator.type}:${indicator.value}`;
        const existing = indicatorCounts.get(key);

        if (existing) {
          existing.count++;
        } else {
          indicatorCounts.set(key, { indicator, count: 1 });
        }
      }
    }

    return Array.from(indicatorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * تحليل الاتجاهات الزمنية
   */
  analyzeTrends(timeWindowMs = 86400000): ThreatTrend[] {
    const now = Date.now();
    const recentReports = Array.from(this.reports.values()).filter(
      (r) => r.timestamp > now - timeWindowMs
    );

    // تجميع حسب الفئة
    const categoryGroups = new Map<ThreatCategory, ThreatIntelligenceReport[]>();

    for (const report of recentReports) {
      const existing = categoryGroups.get(report.category) || [];
      existing.push(report);
      categoryGroups.set(report.category, existing);
    }

    // حساب الاتجاهات
    const trends: ThreatTrend[] = [];

    for (const [category, reports] of categoryGroups.entries()) {
      const avgSeverity = this.calculateAverageSeverity(reports);
      const growth = this.calculateGrowthRate(category, timeWindowMs);

      trends.push({
        category,
        count: reports.length,
        averageSeverity: avgSeverity,
        growthRate: growth,
        topActors: this.getTopActors(reports, 3),
      });
    }

    return trends.sort((a, b) => b.count - a.count);
  }

  /**
   * كشف الحملات المنسقة (Campaign Detection)
   */
  detectCampaigns(): ThreatCampaign[] {
    const detectedCampaigns: ThreatCampaign[] = [];

    // خوارزمية التجميع — نستخدم تشابه TTPs والمؤشرات
    const reportsList = Array.from(this.reports.values());

    for (let i = 0; i < reportsList.length; i++) {
      for (let j = i + 1; j < reportsList.length; j++) {
        const similarity = this.calculateSimilarity(reportsList[i], reportsList[j]);

        if (similarity > 0.7) {
          // عتبة عالية للتشابه
          let campaign = this.findOrCreateCampaign(reportsList[i], reportsList[j]);
          if (!detectedCampaigns.includes(campaign)) {
            detectedCampaigns.push(campaign);
          }
        }
      }
    }

    return detectedCampaigns;
  }

  /**
   * توليد خريطة حرارية عالمية
   */
  generateGlobalHeatmap(): GlobalThreatHeatmap {
    const countryThreatLevels = new Map<string, number>();

    for (const report of this.reports.values()) {
      for (const geo of report.geoDistribution) {
        const existing = countryThreatLevels.get(geo.countryCode) || 0;
        const weight = this.severityToWeight(report.severity);
        countryThreatLevels.set(geo.countryCode, existing + weight * geo.prevalence);
      }
    }

    const regions: HeatmapRegion[] = [];

    for (const [countryCode, threatLevel] of countryThreatLevels.entries()) {
      regions.push({
        countryCode,
        threatLevel: Math.min(1, threatLevel / 100), // تطبيع
        tier: this.weightToTier(threatLevel),
      });
    }

    return {
      timestamp: Date.now(),
      regions,
      globalAverage: this.calculateGlobalAverage(regions),
      hotspots: this.identifyHotspots(regions, 5),
    };
  }

  /**
   * التنبؤ بالتهديدات المستقبلية (AI-Powered)
   */
  predictFutureThreats(horizonDays = 7): ThreatPrediction[] {
    const predictions: ThreatPrediction[] = [];

    // تحليل الاتجاهات التاريخية
    const trends = this.analyzeTrends(30 * 86400000); // آخر 30 يوم

    for (const trend of trends) {
      if (trend.growthRate > 0.1) {
        // نمو أكبر من 10%
        const predictedIncrease = trend.count * (1 + trend.growthRate * horizonDays);

        predictions.push({
          category: trend.category,
          currentCount: trend.count,
          predictedCount: Math.round(predictedIncrease),
          confidence: this.calculatePredictionConfidence(trend),
          timeframe: horizonDays,
          reasoning: `معدل نمو ${(trend.growthRate * 100).toFixed(1)}% خلال آخر 30 يوم`,
        });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  // ═══════════════════════════════════════════════════════════════
  // دوال مساعدة خاصة
  // ═══════════════════════════════════════════════════════════════

  private verifyQuantumSignature(report: ThreatIntelligenceReport): boolean {
    // في بيئة إنتاجية، نستخدم خوارزميات PQC (CRYSTALS-Dilithium)
    // هنا محاكاة بسيطة
    return report.quantumSignature.length > 64;
  }

  private verifyEntanglement(proof: EntanglementProof): boolean {
    // التحقق من صحة حالة Bell
    const validBellStates: Array<'Φ+' | 'Φ-' | 'Ψ+' | 'Ψ-'> = ['Φ+', 'Φ-', 'Ψ+', 'Ψ-'];
    return validBellStates.includes(proof.bellState);
  }

  private linkToCampaign(report: ThreatIntelligenceReport): void {
    if (!report.campaignId) return;

    const campaign = this.campaigns.get(report.campaignId);
    if (campaign) {
      campaign.relatedReports.push(report.uuid);
    }
  }

  private updateTrustScore(source: string, confidence: number): void {
    for (const node of this.nodes.values()) {
      if (node.organization === source) {
        // تحديث تدريجي — متوسط متحرك
        node.trustScore = node.trustScore * 0.9 + confidence * 0.1;
        break;
      }
    }
  }

  private calculateAverageSeverity(reports: ThreatIntelligenceReport[]): number {
    const severityValues = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5 };
    const sum = reports.reduce((acc, r) => acc + severityValues[r.severity], 0);
    return sum / reports.length;
  }

  private calculateGrowthRate(category: ThreatCategory, timeWindowMs: number): number {
    const now = Date.now();
    const currentPeriod = Array.from(this.reports.values()).filter(
      (r) => r.category === category && r.timestamp > now - timeWindowMs
    ).length;

    const previousPeriod = Array.from(this.reports.values()).filter(
      (r) =>
        r.category === category &&
        r.timestamp > now - 2 * timeWindowMs &&
        r.timestamp <= now - timeWindowMs
    ).length;

    if (previousPeriod === 0) return 0;
    return (currentPeriod - previousPeriod) / previousPeriod;
  }

  private getTopActors(reports: ThreatIntelligenceReport[], limit: number): ThreatActor[] {
    const actorCounts = new Map<string, { actor: ThreatActor; count: number }>();

    for (const report of reports) {
      if (!report.attribution) continue;

      const existing = actorCounts.get(report.attribution.id);
      if (existing) {
        existing.count++;
      } else {
        actorCounts.set(report.attribution.id, {
          actor: report.attribution,
          count: 1,
        });
      }
    }

    return Array.from(actorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => item.actor);
  }

  private calculateSimilarity(r1: ThreatIntelligenceReport, r2: ThreatIntelligenceReport): number {
    let score = 0;

    // تشابه الفئة
    if (r1.category === r2.category) score += 0.3;

    // تشابه TTPs
    const ttpOverlap = this.calculateTTPOverlap(r1.ttps, r2.ttps);
    score += ttpOverlap * 0.4;

    // تشابه المؤشرات
    const indicatorOverlap = this.calculateIndicatorOverlap(r1.indicators, r2.indicators);
    score += indicatorOverlap * 0.3;

    return score;
  }

  private calculateTTPOverlap(ttps1: MITRETTA[], ttps2: MITRETTA[]): number {
    const set1 = new Set(ttps1.map((t) => t.techniqueId));
    const set2 = new Set(ttps2.map((t) => t.techniqueId));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private calculateIndicatorOverlap(ind1: ThreatIndicator[], ind2: ThreatIndicator[]): number {
    const set1 = new Set(ind1.map((i) => `${i.type}:${i.value}`));
    const set2 = new Set(ind2.map((i) => `${i.type}:${i.value}`));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  private findOrCreateCampaign(
    r1: ThreatIntelligenceReport,
    r2: ThreatIntelligenceReport
  ): ThreatCampaign {
    // البحث عن حملة موجودة
    for (const campaign of this.campaigns.values()) {
      if (
        campaign.relatedReports.includes(r1.uuid) ||
        campaign.relatedReports.includes(r2.uuid)
      ) {
        if (!campaign.relatedReports.includes(r1.uuid)) {
          campaign.relatedReports.push(r1.uuid);
        }
        if (!campaign.relatedReports.includes(r2.uuid)) {
          campaign.relatedReports.push(r2.uuid);
        }
        return campaign;
      }
    }

    // إنشاء حملة جديدة
    const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCampaign: ThreatCampaign = {
      id: campaignId,
      name: `حملة ${r1.category} - ${new Date().toLocaleDateString('ar-SA')}`,
      startDate: Math.min(r1.timestamp, r2.timestamp),
      relatedReports: [r1.uuid, r2.uuid],
      primaryActor: r1.attribution || r2.attribution,
      objectives: [],
    };

    this.campaigns.set(campaignId, newCampaign);
    return newCampaign;
  }

  private severityToWeight(tier: QuantumThreatTier): number {
    const weights = { Q1: 1, Q2: 5, Q3: 15, Q4: 40, Q5: 100 };
    return weights[tier];
  }

  private weightToTier(weight: number): QuantumThreatTier {
    if (weight >= 80) return 'Q5';
    if (weight >= 40) return 'Q4';
    if (weight >= 15) return 'Q3';
    if (weight >= 5) return 'Q2';
    return 'Q1';
  }

  private calculateGlobalAverage(regions: HeatmapRegion[]): number {
    if (regions.length === 0) return 0;
    const sum = regions.reduce((acc, r) => acc + r.threatLevel, 0);
    return sum / regions.length;
  }

  private identifyHotspots(regions: HeatmapRegion[], limit: number): HeatmapRegion[] {
    return regions
      .filter((r) => r.tier === 'Q5' || r.tier === 'Q4')
      .sort((a, b) => b.threatLevel - a.threatLevel)
      .slice(0, limit);
  }

  private calculatePredictionConfidence(trend: ThreatTrend): number {
    // الثقة تعتمد على:
    // 1. حجم العينة
    // 2. استقرار معدل النمو
    // 3. جودة البيانات

    let confidence = 0.5; // قاعدة

    if (trend.count > 100) confidence += 0.2;
    else if (trend.count > 50) confidence += 0.1;

    if (Math.abs(trend.growthRate) < 0.5) confidence += 0.2; // نمو مستقر
    else confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * إحصائيات الشبكة
   */
  getNetworkStats(): QTINStats {
    return {
      totalNodes: this.nodes.size,
      activeNodes: Array.from(this.nodes.values()).filter((n) => n.status === 'online').length,
      totalReports: this.reports.size,
      totalCampaigns: this.campaigns.size,
      avgTrustScore: this.calculateAverageTrustScore(),
      reportsLast24h: this.countRecentReports(86400000),
    };
  }

  private calculateAverageTrustScore(): number {
    const nodes = Array.from(this.nodes.values());
    if (nodes.length === 0) return 0;
    const sum = nodes.reduce((acc, n) => acc + n.trustScore, 0);
    return sum / nodes.length;
  }

  private countRecentReports(timeWindowMs: number): number {
    const now = Date.now();
    return Array.from(this.reports.values()).filter((r) => r.timestamp > now - timeWindowMs)
      .length;
  }
}

// ═══════════════════════════════════════════════════════════════
// أنواع إضافية
// ═══════════════════════════════════════════════════════════════

export interface ThreatCampaign {
  id: string;
  name: string;
  startDate: number;
  endDate?: number;
  relatedReports: string[];
  primaryActor?: ThreatActor;
  objectives: string[];
}

export interface ThreatTrend {
  category: ThreatCategory;
  count: number;
  averageSeverity: number;
  growthRate: number;
  topActors: ThreatActor[];
}

export interface GlobalThreatHeatmap {
  timestamp: number;
  regions: HeatmapRegion[];
  globalAverage: number;
  hotspots: HeatmapRegion[];
}

export interface HeatmapRegion {
  countryCode: string;
  threatLevel: number;
  tier: QuantumThreatTier;
}

export interface ThreatPrediction {
  category: ThreatCategory;
  currentCount: number;
  predictedCount: number;
  confidence: number;
  timeframe: number;
  reasoning: string;
}

export interface QTINStats {
  totalNodes: number;
  activeNodes: number;
  totalReports: number;
  totalCampaigns: number;
  avgTrustScore: number;
  reportsLast24h: number;
}

// ═══════════════════════════════════════════════════════════════
// مثال: إنشاء شبكة QTIN عالمية
// ═══════════════════════════════════════════════════════════════

export function createGlobalQTIN(): QuantumThreatIntelligenceNetwork {
  const qtin = new QuantumThreatIntelligenceNetwork();

  // تسجيل عقد عالمية
  const nodes: QTINNode[] = [
    {
      nodeId: 'qtin-qurabia-sa',
      organization: 'QURABIA Security Labs',
      location: 'Saudi Arabia',
      status: 'online',
      lastHeartbeat: Date.now(),
      contributedReports: 0,
      trustScore: 0.95,
      publicQuantumKey: 'QPK-QURABIA-2026',
    },
    {
      nodeId: 'qtin-cert-ae',
      organization: 'UAE CERT',
      location: 'United Arab Emirates',
      status: 'online',
      lastHeartbeat: Date.now(),
      contributedReports: 0,
      trustScore: 0.92,
      publicQuantumKey: 'QPK-CERT-UAE-2026',
    },
    {
      nodeId: 'qtin-research-us',
      organization: 'MIT Quantum Security Lab',
      location: 'United States',
      status: 'online',
      lastHeartbeat: Date.now(),
      contributedReports: 0,
      trustScore: 0.98,
      publicQuantumKey: 'QPK-MIT-QSL-2026',
    },
  ];

  for (const node of nodes) {
    qtin.registerNode(node);
  }

  return qtin;
}
