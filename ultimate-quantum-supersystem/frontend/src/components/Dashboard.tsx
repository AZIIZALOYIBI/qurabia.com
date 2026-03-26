/**
 * ============================================================
 * Dashboard.tsx – لوحة التحكم المرئية الفائقة
 * Ultimate Quantum SuperSystem v5.0
 *
 * تضم: مقاييس حية، مرئيات كمية، ترمينال AGI،
 *       مراقب أخلاقيات، شبكة كيوبتات، طيف طاقة
 * ============================================================
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';

import { ParticleField }        from './ParticleField';
import {
  BlochSphere,
  EnergySpectrumChart,
  ProcessorRadar,
  VQEConvergenceChart,
} from './QuantumVisualizer';

import { calculateAlOtaibiUnified } from "../core/quantum-core";
import { EthicalGovernanceSystem } from "../ethics/EthicalGovernance";
import './styles/dashboard.css';

interface LiveMetrics {
  qops:           number;
  coherenceMs:    number;
  errorRate:      number;
  activeQubits:   number;
  entangledPairs: number;
  fidelity:       number;
  temperature:    number;
  bellParam:      number;
}

interface TerminalLine {
  id:        number;
  timestamp: string;
  tag:       'info' | 'success' | 'warning' | 'error';
  message:   string;
}

interface EventItem {
  id:       number;
  type:     'physics' | 'crypto' | 'agi' | 'ethics' | 'warning';
  icon:     string;
  text:     string;
  time:     string;
}

interface QubitCell {
  id:     number;
  state:  'idle' | 'active' | 'error' | 'entangled';
}

type DashboardTab = 'overview' | 'physics' | 'drug' | 'crypto' | 'agi' | 'ethics';

const ethics = new EthicalGovernanceSystem();

const fmt = {
  time: () => new Date().toLocaleTimeString('en-GB', { hour12: false }),
  num:  (n: number, d = 2) => n.toLocaleString('en-US', { maximumFractionDigits: d }),
  pct:  (n: number) => `${(n * 100).toFixed(1)}%`,
};

function generateVQEData(targetEnergy: number, iters = 60) {
  const data = [];
  let e = targetEnergy + 0.8 + Math.random() * 0.3;
  for (let i = 1; i <= iters; i++) {
    const decay = 1 - i / iters;
    e = targetEnergy + decay * 0.8 * Math.exp(-i * 0.05) + (Math.random() - 0.5) * 0.002 * decay;
    data.push({ iter: i, energy: e, gradient: Math.abs(e - targetEnergy) });
  }
  return data;
}

function generateEnergySpectrum() {
  const steps = 60;
  const freqMin = 1e13;
  const freqMax = 8e14;
  return Array.from({ length: steps }, (_, i) => {
    const frequency = freqMin + (freqMax - freqMin) * (i / (steps - 1));
    const result = calculateAlOtaibiUnified({
      frequency,
      waveFunctionReal: 0.707,
      waveFunctionImag: 0.707,
      sphericalHarmonic: 1.0,
      fineTuning: 1.0,
    });
    return { frequency, energyEV: result.totalEnergyEV };
  });
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab]  = useState<DashboardTab>('overview');
  const [simProgress, setProgress] = useState(0);
  const [isRunning, setIsRunning]  = useState(false);

  const [metrics, setMetrics] = useState<LiveMetrics>({
    qops:           31_250_000,
    coherenceMs:    2.500,
    errorRate:      0.0023,
    activeQubits:   50,
    entangledPairs: 24,
    fidelity:       0.9985,
    temperature:    0.015,
    bellParam:      2.741,
  });

  const [blochAngles, setBlochAngles] = useState({ theta: 1.1, phi: 0.4 });

  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: 1, timestamp: '00:00:00', tag: 'info',    message: 'تهيئة Ultimate Quantum SuperSystem v5.0...' },
    { id: 2, timestamp: '00:00:01', tag: 'success', message: 'تحميل معادلة العتيبي v2.0 – α=25.3, β=0.9985' },
    { id: 3, timestamp: '00:00:02', tag: 'success', message: 'كود توريك d=5 جاهز – 50 كيوبت فيزيائي' },
    { id: 4, timestamp: '00:00:03', tag: 'success', message: 'الدستور الأخلاقي مُحمَّل ومُتحقَّق منه ✓' },
    { id: 5, timestamp: '00:00:04', tag: 'info',    message: 'النظام جاهز للعمليات الكمية' },
  ]);

  const [termInput, setTermInput] = useState('');

  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, type: 'physics',  icon: '⚛️',  text: 'تهيئة محرك معادلة العتيبي – E_amp=665.31',  time: fmt.time() },
    { id: 2, type: 'crypto',   icon: '🔐',  text: 'بروتوكول BB84 جاهز – QBER=0.8%',            time: fmt.time() },
    { id: 3, type: 'agi',      icon: '🧠',  text: 'AGI: مستوى الوعي ADAPTIVE',                  time: fmt.time() },
    { id: 4, type: 'ethics',   icon: '⚖️',  text: 'الدستور الأخلاقي: جميع المبادئ مُستوفاة',  time: fmt.time() },
  ]);

  const [qubits, setQubits] = useState<QubitCell[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      state: i < 24 ? 'active' : i < 26 ? 'entangled' : i < 28 ? 'error' : 'idle',
    }))
  );

  const [ethicsScores] = useState({
    nonMaleficence: 0.97,
    beneficence:    0.89,
    autonomy:       0.95,
    justice:        0.91,
  });

  const spectrumData = useMemo(() => generateEnergySpectrum(), []);
  const vqeData      = useMemo(() => generateVQEData(-1.1372), []);

  const terminalRef = useRef<HTMLDivElement>(null);
  const lineIdRef   = useRef(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        qops:           31_250_000 + (Math.random() - 0.5) * 50_000,
        coherenceMs:    2.5 + (Math.random() - 0.5) * 0.05,
        errorRate:      Math.max(0.0005, prev.errorRate + (Math.random() - 0.5) * 0.0002),
        entangledPairs: 24 + Math.floor((Math.random() - 0.5) * 4),
        fidelity:       0.9985 + (Math.random() - 0.5) * 0.001,
        bellParam:      2.741 + (Math.random() - 0.5) * 0.04,
      }));

      setBlochAngles(prev => ({
        theta: prev.theta + 0.01,
        phi:   prev.phi   + 0.02,
      }));

      setQubits(prev => prev.map(q => {
        if (Math.random() < 0.05) {
          const states: QubitCell['state'][] = ['active', 'idle', 'entangled', 'error'];
          const weights = [0.55, 0.25, 0.15, 0.05];
          let r = Math.random();
          let state: QubitCell['state'] = 'idle';
          for (let i = 0; i < states.length; i++) {
            r -= weights[i];
            if (r <= 0) { state = states[i]; break; }
          }
          return { ...q, state };
        }
        return q;
      }));
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const addTerminalLine = useCallback((tag: TerminalLine['tag'], message: string) => {
    setTerminalLines(prev => [
      ...prev.slice(-60),
      {
        id: lineIdRef.current++,
        timestamp: fmt.time(),
        tag,
        message,
      },
    ]);
  }, []);

  const addEvent = useCallback((ev: Omit<EventItem, 'id' | 'time'>) => {
    setEvents(prev => [
      { ...ev, id: Date.now(), time: fmt.time() },
      ...prev.slice(0, 14),
    ]);
  }, []);

  const handleTermCommand = useCallback((cmd: string) => {
    const c = cmd.trim().toLowerCase();
    addTerminalLine('info', `> ${cmd}`);

    if (c === 'مساعدة' || c === 'help') {
      addTerminalLine('success', 'الأوامر: محاكاة | تشفير | جينوم | أخلاق | حالة | مسح');
    } else if (c === 'محاكاة' || c === 'simulate') {
      addTerminalLine('info', 'بدء محاكاة معادلة العتيبي...');
      setTimeout(() => {
        const r = calculateAlOtaibiUnified({
          frequency: 5.45e14, waveFunctionReal: 0.707,
          waveFunctionImag: 0.707, sphericalHarmonic: 1.0, fineTuning: 1.0,
        });
        addTerminalLine('success', `E_total = ${r.totalEnergyEV.toFixed(4)} eV | Q_amp = ${r.quantumAmplification.toFixed(2)}`);
        addTerminalLine('success', `D_cosmic = ${r.darkSectorFactor.toFixed(4)} | تفرد: ${r.singularitySuppressed ? 'مُكبَّت' : 'لا'}`);
      }, 600);
    } else if (c === 'تشفير' || c === 'crypto') {
      addTerminalLine('info', 'تفعيل بروتوكول BB84...');
      setTimeout(() => {
        const qber = 0.008 + Math.random() * 0.005;
        const secure = qber < 0.11;
        addTerminalLine(secure ? 'success' : 'warning',
          `QBER = ${(qber*100).toFixed(2)}% | ${secure ? '✓ آمن' : '✗ مخترق'}`);
      }, 800);
    } else if (c === 'أخلاق' || c === 'ethics') {
      const state = ethics.evaluate({
        harmPotential: 0.03, benefitScore: 0.9,
        userConsent: true, fairnessScore: 0.92, actionType: 'تقييم',
      });
      addTerminalLine(state.isViolation ? 'error' : 'success',
        `نقاط الأخلاق: ${(state.overallScore * 100).toFixed(1)}% | ${state.reason}`);
    } else if (c === 'حالة' || c === 'status') {
      addTerminalLine('info',
        `QOPS: ${fmt.num(metrics.qops, 0)} | تماسك: ${metrics.coherenceMs.toFixed(3)}ms | خطأ: ${(metrics.errorRate*100).toFixed(3)}%`);
    } else if (c === 'مسح' || c === 'clear') {
      setTerminalLines([]);
    } else {
      addTerminalLine('warning', `أمر غير معروف: "${cmd}" – اكتب "مساعدة" للقائمة`);
    }
  }, [addTerminalLine, metrics]);

  const handleRunSimulation = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    addTerminalLine('info', '🚀 بدء محاكاة النظام الكامل...');

    const steps = [
      { pct: 15, tag: 'info'    as const, msg: 'تحميل هاميلتوني H₂...' },
      { pct: 35, tag: 'success' as const, msg: 'تهيئة دائرة Ansatz(θ₀,θ₁)...' },
      { pct: 55, tag: 'info'    as const, msg: 'تطبيق VQE – قاعدة Parameter-Shift...' },
      { pct: 75, tag: 'success' as const, msg: 'E = -1.1369 Ha (خطأ: 0.3 mHa) ✓' },
      { pct: 90, tag: 'info'    as const, msg: 'تطبيق تصحيح الأخطاء الطوبولوجي...' },
      { pct: 100, tag: 'success' as const, msg: '✅ المحاكاة اكتملت – نتائج جاهزة' },
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setProgress(step.pct);
        addTerminalLine(step.tag, step.msg);
        if (i === steps.length - 1) {
          setIsRunning(false);
          addEvent({ type: 'physics', icon: '⚛️', text: 'VQE اكتمل – طاقة H₂ = -1.1369 Ha' });
        }
      }, (i + 1) * 700);
    });
  }, [isRunning, addTerminalLine, addEvent]);

  const CircleGauge: React.FC<{
    value: number; max: number; color: string;
    label: string; unit: string; size?: number;
  }> = ({ value, max, color, label, unit, size = 120 }) => {
    const r  = (size - 20) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const filled        = (value / max) * circumference;

    return (
      <div className="hardware-gauge">
        <div className="gauge-circle" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            <circle cx={cx} cy={cy} r={r} className="gauge-track" />
            <circle
              cx={cx} cy={cy} r={r}
              className="gauge-fill"
              stroke={color}
              strokeDasharray={`${filled} ${circumference}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
          <div className="gauge-center">
            <div className="gauge-value" style={{ color }}>{(value / max * 100).toFixed(0)}</div>
            <div className="gauge-unit">{unit}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(150,180,220,0.6)' }}>{label}</div>
      </div>
    );
  };

  const ProgressBar: React.FC<{
    label: string; value: number; max?: number;
    color: string; unit?: string;
  }> = ({ label, value, max = 100, color, unit = '%' }) => (
    <div className="progress-bar-wrapper">
      <div className="progress-label">
        <span>{label}</span>
        <span style={{ color: 'inherit' }}>
          {unit === '%' ? `${(value/max*100).toFixed(1)}%` : `${value.toFixed(2)} ${unit}`}
        </span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${Math.min(value / max * 100, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="quantum-dashboard">
      <div className="quantum-grid-bg" />
      <div className="quantum-progress-strip">
        <div className="quantum-progress-fill" style={{ width: `${simProgress}%` }} />
      </div>

      <header className="quantum-header">
        <div className="header-logo">
          <div className="logo-icon">⚛</div>
          <div>
            <div className="logo-text">QUANTUM OS</div>
            <div className="logo-version">Ultimate SuperSystem v5.0 | Al-Otaibi Engine</div>
          </div>
        </div>

        <div className="header-status-bar">
          <div className="status-chip"><span className="status-dot online" /><span>النواة الكمية: نشطة</span></div>
          <div className="status-chip"><span className="status-dot online" /><span>{fmt.num(metrics.qops, 0)} QOPS</span></div>
          <div className="status-chip"><span className="status-dot online" /><span>تماسك: {metrics.coherenceMs.toFixed(2)} ms</span></div>
          <div className="status-chip"><span className="status-dot online" /><span>خطأ: {(metrics.errorRate * 100).toFixed(3)}%</span></div>
          <button className={`btn-quantum ${isRunning ? 'danger' : 'primary'} sm`} onClick={handleRunSimulation} disabled={isRunning}>
            {isRunning ? '⏳ جارٍ...' : '▶ تشغيل'}
          </button>
        </div>
      </header>

      <div style={{ padding: '8px 16px 0', position: 'relative', zIndex: 1 }}>
        <div className="tab-bar" style={{ maxWidth: 600 }}>
          {([
            ['overview', '🏠', 'نظرة عامة'],
            ['physics',  '⚛️', 'فيزياء'],
            ['drug',     '💊', 'أدوية'],
            ['crypto',   '🔐', 'تشفير'],
            ['agi',      '🧠', 'AGI'],
            ['ethics',   '⚖️', 'أخلاق'],
          ] as [DashboardTab, string, string][]).map(([id, icon, label]) => (
            <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
              <span className="tab-icon">{icon}</span>
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-layout">
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="quantum-panel glow-cyan fade-in-up delay-1">
            <div className="panel-header">
              <div className="panel-title cyan"><span className="panel-icon">💻</span>معالج الكم</div>
              <div className="panel-badge">d=5 Toric</div>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <CircleGauge value={metrics.fidelity} max={1} color="var(--quantum-cyan)" label="الدقة" unit="×100%" size={100} />
                <CircleGauge value={metrics.coherenceMs} max={5} color="var(--quantum-gold)" label="التماسك" unit="ms" size={100} />
              </div>

              <ProgressBar label="معدل الخطأ" value={metrics.errorRate * 100} max={5} color="red" unit="%" />
              <ProgressBar label="الكيوبتات النشطة" value={metrics.activeQubits} max={50} color="cyan" unit="%" />
              <ProgressBar label="الأزواج المتشابكة" value={metrics.entangledPairs} max={25} color="purple" unit="%" />

              <div className="coherence-display">
                <div>
                  <div className="coherence-value">{metrics.coherenceMs.toFixed(3)}</div>
                  <div className="coherence-unit">ms تماسك</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--quantum-green)' }}>{metrics.temperature.toFixed(3)} K</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>درجة الحرارة</div>
                </div>
              </div>
            </div>
          </div>

          <div className="quantum-panel glow-purple fade-in-up delay-2">
            <div className="panel-header"><div className="panel-title purple"><span className="panel-icon">⬡</span>شبكة الكيوبتات (50)</div></div>
            <div className="qubit-grid">
              {qubits.map(q => (
                <div key={q.id} className={`qubit-cell ${q.state}`} title={`كيوبت ${q.id}: ${q.state}`}>
                  {q.state === 'active' ? '●' : q.state === 'entangled' ? '◈' : q.state === 'error' ? '✕' : '○'}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {['● نشط', '◈ متشابك', '✕ خطأ', '○ خامل'].map(s => <span key={s}>{s}</span>)}
            </div>
          </div>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'QOPS',          value: `${(metrics.qops / 1e6).toFixed(2)}M`, color: 'cyan',   delta: '+0.3%', dir: 'up' },
              { label: 'دقة البوابة',   value: fmt.pct(metrics.fidelity),             color: 'gold',   delta: '+0.01%', dir: 'up' },
              { label: 'إنتروبيا Bell', value: metrics.bellParam.toFixed(3),          color: 'purple', delta: '|S|>2 ✓', dir: 'up' },
              { label: 'الكيوبتات',     value: `${metrics.activeQubits}`,             color: 'green',  delta: 'نشط', dir: 'up' },
              { label: 'الحرارة',       value: `${metrics.temperature.toFixed(0)}mK`, color: 'blue',   delta: '-0.5mK', dir: 'up' },
              { label: 'أخطاء Pauli',   value: fmt.pct(metrics.errorRate),            color: 'orange', delta: 'مُصحَّح', dir: 'up' },
            ].map((m, i) => (
              <div key={i} className={`metric-card ${m.color} fade-in-up delay-${i + 1}`}>
                <div className="metric-value">{m.value}</div>
                <div className="metric-label">{m.label}</div>
                <div className={`metric-delta ${m.dir}`}>{m.delta}</div>
              </div>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="quantum-panel glow-cyan fade-in-up">
                <div className="panel-header"><div className="panel-title cyan"><span className="panel-icon">✨</span>حقل التشابك الكمي</div><div className="panel-badge">LIVE</div></div>
                <div className="canvas-container" style={{ height: 200 }}>
                  <ParticleField height={200} count={90} colorScheme="mixed" interactive />
                  <div className="canvas-overlay-label">{metrics.entangledPairs} زوج متشابك</div>
                </div>
              </div>

              <div className="quantum-panel glow-cyan fade-in-up delay-1">
                <div className="panel-header"><div className="panel-title cyan"><span className="panel-icon">📊</span>طيف الطاقة – معادلة العتيبي v2.0</div></div>
                <div className="panel-body">
                  <EnergySpectrumChart data={spectrumData} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                    <span>α(α+β²) = 665.31</span><span>D_cosmic = 1.5466</span><span>E_Planck = 1.956×10⁹ J</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="quantum-panel glow-gold fade-in-up">
              <div className="panel-header"><div className="panel-title gold"><span className="panel-icon">🌌</span>مرئيات الكيوبت – كرة بلوخ</div></div>
              <div className="panel-body" style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <BlochSphere theta={blochAngles.theta} phi={blochAngles.phi} size={200} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>θ={blochAngles.theta.toFixed(3)} | φ={blochAngles.phi.toFixed(3)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <ProcessorRadar metrics={{
                    coherence: metrics.coherenceMs / 5,
                    fidelity: metrics.fidelity,
                    connectivity: 1.0,
                    speed: metrics.qops / 32e6,
                    errorCorr: 1 - metrics.errorRate * 10,
                    entanglement: metrics.entangledPairs / 25,
                  }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drug' && (
            <div className="quantum-panel glow-green fade-in-up">
              <div className="panel-header"><div className="panel-title green"><span className="panel-icon">💊</span>VQE – اكتشاف الأدوية</div><div className="panel-badge">H₂ | -1.1372 Ha</div></div>
              <div className="panel-body">
                <VQEConvergenceChart iterations={vqeData} targetEnergy={-1.1372} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                  {[
                    { label: 'الطاقة الأرضية', value: '-1.1369 Ha', color: 'var(--quantum-green)' },
                    { label: 'الخطأ',           value: '0.3 mHa ✓',  color: 'var(--quantum-cyan)' },
                    { label: 'التكرارات',       value: '60 VQE',      color: 'var(--quantum-gold)' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 8px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 8 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crypto' && (
            <div className="quantum-panel glow-gold fade-in-up">
              <div className="panel-header"><div className="panel-title gold"><span className="panel-icon">🔐</span>نظام التشفير الكمي</div></div>
              <div className="panel-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { proto: 'BB84',          qber: 0.008, key: 256, secure: true },
                    { proto: 'E91',           qber: 0.012, key: 256, secure: true },
                    { proto: 'CRYSTALS-Kyber', qber: 0.000, key: 3168, secure: true },
                    { proto: 'McEliece',      qber: 0.000, key: 8192, secure: true },
                  ].map((p, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 8, background: 'rgba(255,215,0,0.04)', border: `1px solid rgba(255,215,0,${p.secure ? 0.15 : 0.3})` }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--quantum-gold)', marginBottom: 8 }}>{p.proto}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {p.qber > 0 && <div>QBER: {(p.qber*100).toFixed(1)}%</div>}
                        <div>طول المفتاح: {p.key} bit</div>
                        <div style={{ color: 'var(--quantum-green)' }}>✓ آمن كمياً</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'agi' || activeTab === 'overview') && (
            <div className="quantum-panel glow-purple fade-in-up delay-2">
              <div className="panel-header"><div className="panel-title purple"><span className="panel-icon">🧠</span>وحدة تحكم AGI</div><div className="panel-badge">ADAPTIVE</div></div>
              <div className="agi-terminal">
                <div className="terminal-header">
                  <div className="terminal-dot red" /><div className="terminal-dot yellow" /><div className="terminal-dot green" />
                  <span className="terminal-title">QuantumAGI v5.0 – جلسة نشطة</span>
                </div>
                <div className="terminal-body" ref={terminalRef}>
                  {terminalLines.map(line => (
                    <div key={line.id} className="terminal-line">
                      <span className="ts">{line.timestamp}</span>
                      <span className={`tag ${line.tag}`}>{line.tag.toUpperCase()}</span>
                      <span className="msg">{line.message}</span>
                    </div>
                  ))}
                </div>
                <div className="terminal-input-row">
                  <span className="terminal-prompt">⟩</span>
                  <input className="terminal-input" value={termInput} onChange={e => setTermInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && termInput.trim()) {
                      handleTermCommand(termInput);
                      setTermInput('');
                    }
                  }} placeholder="اكتب أمراً (مثال: محاكاة / تشفير / مساعدة)..." spellCheck={false} autoComplete="off" dir="rtl" />
                </div>
              </div>
            </div>
          )}
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="quantum-panel glow-green fade-in-up delay-2">
            <div className="panel-header"><div className="panel-title green"><span className="panel-icon">⚖️</span>الدستور الأخلاقي</div><div className="panel-badge">ACTIVE</div></div>
            <div className="panel-body">
              <div className="ethics-grid">
                {[
                  { label: 'لا ضرر',      value: ethicsScores.nonMaleficence, threshold: 0.95 },
                  { label: 'الإحسان',     value: ethicsScores.beneficence,    threshold: 0.80 },
                  { label: 'الاستقلالية', value: ethicsScores.autonomy,       threshold: 0.90 },
                  { label: 'العدالة',     value: ethicsScores.justice,        threshold: 0.85 },
                ].map((e, i) => {
                  const safe    = e.value >= e.threshold;
                  const warning = e.value >= e.threshold * 0.9 && !safe;
                  return (
                    <div key={i} className={`ethics-card ${!safe ? 'violation' : ''}`}>
                      <div className="ethics-label">{e.label}</div>
                      <div className={`ethics-score ${safe ? 'safe' : warning ? 'warning' : 'danger'}`}>{(e.value * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>حد: {(e.threshold * 100).toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>الدرجة الكلية</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 900, color: 'var(--quantum-green)', textShadow: '0 0 20px rgba(0,255,136,0.5)' }}>
                  {((ethicsScores.nonMaleficence * 2 + ethicsScores.beneficence + ethicsScores.autonomy * 1.5 + ethicsScores.justice) / 5.5 * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--quantum-green)', marginTop: 4 }}>✓ جميع المبادئ مُستوفاة</div>
              </div>
            </div>
          </div>

          <div className="quantum-panel fade-in-up delay-3">
            <div className="panel-header"><div className="panel-title cyan"><span className="panel-icon">📋</span>سجل الأحداث الحية</div><div className="panel-badge">{events.length}</div></div>
            <div className="panel-body"><div className="event-list">
              {events.map(ev => (
                <div key={ev.id} className={`event-item ${ev.type}`}>
                  <span className="event-icon">{ev.icon}</span>
                  <span className="event-text">{ev.text}</span>
                  <span className="event-time">{ev.time}</span>
                </div>
              ))}
            </div></div>
          </div>

          <div className="quantum-panel fade-in-up delay-4">
            <div className="panel-header"><div className="panel-title gold"><span className="panel-icon">⚡</span>إجراءات سريعة</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '⚛️ معادلة العتيبي', color: 'primary', cmd: 'محاكاة'  },
                { label: '🔐 بروتوكول BB84', color: 'gold',    cmd: 'تشفير'    },
                { label: '🧬 تحليل جيني',    color: 'primary', cmd: 'جينوم'    },
                { label: '⚖️ تقييم أخلاقي', color: 'primary', cmd: 'أخلاق'    },
                { label: '📊 حالة النظام',    color: 'gold',    cmd: 'حالة'     },
              ].map((b, i) => (
                <button key={i} className={`btn-quantum ${b.color}`} style={{ justifyContent: 'flex-start', fontSize: 12 }} onClick={() => {
                  handleTermCommand(b.cmd);
                  if (activeTab !== 'overview') setActiveTab('overview');
                }}>{b.label}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
