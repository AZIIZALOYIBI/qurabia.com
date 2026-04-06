/**
 * UnifiedQuantumPlatform — الدمج الشامل للوحة التحكم الكمومية ومنصة الاستراتيجي
 *
 * يجمع بين:
 * - لوحة التحكم الكمومية (DashboardV5): المحاكاة، Bloch Sphere، Innovation Lab
 * - منصة الاستراتيجي (StrategicPlatform): المعادلات، Grover، التشفير، QNN، Drug Discovery
 *
 * التصميم: واجهة موحدة بتبويبات ذكية + شريط مؤشرات حية + كل الأزرار تعمل
 */
import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useQuantumState, SystemStatus } from '../hooks/useQuantumState';
import { SimulationFactory, SimulationType } from '../engine/SimulationFactory';
import { TaskOrchestrator } from '../engine/TaskOrchestrator';
import { GeminiService } from '../engine/GeminiService';
import { GrokService } from '../engine/GrokService';
import { AIResultsAnalyzer } from '../engine/AIResultsAnalyzer';
import ProblemConfig from './ProblemConfig';
import ResultsDisplay from './ResultsDisplay';
import BlackbodyTab from './BlackbodyTab';
import SovereignDashboard from './SovereignDashboard';
import {
  Cpu, Zap, Activity, LogOut, LayoutGrid, Share2, Shield, Clock,
  BrainCircuit, Palette, Sun, Moon, Download, Trash2, ThumbsUp, ThumbsDown,
  Atom, Terminal, FlaskConical, Layers, ChevronLeft, ChevronRight,
  Search, Home, ClipboardList,
} from 'lucide-react';

import { InnovationTester } from '../utils/InnovationTester';
import NeuroCustomization, { ThemePreset } from './NeuroCustomization';
import CommandPalette, { useCommandPalette, buildPlatformCommands } from './CommandPalette';
import MobileBottomNav from './MobileBottomNav';

// --- Lazy-load للمكونات الثقيلة ---
const InteractiveBlochSphere = React.lazy(() => import('../visualizers/InteractiveBlochSphere'));
const QuantumNeuralOverlay = React.lazy(() => import('./QuantumNeuralOverlay'));
import ThreeErrorBoundary from './ThreeErrorBoundary';

// --- الوحدات الاستراتيجية ---
const AlOtaibiPlanckModule = React.lazy(() => import('./AlOtaibiPlanckModule'));
const AlUtaibiV2Module = React.lazy(() => import('./AlUtaibiV2Module'));
const QuantumCryptoModule = React.lazy(() => import('./QuantumCryptoModule'));
const GroverSearchModule = React.lazy(() => import('./GroverSearchModule'));
const TopologicalQECVisualizer = React.lazy(() => import('./TopologicalQECVisualizer'));
const QuantumNeuralNetworkModule = React.lazy(() => import('./QuantumNeuralNetworkModule'));
const QuantumDrugDiscovery = React.lazy(() => import('./QuantumDrugDiscovery'));
const VirtualLogsTerminal = React.lazy(() => import('./VirtualLogsTerminal'));
const AIAnalyticsDashboard = React.lazy(() => import('./AIAnalyticsDashboard'));

// --- المكونات الجديدة: مصمّم الدوائر الكمية والدستور الأخلاقي ---
const QuantumCircuitDesigner = React.lazy(() => import('./QuantumCircuitDesigner'));
const EthicsConstitutionVisualizer = React.lazy(() => import('./EthicsConstitutionVisualizer'));

// --- محركات ما بعد الكمومي وتضخيم السعة (مستوحى من Kyber/McEliece/PennyLane/Qiskit) ---
const PostQuantumCryptoModule = React.lazy(() => import('./PostQuantumCryptoModule'));
const AmplitudeAmplificationModule = React.lazy(() => import('./AmplitudeAmplificationModule'));

// --- المكونات الاستراتيجية الجديدة ---
const QuantumAuditLog = React.lazy(() => import('./QuantumAuditLog'));
const QuantumClassicalComparison = React.lazy(() => import('./QuantumClassicalComparison'));

// QuantumAlertPanel — استيراد مباشر (يحتوي hook نستخدمه)
import QuantumAlertPanelModule, { useQuantumAlerts } from './QuantumAlertPanel';
const QuantumAlertPanel = QuantumAlertPanelModule;

/** Bloch sphere default angles */
const BLOCH_DEFAULT_THETA = 1.1;
const BLOCH_DEFAULT_PHI = 0.4;

type LearningSummary = {
  total_events: number;
  top: Array<{
    signature: string;
    count: number;
    last_seen: number;
    kind: string;
    message: string;
    url: string;
    release: string;
  }>;
  suggestions: string[];
};

type PlatformTab = 'overview' | 'strategic' | 'simulation' | 'analytics' | 'terminal' | 'audit';

const TAB_CONFIG: { id: PlatformTab; label: string; icon: React.ElementType; ariaLabel: string }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Layers, ariaLabel: 'نظرة عامة على النظام' },
  { id: 'strategic', label: 'المحركات الكمومية', icon: Atom, ariaLabel: 'المحركات الاستراتيجية الكمومية' },
  { id: 'simulation', label: 'مختبر المحاكاة', icon: FlaskConical, ariaLabel: 'مختبر المحاكاة والاختبار' },
  { id: 'analytics', label: 'التحليل الذكي', icon: BrainCircuit, ariaLabel: 'التحليل الذكي للنتائج' },
  { id: 'audit', label: 'السجل', icon: ClipboardList, ariaLabel: 'سجل التدقيق والمراقبة' },
  { id: 'terminal', label: 'الطرفية', icon: Terminal, ariaLabel: 'الطرفية الافتراضية' },
];

const LoadingFallback = () => (
  <div className="uqp-loading" role="status">
    <div className="uqp-loading-spinner" aria-hidden="true" />
    <span>جاري التحميل...</span>
  </div>
);

const UnifiedQuantumPlatform: React.FC<{ onBackToLanding?: () => void }> = ({ onBackToLanding }) => {
  const {
    status, progress, lastResult,
    setStatus, updateProgress, setLastResult,
  } = useQuantumState();

  // ─── نظام التنبيهات ───
  const { alerts, dismissAlert, clearAlerts } = useQuantumAlerts();

  const [activeTab, setActiveTab] = useState<PlatformTab>('overview');
  const [simType, setSimType] = useState<SimulationType>('PHYSICS');
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; provider: string }>({ text: '', provider: '' });
  const [innovationResults, setInnovationResults] = useState<{
    qrp: { x: number; y: number }[];
    edc: { ratio: number; success: boolean };
    qage: { genes: number[]; fitness: number; qubitState: { theta: number; phi: number } };
  } | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('qurabia.themePreset');
    if (saved === 'QUANTUM_CYAN' || saved === 'NEURAL_VIOLET' || saved === 'SOLAR_GOLD' || saved === 'VOID_EMERALD') return saved;
    return 'QUANTUM_CYAN';
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showVisualEngine, setShowVisualEngine] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState<'up' | 'down' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem('qurabia.onboarded') !== '1'; } catch { return true; }
  });
  const [uiTheme, setUiTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('qurabia.uiTheme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
  });
  const [abVariant] = useState<'A' | 'B'>(() => {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('ab');
    if (fromQuery === 'A' || fromQuery === 'B') {
      localStorage.setItem('qurabia.abVariant', fromQuery);
      return fromQuery;
    }
    const saved = localStorage.getItem('qurabia.abVariant');
    if (saved === 'A' || saved === 'B') return saved;
    const v = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem('qurabia.abVariant', v);
    return v;
  });
  const [params, setParams] = useState({
    frequency: 5.45e14,
    waveFunctionReal: 0.707,
    waveFunctionImag: 0.707,
    sphericalHarmonic: 1.0,
    fineTuning: 1.0,
    iterations: 60,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [learningSummary, setLearningSummary] = useState<LearningSummary | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<'UNKNOWN' | 'OK' | 'DOWN'>('UNKNOWN');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const apiBase = useMemo(() => {
    const normalize = (value: string) => value.trim().replace(/\/+$/, '');
    try {
      const override = localStorage.getItem('qurabia.apiBase') || '';
      if (override) return normalize(override);
    } catch { /* ignore */ }
    const fromEnv = normalize(import.meta.env.VITE_API_BASE_URL || '');
    if (fromEnv) return fromEnv;
    if (!import.meta.env.DEV) return normalize(window.location.origin);
    return normalize('https://api.qurabia.com');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const healthCheckTimeout = window.setTimeout(() => controller.abort(), 3500);
    (async () => {
      try {
        if (!apiBase) { if (mounted) setApiHealth('DOWN'); return; }
        const resp = await fetch(`${apiBase}/health`, { method: 'GET', signal: controller.signal });
        if (mounted) setApiHealth(resp.ok ? 'OK' : 'DOWN');
      } catch { if (mounted) setApiHealth('DOWN'); }
      finally { window.clearTimeout(healthCheckTimeout); }
    })();
    return () => { mounted = false; window.clearTimeout(healthCheckTimeout); controller.abort(); };
  }, [apiBase]);

  const loadLearningSummary = useCallback(async () => {
    setLearningLoading(true);
    setLearningError(null);
    try {
      if (!apiBase) throw new Error('عنوان الـAPI غير مهيّأ.');
      const resp = await fetch(`${apiBase}/api/learning/summary?top=6`, { method: 'GET' });
      if (!resp.ok) { const t = await resp.text(); throw new Error(t || `HTTP ${resp.status}`); }
      const json = (await resp.json()) as LearningSummary;
      setLearningSummary(json);
    } catch (e: unknown) {
      setLearningSummary(null);
      setLearningError(e instanceof Error ? e.message : 'تعذر تحميل ملخص التعلم');
    } finally { setLearningLoading(false); }
  }, [apiBase]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme);
    localStorage.setItem('qurabia.uiTheme', uiTheme);
  }, [uiTheme]);

  // تحميل ملخص التعلم تلقائياً عند التحميل الأول وتحديثه كل 60 ثانية
  useEffect(() => {
    if (!apiBase) return;
    void loadLearningSummary();
    const interval = window.setInterval(() => { void loadLearningSummary(); }, 60_000);
    return () => window.clearInterval(interval);
  }, [apiBase, loadLearningSummary]);

  useEffect(() => {
    localStorage.setItem('qurabia.themePreset', currentTheme);
    const accent =
      currentTheme === 'QUANTUM_CYAN' ? 'cyan'
        : currentTheme === 'NEURAL_VIOLET' ? 'violet'
          : currentTheme === 'SOLAR_GOLD' ? 'amber' : 'emerald';
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('qurabia.uiAccent', accent);
  }, [currentTheme]);

  useEffect(() => { document.documentElement.setAttribute('data-variant', abVariant); }, [abVariant]);

  const trackEvent = useCallback((name: string, payload: Record<string, unknown> = {}) => {
    const entry = { t: Date.now(), name, variant: abVariant, theme: uiTheme, payload };
    const key = 'qurabia.analytics';
    const currentRaw = localStorage.getItem(key);
    let current: unknown[] = [];
    try { const parsed = currentRaw ? JSON.parse(currentRaw) : []; current = Array.isArray(parsed) ? parsed : []; } catch { /* ignore */ }
    const next = [...current, entry];
    localStorage.setItem(key, JSON.stringify(next.slice(-500)));
  }, [abVariant, uiTheme]);

  useEffect(() => { trackEvent('page_view', { path: window.location.pathname }); }, [trackEvent]);
  useEffect(() => { trackEvent('ab_assigned', { variant: abVariant }); }, [trackEvent, abVariant]);

  const handleRunSimulation = useCallback(async () => {
    trackEvent('run_simulation', { simType });
    setStatus('QUANTUM_INIT');
    updateProgress(10);
    setAiAnalysis({ text: '', provider: '' });

    await TaskOrchestrator.scheduleTask({
      type: 'SIMULATION_BOOT', priority: 'HIGH', payload: { simType },
    });

    const phases = [
      { s: 'CALIBRATION', p: 30, t: 800 },
      { s: 'PROCESSING', p: 60, t: 1200 },
      { s: 'PROCESSING', p: 90, t: 1000 },
    ];
    for (const phase of phases) {
      await new Promise(r => setTimeout(r, phase.t));
      setStatus(phase.s as SystemStatus);
      updateProgress(phase.p);
    }

    try {
      const result = await SimulationFactory.run(simType, params);
      setLastResult(result);

      // تسجيل النتيجة في محرك التحليل الذكي
      AIResultsAnalyzer.recordSimulation({
        type: simType,
        energy: result.energy,
        fidelity: result.fidelity,
        data: result.data,
        timestamp: result.timestamp,
      });

      let analysisText = '';
      let provider = 'xAI Grok';
      try {
        analysisText = await GrokService.analyzeSimulation(result);
      } catch {
        provider = 'Gemini AI';
        analysisText = await GeminiService.analyzeSimulation(result);
      }
      setAiAnalysis({ text: analysisText, provider });
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  }, [simType, params, setStatus, updateProgress, setLastResult, trackEvent]);

  // لوحة الأوامر
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const cmdItems = useMemo(
    () => buildPlatformCommands(setActiveTab as (tab: string) => void, onBackToLanding),
    [setActiveTab, onBackToLanding]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVisualEngine) setShowVisualEngine(false);
      if (e.key === 'Escape' && showOnboarding) setShowOnboarding(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleRunSimulation();
      // اختصارات التبويبات: Alt + 1-5
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const tabMap: Record<string, PlatformTab> = { '1': 'overview', '2': 'strategic', '3': 'simulation', '4': 'analytics', '5': 'audit', '6': 'terminal' };
        const tab = tabMap[e.key];
        if (tab) { e.preventDefault(); setActiveTab(tab); trackEvent('tab_shortcut', { tab }); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRunSimulation, showOnboarding, showVisualEngine, trackEvent]);

  useEffect(() => {
    if (status === 'COMPLETED') { setShowSurvey(true); setSurveySubmitted(null); }
  }, [status]);

  const runDisabled = status !== 'IDLE' && status !== 'COMPLETED';

  const openVisualEngine = useCallback(() => { trackEvent('open_visual_engine'); setShowVisualEngine(true); }, [trackEvent]);

  const downloadAnalytics = useCallback(() => {
    trackEvent('download_analytics');
    const raw = localStorage.getItem('qurabia.analytics') || '[]';
    const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qurabia-analytics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [trackEvent]);

  const clearAnalytics = useCallback(() => {
    localStorage.removeItem('qurabia.analytics');
    trackEvent('clear_analytics');
  }, [trackEvent]);

  const handleRunInnovation = useCallback(() => {
    setStatus('PROCESSING');
    updateProgress(50);
    setTimeout(() => {
      try {
        const results = InnovationTester.runFullSuite();
        setInnovationResults(results);
        setStatus('COMPLETED');
        updateProgress(100);
      } catch (err) {
        console.error('Innovation Lab error:', err);
        setStatus('IDLE');
        updateProgress(0);
      }
    }, 1500);
  }, [setStatus, updateProgress]);

  // --- Modal refs ---
  const onboardingCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const onboardingContainerRef = useRef<HTMLDivElement | null>(null);
  const onboardingLastActiveRef = useRef<HTMLElement | null>(null);
  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showOnboarding) return;
    onboardingLastActiveRef.current = document.activeElement as HTMLElement | null;
    onboardingCloseBtnRef.current?.focus();
    return () => { onboardingLastActiveRef.current?.focus?.(); };
  }, [showOnboarding]);

  useEffect(() => {
    if (!showVisualEngine) return;
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    modalCloseBtnRef.current?.focus();
    return () => { lastActiveElementRef.current?.focus?.(); };
  }, [showVisualEngine]);

  useEffect(() => {
    if (!showVisualEngine) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root = modalContainerRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showVisualEngine]);

  // =================================================================
  //  RENDER
  // =================================================================
  return (
    <div className="uqp-shell" aria-label="عرب qu — المنصة الكمومية الموحدة">
      <a className="skip-link" href="#uqp-main">تخطي إلى المحتوى</a>

      {/* ─── لوحة الأوامر ──────────────────────────────── */}
      <CommandPalette items={cmdItems} open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* ─── التنقل السفلي للجوال ──────────────────────── */}
      <MobileBottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab as PlatformTab); trackEvent('mobile_tab', { tab }); }} />

      {/* ─── TOP BAR ──────────────────────────────────── */}
      <header className="uqp-topbar" role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBackToLanding && (
            <button
              className="ui-icon-btn"
              onClick={onBackToLanding}
              aria-label="العودة للصفحة الرئيسية"
              title="الرئيسية"
              style={{ border: '1px solid var(--outline)', borderRadius: 10, width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'var(--surface)', cursor: 'pointer', color: 'var(--fg-3)', flexShrink: 0 }}
            >
              <Home size={16} />
            </button>
          )}
          <div className="uqp-brand" aria-label="عرب qu">
            <div className="uqp-brand-mark" aria-hidden="true">
              <Zap size={18} />
            </div>
            <div className="uqp-brand-title">
              <strong>عرب qu</strong>
              <span>المنصة الكمومية الموحدة</span>
            </div>
          </div>
        </div>

        <div className="uqp-status-bar">
          <span className="ui-chip" aria-label="حالة النظام">
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: runDisabled ? 'var(--p-tertiary)' : 'var(--q-success)' }} />
            <span style={{ fontWeight: 900 }}>الحالة</span>
            <span style={{ color: 'var(--fg)' }}>{status}</span>
          </span>
          <span className="ui-chip" aria-label="حالة الـAPI" dir="rtl">
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: apiHealth === 'OK' ? 'var(--q-success)' : apiHealth === 'DOWN' ? 'var(--q-danger, var(--p-error))' : 'rgba(255,255,255,0.25)' }} />
            <span style={{ fontWeight: 900 }}>API</span>
            <span style={{ color: 'var(--fg)' }}>{apiHealth === 'OK' ? 'ON' : apiHealth === 'DOWN' ? 'OFF' : '…'}</span>
          </span>
          <span className="ui-chip" aria-label="الوقت الحالي">
            <Clock size={14} aria-hidden="true" />
            {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="uqp-topbar-actions">
          <button className="ui-btn ui-btn-filled" onClick={handleRunSimulation} disabled={runDisabled} aria-label="تشغيل المحاكاة (Ctrl/⌘ + Enter)" title="تشغيل (Ctrl/⌘ + Enter)">
            <Zap size={16} />
            تشغيل
          </button>
          <button className="ui-btn ui-btn-outlined" onClick={openVisualEngine} aria-label="فتح المحرك المرئي" title="فتح المحرك المرئي">
            <LayoutGrid size={16} />
            المحرك المرئي
          </button>
          <button
            className="ui-icon-btn"
            onClick={() => setCmdOpen(true)}
            aria-label="لوحة الأوامر (Ctrl+K)"
            title="بحث سريع — Ctrl+K"
            style={{ border: '1px solid var(--outline)', borderRadius: 10, width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'var(--surface)', cursor: 'pointer', color: 'var(--fg-3)' }}
          >
            <Search size={16} />
          </button>
          <button className="ui-icon-btn" onClick={() => setShowOverlay(v => !v)} aria-pressed={showOverlay} aria-label="إظهار/إخفاء الطبقة العصبية" title="الطبقة العصبية">
            <Activity size={18} />
          </button>
          <button
            className="ui-icon-btn"
            onClick={() => {
              trackEvent('toggle_theme', { next: uiTheme === 'dark' ? 'light' : 'dark' });
              setUiTheme(t => (t === 'dark' ? 'light' : 'dark'));
            }}
            aria-pressed={uiTheme === 'dark'}
            aria-label={uiTheme === 'dark' ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع المظلم'}
            title={uiTheme === 'dark' ? 'الوضع النهاري' : 'الوضع المظلم'}
          >
            {uiTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="ui-icon-btn" onClick={() => setIsCustomizing(true)} aria-label="تخصيص الثيم" title="تخصيص">
            <Palette size={18} />
          </button>
          <button className="ui-icon-btn" onClick={downloadAnalytics} aria-label="تنزيل بيانات A/B والقياس" title="تنزيل القياس">
            <Download size={18} />
          </button>
          <button className="ui-icon-btn" onClick={clearAnalytics} aria-label="مسح بيانات القياس" title="مسح القياس">
            <Trash2 size={18} />
          </button>
          <button className="ui-icon-btn" onClick={() => window.location.reload()} aria-label="إعادة تحميل التطبيق" title="إعادة تحميل">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ─── Customization & Overlays ─────────────────── */}
      {isCustomizing && (
        <NeuroCustomization
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          onClose={() => setIsCustomizing(false)}
        />
      )}
      {showOverlay && (
        <Suspense fallback={null}>
          <QuantumNeuralOverlay status={status} progress={progress} onClose={() => setShowOverlay(false)} />
        </Suspense>
      )}

      {/* ─── SIDEBAR ──────────────────────────────────── */}
      <aside className={`uqp-sidebar ${sidebarOpen ? 'uqp-sidebar--open' : 'uqp-sidebar--collapsed'}`} aria-label="التنقل الرئيسي">
        <button
          className="uqp-sidebar-toggle"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label={sidebarOpen ? 'طي القائمة الجانبية' : 'فتح القائمة الجانبية'}
          title={sidebarOpen ? 'طي' : 'فتح'}
        >
          {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="uqp-nav" role="tablist" aria-label="تبويبات المنصة">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`uqp-panel-${tab.id}`}
                className={`uqp-nav-item ${activeTab === tab.id ? 'uqp-nav-item--active' : ''}`}
                onClick={() => { setActiveTab(tab.id); trackEvent('tab_switch', { tab: tab.id }); }}
                aria-label={tab.ariaLabel}
                title={tab.label}
                type="button"
              >
                <Icon size={20} />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* ── Sidebar: quick actions ── */}
        {sidebarOpen && (
          <div className="uqp-sidebar-extra">
            <div className="ui-card" style={{ padding: 12, borderRadius: 18, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="ui-icon-btn" aria-hidden="true"><BrainCircuit size={16} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 12 }}>Innovation Lab</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>اختبار سريع</div>
                </div>
                <span className="ui-badge" style={{ marginInlineStart: 'auto' }}>BETA</span>
              </div>
              <button className="ui-btn ui-btn-tonal" onClick={handleRunInnovation} disabled={status === 'PROCESSING'} aria-label="تشغيل مجموعة الابتكار" style={{ fontSize: 12 }}>
                <Zap size={14} />
                ابتكار سريع
              </button>
              {innovationResults && (
                <ul className="ui-list" aria-label="نتائج الابتكار" style={{ fontSize: 11 }}>
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>QRP</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800 }}>{innovationResults.qrp.length} steps</div>
                  </li>
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>EDC</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800 }}>{innovationResults.edc.ratio}%</div>
                  </li>
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>QAGE</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800 }}>{innovationResults.qage.fitness.toFixed(4)}</div>
                  </li>
                </ul>
              )}
            </div>

            <div className="ui-card" style={{ padding: 12, borderRadius: 18, display: 'grid', gap: 8 }}>
              <button className="ui-btn ui-btn-outlined" onClick={openVisualEngine} aria-label="فتح المحرك المرئي" style={{ fontSize: 12 }}>
                <LayoutGrid size={14} />
                المحرك المرئي
              </button>
              <a className="ui-btn ui-btn-outlined" href="/QuantumOS.html" aria-label="فتح QuantumOS" style={{ textDecoration: 'none', fontSize: 12 }}>
                <Shield size={14} />
                QuantumOS
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────────── */}
      <main id="uqp-main" className={`uqp-main ${sidebarOpen ? '' : 'uqp-main--expanded'}`} tabIndex={-1}>

        {/* ── TAB: Overview ── */}
        {activeTab === 'overview' && (
          <div id="uqp-panel-overview" role="tabpanel" aria-label="نظرة عامة" className="uqp-panel" style={{ display: 'grid', gap: 16 }}>
            {/* Sovereign Metrics */}
            <section aria-label="المؤشرات السيادية">
              <SovereignDashboard />
            </section>

            {/* مصمّم الدوائر الكمية */}
            <section aria-label="مصمّم الدوائر الكمية">
              <Suspense fallback={<LoadingFallback />}>
                <QuantumCircuitDesigner />
              </Suspense>
            </section>

            {/* الدستور الأخلاقي */}
            <section aria-label="الدستور الأخلاقي">
              <Suspense fallback={<LoadingFallback />}>
                <EthicsConstitutionVisualizer />
              </Suspense>
            </section>

            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Q-VOLUME', value: '2^50', icon: Cpu, color: 'var(--p-primary)' },
                { label: 'FIDELITY', value: '99.85%', icon: Shield, color: 'var(--p-secondary)' },
                { label: 'COHERENCE', value: '2.5ms', icon: Clock, color: 'var(--p-tertiary)' },
                { label: 'ERROR-RT', value: '0.002%', icon: Activity, color: 'var(--q-success)' },
              ].map((m) => (
                <div key={m.label} className="ui-card" style={{ padding: 16, borderRadius: 18, display: 'grid', gap: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px', background: `linear-gradient(135deg, transparent 30%, ${m.color}12)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                        <m.icon size={18} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 900, color: 'var(--fg)' }}>{m.value}</div>
                      </div>
                    </div>
                    <span className="ui-badge" style={{ background: `${m.color}14`, borderColor: `${m.color}28`, color: m.color }}>LIVE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bloch Sphere + Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, alignItems: 'start' }}>
              <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="ui-icon-btn" aria-hidden="true"><Activity size={18} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>متجه حالة الكيوبت</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Bloch Sphere</div>
                    </div>
                  </div>
                  <span className="ui-chip"><span style={{ fontWeight: 900 }}>A/B</span><span>{abVariant}</span></span>
                </div>
                <div style={{ display: 'grid', placeItems: 'center', padding: 10 }}>
                  <ThreeErrorBoundary fallbackSize={340}>
                    <Suspense fallback={<div style={{ height: 340, display: 'grid', placeItems: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>جارٍ تحميل Bloch Sphere…</div>}>
                      <InteractiveBlochSphere
                        theta={innovationResults?.qage?.qubitState?.theta ?? (status === 'PROCESSING' ? Math.PI / 2 : BLOCH_DEFAULT_THETA)}
                        phi={innovationResults?.qage?.qubitState?.phi ?? (status === 'PROCESSING' ? Math.PI / 4 : BLOCH_DEFAULT_PHI)}
                        size={340}
                      />
                    </Suspense>
                  </ThreeErrorBoundary>
                </div>
              </section>

              <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="ui-icon-btn" aria-hidden="true"><Cpu size={18} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>النتائج والقياسات</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Telemetry + Charts</div>
                  </div>
                </div>
                <ResultsDisplay result={lastResult} status={status} progress={progress} onRun={handleRunSimulation} runDisabled={runDisabled} />
                {aiAnalysis.text && (
                  <div className="ui-card" style={{ padding: 12, borderRadius: 18, marginTop: 12, borderColor: 'rgba(124,77,255,0.30)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div className="ui-icon-btn" aria-hidden="true" style={{ borderColor: 'rgba(124,77,255,0.28)' }}><BrainCircuit size={18} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>تحليل الذكاء الاصطناعي</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{aiAnalysis.provider}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, lineHeight: 1.8, color: 'var(--fg-2)' }}>
                      {aiAnalysis.text}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Learning & Blackbody */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, alignItems: 'start' }}>
              <section className="ui-card" style={{ padding: 12, borderRadius: 22, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="ui-icon-btn" aria-hidden="true"><Activity size={18} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>التعلم من الأخطاء</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Error Memory + Suggestions</div>
                    </div>
                  </div>
                  <span className="ui-badge">LIVE</span>
                </div>
                <button className="ui-btn ui-btn-tonal" onClick={loadLearningSummary} disabled={learningLoading} aria-label="تحديث ملخص التعلم">
                  <Download size={16} />
                  {learningLoading ? 'جارٍ التحديث…' : 'تحديث الملخص'}
                </button>
                {!apiBase && <div className="ui-chip" dir="rtl">يلزم ضبط عنوان الـAPI لتفعيل الملخص.</div>}
                {learningError && <div className="ui-chip" style={{ borderColor: 'rgba(255,60,120,0.35)', color: 'var(--q-danger, var(--p-error))' }} dir="rtl">{learningError}</div>}
                {learningSummary && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {learningSummary.total_events === 0 ? (
                      <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-3)', textAlign: 'center', padding: '8px 0' }} dir="rtl">
                        ✓ لا أخطاء مسجّلة — النظام يعمل بسلام
                      </div>
                    ) : (
                      <>
                        {learningSummary.suggestions?.length > 0 && (
                          <div style={{ display: 'grid', gap: 6 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>اقتراحات</div>
                            <ul className="ui-list" aria-label="اقتراحات إصلاح">
                              {learningSummary.suggestions.slice(0, 4).map((s) => (
                                <li key={s} className="ui-list-item"><div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>{s}</div></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {learningSummary.top?.length > 0 && (
                          <div style={{ display: 'grid', gap: 6 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                              الأكثر تكراراً • {learningSummary.total_events} حدث
                            </div>
                            <ul className="ui-list" aria-label="أكثر الأخطاء تكراراً">
                              {learningSummary.top.slice(0, 4).map((it) => (
                                <li key={it.signature} className="ui-list-item">
                                  <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{it.kind}</div>
                                      <span className="ui-chip" style={{ fontFamily: 'var(--font-mono)' }}>×{it.count}</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {it.message}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </section>

              <section style={{ minWidth: 0 }}>
                <BlackbodyTab />
              </section>
            </div>
          </div>
        )}

        {/* ── TAB: Strategic Modules ── */}
        {activeTab === 'strategic' && (
          <div id="uqp-panel-strategic" role="tabpanel" aria-label="المحركات الكمومية" className="uqp-panel" style={{ display: 'grid', gap: 16 }}>
            <div className="uqp-section-header">
              <div>
                <h2 className="uqp-section-title">المحركات الاستراتيجية الكمومية</h2>
                <p className="uqp-section-desc">
                  نظام تشغيل متكامل للواقع الكمومي — معادلة العتيبي-بلانك ونظام AUTDIE
                </p>
              </div>
              <div className="uqp-architect-badge">
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>المطور المعماري</div>
                <div style={{ fontSize: 14, color: 'var(--p-success, #10b981)', fontWeight: 600 }}>د. عبد العزيز بن سلطان العتيبي</div>
              </div>
            </div>

            {/* لوحة التنبيهات — تظهر في أعلى التبويب الاستراتيجي */}
            <Suspense fallback={<LoadingFallback />}>
              <QuantumAlertPanel
                alerts={alerts}
                onDismiss={dismissAlert}
                onClear={clearAlerts}
              />
            </Suspense>

            <div className="uqp-strategic-grid">
              {/* Al-Utaibi v2.0 (full width) */}
              <section className="uqp-module-panel uqp-col-full" style={{ height: 400 }} aria-label="معادلة العتيبي الموحدة v2.0">
                <Suspense fallback={<LoadingFallback />}><AlUtaibiV2Module /></Suspense>
              </section>

              {/* Grover (full width) */}
              <section className="uqp-module-panel uqp-col-full" style={{ height: 450 }} aria-label="محرك البحث الكمومي Grover">
                <Suspense fallback={<LoadingFallback />}><GroverSearchModule /></Suspense>
              </section>

              {/* Planck & Crypto */}
              <section className="uqp-module-panel uqp-col-2" style={{ height: 500 }} aria-label="معادلة العتيبي-بلانك">
                <Suspense fallback={<LoadingFallback />}><AlOtaibiPlanckModule /></Suspense>
              </section>
              <section className="uqp-module-panel uqp-col-1" style={{ height: 500 }} aria-label="التشفير الكمومي AUTDIE">
                <Suspense fallback={<LoadingFallback />}><QuantumCryptoModule /></Suspense>
              </section>

              {/* QNN & Topological QEC */}
              <section className="uqp-module-panel uqp-col-2" style={{ height: 500 }} aria-label="الشبكة العصبية الكمومية">
                <Suspense fallback={<LoadingFallback />}><QuantumNeuralNetworkModule /></Suspense>
              </section>
              <section className="uqp-module-panel uqp-col-1" style={{ height: 500 }} aria-label="تصحيح الأخطاء الطوبولوجي">
                <Suspense fallback={<LoadingFallback />}><TopologicalQECVisualizer /></Suspense>
              </section>

              {/* التشفير ما بعد الكمومي (PQC) & تضخيم السعة (QAA) — جديد */}
              <section className="uqp-module-panel uqp-col-1" style={{ height: 580 }} aria-label="التشفير ما بعد الكمومي Kyber/McEliece">
                <Suspense fallback={<LoadingFallback />}><PostQuantumCryptoModule /></Suspense>
              </section>
              <section className="uqp-module-panel uqp-col-2" style={{ height: 580 }} aria-label="تضخيم السعة الكمومي">
                <Suspense fallback={<LoadingFallback />}><AmplitudeAmplificationModule /></Suspense>
              </section>

              {/* Drug Discovery (full width) */}
              <section className="uqp-module-panel uqp-col-full" style={{ height: 450 }} aria-label="اكتشاف الأدوية الكمومي">
                <Suspense fallback={<LoadingFallback />}><QuantumDrugDiscovery /></Suspense>
              </section>
            </div>
          </div>
        )}

        {/* ── TAB: Simulation Lab ── */}
        {activeTab === 'simulation' && (
          <div id="uqp-panel-simulation" role="tabpanel" aria-label="مختبر المحاكاة" className="uqp-panel" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'start' }}>
            <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
              <ProblemConfig
                type={simType}
                params={params}
                onTypeChange={(t) => { trackEvent('select_sim_type', { simType: t }); setSimType(t); }}
                onChange={setParams}
                onRun={handleRunSimulation}
                disabled={runDisabled}
              />
            </section>

            <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="ui-icon-btn" aria-hidden="true"><Activity size={18} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>متجه حالة الكيوبت</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Bloch Sphere — Lab Mode</div>
                </div>
              </div>
              <div style={{ display: 'grid', placeItems: 'center', padding: 10 }}>
                <ThreeErrorBoundary fallbackSize={300}>
                  <Suspense fallback={<div style={{ height: 300, display: 'grid', placeItems: 'center', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>جارٍ تحميل…</div>}>
                    <InteractiveBlochSphere
                      theta={innovationResults?.qage?.qubitState?.theta ?? (status === 'PROCESSING' ? Math.PI / 2 : BLOCH_DEFAULT_THETA)}
                      phi={innovationResults?.qage?.qubitState?.phi ?? (status === 'PROCESSING' ? Math.PI / 4 : BLOCH_DEFAULT_PHI)}
                      size={300}
                    />
                  </Suspense>
                </ThreeErrorBoundary>
              </div>
            </section>

            <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="ui-icon-btn" aria-hidden="true"><Cpu size={18} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>النتائج والقياسات</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Simulation Results</div>
                </div>
              </div>
              <ResultsDisplay result={lastResult} status={status} progress={progress} onRun={handleRunSimulation} runDisabled={runDisabled} />
              {aiAnalysis.text && (
                <div className="ui-card" style={{ padding: 12, borderRadius: 18, marginTop: 12, borderColor: 'rgba(124,77,255,0.30)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className="ui-icon-btn" aria-hidden="true" style={{ borderColor: 'rgba(124,77,255,0.28)' }}><BrainCircuit size={18} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>تحليل الذكاء الاصطناعي</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{aiAnalysis.provider}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, lineHeight: 1.8, color: 'var(--fg-2)' }}>{aiAnalysis.text}</div>
                </div>
              )}
            </section>

            <section style={{ minWidth: 0 }}>
              <BlackbodyTab />
            </section>
          </div>
        )}

        {/* ── TAB: Analytics (التحليل الذكي) ── */}
        {activeTab === 'analytics' && (
          <div id="uqp-panel-analytics" role="tabpanel" aria-label="التحليل الذكي للنتائج" className="uqp-panel" style={{ display: 'grid', gap: 16 }}>
            <Suspense fallback={<LoadingFallback />}>
              <QuantumClassicalComparison />
            </Suspense>
            <Suspense fallback={<LoadingFallback />}>
              <AIAnalyticsDashboard />
            </Suspense>
          </div>
        )}

        {/* ── TAB: Audit (سجل التدقيق) ── */}
        {activeTab === 'audit' && (
          <div id="uqp-panel-audit" role="tabpanel" aria-label="سجل التدقيق والمراقبة" className="uqp-panel">
            <Suspense fallback={<LoadingFallback />}>
              <QuantumAuditLog />
            </Suspense>
          </div>
        )}

        {/* ── TAB: Terminal ── */}
        {activeTab === 'terminal' && (
          <div id="uqp-panel-terminal" role="tabpanel" aria-label="الطرفية الافتراضية" className="uqp-panel">
            <section className="uqp-module-panel" style={{ height: 'calc(100vh - 180px)', minHeight: 500 }} aria-label="الطرفية الافتراضية">
              <Suspense fallback={<LoadingFallback />}>
                <VirtualLogsTerminal />
              </Suspense>
            </section>
          </div>
        )}
      </main>

      {/* ─── FOOTER ───────────────────────────────────── */}
      <footer className="uqp-footer" role="contentinfo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} aria-live="polite">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: runDisabled ? 'var(--p-tertiary)' : 'var(--q-success)', boxShadow: runDisabled ? '0 0 8px var(--p-tertiary)' : '0 0 8px var(--q-success)' }} />
            {runDisabled ? 'BUSY' : 'READY'} • {progress}%
          </div>
          <div className="ui-credit" dir="rtl">تطوير: عبدالعزيز بن سلطان العتيبي</div>
          <a
            className="ui-chip"
            href="mailto:alotaibiaziz322@gmail.com"
            style={{ textDecoration: 'none' }}
            aria-label="البريد للتواصل"
            dir="rtl"
          >
            <span dir="ltr">alotaibiaziz322@gmail.com</span>
          </a>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="ui-kbd">Ctrl</span>
          <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>+</span>
          <span className="ui-kbd">Enter</span>
          <span style={{ marginInlineStart: 4 }}>تشغيل</span>
        </div>
      </footer>

      {/* ─── MODALS ───────────────────────────────────── */}
      {showOnboarding && (
        <div className="ui-modal-backdrop" role="presentation" onMouseDown={() => setShowOnboarding(false)}>
          <div
            className="ui-modal"
            role="dialog"
            aria-modal="true"
            aria-label="دليل الاستخدام السريع"
            ref={onboardingContainerRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <div className="ui-modal-title">
                <div className="ui-icon-btn" aria-hidden="true"><Shield size={18} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <strong>دليل الاستخدام السريع</strong>
                  <span>ابدأ خلال دقيقة</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a className="ui-btn ui-btn-outlined" href="/landing.html#vision" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }} aria-label="فتح صفحة التعريف">
                  <Share2 size={16} />
                  صفحة التعريف
                </a>
                <button className="ui-btn ui-btn-danger" onClick={() => setShowOnboarding(false)} ref={onboardingCloseBtnRef} aria-label="إغلاق">
                  <LogOut size={16} />
                  إغلاق
                </button>
              </div>
            </div>
            <div className="ui-modal-body" style={{ padding: 16 }}>
              <div className="ui-card" style={{ padding: 12, borderRadius: 18, display: 'grid', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.8 }}>
                  مرحبًا بك في المنصة الكمومية الموحدة. استخدم التبويبات للتنقل بين الأقسام المختلفة.
                </div>
                <ul className="ui-list" aria-label="خطوات سريعة">
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
                      <strong>نظرة عامة:</strong> المؤشرات الحية وكرة بلوخ والنتائج
                    </div>
                  </li>
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
                      <strong>المحركات الكمومية:</strong> معادلات العتيبي، بحث Grover، التشفير، QNN، اكتشاف الأدوية
                    </div>
                  </li>
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
                      <strong>مختبر المحاكاة:</strong> اختر نوع المحاكاة واضغط تشغيل أو Ctrl+Enter
                    </div>
                  </li>
                  <li className="ui-list-item">
                    <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7 }}>
                      <strong>الطرفية:</strong> سجلات النظام الافتراضية
                    </div>
                  </li>
                </ul>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="ui-btn ui-btn-filled"
                    onClick={() => {
                      try { localStorage.setItem('qurabia.onboarded', '1'); } catch { /* ignore */ }
                      setShowOnboarding(false);
                    }}
                    aria-label="بدء الاستخدام"
                  >
                    <Zap size={16} />
                    ابدأ الآن
                  </button>
                  <button
                    className="ui-btn ui-btn-tonal"
                    onClick={() => {
                      try { localStorage.setItem('qurabia.onboarded', '1'); } catch { /* ignore */ }
                      setShowOnboarding(false);
                      handleRunSimulation();
                    }}
                    aria-label="تشغيل تجربة"
                    disabled={runDisabled}
                  >
                    <Activity size={16} />
                    تشغيل تجربة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVisualEngine && (
        <div className="ui-modal-backdrop" role="presentation" onMouseDown={() => setShowVisualEngine(false)}>
          <div
            className="ui-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Quantum Algorithms Visual Engine"
            ref={modalContainerRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <div className="ui-modal-title">
                <div className="ui-icon-btn" aria-hidden="true"><LayoutGrid size={18} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <strong>Quantum Algorithms Visual Engine</strong>
                  <span>/qurabia.html</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a className="ui-btn ui-btn-outlined" href="/qurabia.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }} aria-label="فتح في نافذة جديدة">
                  <Share2 size={16} />
                  نافذة جديدة
                </a>
                <button className="ui-btn ui-btn-danger" onClick={() => setShowVisualEngine(false)} ref={modalCloseBtnRef} aria-label="إغلاق">
                  <LogOut size={16} />
                  إغلاق
                </button>
              </div>
            </div>
            <div className="ui-modal-body">
              <iframe title="عرب qu Visual Engine" src="/qurabia.html" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {showSurvey && (
        <div className="ui-snackbar" role="status" aria-label="استطلاع رضا سريع">
          <p>هل ساعدك التصميم الجديد في إنجاز المهمة بسرعة؟</p>
          <div className="ui-snackbar-actions">
            <button className="ui-icon-btn" onClick={() => { trackEvent('survey', { answer: 'up' }); setSurveySubmitted('up'); setShowSurvey(false); }} aria-label="نعم" disabled={surveySubmitted !== null}>
              <ThumbsUp size={18} />
            </button>
            <button className="ui-icon-btn" onClick={() => { trackEvent('survey', { answer: 'down' }); setSurveySubmitted('down'); setShowSurvey(false); }} aria-label="لا" disabled={surveySubmitted !== null}>
              <ThumbsDown size={18} />
            </button>
            <button className="ui-btn ui-btn-outlined" onClick={() => setShowSurvey(false)} aria-label="إغلاق الاستطلاع">
              لاحقًا
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedQuantumPlatform;
