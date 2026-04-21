import { Activity, BrainCircuit, Play } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type ArchitectureType,
  NoiseSimulator,
  type NumQubitsOption,
  getArchitectureInfo,
  trainQNN,
} from '../engine/QuantumNeuralNetwork';

/** أنواع المعماريات المتاحة */
const ARCHITECTURES: { id: ArchitectureType; label: string; color: string }[] = [
  { id: 'standard', label: 'Standard', color: '#3b82f6' },
  { id: 'vqe', label: 'VQE', color: '#8b5cf6' },
  { id: 'qaoa', label: 'QAOA', color: '#06b6d4' },
];

/** خيارات عدد الكيوبتات */
const QUBIT_OPTIONS: NumQubitsOption[] = [16, 32, 64];

export const QuantumNeuralNetworkModule: React.FC = () => {
  const [epochs, setEpochs] = useState<number>(100);
  const [convergenceRate, setConvergenceRate] = useState<number>(2.8);
  const [quantumPower, setQuantumPower] = useState<number | string>(10);
  const [powerError, setPowerError] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ epoch: number; accuracy: number; loss: number; gradientNorm?: number }[]>(
    [],
  );
  const [finalAccuracy, setFinalAccuracy] = useState<number | null>(null);

  /** المعمارية المختارة */
  const [architecture, setArchitecture] = useState<ArchitectureType>('standard');
  /** عدد الكيوبتات المختار */
  const [numQubits, setNumQubits] = useState<NumQubitsOption>(16);
  /** حالة محاكاة الضوضاء */
  const [noiseEnabled, setNoiseEnabled] = useState<boolean>(false);
  /** معدل الضوضاء (0-20%) */
  const [noiseRate, setNoiseRate] = useState<number>(5);
  /** دقة ما بعد الضوضاء */
  const [noisyAccuracy, setNoisyAccuracy] = useState<number | null>(null);

  /** معلومات المعمارية الحالية */
  const archInfo = getArchitectureInfo(architecture, numQubits, 3);

  const handleQuantumPowerChange = (value: string) => {
    if (value === '') {
      setQuantumPower('');
      setPowerError('الرجاء إدخال قيمة.');
      return;
    }

    const power = Number(value);

    if (!Number.isInteger(power) || power <= 0) {
      setPowerError('خطأ: يجب أن تكون قوة الكم رقماً صحيحاً وموجباً (Positive Integer).');
      setQuantumPower(value);
      return;
    }

    if (power > 1000) {
      setPowerError('تحذير: القوة القصوى المدعومة في هذا الإصدار هي 1000.');
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
    setNoisyAccuracy(null);

    const data: { epoch: number; accuracy: number; loss: number; gradientNorm: number }[] = [];

    const result = await trainQNN(epochs, convergenceRate, (epoch, accuracy, loss) => {
      // محاكاة معيار التدرجات
      const gradientNorm = Math.max(0.01, 1.5 * Math.exp(-epoch / (epochs * 0.3)) + Math.random() * 0.1);
      data.push({ epoch, accuracy, loss, gradientNorm });
      if (epoch % 5 === 0 || epoch === epochs) {
        setProgress([...data]);
      }
    });

    // تطبيق الضوضاء إذا كانت مفعّلة
    if (noiseEnabled) {
      const noiseResult = NoiseSimulator.applyDepolarizingNoise(noiseRate / 100, result.finalAccuracy);
      setNoisyAccuracy(noiseResult.noisyAccuracy);
    }

    setFinalAccuracy(result.finalAccuracy);
    setRunning(false);
  }, [epochs, convergenceRate, running, noiseEnabled, noiseRate]);

  return (
    <div
      className="p-6 flex flex-col h-full relative overflow-hidden"
      dir="rtl"
      style={{
        background: '#151619',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
      }}
    >
      {/* ─── الرأس ─── */}
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">الشبكات العصبية الكمومية</h2>
          <p className="text-sm text-slate-400 font-mono">QNN Training Engine</p>
        </div>
        <div
          className={`p-3 rounded-full ${
            running ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <BrainCircuit size={24} />
        </div>
      </div>

      {/* ─── اختيار المعمارية ─── */}
      <div className="mb-3 flex gap-2 flex-wrap">
        {ARCHITECTURES.map((arch) => (
          <button
            type="button"
            key={arch.id}
            onClick={() => !running && setArchitecture(arch.id)}
            disabled={running}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all disabled:opacity-50 ${
              architecture === arch.id
                ? 'text-white border-transparent'
                : 'text-slate-400 border-slate-700 bg-transparent hover:border-slate-500'
            }`}
            style={architecture === arch.id ? { backgroundColor: arch.color, borderColor: arch.color } : {}}
          >
            {arch.label}
          </button>
        ))}

        {/* اختيار عدد الكيوبتات */}
        <div className="flex gap-1 mr-auto">
          {QUBIT_OPTIONS.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => !running && setNumQubits(q)}
              disabled={running}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all disabled:opacity-50 ${
                numQubits === q
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {q}Q
            </button>
          ))}
        </div>
      </div>

      {/* ─── مؤشر معلومات المعمارية ─── */}
      <div className="mb-3 bg-slate-900/60 rounded-lg px-3 py-2 border border-white/5 flex gap-4 flex-wrap">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{archInfo.name}</span>
        <span className="text-[10px] font-mono text-violet-400">المعاملات: {archInfo.totalParameters}</span>
        <span className="text-[10px] font-mono text-cyan-400">العمق: {archInfo.circuitDepth}</span>
        <span className="text-[10px] font-mono text-slate-500 mr-auto">{archInfo.description}</span>
      </div>

      {/* ─── مؤشرات الدقة ─── */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">الدقة الحالية</div>
          <div className="text-2xl font-mono text-white">
            {progress.length > 0 ? progress[progress.length - 1].accuracy.toFixed(2) : '0.00'}%
          </div>
        </div>
        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">الخسارة (Loss)</div>
          <div className="text-2xl font-mono text-orange-400">
            {progress.length > 0 ? progress[progress.length - 1].loss.toFixed(4) : '0.0000'}
          </div>
        </div>
        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">
            {noiseEnabled && noisyAccuracy !== null ? 'دقة مع ضوضاء' : 'الدقة النهائية'}
          </div>
          <div
            className={`text-2xl font-mono ${noiseEnabled && noisyAccuracy !== null ? 'text-yellow-400' : 'text-emerald-400'}`}
          >
            {noiseEnabled && noisyAccuracy !== null
              ? `${noisyAccuracy.toFixed(2)}%`
              : finalAccuracy !== null
                ? `${finalAccuracy.toFixed(2)}%`
                : '---'}
          </div>
        </div>
      </div>

      {/* ─── الرسم البياني ─── */}
      <div className="flex-grow min-h-[150px] w-full mb-4 bg-black/20 rounded-lg p-2 border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progress} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d36" vertical={false} />
            <XAxis dataKey="epoch" stroke="#8E9299" fontSize={10} tick={{ fontFamily: 'monospace' }} />
            <YAxis stroke="#8E9299" fontSize={10} tick={{ fontFamily: 'monospace' }} domain={[0, 100]} />
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
            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#8E9299' }} />
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
            <Line
              type="monotone"
              dataKey="gradientNorm"
              name="معيار التدرج"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ─── إعدادات الضوضاء ─── */}
      <div className="mb-3 bg-slate-800/40 rounded-lg px-3 py-2.5 border border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => setNoiseEnabled(!noiseEnabled)}
            disabled={running}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
              noiseEnabled ? 'bg-yellow-500' : 'bg-slate-700'
            }`}
            aria-label="تشغيل/إيقاف محاكاة الضوضاء"
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                noiseEnabled ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs font-mono text-slate-400">محاكاة الضوضاء (Depolarizing Noise)</span>
          {noiseEnabled && <span className="text-xs font-mono text-yellow-400 mr-auto">معدل: {noiseRate}%</span>}
        </div>
        {noiseEnabled && (
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={noiseRate}
            onChange={(e) => setNoiseRate(Number(e.target.value))}
            disabled={running}
            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50"
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">عدد الدورات (Epochs)</label>
              <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">{epochs}</span>
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
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">معدل التقارب</label>
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
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">قوة الكم (Qubits)</label>
              <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">{quantumPower}</span>
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
            {powerError && <p className="text-[10px] text-red-400 mt-1 leading-tight">{powerError}</p>}
          </div>
        </div>

        <button
          type="button"
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
