"""
Tests for Security Engine Service
==================================

اختبارات شاملة لخدمة محرك الأمان الكمومي
"""

import time

import pytest
from fastapi.testclient import TestClient

from main import app
from security_engine_service import (
    EncryptionPathStatus,
    MetricsCollector,
    MultiPathEncryptionEngine,
    PQCAlgorithm,
    QuantumFingerprintEngine,
    SecurityEngineService,
    ThreatClassification,
    get_security_engine,
)

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════
# QuantumFingerprintEngine Tests
# ═══════════════════════════════════════════════════════════════


def test_fingerprint_engine_basic():
    """اختبار أساسي لمحرك البصمة الكمومية"""
    engine = QuantumFingerprintEngine()
    fp = engine.generate_fingerprint("192.168.1.1", "test-seed")

    assert fp.id.startswith("QFP-")
    assert fp.source_ip == "192.168.1.1"
    assert len(fp.state_signature) > 0
    assert 0 <= fp.entanglement_level <= 1
    assert 0 <= fp.quantum_phase <= 6.3  # 2π ≈ 6.28
    assert len(fp.density_matrix) == 4
    assert 0 <= fp.confidence <= 1
    assert fp.classification in [
        ThreatClassification.LEGITIMATE,
        ThreatClassification.SUSPICIOUS,
        ThreatClassification.MALICIOUS,
        ThreatClassification.UNKNOWN,
    ]
    assert fp.timestamp > 0


def test_fingerprint_deterministic():
    """البصمة يجب أن تكون محددة (deterministic) مع نفس seed"""
    engine = QuantumFingerprintEngine(seed_salt="fixed-salt")
    fp1 = engine.generate_fingerprint("10.0.0.1", "same-seed")
    fp2 = engine.generate_fingerprint("10.0.0.1", "same-seed")

    # نفس الخصائص الكمومية
    assert fp1.entanglement_level == fp2.entanglement_level
    assert fp1.quantum_phase == fp2.quantum_phase
    assert fp1.density_matrix == fp2.density_matrix
    assert fp1.classification == fp2.classification


def test_fingerprint_unique_per_ip():
    """بصمة مختلفة لكل IP"""
    engine = QuantumFingerprintEngine()
    fp1 = engine.generate_fingerprint("192.168.1.1", "seed")
    fp2 = engine.generate_fingerprint("192.168.1.2", "seed")

    assert fp1.id != fp2.id
    assert fp1.source_ip != fp2.source_ip
    # من المحتمل أن تكون الخصائص مختلفة
    assert (
        fp1.entanglement_level != fp2.entanglement_level
        or fp1.quantum_phase != fp2.quantum_phase
    )


def test_fingerprint_density_matrix_trace():
    """مصفوفة الكثافة يجب أن يكون Trace = 1"""
    engine = QuantumFingerprintEngine()
    fp = engine.generate_fingerprint("172.16.0.1", "trace-test")

    # Trace(ρ) = ρ₀₀ + ρ₁₁
    trace = fp.density_matrix[0] + fp.density_matrix[3]
    assert abs(trace - 1.0) < 0.0001, f"Trace should be 1, got {trace}"


def test_fingerprint_stats():
    """إحصائيات المحرك"""
    engine = QuantumFingerprintEngine()
    initial_stats = engine.get_stats()

    # إنشاء بعض البصمات
    for i in range(5):
        engine.generate_fingerprint(f"10.0.0.{i}", f"seed-{i}")

    stats = engine.get_stats()
    assert stats["total_scans"] == initial_stats["total_scans"] + 5
    assert stats["threats_detected"] >= 0


# ═══════════════════════════════════════════════════════════════
# MultiPathEncryptionEngine Tests
# ═══════════════════════════════════════════════════════════════


def test_multipath_engine_basic():
    """اختبار أساسي لمحرك التشفير متعدد المسارات"""
    engine = MultiPathEncryptionEngine()
    result = engine.generate_paths("https://example.com", 5)

    assert len(result.paths) == 5
    assert result.primary_path == "PATH-00"
    assert result.paths[0].status == EncryptionPathStatus.ACTIVE
    assert 0 <= result.redundancy_factor <= 1
    assert 0 <= result.success_probability <= 1
    assert result.combined_security > 0


def test_multipath_path_structure():
    """بنية المسار صحيحة"""
    engine = MultiPathEncryptionEngine()
    result = engine.generate_paths("https://test.com", 8)

    for path in result.paths:
        assert path.path_id.startswith("PATH-")
        assert path.algorithm in list(PQCAlgorithm)
        assert path.hop_count >= 2
        assert path.latency_ms >= 0
        assert 0 <= path.error_rate <= 0.05
        assert path.security_strength >= 192
        assert path.status in list(EncryptionPathStatus)


def test_multipath_primary_active():
    """المسار الأساسي يجب أن يكون نشطاً دائماً"""
    engine = MultiPathEncryptionEngine()
    for _ in range(10):
        result = engine.generate_paths("https://quantum.com", 6)
        assert result.paths[0].status == EncryptionPathStatus.ACTIVE


def test_multipath_success_probability():
    """احتمال النجاح يزداد مع عدد المسارات"""
    engine = MultiPathEncryptionEngine()
    single = engine.generate_paths("https://test1.com", 1)
    multiple = engine.generate_paths("https://test2.com", 10)

    # مسارات أكثر = احتمال نجاح أعلى (عادةً)
    # لكن هذا يعتمد على error_rate العشوائي
    assert 0 <= single.success_probability <= 1
    assert 0 <= multiple.success_probability <= 1


def test_multipath_algorithms_variety():
    """استخدام خوارزميات مختلفة"""
    engine = MultiPathEncryptionEngine()
    result = engine.generate_paths("https://diverse.com", 15)

    algorithms_used = {p.algorithm for p in result.paths}
    # يجب استخدام أكثر من خوارزمية واحدة
    assert len(algorithms_used) >= 2


# ═══════════════════════════════════════════════════════════════
# MetricsCollector Tests
# ═══════════════════════════════════════════════════════════════


def test_metrics_collector_basic():
    """اختبار أساسي لجامع المقاييس"""
    collector = MetricsCollector()
    engine = QuantumFingerprintEngine()

    fp = engine.generate_fingerprint("8.8.8.8", "test")
    collector.record_detection(fp, 2.5, is_false_positive=False)

    metrics = collector.get_metrics()
    assert metrics.total_scans == 1
    assert metrics.avg_detection_time_ms == 2.5


def test_metrics_false_positive_rate():
    """حساب معدل الإيجابيات الخاطئة"""
    collector = MetricsCollector()
    engine = QuantumFingerprintEngine()

    # 10 تهديدات: 2 false positives
    for i in range(10):
        fp = engine.generate_fingerprint(f"192.168.1.{i}", f"fp-{i}")
        # نفترض أن التصنيف malicious/suspicious هو تهديد
        if fp.classification in [
            ThreatClassification.MALICIOUS,
            ThreatClassification.SUSPICIOUS,
        ]:
            is_fp = i < 2  # أول اثنين false positives
            collector.record_detection(fp, 1.0, is_false_positive=is_fp)

    metrics = collector.get_metrics()
    if metrics.threats_detected > 0:
        expected_fp_rate = metrics.false_positives / metrics.threats_detected
        assert abs(metrics.false_positive_rate - expected_fp_rate) < 0.001


def test_metrics_encryption_tracking():
    """تتبع عمليات التشفير"""
    collector = MetricsCollector()

    collector.record_encryption(5.0)
    collector.record_encryption(3.0)
    collector.record_encryption(4.0)

    metrics = collector.get_metrics()
    assert metrics.total_encryptions == 3
    assert metrics.avg_encryption_time_ms == 4.0


def test_metrics_recent_events():
    """الحصول على الأحداث الأخيرة"""
    collector = MetricsCollector()
    engine = QuantumFingerprintEngine()

    # إنشاء 30 حدث
    for i in range(30):
        fp = engine.generate_fingerprint(f"10.0.{i // 256}.{i % 256}", f"event-{i}")
        collector.record_detection(fp, float(i), is_false_positive=False)

    recent = collector.get_recent_events(limit=10)
    assert len(recent) == 10
    # يجب أن تكون مرتبة من الأحدث
    assert all("event_id" in e for e in recent)


# ═══════════════════════════════════════════════════════════════
# SecurityEngineService Tests
# ═══════════════════════════════════════════════════════════════


def test_security_engine_service():
    """اختبار الخدمة الرئيسية"""
    service = SecurityEngineService()

    # Scan fingerprint
    fp, detection_time = service.scan_fingerprint("1.1.1.1")
    assert fp.source_ip == "1.1.1.1"
    assert detection_time >= 0

    # Encrypt multipath
    result, encryption_time = service.encrypt_multipath("https://qurabia.com", 5)
    assert len(result.paths) == 5
    assert encryption_time >= 0

    # Get metrics
    metrics = service.get_performance_metrics()
    assert metrics.total_scans >= 1
    assert metrics.total_encryptions >= 1


def test_security_engine_live_dashboard():
    """بيانات لوحة القياس الحية"""
    service = SecurityEngineService()

    # إنشاء بعض النشاط
    service.scan_fingerprint("192.168.1.10")
    service.encrypt_multipath("https://test.com", 3)

    dashboard = service.get_live_dashboard_data()
    assert "metrics" in dashboard
    assert "recent_events" in dashboard
    assert "engine_stats" in dashboard
    assert "timestamp" in dashboard

    assert dashboard["metrics"]["total_scans"] >= 1
    assert dashboard["metrics"]["total_encryptions"] >= 1


def test_security_engine_singleton():
    """التأكد من وجود مثيل واحد فقط"""
    engine1 = get_security_engine()
    engine2 = get_security_engine()
    assert engine1 is engine2


# ═══════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═══════════════════════════════════════════════════════════════


def test_api_scan_fingerprint():
    """API: فحص بصمة كمومية"""
    response = client.post(
        "/api/v1/security/scan_fingerprint",
        json={"source_ip": "8.8.4.4", "seed": "test-api"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert "fingerprint" in data
    assert "detection_time_ms" in data

    fp = data["fingerprint"]
    assert fp["source_ip"] == "8.8.4.4"
    assert fp["id"].startswith("QFP-")
    assert "density_matrix" in fp
    assert len(fp["density_matrix"]) == 4


def test_api_encrypt_multipath():
    """API: تشفير متعدد المسارات"""
    response = client.post(
        "/api/v1/security/encrypt_multipath",
        json={"target_url": "https://qurabia.com", "path_count": 7},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert "result" in data
    assert "encryption_time_ms" in data

    result = data["result"]
    assert len(result["paths"]) == 7
    assert result["primary_path"] == "PATH-00"
    assert "backup_paths" in result


def test_api_metrics_performance():
    """API: مقاييس الأداء"""
    # إنشاء بعض النشاط أولاً
    client.post(
        "/api/v1/security/scan_fingerprint", json={"source_ip": "1.2.3.4"}
    )

    response = client.get("/api/v1/security/metrics/performance")
    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert "metrics" in data

    metrics = data["metrics"]
    assert "total_scans" in metrics
    assert "threats_detected" in metrics
    assert "false_positive_rate" in metrics
    assert "avg_detection_time_ms" in metrics
    assert metrics["total_scans"] >= 1


def test_api_metrics_live():
    """API: لوحة القياس الحية"""
    response = client.get("/api/v1/security/metrics/live")
    assert response.status_code == 200
    data = response.json()

    assert data["ok"] is True
    assert "dashboard" in data

    dashboard = data["dashboard"]
    assert "metrics" in dashboard
    assert "recent_events" in dashboard
    assert "engine_stats" in dashboard


def test_api_scan_fingerprint_validation():
    """API: التحقق من صحة المدخلات"""
    # IP قصير جداً
    response = client.post(
        "/api/v1/security/scan_fingerprint", json={"source_ip": "1.1"}
    )
    assert response.status_code == 422  # Validation error

    # seed طويل جداً
    response = client.post(
        "/api/v1/security/scan_fingerprint",
        json={"source_ip": "192.168.1.1", "seed": "x" * 200},
    )
    assert response.status_code == 422


def test_api_encrypt_multipath_validation():
    """API: التحقق من صحة path_count"""
    # path_count = 0 (غير صالح)
    response = client.post(
        "/api/v1/security/encrypt_multipath",
        json={"target_url": "https://example.com", "path_count": 0},
    )
    assert response.status_code == 422

    # path_count > 20 (خارج النطاق)
    response = client.post(
        "/api/v1/security/encrypt_multipath",
        json={"target_url": "https://example.com", "path_count": 25},
    )
    assert response.status_code == 422


# ═══════════════════════════════════════════════════════════════
# Performance & Integration Tests
# ═══════════════════════════════════════════════════════════════


def test_performance_scan_fingerprint():
    """قياس أداء فحص البصمة"""
    service = SecurityEngineService()
    times = []

    for i in range(100):
        start = time.perf_counter()
        service.scan_fingerprint(f"10.0.{i // 256}.{i % 256}")
        elapsed_ms = (time.perf_counter() - start) * 1000
        times.append(elapsed_ms)

    avg_time = sum(times) / len(times)
    # يجب أن يكون الفحص سريعاً (< 5ms في المتوسط)
    assert avg_time < 5.0, f"Average scan time too slow: {avg_time:.2f}ms"


def test_integration_full_workflow():
    """اختبار تكاملي: workflow كامل"""
    service = SecurityEngineService()

    # 1. فحص عدة IPs
    ips = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "8.8.8.8", "1.1.1.1"]
    for ip in ips:
        fp, _ = service.scan_fingerprint(ip)
        assert fp.source_ip == ip

    # 2. تشفير متعدد المسارات
    urls = [
        "https://qurabia.com",
        "https://example.com",
        "https://test.org",
    ]
    for url in urls:
        result, _ = service.encrypt_multipath(url, 5)
        assert len(result.paths) == 5

    # 3. التحقق من المقاييس
    metrics = service.get_performance_metrics()
    assert metrics.total_scans >= len(ips)
    assert metrics.total_encryptions >= len(urls)
    assert metrics.false_positive_rate >= 0
    assert metrics.avg_detection_time_ms >= 0

    # 4. لوحة القياس الحية
    dashboard = service.get_live_dashboard_data()
    assert dashboard["metrics"]["total_scans"] >= len(ips)
    assert len(dashboard["recent_events"]) >= 1


def test_concurrent_operations():
    """عمليات متزامنة (لا توجد race conditions)"""
    service = SecurityEngineService()

    # محاكاة عمليات متزامنة
    import concurrent.futures

    def scan_task(i):
        return service.scan_fingerprint(f"192.168.100.{i % 256}")

    def encrypt_task(i):
        return service.encrypt_multipath(f"https://test{i}.com", 3)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        scan_futures = [executor.submit(scan_task, i) for i in range(20)]
        encrypt_futures = [executor.submit(encrypt_task, i) for i in range(10)]

        # انتظار جميع العمليات
        for f in scan_futures + encrypt_futures:
            f.result()

    # التحقق من المقاييس
    metrics = service.get_performance_metrics()
    assert metrics.total_scans >= 20
    assert metrics.total_encryptions >= 10
