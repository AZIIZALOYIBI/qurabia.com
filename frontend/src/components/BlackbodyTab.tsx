import React, { useCallback, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type SpectrumPoint = {
  freq_Hz: number;
  wavelength_m: number;
  B_planck: number;
  delta_total: number;
  B_corrected: number;
};

type SpectrumResponse = {
  temperature_K: number;
  num_points: number;
  freq_range_Hz: [number, number];
  peak_frequency_Hz: number;
  peak_wavelength_nm: number;
  spectrum: SpectrumPoint[];
};

const normalizeApiBase = (value: string) => value.trim().replace(/\/+$/, '');

const BlackbodyTab: React.FC = () => {
  const [temperatureText, setTemperatureText] = useState<string>('5778');
  const [nuMinText, setNuMinText] = useState<string>('1e11');
  const [nuMaxText, setNuMaxText] = useState<string>('1e15');
  const [nPointsText, setNPointsText] = useState<string>('240');
  const [enableQED, setEnableQED] = useState<boolean>(true);
  const [enableLQG, setEnableLQG] = useState<boolean>(true);
  const [enableGUP, setEnableGUP] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SpectrumResponse | null>(null);

  const [apiOverride, setApiOverride] = useState<string>(() => {
    try {
      return localStorage.getItem('qurabia.apiBase') || '';
    } catch {
      return '';
    }
  });
  const apiBase = useMemo(() => {
    const raw =
      apiOverride ||
      (import.meta.env.VITE_API_BASE_URL || '') ||
      (!import.meta.env.DEV && typeof window !== 'undefined' ? window.location.origin : '') ||
      'https://api.qurabia.com';
    return normalizeApiBase(raw);
  }, [apiOverride]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      if (!apiBase) {
        throw new Error('عنوان الـAPI غير مهيّأ. ضع VITE_API_BASE_URL أو استخدم الحقل أدناه.');
      }

      const temperature = Number(temperatureText);
      const nuMin = Number(nuMinText);
      const nuMax = Number(nuMaxText);
      const nPoints = Math.trunc(Number(nPointsText));

      if (!Number.isFinite(temperature) || temperature <= 0) {
        throw new Error('الحرارة غير صحيحة (يجب أن تكون رقمًا أكبر من 0).');
      }
      if (!Number.isFinite(nuMin) || nuMin <= 0) {
        throw new Error('أدنى تردد غير صحيح (يجب أن يكون رقمًا أكبر من 0).');
      }
      if (!Number.isFinite(nuMax) || nuMax <= 0) {
        throw new Error('أعلى تردد غير صحيح (يجب أن يكون رقمًا أكبر من 0).');
      }
      if (nuMax <= nuMin) {
        throw new Error('يجب أن يكون أعلى تردد أكبر من أدنى تردد.');
      }
      if (!Number.isFinite(nPoints) || nPoints < 10 || nPoints > 5000) {
        throw new Error('عدد النقاط غير صحيح (10 إلى 5000).');
      }

      const resp = await fetch(`${apiBase}/api/blackbody/spectrum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature_K: temperature,
          nu_min: nuMin,
          nu_max: nuMax,
          n_points: nPoints,
          enable_qed: enableQED,
          enable_lqg: enableLQG,
          enable_gup: enableGUP,
        }),
      });
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const j = (await resp.json()) as any;
          const detail = typeof j?.detail === 'string' ? j.detail : JSON.stringify(j);
          throw new Error(detail || `HTTP ${resp.status}`);
        }
        const t = await resp.text();
        throw new Error(t || `HTTP ${resp.status}`);
      }
      const json = (await resp.json()) as SpectrumResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'فشل التنفيذ');
    } finally {
      setLoading(false);
    }
  }, [apiBase, temperatureText, nuMinText, nuMaxText, nPointsText, enableQED, enableLQG, enableGUP]);

  const chartData = useMemo(() => {
    if (!data?.spectrum) return [];
    return data.spectrum.map((p) => ({
      f: p.freq_Hz / 1e12,
      B: p.B_planck,
      Bc: p.B_corrected,
    }));
  }, [data]);

  return (
    <div className="ui-card" style={{ padding: 12, borderRadius: 22, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>الطيف الحراري (Blackbody)</div>
        <button className="ui-btn ui-btn-filled" onClick={run} disabled={loading}>
          {loading ? 'جاري الحساب…' : 'تشغيل'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        <label className="ui-field">
          <div className="ui-label">الحرارة K</div>
          <input className="ui-input" type="number" min={1} step="any" value={temperatureText} onChange={(e) => setTemperatureText(e.target.value)} />
        </label>
        <label className="ui-field">
          <div className="ui-label">أدنى تردد Hz</div>
          <input className="ui-input" type="number" min={1} step="any" value={nuMinText} onChange={(e) => setNuMinText(e.target.value)} />
        </label>
        <label className="ui-field">
          <div className="ui-label">أعلى تردد Hz</div>
          <input className="ui-input" type="number" min={1} step="any" value={nuMaxText} onChange={(e) => setNuMaxText(e.target.value)} />
        </label>
        <label className="ui-field">
          <div className="ui-label">عدد النقاط</div>
          <input className="ui-input" type="number" min={10} max={5000} step={1} value={nPointsText} onChange={(e) => setNPointsText(e.target.value)} />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className={`ui-btn ${enableQED ? 'ui-btn-tonal' : 'ui-btn-outlined'}`} onClick={() => setEnableQED((v) => !v)} aria-pressed={enableQED}>
            QED
          </button>
          <button className={`ui-btn ${enableLQG ? 'ui-btn-tonal' : 'ui-btn-outlined'}`} onClick={() => setEnableLQG((v) => !v)} aria-pressed={enableLQG}>
            LQG
          </button>
          <button className={`ui-btn ${enableGUP ? 'ui-btn-tonal' : 'ui-btn-outlined'}`} onClick={() => setEnableGUP((v) => !v)} aria-pressed={enableGUP}>
            GUP
          </button>
        </div>
      </div>

      <div className="ui-card" style={{ padding: 10, borderRadius: 16, display: 'grid', gap: 8 }}>
        <label className="ui-field">
          <div className="ui-label">عنوان الـAPI</div>
          <input
            className="ui-input"
            placeholder="https://your-backend.example.com"
            value={apiOverride}
            onChange={(e) => setApiOverride(e.target.value)}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="ui-btn ui-btn-outlined"
            onClick={() => {
              setApiOverride('');
              try { localStorage.removeItem('qurabia.apiBase'); } catch {}
            }}
            disabled={!apiOverride}
          >
            إعادة التعيين
          </button>
          <button
            className="ui-btn ui-btn-filled"
            onClick={() => {
              try { localStorage.setItem('qurabia.apiBase', normalizeApiBase(apiOverride)); } catch {}
            }}
            disabled={!apiOverride}
          >
            حفظ العنوان
          </button>
          <span className="ui-chip">الفعّال: {apiBase || 'غير مهيّأ'}</span>
        </div>
      </div>

      {error && <div className="ui-card" style={{ padding: 10, borderRadius: 16, color: 'var(--p-error)' }}>{error}</div>}

      {data && (
        <div className="ui-card" style={{ padding: 10, borderRadius: 16 }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="f" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="B" stroke="#8884d8" dot={false} name="Planck" />
                <Line type="monotone" dataKey="Bc" stroke="#00b8d4" dot={false} name="Corrected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            الذروة عند ν≈ {data.peak_frequency_Hz.toExponential(3)} Hz — λ≈ {data.peak_wavelength_nm.toFixed(1)} nm
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackbodyTab;
