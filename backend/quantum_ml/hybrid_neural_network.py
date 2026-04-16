"""
Hybrid Quantum-Classical Neural Networks

شبكات عصبية هجينة تدمج طبقات كمومية وكلاسيكية في بنية واحدة.
تستفيد من قوة الدوائر الكمومية المعلمة مع مرونة الشبكات العصبية الكلاسيكية.

الهيكل العام:
Input → Classical Layers → Quantum Layer → Classical Layers → Output

الطبقة الكمومية تعمل كـ "quantum feature extractor" أو "quantum transformation".
"""

import numpy as np
from typing import List, Tuple, Optional, Dict, Any, Callable
from dataclasses import dataclass
from .quantum_feature_map import FeatureMap, AngleEncoding


@dataclass
class HybridNNConfig:
    """
    إعدادات Hybrid Quantum-Classical Neural Network.
    """
    n_qubits: int
    classical_input_dim: int
    classical_hidden_dims: List[int] = None  # أبعاد الطبقات الكلاسيكية قبل الكم
    quantum_layers: int = 2
    classical_output_dims: List[int] = None  # أبعاد الطبقات الكلاسيكية بعد الكم
    n_classes: int = 2
    activation: str = "relu"
    quantum_activation: str = "none"
    learning_rate: float = 0.01
    batch_size: int = 32
    max_epochs: int = 100
    optimizer: str = "adam"

    def __post_init__(self):
        """تهيئة القيم الافتراضية"""
        if self.classical_hidden_dims is None:
            self.classical_hidden_dims = [64]
        if self.classical_output_dims is None:
            self.classical_output_dims = [32]

    def to_dict(self) -> Dict[str, Any]:
        """تحويل إلى قاموس"""
        return {
            "n_qubits": self.n_qubits,
            "classical_input_dim": self.classical_input_dim,
            "classical_hidden_dims": self.classical_hidden_dims,
            "quantum_layers": self.quantum_layers,
            "classical_output_dims": self.classical_output_dims,
            "n_classes": self.n_classes,
            "activation": self.activation,
            "quantum_activation": self.quantum_activation,
            "learning_rate": self.learning_rate,
            "batch_size": self.batch_size,
            "max_epochs": self.max_epochs,
            "optimizer": self.optimizer,
        }


class QuantumLayer:
    """
    طبقة كمومية في شبكة عصبية هجينة.

    تحول المدخلات الكلاسيكية إلى حالة كمومية، تطبق دائرة معلمة، ثم تقيس.
    """

    def __init__(
        self,
        n_qubits: int,
        n_layers: int = 2,
        measurement_type: str = "expectation",
    ):
        """
        Args:
            n_qubits: عدد الكيوبتات
            n_layers: عدد طبقات الدائرة المعلمة
            measurement_type: نوع القياس (expectation, probabilities)
        """
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.measurement_type = measurement_type

        # حساب عدد المعاملات
        # لكل طبقة: RY rotation لكل كيوبت + CNOT entanglement
        self.n_parameters = n_qubits * n_layers

        # تهيئة المعاملات عشوائياً
        self.parameters = np.random.uniform(-np.pi, np.pi, self.n_parameters)

        # Feature map للترميز
        self.feature_map = AngleEncoding(n_qubits, rotation_gate="RY", entanglement="linear")

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        التمرير الأمامي عبر الطبقة الكمومية.

        Args:
            x: مدخلات (n_qubits,)

        Returns:
            مخرجات بعد القياس
        """
        # بناء الدائرة الكمومية
        circuit = self._build_circuit(x)

        # تنفيذ الدائرة
        state = self._execute_circuit(circuit)

        # قياس
        output = self._measure(state)

        return output

    def _build_circuit(self, features: np.ndarray) -> List[Tuple[str, List[int], List[float]]]:
        """بناء دائرة كمومية كاملة"""
        gates = []

        # Feature encoding
        gates.extend(self.feature_map.encode(features))

        # Variational layers
        param_idx = 0
        for layer in range(self.n_layers):
            # Rotation layer
            for qubit in range(self.n_qubits):
                gates.append(("RY", [qubit], [self.parameters[param_idx]]))
                param_idx += 1

            # Entanglement layer
            if layer < self.n_layers - 1:
                for i in range(self.n_qubits - 1):
                    gates.append(("CNOT", [i, i + 1], []))

        return gates

    def _execute_circuit(self, circuit: List[Tuple[str, List[int], List[float]]]) -> np.ndarray:
        """تنفيذ الدائرة"""
        state = np.zeros(2 ** self.n_qubits, dtype=complex)
        state[0] = 1.0

        for gate_name, qubits, params in circuit:
            state = self._apply_gate(state, gate_name, qubits, params)

        return state

    def _apply_gate(
        self, state: np.ndarray, gate_name: str, qubits: List[int], params: List[float]
    ) -> np.ndarray:
        """تطبيق بوابة كمومية"""
        n = self.n_qubits

        if gate_name == "H":
            matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
            return self._apply_single_qubit_gate(state, matrix, qubits[0], n)

        elif gate_name in ["RX", "RY", "RZ"]:
            theta = params[0]
            if gate_name == "RY":
                matrix = np.array([
                    [np.cos(theta / 2), -np.sin(theta / 2)],
                    [np.sin(theta / 2), np.cos(theta / 2)]
                ])
            else:
                raise NotImplementedError(f"بوابة {gate_name} غير مدعومة في هذه الطبقة")
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
        """تطبيق CNOT"""
        new_state = state.copy()
        dim = 2 ** n_qubits

        for i in range(dim):
            control_bit = (i >> control) & 1
            if control_bit == 1:
                j = i ^ (1 << target)
                new_state[i], new_state[j] = state[j], state[i]

        return new_state

    def _measure(self, state: np.ndarray) -> np.ndarray:
        """
        قياس الحالة الكمومية.

        Returns:
            مصفوفة قيم القياس
        """
        if self.measurement_type == "expectation":
            # قياس expectation values لكل كيوبت في أساس Z
            expectations = np.zeros(self.n_qubits)
            for qubit_idx in range(self.n_qubits):
                exp_val = 0.0
                for i in range(len(state)):
                    bit = (i >> qubit_idx) & 1
                    eigenvalue = 1 if bit == 0 else -1
                    exp_val += (np.abs(state[i]) ** 2) * eigenvalue
                expectations[qubit_idx] = exp_val
            return expectations

        elif self.measurement_type == "probabilities":
            # إرجاع احتمالات جميع الحالات
            probabilities = np.abs(state) ** 2
            return probabilities

        else:
            raise ValueError(f"نوع قياس غير معروف: {self.measurement_type}")

    def get_output_dim(self) -> int:
        """الحصول على بعد المخرجات"""
        if self.measurement_type == "expectation":
            return self.n_qubits
        elif self.measurement_type == "probabilities":
            return 2 ** self.n_qubits
        else:
            raise ValueError(f"نوع قياس غير معروف: {self.measurement_type}")


class HybridQuantumNeuralNetwork:
    """
    Hybrid Quantum-Classical Neural Network.

    شبكة عصبية هجينة تدمج طبقات كلاسيكية وكمومية.
    """

    def __init__(self, config: HybridNNConfig):
        """
        Args:
            config: إعدادات الشبكة
        """
        self.config = config
        self.layers: List[Any] = []
        self.is_trained = False

        # بناء الشبكة
        self._build_network()

    def _build_network(self) -> None:
        """بناء بنية الشبكة"""
        current_dim = self.config.classical_input_dim

        # الطبقات الكلاسيكية قبل الطبقة الكمومية
        for hidden_dim in self.config.classical_hidden_dims:
            layer = DenseLayer(current_dim, hidden_dim, activation=self.config.activation)
            self.layers.append(layer)
            current_dim = hidden_dim

        # طبقة projection إلى بعد الكيوبتات
        if current_dim != self.config.n_qubits:
            projection = DenseLayer(current_dim, self.config.n_qubits, activation="linear")
            self.layers.append(projection)

        # الطبقة الكمومية
        quantum_layer = QuantumLayer(
            n_qubits=self.config.n_qubits,
            n_layers=self.config.quantum_layers,
            measurement_type="expectation",
        )
        self.layers.append(quantum_layer)
        current_dim = quantum_layer.get_output_dim()

        # الطبقات الكلاسيكية بعد الطبقة الكمومية
        for hidden_dim in self.config.classical_output_dims:
            layer = DenseLayer(current_dim, hidden_dim, activation=self.config.activation)
            self.layers.append(layer)
            current_dim = hidden_dim

        # طبقة الخرج
        output_layer = DenseLayer(current_dim, self.config.n_classes, activation="softmax")
        self.layers.append(output_layer)

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        التمرير الأمامي عبر الشبكة.

        Args:
            x: مدخلات (batch_size, input_dim) أو (input_dim,)

        Returns:
            مخرجات (batch_size, n_classes) أو (n_classes,)
        """
        # معالجة batch أو عينة واحدة
        single_input = x.ndim == 1
        if single_input:
            x = x.reshape(1, -1)

        batch_size = x.shape[0]
        outputs = []

        # تمرير كل عينة عبر الشبكة
        for i in range(batch_size):
            activation = x[i]
            for layer in self.layers:
                activation = layer.forward(activation)
            outputs.append(activation)

        result = np.array(outputs)
        return result[0] if single_input else result

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        تنبؤ التصنيفات.

        Args:
            X: بيانات الإدخال (n_samples, n_features)

        Returns:
            التصنيفات (n_samples,)
        """
        if not self.is_trained:
            raise RuntimeError("النموذج غير مدرب")

        outputs = self.forward(X)
        predictions = np.argmax(outputs, axis=1)
        return predictions

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        verbose: bool = True,
    ) -> Dict[str, Any]:
        """
        تدريب الشبكة.

        Args:
            X_train: بيانات التدريب
            y_train: تسميات التدريب
            X_val: بيانات التحقق (اختياري)
            y_val: تسميات التحقق (اختياري)
            verbose: طباعة معلومات التدريب

        Returns:
            معلومات التدريب
        """
        history = {
            "train_loss": [],
            "train_accuracy": [],
            "val_loss": [],
            "val_accuracy": [],
        }

        n_samples = len(X_train)
        n_batches = (n_samples + self.config.batch_size - 1) // self.config.batch_size

        for epoch in range(self.config.max_epochs):
            # Shuffle data
            indices = np.random.permutation(n_samples)
            X_shuffled = X_train[indices]
            y_shuffled = y_train[indices]

            epoch_loss = 0.0

            # Mini-batch training
            for batch_idx in range(n_batches):
                start_idx = batch_idx * self.config.batch_size
                end_idx = min(start_idx + self.config.batch_size, n_samples)

                X_batch = X_shuffled[start_idx:end_idx]
                y_batch = y_shuffled[start_idx:end_idx]

                # Forward pass
                outputs = self.forward(X_batch)

                # Compute loss
                loss = self._compute_loss(outputs, y_batch)
                epoch_loss += loss

                # Backward pass and update (simplified)
                # في تنفيذ كامل، نحتاج backpropagation عبر الطبقات الكمومية والكلاسيكية
                # هنا نستخدم تقريب بسيط
                self._update_parameters(X_batch, y_batch, outputs)

            # حساب metrics
            avg_loss = epoch_loss / n_batches
            train_acc = self.score(X_train, y_train)

            history["train_loss"].append(avg_loss)
            history["train_accuracy"].append(train_acc)

            # Validation
            if X_val is not None and y_val is not None:
                val_outputs = self.forward(X_val)
                val_loss = self._compute_loss(val_outputs, y_val)
                val_acc = self.score(X_val, y_val)

                history["val_loss"].append(val_loss)
                history["val_accuracy"].append(val_acc)

                if verbose and (epoch + 1) % 10 == 0:
                    print(
                        f"Epoch {epoch + 1}/{self.config.max_epochs}: "
                        f"Loss = {avg_loss:.4f}, Acc = {train_acc:.4f}, "
                        f"Val Loss = {val_loss:.4f}, Val Acc = {val_acc:.4f}"
                    )
            else:
                if verbose and (epoch + 1) % 10 == 0:
                    print(
                        f"Epoch {epoch + 1}/{self.config.max_epochs}: "
                        f"Loss = {avg_loss:.4f}, Acc = {train_acc:.4f}"
                    )

        self.is_trained = True
        return history

    def _compute_loss(self, outputs: np.ndarray, targets: np.ndarray) -> float:
        """
        حساب cross-entropy loss.

        Args:
            outputs: مخرجات الشبكة (probabilities)
            targets: التسميات الحقيقية

        Returns:
            قيمة الخسارة
        """
        # تحويل targets إلى one-hot encoding
        n_samples = len(targets)
        targets_one_hot = np.zeros((n_samples, self.config.n_classes))
        targets_one_hot[np.arange(n_samples), targets] = 1

        # Cross-entropy loss
        epsilon = 1e-10
        outputs_clipped = np.clip(outputs, epsilon, 1 - epsilon)
        loss = -np.mean(np.sum(targets_one_hot * np.log(outputs_clipped), axis=1))

        return loss

    def _update_parameters(
        self, X_batch: np.ndarray, y_batch: np.ndarray, outputs: np.ndarray
    ) -> None:
        """
        تحديث معاملات الشبكة (simplified version).

        في تنفيذ كامل، نحتاج:
        1. Backpropagation عبر الطبقات الكلاسيكية
        2. Parameter shift rule للطبقات الكمومية
        3. Gradient descent
        """
        # TODO: تنفيذ كامل لـ backpropagation
        # حالياً نستخدم تقريب بسيط لتحديث الطبقة الكمومية فقط

        # البحث عن الطبقة الكمومية
        quantum_layer = None
        for layer in self.layers:
            if isinstance(layer, QuantumLayer):
                quantum_layer = layer
                break

        if quantum_layer is not None:
            # تحديث بسيط للمعاملات الكمومية
            # في الواقع نحتاج gradient من backpropagation
            learning_rate = self.config.learning_rate
            perturbation = np.random.randn(quantum_layer.n_parameters) * learning_rate * 0.1
            quantum_layer.parameters += perturbation

    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """حساب دقة النموذج"""
        predictions = self.predict(X)
        return np.mean(predictions == y)


class DenseLayer:
    """
    طبقة كلاسيكية كاملة الاتصال (Fully Connected).
    """

    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        activation: str = "relu",
    ):
        """
        Args:
            input_dim: بعد المدخلات
            output_dim: بعد المخرجات
            activation: دالة التفعيل (relu, sigmoid, tanh, softmax, linear)
        """
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.activation = activation

        # تهيئة الأوزان والانحيازات
        # Xavier/Glorot initialization
        limit = np.sqrt(6 / (input_dim + output_dim))
        self.weights = np.random.uniform(-limit, limit, (input_dim, output_dim))
        self.bias = np.zeros(output_dim)

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        التمرير الأمامي.

        Args:
            x: مدخلات (input_dim,)

        Returns:
            مخرجات (output_dim,)
        """
        # Linear transformation
        z = np.dot(x, self.weights) + self.bias

        # Activation
        return self._activate(z)

    def _activate(self, z: np.ndarray) -> np.ndarray:
        """تطبيق دالة التفعيل"""
        if self.activation == "relu":
            return np.maximum(0, z)

        elif self.activation == "sigmoid":
            return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

        elif self.activation == "tanh":
            return np.tanh(z)

        elif self.activation == "softmax":
            exp_z = np.exp(z - np.max(z))  # numerical stability
            return exp_z / np.sum(exp_z)

        elif self.activation == "linear":
            return z

        else:
            raise ValueError(f"دالة تفعيل غير معروفة: {self.activation}")


# ────────────────────────────────────────────────────────────────────────────
# Helper functions
# ────────────────────────────────────────────────────────────────────────────

def create_hybrid_model(
    input_dim: int,
    n_qubits: int,
    n_classes: int,
    classical_hidden_dims: Optional[List[int]] = None,
    quantum_layers: int = 2,
) -> HybridQuantumNeuralNetwork:
    """
    Factory function لإنشاء hybrid model.

    Args:
        input_dim: بعد المدخلات
        n_qubits: عدد الكيوبتات
        n_classes: عدد الفئات
        classical_hidden_dims: أبعاد الطبقات الكلاسيكية
        quantum_layers: عدد طبقات الدائرة الكمومية

    Returns:
        شبكة هجينة
    """
    if classical_hidden_dims is None:
        classical_hidden_dims = [64, 32]

    config = HybridNNConfig(
        n_qubits=n_qubits,
        classical_input_dim=input_dim,
        classical_hidden_dims=classical_hidden_dims,
        quantum_layers=quantum_layers,
        classical_output_dims=[32],
        n_classes=n_classes,
    )

    return HybridQuantumNeuralNetwork(config)
