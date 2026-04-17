"""
Cache Service — خدمة الذاكرة المؤقتة باستخدام Redis
====================================================

توفر هذه الخدمة طبقة تخزين مؤقت عالية الأداء باستخدام Redis لتسريع
الاستجابات وتقليل الضغط على قاعدة البيانات والعمليات الحسابية الثقيلة.

الميزات:
1. تخزين مؤقت ذكي مع انتهاء صلاحية تلقائي (TTL)
2. معالجة آمنة للأخطاء مع Graceful Degradation
3. دعم تسلسل JSON للبيانات المعقدة
4. إبطال انتقائي للذاكرة المؤقتة (Cache Invalidation)

الاستخدام:
    from cache_service import get_cache, set_cache, invalidate_cache

    # محاولة الحصول على بيانات من الـ cache
    cached_data = get_cache("my-key")
    if cached_data:
        return cached_data

    # إذا لم توجد، احسب وخزّن
    result = expensive_computation()
    set_cache("my-key", result, expiry_seconds=3600)
"""

import json
import os
from typing import Any

import structlog
from redis import ConnectionError as RedisConnectionError
from redis import Redis
from redis import TimeoutError as RedisTimeoutError

logger = structlog.get_logger("qurabia.cache")


# ═══════════════════════════════════════════════════════════════
# Redis Client Initialization
# ═══════════════════════════════════════════════════════════════


def _init_redis_client() -> Redis | None:
    """
    تهيئة Redis client مع معالجة آمنة للأخطاء

    Returns:
        Redis client أو None إذا فشل الاتصال
    """
    redis_host = os.environ.get("REDIS_HOST", "redis")
    redis_port = int(os.environ.get("REDIS_PORT", "6379"))

    try:
        client = Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True,  # تلقائي decode من bytes إلى strings
            socket_connect_timeout=2,  # timeout سريع للاتصال
            socket_timeout=2,  # timeout سريع للعمليات
            retry_on_timeout=True,  # إعادة المحاولة عند timeout
            health_check_interval=30,  # فحص صحة الاتصال كل 30 ثانية
        )

        # اختبار الاتصال الفوري
        client.ping()
        logger.info(
            "redis_connected",
            host=redis_host,
            port=redis_port,
            msg="✅ Redis connection established successfully",
        )
        return client

    except (RedisConnectionError, RedisTimeoutError, OSError) as exc:
        logger.warning(
            "redis_connection_failed",
            host=redis_host,
            port=redis_port,
            error=str(exc),
            msg="❌ Redis connection failed - caching will be disabled",
        )
        return None
    except Exception as exc:
        logger.error(
            "redis_init_error",
            error=str(exc),
            msg="❌ Unexpected error during Redis initialization",
        )
        return None


# تهيئة Redis client عند استيراد الموديول
redis_client = _init_redis_client()


# ═══════════════════════════════════════════════════════════════
# Core Caching Functions
# ═══════════════════════════════════════════════════════════════


def get_cache(key: str) -> Any | None:
    """
    استرداد البيانات من ذاكرة التخزين المؤقت (Redis)

    Args:
        key: مفتاح الـ cache

    Returns:
        البيانات المُخزنة أو None إذا لم توجد أو فشل الاتصال
    """
    if not redis_client:
        return None

    try:
        cached_data = redis_client.get(key)

        if cached_data:
            logger.debug("cache_hit", key=key, msg=f"✅ Cache Hit for key: {key}")
            # فك JSON encoding
            return json.loads(cached_data)
        else:
            logger.debug("cache_miss", key=key, msg=f"❌ Cache Miss for key: {key}")
            return None

    except (RedisConnectionError, RedisTimeoutError) as exc:
        logger.warning(
            "cache_get_error",
            key=key,
            error=str(exc),
            msg="❌ Redis connection lost during GET",
        )
        return None
    except json.JSONDecodeError as exc:
        logger.error(
            "cache_decode_error",
            key=key,
            error=str(exc),
            msg="❌ Failed to decode cached JSON data",
        )
        # إبطال البيانات الفاسدة
        invalidate_cache(key)
        return None
    except Exception as exc:
        logger.error(
            "cache_get_unexpected_error",
            key=key,
            error=str(exc),
            msg="❌ Unexpected error during cache GET",
        )
        return None


def set_cache(key: str, data: Any, expiry_seconds: int = 3600) -> bool:
    """
    تخزين البيانات في ذاكرة التخزين المؤقت (Redis) لمدة محددة

    Args:
        key: مفتاح الـ cache
        data: البيانات المراد تخزينها (يجب أن تكون قابلة للتسلسل JSON)
        expiry_seconds: مدة الصلاحية بالثواني (افتراضياً: ساعة واحدة)

    Returns:
        True إذا نجح التخزين، False في حالة الفشل
    """
    if not redis_client:
        logger.debug(
            "cache_unavailable",
            msg="❌ Cannot cache: Redis client is unavailable",
        )
        return False

    try:
        # تسلسل البيانات إلى JSON
        json_data = json.dumps(data, ensure_ascii=False)

        # تخزين مع انتهاء صلاحية تلقائي
        redis_client.setex(key, expiry_seconds, json_data)

        logger.debug(
            "cache_set",
            key=key,
            expiry=expiry_seconds,
            size_bytes=len(json_data),
            msg=f"💾 Cache Set successfully for key: {key} (Expires in {expiry_seconds}s)",
        )
        return True

    except (RedisConnectionError, RedisTimeoutError) as exc:
        logger.warning(
            "cache_set_error",
            key=key,
            error=str(exc),
            msg="❌ Redis connection lost during SET",
        )
        return False
    except (TypeError, ValueError) as exc:
        logger.error(
            "cache_encode_error",
            key=key,
            error=str(exc),
            msg="❌ Failed to encode data to JSON",
        )
        return False
    except Exception as exc:
        logger.error(
            "cache_set_unexpected_error",
            key=key,
            error=str(exc),
            msg="❌ Unexpected error during cache SET",
        )
        return False


def invalidate_cache(key: str) -> bool:
    """
    إزالة المفتاح من ذاكرة التخزين المؤقت

    Args:
        key: مفتاح الـ cache المراد إزالته

    Returns:
        True إذا نجحت الإزالة، False في حالة الفشل
    """
    if not redis_client:
        return False

    try:
        deleted_count = redis_client.delete(key)

        if deleted_count > 0:
            logger.debug(
                "cache_invalidated",
                key=key,
                msg=f"🗑️ Cache invalidated for key: {key}",
            )
        else:
            logger.debug(
                "cache_invalidate_no_key",
                key=key,
                msg=f"ℹ️ Key not found during invalidation: {key}",
            )

        return True

    except (RedisConnectionError, RedisTimeoutError) as exc:
        logger.warning(
            "cache_invalidate_error",
            key=key,
            error=str(exc),
            msg="❌ Redis connection lost during DELETE",
        )
        return False
    except Exception as exc:
        logger.error(
            "cache_invalidate_unexpected_error",
            key=key,
            error=str(exc),
            msg="❌ Unexpected error during cache invalidation",
        )
        return False


def invalidate_pattern(pattern: str) -> int:
    """
    إزالة جميع المفاتيح التي تطابق النمط المحدد

    مفيد لإبطال مجموعات من الـ cache بشكل جماعي.
    مثال: invalidate_pattern("fingerprint:*") يزيل جميع البصمات المُخزنة

    Args:
        pattern: نمط المفاتيح (مثل: "user:*", "fingerprint:192.*")

    Returns:
        عدد المفاتيح المحذوفة
    """
    if not redis_client:
        return 0

    try:
        # البحث عن جميع المفاتيح المطابقة
        keys = redis_client.keys(pattern)

        if not keys:
            logger.debug(
                "cache_invalidate_pattern_no_match",
                pattern=pattern,
                msg=f"ℹ️ No keys matched pattern: {pattern}",
            )
            return 0

        # حذف جميع المفاتيح
        deleted_count = redis_client.delete(*keys)

        logger.info(
            "cache_invalidate_pattern",
            pattern=pattern,
            count=deleted_count,
            msg=f"🗑️ Invalidated {deleted_count} keys matching pattern: {pattern}",
        )
        return deleted_count

    except (RedisConnectionError, RedisTimeoutError) as exc:
        logger.warning(
            "cache_invalidate_pattern_error",
            pattern=pattern,
            error=str(exc),
            msg="❌ Redis connection lost during pattern invalidation",
        )
        return 0
    except Exception as exc:
        logger.error(
            "cache_invalidate_pattern_unexpected_error",
            pattern=pattern,
            error=str(exc),
            msg="❌ Unexpected error during pattern invalidation",
        )
        return 0


def get_cache_stats() -> dict[str, Any]:
    """
    الحصول على إحصائيات الذاكرة المؤقتة

    Returns:
        قاموس يحتوي على معلومات عن Redis وإحصائياته
    """
    if not redis_client:
        return {
            "available": False,
            "error": "Redis client not initialized",
        }

    try:
        info = redis_client.info()

        return {
            "available": True,
            "redis_version": info.get("redis_version", "unknown"),
            "used_memory_human": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "total_commands_processed": info.get("total_commands_processed", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
            "hit_rate": _calculate_hit_rate(
                info.get("keyspace_hits", 0),
                info.get("keyspace_misses", 0),
            ),
        }

    except (RedisConnectionError, RedisTimeoutError) as exc:
        logger.warning(
            "cache_stats_error",
            error=str(exc),
            msg="❌ Failed to retrieve cache stats",
        )
        return {
            "available": False,
            "error": str(exc),
        }
    except Exception as exc:
        logger.error(
            "cache_stats_unexpected_error",
            error=str(exc),
            msg="❌ Unexpected error getting cache stats",
        )
        return {
            "available": False,
            "error": str(exc),
        }


def _calculate_hit_rate(hits: int, misses: int) -> float:
    """حساب معدل إصابة الـ cache (Hit Rate)"""
    total = hits + misses
    if total == 0:
        return 0.0
    return round((hits / total) * 100, 2)


# ═══════════════════════════════════════════════════════════════
# Utility: Cache Key Generators
# ═══════════════════════════════════════════════════════════════


def generate_fingerprint_key(source_ip: str, seed: str | None = None) -> str:
    """
    توليد مفتاح cache للبصمة الكمومية

    Args:
        source_ip: عنوان IP
        seed: seed اختياري

    Returns:
        مفتاح الـ cache
    """
    if seed:
        return f"fingerprint:{source_ip}:{seed}"
    return f"fingerprint:{source_ip}:default"


def generate_multipath_key(target_url: str, path_count: int) -> str:
    """
    توليد مفتاح cache للتشفير متعدد المسارات

    Args:
        target_url: عنوان URL الهدف
        path_count: عدد المسارات

    Returns:
        مفتاح الـ cache
    """
    # استخدام hash للـ URL لتقليل طول المفتاح
    import hashlib

    url_hash = hashlib.sha256(target_url.encode()).hexdigest()[:16]
    return f"multipath:{url_hash}:{path_count}"
