"""
Quantum Feature Maps - تحويل البيانات الكلاسيكية إلى حالات كمومية

يوفر هذا الملف خرائط features متعددة لتحويل البيانات الكلاسيكية إلى دوائر كمومية:
- Amplitude Encoding: ترميز البيانات في amplitudes الحالة الكمومية
- Angle Encoding: ترميز البيانات في زوايا الدوران
- IQP Encoding: Instantaneous Quantum Polynomial encoding
"""

import numpy as np
from typing import List, Callable, Tuple
from abc import ABC, abstractmethod


class FeatureMap(ABC):
    """
    الفئة الأساسية لجميع خرائط الميزات الكمومية.

    تحول البيانات الكلاسيكية (feature vectors) إلى دوائر كمومية معلمة.
    """

    def __init__(self, n_qubits: int):
        """
        Args:
            n_qubits: عدد الكيوبتات المستخدمة
        """
        if n_qubits <= 0:
            raise ValueError("عدد الكيوبتات يجب أن يكون أكبر من صفر")
        self.n_qubits = n_qubits
        self.feature_dimension = self._calculate_feature_dimension()

    @abstractmethod
    def _calculate_feature_dimension(self) -> int:
        """حساب عدد الميزات التي يمكن ترميزها"""
        pass

    @abstractmethod
    def encode(self, features: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """
        تحويل features إلى دائرة كمومية.

        Args:
            features: مصفوفة الميزات بحجم (feature_dimension,)

        Returns:
            قائمة من البوابات الكمومية بصيغة (gate_name, qubits, parameters)
        """
        pass

    def validate_features(self, features: np.ndarray) -> None:
        """التحقق من صحة بيانات الإدخال"""
        if features.shape[0] != self.feature_dimension:
            raise ValueError(
                f"عدد الميزات ({features.shape[0]}) لا يتطابق مع البعد المتوقع ({self.feature_dimension})"
            )


class AmplitudeEncoding(FeatureMap):
    """
    Amplitude Encoding: ترميز البيانات مباشرة في amplitudes الحالة الكمومية.

    لـ n كيوبت، يمكن ترميز 2^n قيمة. الحالة الناتجة:
    |ψ⟩ = Σᵢ xᵢ|i⟩

    حيث xᵢ هي الميزات المُطَبَّعة (normalized).
    """

    def _calculate_feature_dimension(self) -> int:
        return 2 ** self.n_qubits

    def encode(self, features: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """
        ترميز الميزات باستخدام Amplitude encoding.

        الخطوات:
        1. تطبيع الميزات (normalization)
        2. تطبيق بوابات متعددة لتحقيق الحالة المطلوبة
        """
        self.validate_features(features)

        # تطبيع الميزات
        norm = np.linalg.norm(features)
        if norm == 0:
            raise ValueError("لا يمكن ترميز vector صفري")
        normalized_features = features / norm

        # بناء الدائرة باستخدام decomposition متكرر
        gates = self._amplitude_encoding_circuit(normalized_features)
        return gates

    def _amplitude_encoding_circuit(self, amplitudes: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """
        بناء دائرة كمومية لترميز amplitudes محددة.

        يستخدم decomposition هرمي باستخدام بوابات RY و CNOT.
        """
        gates = []
        n = len(amplitudes)

        if n == 1:
            return gates

        # حساب زاوية الدوران للكيوبت الأول
        # cos(θ/2) = ||first_half|| / ||all||
        half = n // 2
        first_half_norm = np.linalg.norm(amplitudes[:half])

        if first_half_norm > 1e-10:
            theta = 2 * np.arccos(np.clip(first_half_norm, 0, 1))
            gates.append(("RY", [0], [theta]))

        # تطبيق recursion على النصفين
        if half > 1:
            # ترميز النصف الأول (عندما يكون الكيوبت الأول |0⟩)
            if first_half_norm > 1e-10:
                sub_gates = self._amplitude_encoding_circuit(amplitudes[:half] / first_half_norm)
                # تحويل indices الكيوبتات
                for gate_name, qubits, params in sub_gates:
                    gates.append((gate_name, [q + 1 for q in qubits], params))

        second_half_norm = np.linalg.norm(amplitudes[half:])
        if half > 1 and second_half_norm > 1e-10:
            # ترميز النصف الثاني (عندما يكون الكيوبت الأول |1⟩)
            # نحتاج CNOT controlled decomposition
            gates.append(("X", [0], []))
            sub_gates = self._amplitude_encoding_circuit(amplitudes[half:] / second_half_norm)
            for gate_name, qubits, params in sub_gates:
                gates.append((gate_name, [q + 1 for q in qubits], params))
            gates.append(("X", [0], []))

        return gates


class AngleEncoding(FeatureMap):
    """
    Angle Encoding: ترميز كل ميزة في زاوية دوران كيوبت.

    لكل ميزة xᵢ:
    - يتم تطبيق RY(xᵢ) أو RZ(xᵢ) على الكيوبت i
    - اختياريًا يمكن إضافة entanglement بين الكيوبتات
    """

    def __init__(self, n_qubits: int, rotation_gate: str = "RY", entanglement: str = "linear"):
        """
        Args:
            n_qubits: عدد الكيوبتات
            rotation_gate: نوع بوابة الدوران (RY, RZ, RX)
            entanglement: نمط الترابط (linear, full, circular, none)
        """
        super().__init__(n_qubits)

        if rotation_gate not in ["RX", "RY", "RZ"]:
            raise ValueError(f"بوابة دوران غير صالحة: {rotation_gate}")

        if entanglement not in ["linear", "full", "circular", "none"]:
            raise ValueError(f"نمط ترابط غير صالح: {entanglement}")

        self.rotation_gate = rotation_gate
        self.entanglement = entanglement

    def _calculate_feature_dimension(self) -> int:
        return self.n_qubits

    def encode(self, features: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """
        ترميز الميزات باستخدام Angle encoding.

        كل ميزة xᵢ يتم ترميزها كزاوية دوران على الكيوبت i.
        """
        self.validate_features(features)

        gates = []

        # الخطوة 1: تطبيق Hadamard على جميع الكيوبتات (اختياري لإنشاء superposition أولي)
        for i in range(self.n_qubits):
            gates.append(("H", [i], []))

        # الخطوة 2: تطبيق rotation gates مع زوايا الميزات
        for i in range(self.n_qubits):
            gates.append((self.rotation_gate, [i], [features[i]]))

        # الخطوة 3: إضافة entanglement
        gates.extend(self._add_entanglement())

        return gates

    def _add_entanglement(self) -> List[Tuple[str, List[int], List[float]]]:
        """إضافة بوابات CNOT حسب نمط الترابط المحدد"""
        gates = []

        if self.entanglement == "none":
            return gates

        elif self.entanglement == "linear":
            # ترابط خطي: 0→1, 1→2, 2→3, ...
            for i in range(self.n_qubits - 1):
                gates.append(("CNOT", [i, i + 1], []))

        elif self.entanglement == "circular":
            # ترابط دائري: linear + آخر→أول
            for i in range(self.n_qubits - 1):
                gates.append(("CNOT", [i, i + 1], []))
            if self.n_qubits > 2:
                gates.append(("CNOT", [self.n_qubits - 1, 0], []))

        elif self.entanglement == "full":
            # ترابط كامل: كل كيوبت مع كل كيوبت
            for i in range(self.n_qubits):
                for j in range(i + 1, self.n_qubits):
                    gates.append(("CNOT", [i, j], []))

        return gates


class IQPEncoding(FeatureMap):
    """
    IQP (Instantaneous Quantum Polynomial) Encoding.

    يستخدم تفاعلات من الدرجة الثانية بين الميزات:
    U(x) = exp(i Σᵢⱼ φᵢⱼ(xᵢ, xⱼ) ZᵢZⱼ) exp(i Σᵢ φᵢ(xᵢ) Zᵢ)

    هذا النوع قوي لمسائل التصنيف غير الخطية.
    """

    def __init__(self, n_qubits: int, reps: int = 2):
        """
        Args:
            n_qubits: عدد الكيوبتات
            reps: عدد تكرارات طبقة IQP
        """
        super().__init__(n_qubits)
        if reps < 1:
            raise ValueError("عدد التكرارات يجب أن يكون أكبر من صفر")
        self.reps = reps

    def _calculate_feature_dimension(self) -> int:
        return self.n_qubits

    def encode(self, features: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """
        ترميز الميزات باستخدام IQP encoding.

        يطبق طبقات متكررة من:
        1. Z-rotations بزوايا الميزات
        2. ZZ-interactions بين الكيوبتات المجاورة
        """
        self.validate_features(features)

        gates = []

        # الخطوة الأولية: Hadamard على جميع الكيوبتات
        for i in range(self.n_qubits):
            gates.append(("H", [i], []))

        # تطبيق طبقات IQP متكررة
        for rep in range(self.reps):
            # طبقة 1: Z-rotations بزوايا الميزات
            for i in range(self.n_qubits):
                gates.append(("RZ", [i], [features[i]]))

            # طبقة 2: ZZ-interactions (تفاعلات من الدرجة الثانية)
            for i in range(self.n_qubits - 1):
                # ZZ-rotation بين كيوبتات مجاورة
                angle = (np.pi - features[i]) * (np.pi - features[i + 1])
                gates.extend(self._zz_rotation(i, i + 1, angle))

        return gates

    def _zz_rotation(self, qubit1: int, qubit2: int, angle: float) -> List[Tuple[str, List[int], List[float]]]:
        """
        تطبيق ZZ-rotation بين كيوبتين.

        ZZ(θ) = exp(-i θ/2 Z₁Z₂) يمكن تحليله إلى:
        CNOT(1,2) - RZ(θ) على 2 - CNOT(1,2)
        """
        return [
            ("CNOT", [qubit1, qubit2], []),
            ("RZ", [qubit2], [angle]),
            ("CNOT", [qubit1, qubit2], []),
        ]


class ZZFeatureMap(FeatureMap):
    """
    ZZ Feature Map - خريطة ميزات تستخدم تفاعلات Pauli-Z.

    مشابه لـ IQP لكن مع تحكم أكبر في التفاعلات.
    """

    def __init__(self, n_qubits: int, reps: int = 2, entanglement: str = "linear"):
        super().__init__(n_qubits)
        self.reps = reps
        self.entanglement = entanglement

    def _calculate_feature_dimension(self) -> int:
        return self.n_qubits

    def encode(self, features: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """ترميز باستخدام ZZ feature map"""
        self.validate_features(features)

        gates = []

        # Hadamard layer
        for i in range(self.n_qubits):
            gates.append(("H", [i], []))

        for rep in range(self.reps):
            # First-order terms
            for i in range(self.n_qubits):
                gates.append(("RZ", [i], [2.0 * features[i]]))

            # Second-order terms
            pairs = self._get_entanglement_pairs()
            for i, j in pairs:
                angle = 2.0 * (np.pi - features[i]) * (np.pi - features[j])
                gates.extend(self._zz_rotation(i, j, angle))

        return gates

    def _get_entanglement_pairs(self) -> List[Tuple[int, int]]:
        """الحصول على أزواج الكيوبتات للترابط"""
        pairs = []

        if self.entanglement == "linear":
            pairs = [(i, i + 1) for i in range(self.n_qubits - 1)]
        elif self.entanglement == "full":
            pairs = [(i, j) for i in range(self.n_qubits) for j in range(i + 1, self.n_qubits)]
        elif self.entanglement == "circular":
            pairs = [(i, i + 1) for i in range(self.n_qubits - 1)]
            if self.n_qubits > 2:
                pairs.append((self.n_qubits - 1, 0))

        return pairs

    def _zz_rotation(self, qubit1: int, qubit2: int, angle: float) -> List[Tuple[str, List[int], List[float]]]:
        """تطبيق ZZ-rotation"""
        return [
            ("CNOT", [qubit1, qubit2], []),
            ("RZ", [qubit2], [angle]),
            ("CNOT", [qubit1, qubit2], []),
        ]


# ────────────────────────────────────────────────────────────────────────────
# Helper functions
# ────────────────────────────────────────────────────────────────────────────

def create_feature_map(
    encoding_type: str,
    n_qubits: int,
    **kwargs
) -> FeatureMap:
    """
    Factory function لإنشاء feature map.

    Args:
        encoding_type: نوع الترميز (amplitude, angle, iqp, zz)
        n_qubits: عدد الكيوبتات
        **kwargs: معاملات إضافية حسب النوع

    Returns:
        كائن FeatureMap
    """
    encoding_map = {
        "amplitude": AmplitudeEncoding,
        "angle": AngleEncoding,
        "iqp": IQPEncoding,
        "zz": ZZFeatureMap,
    }

    if encoding_type not in encoding_map:
        raise ValueError(
            f"نوع ترميز غير معروف: {encoding_type}. "
            f"الأنواع المتاحة: {list(encoding_map.keys())}"
        )

    return encoding_map[encoding_type](n_qubits, **kwargs)


def preprocess_features(features: np.ndarray, method: str = "minmax") -> np.ndarray:
    """
    معالجة مسبقة للميزات قبل الترميز الكمومي.

    Args:
        features: مصفوفة الميزات
        method: طريقة المعالجة (minmax, standard, normalize)

    Returns:
        ميزات معالجة
    """
    if method == "minmax":
        # تحويل إلى نطاق [0, 2π]
        min_val = np.min(features)
        max_val = np.max(features)
        if max_val - min_val < 1e-10:
            return np.zeros_like(features)
        return 2 * np.pi * (features - min_val) / (max_val - min_val)

    elif method == "standard":
        # تطبيع قياسي (mean=0, std=1) ثم تحويل لنطاق [0, 2π]
        mean = np.mean(features)
        std = np.std(features)
        if std < 1e-10:
            return np.zeros_like(features)
        normalized = (features - mean) / std
        # تحويل إلى [0, 2π]
        return np.pi * (normalized + 3) / 3

    elif method == "normalize":
        # تطبيع vector (L2 norm)
        norm = np.linalg.norm(features)
        if norm < 1e-10:
            return np.zeros_like(features)
        return features / norm * 2 * np.pi

    else:
        raise ValueError(f"طريقة معالجة غير معروفة: {method}")
