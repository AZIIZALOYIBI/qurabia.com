"""
📡 Digital Twin Listener
════════════════════════════════════════════════════════════════

المستمع الذكي لأحداث الفوضى - يستقبل الإشارات ويحللها
يعمل كـ Worker مستقل يستمع على Redis Pub/Sub
"""

import json
import signal
import sys
import time
from datetime import datetime
from typing import Optional

import redis
import structlog

from .twin_state_manager import DigitalTwinManager, ImpactPrediction


class TwinListener:
    """
    المستمع للأحداث الفوضوية

    يعمل كـ Background Worker يستمع لرسائل من Chaos Injector
    ويقوم بتحليلها باستخدام Digital Twin Manager
    """

    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        """
        تهيئة المستمع

        Args:
            redis_host: عنوان Redis
            redis_port: منفذ Redis
        """
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )

        self.twin_manager = DigitalTwinManager()
        self.logger = structlog.get_logger()

        self.running = False
        self._setup_signal_handlers()

        print("🟢 [Digital Twin Listener] المستمع جاهز. ينتظر أحداث الفوضى...")
        print(f"   Redis: {redis_host}:{redis_port}")
        print(f"   Queue: chaos_events")
        print(f"   Channel: chaos_alerts")

    def _setup_signal_handlers(self):
        """إعداد معالجات الإشارات للإيقاف الآمن"""
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """معالج إشارة الإيقاف"""
        print(f"\n⚠️ [Twin Listener] استلام إشارة إيقاف ({signum})")
        self.stop()
        sys.exit(0)

    def start_listening(self):
        """
        بدء الاستماع للأحداث

        يعمل في حلقة مستمرة حتى يتم إيقافه
        """
        self.running = True
        print("\n" + "="*60)
        print("🚀 [Digital Twin Listener] بدء الاستماع...")
        print("="*60 + "\n")

        while self.running:
            try:
                # الاستماع لرسائل من القائمة
                message = self.redis_client.blpop("chaos_events", timeout=1)

                if message:
                    _, payload = message
                    self._process_message(payload)

            except redis.ConnectionError as e:
                self.logger.error("فشل الاتصال بـ Redis", error=str(e))
                time.sleep(5)  # انتظر قبل إعادة المحاولة

            except Exception as e:
                self.logger.error("خطأ غير متوقع", error=str(e))
                time.sleep(1)

    def _process_message(self, payload: str):
        """
        معالجة رسالة واردة

        Args:
            payload: محتوى الرسالة (JSON)
        """
        try:
            event = json.loads(payload)
            self._process_chaos_event(event)

        except json.JSONDecodeError as e:
            self.logger.error("فشل تحليل رسالة JSON", payload=payload, error=str(e))

    def _process_chaos_event(self, event: dict):
        """
        معالجة حدث فوضى

        Args:
            event: بيانات الحدث
        """
        timestamp = event.get('timestamp', datetime.now().isoformat())
        scenario = event.get('scenario', {})
        source = event.get('source', 'unknown')
        test_id = event.get('test_id', 'N/A')

        print("\n" + "━"*60)
        print(f"📡 [Twin Listener] استلام حدث فوضى")
        print("━"*60)
        print(f"🕐 الوقت: {timestamp}")
        print(f"📦 المصدر: {source}")
        print(f"🔖 Test ID: {test_id}")
        print(f"⚡ النوع: {scenario.get('type', 'unknown')}")
        print("━"*60)

        # تحليل التأثير باستخدام Digital Twin
        print("\n🧠 [Digital Twin] بدء تحليل التأثير والتنبؤ...")

        try:
            # التنبؤ بالتأثير
            prediction = self.twin_manager.predict_impact(
                chaos_scenario=scenario,
                current_state=None  # يمكن تمرير حالة حالية لاحقاً
            )

            # حفظ التنبؤ
            self.twin_manager.save_prediction(prediction)

            # توليد تقرير
            self._generate_alert_dashboard(timestamp, test_id, scenario, prediction)

            # نشر التنبيه
            self._publish_alert(test_id, prediction)

            # الحصول على توصيات التعافي
            recovery = self.twin_manager.get_recovery_recommendation(prediction)
            self._display_recovery_recommendation(recovery)

        except Exception as e:
            self.logger.error("فشل تحليل التأثير", error=str(e))
            print(f"❌ خطأ في التحليل: {e}")

    def _generate_alert_dashboard(self,
                                  timestamp: str,
                                  test_id: str,
                                  scenario: dict,
                                  prediction: ImpactPrediction):
        """
        توليد لوحة تنبيه شاملة

        Args:
            timestamp: وقت الحدث
            test_id: معرف الاختبار
            scenario: سيناريو الفوضى
            prediction: التنبؤ بالتأثير
        """
        # تحديد الرمز حسب الخطورة
        severity_icons = {
            "CRITICAL": "🔴",
            "HIGH": "🟠",
            "MEDIUM": "🟡",
            "LOW": "🟢",
            "INFO": "🔵"
        }

        icon = severity_icons.get(prediction.severity.value, "⚪")

        print("\n" + "="*60)
        print(f"{icon} 📊 تقرير التوأم الرقمي (Digital Twin Report)")
        print("="*60)
        print(f"📅 وقت الاكتشاف: {timestamp}")
        print(f"🔖 Test ID: {test_id}")
        print(f"⚡ سيناريو الفوضى: {scenario.get('type', 'N/A')}")
        print("-"*60)

        # معلومات الخطورة
        print(f"\n{icon} مستوى الخطورة: {prediction.severity.value}")
        print(f"🎯 المكونات المتأثرة:")
        for component in prediction.affected_components:
            print(f"   • {component}")

        # الوصف والتنبؤ
        print(f"\n📝 التنبؤ:")
        print(f"   {prediction.description}")
        print(f"\n⏱️ الوقت المتوقع للفشل: {prediction.time_to_failure}")
        print(f"📊 درجة الثقة: {prediction.confidence_score:.0%}")

        # التأثيرات المتتالية
        if prediction.cascading_effects:
            print(f"\n⚡ التأثيرات المتتالية المحتملة:")
            for effect in prediction.cascading_effects:
                print(f"   ⚠️ {effect}")

        # الإجراءات الموصى بها
        if prediction.recommended_actions:
            print(f"\n🛠️ الإجراءات الموصى بها:")
            for i, action in enumerate(prediction.recommended_actions, 1):
                print(f"   {i}. {action}")

        print("="*60 + "\n")

    def _publish_alert(self, test_id: str, prediction: ImpactPrediction):
        """
        نشر تنبيه على قناة Redis

        Args:
            test_id: معرف الاختبار
            prediction: التنبؤ
        """
        alert = {
            "test_id": test_id,
            "timestamp": datetime.now().isoformat(),
            "severity": prediction.severity.value,
            "affected_components": prediction.affected_components,
            "confidence": prediction.confidence_score,
            "recommended_actions": prediction.recommended_actions
        }

        try:
            self.redis_client.publish(
                "chaos_alerts",
                json.dumps(alert, ensure_ascii=False)
            )
            print("📢 تم نشر التنبيه على قناة chaos_alerts")

        except Exception as e:
            self.logger.error("فشل نشر التنبيه", error=str(e))

    def _display_recovery_recommendation(self, recovery: dict):
        """
        عرض توصيات التعافي

        Args:
            recovery: توصيات التعافي
        """
        print("\n" + "┌" + "─"*58 + "┐")
        print(f"│ 🔄 توصيات التعافي (Recovery Recommendation)".ljust(59) + "│")
        print("├" + "─"*58 + "┤")

        action = recovery.get('action', 'N/A')
        reason = recovery.get('reason', 'N/A')

        print(f"│ الإجراء: {action}".ljust(59) + "│")
        print(f"│ السبب: {reason}".ljust(59) + "│")

        if recovery.get('revert_to'):
            print(f"│ العودة إلى: {recovery['revert_to']}".ljust(59) + "│")

        print("└" + "─"*58 + "┘\n")

    def stop(self):
        """إيقاف المستمع"""
        print("\n⏸️ [Twin Listener] جارٍ الإيقاف...")
        self.running = False

        try:
            self.redis_client.close()
            print("✅ تم إغلاق اتصال Redis")
        except:
            pass

        print("🛑 [Twin Listener] تم الإيقاف بنجاح\n")


def main():
    """نقطة الدخول الرئيسية"""
    import os

    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))

    print("╔" + "═"*60 + "╗")
    print("║" + " "*10 + "🔮 QURABIA Digital Twin Listener" + " "*17 + "║")
    print("║" + " "*10 + "   نظام الاستماع الذكي للفوضى" + " "*17 + "║")
    print("╚" + "═"*60 + "╝\n")

    listener = TwinListener(redis_host=redis_host, redis_port=redis_port)

    try:
        listener.start_listening()
    except KeyboardInterrupt:
        print("\n⚠️ تم إيقاف البرنامج بواسطة المستخدم")
        listener.stop()


if __name__ == "__main__":
    main()
