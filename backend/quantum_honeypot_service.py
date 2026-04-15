"""
خدمة الفخاخ الكمومية | Quantum Honeypot Service
================================================

Scientific Foundation:
----------------------
Quantum honeypots use EPR pairs to detect intrusion attempts through:
1. Measurement-induced decoherence (Heisenberg uncertainty principle)
2. Bell inequality violation monitoring (quantum correlation)
3. No-cloning theorem (prevents safe testing by attackers)

Security Architecture:
---------------------
- Honeypots deployed across network segments (DMZ, internal, etc.)
- Each honeypot has an EPR pair for quantum state monitoring
- Any interaction causes decoherence → intrusion detected
- Adaptive response: isolate, block, generate threat intelligence

Trap Types:
-----------
- WEB_SERVICE: Fake web servers (HTTP/HTTPS)
- SSH_SERVICE: Fake SSH servers
- DATABASE: Fake database endpoints (MySQL, PostgreSQL)
- FILE_SHARE: Fake SMB/NFS shares
- API_ENDPOINT: Fake REST/GraphQL APIs
"""

import hashlib
import secrets
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from epr_pair_manager import EPRPairManager, EPRPair
from security_shield import security_shield


# ============================================================================
# ENUMERATIONS
# ============================================================================


class HoneypotStatus(str, Enum):
    """Honeypot operational status"""
    ACTIVE = "active"
    COMPROMISED = "compromised"
    ISOLATED = "isolated"
    DECOMMISSIONED = "decommissioned"


class TrapType(str, Enum):
    """Types of honeypot traps"""
    WEB_SERVICE = "web_service"
    SSH_SERVICE = "ssh_service"
    DATABASE = "database"
    FILE_SHARE = "file_share"
    API_ENDPOINT = "api_endpoint"


class ThreatLevel(str, Enum):
    """Threat severity classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ============================================================================
# EXCEPTIONS
# ============================================================================


class DeploymentError(Exception):
    """Raised when honeypot deployment fails"""
    pass


# ============================================================================
# DATA STRUCTURES
# ============================================================================


@dataclass
class Honeypot:
    """
    Quantum honeypot data structure.

    Represents a decoy service with quantum entanglement monitoring.
    """
    id: str
    node_id: str
    trap_type: TrapType
    network_segment: str
    epr_pair_id: str
    status: HoneypotStatus = HoneypotStatus.ACTIVE
    deployed_at: int = field(default_factory=lambda: int(time.time() * 1000))
    last_checked: Optional[int] = None
    intrusion_count: int = 0
    metadata: dict = field(default_factory=dict)


# ============================================================================
# QUANTUM HONEYPOT SERVICE
# ============================================================================


class QuantumHoneypotService:
    """
    خدمة الفخاخ الكمومية | Quantum Honeypot Service

    Manages deployment, monitoring, and response for quantum honeypots.

    Performance:
    - Deployment: O(1) - < 20ms target
    - Intrusion check: O(1) - < 10ms target
    - Management: O(1) lookup via hash table

    Security:
    - Input validation via SecurityShield
    - Quantum measurement detection
    - Adaptive threat response
    """

    def __init__(self, max_honeypots: int = 500):
        """
        Initialize quantum honeypot service.

        Args:
            max_honeypots: Maximum number of honeypots to deploy
        """
        self._epr_manager = EPRPairManager(max_pairs=max_honeypots * 2)
        self._honeypots: OrderedDict[str, Honeypot] = OrderedDict()
        self._blocked_ips: set[str] = set()
        self._max_honeypots = max_honeypots
        self._deployment_count = 0
        self._intrusion_count = 0

    def deploy_honeypot(
        self,
        node_id: str,
        trap_type: TrapType,
        network_segment: str
    ) -> Honeypot:
        """
        Deploy single quantum honeypot.

        Args:
            node_id: Network node identifier
            trap_type: Type of honeypot trap
            network_segment: Network segment (e.g., "dmz", "internal")

        Returns:
            Honeypot instance

        Raises:
            DeploymentError: If deployment fails validation
        """
        # Security: Validate inputs
        node_id_clean = self._validate_node_id(node_id)
        segment_clean = self._sanitize_network_segment(network_segment)

        # Check capacity
        if len(self._honeypots) >= self._max_honeypots:
            raise DeploymentError(
                f"Maximum honeypots reached ({self._max_honeypots})"
            )

        # Generate unique honeypot ID
        honeypot_id = self._generate_honeypot_id()

        # Create EPR pair for monitoring
        gateway_node = f"gateway-{segment_clean}"
        epr_pair = self._epr_manager.generate_pair(
            node_a=node_id_clean,
            node_b=gateway_node
        )

        # Create honeypot
        honeypot = Honeypot(
            id=honeypot_id,
            node_id=node_id_clean,
            trap_type=trap_type,
            network_segment=segment_clean,
            epr_pair_id=epr_pair.id,
            status=HoneypotStatus.ACTIVE,
            metadata={
                "trap_type": trap_type.value,
                "concurrence": epr_pair.concurrence,
                "bell_violation": epr_pair.bell_violation,
            }
        )

        # Store
        self._honeypots[honeypot_id] = honeypot
        self._deployment_count += 1

        return honeypot

    def deploy_honeypot_network(
        self,
        node_ids: List[str],
        trap_type: TrapType,
        network_segment: str
    ) -> List[Honeypot]:
        """
        Deploy multiple honeypots across network.

        Args:
            node_ids: List of node identifiers
            trap_type: Type of trap for all honeypots
            network_segment: Network segment

        Returns:
            List of deployed honeypots
        """
        honeypots = []
        for node_id in node_ids:
            hp = self.deploy_honeypot(node_id, trap_type, network_segment)
            honeypots.append(hp)
        return honeypots

    def check_intrusion(self, honeypot_id: str) -> bool:
        """
        Check for intrusion via quantum decoherence.

        Scientific: Measurement causes decoherence → concurrence drops

        Args:
            honeypot_id: Honeypot identifier

        Returns:
            True if intrusion detected, False otherwise
        """
        honeypot = self._honeypots.get(honeypot_id)
        if not honeypot:
            return False

        # Update last checked timestamp
        honeypot.last_checked = int(time.time() * 1000)

        # Check EPR pair health
        is_healthy, reason = self._epr_manager.monitor_pair(honeypot.epr_pair_id)

        if not is_healthy:
            # Intrusion detected!
            honeypot.status = HoneypotStatus.COMPROMISED
            honeypot.intrusion_count += 1
            self._intrusion_count += 1
            return True

        return False

    def assess_threat(self, honeypot_id: str) -> ThreatLevel:
        """
        Assess threat level based on attack characteristics.

        Args:
            honeypot_id: Honeypot identifier

        Returns:
            ThreatLevel enum
        """
        honeypot = self._honeypots.get(honeypot_id)
        if not honeypot:
            return ThreatLevel.LOW

        # Get EPR pair for analysis
        pair = self._epr_manager._pairs.get(honeypot.epr_pair_id)
        if not pair:
            return ThreatLevel.LOW

        # Threat scoring based on quantum metrics
        concurrence = pair.concurrence
        bell_violation = pair.bell_violation

        # Lower concurrence = more severe attack
        if concurrence < 0.3:
            return ThreatLevel.CRITICAL
        elif concurrence < 0.5:
            return ThreatLevel.HIGH
        elif concurrence < 0.7:
            return ThreatLevel.MEDIUM
        else:
            return ThreatLevel.LOW

    def isolate_honeypot(self, honeypot_id: str) -> None:
        """
        Isolate compromised honeypot.

        Args:
            honeypot_id: Honeypot identifier
        """
        honeypot = self._honeypots.get(honeypot_id)
        if honeypot:
            honeypot.status = HoneypotStatus.ISOLATED

    def generate_threat_report(self, honeypot_id: str) -> dict:
        """
        Generate threat intelligence report.

        Args:
            honeypot_id: Honeypot identifier

        Returns:
            Threat report dictionary
        """
        honeypot = self._honeypots.get(honeypot_id)
        if not honeypot:
            return {"error": "Honeypot not found"}

        pair = self._epr_manager._pairs.get(honeypot.epr_pair_id)

        threat_level = self.assess_threat(honeypot_id)
        intrusion_detected = honeypot.status == HoneypotStatus.COMPROMISED

        report = {
            "honeypot_id": honeypot.id,
            "node_id": honeypot.node_id,
            "trap_type": honeypot.trap_type.value,
            "network_segment": honeypot.network_segment,
            "intrusion_detected": intrusion_detected,
            "threat_level": threat_level.value,
            "intrusion_count": honeypot.intrusion_count,
            "timestamp": int(time.time() * 1000),
            "attack_vector": "quantum_measurement_attack" if intrusion_detected else "none",
            "quantum_metrics": {
                "concurrence": pair.concurrence if pair else 0.0,
                "bell_violation": pair.bell_violation if pair else 0.0,
                "fidelity": pair.fidelity if pair else 0.0,
            }
        }

        return report

    def block_ip_address(self, ip_address: str) -> bool:
        """
        Block attacker IP address.

        Args:
            ip_address: IP address to block

        Returns:
            True if blocked successfully
        """
        # Basic validation
        if not ip_address or len(ip_address) < 7:
            return False

        self._blocked_ips.add(ip_address)
        return True

    def get_blocked_ips(self) -> set[str]:
        """Get set of blocked IP addresses."""
        return self._blocked_ips.copy()

    def list_honeypots(
        self,
        status: Optional[HoneypotStatus] = None
    ) -> List[Honeypot]:
        """
        List honeypots, optionally filtered by status.

        Args:
            status: Optional status filter

        Returns:
            List of honeypots
        """
        if status:
            return [hp for hp in self._honeypots.values() if hp.status == status]
        return list(self._honeypots.values())

    def decommission_honeypot(self, honeypot_id: str) -> None:
        """
        Decommission honeypot.

        Args:
            honeypot_id: Honeypot identifier
        """
        honeypot = self._honeypots.get(honeypot_id)
        if honeypot:
            honeypot.status = HoneypotStatus.DECOMMISSIONED

    def reset_honeypot(self, honeypot_id: str) -> None:
        """
        Reset compromised honeypot to active state.

        Generates new EPR pair and resets status.

        Args:
            honeypot_id: Honeypot identifier
        """
        honeypot = self._honeypots.get(honeypot_id)
        if not honeypot:
            return

        # Generate new EPR pair
        gateway_node = f"gateway-{honeypot.network_segment}"
        new_pair = self._epr_manager.generate_pair(
            node_a=honeypot.node_id,
            node_b=gateway_node
        )

        # Update honeypot
        honeypot.epr_pair_id = new_pair.id
        honeypot.status = HoneypotStatus.ACTIVE
        honeypot.metadata["concurrence"] = new_pair.concurrence
        honeypot.metadata["bell_violation"] = new_pair.bell_violation

    def get_epr_pair(self, epr_pair_id: str) -> Optional[EPRPair]:
        """
        Get EPR pair by ID.

        Args:
            epr_pair_id: EPR pair identifier

        Returns:
            EPRPair or None
        """
        return self._epr_manager._pairs.get(epr_pair_id)

    # ========================================================================
    # TESTING UTILITIES
    # ========================================================================

    def simulate_attacker_interaction(self, honeypot_id: str) -> None:
        """
        Simulate attacker interaction (for testing).

        Scientific: Interaction causes measurement → decoherence
        """
        honeypot = self._honeypots.get(honeypot_id)
        if honeypot:
            self._epr_manager.simulate_measurement_attack(honeypot.epr_pair_id)

    def simulate_attack_from_ip(self, honeypot_id: str, ip_address: str) -> None:
        """
        Simulate attack from specific IP (for testing).

        Args:
            honeypot_id: Honeypot identifier
            ip_address: Attacker IP address
        """
        honeypot = self._honeypots.get(honeypot_id)
        if honeypot:
            self._epr_manager.simulate_measurement_attack(honeypot.epr_pair_id)
            honeypot.metadata["attacker_ip"] = ip_address

    # ========================================================================
    # PRIVATE METHODS
    # ========================================================================

    def _validate_node_id(self, node_id: str) -> str:
        """
        Validate and sanitize node ID.

        Security: OWASP input validation
        """
        if not node_id or len(node_id) == 0:
            raise DeploymentError("Node ID cannot be empty")

        if len(node_id) > 100:
            raise DeploymentError("Node ID too long (max 100 chars)")

        # Check for dangerous patterns
        is_safe, reason = security_shield.check(node_id)
        if not is_safe:
            raise DeploymentError(f"Invalid node ID: {reason}")

        # Sanitize
        sanitized = security_shield.sanitize(node_id)

        # Remove HTML/script tags
        dangerous_patterns = ["<script>", "</script>", "<", ">", "'", '"', "DROP"]
        for pattern in dangerous_patterns:
            if pattern in sanitized:
                raise DeploymentError(f"Invalid characters in node ID")

        return sanitized

    def _sanitize_network_segment(self, segment: str) -> str:
        """
        Sanitize network segment name.

        Security: Prevent injection attacks
        """
        if not segment:
            return "default"

        # Remove dangerous characters
        sanitized = security_shield.sanitize(segment)
        sanitized = (
            sanitized.replace("<", "")
            .replace(">", "")
            .replace("'", "")
            .replace('"', "")
            .replace(";", "")
            .replace("DROP", "")
            .replace("TABLE", "")
            .replace("--", "")
        )

        return sanitized[:50]  # Limit length

    def _generate_honeypot_id(self) -> str:
        """Generate unique honeypot ID."""
        entropy = secrets.token_hex(6)
        return f"HP-{entropy.upper()}"
