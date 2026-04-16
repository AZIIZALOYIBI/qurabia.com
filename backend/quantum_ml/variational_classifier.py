"""
Variational Quantum Classifier (VQC)

مصنف كمومي متغير يستخدم دوائر كمومية معلمة (PQC) للتصنيف.
يدمج quantum feature map مع ansatz معلم ويتم تدريبه باستخدام optimizers كلاسيكية.

الهيكل:
1. Feature map: ترميز البيانات الكلاسيكية إلى حالة كمومية
2. Variational circuit (Ansatz): دائرة معلمة قابلة للتدريب
3. Measurement: قياس الكيوبتات للحصول على النتيجة
4. Loss function: دالة خسارة للتدريب (cross-entropy, hinge loss, etc.)
5. Optimizer: تحسين المعاملات (COBYLA, SPSA, Adam, etc.)
"""

import numpy as np
from typing import List, Tuple, Optional, Dict, Any, Callable
from dataclasses import dataclass
import json
from .quantum_feature_map import FeatureMap, create_feature_map


@dataclass
class VQCConfig:
    """
    إعدادات VQC.
    """
    n_qubits: int
    n_layers: int = 2
    feature_map_type: str = "angle"
    ansatz_type: str = "hardware_efficient"
    entanglement: str = "linear"
    measurement_basis: str = "Z"
    optimizer: str = "cobyla"
    max_iterations: int = 100
    learning_rate: float = 0.01
    shots: int = 1024
    tolerance: float = 1e-5
    early_stopping_patience: int = 10

    def to_dict(self) -> Dict[str, Any]:
        """تحويل الإعدادات إلى قاموس"""
        return {
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "feature_map_type": self.feature_map_type,
            "ansatz_type": self.ansatz_type,
            "entanglement": self.entanglement,
            "measurement_basis": self.measurement_basis,
            "optimizer": self.optimizer,
            "max_iterations": self.max_iterations,
            "learning_rate": self.learning_rate,
            "shots": self.shots,
            "tolerance": self.tolerance,
            "early_stopping_patience": self.early_stopping_patience,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VQCConfig":
        """إنشاء من قاموس"""
        return cls(**data)


class VariationalQuantumClassifier:
    """
    Variational Quantum Classifier - مصنف كمومي متغير.

    يستخدم دوائر كمومية معلمة لتصنيف البيانات. يتم تدريب المعاملات
    باستخدام gradient descent أو optimizers gradient-free.
    """

    def __init__(self, config: VQCConfig):
        """
        Args:
            config: إعدادات VQC
        """
        self.config = config
        self.feature_map = self._create_feature_map()
        self.parameters: Optional[np.ndarray] = None
        self.n_parameters = self._calculate_n_parameters()
        self.training_history: Dict[str, List[float]] = {
            "loss": [],
            "accuracy": [],
            "iteration": [],
        }
        self.is_trained = False

    def _create_feature_map(self) -> FeatureMap:
        """إنشاء feature map حسب الإعدادات"""
        return create_feature_map(
            encoding_type=self.config.feature_map_type,
            n_qubits=self.config.n_qubits,
            entanglement=self.config.entanglement,
        )

    def _calculate_n_parameters(self) -> int:
        """حساب عدد المعاملات في الدائرة المتغيرة"""
        if self.config.ansatz_type == "hardware_efficient":
            # لكل طبقة: rotation على كل كيوبت + entanglement
            params_per_layer = self.config.n_qubits * 3  # RX, RY, RZ لكل كيوبت
            return params_per_layer * self.config.n_layers

        elif self.config.ansatz_type == "two_local":
            # Two-local ansatz: rotation + entanglement لكل طبقة
            params_per_layer = self.config.n_qubits * 2  # RY, RZ لكل كيوبت
            return params_per_layer * self.config.n_layers

        elif self.config.ansatz_type == "real_amplitudes":
            # Real amplitudes: RY rotations فقط
            params_per_layer = self.config.n_qubits
            return params_per_layer * self.config.n_layers

        else:
            raise ValueError(f"نوع ansatz غير معروف: {self.config.ansatz_type}")

    def _build_ansatz(self, parameters: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """
        بناء الدائرة المتغيرة (Ansatz) باستخدام المعاملات المعطاة.

        Args:
            parameters: معاملات الدائرة

        Returns:
            قائمة البوابات الكمومية
        """
        if len(parameters) != self.n_parameters:
            raise ValueError(
                f"عدد المعاملات ({len(parameters)}) لا يتطابق مع المتوقع ({self.n_parameters})"
            )

        gates = []
        param_idx = 0

        if self.config.ansatz_type == "hardware_efficient":
            # Hardware-efficient ansatz: RX, RY, RZ + CNOT entanglement
            for layer in range(self.config.n_layers):
                # Rotation layer
                for qubit in range(self.config.n_qubits):
                    gates.append(("RX", [qubit], [parameters[param_idx]]))
                    param_idx += 1
                    gates.append(("RY", [qubit], [parameters[param_idx]]))
                    param_idx += 1
                    gates.append(("RZ", [qubit], [parameters[param_idx]]))
                    param_idx += 1

                # Entanglement layer
                if layer < self.config.n_layers - 1:  # لا entanglement في الطبقة الأخيرة
                    gates.extend(self._add_entanglement_layer())

        elif self.config.ansatz_type == "two_local":
            # Two-local ansatz: RY, RZ + CNOT entanglement
            for layer in range(self.config.n_layers):
                for qubit in range(self.config.n_qubits):
                    gates.append(("RY", [qubit], [parameters[param_idx]]))
                    param_idx += 1
                    gates.append(("RZ", [qubit], [parameters[param_idx]]))
                    param_idx += 1

                if layer < self.config.n_layers - 1:
                    gates.extend(self._add_entanglement_layer())

        elif self.config.ansatz_type == "real_amplitudes":
            # Real amplitudes ansatz: RY rotations فقط
            for layer in range(self.config.n_layers):
                for qubit in range(self.config.n_qubits):
                    gates.append(("RY", [qubit], [parameters[param_idx]]))
                    param_idx += 1

                if layer < self.config.n_layers - 1:
                    gates.extend(self._add_entanglement_layer())

        return gates

    def _add_entanglement_layer(self) -> List[Tuple[str, List[int], List[float]]]:
        """إضافة طبقة entanglement حسب النمط المحدد"""
        gates = []

        if self.config.entanglement == "linear":
            for i in range(self.config.n_qubits - 1):
                gates.append(("CNOT", [i, i + 1], []))

        elif self.config.entanglement == "circular":
            for i in range(self.config.n_qubits - 1):
                gates.append(("CNOT", [i, i + 1], []))
            if self.config.n_qubits > 2:
                gates.append(("CNOT", [self.config.n_qubits - 1, 0], []))

        elif self.config.entanglement == "full":
            for i in range(self.config.n_qubits):
                for j in range(i + 1, self.config.n_qubits):
                    gates.append(("CNOT", [i, j], []))

        return gates

    def _build_full_circuit(
        self, features: np.ndarray, parameters: np.ndarray
    ) -> List[Tuple[str, List[int], List[float]]]:
        """
        بناء الدائرة الكاملة: feature map + ansatz.

        Args:
            features: بيانات الإدخال
            parameters: معاملات الدائرة المتغيرة

        Returns:
            الدائرة الكاملة
        """
        circuit = []

        # الجزء 1: Feature map
        circuit.extend(self.feature_map.encode(features))

        # الجزء 2: Variational circuit (Ansatz)
        circuit.extend(self._build_ansatz(parameters))

        return circuit

    def _execute_circuit(
        self, circuit: List[Tuple[str, List[int], List[float]]]
    ) -> np.ndarray:
        """
        تنفيذ الدائرة الكمومية والحصول على state vector.

        Args:
            circuit: الدائرة الكمومية

        Returns:
            state vector (amplitudes معقدة)
        """
        # تهيئة الحالة: |0...0⟩
        state = np.zeros(2 ** self.config.n_qubits, dtype=complex)
        state[0] = 1.0

        # تطبيق البوابات
        for gate_name, qubits, params in circuit:
            state = self._apply_gate(state, gate_name, qubits, params)

        return state

    def _apply_gate(
        self, state: np.ndarray, gate_name: str, qubits: List[int], params: List[float]
    ) -> np.ndarray:
        """
        تطبيق بوابة كمومية على الحالة.

        Args:
            state: الحالة الحالية
            gate_name: اسم البوابة
            qubits: الكيوبتات المستهدفة
            params: معاملات البوابة

        Returns:
            الحالة الجديدة
        """
        n = self.config.n_qubits

        if gate_name == "H":
            # Hadamard gate
            matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
            return self._apply_single_qubit_gate(state, matrix, qubits[0], n)

        elif gate_name == "X":
            # Pauli-X gate
            matrix = np.array([[0, 1], [1, 0]])
            return self._apply_single_qubit_gate(state, matrix, qubits[0], n)

        elif gate_name in ["RX", "RY", "RZ"]:
            # Rotation gates
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
            # CNOT gate
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
            # فحص البت المستهدف
            bit = (i >> target) & 1
            # حساب index الحالة الأخرى (بعد flip البت)
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
            # فحص البت control
            control_bit = (i >> control) & 1

            if control_bit == 1:
                # flip البت target
                j = i ^ (1 << target)
                new_state[i], new_state[j] = state[j], state[i]

        return new_state

    def _measure(self, state: np.ndarray) -> float:
        """
        قياس الحالة والحصول على expectation value.

        Args:
            state: الحالة الكمومية

        Returns:
            expectation value (قيمة بين -1 و 1)
        """
        if self.config.measurement_basis == "Z":
            # قياس في أساس Z على الكيوبت الأول
            # <Z> = Σᵢ |αᵢ|² × eigenvalue
            expectation = 0.0
            for i in range(len(state)):
                # eigenvalue = +1 إذا كان البت الأول 0، -1 إذا كان 1
                bit = (i >> 0) & 1
                eigenvalue = 1 if bit == 0 else -1
                expectation += (np.abs(state[i]) ** 2) * eigenvalue

            return expectation

        elif self.config.measurement_basis == "X":
            # قياس في أساس X
            # نحول الحالة إلى أساس X ثم نقيس
            # X = H Z H
            # نطبق Hadamard على الكيوبت الأول
            h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
            state_x = self._apply_single_qubit_gate(state, h_matrix, 0, self.config.n_qubits)

            expectation = 0.0
            for i in range(len(state_x)):
                bit = (i >> 0) & 1
                eigenvalue = 1 if bit == 0 else -1
                expectation += (np.abs(state_x[i]) ** 2) * eigenvalue

            return expectation

        else:
            raise ValueError(f"أساس قياس غير معروف: {self.config.measurement_basis}")

    def predict_single(self, features: np.ndarray, parameters: np.ndarray) -> int:
        """
        تنبؤ لعينة واحدة.

        Args:
            features: ميزات العينة
            parameters: معاملات النموذج

        Returns:
            التصنيف (0 أو 1)
        """
        circuit = self._build_full_circuit(features, parameters)
        state = self._execute_circuit(circuit)
        expectation = self._measure(state)

        # تحويل expectation value [-1, 1] إلى تصنيف {0, 1}
        return 0 if expectation >= 0 else 1

    def _loss_function(
        self, parameters: np.ndarray, X: np.ndarray, y: np.ndarray, loss_type: str = "mse"
    ) -> float:
        """
        حساب دالة الخسارة.

        Args:
            parameters: معاملات النموذج
            X: بيانات التدريب (n_samples, n_features)
            y: التسميات (n_samples,) - قيم 0 أو 1
            loss_type: نوع الخسارة (mse, hinge, cross_entropy)

        Returns:
            قيمة الخسارة
        """
        total_loss = 0.0
        n_samples = len(X)

        for i in range(n_samples):
            circuit = self._build_full_circuit(X[i], parameters)
            state = self._execute_circuit(circuit)
            expectation = self._measure(state)

            # تحويل expectation [-1, 1] إلى prediction [0, 1]
            # prediction = (1 - expectation) / 2
            # أو نستخدم directly للخسارة

            # تحويل label من {0, 1} إلى {-1, 1}
            label = 2 * y[i] - 1  # 0 → -1, 1 → 1

            if loss_type == "mse":
                # Mean Squared Error
                total_loss += (expectation - label) ** 2

            elif loss_type == "hinge":
                # Hinge loss (SVM-style)
                total_loss += max(0, 1 - label * expectation)

            elif loss_type == "cross_entropy":
                # Binary cross-entropy
                # نحول expectation إلى probability
                prob = (1 - expectation) / 2  # تحويل [-1, 1] إلى [0, 1]
                prob = np.clip(prob, 1e-10, 1 - 1e-10)  # تجنب log(0)

                if y[i] == 1:
                    total_loss += -np.log(prob)
                else:
                    total_loss += -np.log(1 - prob)

        return total_loss / n_samples

    def _calculate_accuracy(self, X: np.ndarray, y: np.ndarray, parameters: np.ndarray) -> float:
        """حساب دقة التصنيف"""
        correct = 0
        for i in range(len(X)):
            pred = self.predict_single(X[i], parameters)
            if pred == y[i]:
                correct += 1
        return correct / len(X)

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        loss_type: str = "mse",
        verbose: bool = True,
    ) -> Dict[str, Any]:
        """
        تدريب المصنف الكمومي.

        Args:
            X: بيانات التدريب (n_samples, n_features)
            y: التسميات (n_samples,) - قيم 0 أو 1
            X_val: بيانات التحقق (اختياري)
            y_val: تسميات التحقق (اختياري)
            loss_type: نوع الخسارة (mse, hinge, cross_entropy)
            verbose: طباعة معلومات التدريب

        Returns:
            معلومات التدريب
        """
        # التحقق من المدخلات
        if X.shape[1] != self.feature_map.feature_dimension:
            raise ValueError(
                f"عدد الميزات ({X.shape[1]}) لا يتطابق مع feature map ({self.feature_map.feature_dimension})"
            )

        if len(np.unique(y)) != 2:
            raise ValueError("حاليًا يدعم VQC التصنيف الثنائي فقط")

        # تهيئة المعاملات عشوائياً
        np.random.seed(42)
        self.parameters = np.random.uniform(-np.pi, np.pi, self.n_parameters)

        # إعداد optimizer
        if self.config.optimizer == "cobyla":
            result = self._optimize_cobyla(X, y, loss_type, verbose)
        elif self.config.optimizer == "adam":
            result = self._optimize_adam(X, y, X_val, y_val, loss_type, verbose)
        else:
            raise ValueError(f"Optimizer غير معروف: {self.config.optimizer}")

        self.is_trained = True
        return result

    def _optimize_cobyla(
        self, X: np.ndarray, y: np.ndarray, loss_type: str, verbose: bool
    ) -> Dict[str, Any]:
        """
        تحسين باستخدام COBYLA (Constrained Optimization BY Linear Approximation).

        خوارزمية gradient-free مناسبة للدوائر الكمومية.
        """
        from scipy.optimize import minimize

        iteration_count = [0]

        def objective(params):
            iteration_count[0] += 1
            loss = self._loss_function(params, X, y, loss_type)

            if verbose and iteration_count[0] % 10 == 0:
                acc = self._calculate_accuracy(X, y, params)
                print(f"Iteration {iteration_count[0]}: Loss = {loss:.6f}, Accuracy = {acc:.4f}")

            self.training_history["loss"].append(loss)
            self.training_history["iteration"].append(iteration_count[0])

            return loss

        result = minimize(
            objective,
            self.parameters,
            method="COBYLA",
            options={
                "maxiter": self.config.max_iterations,
                "tol": self.config.tolerance,
            },
        )

        self.parameters = result.x

        final_acc = self._calculate_accuracy(X, y, self.parameters)

        return {
            "success": result.success,
            "final_loss": result.fun,
            "final_accuracy": final_acc,
            "iterations": iteration_count[0],
            "message": result.message,
        }

    def _optimize_adam(
        self,
        X: np.ndarray,
        y: np.ndarray,
        X_val: Optional[np.ndarray],
        y_val: Optional[np.ndarray],
        loss_type: str,
        verbose: bool,
    ) -> Dict[str, Any]:
        """
        تحسين باستخدام Adam optimizer.

        يستخدم parameter shift rule لحساب gradients.
        """
        # Adam hyperparameters
        lr = self.config.learning_rate
        beta1 = 0.9
        beta2 = 0.999
        epsilon = 1e-8

        # تهيئة moments
        m = np.zeros(self.n_parameters)
        v = np.zeros(self.n_parameters)

        best_loss = float("inf")
        patience_counter = 0

        for iteration in range(self.config.max_iterations):
            # حساب gradient باستخدام parameter shift rule
            gradients = self._compute_gradient(self.parameters, X, y, loss_type)

            # تحديث Adam moments
            m = beta1 * m + (1 - beta1) * gradients
            v = beta2 * v + (1 - beta2) * (gradients ** 2)

            # Bias correction
            m_hat = m / (1 - beta1 ** (iteration + 1))
            v_hat = v / (1 - beta2 ** (iteration + 1))

            # تحديث المعاملات
            self.parameters -= lr * m_hat / (np.sqrt(v_hat) + epsilon)

            # حساب الخسارة والدقة
            current_loss = self._loss_function(self.parameters, X, y, loss_type)
            current_acc = self._calculate_accuracy(X, y, self.parameters)

            self.training_history["loss"].append(current_loss)
            self.training_history["accuracy"].append(current_acc)
            self.training_history["iteration"].append(iteration + 1)

            if verbose and (iteration + 1) % 10 == 0:
                print(f"Iteration {iteration + 1}: Loss = {current_loss:.6f}, Accuracy = {current_acc:.4f}")

            # Early stopping
            if current_loss < best_loss - self.config.tolerance:
                best_loss = current_loss
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= self.config.early_stopping_patience:
                if verbose:
                    print(f"Early stopping at iteration {iteration + 1}")
                break

        final_acc = self._calculate_accuracy(X, y, self.parameters)

        result = {
            "success": True,
            "final_loss": current_loss,
            "final_accuracy": final_acc,
            "iterations": iteration + 1,
        }

        # إضافة validation metrics إذا توفرت
        if X_val is not None and y_val is not None:
            val_loss = self._loss_function(self.parameters, X_val, y_val, loss_type)
            val_acc = self._calculate_accuracy(X_val, y_val, self.parameters)
            result["val_loss"] = val_loss
            result["val_accuracy"] = val_acc

        return result

    def _compute_gradient(
        self, parameters: np.ndarray, X: np.ndarray, y: np.ndarray, loss_type: str
    ) -> np.ndarray:
        """
        حساب gradient باستخدام parameter shift rule.

        للمعامل θᵢ:
        ∂L/∂θᵢ = (L(θ + π/2 eᵢ) - L(θ - π/2 eᵢ)) / 2

        حيث eᵢ هو unit vector في اتجاه i.
        """
        gradients = np.zeros(self.n_parameters)
        shift = np.pi / 2

        for i in range(self.n_parameters):
            # Shift forward
            params_plus = parameters.copy()
            params_plus[i] += shift
            loss_plus = self._loss_function(params_plus, X, y, loss_type)

            # Shift backward
            params_minus = parameters.copy()
            params_minus[i] -= shift
            loss_minus = self._loss_function(params_minus, X, y, loss_type)

            # حساب gradient
            gradients[i] = (loss_plus - loss_minus) / 2

        return gradients

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        تنبؤ لمجموعة من العينات.

        Args:
            X: بيانات الاختبار (n_samples, n_features)

        Returns:
            التصنيفات (n_samples,)
        """
        if not self.is_trained or self.parameters is None:
            raise RuntimeError("النموذج غير مدرب. استخدم fit() أولاً.")

        predictions = np.array([self.predict_single(x, self.parameters) for x in X])
        return predictions

    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """
        حساب دقة النموذج.

        Args:
            X: بيانات الاختبار
            y: التسميات الحقيقية

        Returns:
            الدقة (Accuracy)
        """
        predictions = self.predict(X)
        return np.mean(predictions == y)

    def save(self, filepath: str) -> None:
        """
        حفظ النموذج المدرب.

        Args:
            filepath: مسار الملف
        """
        if not self.is_trained:
            raise RuntimeError("لا يمكن حفظ نموذج غير مدرب")

        model_data = {
            "config": self.config.to_dict(),
            "parameters": self.parameters.tolist(),
            "training_history": self.training_history,
            "is_trained": self.is_trained,
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(model_data, f, ensure_ascii=False, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "VariationalQuantumClassifier":
        """
        تحميل نموذج محفوظ.

        Args:
            filepath: مسار الملف

        Returns:
            كائن VQC محمّل
        """
        with open(filepath, "r", encoding="utf-8") as f:
            model_data = json.load(f)

        config = VQCConfig.from_dict(model_data["config"])
        vqc = cls(config)
        vqc.parameters = np.array(model_data["parameters"])
        vqc.training_history = model_data["training_history"]
        vqc.is_trained = model_data["is_trained"]

        return vqc
