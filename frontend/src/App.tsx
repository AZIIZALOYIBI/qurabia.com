// App.tsx – نقطة دخول التطبيق
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';

const UnifiedQuantumPlatform = React.lazy(() => import('./components/UnifiedQuantumPlatform'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const QuantumForgePage = React.lazy(() => import('./components/QuantumForgePage'));

// --- حالات الإقلاع الثابتة (خارج المكوّن لتجنب إعادة الإنشاء) ---
const LOG_SEQUENCE = [
  { type: 'load', msg: 'INITIALIZING QUANTUM CORE...' },
  { type: 'ok',   msg: 'AL-OTAIBI UNIFIED EQUATION LOADED' },
  { type: 'load', msg: 'CALIBRATING QUBIT LATTICE...' },
  { type: 'ok',   msg: '50 QUBITS ONLINE' },
  { type: 'load', msg: 'ESTABLISHING ENTANGLEMENT...' },
  { type: 'ok',   msg: 'FIDELITY: 99.85%' },
  { type: 'load', msg: 'LOADING NEURAL INTERFACE...' },
  { type: 'ok',   msg: 'AGI ENGINE READY' },
  { type: 'load', msg: 'MERGING STRATEGIC PLATFORM...' },
  { type: 'ok',   msg: 'UNIFIED QUANTUM SYSTEM ONLINE' },
  { type: 'msg',  msg: 'SYSTEM STABLE. WELCOME TO QURABIA UNIFIED OS.' },
] as const;

// --- حد الأمان لمنع حلقة لانهائية ---
const LOG_COUNT = LOG_SEQUENCE.length;

// --- مكون شاشة الإقلاع (Boot Screen) ---
const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLog] = useState<{ type: string; msg: string }[]>([]);

  // نستخدم ref لتتبع السجل الحالي حتى لا يُعاد تصفيره عند كل render
  const currentLogRef = useRef(0);
  // نحتفظ بـ onComplete في ref لتجنب إعادة تشغيل الـ effect عند تغيير المرجع
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress(prev => {
        // إذا اكتمل التقدم، أنهِ الفاصل الزمني وأطلق الحدث
        if (prev >= 100) {
          clearInterval(intervalId);
          setTimeout(() => onCompleteRef.current(), 800);
          return 100;
        }

        const next = Math.min(prev + Math.random() * 5, 100);

        // أضف إدخالات السجل بناءً على التقدم الحالي (باستخدام while لتغطية القفزات الكبيرة)
        while (
          currentLogRef.current < LOG_COUNT &&
          next > (currentLogRef.current / LOG_COUNT) * 100
        ) {
          const entry = LOG_SEQUENCE[currentLogRef.current];
          setLog(prevLogs => [...prevLogs, entry]);
          currentLogRef.current++;
        }

        return next;
      });
    }, 80);

    return () => clearInterval(intervalId);
  }, []); // تشغيل مرة واحدة فقط عند الوصل

  return (
    <div
      id="boot-screen"
      role="status"
      aria-label="شاشة الإقلاع"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background:
          'radial-gradient(600px 400px at 50% 40%, rgba(139, 92, 246, 0.12), transparent 70%), var(--bg)',
      }}
    >
      <div className="ui-card" style={{ width: 'min(480px, 100%)', padding: 24, borderRadius: 24, animation: 'uiPopIn var(--dur-3) var(--ease-emphasized)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="app-brand-mark" aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 20, fontWeight: 900 }}>
            Q
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 900, letterSpacing: 3 }}>QURABIA</div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg-3)' }}>القوة الكمية العربية</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, fontWeight: 700, color: 'var(--fg-2)' }}>تهيئة النظام</div>
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

        <div style={{ maxHeight: 140, overflow: 'auto', borderRadius: 14, background: 'var(--surface)', padding: 12 }} aria-live="polite" aria-label="سجل الإقلاع">
          <div style={{ display: 'grid', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
            {logs.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    color: l.type === 'ok' ? 'var(--q-success)' : l.type === 'load' ? 'var(--p-secondary)' : 'var(--fg-3)',
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
    </div>
  );
};

// --- مكون حدود الخطأ (Error Boundary) لمنع الشاشة الفارغة عند فشل التحميل ---
interface ErrorBoundaryState { hasError: boolean; error: Error | null }
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
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
            <button
              className="ui-btn ui-btn-filled"
              onClick={() => window.location.reload()}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'forge' | 'boot' | 'platform'>('landing');

  const handleEnterPlatform = useCallback(() => {
    setCurrentView('boot');
  }, []);

  const handleEnterForge = useCallback(() => {
    setCurrentView('forge');
  }, []);

  const handleBootComplete = useCallback(() => {
    setCurrentView('platform');
  }, []);

  const handleBackToLanding = useCallback(() => {
    setCurrentView('landing');
  }, []);

  return (
    <>
      {currentView === 'landing' && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <LandingPage onEnterPlatform={handleEnterPlatform} onEnterForge={handleEnterForge} />
          </Suspense>
        </ErrorBoundary>
      )}
      {currentView === 'forge' && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <QuantumForgePage onBack={handleBackToLanding} />
          </Suspense>
        </ErrorBoundary>
      )}
      {currentView === 'boot' && <BootScreen onComplete={handleBootComplete} />}
      {currentView === 'platform' && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <UnifiedQuantumPlatform />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
};

export default App;
