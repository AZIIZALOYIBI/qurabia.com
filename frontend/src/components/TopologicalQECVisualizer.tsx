import { Activity, Play, RefreshCcw, Square } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type CodeType, type QECStats, type ToricCodeSimulator, createQECSimulator } from '../engine/TopologicalQEC';

/** معدل الخطأ الفيزيائي الافتراضي */
const DEFAULT_ERROR_RATE = 0.05;

/** تكوين أنواع الأكواد */
const CODE_TYPES: { id: CodeType; label: string; color: string; threshold: number }[] = [
  { id: 'toric', label: 'Toric', color: '#8b5cf6', threshold: 10.3 },
  { id: 'surface', label: 'Surface', color: '#3b82f6', threshold: 1.0 },
  { id: 'color', label: 'Color', color: '#10b981', threshold: 10.9 },
];

/** لون الخلية حسب قيمتها */
function getCellColor(cell: number): string {
  switch (cell) {
    case 0:
      return 'bg-slate-800';
    case 1:
      return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    case 2:
      return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
    case 3:
      return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]';
    case 4:
      return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]';
    default:
      return 'bg-slate-800';
  }
}

export const TopologicalQECVisualizer: React.FC = () => {
  const [latticeSize, setLatticeSize] = useState<number>(10);
  const [physicalErrorRate, setPhysicalErrorRate] = useState<number>(DEFAULT_ERROR_RATE);
  const [running, setRunning] = useState<boolean>(false);
  const [grid, setGrid] = useState<number[][]>([]);
  const [stats, setStats] = useState({ cycle: 0, errors: 0, corrected: 0 });
  /** إحصائيات تراكمية من المحرك */
  const [qecStats, setQecStats] = useState<QECStats | null>(null);
  /** نوع الكود المختار */
  const [codeType, setCodeType] = useState<CodeType>('toric');
  /** إحصائيات X/Y/Z */
  const [errorStats, setErrorStats] = useState({ x: 0, y: 0, z: 0 });

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
    const sim = createQECSimulator(codeType, { latticeSize, physicalErrorRate });
    sim.initializeGroundState();
    simulatorRef.current = sim;
    setGrid(sim.grid);
    setStats({ cycle: 0, errors: 0, corrected: 0 });
    setQecStats(null);
    setErrorStats({ x: 0, y: 0, z: 0 });
  }, [latticeSize, physicalErrorRate, codeType, stopSimulation]);

  useEffect(() => {
    initializeSimulator();
    return () => stopSimulation();
  }, [initializeSimulator, stopSimulation]);

  const startSimulation = () => {
    if (!simulatorRef.current || running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      const result = simulatorRef.current?.simulateErrorCorrectionCycle();
      if (!result) return;
      setGrid([...result.grid]);
      setStats((prev) => ({
        cycle: prev.cycle + 1,
        errors: prev.errors + result.errorCount,
        corrected: prev.corrected + result.correctedCount,
      }));
      setErrorStats((prev) => ({
        x: prev.x + result.xErrors,
        y: prev.y + result.yErrors,
        z: prev.z + result.zErrors,
      }));
      setQecStats(simulatorRef.current?.getStats() ?? null);
    }, 300);
  };

  /** العتبة النظرية للكود الحالي */
  const currentCodeConfig = CODE_TYPES.find((c) => c.id === codeType)!;
  const isBelowThreshold = physicalErrorRate * 100 < currentCodeConfig.threshold;

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden" dir="rtl">
      {/* ─── الرأس ─── */}
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">تصحيح الأخطاء الطوبولوجي</h2>
          <p className="text-sm text-slate-400 font-mono">Topological QEC Simulator</p>
        </div>
        <div className="flex gap-2 items-center">
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
            type="button"
            onClick={running ? stopSimulation : startSimulation}
            className={`p-2 rounded-lg ${
              running ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
            aria-label={running ? 'إيقاف المحاكاة' : 'بدء المحاكاة'}
          >
            {running ? <Square size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            onClick={initializeSimulator}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            aria-label="إعادة التهيئة"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* ─── اختيار نوع الكود ─── */}
      <div className="flex gap-2 mb-3">
        {CODE_TYPES.map((code) => (
          <button
            type="button"
            key={code.id}
            onClick={() => !running && setCodeType(code.id)}
            disabled={running}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all disabled:opacity-50 ${
              codeType === code.id
                ? 'text-white border-transparent'
                : 'text-slate-400 border-slate-700 bg-transparent hover:border-slate-500'
            }`}
            style={codeType === code.id ? { backgroundColor: code.color, borderColor: code.color } : {}}
          >
            {code.label} Code
          </button>
        ))}
        <span className="text-[10px] font-mono text-slate-600 flex items-center mr-auto">
          عتبة: {currentCodeConfig.threshold}%
        </span>
      </div>

      {/* ─── إحصائيات X/Y/Z ─── */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">الدورة</div>
          <div className="text-lg font-mono text-white">{stats.cycle}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-red-900/30 text-center">
          <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-1">X Errors</div>
          <div className="text-lg font-mono text-red-400">{errorStats.x}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-purple-900/30 text-center">
          <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-1">Y Errors</div>
          <div className="text-lg font-mono text-purple-400">{errorStats.y}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-blue-900/30 text-center">
          <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">Z Errors</div>
          <div className="text-lg font-mono text-blue-400">{errorStats.z}</div>
        </div>
      </div>

      {/* ─── الإحصائيات التراكمية المتقدمة ─── */}
      {qecStats && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={11} className="text-violet-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">معدل التصحيح</span>
            </div>
            <div className="text-base font-mono text-violet-400">{(qecStats.correctionRate * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={11} className="text-amber-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">أطول عمر منطقي</span>
            </div>
            <div className="text-base font-mono text-amber-400">{qecStats.longestLogicalLifetime} دورة</div>
          </div>
        </div>
      )}

      {/* ─── خريطة الحرارة (Heatmap) ─── */}
      <div className="flex-grow flex items-center justify-center mb-4">
        <div
          className="grid gap-0.5 p-2 bg-black/50 rounded-lg border border-white/5"
          style={{ gridTemplateColumns: `repeat(${latticeSize}, minmax(0, 1fr))` }}
        >
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-all duration-200 ${getCellColor(cell)}`}
                title={`[${i},${j}] = ${cell}`}
              />
            )),
          )}
        </div>
      </div>

      {/* ─── مفتاح الألوان المحدّث ─── */}
      <div className="flex gap-3 justify-center mb-4 flex-wrap text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block border border-white/10" />
          سليم
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          خطأ X
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          خطأ Z
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
          خطأ Y
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          مُصحَّح
        </span>
      </div>

      {/* ─── التحكم في المعلمات ─── */}
      <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5 grid gap-3">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">حجم الشبكة</label>
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

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">معدل الخطأ الفيزيائي</label>
            <span
              className={`text-xs font-mono px-2 py-1 rounded ${
                isBelowThreshold ? 'text-emerald-400 bg-emerald-900/40' : 'text-red-400 bg-red-900/40'
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
            <span className="text-amber-500/70">
              عتبة {currentCodeConfig.label}: {currentCodeConfig.threshold}%
            </span>
            <span>20%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopologicalQECVisualizer;
