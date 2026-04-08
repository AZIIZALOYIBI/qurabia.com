import { Check, Palette, Sparkles, X } from 'lucide-react';
import type React from 'react';

export type ThemePreset = 'QUANTUM_CYAN' | 'NEURAL_VIOLET' | 'SOLAR_GOLD' | 'VOID_EMERALD';

interface NeuroCustomizationProps {
  onClose: () => void;
  onThemeChange: (theme: ThemePreset) => void;
  currentTheme: ThemePreset;
}

const NeuroCustomization: React.FC<NeuroCustomizationProps> = ({ onClose, onThemeChange, currentTheme }) => {
  const presets: { id: ThemePreset; label: string; color: string; glow: string }[] = [
    { id: 'QUANTUM_CYAN', label: 'Cyan', color: '#00b8d4', glow: 'rgba(0, 184, 212, 0.35)' },
    { id: 'NEURAL_VIOLET', label: 'Violet', color: '#7c4dff', glow: 'rgba(124, 77, 255, 0.35)' },
    { id: 'SOLAR_GOLD', label: 'Amber', color: '#ffb300', glow: 'rgba(255, 179, 0, 0.35)' },
    { id: 'VOID_EMERALD', label: 'Emerald', color: '#00e5a8', glow: 'rgba(0, 229, 168, 0.35)' },
  ];

  const applyTheme = (theme: ThemePreset) => {
    onThemeChange(theme);
    const root = document.documentElement;
    const accent =
      theme === 'QUANTUM_CYAN'
        ? 'cyan'
        : theme === 'NEURAL_VIOLET'
          ? 'violet'
          : theme === 'SOLAR_GOLD'
            ? 'amber'
            : 'emerald';
    root.setAttribute('data-accent', accent);
    localStorage.setItem('qurabia.uiAccent', accent);
  };

  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="ui-card"
        role="dialog"
        aria-modal="true"
        aria-label="تخصيص الألوان"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: 'min(560px, 100%)', padding: 16, borderRadius: 22 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ui-icon-btn" aria-hidden="true">
              <Palette size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>تخصيص الثيم</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                Accent color + UI consistency
              </div>
            </div>
          </div>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="ui-divider" style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles size={14} aria-hidden="true" />
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: 12 }}>لوحات جاهزة</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {presets.map((p) => {
            const active = currentTheme === p.id;
            return (
              <button
                type="button"
                key={p.id}
                type="button"
                className={`ui-btn ${active ? 'ui-btn-tonal' : 'ui-btn-outlined'}`}
                onClick={() => applyTheme(p.id)}
                aria-pressed={active}
                aria-label={`اختيار لوحة: ${p.label}`}
                style={{ justifyContent: 'flex-start', paddingInline: 14 }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: p.color,
                    boxShadow: `0 0 0 3px ${p.glow}`,
                  }}
                />
                <span style={{ fontWeight: 900 }}>{p.label}</span>
                {active && <Check size={16} style={{ marginInlineStart: 'auto' }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" className="ui-btn ui-btn-filled" onClick={onClose} aria-label="تم">
            تم
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeuroCustomization;
