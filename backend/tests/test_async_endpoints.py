"""
Tests for Async API Endpoints
==============================

اختبارات شاملة للـ endpoints غير المتزامنة (Async)
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════
# Async Scan Fingerprint Tests
# ═══════════════════════════════════════════════════════════════


@patch("tasks.security_tasks.scan_fingerprint_task")
def test_scan_fingerprint_async_success(mock_task):
    """اختبار إرسال مهمة فحص بصمة async بنجاح"""
    # Mock Celery task
    mock_job = MagicMock()
    mock_job.id = "test-job-fingerprint-123"
    mock_task.delay.return_value = mock_job

    response = client.post(
        "/api/v1/security/scan_fingerprint/async",
        json={"source_ip": "192.168.1.100", "seed": "test-seed"}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert "job_id" in data
    assert data["job_id"] == "test-job-fingerprint-123"
    assert data["status"] == "PENDING"
    assert "poll_endpoint" in data
    assert "/api/v1/jobs/" in data["poll_endpoint"]
    assert "result_endpoint" in data

    # التحقق من استدعاء المهمة بالمعاملات الصحيحة
    mock_task.delay.assert_called_once_with("192.168.1.100", "test-seed")


@patch("tasks.security_tasks.scan_fingerprint_task")
def test_scan_fingerprint_async_without_seed(mock_task):
    """اختبار فحص async بدون seed"""
    mock_job = MagicMock()
    mock_job.id = "test-job-no-seed"
    mock_task.delay.return_value = mock_job

    response = client.post(
        "/api/v1/security/scan_fingerprint/async",
        json={"source_ip": "10.0.0.1"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    # seed should be None when not provided
    mock_task.delay.assert_called_once_with("10.0.0.1", None)


# ═══════════════════════════════════════════════════════════════
# Async Encrypt Multipath Tests
# ═══════════════════════════════════════════════════════════════


@patch("tasks.security_tasks.encrypt_multipath_task")
def test_encrypt_multipath_async_success(mock_task):
    """اختبار إرسال مهمة تشفير متعدد المسارات async"""
    mock_job = MagicMock()
    mock_job.id = "test-job-multipath-456"
    mock_task.delay.return_value = mock_job

    response = client.post(
        "/api/v1/security/encrypt_multipath/async",
        json={"target_url": "https://qurabia.com", "path_count": 7}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["job_id"] == "test-job-multipath-456"
    assert data["status"] == "PENDING"
    assert "/api/v1/jobs/" in data["poll_endpoint"]

    mock_task.delay.assert_called_once_with("https://qurabia.com", 7)


@patch("tasks.security_tasks.encrypt_multipath_task")
def test_encrypt_multipath_async_default_path_count(mock_task):
    """اختبار تشفير async مع path_count افتراضي"""
    mock_job = MagicMock()
    mock_job.id = "test-job-default-paths"
    mock_task.delay.return_value = mock_job

    response = client.post(
        "/api/v1/security/encrypt_multipath/async",
        json={"target_url": "https://example.com"}
    )

    assert response.status_code == 200
    # path_count should default to 5
    mock_task.delay.assert_called_once_with("https://example.com", 5)


# ═══════════════════════════════════════════════════════════════
# Job Status Endpoint Tests
# ═══════════════════════════════════════════════════════════════


@patch("main.get_job_status")
def test_get_job_status_endpoint(mock_get_status):
    """اختبار endpoint الحصول على حالة المهمة"""
    mock_get_status.return_value = {
        "job_id": "test-status-123",
        "state": "PROGRESS",
        "status": "Processing",
        "progress": 50,
        "result": None
    }

    response = client.get("/api/v1/jobs/test-status-123/status")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["job_id"] == "test-status-123"
    assert data["state"] == "PROGRESS"
    assert data["progress"] == 50


@patch("main.get_job_status")
def test_get_job_status_completed(mock_get_status):
    """اختبار الحصول على حالة مهمة مُكتملة"""
    mock_result = {
        "task_id": "completed-task",
        "status": "SUCCESS",
        "fingerprint": {"id": "QFP-123"}
    }

    mock_get_status.return_value = {
        "job_id": "completed-job",
        "state": "SUCCESS",
        "status": "Job completed successfully",
        "progress": 100,
        "result": mock_result
    }

    response = client.get("/api/v1/jobs/completed-job/status")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["state"] == "SUCCESS"
    assert data["progress"] == 100
    assert data["result"] is not None
    assert data["result"]["status"] == "SUCCESS"


# ═══════════════════════════════════════════════════════════════
# Job Result Endpoint Tests
# ═══════════════════════════════════════════════════════════════


@patch("main.get_job_result")
def test_get_job_result_endpoint(mock_get_result):
    """اختبار endpoint الحصول على النتيجة"""
    mock_get_result.return_value = {
        "job_id": "result-job-789",
        "ready": True,
        "state": "SUCCESS",
        "result": {"data": "completed", "value": 42}
    }

    response = client.get("/api/v1/jobs/result-job-789/result")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["ready"] is True
    assert data["result"]["value"] == 42


@patch("main.get_job_result")
def test_get_job_result_not_ready(mock_get_result):
    """اختبار الحصول على نتيجة غير جاهزة"""
    mock_get_result.return_value = {
        "job_id": "pending-job",
        "ready": False,
        "state": "PENDING",
        "message": "Job result is not ready yet"
    }

    response = client.get("/api/v1/jobs/pending-job/result")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["ready"] is False
    assert "not ready" in data["message"].lower()


@patch("main.get_job_result")
def test_get_job_result_with_timeout(mock_get_result):
    """اختبار الحصول على النتيجة مع timeout مخصص"""
    mock_get_result.return_value = {
        "job_id": "timeout-job",
        "ready": True,
        "state": "SUCCESS",
        "result": {}
    }

    response = client.get("/api/v1/jobs/timeout-job/result?timeout=10.0")

    assert response.status_code == 200
    # التحقق من استدعاء الدالة مع timeout الصحيح
    mock_get_result.assert_called_once_with("timeout-job", timeout=10.0)


# ═══════════════════════════════════════════════════════════════
# Job Cancellation Endpoint Tests
# ═══════════════════════════════════════════════════════════════


@patch("main.cancel_job")
def test_cancel_job_endpoint_success(mock_cancel):
    """اختبار إلغاء مهمة بنجاح"""
    mock_cancel.return_value = {
        "job_id": "cancel-job-123",
        "cancelled": True,
        "message": "Job cancelled successfully"
    }

    response = client.delete("/api/v1/jobs/cancel-job-123")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["cancelled"] is True
    mock_cancel.assert_called_once_with("cancel-job-123", terminate=False)


@patch("main.cancel_job")
def test_cancel_job_with_terminate(mock_cancel):
    """اختبار إنهاء مهمة فوري"""
    mock_cancel.return_value = {
        "job_id": "terminate-job",
        "cancelled": True,
        "message": "Job terminated successfully"
    }

    response = client.delete("/api/v1/jobs/terminate-job?terminate=true")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    mock_cancel.assert_called_once_with("terminate-job", terminate=True)


@patch("main.cancel_job")
def test_cancel_job_already_completed(mock_cancel):
    """اختبار محاولة إلغاء مهمة مُكتملة"""
    mock_cancel.return_value = {
        "job_id": "completed-job",
        "cancelled": False,
        "message": "Job already in final state: SUCCESS"
    }

    response = client.delete("/api/v1/jobs/completed-job")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is False
    assert data["cancelled"] is False
    assert "final state" in data["message"]


# ═══════════════════════════════════════════════════════════════
# Job Info Endpoint Tests
# ═══════════════════════════════════════════════════════════════


@patch("main.get_job_info")
def test_get_job_info_endpoint(mock_get_info):
    """اختبار endpoint الحصول على معلومات المهمة"""
    mock_get_info.return_value = {
        "job_id": "info-job-999",
        "state": "PROGRESS",
        "ready": False,
        "successful": None,
        "failed": None,
        "meta": {"progress": 60, "status": "Working"}
    }

    response = client.get("/api/v1/jobs/info-job-999/info")

    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert data["job_id"] == "info-job-999"
    assert data["state"] == "PROGRESS"
    assert data["meta"]["progress"] == 60


# ═══════════════════════════════════════════════════════════════
# Integration Tests - Full Workflow
# ═══════════════════════════════════════════════════════════════


@patch("tasks.security_tasks.scan_fingerprint_task")
@patch("main.get_job_status")
@patch("main.get_job_result")
def test_full_async_workflow(mock_get_result, mock_get_status, mock_task):
    """اختبار تكاملي: workflow async كامل"""
    job_id = "integration-test-job"

    # 1. إرسال المهمة
    mock_job = MagicMock()
    mock_job.id = job_id
    mock_task.delay.return_value = mock_job

    submit_response = client.post(
        "/api/v1/security/scan_fingerprint/async",
        json={"source_ip": "192.168.1.50"}
    )

    assert submit_response.status_code == 200
    assert submit_response.json()["job_id"] == job_id

    # 2. التحقق من الحالة (PENDING)
    mock_get_status.return_value = {
        "job_id": job_id,
        "state": "PENDING",
        "progress": 0,
        "result": None
    }

    status_response = client.get(f"/api/v1/jobs/{job_id}/status")
    assert status_response.json()["state"] == "PENDING"

    # 3. التحقق من الحالة (PROGRESS)
    mock_get_status.return_value = {
        "job_id": job_id,
        "state": "PROGRESS",
        "progress": 50,
        "result": None
    }

    status_response = client.get(f"/api/v1/jobs/{job_id}/status")
    assert status_response.json()["progress"] == 50

    # 4. الحصول على النتيجة (SUCCESS)
    final_result = {
        "task_id": job_id,
        "status": "SUCCESS",
        "fingerprint": {"classification": "legitimate"}
    }

    mock_get_result.return_value = {
        "job_id": job_id,
        "ready": True,
        "state": "SUCCESS",
        "result": final_result
    }

    result_response = client.get(f"/api/v1/jobs/{job_id}/result")
    assert result_response.json()["ready"] is True
    assert result_response.json()["result"]["status"] == "SUCCESS"


# ═══════════════════════════════════════════════════════════════
# Error Handling Tests
# ═══════════════════════════════════════════════════════════════


@patch("tasks.security_tasks.scan_fingerprint_task")
def test_scan_fingerprint_async_error_handling(mock_task):
    """اختبار معالجة الأخطاء عند إرسال المهمة"""
    mock_task.delay.side_effect = Exception("Celery worker unavailable")

    response = client.post(
        "/api/v1/security/scan_fingerprint/async",
        json={"source_ip": "1.2.3.4"}
    )

    assert response.status_code == 500
    assert "Failed to submit job" in response.json()["detail"]


@patch("main.get_job_status")
def test_get_job_status_error_handling(mock_get_status):
    """اختبار معالجة الأخطاء عند الحصول على الحالة"""
    mock_get_status.side_effect = Exception("Redis connection failed")

    response = client.get("/api/v1/jobs/error-job/status")

    assert response.status_code == 500
    assert "Error retrieving job status" in response.json()["detail"]
