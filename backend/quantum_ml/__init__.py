"""
QURABIA Quantum Machine Learning Module

نظام متقدم للتعلم الآلي الكمومي يدمج الدوائر الكمومية المُعَلَّمة (PQC)
مع خوارزميات التحسين الكلاسيكية لإنشاء نماذج تعلم هجينة.

Modules:
    - quantum_feature_map: تحويل البيانات الكلاسيكية إلى حالات كمومية
    - variational_classifier: مصنفات كمومية متغيرة (VQC)
    - quantum_kernels: طرق Kernel الكمومية
    - hybrid_neural_network: شبكات عصبية هجينة
    - qml_pipeline: خط الأنابيب الرئيسي للتدريب والاستدلال
"""

from .quantum_feature_map import (
    AmplitudeEncoding,
    AngleEncoding,
    FeatureMap,
    IQPEncoding,
)
from .variational_classifier import VariationalQuantumClassifier
from .quantum_kernels import QuantumKernel, FidelityKernel
from .hybrid_neural_network import HybridQuantumNeuralNetwork
from .qml_pipeline import QMLPipeline, QMLConfig, TrainingResult

__all__ = [
    "FeatureMap",
    "AmplitudeEncoding",
    "AngleEncoding",
    "IQPEncoding",
    "VariationalQuantumClassifier",
    "QuantumKernel",
    "FidelityKernel",
    "HybridQuantumNeuralNetwork",
    "QMLPipeline",
    "QMLConfig",
    "TrainingResult",
]

__version__ = "1.0.0"
