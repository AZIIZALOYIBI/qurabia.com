import React, { useState, useCallback } from 'react';
import { BrainCircuit, Play, Activity } from 'lucide-react';
import { trainQNN } from '../engine/QuantumNeuralNetwork';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const QuantumNeuralNetworkModule: React.FC = () => {
  const [epochs, setEpochs] = useState<number>(100);
  const [convergenceRate, setConvergenceRate] = useState<number>(2.8);
  const [quantumPower, setQuantumPower] = useState<number | string>(10);
  const [powerError, setPowerError] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<
    { epoch: number; accuracy: number; loss: number }[]
  >([]);
  const [finalAccuracy, setFinalAccuracy] = useState<number | null>(null);

  const handleQuantumPowerChange = (value: string) => {
    if (value === '') {
      setQuantumPower('');
      setPowerError('الرجاء إدخال قيمة.');
      return;
    }

    const power = Number(value);

    if (!Number.isInteger(power) || power <= 0) {
      setPowerError(
        'خطأ: يجب أن تكون قوة الكم رقماً صحيحاً وموجباً (Positive Integer).',
      );
      setQuantumPower(value);
      return;
    }

    if (power > 1000) {
      setPowerError(
        'تحذير: القوة القصوى المدعومة في هذا الإصدار هي 1000.',
      );
      setQuantumPower(power);
      return;
    }

    setPowerError('');
    setQuantumPower(power);
  };

  const startTraining = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setProgress([]);
    setFinalAccuracy(null);

    const data: { epoch: number; accuracy: number; loss: number }[] = [];

    const result = await trainQNN(
      epochs,
      convergenceRate,
      (epoch, accuracy, loss) => {
        data.push({ epoch, accuracy, loss });
        if (epoch % 5 === 0 || epoch === epochs) {
          setProgress([...data]);
        }
      },
    );

    setFinalAccuracy(result.finalAccuracy);
    setRunning(false);
  }, [epochs, convergenceRate, running]);

  return (
    <div
      className="p-6 flex flex-col h-full relative overflow-hidden"
      style={{
        background: '#151619',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
      }}
    >
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            الشبكات العصبية الكمومية
          </h2>
          <p className="text-sm text-slate-400 font-mono">
            QNN Training Engine
          </p>
        </div>
        <div
          className={`p-3 rounded-full ${
            running
              ? 'bg-blue-500/20 text-blue-400 animate-pulse'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          <BrainCircuit size={24} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            الدقة الحالية
          </div>
          <div className="text-2xl font-mono text-white">
            {progress.length > 0
              ? progress[progress.length - 1].accuracy.toFixed(2)
              : '0.00'}
            %
          </div>
        </div>
        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            الخسارة (Loss)
          </div>
          <div className="text-2xl font-mono text-orange-400">
            {progress.length > 0
              ? progress[progress.length - 1].loss.toFixed(4)
              : '0.0000'}
          </div>
        </div>
        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            الدقة النهائية
          </div>
          <div className="text-2xl font-mono text-emerald-400">
            {finalAccuracy !== null
              ? finalAccuracy.toFixed(2) + '%'
              : '---'}
          </div>
        </div>
      </div>

      <div className="flex-grow min-h-[150px] w-full mb-6 bg-black/20 rounded-lg p-2 border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={progress}
            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2a2d36"
              vertical={false}
            />
            <XAxis
              dataKey="epoch"
              stroke="#8E9299"
              fontSize={10}
              tick={{ fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="#8E9299"
              fontSize={10}
              tick={{ fontFamily: 'monospace' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e2128',
                border: '1px solid #333',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="الدقة %"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="loss"
              name="الخسارة"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                عدد الدورات (Epochs)
              </label>
              <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
                {epochs}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              disabled={running}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                معدل التقارب
              </label>
              <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
                {convergenceRate.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              value={convergenceRate}
              onChange={(e) => setConvergenceRate(Number(e.target.value))}
              disabled={running}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
            />
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                قوة الكم (Qubits)
              </label>
              <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
                {quantumPower}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={quantumPower}
              onChange={(e) => handleQuantumPowerChange(e.target.value)}
              disabled={running}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-white font-mono text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            {powerError && (
              <p className="text-[10px] text-red-400 mt-1 leading-tight">
                {powerError}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={startTraining}
          disabled={running || powerError !== ''}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            running || powerError !== ''
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/20'
          }`}
        >
          {running ? (
            <>
              <Activity size={18} className="animate-spin" />
              <span>جاري التدريب...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>بدء التدريب الكمومي</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuantumNeuralNetworkModule;
