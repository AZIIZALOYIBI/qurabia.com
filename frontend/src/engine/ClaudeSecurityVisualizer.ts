/**
 * Claude Security Visualizer
 * نظام التصور الأمني بألوان Anthropic الرسمية
 *
 * يستخدم نظام ألوان Claude الرسمي لتصور التهديدات الأمنية:
 * - Copper (#CC785C) → التهديدات الحرجة Q5
 * - Amber (#D4A574) → التهديدات العالية Q4
 * - Light Amber → التهديدات المتوسطة Q3
 * - Pale Amber → التهديدات المنخفضة Q2
 * - Safe Green → الحالة الآمنة Q1
 * - Charcoal (#1A1715) → الخلفية
 */

import type { QuantumThreatTier } from './QuantumCyberShieldV2';

// ═══════════════════════════════════════════════════════════════
// نظام الألوان الرسمي من Anthropic
// ═══════════════════════════════════════════════════════════════

export interface ClaudeSecurityPalette {
  /** Copper - التهديدات الحرجة */
  critical: string;
  /** Amber - التهديدات العالية */
  high: string;
  /** Light Amber - التهديدات المتوسطة */
  medium: string;
  /** Pale Amber - التهديدات المنخفضة */
  low: string;
  /** Safe Green - الحالة الآمنة */
  safe: string;
  /** Charcoal - الخلفية */
  background: string;
  /** تدرجات النحاس */
  copperGradient: string;
  /** تدرجات العنبر */
  amberGradient: string;
}

export const CLAUDE_SECURITY_COLORS: ClaudeSecurityPalette = {
  critical: '#CC785C',      // Copper من Anthropic
  high: '#D4A574',          // Amber من Anthropic
  medium: '#E8C9A8',        // Light Amber
  low: '#F2E6D9',           // Pale Amber
  safe: '#8CC785',          // Safe Green
  background: '#1A1715',    // Charcoal من Anthropic
  copperGradient: 'linear-gradient(135deg, #CC785C 0%, #E89A7E 100%)',
  amberGradient: 'linear-gradient(135deg, #D4A574 0%, #F0CFA0 100%)',
};

// ═══════════════════════════════════════════════════════════════
// تعيين الألوان حسب مستوى التهديد
// ═══════════════════════════════════════════════════════════════

export function getClaudeThreatColor(tier: QuantumThreatTier): string {
  const colorMap: Record<QuantumThreatTier, string> = {
    Q5: CLAUDE_SECURITY_COLORS.critical,
    Q4: CLAUDE_SECURITY_COLORS.high,
    Q3: CLAUDE_SECURITY_COLORS.medium,
    Q2: CLAUDE_SECURITY_COLORS.low,
    Q1: CLAUDE_SECURITY_COLORS.safe,
  };
  return colorMap[tier];
}

export function getClaudeThreatGradient(tier: QuantumThreatTier): string {
  if (tier === 'Q5' || tier === 'Q4') {
    return CLAUDE_SECURITY_COLORS.copperGradient;
  }
  if (tier === 'Q3') {
    return CLAUDE_SECURITY_COLORS.amberGradient;
  }
  return `linear-gradient(135deg, ${getClaudeThreatColor(tier)} 0%, ${getClaudeThreatColor(tier)}88 100%)`;
}

// ═══════════════════════════════════════════════════════════════
// مكونات التصور البصري
// ═══════════════════════════════════════════════════════════════

export interface SecurityVisualization {
  /** معرف التصور */
  id: string;
  /** نوع التصور */
  type: 'gauge' | 'timeline' | 'heatmap' | 'network' | 'pulse';
  /** البيانات */
  data: unknown;
  /** نظام الألوان */
  palette: ClaudeSecurityPalette;
}

/**
 * عداد دائري بأسلوب Claude
 */
export interface ClaudeSecurityGauge {
  /** القيمة (0-100) */
  value: number;
  /** مستوى التهديد */
  tier: QuantumThreatTier;
  /** العنوان */
  label: string;
  /** العنوان بالعربية */
  labelAr: string;
  /** اللون الأساسي */
  color: string;
  /** التدرج */
  gradient: string;
}

export function createClaudeGauge(
  value: number,
  tier: QuantumThreatTier,
  label: string,
  labelAr: string
): ClaudeSecurityGauge {
  return {
    value: Math.min(100, Math.max(0, value)),
    tier,
    label,
    labelAr,
    color: getClaudeThreatColor(tier),
    gradient: getClaudeThreatGradient(tier),
  };
}

/**
 * خط زمني للتهديدات بأسلوب Claude
 */
export interface ClaudeThreatTimelineEvent {
  /** الطابع الزمني */
  timestamp: number;
  /** مستوى التهديد */
  tier: QuantumThreatTier;
  /** الوصف */
  description: string;
  /** اللون */
  color: string;
  /** الأيقونة */
  icon?: string;
}

export function createClaudeTimeline(
  events: Array<{ timestamp: number; tier: QuantumThreatTier; description: string }>
): ClaudeThreatTimelineEvent[] {
  return events.map((e) => ({
    ...e,
    color: getClaudeThreatColor(e.tier),
    icon: e.tier === 'Q5' ? '🔴' : e.tier === 'Q4' ? '🟠' : e.tier === 'Q3' ? '🟡' : e.tier === 'Q2' ? '🟢' : '🔵',
  }));
}

/**
 * خريطة حرارية للتهديدات بأسلوب Claude
 */
export interface ClaudeHeatmapCell {
  /** الإحداثي x */
  x: number;
  /** الإحداثي y */
  y: number;
  /** شدة التهديد (0-1) */
  intensity: number;
  /** مستوى التهديد */
  tier: QuantumThreatTier;
  /** اللون */
  color: string;
  /** قيمة العرض */
  displayValue: string;
}

export function createClaudeHeatmap(
  width: number,
  height: number,
  data: number[][]
): ClaudeHeatmapCell[][] {
  const result: ClaudeHeatmapCell[][] = [];

  for (let y = 0; y < height; y++) {
    const row: ClaudeHeatmapCell[] = [];
    for (let x = 0; x < width; x++) {
      const intensity = data[y]?.[x] ?? 0;
      const tier = intensityToTier(intensity);

      row.push({
        x,
        y,
        intensity,
        tier,
        color: getClaudeThreatColor(tier),
        displayValue: Math.round(intensity * 100).toString(),
      });
    }
    result.push(row);
  }

  return result;
}

function intensityToTier(intensity: number): QuantumThreatTier {
  if (intensity >= 0.9) return 'Q5';
  if (intensity >= 0.7) return 'Q4';
  if (intensity >= 0.5) return 'Q3';
  if (intensity >= 0.3) return 'Q2';
  return 'Q1';
}

/**
 * رسم شبكة التهديدات بأسلوب Claude
 */
export interface ClaudeNetworkNode {
  /** معرف العقدة */
  id: string;
  /** الاسم */
  name: string;
  /** مستوى التهديد */
  tier: QuantumThreatTier;
  /** اللون */
  color: string;
  /** الإحداثيات */
  x: number;
  y: number;
  /** الحجم */
  size: number;
}

export interface ClaudeNetworkEdge {
  /** العقدة المصدر */
  source: string;
  /** العقدة الهدف */
  target: string;
  /** قوة الاتصال */
  strength: number;
  /** اللون */
  color: string;
  /** نمط الخط */
  style: 'solid' | 'dashed' | 'dotted';
}

export function createClaudeNetwork(
  nodes: Array<{ id: string; name: string; tier: QuantumThreatTier }>,
  edges: Array<{ source: string; target: string; strength: number }>
): { nodes: ClaudeNetworkNode[]; edges: ClaudeNetworkEdge[] } {
  // توزيع العقد في دائرة
  const angleStep = (2 * Math.PI) / nodes.length;
  const radius = 40;

  const networkNodes: ClaudeNetworkNode[] = nodes.map((node, i) => ({
    ...node,
    color: getClaudeThreatColor(node.tier),
    x: 50 + radius * Math.cos(i * angleStep),
    y: 50 + radius * Math.sin(i * angleStep),
    size: node.tier === 'Q5' ? 12 : node.tier === 'Q4' ? 10 : node.tier === 'Q3' ? 8 : 6,
  }));

  const networkEdges: ClaudeNetworkEdge[] = edges.map((edge) => {
    const sourceNode = networkNodes.find((n) => n.id === edge.source);
    const tier = sourceNode?.tier ?? 'Q1';

    return {
      ...edge,
      color: `${getClaudeThreatColor(tier)}66`,
      style: edge.strength > 0.7 ? 'solid' : edge.strength > 0.4 ? 'dashed' : 'dotted',
    };
  });

  return { nodes: networkNodes, edges: networkEdges };
}

/**
 * نبضة تحذير بأسلوب Claude
 */
export interface ClaudePulseAnimation {
  /** مستوى التهديد */
  tier: QuantumThreatTier;
  /** اللون */
  color: string;
  /** التدرج */
  gradient: string;
  /** المدة (ms) */
  duration: number;
  /** التأخير (ms) */
  delay: number;
}

export function createClaudePulse(tier: QuantumThreatTier): ClaudePulseAnimation {
  const urgencyMap: Record<QuantumThreatTier, number> = {
    Q5: 500,   // نبض سريع جداً للتهديدات الحرجة
    Q4: 800,
    Q3: 1200,
    Q2: 2000,
    Q1: 3000,  // نبض بطيء للحالة الآمنة
  };

  return {
    tier,
    color: getClaudeThreatColor(tier),
    gradient: getClaudeThreatGradient(tier),
    duration: urgencyMap[tier],
    delay: 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// أدوات CSS لتوليد الأنماط
// ═══════════════════════════════════════════════════════════════

export function generateClaudeSecurityCSS(): string {
  return `
/* Claude Security Visualizer - Official Anthropic Colors */
:root {
  --claude-sec-critical: ${CLAUDE_SECURITY_COLORS.critical};
  --claude-sec-high: ${CLAUDE_SECURITY_COLORS.high};
  --claude-sec-medium: ${CLAUDE_SECURITY_COLORS.medium};
  --claude-sec-low: ${CLAUDE_SECURITY_COLORS.low};
  --claude-sec-safe: ${CLAUDE_SECURITY_COLORS.safe};
  --claude-sec-bg: ${CLAUDE_SECURITY_COLORS.background};
  --claude-sec-copper-gradient: ${CLAUDE_SECURITY_COLORS.copperGradient};
  --claude-sec-amber-gradient: ${CLAUDE_SECURITY_COLORS.amberGradient};
}

.claude-security-card {
  background: var(--claude-sec-bg);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.claude-security-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.claude-threat-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-ui, sans-serif);
}

.claude-threat-Q5 {
  background: var(--claude-sec-critical);
  color: white;
}

.claude-threat-Q4 {
  background: var(--claude-sec-high);
  color: white;
}

.claude-threat-Q3 {
  background: var(--claude-sec-medium);
  color: #1A1715;
}

.claude-threat-Q2 {
  background: var(--claude-sec-low);
  color: #1A1715;
}

.claude-threat-Q1 {
  background: var(--claude-sec-safe);
  color: white;
}

@keyframes claude-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.claude-pulse-critical {
  animation: claude-pulse 500ms ease-in-out infinite;
}

.claude-pulse-high {
  animation: claude-pulse 800ms ease-in-out infinite;
}

.claude-pulse-medium {
  animation: claude-pulse 1200ms ease-in-out infinite;
}
`;
}

/**
 * توليد أنماط SVG للتدرجات
 */
export function generateClaudeGradientDefs(): string {
  return `
<defs>
  <linearGradient id="claude-copper-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#CC785C;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#E89A7E;stop-opacity:1" />
  </linearGradient>

  <linearGradient id="claude-amber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#D4A574;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#F0CFA0;stop-opacity:1" />
  </linearGradient>

  <radialGradient id="claude-threat-glow">
    <stop offset="0%" style="stop-color:#CC785C;stop-opacity:0.8" />
    <stop offset="100%" style="stop-color:#CC785C;stop-opacity:0" />
  </radialGradient>
</defs>
`;
}
