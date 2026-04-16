import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PageTransition, { usePageTransition } from './components/PageTransition';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useArabicVoice } from './hooks/useArabicVoice';
import { useWakeLock } from './hooks/useWakeLock';
import { useWebVitals } from './hooks/useWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import SiteAccessGate from './components/SiteAccessGate';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

const UnifiedQuantumPlatform = React.lazy(() => import('./components/UnifiedQuantumPlatform'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const QuantumForgePage = React.lazy(() => import('./components/QuantumForgePage'));
const PricingPage = React.lazy(() => import('./components/PricingPage'));
const AuthPage = React.lazy(() => import('./components/AuthPage'));
const NotFoundPage = React.lazy(() => import('./components/NotFoundPage'));
const QuantumCyberShieldPage = React.lazy(() => import('./components/QuantumCyberShieldPage'));
const ContactPage = React.lazy(() => import('./components/ContactPage'));
const CompanionSprite = React.lazy(() => import('./companion/CompanionSprite'));

const LOG_SEQUENCE = [
  { type: 'load', msg: 'INITIALIZING QUANTUM CYBER SHIELD...' },
  { type: 'ok', msg: 'AL-OTAIBI THREAT ANALYZER LOADED' },
  { type: 'load', msg: 'CALIBRATING SECURITY LATTICE...' },
  { type: 'ok', msg: 'QUANTUM FIREWALL ONLINE' },
  { type: 'load', msg: 'ESTABLISHING ENCRYPTED CHANNELS...' },
  { type: 'ok', msg: 'FIDELITY: 99.85% — EAVESDROP DETECTION ACTIVE' },
  { type: 'load', msg: 'LOADING THREAT INTELLIGENCE...' },
  { type: 'ok', msg: 'AI DEFENSE ENGINE READY' },
  { type: 'load', msg: 'MERGING CYBER DEFENSE PLATFORM...' },
  { type: 'ok', msg: 'UNIFIED CYBER SHIELD SYSTEM ONLINE' },
  { type: 'msg', msg: 'SYSTEM STABLE. WELCOME TO QURABIA CYBER DEFENSE.' },
] as const;

const LOG_COUNT = LOG_SEQUENCE.length;

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLog] = useState<{ type: string; msg: string }[]>([]);
  const currentLogRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalId);
          setTimeout(() => onCompleteRef.current(), 800);
          return 100;
        }

        const next = Math.min(prev + Math.random() * 5, 100);

        while (currentLogRef.current < LOG_COUNT && next > (currentLogRef.current / LOG_COUNT) * 100) {
          const entry = LOG_SEQUENCE[currentLogRef.current];
          setLog((prevLogs) => [...prevLogs, entry]);
          currentLogRef.current++;
        }

        return next;
      });
    }, 80);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <output
      id="boot-screen"
      aria-label="شاشة الإقلاع"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background: 'radial-gradient(600px 400px at 50% 40%, rgba(139, 92, 246, 0.12), transparent 70%), var(--bg)',
      }}
    >
      <div
        className="ui-card"
        style={{
          width: 'min(480px, 100%)',
          padding: 24,
          borderRadius: 24,
          animation: 'uiPopIn var(--dur-3) var(--ease-emphasized)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div
            className="app-brand-mark"
            aria-hidden="true"
            style={{ width: 56, height: 56, borderRadius: 16, fontSize: 20, fontWeight: 900 }}
          >
            ع
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 900, letterSpacing: 3 }}>QURABIA</div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-3)' }}>الدفاع السيبراني الكمومي</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, fontWeight: 700, color: 'var(--fg-2)' }}>
              تهيئة النظام
            </div>
            <div
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 900, color: 'var(--p-primary)' }}
              aria-live="polite"
              aria-atomic="true"
            >
              {Math.round(progress)}%
            </div>
          </div>
          <div
            role="progressbar"
            tabIndex={0}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="تقدم تهيئة النظام"
            style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--p-primary), var(--p-secondary))',
                borderRadius: 999,
                transition: 'width 180ms var(--ease-standard)',
              }}
            />
          </div>
        </div>

        <div
          style={{ maxHeight: 140, overflow: 'auto', borderRadius: 14, background: 'var(--surface)', padding: 12 }}
          aria-live="polite"
          aria-label="سجل الإقلاع"
        >
          <div style={{ display: 'grid', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
            {logs.map((l) => (
              <div key={l.msg} style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    color:
                      l.type === 'ok' ? 'var(--q-success)' : l.type === 'load' ? 'var(--p-secondary)' : 'var(--fg-3)',
                    fontWeight: 700,
                  }}
                >
                  [{l.type === 'ok' ? '✓' : l.type === 'load' ? '⟳' : '●'}]
                </span>
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </output>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--bg)',
            fontFamily: 'var(--font-ui)',
            textAlign: 'center',
            padding: 24,
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--q-error, #ef4444)' }}>
              حدث خطأ في تحميل النظام
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
              {this.state.error?.message}
            </div>
            <button type="button" className="ui-btn ui-btn-filled" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transitioning, trigger, onComplete } = usePageTransition();
  const { canInstall, promptInstall } = usePWAInstall();
  const { isListening, isSupported: voiceSupported, toggleListening } = useArabicVoice();
  const { isLocked: wakeLocked, toggle: toggleWakeLock, isSupported: wakeLockSupported } = useWakeLock();
  const { getReport: getVitalsReport } = useWebVitals();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      params.delete('redirect');
      const remaining = params.toString();
      const newSearch = remaining ? `?${remaining}` : '';
      navigate(redirect + newSearch, { replace: true });
    }
  }, [navigate]);

  const navigateTo = useCallback(
    (path: string) => {
      trigger();
      const TRANSITION_DELAY_MS = 120;
      setTimeout(() => navigate(path), TRANSITION_DELAY_MS);
    },
    [trigger, navigate],
  );

  const handleEnterPlatform = useCallback(() => {
    navigateTo('/boot');
  }, [navigateTo]);

  const handleEnterForge = useCallback(() => {
    navigateTo('/forge');
  }, [navigateTo]);

  const handleBootComplete = useCallback(() => {
    navigate('/platform');
  }, [navigate]);

  const handleBackToLanding = useCallback(() => {
    navigateTo('/');
  }, [navigateTo]);

  const handleOpenPricing = useCallback(() => {
    navigateTo('/pricing');
  }, [navigateTo]);

  const handleOpenCyber = useCallback(() => {
    navigateTo('/cyber');
  }, [navigateTo]);

  const isPlatform = location.pathname === '/platform';

  return (
    <>
      <PageTransition active={transitioning} onComplete={onComplete} />
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <LandingPage
                  onEnterPlatform={handleEnterPlatform}
                  onEnterForge={handleEnterForge}
                  onOpenCyber={handleOpenCyber}
                  onOpenPricing={handleOpenPricing}
                />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/forge"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <QuantumForgePage onBack={handleBackToLanding} />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/boot"
          element={<BootScreen onComplete={handleBootComplete} />}
        />
        <Route
          path="/platform"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <UnifiedQuantumPlatform onBackToLanding={handleBackToLanding} />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/pricing"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <PricingPage onBack={handleBackToLanding} onEnterPlatform={handleEnterPlatform} />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/auth"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <AuthPage />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/cyber"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <QuantumCyberShieldPage />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/contact"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <ContactPage />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="*"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <NotFoundPage />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>

      {canInstall && (
        <div className="pwa-install-banner" role="alert">
          ثبّت عرب qu على جهازك
          <button type="button" onClick={promptInstall}>تثبيت</button>
        </div>
      )}

      {voiceSupported && (
        <div
          className={`voice-indicator ${isListening ? 'voice-indicator--active' : ''}`}
          role="status"
          aria-label={isListening ? 'الاستماع الصوتي نشط' : 'الأوامر الصوتية متاحة'}
        >
          <div className="voice-indicator__pulse" />
          {isListening ? 'جاري الاستماع...' : 'أوامر صوتية'}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع'}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 16,
              padding: 4,
            }}
          >
            {isListening ? '⏹' : '🎙'}
          </button>
        </div>
      )}

      {wakeLockSupported && isPlatform && (
        <button
          type="button"
          className={`wakelock-indicator ${wakeLocked ? '' : ''}`}
          onClick={toggleWakeLock}
          aria-label={wakeLocked ? 'إلغاء منع إيقاف الشاشة' : 'منع إيقاف الشاشة أثناء المحاكاة'}
          title={wakeLocked ? 'الشاشة مفعّلة — اضغط لإلغاء' : 'منع إيقاف الشاشة'}
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            zIndex: 99996,
            background: wakeLocked ? 'var(--c-violet-dim)' : 'var(--surface)',
            border: `1px solid ${wakeLocked ? 'var(--p-primary)' : 'var(--outline)'}`,
            borderRadius: 999,
            padding: '6px 14px',
            color: wakeLocked ? 'var(--p-primary)' : 'var(--fg-3)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            transition: 'all var(--dur-2) var(--ease-standard)',
          }}
        >
          {wakeLocked ? '👁 شاشة مفعّلة' : '👁‍🗨 أبقِ الشاشة'}
        </button>
      )}

      {isPlatform && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 99995,
          }}
        >
          <Suspense fallback={null}>
            <CompanionSprite />
          </Suspense>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <SiteAccessGate>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </SiteAccessGate>
    </GlobalErrorBoundary>
  );
};

export default App;
