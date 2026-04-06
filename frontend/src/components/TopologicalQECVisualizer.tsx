import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, RefreshCcw, Activity } from 'lucide-react';
import { ToricCodeSimulator, type QECStats } from '../engine/TopologicalQEC';

/** معدل الخطأ الفيزيائي الافتراضي */
const DEFAULT_ERROR_RATE = 0.05;

export const TopologicalQECVisualizer: React.FC = () => {
  const [latticeSize, setLatticeSize] = useState<number>(10);
  const [physicalErrorRate, setPhysicalErrorRate] = useState<number>(DEFAULT_ERROR_RATE);
  const [running, setRunning] = useState<boolean>(false);
  const [grid, setGrid] = useState<number[][]>([]);
  const [stats, setStats] = useState({ cycle: 0, errors: 0, corrected: 0 });
  /** إحصائيات تراكمية من المحرك (مستوحى من panqec/PyMatching) */
  const [qecStats, setQecStats] = useState<QECStats | null>(null);
  const simulatorRef = useRef<ToricCodeSimulator | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const initializeSimulator = useCallback(() => {
    stopSimulation();
    const sim = new ToricCodeSimulator({ latticeSize, physicalErrorRate });
    sim.initializeGroundState();
    simulatorRef.current = sim;
    setGrid(sim.grid);
    setStats({ cycle: 0, errors: 0, corrected: 0 });
    setQecStats(null);
  }, [latticeSize, physicalErrorRate, stopSimulation]);

  useEffect(() => {
    initializeSimulator();
    return () => stopSimulation();
  }, [initializeSimulator, stopSimulation]);

  const startSimulation = () => {
    if (!simulatorRef.current || running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      const result = simulatorRef.current!.simulateErrorCorrectionCycle();
      setGrid([...result.grid]);
      setStats((prev) => ({
        cycle: prev.cycle + 1,
        errors: prev.errors + result.errorCount,
        corrected: prev.corrected + result.correctedCount,
      }));
      setQecStats(simulatorRef.current!.getStats());
    }, 300);
  };

  /** هل معدل الخطأ الحالي أقل من عتبة Toric Code (10.3%)؟ */
  const isBelowThreshold = physicalErrorRate < 0.103;

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            تصحيح الأخطاء الطوبولوجي
          </h2>
          <p className="text-sm text-slate-400 font-mono">
            Toric Code QEC Simulator
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* مؤشر العتبة — مستوحى من panqec/PyMatching */}
          <span
            className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
              isBelowThreshold
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/40 bg-red-500/10 text-red-400'
            }`}
          >
            {isBelowThreshold ? '↓ عتبة' : '↑ عتبة'}
          </span>
          <button
            onClick={running ? stopSimulation : startSimulation}
            className={`p-2 rounded-lg ${
              running
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
            aria-label={running ? 'إيقاف المحاكاة' : 'بدء المحاكاة'}
          >
            {running ? <Square size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={initializeSimulator}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            aria-label="إعادة التهيئة"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* الإحصائيات الأساسية */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            الدورة
          </div>
          <div className="text-xl font-mono text-white">{stats.cycle}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            الأخطاء
          </div>
          <div className="text-xl font-mono text-red-400">{stats.errors}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            المصححة
          </div>
          <div className="text-xl font-mono text-emerald-400">
            {stats.corrected}
          </div>
        </div>
      </div>

      {/* الإحصائيات التراكمية المتقدمة — مستوحى من panqec */}
      {qecStats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={11} className="text-violet-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">معدل التصحيح</span>
            </div>
            <div className="text-base font-mono text-violet-400">
              {(qecStats.correctionRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={11} className="text-amber-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">أطول عمر منطقي</span>
            </div>
            <div className="text-base font-mono text-amber-400">
              {qecStats.longestLogicalLifetime} دورة
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow flex items-center justify-center mb-4">
        <div
          className="grid gap-1 p-2 bg-black/50 rounded-lg border border-white/5"
          style={{
            gridTemplateColumns: `repeat(${latticeSize}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-4 h-4 sm:w-6 sm:h-6 rounded-sm transition-colors duration-300 ${
                  cell === 0
                    ? 'bg-slate-800'
                    : cell === 1
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              />
            )),
          )}
        </div>
      </div>

      {/* مفتاح الألوان */}
      <div className="flex gap-4 justify-center mb-4 text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block border border-white/10" />
          سليم
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          خطأ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          مُصحَّح
        </span>
      </div>

      {/* التحكم في معلمات المحاكاة */}
      <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5 grid gap-3">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              حجم الشبكة
            </label>
            <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
              {latticeSize}×{latticeSize}
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={latticeSize}
            onChange={(e) => setLatticeSize(Number(e.target.value))}
            disabled={running}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
          />
        </div>

        {/* معدل الخطأ الفيزيائي — مستوحى من panqec/PyMatching */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              معدل الخطأ الفيزيائي
            </label>
            <span
              className={`text-xs font-mono px-2 py-1 rounded ${
                isBelowThreshold
                  ? 'text-emerald-400 bg-emerald-900/40'
                  : 'text-red-400 bg-red-900/40'
              }`}
            >
              p = {(physicalErrorRate * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.20"
            step="0.005"
            value={physicalErrorRate}
            onChange={(e) => setPhysicalErrorRate(Number(e.target.value))}
            disabled={running}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
          />
          <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-600">
            <span>1%</span>
            {/* العتبة النظرية: 10.3% — مستوحى من panqec */}
            <span className="text-amber-500/70">عتبة Toric: 10.3%</span>
            <span>20%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopologicalQECVisualizer;
