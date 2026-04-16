"""
Intelligent Caching Layer for QURABIA Backend
نظام تخزين مؤقت ذكي للواجهة الخلفية

Features:
- In-memory LRU cache with TTL
- Thread-safe operations
- Cache decorators for functions
- Cache invalidation strategies
- Metrics and statistics
- Environment-based configuration
"""

from __future__ import annotations

import functools
import hashlib
import json
import logging
import os
import pickle
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Generic, TypeVar

logger = logging.getLogger("CacheManager")

T = TypeVar("T")
F = TypeVar("F", bound=Callable[..., Any])


class CacheEvictionPolicy(Enum):
    """Cache eviction policies"""

    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    FIFO = "fifo"  # First In First Out


@dataclass
class CacheEntry(Generic[T]):
    """Single cache entry with metadata"""

    key: str
    value: T
    created_at: float
    last_accessed: float
    access_count: int = 0
    ttl: float | None = None
    size_bytes: int = 0

    def is_expired(self) -> bool:
        """Check if entry has expired based on TTL"""
        if self.ttl is None:
            return False
        return (time.time() - self.created_at) > self.ttl

    def touch(self) -> None:
        """Update access metadata"""
        self.last_accessed = time.time()
        self.access_count += 1


@dataclass
class CacheStats:
    """Cache statistics for monitoring"""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    expired: int = 0
    size_bytes: int = 0
    entry_count: int = 0

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate"""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    @property
    def miss_rate(self) -> float:
        """Calculate cache miss rate"""
        return 1.0 - self.hit_rate

    def to_dict(self) -> dict[str, Any]:
        """Convert stats to dictionary"""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "expired": self.expired,
            "size_bytes": self.size_bytes,
            "entry_count": self.entry_count,
            "hit_rate": round(self.hit_rate, 4),
            "miss_rate": round(self.miss_rate, 4),
        }


class InMemoryCache:
    """
    Thread-safe in-memory cache with LRU eviction and TTL support
    """

    def __init__(
        self,
        max_size: int | None = None,
        max_memory_bytes: int | None = None,
        default_ttl: float | None = None,
        eviction_policy: CacheEvictionPolicy = CacheEvictionPolicy.LRU,
    ):
        """
        Initialize cache

        Args:
            max_size: Maximum number of entries (None = unlimited)
            max_memory_bytes: Maximum memory in bytes (None = unlimited)
            default_ttl: Default time-to-live in seconds (None = no expiry)
            eviction_policy: Policy for evicting entries when full
        """
        self._cache: OrderedDict[str, CacheEntry[Any]] = OrderedDict()
        self._lock = threading.RLock()
        self._max_size = max_size
        self._max_memory_bytes = max_memory_bytes
        self._default_ttl = default_ttl
        self._eviction_policy = eviction_policy
        self._stats = CacheStats()

        logger.info(
            f"Initialized cache with max_size={max_size}, "
            f"max_memory_bytes={max_memory_bytes}, "
            f"default_ttl={default_ttl}, "
            f"eviction_policy={eviction_policy.value}"
        )

    def _estimate_size(self, obj: Any) -> int:
        """Estimate object size in bytes"""
        try:
            return len(pickle.dumps(obj))
        except Exception:
            # Fallback for non-picklable objects
            return len(str(obj).encode("utf-8"))

    def _evict_if_needed(self) -> None:
        """Evict entries based on policy if cache is full"""
        # Check size limit
        if self._max_size and len(self._cache) >= self._max_size:
            self._evict_one()

        # Check memory limit
        if self._max_memory_bytes and self._stats.size_bytes >= self._max_memory_bytes:
            while self._stats.size_bytes >= self._max_memory_bytes and self._cache:
                self._evict_one()

    def _evict_one(self) -> None:
        """Evict one entry based on eviction policy"""
        if not self._cache:
            return

        if self._eviction_policy == CacheEvictionPolicy.LRU:
            # Remove least recently used (first in OrderedDict)
            key, entry = self._cache.popitem(last=False)
        elif self._eviction_policy == CacheEvictionPolicy.LFU:
            # Remove least frequently used
            key = min(self._cache.keys(), key=lambda k: self._cache[k].access_count)
            entry = self._cache.pop(key)
        else:  # FIFO
            # Remove oldest (first in OrderedDict)
            key, entry = self._cache.popitem(last=False)

        self._stats.size_bytes -= entry.size_bytes
        self._stats.entry_count -= 1
        self._stats.evictions += 1
        logger.debug(f"Evicted cache entry: {key} (policy={self._eviction_policy.value})")

    def _cleanup_expired(self) -> None:
        """Remove expired entries"""
        expired_keys = [key for key, entry in self._cache.items() if entry.is_expired()]
        for key in expired_keys:
            entry = self._cache.pop(key)
            self._stats.size_bytes -= entry.size_bytes
            self._stats.entry_count -= 1
            self._stats.expired += 1
            logger.debug(f"Removed expired cache entry: {key}")

    def get(self, key: str, default: T | None = None) -> T | None:
        """
        Get value from cache

        Args:
            key: Cache key
            default: Default value if not found

        Returns:
            Cached value or default
        """
        with self._lock:
            self._cleanup_expired()

            entry = self._cache.get(key)
            if entry is None or entry.is_expired():
                self._stats.misses += 1
                return default

            # Update access metadata
            entry.touch()

            # Move to end for LRU
            if self._eviction_policy == CacheEvictionPolicy.LRU:
                self._cache.move_to_end(key)

            self._stats.hits += 1
            return entry.value

    def set(
        self,
        key: str,
        value: Any,
        ttl: float | None = None,
    ) -> None:
        """
        Set value in cache

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (overrides default)
        """
        with self._lock:
            # Remove old entry if exists
            if key in self._cache:
                old_entry = self._cache.pop(key)
                self._stats.size_bytes -= old_entry.size_bytes
                self._stats.entry_count -= 1

            # Create new entry
            size_bytes = self._estimate_size(value)
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=time.time(),
                last_accessed=time.time(),
                ttl=ttl if ttl is not None else self._default_ttl,
                size_bytes=size_bytes,
            )

            # Evict if needed before adding
            self._evict_if_needed()

            # Add to cache
            self._cache[key] = entry
            self._stats.size_bytes += size_bytes
            self._stats.entry_count += 1

            logger.debug(f"Cached entry: {key} (size={size_bytes} bytes, ttl={entry.ttl})")

    def delete(self, key: str) -> bool:
        """
        Delete entry from cache

        Args:
            key: Cache key

        Returns:
            True if deleted, False if not found
        """
        with self._lock:
            entry = self._cache.pop(key, None)
            if entry:
                self._stats.size_bytes -= entry.size_bytes
                self._stats.entry_count -= 1
                logger.debug(f"Deleted cache entry: {key}")
                return True
            return False

    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
            self._stats = CacheStats()
            logger.info("Cleared all cache entries")

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all keys matching pattern

        Args:
            pattern: Pattern to match (supports wildcards *)

        Returns:
            Number of invalidated entries
        """
        import re

        regex_pattern = pattern.replace("*", ".*")
        regex = re.compile(regex_pattern)

        with self._lock:
            matching_keys = [key for key in self._cache.keys() if regex.match(key)]
            for key in matching_keys:
                self.delete(key)
            logger.info(f"Invalidated {len(matching_keys)} entries matching pattern: {pattern}")
            return len(matching_keys)

    def get_stats(self) -> CacheStats:
        """Get cache statistics"""
        with self._lock:
            return CacheStats(
                hits=self._stats.hits,
                misses=self._stats.misses,
                evictions=self._stats.evictions,
                expired=self._stats.expired,
                size_bytes=self._stats.size_bytes,
                entry_count=self._stats.entry_count,
            )

    def reset_stats(self) -> None:
        """Reset statistics counters"""
        with self._lock:
            hits = self._stats.hits
            misses = self._stats.misses
            self._stats.hits = 0
            self._stats.misses = 0
            self._stats.evictions = 0
            self._stats.expired = 0
            logger.info(f"Reset cache stats (previous: hits={hits}, misses={misses})")


# Global cache instances
_GLOBAL_CACHE: InMemoryCache | None = None
_CACHE_LOCK = threading.Lock()


def get_cache() -> InMemoryCache:
    """Get or create global cache instance"""
    global _GLOBAL_CACHE
    if _GLOBAL_CACHE is None:
        with _CACHE_LOCK:
            if _GLOBAL_CACHE is None:
                # Environment-based configuration
                is_production = os.environ.get("APP_ENV") == "production"

                max_size = int(os.environ.get("CACHE_MAX_SIZE", "10000" if is_production else "5000"))
                max_memory_mb = int(os.environ.get("CACHE_MAX_MEMORY_MB", "512" if is_production else "256"))
                default_ttl = float(os.environ.get("CACHE_DEFAULT_TTL", "3600" if is_production else "1800"))

                _GLOBAL_CACHE = InMemoryCache(
                    max_size=max_size,
                    max_memory_bytes=max_memory_mb * 1024 * 1024,
                    default_ttl=default_ttl,
                    eviction_policy=CacheEvictionPolicy.LRU,
                )
    return _GLOBAL_CACHE


def generate_cache_key(*args: Any, **kwargs: Any) -> str:
    """
    Generate consistent cache key from arguments

    Args:
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        Cache key string
    """
    # Convert args/kwargs to deterministic string
    key_parts = []

    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            try:
                key_parts.append(json.dumps(arg, sort_keys=True))
            except (TypeError, ValueError):
                key_parts.append(str(arg))

    for k in sorted(kwargs.keys()):
        v = kwargs[k]
        if isinstance(v, (str, int, float, bool)):
            key_parts.append(f"{k}={v}")
        else:
            try:
                key_parts.append(f"{k}={json.dumps(v, sort_keys=True)}")
            except (TypeError, ValueError):
                key_parts.append(f"{k}={str(v)}")

    key_string = "|".join(key_parts)
    return hashlib.sha256(key_string.encode("utf-8")).hexdigest()


def cached(
    ttl: float | None = None,
    key_prefix: str = "",
    key_func: Callable[..., str] | None = None,
) -> Callable[[F], F]:
    """
    Decorator for caching function results

    Args:
        ttl: Time-to-live in seconds (None = use default)
        key_prefix: Prefix for cache keys
        key_func: Custom function to generate cache key

    Example:
        @cached(ttl=300, key_prefix="user:")
        def get_user(user_id: str) -> dict:
            return fetch_user_from_db(user_id)
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache = get_cache()

            # Generate cache key
            if key_func:
                cache_key = f"{key_prefix}{key_func(*args, **kwargs)}"
            else:
                cache_key = f"{key_prefix}{func.__name__}:{generate_cache_key(*args, **kwargs)}"

            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return result

            # Cache miss - execute function
            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl=ttl)
            return result

        # Add cache control methods
        wrapper.invalidate = lambda *args, **kwargs: get_cache().delete(  # type: ignore
            f"{key_prefix}{func.__name__}:{generate_cache_key(*args, **kwargs)}"
        )
        wrapper.invalidate_all = lambda: get_cache().invalidate_pattern(f"{key_prefix}{func.__name__}:*")  # type: ignore

        return wrapper  # type: ignore

    return decorator


def async_cached(
    ttl: float | None = None,
    key_prefix: str = "",
    key_func: Callable[..., str] | None = None,
) -> Callable[[F], F]:
    """
    Decorator for caching async function results

    Args:
        ttl: Time-to-live in seconds (None = use default)
        key_prefix: Prefix for cache keys
        key_func: Custom function to generate cache key

    Example:
        @async_cached(ttl=300, key_prefix="user:")
        async def get_user(user_id: str) -> dict:
            return await fetch_user_from_db(user_id)
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache = get_cache()

            # Generate cache key
            if key_func:
                cache_key = f"{key_prefix}{key_func(*args, **kwargs)}"
            else:
                cache_key = f"{key_prefix}{func.__name__}:{generate_cache_key(*args, **kwargs)}"

            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return result

            # Cache miss - execute function
            logger.debug(f"Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl=ttl)
            return result

        # Add cache control methods
        wrapper.invalidate = lambda *args, **kwargs: get_cache().delete(  # type: ignore
            f"{key_prefix}{func.__name__}:{generate_cache_key(*args, **kwargs)}"
        )
        wrapper.invalidate_all = lambda: get_cache().invalidate_pattern(f"{key_prefix}{func.__name__}:*")  # type: ignore

        return wrapper  # type: ignore

    return decorator
