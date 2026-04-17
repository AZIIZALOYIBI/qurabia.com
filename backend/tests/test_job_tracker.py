"""
Tests for Job Tracker
=====================

اختبارات شاملة لنظام تتبع المهام (Job Tracker)
"""

import time
from unittest.mock import MagicMock, patch

import pytest

# استيراد الوحدة المُختبرة
from job_tracker import (
    JobState,
    cancel_job,
    get_job_info,
    get_job_result,
    get_job_status,
)


# ═══════════════════════════════════════════════════════════════
# Mock AsyncResult للاختبارات
# ═══════════════════════════════════════════════════════════════


def create_mock_task(state="PENDING", info=None, result=None, ready=False, successful=False, failed=False):
    """إنشاء mock لـ Celery AsyncResult"""
    task = MagicMock()
    task.state = state
    task.info = info
    task.ready.return_value = ready
    task.successful.return_value = successful
    task.failed.return_value = failed

    if result is not None:
        task.get.return_value = result
    else:
        task.get.side_effect = TimeoutError("Task not ready")

    return task


# ═══════════════════════════════════════════════════════════════
# Job Status Tests
# ═══════════════════════════════════════════════════════════════


@patch("job_tracker.AsyncResult")
def test_get_job_status_pending(mock_async_result):
    """اختبار حالة PENDING"""
    mock_task = create_mock_task(state="PENDING")
    mock_async_result.return_value = mock_task

    status = get_job_status("test-job-123")

    assert status["job_id"] == "test-job-123"
    assert status["state"] == JobState.PENDING.value
    assert status["progress"] == 0
    assert status["result"] is None


@patch("job_tracker.AsyncResult")
def test_get_job_status_started(mock_async_result):
    """اختبار حالة STARTED"""
    mock_task = create_mock_task(
        state="STARTED",
        info={"status": "Processing", "progress": 5}
    )
    mock_async_result.return_value = mock_task

    status = get_job_status("test-job-456")

    assert status["job_id"] == "test-job-456"
    assert status["state"] == JobState.STARTED.value
    assert status["progress"] == 5
    assert status["status"] == "Processing"


@patch("job_tracker.AsyncResult")
def test_get_job_status_progress(mock_async_result):
    """اختبار حالة PROGRESS"""
    mock_task = create_mock_task(
        state="PROGRESS",
        info={"status": "Calculating quantum matrix", "progress": 50}
    )
    mock_async_result.return_value = mock_task

    status = get_job_status("test-job-789")

    assert status["job_id"] == "test-job-789"
    assert status["state"] == JobState.PROGRESS.value
    assert status["progress"] == 50
    assert "quantum matrix" in status["status"]
    assert "meta" in status


@patch("job_tracker.AsyncResult")
def test_get_job_status_success(mock_async_result):
    """اختبار حالة SUCCESS"""
    test_result = {
        "task_id": "test-123",
        "status": "SUCCESS",
        "fingerprint": {"id": "QFP-123", "classification": "legitimate"}
    }

    mock_task = create_mock_task(
        state="SUCCESS",
        result=test_result,
        ready=True,
        successful=True
    )
    mock_async_result.return_value = mock_task

    status = get_job_status("test-job-success")

    assert status["job_id"] == "test-job-success"
    assert status["state"] == JobState.SUCCESS.value
    assert status["progress"] == 100
    assert status["result"] is not None
    assert status["result"]["status"] == "SUCCESS"


@patch("job_tracker.AsyncResult")
def test_get_job_status_failure(mock_async_result):
    """اختبار حالة FAILURE"""
    mock_task = create_mock_task(
        state="FAILURE",
        info="ValueError: Invalid IP address"
    )
    mock_async_result.return_value = mock_task

    status = get_job_status("test-job-failed")

    assert status["job_id"] == "test-job-failed"
    assert status["state"] == JobState.FAILURE.value
    assert status["progress"] == 0
    assert "error" in status
    assert "Invalid IP" in status["error"]


@patch("job_tracker.AsyncResult")
def test_get_job_status_revoked(mock_async_result):
    """اختبار حالة REVOKED (مُلغاة)"""
    mock_task = create_mock_task(state="REVOKED")
    mock_async_result.return_value = mock_task

    status = get_job_status("test-job-cancelled")

    assert status["job_id"] == "test-job-cancelled"
    assert status["state"] == JobState.REVOKED.value
    assert "cancelled" in status["status"].lower()


# ═══════════════════════════════════════════════════════════════
# Job Result Tests
# ═══════════════════════════════════════════════════════════════


@patch("job_tracker.AsyncResult")
def test_get_job_result_success(mock_async_result):
    """اختبار الحصول على نتيجة ناجحة"""
    test_result = {"data": "success", "value": 42}
    mock_task = create_mock_task(
        state="SUCCESS",
        result=test_result
    )
    mock_async_result.return_value = mock_task

    result = get_job_result("test-job-result", timeout=5.0)

    assert result["job_id"] == "test-job-result"
    assert result["ready"] is True
    assert result["state"] == "SUCCESS"
    assert result["result"]["value"] == 42


@patch("job_tracker.AsyncResult")
def test_get_job_result_not_ready(mock_async_result):
    """اختبار محاولة الحصول على نتيجة غير جاهزة"""
    mock_task = create_mock_task(state="PROGRESS")
    mock_async_result.return_value = mock_task

    result = get_job_result("test-job-pending")

    assert result["job_id"] == "test-job-pending"
    assert result["ready"] is False
    assert result["state"] == "PROGRESS"
    assert "not ready" in result["message"].lower()


@patch("job_tracker.AsyncResult")
def test_get_job_result_timeout(mock_async_result):
    """اختبار timeout عند الحصول على النتيجة"""
    mock_task = MagicMock()
    mock_task.state = "SUCCESS"
    mock_task.get.side_effect = TimeoutError("Timeout")
    mock_async_result.return_value = mock_task

    result = get_job_result("test-job-timeout", timeout=1.0)

    assert result["job_id"] == "test-job-timeout"
    assert result["ready"] is False
    assert result["state"] == "TIMEOUT"


# ═══════════════════════════════════════════════════════════════
# Job Cancellation Tests
# ═══════════════════════════════════════════════════════════════


@patch("job_tracker.AsyncResult")
def test_cancel_job_success(mock_async_result):
    """اختبار إلغاء مهمة بنجاح"""
    mock_task = MagicMock()
    mock_task.state = "PROGRESS"
    mock_task.revoke = MagicMock()
    mock_async_result.return_value = mock_task

    result = cancel_job("test-job-cancel", terminate=False)

    assert result["job_id"] == "test-job-cancel"
    assert result["cancelled"] is True
    mock_task.revoke.assert_called_once_with(terminate=False)


@patch("job_tracker.AsyncResult")
def test_cancel_job_terminate(mock_async_result):
    """اختبار إنهاء مهمة فوري"""
    mock_task = MagicMock()
    mock_task.state = "STARTED"
    mock_task.revoke = MagicMock()
    mock_async_result.return_value = mock_task

    result = cancel_job("test-job-terminate", terminate=True)

    assert result["cancelled"] is True
    mock_task.revoke.assert_called_once_with(terminate=True)


@patch("job_tracker.AsyncResult")
def test_cancel_job_already_completed(mock_async_result):
    """اختبار محاولة إلغاء مهمة مُكتملة"""
    mock_task = MagicMock()
    mock_task.state = "SUCCESS"
    mock_async_result.return_value = mock_task

    result = cancel_job("test-job-completed")

    assert result["cancelled"] is False
    assert "already in final state" in result["message"]


@patch("job_tracker.AsyncResult")
def test_cancel_job_already_failed(mock_async_result):
    """اختبار محاولة إلغاء مهمة فاشلة"""
    mock_task = MagicMock()
    mock_task.state = "FAILURE"
    mock_async_result.return_value = mock_task

    result = cancel_job("test-job-failed")

    assert result["cancelled"] is False
    assert "FAILURE" in result["message"]


# ═══════════════════════════════════════════════════════════════
# Job Info Tests
# ═══════════════════════════════════════════════════════════════


@patch("job_tracker.AsyncResult")
def test_get_job_info_pending(mock_async_result):
    """اختبار معلومات مهمة في قائمة الانتظار"""
    mock_task = create_mock_task(state="PENDING", ready=False)
    mock_async_result.return_value = mock_task

    info = get_job_info("test-job-info")

    assert info["job_id"] == "test-job-info"
    assert info["state"] == "PENDING"
    assert info["ready"] is False
    assert info["successful"] is None
    assert info["failed"] is None


@patch("job_tracker.AsyncResult")
def test_get_job_info_completed(mock_async_result):
    """اختبار معلومات مهمة مُكتملة"""
    test_result = {"status": "DONE", "data": 123}
    mock_task = create_mock_task(
        state="SUCCESS",
        result=test_result,
        ready=True,
        successful=True,
        failed=False
    )
    mock_async_result.return_value = mock_task

    info = get_job_info("test-job-completed")

    assert info["job_id"] == "test-job-completed"
    assert info["state"] == "SUCCESS"
    assert info["ready"] is True
    assert info["successful"] is True
    assert info["failed"] is False
    assert "result" in info
    assert info["result"]["data"] == 123


@patch("job_tracker.AsyncResult")
def test_get_job_info_failed(mock_async_result):
    """اختبار معلومات مهمة فاشلة"""
    error_msg = "Connection timeout"
    mock_task = create_mock_task(
        state="FAILURE",
        info=error_msg,
        ready=True,
        successful=False,
        failed=True
    )
    mock_async_result.return_value = mock_task

    info = get_job_info("test-job-error")

    assert info["job_id"] == "test-job-error"
    assert info["state"] == "FAILURE"
    assert info["ready"] is True
    assert info["successful"] is False
    assert info["failed"] is True
    assert "error" in info
    assert error_msg in info["error"]


@patch("job_tracker.AsyncResult")
def test_get_job_info_with_meta(mock_async_result):
    """اختبار معلومات مع metadata"""
    meta_data = {"progress": 75, "status": "Almost done", "source_ip": "192.168.1.1"}
    mock_task = create_mock_task(state="PROGRESS", info=meta_data, ready=False)
    mock_async_result.return_value = mock_task

    info = get_job_info("test-job-meta")

    assert info["job_id"] == "test-job-meta"
    assert "meta" in info
    assert info["meta"]["progress"] == 75
    assert info["meta"]["source_ip"] == "192.168.1.1"


# ═══════════════════════════════════════════════════════════════
# Integration Tests
# ═══════════════════════════════════════════════════════════════


@patch("job_tracker.AsyncResult")
def test_job_lifecycle_simulation(mock_async_result):
    """اختبار تكاملي: محاكاة دورة حياة مهمة كاملة"""
    job_id = "test-lifecycle-job"

    # 1. البداية: PENDING
    mock_task = create_mock_task(state="PENDING")
    mock_async_result.return_value = mock_task
    status = get_job_status(job_id)
    assert status["state"] == JobState.PENDING.value

    # 2. بدأت: STARTED
    mock_task = create_mock_task(state="STARTED", info={"progress": 10})
    mock_async_result.return_value = mock_task
    status = get_job_status(job_id)
    assert status["state"] == JobState.STARTED.value

    # 3. قيد التنفيذ: PROGRESS
    mock_task = create_mock_task(state="PROGRESS", info={"progress": 50})
    mock_async_result.return_value = mock_task
    status = get_job_status(job_id)
    assert status["state"] == JobState.PROGRESS.value
    assert status["progress"] == 50

    # 4. اكتملت: SUCCESS
    final_result = {"status": "SUCCESS", "data": "completed"}
    mock_task = create_mock_task(
        state="SUCCESS",
        result=final_result,
        ready=True,
        successful=True
    )
    mock_async_result.return_value = mock_task
    status = get_job_status(job_id)
    assert status["state"] == JobState.SUCCESS.value
    assert status["progress"] == 100
    assert status["result"]["status"] == "SUCCESS"
