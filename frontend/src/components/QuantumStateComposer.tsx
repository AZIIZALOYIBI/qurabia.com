/**
 * QuantumStateComposer — مُلحِّن الحالات الكمومية
 *
 * أداة تفاعلية مبتكرة تجمع بين الموسيقى والحوسبة الكمومية
 * تسمح بإنشاء حالات كمومية معقدة من خلال واجهة موسيقية بصرية
 * مع ألوان Claude الدافئة وتصميم ثوري
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Wand2,
  Download,
  Share2,
} from 'lucide-react';

// أنواع النوتات الكمومية
type QuantumNote = {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
  duration: number;
  color: string;
  qubitIndex: number;
  timestamp: number;
};

type ComposerMode = 'compose' | 'visualize' | 'simulate';

const QuantumStateComposer: React.FC = () => {
  const [notes, setNotes] = useState<QuantumNote[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<ComposerMode>('compose');
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [tempo, setTempo] = useState(120); // BPM

  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // ألوان Claude للنوتات
  const CLAUDE_NOTE_COLORS = ['#CC785C', '#D4A574', '#E8DCC8', '#BF9B6E'];

  // الترددات الموسيقية (معايرة كمومية)
  const QUANTUM_FREQUENCIES = {
    C: 261.63,
    D: 293.66,
    E: 329.63,
    F: 349.23,
    G: 392.00,
    A: 440.00,
    B: 493.88,
    'C#': 277.18,
  };

  // تهيئة Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // إضافة نوتة كمومية
  const addQuantumNote = useCallback((frequency: number) => {
    const newNote: QuantumNote = {
      id: `note-${Date.now()}-${Math.random()}`,
      frequency,
      amplitude: 0.5 + Math.random() * 0.5,
      phase: Math.random() * 2 * Math.PI,
      duration: 500,
      color: CLAUDE_NOTE_COLORS[selectedQubit % CLAUDE_NOTE_COLORS.length],
      qubitIndex: selectedQubit,
      timestamp: Date.now(),
    };

    setNotes(prev => [...prev, newNote]);

    // تشغيل الصوت
    if (!isMuted && audioContextRef.current) {
      playQuantumSound(newNote);
    }
  }, [selectedQubit, isMuted, CLAUDE_NOTE_COLORS]);

  // تشغيل صوت كمومي
  const playQuantumSound = useCallback((note: QuantumNote) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = note.frequency;

    // تطبيق الطور الكمومي على الصوت
    const phaseModulator = ctx.createOscillator();
    phaseModulator.frequency.value = note.phase;
    const phaseGain = ctx.createGain();
    phaseGain.gain.value = 0.1;
    phaseModulator.connect(phaseGain);
    phaseGain.connect(oscillator.frequency);

    gainNode.gain.setValueAtTime(note.amplitude, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + note.duration / 1000);
    phaseModulator.start(ctx.currentTime);
    phaseModulator.stop(ctx.currentTime + note.duration / 1000);
  }, []);

  // تصور الحالة الكمومية على Canvas
  const visualizeQuantumState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // مسح الخلفية
    ctx.fillStyle = 'rgba(7, 10, 15, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // رسم النوتات كموجات كمومية
    notes.forEach((note, idx) => {
      const age = Date.now() - note.timestamp;
      if (age > 5000) return; // إخفاء النوتات القديمة

      const opacity = Math.max(0, 1 - age / 5000);
      const y = height / 2;

      ctx.strokeStyle = `${note.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const t = x / width;
        const wave = Math.sin(t * Math.PI * 4 + note.phase + age * 0.001) * note.amplitude * 50;
        const yPos = y + wave + (idx - notes.length / 2) * 20;

        if (x === 0) {
          ctx.moveTo(x, yPos);
        } else {
          ctx.lineTo(x, yPos);
        }
      }
      ctx.stroke();

      // رسم دوائر النوتات
      const x = (age / 5000) * width;
      ctx.fillStyle = note.color;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, 5 + note.amplitude * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    animationFrameRef.current = requestAnimationFrame(visualizeQuantumState);
  }, [notes]);

  useEffect(() => {
    if (mode === 'visualize') {
      visualizeQuantumState();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode, visualizeQuantumState]);

  // تشغيل التسلسل
  const playSequence = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    let currentTime = 0;

    notes.forEach((note, idx) => {
      setTimeout(() => {
        if (!isMuted) {
          playQuantumSound(note);
        }
        if (idx === notes.length - 1) {
          setIsPlaying(false);
        }
      }, currentTime);
      currentTime += (60 / tempo) * 1000; // حساب الوقت بناءً على الـ BPM
    });
  }, [notes, isPlaying, isMuted, tempo, playQuantumSound]);

  // حساب احتمالات الحالة الكمومية
  const calculateQuantumProbabilities = useCallback(() => {
    const qubits = Math.max(...notes.map(n => n.qubitIndex), 0) + 1;
    const probs: number[] = new Array(Math.pow(2, qubits)).fill(0);

    notes.forEach(note => {
      const idx = note.qubitIndex % probs.length;
      probs[idx] += note.amplitude * note.amplitude;
    });

    // تطبيع
    const sum = probs.reduce((a, b) => a + b, 0) || 1;
    return probs.map(p => p / sum);
  }, [notes]);

  const probabilities = calculateQuantumProbabilities();

  return (
    <div
      className="quantum-composer"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, rgba(204, 120, 92, 0.03), rgba(212, 165, 116, 0.05))',
        border: '1px solid rgba(204, 120, 92, 0.15)',
        borderRadius: 'var(--r-3)',
        padding: 'var(--sp-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
        minHeight: 700,
      }}
    >
      <style>{`
        @keyframes pulse-note {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes wave-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .note-key {
          transition: all var(--dur-2) var(--ease-standard);
        }
        .note-key:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(204, 120, 92, 0.3);
        }
        .note-key:active {
          transform: translateY(0);
        }
      `}</style>

      {/* رأس المُلحِّن */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: '#CC785C',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Music size={28} />
            مُلحِّن الحالات الكمومية
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--fg-3)', fontSize: 'var(--fs-sm)' }}>
            قم بإنشاء حالات كمومية من خلال النوتات الموسيقية
          </p>
        </div>

        {/* أزرار الوضع */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {(['compose', 'visualize', 'simulate'] as ComposerMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: mode === m
                  ? 'linear-gradient(135deg, rgba(204, 120, 92, 0.2), rgba(204, 120, 92, 0.1))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${mode === m ? 'rgba(204, 120, 92, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8,
                padding: '8px 14px',
                color: mode === m ? '#CC785C' : 'var(--fg-3)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {m === 'compose' ? '🎼 تلحين' : m === 'visualize' ? '👁️ تصور' : '⚛️ محاكاة'}
            </button>
          ))}
        </div>
      </header>

      {/* لوحة التحكم */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
          padding: 'var(--sp-4)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--r-2)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={playSequence}
          disabled={notes.length === 0}
          style={{
            background: isPlaying
              ? 'rgba(239, 68, 68, 0.15)'
              : 'linear-gradient(135deg, rgba(204, 120, 92, 0.15), rgba(204, 120, 92, 0.08))',
            border: '1px solid rgba(204, 120, 92, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-4)',
            color: isPlaying ? '#ef4444' : '#CC785C',
            fontWeight: 600,
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? 'إيقاف' : 'تشغيل'}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: 'rgba(212, 165, 116, 0.1)',
            border: '1px solid rgba(212, 165, 116, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-3)',
            color: '#D4A574',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <button
          onClick={() => setNotes([])}
          style={{
            background: 'rgba(191, 155, 110, 0.1)',
            border: '1px solid rgba(191, 155, 110, 0.3)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--sp-2) var(--sp-3)',
            color: '#BF9B6E',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <RotateCcw size={16} />
          مسح
        </button>

        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-3)' }}>الإيقاع:</span>
          <input
            type="range"
            min="60"
            max="200"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span style={{ fontSize: 'var(--fs-xs)', color: '#D4A574', fontWeight: 700, minWidth: 50 }}>
            {tempo} BPM
          </span>
        </div>

        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-3)' }}>
          النوتات: {notes.length}
        </span>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, display: 'grid', gap: 'var(--sp-4)' }}>
        {mode === 'compose' && (
          <>
            {/* لوحة المفاتيح الموسيقية */}
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 'var(--r-2)',
                padding: 'var(--sp-4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 var(--sp-3)',
                  fontSize: 'var(--fs-base)',
                  fontWeight: 700,
                  color: '#CC785C',
                }}
              >
                🎹 لوحة المفاتيح الكمومية
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                  gap: 'var(--sp-2)',
                }}
              >
                {Object.entries(QUANTUM_FREQUENCIES).map(([note, freq]) => (
                  <button
                    key={note}
                    className="note-key"
                    onClick={() => addQuantumNote(freq)}
                    style={{
                      background: `linear-gradient(135deg, ${CLAUDE_NOTE_COLORS[selectedQubit % CLAUDE_NOTE_COLORS.length]}20, ${CLAUDE_NOTE_COLORS[selectedQubit % CLAUDE_NOTE_COLORS.length]}10)`,
                      border: `2px solid ${CLAUDE_NOTE_COLORS[selectedQubit % CLAUDE_NOTE_COLORS.length]}`,
                      borderRadius: 'var(--r-1)',
                      padding: 'var(--sp-3)',
                      color: CLAUDE_NOTE_COLORS[selectedQubit % CLAUDE_NOTE_COLORS.length],
                      fontWeight: 700,
                      fontSize: 'var(--fs-lg)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* اختيار الكيوبت */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-3)',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--r-1)',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>
                الكيوبت النشط:
              </span>
              {[0, 1, 2, 3].map(idx => (
                <button
                  key={idx}
                  onClick={() => setSelectedQubit(idx)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: selectedQubit === idx
                      ? `linear-gradient(135deg, ${CLAUDE_NOTE_COLORS[idx]}40, ${CLAUDE_NOTE_COLORS[idx]}20)`
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${selectedQubit === idx ? CLAUDE_NOTE_COLORS[idx] : 'rgba(255,255,255,0.1)'}`,
                    color: CLAUDE_NOTE_COLORS[idx],
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  q{idx}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'visualize' && (
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 'var(--r-2)',
              padding: 'var(--sp-3)',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              style={{ width: '100%', height: 'auto', borderRadius: 8 }}
            />
          </div>
        )}

        {mode === 'simulate' && (
          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 'var(--r-2)',
              padding: 'var(--sp-4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              style={{
                margin: '0 0 var(--sp-3)',
                fontSize: 'var(--fs-base)',
                fontWeight: 700,
                color: '#CC785C',
              }}
            >
              ⚛️ توزيع الاحتمالات الكمومية
            </h3>
            <div style={{ display: 'grid', gap: 'var(--sp-2)' }}>
              {probabilities.map((prob, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--fg-2)',
                      minWidth: 60,
                    }}
                  >
                    |{idx.toString(2).padStart(2, '0')}⟩
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.3)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${prob * 100}%`,
                        background: `linear-gradient(90deg, ${CLAUDE_NOTE_COLORS[idx % CLAUDE_NOTE_COLORS.length]}, ${CLAUDE_NOTE_COLORS[(idx + 1) % CLAUDE_NOTE_COLORS.length]})`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: prob > 0.5 ? '#000' : '#fff',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* تذييل مع معلومات */}
      <footer
        style={{
          padding: 'var(--sp-3)',
          background: 'rgba(232, 220, 200, 0.05)',
          borderRadius: 'var(--r-1)',
          border: '1px solid rgba(232, 220, 200, 0.15)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--fg-3)',
          textAlign: 'center',
        }}
      >
        💡 <strong>نصيحة:</strong> كل نوتة موسيقية تمثل حالة كمومية مع سعة وطور. قم بإنشاء تسلسلات معقدة لاستكشاف التراكب الكمومي!
      </footer>
    </div>
  );
};

export default QuantumStateComposer;
