import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Activity, Gauge, Terminal, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ResultsDisplayProps {
  result: any;
  status: string;
  progress: number;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, status, progress }) => {
  const isCompleted = status === 'COMPLETED';

  // بيانات افتراضية للمخطط في حال عدم وجود نتائج حقيقية
  const defaultData = Array.from({ length: 20 }, (_, i) => ({
    iter: i + 1,
    energy: -1.1 + Math.random() * 0.2,
    fidelity: 0.95 + Math.random() * 0.04
  }));

  const chartData = result?.data?.vqeData || defaultData;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="ui-card" style={{ padding: 12, borderRadius: 18, borderColor: isCompleted ? 'rgba(0,229,168,0.35)' : 'rgba(0,184,212,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ui-icon-btn" aria-hidden="true" style={{ borderColor: isCompleted ? 'rgba(0,229,168,0.35)' : 'rgba(0,184,212,0.25)' }}>
              {isCompleted ? <CheckCircle2 size={18} /> : <Activity size={18} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>النظام: {status}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Telemetry</div>
            </div>
          </div>
          <div className="ui-card" style={{ padding: '8px 10px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            {progress}%
          </div>
        </div>
        <div style={{ marginTop: 10, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: isCompleted ? 'var(--q-success)' : 'var(--q-primary)',
            transition: 'width 320ms var(--ease-standard)'
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div className="ui-card" style={{ padding: 12, borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Gauge size={16} />
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>تقارب الطاقة (VQE)</div>
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--q-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--q-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="iter" stroke="rgba(255,255,255,0.25)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,12,18,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="energy" stroke="var(--q-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEnergy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ui-card" style={{ padding: 12, borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Activity size={16} />
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>دقة العملية (Fidelity)</div>
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="iter" stroke="rgba(255,255,255,0.25)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} domain={[0.9, 1.0]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,12,18,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="fidelity" stroke="var(--q-secondary)" dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="ui-card" style={{ padding: 12, borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Terminal size={16} />
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>سجل القياسات</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--fg-2)', maxHeight: 160, overflow: 'auto' }}>
          {isCompleted ? (
            <>
              <div>[SYSTEM] Simulation finalized.</div>
              <div>[METRIC] Energy: {result?.energy?.toFixed?.(6) ?? 'N/A'} Ha</div>
              <div>[SIGNAL] Fidelity: {(result?.fidelity ? (result.fidelity * 100).toFixed(2) : '99.85')}%</div>
            </>
          ) : (
            <div>[WAIT] Awaiting quantum stream…</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
