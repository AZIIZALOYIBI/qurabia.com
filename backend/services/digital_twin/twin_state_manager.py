"""
🧠 Digital Twin State Manager
════════════════════════════════════════════════════════════════

مدير حالة التوأم الرقمي - القلب النابض للنظام الاستباقي
يحلل سيناريوهات الفوضى ويتنبأ بالتأثير قبل حدوثه
"""

import json
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class SeverityLevel(Enum):
    """مستويات الخطورة"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class ChaosType(Enum):
    """أنواع سيناريوهات الفوضى"""
    NETWORK_LATENCY = "network_latency"
    SERVICE_FAILURE = "service_failure"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    NETWORK_PARTITION = "network_partition"
    DATABASE_SLOWDOWN = "database_slowdown"
    MEMORY_LEAK = "memory_leak"


@dataclass
class StateSnapshot:
    """لقطة من حالة النظام"""
    timestamp: str
    metrics: Dict[str, Any]
    services_health: Dict[str, str]
    performance_indicators: Dict[str, float]

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'StateSnapshot':
        return cls(**data)


@dataclass
class ImpactPrediction:
    """تنبؤ بتأثير سيناريو الفوضى"""
    severity: SeverityLevel
    affected_components: List[str]
    description: str
    time_to_failure: str
    recommended_actions: List[str]
    confidence_score: float  # 0.0 - 1.0
    cascading_effects: List[str]

    def to_dict(self) -> dict:
        data = asdict(self)
        data['severity'] = self.severity.value
        return data


class DigitalTwinManager:
    """
    مدير التوأم الرقمي - نظام استدلال متقدم للتنبؤ بالتأثيرات

    يستخدم قواعد استدلال معقدة (Advanced Inference Rules) لمحاكاة
    سلوك نماذج ML في التنبؤ بتأثير الفوضى على النظام
    """

    def __init__(self, state_dir: Optional[Path] = None):
        self.state_dir = state_dir or Path("/tmp/digital_twin_state")
        self.state_dir.mkdir(parents=True, exist_ok=True)

        # آخر حالة معروفة جيدة (Golden Snapshot)
        self.golden_snapshot: Optional[StateSnapshot] = None

        # سجل التنبؤات
        self.predictions_history: List[ImpactPrediction] = []

        # قواعد الاستدلال المتقدمة
        self._initialize_inference_rules()

        print("🔮 [Digital Twin Manager] تم التهيئة بنجاح")

    def _initialize_inference_rules(self):
        """تهيئة قواعد الاستدلال الخاصة بكل نوع من الفوضى"""

        # Critical Services: الخدمات الحرجة التي لا يمكن المساس بها
        self.critical_services = {
            "auth_service",
            "payment_gateway",
            "quantum_shield",
            "security_engine",
            "api_gateway"
        }

        # Thresholds: عتبات الأداء
        self.thresholds = {
            "latency_critical_ms": 300,
            "latency_high_ms": 150,
            "latency_medium_ms": 100,
            "cpu_critical_percent": 90,
            "memory_critical_percent": 85,
            "error_rate_critical": 0.05,  # 5%
        }

    def snapshot_current_state(self,
                              metrics: Optional[Dict[str, Any]] = None) -> StateSnapshot:
        """
        التقاط لقطة من الحالة الحالية للنظام

        Args:
            metrics: مقاييس الأداء الحالية (من Prometheus/Grafana)

        Returns:
            StateSnapshot: لقطة الحالة
        """
        snapshot = StateSnapshot(
            timestamp=datetime.now().isoformat(),
            metrics=metrics or self._get_default_metrics(),
            services_health=self._get_services_health(),
            performance_indicators=self._get_performance_indicators()
        )

        # حفظ كـ Golden Snapshot إذا كانت الحالة جيدة
        if self._is_healthy_state(snapshot):
            self.golden_snapshot = snapshot
            self._save_snapshot(snapshot, "golden")

        return snapshot

    def predict_impact(self,
                      chaos_scenario: Dict[str, Any],
                      current_state: Optional[StateSnapshot] = None) -> ImpactPrediction:
        """
        القلب النابض للنظام - يحلل الفوضى ويتنبأ بالتأثير

        هذا هو محرك الاستدلال المتقدم (Advanced Inference Engine)
        الذي يحاكي نماذج ML في التنبؤ

        Args:
            chaos_scenario: سيناريو الفوضى المُراد تحليله
            current_state: الحالة الحالية (اختياري)

        Returns:
            ImpactPrediction: تنبؤ شامل بالتأثير
        """

        chaos_type = chaos_scenario.get('type', 'unknown')
        details = chaos_scenario.get('details', {})
        target_services = chaos_scenario.get('target_services', [])

        print(f"🧠 [Twin Manager] تحليل سيناريو: {chaos_type}")

        # اختيار محرك التحليل حسب نوع الفوضى
        if chaos_type == ChaosType.NETWORK_LATENCY.value:
            return self._analyze_network_latency(details, target_services)

        elif chaos_type == ChaosType.SERVICE_FAILURE.value:
            return self._analyze_service_failure(details, target_services)

        elif chaos_type == ChaosType.RESOURCE_EXHAUSTION.value:
            return self._analyze_resource_exhaustion(details, target_services)

        elif chaos_type == ChaosType.NETWORK_PARTITION.value:
            return self._analyze_network_partition(details, target_services)

        elif chaos_type == ChaosType.DATABASE_SLOWDOWN.value:
            return self._analyze_database_slowdown(details, target_services)

        else:
            return self._default_prediction(chaos_type, details)

    def _analyze_network_latency(self,
                                 details: Dict[str, Any],
                                 target_services: List[str]) -> ImpactPrediction:
        """تحليل تأثير التأخير في الشبكة"""

        latency_ms = details.get('latency_ms', 0)
        latency_sec = latency_ms / 1000

        # التحقق من تأثير الخدمات الحرجة
        critical_affected = any(svc in self.critical_services for svc in target_services)

        # قواعد الاستدلال المتقدمة
        if latency_ms > self.thresholds['latency_critical_ms'] and critical_affected:
            return ImpactPrediction(
                severity=SeverityLevel.CRITICAL,
                affected_components=[
                    "API Gateway",
                    "Quantum Shield Logic",
                    "Security Engine",
                    "User Authentication"
                ],
                description=(
                    f"⚠️ تأخير حرج في الشبكة ({latency_ms:.0f}ms) يؤثر على خدمات أساسية. "
                    f"متوقع فشل متتالي (Cascading Failure) في Circuit Breakers. "
                    f"تجربة المستخدم ستتدهور بشكل كبير."
                ),
                time_to_failure="3-5 ثواني",
                recommended_actions=[
                    "تفعيل Circuit Breaker فوراً",
                    "تحويل الطلبات إلى خادم احتياطي",
                    "إرسال تنبيه للفريق التقني",
                    "تفعيل وضع التحلل التدريجي (Graceful Degradation)"
                ],
                confidence_score=0.92,
                cascading_effects=[
                    "فشل طلبات المصادقة (Auth timeouts)",
                    "تراكم الطلبات في Queue",
                    "استنفاد موارد الذاكرة",
                    "فشل عمليات الدفع"
                ]
            )

        elif latency_ms > self.thresholds['latency_high_ms']:
            return ImpactPrediction(
                severity=SeverityLevel.HIGH,
                affected_components=[
                    "User Experience",
                    "API Response Time",
                    "Real-time Features"
                ],
                description=(
                    f"تأخير ملحوظ ({latency_ms:.0f}ms) سيؤدي إلى بطء واضح في الواجهة. "
                    f"المستخدمون قد يحتاجون لإعادة المحاولة."
                ),
                time_to_failure="10-15 ثانية",
                recommended_actions=[
                    "مراقبة معدل الأخطاء",
                    "تحسين الاستعلامات البطيئة",
                    "تفعيل التخزين المؤقت (Caching)"
                ],
                confidence_score=0.85,
                cascading_effects=[
                    "زيادة معدل إعادة المحاولات",
                    "ارتفاع استهلاك CPU"
                ]
            )

        elif latency_ms > self.thresholds['latency_medium_ms']:
            return ImpactPrediction(
                severity=SeverityLevel.MEDIUM,
                affected_components=["Frontend Performance"],
                description=f"تأخير متوسط ({latency_ms:.0f}ms) - تأثير محدود على التجربة",
                time_to_failure="غير محدد (بطء تدريجي)",
                recommended_actions=["مراقبة مستمرة", "تحسين استباقي"],
                confidence_score=0.70,
                cascading_effects=[]
            )

        else:
            return ImpactPrediction(
                severity=SeverityLevel.LOW,
                affected_components=[],
                description="تأثير محدود - النظام قادر على الاستيعاب",
                time_to_failure="لا يوجد",
                recommended_actions=[],
                confidence_score=0.95,
                cascading_effects=[]
            )

    def _analyze_service_failure(self,
                                 details: Dict[str, Any],
                                 target_services: List[str]) -> ImpactPrediction:
        """تحليل تأثير فشل الخدمات"""

        failed_service = details.get('service_name', 'unknown')
        duration = details.get('duration', 0)

        if failed_service in self.critical_services:
            return ImpactPrediction(
                severity=SeverityLevel.CRITICAL,
                affected_components=[failed_service, "Dependent Services"],
                description=(
                    f"⛔ فشل خدمة حرجة: {failed_service}. "
                    f"متوقع انهيار متتالي في الخدمات المعتمدة عليها."
                ),
                time_to_failure="فوري (< 1 ثانية)",
                recommended_actions=[
                    "تفعيل Failover تلقائي",
                    "إيقاف الطلبات الجديدة",
                    "استعادة من آخر حالة جيدة",
                    "تنبيه الفريق فوراً"
                ],
                confidence_score=0.98,
                cascading_effects=[
                    "فشل جميع العمليات المرتبطة",
                    "فقدان البيانات المحتمل",
                    "انقطاع الخدمة الكامل"
                ]
            )
        else:
            return ImpactPrediction(
                severity=SeverityLevel.MEDIUM,
                affected_components=[failed_service],
                description=f"فشل خدمة ثانوية: {failed_service}",
                time_to_failure="30-60 ثانية",
                recommended_actions=["محاولة إعادة التشغيل", "استخدام النسخة الاحتياطية"],
                confidence_score=0.80,
                cascading_effects=[]
            )

    def _analyze_resource_exhaustion(self,
                                     details: Dict[str, Any],
                                     target_services: List[str]) -> ImpactPrediction:
        """تحليل استنفاد الموارد"""

        resource_type = details.get('resource_type', 'unknown')
        utilization = details.get('utilization_percent', 0)

        if utilization > 90:
            return ImpactPrediction(
                severity=SeverityLevel.CRITICAL,
                affected_components=["All Services", "System Stability"],
                description=(
                    f"🔥 استنفاد حرج للموارد ({resource_type}: {utilization}%). "
                    f"النظام على وشك الانهيار التام."
                ),
                time_to_failure="1-2 دقيقة",
                recommended_actions=[
                    "إيقاف الخدمات غير الأساسية فوراً",
                    "تفريغ الذاكرة (Memory dump)",
                    "Scale up الموارد",
                    "حد من الطلبات الواردة"
                ],
                confidence_score=0.95,
                cascading_effects=[
                    "Out of Memory Errors",
                    "Process crashes",
                    "Database connection failures"
                ]
            )
        else:
            return ImpactPrediction(
                severity=SeverityLevel.HIGH,
                affected_components=["Performance"],
                description=f"ضغط مرتفع على {resource_type} ({utilization}%)",
                time_to_failure="5-10 دقائق",
                recommended_actions=["مراقبة دقيقة", "تحسين الأداء"],
                confidence_score=0.75,
                cascading_effects=[]
            )

    def _analyze_network_partition(self,
                                   details: Dict[str, Any],
                                   target_services: List[str]) -> ImpactPrediction:
        """تحليل تجزئة الشبكة"""

        return ImpactPrediction(
            severity=SeverityLevel.CRITICAL,
            affected_components=["Distributed System", "Data Consistency"],
            description="⚠️ تجزئة الشبكة - خطر على اتساق البيانات",
            time_to_failure="فوري",
            recommended_actions=[
                "تفعيل بروتوكول Split-Brain Prevention",
                "إيقاف العمليات الكتابية المتعارضة",
                "تحديد القسم الأساسي (Primary Partition)"
            ],
            confidence_score=0.90,
            cascading_effects=["Data inconsistency", "Duplicate operations"]
        )

    def _analyze_database_slowdown(self,
                                   details: Dict[str, Any],
                                   target_services: List[str]) -> ImpactPrediction:
        """تحليل بطء قاعدة البيانات"""

        query_time = details.get('query_time_ms', 0)

        if query_time > 5000:  # 5 seconds
            return ImpactPrediction(
                severity=SeverityLevel.CRITICAL,
                affected_components=["Database Layer", "All Backend Services"],
                description=f"⚠️ بطء شديد في قاعدة البيانات ({query_time}ms)",
                time_to_failure="2-3 دقائق",
                recommended_actions=[
                    "فحص الاستعلامات البطيئة",
                    "إلغاء الاستعلامات طويلة المدى",
                    "تفعيل Read Replicas",
                    "تحسين الفهارس"
                ],
                confidence_score=0.88,
                cascading_effects=[
                    "Connection pool exhaustion",
                    "Request timeouts",
                    "Queue backlog"
                ]
            )
        else:
            return ImpactPrediction(
                severity=SeverityLevel.MEDIUM,
                affected_components=["Database Performance"],
                description=f"بطء متوسط في DB ({query_time}ms)",
                time_to_failure="10-15 دقيقة",
                recommended_actions=["تحسين استباقي", "مراقبة"],
                confidence_score=0.70,
                cascading_effects=[]
            )

    def _default_prediction(self,
                           chaos_type: str,
                           details: Dict[str, Any]) -> ImpactPrediction:
        """تنبؤ افتراضي لسيناريوهات غير معروفة"""

        return ImpactPrediction(
            severity=SeverityLevel.MEDIUM,
            affected_components=["Unknown"],
            description=f"سيناريو غير معروف: {chaos_type}",
            time_to_failure="غير محدد",
            recommended_actions=["تحليل يدوي مطلوب"],
            confidence_score=0.50,
            cascading_effects=[]
        )

    def _get_default_metrics(self) -> Dict[str, Any]:
        """الحصول على مقاييس افتراضية"""
        return {
            "cpu_percent": 25.0,
            "memory_percent": 40.0,
            "disk_usage": 50.0,
            "network_latency_ms": 10.0
        }

    def _get_services_health(self) -> Dict[str, str]:
        """الحصول على حالة صحة الخدمات"""
        return {
            "backend": "healthy",
            "frontend": "healthy",
            "redis": "healthy",
            "celery": "healthy"
        }

    def _get_performance_indicators(self) -> Dict[str, float]:
        """الحصول على مؤشرات الأداء"""
        return {
            "requests_per_second": 100.0,
            "avg_response_time_ms": 50.0,
            "error_rate": 0.001
        }

    def _is_healthy_state(self, snapshot: StateSnapshot) -> bool:
        """التحقق من أن الحالة صحية"""
        metrics = snapshot.metrics
        return (
            metrics.get('cpu_percent', 100) < 80 and
            metrics.get('memory_percent', 100) < 75 and
            all(h == "healthy" for h in snapshot.services_health.values())
        )

    def _save_snapshot(self, snapshot: StateSnapshot, name: str = "snapshot"):
        """حفظ لقطة الحالة"""
        filepath = self.state_dir / f"{name}_{int(time.time())}.json"
        with open(filepath, 'w') as f:
            json.dump(snapshot.to_dict(), f, indent=2)

    def save_prediction(self, prediction: ImpactPrediction):
        """حفظ التنبؤ في السجل"""
        self.predictions_history.append(prediction)

        # حفظ في ملف للتحليل لاحقاً
        filepath = self.state_dir / f"prediction_{int(time.time())}.json"
        with open(filepath, 'w') as f:
            json.dump(prediction.to_dict(), f, indent=2, ensure_ascii=False)

    def get_recovery_recommendation(self,
                                    prediction: ImpactPrediction) -> Dict[str, Any]:
        """الحصول على توصيات التعافي"""

        if prediction.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]:
            return {
                "action": "IMMEDIATE_ROLLBACK",
                "reason": "تأثير حرج - يتطلب تدخل فوري",
                "steps": prediction.recommended_actions,
                "revert_to": "last_known_good_state"
            }
        else:
            return {
                "action": "MONITOR",
                "reason": "تأثير محدود - مراقبة مستمرة",
                "steps": ["استمرار المراقبة", "تحليل دوري"],
                "revert_to": None
            }
