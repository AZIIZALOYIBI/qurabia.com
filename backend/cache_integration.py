"""
Cache Integration for Backend Services
دمج نظام التخزين المؤقت في خدمات الخلفية

This module provides cached versions of expensive operations
and integrates caching into existing services.
"""

from __future__ import annotations

import logging
from typing import Any

from cache_manager import async_cached, cached, get_cache

logger = logging.getLogger("CacheIntegration")


# ── Cached AUTDIE Computation ────────────────────────────────────────────────
@cached(ttl=3600, key_prefix="autdie:")
def compute_autdie_cached(kappa: float, lam: float) -> dict[str, Any]:
    """
    Cached AUTDIE quantum security metrics computation

    Args:
        kappa: Kappa parameter (0.0 to π)
        lam: Lambda parameter (0.0 to 10.0)

    Returns:
        AUTDIE metrics with security status
    """
    import math

    sin_k = math.sin(kappa)
    sin_kappa_sq = sin_k * sin_k
    v_ent = 1.0
    s_autdie = math.tanh(sin_kappa_sq * v_ent)
    qber_autdie = 0.25 * math.exp(-sin_kappa_sq * v_ent)

    return {
        "S_AUTDIE": s_autdie,
        "QBER_AUTDIE": qber_autdie,
        "secure": s_autdie >= 0.35,
        "cached": True,
    }


# ── Cached Al-Utaibi Equation v2.0 ────────────────────────────────────────────
@cached(ttl=3600, key_prefix="alutaibi:")
def compute_al_utaibi_v2_cached(r: float, rho_dm: float, rho_de: float) -> dict[str, Any]:
    """
    Cached Al-Utaibi Unified Cosmic Equation v2.0 computation

    Args:
        r: Planck length parameter
        rho_dm: Dark matter density
        rho_de: Dark energy density

    Returns:
        Energy calculations and cosmic parameters
    """
    h = 6.626e-34
    nu = 5e9
    alpha = 25.3
    beta = 0.9985
    Q = 1.0
    k_dm = 0.26
    k_de = 0.70
    fine_tuning = 0.937
    planck_length = 1.616e-35

    E_basic = h * nu
    otaibi_factor = (1 + alpha * Q) * beta
    E_v1 = E_basic * otaibi_factor

    dark_correction = 1 + (k_dm * rho_dm) + (k_de * rho_de)
    qm_effect = 0.539 if r <= planck_length else 1.0

    E_total = E_v1 * dark_correction * qm_effect * fine_tuning

    return {
        "E_basic": E_basic,
        "otaibi_factor": otaibi_factor,
        "E_v1": E_v1,
        "dark_correction": dark_correction,
        "qm_effect": qm_effect,
        "E_total": E_total,
        "eV": E_total * 6.242e18,
        "cached": True,
    }


# ── Cache Statistics Endpoint ─────────────────────────────────────────────────
def get_cache_statistics() -> dict[str, Any]:
    """
    Get comprehensive cache statistics

    Returns:
        Cache metrics and performance data
    """
    cache = get_cache()
    stats = cache.get_stats()

    return {
        "cache": stats.to_dict(),
        "status": "healthy" if stats.hit_rate > 0.5 else "degraded" if stats.hit_rate > 0.2 else "poor",
        "recommendations": _generate_cache_recommendations(stats),
    }


def _generate_cache_recommendations(stats: Any) -> list[str]:
    """Generate cache optimization recommendations based on stats"""
    recommendations = []

    if stats.hit_rate < 0.3:
        recommendations.append("Low cache hit rate - consider increasing TTL or cache size")

    if stats.size_bytes > 0.9 * get_cache()._max_memory_bytes:
        recommendations.append("Cache near memory limit - consider increasing max_memory_bytes")

    if stats.evictions > stats.hits:
        recommendations.append("High eviction rate - cache may be too small for workload")

    if stats.expired > stats.hits:
        recommendations.append("High expiry rate - consider increasing TTL values")

    if not recommendations:
        recommendations.append("Cache performance is optimal")

    return recommendations


# ── Cache Warming for Common Patterns ─────────────────────────────────────────
def warm_cache_common_autdie_values() -> int:
    """Pre-warm cache with common AUTDIE parameter combinations"""
    common_params = [
        (0.7854, 1.0),  # Default values
        (0.0, 1.0),  # Minimum kappa
        (1.5708, 1.0),  # π/2
        (3.1416, 1.0),  # π
        (0.7854, 0.0),  # Min lambda
        (0.7854, 10.0),  # Max lambda
    ]

    cached_count = 0
    for kappa, lam in common_params:
        try:
            compute_autdie_cached(kappa, lam)
            cached_count += 1
        except Exception as e:
            logger.warning(f"Failed to warm cache for AUTDIE({kappa}, {lam}): {e}")

    logger.info(f"Warmed AUTDIE cache with {cached_count} common parameter sets")
    return cached_count


def warm_cache_common_al_utaibi_values() -> int:
    """Pre-warm cache with common Al-Utaibi parameter combinations"""
    common_params = [
        (1.616e-35, 1.8e10, 1e-10),  # Default values
        (1e-34, 1.8e10, 1e-10),  # Above Planck length
        (1e-36, 1.8e10, 1e-10),  # Below Planck length
        (1.616e-35, 1e10, 1e-10),  # Low DM density
        (1.616e-35, 1e11, 1e-10),  # High DM density
        (1.616e-35, 1.8e10, 1e-11),  # Low DE density
    ]

    cached_count = 0
    for r, rho_dm, rho_de in common_params:
        try:
            compute_al_utaibi_v2_cached(r, rho_dm, rho_de)
            cached_count += 1
        except Exception as e:
            logger.warning(f"Failed to warm cache for Al-Utaibi({r}, {rho_dm}, {rho_de}): {e}")

    logger.info(f"Warmed Al-Utaibi cache with {cached_count} common parameter sets")
    return cached_count


# ── Cache Invalidation Helpers ────────────────────────────────────────────────
def invalidate_autdie_cache() -> int:
    """Invalidate all AUTDIE cache entries"""
    cache = get_cache()
    count = cache.invalidate_pattern("autdie:*")
    logger.info(f"Invalidated {count} AUTDIE cache entries")
    return count


def invalidate_al_utaibi_cache() -> int:
    """Invalidate all Al-Utaibi cache entries"""
    cache = get_cache()
    count = cache.invalidate_pattern("alutaibi:*")
    logger.info(f"Invalidated {count} Al-Utaibi cache entries")
    return count


def clear_all_caches() -> dict[str, Any]:
    """Clear all caches and return statistics"""
    cache = get_cache()
    stats_before = cache.get_stats()

    cache.clear()

    return {
        "cleared": True,
        "entries_removed": stats_before.entry_count,
        "bytes_freed": stats_before.size_bytes,
    }


# ── Health Check Integration ──────────────────────────────────────────────────
def get_cache_health() -> dict[str, Any]:
    """Get cache health status for inclusion in health checks"""
    cache = get_cache()
    stats = cache.get_stats()

    return {
        "status": "healthy" if stats.entry_count > 0 else "empty",
        "hit_rate": round(stats.hit_rate, 4),
        "entries": stats.entry_count,
        "size_mb": round(stats.size_bytes / (1024 * 1024), 2),
    }
