"""phantom_sandbox.immune.system — نظام المناعة الرقمي: الحكم النهائي الحتمي."""

from __future__ import annotations

from phantom_sandbox.core.types import (
    AlertAction,
    AlertSeverity,
    BirthReport,
    ChaosReport,
    ContainerStatus,
    ImmuneAlert,
    ImmuneVerdict,
    MemoryReport,
    OracleReport,
    ProbeReport,
    StressReport,
    Verdict,
)


class DigitalImmuneSystem:
    """
    نظام المناعة الرقمي — يجمع نتائج كل الطبقات ويُصدر حكماً حتمياً.

    قاعدة القرار:
      • أي تنبيه BLOCK  →  الحكم = BLOCK (غير قابل للتجاوز)
      • أي تنبيه WARN   →  الحكم = WARN  (ما لم يوجد BLOCK)
      • لا تنبيهات      →  الحكم = CLEAN
    """

    def __init__(self) -> None:
        self._alerts: list[ImmuneAlert] = []

    # ─────────────────────────────────────────────────────────
    #  استيعاب نتائج الطبقات
    # ─────────────────────────────────────────────────────────

    def ingest_birth(self, report: BirthReport) -> None:
        """يستوعب تقرير الولادة ويُصدر تنبيهات حسب الحالة."""
        if report.status == ContainerStatus.STILLBORN:
            self._add(
                severity=AlertSeverity.CRITICAL,
                category="crash",
                message="Container failed to build (stillborn)",
                evidence=report.build_log[:300],
                action=AlertAction.BLOCK,
                fix="فحص Dockerfile وملف requirements/dependencies",
            )
        elif report.status == ContainerStatus.COMATOSE:
            self._add(
                severity=AlertSeverity.CRITICAL,
                category="crash",
                message="Container started but not responding (comatose)",
                evidence=report.startup_log[:300],
                action=AlertAction.BLOCK,
                fix="تحقق من منفذ التطبيق وأوامر التشغيل",
            )

    def ingest_probes(self, report: ProbeReport) -> None:
        """يستوعب تقرير المجسات."""
        # نقاط أمنية مكشوفة
        if report.security_alerts > 0:
            self._add(
                severity=AlertSeverity.CRITICAL,
                category="security",
                message=f"{report.security_alerts} sensitive endpoint(s) exposed publicly",
                action=AlertAction.BLOCK,
                fix="حماية النقاط الحساسة بـ auth middleware أو إزالتها",
            )

        if report.total_probes > 0:
            fail_ratio = report.failed / report.total_probes
            if fail_ratio > 0.5:
                self._add(
                    severity=AlertSeverity.HIGH,
                    category="reliability",
                    message=f"High failure rate: {report.failed}/{report.total_probes} endpoints failed",
                    action=AlertAction.BLOCK,
                    fix="راجع سجلات الأخطاء وتحقق من صحة نقاط النهاية",
                )
            elif fail_ratio > 0.3:
                self._add(
                    severity=AlertSeverity.MEDIUM,
                    category="reliability",
                    message=f"Elevated failure rate: {report.failed}/{report.total_probes}",
                    action=AlertAction.WARN,
                    fix="تحقق من نقاط النهاية الفاشلة",
                )

        if report.anomalies > 3:
            self._add(
                severity=AlertSeverity.MEDIUM,
                category="anomaly",
                message=f"{report.anomalies} anomalies detected across endpoints",
                action=AlertAction.WARN,
                fix="راجع تفاصيل الشذوذات وعالج الأسباب الجذرية",
            )

    def ingest_memory(self, report: MemoryReport) -> None:
        """يستوعب تقرير الذاكرة."""
        if not report.leak_detected:
            return

        action = (
            AlertAction.BLOCK
            if report.severity in (AlertSeverity.CRITICAL, AlertSeverity.HIGH)
            else AlertAction.WARN
        )
        self._add(
            severity=report.severity,
            category="leak",
            message=(
                f"Memory leak detected: growth={report.growth_mb:.1f}MB "
                f"slope={report.slope_mb_per_s:.3f}MB/s"
            ),
            action=action,
            fix="استخدم profiler لتحديد مصدر التسرب (tracemalloc / valgrind)",
        )

    def ingest_stress(self, report: StressReport) -> None:
        """يستوعب تقرير اختبار الإجهاد."""
        if report.crash_detected:
            self._add(
                severity=AlertSeverity.HIGH,
                category="crash",
                message=f"Application crashed under stress ({report.total_requests} requests)",
                action=AlertAction.BLOCK,
                fix="أضف rate limiting وزد موارد الحاوية",
            )
        elif report.error_rate > 0.3:
            self._add(
                severity=AlertSeverity.MEDIUM,
                category="performance",
                message=f"High error rate under stress: {report.error_rate:.0%}",
                action=AlertAction.WARN,
                fix="راجع معالجة الطلبات المتزامنة",
            )
        elif report.p95_response_ms > 5000:
            self._add(
                severity=AlertSeverity.LOW,
                category="performance",
                message=f"Slow P95 response: {report.p95_response_ms:.0f}ms",
                action=AlertAction.WARN,
                fix="حسّن الأداء وأضف caching",
            )

    def ingest_chaos(self, report: ChaosReport) -> None:
        """يستوعب تقرير محرك الفوضى."""
        if report.crashed > 0:
            self._add(
                severity=AlertSeverity.HIGH,
                category="chaos",
                message=f"{report.crashed} chaos experiments caused crashes",
                action=AlertAction.BLOCK,
                fix="أضف circuit breakers ومعالجة الأخطاء للحالات الطرفية",
            )
        for weakness in report.critical_weaknesses:
            self._add(
                severity=AlertSeverity.HIGH,
                category="chaos",
                message=f"Critical weakness: {weakness.get('name', 'unknown')}",
                evidence=str(weakness),
                action=AlertAction.WARN,
                fix="عزّز المرونة (resilience) في هذه النقطة",
            )

    def ingest_oracle(self, report: OracleReport) -> None:
        """يستوعب تقرير الأوراكل السلوكي."""
        if report.skipped:
            return
        if report.divergent > 0:
            severity = (
                AlertSeverity.HIGH
                if report.divergent > report.total_comparisons * 0.3
                else AlertSeverity.MEDIUM
            )
            action = AlertAction.BLOCK if severity == AlertSeverity.HIGH else AlertAction.WARN
            self._add(
                severity=severity,
                category="regression",
                message=f"Behavioral regression: {report.divergent}/{report.total_comparisons} divergences",
                action=action,
                fix="راجع التغييرات المُسببة للانحراف السلوكي",
            )

    # ─────────────────────────────────────────────────────────
    #  الحكم النهائي
    # ─────────────────────────────────────────────────────────

    def render_verdict(self) -> ImmuneVerdict:
        """يُصدر الحكم النهائي بعد استيعاب كل الطبقات."""
        # ترتيب تنازلي بالخطورة
        sorted_alerts = sorted(
            self._alerts, key=lambda a: a.severity, reverse=True
        )

        has_block = any(a.action == AlertAction.BLOCK for a in sorted_alerts)
        has_warn  = any(a.action == AlertAction.WARN  for a in sorted_alerts)

        if has_block:
            verdict = Verdict.BLOCK
        elif has_warn:
            verdict = Verdict.WARN
        else:
            verdict = Verdict.CLEAN

        critical_count = sum(1 for a in sorted_alerts if a.severity == AlertSeverity.CRITICAL)
        high_count     = sum(1 for a in sorted_alerts if a.severity == AlertSeverity.HIGH)
        medium_count   = sum(1 for a in sorted_alerts if a.severity == AlertSeverity.MEDIUM)

        return ImmuneVerdict(
            verdict=verdict,
            alerts=sorted_alerts,
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            recommendation=self._recommendation(verdict, critical_count, sorted_alerts),
        )

    # ─────────────────────────────────────────────────────────
    #  مساعدات داخلية
    # ─────────────────────────────────────────────────────────

    def _add(
        self,
        severity: AlertSeverity,
        category: str,
        message:  str,
        evidence: str = "",
        action:   AlertAction = AlertAction.NOTE,
        fix:      str = "",
    ) -> None:
        self._alerts.append(ImmuneAlert(
            severity=severity,
            category=category,
            message=message,
            evidence=evidence,
            action=action,
            fix_suggestion=fix,
        ))

    @staticmethod
    def _recommendation(
        verdict:  Verdict,
        critical: int,
        alerts:   list[ImmuneAlert],
    ) -> str:
        if verdict == Verdict.CLEAN:
            return "✅ التطبيق جاهز للإنتاج — لا مشاكل مكتشفة."
        if verdict == Verdict.WARN:
            return "⚠️ يُنصح بمعالجة التحذيرات قبل النشر."
        top = alerts[0].message if alerts else "unknown"
        return f"🚫 النشر مرفوض — أعلى خطر: {top}"
