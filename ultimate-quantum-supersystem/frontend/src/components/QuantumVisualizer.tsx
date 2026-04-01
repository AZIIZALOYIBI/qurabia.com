/**
 * QuantumVisualizer.tsx – مرئيات كمية متقدمة
 * يشمل: مخطط كرة بلوخ، محاكي نبض، طيف الطاقة
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── كرة بلوخ ────────────────────────────────────────────────
interface BlochSphereProps {
  theta: number;  // 0 → π
  phi:   number;  // 0 → 2π
  size?:  number;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({
  theta, phi, size = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId     = useRef<number>(0);
  const rotY      = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const r  = size / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ─── الكرة الخارجية ──────────────────────────────────────
    const gradient = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    gradient.addColorStop(0, 'rgba(0,255,255,0.08)');
    gradient.addColorStop(0.7, 'rgba(0,80,120,0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ─── المحاور ──────────────────────────────────────────────
    const drawAxis = (x2: number, y2: number, label: string, color: string) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + x2, cy + y2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle   = color;
      ctx.font        = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(label, cx + x2 + 4, cy + y2 + 4);
    };

    drawAxis(0,    -r,   '|0⟩', '#00ff88');
    drawAxis(0,     r,   '|1⟩', '#ff3366');
    drawAxis(r,     0,   '|+⟩', '#ffd700');
    drawAxis(-r,    0,   '|-⟩', '#9d00ff');

    // ─── دوائر خط الاستواء ───────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,255,0.12)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ─── متجه الحالة |ψ⟩ ──────────────────────────────────────
    // إسقاط ثلاثي الأبعاد إلى ثنائي
    rotY.current += 0.008;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const totalPhi = phi + rotY.current;

    // إحداثيات كروية → ديكارتية مع إسقاط
    const vx3 = sinT * Math.cos(totalPhi);
    const vy3 = sinT * Math.sin(totalPhi);
    const vz3 = cosT;

    // إسقاط مائل بسيط
    const screenX = cx + r * (vx3 * 0.8 + vy3 * 0.2);
    const screenY = cy - r * vz3;

    // مسار المتجه
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(screenX, screenY);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // رأس السهم
    const angle = Math.atan2(screenY - cy, screenX - cx);
    const aLen  = 10;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX - aLen * Math.cos(angle - 0.4), screenY - aLen * Math.sin(angle - 0.4));
    ctx.lineTo(screenX - aLen * Math.cos(angle + 0.4), screenY - aLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.fill();

    // نقطة الحالة
    ctx.beginPath();
    ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
    const pGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 8);
    pGrad.addColorStop(0, '#ffd700');
    pGrad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = pGrad;
    ctx.fill();

    // تسمية |ψ⟩
    ctx.fillStyle = '#ffd700';
    ctx.font      = 'bold 13px serif';
    ctx.fillText('|ψ⟩', screenX + 8, screenY - 8);

    rafId.current = requestAnimationFrame(draw);
  }, [theta, phi, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = size;
    canvas.height = size;
    rafId.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId.current);
  }, [size, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,255,0.03), transparent)' }}
    />
  );
};

// ─── مخطط طيف الطاقة ─────────────────────────────────────────
interface EnergySpectrumChartProps {
  data: Array<{ frequency: number; energyEV: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">ν = {(Number(label) / 1e12).toFixed(2)} THz</div>
      <div className="value">E = {payload[0]?.value?.toFixed(4)} eV</div>
    </div>
  );
};

export const EnergySpectrumChart: React.FC<EnergySpectrumChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={180}>
    <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
      <defs>
        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00ffff" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#00ffff" stopOpacity={0} />
        </linearGradient>
        <filter id="energyGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,255,255,0.06)" />
      <XAxis
        dataKey="frequency"
        tickFormatter={v => `${(v/1e14).toFixed(1)}×10¹⁴`}
        tick={{ fill: 'rgba(150,200,220,0.6)', fontSize: 9 }}
        axisLine={{ stroke: 'rgba(0,255,255,0.15)' }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: 'rgba(150,200,220,0.6)', fontSize: 9 }}
        axisLine={{ stroke: 'rgba(0,255,255,0.15)' }}
        tickLine={false}
        width={45}
        tickFormatter={v => `${v.toFixed(1)} eV`}
      />
      <Tooltip content={<CustomTooltip />} />
      <Area
        type="monotone"
        dataKey="energyEV"
        stroke="#00ffff"
        strokeWidth={2}
        fill="url(#energyGrad)"
        filter="url(#energyGlow)"
        dot={false}
        activeDot={{ r: 4, fill: '#ffd700', stroke: 'none' }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── مخطط رادار لمقاييس المعالج ──────────────────────────────
interface ProcessorRadarProps {
  metrics: {
    coherence:    number;
    fidelity:     number;
    connectivity: number;
    speed:        number;
    errorCorr:    number;
    entanglement: number;
  };
}

export const ProcessorRadar: React.FC<ProcessorRadarProps> = ({ metrics }) => {
  const data = [
    { subject: 'تماسك',     A: metrics.coherence    * 100, fullMark: 100 },
    { subject: 'دقة',       A: metrics.fidelity     * 100, fullMark: 100 },
    { subject: 'ربط',       A: metrics.connectivity * 100, fullMark: 100 },
    { subject: 'سرعة',      A: metrics.speed        * 100, fullMark: 100 },
    { subject: 'تصحيح',     A: metrics.errorCorr    * 100, fullMark: 100 },
    { subject: 'تشابك',     A: metrics.entanglement * 100, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(0,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'rgba(150,200,220,0.7)', fontSize: 10, fontFamily: 'Tajawal' }}
        />
        <defs>
          <radialGradient id="radarGrad">
            <stop offset="0%"   stopColor="#00ffff" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#9d00ff" stopOpacity={0.1} />
          </radialGradient>
        </defs>
        <Radar
          dataKey="A"
          stroke="#00ffff"
          strokeWidth={2}
          fill="url(#radarGrad)"
          dot={{ fill: '#00ffff', r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// ─── رسم VQE التقاربي ─────────────────────────────────────────
interface VQEConvergenceProps {
  iterations: Array<{ iter: number; energy: number; gradient: number }>;
  targetEnergy: number;
}

export const VQEConvergenceChart: React.FC<VQEConvergenceProps> = ({
  iterations, targetEnergy,
}) => (
  <ResponsiveContainer width="100%" height={160}>
    <LineChart data={iterations} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,215,0,0.06)" />
      <XAxis
        dataKey="iter"
        tick={{ fill: 'rgba(150,200,220,0.6)', fontSize: 9 }}
        axisLine={{ stroke: 'rgba(255,215,0,0.15)' }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: 'rgba(150,200,220,0.6)', fontSize: 9 }}
        axisLine={{ stroke: 'rgba(255,215,0,0.15)' }}
        tickLine={false}
        width={55}
        domain={['auto', 'auto']}
        tickFormatter={v => `${v.toFixed(3)} Ha`}
      />
      <Tooltip
        formatter={(v: any) => [`${Number(v).toFixed(6)} Ha`, 'طاقة VQE']}
        contentStyle={{ background: '#040814', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6 }}
        labelStyle={{ color: '#ffd700' }}
        itemStyle={{ color: '#00ff88' }}
      />
      <ReferenceLine
        y={targetEnergy}
        stroke="rgba(255,215,0,0.4)"
        strokeDasharray="6 3"
        label={{ value: 'FCI Target', position: 'right', fill: '#ffd700', fontSize: 9 }}
      />
      <Line
        type="monotone"
        dataKey="energy"
        stroke="#00ff88"
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4, fill: '#ffd700' }}
      />
    </LineChart>
  </ResponsiveContainer>
);
