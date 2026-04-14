import {
  Activity,
  AlertTriangle,
  BarChart2,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Download,
  FileJson,
  Info,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
/**
 * AIAnalyticsDashboard — لوحة التحليلات الذكية
 * QURABIA
 *
 * تعرض تحليلات ذكية شاملة لجميع نتائج المحاكاة
 * باستخدام رسوم بيانية ورؤى مولّدة بالذكاء الاصطناعي
 */
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type AIInsight,
  AIResultsAnalyzer,
  type AnalysisSummary,
  type InsightSeverity,
} from '../engine/AIResultsAnalyzer';
import { ModelExportService } from '../engine/ModelExportService';

// ─── ثوابت الألوان ─────────────────────────────────────────────
const SEVERITY_COLORS: Record<InsightSeverity, string> = {
  info: 'rgba(0,184,212,0.8)',
  success: 'rgba(0,229,168,0.8)',
  warning: 'rgba(255,183,77,0.8)',
  critical: 'rgba(255,82,82,0.8)',
};

const SEVERITY_BG: Record<InsightSeverity, string> = {
  info: 'rgba(0,184,212,0.08)',
  success: 'rgba(0,229,168,0.08)',
  warning: 'rgba(255,183,77,0.08)',
  critical: 'rgba(255,82,82,0.08)',
};

const SEVERITY_BORDER: Record<InsightSeverity, string> = {
  info: 'rgba(0,184,212,0.25)',
  success: 'rgba(0,229,168,0.25)',
  warning: 'rgba(255,183,77,0.25)',
  critical: 'rgba(255,82,82,0.25)',
};

const PIE_COLORS = ['#00b8d4', '#00e5a8', '#7c4dff', '#ffb74d', '#ff5252', '#69f0ae'];

const SEVERITY_ICONS: Record<InsightSeverity, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

// ─── مكوّن بطاقة الرؤية ────────────────────────────────────────
const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
  const Icon = SEVERITY_ICONS[insight.severity];
  return (
    <div
      className="ui-card"
      role="article"
      aria-label={insight.title}
      style={{
        padding: 12,
        borderRadius: 16,
        borderColor: SEVERITY_BORDER[insight.severity],
        background: SEVERITY_BG[insight.severity],
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          className="ui-icon-btn"
          aria-hidden="true"
          style={{
            borderColor: SEVERITY_BORDER[insight.severity],
            color: SEVERITY_COLORS[insight.severity],
            flexShrink: 0,
          }}
        >
          <Icon size={16} />
        </div>
        <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}
          >
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 13 }}>{insight.title}</div>
            {insight.value != null && (
              <span
                className="ui-chip"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: SEVERITY_BORDER[insight.severity],
                  color: SEVERITY_COLORS[insight.severity],
                }}
              >
                {insight.metric}: {insight.value}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, lineHeight: 1.8, color: 'var(--fg-2)' }}>
            {insight.description}
          </div>
          {insight.recommendation && (
            <div
              style={{
                fontFamily: 'var(--font-ar)',
                fontSize: 11,
                lineHeight: 1.7,
                color: 'var(--fg-3)',
                paddingTop: 4,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                marginTop: 4,
              }}
            >
              💡 {insight.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── مكوّن عداد الدائرة ─────────────────────────────────────────
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#00e5a8' : score >= 60 ? '#00b8d4' : score >= 40 ? '#ffb74d' : '#ff5252';

  return (
    <div style={{ display: 'grid', placeItems: 'center', position: 'relative', width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`النتيجة الشاملة: ${score}%`}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 900, color }}>{score}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-3)' }}>نقطة</div>
      </div>
    </div>
  );
};

// ─── دليل استخدام النموذج ───────────────────────────────────────
const ModelUsageGuide: React.FC = () => (
  <div
    className="ui-card"
    style={{
      padding: 14,
      borderRadius: 22,
      borderColor: 'rgba(0,184,212,0.22)',
      background: 'rgba(0,184,212,0.04)',
    }}
    role="region"
    aria-label="دليل استخدام النموذج المنزّل"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div
        className="ui-icon-btn"
        aria-hidden="true"
        style={{ borderColor: 'rgba(0,184,212,0.3)', color: 'rgba(0,184,212,0.9)' }}
      >
        <BookOpen size={18} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 13 }}>دليل استخدام النموذج</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
          QURABIA Analysis Model • كيفية الاستخدام
        </div>
      </div>
    </div>
    <ol
      style={{
        margin: 0,
        padding: '0 20px 0 0',
        display: 'grid',
        gap: 10,
        listStyle: 'none',
        counterReset: 'guide-steps',
      }}
      aria-label="خطوات الاستخدام"
    >
      {[
        {
          icon: <Download size={14} />,
          title: 'تنزيل النموذج',
          desc: 'اضغط "تنزيل نموذج التحليل الكامل" للحصول على ملف JSON يحتوي جميع البيانات.',
        },
        {
          icon: <Upload size={14} />,
          title: 'رفع الملف في أداة تحليل',
          desc: 'افتح الملف في Python / Jupyter / Excel أو أي أداة تحليل بيانات.',
        },
        {
          icon: <BarChart2 size={14} />,
          title: 'تحليل وإنتاج تقارير',
          desc: 'استخدم حقول simulation.recentRecords و analysis.insights لبناء تقارير مخصصة.',
        },
        {
          icon: <FileJson size={14} />,
          title: 'Schema الملف',
          desc: 'الملف يحتوي: metadata, simulation, analysis.insights, equations.',
        },
      ].map((step, i) => (
        <li key={step.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 24,
              height: 24,
              borderRadius: 8,
              background: 'rgba(0,184,212,0.15)',
              border: '1px solid rgba(0,184,212,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0,184,212,0.9)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {i + 1}
          </span>
          <div style={{ display: 'grid', gap: 2 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-ui)',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              <span aria-hidden="true" style={{ color: 'rgba(0,184,212,0.8)' }}>
                {step.icon}
              </span>
              {step.title}
            </div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 11, lineHeight: 1.7, color: 'var(--fg-3)' }}>
              {step.desc}
            </div>
          </div>
        </li>
      ))}
    </ol>
  </div>
);

// ─── المكوّن الرئيسي ────────────────────────────────────────────
const AIAnalyticsDashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportMenuOpen]);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await AIResultsAnalyzer.analyzeComprehensive();
      setAnalysis(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء التحليل');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    AIResultsAnalyzer.clearHistory();
    setAnalysis(null);
  }, []);

  /** تنزيل نموذج التحليل الكامل (QURABIA Analysis Model) */
  const handleDownloadFullModel = useCallback(async () => {
    setExportMenuOpen(false);
    setIsDownloadingModel(true);
    try {
      await ModelExportService.downloadFullModel(analysis);
    } finally {
      setIsDownloadingModel(false);
    }
  }, [analysis]);

  /** تنزيل نتائج التحليل الذكي فقط */
  const handleDownloadResultsOnly = useCallback(() => {
    if (!analysis) return;
    setExportMenuOpen(false);
    ModelExportService.downloadResultsOnly(analysis);
  }, [analysis]);

  // بيانات مخطط التوزيع
  const pieData = useMemo(() => {
    if (!analysis) return [];
    const stats = AIResultsAnalyzer.computeStats();
    return Object.entries(stats.typeDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analysis]);

  const historyCount = useMemo(() => AIResultsAnalyzer.getHistory().length, [analysis]);

  return (
    <div style={{ display: 'grid', gap: 14 }} role="region" aria-label="لوحة التحليلات الذكية">
      {/* ─── شريط العنوان والأدوات ─── */}
      <div className="ui-card" style={{ padding: 14, borderRadius: 22, borderColor: 'rgba(124,77,255,0.25)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="ui-icon-btn"
              aria-hidden="true"
              style={{ borderColor: 'rgba(124,77,255,0.30)', color: 'rgba(124,77,255,0.9)' }}
            >
              <BrainCircuit size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 15 }}>التحليل الذكي للنتائج</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                AI-Powered Results Analytics • {historyCount} سجل
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ui-btn ui-btn-filled"
              onClick={runAnalysis}
              disabled={loading}
              aria-label="تشغيل التحليل الذكي"
            >
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
              {loading ? 'جارٍ التحليل…' : 'تحليل ذكي'}
            </button>
            {/* ─── قائمة التنزيل المنسدلة ─── */}
            <div ref={exportMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="ui-btn ui-btn-outlined"
                onClick={() => setExportMenuOpen((v) => !v)}
                disabled={isDownloadingModel}
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                aria-label="خيارات التنزيل"
              >
                {isDownloadingModel ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={16} />
                )}
                تنزيل
                <ChevronDown
                  size={14}
                  style={{ transition: 'transform 200ms', transform: exportMenuOpen ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {exportMenuOpen && (
                <div
                  role="menu"
                  aria-label="خيارات التنزيل"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    insetInlineEnd: 0,
                    minWidth: 240,
                    background: 'var(--surface)',
                    border: '1px solid var(--outline)',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                    zIndex: 100,
                    overflow: 'hidden',
                    padding: 6,
                    display: 'grid',
                    gap: 2,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="ui-btn ui-btn-ghost"
                    style={{ justifyContent: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10 }}
                    onClick={handleDownloadFullModel}
                    aria-label="تنزيل نموذج التحليل الكامل"
                  >
                    <FileJson size={16} style={{ color: 'rgba(0,184,212,0.9)', flexShrink: 0 }} />
                    <div style={{ display: 'grid', gap: 2, textAlign: 'start' }}>
                      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 12 }}>
                        نموذج التحليل الكامل
                      </span>
                      <span
                        style={{ fontFamily: 'var(--font-ar)', fontSize: 10, color: 'var(--fg-3)', lineHeight: 1.5 }}
                      >
                        JSON شامل: محاكاة + رؤى + معادلات
                      </span>
                    </div>
                  </button>
                  {analysis && (
                    <button
                      type="button"
                      role="menuitem"
                      className="ui-btn ui-btn-ghost"
                      style={{ justifyContent: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10 }}
                      onClick={handleDownloadResultsOnly}
                      aria-label="تنزيل نتائج التحليل الذكي فقط"
                    >
                      <BarChart2 size={16} style={{ color: 'rgba(0,229,168,0.9)', flexShrink: 0 }} />
                      <div style={{ display: 'grid', gap: 2, textAlign: 'start' }}>
                        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 12 }}>
                          نتائج التحليل الذكي
                        </span>
                        <span
                          style={{ fontFamily: 'var(--font-ar)', fontSize: 10, color: 'var(--fg-3)', lineHeight: 1.5 }}
                        >
                          النتائج الحالية فقط
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
            {analysis && (
              <button type="button" className="ui-btn ui-btn-outlined" onClick={handleClear} aria-label="مسح السجل">
                <Trash2 size={16} />
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="ui-card" style={{ padding: 12, borderRadius: 16, borderColor: 'rgba(255,82,82,0.30)' }}>
          <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--q-danger, var(--p-error))' }}>
            {error}
          </div>
        </div>
      )}

      {/* ─── حالة عدم وجود بيانات ─── */}
      {!analysis && !loading && (
        <div className="ui-card" style={{ padding: 24, borderRadius: 22, textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 16 }}>
            <div
              className="ui-icon-btn"
              aria-hidden="true"
              style={{ width: 56, height: 56, borderColor: 'rgba(124,77,255,0.20)', color: 'rgba(124,77,255,0.6)' }}
            >
              <BrainCircuit size={28} />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 14 }}>
                اضغط &ldquo;تحليل ذكي&rdquo; لبدء تحليل نتائجك
              </div>
              <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.7 }}>
                سيقوم الذكاء الاصطناعي بتحليل جميع محاكاتك السابقة وتقديم رؤى وتوصيات ذكية
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── نتائج التحليل ─── */}
      {analysis && (
        <>
          {/* بطاقات KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div
              className="ui-card"
              style={{ padding: 16, borderRadius: 18, display: 'grid', placeItems: 'center', gap: 8 }}
            >
              <ScoreGauge score={analysis.overallScore} />
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 12 }}>التقييم الشامل</div>
            </div>

            <div className="ui-card" style={{ padding: 16, borderRadius: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ui-icon-btn" aria-hidden="true" style={{ color: 'var(--q-success)' }}>
                  <TrendingUp size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
                    إجمالي المحاكاات
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 900 }}>
                    {analysis.totalSimulations}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ui-icon-btn" aria-hidden="true" style={{ color: 'var(--p-primary)' }}>
                  <Target size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>متوسط الطاقة</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900 }}>
                    {analysis.avgEnergy.toFixed(4)} Ha
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ui-icon-btn" aria-hidden="true" style={{ color: 'var(--p-secondary)' }}>
                  <Activity size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>متوسط الدقة</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900 }}>
                    {(analysis.avgFidelity * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* مخطط التوزيع */}
            {pieData.length > 0 && (
              <div className="ui-card" style={{ padding: 16, borderRadius: 18 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                  توزيع أنواع المحاكاة
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(10,12,18,0.9)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {pieData.map((entry, index) => (
                    <div
                      key={entry.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--fg-3)',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* مخطط الاتجاه */}
          {analysis.trends.length >= 2 && (
            <div className="ui-card" style={{ padding: 14, borderRadius: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="ui-icon-btn" aria-hidden="true">
                  <TrendingUp size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 13 }}>اتجاه الأداء</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                    Performance Trend
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                <div style={{ height: 200 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginBottom: 6 }}>
                    الطاقة (Ha)
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.trends}>
                      <defs>
                        <linearGradient id="colorTrendEnergy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--q-primary, #00b8d4)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--q-primary, #00b8d4)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="rgba(255,255,255,0.25)"
                        fontSize={9}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis stroke="rgba(255,255,255,0.25)" fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(10,12,18,0.9)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="energy"
                        stroke="var(--q-primary, #00b8d4)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTrendEnergy)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ height: 200 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginBottom: 6 }}>
                    الدقة (Fidelity)
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="rgba(255,255,255,0.25)"
                        fontSize={9}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.25)"
                        fontSize={9}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 1]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(10,12,18,0.9)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                        }}
                      />
                      <Bar dataKey="fidelity" fill="rgba(0,229,168,0.6)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* السرد الذكي */}
          <div className="ui-card" style={{ padding: 14, borderRadius: 22, borderColor: 'rgba(124,77,255,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="ui-icon-btn" aria-hidden="true" style={{ borderColor: 'rgba(124,77,255,0.28)' }}>
                <BrainCircuit size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>التحليل الذكي</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                  {analysis.provider}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, lineHeight: 2, color: 'var(--fg-2)' }}>
              {analysis.aiNarrative}
            </div>
          </div>

          {/* الرؤى التفصيلية */}
          {analysis.insights.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 13 }}>الرؤى والتوصيات</div>
                <span className="ui-badge">{analysis.insights.length}</span>
              </div>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                {analysis.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── دليل استخدام النموذج (يُعرض دائماً) ─── */}
      <ModelUsageGuide />
    </div>
  );
};

export default AIAnalyticsDashboard;
