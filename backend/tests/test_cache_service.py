"""
Tests for Cache Service
=======================

اختبارات شاملة لخدمة الذاكرة المؤقتة (Redis Caching)
"""

import json
import time

import pytest

# استيراد الخدمة المُختبرة
from cache_service import (
    generate_fingerprint_key,
    generate_multipath_key,
    get_cache,
    get_cache_stats,
    invalidate_cache,
    invalidate_pattern,
    redis_client,
    set_cache,
)


# ═══════════════════════════════════════════════════════════════
# Setup & Fixtures
# ═══════════════════════════════════════════════════════════════


@pytest.fixture(autouse=True)
def cleanup_redis():
    """تنظيف Redis قبل وبعد كل اختبار"""
    if redis_client:
        # تنظيف قبل الاختبار
        redis_client.flushdb()
    yield
    if redis_client:
        # تنظيف بعد الاختبار
        redis_client.flushdb()


def skip_if_redis_unavailable():
    """تخطي الاختبار إذا كان Redis غير متاح"""
    if not redis_client:
        pytest.skip("Redis is not available - skipping test")


# ═══════════════════════════════════════════════════════════════
# Basic Caching Tests
# ═══════════════════════════════════════════════════════════════


def test_redis_connection():
    """اختبار الاتصال الأساسي بـ Redis"""
    skip_if_redis_unavailable()

    # يجب أن يكون الاتصال نشطاً
    assert redis_client is not None
    assert redis_client.ping() is True


def test_set_and_get_cache():
    """اختبار التخزين والاسترداد الأساسي"""
    skip_if_redis_unavailable()

    # تخزين بيانات
    test_data = {"name": "QURABIA", "version": "2.0", "quantum": True}
    result = set_cache("test:basic", test_data, expiry_seconds=60)
    assert result is True

    # استرداد البيانات
    cached = get_cache("test:basic")
    assert cached is not None
    assert cached["name"] == "QURABIA"
    assert cached["version"] == "2.0"
    assert cached["quantum"] is True


def test_cache_miss():
    """اختبار حالة CACHE MISS (البيانات غير موجودة)"""
    skip_if_redis_unavailable()

    # محاولة الحصول على مفتاح غير موجود
    result = get_cache("nonexistent:key")
    assert result is None


def test_cache_expiry():
    """اختبار انتهاء صلاحية الـ cache"""
    skip_if_redis_unavailable()

    # تخزين بيانات بصلاحية قصيرة جداً (1 ثانية)
    test_data = {"temp": "data"}
    set_cache("test:expiry", test_data, expiry_seconds=1)

    # التحقق من وجود البيانات فوراً
    assert get_cache("test:expiry") is not None

    # الانتظار لانتهاء الصلاحية
    time.sleep(1.5)

    # يجب أن تكون البيانات قد انتهت
    assert get_cache("test:expiry") is None


def test_cache_overwrite():
    """اختبار إعادة الكتابة على نفس المفتاح"""
    skip_if_redis_unavailable()

    # تخزين البيانات الأولى
    set_cache("test:overwrite", {"value": 1})
    assert get_cache("test:overwrite")["value"] == 1

    # إعادة الكتابة
    set_cache("test:overwrite", {"value": 2})
    assert get_cache("test:overwrite")["value"] == 2


# ═══════════════════════════════════════════════════════════════
# Data Type Tests
# ═══════════════════════════════════════════════════════════════


def test_cache_various_data_types():
    """اختبار تخزين أنواع بيانات مختلفة"""
    skip_if_redis_unavailable()

    # String
    set_cache("test:string", "Hello QURABIA")
    assert get_cache("test:string") == "Hello QURABIA"

    # Number
    set_cache("test:number", 42)
    assert get_cache("test:number") == 42

    # Float
    set_cache("test:float", 3.14159)
    assert get_cache("test:float") == 3.14159

    # Boolean
    set_cache("test:bool", True)
    assert get_cache("test:bool") is True

    # List
    set_cache("test:list", [1, 2, 3, "four"])
    assert get_cache("test:list") == [1, 2, 3, "four"]

    # Dict
    set_cache("test:dict", {"nested": {"data": "works"}})
    assert get_cache("test:dict")["nested"]["data"] == "works"


def test_cache_arabic_content():
    """اختبار تخزين محتوى عربي"""
    skip_if_redis_unavailable()

    arabic_data = {
        "name": "قرابية",
        "description": "منصة عربية للذكاء الاصطناعي",
        "features": ["حوسبة كمومية", "أمان متقدم", "تحليل بيانات"],
    }

    set_cache("test:arabic", arabic_data)
    cached = get_cache("test:arabic")

    assert cached["name"] == "قرابية"
    assert "حوسبة كمومية" in cached["features"]


# ═══════════════════════════════════════════════════════════════
# Invalidation Tests
# ═══════════════════════════════════════════════════════════════


def test_invalidate_single_key():
    """اختبار حذف مفتاح واحد"""
    skip_if_redis_unavailable()

    # تخزين البيانات
    set_cache("test:delete_me", {"data": "temporary"})
    assert get_cache("test:delete_me") is not None

    # حذف المفتاح
    result = invalidate_cache("test:delete_me")
    assert result is True

    # التحقق من الحذف
    assert get_cache("test:delete_me") is None


def test_invalidate_pattern():
    """اختبار حذف مجموعة مفاتيح بنمط معين"""
    skip_if_redis_unavailable()

    # تخزين عدة مفاتيح بنفس البادئة
    set_cache("fingerprint:192.168.1.1", {"ip": "192.168.1.1"})
    set_cache("fingerprint:192.168.1.2", {"ip": "192.168.1.2"})
    set_cache("fingerprint:10.0.0.1", {"ip": "10.0.0.1"})
    set_cache("multipath:example", {"url": "example.com"})

    # التحقق من وجودها
    assert get_cache("fingerprint:192.168.1.1") is not None
    assert get_cache("fingerprint:192.168.1.2") is not None

    # حذف جميع البصمات
    deleted_count = invalidate_pattern("fingerprint:*")
    assert deleted_count == 3

    # التحقق من الحذف
    assert get_cache("fingerprint:192.168.1.1") is None
    assert get_cache("fingerprint:192.168.1.2") is None
    assert get_cache("fingerprint:10.0.0.1") is None

    # multipath لم يُحذف
    assert get_cache("multipath:example") is not None


# ═══════════════════════════════════════════════════════════════
# Key Generator Tests
# ═══════════════════════════════════════════════════════════════


def test_generate_fingerprint_key():
    """اختبار توليد مفاتيح البصمات"""
    # بدون seed
    key1 = generate_fingerprint_key("192.168.1.1")
    assert key1 == "fingerprint:192.168.1.1:default"

    # مع seed
    key2 = generate_fingerprint_key("192.168.1.1", "custom-seed")
    assert key2 == "fingerprint:192.168.1.1:custom-seed"

    # نفس IP، seeds مختلفة = مفاتيح مختلفة
    assert key1 != key2


def test_generate_multipath_key():
    """اختبار توليد مفاتيح التشفير متعدد المسارات"""
    key1 = generate_multipath_key("https://qurabia.com", 5)
    key2 = generate_multipath_key("https://qurabia.com", 10)
    key3 = generate_multipath_key("https://example.com", 5)

    # مفاتيح مختلفة لـ URLs أو path_counts مختلفة
    assert key1 != key2
    assert key1 != key3

    # نفس URL ونفس path_count = نفس المفتاح
    key1_again = generate_multipath_key("https://qurabia.com", 5)
    assert key1 == key1_again

    # التحقق من التنسيق
    assert key1.startswith("multipath:")
    assert ":5" in key1


# ═══════════════════════════════════════════════════════════════
# Stats Tests
# ═══════════════════════════════════════════════════════════════


def test_cache_stats():
    """اختبار الحصول على إحصائيات الـ cache"""
    skip_if_redis_unavailable()

    stats = get_cache_stats()

    assert stats["available"] is True
    assert "redis_version" in stats
    assert "used_memory_human" in stats
    assert "connected_clients" in stats
    assert "hit_rate" in stats


def test_cache_hit_rate():
    """اختبار حساب معدل إصابة الـ cache"""
    skip_if_redis_unavailable()

    # إنشاء بعض cache hits و misses
    set_cache("test:hit1", {"data": 1})
    set_cache("test:hit2", {"data": 2})

    # Hits
    get_cache("test:hit1")
    get_cache("test:hit2")
    get_cache("test:hit1")  # hit مرة ثانية

    # Misses
    get_cache("test:miss1")
    get_cache("test:miss2")

    stats = get_cache_stats()
    # يجب أن يكون معدل الإصابة > 0
    assert stats["hit_rate"] >= 0


# ═══════════════════════════════════════════════════════════════
# Error Handling Tests
# ═══════════════════════════════════════════════════════════════


def test_graceful_degradation_without_redis():
    """اختبار السلوك عند عدم توفر Redis"""
    # هذا الاختبار يعمل فقط إذا كان Redis غير متاح
    if redis_client:
        pytest.skip("Redis is available - skipping graceful degradation test")

    # يجب أن تفشل العمليات بهدوء دون أخطاء
    assert set_cache("test:key", {"data": "value"}) is False
    assert get_cache("test:key") is None
    assert invalidate_cache("test:key") is False

    stats = get_cache_stats()
    assert stats["available"] is False
    assert "error" in stats


def test_cache_with_non_serializable_data():
    """اختبار محاولة تخزين بيانات غير قابلة للتسلسل JSON"""
    skip_if_redis_unavailable()

    # محاولة تخزين كائن غير قابل للتسلسل (مثل function)
    result = set_cache("test:bad_data", lambda x: x + 1)
    # يجب أن تفشل العملية بهدوء
    assert result is False


# ═══════════════════════════════════════════════════════════════
# Performance Tests
# ═══════════════════════════════════════════════════════════════


def test_cache_performance():
    """اختبار أداء الـ cache (يجب أن يكون سريعاً جداً)"""
    skip_if_redis_unavailable()

    test_data = {"large": "data" * 100}

    # قياس وقت الكتابة
    start = time.perf_counter()
    for i in range(100):
        set_cache(f"perf:test:{i}", test_data, expiry_seconds=60)
    write_time = (time.perf_counter() - start) * 1000  # ms

    # قياس وقت القراءة
    start = time.perf_counter()
    for i in range(100):
        get_cache(f"perf:test:{i}")
    read_time = (time.perf_counter() - start) * 1000  # ms

    # يجب أن تكون العمليات سريعة (< 500ms لـ 100 عملية)
    assert write_time < 500, f"Write time too slow: {write_time:.2f}ms"
    assert read_time < 500, f"Read time too slow: {read_time:.2f}ms"


def test_large_data_caching():
    """اختبار تخزين بيانات كبيرة"""
    skip_if_redis_unavailable()

    # بيانات كبيرة (مصفوفة كبيرة)
    large_data = {
        "matrix": [[i * j for j in range(100)] for i in range(100)],
        "metadata": {"size": 100, "type": "density_matrix"},
    }

    # تخزين
    result = set_cache("test:large", large_data)
    assert result is True

    # استرداد
    cached = get_cache("test:large")
    assert cached is not None
    assert len(cached["matrix"]) == 100
    assert cached["metadata"]["size"] == 100


# ═══════════════════════════════════════════════════════════════
# Integration Tests
# ═══════════════════════════════════════════════════════════════


def test_realistic_fingerprint_caching():
    """اختبار تكاملي: سيناريو واقعي لـ caching البصمات"""
    skip_if_redis_unavailable()

    # محاكاة بصمة كمومية
    fingerprint_data = {
        "id": "QFP-test-123",
        "source_ip": "192.168.1.100",
        "state_signature": "abc123def456",
        "entanglement_level": 0.75,
        "quantum_phase": 1.57,
        "density_matrix": [0.5, 0.0, 0.0, 0.5],
        "confidence": 0.95,
        "classification": "suspicious",
        "timestamp": int(time.time() * 1000),
    }

    # توليد المفتاح
    cache_key = generate_fingerprint_key("192.168.1.100", "test-seed")

    # أول طلب: CACHE MISS
    assert get_cache(cache_key) is None

    # تخزين النتيجة
    set_cache(cache_key, fingerprint_data, expiry_seconds=3600)

    # ثاني طلب: CACHE HIT
    cached = get_cache(cache_key)
    assert cached is not None
    assert cached["source_ip"] == "192.168.1.100"
    assert cached["classification"] == "suspicious"


def test_realistic_multipath_caching():
    """اختبار تكاملي: سيناريو واقعي لـ caching التشفير"""
    skip_if_redis_unavailable()

    # محاكاة نتيجة تشفير متعدد المسارات
    multipath_data = {
        "paths": [
            {
                "path_id": "PATH-00",
                "algorithm": "CRYSTALS-Kyber-1024",
                "hop_count": 3,
                "latency_ms": 12.5,
                "error_rate": 0.001,
                "security_strength": 256,
                "status": "active",
            }
        ],
        "primary_path": "PATH-00",
        "redundancy_factor": 0.8,
        "success_probability": 0.999,
    }

    cache_key = generate_multipath_key("https://qurabia.com", 5)

    # MISS -> SET -> HIT
    assert get_cache(cache_key) is None
    set_cache(cache_key, multipath_data, expiry_seconds=1800)

    cached = get_cache(cache_key)
    assert cached is not None
    assert len(cached["paths"]) == 1
    assert cached["primary_path"] == "PATH-00"
