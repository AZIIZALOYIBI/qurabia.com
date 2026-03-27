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
    <div className="space-y-6">
      {/* مؤشر الحالة الرئيسي */}
      <div className={`quantum-panel p-6 border-l-4 rounded-2xl ${
        isCompleted ? 'border-green-500 bg-green-500/5' : 'border-cyan-500 bg-cyan-500/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
            )}
            <h3 className="text-lg font-bold text-slate-100">حالة النظام: {status}</h3>
          </div>
          <span className="text-sm font-mono text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full">
            {progress}%
          </span>
        </div>
        
        {/* شريط التقدم */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              isCompleted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="quantum-panel p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <Gauge className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">تقارب الطاقة (VQE)</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="iter" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="energy" stroke="#06b6d4" fillOpacity={1} fill="url(#colorEnergy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="quantum-panel p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">دقة العملية (Fidelity)</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="iter" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0.9, 1.0]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Line type="monotone" dataKey="fidelity" stroke="#a855f7" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* سجل النتائج (Terminal) */}
      <div className="quantum-panel p-6 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-800 pb-3">
          <Terminal className="w-4 h-4" />
          <span>سجل النتائج الكمية</span>
        </div>
        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
          {isCompleted ? (
            <>
              <div className="flex gap-3 text-green-400">
                <span>[SUCCESS]</span>
                <span>اكتمال المحاكاة بنجاح ✓</span>
              </div>
              <div className="flex gap-3 text-cyan-400">
                <span>[RESULT]</span>
                <span>E_total = {result.energy?.toExponential(4)} eV</span>
              </div>
              <div className="flex gap-3 text-purple-400">
                <span>[FIDELITY]</span>
                <span>F = {(result.fidelity * 100)?.toFixed(2)}%</span>
              </div>
            </>
          ) : (
            <div className="flex gap-3 text-slate-500 animate-pulse">
              <span>[WAITING]</span>
              <span>في انتظار معالجة البيانات...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
