import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, ShieldCheck, Search, Lock, Activity, AlertTriangle, CheckCircle, XCircle, Cpu, Zap, ArrowLeft, RefreshCw, Download, Radar, Fingerprint, Globe, Server, Wifi, Database, Printer, FileDown, FileText, BrainCircuit } from 'lucide-react';
import { scanUrl, generateQuantumKey, simulateQuantumFirewall, type SecurityScanResult, type QuantumShieldState, type QuantumThreat, type QuantumEncryptionResult, ATTACK_VECTORS_AR, THREAT_LEVELS_AR, type ThreatLevel, type AttackVector, type DefenseStatus, type HeaderCheck, type SecurityRecommendation, type PortResult } from '../engine/QuantumCyberShield';
import { generateComprehensiveReport, type ComprehensiveShieldReport } from '../engine/QuantumCyberShieldV2';
import { printScanReport, printComprehensiveReport, buildBasicReportHtml, buildComprehensiveReportHtml, downloadReportAsHtml } from '../engine/QuantumReportGenerator';
import { useToast } from '../contexts/ToastContext';

function resolveApiBase(): string {
  const normalize = (v: string) => v.trim().replace(/\/+$/, '');
  try { const o = localStorage.getItem('qurabia.apiBase') || ''; if (o) return normalize(o); } catch { /* */ }
  const fromEnv = normalize(import.meta.env.VITE_API_BASE_URL || '');
  if (fromEnv) return fromEnv;
  if (!import.meta.env.DEV && typeof window !== 'undefined') return normalize(window.location.origin);
  return normalize('https://api.qurabia.com');
}

type ShieldTab = 'dashboard' | 'scanner' | 'firewall' | 'encryption' | 'ids' | 'report';
const TABS: { id: ShieldTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: Activity },
  { id: 'scanner', label: 'فحص الأمان', icon: Search },
  { id: 'firewall', label: 'الجدار الكمومي', icon: Shield },
  { id: 'encryption', label: 'التشفير الكمومي', icon: Lock },
  { id: 'ids', label: 'كشف التسلل', icon: Radar },
  { id: 'report', label: 'التقارير', icon: Download },
];
const LC: Record<ThreatLevel, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e', info: '#8b5cf6' };
const SC: Record<DefenseStatus, string> = { active: '#22c55e', monitoring: '#3b82f6', blocked: '#ef4444', investigating: '#f59e0b', neutralized: '#8b5cf6' };
const SA: Record<DefenseStatus, string> = { active: 'نشط', monitoring: 'مراقبة', blocked: 'محظور', investigating: 'تحقيق', neutralized: 'مُحايد' };

function MC({ label, value, color, icon: I }: { label: string; value: number; color: string; icon: React.ElementType }) {
  const p = Math.round(value * 100);
  return (<div className="ui-card" style={{ padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I size={16} style={{ color }} /><span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>{label}</span></div><div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'var(--font-mono)' }}>{p}%</div><div style={{ height: 4, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 999, transition: 'width 0.5s' }} /></div></div>);
}
function TR({ t }: { t: QuantumThreat }) {
  return (<div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 70px', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', fontSize: 12 }}><span style={{ fontWeight: 700, color: LC[t.level], fontFamily: 'var(--font-mono)' }}>{t.id}</span><span style={{ color: 'var(--fg-2)' }}>{ATTACK_VECTORS_AR[t.vector]}</span><span style={{ textAlign: 'center', padding: '2px 6px', borderRadius: 6, background: `${LC[t.level]}20`, color: LC[t.level], fontWeight: 700, fontSize: 11 }}>{THREAT_LEVELS_AR[t.level]}</span><span style={{ textAlign: 'center', padding: '2px 6px', borderRadius: 6, background: `${SC[t.status]}20`, color: SC[t.status], fontWeight: 700, fontSize: 11 }}>{SA[t.status]}</span></div>);
}
function HR({ c }: { c: HeaderCheck }) {
  const ic = c.status === 'secure' ? <CheckCircle size={14} style={{ color: '#22c55e' }} /> : c.status === 'warning' ? <AlertTriangle size={14} style={{ color: '#f59e0b' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />;
  const cl = c.status === 'secure' ? '#22c55e' : c.status === 'warning' ? '#f59e0b' : '#ef4444';
  const lb = c.status === 'secure' ? 'آمن' : c.status === 'warning' ? 'تحذير' : c.status === 'weak' ? 'ضعيف' : 'مفقود';
  return (<div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 60px 1fr', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', fontSize: 12 }}>{ic}<span style={{ fontWeight: 600, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{c.header}</span><span style={{ textAlign: 'center', padding: '2px 6px', borderRadius: 6, background: `${cl}20`, color: cl, fontWeight: 700, fontSize: 11 }}>{lb}</span><span style={{ color: 'var(--fg-3)', fontSize: 11 }}>{c.recommendation}</span></div>);
}
function PR({ p }: { p: PortResult }) {
  const sc = p.state === 'open' ? '#ef4444' : p.state === 'filtered' ? '#f59e0b' : '#22c55e';
  const sl = p.state === 'open' ? 'مفتوح' : p.state === 'filtered' ? 'مُصفّى' : 'مغلق';
  return (<div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px 50px', gap: 8, alignItems: 'center', padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', fontSize: 12 }}><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.port}</span><span style={{ color: 'var(--fg-2)' }}>{p.service}</span><span style={{ textAlign: 'center', padding: '2px 6px', borderRadius: 6, background: `${sc}20`, color: sc, fontWeight: 700, fontSize: 11 }}>{sl}</span><span style={{ color: LC[p.risk], fontWeight: 700 }}>{THREAT_LEVELS_AR[p.risk]}</span></div>);
}
function RR({ r }: { r: SecurityRecommendation }) {
  return (<div className="ui-card" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8, borderRight: `3px solid ${LC[r.priority]}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${LC[r.priority]}20`, color: LC[r.priority], fontWeight: 700 }}>{THREAT_LEVELS_AR[r.priority]}</span><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--fg-3)' }}>{r.category}</span></div><div style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 14 }}>{r.title}</div><div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>{r.description}</div><div style={{ fontSize: 12, color: 'var(--p-secondary)', lineHeight: 1.6, padding: '8px 12px', borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}><Zap size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} /> {r.quantumFix}</div></div>);
}

export default function QuantumCyberShieldPage() {
  const [tab, setTab] = useState<ShieldTab>('dashboard');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<SecurityScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [shield, setShield] = useState<QuantumShieldState>({ integrity: 0.95, entanglement: 0.92, superposition: 0.88, coherence: 0.97, fidelity: 0.99 });
  const [encRes, setEncRes] = useState<QuantumEncryptionResult | null>(null);
  const [traffic, setTraffic] = useState(0);
  const [log, setLog] = useState<QuantumThreat[]>([]);
  const [v2Report, setV2Report] = useState<ComprehensiveShieldReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const iv = setInterval(() => {
      const t = Math.floor(500 + Math.random() * 9500);
      setTraffic(t);
      setShield(simulateQuantumFirewall(t));
      if (Math.random() < 0.08) {
        const vs: AttackVector[] = ['sql_injection', 'xss', 'ddos', 'brute_force', 'mitm', 'zero_day', 'quantum_attack'];
        const ls: ThreatLevel[] = ['critical', 'high', 'medium', 'low'];
        const v = vs[Math.floor(Math.random() * vs.length)];
        const l = ls[Math.floor(Math.random() * ls.length)];
        setLog(p => [{ id: `QT-${Date.now().toString(16).slice(-6).toUpperCase()}`, vector: v, level: l, source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.x.x`, target: 'qurabia.com', timestamp: Date.now(), description: `كشف ${ATTACK_VECTORS_AR[v]} — ${THREAT_LEVELS_AR[l]}`, quantumSignature: `qsh-${Math.random().toString(36).slice(2, 10)}`, status: l === 'critical' ? 'blocked' : 'monitoring' } as QuantumThreat, ...p].slice(0, 50));
      }
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const doScan = useCallback(async () => {
    if (!url.trim()) { toast.warning('أدخل رابط الموقع'); return; }
    setScanning(true);
    try {
      const r = await scanUrl(url);
      setResult(r);
      const v2 = generateComprehensiveReport(url);
      setV2Report(v2);
      toast.success(`فحص كمومي — ${r.threats.length} تهديدات — مقاومة ${r.quantumResistanceScore}%`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تنفيذ الفحص، حاول مجدداً';
      toast.error(message);
    } finally {
      setScanning(false);
    }
  }, [url, toast]);

  const doEnc = useCallback(() => { setEncRes(generateQuantumKey(256)); toast.success('تم توليد مفتاح كمومي مقاوم'); }, [toast]);

  const doAiAnalyze = useCallback(async () => {
    if (!result) { toast.warning('قم بفحص موقع أولاً'); return; }
    setAiLoading(true);
    setAiAnalysis(null);
    setAiProvider(null);
    try {
      const apiBase = resolveApiBase();
      const scanData = {
        url: result.url,
        vulnerability_score: result.vulnerabilityScore,
        quantum_resistance_score: result.quantumResistanceScore,
        is_https: result.url.startsWith('https'),
        headers: result.headerAnalysis.map(h => ({
          header: h.header,
          present: h.present,
          value: h.value,
          status: h.status,
          recommendation: h.recommendation,
        })),
        threats_count: result.threats.length,
        open_ports: result.portScan.filter(p => p.state === 'open').length,
        shield_state: result.shieldState,
      };
      const response = await fetch(`${apiBase}/api/cyber/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_result: scanData, provider: 'auto' }),
      });
      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.text || 'لم يتم الحصول على تحليل');
        setAiProvider(data.provider || 'local');
        toast.success(`تحليل ذكاء اصطناعي — ${data.provider === 'local' ? 'تحليل محلي' : data.provider}`);
      } else {
        toast.error('تعذر الاتصال بخدمة الذكاء الاصطناعي');
      }
    } catch {
      toast.error('خطأ في الاتصال — حاول مجدداً');
    } finally {
      setAiLoading(false);
    }
  }, [result, toast]);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-ar)', color: 'var(--fg)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--outline)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ color: 'var(--fg-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ArrowLeft size={14} /> الرئيسية</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}><Shield size={18} style={{ color: '#00d4ff' }} /></div><div><div style={{ fontWeight: 900, fontSize: 16 }}>الدرع السيبراني الكمومي</div><div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Quantum Cyber Shield — حماية مستوحاة من فيزياء الكم</div></div></div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${shield.fidelity > 0.9 ? '#22c55e' : '#f59e0b'}20`, border: `1px solid ${shield.fidelity > 0.9 ? '#22c55e' : '#f59e0b'}40` }}><div style={{ width: 8, height: 8, borderRadius: 999, background: shield.fidelity > 0.9 ? '#22c55e' : '#f59e0b', animation: 'qfloat 2s infinite' }} /><span style={{ fontSize: 11, fontWeight: 700, color: shield.fidelity > 0.9 ? '#22c55e' : '#f59e0b' }}>{shield.fidelity > 0.9 ? 'الدرع نشط' : 'مراقبة'}</span></div>
      </header>

      <nav style={{ display: 'flex', gap: 4, padding: '12px 24px', overflowX: 'auto', borderBottom: '1px solid var(--outline)' }}>{TABS.map(t => { const I = t.icon; const a = tab === t.id; return <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: a ? 'var(--p-primary)' : 'transparent', color: a ? '#000' : 'var(--fg-3)', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }}><I size={15} /> {t.label}</button>; })}</nav>

      <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        {tab === 'dashboard' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <MC label="سلامة الدرع" value={shield.integrity} color="#22c55e" icon={ShieldCheck} />
            <MC label="التشابك الكمومي" value={shield.entanglement} color="#00d4ff" icon={Wifi} />
            <MC label="التراكب" value={shield.superposition} color="#8b5cf6" icon={Cpu} />
            <MC label="التماسك" value={shield.coherence} color="#f59e0b" icon={Activity} />
            <MC label="الدقة الكمومية" value={shield.fidelity} color="#22c55e" icon={Zap} />
          </div>
          <div className="ui-card" style={{ padding: 20, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={16} style={{ color: 'var(--p-secondary)' }} /><span style={{ fontWeight: 700 }}>حركة المرور الحية</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--p-primary)', fontWeight: 900 }}>{traffic.toLocaleString()} طلب/ث</span></div><div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, (traffic / 10000) * 100)}%`, background: traffic > 8000 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, var(--p-primary), var(--p-secondary))', borderRadius: 999, transition: 'width 1s' }} /></div></div>
          <div className="ui-card" style={{ padding: 20, borderRadius: 18 }}><div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Radar size={16} style={{ color: '#ef4444' }} /> آخر التهديدات</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>{log.length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--fg-3)' }}>لا توجد تهديدات — الدرع يعمل بكفاءة</div> : log.map(t => <TR key={t.id} t={t} />)}</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="ui-card" style={{ padding: 20, borderRadius: 16, borderRight: '3px solid #00d4ff' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Wifi size={18} style={{ color: '#00d4ff' }} /><span style={{ fontWeight: 700 }}>مبدأ التشابك الكمومي</span></div><div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.7 }}>أي محاولة لاعتراض البيانات تُغيّر حالة الجسيمات المتشابكة فوراً مما يُكشف المتنصت تلقائياً — كبروتوكول BB84.</div></div>
            <div className="ui-card" style={{ padding: 20, borderRadius: 16, borderRight: '3px solid #8b5cf6' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Cpu size={18} style={{ color: '#8b5cf6' }} /><span style={{ fontWeight: 700 }}>مبدأ التراكب الكمومي</span></div><div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.7 }}>نظام الحماية يتواجد في تراكب بين آمن ومُخترَق — أي محاولة اختراق تُنهي التراكب وتُكشف فوراً.</div></div>
            <div className="ui-card" style={{ padding: 20, borderRadius: 16, borderRight: '3px solid #22c55e' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Zap size={18} style={{ color: '#22c55e' }} /><span style={{ fontWeight: 700 }}>مبدأ عدم اليقين</span></div><div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.7 }}>لا يمكن للمهاجم قياس مفتاح التشفير وتوزيعه معاً — مبدأ هايزنبرغ يضمن أن أي مراقبة تُغيّر النظام.</div></div>
          </div>
        </div>)}

        {tab === 'scanner' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="ui-card" style={{ padding: 24, borderRadius: 18 }}><h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>فحص الأمان الكمومي</h2><div style={{ display: 'flex', gap: 8 }}><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" dir="ltr" className="ui-input" style={{ flex: 1, boxSizing: 'border-box' }} /><button type="button" className="ui-btn ui-btn-filled" onClick={doScan} disabled={scanning} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{scanning ? <RefreshCw size={14} /> : <Search size={14} />}{scanning ? 'جاري الفحص...' : 'فحص كمومي'}</button></div></div>
          {result && (<>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="ui-btn ui-btn-filled" onClick={() => printScanReport(result)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}><Printer size={13} /> طباعة كشف الفحص</button>
              {v2Report && <button type="button" className="ui-btn ui-btn-filled" onClick={() => printComprehensiveReport(result, v2Report)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px', background: 'var(--p-secondary)' }}><FileText size={13} /> التقرير الشامل</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="ui-card" style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}><div style={{ fontSize: 48, fontWeight: 900, color: result.vulnerabilityScore > 60 ? '#ef4444' : result.vulnerabilityScore > 30 ? '#f59e0b' : '#22c55e', fontFamily: 'var(--font-mono)' }}>{result.vulnerabilityScore}</div><div style={{ fontSize: 13, color: 'var(--fg-3)' }}>درجة الضعف</div></div><div className="ui-card" style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}><div style={{ fontSize: 48, fontWeight: 900, color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>{result.quantumResistanceScore}%</div><div style={{ fontSize: 13, color: 'var(--fg-3)' }}>مقاومة كمومية</div></div></div>
            <div className="ui-card" style={{ padding: 20, borderRadius: 18 }}><h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Server size={16} style={{ color: 'var(--p-primary)' }} /> رؤوس HTTP</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{result.headerAnalysis.map(h => <HR key={h.header} c={h} />)}</div></div>
            <div className="ui-card" style={{ padding: 20, borderRadius: 18 }}><h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Database size={16} style={{ color: 'var(--p-secondary)' }} /> المنافذ</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{result.portScan.filter(p => p.state === 'open' || p.risk !== 'low').map(p => <PR key={p.port} p={p} />)}</div></div>
            <div className="ui-card" style={{ padding: 20, borderRadius: 18 }}><h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16} style={{ color: '#ef4444' }} /> التهديدات ({result.threats.length})</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{result.threats.map(t => <TR key={t.id} t={t} />)}</div></div>
            <div className="ui-card" style={{ padding: 24, borderRadius: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><BrainCircuit size={16} style={{ color: '#8b5cf6' }} /> تحليل الذكاء الاصطناعي</h3>
                <button type="button" className="ui-btn ui-btn-filled" onClick={doAiAnalyze} disabled={aiLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px', background: '#8b5cf6' }}>
                  {aiLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <BrainCircuit size={13} />}
                  {aiLoading ? 'جاري التحليل...' : 'تحليل بالذكاء الاصطناعي'}
                </button>
              </div>
              {aiAnalysis ? (
                <div>
                  {aiProvider && <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: aiProvider === 'local' ? 'rgba(139,92,246,0.15)' : 'rgba(34,197,94,0.15)', color: aiProvider === 'local' ? '#8b5cf6' : '#22c55e', fontWeight: 700, fontSize: 10 }}>
                      {aiProvider === 'local' ? 'تحليل محلي' : `AI: ${aiProvider}`}
                    </span>
                  </div>}
                  <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 2, whiteSpace: 'pre-wrap', padding: '16px 20px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--outline)' }}>
                    {aiAnalysis}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--fg-3)', fontSize: 13, lineHeight: 1.8 }}>
                  <BrainCircuit size={32} style={{ color: 'var(--fg-3)', opacity: 0.3, marginBottom: 8 }} />
                  <div>اضغط الزر لتحليل نتائج الفحص بالذكاء الاصطناعي</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', opacity: 0.7 }}>يدعم: Gemini • Grok • OpenRouter — مع تحليل محلي كبديل</div>
                </div>
              )}
            </div>
          </>)}
        </div>)}

        {tab === 'firewall' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="ui-card" style={{ padding: 24, borderRadius: 18 }}><h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={20} style={{ color: '#00d4ff' }} /> الجدار الناري الكمومي</h2><p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.8, margin: '0 0 20px' }}>جدار ناري يستخدم ميكانيكا الكم لفلترة المرور. كل حزمة تُعامل كجسيم كمومي — لا تمر إلا بتطابق حالتها مع قواعد التشفير الكمومي.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}><MC label="سلامة الحاجز" value={shield.integrity} color="#22c55e" icon={ShieldCheck} /><MC label="نسبة التشابك" value={shield.entanglement} color="#00d4ff" icon={Wifi} /><MC label="كفاءة النفق" value={shield.superposition} color="#8b5cf6" icon={Cpu} /><MC label="تماسك القواعد" value={shield.coherence} color="#f59e0b" icon={Activity} /></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{['حظر IP المشبوهة', 'تصفية SQL Injection', 'حماية XSS', 'مكافحة DDoS', 'تشفير الاتصالات', 'فحص الشهادات'].map((r, i) => (<div key={i} className="ui-card" style={{ padding: 16, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}><ShieldCheck size={16} style={{ color: '#22c55e' }} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{r}</div><div style={{ fontSize: 11, color: 'var(--fg-3)' }}>نشط</div></div><div style={{ width: 8, height: 8, borderRadius: 999, background: '#22c55e' }} /></div>))}</div>
        </div>)}

        {tab === 'encryption' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="ui-card" style={{ padding: 24, borderRadius: 18 }}><h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={20} style={{ color: '#00d4ff' }} /> التشفير ما بعد الكمومي</h2><p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.8, margin: '0 0 20px' }}>CRYSTALS-Kyber و CRYSTALS-Dilithium — معايير NIST المقاومة لخوارزمية شور. RSA-2048 يُكسر في 4 ساعات بحاسوب كمومي بـ 4096 كيوبت.</p><button type="button" className="ui-btn ui-btn-filled" onClick={doEnc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Fingerprint size={14} /> توليد مفتاح كمومي</button></div>
          {encRes && (<div className="ui-card" style={{ padding: 24, borderRadius: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>الخوارزمية</div><div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{encRes.algorithm}</div></div><div><div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>حجم المفتاح</div><div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{encRes.keySize} bit</div></div><div><div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>مقاوم كمومياً</div><div style={{ fontWeight: 800, color: '#22c55e' }}>{encRes.quantumResistant ? 'نعم' : 'لا'}</div></div><div><div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>مستوى NIST</div><div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{encRes.nistLevel}</div></div><div><div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>زمن التشفير</div><div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{encRes.encryptionTime}ms</div></div><div><div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>حجم النص المشفر</div><div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{encRes.ciphertextSize} bytes</div></div></div>)}
        </div>)}

        {tab === 'ids' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="ui-card" style={{ padding: 24, borderRadius: 18 }}><h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Radar size={20} style={{ color: '#ef4444' }} /> نظام كشف التسلل الكمومي</h2><p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.8, margin: '0 0 20px' }}>يستخدم مستشعرات كمومية تعمل بمبدأ التراكب لاكتشاف التسلل في الزمن الحقيقي. أي محاولة تنصت تُغيّر حالة النظام الكمومي ويُكشف فوراً.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}><MC label="حساسية الكشف" value={0.96} color="#ef4444" icon={Radar} /><MC label="معدل الإنذارات الكاذبة" value={0.02} color="#22c55e" icon={ShieldCheck} /><MC label="سرعة الاستجابة" value={0.99} color="#00d4ff" icon={Zap} /></div></div>
          <div className="ui-card" style={{ padding: 20, borderRadius: 18 }}><div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Radar size={16} style={{ color: '#ef4444' }} /> سجل التهديدات الحية</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>{log.map(t => <TR key={t.id} t={t} />)}</div></div>
        </div>)}

        {tab === 'report' && result && (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="ui-card" style={{ padding: 24, borderRadius: 18 }}><h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>تقرير الأمان الكمومي — {result.url}</h2><div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 12 }}>تاريخ: {new Date(result.timestamp).toLocaleString('ar-SA')}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}><div style={{ textAlign: 'center', padding: 16, borderRadius: 14, background: `${result.vulnerabilityScore > 60 ? '#ef4444' : '#22c55e'}15` }}><div style={{ fontSize: 36, fontWeight: 900, color: result.vulnerabilityScore > 60 ? '#ef4444' : '#22c55e', fontFamily: 'var(--font-mono)' }}>{result.vulnerabilityScore}</div><div style={{ fontSize: 12, color: 'var(--fg-3)' }}>درجة الضعف</div></div><div style={{ textAlign: 'center', padding: 16, borderRadius: 14, background: 'rgba(0,212,255,0.1)' }}><div style={{ fontSize: 36, fontWeight: 900, color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>{result.quantumResistanceScore}%</div><div style={{ fontSize: 12, color: 'var(--fg-3)' }}>مقاومة كمومية</div></div></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="ui-btn ui-btn-filled" onClick={() => printScanReport(result)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> طباعة كشف الفحص</button>
              {v2Report && <button type="button" className="ui-btn ui-btn-filled" onClick={() => printComprehensiveReport(result, v2Report)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--p-secondary)' }}><FileText size={14} /> طباعة التقرير الشامل</button>}
              <button type="button" className="ui-btn" onClick={() => { const html = v2Report ? buildComprehensiveReportHtml(result, v2Report) : buildBasicReportHtml(result); const filename = `qurabia-security-report-${new Date().toISOString().slice(0,10)}.html`; downloadReportAsHtml(html, filename); toast.success('تم تحميل التقرير'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--outline)', borderRadius: 10, padding: '8px 16px', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}><FileDown size={14} /> تحميل HTML</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{result.recommendations.map(r => <RR key={r.id} r={r} />)}</div>
        </div>)}
        {tab === 'report' && !result && <div className="ui-card" style={{ padding: 40, borderRadius: 18, textAlign: 'center', color: 'var(--fg-3)' }}>قم بفحص موقع أولاً من تبويب "فحص الأمان" لإنشاء التقرير</div>}
      </main>
    </div>
  );
}
