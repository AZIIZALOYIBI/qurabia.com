"""
Security Tasks — المهام الأمنية غير المتزامنة
=============================================

هذا الملف يحتوي على جميع المهام الثقيلة المتعلقة بالأمان الكمومي
التي يتم تنفيذها بشكل غير متزامن بواسطة Celery workers.

المهام المُتاحة:
- scan_fingerprint_task: فحص البصمة الكمومية لعنوان IP
- encrypt_multipath_task: توليد مسارات تشفير متعددة
"""

import time
from typing import Any

import structlog
from celery import Task
from celery_app import app
from security_engine_service import get_security_engine

logger = structlog.get_logger("qurabia.tasks.security")


# ═══════════════════════════════════════════════════════════════
# Custom Task Base Class
# ═══════════════════════════════════════════════════════════════


class CallbackTask(Task):
    """
    Task مُخصص يدعم callbacks ومعالجة الأخطاء المتقدمة
    """

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """يُنفذ عند فشل المهمة"""
        logger.error(
            "task_failed",
            task_id=task_id,
            task_name=self.name,
            exception=str(exc),
            msg=f"❌ Task {task_id} failed: {exc}",
        )

    def on_success(self, retval, task_id, args, kwargs):
        """يُنفذ عند نجاح المهمة"""
        logger.info(
            "task_succeeded",
            task_id=task_id,
            task_name=self.name,
            msg=f"✅ Task {task_id} completed successfully",
        )

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """يُنفذ عند إعادة محاولة المهمة"""
        logger.warning(
            "task_retry",
            task_id=task_id,
            task_name=self.name,
            exception=str(exc),
            msg=f"🔄 Task {task_id} retrying after failure",
        )


# ═══════════════════════════════════════════════════════════════
# Security Tasks
# ═══════════════════════════════════════════════════════════════


@app.task(
    bind=True,
    base=CallbackTask,
    name="security.scan_fingerprint",
    max_retries=3,
    default_retry_delay=60,
    soft_time_limit=120,  # 2 دقيقة soft limit
    time_limit=180,  # 3 دقائق hard limit
)
def scan_fingerprint_task(
    self, source_ip: str, seed: str | None = None
) -> dict[str, Any]:
    """
    مهمة فحص البصمة الكمومية لعنوان IP

    هذه المهمة تُنفذ في الخلفية بواسطة Celery worker.
    تقوم بإجراء الحسابات الكمومية المعقدة دون حظر FastAPI.

    Args:
        source_ip: عنوان IP المصدر
        seed: seed اختياري للتوليد المحدد

    Returns:
        dict: نتيجة الفحص مع البصمة الكمومية والتصنيف

    Raises:
        ValueError: إذا كان IP غير صالح
        Exception: في حالة فشل الحساب الكمومي
    """
    logger.info(
        "scan_fingerprint_task_started",
        task_id=self.request.id,
        source_ip=source_ip,
        msg=f"🚀 Starting quantum fingerprint scan for IP: {source_ip}",
    )

    try:
        # تحديث حالة المهمة: STARTED
        self.update_state(
            state="STARTED",
            meta={"status": "Processing", "progress": 0, "source_ip": source_ip},
        )

        # الحصول على محرك الأمان
        engine = get_security_engine()

        # تحديث التقدم: 25%
        self.update_state(
            state="PROGRESS",
            meta={
                "status": "Calculating quantum matrix",
                "progress": 25,
                "source_ip": source_ip,
            },
        )

        # إجراء الحساب الفعلي (العملية الثقيلة)
        start_time = time.perf_counter()
        fingerprint, detection_time_ms = engine.scan_fingerprint(source_ip, seed)
        elapsed_time = (time.perf_counter() - start_time) * 1000

        # تحديث التقدم: 75%
        self.update_state(
            state="PROGRESS",
            meta={
                "status": "Analyzing results",
                "progress": 75,
                "source_ip": source_ip,
            },
        )

        # إعداد النتيجة
        result = {
            "task_id": self.request.id,
            "status": "SUCCESS",
            "fingerprint": {
                "id": fingerprint.id,
                "source_ip": fingerprint.source_ip,
                "state_signature": fingerprint.state_signature,
                "entanglement_level": fingerprint.entanglement_level,
                "quantum_phase": fingerprint.quantum_phase,
                "density_matrix": fingerprint.density_matrix,
                "confidence": fingerprint.confidence,
                "classification": fingerprint.classification.value,
                "timestamp": fingerprint.timestamp,
                "metadata": fingerprint.metadata,
            },
            "detection_time_ms": round(detection_time_ms, 2),
            "total_processing_time_ms": round(elapsed_time, 2),
            "completed_at": time.time(),
        }

        logger.info(
            "scan_fingerprint_task_completed",
            task_id=self.request.id,
            source_ip=source_ip,
            classification=fingerprint.classification.value,
            processing_time_ms=round(elapsed_time, 2),
            msg=f"✅ Fingerprint scan completed for {source_ip}",
        )

        return result

    except ValueError as exc:
        logger.error(
            "scan_fingerprint_task_validation_error",
            task_id=self.request.id,
            source_ip=source_ip,
            error=str(exc),
            msg=f"❌ Invalid input for fingerprint scan: {exc}",
        )
        raise

    except Exception as exc:
        logger.error(
            "scan_fingerprint_task_error",
            task_id=self.request.id,
            source_ip=source_ip,
            error=str(exc),
            msg=f"❌ Error during fingerprint scan: {exc}",
        )
        # إعادة المحاولة مع backoff exponential
        raise self.retry(exc=exc, countdown=2**self.request.retries)


@app.task(
    bind=True,
    base=CallbackTask,
    name="security.encrypt_multipath",
    max_retries=5,
    default_retry_delay=120,
    soft_time_limit=180,  # 3 دقائق soft limit
    time_limit=300,  # 5 دقائق hard limit
)
def encrypt_multipath_task(
    self, target_url: str, path_count: int = 5
) -> dict[str, Any]:
    """
    مهمة توليد مسارات تشفير متعددة

    تُنشئ مسارات تشفير متعددة باستخدام خوارزميات PQC مختلفة.
    تُنفذ في الخلفية دون حظر FastAPI.

    Args:
        target_url: عنوان URL الهدف
        path_count: عدد المسارات المطلوبة (1-20)

    Returns:
        dict: نتيجة التشفير مع جميع المسارات

    Raises:
        ValueError: إذا كانت المدخلات غير صالحة
        Exception: في حالة فشل التوليد
    """
    logger.info(
        "encrypt_multipath_task_started",
        task_id=self.request.id,
        target_url=target_url,
        path_count=path_count,
        msg=f"🚀 Starting multipath encryption for {target_url}",
    )

    try:
        # تحديث حالة المهمة
        self.update_state(
            state="STARTED",
            meta={
                "status": "Processing",
                "progress": 0,
                "target_url": target_url,
                "path_count": path_count,
            },
        )

        # الحصول على محرك الأمان
        engine = get_security_engine()

        # تحديث التقدم
        self.update_state(
            state="PROGRESS",
            meta={
                "status": "Generating encryption paths",
                "progress": 30,
                "target_url": target_url,
            },
        )

        # إجراء التوليد الفعلي
        start_time = time.perf_counter()
        result, encryption_time_ms = engine.encrypt_multipath(target_url, path_count)
        elapsed_time = (time.perf_counter() - start_time) * 1000

        # تحديث التقدم
        self.update_state(
            state="PROGRESS",
            meta={
                "status": "Finalizing results",
                "progress": 90,
                "target_url": target_url,
            },
        )

        # إعداد النتيجة
        response = {
            "task_id": self.request.id,
            "status": "SUCCESS",
            "result": {
                "paths": [
                    {
                        "path_id": p.path_id,
                        "algorithm": p.algorithm.value,
                        "hop_count": p.hop_count,
                        "latency_ms": p.latency_ms,
                        "error_rate": p.error_rate,
                        "security_strength": p.security_strength,
                        "status": p.status.value,
                    }
                    for p in result.paths
                ],
                "primary_path": result.primary_path,
                "backup_paths": result.backup_paths,
                "redundancy_factor": result.redundancy_factor,
                "success_probability": result.success_probability,
                "combined_security": result.combined_security,
                "timestamp": result.timestamp,
            },
            "encryption_time_ms": round(encryption_time_ms, 2),
            "total_processing_time_ms": round(elapsed_time, 2),
            "completed_at": time.time(),
        }

        logger.info(
            "encrypt_multipath_task_completed",
            task_id=self.request.id,
            target_url=target_url,
            path_count=len(result.paths),
            processing_time_ms=round(elapsed_time, 2),
            msg=f"✅ Multipath encryption completed for {target_url}",
        )

        return response

    except ValueError as exc:
        logger.error(
            "encrypt_multipath_task_validation_error",
            task_id=self.request.id,
            target_url=target_url,
            error=str(exc),
            msg=f"❌ Invalid input for multipath encryption: {exc}",
        )
        raise

    except Exception as exc:
        logger.error(
            "encrypt_multipath_task_error",
            task_id=self.request.id,
            target_url=target_url,
            error=str(exc),
            msg=f"❌ Error during multipath encryption: {exc}",
        )
        # إعادة المحاولة
        raise self.retry(exc=exc, countdown=2**self.request.retries)
