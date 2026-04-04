import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Database, Zap, ArrowRight, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { GroverSimulator } from '../engine/GroverAlgorithm';

/** Clamp target index within [0, dbSize-1]. */
function clampTarget(target: number, dbSize: number): number {
  return Math.max(0, Math.min(target, dbSize - 1));
}

export const GroverSearchModule: React.FC = () => {
  const [dbSize, setDbSize] = useState<number>(64);
  const [targetIndex, setTargetIndex] = useState<number>(42);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ index: number; probability: number }[]>(
    [],
  );

  const simulatorRef = useRef<GroverSimulator | null>(null);

  const updateChartData = useCallback((sim: GroverSimulator) => {
    const probs = sim.getProbabilities();
    const newData = probs.map((p, i) => ({
      index: i,
      probability: p * 100,
    }));
    setData(newData);
  }, []);

  const initializeSimulator = useCallback(() => {
    try {
      setError(null);
      const safeTarget = clampTarget(targetIndex, dbSize);
      const sim = new GroverSimulator(dbSize, safeTarget);
      simulatorRef.current = sim;
      setCurrentStep(0);
      setIsRunning(false);
      updateChartData(sim);
    } catch {
      setError('خطأ في تهيئة المحاكي. تحقق من حجم قاعدة البيانات والعنصر المستهدف.');
    }
  }, [dbSize, targetIndex, updateChartData]);

  useEffect(() => {
    initializeSimulator();
  }, [initializeSimulator]);

  const handleStep = useCallback(() => {
    if (simulatorRef.current) {
      try {
        simulatorRef.current.step();
        setCurrentStep((prev) => prev + 1);
        updateChartData(simulatorRef.current);
      } catch {
        setError('حدث خطأ أثناء تنفيذ الخطوة.');
        setIsRunning(false);
      }
    }
  }, [updateChartData]);

  const handleRunAuto = () => {
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning || !simulatorRef.current) return;
    const optimal = simulatorRef.current.getOptimalSteps();
    if (currentStep >= optimal) {
      setIsRunning(false);
      return;
    }
    const interval = setInterval(() => {
      handleStep();
    }, 500);
    return () => clearInterval(interval);
  }, [isRunning, currentStep, handleStep]);

  const optimalSteps = simulatorRef.current?.getOptimalSteps() ?? 0;
  const currentProb = data[targetIndex]?.probability ?? 0;

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden" role="region" aria-label="محرك البحث الكمومي Grover">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" aria-hidden="true" />

      <div className="mb-6 flex justify-between items-start z-10">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            محرك البحث الكمومي (Grover)
          </h2>
          <p className="text-sm text-slate-400 font-mono">
            O(√N) Unstructured Database Search
          </p>
        </div>
        <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-400" aria-hidden="true">
          <Search size={24} />
        </div>
      </div>

      {error && (
        <div className="sp-error-banner mb-4 z-10" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow z-10">
        <div className="md:col-span-1 space-y-6 bg-black/40 rounded-lg border border-white/5 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label htmlFor="grover-dbsize" className="block text-xs font-mono text-slate-400 mb-2">
                حجم قاعدة البيانات (N)
              </label>
              <input
                id="grover-dbsize"
                type="range"
                min="16"
                max="128"
                step="16"
                value={dbSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setDbSize(newSize);
                  setTargetIndex(Math.min(targetIndex, newSize - 1));
                }}
                className="w-full accent-yellow-500"
                disabled={isRunning}
                aria-valuenow={dbSize}
                aria-valuemin={16}
                aria-valuemax={128}
              />
              <div className="text-right text-xs font-mono text-yellow-400 mt-1" aria-live="polite">
                {dbSize} عنصر
              </div>
            </div>

            <div>
              <label htmlFor="grover-target" className="block text-xs font-mono text-slate-400 mb-2">
                العنصر المستهدف (Target)
              </label>
              <input
                id="grover-target"
                type="number"
                min="0"
                max={dbSize - 1}
                value={targetIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetIndex(clampTarget(val, dbSize));
                }}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-yellow-500/50 focus:outline-none"
                disabled={isRunning}
              />
            </div>

            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">البحث الكلاسيكي O(N):</span>
                <span className="text-red-400">
                  {Math.floor(dbSize / 2)} خطوة (متوسط)
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">البحث الكمومي O(√N):</span>
                <span className="text-emerald-400">
                  {optimalSteps} خطوات (أمثل)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleStep}
              disabled={isRunning || currentStep >= optimalSteps}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              aria-label="خطوة واحدة في خوارزمية Grover"
            >
              <ArrowRight size={16} />
              <span>خطوة واحدة (Step)</span>
            </button>
            <button
              onClick={handleRunAuto}
              disabled={isRunning || currentStep >= optimalSteps}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              aria-label="تشغيل تلقائي لخوارزمية Grover"
              aria-busy={isRunning}
            >
              <Play size={16} />
              <span>تشغيل تلقائي (Auto)</span>
            </button>
            <button
              onClick={initializeSimulator}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              aria-label="إعادة تعيين المحاكي"
            >
              <RefreshCw size={16} />
              <span>إعادة تعيين (Reset)</span>
            </button>
          </div>
        </div>

        <div className="md:col-span-2 bg-black/40 rounded-lg border border-white/5 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Database size={18} />
              <h3 className="font-mono text-sm uppercase tracking-wider">
                تضخيم السعة (Amplitude Amplification)
              </h3>
            </div>
            <div className="flex gap-4 text-xs font-mono" aria-live="polite">
              <div className="text-slate-400">
                الخطوة:{' '}
                <span className="text-white">
                  {currentStep} / {optimalSteps}
                </span>
              </div>
              <div className="text-slate-400">
                احتمال الهدف:{' '}
                <span
                  className={
                    currentProb > 50
                      ? 'text-emerald-400 font-bold'
                      : 'text-yellow-400'
                  }
                >
                  {currentProb.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex-grow min-h-[250px] w-full" role="img" aria-label={`مخطط احتمالات البحث الكمومي — احتمال الهدف: ${currentProb.toFixed(2)}%`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="index"
                  stroke="#475569"
                  fontSize={10}
                  tickFormatter={(val) => (val % 8 === 0 ? val : '')}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    'Probability',
                  ]}
                  labelFormatter={(label) => `Index: ${label}`}
                />
                <Bar dataKey="probability" isAnimationActive={false}>
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === targetIndex ? '#10b981' : '#3b82f6'}
                      fillOpacity={index === targetIndex ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {currentStep >= optimalSteps && optimalSteps > 0 && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-400 animate-pulse" role="status">
              <Zap size={20} />
              <span className="text-sm font-medium">
                تم العثور على العنصر بنجاح! احتمال القياس:{' '}
                {currentProb.toFixed(2)}% في {currentStep} خطوات فقط.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroverSearchModule;
