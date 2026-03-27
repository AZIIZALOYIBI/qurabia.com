import React, { useState, useCallback, useMemo } from 'react';
import { useQuantumState } from '../hooks/useQuantumState';
import { SimulationFactory, SimulationType } from '../engine/SimulationFactory';
import ProblemConfig from './ProblemConfig';
import ResultsDisplay from './ResultsDisplay';
import InteractiveBlochSphere from '../visualizers/InteractiveBlochSphere';
import { Cpu, Zap, Activity, Info, LogOut } from 'lucide-react';

const DashboardV5: React.FC = () => {
  const { 
    status, 
    progress, 
    lastResult, 
    setStatus, 
    updateProgress, 
    setLastResult, 
    resetState 
  } = useQuantumState();

  const [simType, setSimType] = useState<SimulationType>('PHYSICS');
  const [params, setParams] = useState({
    frequency: 5.45e14,
    waveFunctionReal: 0.707,
    waveFunctionImag: 0.707,
    sphericalHarmonic: 1.0,
    fineTuning: 1.0,
    iterations: 60
  });

  const handleRunSimulation = useCallback(async () => {
    setStatus('QUANTUM_INIT');
    updateProgress(10);

    // محاكاة مراحل المعالجة
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
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  }, [simType, params, setStatus, updateProgress, setLastResult]);

  return (
    <div className="min-h-screen bg-[var(--q-bg)] text-[var(--q-text-main)] font-sans p-4 md:p-8">
      {/* تأثيرات الخلفية */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--q-primary-glow)] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--q-secondary-glow)] blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[var(--q-primary)] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--q-primary-glow)]">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">QURABIA <span className="text-[var(--q-primary)]">SUPERSYSTEM</span></h1>
            <div className="flex items-center gap-2 text-[10px] text-[var(--q-text-muted)] font-mono">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> ENGINE v5.0</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className="text-[var(--q-primary)] opacity-80 uppercase tracking-widest">Al-Otaibi Unified Core Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[var(--q-surface)]/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 px-5 py-2 bg-[var(--q-primary)]/10 rounded-xl border border-[var(--q-primary)]/20">
            <div className="w-2 h-2 bg-[var(--q-primary)] rounded-full animate-pulse shadow-[0_0_10px_var(--q-primary)]" />
            <span className="text-xs font-bold text-[var(--q-primary)] font-mono uppercase tracking-widest">{status}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-2.5 hover:bg-slate-800/50 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        
        {/* Left Column: Config & Visualizer */}
        <div className="xl:col-span-4 space-y-8">
          <ProblemConfig 
            type={simType}
            params={params}
            onTypeChange={setSimType}
            onChange={setParams}
            onRun={handleRunSimulation}
            disabled={status !== 'IDLE' && status !== 'COMPLETED'}
          />

          <div className="q-glass p-8 rounded-[2rem]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                <Activity className="w-4 h-4 text-[var(--q-primary)]" /> تصور الحالة (Bloch Sphere)
              </h3>
              <Info className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex justify-center py-6">
              <InteractiveBlochSphere 
                theta={status === 'PROCESSING' ? Math.random() * Math.PI : 1.1} 
                phi={status === 'PROCESSING' ? Math.random() * Math.PI * 2 : 0.4} 
                size={280}
              />
            </div>
            <div className="mt-8 p-5 bg-[var(--q-bg)]/50 rounded-2xl border border-white/5">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Qubit Fidelity</div>
                  <div className="text-lg font-mono font-bold text-[var(--q-primary)]">99.85%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Coherence Time</div>
                  <div className="text-lg font-mono font-bold text-[var(--q-secondary)]">2.5ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Analytics */}
        <div className="xl:col-span-8 space-y-8">
          <div className="q-glass p-1 rounded-[2.5rem]">
            <div className="p-1">
              <ResultsDisplay 
                result={lastResult}
                status={status}
                progress={progress}
              />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'QOPS', value: '31.2M', color: 'text-[var(--q-primary)]', icon: Zap },
              { label: 'Active Qubits', value: '50', color: 'text-[var(--q-secondary)]', icon: Cpu },
              { label: 'Error Rate', value: '0.002%', color: 'text-[var(--q-success)]', icon: Activity },
              { label: 'Quantum Volume', value: '2^50', color: 'text-blue-400', icon: Info },
            ].map((stat, i) => (
              <div key={i} className="q-glass p-6 rounded-2xl text-center group hover:-translate-y-1">
                <stat.icon className={`w-4 h-4 mx-auto mb-3 opacity-40 ${stat.color}`} />
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] mb-2">{stat.label}</div>
                <div className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Global CSS Inject */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--q-primary-glow); border-radius: 10px; }
        .q-glass { transition: var(--q-transition); }
      `}</style>
    </div>
  );
};

export default DashboardV5;
