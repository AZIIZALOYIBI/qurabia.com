import { Shield } from 'lucide-react';
/**
 * StrategicPlatform — نظام السوبر الكمي الموحد
 * Integrates all quantum modules from the strategic platform
 */
import React, { Suspense } from 'react';
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
  <div className="flex items-center justify-center h-full min-h-[200px]" role="status">
    <div className="animate-pulse text-slate-500 font-mono text-sm">جاري التحميل...</div>
  </div>
);

export const StrategicPlatform: React.FC = () => {
  return (
    <div className="min-h-screen text-slate-200" dir="rtl">
      <a href="#sp-main-content" className="sp-skip-link">
        تخطي إلى المحتوى الرئيسي
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 sp-header">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #059669, #134e4a)',
                boxShadow: '0 0 30px rgba(16,185,129,0.3)',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
              aria-hidden="true"
            >
              <Shield size={24} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-0.5">نظام السوبر الكمي الموحد</h1>
              <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-[0.2em]">
                معادلة العتيبي الموحدة ومستقبل الحوسبة السيادية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-mono text-slate-400">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10"
              role="status"
              aria-label="حالة المعالج الكمومي"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span className="text-emerald-400">QPU Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="sp-main-content" className="max-w-[1600px] mx-auto px-6 py-8 relative z-10">
        <div className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-light text-white mb-3 tracking-wide">لوحة التحكم السيادية</h2>
            <p className="text-slate-400 max-w-3xl text-sm leading-relaxed font-mono">
              نظام تشغيل متكامل للواقع الكمومي، مبني على أسس برمجية صلبة. يجسد معادلة العتيبي-بلانك ونظام AUTDIE في
              حوسبة الذكاء العام ذاتية التطور.
            </p>
          </div>
          <div
            className="text-right hidden md:block p-4 rounded-xl sp-panel"
            style={{ borderRight: '2px solid #10b981' }}
          >
            <div className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest">المطور المعماري</div>
            <div className="text-base text-emerald-400 font-semibold tracking-wide">د. عبد العزيز بن سلطان العتيبي</div>
          </div>
        </div>

        {/* Sovereign Metrics Dashboard */}
        <section className="mb-10" aria-label="المؤشرات السيادية">
          <SovereignDashboard />
        </section>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Row 1: Al-Utaibi v2.0 (full width) */}
          <section
            className="lg:col-span-3 sp-panel"
            style={{ height: '400px' }}
            aria-label="معادلة العتيبي الموحدة v2.0"
          >
            <Suspense fallback={<LoadingFallback />}>
              <AlUtaibiV2Module />
            </Suspense>
          </section>

          {/* Row 2: Grover Search (full width) */}
          <section
            className="lg:col-span-3 sp-panel"
            style={{ height: '450px' }}
            aria-label="محرك البحث الكمومي Grover"
          >
            <Suspense fallback={<LoadingFallback />}>
              <GroverSearchModule />
            </Suspense>
          </section>

          {/* Row 3: Planck & Crypto */}
          <section className="lg:col-span-2 sp-panel" style={{ height: '500px' }} aria-label="معادلة العتيبي-بلانك">
            <Suspense fallback={<LoadingFallback />}>
              <AlOtaibiPlanckModule />
            </Suspense>
          </section>
          <section className="sp-panel" style={{ height: '500px' }} aria-label="التشفير الكمومي AUTDIE">
            <Suspense fallback={<LoadingFallback />}>
              <QuantumCryptoModule />
            </Suspense>
          </section>

          {/* Row 4: QNN & Topological QEC */}
          <section className="lg:col-span-2 sp-panel" style={{ height: '500px' }} aria-label="الشبكة العصبية الكمومية">
            <Suspense fallback={<LoadingFallback />}>
              <QuantumNeuralNetworkModule />
            </Suspense>
          </section>
          <section className="sp-panel" style={{ height: '500px' }} aria-label="تصحيح الأخطاء الطوبولوجي">
            <Suspense fallback={<LoadingFallback />}>
              <TopologicalQECVisualizer />
            </Suspense>
          </section>

          {/* Row 5: Drug Discovery (full width) */}
          <section className="lg:col-span-3 sp-panel" style={{ height: '450px' }} aria-label="اكتشاف الأدوية الكمومي">
            <Suspense fallback={<LoadingFallback />}>
              <QuantumDrugDiscovery />
            </Suspense>
          </section>

          {/* Row 6: Terminal (full width) */}
          <section className="lg:col-span-3 sp-panel" style={{ height: '400px' }} aria-label="الطرفية الافتراضية">
            <Suspense fallback={<LoadingFallback />}>
              <VirtualLogsTerminal />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
};

export default StrategicPlatform;
