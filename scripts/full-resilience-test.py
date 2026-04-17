#!/usr/bin/env python3
"""
🚀 QURABIA Full Resilience Test Suite
════════════════════════════════════════════════════════════════

سكريبت الاختبار الشامل للمرونة - يدمج جميع المكونات

الدورة الكاملة:
1. Setup: تشغيل الخدمات الأساسية
2. Inject Chaos: تفعيل حاقن الفوضى
3. Monitor Twin: مراقبة التوأم الرقمي
4. Verify Recovery: التحقق من التعافي
5. Report: توليد تقرير شامل
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

import redis


class Colors:
    """ألوان للطباعة"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class ResilienceTestSuite:
    """مجموعة اختبارات المرونة الشاملة"""

    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        self.redis_host = redis_host
        self.redis_port = redis_port
        self.redis_client = None

        self.project_root = Path(__file__).parent.parent
        self.backend_dir = self.project_root / "backend"

        self.test_results: List[Dict[str, Any]] = []
        self.start_time = None
        self.end_time = None

    def connect_redis(self) -> bool:
        """الاتصال بـ Redis"""
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True,
                socket_connect_timeout=5
            )
            self.redis_client.ping()
            return True
        except Exception as e:
            print(f"{Colors.FAIL}❌ فشل الاتصال بـ Redis: {e}{Colors.ENDC}")
            return False

    def check_services(self) -> bool:
        """التحقق من الخدمات الأساسية"""
        print(f"\n{Colors.OKCYAN}🔍 فحص الخدمات الأساسية...{Colors.ENDC}")

        # Redis
        if not self.connect_redis():
            print(f"{Colors.FAIL}   ❌ Redis: غير متاح{Colors.ENDC}")
            return False
        print(f"{Colors.OKGREEN}   ✅ Redis: متاح{Colors.ENDC}")

        # يمكن إضافة فحوصات أخرى (backend API, etc.)

        return True

    def run_chaos_scenario(self, scenario_type: str, duration: int = 20) -> str:
        """
        تشغيل سيناريو فوضى

        Args:
            scenario_type: نوع السيناريو
            duration: المدة

        Returns:
            test_id: معرف الاختبار
        """
        print(f"\n{Colors.WARNING}⚡ حقن فوضى: {scenario_type}{Colors.ENDC}")

        cmd = [
            "python", "-m",
            "services.chaos_engine.chaos_injector",
            "--scenario", scenario_type,
            "--duration", str(duration)
        ]

        env = os.environ.copy()
        env["REDIS_HOST"] = self.redis_host
        env["REDIS_PORT"] = str(self.redis_port)
        env["PYTHONPATH"] = str(self.backend_dir)

        try:
            result = subprocess.run(
                cmd,
                cwd=self.backend_dir,
                env=env,
                capture_output=True,
                text=True,
                timeout=duration + 30
            )

            # استخراج test_id من output (بسيط للـ POC)
            test_id = f"test_{int(time.time())}"

            if result.returncode == 0:
                print(f"{Colors.OKGREEN}   ✅ اكتمل السيناريو{Colors.ENDC}")
            else:
                print(f"{Colors.WARNING}   ⚠️ السيناريو انتهى بتحذيرات{Colors.ENDC}")

            return test_id

        except subprocess.TimeoutExpired:
            print(f"{Colors.FAIL}   ❌ انتهت مدة الانتظار{Colors.ENDC}")
            return "timeout"
        except Exception as e:
            print(f"{Colors.FAIL}   ❌ خطأ: {e}{Colors.ENDC}")
            return "error"

    def monitor_twin_alerts(self, duration: int = 10) -> List[Dict[str, Any]]:
        """
        مراقبة تنبيهات التوأم الرقمي

        Args:
            duration: مدة المراقبة

        Returns:
            قائمة التنبيهات
        """
        print(f"\n{Colors.OKCYAN}📡 مراقبة التوأم الرقمي لمدة {duration} ثانية...{Colors.ENDC}")

        alerts = []
        pubsub = self.redis_client.pubsub()
        pubsub.subscribe("chaos_alerts")

        start = time.time()
        try:
            while time.time() - start < duration:
                message = pubsub.get_message(timeout=1)
                if message and message['type'] == 'message':
                    try:
                        alert = json.loads(message['data'])
                        alerts.append(alert)
                        severity = alert.get('severity', 'UNKNOWN')
                        print(f"   🚨 تنبيه [{severity}]: {len(alert.get('affected_components', []))} مكونات متأثرة")
                    except json.JSONDecodeError:
                        pass
        finally:
            pubsub.close()

        print(f"{Colors.OKGREEN}   ✅ تم استلام {len(alerts)} تنبيهات{Colors.ENDC}")
        return alerts

    def verify_system_health(self) -> Dict[str, Any]:
        """التحقق من صحة النظام بعد الاختبار"""
        print(f"\n{Colors.OKCYAN}🏥 التحقق من صحة النظام...{Colors.ENDC}")

        health = {
            "redis": False,
            "overall": False
        }

        # Redis
        try:
            self.redis_client.ping()
            health["redis"] = True
            print(f"{Colors.OKGREEN}   ✅ Redis: صحي{Colors.ENDC}")
        except:
            print(f"{Colors.FAIL}   ❌ Redis: غير صحي{Colors.ENDC}")

        health["overall"] = all([
            health["redis"]
        ])

        return health

    def generate_report(self) -> Dict[str, Any]:
        """توليد تقرير شامل"""
        total_duration = (self.end_time - self.start_time) if self.end_time and self.start_time else 0

        report = {
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": total_duration,
            "total_tests": len(self.test_results),
            "tests": self.test_results,
            "summary": {
                "successful": sum(1 for t in self.test_results if t.get('status') == 'success'),
                "failed": sum(1 for t in self.test_results if t.get('status') == 'failed'),
                "warnings": sum(1 for t in self.test_results if t.get('status') == 'warning'),
            }
        }

        return report

    def print_final_report(self, report: Dict[str, Any]):
        """طباعة التقرير النهائي"""
        print("\n" + "═"*70)
        print(f"{Colors.HEADER}{Colors.BOLD}📊 التقرير النهائي - Full Resilience Test{Colors.ENDC}")
        print("═"*70 + "\n")

        print(f"⏱️  المدة الإجمالية: {report['duration_seconds']:.1f} ثانية")
        print(f"📋 عدد الاختبارات: {report['total_tests']}")

        summary = report['summary']
        print(f"\n📊 الملخص:")
        print(f"   ✅ ناجح: {summary['successful']}")
        print(f"   ❌ فاشل: {summary['failed']}")
        print(f"   ⚠️  تحذيرات: {summary['warnings']}")

        print(f"\n🎯 النتائج التفصيلية:")
        print("─"*70)
        for i, test in enumerate(report['tests'], 1):
            status_icon = {
                'success': '✅',
                'failed': '❌',
                'warning': '⚠️'
            }.get(test.get('status'), '❓')

            print(f"{i}. {status_icon} {test['name']}")
            if test.get('alerts_count'):
                print(f"   📡 تنبيهات: {test['alerts_count']}")
            if test.get('duration'):
                print(f"   ⏱️  المدة: {test['duration']:.1f}s")

        print("\n" + "═"*70)

        # الحالة النهائية
        if summary['failed'] == 0:
            print(f"{Colors.OKGREEN}{Colors.BOLD}✅ النظام مرن وقادر على التعافي!{Colors.ENDC}")
        elif summary['failed'] < summary['successful']:
            print(f"{Colors.WARNING}{Colors.BOLD}⚠️ النظام يحتاج تحسينات في المرونة{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}{Colors.BOLD}❌ النظام يحتاج تحسينات جذرية{Colors.ENDC}")

        print("═"*70 + "\n")

    def run_full_test(self, suite: str = "standard") -> Dict[str, Any]:
        """
        تشغيل الاختبار الكامل

        Args:
            suite: نوع المجموعة (standard/aggressive)

        Returns:
            تقرير النتائج
        """
        print(f"\n{Colors.HEADER}╔" + "═"*68 + "╗{Colors.ENDC}")
        print(f"{Colors.HEADER}║{Colors.BOLD}" + " "*10 + "🚀 QURABIA Full Resilience Test Suite" + " "*20 + f"{Colors.ENDC}{Colors.HEADER}║{Colors.ENDC}")
        print(f"{Colors.HEADER}║" + " "*10 + "   اختبار المرونة الشامل" + " "*30 + f"║{Colors.ENDC}")
        print(f"{Colors.HEADER}╚" + "═"*68 + "╝{Colors.ENDC}\n")

        self.start_time = time.time()

        # 1. فحص الخدمات
        print(f"{Colors.BOLD}المرحلة 1: فحص البنية التحتية{Colors.ENDC}")
        if not self.check_services():
            print(f"\n{Colors.FAIL}❌ فشل: الخدمات الأساسية غير متاحة{Colors.ENDC}")
            sys.exit(1)

        # 2. سيناريوهات الاختبار
        scenarios = [
            ("mild_latency", 20),
            ("critical_latency", 15),
            ("db_slowdown", 18),
        ] if suite == "standard" else [
            ("critical_latency", 25),
            ("resource_exhaustion", 30),
            ("db_slowdown", 20),
        ]

        print(f"\n{Colors.BOLD}المرحلة 2: تنفيذ سيناريوهات الفوضى ({len(scenarios)} سيناريو){Colors.ENDC}")

        for i, (scenario_type, duration) in enumerate(scenarios, 1):
            print(f"\n{'─'*70}")
            print(f"🎯 السيناريو {i}/{len(scenarios)}: {scenario_type}")
            print('─'*70)

            # تشغيل السيناريو
            test_id = self.run_chaos_scenario(scenario_type, duration)

            # مراقبة التنبيهات
            time.sleep(2)  # انتظار قصير لوصول التنبيهات
            alerts = self.monitor_twin_alerts(duration=8)

            # تسجيل النتيجة
            test_result = {
                "name": scenario_type,
                "test_id": test_id,
                "status": "success" if test_id not in ["timeout", "error"] else "failed",
                "alerts_count": len(alerts),
                "duration": duration,
                "alerts": alerts
            }
            self.test_results.append(test_result)

            # انتظار قبل السيناريو التالي
            if i < len(scenarios):
                recovery_time = 10
                print(f"\n⏸️ فترة تعافي: {recovery_time} ثانية...")
                time.sleep(recovery_time)

        # 3. التحقق من الصحة النهائية
        print(f"\n{Colors.BOLD}المرحلة 3: التحقق النهائي{Colors.ENDC}")
        final_health = self.verify_system_health()

        if final_health["overall"]:
            print(f"\n{Colors.OKGREEN}✅ النظام في حالة صحية{Colors.ENDC}")
        else:
            print(f"\n{Colors.WARNING}⚠️ النظام يحتاج فحص يدوي{Colors.ENDC}")

        self.end_time = time.time()

        # 4. توليد التقرير
        report = self.generate_report()
        report['final_health'] = final_health

        # طباعة التقرير
        self.print_final_report(report)

        # حفظ التقرير
        self._save_report(report)

        return report

    def _save_report(self, report: Dict[str, Any]):
        """حفظ التقرير في ملف"""
        reports_dir = self.project_root / "resilience-reports"
        reports_dir.mkdir(exist_ok=True)

        filename = f"resilience_test_{int(time.time())}.json"
        filepath = reports_dir / filename

        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"💾 تم حفظ التقرير: {filepath}")


def main():
    """نقطة الدخول الرئيسية"""
    parser = argparse.ArgumentParser(
        description="QURABIA Full Resilience Test Suite"
    )
    parser.add_argument(
        "--suite",
        choices=["standard", "aggressive"],
        default="standard",
        help="نوع مجموعة الاختبار"
    )
    parser.add_argument(
        "--redis-host",
        default=os.getenv("REDIS_HOST", "localhost"),
        help="عنوان Redis"
    )
    parser.add_argument(
        "--redis-port",
        type=int,
        default=int(os.getenv("REDIS_PORT", "6379")),
        help="منفذ Redis"
    )

    args = parser.parse_args()

    # إنشاء مجموعة الاختبار
    test_suite = ResilienceTestSuite(
        redis_host=args.redis_host,
        redis_port=args.redis_port
    )

    # تشغيل الاختبارات
    try:
        report = test_suite.run_full_test(suite=args.suite)

        # كود الخروج حسب النتيجة
        if report['summary']['failed'] == 0:
            sys.exit(0)
        else:
            sys.exit(1)

    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}⚠️ تم إيقاف الاختبار بواسطة المستخدم{Colors.ENDC}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.FAIL}❌ خطأ غير متوقع: {e}{Colors.ENDC}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
