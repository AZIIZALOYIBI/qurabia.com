"""
Pytest Configuration and Fixtures
=================================
Centralized test configuration for QURABIA backend
"""

import os
import sys
from pathlib import Path
from typing import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture(scope="session")
def test_env():
    """Set test environment variables"""
    os.environ["APP_ENV"] = "testing"
    os.environ["KEM_MASTER_SEED"] = "test_seed_12345_for_testing_only"
    os.environ["DSA_SIGNING_KEY"] = "test_key_67890_for_testing_only"
    os.environ["LOG_LEVEL"] = "WARNING"
    yield
    # Cleanup
    os.environ.pop("APP_ENV", None)
    os.environ.pop("KEM_MASTER_SEED", None)
    os.environ.pop("DSA_SIGNING_KEY", None)


@pytest.fixture(scope="session")
def app(test_env):
    """Create FastAPI application instance"""
    from main import app as fastapi_app
    return fastapi_app


@pytest.fixture(scope="function")
def client(app) -> Generator[TestClient, None, None]:
    """Create test client for synchronous tests"""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
async def async_client(app) -> AsyncGenerator[AsyncClient, None]:
    """Create async client for async tests"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="function")
def mock_user():
    """Create mock user for authentication tests"""
    return {
        "id": "user_test_123",
        "email": "test@qurabia.com",
        "name": "مستخدم اختبار",
        "role": "user",
        "permissions": ["read", "write"],
    }


@pytest.fixture(scope="function")
def mock_admin():
    """Create mock admin user"""
    return {
        "id": "admin_test_123",
        "email": "admin@qurabia.com",
        "name": "مدير اختبار",
        "role": "admin",
        "permissions": ["read", "write", "delete", "admin"],
    }


@pytest.fixture(scope="function")
def auth_headers(mock_user):
    """Generate authentication headers"""
    # In real app, generate JWT token
    token = "test_jwt_token_xyz123"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def quantum_state_2qubit():
    """Create 2-qubit quantum state fixture"""
    import numpy as np

    # |00⟩ state
    state = np.array([1.0, 0.0, 0.0, 0.0], dtype=complex)
    return {
        "amplitudes": state.tolist(),
        "num_qubits": 2,
        "dimension": 4,
    }


@pytest.fixture(scope="function")
def bell_state():
    """Create Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2"""
    import numpy as np

    state = np.array([1 / np.sqrt(2), 0.0, 0.0, 1 / np.sqrt(2)], dtype=complex)
    return {
        "amplitudes": state.tolist(),
        "num_qubits": 2,
        "dimension": 4,
        "is_entangled": True,
    }


@pytest.fixture(scope="function")
def quantum_circuit():
    """Create sample quantum circuit"""
    return {
        "num_qubits": 2,
        "gates": [
            {"type": "H", "qubit": 0},
            {"type": "CNOT", "control": 0, "target": 1},
        ],
        "measurements": [0, 1],
    }


@pytest.fixture(scope="function")
def sample_equation():
    """Create sample equation for testing"""
    return {
        "id": "eq_test_001",
        "expression": "E = mc²",
        "variables": {
            "E": {"name": "Energy", "unit": "J"},
            "m": {"name": "Mass", "unit": "kg"},
            "c": {"name": "Speed of Light", "value": 299792458},
        },
    }


@pytest.fixture(scope="function")
def autdie_request():
    """Sample AUTDIE engine request"""
    return {
        "decision_type": "approval",
        "context": {
            "trust_score": 0.85,
            "uncertainty": 0.15,
            "temporal_factor": 0.90,
        },
        "metadata": {"user_id": "test_user", "timestamp": "2024-01-15T12:00:00Z"},
    }


@pytest.fixture(scope="function")
def al_utaibi_request():
    """Sample Al-Utaibi equation request"""
    return {
        "equation_type": "unified_field",
        "parameters": {
            "x": 1.0,
            "t": 0.0,
            "energy": 100.0,
        },
        "precision": "high",
    }


@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset singleton instances between tests"""
    yield
    # Clear any cached instances
    # This prevents state leakage between tests


@pytest.fixture(scope="function")
def temp_data_dir(tmp_path):
    """Create temporary directory for test data"""
    data_dir = tmp_path / "test_data"
    data_dir.mkdir()
    return data_dir


@pytest.fixture(scope="function")
def sample_arabic_text():
    """Sample Arabic text for morphology tests"""
    return {
        "short": "السلام عليكم",
        "medium": "مرحباً بكم في منصة قرابيا للذكاء الاصطناعي",
        "long": """قرابيا منصة عربية رائدة تجمع بين الذكاء الاصطناعي والحوسبة الكمومية.
                  نهدف إلى بناء جسر بين الحضارة العربية وتقنيات المستقبل.""",
        "scientific": "الفيزياء الكمومية تدرس سلوك الجسيمات على المستوى الذري",
    }


# Performance benchmarks
@pytest.fixture(scope="session")
def performance_thresholds():
    """Define performance thresholds for tests"""
    return {
        "api_response": 1.0,  # seconds
        "quantum_simulation_2qubit": 0.1,
        "quantum_simulation_4qubit": 0.5,
        "equation_evaluation": 2.0,
        "encryption": 0.5,
        "signature": 0.3,
    }


# Marks for organizing tests
def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "security: Security-related tests")
    config.addinivalue_line("markers", "performance: Performance tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "quantum: Quantum computing tests")
    config.addinivalue_line("markers", "arabic: Arabic language processing tests")


# Cleanup hooks
@pytest.fixture(autouse=True)
def cleanup_after_test():
    """Cleanup resources after each test"""
    yield
    # Perform cleanup
    import gc

    gc.collect()
