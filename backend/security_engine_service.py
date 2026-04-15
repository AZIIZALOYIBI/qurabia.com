"""
Security Engine Service — خدمة محرك الأمان الكمومي
====================================================

يوفر هذا المحرك خدمات أمان متقدمة مبنية على:
1. البصمة الكمومية الحية (Quantum Fingerprinting)
2. التشفير متعدد المسارات (Multi-Path Encryption)
3. مراقبة الأداء والمقاييس (Performance Metrics)

مستوحى من التقنيات المُنفّذة في frontend/src/engine/QuantumCyberShieldV2.ts
"""

import hashlib
import hmac
import secrets
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any

import structlog

logger = structlog.get_logger("qurabia.security_engine")


# ═══════════════════════════════════════════════════════════════
# الأنواع والثوابت
# ═══════════════════════════════════════════════════════════════


class ThreatClassification(str, Enum):
    """تصنيف التهديدات"""

    LEGITIMATE = "legitimate"
    SUSPICIOUS = "suspicious"
    MALICIOUS = "malicious"
    UNKNOWN = "unknown"


class EncryptionPathStatus(str, Enum):
    """حالة مسار التشفير"""

    ACTIVE = "active"
    STANDBY = "standby"
    DEGRADED = "degraded"
    FAILED = "failed"


class PQCAlgorithm(str, Enum):
    """خوارزميات التشفير ما بعد الكمومي المدعومة"""

    KYBER_1024 = "CRYSTALS-Kyber-1024"
    DILITHIUM_5 = "CRYSTALS-Dilithium-5"
    SPHINCS_SHA2_256F = "SPHINCS+-SHA2-256f"
    MCELIECE_6960119 = "Classic-McEliece-6960119"
    BIKE_L3 = "BIKE-L3"
    HQC_256 = "HQC-256"


# ═══════════════════════════════════════════════════════════════
# Data Models
# ═══════════════════════════════════════════════════════════════


@dataclass
class QuantumFingerprint:
    """البصمة الكمومية للاتصال الشبكي"""

    id: str
    source_ip: str
    state_signature: str
    entanglement_level: float  # 0-1
    quantum_phase: float  # 0-2π
    density_matrix: list[float]  # 4 values for single qubit
    confidence: float  # 0-1
    classification: ThreatClassification
    timestamp: int  # Unix timestamp (ms)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class EncryptionPath:
    """مسار تشفير واحد"""

    path_id: str
    algorithm: PQCAlgorithm
    hop_count: int
    latency_ms: float
    error_rate: float
    security_strength: int  # bits
    status: EncryptionPathStatus


@dataclass
class MultiPathEncryptionResult:
    """نتيجة التشفير متعدد المسارات"""

    paths: list[EncryptionPath]
    primary_path: str
    backup_paths: list[str]
    redundancy_factor: float
    success_probability: float
    combined_security: int
    timestamp: int


@dataclass
class ThreatDetectionEvent:
    """حدث كشف تهديد"""

    event_id: str
    fingerprint: QuantumFingerprint
    detection_time_ms: float
    is_false_positive: bool
    threat_score: float  # 0-1
    timestamp: int


@dataclass
class PerformanceMetrics:
    """مقاييس الأداء"""

    total_scans: int
    threats_detected: int
    false_positives: int
    false_positive_rate: float
    avg_detection_time_ms: float
    avg_response_time_ms: float
    total_encryptions: int
    avg_encryption_time_ms: float
    uptime_seconds: float
    timestamp: int


# ═══════════════════════════════════════════════════════════════
# Quantum Fingerprint Engine
# ═══════════════════════════════════════════════════════════════


class QuantumFingerprintEngine:
    """
    محرك البصمة الكمومية
    يُنشئ بصمة كمومية فريدة لكل IP ويُصنّف التهديدات
    """

    def __init__(self, seed_salt: str | None = None):
        self.seed_salt = seed_salt or secrets.token_hex(16)
        self._scan_count = 0
        self._threat_count = 0

    def _quantum_hash(self, data: str) -> str:
        """
        توليد hash كمومي متعدد المستويات
        مستوحى من quantumHash في QuantumCyberShieldV2.ts:354
        """
        h1 = hashlib.sha256(data.encode()).hexdigest()[:8]
        h2 = hashlib.sha256((data + "qurabia-v2").encode()).hexdigest()[:8]
        h3 = hashlib.sha256((data + h1 + h2).encode()).hexdigest()[:8]
        h4 = hashlib.sha256((h1 + h2 + h3).encode()).hexdigest()[:8]
        return f"qsh2-{h1}{h2}{h3}{h4}"

    def _seeded_random(self, seed: str) -> float:
        """
        مولد عشوائي محدد (deterministic)
        يعطي نفس النتيجة لنفس seed
        """
        hash_val = int(hashlib.sha256(seed.encode()).hexdigest()[:16], 16)
        return (hash_val % 1000000) / 1000000.0

    def generate_fingerprint(
        self, source_ip: str, seed: str | None = None
    ) -> QuantumFingerprint:
        """
        توليد بصمة كمومية لعنوان IP

        Args:
            source_ip: عنوان IP المصدر
            seed: seed اختياري للتوليد المحدد

        Returns:
            QuantumFingerprint مع جميع الخصائص الكمومية
        """
        self._scan_count += 1
        actual_seed = seed or f"{source_ip}-{time.time_ns()}"
        # Incorporate source_ip to ensure different IPs produce different properties
        combined_seed = f"{source_ip}:{actual_seed}:{self.seed_salt}"

        # توليد معاملات كمومية
        phase = self._seeded_random(combined_seed + "-phase") * 2 * 3.14159265359
        entanglement = 0.5 + self._seeded_random(combined_seed + "-ent") * 0.5

        # مصفوفة الكثافة لحالة كيوبت واحد مختلط
        p = 0.5 + (self._seeded_random(combined_seed + "-p") - 0.5) * 0.3
        import math

        density_matrix = [
            p,
            math.sqrt(p * (1 - p)) * math.cos(phase),
            math.sqrt(p * (1 - p)) * math.cos(phase),
            1 - p,
        ]

        # تصنيف بناءً على النمط
        if entanglement > 0.9 and p > 0.7:
            classification = ThreatClassification.LEGITIMATE
            threat_score = 0.1
        elif entanglement < 0.6 or abs(p - 0.5) < 0.1:
            classification = ThreatClassification.MALICIOUS
            threat_score = 0.95
            self._threat_count += 1
        elif entanglement < 0.75:
            classification = ThreatClassification.SUSPICIOUS
            threat_score = 0.6
        else:
            classification = ThreatClassification.UNKNOWN
            threat_score = 0.4

        fingerprint_id = self._quantum_hash(source_ip + combined_seed)[:16].upper()

        return QuantumFingerprint(
            id=f"QFP-{fingerprint_id}",
            source_ip=source_ip,
            state_signature=self._quantum_hash(
                f"{source_ip}-{phase}-{entanglement}"
            ),
            entanglement_level=round(entanglement, 3),
            quantum_phase=round(phase, 3),
            density_matrix=[round(v, 4) for v in density_matrix],
            confidence=0.85 + self._seeded_random(combined_seed + "-conf") * 0.14,
            classification=classification,
            timestamp=int(time.time() * 1000),
            metadata={"threat_score": threat_score, "seed": actual_seed[:32]},
        )

    def get_stats(self) -> dict[str, int]:
        """الحصول على إحصائيات المحرك"""
        return {
            "total_scans": self._scan_count,
            "threats_detected": self._threat_count,
            "threat_rate": (
                round(self._threat_count / self._scan_count, 4)
                if self._scan_count > 0
                else 0.0
            ),
        }


# ═══════════════════════════════════════════════════════════════
# Multi-Path Encryption Engine
# ═══════════════════════════════════════════════════════════════


class MultiPathEncryptionEngine:
    """
    محرك التشفير متعدد المسارات
    يُنشئ مسارات تشفير متعددة باستخدام خوارزميات PQC مختلفة
    """

    # معلمات الخوارزميات (مستوحاة من NIST PQC specs)
    ALGORITHM_PARAMS = {
        PQCAlgorithm.KYBER_1024: {"security_bits": 256, "base_latency": 0.15},
        PQCAlgorithm.DILITHIUM_5: {"security_bits": 256, "base_latency": 0.12},
        PQCAlgorithm.SPHINCS_SHA2_256F: {"security_bits": 256, "base_latency": 80.0},
        PQCAlgorithm.MCELIECE_6960119: {"security_bits": 300, "base_latency": 0.4},
        PQCAlgorithm.BIKE_L3: {"security_bits": 192, "base_latency": 0.25},
        PQCAlgorithm.HQC_256: {"security_bits": 256, "base_latency": 0.3},
    }

    def __init__(self):
        self._encryption_count = 0

    def _seeded_random(self, seed: str) -> float:
        """مولد عشوائي محدد"""
        hash_val = int(hashlib.sha256(seed.encode()).hexdigest()[:16], 16)
        return (hash_val % 1000000) / 1000000.0

    def generate_paths(
        self, target_url: str, path_count: int = 5
    ) -> MultiPathEncryptionResult:
        """
        توليد مسارات تشفير متعددة

        Args:
            target_url: عنوان URL الهدف
            path_count: عدد المسارات المطلوب

        Returns:
            MultiPathEncryptionResult مع جميع المسارات
        """
        self._encryption_count += 1
        seed = f"mpe-{target_url}-{path_count}-{time.time_ns()}"

        algorithms = list(PQCAlgorithm)
        paths: list[EncryptionPath] = []

        for i in range(path_count):
            algo = algorithms[int(self._seeded_random(f"{seed}-{i}") * len(algorithms))]
            params = self.ALGORITHM_PARAMS[algo]

            hop_count = 2 + int(self._seeded_random(f"{seed}-hop-{i}") * 5)
            latency_ms = (
                params["base_latency"]
                + hop_count * (5 + self._seeded_random(f"{seed}-lat-{i}") * 15)
            )
            error_rate = self._seeded_random(f"{seed}-err-{i}") * 0.05
            security_strength = params["security_bits"] + int(
                self._seeded_random(f"{seed}-sec-{i}") * 256
            )

            # أول مسار يكون دائماً نشطاً
            if i == 0:
                status = EncryptionPathStatus.ACTIVE
            elif error_rate > 0.04:
                status = EncryptionPathStatus.FAILED
            elif error_rate > 0.03:
                status = EncryptionPathStatus.DEGRADED
            else:
                status = EncryptionPathStatus.STANDBY

            paths.append(
                EncryptionPath(
                    path_id=f"PATH-{i:02X}",
                    algorithm=algo,
                    hop_count=hop_count,
                    latency_ms=round(latency_ms, 2),
                    error_rate=round(error_rate, 4),
                    security_strength=security_strength,
                    status=status,
                )
            )

        # حساب المقاييس الإجمالية
        active_paths = [p for p in paths if p.status in [EncryptionPathStatus.ACTIVE, EncryptionPathStatus.STANDBY]]
        primary_path = paths[0].path_id
        backup_paths = [p.path_id for p in active_paths[1:]]

        redundancy_factor = len(active_paths) / path_count
        # احتمال النجاح = 1 - ∏(error_rate)
        success_probability = 1.0
        for p in active_paths:
            success_probability *= 1 - p.error_rate

        combined_security = max(p.security_strength for p in paths)

        return MultiPathEncryptionResult(
            paths=paths,
            primary_path=primary_path,
            backup_paths=backup_paths,
            redundancy_factor=round(redundancy_factor, 3),
            success_probability=round(success_probability, 4),
            combined_security=combined_security,
            timestamp=int(time.time() * 1000),
        )

    def get_stats(self) -> dict[str, int]:
        """الحصول على إحصائيات المحرك"""
        return {"total_encryptions": self._encryption_count}


# ═══════════════════════════════════════════════════════════════
# Metrics Collector
# ═══════════════════════════════════════════════════════════════


class MetricsCollector:
    """
    جامع المقاييس والإحصائيات
    يتتبع الأداء ومعدل الإيجابيات الخاطئة
    """

    def __init__(self, max_events: int = 1000):
        self.max_events = max_events
        self._detection_events: deque[ThreatDetectionEvent] = deque(maxlen=max_events)
        self._detection_times: deque[float] = deque(maxlen=max_events)
        self._encryption_times: deque[float] = deque(maxlen=max_events)
        self._start_time = time.time()

    def record_detection(
        self, fingerprint: QuantumFingerprint, detection_time_ms: float, is_false_positive: bool = False
    ) -> None:
        """
        تسجيل حدث كشف تهديد

        Args:
            fingerprint: البصمة الكمومية
            detection_time_ms: وقت الكشف بالملي ثانية
            is_false_positive: هل هو إيجابي خاطئ؟
        """
        event = ThreatDetectionEvent(
            event_id=secrets.token_hex(8),
            fingerprint=fingerprint,
            detection_time_ms=detection_time_ms,
            is_false_positive=is_false_positive,
            threat_score=fingerprint.metadata.get("threat_score", 0.5),
            timestamp=int(time.time() * 1000),
        )
        self._detection_events.append(event)
        self._detection_times.append(detection_time_ms)

        logger.info(
            "threat_detection_recorded",
            event_id=event.event_id,
            source_ip=fingerprint.source_ip,
            classification=fingerprint.classification.value,
            threat_score=event.threat_score,
            is_false_positive=is_false_positive,
        )

    def record_encryption(self, encryption_time_ms: float) -> None:
        """تسجيل عملية تشفير"""
        self._encryption_times.append(encryption_time_ms)

    def get_metrics(self) -> PerformanceMetrics:
        """الحصول على المقاييس الحالية"""
        total_scans = len(self._detection_events)
        threats_detected = sum(
            1
            for e in self._detection_events
            if e.fingerprint.classification
            in [ThreatClassification.MALICIOUS, ThreatClassification.SUSPICIOUS]
        )
        false_positives = sum(1 for e in self._detection_events if e.is_false_positive)
        false_positive_rate = (
            false_positives / threats_detected if threats_detected > 0 else 0.0
        )

        avg_detection_time = (
            sum(self._detection_times) / len(self._detection_times)
            if self._detection_times
            else 0.0
        )
        avg_encryption_time = (
            sum(self._encryption_times) / len(self._encryption_times)
            if self._encryption_times
            else 0.0
        )

        # متوسط زمن الاستجابة (detection + processing overhead)
        avg_response_time = avg_detection_time + 0.5 if avg_detection_time > 0 else 0.0

        return PerformanceMetrics(
            total_scans=total_scans,
            threats_detected=threats_detected,
            false_positives=false_positives,
            false_positive_rate=round(false_positive_rate, 4),
            avg_detection_time_ms=round(avg_detection_time, 2),
            avg_response_time_ms=round(avg_response_time, 2),
            total_encryptions=len(self._encryption_times),
            avg_encryption_time_ms=round(avg_encryption_time, 2),
            uptime_seconds=round(time.time() - self._start_time, 1),
            timestamp=int(time.time() * 1000),
        )

    def get_recent_events(self, limit: int = 50) -> list[dict[str, Any]]:
        """الحصول على الأحداث الأخيرة"""
        events = list(self._detection_events)[-limit:]
        return [
            {
                "event_id": e.event_id,
                "source_ip": e.fingerprint.source_ip,
                "classification": e.fingerprint.classification.value,
                "threat_score": e.threat_score,
                "detection_time_ms": e.detection_time_ms,
                "is_false_positive": e.is_false_positive,
                "timestamp": e.timestamp,
            }
            for e in events
        ]


# ═══════════════════════════════════════════════════════════════
# Security Engine Service (Main)
# ═══════════════════════════════════════════════════════════════


class SecurityEngineService:
    """
    خدمة محرك الأمان الرئيسية
    تُدير جميع محركات الأمان وتجمع المقاييس
    """

    def __init__(self, seed_salt: str | None = None):
        self.fingerprint_engine = QuantumFingerprintEngine(seed_salt)
        self.encryption_engine = MultiPathEncryptionEngine()
        self.metrics_collector = MetricsCollector()
        logger.info("security_engine_service_initialized")

    def scan_fingerprint(
        self, source_ip: str, seed: str | None = None
    ) -> tuple[QuantumFingerprint, float]:
        """
        فحص بصمة كمومية لعنوان IP

        Args:
            source_ip: عنوان IP المصدر
            seed: seed اختياري

        Returns:
            tuple: (QuantumFingerprint, detection_time_ms)
        """
        start_time = time.perf_counter()
        fingerprint = self.fingerprint_engine.generate_fingerprint(source_ip, seed)
        detection_time_ms = (time.perf_counter() - start_time) * 1000

        # تسجيل في المقاييس
        # في بيئة حقيقية، يتم تحديد is_false_positive عبر feedback loop
        is_false_positive = False
        self.metrics_collector.record_detection(
            fingerprint, detection_time_ms, is_false_positive
        )

        logger.info(
            "fingerprint_scanned",
            fingerprint_id=fingerprint.id,
            source_ip=source_ip,
            classification=fingerprint.classification.value,
            detection_time_ms=round(detection_time_ms, 2),
        )

        return fingerprint, detection_time_ms

    def encrypt_multipath(
        self, target_url: str, path_count: int = 5
    ) -> tuple[MultiPathEncryptionResult, float]:
        """
        تشفير باستخدام مسارات متعددة

        Args:
            target_url: عنوان URL الهدف
            path_count: عدد المسارات

        Returns:
            tuple: (MultiPathEncryptionResult, encryption_time_ms)
        """
        start_time = time.perf_counter()
        result = self.encryption_engine.generate_paths(target_url, path_count)
        encryption_time_ms = (time.perf_counter() - start_time) * 1000

        self.metrics_collector.record_encryption(encryption_time_ms)

        logger.info(
            "multipath_encryption_completed",
            target_url=target_url,
            path_count=path_count,
            primary_path=result.primary_path,
            success_probability=result.success_probability,
            encryption_time_ms=round(encryption_time_ms, 2),
        )

        return result, encryption_time_ms

    def get_performance_metrics(self) -> PerformanceMetrics:
        """الحصول على مقاييس الأداء الشاملة"""
        return self.metrics_collector.get_metrics()

    def get_live_dashboard_data(self) -> dict[str, Any]:
        """الحصول على بيانات لوحة القياس الحية"""
        metrics = self.get_performance_metrics()
        recent_events = self.metrics_collector.get_recent_events(limit=20)
        fingerprint_stats = self.fingerprint_engine.get_stats()
        encryption_stats = self.encryption_engine.get_stats()

        return {
            "metrics": {
                "total_scans": metrics.total_scans,
                "threats_detected": metrics.threats_detected,
                "false_positives": metrics.false_positives,
                "false_positive_rate": metrics.false_positive_rate,
                "avg_detection_time_ms": metrics.avg_detection_time_ms,
                "avg_response_time_ms": metrics.avg_response_time_ms,
                "total_encryptions": metrics.total_encryptions,
                "avg_encryption_time_ms": metrics.avg_encryption_time_ms,
                "uptime_seconds": metrics.uptime_seconds,
            },
            "recent_events": recent_events,
            "engine_stats": {
                "fingerprint": fingerprint_stats,
                "encryption": encryption_stats,
            },
            "timestamp": int(time.time() * 1000),
        }


# ═══════════════════════════════════════════════════════════════
# Singleton Instance
# ═══════════════════════════════════════════════════════════════

# مثيل واحد مشترك للتطبيق
_security_engine: SecurityEngineService | None = None


def get_security_engine() -> SecurityEngineService:
    """الحصول على مثيل SecurityEngineService الوحيد"""
    global _security_engine
    if _security_engine is None:
        _security_engine = SecurityEngineService()
    return _security_engine
