"""
Advanced Rate Limiter for QURABIA Backend
==========================================
Multi-tier rate limiting with sliding window algorithm.
Supports in-memory and optional Redis-based distributed rate limiting.

Features:
- Per-IP rate limiting
- Per-user rate limiting
- Per-endpoint custom rules
- Sliding window algorithm for accurate rate limiting
- Rate limit headers in responses
- Automatic cleanup of expired entries
- Thread-safe operations
"""

import hashlib
import time
from collections import defaultdict
from dataclasses import dataclass
from threading import Lock
from typing import Any

from fastapi import Request, Response
from pydantic import BaseModel

# Rate limit tiers
DEFAULT_RATE_LIMITS = {
    "global": {"requests": 1000, "window": 60},  # 1000 req/min globally
    "per_ip": {"requests": 100, "window": 60},  # 100 req/min per IP
    "per_user": {"requests": 500, "window": 60},  # 500 req/min per authenticated user
    "per_endpoint": {
        "/api/auth/register": {"requests": 5, "window": 60},  # 5 registrations/min
        "/api/auth/login": {"requests": 10, "window": 60},  # 10 login attempts/min
        "/api/quantum": {"requests": 50, "window": 60},  # 50 quantum ops/min
        "/api/autdie": {"requests": 30, "window": 60},  # 30 AUTDIE calls/min
        "/api/al-utaibi-v2": {"requests": 30, "window": 60},  # 30 equation calls/min
    },
}


@dataclass
class RateLimitRule:
    """Rate limit rule definition"""

    requests: int  # Max requests allowed
    window: int  # Time window in seconds


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded"""

    def __init__(self, retry_after: int, limit_type: str):
        self.retry_after = retry_after
        self.limit_type = limit_type
        super().__init__(f"Rate limit exceeded for {limit_type}. Retry after {retry_after}s")


class RateLimitInfo(BaseModel):
    """Rate limit information for response headers"""

    limit: int
    remaining: int
    reset: int
    retry_after: int | None = None


class SlidingWindowCounter:
    """
    Sliding window rate limiter using a deque to track timestamps.
    More memory efficient and accurate than fixed window counters.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.timestamps: list[float] = []
        self.lock = Lock()

    def _clean_old_timestamps(self, now: float) -> None:
        """Remove timestamps outside the current window"""
        cutoff = now - self.window_seconds
        # Remove old timestamps from the beginning
        while self.timestamps and self.timestamps[0] < cutoff:
            self.timestamps.pop(0)

    def check_and_add(self, now: float | None = None) -> tuple[bool, int, int]:
        """
        Check if request is allowed and add timestamp if so.
        Returns: (allowed, remaining, reset_timestamp)
        """
        if now is None:
            now = time.time()

        with self.lock:
            self._clean_old_timestamps(now)

            current_count = len(self.timestamps)
            remaining = max(0, self.max_requests - current_count)

            if current_count >= self.max_requests:
                # Calculate when the oldest request will expire
                oldest = self.timestamps[0] if self.timestamps else now
                reset_time = int(oldest + self.window_seconds)
                return False, 0, reset_time

            # Add current timestamp
            self.timestamps.append(now)
            reset_time = int(now + self.window_seconds)
            return True, remaining - 1, reset_time

    def get_info(self, now: float | None = None) -> tuple[int, int]:
        """Get current count and reset time without adding a timestamp"""
        if now is None:
            now = time.time()

        with self.lock:
            self._clean_old_timestamps(now)
            current_count = len(self.timestamps)
            remaining = max(0, self.max_requests - current_count)
            oldest = self.timestamps[0] if self.timestamps else now
            reset_time = int(oldest + self.window_seconds)
            return remaining, reset_time


class AdvancedRateLimiter:
    """
    Multi-tier rate limiter with sliding window algorithm.
    Supports IP-based, user-based, and endpoint-specific rate limiting.
    """

    def __init__(
        self, rate_limits: dict[str, Any] | None = None, enable_redis: bool = False, redis_url: str | None = None
    ):
        """
        Initialize rate limiter.

        Args:
            rate_limits: Custom rate limit configuration
            enable_redis: Enable Redis for distributed rate limiting
            redis_url: Redis connection URL (optional)
        """
        self.rate_limits = rate_limits or DEFAULT_RATE_LIMITS
        self.enable_redis = enable_redis
        self.redis_url = redis_url

        # In-memory storage for rate limit counters
        self.ip_counters: dict[str, SlidingWindowCounter] = {}
        self.user_counters: dict[str, SlidingWindowCounter] = {}
        self.endpoint_counters: dict[str, SlidingWindowCounter] = {}
        self.global_counter: SlidingWindowCounter | None = None

        # Locks for thread-safe operations
        self.ip_lock = Lock()
        self.user_lock = Lock()
        self.endpoint_lock = Lock()

        # Initialize global counter if configured
        if "global" in self.rate_limits:
            global_config = self.rate_limits["global"]
            self.global_counter = SlidingWindowCounter(global_config["requests"], global_config["window"])

        # Stats tracking
        self.stats = {"total_requests": 0, "blocked_requests": 0, "allowed_requests": 0}
        self.stats_lock = Lock()

        # Redis client (optional)
        self.redis_client = None
        if enable_redis and redis_url:
            try:
                import redis

                self.redis_client = redis.from_url(redis_url, decode_responses=True)
            except ImportError:
                print("Warning: redis package not installed. Falling back to in-memory rate limiting.")
            except Exception as e:
                print(f"Warning: Failed to connect to Redis: {e}. Falling back to in-memory rate limiting.")

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client:
            return request.client.host
        return "unknown"

    def _get_user_id(self, request: Request) -> str | None:
        """Extract user ID from request (from auth token)"""
        # Try to get from request state (set by auth middleware)
        user = getattr(request.state, "user", None)
        if user:
            return getattr(user, "id", None)

        # Try to extract from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            # Hash the token to use as user identifier
            return hashlib.sha256(token.encode()).hexdigest()[:16]

        return None

    def _get_or_create_counter(
        self, key: str, max_requests: int, window: int, storage: dict, lock: Lock
    ) -> SlidingWindowCounter:
        """Get existing counter or create new one"""
        with lock:
            if key not in storage:
                storage[key] = SlidingWindowCounter(max_requests, window)
            return storage[key]

    def _cleanup_old_counters(self) -> None:
        """Remove counters that haven't been used recently (memory optimization)"""
        now = time.time()
        cleanup_age = 3600  # Remove counters older than 1 hour

        with self.ip_lock:
            self.ip_counters = {
                k: v for k, v in self.ip_counters.items() if v.timestamps and (now - v.timestamps[-1]) < cleanup_age
            }

        with self.user_lock:
            self.user_counters = {
                k: v for k, v in self.user_counters.items() if v.timestamps and (now - v.timestamps[-1]) < cleanup_age
            }

        with self.endpoint_lock:
            self.endpoint_counters = {
                k: v for k, v in self.endpoint_counters.items() if v.timestamps and (now - v.timestamps[-1]) < cleanup_age
            }

    async def check_rate_limit(self, request: Request) -> RateLimitInfo:
        """
        Check if request should be allowed based on rate limits.
        Raises RateLimitExceeded if any limit is exceeded.
        Returns RateLimitInfo with current limits.
        """
        now = time.time()
        client_ip = self._get_client_ip(request)
        user_id = self._get_user_id(request)
        endpoint = request.url.path

        # Track stats
        with self.stats_lock:
            self.stats["total_requests"] += 1

        # Check global rate limit first
        if self.global_counter:
            allowed, remaining, reset = self.global_counter.check_and_add(now)
            if not allowed:
                with self.stats_lock:
                    self.stats["blocked_requests"] += 1
                retry_after = reset - int(now)
                raise RateLimitExceeded(retry_after, "global")

        # Check per-IP rate limit
        if "per_ip" in self.rate_limits:
            ip_config = self.rate_limits["per_ip"]
            ip_counter = self._get_or_create_counter(
                f"ip:{client_ip}", ip_config["requests"], ip_config["window"], self.ip_counters, self.ip_lock
            )
            allowed, remaining, reset = ip_counter.check_and_add(now)
            if not allowed:
                with self.stats_lock:
                    self.stats["blocked_requests"] += 1
                retry_after = reset - int(now)
                raise RateLimitExceeded(retry_after, f"per-IP ({client_ip})")

        # Check per-user rate limit (if authenticated)
        if user_id and "per_user" in self.rate_limits:
            user_config = self.rate_limits["per_user"]
            user_counter = self._get_or_create_counter(
                f"user:{user_id}", user_config["requests"], user_config["window"], self.user_counters, self.user_lock
            )
            allowed, remaining, reset = user_counter.check_and_add(now)
            if not allowed:
                with self.stats_lock:
                    self.stats["blocked_requests"] += 1
                retry_after = reset - int(now)
                raise RateLimitExceeded(retry_after, f"per-user ({user_id[:8]}...)")

        # Check per-endpoint rate limit
        if "per_endpoint" in self.rate_limits and endpoint in self.rate_limits["per_endpoint"]:
            endpoint_config = self.rate_limits["per_endpoint"][endpoint]
            endpoint_key = f"endpoint:{client_ip}:{endpoint}"
            endpoint_counter = self._get_or_create_counter(
                endpoint_key,
                endpoint_config["requests"],
                endpoint_config["window"],
                self.endpoint_counters,
                self.endpoint_lock,
            )
            allowed, remaining, reset = endpoint_counter.check_and_add(now)
            if not allowed:
                with self.stats_lock:
                    self.stats["blocked_requests"] += 1
                retry_after = reset - int(now)
                raise RateLimitExceeded(retry_after, f"endpoint {endpoint}")

        # Get the most restrictive limit info for headers
        limit_info = self._get_limit_info(client_ip, user_id, endpoint)

        with self.stats_lock:
            self.stats["allowed_requests"] += 1

        # Periodic cleanup (every 100th request)
        if self.stats["total_requests"] % 100 == 0:
            self._cleanup_old_counters()

        return limit_info

    def _get_limit_info(self, client_ip: str, user_id: str | None, endpoint: str) -> RateLimitInfo:
        """Get rate limit information for response headers"""
        # Default to IP-based limits for headers
        if "per_ip" in self.rate_limits:
            ip_config = self.rate_limits["per_ip"]
            ip_counter = self._get_or_create_counter(
                f"ip:{client_ip}", ip_config["requests"], ip_config["window"], self.ip_counters, self.ip_lock
            )
            remaining, reset = ip_counter.get_info()
            return RateLimitInfo(limit=ip_config["requests"], remaining=remaining, reset=reset)

        # Fallback to global limits
        if self.global_counter:
            remaining, reset = self.global_counter.get_info()
            return RateLimitInfo(
                limit=self.rate_limits["global"]["requests"], remaining=remaining, reset=reset
            )

        return RateLimitInfo(limit=1000, remaining=999, reset=int(time.time() + 60))

    def add_rate_limit_headers(self, response: Response, limit_info: RateLimitInfo) -> None:
        """Add rate limit headers to response"""
        response.headers["X-RateLimit-Limit"] = str(limit_info.limit)
        response.headers["X-RateLimit-Remaining"] = str(limit_info.remaining)
        response.headers["X-RateLimit-Reset"] = str(limit_info.reset)
        if limit_info.retry_after:
            response.headers["Retry-After"] = str(limit_info.retry_after)

    def get_stats(self) -> dict[str, Any]:
        """Get rate limiter statistics"""
        with self.stats_lock:
            return {
                **self.stats,
                "active_ip_counters": len(self.ip_counters),
                "active_user_counters": len(self.user_counters),
                "active_endpoint_counters": len(self.endpoint_counters),
            }


# Global rate limiter instance
rate_limiter = AdvancedRateLimiter()
