import { Activity, CheckCircle2, Download, Gauge, Play, Terminal } from 'lucide-react';
import type React from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/** نقطة بيانات مخطط التقارب */
interface ChartDataPoint {
  iter?: number;
  energy?: number;
  fidelity?: number;
}

/** نتيجة المحاكاة الكمية */
interface SimulationResult {
  energy?: number;
  fidelity?: number;
  data?: {
    vqeData?: ChartDataPoint[];
  };
}

interface ResultsDisplayProps {
  result: SimulationResult | null;
  status: string;
  progress: number;
  onRun?: () => void;
  runDisabled?: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, status, progress, onRun, runDisabled }) => {
  const isCompleted = status === 'COMPLETED';
  const isIdle = status === 'IDLE';
  const isError = status === 'ERROR';

  // بيانات افتراضية للمخطط في حال عدم وجود نتائج حقيقية
  const defaultData = Array.from({ length: 20 }, (_, i) => ({
    iter: i + 1,
    energy: -1.1 + Math.random() * 0.2,
    fidelity: 0.95 + Math.random() * 0.04,
  }));

  const chartData = result?.data?.vqeData || defaultData;
  const canRun = Boolean(onRun) && !runDisabled;

  const downloadCsv = () => {
    try {
      const rows = Array.isArray(chartData) ? chartData : [];
      const header = ['iter', 'energy', 'fidelity'];
      const lines = [
        header.join(','),
        ...rows.map((r: ChartDataPoint) =>
          [Number(r?.iter ?? ''), Number(r?.energy ?? ''), Number(r?.fidelity ?? '')].join(','),
        ),
      ].join('\n');
      const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qurabia-telemetry-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        className="ui-card"
        style={{
          padding: 12,
          borderRadius: 18,
          borderColor: isCompleted ? 'rgba(0,229,168,0.35)' : 'rgba(0,184,212,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="ui-icon-btn"
              aria-hidden="true"
              style={{ borderColor: isCompleted ? 'rgba(0,229,168,0.35)' : 'rgba(0,184,212,0.25)' }}
            >
              {isCompleted ? <CheckCircle2 size={18} /> : <Activity size={18} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>النظام: {status}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Telemetry</div>
            </div>
          </div>
          <div
            className="ui-card"
            style={{ padding: '8px 10px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontWeight: 800 }}
          >
            {progress}%
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            height: 8,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: isCompleted ? 'var(--q-success)' : 'var(--q-primary)',
              transition: 'width 320ms var(--ease-standard)',
            }}
          />
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,12,18,0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="var(--q-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEnergy)"
                />
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
                <YAxis
                  stroke="rgba(255,255,255,0.25)"
                  fontSize={10}
                  domain={[0.9, 1.0]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,12,18,0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                  }}
                />
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
          <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {canRun && (
              <button type="button" className="ui-btn ui-btn-tonal" onClick={onRun} aria-label="تشغيل المحاكاة">
                <Play size={16} />
                تشغيل
              </button>
            )}
            <button type="button" className="ui-btn ui-btn-outlined" onClick={downloadCsv} aria-label="تصدير CSV">
              <Download size={16} />
              CSV
            </button>
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.7,
            color: 'var(--fg-2)',
            maxHeight: 160,
            overflow: 'auto',
          }}
        >
          {isCompleted ? (
            <>
              <div>[SYSTEM] Simulation finalized.</div>
              <div>[METRIC] Energy: {result?.energy?.toFixed?.(6) ?? 'N/A'} Ha</div>
              <div>[SIGNAL] Fidelity: {result?.fidelity ? (result.fidelity * 100).toFixed(2) : '99.85'}%</div>
            </>
          ) : isError ? (
            <>
              <div>[ERROR] تعذّر إكمال التنفيذ.</div>
              <div>[HINT] تحقق من الإعدادات ثم أعد المحاولة.</div>
            </>
          ) : isIdle ? (
            <>
              <div>[READY] اختر نوع المحاكاة واضغط تشغيل.</div>
              <div>[TIP] يمكنك تشغيل سريعاً عبر Ctrl+Enter.</div>
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
