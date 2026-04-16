"""
ethics_ai – نظام AI للحوكمة الأخلاقية
QURABIA

نظام متقدم للتعلم الآلي والتحليل الأخلاقي:
- تتبع وتحليل القرارات الأخلاقية
- تعلم من feedback المستخدمين
- تحسين ديناميكي للدستور الأخلاقي
- Explainable AI للقرارات
"""

from .decision_history import DecisionHistory, EthicsDecisionRecord
from .ethics_analyzer import EthicsAnalyzer
from .ethics_learner import EthicsLearner
from .ethics_optimizer import EthicsOptimizer

__all__ = [
    "DecisionHistory",
    "EthicsDecisionRecord",
    "EthicsAnalyzer",
    "EthicsLearner",
    "EthicsOptimizer",
]
