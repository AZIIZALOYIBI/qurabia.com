// App.tsx – نقطة دخول التطبيق
import React, { Suspense, useState, useEffect } from 'react';

const Dashboard = React.lazy(() => import('./components/DashboardV5'));

// --- مكون شاشة الإقلاع (Boot Screen) ---
const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLog] = useState<{ type: string; msg: string }[]>([]);

  const logSequence = [
    { type: 'load', msg: 'INITIALIZING QUANTUM CORE...' },
    { type: 'ok',   msg: 'AL-OTAIBI UNIFIED EQUATION LOADED' },
    { type: 'load', msg: 'CALIBRATING QUBIT LATTICE...' },
    { type: 'ok',   msg: '50 QUBITS ONLINE' },
    { type: 'load', msg: 'ESTABLISHING ENTANGLEMENT...' },
    { type: 'ok',   msg: 'FIDELITY: 99.85%' },
    { type: 'load', msg: 'LOADING NEURAL INTERFACE...' },
    { type: 'ok',   msg: 'AGI ENGINE READY' },
    { type: 'msg',  msg: 'SYSTEM STABLE. WELCOME TO QURABIA OS.' },
  ];

  useEffect(() => {
    let currentLog = 0;
    const interval = setInterval(() => {
      if (progress < 100) {
        setProgress(prev => Math.min(prev + (Math.random() * 5), 100));
        
        if (currentLog < logSequence.length && progress > (currentLog / logSequence.length) * 100) {
          setLog(prev => [...prev, logSequence[currentLog]]);
          currentLog++;
        }
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 800);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [progress, onComplete]);

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
          'radial-gradient(900px 500px at 85% 10%, rgba(124, 77, 255, 0.18), transparent 60%), radial-gradient(700px 420px at 10% 90%, rgba(0, 184, 212, 0.16), transparent 60%), var(--bg)',
      }}
    >
      <div className="ui-card" style={{ width: 'min(560px, 100%)', padding: 16, borderRadius: 24, animation: 'uiPopIn var(--dur-3) var(--ease-emphasized)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="app-brand-mark" aria-hidden="true" style={{ width: 44, height: 44 }}>
            Q
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900, letterSpacing: 1.2 }}>QURABIA</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>v5.0 — Quantum SuperSystem</div>
          </div>
          <div style={{ marginInlineStart: 'auto' }} className="ui-badge">
            BOOT
          </div>
        </div>

        <div className="ui-card" style={{ padding: 12, borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>تهيئة النظام</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{Math.round(progress)}%</div>
          </div>
          <div aria-label="شريط التقدم" style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--p-primary), var(--p-secondary), var(--p-tertiary))',
                transition: 'width 180ms var(--ease-standard)',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="ui-card">
          <div style={{ padding: 12, borderRadius: 18, maxHeight: 160, overflow: 'auto' }} aria-live="polite" aria-label="سجل الإقلاع">
            <div style={{ display: 'grid', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
              {logs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <span
                    style={{
                      color: l.type === 'ok' ? 'var(--q-success)' : l.type === 'load' ? 'var(--p-tertiary)' : 'var(--fg-3)',
                      fontWeight: 900,
                    }}
                  >
                    [{l.type === 'ok' ? 'OK' : l.type === 'load' ? 'LOAD' : 'SYS'}]
                  </span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [booted, setBooted] = useState(false);

  return (
    <>
      {!booted && <BootScreen onComplete={() => setBooted(true)} />}
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </>
  );
};

export default App;
