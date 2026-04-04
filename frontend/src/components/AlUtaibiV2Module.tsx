import React, { useState, useCallback } from 'react';
import { Zap, Activity } from 'lucide-react';
import {
  AlUtaibiEquationV2,
  type AlUtaibiV2Result,
} from '../engine/AlUtaibiEquationV2';

const engine = new AlUtaibiEquationV2();

export const AlUtaibiV2Module: React.FC = () => {
  const [radius, setRadius] = useState<number>(1.616e-35);
  const [rhoDm, setRhoDm] = useState<number>(1.8e10);
  const [rhoDe, setRhoDe] = useState<number>(1e-10);
  const [result, setResult] = useState<AlUtaibiV2Result | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = engine.compute_total_energy(radius, rhoDm, rhoDe);
      setResult(data);
      setLoading(false);
    }, 300);
  }, [radius, rhoDm, rhoDe]);

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="mb-6 flex justify-between items-start z-10">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            التوائم الرقمية للكون
          </h2>
          <p className="text-sm text-slate-400 font-mono">
            معادلة العتيبي الموحدة (Cosmic Physics Unification)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow z-10">
        <div className="space-y-4">
          <div className="bg-black/40 p-4 rounded-lg border border-white/5">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              نصف القطر (r) — مقياس بلانك
            </label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
              step="1e-36"
            />
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Default: 1.616e-35 m
            </p>
          </div>

          <div className="bg-black/40 p-4 rounded-lg border border-white/5">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              كثافة المادة المظلمة (ρ_dm)
            </label>
            <input
              type="number"
              value={rhoDm}
              onChange={(e) => setRhoDm(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="bg-black/40 p-4 rounded-lg border border-white/5">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              كثافة الطاقة المظلمة (ρ_de)
            </label>
            <input
              type="number"
              value={rhoDe}
              onChange={(e) => setRhoDe(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              loading
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20'
            }`}
          >
            {loading ? (
              <Activity size={18} className="animate-spin" />
            ) : (
              <Zap size={18} />
            )}
            <span>حساب الطاقة الكونية</span>
          </button>
        </div>

        <div className="bg-black/60 rounded-lg border border-white/10 p-4 font-mono text-sm overflow-auto">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
            نتائج التوحيد الفيزيائي
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">الطاقة الأساسية (v1.0):</span>
                <span className="text-blue-400">
                  {result.E_v1.toExponential(3)} J
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">تصحيح القطاع المظلم:</span>
                <span className="text-orange-400">
                  {result.dark_correction.toExponential(3)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">تأثير الدالة الموجية:</span>
                <span className="text-emerald-400">
                  {result.qm_effect.toFixed(3)}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t border-white/10">
                <div className="text-xs text-slate-500 mb-1">
                  الطاقة الكلية v2.0 (E_TOTAL)
                </div>
                <div className="text-2xl text-purple-400 font-bold">
                  {result.E_total.toExponential(3)} J
                </div>
                <div className="text-sm text-pink-400 mt-1">
                  {result.eV.toExponential(3)} eV
                </div>
              </div>
              {result.qm_effect < 1.0 && (
                <div className="mt-4 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs">
                  [Singularity Suppressed] تم تثبيط الانحناء اللانهائي بنجاح
                  عند مقياس بلانك.
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-center">
              اضغط على زر الحساب لتشغيل معادلة العتيبي v2.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlUtaibiV2Module;
