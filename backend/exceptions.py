"""
============================================================
exceptions.py - Custom Exception Classes للواجهة الخلفية
QURABIA

يوفر مجموعة من الاستثناءات المخصصة لتصنيف وتوحيد
معالجة الأخطاء في جميع خدمات FastAPI.
============================================================
"""

from typing import Any, Optional


class QURABIAException(Exception):
    """
    الكلاس الأساسي لجميع استثناءات QURABIA.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """تحويل الاستثناء إلى قاموس للاستجابة."""
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details,
        }


# ============================================================
# أخطاء المصادقة والتفويض
# ============================================================


class AuthenticationError(QURABIAException):
    """خطأ المصادقة - بيانات اعتماد غير صحيحة."""

    def __init__(self, message: str = "Authentication failed", details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR", details=details)


class AuthorizationError(QURABIAException):
    """خطأ التفويض - صلاحيات غير كافية."""

    def __init__(self, message: str = "Insufficient permissions", details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=403, error_code="AUTHORIZATION_ERROR", details=details)


class TokenExpiredError(QURABIAException):
    """خطأ انتهاء صلاحية الرمز."""

    def __init__(self, message: str = "Token has expired", details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=401, error_code="TOKEN_EXPIRED", details=details)


class InvalidTokenError(QURABIAException):
    """خطأ رمز غير صالح."""

    def __init__(self, message: str = "Invalid token", details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=401, error_code="INVALID_TOKEN", details=details)


# ============================================================
# أخطاء التحقق من صحة البيانات
# ============================================================


class ValidationError(QURABIAException):
    """خطأ التحقق من صحة البيانات."""

    def __init__(self, message: str, field: Optional[str] = None, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        if field:
            error_details["field"] = field
        super().__init__(message, status_code=422, error_code="VALIDATION_ERROR", details=error_details)


class InvalidInputError(QURABIAException):
    """خطأ مدخلات غير صالحة."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=400, error_code="INVALID_INPUT", details=details)


# ============================================================
# أخطاء محاكاة الكم
# ============================================================


class QuantumSimulationError(QURABIAException):
    """خطأ عام في محاكاة الكم."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, error_code="QUANTUM_SIMULATION_ERROR", details=details)


class QubitLimitExceededError(QuantumSimulationError):
    """خطأ تجاوز حد الكيوبتات."""

    def __init__(self, num_qubits: int, max_qubits: int, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details.update({"num_qubits": num_qubits, "max_qubits": max_qubits})
        super().__init__(
            f"Number of qubits ({num_qubits}) exceeds maximum allowed ({max_qubits})",
            details=error_details,
        )
        self.error_code = "QUBIT_LIMIT_EXCEEDED"


class InvalidQuantumGateError(QuantumSimulationError):
    """خطأ بوابة كم غير صالحة."""

    def __init__(self, gate_name: str, message: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details["gate_name"] = gate_name
        super().__init__(message, details=error_details)
        self.error_code = "INVALID_QUANTUM_GATE"


class StateVectorError(QuantumSimulationError):
    """خطأ في vector الحالة الكمية."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "STATE_VECTOR_ERROR"


# ============================================================
# أخطاء الأمان والتشفير
# ============================================================


class SecurityError(QURABIAException):
    """خطأ أمني عام."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=403, error_code="SECURITY_ERROR", details=details)


class EncryptionError(SecurityError):
    """خطأ في عملية التشفير."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "ENCRYPTION_ERROR"


class DecryptionError(SecurityError):
    """خطأ في عملية فك التشفير."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "DECRYPTION_ERROR"


class SignatureError(SecurityError):
    """خطأ في التوقيع الرقمي."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "SIGNATURE_ERROR"


class RateLimitExceededError(QURABIAException):
    """خطأ تجاوز حد الطلبات."""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after
        super().__init__(message, status_code=429, error_code="RATE_LIMIT_EXCEEDED", details=details)


# ============================================================
# أخطاء قاعدة البيانات والتخزين
# ============================================================


class DatabaseError(QURABIAException):
    """خطأ في قاعدة البيانات."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, error_code="DATABASE_ERROR", details=details)


class ResourceNotFoundError(QURABIAException):
    """خطأ مورد غير موجود."""

    def __init__(self, resource_type: str, resource_id: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details.update({"resource_type": resource_type, "resource_id": resource_id})
        super().__init__(
            f"{resource_type} with id '{resource_id}' not found",
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details=error_details,
        )


class ResourceAlreadyExistsError(QURABIAException):
    """خطأ مورد موجود مسبقاً."""

    def __init__(self, resource_type: str, identifier: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details.update({"resource_type": resource_type, "identifier": identifier})
        super().__init__(
            f"{resource_type} with identifier '{identifier}' already exists",
            status_code=409,
            error_code="RESOURCE_ALREADY_EXISTS",
            details=error_details,
        )


# ============================================================
# أخطاء الخدمات الخارجية
# ============================================================


class ExternalServiceError(QURABIAException):
    """خطأ في خدمة خارجية."""

    def __init__(self, service_name: str, message: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details["service_name"] = service_name
        super().__init__(message, status_code=502, error_code="EXTERNAL_SERVICE_ERROR", details=error_details)


class APIConnectionError(QURABIAException):
    """خطأ في الاتصال بـ API خارجي."""

    def __init__(self, api_name: str, message: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details["api_name"] = api_name
        super().__init__(message, status_code=502, error_code="API_CONNECTION_ERROR", details=error_details)


# ============================================================
# أخطاء الإعدادات والبيئة
# ============================================================


class ConfigurationError(QURABIAException):
    """خطأ في الإعدادات."""

    def __init__(self, message: str, config_key: Optional[str] = None, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        if config_key:
            error_details["config_key"] = config_key
        super().__init__(message, status_code=500, error_code="CONFIGURATION_ERROR", details=error_details)


class MissingEnvironmentVariableError(ConfigurationError):
    """خطأ متغير بيئة مفقود."""

    def __init__(self, variable_name: str):
        super().__init__(
            f"Required environment variable '{variable_name}' is missing",
            config_key=variable_name,
        )
        self.error_code = "MISSING_ENV_VAR"


# ============================================================
# أخطاء الذكاء الاصطناعي والتعلم الآلي
# ============================================================


class AIEngineError(QURABIAException):
    """خطأ في محرك الذكاء الاصطناعي."""

    def __init__(self, message: str, engine_name: Optional[str] = None, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        if engine_name:
            error_details["engine_name"] = engine_name
        super().__init__(message, status_code=500, error_code="AI_ENGINE_ERROR", details=error_details)


class ModelLoadError(AIEngineError):
    """خطأ في تحميل النموذج."""

    def __init__(self, model_name: str, message: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details["model_name"] = model_name
        super().__init__(message, engine_name=model_name, details=error_details)
        self.error_code = "MODEL_LOAD_ERROR"


class InferenceError(AIEngineError):
    """خطأ في عملية الاستنتاج."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "INFERENCE_ERROR"


# ============================================================
# أخطاء WebSocket
# ============================================================


class WebSocketError(QURABIAException):
    """خطأ في اتصال WebSocket."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, error_code="WEBSOCKET_ERROR", details=details)


# ============================================================
# أخطاء معالجة البيانات
# ============================================================


class DataProcessingError(QURABIAException):
    """خطأ في معالجة البيانات."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, error_code="DATA_PROCESSING_ERROR", details=details)


class SerializationError(DataProcessingError):
    """خطأ في تسلسل البيانات."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "SERIALIZATION_ERROR"


class DeserializationError(DataProcessingError):
    """خطأ في إلغاء تسلسل البيانات."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, details=details)
        self.error_code = "DESERIALIZATION_ERROR"


# ============================================================
# أخطاء الأداء والموارد
# ============================================================


class ResourceExhaustedError(QURABIAException):
    """خطأ نفاد الموارد."""

    def __init__(self, resource_type: str, message: str, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details["resource_type"] = resource_type
        super().__init__(message, status_code=503, error_code="RESOURCE_EXHAUSTED", details=error_details)


class TimeoutError(QURABIAException):
    """خطأ انتهاء وقت العملية."""

    def __init__(self, operation: str, timeout_seconds: float, details: Optional[dict[str, Any]] = None):
        error_details = details or {}
        error_details.update({"operation": operation, "timeout_seconds": timeout_seconds})
        super().__init__(
            f"Operation '{operation}' timed out after {timeout_seconds} seconds",
            status_code=504,
            error_code="TIMEOUT_ERROR",
            details=error_details,
        )
