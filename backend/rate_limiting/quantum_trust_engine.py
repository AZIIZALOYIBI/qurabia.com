"""
Quantum Trust Engine — محرك الثقة الكمومي مع كشف الانهيار
==========================================================

يستخدم هذا المحرك مفهوم الانهيار الكمومي (Decoherence) لكشف الأنماط المشبوهة
في سلوك المستخدمين. بدلاً من مجرد عد الطلبات، يحلل النظام:

1. **Time Deviation** (الانحراف الزمني):
   - هل الطلبات سريعة جداً أو بطيئة جداً مقارنة بالنمط المعتاد؟

2. **Path Novelty** (غرابة المسار):
   - هل ينتقل المستخدم فجأة إلى مسارات غير منطقية؟

3. **Behavioral Entropy** (إنتروبيا السلوك):
   - مدى تنوع السلوك (التنوع الطبيعي مقبول، الفوضى مشبوهة)

4. **Trust Decay** (اضمحلال الثقة):
   - الثقة تتآكل طبيعياً مع الوقت بدون نشاط

الناتج:
- **Trust Score** (0.0 - 1.0): مستوى الثقة الأساسي
- **Decoherence Score** (0.0 - 1.0): مستوى الانحراف عن النمط
- **Risk Assessment**: قرار نهائي (ALLOWED / BLOCKED / THROTTLED)

المؤلف: AZIIZALOYIBI (عبدالعزيز بن سلطان العتيبي)
التاريخ: 2026-04-17
الإصدار: 1.0.0
"""

import hashlib
import math
import time
from typing import Dict, List, Tuple

import structlog

logger = structlog.get_logger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# Pattern Database — قاعدة بيانات الأنماط السلوكية
# ═══════════════════════════════════════════════════════════════════════════

# قاعدة بيانات تحاكي الذاكرة التراكمية للأنماط السلوكية (IP -> Pattern)
# في الإنتاج، يجب استبدالها بـ Redis أو قاعدة بيانات دائمة
MOCK_PATTERN_DATABASE: Dict[str, Dict] = {}

# الإعدادات الافتراضية
DEFAULT_TRUST_SCORE = 0.5  # افتراضي للمستخدم الجديد (محايد)
TRUST_DECAY_LAMBDA = 0.0001  # معامل الاضمحلال (λ)
DECOHERENCE_THRESHOLD_HIGH = 0.6  # حد الانهيار الخطر
DECOHERENCE_THRESHOLD_CRITICAL = 0.8  # حد الانهيار الحرج


# ═══════════════════════════════════════════════════════════════════════════
# Pattern Initialization — تهيئة النمط الأساسي
# ═══════════════════════════════════════════════════════════════════════════


def initialize_pattern(ip_address: str) -> None:
    """
    تهيئة النمط الأساسي للمستخدم لأول مرة.

    يتم استدعاء هذه الدالة عند أول طلب من IP جديد.
    تنشئ ملف شخصي (profile) يحتوي على:
    - first_seen: أول ظهور
    - last_seen: آخر نشاط
    - total_requests: إجمالي الطلبات
    - avg_interval: معدل الفترة الزمنية بين الطلبات
    - path_history: سجل المسارات المزارة
    - entropy_score: مقياس التنوع السلوكي
    - trust_score: درجة الثقة الحالية
    - violation_count: عدد المخالفات

    Args:
        ip_address: عنوان IP للمستخدم
    """
    if ip_address not in MOCK_PATTERN_DATABASE:
        current_time = time.time()
        MOCK_PATTERN_DATABASE[ip_address] = {
            "first_seen": current_time,
            "last_seen": current_time,
            "total_requests": 0,
            "avg_interval": 2.0,  # افتراضاً أن معدل الطلبات طبيعي كل 2 ثانية
            "path_history": [],  # سجل المسارات المزارة
            "last_path": None,
            "entropy_score": 0.5,  # مقياس التنوع السلوكي (محايد)
            "trust_score": DEFAULT_TRUST_SCORE,
            "violation_count": 0,  # عدد المخالفات المسجلة
            "decoherence_history": [],  # سجل الانهيارات
        }
        logger.info(
            "pattern_initialized",
            ip=ip_address,
            trust_score=DEFAULT_TRUST_SCORE,
        )


# ═══════════════════════════════════════════════════════════════════════════
# Trust Score Calculation — حساب درجة الثقة
# ═══════════════════════════════════════════════════════════════════════════


def get_trust_score(ip_address: str, request_path: str = "/") -> float:
    """
    حساب درجة الثقة الكمومية للمستخدم.

    يجمع هذه الدالة بين:
    1. Trust Decay: اضمحلال الثقة الزمني
    2. Decoherence Score: الانحراف السلوكي
    3. Historical Behavior: السلوك التاريخي

    Args:
        ip_address: عنوان IP للمستخدم
        request_path: المسار المطلوب (لتحليل السلوك)

    Returns:
        float: درجة الثقة (0.0 = خطر، 1.0 = موثوق تماماً)
    """
    initialize_pattern(ip_address)
    pattern = MOCK_PATTERN_DATABASE[ip_address]

    # تحديث السجل
    current_time = time.time()
    pattern["total_requests"] += 1
    pattern["last_path"] = request_path
    pattern["path_history"].append(request_path)

    # الحفاظ على آخر 50 مسار فقط (لتوفير الذاكرة)
    if len(pattern["path_history"]) > 50:
        pattern["path_history"] = pattern["path_history"][-50:]

    # حساب الفترة الزمنية منذ آخر طلب
    time_since_last = current_time - pattern["last_seen"]
    pattern["last_seen"] = current_time

    # تحديث معدل الفترة الزمنية (Exponential Moving Average)
    alpha = 0.3  # معامل التمهيد
    pattern["avg_interval"] = (
        alpha * time_since_last + (1 - alpha) * pattern["avg_interval"]
    )

    # 1. حساب Trust Decay (الاضمحلال الطبيعي)
    base_trust = get_decayed_trust(ip_address)

    # 2. حساب Decoherence Score (الانحراف السلوكي)
    decoherence = calculate_decoherence_score(ip_address, request_path)

    # 3. دمج المقاييس
    # كلما زاد الانهيار، قلت الثقة
    combined_trust = base_trust * (1.0 - decoherence * 0.5)

    # تحديث درجة الثقة في قاعدة البيانات
    pattern["trust_score"] = max(0.0, min(1.0, combined_trust))

    logger.debug(
        "trust_score_calculated",
        ip=ip_address,
        path=request_path,
        base_trust=round(base_trust, 3),
        decoherence=round(decoherence, 3),
        final_trust=round(pattern["trust_score"], 3),
    )

    return pattern["trust_score"]


def get_decayed_trust(ip_address: str) -> float:
    """
    حساب الثقة مع الاضمحلال الزمني (Trust Decay).

    يستخدم معادلة الاضمحلال الأسي:
    Trust(t) = Trust₀ × e^(-λt)

    حيث:
    - Trust₀: الثقة الأساسية
    - λ: معامل الاضمحلال
    - t: الوقت منذ آخر نشاط

    Args:
        ip_address: عنوان IP للمستخدم

    Returns:
        float: درجة الثقة بعد الاضمحلال
    """
    pattern = MOCK_PATTERN_DATABASE.get(ip_address)
    if not pattern:
        return DEFAULT_TRUST_SCORE

    current_time = time.time()
    time_since_last = current_time - pattern["last_seen"]

    # الاضمحلال الأسي
    decay_factor = math.exp(-TRUST_DECAY_LAMBDA * time_since_last)

    # الثقة الأساسية (تبدأ من trust_score المخزن أو الافتراضي)
    base_trust = pattern.get("trust_score", DEFAULT_TRUST_SCORE)

    # تطبيق الاضمحلال
    decayed_trust = base_trust * decay_factor

    # إضافة مكافأة صغيرة للمستخدمين القدامى (Loyalty Bonus)
    account_age_days = (current_time - pattern["first_seen"]) / 86400
    loyalty_bonus = min(0.1, account_age_days * 0.01)  # حد أقصى +0.1

    return min(1.0, decayed_trust + loyalty_bonus)


# ═══════════════════════════════════════════════════════════════════════════
# Decoherence Detection — كشف الانهيار الكمومي
# ═══════════════════════════════════════════════════════════════════════════


def calculate_decoherence_score(ip_address: str, request_path: str) -> float:
    """
    حساب درجة الانهيار الكمومي (Decoherence Score).

    يقيس مدى انحراف السلوك الحالي عن النمط الأساسي المسجل.
    هذا هو **جوهر الأمن القائم على السلوك الكمومي**.

    المقاييس المستخدمة:
    1. **Time Deviation**: الانحراف الزمني (سريع جداً؟ بطيء جداً؟)
    2. **Path Novelty**: غرابة المسار (انتقال مفاجئ لمسار حساس؟)
    3. **Request Burst**: انفجار الطلبات (عدد كبير في فترة قصيرة؟)
    4. **Behavioral Entropy**: الإنتروبيا السلوكية (فوضى أم تنوع طبيعي؟)

    Args:
        ip_address: عنوان IP للمستخدم
        request_path: المسار المطلوب الحالي

    Returns:
        float: درجة الانهيار (0.0 = طبيعي، 1.0 = انهيار كامل)
    """
    pattern = MOCK_PATTERN_DATABASE.get(ip_address)
    if not pattern:
        return 0.0  # مستخدم جديد، لا انهيار بعد

    decoherence_score = 0.0
    current_time = time.time()

    # ─────────────────────────────────────────────────────────────────────
    # 1. Time Deviation Analysis — تحليل الانحراف الزمني
    # ─────────────────────────────────────────────────────────────────────

    time_since_last = current_time - pattern["last_seen"]
    expected_interval = pattern["avg_interval"]

    # حساب الانحراف المعياري
    if expected_interval > 0:
        time_deviation = abs(time_since_last - expected_interval) / expected_interval

        # إذا كان الطلب سريعاً جداً (< 0.1 ثانية)
        if time_since_last < 0.1:
            decoherence_score += 0.4  # مشبوه جداً (bot attack)
            logger.warning(
                "time_deviation_critical",
                ip=ip_address,
                interval=round(time_since_last, 3),
                reason="Request too fast (possible bot)",
            )
        elif time_deviation > 3.0:
            # انحراف كبير (إما سريع جداً أو بطيء جداً)
            decoherence_score += min(0.3, time_deviation * 0.05)

    # ─────────────────────────────────────────────────────────────────────
    # 2. Path Novelty Analysis — تحليل غرابة المسار
    # ─────────────────────────────────────────────────────────────────────

    # كشف الانتقال المفاجئ لمسارات حساسة
    sensitive_patterns = [
        "/admin",
        "/secret",
        "/api/v1/internal",
        "/debug",
        "/.env",
        "/config",
        "/backup",
        "/sql",
        "/database",
    ]

    is_sensitive = any(pattern in request_path.lower() for pattern in sensitive_patterns)

    if is_sensitive:
        # هل زار المستخدم هذا النوع من المسارات من قبل؟
        similar_paths = [
            p for p in pattern["path_history"]
            if any(sp in p.lower() for sp in sensitive_patterns)
        ]

        if len(similar_paths) == 0:
            # أول مرة يزور مسار حساس - مشبوه جداً!
            decoherence_score += 0.5
            logger.warning(
                "path_novelty_detected",
                ip=ip_address,
                path=request_path,
                reason="First access to sensitive path",
            )
        elif len(similar_paths) < 2:
            # زار مرة أو مرتين فقط - لا يزال مشبوهاً
            decoherence_score += 0.2

    # ─────────────────────────────────────────────────────────────────────
    # 3. Request Burst Detection — كشف انفجار الطلبات
    # ─────────────────────────────────────────────────────────────────────

    # حساب عدد الطلبات في آخر 10 ثوانٍ
    recent_window = 10.0
    time_since_first = current_time - pattern["first_seen"]

    if time_since_first < recent_window and pattern["total_requests"] > 10:
        # أكثر من 10 طلبات في أول 10 ثوانٍ - burst attack
        burst_rate = pattern["total_requests"] / max(time_since_first, 1.0)
        if burst_rate > 5.0:  # أكثر من 5 طلبات/ثانية
            decoherence_score += min(0.4, burst_rate * 0.05)
            logger.warning(
                "request_burst_detected",
                ip=ip_address,
                rate=round(burst_rate, 2),
                reason="High request rate detected",
            )

    # ─────────────────────────────────────────────────────────────────────
    # 4. Behavioral Entropy — الإنتروبيا السلوكية
    # ─────────────────────────────────────────────────────────────────────

    # حساب تنوع المسارات (Shannon Entropy)
    if len(pattern["path_history"]) > 3:
        unique_paths = set(pattern["path_history"])
        entropy = calculate_shannon_entropy(pattern["path_history"])

        # إنتروبيا عالية جداً = فوضى (سلوك عشوائي)
        # إنتروبيا منخفضة جداً = تكرار ممل (bot يعيد نفس الطلب)
        if entropy > 3.5:
            decoherence_score += 0.2  # فوضى مشبوهة
        elif entropy < 0.5 and len(unique_paths) < 3:
            decoherence_score += 0.15  # تكرار ممل (bot)

    # ─────────────────────────────────────────────────────────────────────
    # النتيجة النهائية
    # ─────────────────────────────────────────────────────────────────────

    final_decoherence = min(1.0, decoherence_score)

    # تحديث سجل الانهيارات
    pattern["decoherence_history"].append(
        {"timestamp": current_time, "score": final_decoherence, "path": request_path}
    )

    # الحفاظ على آخر 20 قياس فقط
    if len(pattern["decoherence_history"]) > 20:
        pattern["decoherence_history"] = pattern["decoherence_history"][-20:]

    if final_decoherence > DECOHERENCE_THRESHOLD_HIGH:
        logger.warning(
            "decoherence_high",
            ip=ip_address,
            score=round(final_decoherence, 3),
            path=request_path,
        )

    return final_decoherence


def calculate_shannon_entropy(path_list: List[str]) -> float:
    """
    حساب إنتروبيا شانون للمسارات.

    الإنتروبيا تقيس مدى "العشوائية" أو "التنوع" في البيانات.

    Args:
        path_list: قائمة المسارات المزارة

    Returns:
        float: قيمة الإنتروبيا (0 = تكرار كامل، عالي = تنوع/فوضى)
    """
    if not path_list:
        return 0.0

    # حساب تكرارات كل مسار
    from collections import Counter

    path_counts = Counter(path_list)
    total = len(path_list)

    # حساب الإنتروبيا: H = -Σ(p(x) × log₂(p(x)))
    entropy = 0.0
    for count in path_counts.values():
        probability = count / total
        if probability > 0:
            entropy -= probability * math.log2(probability)

    return entropy


# ═══════════════════════════════════════════════════════════════════════════
# Risk Assessment — تقييم المخاطر
# ═══════════════════════════════════════════════════════════════════════════


def assess_risk(
    trust_score: float, decoherence_score: float, request_count: int
) -> Tuple[bool, str]:
    """
    تقييم المخاطر بناءً على مزيج من الثقة والانهيار ومعدل الطلبات.

    القرارات:
    1. DECOHERENCE_DETECTED: انهيار سلوكي عالٍ (يحظر حتى مع ثقة عالية)
    2. LOW_TRUST_BANNED: ثقة منخفضة جداً (حظر دائم)
    3. RATE_LIMITED_THROTTLE: تجاوز حدود الطلبات (تقييد مؤقت)
    4. CAPTCHA_CHALLENGE: مشبوه لكن ليس خطراً كافياً (تحدي CAPTCHA)
    5. OK: كل شيء طبيعي (السماح بالمرور)

    Args:
        trust_score: درجة الثقة (0.0 - 1.0)
        decoherence_score: درجة الانهيار (0.0 - 1.0)
        request_count: عدد الطلبات في النافذة الزمنية الحالية

    Returns:
        Tuple[bool, str]: (allowed: True/False, action: نوع الإجراء)
    """

    # ─────────────────────────────────────────────────────────────────────
    # Layer 1: Decoherence Detection (أعلى أولوية)
    # ─────────────────────────────────────────────────────────────────────

    if decoherence_score >= DECOHERENCE_THRESHOLD_CRITICAL:
        # انهيار حرج - حظر فوري
        logger.error(
            "critical_decoherence",
            trust=round(trust_score, 3),
            decoherence=round(decoherence_score, 3),
            action="BANNED",
        )
        return False, "DECOHERENCE_CRITICAL"

    if decoherence_score >= DECOHERENCE_THRESHOLD_HIGH:
        # انهيار عالٍ - حتى لو كانت الثقة عالية
        logger.warning(
            "high_decoherence",
            trust=round(trust_score, 3),
            decoherence=round(decoherence_score, 3),
            action="BLOCKED",
        )
        return False, "DECOHERENCE_DETECTED"

    # ─────────────────────────────────────────────────────────────────────
    # Layer 2: Trust Score Evaluation
    # ─────────────────────────────────────────────────────────────────────

    if trust_score < 0.15 and request_count > 5:
        # ثقة منخفضة جداً + نشاط متكرر = حظر
        logger.warning(
            "low_trust_banned",
            trust=round(trust_score, 3),
            requests=request_count,
            action="BANNED",
        )
        return False, "LOW_TRUST_BANNED"

    if trust_score < 0.3 and decoherence_score > 0.3:
        # ثقة منخفضة + انهيار متوسط = تحدي CAPTCHA
        logger.info(
            "captcha_required",
            trust=round(trust_score, 3),
            decoherence=round(decoherence_score, 3),
        )
        return False, "CAPTCHA_CHALLENGE"

    # ─────────────────────────────────────────────────────────────────────
    # Layer 3: Rate Limiting (التقليدي)
    # ─────────────────────────────────────────────────────────────────────

    # حدود ديناميكية بناءً على درجة الثقة
    if trust_score > 0.8:
        rate_limit = 200  # مستخدمون موثوقون جداً
    elif trust_score > 0.5:
        rate_limit = 100  # مستخدمون عاديون
    else:
        rate_limit = 50  # مستخدمون مشبوهون

    if request_count > rate_limit:
        logger.info(
            "rate_limit_exceeded",
            trust=round(trust_score, 3),
            requests=request_count,
            limit=rate_limit,
        )
        return False, "RATE_LIMITED_THROTTLE"

    # ─────────────────────────────────────────────────────────────────────
    # Layer 4: All Clear
    # ─────────────────────────────────────────────────────────────────────

    return True, "OK"


# ═══════════════════════════════════════════════════════════════════════════
# Pattern Database Management — إدارة قاعدة بيانات الأنماط
# ═══════════════════════════════════════════════════════════════════════════


def get_pattern_stats() -> Dict:
    """
    الحصول على إحصائيات قاعدة بيانات الأنماط.

    Returns:
        Dict: إحصائيات شاملة عن الأنماط المسجلة
    """
    total_ips = len(MOCK_PATTERN_DATABASE)
    trusted_ips = sum(
        1 for p in MOCK_PATTERN_DATABASE.values() if p.get("trust_score", 0) > 0.7
    )
    suspicious_ips = sum(
        1 for p in MOCK_PATTERN_DATABASE.values() if p.get("trust_score", 0) < 0.3
    )

    return {
        "total_tracked_ips": total_ips,
        "trusted_ips": trusted_ips,
        "suspicious_ips": suspicious_ips,
        "neutral_ips": total_ips - trusted_ips - suspicious_ips,
    }


def clear_pattern_database() -> None:
    """
    مسح قاعدة بيانات الأنماط (للاختبارات فقط).
    """
    MOCK_PATTERN_DATABASE.clear()
    logger.info("pattern_database_cleared")
