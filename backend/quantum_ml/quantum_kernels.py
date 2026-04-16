"""
Quantum Kernel Methods

طرق Quantum Kernel للتعلم الآلي الكمومي. تستخدم دوائر كمومية لحساب
kernel functions التي تقيس التشابه بين نقاط البيانات في فضاء Hilbert.

الفكرة الأساسية:
K(x, x') = |⟨φ(x)|φ(x')⟩|²

حيث φ(x) هي feature map كمومية تحول x إلى حالة كمومية.

هذا يسمح باستخدام خوارزميات ML كلاسيكية (مثل SVM) مع kernels كمومية.
"""

import numpy as np
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from .quantum_feature_map import FeatureMap, create_feature_map


@dataclass
class KernelConfig:
    """
    إعدادات Quantum Kernel.
    """
    n_qubits: int
    feature_map_type: str = "zz"
    feature_map_reps: int = 2
    entanglement: str = "linear"
    measurement_type: str = "state_fidelity"

    def to_dict(self) -> Dict[str, Any]:
        """تحويل إلى قاموس"""
        return {
            "n_qubits": self.n_qubits,
            "feature_map_type": self.feature_map_type,
            "feature_map_reps": self.feature_map_reps,
            "entanglement": self.entanglement,
            "measurement_type": self.measurement_type,
        }


class QuantumKernel:
    """
    Quantum Kernel - kernel كمومي عام.

    يحسب kernel matrix بين نقاط البيانات باستخدام دوائر كمومية.
    """

    def __init__(self, config: KernelConfig):
        """
        Args:
            config: إعدادات Kernel
        """
        self.config = config
        self.feature_map = self._create_feature_map()
        self._kernel_cache: Dict[tuple, float] = {}

    def _create_feature_map(self) -> FeatureMap:
        """إنشاء feature map"""
        return create_feature_map(
            encoding_type=self.config.feature_map_type,
            n_qubits=self.config.n_qubits,
            reps=self.config.feature_map_reps,
            entanglement=self.config.entanglement,
        )

    def compute_kernel_element(self, x1: np.ndarray, x2: np.ndarray) -> float:
        """
        حساب عنصر kernel واحد K(x1, x2).

        Args:
            x1: نقطة بيانات أولى
            x2: نقطة بيانات ثانية

        Returns:
            قيمة kernel
        """
        # فحص cache أولاً
        cache_key = (tuple(x1), tuple(x2))
        if cache_key in self._kernel_cache:
            return self._kernel_cache[cache_key]

        # حساب kernel
        if self.config.measurement_type == "state_fidelity":
            kernel_value = self._compute_fidelity_kernel(x1, x2)
        elif self.config.measurement_type == "swap_test":
            kernel_value = self._compute_swap_test_kernel(x1, x2)
        else:
            raise ValueError(f"نوع قياس غير معروف: {self.config.measurement_type}")

        # حفظ في cache
        self._kernel_cache[cache_key] = kernel_value
        self._kernel_cache[(tuple(x2), tuple(x1))] = kernel_value  # symmetric

        return kernel_value

    def _compute_fidelity_kernel(self, x1: np.ndarray, x2: np.ndarray) -> float:
        """
        حساب kernel باستخدام state fidelity.

        K(x1, x2) = |⟨ψ(x1)|ψ(x2)⟩|²

        يتم حسابه عن طريق تطبيق U(x1)† U(x2) والقياس.
        """
        # بناء دائرة x1
        circuit1 = self.feature_map.encode(x1)
        state1 = self._execute_circuit(circuit1)

        # بناء دائرة x2
        circuit2 = self.feature_map.encode(x2)
        state2 = self._execute_circuit(circuit2)

        # حساب inner product
        inner_product = np.dot(np.conj(state1), state2)

        # fidelity = |⟨ψ₁|ψ₂⟩|²
        fidelity = np.abs(inner_product) ** 2

        return fidelity

    def _compute_swap_test_kernel(self, x1: np.ndarray, x2: np.ndarray) -> float:
        """
        حساب kernel باستخدام SWAP test.

        SWAP test هو دائرة كمومية تقيس التداخل بين حالتين.
        يستخدم ancilla qubit إضافي.
        """
        # TODO: تنفيذ SWAP test
        # حالياً نستخدم fidelity kernel
        return self._compute_fidelity_kernel(x1, x2)

    def _execute_circuit(self, circuit: List[tuple]) -> np.ndarray:
        """
        تنفيذ دائرة كمومية والحصول على state vector.

        Args:
            circuit: قائمة البوابات

        Returns:
            state vector
        """
        # تهيئة الحالة
        state = np.zeros(2 ** self.config.n_qubits, dtype=complex)
        state[0] = 1.0

        # تطبيق البوابات
        for gate_name, qubits, params in circuit:
            state = self._apply_gate(state, gate_name, qubits, params)

        return state

    def _apply_gate(
        self, state: np.ndarray, gate_name: str, qubits: List[int], params: List[float]
    ) -> np.ndarray:
        """تطبيق بوابة كمومية"""
        n = self.config.n_qubits

        if gate_name == "H":
            matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
            return self._apply_single_qubit_gate(state, matrix, qubits[0], n)

        elif gate_name == "X":
            matrix = np.array([[0, 1], [1, 0]])
            return self._apply_single_qubit_gate(state, matrix, qubits[0], n)

        elif gate_name in ["RX", "RY", "RZ"]:
            theta = params[0]
            if gate_name == "RX":
                matrix = np.array([
                    [np.cos(theta / 2), -1j * np.sin(theta / 2)],
                    [-1j * np.sin(theta / 2), np.cos(theta / 2)]
                ])
            elif gate_name == "RY":
                matrix = np.array([
                    [np.cos(theta / 2), -np.sin(theta / 2)],
                    [np.sin(theta / 2), np.cos(theta / 2)]
                ])
            else:  # RZ
                matrix = np.array([
                    [np.exp(-1j * theta / 2), 0],
                    [0, np.exp(1j * theta / 2)]
                ])
            return self._apply_single_qubit_gate(state, matrix, qubits[0], n)

        elif gate_name == "CNOT":
            return self._apply_cnot(state, qubits[0], qubits[1], n)

        else:
            raise ValueError(f"بوابة غير معروفة: {gate_name}")

    def _apply_single_qubit_gate(
        self, state: np.ndarray, matrix: np.ndarray, target: int, n_qubits: int
    ) -> np.ndarray:
        """تطبيق بوابة أحادية الكيوبت"""
        new_state = np.zeros_like(state)
        dim = 2 ** n_qubits

        for i in range(dim):
            bit = (i >> target) & 1
            j = i ^ (1 << target)

            if bit == 0:
                new_state[i] += matrix[0, 0] * state[i] + matrix[0, 1] * state[j]
            else:
                new_state[i] += matrix[1, 0] * state[j] + matrix[1, 1] * state[i]

        return new_state

    def _apply_cnot(
        self, state: np.ndarray, control: int, target: int, n_qubits: int
    ) -> np.ndarray:
        """تطبيق بوابة CNOT"""
        new_state = state.copy()
        dim = 2 ** n_qubits

        for i in range(dim):
            control_bit = (i >> control) & 1

            if control_bit == 1:
                j = i ^ (1 << target)
                new_state[i], new_state[j] = state[j], state[i]

        return new_state

    def compute_kernel_matrix(
        self, X1: np.ndarray, X2: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        حساب kernel matrix كاملة.

        Args:
            X1: مصفوفة بيانات أولى (n_samples1, n_features)
            X2: مصفوفة بيانات ثانية (n_samples2, n_features) - إذا كانت None، يُستخدم X1

        Returns:
            kernel matrix (n_samples1, n_samples2)
        """
        if X2 is None:
            X2 = X1
            symmetric = True
        else:
            symmetric = False

        n1 = len(X1)
        n2 = len(X2)
        K = np.zeros((n1, n2))

        # حساب kernel matrix
        for i in range(n1):
            for j in range(n2):
                if symmetric and j < i:
                    # استخدام التناظر
                    K[i, j] = K[j, i]
                else:
                    K[i, j] = self.compute_kernel_element(X1[i], X2[j])

        return K

    def clear_cache(self) -> None:
        """مسح cache الـ kernel"""
        self._kernel_cache.clear()


class FidelityKernel(QuantumKernel):
    """
    Fidelity Kernel - kernel مبني على state fidelity.

    حالة خاصة من QuantumKernel مع measurement_type = "state_fidelity".
    """

    def __init__(
        self,
        n_qubits: int,
        feature_map_type: str = "zz",
        feature_map_reps: int = 2,
        entanglement: str = "linear",
    ):
        config = KernelConfig(
            n_qubits=n_qubits,
            feature_map_type=feature_map_type,
            feature_map_reps=feature_map_reps,
            entanglement=entanglement,
            measurement_type="state_fidelity",
        )
        super().__init__(config)


class QuantumKernelSVM:
    """
    Quantum Kernel SVM - SVM يستخدم quantum kernel.

    يدمج quantum kernel مع خوارزمية SVM الكلاسيكية.
    """

    def __init__(self, kernel: QuantumKernel, C: float = 1.0, kernel_type: str = "precomputed"):
        """
        Args:
            kernel: كائن QuantumKernel
            C: معامل regularization لـ SVM
            kernel_type: نوع kernel (precomputed للـ quantum kernels)
        """
        self.kernel = kernel
        self.C = C
        self.kernel_type = kernel_type

        # سنستخدم SVM من sklearn
        try:
            from sklearn.svm import SVC
            self.svm = SVC(kernel="precomputed", C=C)
        except ImportError:
            raise ImportError("يرجى تثبيت scikit-learn: pip install scikit-learn")

        self.X_train: Optional[np.ndarray] = None
        self.is_trained = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> "QuantumKernelSVM":
        """
        تدريب SVM باستخدام quantum kernel.

        Args:
            X: بيانات التدريب (n_samples, n_features)
            y: التسميات (n_samples,)

        Returns:
            self
        """
        # حفظ بيانات التدريب
        self.X_train = X.copy()

        # حساب kernel matrix
        K_train = self.kernel.compute_kernel_matrix(X)

        # تدريب SVM
        self.svm.fit(K_train, y)
        self.is_trained = True

        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        تنبؤ لبيانات جديدة.

        Args:
            X: بيانات الاختبار (n_samples, n_features)

        Returns:
            التصنيفات
        """
        if not self.is_trained:
            raise RuntimeError("النموذج غير مدرب. استخدم fit() أولاً.")

        # حساب kernel matrix بين بيانات الاختبار والتدريب
        K_test = self.kernel.compute_kernel_matrix(X, self.X_train)

        # تنبؤ
        return self.svm.predict(K_test)

    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """
        حساب دقة النموذج.

        Args:
            X: بيانات الاختبار
            y: التسميات الحقيقية

        Returns:
            الدقة
        """
        predictions = self.predict(X)
        return np.mean(predictions == y)


class QuantumKernelAlignment:
    """
    Quantum Kernel Alignment - محاذاة kernel كمومي مع البيانات.

    يحسن معاملات feature map لزيادة التوافق بين kernel والبيانات.
    """

    def __init__(self, base_kernel: QuantumKernel):
        """
        Args:
            base_kernel: kernel أساسي للتحسين
        """
        self.base_kernel = base_kernel

    def compute_alignment(self, K: np.ndarray, y: np.ndarray) -> float:
        """
        حساب kernel-target alignment.

        Args:
            K: kernel matrix
            y: التسميات

        Returns:
            قيمة alignment (بين 0 و 1)
        """
        # بناء ideal kernel matrix (y_i * y_j)
        Y = np.outer(y, y)

        # حساب alignment
        # A(K, Y) = <K, Y> / (||K|| ||Y||)
        numerator = np.sum(K * Y)
        denominator = np.sqrt(np.sum(K * K) * np.sum(Y * Y))

        if denominator == 0:
            return 0.0

        alignment = numerator / denominator
        return alignment

    def optimize_alignment(
        self, X: np.ndarray, y: np.ndarray, n_iterations: int = 50
    ) -> Dict[str, Any]:
        """
        تحسين alignment عن طريق تعديل معاملات feature map.

        Args:
            X: بيانات التدريب
            y: التسميات
            n_iterations: عدد التكرارات

        Returns:
            نتائج التحسين
        """
        # TODO: تنفيذ optimization algorithm
        # يمكن استخدام gradient-based methods أو evolutionary algorithms

        # حالياً نحسب فقط alignment الحالي
        K = self.base_kernel.compute_kernel_matrix(X)
        current_alignment = self.compute_alignment(K, y)

        return {
            "initial_alignment": current_alignment,
            "final_alignment": current_alignment,
            "iterations": 0,
        }


# ────────────────────────────────────────────────────────────────────────────
# Helper functions
# ────────────────────────────────────────────────────────────────────────────

def compare_kernels(
    kernels: List[QuantumKernel],
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    C: float = 1.0,
) -> Dict[str, Dict[str, float]]:
    """
    مقارنة أداء kernels مختلفة.

    Args:
        kernels: قائمة kernels للمقارنة
        X_train: بيانات التدريب
        y_train: تسميات التدريب
        X_test: بيانات الاختبار
        y_test: تسميات الاختبار
        C: معامل regularization

    Returns:
        قاموس بنتائج كل kernel
    """
    results = {}

    for i, kernel in enumerate(kernels):
        # تدريب SVM
        qsvm = QuantumKernelSVM(kernel, C=C)
        qsvm.fit(X_train, y_train)

        # تقييم
        train_acc = qsvm.score(X_train, y_train)
        test_acc = qsvm.score(X_test, y_test)

        # حساب alignment
        K_train = kernel.compute_kernel_matrix(X_train)
        alignment_calculator = QuantumKernelAlignment(kernel)
        alignment = alignment_calculator.compute_alignment(K_train, y_train)

        results[f"kernel_{i}"] = {
            "train_accuracy": train_acc,
            "test_accuracy": test_acc,
            "kernel_alignment": alignment,
            "config": kernel.config.to_dict(),
        }

    return results


def visualize_kernel_matrix(K: np.ndarray, title: str = "Quantum Kernel Matrix") -> None:
    """
    عرض kernel matrix بصرياً.

    Args:
        K: kernel matrix
        title: عنوان الرسم
    """
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns

        plt.figure(figsize=(10, 8))
        sns.heatmap(K, cmap="viridis", square=True, cbar_kws={"label": "Kernel Value"})
        plt.title(title)
        plt.xlabel("Sample Index")
        plt.ylabel("Sample Index")
        plt.tight_layout()
        plt.show()

    except ImportError:
        print("يرجى تثبيت matplotlib و seaborn لعرض الرسوم البيانية")
        print("pip install matplotlib seaborn")
