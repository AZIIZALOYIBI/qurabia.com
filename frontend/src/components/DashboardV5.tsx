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
    <div className="min-h-screen bg-[#020408] text-slate-200 font-sans p-4 md:p-8">
      {/* تأثيرات الخلفية */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">QURABIA <span className="text-cyan-400">SUPERSYSTEM</span></h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> ENGINE v5.0</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className="text-cyan-500/80">AL-OTAIBI QUANTUM CORE ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-widest">{status}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
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

          <div className="quantum-panel p-6 bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-4 h-4" /> تصور الحالة (Bloch Sphere)
              </h3>
              <Info className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex justify-center py-4">
              <InteractiveBlochSphere 
                theta={status === 'PROCESSING' ? Math.random() * Math.PI : 1.1} 
                phi={status === 'PROCESSING' ? Math.random() * Math.PI * 2 : 0.4} 
                size={260}
              />
            </div>
            <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Qubit Fidelity</div>
                  <div className="text-sm font-mono text-cyan-400">99.85%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Coherence Time</div>
                  <div className="text-sm font-mono text-purple-400">2.5ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Analytics */}
        <div className="xl:col-span-8 space-y-8">
          <ResultsDisplay 
            result={lastResult}
            status={status}
            progress={progress}
          />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'QOPS', value: '31.2M', color: 'text-cyan-400' },
              { label: 'Active Qubits', value: '50', color: 'text-purple-400' },
              { label: 'Error Rate', value: '0.002%', color: 'text-green-400' },
              { label: 'Quantum Volume', value: '2^50', color: 'text-blue-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className={`text-lg font-black font-mono ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CSS Overrides */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 10px; }
        .quantum-panel { transition: transform 0.3s ease, border-color 0.3s ease; }
        .quantum-panel:hover { border-color: rgba(34,211,238,0.4); }
      `}</style>
    </div>
  );
};

export default DashboardV5;
