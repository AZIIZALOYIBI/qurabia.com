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
    <div id="boot-screen" style={{
      position: 'fixed', inset: 0, background: '#00000f', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="boot-logo-ring" style={{ position: 'relative', width: 160, height: 160, marginBottom: 40 }}>
        <div className="boot-ring boot-ring-1" />
        <div className="boot-ring boot-ring-2" />
        <div className="boot-ring boot-ring-3" />
        <div className="boot-logo-center">Q</div>
      </div>

      <div className="boot-title">QURABIA OS</div>
      <div className="boot-subtitle">v5.0 — Quantum SuperSystem</div>

      <div className="boot-progress-track" style={{ width: 400, height: 3, background: 'rgba(0,245,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
        <div className="boot-progress-fill" style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--c-violet), var(--c-cyan), var(--c-gold))' }} />
      </div>

      <div className="boot-log" style={{ width: 400, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-secondary)', minHeight: 120, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {logs.map((l, i) => (
          <div key={i} className="boot-log-line">
            <span className={`bl-${l.type}`} style={{ color: l.type === 'ok' ? 'var(--c-emerald)' : l.type === 'load' ? 'var(--c-gold)' : 'var(--t-secondary)' }}>
              [{l.type === 'ok' ? ' OK ' : l.type === 'load' ? 'LOAD' : 'SYS '}]
            </span>
            <span className="bl-msg">{l.msg}</span>
          </div>
        ))}
      </div>

      <style>{`
        .boot-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; }
        .boot-ring-1 { border-top-color: var(--c-cyan); border-right-color: var(--c-cyan); animation: bootSpin1 1.2s linear infinite; }
        .boot-ring-2 { inset: 12px; border-bottom-color: var(--c-gold); border-left-color: var(--c-gold); animation: bootSpin2 0.8s linear infinite reverse; }
        .boot-ring-3 { inset: 24px; border-top-color: var(--c-violet); animation: bootSpin1 2s linear infinite; }
        .boot-logo-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 28px; font-weight: 900; color: var(--c-cyan); }
        @keyframes bootSpin1 { to { transform: rotate(360deg); } }
        @keyframes bootSpin2 { to { transform: rotate(-360deg); } }
        .boot-title { font-family: var(--font-display); font-size: 22px; font-weight: 900; letter-spacing: 6px; background: linear-gradient(135deg, var(--c-cyan), var(--c-gold), var(--c-violet)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .boot-subtitle { font-family: var(--font-mono); font-size: 10px; letter-spacing: 4px; color: var(--t-secondary); margin-bottom: 40px; }
      `}</style>
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
