"""
اختبارات مدير أزواج EPR | EPR Pair Manager Tests
=================================================

Scientific Basis:
- EPR Pairs (Einstein-Podolsky-Rosen) exhibit quantum entanglement
- Bell's Inequality: CHSH ≤ 2 (classical), CHSH ≈ 2√2 ≈ 2.828 (quantum)
- Concurrence C ∈ [0,1]: 0 = separable, 1 = maximally entangled
- Fidelity F ∈ [0,1]: measure of quantum state quality

TDD Methodology: Write tests FIRST, then implement
"""

import pytest
from datetime import datetime, timezone
from epr_pair_manager import (
    EPRPairManager,
    EPRPair,
    QuantumState,
    BellViolationError,
    InvalidQuantumStateError,
)


class TestEPRPairGeneration:
    """اختبارات توليد أزواج EPR | EPR Pair Generation Tests"""

    def test_generate_basic_epr_pair(self):
        """
        Test Case 1: Basic EPR pair generation
        Scientific: Should create maximally entangled Bell state |Φ⁺⟩
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="honeypot-1", node_b="gateway-1")

        assert isinstance(pair, EPRPair)
        assert pair.node_a == "honeypot-1"
        assert pair.node_b == "gateway-1"
        assert pair.id.startswith("EPR-")
        assert isinstance(pair.timestamp, int)

    def test_epr_pair_entanglement_quality(self):
        """
        Test Case 2: Quantum entanglement quality metrics
        Scientific: Concurrence C > 0.9 for high-quality entanglement
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="node-a", node_b="node-b")

        # Concurrence: measure of entanglement
        assert 0.0 <= pair.concurrence <= 1.0
        assert pair.concurrence >= 0.9, "High-quality entanglement required"

        # Fidelity: measure of state purity
        assert 0.0 <= pair.fidelity <= 1.0
        assert pair.fidelity >= 0.95, "High fidelity required for security"

    def test_bell_inequality_violation(self):
        """
        Test Case 3: Bell's inequality violation detection
        Scientific: CHSH value ≈ 2.828 indicates quantum correlation
        Classical limit: CHSH ≤ 2
        Quantum limit: CHSH ≤ 2√2 ≈ 2.828
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="node-x", node_b="node-y")

        # Bell violation should be close to quantum limit
        assert pair.bell_violation > 2.0, "Must violate classical bound"
        assert (
            2.0 < pair.bell_violation <= 2.828
        ), "Must be within quantum bounds"
        assert (
            abs(pair.bell_violation - 2.828) < 0.2
        ), "Should be near maximum violation"

    def test_deterministic_generation_with_seed(self):
        """
        Test Case 4: Deterministic generation for reproducibility
        Scientific: Same seed → same quantum state (for testing)
        """
        manager = EPRPairManager()

        pair1 = manager.generate_pair(
            node_a="node-1", node_b="node-2", seed="test-seed-123"
        )
        pair2 = manager.generate_pair(
            node_a="node-1", node_b="node-2", seed="test-seed-123"
        )

        # Same seed should produce similar quantum properties
        assert abs(pair1.concurrence - pair2.concurrence) < 0.01
        assert abs(pair1.bell_violation - pair2.bell_violation) < 0.01

    def test_quantum_state_structure(self):
        """
        Test Case 5: Quantum state representation
        Scientific: 2-qubit state requires 4 complex amplitudes
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="alice", node_b="bob")

        assert hasattr(pair, "state_a")
        assert hasattr(pair, "state_b")
        assert isinstance(pair.state_a, QuantumState)
        assert isinstance(pair.state_b, QuantumState)

        # Each state should have valid density matrix (2x2 for 1 qubit)
        assert len(pair.state_a.density_matrix) == 4
        assert len(pair.state_b.density_matrix) == 4

        # Trace of density matrix must equal 1
        trace_a = pair.state_a.density_matrix[0] + pair.state_a.density_matrix[3]
        trace_b = pair.state_b.density_matrix[0] + pair.state_b.density_matrix[3]
        assert abs(trace_a - 1.0) < 0.01
        assert abs(trace_b - 1.0) < 0.01


class TestEPRPairMonitoring:
    """اختبارات مراقبة أزواج EPR | EPR Pair Monitoring Tests"""

    def test_monitor_entanglement_healthy(self):
        """
        Test Case 6: Monitor healthy entanglement
        Scientific: No measurement → entanglement preserved
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="node-1", node_b="node-2")

        # Monitor without external interference
        is_healthy, reason = manager.monitor_pair(pair.id)

        assert is_healthy is True
        assert reason is None or "healthy" in reason.lower()

    def test_detect_measurement_attack(self):
        """
        Test Case 7: Detect measurement-based attack
        Scientific: Measurement causes decoherence, reduces concurrence
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="honeypot", node_b="gateway")

        # Simulate measurement attack (external observation)
        manager.simulate_measurement_attack(pair.id)

        is_healthy, reason = manager.monitor_pair(pair.id)

        assert is_healthy is False
        assert "measurement" in reason.lower() or "decoherence" in reason.lower()

    def test_detect_bell_violation_failure(self):
        """
        Test Case 8: Detect when Bell inequality no longer violated
        Scientific: CHSH ≤ 2 → classical correlation, possible attack
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="node-a", node_b="node-b")

        # Simulate attack that breaks entanglement
        manager.simulate_entanglement_break(pair.id)

        with pytest.raises(BellViolationError):
            manager.verify_entanglement(pair.id)


class TestEPRPairValidation:
    """اختبارات التحقق من الصحة | Validation Tests"""

    def test_invalid_node_names(self):
        """
        Test Case 9: Security - reject invalid node names
        OWASP: Input validation
        """
        manager = EPRPairManager()

        with pytest.raises(InvalidQuantumStateError):
            manager.generate_pair(node_a="", node_b="node-b")

        with pytest.raises(InvalidQuantumStateError):
            manager.generate_pair(node_a="a" * 300, node_b="node-b")

    def test_node_name_sanitization(self):
        """
        Test Case 10: Security - sanitize node names
        OWASP: Prevent injection attacks
        """
        manager = EPRPairManager()

        # Should sanitize dangerous characters
        pair = manager.generate_pair(
            node_a="node<script>alert(1)</script>",
            node_b="node'; DROP TABLE--"
        )

        assert "<script>" not in pair.node_a
        assert "DROP TABLE" not in pair.node_b

    def test_max_pairs_limit(self):
        """
        Test Case 11: Performance - prevent memory overflow
        Big-O: O(1) lookup, O(n) storage with max limit
        """
        manager = EPRPairManager(max_pairs=10)

        # Generate max pairs
        for i in range(10):
            manager.generate_pair(node_a=f"node-{i}", node_b=f"node-{i+100}")

        # 11th pair should trigger cleanup (LRU eviction)
        pair11 = manager.generate_pair(node_a="node-extra", node_b="node-extra-2")

        assert pair11 is not None
        assert manager.get_pair_count() <= 10


class TestPerformance:
    """اختبارات الأداء | Performance Tests"""

    def test_generation_time_under_10ms(self):
        """
        Test Case 12: Performance - generation time < 10ms
        Big-O: Target O(1) with small constant
        """
        import time

        manager = EPRPairManager()

        start = time.perf_counter()
        pair = manager.generate_pair(node_a="fast-node-a", node_b="fast-node-b")
        end = time.perf_counter()

        elapsed_ms = (end - start) * 1000
        assert elapsed_ms < 10.0, f"Generation took {elapsed_ms:.2f}ms, must be < 10ms"

    def test_monitoring_time_under_5ms(self):
        """
        Test Case 13: Performance - monitoring time < 5ms
        Big-O: O(1) lookup
        """
        import time

        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="node-1", node_b="node-2")

        start = time.perf_counter()
        manager.monitor_pair(pair.id)
        end = time.perf_counter()

        elapsed_ms = (end - start) * 1000
        assert elapsed_ms < 5.0, f"Monitoring took {elapsed_ms:.2f}ms, must be < 5ms"


class TestQuantumNoCloning:
    """اختبارات نظرية عدم الاستنساخ | No-Cloning Theorem Tests"""

    def test_cannot_clone_epr_pair(self):
        """
        Test Case 14: Enforce no-cloning theorem
        Scientific: Quantum states cannot be perfectly cloned
        Security: Prevents attack replay
        """
        manager = EPRPairManager()
        pair = manager.generate_pair(node_a="original-a", node_b="original-b")

        # Attempting to clone should raise error or return degraded copy
        with pytest.raises(BellViolationError):
            cloned = manager.clone_pair(pair.id)
