"""
Rate Limiting Module — نظام الحماية الكمومي التكيفي
====================================================

نظام متقدم للحماية من الهجمات يجمع بين:
1. Rate Limiting التقليدي (IP-based)
2. Quantum Trust Scoring (درجة الثقة الكمومية)
3. Decoherence Detection (كشف الانحراف السلوكي)
4. Adaptive Learning (التعلم المستمر)

المكونات:
- quantum_trust_engine: محرك الثقة الكمومي مع كشف الانهيار
- pattern_analyzer: تحليل الأنماط السلوكية
- middleware: تكامل FastAPI للحماية متعددة الطبقات

الاستخدام:
    from rate_limiting.middleware import quantum_rate_limit_middleware
    app.middleware("http")(quantum_rate_limit_middleware)
"""

from .quantum_trust_engine import (
    assess_risk,
    calculate_decoherence_score,
    get_trust_score,
    initialize_pattern,
)

__all__ = [
    "quantum_rate_limit_middleware",
    "get_trust_score",
    "calculate_decoherence_score",
    "assess_risk",
    "initialize_pattern",
]

__version__ = "1.0.0"
__author__ = "AZIIZALOYIBI (عبدالعزيز بن سلطان العتيبي)"
