"""
Security Audit and Threat Detection for QURABIA Backend
========================================================
Comprehensive security audit logging and suspicious activity detection.

Features:
- Audit logging for sensitive operations
- Security event tracking
- Suspicious activity detection
- Automatic IP blocking for threats
- Anomaly detection
- Security reports and analytics
"""

import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class SecurityEventType(Enum):
    """Types of security events"""

    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"
    TOKEN_REVOKED = "token_revoked"

    # Authorization events
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    PERMISSION_DENIED = "permission_denied"

    # Data access events
    DATA_READ = "data_read"
    DATA_WRITE = "data_write"
    DATA_DELETE = "data_delete"

    # Suspicious activities
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    INVALID_TOKEN = "invalid_token"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    XSS_ATTEMPT = "xss_attempt"
    PATH_TRAVERSAL_ATTEMPT = "path_traversal_attempt"
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt"
    SUSPICIOUS_USER_AGENT = "suspicious_user_agent"
    SUSPICIOUS_REQUEST = "suspicious_request"

    # System events
    CONFIG_CHANGE = "config_change"
    SERVICE_START = "service_start"
    SERVICE_STOP = "service_stop"
    ERROR = "error"


class ThreatLevel(Enum):
    """Threat severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityEvent:
    """Security event data structure"""

    event_type: SecurityEventType
    timestamp: float
    ip_address: str
    user_id: str | None = None
    endpoint: str | None = None
    user_agent: str | None = None
    details: dict[str, Any] = field(default_factory=dict)
    threat_level: ThreatLevel = ThreatLevel.LOW


@dataclass
class ThreatScore:
    """Threat scoring for IP addresses"""

    ip_address: str
    score: int = 0
    events: list[SecurityEvent] = field(default_factory=list)
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    is_blocked: bool = False


class SecurityAudit:
    """
    Security audit logging and threat detection system.
    Tracks security events, detects suspicious patterns, and auto-blocks threats.
    """

    def __init__(
        self,
        max_events: int = 10000,
        threat_threshold: int = 100,
        auto_block_enabled: bool = True,
        retention_hours: int = 24,
    ):
        """
        Initialize security audit system.

        Args:
            max_events: Maximum number of events to keep in memory
            threat_threshold: Score threshold for auto-blocking
            auto_block_enabled: Enable automatic IP blocking
            retention_hours: How long to retain events
        """
        self.max_events = max_events
        self.threat_threshold = threat_threshold
        self.auto_block_enabled = auto_block_enabled
        self.retention_hours = retention_hours

        # Event storage
        self.events: deque[SecurityEvent] = deque(maxlen=max_events)

        # Threat tracking
        self.threat_scores: dict[str, ThreatScore] = {}
        self.blocked_ips: set[str] = set()

        # Activity tracking for anomaly detection
        self.login_attempts: dict[str, deque] = defaultdict(lambda: deque(maxlen=10))
        self.endpoint_access: dict[str, deque] = defaultdict(lambda: deque(maxlen=100))

        # Statistics
        self.stats = {
            "total_events": 0,
            "threats_detected": 0,
            "ips_blocked": 0,
            "events_by_type": defaultdict(int),
            "events_by_threat_level": defaultdict(int),
        }

    def log_event(
        self,
        event_type: SecurityEventType,
        ip_address: str,
        user_id: str | None = None,
        endpoint: str | None = None,
        user_agent: str | None = None,
        details: dict[str, Any] | None = None,
        threat_level: ThreatLevel | None = None,
    ) -> SecurityEvent:
        """
        Log a security event.

        Args:
            event_type: Type of security event
            ip_address: Client IP address
            user_id: User ID (if authenticated)
            endpoint: API endpoint accessed
            user_agent: User agent string
            details: Additional event details
            threat_level: Override threat level

        Returns:
            Created SecurityEvent
        """
        now = time.time()

        # Auto-determine threat level if not provided
        if threat_level is None:
            threat_level = self._determine_threat_level(event_type)

        event = SecurityEvent(
            event_type=event_type,
            timestamp=now,
            ip_address=ip_address,
            user_id=user_id,
            endpoint=endpoint,
            user_agent=user_agent,
            details=details or {},
            threat_level=threat_level,
        )

        # Store event
        self.events.append(event)

        # Update statistics
        self.stats["total_events"] += 1
        self.stats["events_by_type"][event_type.value] += 1
        self.stats["events_by_threat_level"][threat_level.value] += 1

        # Update threat score
        self._update_threat_score(event)

        # Log to structured logger
        logger.info(
            "security_event",
            event_type=event_type.value,
            ip=ip_address,
            user_id=user_id,
            endpoint=endpoint,
            threat_level=threat_level.value,
            details=details,
        )

        # Check for automatic blocking
        if self.auto_block_enabled and threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
            self._check_auto_block(ip_address)

        return event

    def _determine_threat_level(self, event_type: SecurityEventType) -> ThreatLevel:
        """Determine threat level based on event type"""
        critical_events = [
            SecurityEventType.SQL_INJECTION_ATTEMPT,
            SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
        ]
        high_events = [
            SecurityEventType.XSS_ATTEMPT,
            SecurityEventType.BRUTE_FORCE_ATTEMPT,
            SecurityEventType.UNAUTHORIZED_ACCESS,
        ]
        medium_events = [
            SecurityEventType.RATE_LIMIT_EXCEEDED,
            SecurityEventType.INVALID_TOKEN,
            SecurityEventType.SUSPICIOUS_USER_AGENT,
            SecurityEventType.LOGIN_FAILED,
        ]

        if event_type in critical_events:
            return ThreatLevel.CRITICAL
        elif event_type in high_events:
            return ThreatLevel.HIGH
        elif event_type in medium_events:
            return ThreatLevel.MEDIUM
        else:
            return ThreatLevel.LOW

    def _update_threat_score(self, event: SecurityEvent) -> None:
        """Update threat score for an IP address"""
        ip = event.ip_address

        if ip not in self.threat_scores:
            self.threat_scores[ip] = ThreatScore(ip_address=ip)

        threat = self.threat_scores[ip]
        threat.last_seen = event.timestamp
        threat.events.append(event)

        # Calculate score based on threat level
        score_map = {
            ThreatLevel.LOW: 1,
            ThreatLevel.MEDIUM: 5,
            ThreatLevel.HIGH: 15,
            ThreatLevel.CRITICAL: 30,
        }
        threat.score += score_map[event.threat_level]

        # Decay old scores (reduce by 1% per hour)
        hours_since_first = (event.timestamp - threat.first_seen) / 3600
        if hours_since_first > 1:
            decay = 0.99 ** hours_since_first
            threat.score = int(threat.score * decay)

    def _check_auto_block(self, ip_address: str) -> None:
        """Check if IP should be automatically blocked"""
        if ip_address in self.blocked_ips:
            return

        threat = self.threat_scores.get(ip_address)
        if threat and threat.score >= self.threat_threshold:
            self.block_ip(ip_address, "Automatic blocking due to high threat score")

    def block_ip(self, ip_address: str, reason: str) -> None:
        """
        Block an IP address.

        Args:
            ip_address: IP to block
            reason: Reason for blocking
        """
        self.blocked_ips.add(ip_address)
        self.stats["ips_blocked"] += 1

        if ip_address in self.threat_scores:
            self.threat_scores[ip_address].is_blocked = True

        logger.warning("ip_blocked", ip=ip_address, reason=reason)

        # Log blocking event
        self.log_event(
            SecurityEventType.SUSPICIOUS_REQUEST,
            ip_address=ip_address,
            details={"action": "blocked", "reason": reason},
            threat_level=ThreatLevel.CRITICAL,
        )

    def unblock_ip(self, ip_address: str) -> bool:
        """
        Unblock an IP address.

        Args:
            ip_address: IP to unblock

        Returns:
            True if IP was unblocked, False if it wasn't blocked
        """
        if ip_address not in self.blocked_ips:
            return False

        self.blocked_ips.remove(ip_address)

        if ip_address in self.threat_scores:
            self.threat_scores[ip_address].is_blocked = False
            self.threat_scores[ip_address].score = 0

        logger.info("ip_unblocked", ip=ip_address)
        return True

    def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if an IP is blocked"""
        return ip_address in self.blocked_ips

    def detect_brute_force(self, ip_address: str, endpoint: str) -> bool:
        """
        Detect brute force attacks based on failed login attempts.

        Args:
            ip_address: IP address to check
            endpoint: Endpoint accessed

        Returns:
            True if brute force detected
        """
        key = f"{ip_address}:{endpoint}"
        attempts = self.login_attempts[key]

        now = time.time()
        attempts.append(now)

        # Check if more than 5 attempts in 5 minutes
        recent_attempts = [t for t in attempts if now - t < 300]
        if len(recent_attempts) >= 5:
            self.log_event(
                SecurityEventType.BRUTE_FORCE_ATTEMPT,
                ip_address=ip_address,
                endpoint=endpoint,
                details={"attempts": len(recent_attempts), "window": "5 minutes"},
                threat_level=ThreatLevel.HIGH,
            )
            return True

        return False

    def detect_anomaly(self, ip_address: str, endpoint: str) -> bool:
        """
        Detect anomalous access patterns.

        Args:
            ip_address: IP address
            endpoint: Endpoint accessed

        Returns:
            True if anomaly detected
        """
        key = f"{ip_address}:{endpoint}"
        access_times = self.endpoint_access[key]

        now = time.time()
        access_times.append(now)

        # Check for rapid successive requests (more than 20 in 1 minute)
        recent_access = [t for t in access_times if now - t < 60]
        if len(recent_access) >= 20:
            self.log_event(
                SecurityEventType.SUSPICIOUS_REQUEST,
                ip_address=ip_address,
                endpoint=endpoint,
                details={"rapid_requests": len(recent_access), "window": "1 minute"},
                threat_level=ThreatLevel.MEDIUM,
            )
            return True

        return False

    def get_threat_report(self, ip_address: str | None = None) -> dict[str, Any]:
        """
        Generate threat report.

        Args:
            ip_address: Specific IP to report on, or None for all

        Returns:
            Threat report data
        """
        if ip_address:
            threat = self.threat_scores.get(ip_address)
            if not threat:
                return {"ip": ip_address, "found": False}

            return {
                "ip": ip_address,
                "found": True,
                "score": threat.score,
                "is_blocked": threat.is_blocked,
                "first_seen": datetime.fromtimestamp(threat.first_seen, UTC).isoformat(),
                "last_seen": datetime.fromtimestamp(threat.last_seen, UTC).isoformat(),
                "event_count": len(threat.events),
                "events": [
                    {
                        "type": e.event_type.value,
                        "timestamp": datetime.fromtimestamp(e.timestamp, UTC).isoformat(),
                        "threat_level": e.threat_level.value,
                        "endpoint": e.endpoint,
                    }
                    for e in threat.events[-10:]  # Last 10 events
                ],
            }

        # Report on all threats
        top_threats = sorted(self.threat_scores.values(), key=lambda t: t.score, reverse=True)[:20]

        return {
            "total_ips_tracked": len(self.threat_scores),
            "blocked_ips": len(self.blocked_ips),
            "top_threats": [
                {
                    "ip": t.ip_address,
                    "score": t.score,
                    "is_blocked": t.is_blocked,
                    "event_count": len(t.events),
                    "last_seen": datetime.fromtimestamp(t.last_seen, UTC).isoformat(),
                }
                for t in top_threats
            ],
        }

    def get_statistics(self) -> dict[str, Any]:
        """Get audit statistics"""
        return {
            **self.stats,
            "active_events": len(self.events),
            "tracked_ips": len(self.threat_scores),
            "blocked_ips": len(self.blocked_ips),
        }

    def cleanup_old_events(self) -> int:
        """
        Remove events older than retention period.

        Returns:
            Number of events cleaned up
        """
        cutoff = time.time() - (self.retention_hours * 3600)
        initial_count = len(self.events)

        # Remove old events
        self.events = deque(
            (e for e in self.events if e.timestamp > cutoff),
            maxlen=self.max_events,
        )

        # Clean up old threat scores
        old_ips = [ip for ip, threat in self.threat_scores.items() if threat.last_seen < cutoff and not threat.is_blocked]

        for ip in old_ips:
            del self.threat_scores[ip]

        cleaned = initial_count - len(self.events)
        logger.info("audit_cleanup", events_cleaned=cleaned, ips_cleaned=len(old_ips))

        return cleaned


# Global security audit instance
security_audit = SecurityAudit(
    max_events=10000,
    threat_threshold=100,
    auto_block_enabled=True,
    retention_hours=24,
)
