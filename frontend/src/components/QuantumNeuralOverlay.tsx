import React, { useState, useEffect } from 'react';
import { Activity, Zap, Cpu, Shield, Clock, BrainCircuit, ChevronRight, X } from 'lucide-react';

interface QuantumNeuralOverlayProps {
  status: string;
  progress: number;
  onClose: () => void;
}

const QuantumNeuralOverlay: React.FC<QuantumNeuralOverlayProps> = ({ status, progress, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const metrics = [
    { label: 'Neural Coherence', value: '98.4%', icon: Activity, color: 'var(--c-cyan)' },
    { label: 'Qubit Sync', value: '50/50', icon: Cpu, color: 'var(--c-gold)' },
    { label: 'Ethics Gate', value: 'SECURE', icon: Shield, color: 'var(--c-emerald)' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        left: position.x, 
        top: position.y, 
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className="w-72 q-glass rounded-3xl p-5 border border-white/10 shadow-2xl animate-in slide-in-from-left-4 fade-in duration-500"
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--c-cyan)]/10 rounded-xl">
            <BrainCircuit className="w-4 h-4 text-[var(--c-cyan)]" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-tighter font-display">Neural Overlay</h4>
            <p className="text-[8px] text-[var(--t-secondary)] uppercase tracking-[0.1em]">Real-time Pulse</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Status Chip */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'PROCESSING' ? 'bg-[var(--c-cyan)] animate-pulse' : 'bg-[var(--c-emerald)]'}`} />
            <span className="text-[9px] font-bold text-slate-300 uppercase">{status}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--c-cyan)] font-bold">{progress}%</span>
        </div>

        {/* Mini Metrics */}
        <div className="grid grid-cols-1 gap-2">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-white/3 rounded-xl hover:bg-white/6 transition-colors group">
              <div className="p-1.5 bg-white/5 rounded-lg">
                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="flex-1">
                <div className="text-[8px] text-slate-500 uppercase font-black">{m.label}</div>
                <div className="text-[10px] font-mono font-bold text-slate-200">{m.value}</div>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-[var(--c-cyan)] transition-colors" />
            </div>
          ))}
        </div>

        {/* Waveform Visualization */}
        <div className="h-10 w-full bg-white/5 rounded-xl overflow-hidden flex items-end justify-between p-2 gap-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <div 
              key={i} 
              className="w-full bg-[var(--c-cyan)]/40 rounded-full" 
              style={{ 
                height: `${20 + Math.random() * 80}%`,
                transition: 'height 0.3s ease',
                animation: `neuralWave ${1 + Math.random()}s ease-in-out infinite`
              }} 
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes neuralWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.6); }
        }
      `}</style>
    </div>
  );
};

export default QuantumNeuralOverlay;
