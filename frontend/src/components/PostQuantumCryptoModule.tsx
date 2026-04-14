import { ChevronDown, ChevronUp, Key, Lock, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
/**
 * PostQuantumCryptoModule — واجهة التشفير ما بعد الكمومي
 *
 * مستوحى من:
 * - pq-crystals/kyber
 * - sz3/libmcleece
 * - aabmets/quantcrypt
 */
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type KyberSecurityLevel,
  type PQCAnalysisResult,
  comparePQCAlgorithms,
  runPQCAnalysis,
  securityStrengthReport,
} from '../engine/PostQuantumCrypto';

export const PostQuantumCryptoModule: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<'kyber' | 'mceliece'>('kyber');
  const [kyberLevel, setKyberLevel] = useState<KyberSecurityLevel>(768);
  const [result, setResult] = useState<PQCAnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const comparison = useMemo(() => comparePQCAlgorithms(), []);

  const handleRun = useCallback(() => {
    setRunning(true);
    // محاكاة تأخير الحساب
    setTimeout(() => {
      const res = runPQCAnalysis(algorithm, kyberLevel);
      setResult(res);
      setRunning(false);
    }, 600);
  }, [algorithm, kyberLevel]);

  const strengthReport = result ? securityStrengthReport(result.keyPair.securityLevel) : null;

  // ألوان الأعمدة في الرسم البياني
  const barColor = (quantumResistant: boolean) => (quantumResistant ? '#10b981' : '#ef4444');

  // بيانات الرسم البياني — مقارنة أحجام المفاتيح
  const chartData = comparison
    .filter((c) => ['RSA-2048', 'Kyber-512', 'Kyber-768', 'Kyber-1024'].includes(c.algorithm))
    .map((c) => ({
      name: c.algorithm.replace('CRYSTALS-', ''),
      publicKey: Math.round(c.publicKeyBytes / 100) / 10, // KB
      ciphertext: Math.round(c.ciphertextBytes / 100) / 10,
      quantumResistant: c.quantumResistant,
    }));

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden">
      {/* خلفية نقطية */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex flex-col gap-5 h-full">
        {/* الترويسة */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">التشفير ما بعد الكمومي</h2>
            <p className="text-sm text-slate-400 font-mono">Post-Quantum Cryptography (PQC)</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/10">
            <Lock size={13} className="text-amber-400" />
            <span className="text-amber-400">مقاوم للكم</span>
          </div>
        </div>

        {/* اختيار الخوارزمية */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAlgorithm('kyber')}
            className={`p-3 rounded-lg border text-sm font-mono transition-colors ${
              algorithm === 'kyber'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/20'
            }`}
          >
            CRYSTALS-Kyber
          </button>
          <button
            type="button"
            onClick={() => setAlgorithm('mceliece')}
            className={`p-3 rounded-lg border text-sm font-mono transition-colors ${
              algorithm === 'mceliece'
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/20'
            }`}
          >
            McEliece
          </button>
        </div>

        {/* مستوى أمان Kyber */}
        {algorithm === 'kyber' && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">مستوى الأمان</label>
            <div className="grid grid-cols-3 gap-2">
              {([512, 768, 1024] as KyberSecurityLevel[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setKyberLevel(level)}
                  className={`py-2 rounded-lg text-xs font-mono border transition-colors ${
                    kyberLevel === level
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-black/20 text-slate-500 hover:border-white/20'
                  }`}
                >
                  Kyber-{level}
                  <br />
                  <span className="text-[10px] opacity-70">
                    {level === 512 ? '128-bit' : level === 768 ? '192-bit' : '256-bit'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* زر التشغيل */}
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-sm font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              جارٍ توليد المفاتيح...
            </>
          ) : (
            <>
              <Key size={14} />
              توليد المفاتيح وتشغيل KEM
            </>
          )}
        </button>

        {/* النتائج */}
        {result && strengthReport && (
          <div className="flex flex-col gap-4">
            {/* حالة الأمان */}
            <div
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                strengthReport.level === 'maximum' || strengthReport.level === 'high'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : strengthReport.level === 'medium'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              {strengthReport.level === 'maximum' || strengthReport.level === 'high' ? (
                <ShieldCheck size={32} className="text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert size={32} className="text-amber-400 shrink-0" />
              )}
              <div>
                <div className="text-sm font-semibold text-white">{result.keyPair.algorithm}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {strengthReport.label} — {result.keyPair.securityLevel} بت
                </div>
                <div className="text-xs text-slate-500 mt-1">{strengthReport.yearsToBreak}</div>
              </div>
            </div>

            {/* مقاييس المفاتيح */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">المفتاح العام</div>
                <div className="text-lg font-mono text-white">{result.keyPair.publicKeySize.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">بايت</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">المفتاح الخاص</div>
                <div className="text-lg font-mono text-white">{result.keyPair.privateKeySize.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">بايت</div>
              </div>

              {result.kemResult && (
                <>
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      النص المشفر (KEM)
                    </div>
                    <div className="text-lg font-mono text-white">
                      {result.kemResult.ciphertextSize.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">بايت</div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      المفتاح المشترك
                    </div>
                    <div className="text-lg font-mono text-emerald-400">{result.kemResult.sharedSecretSize * 8} بت</div>
                    <div className="text-[10px] text-slate-500">{result.kemResult.executionTimeMs.toFixed(2)} ms</div>
                  </div>
                </>
              )}

              {result.mcElieceResult && (
                <>
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      النص المشفر
                    </div>
                    <div className="text-lg font-mono text-white">{result.mcElieceResult.ciphertextBytes}</div>
                    <div className="text-[10px] text-slate-500">بايت</div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      قدرة تصحيح الأخطاء
                    </div>
                    <div className="text-lg font-mono text-amber-400">
                      t = {result.mcElieceResult.errorCorrectionCapacity}
                    </div>
                    <div className="text-[10px] text-slate-500">كود Goppa</div>
                  </div>
                </>
              )}
            </div>

            {/* التوصية */}
            <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">التوصية</div>
              <p className="text-xs text-slate-300 leading-relaxed" dir="rtl">
                {result.recommendation}
              </p>
            </div>

            {/* رسم بياني — مقارنة أحجام المفاتيح */}
            <div>
              <button
                type="button"
                onClick={() => setShowComparison((v) => !v)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-white/5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                مقارنة الخوارزميات — حجم المفتاح العام (KB)
                {showComparison ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showComparison && (
                <div className="mt-3" style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        unit="KB"
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                        formatter={(value: number, name: string) => [
                          `${value} KB`,
                          name === 'publicKey' ? 'المفتاح العام' : 'النص المشفر',
                        ]}
                      />
                      <Bar dataKey="publicKey" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={barColor(entry.quantumResistant)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 justify-center text-[10px] font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                      <span className="text-slate-400">مقاوم للكم</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                      <span className="text-slate-400">قابل للكسر كمومياً</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostQuantumCryptoModule;
