"""
⚡ Chaos Injector - حاقن الفوضى
════════════════════════════════════════════════════════════════

محرك حقن الفوضى لاختبار مرونة النظام تحت ظروف قاسية
"""

import json
import random
import time
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import redis
import structlog


class ChaosType(Enum):
    """أنواع سيناريوهات الفوضى"""
    NETWORK_LATENCY = "network_latency"
    SERVICE_FAILURE = "service_failure"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    NETWORK_PARTITION = "network_partition"
    DATABASE_SLOWDOWN = "database_slowdown"
    MEMORY_LEAK = "memory_leak"
    CASCADING_FAILURE = "cascading_failure"


@dataclass
class ChaosScenario:
    """
    سيناريو فوضى

    يصف نوع الفوضى المراد حقنها وتفاصيلها
    """
    type: ChaosType
    duration: int  # بالثواني
    target_services: List[str]
    intensity: float  # 0.0 - 1.0
    details: Dict[str, Any]

    def to_dict(self) -> dict:
        data = asdict(self)
        data['type'] = self.type.value
        return data


class ChaosInjector:
    """
    حاقن الفوضى الرئيسي

    يقوم بحقن سيناريوهات فوضى متنوعة ومحاكاة أعطال النظام
    """

    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        """
        تهيئة حاقن الفوضى

        Args:
            redis_host: عنوان Redis
            redis_port: منفذ Redis
        """
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )

        self.logger = structlog.get_logger()

        # سجل الاختبارات
        self.test_history: List[Dict[str, Any]] = []

        print("⚡ [Chaos Injector] تم التهيئة بنجاح")
        print(f"   Redis: {redis_host}:{redis_port}")

    def inject_chaos(self, scenario: ChaosScenario) -> str:
        """
        حقن سيناريو فوضى

        Args:
            scenario: السيناريو المراد حقنه

        Returns:
            test_id: معرف الاختبار
        """
        test_id = str(uuid.uuid4())[:8]

        print("\n" + "▶"*30)
        print(f"⚡ [Chaos Injector] حقن فوضى جديدة")
        print("▶"*30)
        print(f"🔖 Test ID: {test_id}")
        print(f"⚡ النوع: {scenario.type.value}")
        print(f"⏱️ المدة: {scenario.duration} ثانية")
        print(f"🎯 الأهداف: {', '.join(scenario.target_services)}")
        print(f"💪 الشدة: {scenario.intensity:.0%}")
        print("▶"*30 + "\n")

        # نشر الحدث إلى Digital Twin
        self._publish_chaos_event(test_id, scenario)

        # تنفيذ السيناريو
        self._execute_scenario(test_id, scenario)

        # حفظ في السجل
        test_record = {
            "test_id": test_id,
            "timestamp": datetime.now().isoformat(),
            "scenario": scenario.to_dict(),
            "status": "completed"
        }
        self.test_history.append(test_record)

        print(f"✅ [Chaos Injector] اكتمل الاختبار {test_id}\n")

        return test_id

    def _publish_chaos_event(self, test_id: str, scenario: ChaosScenario):
        """
        نشر حدث فوضى إلى Digital Twin

        Args:
            test_id: معرف الاختبار
            scenario: السيناريو
        """
        event = {
            "test_id": test_id,
            "timestamp": datetime.now().isoformat(),
            "source": "chaos_injector",
            "scenario": scenario.to_dict()
        }

        try:
            # إرسال إلى قائمة chaos_events
            self.redis_client.rpush(
                "chaos_events",
                json.dumps(event, ensure_ascii=False)
            )

            print(f"📡 [Chaos Injector] تم نشر الحدث إلى Digital Twin")

        except Exception as e:
            self.logger.error("فشل نشر حدث الفوضى", error=str(e))

    def _execute_scenario(self, test_id: str, scenario: ChaosScenario):
        """
        تنفيذ سيناريو الفوضى

        Args:
            test_id: معرف الاختبار
            scenario: السيناريو
        """
        print(f"🎬 [Chaos Injector] بدء تنفيذ السيناريو...")

        # اختيار طريقة التنفيذ حسب النوع
        if scenario.type == ChaosType.NETWORK_LATENCY:
            self._inject_network_latency(scenario)

        elif scenario.type == ChaosType.SERVICE_FAILURE:
            self._inject_service_failure(scenario)

        elif scenario.type == ChaosType.RESOURCE_EXHAUSTION:
            self._inject_resource_exhaustion(scenario)

        elif scenario.type == ChaosType.DATABASE_SLOWDOWN:
            self._inject_database_slowdown(scenario)

        else:
            print(f"⚠️ سيناريو غير مدعوم: {scenario.type}")

        print(f"⏸️ [Chaos Injector] انتظار {scenario.duration} ثانية...")
        time.sleep(scenario.duration)

        print(f"🏁 [Chaos Injector] انتهى السيناريو")

    def _inject_network_latency(self, scenario: ChaosScenario):
        """
        حقن تأخير في الشبكة

        ملاحظة: في POC نستخدم محاكاة. في الإنتاج نستخدم ToxiProxy أو tc
        """
        latency_ms = scenario.details.get('latency_ms', 100)

        print(f"   🌐 حقن تأخير شبكة: {latency_ms}ms")
        print(f"   🎯 الأهداف: {', '.join(scenario.target_services)}")

        # في POC: محاكاة فقط
        # في الإنتاج: استخدام ToxiProxy أو tc (traffic control)
        print(f"   ⚙️ [POC Mode] محاكاة التأخير...")

        # محاكاة: حفظ معلومات التأخير في Redis
        for service in scenario.target_services:
            key = f"chaos:latency:{service}"
            self.redis_client.setex(
                key,
                scenario.duration,
                latency_ms
            )

    def _inject_service_failure(self, scenario: ChaosScenario):
        """حقن فشل خدمة"""
        service_name = scenario.details.get('service_name', 'unknown')

        print(f"   ⛔ محاكاة فشل خدمة: {service_name}")
        print(f"   ⚙️ [POC Mode] الخدمة ستُعتبر متعطلة مؤقتاً")

        # محاكاة: وضع علامة فشل في Redis
        key = f"chaos:service_down:{service_name}"
        self.redis_client.setex(
            key,
            scenario.duration,
            "1"
        )

    def _inject_resource_exhaustion(self, scenario: ChaosScenario):
        """حقن استنفاد موارد"""
        resource_type = scenario.details.get('resource_type', 'memory')
        utilization = scenario.details.get('utilization_percent', 80)

        print(f"   💾 محاكاة استنفاد موارد: {resource_type} ({utilization}%)")
        print(f"   ⚙️ [POC Mode] تسجيل ضغط مرتفع على الموارد")

        # محاكاة: تسجيل استهلاك مرتفع
        key = f"chaos:resource:{resource_type}"
        self.redis_client.setex(
            key,
            scenario.duration,
            utilization
        )

    def _inject_database_slowdown(self, scenario: ChaosScenario):
        """حقن بطء في قاعدة البيانات"""
        query_time_ms = scenario.details.get('query_time_ms', 1000)

        print(f"   🗄️ محاكاة بطء في DB: {query_time_ms}ms")
        print(f"   ⚙️ [POC Mode] تأخير استعلامات DB")

        # محاكاة: تسجيل بطء DB
        key = "chaos:db_slowdown"
        self.redis_client.setex(
            key,
            scenario.duration,
            query_time_ms
        )

    # ────────────────────────────────────────────────────────────
    # سيناريوهات محددة مسبقاً (Predefined Scenarios)
    # ────────────────────────────────────────────────────────────

    @staticmethod
    def create_mild_latency_scenario(duration: int = 30) -> ChaosScenario:
        """سيناريو تأخير بسيط"""
        return ChaosScenario(
            type=ChaosType.NETWORK_LATENCY,
            duration=duration,
            target_services=["backend", "api_gateway"],
            intensity=0.3,
            details={"latency_ms": 150}
        )

    @staticmethod
    def create_critical_latency_scenario(duration: int = 20) -> ChaosScenario:
        """سيناريو تأخير حرج"""
        return ChaosScenario(
            type=ChaosType.NETWORK_LATENCY,
            duration=duration,
            target_services=["backend", "auth_service", "quantum_shield"],
            intensity=0.9,
            details={"latency_ms": 500}
        )

    @staticmethod
    def create_service_failure_scenario(service: str, duration: int = 15) -> ChaosScenario:
        """سيناريو فشل خدمة"""
        return ChaosScenario(
            type=ChaosType.SERVICE_FAILURE,
            duration=duration,
            target_services=[service],
            intensity=1.0,
            details={"service_name": service}
        )

    @staticmethod
    def create_resource_exhaustion_scenario(duration: int = 25) -> ChaosScenario:
        """سيناريو استنفاد موارد"""
        return ChaosScenario(
            type=ChaosType.RESOURCE_EXHAUSTION,
            duration=duration,
            target_services=["backend"],
            intensity=0.8,
            details={
                "resource_type": "memory",
                "utilization_percent": 92
            }
        )

    @staticmethod
    def create_database_slowdown_scenario(duration: int = 30) -> ChaosScenario:
        """سيناريو بطء قاعدة البيانات"""
        return ChaosScenario(
            type=ChaosType.DATABASE_SLOWDOWN,
            duration=duration,
            target_services=["backend", "database"],
            intensity=0.7,
            details={"query_time_ms": 3000}
        )

    def run_random_chaos(self, duration: int = 60):
        """
        تشغيل فوضى عشوائية

        Args:
            duration: المدة الإجمالية بالثواني
        """
        print("\n" + "🎲"*30)
        print("🎲 [Chaos Injector] وضع الفوضى العشوائية")
        print("🎲"*30 + "\n")

        scenarios = [
            self.create_mild_latency_scenario(10),
            self.create_critical_latency_scenario(5),
            self.create_service_failure_scenario("cache", 8),
            self.create_database_slowdown_scenario(12),
        ]

        start_time = time.time()
        elapsed = 0

        while elapsed < duration:
            # اختيار سيناريو عشوائي
            scenario = random.choice(scenarios)

            # حقنه
            self.inject_chaos(scenario)

            # انتظار عشوائي قبل الفوضى التالية
            wait_time = random.randint(5, 15)
            time.sleep(wait_time)

            elapsed = time.time() - start_time

        print("\n🏁 انتهى وضع الفوضى العشوائية\n")


def main():
    """نقطة الدخول الرئيسية"""
    import argparse
    import os

    parser = argparse.ArgumentParser(description="QURABIA Chaos Injector")
    parser.add_argument("--scenario", choices=[
        "mild_latency", "critical_latency", "service_failure",
        "resource_exhaustion", "db_slowdown", "random"
    ], default="mild_latency", help="نوع السيناريو")
    parser.add_argument("--duration", type=int, default=30, help="المدة بالثواني")
    parser.add_argument("--service", type=str, help="اسم الخدمة (لـ service_failure)")

    args = parser.parse_args()

    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))

    print("╔" + "═"*60 + "╗")
    print("║" + " "*15 + "⚡ QURABIA Chaos Injector" + " "*20 + "║")
    print("║" + " "*15 + "  محرك الفوضى الكمومي" + " "*21 + "║")
    print("╚" + "═"*60 + "╝\n")

    injector = ChaosInjector(redis_host=redis_host, redis_port=redis_port)

    # اختيار السيناريو
    if args.scenario == "mild_latency":
        scenario = injector.create_mild_latency_scenario(args.duration)
    elif args.scenario == "critical_latency":
        scenario = injector.create_critical_latency_scenario(args.duration)
    elif args.scenario == "service_failure":
        service = args.service or "cache"
        scenario = injector.create_service_failure_scenario(service, args.duration)
    elif args.scenario == "resource_exhaustion":
        scenario = injector.create_resource_exhaustion_scenario(args.duration)
    elif args.scenario == "db_slowdown":
        scenario = injector.create_database_slowdown_scenario(args.duration)
    elif args.scenario == "random":
        injector.run_random_chaos(args.duration)
        return

    # تنفيذ
    injector.inject_chaos(scenario)

    print("\n✅ اكتمل بنجاح!")


if __name__ == "__main__":
    main()
