import { BrainCircuit, Database, FileDown, RefreshCw, Trash2, Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { API_BASE } from '../utils/api';

type Lang = 'ar' | 'en';

const STR: Record<Lang, Record<string, string>> = {
  ar: {
    title: 'مختبر تحليل البيانات',
    subtitle: 'تحليل متقدم لـ datasets مع NLP + Unsupervised + تقييم نماذج + خصوصية GDPR',
    upload: 'رفع Dataset',
    analyze: 'تشغيل التحليل',
    ai: 'تحليل AI',
    delete: 'حذف',
    file: 'ملف (CSV/JSONL)',
    pii: 'سياسة PII',
    piiHash: 'Hash',
    piiMask: 'Mask',
    piiNone: 'None',
    target: 'عمود الهدف (اختياري)',
    clusters: 'عدد التجمعات',
    folds: 'عدد الطيات (CV)',
    report: 'تقرير',
    download: 'تحميل JSON',
    tech: 'خصائص',
    rows: 'عدد السجلات',
    numeric: 'أعمدة رقمية',
    text: 'عمود نصي',
    topTokens: 'أعلى الكلمات',
    cv: 'نتائج Cross‑Validation',
    accuracy: 'الدقة',
    f1: 'F1 (macro)',
    insights: 'رؤى',
    noReport: 'لا يوجد تقرير بعد',
  },
  en: {
    title: 'Dataset Insights Lab',
    subtitle: 'Advanced dataset analysis with NLP, unsupervised learning, CV metrics, and GDPR privacy',
    upload: 'Upload dataset',
    analyze: 'Run analysis',
    ai: 'AI insights',
    delete: 'Delete',
    file: 'File (CSV/JSONL)',
    pii: 'PII policy',
    piiHash: 'Hash',
    piiMask: 'Mask',
    piiNone: 'None',
    target: 'Target column (optional)',
    clusters: 'Clusters',
    folds: 'CV folds',
    report: 'Report',
    download: 'Download JSON',
    tech: 'Profile',
    rows: 'Rows',
    numeric: 'Numeric cols',
    text: 'Text col',
    topTokens: 'Top tokens',
    cv: 'Cross‑Validation',
    accuracy: 'Accuracy',
    f1: 'F1 (macro)',
    insights: 'Insights',
    noReport: 'No report yet',
  },
};

export default function DatasetInsightsDashboard() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = STR[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [piiMode, setPiiMode] = useState<'hash' | 'mask' | 'none'>('hash');
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [rowsTotal, setRowsTotal] = useState<number | null>(null);
  const [schema, setSchema] = useState<any | null>(null);
  const [target, setTarget] = useState('');
  const [kFolds, setKFolds] = useState(5);
  const [nClusters, setNClusters] = useState(5);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [report, setReport] = useState<any | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const numericProfile = report?.profiles?.numeric ?? null;
  const textProfile = report?.profiles?.text ?? null;
  const cv = report?.supervised?.cross_validation?.metrics_mean ?? null;

  const topTokensData = useMemo(() => {
    const toks = textProfile?.top_tokens ?? [];
    return toks.slice(0, 16).map((x: any) => ({ token: x.token, count: x.count }));
  }, [textProfile]);

  const doUpload = useCallback(async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setUploading(true);
    setReport(null);
    setAiText(null);
    setAiProvider(null);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const r = await fetch(`${API_BASE}/api/datasets/upload?pii_mode=${piiMode}`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDatasetId(data.dataset_id);
      setRowsTotal(data.rows);
      setSchema(data.data_schema);
    } finally {
      setUploading(false);
    }
  }, [piiMode]);

  const doAnalyze = useCallback(async () => {
    if (!datasetId) return;
    setAnalyzing(true);
    setReport(null);
    setAiText(null);
    setAiProvider(null);
    try {
      const payload: any = {
        dataset_id: datasetId,
        target: target.trim() || null,
        k_folds: kFolds,
        n_clusters: nClusters,
        model: 'auto',
      };
      const r = await fetch(`${API_BASE}/api/datasets/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      setReport(await r.json());
    } finally {
      setAnalyzing(false);
    }
  }, [datasetId, kFolds, nClusters, target]);

  const doAI = useCallback(async () => {
    if (!datasetId) return;
    setAiLoading(true);
    setAiText(null);
    setAiProvider(null);
    try {
      const r = await fetch(`${API_BASE}/api/datasets/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, provider: 'openrouter', language: lang }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setAiText(String(data.text ?? ''));
      setAiProvider(String(data.provider ?? 'local'));
    } finally {
      setAiLoading(false);
    }
  }, [datasetId, lang]);

  const doDelete = useCallback(async () => {
    if (!datasetId) return;
    await fetch(`${API_BASE}/api/datasets/delete/${datasetId}`, { method: 'POST' });
    setDatasetId(null);
    setRowsTotal(null);
    setSchema(null);
    setReport(null);
    setAiText(null);
    setAiProvider(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [datasetId]);

  const downloadJson = useCallback(() => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qurabia-dataset-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [report]);

  const textCol = schema?.text_cols?.[0] ?? (schema?.text_cols?.length ? String(schema.text_cols[0]) : null);
  const numericColsCount = schema?.numeric_cols?.length ?? 0;

  return (
    <div dir={dir} style={{ display: 'grid', gap: 14 }}>
      <div className="ui-card" style={{ padding: 16, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div className="ui-icon-btn" aria-hidden="true" style={{ borderColor: 'rgba(0,184,212,0.25)', color: 'rgba(0,184,212,0.9)' }}>
            <Database size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.7 }}>{t.subtitle}</div>
          </div>
        </div>
        <button type="button" className="ui-btn" onClick={() => setLang((p) => (p === 'ar' ? 'en' : 'ar'))} style={{ border: '1px solid var(--outline)', borderRadius: 10, padding: '8px 12px', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
      </div>

      <div className="ui-card" style={{ padding: 16, borderRadius: 18, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 800 }}>{t.file}</label>
          <input ref={fileRef} type="file" accept=".csv,.jsonl" className="ui-input" style={{ flex: 1, minWidth: 260 }} />
          <label style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 800 }}>{t.pii}</label>
          <select value={piiMode} onChange={(e) => setPiiMode(e.target.value as any)} className="ui-input" style={{ width: 140 }}>
            <option value="hash">{t.piiHash}</option>
            <option value="mask">{t.piiMask}</option>
            <option value="none">{t.piiNone}</option>
          </select>
          <button type="button" className="ui-btn ui-btn-filled" onClick={doUpload} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {uploading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
            {t.upload}
          </button>
          <button type="button" className="ui-btn ui-btn-filled" onClick={doAnalyze} disabled={!datasetId || analyzing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {analyzing ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BrainCircuit size={14} />}
            {t.analyze}
          </button>
          <button type="button" className="ui-btn" onClick={doDelete} disabled={!datasetId} style={{ border: '1px solid rgba(255,82,82,0.35)', color: '#ff5252', background: 'transparent', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={14} />
            {t.delete}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.rows}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{rowsTotal ?? '-'}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.numeric}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{numericColsCount}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.text}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, direction: 'ltr' }}>{textCol ?? '-'}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.target}</div>
            <input value={target} onChange={(e) => setTarget(e.target.value)} className="ui-input" style={{ width: '100%', marginTop: 6, boxSizing: 'border-box' }} placeholder={lang === 'ar' ? 'مثال: label' : 'e.g. label'} />
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.folds}</div>
            <input type="number" min={2} max={10} value={kFolds} onChange={(e) => setKFolds(Number(e.target.value))} className="ui-input" style={{ width: '100%', marginTop: 6, boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.clusters}</div>
            <input type="number" min={2} max={12} value={nClusters} onChange={(e) => setNClusters(Number(e.target.value))} className="ui-input" style={{ width: '100%', marginTop: 6, boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>

      {!report ? (
        <div className="ui-card" style={{ padding: 20, borderRadius: 18, color: 'var(--fg-3)', textAlign: 'center' }}>{t.noReport}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 14 }}>
          <div className="ui-card" style={{ padding: 16, borderRadius: 18, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={16} style={{ color: 'var(--p-primary)' }} />
                {t.report}
              </div>
              <button type="button" className="ui-btn" onClick={downloadJson} style={{ border: '1px solid var(--outline)', borderRadius: 10, padding: '8px 12px', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileDown size={14} />
                {t.download}
              </button>
            </div>

            {cv && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.accuracy}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{cv.accuracy}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t.f1}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{cv.f1_macro}</div>
                </div>
              </div>
            )}

            {topTokensData.length > 0 && (
              <div style={{ height: 320 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{t.topTokens}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTokensData} margin={{ top: 10, right: 10, left: 0, bottom: 24 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="token" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0b0f18', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, color: '#fff' }} />
                    <Bar dataKey="count" fill="rgba(0,184,212,0.85)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 900 }}>{t.insights}</div>
              {(report?.recommendations ?? []).slice(0, 10).map((r: any, i: number) => (
                <div key={`${r.id ?? i}`} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--outline)', background: 'var(--surface)' }}>
                  <div style={{ fontSize: 12, fontWeight: 900 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.7 }}>{r.fix}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ui-card" style={{ padding: 16, borderRadius: 18, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BrainCircuit size={16} style={{ color: '#8b5cf6' }} />
                {t.ai}
              </div>
              <button type="button" className="ui-btn ui-btn-filled" onClick={doAI} disabled={!datasetId || aiLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8b5cf6' }}>
                {aiLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BrainCircuit size={14} />}
                {t.ai}
              </button>
            </div>
            {aiProvider && (
              <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                {aiProvider}
              </div>
            )}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, color: 'var(--fg-2)', fontSize: 13 }}>
              {aiText ?? (lang === 'ar' ? 'اضغط زر "تحليل AI" لاستخراج الرؤى والتوصيات.' : 'Click "AI insights" to generate recommendations.')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

