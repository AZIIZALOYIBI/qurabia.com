"""
🎭 Chaos Orchestrator - منسق الفوضى
════════════════════════════════════════════════════════════════

منسق ذكي لإدارة سيناريوهات الفوضى المتعددة والتنسيق مع التوأم الرقمي
"""

import time
from datetime import datetime
from typing import List, Dict, Any

from .chaos_injector import ChaosInjector, ChaosScenario


class ChaosOrchestrator:
    """
    منسق الفوضى - يدير دورة الاختبار الكاملة

    يقوم بتنسيق الاختبارات بين Chaos Injector و Digital Twin
    ويضمن تكامل جميع المكونات
    """

    def __init__(self, chaos_injector: ChaosInjector):
        """
        تهيئة المنسق

        Args:
            chaos_injector: حاقن الفوضى
        """
        self.injector = chaos_injector
        self.test_results: List[Dict[str, Any]] = []

        print("🎭 [Chaos Orchestrator] تم التهيئة")

    def run_full_resilience_test(self,
                                 scenarios: List[ChaosScenario],
                                 wait_between: int = 10) -> Dict[str, Any]:
        """
        تشغيل اختبار مرونة كامل

        Args:
            scenarios: قائمة السيناريوهات
            wait_between: الانتظار بين السيناريوهات (ثواني)

        Returns:
            تقرير شامل بالنتائج
        """
        print("\n" + "╔" + "═"*60 + "╗")
        print("║" + " "*10 + "🎭 بدء اختبار المرونة الكامل" + " "*18 + "║")
        print("║" + " "*10 + "   Full Resilience Test Suite" + " "*18 + "║")
        print("╚" + "═"*60 + "╝\n")

        start_time = time.time()
        test_results = []

        for i, scenario in enumerate(scenarios, 1):
            print(f"\n📌 السيناريو {i}/{len(scenarios)}")
            print("─"*60)

            # تنفيذ السيناريو
            test_id = self.injector.inject_chaos(scenario)

            # تسجيل النتيجة
            test_results.append({
                "test_id": test_id,
                "scenario_type": scenario.type.value,
                "duration": scenario.duration,
                "intensity": scenario.intensity,
                "status": "completed"
            })

            # انتظار قبل السيناريو التالي (للتعافي)
            if i < len(scenarios):
                print(f"\n⏸️ انتظار {wait_between} ثانية للتعافي...")
                time.sleep(wait_between)

        end_time = time.time()
        total_duration = end_time - start_time

        # تقرير شامل
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_scenarios": len(scenarios),
            "total_duration_seconds": total_duration,
            "results": test_results,
            "overall_status": "completed"
        }

        self._print_final_report(report)

        return report

    def _print_final_report(self, report: Dict[str, Any]):
        """طباعة التقرير النهائي"""
        print("\n" + "╔" + "═"*60 + "╗")
        print("║" + " "*15 + "📊 التقرير النهائي" + " "*26 + "║")
        print("║" + " "*15 + "   Final Report" + " "*30 + "║")
        print("╚" + "═"*60 + "╝\n")

        print(f"⏱️ المدة الإجمالية: {report['total_duration_seconds']:.1f} ثانية")
        print(f"📋 عدد السيناريوهات: {report['total_scenarios']}")
        print(f"✅ الحالة: {report['overall_status']}")

        print("\n🎯 ملخص السيناريوهات:")
        print("─"*60)

        for i, result in enumerate(report['results'], 1):
            print(f"{i}. {result['scenario_type']}")
            print(f"   Test ID: {result['test_id']}")
            print(f"   Duration: {result['duration']}s | Intensity: {result['intensity']:.0%}")
            print(f"   Status: {result['status']}")
            print()

        print("═"*60)
        print("✅ اكتمل اختبار المرونة بنجاح!")
        print("═"*60 + "\n")

    @staticmethod
    def create_standard_test_suite() -> List[ChaosScenario]:
        """
        إنشاء مجموعة اختبار قياسية

        Returns:
            قائمة السيناريوهات
        """
        return [
            # 1. تأخير بسيط
            ChaosInjector.create_mild_latency_scenario(duration=15),

            # 2. تأخير حرج
            ChaosInjector.create_critical_latency_scenario(duration=10),

            # 3. فشل خدمة
            ChaosInjector.create_service_failure_scenario("cache", duration=12),

            # 4. بطء قاعدة بيانات
            ChaosInjector.create_database_slowdown_scenario(duration=18),

            # 5. استنفاد موارد
            ChaosInjector.create_resource_exhaustion_scenario(duration=15),
        ]

    @staticmethod
    def create_aggressive_test_suite() -> List[ChaosScenario]:
        """
        مجموعة اختبار قاسية

        Returns:
            قائمة السيناريوهات القاسية
        """
        return [
            ChaosInjector.create_critical_latency_scenario(duration=20),
            ChaosInjector.create_service_failure_scenario("backend", duration=15),
            ChaosInjector.create_resource_exhaustion_scenario(duration=25),
            ChaosInjector.create_critical_latency_scenario(duration=15),
        ]


def main():
    """نقطة الدخول الرئيسية"""
    import argparse
    import os

    parser = argparse.ArgumentParser(description="QURABIA Chaos Orchestrator")
    parser.add_argument("--suite", choices=["standard", "aggressive"],
                       default="standard", help="مجموعة الاختبار")
    parser.add_argument("--wait", type=int, default=10,
                       help="الانتظار بين السيناريوهات (ثواني)")

    args = parser.parse_args()

    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))

    print("╔" + "═"*60 + "╗")
    print("║" + " "*12 + "🎭 QURABIA Chaos Orchestrator" + " "*19 + "║")
    print("║" + " "*12 + "   منسق الفوضى الذكي" + " "*24 + "║")
    print("╚" + "═"*60 + "╝\n")

    # إنشاء الحاقن
    injector = ChaosInjector(redis_host=redis_host, redis_port=redis_port)

    # إنشاء المنسق
    orchestrator = ChaosOrchestrator(injector)

    # اختيار المجموعة
    if args.suite == "standard":
        scenarios = orchestrator.create_standard_test_suite()
        print("📋 تم اختيار: مجموعة الاختبار القياسية")
    else:
        scenarios = orchestrator.create_aggressive_test_suite()
        print("📋 تم اختيار: مجموعة الاختبار القاسية")

    print(f"📊 عدد السيناريوهات: {len(scenarios)}")
    print(f"⏱️ الانتظار بين السيناريوهات: {args.wait} ثانية\n")

    input("⏸️ اضغط Enter للبدء...")

    # تشغيل الاختبارات
    report = orchestrator.run_full_resilience_test(scenarios, args.wait)

    print("\n✅ تم حفظ التقرير")


if __name__ == "__main__":
    main()
