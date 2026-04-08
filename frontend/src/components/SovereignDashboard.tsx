import { Activity, Dna, Shield, Zap } from 'lucide-react';
import React from 'react';

export const SovereignDashboard: React.FC = React.memo(() => {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      role="list"
      aria-label="المؤشرات السيادية الرئيسية"
    >
      <div
        className="p-5 rounded-2xl relative overflow-hidden group sp-metric-card"
        role="listitem"
        aria-label="عامل التفوق الكمومي: 1.43 × 10^17"
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-blue-500/20 group-hover:scale-150"
          aria-hidden="true"
        />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">عامل التفوق الكمومي</div>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-mono">
              1.43 × 10<sup className="text-lg">17</sup>
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400" aria-hidden="true">
            <Zap size={24} />
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono border-t border-white/5 pt-3 relative z-10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
          طاقة لكل عملية: <span className="text-blue-400 font-semibold">0.0055 fJ</span>
        </div>
      </div>

      <div
        className="p-5 rounded-2xl relative overflow-hidden group sp-metric-card"
        role="listitem"
        aria-label="الاستقرار الطوبولوجي: 2.5 ملي ثانية"
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-emerald-500/20 group-hover:scale-150"
          aria-hidden="true"
        />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">الاستقرار الطوبولوجي</div>
            <div className="text-3xl font-bold text-emerald-400 font-mono">
              2.5 <span className="text-lg font-normal text-emerald-500/70">ms</span>
            </div>
          </div>
          <div
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400"
            aria-hidden="true"
          >
            <Activity size={24} />
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono border-t border-white/5 pt-3 relative z-10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          معدل الخطأ:{' '}
          <span className="text-emerald-400 font-semibold">
            10<sup className="text-[9px]">-18</sup>
          </span>
        </div>
      </div>

      <div
        className="p-5 rounded-2xl relative overflow-hidden group sp-metric-card"
        role="listitem"
        aria-label="الأمن السيادي: CRYSTALS-Kyber"
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-amber-500/20 group-hover:scale-150"
          aria-hidden="true"
        />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">الأمن السيادي (PQC)</div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">CRYSTALS-Kyber</div>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400" aria-hidden="true">
            <Shield size={24} />
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono border-t border-white/5 pt-3 relative z-10 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" /> McEliece:{' '}
            <span className="text-amber-400 font-semibold">512-bit</span>
          </span>
          <span className="bg-amber-500/10 px-2 py-0.5 rounded text-amber-300">E91 Protocol</span>
        </div>
      </div>

      <div
        className="p-5 rounded-2xl relative overflow-hidden group sp-metric-card"
        role="listitem"
        aria-label="الثورة الطبية: دقة 99.8%"
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-purple-500/20 group-hover:scale-150"
          aria-hidden="true"
        />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">الثورة الطبية (QSVM)</div>
            <div className="text-3xl font-bold text-purple-400 font-mono">
              99.8<span className="text-lg font-normal text-purple-500/70">%</span>
            </div>
          </div>
          <div
            className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400"
            aria-hidden="true"
          >
            <Dna size={24} />
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono border-t border-white/5 pt-3 relative z-10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" aria-hidden="true" />
          التسريع: <span className="text-purple-400 font-semibold">143 مليون ضعف</span>
        </div>
      </div>
    </div>
  );
});

SovereignDashboard.displayName = 'SovereignDashboard';

export default SovereignDashboard;
