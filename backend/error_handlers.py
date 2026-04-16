"""
============================================================
error_handlers.py - معالجات الأخطاء المركزية لـ FastAPI
QURABIA

يوفر معالجات شاملة لجميع أنواع الأخطاء في التطبيق،
مع تسجيل structured وإرجاع استجابات موحدة.
============================================================
"""

import traceback
from typing import Any, Callable, Dict, Optional, Union

import structlog
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from exceptions import QURABIAException

# إعداد structlog
logger = structlog.get_logger(__name__)


# ============================================================
# دوال مساعدة لبناء استجابات الأخطاء
# ============================================================


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    include_traceback: bool = False,
    traceback_str: Optional[str] = None,
) -> JSONResponse:
    """
    إنشاء استجابة خطأ موحدة.

    Args:
        status_code: HTTP status code
        error_code: رمز الخطأ المخصص
        message: رسالة الخطأ
        details: تفاصيل إضافية
        include_traceback: تضمين stack trace
        traceback_str: stack trace النص

    Returns:
        JSONResponse مع بنية خطأ موحدة
    """
    response_body: Dict[str, Any] = {
        "error": error_code,
        "message": message,
        "status_code": status_code,
    }

    if details:
        response_body["details"] = details

    if include_traceback and traceback_str:
        response_body["traceback"] = traceback_str

    return JSONResponse(status_code=status_code, content=response_body)


def should_include_traceback(request: Request) -> bool:
    """
    تحديد ما إذا كان يجب تضمين stack trace في الاستجابة.

    Args:
        request: طلب FastAPI

    Returns:
        True إذا كان يجب تضمين traceback
    """
    # تضمين traceback في بيئة التطوير فقط
    import os

    app_env = os.getenv("APP_ENV", "development")
    return app_env == "development"


# ============================================================
# معالجات الأخطاء المخصصة
# ============================================================


async def qurabia_exception_handler(request: Request, exc: QURABIAException) -> JSONResponse:
    """
    معالج استثناءات QURABIA المخصصة.

    Args:
        request: الطلب
        exc: الاستثناء

    Returns:
        استجابة JSON موحدة
    """
    # تسجيل الخطأ
    logger.error(
        "qurabia_exception",
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else None,
    )

    # إنشاء الاستجابة
    return create_error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        include_traceback=should_include_traceback(request),
        traceback_str=traceback.format_exc() if should_include_traceback(request) else None,
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    معالج استثناءات HTTP العامة.

    Args:
        request: الطلب
        exc: الاستثناء

    Returns:
        استجابة JSON موحدة
    """
    # تسجيل الخطأ
    logger.warning(
        "http_exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else None,
    )

    # تحديد رمز الخطأ بناءً على status code
    error_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT",
    }

    error_code = error_codes.get(exc.status_code, "HTTP_ERROR")

    return create_error_response(
        status_code=exc.status_code,
        error_code=error_code,
        message=str(exc.detail),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    معالج أخطاء التحقق من صحة البيانات.

    Args:
        request: الطلب
        exc: الاستثناء

    Returns:
        استجابة JSON مع تفاصيل أخطاء التحقق
    """
    # استخراج تفاصيل الأخطاء
    validation_errors = []
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        validation_errors.append(
            {
                "field": field_path,
                "message": error["msg"],
                "type": error["type"],
            }
        )

    # تسجيل الخطأ
    logger.warning(
        "validation_error",
        errors=validation_errors,
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else None,
    )

    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        details={"errors": validation_errors},
    )


async def pydantic_validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """
    معالج أخطاء Pydantic validation.

    Args:
        request: الطلب
        exc: الاستثناء

    Returns:
        استجابة JSON مع تفاصيل أخطاء التحقق
    """
    # استخراج تفاصيل الأخطاء
    validation_errors = []
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        validation_errors.append(
            {
                "field": field_path,
                "message": error["msg"],
                "type": error["type"],
            }
        )

    # تسجيل الخطأ
    logger.warning(
        "pydantic_validation_error",
        errors=validation_errors,
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else None,
    )

    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="VALIDATION_ERROR",
        message="Data validation failed",
        details={"errors": validation_errors},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    معالج الاستثناءات العامة (catch-all).

    Args:
        request: الطلب
        exc: الاستثناء

    Returns:
        استجابة JSON عامة
    """
    # تسجيل الخطأ مع stack trace
    logger.error(
        "unhandled_exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else None,
        exc_info=True,
    )

    # في الإنتاج، نخفي التفاصيل الفنية
    import os

    app_env = os.getenv("APP_ENV", "development")
    message = str(exc) if app_env == "development" else "An unexpected error occurred"

    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        message=message,
        include_traceback=should_include_traceback(request),
        traceback_str=traceback.format_exc() if should_include_traceback(request) else None,
    )


# ============================================================
# دالة تسجيل معالجات الأخطاء
# ============================================================


def register_error_handlers(app: FastAPI) -> None:
    """
    تسجيل جميع معالجات الأخطاء في تطبيق FastAPI.

    Args:
        app: تطبيق FastAPI
    """
    # معالج استثناءات QURABIA المخصصة
    app.add_exception_handler(QURABIAException, qurabia_exception_handler)

    # معالج استثناءات HTTP
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)

    # معالج أخطاء التحقق
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)

    # معالج عام لجميع الاستثناءات غير المعالجة
    app.add_exception_handler(Exception, generic_exception_handler)

    logger.info("Error handlers registered successfully")


# ============================================================
# Middleware لتسجيل الطلبات والأخطاء
# ============================================================


class ErrorLoggingMiddleware:
    """
    Middleware لتسجيل جميع الطلبات والأخطاء.
    """

    def __init__(self, app: Any):
        self.app = app

    async def __call__(self, scope: Dict[str, Any], receive: Callable, send: Callable) -> None:
        """
        معالجة الطلب مع تسجيل الأخطاء.

        Args:
            scope: ASGI scope
            receive: ASGI receive
            send: ASGI send
        """
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # استخراج معلومات الطلب
        path = scope.get("path", "")
        method = scope.get("method", "")
        client = scope.get("client")
        client_host = client[0] if client else None

        # تسجيل بداية الطلب
        logger.info(
            "request_started",
            path=path,
            method=method,
            client_host=client_host,
        )

        # تمرير الطلب
        try:
            await self.app(scope, receive, send)
        except Exception as exc:
            # تسجيل الخطأ
            logger.error(
                "request_failed",
                path=path,
                method=method,
                client_host=client_host,
                exception_type=type(exc).__name__,
                exception_message=str(exc),
                exc_info=True,
            )
            raise


# ============================================================
# دوال مساعدة للاستخدام في الكود
# ============================================================


def handle_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    reraise: bool = True,
) -> None:
    """
    معالجة خطأ مع تسجيله.

    Args:
        error: الخطأ
        context: سياق إضافي
        reraise: إعادة رفع الخطأ بعد التسجيل
    """
    log_context = context or {}
    log_context.update(
        {
            "exception_type": type(error).__name__,
            "exception_message": str(error),
        }
    )

    logger.error("error_handled", **log_context, exc_info=True)

    if reraise:
        raise error


def wrap_with_error_handling(func: Callable) -> Callable:
    """
    Decorator لتغليف دالة بمعالجة أخطاء تلقائية.

    Args:
        func: الدالة المراد تغليفها

    Returns:
        الدالة الملفوفة
    """

    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except QURABIAException:
            # نعيد رفع استثناءات QURABIA دون تعديل
            raise
        except Exception as e:
            # تحويل الاستثناءات العامة إلى QURABIAException
            from exceptions import QURABIAException

            logger.error(
                "wrapped_function_error",
                function_name=func.__name__,
                exception_type=type(e).__name__,
                exception_message=str(e),
                exc_info=True,
            )
            raise QURABIAException(
                message=f"Error in {func.__name__}: {str(e)}",
                status_code=500,
                error_code="INTERNAL_ERROR",
            ) from e

    def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return func(*args, **kwargs)
        except QURABIAException:
            # نعيد رفع استثناءات QURABIA دون تعديل
            raise
        except Exception as e:
            # تحويل الاستثناءات العامة إلى QURABIAException
            from exceptions import QURABIAException

            logger.error(
                "wrapped_function_error",
                function_name=func.__name__,
                exception_type=type(e).__name__,
                exception_message=str(e),
                exc_info=True,
            )
            raise QURABIAException(
                message=f"Error in {func.__name__}: {str(e)}",
                status_code=500,
                error_code="INTERNAL_ERROR",
            ) from e

    # اختيار wrapper المناسب بناءً على نوع الدالة
    import asyncio

    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper
