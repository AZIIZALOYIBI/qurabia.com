import React, { useState, useEffect } from 'react';
import { Settings, Palette, Layout, Sparkles, X, Check } from 'lucide-react';

export type ThemePreset = 'QUANTUM_CYAN' | 'NEURAL_VIOLET' | 'SOLAR_GOLD' | 'VOID_EMERALD';

interface NeuroCustomizationProps {
  onClose: () => void;
  onThemeChange: (theme: ThemePreset) => void;
  currentTheme: ThemePreset;
}

const NeuroCustomization: React.FC<NeuroCustomizationProps> = ({ onClose, onThemeChange, currentTheme }) => {
  const presets: { id: ThemePreset; label: string; color: string; glow: string }[] = [
    { id: 'QUANTUM_CYAN', label: 'Quantum Cyan', color: '#00f5ff', glow: 'rgba(0, 245, 255, 0.4)' },
    { id: 'NEURAL_VIOLET', label: 'Neural Violet', color: '#b400ff', glow: 'rgba(180, 0, 255, 0.4)' },
    { id: 'SOLAR_GOLD', label: 'Solar Gold', color: '#ffc800', glow: 'rgba(255, 200, 0, 0.4)' },
    { id: 'VOID_EMERALD', label: 'Void Emerald', color: '#00ff9d', glow: 'rgba(0, 255, 157, 0.4)' },
  ];

  const applyTheme = (theme: ThemePreset) => {
    onThemeChange(theme);
    const root = document.documentElement;
    const colors = {
      QUANTUM_CYAN: { primary: '#00f5ff', dim: 'rgba(0,245,255,0.15)' },
      NEURAL_VIOLET: { primary: '#b400ff', dim: 'rgba(180,0,255,0.15)' },
      SOLAR_GOLD: { primary: '#ffc800', dim: 'rgba(255,200,0,0.15)' },
      VOID_EMERALD: { primary: '#00ff9d', dim: 'rgba(0,255,157,0.15)' },
    };
    
    const selected = colors[theme];
    root.style.setProperty('--c-cyan', selected.primary);
    root.style.setProperty('--c-cyan-dim', selected.dim);
    root.style.setProperty('--q-primary', selected.primary);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[480px] q-glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--c-cyan)]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--c-violet)]/10 rounded-full blur-3xl" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--c-cyan)]/10 rounded-2xl border border-[var(--c-cyan)]/20">
              <Palette className="w-6 h-6 text-[var(--c-cyan)]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter font-display">Neuro Customization</h2>
              <p className="text-[10px] text-[var(--t-secondary)] uppercase tracking-[0.2em]">Interface Synthesis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-8 relative z-10">
          {/* Theme Presets */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-3 h-3 text-[var(--c-cyan)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Presets</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyTheme(p.id)}
                  className={`group relative p-4 rounded-3xl border transition-all duration-500 overflow-hidden ${
                    currentTheme === p.id 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: p.color, boxShadow: `0 0 12px ${p.glow}` }} 
                    />
                    <span className={`text-xs font-bold uppercase tracking-tight ${currentTheme === p.id ? 'text-white' : 'text-slate-400'}`}>
                      {p.label}
                    </span>
                    {currentTheme === p.id && <Check className="w-3 h-3 text-[var(--c-cyan)] ml-auto" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Interface Layout */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-3 h-3 text-[var(--c-cyan)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structural Layout</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">Glassmorphism Intensity</span>
                <input type="range" className="w-32 h-1 accent-[var(--c-cyan)] bg-white/10 rounded-full appearance-none cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">Neural Glow Factor</span>
                <input type="range" className="w-32 h-1 accent-[var(--c-cyan)] bg-white/10 rounded-full appearance-none cursor-pointer" />
              </div>
            </div>
          </section>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-[var(--c-cyan)]/10 border border-[var(--c-cyan)]/30 rounded-2xl text-[var(--c-cyan)] text-xs font-black uppercase tracking-widest hover:bg-[var(--c-cyan)]/20 transition-all"
          >
            Finalize Synthesis
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeuroCustomization;
