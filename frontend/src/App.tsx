// App.tsx – نقطة دخول التطبيق
import React, { Suspense } from 'react';

const Dashboard = React.lazy(() => import('./components/DashboardV5'));

const Loader: React.FC = () => (
  <div style={{
    width: '100vw', height: '100vh',
    background: '#020408',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, color: '#00ffff',
    fontFamily: 'JetBrains Mono, monospace',
  }}>
    <div style={{
      width: 60, height: 60,
      border: '2px solid rgba(0,255,255,0.2)',
      borderTop: '2px solid #00ffff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ fontSize: 13, letterSpacing: 2 }}>QUANTUM BOOT SEQUENCE</div>
    <div style={{ fontSize: 10, color: 'rgba(0,255,255,0.5)' }}>
      تهيئة Ultimate Quantum SuperSystem v5.0...
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Dashboard />
    </Suspense>
  );
};

export default App;
