# phantom_sandbox/immune_system.py

from dataclasses import dataclass
from typing import List


@dataclass
class ImmuneAlert:
    """تنبيه مناعي"""
    severity: str        # "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"
    category: str        # "security", "crash", "leak", "regression", "chaos"
    message: str
    evidence: str = ""
    action: str = "NOTE"  # "BLOCK", "WARN", "NOTE"
    auto_fix_suggestion: str = ""


class DigitalImmuneSystem:
    """
    نظام المناعة: يجمع كل النتائج ويقرر مصير الكود
    إذا كان هناك خطر كارثي → يرفض الكود تلقائياً (BLOCK)
    إذا كان هناك تحذير → يسمح مع تنبيه (WARN)
    """

    def __init__(self):
        self.alerts: List[ImmuneAlert] = []
        self.verdict = "CLEAN"  # "CLEAN", "WARN", "BLOCK"

    def analyze_nursery_report(self, report: dict):
        """يحلل تقرير الولادة"""
        status = report.get("status")

        if status == "stillborn":
            self.alerts.append(ImmuneAlert(
                severity="CRITICAL",
                category="crash",
                message="التطبيق فشل في البناء",
                evidence=report.get("build_log", "")[:500],
                action="BLOCK",
                auto_fix_suggestion="تحقق من أخطاء البناء في Dockerfile. قد تكون هناك مكتبة مفقودة أو خطأ في الكود يمنع التجميع."
            ))
            self.verdict = "BLOCK"

        elif status == "comatose":
            self.alerts.append(ImmuneAlert(
                severity="CRITICAL",
                category="crash",
                message="التطبيق بدأ لكنه لا يستجيب",
                evidence=report.get("startup_log", "")[:500],
                action="BLOCK",
                auto_fix_suggestion="التطبيق يبدأ لكنه لا يستجيب للطلبات. قد تكون هناك حلقة لا نهائية أو خطأ في تهيئة الخادم."
            ))
            self.verdict = "BLOCK"

    def analyze_probe_results(self, results: dict):
        """يحلل نتائج المجسات"""
        if results.get("security_alerts", 0) > 0:
            self.alerts.append(ImmuneAlert(
                severity="CRITICAL",
                category="security",
                message=f"اكتشاف {results['security_alerts']} نقاط أمنية مكشوفة!",
                evidence="نقاط نهاية حساسة (.env, .git, /admin) تعيد استجابات ناجحة",
                action="BLOCK",
                auto_fix_suggestion="أضف حماية لنقاط النهاية الحساسة أو احذفها. تحقق من ملفات .gitignore و middleware."
            ))
            self.verdict = "BLOCK"

        if results.get("anomalies", 0) > results.get("successful", 1) * 0.5:
            self.alerts.append(ImmuneAlert(
                severity="HIGH",
                category="crash",
                message=f"نسبة عالية من الأعطال: {results['anomalies']} من أصل {results['total_probes']}",
                evidence=f"{results['failed']} طلب فاشل",
                action="BLOCK" if results["failed"] > 3 else "WARN",
            ))

        if results.get("performance_issues", 0) > 0:
            self.alerts.append(ImmuneAlert(
                severity="MEDIUM",
                category="performance",
                message=f"{results['performance_issues']} نقاط نهاية بطيئة (>2s)",
                action="WARN",
                auto_fix_suggestion="راجع الاستعلامات البطيئة، أضف caching، أو قم بتحسين الخوارزميات."
            ))

    def analyze_memory_report(self, report: dict):
        """يحلل تقرير الذاكرة"""
        if report.get("leak_detected"):
            details = report.get("leak_details", {})
            severity = "CRITICAL" if details.get("severity") == "HIGH" else "HIGH"
            self.alerts.append(ImmuneAlert(
                severity=severity,
                category="leak",
                message=f"تسرب ذاكرة مكتشف! نمو {details.get('growth_mb', 0)}MB",
                evidence=f"من {details.get('first_third_avg_mb', 0)}MB إلى {details.get('last_third_avg_mb', 0)}MB",
                action="BLOCK" if severity == "CRITICAL" else "WARN",
                auto_fix_suggestion="ابحث عن: 1) قوائم تزداد بلا حدود 2) مراجع دائرية 3) ملفات/اتصالات لا تُغلق 4) cache بدون حد أقصى"
            ))
            if severity == "CRITICAL":
                self.verdict = "BLOCK"

    def analyze_chaos_results(self, results: dict):
        """يحلل نتائج تجارب الفوضى"""
        for weakness in results.get("critical_weaknesses", []):
            self.alerts.append(ImmuneAlert(
                severity="HIGH",
                category="chaos",
                message=f"ضعف هيكلي: {weakness['experiment']}",
                evidence=weakness.get("detail", ""),
                action="WARN",
                auto_fix_suggestion="أضف معالجة أخطاء (error handling)، circuit breakers، و retry logic."
            ))

        if results.get("crashed", 0) > 0:
            self.alerts.append(ImmuneAlert(
                severity="HIGH",
                category="chaos",
                message=f"التطبيق انهار تحت {results['crashed']} تجربة فوضى",
                action="WARN",
            ))

    def analyze_behavior_comparison(self, comparison: dict):
        """يحلل مقارنة السلوك"""
        for div in comparison.get("divergences", []):
            if div["type"] == "REGRESSION_CRASH":
                self.alerts.append(ImmuneAlert(
                    severity="CRITICAL",
                    category="regression",
                    message=f"انحدار كارثي: {div['endpoint']} كان يعمل ({div['old_status']}) وانكسر ({div['new_status']})",
                    evidence=f"Method: {div['method']}, Path: {div['endpoint']}",
                    action="BLOCK",
                    auto_fix_suggestion="التغيير الجديد كسر نقطة نهاية كانت تعمل. راجع التعديلات على هذا المسار."
                ))
                self.verdict = "BLOCK"

            elif div["type"] == "PERFORMANCE_REGRESSION":
                self.alerts.append(ImmuneAlert(
                    severity="MEDIUM",
                    category="regression",
                    message=f"تباطؤ ملحوظ في {div['endpoint']}: {div['old_response_time_ms']}ms → {div['new_response_time_ms']}ms",
                    action="WARN",
                    auto_fix_suggestion="التغيير أبطأ الاستجابة بشكل كبير. راجع الاستعلامات والحسابات الجديدة."
                ))

    def render_verdict(self) -> dict:
        """يصدر الحكم النهائي"""
        # ترتيب التنبيهات حسب الخطورة
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        self.alerts.sort(key=lambda a: severity_order.get(a.severity, 5))

        # تحديد الحكم النهائي
        if any(a.action == "BLOCK" for a in self.alerts):
            self.verdict = "BLOCK"
        elif any(a.action == "WARN" for a in self.alerts):
            self.verdict = "WARN"
        else:
            self.verdict = "CLEAN"

        return {
            "verdict": self.verdict,
            "total_alerts": len(self.alerts),
            "critical_alerts": sum(1 for a in self.alerts if a.severity == "CRITICAL"),
            "high_alerts": sum(1 for a in self.alerts if a.severity == "HIGH"),
            "medium_alerts": sum(1 for a in self.alerts if a.severity == "MEDIUM"),
            "alerts": [
                {
                    "severity": a.severity,
                    "category": a.category,
                    "message": a.message,
                    "evidence": a.evidence[:300],
                    "action": a.action,
                    "fix": a.auto_fix_suggestion,
                }
                for a in self.alerts
            ],
            "recommendation": self._generate_recommendation(),
        }

    def _generate_recommendation(self) -> str:
        """يولد توصية نصية واضحة"""
        if self.verdict == "CLEAN":
            return "✅ الكود في حالة ممتازة. لا توجد مشاكل مكتشفة. يمكن الدمج بأمان."
        elif self.verdict == "WARN":
            warnings = [a for a in self.alerts if a.action == "WARN"]
            return (f"⚠️ الكود يعمل لكن به {len(warnings)} تحذيرات. "
                    f"يُنصح بمراجعتها قبل الدمج. ليس هناك خطر كارثي.")
        else:
            blockers = [a for a in self.alerts if a.action == "BLOCK"]
            return (f"🚫 الكود مرفوض تلقائياً! {len(blockers)} مشاكل حرجة تمنع الدمج. "
                    f"يجب إصلاحها قبل إعادة الفحص.")
