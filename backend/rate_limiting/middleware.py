"""
Rate Limiting Middleware — الحماية متعددة الطبقات
==================================================

يطبق هذا الـ middleware حماية شاملة ضد الهجمات من خلال 4 طبقات:

Layer 1: IP-Based Rate Limiting (Redis)
  - حد عام: 100 req/min لكل IP
  - Sliding window عبر Redis

Layer 2: Trust Score Evaluation
  - حساب درجة الثقة الكمومية
  - اضمحلال طبيعي مع الوقت

Layer 3: Decoherence Detection
  - كشف الانحراف السلوكي
  - تحليل الأنماط غير الطبيعية

Layer 4: Multi-Factor Risk Assessment
  - دمج جميع المقاييس
  - قرار نهائي: ALLOW / BLOCK / THROTTLE / CAPTCHA

المؤلف: AZIIZALOYIBI (عبدالعزيز بن سلطان العتيبي)
التاريخ: 2026-04-17
"""

import os
from typing import Callable

import structlog
from fastapi import Request, status
from fastapi.responses import JSONResponse

# استيراد محرك الثقة الكمومي
from .quantum_trust_engine import (
    assess_risk,
    calculate_decoherence_score,
    get_trust_score,
    initialize_pattern,
)

logger = structlog.get_logger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# Redis Configuration
# ═══════════════════════════════════════════════════════════════════════════

# في الإنتاج، استخدم Redis حقيقي
# في التطوير، نستخدم cache بسيط في الذاكرة
USE_REDIS = os.getenv("USE_REDIS", "false").lower() == "true"

if USE_REDIS:
    try:
        import redis.asyncio as redis

        REDIS_HOST = os.getenv("REDIS_HOST", "redis")
        REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True,
        )
        logger.info("redis_connected", host=REDIS_HOST, port=REDIS_PORT)
    except Exception as e:
        logger.warning("redis_connection_failed", error=str(e))
        USE_REDIS = False

# Fallback: In-memory cache
if not USE_REDIS:
    from collections import defaultdict
    from time import time

    # Cache بسيط في الذاكرة (للتطوير فقط)
    MEMORY_RATE_CACHE = defaultdict(list)

    def clean_memory_cache():
        """تنظيف الإدخالات القديمة من الذاكرة"""
        current_time = time()
        for ip in list(MEMORY_RATE_CACHE.keys()):
            # إزالة الطلبات الأقدم من دقيقة
            MEMORY_RATE_CACHE[ip] = [
                t for t in MEMORY_RATE_CACHE[ip] if current_time - t < 60
            ]
            if not MEMORY_RATE_CACHE[ip]:
                del MEMORY_RATE_CACHE[ip]


# ═══════════════════════════════════════════════════════════════════════════
# Middleware Implementation
# ═══════════════════════════════════════════════════════════════════════════


async def quantum_rate_limit_middleware(
    request: Request, call_next: Callable
) -> JSONResponse:
    """
    Middleware الحماية الكمومية متعددة الطبقات.

    تدفق العمل:
    1. استخراج IP والمسار
    2. فحص Rate Limiting الأساسي (Redis/Memory)
    3. حساب Trust Score
    4. حساب Decoherence Score
    5. تقييم المخاطر
    6. اتخاذ القرار (ALLOW / BLOCK)

    Args:
        request: طلب FastAPI
        call_next: الدالة التالية في السلسلة

    Returns:
        Response: إما استجابة عادية أو رسالة حظر
    """

    # ─────────────────────────────────────────────────────────────────────
    # Step 1: Extract Request Info
    # ─────────────────────────────────────────────────────────────────────

    ip_address = request.client.host if request.client else "unknown"
    request_path = str(request.url.path)
    request_method = request.method

    # تخطي الحماية لبعض المسارات (health checks, static files)
    BYPASS_PATHS = ["/health", "/docs", "/openapi.json", "/favicon.ico"]
    if any(request_path.startswith(bp) for bp in BYPASS_PATHS):
        return await call_next(request)

    # ─────────────────────────────────────────────────────────────────────
    # Step 2: IP-Based Rate Limiting (Layer 1)
    # ─────────────────────────────────────────────────────────────────────

    rate_key = f"rate:{ip_address}:{request_path}"
    current_count = 0

    try:
        if USE_REDIS:
            # استخدام Redis للـ rate limiting
            current_count = await redis_client.incr(rate_key)
            if current_count == 1:
                # أول طلب - تعيين انتهاء صلاحية 60 ثانية
                await redis_client.expire(rate_key, 60)
        else:
            # استخدام الذاكرة المحلية
            from time import time

            current_time = time()
            clean_memory_cache()  # تنظيف القديم

            # إضافة الطلب الحالي
            MEMORY_RATE_CACHE[f"{ip_address}:{request_path}"].append(current_time)

            # عد الطلبات في آخر دقيقة
            current_count = len(
                [
                    t
                    for t in MEMORY_RATE_CACHE[f"{ip_address}:{request_path}"]
                    if current_time - t < 60
                ]
            )

    except Exception as e:
        logger.error("rate_limit_error", error=str(e), ip=ip_address)
        # في حالة الخطأ، نسمح بالمرور (fail-open)
        current_count = 0

    # ─────────────────────────────────────────────────────────────────────
    # Step 3: Quantum Trust Score (Layer 2)
    # ─────────────────────────────────────────────────────────────────────

    initialize_pattern(ip_address)
    trust_score = get_trust_score(ip_address, request_path)

    # ─────────────────────────────────────────────────────────────────────
    # Step 4: Decoherence Detection (Layer 3)
    # ─────────────────────────────────────────────────────────────────────

    decoherence_score = calculate_decoherence_score(ip_address, request_path)

    # ─────────────────────────────────────────────────────────────────────
    # Step 5: Risk Assessment (Layer 4)
    # ─────────────────────────────────────────────────────────────────────

    allowed, action = assess_risk(trust_score, decoherence_score, current_count)

    # ─────────────────────────────────────────────────────────────────────
    # Step 6: Decision & Response
    # ─────────────────────────────────────────────────────────────────────

    if not allowed:
        # حظر الطلب
        logger.warning(
            "request_blocked",
            ip=ip_address,
            path=request_path,
            method=request_method,
            action=action,
            trust=round(trust_score, 3),
            decoherence=round(decoherence_score, 3),
            count=current_count,
        )

        response_detail = {
            "ok": False,
            "error": "Access denied",
            "reason": action,
            "message": get_block_message(action),
            "metrics": {
                "trust_score": round(trust_score, 3),
                "decoherence_score": round(decoherence_score, 3),
                "request_count": current_count,
            },
            "retry_after": get_retry_after(action),
        }

        status_code = get_status_code(action)

        return JSONResponse(
            content=response_detail,
            status_code=status_code,
            headers={"X-RateLimit-Limit": "dynamic", "X-RateLimit-Remaining": "0"},
        )

    # السماح بالمرور
    logger.debug(
        "request_allowed",
        ip=ip_address,
        path=request_path,
        trust=round(trust_score, 3),
        decoherence=round(decoherence_score, 3),
    )

    # إضافة headers معلوماتية
    response = await call_next(request)
    response.headers["X-Trust-Score"] = str(round(trust_score, 2))
    response.headers["X-Decoherence-Score"] = str(round(decoherence_score, 2))

    return response


# ═══════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════


def get_block_message(action: str) -> str:
    """
    الحصول على رسالة توضيحية حسب نوع الحظر.

    Args:
        action: نوع الإجراء (DECOHERENCE_DETECTED, LOW_TRUST_BANNED, etc.)

    Returns:
        str: رسالة توضيحية للمستخدم
    """
    messages = {
        "DECOHERENCE_CRITICAL": "سلوكك يختلف بشكل كبير عن النمط المعتاد. تم حظر الوصول لأسباب أمنية.",
        "DECOHERENCE_DETECTED": "اكتُشف نمط سلوكي غير معتاد. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.",
        "LOW_TRUST_BANNED": "درجة الثقة منخفضة جداً. تم حظر الوصول.",
        "CAPTCHA_CHALLENGE": "يرجى إكمال تحدي CAPTCHA للتحقق من أنك لست روبوت.",
        "RATE_LIMITED_THROTTLE": "تجاوزت الحد المسموح من الطلبات. يرجى الانتظار قبل المحاولة مرة أخرى.",
    }
    return messages.get(action, "تم رفض الوصول لأسباب أمنية.")


def get_retry_after(action: str) -> int:
    """
    الحصول على وقت الانتظار قبل المحاولة مرة أخرى (بالثواني).

    Args:
        action: نوع الإجراء

    Returns:
        int: عدد الثواني
    """
    retry_times = {
        "DECOHERENCE_CRITICAL": 3600,  # ساعة
        "DECOHERENCE_DETECTED": 300,  # 5 دقائق
        "LOW_TRUST_BANNED": 1800,  # 30 دقيقة
        "CAPTCHA_CHALLENGE": 60,  # دقيقة
        "RATE_LIMITED_THROTTLE": 60,  # دقيقة
    }
    return retry_times.get(action, 300)


def get_status_code(action: str) -> int:
    """
    الحصول على رمز حالة HTTP المناسب.

    Args:
        action: نوع الإجراء

    Returns:
        int: رمز HTTP
    """
    status_codes = {
        "DECOHERENCE_CRITICAL": status.HTTP_403_FORBIDDEN,
        "DECOHERENCE_DETECTED": status.HTTP_403_FORBIDDEN,
        "LOW_TRUST_BANNED": status.HTTP_403_FORBIDDEN,
        "CAPTCHA_CHALLENGE": status.HTTP_429_TOO_MANY_REQUESTS,
        "RATE_LIMITED_THROTTLE": status.HTTP_429_TOO_MANY_REQUESTS,
    }
    return status_codes.get(action, status.HTTP_403_FORBIDDEN)
