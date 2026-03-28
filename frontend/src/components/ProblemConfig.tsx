import React from 'react';
import { SimulationType } from '../engine/SimulationFactory';
import { Settings2, Cpu, Zap, Beaker, ShieldCheck, TrendingUp, CpuIcon } from 'lucide-react';

interface ProblemConfigProps {
  type: SimulationType;
  params: any;
  onChange: (newParams: any) => void;
  onTypeChange: (newType: SimulationType) => void;
  onRun: () => void;
  disabled?: boolean;
}

const ProblemConfig: React.FC<ProblemConfigProps> = ({
  type,
  params,
  onChange,
  onTypeChange,
  onRun,
  disabled
}) => {
  const types: { value: SimulationType; label: string; icon: any; desc: string }[] = [
    { value: 'PHYSICS', label: 'Physics', icon: Zap, desc: 'Quantum Particles & Cosmology' },
    { value: 'CHEMISTRY', label: 'Chemistry', icon: Beaker, desc: 'VQE & Molecular Dynamics' },
    { value: 'CRYPTO', label: 'Crypto', icon: ShieldCheck, desc: 'BB84 & E91 Protocols' },
    { value: 'AI', label: 'AGI Core', icon: Cpu, desc: 'Quantum Machine Learning' },
    { value: 'FINANCE', label: 'Finance', icon: TrendingUp, desc: 'Portfolio Optimization' },
    { value: 'HYBRID', label: 'Hybrid', icon: CpuIcon, desc: 'Classical-Quantum Bridge' },
  ];

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ui-icon-btn" aria-hidden="true">
            <Settings2 size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>إعدادات المحاكاة</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Simulation Type & Parameters</div>
          </div>
        </div>
        <button className="ui-btn ui-btn-filled" onClick={onRun} disabled={disabled} aria-label="تشغيل المحاكاة">
          <Zap size={16} />
          {disabled ? 'جاري التنفيذ…' : 'تشغيل'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {types.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onTypeChange(t.value)}
              disabled={disabled}
              className={`ui-btn ${isActive ? 'ui-btn-tonal' : 'ui-btn-outlined'}`}
              aria-pressed={isActive}
              aria-label={`اختيار نوع المحاكاة: ${t.label}`}
              style={{ justifyContent: 'flex-start', paddingInline: 14 }}
            >
              <Icon size={16} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'right' }}>
                <span style={{ fontWeight: 900 }}>{t.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>{t.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="ui-divider" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {type === 'PHYSICS' && (
          <div className="ui-card" style={{ padding: 12, borderRadius: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <label htmlFor="q-frequency" className="ui-label">Reference Frequency (ν)</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
                {Number(params.frequency).toExponential(2)} Hz
              </span>
            </div>
            <input
              id="q-frequency"
              type="range"
              min="10000000000000"
              max="800000000000000"
              step="10000000000000"
              value={params.frequency}
              onChange={(e) => onChange({ ...params, frequency: Number(e.target.value) })}
              style={{ width: '100%', marginTop: 10 }}
              aria-label="تردد المرجع"
              disabled={disabled}
            />
          </div>
        )}

        {type === 'CHEMISTRY' && (
          <div className="ui-field">
            <label htmlFor="q-iter" className="ui-label">VQE Iterations</label>
            <input
              id="q-iter"
              className="ui-input"
              type="number"
              min={10}
              max={200}
              value={params.iterations ?? 60}
              onChange={(e) => onChange({ ...params, iterations: Number(e.target.value) })}
              disabled={disabled}
            />
          </div>
        )}

        <div className="ui-card" style={{ padding: 12, borderRadius: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="ui-field">
              <div className="ui-label">Alpha (α)</div>
              <div className="ui-input" aria-label="قيمة ألفا" style={{ display: 'flex', alignItems: 'center' }}>25.3</div>
            </div>
            <div className="ui-field">
              <div className="ui-label">Beta (β)</div>
              <div className="ui-input" aria-label="قيمة بيتا" style={{ display: 'flex', alignItems: 'center' }}>0.9985</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemConfig;
