/**
 * EthicsMonitor.tsx – مراقب الأخلاقيات الكمية
 * Ultimate Quantum SuperSystem v5.0
 *
 * يعرض هذا المكوّن:
 * - مقاييس الأخلاقيات الأربعة مع تلوين حسب الحالة
 * - شريط تقدم لكل معيار: NM / BN / AU / JU
 * - تاريخ الانتهاكات (إن وجدت)
 */

import React, { useEffect, useState } from 'react';

interface EthicsScore {
  nonMaleficence: number;
  beneficence: number;
  autonomy: number;
  justice: number;
}

// ================================================================
// العتبات والثوابت
// ================================================================

interface EthicsThreshold {
  key:   'nonMaleficence' | 'beneficence' | 'autonomy' | 'justice';
  label: string;
  labelAr: string;
  min:   number;
}

const ETHICS_THRESHOLDS: EthicsThreshold[] = [
  { key: 'nonMaleficence',  label: 'Non-Maleficence',  labelAr: 'عدم الإيذاء',    min: 0.95 },
  { key: 'beneficence',     label: 'Beneficence',      labelAr: 'الإحسان',        min: 0.80 },
  { key: 'autonomy',        label: 'Autonomy',         labelAr: 'الاستقلالية',    min: 0.90 },
  { key: 'justice',         label: 'Justice',          labelAr: 'العدالة',        min: 0.85 },
];

// ================================================================
// حساب اللون بناءً على النسبة من العتبة
// ================================================================

function scoreColor(value: number, minRequired: number): string {
  const ratio = value / minRequired;
  if (ratio >= 1.0)  return 'var(--quantum-green)';
  if (ratio >= 0.90) return 'var(--quantum-gold, #ffd700)';
  return 'var(--quantum-red, #ff3366)';
}

// ================================================================
// مكوّن شريط تقدم أخلاقي
// ================================================================

interface EthicsBarProps {
  threshold: EthicsThreshold;
  value:     number;
}

const EthicsBar: React.FC<EthicsBarProps> = ({ threshold, value }) => {
  const color   = scoreColor(value, threshold.min);
  const pct     = Math.min(100, (value / 1.0) * 100);
  const minMark = threshold.min * 100;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {threshold.labelAr}
          <span style={{ color: 'var(--text-muted)', marginRight: 4, marginLeft: 4 }}>
            ({threshold.label})
          </span>
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color, fontWeight: 600 }}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        position: 'relative',
        height: 6,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        overflow: 'visible',
      }}>
        {/* Fill */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
          opacity: 0.85,
        }} />
        {/* Minimum marker */}
        <div style={{
          position: 'absolute',
          left: `${minMark}%`,
          top: -3, bottom: -3,
          width: 1,
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 1,
        }} title={`الحد الأدنى: ${minMark}%`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          الحد الأدنى: {minMark}%
        </span>
      </div>
    </div>
  );
};

// ================================================================
// مكوّن بطاقة الانتهاك
// ================================================================

interface ViolationRecord {
  id:        number;
  criterion: string;
  value:     number;
  minReq:    number;
  ts:        number;
}

interface ViolationCardProps {
  violations: ViolationRecord[];
}

const ViolationLog: React.FC<ViolationCardProps> = ({ violations }) => {
  if (violations.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 9, color: 'var(--quantum-red, #ff3366)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        ⚠ انتهاكات ({violations.length})
      </div>
      <div style={{ maxHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {violations.map(v => (
          <div key={v.id} style={{
            padding: '3px 8px',
            background: 'rgba(255,51,102,0.07)',
            border: '1px solid rgba(255,51,102,0.2)',
            borderRadius: 4,
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{v.criterion}: {(v.value * 100).toFixed(1)}% &lt; {(v.minReq * 100).toFixed(0)}%</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {new Date(v.ts).toLocaleTimeString('en-GB')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
// المكوّن الرئيسي
// ================================================================

export interface EthicsMonitorProps {
  /** مصدر بيانات درجات الأخلاقيات — يسمح بإدخال خارجي */
  scoreSource?: () => EthicsScore;
  /** فترة التحديث بالمللي ثانية */
  refreshMs?: number;
  /** عرض النافذة */
  className?: string;
}

// توليد درجات افتراضية إذا لم يُوفَّر مصدر
function defaultScores(): EthicsScore {
  return {
    nonMaleficence: 0.96 + (Math.random() - 0.5) * 0.01,
    beneficence:    0.84 + (Math.random() - 0.5) * 0.02,
    autonomy:       0.91 + (Math.random() - 0.5) * 0.01,
    justice:        0.88 + (Math.random() - 0.5) * 0.015,
  };
}

export const EthicsMonitor: React.FC<EthicsMonitorProps> = ({
  scoreSource = defaultScores,
  refreshMs   = 3000,
  className   = '',
}) => {
  const [scores,     setScores]     = useState<EthicsScore>(scoreSource());
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const violIdRef = React.useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = scoreSource();
      setScores(next);

      // detect violations
      const newViolations: ViolationRecord[] = [];
      ETHICS_THRESHOLDS.forEach(t => {
        const val = next[t.key];
        if (val < t.min) {
          newViolations.push({
            id:        violIdRef.current++,
            criterion: t.labelAr,
            value:     val,
            minReq:    t.min,
            ts:        Date.now(),
          });
        }
      });

      if (newViolations.length > 0) {
        setViolations(prev => [...newViolations, ...prev].slice(0, 20));
      }
    }, refreshMs);

    return () => clearInterval(interval);
  }, [scoreSource, refreshMs]);

  const overallScore =
    (scores.nonMaleficence + scores.beneficence + scores.autonomy + scores.justice) / 4;
  const overallColor = overallScore >= 0.90
    ? 'var(--quantum-green)'
    : overallScore >= 0.80
    ? 'var(--quantum-gold)'
    : 'var(--quantum-red, #ff3366)';

  return (
    <div className={className}>
      {/* رأس المراقب */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          مراقب الأخلاقيات
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: overallColor }}>
          {(overallScore * 100).toFixed(1)}%
        </span>
      </div>

      {/* أشرطة المقاييس */}
      {ETHICS_THRESHOLDS.map(t => (
        <EthicsBar key={t.key} threshold={t} value={scores[t.key]} />
      ))}

      {/* سجل الانتهاكات */}
      <ViolationLog violations={violations} />
    </div>
  );
};

export default EthicsMonitor;
