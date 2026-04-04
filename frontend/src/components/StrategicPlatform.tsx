/**
 * StrategicPlatform — نظام السوبر الكمي الموحد
 * Integrates all quantum modules from the strategic platform
 */
import React, { Suspense } from 'react';
import { Shield } from 'lucide-react';
import SovereignDashboard from './SovereignDashboard';

const AlOtaibiPlanckModule = React.lazy(() => import('./AlOtaibiPlanckModule'));
const AlUtaibiV2Module = React.lazy(() => import('./AlUtaibiV2Module'));
const QuantumCryptoModule = React.lazy(() => import('./QuantumCryptoModule'));
const GroverSearchModule = React.lazy(() => import('./GroverSearchModule'));
const TopologicalQECVisualizer = React.lazy(() => import('./TopologicalQECVisualizer'));
const QuantumNeuralNetworkModule = React.lazy(() => import('./QuantumNeuralNetworkModule'));
const QuantumDrugDiscovery = React.lazy(() => import('./QuantumDrugDiscovery'));
const VirtualLogsTerminal = React.lazy(() => import('./VirtualLogsTerminal'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="animate-pulse text-slate-500 font-mono text-sm">
      جاري التحميل...
    </div>
  </div>
);

const panelStyle: React.CSSProperties = {
  background: 'rgba(10, 13, 20, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
  borderRadius: '16px',
  overflow: 'hidden',
};

export const StrategicPlatform: React.FC = () => {
  return (
    <div className="min-h-screen text-slate-200" dir="rtl">
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(10, 13, 20, 0.6)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #059669, #134e4a)',
                boxShadow: '0 0 30px rgba(16,185,129,0.3)',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
            >
              <Shield size={24} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-0.5">
                نظام السوبر الكمي الموحد
              </h1>
              <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-[0.2em]">
                معادلة العتيبي الموحدة ومستقبل الحوسبة السيادية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-mono text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">QPU Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8 relative z-10">
        <div className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-light text-white mb-3 tracking-wide">
              لوحة التحكم السيادية
            </h2>
            <p className="text-slate-400 max-w-3xl text-sm leading-relaxed font-mono">
              نظام تشغيل متكامل للواقع الكمومي، مبني على أسس برمجية صلبة.
              يجسد معادلة العتيبي-بلانك ونظام AUTDIE في حوسبة الذكاء العام
              ذاتية التطور.
            </p>
          </div>
          <div
            className="text-right hidden md:block p-4 rounded-xl"
            style={{
              ...panelStyle,
              borderRight: '2px solid #10b981',
            }}
          >
            <div className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest">
              المطور المعماري
            </div>
            <div className="text-base text-emerald-400 font-semibold tracking-wide">
              د. عبد العزيز بن سلطان العتيبي
            </div>
          </div>
        </div>

        {/* Sovereign Metrics Dashboard */}
        <div className="mb-10">
          <SovereignDashboard />
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Row 1: Al-Utaibi v2.0 (full width) */}
          <div className="lg:col-span-3" style={{ ...panelStyle, height: '400px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <AlUtaibiV2Module />
            </Suspense>
          </div>

          {/* Row 2: Grover Search (full width) */}
          <div className="lg:col-span-3" style={{ ...panelStyle, height: '450px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <GroverSearchModule />
            </Suspense>
          </div>

          {/* Row 3: Planck & Crypto */}
          <div className="lg:col-span-2" style={{ ...panelStyle, height: '500px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <AlOtaibiPlanckModule />
            </Suspense>
          </div>
          <div style={{ ...panelStyle, height: '500px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <QuantumCryptoModule />
            </Suspense>
          </div>

          {/* Row 4: QNN & Topological QEC */}
          <div className="lg:col-span-2" style={{ ...panelStyle, height: '500px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <QuantumNeuralNetworkModule />
            </Suspense>
          </div>
          <div style={{ ...panelStyle, height: '500px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <TopologicalQECVisualizer />
            </Suspense>
          </div>

          {/* Row 5: Drug Discovery (full width) */}
          <div className="lg:col-span-3" style={{ ...panelStyle, height: '450px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <QuantumDrugDiscovery />
            </Suspense>
          </div>

          {/* Row 6: Terminal (full width) */}
          <div className="lg:col-span-3" style={{ ...panelStyle, height: '400px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <VirtualLogsTerminal />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StrategicPlatform;
