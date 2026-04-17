import { Activity, Cpu, Dna, Shield, Sparkles, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import EnhancedMetricsCard from './EnhancedMetricsCard';

// بيانات Sparkline محاكاة للعرض
const generateSparklineData = (baseValue: number, count: number = 20) => {
  return Array.from({ length: count }, (_, i) => ({
    value: baseValue * (0.9 + Math.random() * 0.2),
    timestamp: Date.now() - (count - i) * 60000,
  }));
};

export const SovereignDashboard: React.FC = React.memo(() => {
  const sparklineData = useMemo(() => ({
    quantum: generateSparklineData(1.43e17, 24),
    stability: generateSparklineData(2.5, 24),
    security: generateSparklineData(512, 24),
    medical: generateSparklineData(99.8, 24),
  }), []);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      role="list"
      aria-label="المؤشرات السيادية الرئيسية"
    >
      <EnhancedMetricsCard
        title="عامل التفوق الكمومي"
        value="1.43×10¹⁷"
        subtitle="Quantum Supremacy Factor"
        icon={Zap}
        color="#00b8d4"
        trend="up"
        trendValue="+12.3%"
        sparklineData={sparklineData.quantum.map(d => ({ ...d, value: d.value / 1e15 }))}
      />

      <EnhancedMetricsCard
        title="الاستقرار الطوبولوجي"
        value={2.5}
        unit="ms"
        subtitle="Topological Coherence"
        icon={Activity}
        color="#10b981"
        trend="neutral"
        trendValue="+0.2%"
        sparklineData={sparklineData.stability}
      />

      <EnhancedMetricsCard
        title="الأمن السيادي (PQC)"
        value="CRYSTALS"
        subtitle="Post-Quantum Crypto"
        icon={Shield}
        color="#f59e0b"
        trend="up"
        trendValue="+5.1%"
        sparklineData={sparklineData.security}
      />

      <EnhancedMetricsCard
        title="الثورة الطبية (QSVM)"
        value={99.8}
        unit="%"
        subtitle="Medical AI Accuracy"
        icon={Dna}
        color="#a855f7"
        trend="up"
        trendValue="+0.4%"
        sparklineData={sparklineData.medical}
      />
    </div>
  );
});

SovereignDashboard.displayName = 'SovereignDashboard';

export default SovereignDashboard;
