import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Shield, BrainCircuit, ChevronRight, X } from 'lucide-react';

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
        cursor: isDragging ? 'grabbing' : 'grab',
        width: 320,
        animation: 'uiPopIn var(--dur-3) var(--ease-emphasized)'
      }}
      className="ui-card"
      onMouseDown={handleMouseDown}
      role="complementary"
      aria-label="الطبقة العصبية (معلومات حيّة)"
    >
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ui-icon-btn" aria-hidden="true" style={{ width: 34, height: 34 }}>
              <BrainCircuit size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 900 }}>Neural Overlay</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>Real-time Pulse</div>
            </div>
          </div>
          <button className="ui-icon-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="إغلاق الطبقة" style={{ width: 34, height: 34 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <div className="ui-card" style={{ padding: 10, borderRadius: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: status === 'PROCESSING' ? 'var(--q-primary)' : 'var(--q-success)',
                    boxShadow: `0 0 0 3px ${status === 'PROCESSING' ? 'rgba(0,184,212,0.20)' : 'rgba(0,229,168,0.18)'}`,
                    animation: status === 'PROCESSING' ? 'overlayPulse 1.2s ease-in-out infinite' : 'none',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900 }}>{status}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900, color: 'var(--fg-2)' }}>{progress}%</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {metrics.map((m, i) => (
              <div key={i} className="ui-list-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ui-icon-btn" aria-hidden="true" style={{ width: 34, height: 34 }}>
                  <m.icon size={16} style={{ color: m.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 900 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{m.value}</div>
                </div>
                <ChevronRight size={16} aria-hidden="true" style={{ color: 'var(--fg-3)' }} />
              </div>
            ))}
          </div>

          <div className="ui-card" style={{ padding: 10, borderRadius: 18 }}>
            <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 44 }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  style={{
                    width: 8,
                    borderRadius: 999,
                    background: 'rgba(0,184,212,0.35)',
                    height: `${18 + Math.random() * 26}px`,
                    animation: `neuralWave ${900 + Math.random() * 800}ms ease-in-out infinite`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes overlayPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.92); }
        }
        @keyframes neuralWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.6); }
        }
      `}</style>
    </div>
  );
};

export default QuantumNeuralOverlay;
