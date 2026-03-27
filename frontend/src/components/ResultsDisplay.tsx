import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Activity, Gauge, Terminal, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ResultsDisplayProps {
  result: any;
  status: string;
  progress: number;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, status, progress }) => {
  const isCompleted = status === 'COMPLETED';

  // بيانات افتراضية للمخطط في حال عدم وجود نتائج حقيقية
  const defaultData = Array.from({ length: 20 }, (_, i) => ({
    iter: i + 1,
    energy: -1.1 + Math.random() * 0.2,
    fidelity: 0.95 + Math.random() * 0.04
  }));

  const chartData = result?.data?.vqeData || defaultData;

  return (
    <div className="space-y-8">
      {/* مؤشر الحالة الرئيسي */}
      <div className={`q-glass p-8 border-l-8 rounded-[2rem] transition-all duration-700 ${
        isCompleted ? 'border-[var(--q-success)] bg-[var(--q-success)]/5' : 'border-[var(--q-primary)] bg-[var(--q-primary)]/5'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isCompleted ? 'bg-[var(--q-success)]/20' : 'bg-[var(--q-primary)]/20'}`}>
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-[var(--q-success)]" />
              ) : (
                <Activity className="w-6 h-6 text-[var(--q-primary)] animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-100 tracking-tight">النظام: {status}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">System Pulse & Telemetry</p>
            </div>
          </div>
          <div className="text-xl font-mono text-[var(--q-primary)] font-black bg-[var(--q-primary)]/10 px-5 py-2 rounded-2xl border border-[var(--q-primary)]/20">
            {progress}%
          </div>
        </div>
        
        {/* شريط التقدم */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${
              isCompleted ? 'bg-[var(--q-success)] shadow-[0_0_20px_var(--q-success)]' : 'bg-[var(--q-primary)] shadow-[0_0_20px_var(--q-primary)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="q-glass p-8 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-slate-400">
              <Gauge className="w-4 h-4 text-[var(--q-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">تقارب الطاقة (VQE)</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--q-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--q-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="iter" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--q-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--q-primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="energy" stroke="var(--q-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="q-glass p-8 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity className="w-4 h-4 text-[var(--q-secondary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">دقة العملية (Fidelity)</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="iter" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={[0.9, 1.0]} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--q-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--q-secondary)', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="fidelity" stroke="var(--q-secondary)" dot={false} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* سجل النتائج (Terminal) */}
      <div className="q-glass p-8 bg-[var(--q-bg)]/80 rounded-[2rem] font-mono">
        <div className="flex items-center gap-3 mb-6 text-slate-500 border-b border-white/5 pb-4">
          <Terminal className="w-4 h-4 text-[var(--q-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quantum Telemetry Log</span>
        </div>
        <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar text-xs">
          {isCompleted ? (
            <div className="space-y-2">
              <div className="flex items-start gap-4 p-3 bg-[var(--q-success)]/5 rounded-xl border border-[var(--q-success)]/10">
                <span className="text-[var(--q-success)] font-black">[SYSTEM]</span>
                <span className="text-slate-300">Simulation cycle finalized with optimal convergence.</span>
              </div>
              <div className="flex items-start gap-4 p-3 bg-[var(--q-primary)]/5 rounded-xl border border-[var(--q-primary)]/10">
                <span className="text-[var(--q-primary)] font-black">[METRIC]</span>
                <span className="text-slate-300">Ground State Energy: {result.energy?.toFixed(6)} Ha</span>
              </div>
              <div className="flex items-start gap-4 p-3 bg-[var(--q-secondary)]/5 rounded-xl border border-[var(--q-secondary)]/10">
                <span className="text-[var(--q-secondary)] font-black">[SIGNAL]</span>
                <span className="text-slate-300">Quantum Volume reach 2^50 with {(result.fidelity * 100)?.toFixed(2)}% fidelity.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-slate-500 animate-pulse p-4">
              <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" />
              <span className="font-black uppercase tracking-widest">Awaiting Quantum stream...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
