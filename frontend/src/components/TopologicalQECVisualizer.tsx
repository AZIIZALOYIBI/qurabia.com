import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, RefreshCcw } from 'lucide-react';
import { ToricCodeSimulator } from '../engine/TopologicalQEC';

export const TopologicalQECVisualizer: React.FC = () => {
  const [latticeSize, setLatticeSize] = useState<number>(10);
  const [running, setRunning] = useState<boolean>(false);
  const [grid, setGrid] = useState<number[][]>([]);
  const [stats, setStats] = useState({ cycle: 0, errors: 0, corrected: 0 });
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
    const sim = new ToricCodeSimulator({ latticeSize, physicalErrorRate: 0.05 });
    sim.initializeGroundState();
    simulatorRef.current = sim;
    setGrid(sim.grid);
    setStats({ cycle: 0, errors: 0, corrected: 0 });
  }, [latticeSize, stopSimulation]);

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
    }, 300);
  };

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
        <div className="flex gap-2">
          <button
            onClick={running ? stopSimulation : startSimulation}
            className={`p-2 rounded-lg ${
              running
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {running ? <Square size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={initializeSimulator}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
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

      <div className="flex-grow flex items-center justify-center mb-6">
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

      <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
        <div className="flex justify-between mb-2">
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            حجم الشبكة (Lattice Size)
          </label>
          <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
            {latticeSize}x{latticeSize}
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
    </div>
  );
};

export default TopologicalQECVisualizer;
