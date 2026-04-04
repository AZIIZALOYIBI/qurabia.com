import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Server } from 'lucide-react';
import {
  AUTDIESecurityFunction,
  type SecurityResult,
} from '../engine/QuantumCrypto';

export const QuantumCryptoModule: React.FC = () => {
  const crypto = useMemo(() => new AUTDIESecurityFunction(), []);
  const [kappa, setKappa] = useState<number>(Math.PI / 4);
  const [result, setResult] = useState<SecurityResult | null>(null);

  useEffect(() => {
    const data = crypto.compute(0, kappa, 1.0);
    setResult(data);
  }, [kappa]);

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            التشفير الكمي الموحد
          </h2>
          <p className="text-sm text-slate-400 font-mono">
            AUTDIE Security Kernel
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/10">
          <Server size={14} className="text-emerald-400" />
          <span className="text-emerald-400">نشط</span>
        </div>
      </div>

      <div className="relative z-10 flex-grow flex flex-col justify-between">
        <div className="flex items-center justify-center mb-8">
          <div
            className={`relative flex items-center justify-center w-32 h-32 rounded-full border-2 ${
              result?.secure
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-red-500/30 bg-red-500/10'
            } transition-colors duration-500`}
          >
            {result?.secure ? (
              <ShieldCheck size={64} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={64} className="text-red-400" />
            )}

            <div
              className="absolute inset-0 rounded-full animate-[spin_4s_linear_infinite]"
              style={{ border: '1px dashed rgba(255,255,255,0.2)' }}
            >
              <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
                  result?.secure ? 'bg-emerald-400' : 'bg-red-400'
                } shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">
              مستوى الأمان (CRYSTALS-Kyber)
            </div>
            <div
              className={`text-2xl font-mono ${
                result?.secure ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {result?.S_AUTDIE.toFixed(4)}
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">
              معدل الخطأ (E91 Protocol)
            </div>
            <div className="text-2xl font-mono text-white">
              {(result?.QBER_AUTDIE
                ? result.QBER_AUTDIE * 100
                : 0
              ).toFixed(2)}
              %
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                زاوية الاستقطاب (κ)
              </label>
              <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
                {(kappa / Math.PI).toFixed(2)}π
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.PI}
              step="0.01"
              value={kappa}
              onChange={(e) => setKappa(Number(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>π/2</span>
              <span>π</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex justify-between items-center">
            <span className="text-xs text-amber-400 font-mono">
              McEliece Cryptosystem
            </span>
            <span className="text-xs text-amber-200 font-mono bg-amber-500/20 px-2 py-1 rounded">
              512-bit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumCryptoModule;
