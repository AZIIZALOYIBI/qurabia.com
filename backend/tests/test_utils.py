"""
Test Utilities and Helper Functions
===================================
Reusable utilities for backend testing
"""

import json
import time
from contextlib import contextmanager
from typing import Any, Callable, Dict, List, Optional

import numpy as np
from fastapi.testclient import TestClient


# ============================================================================
# API Testing Helpers
# ============================================================================


def assert_response_success(response, expected_status: int = 200):
    """Assert API response is successful"""
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}. "
        f"Response: {response.text}"
    )
    data = response.json()
    return data


def assert_response_error(
    response, expected_status: int, expected_error_code: Optional[str] = None
):
    """Assert API response is an error"""
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}"
    )
    data = response.json()
    assert "detail" in data or "error" in data
    if expected_error_code:
        error_code = data.get("error", {}).get("code", data.get("code"))
        assert error_code == expected_error_code
    return data


def make_request(
    client: TestClient,
    method: str,
    endpoint: str,
    data: Optional[Dict] = None,
    headers: Optional[Dict] = None,
):
    """Make API request with error handling"""
    request_method = getattr(client, method.lower())
    kwargs = {}
    if data:
        kwargs["json"] = data
    if headers:
        kwargs["headers"] = headers

    return request_method(endpoint, **kwargs)


# ============================================================================
# Quantum State Helpers
# ============================================================================


def create_quantum_state(num_qubits: int, state_type: str = "zero") -> Dict[str, Any]:
    """Create quantum state for testing"""
    dim = 2**num_qubits
    state = np.zeros(dim, dtype=complex)

    if state_type == "zero":
        state[0] = 1.0
    elif state_type == "one":
        state[-1] = 1.0
    elif state_type == "plus":
        state[:] = 1.0 / np.sqrt(dim)
    elif state_type == "bell":
        if num_qubits >= 2:
            state[0] = 1.0 / np.sqrt(2)
            state[-1] = 1.0 / np.sqrt(2)
    elif state_type == "random":
        state = np.random.randn(dim) + 1j * np.random.randn(dim)
        state /= np.linalg.norm(state)

    return {
        "amplitudes": state.tolist(),
        "num_qubits": num_qubits,
        "dimension": dim,
    }


def assert_quantum_state_normalized(amplitudes: List[complex], tolerance: float = 1e-10):
    """Verify quantum state is normalized"""
    state = np.array(amplitudes)
    norm = np.sum(np.abs(state) ** 2)
    assert abs(norm - 1.0) < tolerance, f"State not normalized: |ψ|² = {norm}"


def assert_quantum_states_equal(
    state1: List[complex], state2: List[complex], tolerance: float = 1e-10
):
    """Compare two quantum states"""
    s1 = np.array(state1)
    s2 = np.array(state2)
    assert len(s1) == len(s2), "States have different dimensions"

    # Account for global phase
    diff = np.abs(s1 - s2)
    assert np.all(diff < tolerance), f"States differ: max diff = {np.max(diff)}"


def compute_fidelity(state1: List[complex], state2: List[complex]) -> float:
    """Compute fidelity between two quantum states"""
    s1 = np.array(state1)
    s2 = np.array(state2)
    return abs(np.dot(np.conj(s1), s2)) ** 2


# ============================================================================
# Data Validation Helpers
# ============================================================================


def validate_schema(data: Dict, required_fields: List[str]):
    """Validate data has required fields"""
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"


def validate_type(value: Any, expected_type: type):
    """Validate value type"""
    assert isinstance(value, expected_type), (
        f"Expected type {expected_type.__name__}, got {type(value).__name__}"
    )


def validate_range(value: float, min_val: float, max_val: float):
    """Validate value is in range"""
    assert min_val <= value <= max_val, (
        f"Value {value} not in range [{min_val}, {max_val}]"
    )


# ============================================================================
# Performance Testing Helpers
# ============================================================================


@contextmanager
def measure_time():
    """Context manager to measure execution time"""
    start = time.perf_counter()
    times = {"duration": 0}
    yield times
    times["duration"] = time.perf_counter() - start


def assert_performance(duration: float, threshold: float, operation: str = "Operation"):
    """Assert operation completed within time threshold"""
    assert duration <= threshold, (
        f"{operation} took {duration:.4f}s, exceeds threshold {threshold}s"
    )


def benchmark_function(func: Callable, iterations: int = 100) -> Dict[str, float]:
    """Benchmark a function"""
    times = []
    for _ in range(iterations):
        with measure_time() as t:
            func()
        times.append(t["duration"])

    times_array = np.array(times)
    return {
        "mean": np.mean(times_array),
        "median": np.median(times_array),
        "std": np.std(times_array),
        "min": np.min(times_array),
        "max": np.max(times_array),
        "p95": np.percentile(times_array, 95),
        "p99": np.percentile(times_array, 99),
    }


# ============================================================================
# Mock Data Generators
# ============================================================================


class MockDataFactory:
    """Factory for generating mock data"""

    @staticmethod
    def user(role: str = "user", **overrides) -> Dict[str, Any]:
        """Generate mock user"""
        user = {
            "id": f"user_{int(time.time() * 1000)}",
            "email": f"user_{int(time.time())}@qurabia.com",
            "name": "مستخدم اختبار",
            "role": role,
            "permissions": ["read"],
            "created_at": time.time(),
        }
        user.update(overrides)
        return user

    @staticmethod
    def quantum_circuit(num_qubits: int = 2, num_gates: int = 3) -> Dict[str, Any]:
        """Generate mock quantum circuit"""
        gates = []
        gate_types = ["H", "X", "Y", "Z", "CNOT", "CZ"]

        for i in range(num_gates):
            gate_type = gate_types[i % len(gate_types)]
            if gate_type in ["H", "X", "Y", "Z"]:
                gates.append({"type": gate_type, "qubit": i % num_qubits})
            else:
                gates.append({
                    "type": gate_type,
                    "control": i % num_qubits,
                    "target": (i + 1) % num_qubits,
                })

        return {
            "num_qubits": num_qubits,
            "gates": gates,
            "measurements": list(range(num_qubits)),
        }

    @staticmethod
    def equation(**overrides) -> Dict[str, Any]:
        """Generate mock equation"""
        eq = {
            "id": f"eq_{int(time.time() * 1000)}",
            "expression": "E = mc²",
            "variables": {
                "E": {"name": "Energy", "unit": "J"},
                "m": {"name": "Mass", "unit": "kg"},
                "c": {"name": "Speed of Light", "value": 299792458},
            },
            "result": None,
        }
        eq.update(overrides)
        return eq


# ============================================================================
# Arabic Text Helpers
# ============================================================================


def is_arabic(text: str) -> bool:
    """Check if text contains Arabic characters"""
    arabic_range = range(0x0600, 0x06FF + 1)
    return any(ord(char) in arabic_range for char in text)


def validate_arabic_text(text: str, min_length: int = 1):
    """Validate Arabic text"""
    assert len(text) >= min_length, f"Text too short: {len(text)} < {min_length}"
    assert is_arabic(text), "Text does not contain Arabic characters"


# ============================================================================
# Security Testing Helpers
# ============================================================================


def validate_jwt_token(token: str):
    """Validate JWT token structure"""
    parts = token.split(".")
    assert len(parts) == 3, f"Invalid JWT format: expected 3 parts, got {len(parts)}"


def validate_encryption(plaintext: str, ciphertext: str):
    """Validate encryption worked"""
    assert plaintext != ciphertext, "Ciphertext equals plaintext (no encryption)"
    assert len(ciphertext) > 0, "Empty ciphertext"


def validate_signature(signature: str):
    """Validate signature format"""
    assert len(signature) > 0, "Empty signature"
    assert isinstance(signature, str), "Signature must be string"


# ============================================================================
# Test Data Persistence
# ============================================================================


class TestDataStore:
    """Store test data for reuse across tests"""

    _store: Dict[str, Any] = {}

    @classmethod
    def set(cls, key: str, value: Any):
        """Store value"""
        cls._store[key] = value

    @classmethod
    def get(cls, key: str, default: Any = None) -> Any:
        """Retrieve value"""
        return cls._store.get(key, default)

    @classmethod
    def clear(cls):
        """Clear all stored data"""
        cls._store.clear()

    @classmethod
    def exists(cls, key: str) -> bool:
        """Check if key exists"""
        return key in cls._store


# ============================================================================
# AAA Pattern Helper
# ============================================================================


class AAATest:
    """Helper for AAA (Arrange-Act-Assert) pattern"""

    def __init__(self, name: str = ""):
        self.name = name
        self.arranged = False
        self.acted = False

    @contextmanager
    def arrange(self):
        """Arrange phase"""
        print(f"\n📋 Arrange: {self.name}")
        self.arranged = True
        yield

    @contextmanager
    def act(self):
        """Act phase"""
        assert self.arranged, "Must call arrange() before act()"
        print(f"⚡ Act: {self.name}")
        self.acted = True
        yield

    @contextmanager
    def assert_that(self):
        """Assert phase"""
        assert self.acted, "Must call act() before assert_that()"
        print(f"✓ Assert: {self.name}")
        yield
