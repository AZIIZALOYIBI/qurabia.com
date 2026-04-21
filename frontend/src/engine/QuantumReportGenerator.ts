/**
 * مولّد تقارير الأمان الكمومي القابلة للطباعة
 * Quantum Security Report Generator — Print & Export
 *
 * يولّد تقارير HTML احترافية بالعربية قابلة للطباعة وتصدير PDF
 * تشمل جميع تفاصيل فحص الأمان الكمومي بدقة متناهية
 */

import type {
  SecurityScanResult,
  QuantumThreat,
  HeaderCheck,
  PortResult,
  SecurityRecommendation,
  QuantumShieldState,
  QuantumEncryptionResult,
  ThreatLevel,
} from './QuantumCyberShield';
import { ATTACK_VECTORS_AR, THREAT_LEVELS_AR } from './QuantumCyberShield';
import type {
  QKDSessionResult,
  QNIDSAnalysis,
  MultiLayerEncryptionResult,
  QuantumAttackSimResult,
  ForensicAnalysisResult,
  PQCReadinessReport,
  ComprehensiveShieldReport,
} from './QuantumCyberShieldV2';
import { QUANTUM_ATTACKS_AR, QUANTUM_THREAT_TIER_AR } from './QuantumCyberShieldV2';

// ═══════════════════════════════════════════════════════════════
// ألوان ورموز
// ═══════════════════════════════════════════════════════════════

const LEVEL_COLORS: Record<ThreatLevel, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
  info: '#8b5cf6',
};

const HEADER_STATUS_LABELS: Record<string, string> = {
  secure: 'آمن ✓',
  warning: 'تحذير ⚠',
  weak: 'ضعيف ✗',
  missing: 'مفقود ✗',
};

const PORT_STATE_LABELS: Record<string, string> = {
  open: 'مفتوح',
  closed: 'مغلق',
  filtered: 'مُصفّى',
};

const DEFENSE_STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  monitoring: 'مراقبة',
  blocked: 'محظور',
  investigating: 'تحقيق',
  neutralized: 'مُحايد',
};

// ═══════════════════════════════════════════════════════════════
// الأنماط المشتركة للطباعة
// ═══════════════════════════════════════════════════════════════

function getBaseStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #1a1a2e;
      background: #fff;
      font-size: 11px;
      line-height: 1.6;
    }
    @page {
      size: A4;
      margin: 15mm 12mm 20mm 12mm;
    }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .report-container { max-width: 210mm; margin: 0 auto; padding: 20px; }

    /* رأس التقرير */
    .report-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; margin-bottom: 24px;
      background: linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%);
      border-radius: 12px; color: #fff;
    }
    .report-header .logo-section { display: flex; align-items: center; gap: 14px; }
    .report-header .logo-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(0,212,255,0.15); border: 2px solid rgba(0,212,255,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 900; color: #00d4ff;
    }
    .report-header .title { font-size: 18px; font-weight: 900; }
    .report-header .subtitle { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 2px; }
    .report-header .meta { text-align: left; font-size: 10px; color: rgba(255,255,255,0.5); }

    /* عنوان قسم */
    .section-title {
      font-size: 15px; font-weight: 800; margin: 24px 0 12px;
      padding: 10px 16px; background: #f8fafc; border-radius: 8px;
      border-right: 4px solid #00d4ff; color: #0f172a;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title .icon { font-size: 16px; }

    /* بطاقات الدرجات */
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .score-card {
      text-align: center; padding: 16px 12px; border-radius: 10px;
      border: 1px solid #e2e8f0; background: #fafbfc;
    }
    .score-card .value { font-size: 32px; font-weight: 900; font-family: 'Consolas', 'Courier New', monospace; }
    .score-card .label { font-size: 11px; color: #64748b; margin-top: 4px; }

    /* الجداول */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5px; }
    thead th {
      background: #f1f5f9; padding: 8px 12px; text-align: right;
      font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1;
      white-space: nowrap;
    }
    tbody td {
      padding: 7px 12px; border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f1f5f9; }

    /* شارات */
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 10px; font-weight: 700; white-space: nowrap;
    }
    .badge-critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-high { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-medium { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge-low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-info { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
    .badge-secure { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-missing { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-weak { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-open { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-closed { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-filtered { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

    /* بطاقة التوصية */
    .rec-card {
      padding: 12px 16px; border-radius: 8px; margin-bottom: 10px;
      border: 1px solid #e2e8f0; border-right-width: 4px;
    }
    .rec-card .rec-title { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
    .rec-card .rec-desc { font-size: 11px; color: #475569; line-height: 1.7; }
    .rec-card .rec-fix {
      font-size: 10.5px; margin-top: 6px; padding: 6px 10px;
      background: #f0f9ff; border-radius: 6px; color: #0369a1;
      border: 1px solid #bae6fd;
    }

    /* مقياس شريطي */
    .bar-meter { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; margin-top: 4px; }
    .bar-meter .fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

    /* تذييل */
    .report-footer {
      margin-top: 32px; padding: 16px 20px; border-top: 2px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: #94a3b8;
    }
    .report-footer .stamp {
      padding: 4px 12px; border: 2px solid #00d4ff; border-radius: 6px;
      color: #00d4ff; font-weight: 700; font-size: 10px;
    }

    /* بطاقة حالة الدرع */
    .shield-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .shield-metric {
      text-align: center; padding: 10px 8px; border-radius: 8px;
      background: #fafbfc; border: 1px solid #e2e8f0;
    }
    .shield-metric .val { font-size: 18px; font-weight: 900; font-family: monospace; }
    .shield-metric .lbl { font-size: 9px; color: #64748b; margin-top: 2px; }

    /* زر الطباعة */
    .print-actions {
      display: flex; gap: 8px; justify-content: center; margin-bottom: 20px;
    }
    .print-btn {
      padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer;
      font-weight: 700; font-size: 13px; font-family: inherit;
      display: flex; align-items: center; gap: 8px;
    }
    .print-btn-primary { background: #00d4ff; color: #000; }
    .print-btn-primary:hover { background: #00b8e0; }
    .print-btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .print-btn-secondary:hover { background: #e2e8f0; }

    /* ملخص تنفيذي */
    .exec-summary {
      padding: 16px 20px; border-radius: 10px; margin-bottom: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
    }
    .exec-summary h3 { font-size: 13px; font-weight: 800; color: #0369a1; margin-bottom: 8px; }
    .exec-summary p { font-size: 11px; color: #334155; line-height: 1.8; }

    /* معلومات ثانوية */
    .detail-row { display: flex; gap: 8px; margin-bottom: 4px; }
    .detail-label { font-weight: 700; color: #475569; min-width: 120px; }
    .detail-value { color: #1e293b; font-family: monospace; }
  `;
}

// ═══════════════════════════════════════════════════════════════
// أقسام التقرير
// ═══════════════════════════════════════════════════════════════

function renderReportHeader(url: string, timestamp: number): string {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `
    <div class="report-header">
      <div class="logo-section">
        <div class="logo-icon">🛡️</div>
        <div>
          <div class="title">الدرع السيبراني الكمومي — كشف فحص الأمان</div>
          <div class="subtitle">Quantum Cyber Shield — Security Scan Report | QURABIA</div>
        </div>
      </div>
      <div class="meta">
        <div><strong>الهدف:</strong> ${escapeHtml(url)}</div>
        <div><strong>التاريخ:</strong> ${dateStr}</div>
        <div><strong>الوقت:</strong> ${timeStr}</div>
        <div><strong>المنصة:</strong> qurabia.com</div>
      </div>
    </div>
  `;
}

function renderScoresSummary(
  vulnScore: number,
  qrScore: number,
  shieldState: QuantumShieldState,
  threatCount: number,
): string {
  const vulnColor = vulnScore > 60 ? '#dc2626' : vulnScore > 30 ? '#d97706' : '#16a34a';
  const vulnLabel = vulnScore > 60 ? 'خطير' : vulnScore > 30 ? 'متوسط' : 'منخفض';
  const qrColor = qrScore > 70 ? '#16a34a' : qrScore > 40 ? '#d97706' : '#dc2626';

  return `
    <div class="section-title"><span class="icon">📊</span> ملخص نتائج الفحص</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:${vulnColor}">${vulnScore}</div>
        <div class="label">درجة الضعف (${vulnLabel})</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:${qrColor}">${qrScore}%</div>
        <div class="label">المقاومة الكمومية</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#dc2626">${threatCount}</div>
        <div class="label">التهديدات المكتشفة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#16a34a">${Math.round(shieldState.fidelity * 100)}%</div>
        <div class="label">دقة الدرع الكمومي</div>
      </div>
    </div>
    <div class="shield-grid">
      <div class="shield-metric">
        <div class="val" style="color:#16a34a">${Math.round(shieldState.integrity * 100)}%</div>
        <div class="lbl">سلامة الدرع</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#00d4ff">${Math.round(shieldState.entanglement * 100)}%</div>
        <div class="lbl">التشابك الكمومي</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#7c3aed">${Math.round(shieldState.superposition * 100)}%</div>
        <div class="lbl">التراكب</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#d97706">${Math.round(shieldState.coherence * 100)}%</div>
        <div class="lbl">التماسك</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#16a34a">${Math.round(shieldState.fidelity * 100)}%</div>
        <div class="lbl">الدقة الكمومية</div>
      </div>
    </div>
  `;
}

function renderThreatsTable(threats: QuantumThreat[]): string {
  if (threats.length === 0) return '';
  const rows = threats.map(t => {
    const levelBadge = `badge-${t.level}`;
    const statusLabel = DEFENSE_STATUS_LABELS[t.status] || t.status;
    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:${LEVEL_COLORS[t.level]}">${escapeHtml(t.id)}</td>
        <td>${escapeHtml(ATTACK_VECTORS_AR[t.vector])}</td>
        <td><span class="badge ${levelBadge}">${escapeHtml(THREAT_LEVELS_AR[t.level])}</span></td>
        <td style="font-family:monospace;font-size:10px">${escapeHtml(t.source)}</td>
        <td>${escapeHtml(statusLabel)}</td>
        <td style="font-size:10px;color:#64748b">${escapeHtml(t.description)}</td>
        <td style="font-family:monospace;font-size:9px;color:#94a3b8;word-break:break-all">${escapeHtml(t.quantumSignature)}</td>
        <td style="font-size:10px">${new Date(t.timestamp).toLocaleString('ar-SA')}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section-title"><span class="icon">🚨</span> التهديدات المكتشفة (${threats.length})</div>
    <table>
      <thead><tr>
        <th>المعرّف</th><th>نوع الهجوم</th><th>الخطورة</th><th>المصدر</th>
        <th>الحالة</th><th>الوصف</th><th>البصمة الكمومية</th><th>الوقت</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderHeadersTable(headers: HeaderCheck[]): string {
  if (headers.length === 0) return '';
  const secureCount = headers.filter(h => h.status === 'secure').length;
  const rows = headers.map(h => {
    const badge = `badge-${h.status}`;
    const label = HEADER_STATUS_LABELS[h.status] || h.status;
    return `
      <tr>
        <td style="font-family:monospace;font-weight:600">${escapeHtml(h.header)}</td>
        <td>${h.present ? '✓ موجود' : '✗ غير موجود'}</td>
        <td style="font-family:monospace;font-size:10px">${escapeHtml(h.value || '—')}</td>
        <td><span class="badge ${badge}">${escapeHtml(label)}</span></td>
        <td style="font-size:10px;color:#475569">${escapeHtml(h.recommendation)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section-title"><span class="icon">🔒</span> تحليل رؤوس HTTP الأمنية (${secureCount}/${headers.length} آمن)</div>
    <table>
      <thead><tr>
        <th>الرأس</th><th>الحالة</th><th>القيمة</th><th>التقييم</th><th>التوصية</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderPortsTable(ports: PortResult[]): string {
  if (ports.length === 0) return '';
  const openCount = ports.filter(p => p.state === 'open').length;
  const rows = ports.map(p => {
    const stateBadge = `badge-${p.state}`;
    const stateLabel = PORT_STATE_LABELS[p.state] || p.state;
    const riskBadge = `badge-${p.risk}`;
    return `
      <tr>
        <td style="font-family:monospace;font-weight:700">${p.port}</td>
        <td>${escapeHtml(p.service)}</td>
        <td><span class="badge ${stateBadge}">${escapeHtml(stateLabel)}</span></td>
        <td><span class="badge ${riskBadge}">${escapeHtml(THREAT_LEVELS_AR[p.risk])}</span></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section-title"><span class="icon">🌐</span> فحص المنافذ (${openCount} مفتوح من ${ports.length})</div>
    <table>
      <thead><tr><th>المنفذ</th><th>الخدمة</th><th>الحالة</th><th>الخطورة</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderRecommendations(recs: SecurityRecommendation[]): string {
  if (recs.length === 0) return '';
  const cards = recs.map(r => {
    const borderColor = LEVEL_COLORS[r.priority];
    const effortAr = r.effort === 'low' ? 'منخفض' : r.effort === 'medium' ? 'متوسط' : 'مرتفع';
    return `
      <div class="rec-card" style="border-right-color:${borderColor}">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <span class="badge badge-${r.priority}">${escapeHtml(THREAT_LEVELS_AR[r.priority])}</span>
          <span class="badge badge-info">${escapeHtml(r.category)}</span>
          <span style="font-size:10px;color:#94a3b8">الجهد: ${effortAr}</span>
        </div>
        <div class="rec-title">${escapeHtml(r.title)}</div>
        <div class="rec-desc">${escapeHtml(r.description)}</div>
        <div class="rec-fix">⚡ الحل الكمومي: ${escapeHtml(r.quantumFix)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-title"><span class="icon">💡</span> التوصيات الأمنية (${recs.length})</div>
    ${cards}
  `;
}

function renderExecutiveSummary(result: SecurityScanResult): string {
  const level = result.vulnerabilityScore > 60 ? 'خطير' : result.vulnerabilityScore > 30 ? 'متوسط' : 'جيد';
  const criticalThreats = result.threats.filter(t => t.level === 'critical').length;
  const highThreats = result.threats.filter(t => t.level === 'high').length;
  const insecureHeaders = result.headerAnalysis.filter(h => h.status !== 'secure').length;
  const openPorts = result.portScan.filter(p => p.state === 'open').length;

  return `
    <div class="exec-summary">
      <h3>📋 الملخص التنفيذي</h3>
      <p>
        تم إجراء فحص أمان كمومي شامل للموقع <strong>${escapeHtml(result.url)}</strong>.
        المستوى العام: <strong style="color:${result.vulnerabilityScore > 60 ? '#dc2626' : result.vulnerabilityScore > 30 ? '#d97706' : '#16a34a'}">${level}</strong>.
        تم اكتشاف <strong>${result.threats.length}</strong> تهديد
        (${criticalThreats} حرج، ${highThreats} عالي).
        نسبة المقاومة الكمومية: <strong>${result.quantumResistanceScore}%</strong>.
        الرؤوس الأمنية غير المطابقة: <strong>${insecureHeaders}</strong> من ${result.headerAnalysis.length}.
        المنافذ المفتوحة: <strong>${openPorts}</strong>.
        يُوصى باتباع التوصيات المرفقة لتعزيز الحماية.
      </p>
    </div>
  `;
}

function renderFooter(): string {
  const now = new Date();
  return `
    <div class="report-footer">
      <div>
        <div>تقرير صادر من منصة <strong>QURABIA</strong> — qurabia.com</div>
        <div>الدرع السيبراني الكمومي — Quantum Cyber Shield</div>
        <div>تاريخ الإصدار: ${now.toLocaleDateString('ar-SA')} | ${now.toLocaleTimeString('ar-SA')}</div>
      </div>
      <div class="stamp">🛡️ QURABIA</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// أقسام التقرير المتقدم (V2)
// ═══════════════════════════════════════════════════════════════

function renderQKDSection(qkd: QKDSessionResult): string {
  const detected = qkd.eavesdropperDetected;
  const qberPercent = (qkd.qber * 100).toFixed(2);
  const tierAr = QUANTUM_THREAT_TIER_AR[qkd.securityRating];

  return `
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">🔑</span> توزيع المفتاح الكمومي (QKD) — بروتوكول ${escapeHtml(qkd.protocol)}</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:${detected ? '#dc2626' : '#16a34a'}">${detected ? '🚫' : '✓'}</div>
        <div class="label">${detected ? 'تم كشف متنصت!' : 'القناة آمنة'}</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:${qkd.qber > 0.08 ? '#dc2626' : '#16a34a'}">${qberPercent}%</div>
        <div class="label">معدل خطأ الكم (QBER)</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#00d4ff">${qkd.secureKeyLength}</div>
        <div class="label">طول المفتاح الآمن (بت)</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#7c3aed">${tierAr}</div>
        <div class="label">تصنيف الأمان</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>المعلمة</th><th>القيمة</th><th>الوصف</th>
      </tr></thead>
      <tbody>
        <tr><td>معرّف الجلسة</td><td style="font-family:monospace">${escapeHtml(qkd.sessionId)}</td><td>معرّف فريد لجلسة QKD</td></tr>
        <tr><td>عدد الفوتونات</td><td>${qkd.totalPhotons.toLocaleString('ar-SA')}</td><td>إجمالي الفوتونات المرسلة</td></tr>
        <tr><td>القواعد المتطابقة</td><td>${qkd.matchedBases} (${(qkd.matchedBases / qkd.totalPhotons * 100).toFixed(1)}%)</td><td>الفوتونات التي تطابقت فيها قاعدتا أليس وبوب</td></tr>
        <tr><td>QBER</td><td style="color:${qkd.qber > 0.11 ? '#dc2626' : '#16a34a'};font-weight:700">${qberPercent}%</td><td>الحد الآمن: أقل من 11% (BB84)</td></tr>
        <tr><td>تضخيم الخصوصية</td><td>${(qkd.privacyAmplification * 100).toFixed(1)}%</td><td>نسبة ضغط المفتاح لضمان السرية</td></tr>
        <tr><td>تصحيح الأخطاء</td><td>${qkd.errorCorrectionApplied ? 'مُطبّق ✓' : 'غير مطلوب'}</td><td>تصحيح أخطاء كلاسيكي على المفتاح المُنقّح</td></tr>
        <tr><td>كفاءة القناة</td><td>${(qkd.channelEfficiency * 100).toFixed(1)}%</td><td>نسبة البتات الآمنة من إجمالي الفوتونات</td></tr>
      </tbody>
    </table>
  `;
}

function renderQNIDSSection(qnids: QNIDSAnalysis): string {
  const rows = qnids.attacks.map(a => `
    <tr>
      <td style="font-family:monospace;font-weight:700">${escapeHtml(a.id)}</td>
      <td>${escapeHtml(a.nameAr)}</td>
      <td>${escapeHtml(a.category)}</td>
      <td style="font-weight:700;color:${a.confidence > 0.9 ? '#dc2626' : '#d97706'}">${(a.confidence * 100).toFixed(1)}%</td>
      <td>${escapeHtml(a.detectionMethod.replace('_', ' '))}</td>
      <td style="font-size:10px">${a.detectionTimeMs.toFixed(2)} ms</td>
      <td style="font-size:10px">${a.anomalyScore.toFixed(2)}</td>
      <td style="font-size:10px;color:#475569">${escapeHtml(a.mitigationSuggestion)}</td>
    </tr>
  `).join('');

  return `
    <div class="section-title"><span class="icon">🧠</span> نظام كشف التسلل الكمومي (QNIDS)</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:#2563eb">${qnids.packetsAnalyzed.toLocaleString('ar-SA')}</div>
        <div class="label">حزم مُحلّلة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#dc2626">${qnids.attacks.length}</div>
        <div class="label">هجمات مكتشفة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#16a34a">${(qnids.modelAccuracy * 100).toFixed(1)}%</div>
        <div class="label">دقة النموذج</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#d97706">${(qnids.falsePositiveRate * 100).toFixed(2)}%</div>
        <div class="label">إنذارات كاذبة</div>
      </div>
    </div>
    <div class="detail-row"><span class="detail-label">كيوبتات المصنف:</span><span class="detail-value">${qnids.classifierQubits}</span></div>
    <div class="detail-row"><span class="detail-label">عمق الدائرة:</span><span class="detail-value">${qnids.circuitDepth}</span></div>
    <div class="detail-row" style="margin-bottom:12px"><span class="detail-label">حالة المصنف:</span><span class="detail-value badge badge-${qnids.classifierState === 'alert' ? 'critical' : 'secure'}">${qnids.classifierState}</span></div>
    ${qnids.attacks.length > 0 ? `
      <table>
        <thead><tr>
          <th>المعرّف</th><th>النمط</th><th>الفئة</th><th>الثقة</th><th>طريقة الكشف</th><th>زمن الكشف</th><th>درجة الشذوذ</th><th>الإجراء المقترح</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    ` : ''}
  `;
}

function renderEncryptionSection(enc: MultiLayerEncryptionResult): string {
  const layerRows = enc.layers.map(l => `
    <tr>
      <td style="font-family:monospace;font-weight:600">${escapeHtml(l.algorithm)}</td>
      <td>${l.family === 'lattice' ? 'شبكات' : l.family === 'code' ? 'أكواد' : l.family === 'hash' ? 'تجزئة' : l.family}</td>
      <td style="font-weight:700;text-align:center">${l.nistLevel}</td>
      <td style="font-family:monospace">${l.publicKeySize.toLocaleString()}</td>
      <td style="font-family:monospace">${l.ciphertextSize.toLocaleString()}</td>
      <td>${l.keygenTimeMs.toFixed(2)} ms</td>
      <td>${l.encryptTimeMs.toFixed(2)} ms</td>
      <td>${l.decryptTimeMs.toFixed(2)} ms</td>
      <td style="color:#16a34a;font-weight:700">${l.shorResistant ? '✓' : '✗'}</td>
    </tr>
  `).join('');

  return `
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">🔐</span> التشفير المتعدد الطبقات (Multi-Layer PQC)</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:#00d4ff">${enc.combinedSecurityBits}</div>
        <div class="label">قوة أمنية مجمعة (بت)</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#16a34a">${enc.estimatedYearsSecure}+</div>
        <div class="label">سنوات أمان متوقعة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#2563eb">${enc.totalTimeMs.toFixed(1)}ms</div>
        <div class="label">الزمن الإجمالي</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#7c3aed">${(enc.pqcReadiness * 100).toFixed(0)}%</div>
        <div class="label">جاهزية PQC</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>الخوارزمية</th><th>العائلة</th><th>NIST</th><th>مفتاح عام (بايت)</th>
        <th>نص مشفر (بايت)</th><th>توليد</th><th>تشفير</th><th>فك</th><th>مقاوم شور</th>
      </tr></thead>
      <tbody>${layerRows}</tbody>
    </table>
  `;
}

function renderAttackSimSection(attacks: QuantumAttackSimResult[]): string {
  const rows = attacks.map(a => {
    const feasibleBadge = a.currentlyFeasible ? 'badge-critical' : 'badge-secure';
    const feasibleLabel = a.currentlyFeasible ? 'ممكن حالياً!' : 'غير ممكن';
    const timeStr = a.estimatedTimeHours === Number.POSITIVE_INFINITY ? '∞' : `${a.estimatedTimeHours.toFixed(1)} ساعة`;
    return `
      <tr>
        <td>${escapeHtml(QUANTUM_ATTACKS_AR[a.attack])}</td>
        <td style="font-family:monospace">${escapeHtml(a.targetAlgorithm)}</td>
        <td style="font-family:monospace">${a.requiredQubits.toLocaleString()}</td>
        <td>${timeStr}</td>
        <td style="font-weight:700">${(a.successProbability * 100).toFixed(1)}%</td>
        <td><span class="badge ${feasibleBadge}">${feasibleLabel}</span></td>
        <td>${a.estimatedFeasibleYear}</td>
        <td style="font-family:monospace;font-size:10px">${escapeHtml(a.recommendedDefense)}</td>
        <td style="color:#16a34a">${(a.postDefenseSuccessRate * 100).toFixed(4)}%</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section-title"><span class="icon">⚔️</span> محاكاة الهجمات الكمومية</div>
    <table>
      <thead><tr>
        <th>الهجوم</th><th>الهدف</th><th>كيوبتات</th><th>الزمن</th>
        <th>احتمال النجاح</th><th>الجدوى</th><th>سنة الجدوى</th><th>الدفاع</th><th>بعد الدفاع</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderForensicsSection(forensics: ForensicAnalysisResult): string {
  const traceTypeAr: Record<string, string> = {
    entanglement_break: 'انكسار تشابك',
    measurement_disturbance: 'اضطراب قياس',
    decoherence_anomaly: 'شذوذ فك تماسك',
    phase_shift: 'انزياح طور',
    bell_violation: 'انتهاك بيل',
  };

  const traceRows = forensics.traces.map(t => `
    <tr>
      <td style="font-family:monospace;font-weight:700">${escapeHtml(t.id)}</td>
      <td>${escapeHtml(traceTypeAr[t.traceType] || t.traceType)}</td>
      <td>
        <div class="bar-meter" style="width:80px;display:inline-block">
          <div class="fill" style="width:${Math.round(t.strength * 100)}%;background:${t.strength > 0.7 ? '#dc2626' : '#d97706'}"></div>
        </div>
        <span style="font-size:10px;margin-right:4px">${(t.strength * 100).toFixed(0)}%</span>
      </td>
      <td style="font-family:monospace;font-size:10px">${escapeHtml(t.networkLocation)}</td>
      <td style="font-size:10px">${new Date(t.timestamp).toLocaleString('ar-SA')}</td>
      <td style="font-size:10px;color:#475569">${escapeHtml(t.description)}</td>
    </tr>
  `).join('');

  return `
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">🔬</span> التحليل الجنائي الكمومي</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:#dc2626">${forensics.tracesFound}</div>
        <div class="label">آثار مكتشفة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#2563eb">${(forensics.confidence * 100).toFixed(0)}%</div>
        <div class="label">ثقة التحليل</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:${forensics.dataRecoverable ? '#16a34a' : '#dc2626'}">${forensics.dataRecoverable ? '✓' : '✗'}</div>
        <div class="label">إمكانية استرداد البيانات</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#d97706">${(forensics.recoveryRate * 100).toFixed(0)}%</div>
        <div class="label">نسبة الاسترداد</div>
      </div>
    </div>
    <div class="detail-row"><span class="detail-label">معرّف التحقيق:</span><span class="detail-value">${escapeHtml(forensics.investigationId)}</span></div>
    <div class="detail-row" style="margin-bottom:12px"><span class="detail-label">المصدر المحتمل:</span><span class="detail-value">${escapeHtml(forensics.probableSource)}</span></div>
    ${forensics.traces.length > 0 ? `
      <table>
        <thead><tr><th>المعرّف</th><th>النوع</th><th>القوة</th><th>الموقع</th><th>الوقت</th><th>الوصف</th></tr></thead>
        <tbody>${traceRows}</tbody>
      </table>
    ` : ''}
    <div class="section-title" style="font-size:13px;margin-top:16px"><span class="icon">📌</span> توصيات التحقيق الجنائي</div>
    <ol style="padding-right:20px;font-size:11px;line-height:2;color:#334155">
      ${forensics.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
    </ol>
  `;
}

function renderPQCReadinessSection(pqc: PQCReadinessReport): string {
  const ratingColors: Record<string, string> = {
    critical: '#dc2626', poor: '#d97706', fair: '#d97706', good: '#16a34a', excellent: '#16a34a',
  };
  const catRows = pqc.categories.map(c => `
    <tr>
      <td style="font-weight:700">${escapeHtml(c.nameAr)}</td>
      <td style="font-weight:700;text-align:center;color:${c.score / c.maxScore > 0.6 ? '#16a34a' : '#dc2626'}">${c.score.toFixed(1)} / ${c.maxScore}</td>
      <td>
        <div class="bar-meter" style="width:100px;display:inline-block">
          <div class="fill" style="width:${(c.score / c.maxScore) * 100}%;background:${c.score / c.maxScore > 0.6 ? '#16a34a' : c.score / c.maxScore > 0.3 ? '#d97706' : '#dc2626'}"></div>
        </div>
      </td>
      <td style="font-size:10px;color:#475569">${c.findings.map(f => escapeHtml(f)).join('<br>')}</td>
      <td style="font-size:10px;color:#0369a1">${c.recommendations.map(r => escapeHtml(r)).join('<br>')}</td>
    </tr>
  `).join('');

  const urgencyAr: Record<string, string> = {
    immediate: '🔴 فوري',
    short_term: '🟠 قصير المدى',
    medium_term: '🟡 متوسط المدى',
    long_term: '🟢 طويل المدى',
  };

  const priorityRows = pqc.priorities.map(p => `
    <tr>
      <td>${escapeHtml(urgencyAr[p.urgency] || p.urgency)}</td>
      <td>${escapeHtml(p.action)}</td>
    </tr>
  `).join('');

  const complexityAr: Record<string, string> = {
    low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة', very_high: 'مرتفعة جداً',
  };

  return `
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">📈</span> مؤشر الجاهزية لما بعد الكمومي (PQC Readiness)</div>
    <div class="score-grid">
      <div class="score-card" style="grid-column: span 2">
        <div class="value" style="color:${ratingColors[pqc.rating] || '#334155'};font-size:42px">${pqc.overallScore}/100</div>
        <div class="label" style="font-size:14px;font-weight:700;color:${ratingColors[pqc.rating]}">${escapeHtml(pqc.ratingAr)}</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#2563eb">${pqc.yearsUntilQuantumThreat}</div>
        <div class="label">سنوات حتى التهديد الكمومي</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#d97706;font-size:16px">${escapeHtml(complexityAr[pqc.migrationComplexity] || pqc.migrationComplexity)}</div>
        <div class="label">تعقيد الترحيل</div>
      </div>
    </div>
    <table>
      <thead><tr><th>الفئة</th><th>الدرجة</th><th>المؤشر</th><th>النتائج</th><th>التوصيات</th></tr></thead>
      <tbody>${catRows}</tbody>
    </table>
    <div class="section-title" style="font-size:13px;margin-top:16px"><span class="icon">🎯</span> خطة الأولويات</div>
    <table>
      <thead><tr><th style="width:130px">الأولوية</th><th>الإجراء</th></tr></thead>
      <tbody>${priorityRows}</tbody>
    </table>
  `;
}

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════
// الدوال العامة المُصدّرة
// ═══════════════════════════════════════════════════════════════

/**
 * يولّد تقرير فحص الأمان الأساسي (من نتيجة الفحص الحالية)
 * ويفتح نافذة طباعة
 */
export function printScanReport(result: SecurityScanResult): void {
  const html = buildBasicReportHtml(result);
  openPrintWindow(html);
}

/**
 * يولّد كشف فحص الأمان كسلسلة HTML (بدون فتح نافذة)
 * مفيد للتضمين أو التصدير
 */
export function buildBasicReportHtml(result: SecurityScanResult): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كشف فحص الأمان الكمومي — ${escapeHtml(result.url)}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="report-container">
    <div class="print-actions no-print">
      <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة التقرير</button>
      <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
    </div>
    ${renderReportHeader(result.url, result.timestamp)}
    ${renderExecutiveSummary(result)}
    ${renderScoresSummary(result.vulnerabilityScore, result.quantumResistanceScore, result.shieldState, result.threats.length)}
    ${renderThreatsTable(result.threats)}
    <div class="page-break"></div>
    ${renderHeadersTable(result.headerAnalysis)}
    ${renderPortsTable(result.portScan)}
    ${renderRecommendations(result.recommendations)}
    ${renderFooter()}
  </div>
</body>
</html>`;
}

/**
 * يولّد التقرير الشامل المتقدم (V2) مع كل الأنظمة الفرعية
 * ويفتح نافذة طباعة
 */
export function printComprehensiveReport(
  basicResult: SecurityScanResult,
  v2Report: ComprehensiveShieldReport,
): void {
  const html = buildComprehensiveReportHtml(basicResult, v2Report);
  openPrintWindow(html);
}

/**
 * يولّد التقرير الشامل كسلسلة HTML
 */
export function buildComprehensiveReportHtml(
  basicResult: SecurityScanResult,
  v2Report: ComprehensiveShieldReport,
): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>التقرير الشامل للأمان الكمومي — ${escapeHtml(basicResult.url)}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="report-container">
    <div class="print-actions no-print">
      <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة التقرير الشامل</button>
      <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
    </div>
    ${renderReportHeader(basicResult.url, basicResult.timestamp)}
    ${renderExecutiveSummary(basicResult)}

    <!-- الدرجة الشاملة -->
    <div class="exec-summary" style="text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border:none">
      <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">الدرجة الشاملة للأمان الكمومي</div>
      <div style="font-size:56px;font-weight:900;color:${v2Report.overallQuantumSecurityScore > 70 ? '#22c55e' : v2Report.overallQuantumSecurityScore > 40 ? '#f59e0b' : '#ef4444'};font-family:monospace">${v2Report.overallQuantumSecurityScore}/100</div>
    </div>

    ${renderScoresSummary(basicResult.vulnerabilityScore, basicResult.quantumResistanceScore, basicResult.shieldState, basicResult.threats.length)}
    ${renderThreatsTable(basicResult.threats)}
    <div class="page-break"></div>
    ${renderHeadersTable(basicResult.headerAnalysis)}
    ${renderPortsTable(basicResult.portScan)}
    ${renderRecommendations(basicResult.recommendations)}
    ${renderQKDSection(v2Report.qkdSession)}
    ${renderQNIDSSection(v2Report.qnidsAnalysis)}
    ${renderEncryptionSection(v2Report.encryptionLayers)}
    ${renderAttackSimSection(v2Report.attackSimulations)}
    ${renderForensicsSection(v2Report.forensicAnalysis)}
    ${renderPQCReadinessSection(v2Report.pqcReadiness)}
    ${renderFooter()}
  </div>
</body>
</html>`;
}

/**
 * يفتح نافذة طباعة جديدة بمحتوى HTML
 */
function openPrintWindow(html: string): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/**
 * يصدّر التقرير كملف HTML للتحميل
 */
export function downloadReportAsHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
