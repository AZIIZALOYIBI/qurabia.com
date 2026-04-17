/**
 * ExperimentHistory — سجل التجارب التفاعلي
 *
 * يعرض تاريخ جميع التجارب مع إمكانية البحث، الفلترة، المقارنة، وإعادة التشغيل
 * مصمم بألوان Claude الدافئة مع واجهة Timeline إبداعية
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Search,
  Filter,
  BarChart3,
  Download,
  Play,
  Share2,
  Star,
  StarOff,
  Trash2,
  Eye,
} from 'lucide-react';

interface Experiment {
  id: string;
  name: string;
  type: string;
  timestamp: number;
  duration: number;
  energy: number;
  fidelity: number;
  qubits: number;
  gates: number;
  favorite: boolean;
  tags: string[];
}

// بيانات تجريبية
const MOCK_EXPERIMENTS: Experiment[] = [
  {
    id: '1',
    name: 'تشابك كمومي باستخدام Bell State',
    type: 'QUANTUM',
    timestamp: Date.now() - 3600000,
    duration: 2340,
    energy: 1.054e-34,
    fidelity: 0.978,
    qubits: 2,
    gates: 4,
    favorite: true,
    tags: ['تشابك', 'Bell', 'CNOT'],
  },
  {
    id: '2',
    name: 'خوارزمية Grover للبحث',
    type: 'ALGORITHM',
    timestamp: Date.now() - 7200000,
    duration: 4120,
    energy: 2.314e-34,
    fidelity: 0.956,
    qubits: 3,
    gates: 12,
    favorite: false,
    tags: ['بحث', 'Grover', 'Oracle'],
  },
  {
    id: '3',
    name: 'محاكاة جزيء الهيدروجين',
    type: 'VQE',
    timestamp: Date.now() - 10800000,
    duration: 8900,
    energy: 5.672e-34,
    fidelity: 0.991,
    qubits: 4,
    gates: 28,
    favorite: true,
    tags: ['VQE', 'كيمياء', 'جزيء'],
  },
  {
    id: '4',
    name: 'Shor للتحليل العاملي',
    type: 'ALGORITHM',
    timestamp: Date.now() - 14400000,
    duration: 15670,
    energy: 8.123e-34,
    fidelity: 0.923,
    qubits: 5,
    gates: 45,
    favorite: false,
    tags: ['Shor', 'تشفير', 'QFT'],
  },
];

const ExperimentHistory: React.FC = () => {
  const [experiments] = useState<Experiment[]>(MOCK_EXPERIMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // فلترة التجارب
  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      const matchesSearch =
        exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || exp.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [experiments, searchQuery, selectedType]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(experiments.map(e => e.type)));
    return ['all', ...uniqueTypes];
  }, [experiments]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}ث`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}د ${seconds % 60}ث`;
  };

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'منذ دقائق';
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  return (
    <div
      className="experiment-history"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, rgba(204, 120, 92, 0.02), rgba(212, 165, 116, 0.04))',
        border: '1px solid rgba(204, 120, 92, 0.12)',
        borderRadius: 'var(--r-3)',
        padding: 'var(--sp-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
        minHeight: 600,
      }}
    >
      <style>{`
        @keyframes timeline-entry {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .timeline-card {
          transition: all var(--dur-2) var(--ease-standard);
          animation: timeline-entry 0.3s var(--ease-emphasized) backwards;
        }
        .timeline-card:hover {
          transform: translateX(-4px);
          box-shadow: 0 4px 20px rgba(204, 120, 92, 0.15);
        }
      `}</style>

      {/* رأس السجل */}
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
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: '#CC785C',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Clock size={24} />
            سجل التجارب
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--fg-3)', fontSize: 'var(--fs-sm)' }}>
            {filteredExperiments.length} تجربة محفوظة
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters
                ? 'rgba(204, 120, 92, 0.15)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showFilters ? 'rgba(204, 120, 92, 0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 'var(--r-1)',
              padding: 'var(--sp-2) var(--sp-3)',
              color: showFilters ? '#CC785C' : 'var(--fg-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Filter size={16} />
            فلاتر
          </button>
        </div>
      </header>

      {/* شريط البحث والفلاتر */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-3)',
        }}
      >
        {/* البحث */}
        <div
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--fg-3)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في التجارب..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--r-1)',
              padding: 'var(--sp-3)',
              paddingRight: 40,
              color: 'var(--fg)',
              fontSize: 'var(--fs-sm)',
              fontFamily: 'var(--font-ar)',
              outline: 'none',
              transition: 'all var(--dur-2) var(--ease-standard)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(204, 120, 92, 0.4)';
              e.target.style.boxShadow = '0 0 0 3px rgba(204, 120, 92, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* الفلاتر */}
        {showFilters && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--sp-2)',
              flexWrap: 'wrap',
              padding: 'var(--sp-3)',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--r-1)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  background:
                    selectedType === type
                      ? 'linear-gradient(135deg, rgba(204, 120, 92, 0.2), rgba(204, 120, 92, 0.1))'
                      : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedType === type ? 'rgba(204, 120, 92, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  color: selectedType === type ? '#CC785C' : 'var(--fg-3)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all var(--dur-2) var(--ease-standard)',
                }}
              >
                {type === 'all' ? 'الكل' : type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* قائمة التجارب - Timeline */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-3)',
        }}
      >
        {filteredExperiments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--sp-6)',
              color: 'var(--fg-3)',
            }}
          >
            <p style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>لا توجد تجارب مطابقة</p>
            <p style={{ fontSize: 'var(--fs-sm)', margin: '8px 0 0' }}>
              جرّب تعديل معايير البحث أو الفلاتر
            </p>
          </div>
        ) : (
          filteredExperiments.map((exp, idx) => (
            <div
              key={exp.id}
              className="timeline-card"
              onClick={() => setSelectedExperiment(selectedExperiment?.id === exp.id ? null : exp)}
              style={{
                background: selectedExperiment?.id === exp.id
                  ? 'linear-gradient(135deg, rgba(204, 120, 92, 0.12), rgba(212, 165, 116, 0.08))'
                  : 'rgba(0,0,0,0.25)',
                border: `1px solid ${selectedExperiment?.id === exp.id ? 'rgba(204, 120, 92, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 'var(--r-2)',
                padding: 'var(--sp-4)',
                cursor: 'pointer',
                position: 'relative',
                animationDelay: `${idx * 0.05}s`,
              }}
            >
              {/* خط Timeline */}
              <div
                style={{
                  position: 'absolute',
                  right: 'var(--sp-4)',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'linear-gradient(180deg, rgba(204, 120, 92, 0.3), rgba(212, 165, 116, 0.1))',
                }}
              />

              {/* نقطة Timeline */}
              <div
                style={{
                  position: 'absolute',
                  right: 'calc(var(--sp-4) - 5px)',
                  top: 20,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: exp.favorite ? '#CC785C' : 'rgba(204, 120, 92, 0.4)',
                  border: '2px solid rgba(7, 10, 15, 1)',
                  boxShadow: exp.favorite ? '0 0 12px rgba(204, 120, 92, 0.6)' : 'none',
                }}
              />

              <div style={{ paddingRight: 24 }}>
                {/* رأس البطاقة */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 'var(--sp-3)',
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 'var(--fs-base)',
                        fontWeight: 700,
                        color: '#CC785C',
                        fontFamily: 'var(--font-ar)',
                      }}
                    >
                      {exp.name}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--sp-2)',
                        marginTop: 4,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--fg-3)',
                          textTransform: 'uppercase',
                          background: 'rgba(204, 120, 92, 0.15)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {exp.type}
                      </span>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-3)' }}>
                        <Clock size={11} style={{ display: 'inline', marginLeft: 3 }} />
                        {formatTimestamp(exp.timestamp)}
                      </span>
                    </div>
                  </div>

                  {exp.favorite && (
                    <Star size={18} fill="#CC785C" color="#CC785C" />
                  )}
                </div>

                {/* الإحصائيات */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: 'var(--sp-2)',
                    marginTop: 'var(--sp-3)',
                  }}
                >
                  {[
                    { label: 'الدقة', value: `${(exp.fidelity * 100).toFixed(1)}%` },
                    { label: 'الكيوبتات', value: exp.qubits },
                    { label: 'البوابات', value: exp.gates },
                    { label: 'المدة', value: formatDuration(exp.duration) },
                  ].map(stat => (
                    <div
                      key={stat.label}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8,
                        padding: 'var(--sp-2)',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--fg-3)',
                          marginBottom: 2,
                        }}
                      >
                        {stat.label}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--fs-sm)',
                          fontWeight: 700,
                          color: '#D4A574',
                        }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* الوسوم */}
                {exp.tags.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginTop: 'var(--sp-3)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {exp.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          background: 'rgba(232, 220, 200, 0.1)',
                          border: '1px solid rgba(232, 220, 200, 0.2)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          color: '#E8DCC8',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* الإجراءات - تظهر عند التوسيع */}
                {selectedExperiment?.id === exp.id && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--sp-2)',
                      marginTop: 'var(--sp-3)',
                      paddingTop: 'var(--sp-3)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {[
                      { icon: Play, label: 'إعادة', color: '#CC785C' },
                      { icon: Eye, label: 'عرض', color: '#D4A574' },
                      { icon: Share2, label: 'مشاركة', color: '#BF9B6E' },
                      { icon: Download, label: 'تصدير', color: '#E8DCC8' },
                    ].map(action => (
                      <button
                        key={action.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`${action.label} experiment:`, exp.id);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${action.color}40`,
                          borderRadius: 8,
                          padding: '6px 10px',
                          color: action.color,
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all var(--dur-2) var(--ease-standard)',
                        }}
                      >
                        <action.icon size={14} />
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExperimentHistory;
