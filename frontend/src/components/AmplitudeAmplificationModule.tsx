import { Play, RefreshCw, TrendingUp, Zap } from 'lucide-react';
/**
 * AmplitudeAmplificationModule — واجهة تضخيم السعة الكمومي
 *
 * مستوحى من:
 * - PennyLane — tutorial_intro_amplitude_amplification
 * - Qiskit — AmplitudeAmplification
 * - Amazon Braket — Quantum_Amplitude_Amplification.ipynb
 */
import type React from 'react';
import { useCallback, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type OracleType,
  type QAAResult,
  compareQAATypes,
  qaaChartData,
  runAmplitudeAmplification,
} from '../engine/AmplitudeAmplification';

export const AmplitudeAmplificationModule: React.FC = () => {
  const [searchSpaceSize, setSearchSpaceSize] = useState<number>(64);
  const [numSolutions, setNumSolutions] = useState<number>(1);
  const [oracleType, setOracleType] = useState<OracleType>('grover');
  const [result, setResult] = useState<QAAResult | null>(null);
  const [running, setRunning] = useState(false);

  const oracleOptions = compareQAATypes();

  const handleRun = useCallback(() => {
    setRunning(true);
    setResult(null);

    setTimeout(() => {
      try {
        const res = runAmplitudeAmplification({
          searchSpaceSize,
          numSolutions: Math.min(numSolutions, searchSpaceSize - 1),
          oracleType,
          targetProbability: 0.99,
        });
        setResult(res);
      } catch (_) {
        // خطأ في المدخلات — تجاهل
      } finally {
        setRunning(false);
      }
    }, 400);
  }, [searchSpaceSize, numSolutions, oracleType]);

  const chartData = result ? qaaChartData(result) : [];

  // N قوى اثنين للعرض في القائمة
  const spaceSizes = [16, 32, 64, 128, 256, 512, 1024];

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden">
      {/* خلفية */}
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
            <h2 className="text-xl font-semibold text-white mb-1">تضخيم السعة الكمومي</h2>
            <p className="text-sm text-slate-400 font-mono">Quantum Amplitude Amplification (QAA)</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/10">
            <Zap size={13} className="text-violet-400" />
            <span className="text-violet-400">O(√N)</span>
          </div>
        </div>

        {/* الإعدادات */}
        <div className="grid grid-cols-1 gap-4">
          {/* نوع Oracle */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
              نوع Oracle
            </label>
            <div className="grid grid-cols-2 gap-2">
              {oracleOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.oracleType}
                  onClick={() => setOracleType(opt.oracleType)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    oracleType === opt.oracleType
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                      : 'border-white/10 bg-black/20 text-slate-500 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-mono leading-tight">{opt.label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{opt.bestCase}</div>
                </button>
              ))}
            </div>
          </div>

          {/* حجم الفضاء */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-white/5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
                حجم الفضاء N
              </label>
              <select
                value={searchSpaceSize}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setSearchSpaceSize(n);
                  if (numSolutions >= n) setNumSolutions(1);
                }}
                className="w-full bg-black/40 border border-white/10 text-white text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500/50"
              >
                {spaceSizes.map((n) => (
                  <option key={n} value={n}>
                    N = {n} (2^{Math.log2(n)})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-lg border border-white/5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
                عدد الحلول M
              </label>
              <input
                type="number"
                min={1}
                max={Math.floor(searchSpaceSize / 2)}
                value={numSolutions}
                onChange={(e) =>
                  setNumSolutions(Math.max(1, Math.min(Number(e.target.value), Math.floor(searchSpaceSize / 2))))
                }
                className="w-full bg-black/40 border border-white/10 text-white text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-500/50"
              />
              <div className="text-[9px] text-slate-600 mt-1">
                نسبة الحلول: {((numSolutions / searchSpaceSize) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* زر التشغيل */}
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-sm font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              جارٍ التضخيم...
            </>
          ) : (
            <>
              <Play size={14} />
              تشغيل تضخيم السعة
            </>
          )}
        </button>

        {/* النتائج */}
        {result && (
          <div className="flex flex-col gap-4">
            {/* مقاييس رئيسية */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  الاحتمال النهائي
                </div>
                <div
                  className={`text-xl font-mono font-bold ${
                    result.finalSuccessProbability > 0.9
                      ? 'text-emerald-400'
                      : result.finalSuccessProbability > 0.5
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {(result.finalSuccessProbability * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">التكرارات</div>
                <div className="text-xl font-mono font-bold text-violet-400">{result.executedIterations}</div>
                <div className="text-[9px] text-slate-600">تكرار</div>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">التسريع</div>
                <div className="text-xl font-mono font-bold text-amber-400">×{result.quantumSpeedup.toFixed(1)}</div>
                <div className="text-[9px] text-slate-600">كمومي/كلاسيكي</div>
              </div>
            </div>

            {/* التعقيد */}
            <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] font-mono text-violet-400 uppercase tracking-wider mb-1">كمومي</div>
                <div className="text-[10px] font-mono text-slate-300">{result.quantumComplexity}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-red-400 uppercase tracking-wider mb-1">كلاسيكي</div>
                <div className="text-[10px] font-mono text-slate-300">{result.classicalComplexity}</div>
              </div>
            </div>

            {/* رسم احتمال النجاح عبر التكرارات */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-violet-400" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  احتمال النجاح عبر التكرارات
                </span>
              </div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="iteration"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: 'تكرار',
                        position: 'insideBottomRight',
                        offset: -8,
                        fill: 'rgba(255,255,255,0.3)',
                        fontSize: 9,
                      }}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                      labelFormatter={(v) => `تكرار ${v}`}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name === 'successProbability' ? 'احتمال النجاح' : 'احتمال الفشل',
                      ]}
                    />
                    <ReferenceLine y={90} stroke="rgba(16,185,129,0.3)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="successProbability"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#8b5cf6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="failureProbability"
                      stroke="rgba(239,68,68,0.5)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-1 justify-center text-[9px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-violet-500 inline-block" />
                  <span className="text-slate-400">احتمال النجاح</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-red-500/50 inline-block" style={{ borderTop: '1px dashed' }} />
                  <span className="text-slate-400">احتمال الفشل</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-emerald-500/40 inline-block" style={{ borderTop: '1px dashed' }} />
                  <span className="text-slate-400">حد 90%</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmplitudeAmplificationModule;
