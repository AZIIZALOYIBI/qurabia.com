/**
 * ThreatAnalyzerDashboard — لوحة تحليل التهديدات باستخدام معادلة العتيبي
 *
 * ابتكار غير مسبوق: استخدام معادلة كونية لتحليل التهديدات السيبرانية
 *
 * المميزات:
 * - تحليل فوري للتهديدات باستخدام معادلة العتيبي
 * - تصورات بيانية حية ومتقدمة
 * - مؤشرات كمومية للمخاطر (eV)
 * - توصيات ذكية للاستجابة
 */

import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Zap,
  XCircle,
  AlertCircle,
  Skull,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  AlUtaibiCyberThreatAnalyzer,
  type CyberThreat,
  type ThreatAnalysisResult,
  type ThreatCategory,
} from '../engine/AlUtaibiCyberThreatAnalyzer';

const THREAT_ICONS: Record<ThreatCategory, React.ElementType> = {
  malware: Shield,
  phishing: AlertTriangle,
  ransomware: Skull,
  ddos: Activity,
  injection: Zap,
  mitm: AlertCircle,
  'zero-day': AlertCircle,
  apt: Skull,
  insider: XCircle,
};

const THREAT_COLORS: Record<string, string> = {
  existential: '#8B0000',
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

const THREAT_LABELS_AR: Record<ThreatCategory, string> = {
  malware: 'برمجيات ضارة',
  phishing: 'تصيد احتيالي',
  ransomware: 'فدية',
  ddos: 'حرمان من الخدمة',
  injection: 'حقن',
  mitm: 'رجل في الوسط',
  'zero-day': 'ثغرة يوم الصفر',
  apt: 'تهديد متقدم مستمر',
  insider: 'تهديد داخلي',
};

const LEVEL_LABELS_AR = {
  existential: 'وجودي',
  critical: 'حرج',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
};

const ACTION_LABELS_AR = {
  monitor: 'مراقبة',
  alert: 'تنبيه',
  block: 'حظر',
  isolate: 'عزل',
  shutdown: 'إيقاف فوري',
};

const ThreatAnalyzerDashboard: React.FC = () => {
  const analyzer = useMemo(() => new AlUtaibiCyberThreatAnalyzer(), []);
  const [threats, setThreats] = useState<CyberThreat[]>([]);
  const [results, setResults] = useState<ThreatAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // إنشاء تهديدات عشوائية للتجربة
  const generateRandomThreats = useCallback(() => {
    const categories: ThreatCategory[] = [
      'malware',
      'phishing',
      'ransomware',
      'ddos',
      'injection',
      'mitm',
      'zero-day',
      'apt',
      'insider',
    ];

    const newThreats: CyberThreat[] = Array.from({ length: 5 }, (_, i) => ({
      id: `threat-${Date.now()}-${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      targetPort: [22, 80, 443, 3306, 445, 21][Math.floor(Math.random() * 6)],
      timestamp: Date.now(),
      severity: Math.random(),
      velocity: Math.random(),
      sophistication: Math.random(),
      persistence: Math.random(),
    }));

    setThreats(newThreats);
  }, []);

  // تحليل التهديدات
  const analyzeThreats = useCallback(() => {
    if (threats.length === 0) {
      generateRandomThreats();
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const analyzed = analyzer.analyzeThreats(threats);
      setResults(analyzed);
      setIsAnalyzing(false);
    }, 500); // تأخير بسيط للتأثير البصري
  }, [threats, analyzer, generateRandomThreats]);

  // ملخص إحصائي
  const summary = useMemo(() => {
    if (results.length === 0) return null;
    return analyzer.getThreatSummary(results);
  }, [results, analyzer]);

  // تنزيل التقرير
  const downloadReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: 'QURABIA Cyber Defense — Al-Utaibi Threat Analyzer',
      summary,
      threats: results.map((r) => ({
        id: r.threat.id,
        category: r.threat.category,
        sourceIP: r.threat.sourceIP,
        level: r.threatLevel,
        score: r.threatScore,
        quantumRisk_eV: r.quantumRisk,
        recommendedAction: r.recommendedAction,
        confidence: r.confidence,
        alUtaibiParameters: {
          r_param: r.r_param,
          rho_dm: r.rho_dm,
          rho_de: r.rho_de,
          Q_coherence: r.Q_coherence,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qurabia-threat-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, summary]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* العنوان */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            margin: '0 0 8px',
            color: 'var(--fg)',
          }}
        >
          محلل التهديدات السيبرانية — معادلة العتيبي
        </h1>
        <p style={{ fontFamily: 'var(--font-ar)', fontSize: 14, color: 'var(--fg-3)', margin: 0 }}>
          تحليل كمومي للتهديدات باستخدام المعادلة الكونية الموحدة — ابتكار غير مسبوق
        </p>
      </div>

      {/* أزرار التحكم */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="claude-btn-primary"
          onClick={generateRandomThreats}
          disabled={isAnalyzing}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={16} />
          <span>توليد تهديدات جديدة</span>
        </button>
        <button
          type="button"
          className="claude-btn-primary"
          onClick={analyzeThreats}
          disabled={isAnalyzing || threats.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--p-secondary)' }}
        >
          {isAnalyzing ? (
            <>
              <Activity size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>جاري التحليل...</span>
            </>
          ) : (
            <>
              <Zap size={16} />
              <span>تحليل بمعادلة العتيبي</span>
            </>
          )}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            className="claude-btn-secondary"
            onClick={downloadReport}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download size={16} />
            <span>تحميل التقرير</span>
          </button>
        )}
      </div>

      {/* الملخص الإحصائي */}
      {summary && (
        <div
          className="claude-card"
          style={{
            padding: 24,
            marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(232, 130, 90, 0.08), rgba(191, 155, 110, 0.08))',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
            الملخص الإحصائي
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>إجمالي التهديدات</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--p-primary)' }}>{summary.total}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>متوسط الخطورة</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--p-secondary)' }}>
                {summary.avgScore.toFixed(1)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>أقصى خطورة</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626' }}>{summary.maxScore.toFixed(1)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>تهديدات حرجة</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#8B0000' }}>{summary.criticalThreats.length}</div>
            </div>
          </div>

          {/* توزيع حسب المستوى */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 8 }}>التوزيع حسب المستوى:</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(summary.byLevel).map(([level, count]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: THREAT_COLORS[level],
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                    {LEVEL_LABELS_AR[level as keyof typeof LEVEL_LABELS_AR]}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* قائمة التهديدات المحللة */}
      {results.length > 0 && (
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              margin: '0 0 16px',
              color: 'var(--fg)',
            }}
          >
            التهديدات المحللة ({results.length})
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {results.map((result) => {
              const Icon = THREAT_ICONS[result.threat.category];
              const color = THREAT_COLORS[result.threatLevel];

              return (
                <div
                  key={result.threat.id}
                  className="claude-card"
                  style={{
                    padding: 20,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    {/* معلومات التهديد */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Icon size={20} style={{ color }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>
                          {THREAT_LABELS_AR[result.threat.category]}
                        </h3>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: `${color}22`,
                            color,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {LEVEL_LABELS_AR[result.threatLevel]}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 2 }}>مصدر IP</div>
                          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>
                            {result.threat.sourceIP}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 2 }}>منفذ الهدف</div>
                          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>
                            {result.threat.targetPort}
                          </div>
                        </div>
                      </div>

                      {/* المعاملات الكمومية */}
                      <div
                        style={{
                          background: 'var(--surface)',
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, fontWeight: 700 }}>
                          معاملات معادلة العتيبي:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11 }}>
                          <div>
                            <span style={{ color: 'var(--fg-3)' }}>r (مسافة كمومية):</span>{' '}
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--p-secondary)' }}>
                              {result.r_param.toExponential(2)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--fg-3)' }}>ρ_dm (مادة مظلمة):</span>{' '}
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--p-secondary)' }}>
                              {result.rho_dm.toExponential(2)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--fg-3)' }}>ρ_de (طاقة مظلمة):</span>{' '}
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--p-secondary)' }}>
                              {result.rho_de.toExponential(2)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--fg-3)' }}>Q (تماسك):</span>{' '}
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--p-secondary)' }}>
                              {result.Q_coherence.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* الإجراء الموصى به */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={14} style={{ color: 'var(--p-primary)' }} />
                        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>الإجراء الموصى به:</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--p-primary)',
                          }}
                        >
                          {ACTION_LABELS_AR[result.recommendedAction]}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--fg-3)', marginRight: 'auto' }}>
                          ثقة: {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* درجة التهديد */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>درجة التهديد</div>
                      <div
                        style={{
                          fontSize: 36,
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono)',
                          color,
                          lineHeight: 1,
                        }}
                      >
                        {result.threatScore.toFixed(0)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--fg-3)' }}>من 100</div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          color: 'var(--fg-3)',
                        }}
                      >
                        مخاطر كمومية
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--p-tertiary)',
                        }}
                      >
                        {result.quantumRisk.toExponential(2)} eV
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* رسالة فارغة */}
      {results.length === 0 && (
        <div className="claude-card" style={{ padding: 48, textAlign: 'center' }}>
          <Shield size={48} style={{ color: 'var(--fg-3)', marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: 'var(--fg-3)', margin: 0 }}>
            لا توجد تهديدات للتحليل. انقر على "توليد تهديدات جديدة" للبدء.
          </p>
        </div>
      )}

      {/* CSS للتحريكات */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ThreatAnalyzerDashboard;
