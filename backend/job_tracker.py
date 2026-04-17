"""
Job Tracker — نظام تتبع المهام غير المتزامنة
============================================

يوفر هذا النظام واجهة موحدة للتعامل مع حالة المهام ونتائجها.
يستخدم Celery's AsyncResult مع طبقة تجريد إضافية.

الوظائف الرئيسية:
- get_job_status(): الحصول على حالة المهمة الحالية
- get_job_result(): الحصول على نتيجة المهمة المُكتملة
- cancel_job(): إلغاء مهمة قيد التنفيذ
- get_job_info(): الحصول على معلومات شاملة عن المهمة
"""

from enum import Enum
from typing import Any

import structlog
from celery.result import AsyncResult
from celery_app import app

logger = structlog.get_logger("qurabia.job_tracker")


# ═══════════════════════════════════════════════════════════════
# Job States
# ═══════════════════════════════════════════════════════════════


class JobState(str, Enum):
    """حالات المهمة الممكنة"""

    PENDING = "PENDING"  # في قائمة الانتظار
    STARTED = "STARTED"  # بدأت التنفيذ
    PROGRESS = "PROGRESS"  # قيد التنفيذ مع تقدم
    SUCCESS = "SUCCESS"  # اكتملت بنجاح
    FAILURE = "FAILURE"  # فشلت
    RETRY = "RETRY"  # إعادة محاولة
    REVOKED = "REVOKED"  # مُلغاة


# ═══════════════════════════════════════════════════════════════
# Job Tracker Functions
# ═══════════════════════════════════════════════════════════════


def get_job_status(job_id: str) -> dict[str, Any]:
    """
    الحصول على حالة المهمة الحالية

    Args:
        job_id: معرف المهمة (Task ID)

    Returns:
        dict: معلومات حالة المهمة
    """
    try:
        task = AsyncResult(job_id, app=app)

        # المهمة في قائمة الانتظار
        if task.state == "PENDING":
            logger.debug("job_status_checked", job_id=job_id, state="PENDING")
            return {
                "job_id": job_id,
                "state": JobState.PENDING.value,
                "status": "Job is queued and waiting for resources",
                "progress": 0,
                "result": None,
            }

        # المهمة بدأت التنفيذ
        elif task.state == "STARTED":
            meta = task.info or {}
            logger.debug("job_status_checked", job_id=job_id, state="STARTED")
            return {
                "job_id": job_id,
                "state": JobState.STARTED.value,
                "status": meta.get("status", "Job is starting"),
                "progress": meta.get("progress", 5),
                "result": None,
            }

        # المهمة قيد التنفيذ مع تقدم
        elif task.state == "PROGRESS":
            meta = task.info or {}
            progress = meta.get("progress", 50)
            logger.debug(
                "job_status_checked",
                job_id=job_id,
                state="PROGRESS",
                progress=progress,
            )
            return {
                "job_id": job_id,
                "state": JobState.PROGRESS.value,
                "status": meta.get("status", "Job is processing"),
                "progress": progress,
                "meta": meta,
                "result": None,
            }

        # المهمة فشلت
        elif task.state == "FAILURE":
            error_info = str(task.info) if task.info else "Unknown error"
            logger.warning(
                "job_status_checked",
                job_id=job_id,
                state="FAILURE",
                error=error_info,
            )
            return {
                "job_id": job_id,
                "state": JobState.FAILURE.value,
                "status": "Job failed during execution",
                "error": error_info,
                "progress": 0,
                "result": None,
            }

        # المهمة مُلغاة
        elif task.state == "REVOKED":
            logger.info("job_status_checked", job_id=job_id, state="REVOKED")
            return {
                "job_id": job_id,
                "state": JobState.REVOKED.value,
                "status": "Job was cancelled",
                "progress": 0,
                "result": None,
            }

        # المهمة اكتملت بنجاح
        elif task.state == "SUCCESS":
            try:
                result = task.get(timeout=1)
                logger.debug("job_status_checked", job_id=job_id, state="SUCCESS")
                return {
                    "job_id": job_id,
                    "state": JobState.SUCCESS.value,
                    "status": "Job completed successfully",
                    "progress": 100,
                    "result": result,
                }
            except Exception as exc:
                logger.error(
                    "job_result_retrieval_error",
                    job_id=job_id,
                    error=str(exc),
                    msg=f"Failed to retrieve result for completed job: {exc}",
                )
                return {
                    "job_id": job_id,
                    "state": JobState.SUCCESS.value,
                    "status": "Job completed but result unavailable",
                    "error": f"Result retrieval error: {str(exc)}",
                    "progress": 100,
                    "result": None,
                }

        # حالة غير معروفة
        else:
            logger.warning(
                "job_unknown_state",
                job_id=job_id,
                state=task.state,
                msg=f"Unknown job state: {task.state}",
            )
            return {
                "job_id": job_id,
                "state": task.state,
                "status": f"Job in unknown state: {task.state}",
                "progress": 0,
                "result": None,
            }

    except Exception as exc:
        logger.error(
            "job_status_error",
            job_id=job_id,
            error=str(exc),
            msg=f"Error checking job status: {exc}",
        )
        return {
            "job_id": job_id,
            "state": "ERROR",
            "status": "Error checking job status",
            "error": str(exc),
            "progress": 0,
            "result": None,
        }


def get_job_result(job_id: str, timeout: float = 5.0) -> dict[str, Any]:
    """
    الحصول على نتيجة المهمة المُكتملة

    Args:
        job_id: معرف المهمة
        timeout: وقت الانتظار الأقصى بالثواني

    Returns:
        dict: نتيجة المهمة أو معلومات الخطأ
    """
    try:
        task = AsyncResult(job_id, app=app)

        if task.state != "SUCCESS":
            logger.warning(
                "job_result_not_ready",
                job_id=job_id,
                state=task.state,
                msg=f"Job result not ready, current state: {task.state}",
            )
            return {
                "job_id": job_id,
                "ready": False,
                "state": task.state,
                "message": "Job result is not ready yet",
            }

        result = task.get(timeout=timeout)
        logger.info(
            "job_result_retrieved",
            job_id=job_id,
            msg="Job result retrieved successfully",
        )

        return {"job_id": job_id, "ready": True, "state": "SUCCESS", "result": result}

    except TimeoutError:
        logger.warning(
            "job_result_timeout",
            job_id=job_id,
            timeout=timeout,
            msg=f"Timeout waiting for job result ({timeout}s)",
        )
        return {
            "job_id": job_id,
            "ready": False,
            "state": "TIMEOUT",
            "message": f"Timeout waiting for result ({timeout}s)",
        }

    except Exception as exc:
        logger.error(
            "job_result_error",
            job_id=job_id,
            error=str(exc),
            msg=f"Error retrieving job result: {exc}",
        )
        return {
            "job_id": job_id,
            "ready": False,
            "state": "ERROR",
            "error": str(exc),
        }


def cancel_job(job_id: str, terminate: bool = False) -> dict[str, Any]:
    """
    إلغاء مهمة قيد التنفيذ

    Args:
        job_id: معرف المهمة
        terminate: إنهاء فوري (True) أو طلب إلغاء (False)

    Returns:
        dict: نتيجة الإلغاء
    """
    try:
        task = AsyncResult(job_id, app=app)

        # المهمة غير قابلة للإلغاء (مُكتملة أو فاشلة)
        if task.state in ["SUCCESS", "FAILURE"]:
            logger.warning(
                "job_cancel_failed",
                job_id=job_id,
                state=task.state,
                msg=f"Cannot cancel job in state: {task.state}",
            )
            return {
                "job_id": job_id,
                "cancelled": False,
                "message": f"Job already in final state: {task.state}",
            }

        # إلغاء المهمة
        task.revoke(terminate=terminate)

        action = "terminated" if terminate else "cancelled"
        logger.info(
            "job_cancelled",
            job_id=job_id,
            terminate=terminate,
            msg=f"Job {action} successfully",
        )

        return {
            "job_id": job_id,
            "cancelled": True,
            "message": f"Job {action} successfully",
        }

    except Exception as exc:
        logger.error(
            "job_cancel_error",
            job_id=job_id,
            error=str(exc),
            msg=f"Error cancelling job: {exc}",
        )
        return {
            "job_id": job_id,
            "cancelled": False,
            "error": str(exc),
        }


def get_job_info(job_id: str) -> dict[str, Any]:
    """
    الحصول على معلومات شاملة عن المهمة

    Args:
        job_id: معرف المهمة

    Returns:
        dict: معلومات تفصيلية عن المهمة
    """
    try:
        task = AsyncResult(job_id, app=app)

        info = {
            "job_id": job_id,
            "state": task.state,
            "ready": task.ready(),
            "successful": task.successful() if task.ready() else None,
            "failed": task.failed() if task.ready() else None,
        }

        # إضافة معلومات النتيجة إذا كانت متاحة
        if task.ready():
            if task.successful():
                try:
                    info["result"] = task.get(timeout=1)
                except Exception as exc:
                    info["result_error"] = str(exc)
            elif task.failed():
                info["error"] = str(task.info)

        # إضافة metadata إذا كانت متاحة
        if task.info and isinstance(task.info, dict):
            info["meta"] = task.info

        logger.debug("job_info_retrieved", job_id=job_id, state=task.state)
        return info

    except Exception as exc:
        logger.error(
            "job_info_error",
            job_id=job_id,
            error=str(exc),
            msg=f"Error getting job info: {exc}",
        )
        return {"job_id": job_id, "error": str(exc)}
