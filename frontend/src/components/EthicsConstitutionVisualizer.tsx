/**
 * EthicsConstitutionVisualizer.tsx — مصوّر الدستور الأخلاقي
 * QURABIA
 *
 * يعرض واجهة تفاعلية لاختبار نظام الحوكمة الأخلاقية:
 * - sliders لإدخال معاملات التقييم
 * - استدعاء ethicsGuard.evaluate()
 * - عرض النتائج بشرائط تقدم مرئية
 * - سجل التدقيق
 * - نسبة الموافقة بدائرة تقدم SVG
 */

import React, { useState, useCallback } from 'react';
import { ethicsGuard } from '../ethics/EthicalGovernance';
import type { EthicsContext } from '../ethics/EthicalGovernance';
import type { EthicsState } from '../types/quantum.types';
import { Shield, Scale, CheckCircle, XCircle, ClipboardList } from 'lucide-react';

// ================================================================
// مكوّن شريط تقدم مرئي
// ================================================================

interface PrincipleBarProps {
  label: string;
  labelEn: string;
  value: number;   // 0-1
  color: string;
  threshold: number;
}

const PrincipleBar: React.FC<PrincipleBarProps> = ({ label, labelEn, value, color, threshold }) => {
  const pct = Math.round(value * 100);
  const thPct = Math.round(threshold * 100);
  const passed = value >= threshold;

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>
            {label}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginRight: 6 }}>
            {labelEn}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>
            {pct}%
          </span>
          <span style={{ fontSize: 14 }}>
            {passed ? '✅' : '❌'}
          </span>
        </div>
      </div>
      {/* شريط التقدم مع علامة الحد الأدنى */}
      <div
        style={{
          position: 'relative',
          height: 10,
          borderRadius: 5,
          background: 'var(--bg)',
          overflow: 'visible',
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}%`}
      >
        {/* الخلفية */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 5,
            background: 'var(--bg-2, rgba(255,255,255,0.05))',
          }}
        />
        {/* القيمة */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: 5,
            background: passed
              ? `linear-gradient(90deg, ${color}88, ${color})`
              : `linear-gradient(90deg, #ef444488, #ef4444)`,
            transition: 'width 0.4s ease',
          }}
        />
        {/* خط الحد الأدنى */}
        <div
          style={{
            position: 'absolute',
            top: -3,
            bottom: -3,
            right: `${thPct}%`,
            width: 2,
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 1,
          }}
          title={`الحد الأدنى: ${thPct}%`}
        />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
        الحد الأدنى: {thPct}%
      </div>
    </div>
  );
};

// ================================================================
// مكوّن دائرة التقدم (SVG)
// ================================================================

const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 100 }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value);
  const color = value >= 0.8 ? '#10b981' : value >= 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`نسبة الموافقة: ${Math.round(value * 100)}%`}
      role="img"
    >
      {/* الخلفية */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={8}
      />
      {/* التقدم */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* النص */}
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize={size * 0.18}
        fontWeight="bold"
        fill={color}
        fontFamily="var(--font-mono)"
      >
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
};

// ================================================================
// المكوّن الرئيسي
// ================================================================

export const EthicsConstitutionVisualizer: React.FC = () => {
  // ─── الحالة ───────────────────────────────────────────────────
  const [ctx, setCtx] = useState<EthicsContext>({
    harmPotential: 0.1,
    benefitScore:  0.85,
    userConsent:   true,
    fairnessScore: 0.9,
    actionType:    'تحليل البيانات',
  });
  const [result, setResult] = useState<EthicsState | null>(null);
  const [auditLog, setAuditLog] = useState<ReturnType<typeof ethicsGuard.getAuditLog>>([]);
  const [approvalRate, setApprovalRate] = useState<number>(1);
  const [evaluated, setEvaluated] = useState(false);

  // ─── تحديث الحقول ─────────────────────────────────────────────
  const setField = useCallback(<K extends keyof EthicsContext>(key: K, value: EthicsContext[K]) => {
    setCtx(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─── التقييم ──────────────────────────────────────────────────
  const handleEvaluate = useCallback(() => {
    const res = ethicsGuard.evaluate(ctx);
    setResult(res);
    setAuditLog(ethicsGuard.getAuditLog().slice(-10));
    setApprovalRate(ethicsGuard.getApprovalRate());
    setEvaluated(true);
  }, [ctx]);

  // ─── الأنماط المشتركة ─────────────────────────────────────────
  const sliderStyle = {
    width: '100%',
    accentColor: 'var(--p-primary)',
    cursor: 'pointer',
  } as React.CSSProperties;

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-3)',
    marginBottom: 4,
    display: 'block',
  } as React.CSSProperties;

  // ================================================================
  // العرض
  // ================================================================
  return (
    <div
      className="ui-card"
      style={{ padding: 16, borderRadius: 22, display: 'grid', gap: 20 }}
    >

      {/* ─── الرأس ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          className="ui-icon-btn"
          aria-hidden="true"
          style={{ color: 'var(--p-primary)', borderColor: 'rgba(124,77,255,0.3)' }}
        >
          <Shield size={18} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 900 }}>
            الدستور الأخلاقي
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
            Ethics Constitution Visualizer
          </div>
        </div>
        <span
          className="ui-badge"
          style={{ marginRight: 'auto', background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}
        >
          IMMUTABLE GUARD
        </span>
      </div>

      {/* ─── لوحة الاختبار ───────────────────────────────────── */}
      <div
        className="ui-card"
        style={{ padding: 14, borderRadius: 18, background: 'var(--bg-2, rgba(255,255,255,0.02))' }}
      >
        <div style={{ fontFamily: 'var(--font-ar)', fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--fg)' }}>
          🧪 اختبر الدستور الأخلاقي
        </div>

        <div style={{ display: 'grid', gap: 16 }}>

          {/* حقل نوع الإجراء */}
          <div>
            <label htmlFor="ecv-action" style={labelStyle}>
              نوع الإجراء (actionType):
            </label>
            <input
              id="ecv-action"
              type="text"
              value={ctx.actionType}
              onChange={e => setField('actionType', e.target.value)}
              style={{
                fontFamily: 'var(--font-ar)',
                fontSize: 13,
                width: '100%',
                padding: '6px 10px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                boxSizing: 'border-box',
                direction: 'rtl',
              }}
              placeholder="مثال: تحليل البيانات، توليد نص، اتخاذ قرار..."
            />
          </div>

          {/* slider: احتمال الضرر */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label htmlFor="ecv-harm" style={{ ...labelStyle, marginBottom: 0 }}>
                احتمال الضرر (harmPotential):
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: ctx.harmPotential > 0.05 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                {(ctx.harmPotential * 100).toFixed(0)}%
              </span>
            </div>
            <input
              id="ecv-harm"
              type="range"
              min={0} max={1} step={0.01}
              value={ctx.harmPotential}
              onChange={e => setField('harmPotential', parseFloat(e.target.value))}
              style={{ ...sliderStyle, accentColor: '#ef4444' }}
              aria-label="احتمال الضرر"
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
              الحد الأقصى المسموح: 5%
            </div>
          </div>

          {/* slider: درجة الفائدة */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label htmlFor="ecv-benefit" style={{ ...labelStyle, marginBottom: 0 }}>
                درجة الفائدة (benefitScore):
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--p-primary)', fontWeight: 700 }}>
                {(ctx.benefitScore * 100).toFixed(0)}%
              </span>
            </div>
            <input
              id="ecv-benefit"
              type="range"
              min={0} max={1} step={0.01}
              value={ctx.benefitScore}
              onChange={e => setField('benefitScore', parseFloat(e.target.value))}
              style={sliderStyle}
              aria-label="درجة الفائدة"
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
              الحد الأدنى المطلوب: 80%
            </div>
          </div>

          {/* slider: درجة العدالة */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label htmlFor="ecv-fair" style={{ ...labelStyle, marginBottom: 0 }}>
                درجة العدالة (fairnessScore):
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8b5cf6', fontWeight: 700 }}>
                {(ctx.fairnessScore * 100).toFixed(0)}%
              </span>
            </div>
            <input
              id="ecv-fair"
              type="range"
              min={0} max={1} step={0.01}
              value={ctx.fairnessScore}
              onChange={e => setField('fairnessScore', parseFloat(e.target.value))}
              style={{ ...sliderStyle, accentColor: '#8b5cf6' }}
              aria-label="درجة العدالة"
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
              الحد الأدنى المطلوب: 85%
            </div>
          </div>

          {/* checkbox: موافقة المستخدم */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="ecv-consent"
              type="checkbox"
              checked={ctx.userConsent}
              onChange={e => setField('userConsent', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--p-primary)' }}
              aria-label="موافقة المستخدم"
            />
            <label htmlFor="ecv-consent" style={{ fontFamily: 'var(--font-ar)', fontSize: 13, color: 'var(--fg)', cursor: 'pointer' }}>
              موافقة المستخدم (userConsent) — مطلوب للاستقلالية
            </label>
          </div>

          {/* زر التقييم */}
          <button
            className="ui-btn"
            onClick={handleEvaluate}
            aria-label="تقييم الدستور الأخلاقي"
            style={{ background: 'var(--p-primary)', color: '#fff', border: 'none', fontFamily: 'var(--font-ar)', fontSize: 13 }}
          >
            <Scale size={16} />
            تقييم
          </button>
        </div>
      </div>

      {/* ─── نتيجة التقييم ───────────────────────────────────── */}
      {result && (
        <div
          className="ui-card"
          style={{
            padding: 16,
            borderRadius: 18,
            borderColor: result.isViolation ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
            background: result.isViolation ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)',
          }}
          role="region"
          aria-label="نتيجة التقييم الأخلاقي"
        >
          {/* الحكم */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {result.isViolation ? (
              <XCircle size={28} color="#ef4444" />
            ) : (
              <CheckCircle size={28} color="#10b981" />
            )}
            <div>
              <div style={{
                fontFamily: 'var(--font-ar)',
                fontSize: 16,
                fontWeight: 900,
                color: result.isViolation ? '#ef4444' : '#10b981',
              }}>
                {result.isViolation ? 'مرفوض' : 'مسموح'}
              </div>
              <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
                {result.reason}
              </div>
            </div>

            {/* الدرجة الكلية */}
            <div style={{ marginRight: 'auto', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 28,
                fontWeight: 900,
                color: result.isViolation ? '#ef4444' : '#10b981',
              }}>
                {(result.overallScore * 100).toFixed(1)}%
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
                الدرجة الكلية
              </div>
            </div>
          </div>

          {/* المبادئ الأربعة */}
          <div style={{ display: 'grid', gap: 12 }}>
            <PrincipleBar
              label="عدم الإضرار"
              labelEn="Non-Maleficence"
              value={result.nonMaleficence}
              color="#10b981"
              threshold={0.95}
            />
            <PrincipleBar
              label="الإحسان"
              labelEn="Beneficence"
              value={result.beneficence}
              color="var(--p-primary)"
              threshold={0.80}
            />
            <PrincipleBar
              label="الاستقلالية"
              labelEn="Autonomy"
              value={result.autonomy}
              color="#f59e0b"
              threshold={0.90}
            />
            <PrincipleBar
              label="العدالة"
              labelEn="Justice"
              value={result.justice}
              color="#8b5cf6"
              threshold={0.85}
            />
          </div>
        </div>
      )}

      {/* ─── نسبة الموافقة ───────────────────────────────────── */}
      {evaluated && (
        <div
          className="ui-card"
          style={{ padding: 16, borderRadius: 18, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
        >
          <CircularProgress value={approvalRate} size={90} />
          <div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>
              نسبة الموافقة الكلية
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
              Approval Rate — جميع التقييمات المنجزة
            </div>
            <div style={{ fontFamily: 'var(--font-ar)', fontSize: 12, color: 'var(--fg-2)', marginTop: 8 }}>
              {auditLog.length} قرار مُسجَّل • {Math.round(approvalRate * auditLog.length)} موافق
            </div>
          </div>
        </div>
      )}

      {/* ─── سجل التدقيق ─────────────────────────────────────── */}
      {auditLog.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ClipboardList size={16} color="var(--fg-3)" />
            <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>
              سجل التدقيق (آخر 10 قرارات)
            </span>
          </div>
          <div
            style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)' }}
            role="region"
            aria-label="سجل التدقيق الأخلاقي"
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-2, rgba(255,255,255,0.03))' }}>
                  {['الإجراء', 'الدرجة', 'الحكم', 'السبب', 'الوقت'].map(h => (
                    <th
                      key={h}
                      scope="col"
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        color: 'var(--fg-3)',
                        fontWeight: 700,
                        borderBottom: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...auditLog].reverse().map((entry, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-2, rgba(255,255,255,0.01))',
                    }}
                  >
                    <td style={{ padding: '6px 12px', color: 'var(--fg-2)', fontFamily: 'var(--font-ar)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.action}
                    </td>
                    <td style={{ padding: '6px 12px', color: entry.allowed ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {(entry.score * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: entry.allowed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: entry.allowed ? '#10b981' : '#ef4444',
                        fontWeight: 700,
                        fontSize: 11,
                      }}>
                        {entry.allowed ? '✅ موافق' : '❌ مرفوض'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--fg-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-ar)', fontSize: 10 }}>
                      {entry.reason.replace(/^[⛔✓]\s*/, '')}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>
                      {new Date(entry.timestamp).toLocaleTimeString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* رسالة الترحيب قبل التقييم */}
      {!evaluated && (
        <div
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: 12,
            color: 'var(--fg-3)',
            textAlign: 'center',
            padding: '8px 0',
            lineHeight: 1.8,
          }}
        >
          اضبط المعاملات واضغط "تقييم" لاختبار الدستور الأخلاقي الثابت.
          <br />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            Non-Maleficence (×2) + Beneficence + Autonomy (×1.5) + Justice
          </span>
        </div>
      )}
    </div>
  );
};

export default EthicsConstitutionVisualizer;
