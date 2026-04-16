"""
Tests for Cache Manager
اختبارات مدير التخزين المؤقت

Tests cover:
- Basic cache operations (get, set, delete)
- TTL and expiration
- LRU eviction
- Memory limits
- Cache decorators
- Thread safety
- Statistics tracking
"""

import time
import threading
import pytest
from cache_manager import (
    InMemoryCache,
    CacheEvictionPolicy,
    cached,
    async_cached,
    generate_cache_key,
    get_cache,
)


class TestInMemoryCache:
    """Tests for InMemoryCache class"""

    def test_basic_get_set(self):
        """Test basic get and set operations"""
        cache = InMemoryCache(max_size=100)

        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

        cache.set("key2", {"data": "value2"})
        assert cache.get("key2") == {"data": "value2"}

    def test_cache_miss(self):
        """Test cache miss returns None or default"""
        cache = InMemoryCache()

        assert cache.get("nonexistent") is None
        assert cache.get("nonexistent", "default") == "default"

    def test_cache_delete(self):
        """Test cache deletion"""
        cache = InMemoryCache()

        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

        deleted = cache.delete("key1")
        assert deleted is True
        assert cache.get("key1") is None

        # Delete non-existent key
        deleted = cache.delete("nonexistent")
        assert deleted is False

    def test_ttl_expiration(self):
        """Test TTL expiration"""
        cache = InMemoryCache()

        # Set with 0.1 second TTL
        cache.set("key1", "value1", ttl=0.1)
        assert cache.get("key1") == "value1"

        # Wait for expiration
        time.sleep(0.15)
        assert cache.get("key1") is None

        # Check stats
        stats = cache.get_stats()
        assert stats.expired > 0

    def test_default_ttl(self):
        """Test default TTL"""
        cache = InMemoryCache(default_ttl=0.1)

        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

        time.sleep(0.15)
        assert cache.get("key1") is None

    def test_lru_eviction(self):
        """Test LRU eviction policy"""
        cache = InMemoryCache(max_size=3, eviction_policy=CacheEvictionPolicy.LRU)

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        # Access key1 to make it recent
        cache.get("key1")

        # Add key4, should evict key2 (least recently used)
        cache.set("key4", "value4")

        assert cache.get("key1") == "value1"  # Still exists
        assert cache.get("key2") is None  # Evicted
        assert cache.get("key3") == "value3"  # Still exists
        assert cache.get("key4") == "value4"  # New entry

    def test_size_limit(self):
        """Test cache size limit"""
        cache = InMemoryCache(max_size=3)

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        stats = cache.get_stats()
        assert stats.entry_count == 3

        cache.set("key4", "value4")

        stats = cache.get_stats()
        assert stats.entry_count == 3  # Still 3 due to eviction
        assert stats.evictions > 0

    def test_memory_limit(self):
        """Test memory limit enforcement"""
        # Create cache with very small memory limit
        cache = InMemoryCache(max_memory_bytes=1024)

        # Add large entries
        large_data = "x" * 500
        cache.set("key1", large_data)
        cache.set("key2", large_data)
        cache.set("key3", large_data)

        stats = cache.get_stats()
        # Should have evicted some entries
        assert stats.size_bytes <= 1024

    def test_clear(self):
        """Test cache clear"""
        cache = InMemoryCache()

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") is None

        stats = cache.get_stats()
        assert stats.entry_count == 0
        assert stats.size_bytes == 0

    def test_invalidate_pattern(self):
        """Test pattern-based invalidation"""
        cache = InMemoryCache()

        cache.set("user:1", "data1")
        cache.set("user:2", "data2")
        cache.set("user:3", "data3")
        cache.set("post:1", "post1")
        cache.set("post:2", "post2")

        # Invalidate all user entries
        count = cache.invalidate_pattern("user:*")
        assert count == 3

        assert cache.get("user:1") is None
        assert cache.get("user:2") is None
        assert cache.get("user:3") is None
        assert cache.get("post:1") == "post1"
        assert cache.get("post:2") == "post2"

    def test_statistics(self):
        """Test statistics tracking"""
        cache = InMemoryCache()

        # Initial stats
        stats = cache.get_stats()
        assert stats.hits == 0
        assert stats.misses == 0

        # Cache miss
        cache.get("nonexistent")
        stats = cache.get_stats()
        assert stats.misses == 1

        # Cache hit
        cache.set("key1", "value1")
        cache.get("key1")
        stats = cache.get_stats()
        assert stats.hits == 1

        # Hit rate
        assert stats.hit_rate > 0

    def test_thread_safety(self):
        """Test thread-safe operations"""
        cache = InMemoryCache(max_size=1000)
        errors = []

        def worker(worker_id: int):
            try:
                for i in range(100):
                    key = f"key_{worker_id}_{i}"
                    cache.set(key, f"value_{worker_id}_{i}")
                    value = cache.get(key)
                    if value != f"value_{worker_id}_{i}":
                        errors.append(f"Value mismatch for {key}")
            except Exception as e:
                errors.append(str(e))

        # Run 10 workers concurrently
        threads = [threading.Thread(target=worker, args=(i,)) for i in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0, f"Thread safety errors: {errors}"


class TestCacheKey:
    """Tests for cache key generation"""

    def test_generate_key_deterministic(self):
        """Test cache key generation is deterministic"""
        key1 = generate_cache_key("arg1", "arg2", kwarg1="val1", kwarg2="val2")
        key2 = generate_cache_key("arg1", "arg2", kwarg1="val1", kwarg2="val2")
        assert key1 == key2

    def test_generate_key_different_args(self):
        """Test different args produce different keys"""
        key1 = generate_cache_key("arg1", "arg2")
        key2 = generate_cache_key("arg1", "arg3")
        assert key1 != key2

    def test_generate_key_kwargs_order(self):
        """Test kwargs order doesn't matter"""
        key1 = generate_cache_key(a="1", b="2", c="3")
        key2 = generate_cache_key(c="3", a="1", b="2")
        assert key1 == key2


class TestCachedDecorator:
    """Tests for @cached decorator"""

    def test_basic_caching(self):
        """Test basic function caching"""
        call_count = 0

        @cached(ttl=1)
        def expensive_function(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2

        result1 = expensive_function(5)
        result2 = expensive_function(5)

        assert result1 == result2 == 10
        assert call_count == 1  # Only called once

    def test_different_args(self):
        """Test caching with different arguments"""
        call_count = 0

        @cached()
        def add(a: int, b: int) -> int:
            nonlocal call_count
            call_count += 1
            return a + b

        result1 = add(1, 2)
        result2 = add(1, 2)
        result3 = add(2, 3)

        assert result1 == result2 == 3
        assert result3 == 5
        assert call_count == 2  # Called twice for different args

    def test_key_prefix(self):
        """Test cache key prefix"""

        @cached(key_prefix="func1:")
        def func1(x: int) -> int:
            return x * 2

        @cached(key_prefix="func2:")
        def func2(x: int) -> int:
            return x * 3

        # Different prefixes, same args
        result1 = func1(5)
        result2 = func2(5)

        assert result1 == 10
        assert result2 == 15

    def test_invalidate(self):
        """Test cache invalidation"""

        @cached()
        def get_data(key: str) -> str:
            return f"data_{key}"

        result1 = get_data("test")
        assert result1 == "data_test"

        # Invalidate specific key
        get_data.invalidate("test")

        # Should recompute
        result2 = get_data("test")
        assert result2 == "data_test"

    def test_invalidate_all(self):
        """Test invalidate all function cache"""

        @cached()
        def get_data(key: str) -> str:
            return f"data_{key}"

        get_data("key1")
        get_data("key2")
        get_data("key3")

        # Invalidate all
        get_data.invalidate_all()

        # All should be recomputed
        cache = get_cache()
        stats_before = cache.get_stats()
        entry_count_before = stats_before.entry_count

        # These should all be cache misses now
        get_data("key1")
        get_data("key2")
        get_data("key3")


class TestAsyncCachedDecorator:
    """Tests for @async_cached decorator"""

    @pytest.mark.asyncio
    async def test_async_basic_caching(self):
        """Test async function caching"""
        call_count = 0

        @async_cached(ttl=1)
        async def async_expensive_function(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2

        result1 = await async_expensive_function(5)
        result2 = await async_expensive_function(5)

        assert result1 == result2 == 10
        assert call_count == 1  # Only called once

    @pytest.mark.asyncio
    async def test_async_different_args(self):
        """Test async caching with different arguments"""
        call_count = 0

        @async_cached()
        async def async_add(a: int, b: int) -> int:
            nonlocal call_count
            call_count += 1
            return a + b

        result1 = await async_add(1, 2)
        result2 = await async_add(1, 2)
        result3 = await async_add(2, 3)

        assert result1 == result2 == 3
        assert result3 == 5
        assert call_count == 2


class TestGlobalCache:
    """Tests for global cache instance"""

    def test_get_cache_singleton(self):
        """Test get_cache returns same instance"""
        cache1 = get_cache()
        cache2 = get_cache()
        assert cache1 is cache2

    def test_get_cache_persistence(self):
        """Test global cache persists data"""
        cache = get_cache()
        cache.set("test_key", "test_value")

        cache2 = get_cache()
        assert cache2.get("test_key") == "test_value"
