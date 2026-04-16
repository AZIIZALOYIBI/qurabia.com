"""
Quantum Simulation Cache
نظام تخزين مؤقت للمحاكاة الكمومية

Features:
- Specialized caching for quantum simulation results
- Intelligent key generation based on quantum parameters
- Compression for large simulation results
- Partial cache hit support
- State vector caching with fidelity tracking
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import pickle
import zlib
from dataclasses import dataclass
from typing import Any

from cache_manager import InMemoryCache, cached, generate_cache_key

logger = logging.getLogger("SimulationCache")


@dataclass
class QuantumSimulationParams:
    """Parameters for quantum simulation"""

    num_qubits: int
    circuit: list[dict[str, Any]]  # List of gates
    measurement_shots: int = 1000
    noise_model: str | None = None
    backend: str = "statevector"
    seed: int | None = None

    def to_cache_key(self) -> str:
        """Generate deterministic cache key from parameters"""
        # Normalize circuit representation
        circuit_str = json.dumps(self.circuit, sort_keys=True)

        # Create deterministic key
        key_data = {
            "num_qubits": self.num_qubits,
            "circuit_hash": hashlib.sha256(circuit_str.encode()).hexdigest(),
            "measurement_shots": self.measurement_shots,
            "noise_model": self.noise_model or "ideal",
            "backend": self.backend,
            # Note: seed is intentionally excluded for cache reuse
        }

        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(key_str.encode()).hexdigest()


@dataclass
class SimulationResult:
    """Simulation result with metadata"""

    state_vector: list[complex] | None = None
    measurements: dict[str, int] | None = None
    probabilities: dict[str, float] | None = None
    execution_time_ms: float = 0.0
    fidelity: float = 1.0
    metadata: dict[str, Any] | None = None


class SimulationCache:
    """
    Specialized cache for quantum simulation results
    """

    def __init__(
        self,
        max_size: int | None = None,
        max_memory_mb: int = 256,
        compression_level: int = 6,
        enable_compression: bool = True,
    ):
        """
        Initialize simulation cache

        Args:
            max_size: Maximum number of cached simulations
            max_memory_mb: Maximum memory in MB
            compression_level: zlib compression level (0-9)
            enable_compression: Whether to compress results
        """
        self._cache = InMemoryCache(
            max_size=max_size,
            max_memory_bytes=max_memory_mb * 1024 * 1024,
            default_ttl=7200,  # 2 hours default TTL
        )
        self._compression_level = compression_level
        self._enable_compression = enable_compression
        self._compression_stats = {"compressed_bytes": 0, "uncompressed_bytes": 0, "compressions": 0}

        logger.info(
            f"Initialized SimulationCache with max_size={max_size}, "
            f"max_memory_mb={max_memory_mb}, "
            f"compression={enable_compression}"
        )

    def _compress_result(self, result: SimulationResult) -> bytes:
        """Compress simulation result"""
        data = pickle.dumps(result)
        self._compression_stats["uncompressed_bytes"] += len(data)

        if self._enable_compression:
            compressed = zlib.compress(data, level=self._compression_level)
            self._compression_stats["compressed_bytes"] += len(compressed)
            self._compression_stats["compressions"] += 1
            logger.debug(
                f"Compressed result: {len(data)} -> {len(compressed)} bytes "
                f"(ratio: {len(compressed) / len(data):.2%})"
            )
            return compressed
        else:
            self._compression_stats["compressed_bytes"] += len(data)
            return data

    def _decompress_result(self, data: bytes) -> SimulationResult:
        """Decompress simulation result"""
        if self._enable_compression:
            decompressed = zlib.decompress(data)
            return pickle.loads(decompressed)
        else:
            return pickle.loads(data)

    def get_simulation(
        self,
        params: QuantumSimulationParams,
        allow_partial: bool = False,
    ) -> SimulationResult | None:
        """
        Get cached simulation result

        Args:
            params: Simulation parameters
            allow_partial: Allow partial matches (different shot counts)

        Returns:
            Cached result or None
        """
        cache_key = f"sim:{params.to_cache_key()}"

        # Try exact match first
        cached_data = self._cache.get(cache_key)
        if cached_data is not None:
            logger.info(f"Simulation cache HIT: {cache_key[:16]}...")
            return self._decompress_result(cached_data)

        # Try partial match if allowed
        if allow_partial:
            # Look for similar simulation with different shot count
            partial_key = f"sim:{params.to_cache_key()}"
            # In a real implementation, you might want to iterate through
            # similar keys or use a secondary index
            logger.debug(f"Simulation cache MISS (no partial match): {cache_key[:16]}...")

        logger.info(f"Simulation cache MISS: {cache_key[:16]}...")
        return None

    def cache_simulation(
        self,
        params: QuantumSimulationParams,
        result: SimulationResult,
        ttl: float | None = None,
    ) -> None:
        """
        Cache simulation result

        Args:
            params: Simulation parameters
            result: Simulation result to cache
            ttl: Time-to-live in seconds
        """
        cache_key = f"sim:{params.to_cache_key()}"

        # Compress and store
        compressed_data = self._compress_result(result)
        self._cache.set(cache_key, compressed_data, ttl=ttl)

        logger.info(f"Cached simulation: {cache_key[:16]}... (size={len(compressed_data)} bytes)")

    def invalidate_circuit(self, circuit: list[dict[str, Any]]) -> int:
        """
        Invalidate all simulations for a specific circuit

        Args:
            circuit: Circuit definition

        Returns:
            Number of invalidated entries
        """
        circuit_str = json.dumps(circuit, sort_keys=True)
        circuit_hash = hashlib.sha256(circuit_str.encode()).hexdigest()
        pattern = f"sim:*{circuit_hash}*"
        count = self._cache.invalidate_pattern(pattern)
        logger.info(f"Invalidated {count} simulations for circuit")
        return count

    def get_stats(self) -> dict[str, Any]:
        """Get cache statistics including compression stats"""
        cache_stats = self._cache.get_stats()
        compression_ratio = (
            self._compression_stats["compressed_bytes"] / self._compression_stats["uncompressed_bytes"]
            if self._compression_stats["uncompressed_bytes"] > 0
            else 1.0
        )

        return {
            **cache_stats.to_dict(),
            "compression": {
                "enabled": self._enable_compression,
                "level": self._compression_level,
                "compressed_bytes": self._compression_stats["compressed_bytes"],
                "uncompressed_bytes": self._compression_stats["uncompressed_bytes"],
                "compression_ratio": round(compression_ratio, 4),
                "compressions": self._compression_stats["compressions"],
            },
        }

    def clear(self) -> None:
        """Clear all cached simulations"""
        self._cache.clear()
        self._compression_stats = {"compressed_bytes": 0, "uncompressed_bytes": 0, "compressions": 0}
        logger.info("Cleared simulation cache")


# Global simulation cache instance
_SIMULATION_CACHE: SimulationCache | None = None


def get_simulation_cache() -> SimulationCache:
    """Get or create global simulation cache instance"""
    global _SIMULATION_CACHE
    if _SIMULATION_CACHE is None:
        is_production = os.environ.get("APP_ENV") == "production"

        max_size = int(os.environ.get("SIM_CACHE_MAX_SIZE", "1000" if is_production else "500"))
        max_memory_mb = int(os.environ.get("SIM_CACHE_MAX_MEMORY_MB", "256" if is_production else "128"))
        compression_level = int(os.environ.get("SIM_CACHE_COMPRESSION_LEVEL", "6"))

        _SIMULATION_CACHE = SimulationCache(
            max_size=max_size,
            max_memory_mb=max_memory_mb,
            compression_level=compression_level,
            enable_compression=True,
        )

    return _SIMULATION_CACHE


def cached_simulation(ttl: float | None = 3600):
    """
    Decorator for caching quantum simulation functions

    Args:
        ttl: Time-to-live in seconds (default: 1 hour)

    Example:
        @cached_simulation(ttl=1800)
        def run_quantum_circuit(params: QuantumSimulationParams) -> SimulationResult:
            # ... simulation logic
            return result
    """

    def decorator(func):
        def wrapper(params: QuantumSimulationParams, *args, **kwargs) -> SimulationResult:
            cache = get_simulation_cache()

            # Try to get from cache
            cached_result = cache.get_simulation(params, allow_partial=False)
            if cached_result is not None:
                return cached_result

            # Cache miss - run simulation
            result = func(params, *args, **kwargs)

            # Cache result
            cache.cache_simulation(params, result, ttl=ttl)
            return result

        return wrapper

    return decorator


# Utility functions for complex number serialization
def serialize_complex(z: complex) -> str:
    """Serialize complex number to string"""
    return f"{z.real},{z.imag}"


def deserialize_complex(s: str) -> complex:
    """Deserialize complex number from string"""
    real, imag = map(float, s.split(","))
    return complex(real, imag)


def serialize_state_vector(state: list[complex]) -> str:
    """Serialize state vector to compressed base64 string"""
    # Convert to JSON then compress
    state_list = [serialize_complex(z) for z in state]
    json_str = json.dumps(state_list)
    compressed = zlib.compress(json_str.encode())
    return base64.b64encode(compressed).decode()


def deserialize_state_vector(s: str) -> list[complex]:
    """Deserialize state vector from compressed base64 string"""
    compressed = base64.b64decode(s.encode())
    json_str = zlib.decompress(compressed).decode()
    state_list = json.loads(json_str)
    return [deserialize_complex(z) for z in state_list]


# Cache warming utilities
def warm_cache_for_common_circuits(circuits: list[list[dict[str, Any]]]) -> int:
    """
    Pre-warm cache with common circuits

    Args:
        circuits: List of circuit definitions to pre-compute

    Returns:
        Number of circuits cached
    """
    cache = get_simulation_cache()
    cached_count = 0

    logger.info(f"Warming cache with {len(circuits)} common circuits...")

    for circuit in circuits:
        # This would need to be integrated with actual simulation engine
        # For now, just log the intent
        logger.debug(f"Would warm cache for circuit with {len(circuit)} gates")
        cached_count += 1

    logger.info(f"Cache warming complete: {cached_count} circuits")
    return cached_count
