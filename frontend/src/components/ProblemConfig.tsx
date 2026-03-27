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
    { value: 'PHYSICS', label: 'فيزياء الكم', icon: Zap, desc: 'محاكاة الجسيمات والكونيات' },
    { value: 'CHEMISTRY', label: 'الكيمياء الكمية', icon: Beaker, desc: 'اكتشاف الأدوية وجزيء H2' },
    { value: 'CRYPTO', label: 'التشفير الكمي', icon: ShieldCheck, desc: 'بروتوكولات BB84 و E91' },
    { value: 'AI', label: 'الذكاء الاصطناعي', icon: Cpu, desc: 'نماذج QSVM والتعلم الآلي' },
    { value: 'FINANCE', label: 'التحسين المالي', icon: TrendingUp, desc: 'إدارة المحافظ الاستثمارية' },
    { value: 'HYBRID', label: 'النماذج الهجينة', icon: CpuIcon, desc: 'دمج المعالجة التقليدية والكمية' },
  ];

  return (
    <div className="q-glass p-8 rounded-[2rem]">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3.5 bg-[var(--q-primary)]/10 rounded-2xl border border-[var(--q-primary)]/20 shadow-inner">
          <Settings2 className="w-7 h-7 text-[var(--q-primary)]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">إعدادات المحاكاة</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Quantum Parameter Tuning</p>
        </div>
      </div>

      {/* نوع المحاكاة */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {types.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all duration-500 border ${
                isActive 
                  ? 'bg-[var(--q-primary)]/20 border-[var(--q-primary)]/50 text-[var(--q-primary)] shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-[1.02]' 
                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* بارامترات متغيرة حسب النوع */}
      <div className="space-y-8 mb-10">
        {type === 'PHYSICS' && (
          <div className="space-y-5">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">التردد المرجعي (ν)</label>
              <span className="text-xs font-mono text-[var(--q-primary)] font-bold">{params.frequency.toExponential(2)} Hz</span>
            </div>
            <input 
              type="range" min="1e13" max="8e14" step="1e13"
              value={params.frequency}
              onChange={(e) => onChange({ ...params, frequency: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--q-primary)]"
            />
          </div>
        )}

        {type === 'CHEMISTRY' && (
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">عدد تكرارات VQE</label>
            <input 
              type="number" min="10" max="200"
              value={params.iterations || 60}
              onChange={(e) => onChange({ ...params, iterations: parseInt(e.target.value) })}
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-[var(--q-primary)] font-mono font-bold focus:border-[var(--q-primary)]/30 outline-none transition-all"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معامل α</label>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 font-mono text-sm font-bold">25.3</div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معامل β</label>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 font-mono text-sm font-bold">0.9985</div>
          </div>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={disabled}
        className="w-full py-5 bg-gradient-to-r from-[var(--q-primary)] to-blue-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all duration-500 shadow-xl shadow-[var(--q-primary-glow)] flex items-center justify-center gap-3 group"
      >
        {disabled ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing Engine...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
            <span>Execute Simulation</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProblemConfig;
