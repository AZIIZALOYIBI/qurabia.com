"""
QURABIA LingBot-Map Service
خدمة معالجة اللغة الطبيعية العربية المتقدمة

المطور: عبدالعزيز بن سلطان العتيبي
الإصدار: 1.0.0
"""

import logging
import os
import time
from typing import Any

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.format_exc_info,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=False,
)

logger = structlog.get_logger()

# Initialize FastAPI app
app = FastAPI(
    title="QURABIA LingBot-Map",
    description="خدمة معالجة اللغة الطبيعية العربية المتقدمة",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://qurabia.com",
        "https://www.qurabia.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ══════════════════════════════════════════════════════════════════════════════


class HealthResponse(BaseModel):
    """Health check response model"""

    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    environment: str = Field(..., description="Environment (development/production)")
    timestamp: float = Field(..., description="Current timestamp")


class AnalyzeTextRequest(BaseModel):
    """Text analysis request model"""

    text: str = Field(..., min_length=1, max_length=10000, description="Arabic text to analyze")
    include_sentiment: bool = Field(default=True, description="Include sentiment analysis")
    include_entities: bool = Field(default=True, description="Include named entity recognition")
    include_topics: bool = Field(default=False, description="Include topic extraction")


class AnalyzeTextResponse(BaseModel):
    """Text analysis response model"""

    text_length: int = Field(..., description="Length of analyzed text")
    language: str = Field(..., description="Detected language")
    sentiment: dict[str, Any] | None = Field(None, description="Sentiment analysis results")
    entities: list[dict[str, Any]] | None = Field(None, description="Named entities")
    topics: list[str] | None = Field(None, description="Extracted topics")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class SummarizeTextRequest(BaseModel):
    """Text summarization request model"""

    text: str = Field(..., min_length=50, max_length=50000, description="Arabic text to summarize")
    max_length: int = Field(default=150, ge=50, le=500, description="Maximum summary length")
    style: str = Field(default="extractive", pattern="^(extractive|abstractive)$")


class SummarizeTextResponse(BaseModel):
    """Text summarization response model"""

    summary: str = Field(..., description="Generated summary")
    original_length: int = Field(..., description="Original text length")
    summary_length: int = Field(..., description="Summary length")
    compression_ratio: float = Field(..., description="Compression ratio")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


# ══════════════════════════════════════════════════════════════════════════════
# MIDDLEWARE
# ══════════════════════════════════════════════════════════════════════════════


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = (time.time() - start_time) * 1000

    # Log request details
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration, 2),
    )

    return response


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH & STATUS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    فحص صحة الخدمة
    Health check endpoint
    """
    return HealthResponse(
        status="healthy",
        service="lingbot-map",
        version="1.0.0",
        environment=os.getenv("APP_ENV", "development"),
        timestamp=time.time(),
    )


@app.get("/", response_model=dict[str, Any], tags=["Root"])
async def root():
    """
    نقطة الدخول الرئيسية
    Root endpoint
    """
    return {
        "service": "QURABIA LingBot-Map",
        "description": "خدمة معالجة اللغة الطبيعية العربية المتقدمة",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "analyze": "/api/lingbot/analyze",
            "summarize": "/api/lingbot/summarize",
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# CORE NLP ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════


@app.post("/api/lingbot/analyze", response_model=AnalyzeTextResponse, tags=["NLP"])
async def analyze_text(request: AnalyzeTextRequest):
    """
    تحليل نص عربي متقدم
    Advanced Arabic text analysis

    Features:
    - Sentiment analysis (تحليل المشاعر)
    - Named entity recognition (التعرف على الكيانات)
    - Topic extraction (استخراج المواضيع)
    """
    start_time = time.time()

    try:
        # TODO: Implement actual NLP processing
        # For now, return mock data
        result = AnalyzeTextResponse(
            text_length=len(request.text),
            language="ar",
            sentiment=(
                {
                    "polarity": "positive",
                    "score": 0.75,
                    "confidence": 0.92,
                }
                if request.include_sentiment
                else None
            ),
            entities=(
                [
                    {"text": "قرابيا", "type": "ORG", "start": 0, "end": 5},
                ]
                if request.include_entities
                else None
            ),
            topics=(["تكنولوجيا", "ذكاء اصطناعي"] if request.include_topics else None),
            processing_time_ms=round((time.time() - start_time) * 1000, 2),
        )

        logger.info(
            "text_analyzed",
            text_length=result.text_length,
            language=result.language,
            processing_time_ms=result.processing_time_ms,
        )

        return result

    except Exception as e:
        logger.error("analysis_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}") from e


@app.post("/api/lingbot/summarize", response_model=SummarizeTextResponse, tags=["NLP"])
async def summarize_text(request: SummarizeTextRequest):
    """
    تلخيص نص عربي
    Arabic text summarization

    Supports:
    - Extractive summarization (تلخيص استخراجي)
    - Abstractive summarization (تلخيص تجريدي)
    """
    start_time = time.time()

    try:
        # TODO: Implement actual summarization
        # For now, return mock summary
        original_length = len(request.text)
        summary = request.text[: request.max_length] + "..."
        summary_length = len(summary)

        result = SummarizeTextResponse(
            summary=summary,
            original_length=original_length,
            summary_length=summary_length,
            compression_ratio=round(summary_length / original_length, 2),
            processing_time_ms=round((time.time() - start_time) * 1000, 2),
        )

        logger.info(
            "text_summarized",
            original_length=original_length,
            summary_length=summary_length,
            compression_ratio=result.compression_ratio,
            processing_time_ms=result.processing_time_ms,
        )

        return result

    except Exception as e:
        logger.error("summarization_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}") from e


# ══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ══════════════════════════════════════════════════════════════════════════════


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": exc.detail,
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error("unhandled_exception", error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("APP_ENV") == "development" else "An error occurred",
        },
    )


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP & SHUTDOWN
# ══════════════════════════════════════════════════════════════════════════════


@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    logger.info(
        "service_starting",
        service="lingbot-map",
        version="1.0.0",
        environment=os.getenv("APP_ENV", "development"),
        port=os.getenv("PORT", "10001"),
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("service_shutting_down", service="lingbot-map")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "10001"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("APP_ENV") == "development",
        log_level="info",
    )
