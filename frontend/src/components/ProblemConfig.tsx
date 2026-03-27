import React from 'react';
import { SimulationType } from '../engine/SimulationFactory';
import { Settings2, Cpu, Zap, Beaker, ShieldCheck, TrendingUp, CpuIcon } from 'lucide-react';

interface ProblemConfigProps {
  type: SimulationType;
  params: any;
  onChange: (newParams: any) => void;
  onTypeChange: (newType: SimulationType) => void;
  onRun: () => void;
  disabled?: boolean;
}

const ProblemConfig: React.FC<ProblemConfigProps> = ({
  type,
  params,
  onChange,
  onTypeChange,
  onRun,
  disabled
}) => {
  const types: { value: SimulationType; label: string; icon: any; desc: string }[] = [
    { value: 'PHYSICS', label: 'Physics', icon: Zap, desc: 'Quantum Particles & Cosmology' },
    { value: 'CHEMISTRY', label: 'Chemistry', icon: Beaker, desc: 'VQE & Molecular Dynamics' },
    { value: 'CRYPTO', label: 'Crypto', icon: ShieldCheck, desc: 'BB84 & E91 Protocols' },
    { value: 'AI', label: 'AGI Core', icon: Cpu, desc: 'Quantum Machine Learning' },
    { value: 'FINANCE', label: 'Finance', icon: TrendingUp, desc: 'Portfolio Optimization' },
    { value: 'HYBRID', label: 'Hybrid', icon: CpuIcon, desc: 'Classical-Quantum Bridge' },
  ];

  return (
    <div className="q-glass p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-[var(--c-cyan-dim)] rounded-xl border border-[var(--c-cyan)]/20">
          <Settings2 className="w-5 h-5 text-[var(--c-cyan)]" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white tracking-wider uppercase font-display">System Config</h2>
          <p className="text-[9px] text-[var(--t-secondary)] uppercase tracking-[0.2em]">Parameter Tuning</p>
        </div>
      </div>

      {/* نوع المحاكاة */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {types.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 border ${
                isActive 
                  ? 'bg-[var(--c-cyan)]/10 border-[var(--c-cyan)]/40 text-[var(--c-cyan)] shadow-[0_0_15px_rgba(0,245,255,0.1)]' 
                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* بارامترات متغيرة حسب النوع */}
      <div className="space-y-6 mb-6">
        {type === 'PHYSICS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference Frequency (ν)</label>
              <span className="text-[10px] font-mono text-[var(--c-cyan)] font-bold">{params.frequency.toExponential(2)} Hz</span>
            </div>
            <input 
              type="range" min="1e13" max="8e14" step="1e13"
              value={params.frequency}
              onChange={(e) => onChange({ ...params, frequency: parseFloat(e.target.value) })}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--c-cyan)]"
            />
          </div>
        )}

        {type === 'CHEMISTRY' && (
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VQE Iterations</label>
            <input 
              type="number" min="10" max="200"
              value={params.iterations || 60}
              onChange={(e) => onChange({ ...params, iterations: parseInt(e.target.value) })}
              className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-[var(--c-cyan)] font-mono text-xs font-bold focus:border-[var(--c-cyan)]/30 outline-none transition-all"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alpha (α)</label>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 font-mono text-[10px] font-bold">25.3</div>
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Beta (β)</label>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 font-mono text-[10px] font-bold">0.9985</div>
          </div>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={disabled}
        className="q-btn q-btn-primary w-full py-4 disabled:opacity-50"
      >
        {disabled ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5" />
            <span>Execute Sequence</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProblemConfig;
