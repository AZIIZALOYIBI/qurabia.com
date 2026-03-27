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
    <div className="quantum-panel p-6 bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-500/10 rounded-xl">
          <Settings2 className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">إعدادات المحاكاة</h2>
          <p className="text-sm text-slate-400">تكوين بارامترات النظام الكمي</p>
        </div>
      </div>

      {/* نوع المحاكاة */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {types.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              disabled={disabled}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 border ${
                isActive 
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-cyan-500/30'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-bold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* بارامترات متغيرة حسب النوع */}
      <div className="space-y-6 mb-8">
        {type === 'PHYSICS' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">التردد المرجعي (ν)</label>
            <input 
              type="range" min="1e13" max="8e14" step="1e13"
              value={params.frequency}
              onChange={(e) => onChange({ ...params, frequency: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-cyan-500/60 font-mono">
              <span>1.0e13 Hz</span>
              <span className="text-cyan-400">{params.frequency.toExponential(2)} Hz</span>
              <span>8.0e14 Hz</span>
            </div>
          </div>
        )}

        {type === 'CHEMISTRY' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">عدد تكرارات VQE</label>
            <input 
              type="number" min="10" max="200"
              value={params.iterations || 60}
              onChange={(e) => onChange({ ...params, iterations: parseInt(e.target.value) })}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-cyan-400 font-mono focus:border-cyan-500/50 outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs text-slate-400">معامل α</label>
            <input 
              type="number" step="0.1" value={25.3} readOnly
              className="w-full p-3 bg-slate-800/20 border border-slate-800 rounded-xl text-slate-500 font-mono cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs text-slate-400">معامل β</label>
            <input 
              type="number" step="0.0001" value={0.9985} readOnly
              className="w-full p-3 bg-slate-800/20 border border-slate-800 rounded-xl text-slate-500 font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={disabled}
        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 group"
      >
        {disabled ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>جارٍ المعالجة...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
            <span>بدء المحاكاة الكمية</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProblemConfig;
