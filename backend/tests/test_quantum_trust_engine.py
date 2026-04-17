"""
Tests for Quantum Trust Engine — اختبارات محرك الثقة الكمومي
=================================================================

اختبارات شاملة لـ:
1. Pattern Initialization
2. Trust Score Calculation
3. Decoherence Detection
4. Risk Assessment
5. Shannon Entropy
6. Trust Decay

المؤلف: AZIIZALOYIBI (عبدالعزيز بن سلطان العتيبي)
"""

import time
from unittest.mock import patch

import pytest

from rate_limiting.quantum_trust_engine import (
    DECOHERENCE_THRESHOLD_HIGH,
    MOCK_PATTERN_DATABASE,
    assess_risk,
    calculate_decoherence_score,
    calculate_shannon_entropy,
    clear_pattern_database,
    get_decayed_trust,
    get_pattern_stats,
    get_trust_score,
    initialize_pattern,
)


@pytest.fixture(autouse=True)
def clean_database():
    """تنظيف قاعدة البيانات قبل كل اختبار"""
    clear_pattern_database()
    yield
    clear_pattern_database()


# ══════════════════════════════════════════════════════════════════════════════
# Test Pattern Initialization
# ══════════════════════════════════════════════════════════════════════════════


def test_initialize_pattern_creates_new_entry():
    """اختبار: تهيئة نمط جديد"""
    ip = "192.168.1.100"
    initialize_pattern(ip)

    assert ip in MOCK_PATTERN_DATABASE
    pattern = MOCK_PATTERN_DATABASE[ip]

    assert pattern["total_requests"] == 0
    assert pattern["avg_interval"] == 2.0
    assert pattern["trust_score"] == 0.5
    assert pattern["violation_count"] == 0
    assert isinstance(pattern["path_history"], list)


def test_initialize_pattern_idempotent():
    """اختبار: استدعاء initialize مرتين لا يُعيد التهيئة"""
    ip = "192.168.1.101"
    initialize_pattern(ip)

    # تعديل البيانات
    MOCK_PATTERN_DATABASE[ip]["total_requests"] = 10

    # استدعاء مرة أخرى
    initialize_pattern(ip)

    # يجب أن تبقى البيانات كما هي
    assert MOCK_PATTERN_DATABASE[ip]["total_requests"] == 10


# ══════════════════════════════════════════════════════════════════════════════
# Test Trust Score Calculation
# ══════════════════════════════════════════════════════════════════════════════


def test_get_trust_score_normal_behavior():
    """اختبار: حساب trust score لسلوك عادي"""
    ip = "192.168.1.102"

    # طلبات عادية
    for i in range(5):
        time.sleep(0.01)  # فترة زمنية معقولة
        score = get_trust_score(ip, f"/api/endpoint{i}")

    assert 0.0 <= score <= 1.0
    assert MOCK_PATTERN_DATABASE[ip]["total_requests"] == 5


def test_get_trust_score_updates_pattern():
    """اختبار: get_trust_score يُحدّث النمط"""
    ip = "192.168.1.103"

    score1 = get_trust_score(ip, "/api/test")
    time.sleep(0.05)
    score2 = get_trust_score(ip, "/api/test2")

    pattern = MOCK_PATTERN_DATABASE[ip]
    assert pattern["total_requests"] == 2
    assert len(pattern["path_history"]) == 2
    assert pattern["last_path"] == "/api/test2"


def test_trust_decay():
    """اختبار: الثقة تتآكل مع الوقت"""
    ip = "192.168.1.104"
    initialize_pattern(ip)

    # تعيين ثقة عالية
    MOCK_PATTERN_DATABASE[ip]["trust_score"] = 0.9
    MOCK_PATTERN_DATABASE[ip]["last_seen"] = time.time() - 10000  # 10000 ثانية مضت

    decayed = get_decayed_trust(ip)

    # يجب أن تكون أقل من الثقة الأصلية
    assert decayed < 0.9


def test_loyalty_bonus():
    """اختبار: مكافأة الولاء للمستخدمين القدامى"""
    ip = "192.168.1.105"
    initialize_pattern(ip)

    # حساب أقدم (30 يوم)
    MOCK_PATTERN_DATABASE[ip]["first_seen"] = time.time() - (30 * 86400)
    MOCK_PATTERN_DATABASE[ip]["trust_score"] = 0.5

    trust_with_loyalty = get_decayed_trust(ip)

    # يجب أن يحصل على مكافأة
    assert trust_with_loyalty > 0.5


# ══════════════════════════════════════════════════════════════════════════════
# Test Decoherence Detection
# ══════════════════════════════════════════════════════════════════════════════


def test_decoherence_fast_requests():
    """اختبار: كشف الطلبات السريعة جداً (bot attack)"""
    ip = "192.168.1.106"
    initialize_pattern(ip)

    # محاكاة طلبات سريعة جداً
    MOCK_PATTERN_DATABASE[ip]["last_seen"] = time.time() - 0.05  # 50ms مضت
    MOCK_PATTERN_DATABASE[ip]["avg_interval"] = 2.0

    decoherence = calculate_decoherence_score(ip, "/api/test")

    # يجب أن يكون الانهيار عالياً
    assert decoherence > 0.3


def test_decoherence_sensitive_path_first_access():
    """اختبار: كشف الوصول الأول لمسار حساس"""
    ip = "192.168.1.107"
    initialize_pattern(ip)

    # الوصول لمسار حساس لأول مرة
    decoherence = calculate_decoherence_score(ip, "/admin/secret")

    # يجب أن يكون الانهيار عالياً جداً
    assert decoherence >= 0.5


def test_decoherence_sensitive_path_regular_user():
    """اختبار: مستخدم عادي يزور مسارات حساسة بانتظام"""
    ip = "192.168.1.108"
    initialize_pattern(ip)

    # بناء سجل زيارات لمسارات حساسة
    MOCK_PATTERN_DATABASE[ip]["path_history"] = [
        "/admin/users",
        "/admin/settings",
        "/admin/logs",
    ]

    # زيارة مسار حساس آخر
    decoherence = calculate_decoherence_score(ip, "/admin/config")

    # يجب ألا يكون الانهيار عالياً (مستخدم معتاد)
    assert decoherence < 0.5


def test_decoherence_burst_attack():
    """اختبار: كشف انفجار الطلبات (burst attack)"""
    ip = "192.168.1.109"
    initialize_pattern(ip)

    # محاكاة burst: 15 طلب في 2 ثانية
    MOCK_PATTERN_DATABASE[ip]["first_seen"] = time.time() - 2.0
    MOCK_PATTERN_DATABASE[ip]["total_requests"] = 15

    decoherence = calculate_decoherence_score(ip, "/api/test")

    # يجب أن يكون الانهيار عالياً
    assert decoherence > 0.3


# ══════════════════════════════════════════════════════════════════════════════
# Test Shannon Entropy
# ══════════════════════════════════════════════════════════════════════════════


def test_shannon_entropy_uniform():
    """اختبار: إنتروبيا عالية لمسارات متنوعة"""
    paths = ["/a", "/b", "/c", "/d", "/e"]
    entropy = calculate_shannon_entropy(paths)

    # يجب أن تكون الإنتروبيا عالية (تنوع كامل)
    assert entropy > 2.0


def test_shannon_entropy_repetitive():
    """اختبار: إنتروبيا منخفضة لمسارات متكررة"""
    paths = ["/api/test"] * 10
    entropy = calculate_shannon_entropy(paths)

    # يجب أن تكون الإنتروبيا = 0 (تكرار كامل)
    assert entropy == 0.0


def test_shannon_entropy_mixed():
    """اختبار: إنتروبيا متوسطة لمزيج"""
    paths = ["/a", "/a", "/b", "/b", "/c"]
    entropy = calculate_shannon_entropy(paths)

    # يجب أن تكون بين 0 و maximum
    assert 0.0 < entropy < 3.0


# ══════════════════════════════════════════════════════════════════════════════
# Test Risk Assessment
# ══════════════════════════════════════════════════════════════════════════════


def test_assess_risk_critical_decoherence():
    """اختبار: انهيار حرج يؤدي للحظر"""
    allowed, action = assess_risk(
        trust_score=0.9,  # ثقة عالية
        decoherence_score=0.85,  # انهيار حرج
        request_count=5,
    )

    assert not allowed
    assert action == "DECOHERENCE_CRITICAL"


def test_assess_risk_high_decoherence():
    """اختبار: انهيار عالٍ يؤدي للحظر"""
    allowed, action = assess_risk(
        trust_score=0.7, decoherence_score=0.65, request_count=10
    )

    assert not allowed
    assert action == "DECOHERENCE_DETECTED"


def test_assess_risk_low_trust():
    """اختبار: ثقة منخفضة + نشاط = حظر"""
    allowed, action = assess_risk(
        trust_score=0.1, decoherence_score=0.0, request_count=10
    )

    assert not allowed
    assert action == "LOW_TRUST_BANNED"


def test_assess_risk_captcha_challenge():
    """اختبار: ثقة منخفضة + انهيار متوسط = CAPTCHA"""
    allowed, action = assess_risk(
        trust_score=0.25, decoherence_score=0.35, request_count=3
    )

    assert not allowed
    assert action == "CAPTCHA_CHALLENGE"


def test_assess_risk_rate_limit_exceeded():
    """اختبار: تجاوز حد الطلبات"""
    allowed, action = assess_risk(
        trust_score=0.6, decoherence_score=0.1, request_count=150
    )

    assert not allowed
    assert action == "RATE_LIMITED_THROTTLE"


def test_assess_risk_dynamic_limits_high_trust():
    """اختبار: حدود ديناميكية للمستخدمين الموثوقين"""
    # مستخدم موثوق جداً (trust > 0.8) → حد 200
    allowed, action = assess_risk(
        trust_score=0.85, decoherence_score=0.05, request_count=150
    )

    assert allowed
    assert action == "OK"


def test_assess_risk_dynamic_limits_low_trust():
    """اختبار: حدود ديناميكية للمستخدمين المشبوهين"""
    # مستخدم مشبوه (trust < 0.5) → حد 50
    allowed, action = assess_risk(
        trust_score=0.3, decoherence_score=0.1, request_count=60
    )

    assert not allowed
    assert action == "RATE_LIMITED_THROTTLE"


def test_assess_risk_all_clear():
    """اختبار: كل شيء طبيعي - السماح بالمرور"""
    allowed, action = assess_risk(
        trust_score=0.7, decoherence_score=0.1, request_count=20
    )

    assert allowed
    assert action == "OK"


# ══════════════════════════════════════════════════════════════════════════════
# Test Pattern Stats
# ══════════════════════════════════════════════════════════════════════════════


def test_get_pattern_stats_empty():
    """اختبار: إحصائيات قاعدة بيانات فارغة"""
    stats = get_pattern_stats()

    assert stats["total_tracked_ips"] == 0
    assert stats["trusted_ips"] == 0
    assert stats["suspicious_ips"] == 0


def test_get_pattern_stats_with_data():
    """اختبار: إحصائيات مع بيانات"""
    # إضافة مستخدمين متنوعين
    initialize_pattern("192.168.1.200")
    MOCK_PATTERN_DATABASE["192.168.1.200"]["trust_score"] = 0.9  # موثوق

    initialize_pattern("192.168.1.201")
    MOCK_PATTERN_DATABASE["192.168.1.201"]["trust_score"] = 0.2  # مشبوه

    initialize_pattern("192.168.1.202")
    MOCK_PATTERN_DATABASE["192.168.1.202"]["trust_score"] = 0.5  # محايد

    stats = get_pattern_stats()

    assert stats["total_tracked_ips"] == 3
    assert stats["trusted_ips"] == 1
    assert stats["suspicious_ips"] == 1
    assert stats["neutral_ips"] == 1


# ══════════════════════════════════════════════════════════════════════════════
# Integration Tests
# ══════════════════════════════════════════════════════════════════════════════


def test_full_workflow_normal_user():
    """اختبار تكامل: مستخدم عادي"""
    ip = "192.168.1.250"
    initialize_pattern(ip)

    # إعداد نمط واقعي لمستخدم عادي
    MOCK_PATTERN_DATABASE[ip]["trust_score"] = 0.7
    MOCK_PATTERN_DATABASE[ip]["total_requests"] = 5
    MOCK_PATTERN_DATABASE[ip]["avg_interval"] = 2.0
    MOCK_PATTERN_DATABASE[ip]["last_seen"] = time.time() - 2.0
    MOCK_PATTERN_DATABASE[ip]["path_history"] = [
        "/api/endpoint1",
        "/api/endpoint2",
        "/api/endpoint1",
    ]

    # حساب الانهيار والمخاطر
    decoherence = calculate_decoherence_score(ip, "/api/endpoint3")
    allowed, action = assess_risk(0.7, decoherence, 5)

    # مستخدم عادي يجب أن يُسمح له
    assert allowed
    assert action == "OK"


def test_full_workflow_attacker():
    """اختبار تكامل: مهاجم"""
    ip = "192.168.1.251"
    initialize_pattern(ip)

    # محاكاة هجوم: طلبات سريعة جداً + مسارات حساسة
    MOCK_PATTERN_DATABASE[ip]["last_seen"] = time.time() - 0.01  # 10ms
    MOCK_PATTERN_DATABASE[ip]["total_requests"] = 50
    MOCK_PATTERN_DATABASE[ip]["first_seen"] = time.time() - 5  # 50 طلب في 5 ثوانٍ

    trust = get_trust_score(ip, "/admin/secret")
    decoherence = calculate_decoherence_score(ip, "/admin/secret")

    assert decoherence > DECOHERENCE_THRESHOLD_HIGH

    allowed, action = assess_risk(trust, decoherence, 50)

    assert not allowed
    assert action in ["DECOHERENCE_DETECTED", "DECOHERENCE_CRITICAL"]


def test_edge_case_empty_path_history():
    """اختبار حافة: سجل مسارات فارغ"""
    ip = "192.168.1.252"
    initialize_pattern(ip)

    MOCK_PATTERN_DATABASE[ip]["path_history"] = []

    decoherence = calculate_decoherence_score(ip, "/api/test")

    # يجب ألا يتعطل
    assert 0.0 <= decoherence <= 1.0


def test_edge_case_very_long_path_history():
    """اختبار حافة: سجل مسارات طويل جداً"""
    ip = "192.168.1.253"
    initialize_pattern(ip)

    # إضافة 100 مسار
    for i in range(100):
        get_trust_score(ip, f"/path{i}")

    # يجب أن يحتفظ بـ 50 فقط
    assert len(MOCK_PATTERN_DATABASE[ip]["path_history"]) == 50
