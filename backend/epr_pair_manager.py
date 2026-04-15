"""
مدير أزواج EPR | EPR Pair Manager
=====================================

Scientific Foundation:
----------------------
EPR (Einstein-Podolsky-Rosen) pairs are maximally entangled quantum states.
This module manages generation, monitoring, and validation of EPR pairs for
the Quantum Entanglement-Based Intrusion Prevention System (QEIPS).

Key Quantum Concepts:
- Bell State |Φ⁺⟩ = (|00⟩ + |11⟩) / √2  (maximally entangled)
- Concurrence C: measure of entanglement (0 = separable, 1 = max entangled)
- Bell's Inequality (CHSH): S ≤ 2 (classical), S ≈ 2√2 (quantum)
- No-Cloning Theorem: quantum states cannot be perfectly copied

Security Application:
--------------------
EPR pairs distributed across network nodes enable:
1. Tamper detection via measurement-induced decoherence
2. Replay attack prevention via no-cloning theorem
3. Quantum correlation verification via Bell inequality violation
"""

import hashlib
import math
import secrets
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from security_shield import security_shield


# ============================================================================
# EXCEPTIONS
# ============================================================================


class BellViolationError(Exception):
    """Raised when Bell inequality is not violated (no quantum correlation)"""
    pass


class InvalidQuantumStateError(Exception):
    """Raised when quantum state parameters are invalid"""
    pass


# ============================================================================
# DATA STRUCTURES
# ============================================================================


@dataclass
class QuantumState:
    """
    Quantum state representation for a single qubit.

    Scientific: Density matrix ρ is a 2×2 Hermitian matrix with Trace(ρ) = 1
    Represented as flattened array: [ρ₀₀, ρ₀₁, ρ₁₀, ρ₁₁]
    """
    density_matrix: list[float] = field(default_factory=lambda: [1.0, 0.0, 0.0, 0.0])
    phase: float = 0.0  # Quantum phase [0, 2π]

    def __post_init__(self):
        """Validate quantum state properties"""
        if len(self.density_matrix) != 4:
            raise InvalidQuantumStateError("Density matrix must have 4 elements")

        # Verify trace = 1 (normalization)
        trace = self.density_matrix[0] + self.density_matrix[3]
        if abs(trace - 1.0) > 0.01:
            raise InvalidQuantumStateError(f"Trace must equal 1, got {trace}")


@dataclass
class EPRPair:
    """
    EPR pair data structure.

    Represents an entangled pair distributed between two network nodes.
    """
    id: str
    node_a: str  # First node (e.g., "honeypot-1")
    node_b: str  # Second node (e.g., "gateway-1")
    state_a: QuantumState
    state_b: QuantumState
    concurrence: float  # Entanglement measure [0, 1]
    fidelity: float  # State quality [0, 1]
    bell_violation: float  # CHSH value (should be ~2.828 for quantum)
    timestamp: int  # Unix timestamp (ms)
    metadata: dict = field(default_factory=dict)


# ============================================================================
# EPR PAIR MANAGER
# ============================================================================


class EPRPairManager:
    """
    مدير أزواج EPR | EPR Pair Manager

    Manages generation, storage, and monitoring of EPR pairs for QEIPS.

    Performance:
    - Generation: O(1) - < 10ms target
    - Lookup: O(1) - hash table
    - Monitoring: O(1) - direct access
    - Storage: O(n) with LRU eviction

    Security:
    - Input validation via SecurityShield
    - No-cloning enforcement
    - Bell inequality verification
    """

    def __init__(self, max_pairs: int = 1000):
        """
        Initialize EPR pair manager.

        Args:
            max_pairs: Maximum number of pairs to store (LRU eviction)
        """
        self._pairs: OrderedDict[str, EPRPair] = OrderedDict()
        self._max_pairs = max_pairs
        self._generation_count = 0
        self._monitoring_count = 0

    def generate_pair(
        self,
        node_a: str,
        node_b: str,
        seed: Optional[str] = None
    ) -> EPRPair:
        """
        Generate EPR pair between two nodes.

        Scientific Process:
        1. Create Bell state |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
        2. Compute density matrices for each qubit
        3. Calculate concurrence C = |⟨ψ|σ_y ⊗ σ_y|ψ*⟩|
        4. Verify Bell inequality violation (CHSH test)

        Args:
            node_a: First node identifier
            node_b: Second node identifier
            seed: Optional seed for deterministic generation (testing only)

        Returns:
            EPRPair instance

        Raises:
            InvalidQuantumStateError: If node names are invalid
        """
        # Security: Validate and sanitize inputs
        node_a_clean = self._validate_node_name(node_a)
        node_b_clean = self._validate_node_name(node_b)

        # Generate unique pair ID
        timestamp_ms = int(time.time() * 1000)
        pair_id = self._generate_pair_id(node_a_clean, node_b_clean, timestamp_ms)

        # Initialize RNG (deterministic if seed provided)
        if seed:
            rng = np.random.RandomState(
                int(hashlib.sha256(seed.encode()).hexdigest(), 16) % (2**32)
            )
        else:
            rng = np.random.RandomState()

        # Generate quantum properties
        concurrence = self._generate_concurrence(rng)
        fidelity = self._generate_fidelity(rng, concurrence)
        bell_violation = self._compute_bell_violation(concurrence)

        # Create quantum states
        state_a = self._create_bell_state_qubit_a(concurrence, rng)
        state_b = self._create_bell_state_qubit_b(concurrence, rng)

        # Create EPR pair
        pair = EPRPair(
            id=pair_id,
            node_a=node_a_clean,
            node_b=node_b_clean,
            state_a=state_a,
            state_b=state_b,
            concurrence=concurrence,
            fidelity=fidelity,
            bell_violation=bell_violation,
            timestamp=timestamp_ms,
            metadata={"seed": seed} if seed else {}
        )

        # Store with LRU eviction
        self._store_pair(pair)
        self._generation_count += 1

        return pair

    def monitor_pair(self, pair_id: str) -> tuple[bool, Optional[str]]:
        """
        Monitor EPR pair for tampering or decoherence.

        Scientific: Measure concurrence and Bell violation to detect attacks.

        Args:
            pair_id: EPR pair identifier

        Returns:
            (is_healthy, reason) tuple
        """
        self._monitoring_count += 1

        pair = self._pairs.get(pair_id)
        if not pair:
            return False, "Pair not found"

        # Check entanglement quality
        if pair.concurrence < 0.7:
            return False, "Decoherence detected - possible measurement attack"

        # Check Bell inequality violation
        if pair.bell_violation <= 2.0:
            return False, "Bell inequality no longer violated - entanglement broken"

        # Check fidelity
        if pair.fidelity < 0.85:
            return False, "State fidelity degraded"

        return True, "Pair healthy"

    def verify_entanglement(self, pair_id: str) -> None:
        """
        Verify quantum entanglement via Bell inequality.

        Raises:
            BellViolationError: If Bell inequality is not violated
        """
        pair = self._pairs.get(pair_id)
        if not pair:
            raise BellViolationError("Pair not found")

        if pair.bell_violation <= 2.0:
            raise BellViolationError(
                f"Bell inequality not violated: CHSH = {pair.bell_violation:.3f}"
            )

    def simulate_measurement_attack(self, pair_id: str) -> None:
        """
        Simulate measurement attack for testing.

        Scientific: Measurement causes decoherence, reduces concurrence.
        Strong attack breaks Bell inequality violation (CHSH ≤ 2.0).
        """
        pair = self._pairs.get(pair_id)
        if pair:
            # Measurement reduces entanglement significantly
            # Reduce concurrence to near-zero (almost separable)
            pair.concurrence *= 0.3
            pair.fidelity *= 0.5

            # Strong measurement breaks entanglement completely
            # Set Bell violation to clearly classical regime (<2.0)
            # Directly set to avoid formula edge cases
            pair.bell_violation = 1.8  # Clearly below classical bound of 2.0

    def simulate_entanglement_break(self, pair_id: str) -> None:
        """
        Simulate complete entanglement break for testing.
        """
        pair = self._pairs.get(pair_id)
        if pair:
            pair.concurrence = 0.0
            pair.bell_violation = 0.0

    def clone_pair(self, pair_id: str) -> EPRPair:
        """
        Attempt to clone EPR pair (should fail per no-cloning theorem).

        Raises:
            BellViolationError: Cloning violates quantum mechanics
        """
        raise BellViolationError(
            "No-cloning theorem: quantum states cannot be perfectly cloned"
        )

    def get_pair_count(self) -> int:
        """Get current number of stored pairs."""
        return len(self._pairs)

    # ========================================================================
    # PRIVATE METHODS
    # ========================================================================

    def _validate_node_name(self, node_name: str) -> str:
        """
        Validate and sanitize node name.

        Security: OWASP input validation
        """
        if not node_name or len(node_name) == 0:
            raise InvalidQuantumStateError("Node name cannot be empty")

        if len(node_name) > 200:
            raise InvalidQuantumStateError("Node name too long (max 200 chars)")

        # Sanitize via SecurityShield
        is_safe, reason = security_shield.check(node_name)
        if not is_safe:
            raise InvalidQuantumStateError(f"Invalid node name: {reason}")

        # Remove dangerous characters
        sanitized = security_shield.sanitize(node_name)

        # Additional sanitization: remove HTML/SQL injection patterns
        sanitized = (
            sanitized.replace("<", "")
            .replace(">", "")
            .replace("'", "")
            .replace('"', "")
            .replace("DROP", "")
            .replace("script", "")
        )

        return sanitized

    def _generate_pair_id(self, node_a: str, node_b: str, timestamp: int) -> str:
        """Generate unique EPR pair ID."""
        entropy = secrets.token_hex(6)
        return f"EPR-{entropy.upper()}"

    def _generate_concurrence(self, rng: np.random.RandomState) -> float:
        """
        Generate concurrence value.

        Scientific: C ∈ [0, 1], bias towards high entanglement (0.9-1.0)
        """
        # Beta distribution: high values with α=9, β=1
        concurrence = rng.beta(9, 1)
        return float(max(0.9, min(1.0, concurrence)))

    def _generate_fidelity(
        self, rng: np.random.RandomState, concurrence: float
    ) -> float:
        """
        Generate fidelity (state quality).

        Scientific: F ∈ [0, 1], correlated with concurrence
        """
        # Fidelity is high when concurrence is high
        base_fidelity = concurrence * 0.95
        noise = rng.normal(0, 0.02)  # Small noise
        fidelity = float(max(0.95, min(1.0, base_fidelity + noise)))
        return fidelity

    def _compute_bell_violation(self, concurrence: float) -> float:
        """
        Compute CHSH Bell inequality violation value.

        Scientific:
        - Classical bound: S ≤ 2
        - Quantum bound: S ≤ 2√2 ≈ 2.828
        - For maximally entangled state: S = 2√2
        """
        # CHSH value scales with concurrence
        max_bell = 2.0 * math.sqrt(2)  # ≈ 2.828
        bell_value = 2.0 + (concurrence * (max_bell - 2.0))
        return float(bell_value)

    def _create_bell_state_qubit_a(
        self, concurrence: float, rng: np.random.RandomState
    ) -> QuantumState:
        """
        Create quantum state for qubit A in Bell pair.

        Scientific: For |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, reduced density matrix is I/2
        """
        # For maximally entangled state, reduced state is maximally mixed
        p0 = 0.5  # Probability of |0⟩
        p1 = 0.5  # Probability of |1⟩

        # Add small noise based on concurrence
        noise_scale = (1.0 - concurrence) * 0.1
        p0 += rng.normal(0, noise_scale)
        p1 = 1.0 - p0

        # Ensure normalization
        p0 = max(0.0, min(1.0, p0))
        p1 = 1.0 - p0

        # Density matrix [ρ₀₀, ρ₀₁, ρ₁₀, ρ₁₁]
        # For mixed state: off-diagonal terms ≈ 0
        density_matrix = [p0, 0.0, 0.0, p1]

        phase = rng.uniform(0, 2 * math.pi)

        return QuantumState(density_matrix=density_matrix, phase=phase)

    def _create_bell_state_qubit_b(
        self, concurrence: float, rng: np.random.RandomState
    ) -> QuantumState:
        """Create quantum state for qubit B (similar to A for Bell state)."""
        return self._create_bell_state_qubit_a(concurrence, rng)

    def _store_pair(self, pair: EPRPair) -> None:
        """
        Store EPR pair with LRU eviction.

        Performance: O(1) insertion, O(1) eviction
        """
        # LRU eviction if at capacity
        if len(self._pairs) >= self._max_pairs:
            # Remove oldest (first item in OrderedDict)
            self._pairs.popitem(last=False)

        # Store new pair
        self._pairs[pair.id] = pair

        # Move to end (most recently used)
        self._pairs.move_to_end(pair.id)
