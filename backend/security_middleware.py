"""
Security Middleware for QURABIA Backend
========================================
Comprehensive security middleware with CORS validation, request filtering,
content validation, and bot protection.

Features:
- Enhanced CORS validation with origin checking
- Request size limiting
- Content-Type validation
- User-Agent filtering (basic bot protection)
- IP whitelist/blacklist support
- Request logging for security monitoring
- Suspicious pattern detection
"""

import json
import re
import time
from collections import defaultdict
from ipaddress import IPv4Address, IPv4Network, ip_address
from typing import Any, Callable
from urllib.parse import urlparse

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = structlog.get_logger(__name__)

# Security configuration
SECURITY_CONFIG = {
    "max_request_size": 10 * 1024 * 1024,  # 10 MB
    "max_url_length": 2048,
    "max_header_size": 8192,
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    "allowed_content_types": [
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
        "text/plain",
    ],
    # Suspicious User-Agent patterns (basic bot detection)
    "blocked_user_agents": [
        r"(?i)bot",
        r"(?i)crawler",
        r"(?i)spider",
        r"(?i)scraper",
        r"(?i)curl",
        r"(?i)wget",
        r"(?i)python-requests",
    ],
    # Allowed User-Agent patterns (whitelist exceptions)
    "allowed_user_agents": [
        r"(?i)googlebot",
        r"(?i)bingbot",
        r"(?i)duckduckbot",
    ],
    # Suspicious URL patterns
    "suspicious_url_patterns": [
        r"\.\.\/",  # Path traversal
        r"%00",  # Null byte
        r"%0d%0a",  # CRLF injection
        r"<script",  # XSS attempt in URL
        r"javascript:",  # JavaScript protocol
        r"data:",  # Data URI
        r"vbscript:",  # VBScript protocol
    ],
}


class IPFilter:
    """IP whitelist/blacklist management"""

    def __init__(self):
        self.whitelist: set[str | IPv4Network] = set()
        self.blacklist: set[str | IPv4Network] = set()
        self.whitelist_enabled = False
        self.blacklist_enabled = False

    def add_to_whitelist(self, ip_or_cidr: str) -> None:
        """Add IP or CIDR range to whitelist"""
        if "/" in ip_or_cidr:
            self.whitelist.add(IPv4Network(ip_or_cidr))
        else:
            self.whitelist.add(ip_or_cidr)
        self.whitelist_enabled = True

    def add_to_blacklist(self, ip_or_cidr: str) -> None:
        """Add IP or CIDR range to blacklist"""
        if "/" in ip_or_cidr:
            self.blacklist.add(IPv4Network(ip_or_cidr))
        else:
            self.blacklist.add(ip_or_cidr)
        self.blacklist_enabled = True

    def is_allowed(self, ip_str: str) -> bool:
        """Check if IP is allowed"""
        try:
            ip = ip_address(ip_str)
        except ValueError:
            return False

        # Check whitelist first (if enabled)
        if self.whitelist_enabled:
            for entry in self.whitelist:
                if isinstance(entry, IPv4Network):
                    if ip in entry:
                        return True
                elif str(ip) == entry:
                    return True
            return False

        # Check blacklist
        if self.blacklist_enabled:
            for entry in self.blacklist:
                if isinstance(entry, IPv4Network):
                    if ip in entry:
                        return False
                elif str(ip) == entry:
                    return False

        return True


class SecurityMetrics:
    """Track security-related metrics"""

    def __init__(self):
        self.metrics = defaultdict(int)
        self.last_reset = time.time()
        self.reset_interval = 3600  # Reset every hour

    def increment(self, metric: str) -> None:
        """Increment a metric counter"""
        now = time.time()
        if now - self.last_reset > self.reset_interval:
            self.metrics.clear()
            self.last_reset = now
        self.metrics[metric] += 1

    def get_metrics(self) -> dict[str, int]:
        """Get current metrics"""
        return dict(self.metrics)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware for FastAPI applications.
    Validates requests, filters malicious content, and tracks security metrics.
    """

    def __init__(
        self,
        app,
        allowed_origins: list[str] | None = None,
        enable_ip_filtering: bool = False,
        enable_bot_protection: bool = True,
        enable_size_limits: bool = True,
    ):
        """
        Initialize security middleware.

        Args:
            app: FastAPI application
            allowed_origins: List of allowed CORS origins
            enable_ip_filtering: Enable IP whitelist/blacklist
            enable_bot_protection: Enable User-Agent based bot filtering
            enable_size_limits: Enable request size limits
        """
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["*"]
        self.enable_ip_filtering = enable_ip_filtering
        self.enable_bot_protection = enable_bot_protection
        self.enable_size_limits = enable_size_limits

        self.ip_filter = IPFilter()
        self.metrics = SecurityMetrics()

        # Compile regex patterns for performance
        self.blocked_ua_patterns = [re.compile(pattern) for pattern in SECURITY_CONFIG["blocked_user_agents"]]
        self.allowed_ua_patterns = [re.compile(pattern) for pattern in SECURITY_CONFIG["allowed_user_agents"]]
        self.suspicious_url_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in SECURITY_CONFIG["suspicious_url_patterns"]]

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client:
            return request.client.host
        return "unknown"

    def _validate_origin(self, request: Request) -> bool:
        """Validate CORS origin"""
        if "*" in self.allowed_origins:
            return True

        origin = request.headers.get("Origin", "")
        if not origin:
            # Allow requests without Origin header (non-browser clients)
            return True

        # Parse and validate origin
        try:
            parsed = urlparse(origin)
            origin_host = parsed.netloc.lower()

            for allowed in self.allowed_origins:
                if allowed == origin_host:
                    return True
                # Support wildcard subdomains (e.g., *.example.com)
                if allowed.startswith("*."):
                    domain = allowed[2:]
                    if origin_host == domain or origin_host.endswith(f".{domain}"):
                        return True

        except Exception:
            return False

        return False

    def _validate_user_agent(self, user_agent: str) -> bool:
        """Validate User-Agent to detect bots"""
        if not self.enable_bot_protection:
            return True

        if not user_agent:
            # Block requests without User-Agent
            return False

        # Check if it's an allowed bot (search engines)
        for pattern in self.allowed_ua_patterns:
            if pattern.search(user_agent):
                return True

        # Check if it's a blocked bot
        for pattern in self.blocked_ua_patterns:
            if pattern.search(user_agent):
                return False

        return True

    def _validate_url(self, url: str) -> bool:
        """Check for suspicious URL patterns"""
        for pattern in self.suspicious_url_patterns:
            if pattern.search(url):
                return False
        return True

    def _validate_request_size(self, request: Request) -> bool:
        """Validate request size limits"""
        if not self.enable_size_limits:
            return True

        # Check URL length
        url = str(request.url)
        if len(url) > SECURITY_CONFIG["max_url_length"]:
            return False

        # Check total header size
        header_size = sum(len(k) + len(v) for k, v in request.headers.items())
        if header_size > SECURITY_CONFIG["max_header_size"]:
            return False

        # Check Content-Length header if present
        content_length = request.headers.get("Content-Length")
        if content_length:
            try:
                size = int(content_length)
                if size > SECURITY_CONFIG["max_request_size"]:
                    return False
            except ValueError:
                return False

        return True

    def _validate_content_type(self, request: Request) -> bool:
        """Validate Content-Type header"""
        # OPTIONS requests don't need Content-Type
        if request.method == "OPTIONS":
            return True

        # GET and HEAD requests typically don't have body
        if request.method in ["GET", "HEAD", "DELETE"]:
            return True

        content_type = request.headers.get("Content-Type", "")
        if not content_type:
            return False

        # Extract base content type (remove charset, boundary, etc.)
        base_type = content_type.split(";")[0].strip().lower()

        return base_type in SECURITY_CONFIG["allowed_content_types"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through security checks"""
        start_time = time.time()
        client_ip = self._get_client_ip(request)

        # Check IP filtering
        if self.enable_ip_filtering and not self.ip_filter.is_allowed(client_ip):
            self.metrics.increment("blocked_ip")
            logger.warning("request_blocked", reason="ip_blocked", ip=client_ip, path=request.url.path)
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied", "error_code": "IP_BLOCKED"},
            )

        # Validate origin (CORS)
        if not self._validate_origin(request):
            self.metrics.increment("invalid_origin")
            logger.warning(
                "request_blocked",
                reason="invalid_origin",
                origin=request.headers.get("Origin"),
                ip=client_ip,
                path=request.url.path,
            )
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid origin", "error_code": "INVALID_ORIGIN"},
            )

        # Validate User-Agent
        user_agent = request.headers.get("User-Agent", "")
        if not self._validate_user_agent(user_agent):
            self.metrics.increment("blocked_bot")
            logger.warning("request_blocked", reason="suspicious_user_agent", user_agent=user_agent, ip=client_ip)
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied", "error_code": "SUSPICIOUS_USER_AGENT"},
            )

        # Validate URL
        if not self._validate_url(str(request.url)):
            self.metrics.increment("suspicious_url")
            logger.warning("request_blocked", reason="suspicious_url", url=str(request.url), ip=client_ip)
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid URL", "error_code": "SUSPICIOUS_URL"},
            )

        # Validate request size
        if not self._validate_request_size(request):
            self.metrics.increment("oversized_request")
            logger.warning("request_blocked", reason="request_too_large", ip=client_ip, path=request.url.path)
            return JSONResponse(
                status_code=413,
                content={"detail": "Request too large", "error_code": "REQUEST_TOO_LARGE"},
            )

        # Validate Content-Type
        if not self._validate_content_type(request):
            self.metrics.increment("invalid_content_type")
            logger.warning(
                "request_blocked",
                reason="invalid_content_type",
                content_type=request.headers.get("Content-Type"),
                ip=client_ip,
            )
            return JSONResponse(
                status_code=415,
                content={"detail": "Unsupported Media Type", "error_code": "INVALID_CONTENT_TYPE"},
            )

        # Log request (for security monitoring)
        logger.info(
            "request_received",
            method=request.method,
            path=request.url.path,
            ip=client_ip,
            user_agent=user_agent[:100],  # Truncate long user agents
        )

        self.metrics.increment("allowed_requests")

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            self.metrics.increment("server_errors")
            logger.error("request_error", error=str(e), path=request.url.path, ip=client_ip)
            raise

        # Add security headers to response
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Add timing header
        duration = time.time() - start_time
        response.headers["X-Response-Time"] = f"{duration:.3f}s"

        return response

    def get_metrics(self) -> dict[str, Any]:
        """Get security metrics"""
        return self.metrics.get_metrics()


# Global security middleware instance (can be customized)
security_middleware = SecurityMiddleware(
    app=None,  # Will be set by FastAPI
    allowed_origins=["*"],  # Configure based on environment
    enable_bot_protection=True,
    enable_ip_filtering=False,
)
