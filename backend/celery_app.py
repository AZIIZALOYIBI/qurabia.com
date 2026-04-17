"""
Celery Application — تطبيق Celery للمهام غير المتزامنة
========================================================

هذا الملف هو نقطة دخول Celery الرئيسية. يُعرّف تطبيق Celery
ويُهيئ الاتصال مع Redis كـ broker و backend للنتائج.

الاستخدام:
    # تشغيل الـ worker:
    celery -A celery_app worker --loglevel=info

    # تشغيل مع concurrency محدد:
    celery -A celery_app worker --loglevel=info --concurrency=4

    # مراقبة المهام:
    celery -A celery_app flower
"""

import os

import structlog
from celery import Celery

logger = structlog.get_logger("qurabia.celery")

# ═══════════════════════════════════════════════════════════════
# Celery Configuration
# ═══════════════════════════════════════════════════════════════

# قراءة إعدادات Redis من متغيرات البيئة
REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = os.environ.get("REDIS_PORT", "6379")
CELERY_BROKER_URL = os.environ.get(
    "CELERY_BROKER_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
)
CELERY_RESULT_BACKEND = os.environ.get(
    "CELERY_RESULT_BACKEND", f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
)

# إنشاء تطبيق Celery
app = Celery(
    "qurabia",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["tasks.security_tasks"],  # المهام المُراد تحميلها
)

# ═══════════════════════════════════════════════════════════════
# Celery Settings
# ═══════════════════════════════════════════════════════════════

app.conf.update(
    # إعدادات الأداء
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # إعدادات النتائج
    result_expires=3600,  # النتائج تنتهي بعد ساعة
    result_extended=True,  # تخزين معلومات إضافية عن المهمة
    # إعدادات الأمان والموثوقية
    task_acks_late=True,  # تأكيد المهمة بعد الانتهاء فقط
    task_reject_on_worker_lost=True,  # رفض المهمة إذا فُقد الـ worker
    task_track_started=True,  # تتبع بداية المهمة
    # إعدادات إعادة المحاولة
    task_default_max_retries=3,
    task_default_retry_delay=60,  # ثانية
    # إعدادات التوجيه
    task_routes={
        "tasks.security_tasks.scan_fingerprint_task": {"queue": "security"},
        "tasks.security_tasks.encrypt_multipath_task": {"queue": "security"},
    },
    # إعدادات الأولوية
    task_default_priority=5,  # 0-10، 10 هو الأعلى
    # حدود الوقت
    task_soft_time_limit=300,  # 5 دقائق soft limit
    task_time_limit=600,  # 10 دقائق hard limit
    # Worker settings
    worker_prefetch_multiplier=4,  # عدد المهام التي يُحملها كل worker مسبقاً
    worker_max_tasks_per_child=1000,  # إعادة تشغيل worker بعد 1000 مهمة
)

logger.info(
    "celery_app_initialized",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    msg="✅ Celery application initialized successfully",
)


# ═══════════════════════════════════════════════════════════════
# Celery Signals & Hooks
# ═══════════════════════════════════════════════════════════════


@app.task(bind=True)
def debug_task(self):
    """مهمة تجريبية للتحقق من عمل Celery"""
    logger.info(f"Request: {self.request!r}")
    return {"status": "SUCCESS", "message": "Celery is working correctly"}


# تسجيل الأحداث المهمة
@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """إعداد المهام الدورية (إذا لزم الأمر)"""
    # يمكن إضافة مهام دورية هنا في المستقبل
    # مثال: sender.add_periodic_task(300.0, cleanup_old_jobs.s())
    pass


if __name__ == "__main__":
    app.start()
