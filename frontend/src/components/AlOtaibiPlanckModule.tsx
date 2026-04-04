import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AlOtaibiPlanck } from '../engine/AlOtaibiPlanck';

export const AlOtaibiPlanckModule: React.FC = () => {
  const planck = useMemo(() => new AlOtaibiPlanck(), []);
  const [temperature, setTemperature] = useState(5778);
  const [lambda, setLambda] = useState(0.5);

  const data = useMemo(() => {
    const points = [];
    const minFreq = 1e13;
    const maxFreq = 1.5e15;
    const steps = 100;
    const stepSize = (maxFreq - minFreq) / steps;

    for (let i = 0; i <= steps; i++) {
      const freq = minFreq + i * stepSize;
      const classical = planck.planckClassical(freq, temperature);
      const alOtaibi = planck.alOtaibiPlanck(freq, temperature, lambda);
      const scaleFactor = 1e14;

      points.push({
        frequency: freq,
        frequencyLabel: (freq / 1e14).toFixed(1) + 'e14',
        Classical: classical * scaleFactor,
        AlOtaibi: alOtaibi * scaleFactor,
      });
    }
    return points;
  }, [temperature, lambda, planck]);

  return (
    <div className="p-6 bg-transparent h-full flex flex-col relative overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">
          محرك الإشعاع الكمومي
        </h2>
        <p className="text-sm text-slate-400 font-mono">
          معادلة العتيبي-بلانك
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              درجة الحرارة (K)
            </label>
            <span className="text-xs font-mono text-white bg-slate-800 px-2 py-1 rounded">
              {temperature} K
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="10000"
            step="100"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              معامل لامبدا (λ)
            </label>
            <span className="text-xs font-mono text-white bg-slate-800 px-2 py-1 rounded">
              {lambda.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={lambda}
            onChange={(e) => setLambda(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2a2d36"
              vertical={false}
            />
            <XAxis
              dataKey="frequencyLabel"
              stroke="#8E9299"
              fontSize={10}
              tickMargin={10}
              tick={{ fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="#8E9299"
              fontSize={10}
              tickFormatter={(val) => val.toExponential(1)}
              tick={{ fontFamily: 'monospace' }}
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
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                fontFamily: 'sans-serif',
                paddingTop: '10px',
              }}
            />
            <Line
              type="monotone"
              dataKey="Classical"
              name="بلانك الكلاسيكية"
              stroke="#8E9299"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="AlOtaibi"
              name="العتيبي-بلانك"
              stroke="#F27D26"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AlOtaibiPlanckModule;
