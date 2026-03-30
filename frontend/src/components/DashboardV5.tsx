import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuantumState } from '../hooks/useQuantumState';
import { SimulationFactory, SimulationType } from '../engine/SimulationFactory';
import { TaskOrchestrator } from '../engine/TaskOrchestrator';
import { GeminiService } from '../engine/GeminiService';
import { GrokService } from '../engine/GrokService';
import ProblemConfig from './ProblemConfig';
import ResultsDisplay from './ResultsDisplay';
import InteractiveBlochSphere from '../visualizers/InteractiveBlochSphere';
import BlackbodyTab from './BlackbodyTab';
import { 
  Cpu, Zap, Activity, LogOut, LayoutGrid, Share2, Shield, Clock, BrainCircuit, Palette, Sun, Moon, Download, Trash2, ThumbsUp, ThumbsDown
} from 'lucide-react';

import { InnovationTester } from '../utils/InnovationTester';
import NeuroCustomization, { ThemePreset } from './NeuroCustomization';
import QuantumNeuralOverlay from './QuantumNeuralOverlay';

const DashboardV5: React.FC = () => {
  const { 
    status, 
    progress, 
    lastResult, 
    setStatus, 
    updateProgress, 
    setLastResult 
  } = useQuantumState();

  const [simType, setSimType] = useState<SimulationType>('PHYSICS');
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; provider: string }>({ text: "", provider: "" });
  const [innovationResults, setInnovationResults] = useState<any>(null);
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
    iterations: 60
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme);
    localStorage.setItem('qurabia.uiTheme', uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    localStorage.setItem('qurabia.themePreset', currentTheme);
    const accent =
      currentTheme === 'QUANTUM_CYAN'
        ? 'cyan'
        : currentTheme === 'NEURAL_VIOLET'
          ? 'violet'
          : currentTheme === 'SOLAR_GOLD'
            ? 'amber'
            : 'emerald';
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('qurabia.uiAccent', accent);
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-variant', abVariant);
  }, [abVariant]);

  const trackEvent = useCallback((name: string, payload: Record<string, unknown> = {}) => {
    const entry = {
      t: Date.now(),
      name,
      variant: abVariant,
      theme: uiTheme,
      payload,
    };
    const key = 'qurabia.analytics';
    const currentRaw = localStorage.getItem(key);
    const current = currentRaw ? JSON.parse(currentRaw) : [];
    const next = Array.isArray(current) ? [...current, entry] : [entry];
    localStorage.setItem(key, JSON.stringify(next.slice(-500)));
  }, [abVariant, uiTheme]);

  useEffect(() => {
    trackEvent('page_view', { path: window.location.pathname });
  }, [trackEvent]);

  useEffect(() => {
    trackEvent('ab_assigned', { variant: abVariant });
  }, [trackEvent, abVariant]);

  const handleRunSimulation = useCallback(async () => {
    trackEvent('run_simulation', { simType });
    setStatus('QUANTUM_INIT');
    updateProgress(10);
    setAiAnalysis({ text: "", provider: "" });

    // استخدام TaskOrchestrator لتنفيذ المهمة
    await TaskOrchestrator.scheduleTask({
      type: 'SIMULATION_BOOT',
      priority: 'HIGH',
      payload: { simType }
    });

    const phases = [
      { s: 'CALIBRATION', p: 30, t: 800 },
      { s: 'PROCESSING', p: 60, t: 1200 },
      { s: 'PROCESSING', p: 90, t: 1000 },
    ];

    for (const phase of phases) {
      await new Promise(r => setTimeout(r, phase.t));
      setStatus(phase.s as any);
      updateProgress(phase.p);
    }

    try {
      const result = await SimulationFactory.run(simType, params);
      setLastResult(result);
      
      // تحليل النتائج - استخدام Grok كأولوية
      let analysisText = "";
      let provider = "xAI Grok";

      try {
        analysisText = await GrokService.analyzeSimulation(result);
      } catch (err) {
        console.warn("Grok failed, using Gemini/Mock fallback");
        provider = "Gemini AI";
        analysisText = await GeminiService.analyzeSimulation(result);
      }
      setAiAnalysis({ text: analysisText, provider });
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  }, [simType, params, setStatus, updateProgress, setLastResult, trackEvent]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVisualEngine) setShowVisualEngine(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleRunSimulation();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRunSimulation, showVisualEngine]);

  useEffect(() => {
    if (status === 'COMPLETED') {
      setShowSurvey(true);
      setSurveySubmitted(null);
    }
  }, [status]);

  const runDisabled = status !== 'IDLE' && status !== 'COMPLETED';

  const openVisualEngine = useCallback(() => {
    trackEvent('open_visual_engine');
    setShowVisualEngine(true);
  }, [trackEvent]);

  const downloadAnalytics = useCallback(() => {
    trackEvent('download_analytics');
    const raw = localStorage.getItem('qurabia.analytics') || '[]';
    const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qurabia-analytics-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [trackEvent]);

  const clearAnalytics = useCallback(() => {
    localStorage.removeItem('qurabia.analytics');
    trackEvent('clear_analytics');
  }, [trackEvent]);

  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showVisualEngine) return;
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    modalCloseBtnRef.current?.focus();
    return () => {
      lastActiveElementRef.current?.focus?.();
    };
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
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showVisualEngine]);

  const handleRunInnovation = useCallback(() => {
    setStatus('PROCESSING');
    updateProgress(50);
    setTimeout(() => {
      const results = InnovationTester.runFullSuite();
      setInnovationResults(results);
      setStatus('COMPLETED');
      updateProgress(100);
    }, 1500);
  }, [setStatus, updateProgress]);

  const mainGridStyle = useMemo<React.CSSProperties>(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 14,
    alignItems: 'start',
  }), []);

  return (
    <div className="app-shell" aria-label="QURABIA Dashboard">
      <a className="skip-link" href="#main">تخطي إلى المحتوى</a>

      <header className="app-topbar" role="banner">
        <div className="app-brand" aria-label="QURABIA">
          <div className="app-brand-mark" aria-hidden="true">
            <Zap size={18} />
          </div>
          <div className="app-brand-title">
            <strong>QURABIA</strong>
            <span>v5.0 — Quantum SuperSystem</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, justifyContent: 'center' }}>
          <span className="ui-chip" aria-label="حالة النظام">
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: runDisabled ? 'var(--p-tertiary)' : 'var(--q-success)' }} />
            <span style={{ fontWeight: 900 }}>الحالة</span>
            <span style={{ color: 'var(--fg)' }}>{status}</span>
          </span>
          <span className="ui-chip" aria-label="الوقت الحالي">
            <Clock size={14} aria-hidden="true" />
            {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="app-topbar-actions">
          <button className="ui-btn ui-btn-filled" onClick={handleRunSimulation} disabled={runDisabled} aria-label="تشغيل المحاكاة (Ctrl/⌘ + Enter)" title="تشغيل (Ctrl/⌘ + Enter)">
            <Zap size={16} />
            تشغيل
          </button>
          <button className="ui-btn ui-btn-outlined" onClick={openVisualEngine} aria-label="فتح المحرك المرئي" title="فتح المحرك المرئي">
            <LayoutGrid size={16} />
            المحرك المرئي
          </button>
          <button className="ui-icon-btn" onClick={() => setShowOverlay((v) => !v)} aria-pressed={showOverlay} aria-label="إظهار/إخفاء الطبقة العصبية" title="الطبقة العصبية">
            <Activity size={18} />
          </button>
          <button
            className="ui-icon-btn"
            onClick={() => {
              trackEvent('toggle_theme', { next: uiTheme === 'dark' ? 'light' : 'dark' });
              setUiTheme((t) => (t === 'dark' ? 'light' : 'dark'));
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

      {/* ── Customization & Overlays ───────────────────────── */}
      {isCustomizing && (
        <NeuroCustomization 
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          onClose={() => setIsCustomizing(false)}
        />
      )}

      {showOverlay && (
        <QuantumNeuralOverlay 
          status={status}
          progress={progress}
          onClose={() => setShowOverlay(false)}
        />
      )}

      <aside className="app-sidebar" aria-label="التنقل">
        <nav className="app-nav">
          <button className="app-nav-item" aria-current="page" aria-label="الرئيسية" type="button">
            <LayoutGrid size={18} />
          </button>
          <button className="app-nav-item" aria-label="المحاكاة" type="button">
            <Cpu size={18} />
          </button>
          <button className="app-nav-item" aria-label="الأمان" type="button">
            <Shield size={18} />
          </button>
          <button className="app-nav-item" aria-label="فتح المحرك المرئي" type="button" onClick={openVisualEngine}>
            <Share2 size={18} />
          </button>
        </nav>
      </aside>

      <main id="main" className="app-main" tabIndex={-1}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { label: 'Q-VOLUME', value: '2^50', icon: Cpu },
              { label: 'FIDELITY', value: '99.85%', icon: Shield },
              { label: 'COHERENCE', value: '2.5ms', icon: Clock },
              { label: 'ERROR-RT', value: '0.002%', icon: Activity },
            ].map((m) => (
              <div key={m.label} className="ui-card" style={{ padding: 12, borderRadius: 18, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="ui-icon-btn" aria-hidden="true">
                      <m.icon size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 900 }}>{m.value}</div>
                    </div>
                  </div>
                  <span className="ui-badge">LIVE</span>
                </div>
              </div>
            ))}
          </div>

          <div style={mainGridStyle}>
            {abVariant === 'B' && (
              <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
                <ProblemConfig
                  type={simType}
                  params={params}
                  onTypeChange={(t) => {
                    trackEvent('select_sim_type', { simType: t });
                    setSimType(t);
                  }}
                  onChange={setParams}
                  onRun={handleRunSimulation}
                  disabled={runDisabled}
                />
              </section>
            )}

            <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ui-icon-btn" aria-hidden="true">
                    <Activity size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>متجه حالة الكيوبت</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Bloch Sphere</div>
                  </div>
                </div>
                <span className="ui-chip">
                  <span style={{ fontWeight: 900 }}>A/B</span>
                  <span>{abVariant}</span>
                </span>
              </div>
              <div style={{ display: 'grid', placeItems: 'center', padding: 10 }}>
                <InteractiveBlochSphere
                  theta={status === 'PROCESSING' ? Math.random() * Math.PI : 1.1}
                  phi={status === 'PROCESSING' ? Math.random() * Math.PI * 2 : 0.4}
                  size={340}
                />
              </div>
            </section>

            <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ui-icon-btn" aria-hidden="true">
                    <Cpu size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>النتائج والقياسات</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Telemetry + Charts</div>
                  </div>
                </div>
              </div>

              <ResultsDisplay result={lastResult} status={status} progress={progress} />

              {aiAnalysis.text && (
                <div className="ui-card" style={{ padding: 12, borderRadius: 18, marginTop: 12, borderColor: 'rgba(124,77,255,0.30)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className="ui-icon-btn" aria-hidden="true" style={{ borderColor: 'rgba(124,77,255,0.28)' }}>
                      <BrainCircuit size={18} />
                    </div>
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

            {abVariant === 'A' && (
              <section className="ui-card" style={{ padding: 12, borderRadius: 22, minWidth: 0 }}>
                <ProblemConfig
                  type={simType}
                  params={params}
                  onTypeChange={(t) => {
                    trackEvent('select_sim_type', { simType: t });
                    setSimType(t);
                  }}
                  onChange={setParams}
                  onRun={handleRunSimulation}
                  disabled={runDisabled}
                />
              </section>
            )}

            <section style={{ minWidth: 0 }}>
              <BlackbodyTab />
            </section>
          </div>
        </div>
      </main>

      <aside className="app-panel" aria-label="لوحة الأدوات">
        <div className="ui-card" style={{ padding: 12, borderRadius: 22, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ui-icon-btn" aria-hidden="true">
                <BrainCircuit size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>Innovation Lab</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>اختبار ابتكار سريع</div>
              </div>
            </div>
            <span className="ui-badge">BETA</span>
          </div>

          <button className="ui-btn ui-btn-tonal" onClick={handleRunInnovation} disabled={status === 'PROCESSING'} aria-label="تشغيل مجموعة الابتكار">
            <Zap size={16} />
            تشغيل مجموعة الابتكار
          </button>

          {innovationResults && (
            <ul className="ui-list" aria-label="نتائج الابتكار">
              <li className="ui-list-item">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Pathfinding (QRP)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--fg)' }}>
                  {innovationResults.qrp.length} steps
                </div>
              </li>
              <li className="ui-list-item">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Compression (EDC)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--fg)' }}>
                  Ratio: {innovationResults.edc.ratio}%
                </div>
              </li>
              <li className="ui-list-item">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Evolution (QAGE)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--fg)' }}>
                  Fitness: {innovationResults.qage.fitness.toFixed(4)}
                </div>
              </li>
            </ul>
          )}

          <div className="ui-divider" />

          <div style={{ display: 'grid', gap: 8 }}>
            <button className="ui-btn ui-btn-outlined" onClick={openVisualEngine} aria-label="فتح المحرك المرئي">
              <LayoutGrid size={16} />
              فتح المحرك المرئي
            </button>
            <a className="ui-btn ui-btn-outlined" href="/QuantumOS.html" aria-label="فتح صفحة التوافق QuantumOS" style={{ textDecoration: 'none' }}>
              <Shield size={16} />
              QuantumOS (Compatibility)
            </a>
          </div>
        </div>
      </aside>

      <footer className="app-footer" role="contentinfo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <div aria-live="polite">SYSTEM: {runDisabled ? 'BUSY' : 'READY'} • PROGRESS: {progress}%</div>
          <div className="ui-credit" dir="rtl">تطوير: عبدالعزيز بن سلطان العتيبي</div>
          <a
            className="ui-chip"
            href="mailto:alotaibiaziz322@gmail.com"
            style={{ textDecoration: 'none' }}
            aria-label="البريد للتواصل"
            dir="rtl"
          >
            للتواصل: <span dir="ltr">alotaibiaziz322@gmail.com</span>
          </a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="ui-kbd">Ctrl</span>
          <span className="ui-kbd">Enter</span>
          <span>تشغيل</span>
        </div>
      </footer>

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
                <div className="ui-icon-btn" aria-hidden="true">
                  <LayoutGrid size={18} />
                </div>
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
                <button
                  className="ui-btn ui-btn-danger"
                  onClick={() => setShowVisualEngine(false)}
                  ref={modalCloseBtnRef}
                  aria-label="إغلاق"
                >
                  <LogOut size={16} />
                  إغلاق
                </button>
              </div>
            </div>
            <div className="ui-modal-body">
              <iframe title="QURABIA Visual Engine" src="/qurabia.html" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {showSurvey && (
        <div className="ui-snackbar" role="status" aria-label="استطلاع رضا سريع">
          <p>هل ساعدك التصميم الجديد في إنجاز المهمة بسرعة؟</p>
          <div className="ui-snackbar-actions">
            <button
              className="ui-icon-btn"
              onClick={() => {
                trackEvent('survey', { answer: 'up' });
                setSurveySubmitted('up');
                setShowSurvey(false);
              }}
              aria-label="نعم"
              disabled={surveySubmitted !== null}
            >
              <ThumbsUp size={18} />
            </button>
            <button
              className="ui-icon-btn"
              onClick={() => {
                trackEvent('survey', { answer: 'down' });
                setSurveySubmitted('down');
                setShowSurvey(false);
              }}
              aria-label="لا"
              disabled={surveySubmitted !== null}
            >
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

export default DashboardV5;
