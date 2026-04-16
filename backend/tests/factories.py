"""
Test Data Factories
==================
Generate realistic test data using factory pattern
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
import random
import string


# ============================================================================
# User Factories
# ============================================================================


@dataclass
class UserFactory:
    """Factory for creating test users"""

    id: str = field(default_factory=lambda: f"user_{random.randint(1000, 9999)}")
    email: str = field(
        default_factory=lambda: f"user{random.randint(100, 999)}@qurabia.com"
    )
    name: str = "مستخدم اختبار"
    role: str = "user"
    permissions: List[str] = field(default_factory=lambda: ["read"])
    created_at: str = field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    last_login: Optional[str] = None
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "permissions": self.permissions,
            "created_at": self.created_at,
            "last_login": self.last_login,
            "is_active": self.is_active,
        }

    @classmethod
    def create_admin(cls) -> "UserFactory":
        """Create admin user"""
        return cls(
            role="admin",
            name="مدير النظام",
            permissions=["read", "write", "delete", "admin"],
        )

    @classmethod
    def create_researcher(cls) -> "UserFactory":
        """Create researcher user"""
        return cls(
            role="researcher",
            name="باحث",
            permissions=["read", "write", "experiment", "quantum"],
        )

    @classmethod
    def create_guest(cls) -> "UserFactory":
        """Create guest user"""
        return cls(role="guest", name="زائر", permissions=["read"])


# ============================================================================
# Quantum Circuit Factories
# ============================================================================


@dataclass
class QuantumCircuitFactory:
    """Factory for creating quantum circuits"""

    num_qubits: int = 2
    gates: List[Dict[str, Any]] = field(default_factory=list)
    measurements: List[int] = field(default_factory=list)

    def add_hadamard(self, qubit: int) -> "QuantumCircuitFactory":
        """Add Hadamard gate"""
        self.gates.append({"type": "H", "qubit": qubit})
        return self

    def add_cnot(self, control: int, target: int) -> "QuantumCircuitFactory":
        """Add CNOT gate"""
        self.gates.append({"type": "CNOT", "control": control, "target": target})
        return self

    def add_x(self, qubit: int) -> "QuantumCircuitFactory":
        """Add Pauli-X gate"""
        self.gates.append({"type": "X", "qubit": qubit})
        return self

    def add_y(self, qubit: int) -> "QuantumCircuitFactory":
        """Add Pauli-Y gate"""
        self.gates.append({"type": "Y", "qubit": qubit})
        return self

    def add_z(self, qubit: int) -> "QuantumCircuitFactory":
        """Add Pauli-Z gate"""
        self.gates.append({"type": "Z", "qubit": qubit})
        return self

    def add_measurement(self, qubit: int) -> "QuantumCircuitFactory":
        """Add measurement"""
        if qubit not in self.measurements:
            self.measurements.append(qubit)
        return self

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "num_qubits": self.num_qubits,
            "gates": self.gates,
            "measurements": self.measurements,
        }

    @classmethod
    def bell_state(cls) -> "QuantumCircuitFactory":
        """Create Bell state circuit"""
        return cls(num_qubits=2).add_hadamard(0).add_cnot(0, 1)

    @classmethod
    def ghz_state(cls, num_qubits: int = 3) -> "QuantumCircuitFactory":
        """Create GHZ state circuit"""
        circuit = cls(num_qubits=num_qubits).add_hadamard(0)
        for i in range(num_qubits - 1):
            circuit.add_cnot(i, i + 1)
        return circuit

    @classmethod
    def random_circuit(cls, num_qubits: int = 2, depth: int = 5) -> "QuantumCircuitFactory":
        """Create random circuit"""
        circuit = cls(num_qubits=num_qubits)
        gate_types = ["H", "X", "Y", "Z"]

        for _ in range(depth):
            gate = random.choice(gate_types)
            qubit = random.randint(0, num_qubits - 1)

            if gate == "H":
                circuit.add_hadamard(qubit)
            elif gate == "X":
                circuit.add_x(qubit)
            elif gate == "Y":
                circuit.add_y(qubit)
            elif gate == "Z":
                circuit.add_z(qubit)

            # Occasionally add CNOT
            if random.random() < 0.3 and num_qubits > 1:
                control = random.randint(0, num_qubits - 1)
                target = (control + 1) % num_qubits
                circuit.add_cnot(control, target)

        return circuit


# ============================================================================
# API Request Factories
# ============================================================================


@dataclass
class AUTDIERequestFactory:
    """Factory for AUTDIE engine requests"""

    decision_type: str = "approval"
    context: Dict[str, float] = field(
        default_factory=lambda: {
            "trust_score": 0.85,
            "uncertainty": 0.15,
            "temporal_factor": 0.90,
        }
    )
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "decision_type": self.decision_type,
            "context": self.context,
            "metadata": self.metadata,
        }

    @classmethod
    def high_confidence(cls) -> "AUTDIERequestFactory":
        """Create high confidence request"""
        return cls(
            context={
                "trust_score": 0.95,
                "uncertainty": 0.05,
                "temporal_factor": 0.95,
            }
        )

    @classmethod
    def low_confidence(cls) -> "AUTDIERequestFactory":
        """Create low confidence request"""
        return cls(
            context={
                "trust_score": 0.60,
                "uncertainty": 0.40,
                "temporal_factor": 0.65,
            }
        )


@dataclass
class AlUtaibiRequestFactory:
    """Factory for Al-Utaibi equation requests"""

    equation_type: str = "unified_field"
    parameters: Dict[str, float] = field(
        default_factory=lambda: {"x": 1.0, "t": 0.0, "energy": 100.0}
    )
    precision: str = "high"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "equation_type": self.equation_type,
            "parameters": self.parameters,
            "precision": self.precision,
        }


# ============================================================================
# Arabic Text Factories
# ============================================================================


class ArabicTextFactory:
    """Factory for generating Arabic text"""

    WORDS = [
        "السلام",
        "عليكم",
        "مرحبا",
        "أهلا",
        "شكرا",
        "قرابيا",
        "ذكاء",
        "اصطناعي",
        "حوسبة",
        "كمومية",
        "علوم",
        "تكنولوجيا",
        "بحث",
        "تطوير",
    ]

    SENTENCES = [
        "مرحباً بكم في منصة قرابيا",
        "الذكاء الاصطناعي والحوسبة الكمومية",
        "نبني جسراً بين الحضارة العربية والتكنولوجيا",
        "الفيزياء الكمومية تدرس الجسيمات الذرية",
        "الرياضيات هي لغة العلوم",
    ]

    @classmethod
    def word(cls) -> str:
        """Generate random Arabic word"""
        return random.choice(cls.WORDS)

    @classmethod
    def sentence(cls) -> str:
        """Generate random Arabic sentence"""
        return random.choice(cls.SENTENCES)

    @classmethod
    def paragraph(cls, num_sentences: int = 3) -> str:
        """Generate Arabic paragraph"""
        sentences = random.sample(cls.SENTENCES, min(num_sentences, len(cls.SENTENCES)))
        return " ".join(sentences) + "."

    @classmethod
    def text(cls, num_words: int = 10) -> str:
        """Generate Arabic text with specific word count"""
        words = [random.choice(cls.WORDS) for _ in range(num_words)]
        return " ".join(words)


# ============================================================================
# Equation Factories
# ============================================================================


@dataclass
class EquationFactory:
    """Factory for creating equations"""

    id: str = field(default_factory=lambda: f"eq_{random.randint(1000, 9999)}")
    expression: str = "E = mc²"
    variables: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    category: str = "physics"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "expression": self.expression,
            "variables": self.variables,
            "category": self.category,
        }

    @classmethod
    def einstein_mass_energy(cls) -> "EquationFactory":
        """Create Einstein's mass-energy equation"""
        return cls(
            expression="E = mc²",
            variables={
                "E": {"name": "Energy", "unit": "J"},
                "m": {"name": "Mass", "unit": "kg"},
                "c": {"name": "Speed of Light", "value": 299792458},
            },
            category="physics",
        )

    @classmethod
    def schrodinger(cls) -> "EquationFactory":
        """Create Schrödinger equation"""
        return cls(
            expression="iℏ∂ψ/∂t = Ĥψ",
            variables={
                "ψ": {"name": "Wave function"},
                "ℏ": {"name": "Reduced Planck constant", "value": 1.054571817e-34},
                "Ĥ": {"name": "Hamiltonian operator"},
            },
            category="quantum",
        )


# ============================================================================
# Helper Functions
# ============================================================================


def create_batch_users(count: int, role: str = "user") -> List[Dict[str, Any]]:
    """Create multiple users"""
    return [UserFactory(role=role).to_dict() for _ in range(count)]


def create_batch_circuits(count: int, num_qubits: int = 2) -> List[Dict[str, Any]]:
    """Create multiple quantum circuits"""
    return [
        QuantumCircuitFactory.random_circuit(num_qubits=num_qubits).to_dict()
        for _ in range(count)
    ]
