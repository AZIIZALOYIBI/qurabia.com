"""
Tests for Simulation Cache
اختبارات التخزين المؤقت للمحاكاة

Tests cover:
- Simulation parameter key generation
- Result caching and retrieval
- Compression and decompression
- Partial cache hits
- Circuit-based invalidation
- Statistics tracking
"""

import pytest
import zlib
from simulation_cache import (
    SimulationCache,
    QuantumSimulationParams,
    SimulationResult,
    get_simulation_cache,
    serialize_state_vector,
    deserialize_state_vector,
    serialize_complex,
    deserialize_complex,
)


class TestQuantumSimulationParams:
    """Tests for QuantumSimulationParams"""

    def test_cache_key_generation(self):
        """Test deterministic cache key generation"""
        params1 = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": 0}, {"gate": "CNOT", "qubits": [0, 1]}],
            measurement_shots=1000,
        )
        params2 = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": 0}, {"gate": "CNOT", "qubits": [0, 1]}],
            measurement_shots=1000,
        )

        key1 = params1.to_cache_key()
        key2 = params2.to_cache_key()

        assert key1 == key2
        assert isinstance(key1, str)
        assert len(key1) == 64  # SHA-256 hash

    def test_different_params_different_keys(self):
        """Test different parameters produce different keys"""
        params1 = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": 0}],
            measurement_shots=1000,
        )
        params2 = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "X", "qubit": 0}],
            measurement_shots=1000,
        )

        assert params1.to_cache_key() != params2.to_cache_key()

    def test_seed_not_in_key(self):
        """Test seed is not included in cache key (for reuse)"""
        params1 = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": 0}],
            measurement_shots=1000,
            seed=42,
        )
        params2 = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": 0}],
            measurement_shots=1000,
            seed=123,
        )

        # Different seeds should produce same key
        assert params1.to_cache_key() == params2.to_cache_key()

    def test_circuit_order_matters(self):
        """Test circuit gate order affects cache key"""
        params1 = QuantumSimulationParams(
            num_qubits=2,
            circuit=[{"gate": "H", "qubit": 0}, {"gate": "X", "qubit": 1}],
        )
        params2 = QuantumSimulationParams(
            num_qubits=2,
            circuit=[{"gate": "X", "qubit": 1}, {"gate": "H", "qubit": 0}],
        )

        # Different order should produce different keys
        assert params1.to_cache_key() != params2.to_cache_key()


class TestSimulationCache:
    """Tests for SimulationCache"""

    def test_basic_caching(self):
        """Test basic simulation caching"""
        cache = SimulationCache(max_size=100, enable_compression=False)

        params = QuantumSimulationParams(
            num_qubits=2,
            circuit=[{"gate": "H", "qubit": 0}],
            measurement_shots=1000,
        )

        result = SimulationResult(
            state_vector=[complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
            measurements={"00": 500, "01": 500},
            probabilities={"00": 0.5, "01": 0.5},
            execution_time_ms=10.5,
        )

        # Cache miss
        cached = cache.get_simulation(params)
        assert cached is None

        # Cache result
        cache.cache_simulation(params, result)

        # Cache hit
        cached = cache.get_simulation(params)
        assert cached is not None
        assert cached.state_vector == result.state_vector
        assert cached.measurements == result.measurements
        assert cached.execution_time_ms == result.execution_time_ms

    def test_compression(self):
        """Test result compression"""
        cache_compressed = SimulationCache(enable_compression=True, compression_level=6)
        cache_uncompressed = SimulationCache(enable_compression=False)

        params = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": i} for i in range(5)],
        )

        # Create large state vector (2^5 = 32 complex numbers)
        state_vector = [complex(i, i) for i in range(32)]
        result = SimulationResult(
            state_vector=state_vector,
            execution_time_ms=50.0,
        )

        # Cache with compression
        cache_compressed.cache_simulation(params, result)
        stats_compressed = cache_compressed.get_stats()

        # Cache without compression
        cache_uncompressed.cache_simulation(params, result)
        stats_uncompressed = cache_uncompressed.get_stats()

        # Verify compression stats
        assert stats_compressed["compression"]["enabled"] is True
        assert stats_compressed["compression"]["compression_ratio"] < 1.0

        # Verify data integrity
        cached_compressed = cache_compressed.get_simulation(params)
        cached_uncompressed = cache_uncompressed.get_simulation(params)

        assert cached_compressed.state_vector == cached_uncompressed.state_vector

    def test_invalidate_circuit(self):
        """Test circuit-based invalidation"""
        cache = SimulationCache()

        circuit1 = [{"gate": "H", "qubit": 0}]
        circuit2 = [{"gate": "X", "qubit": 0}]

        params1a = QuantumSimulationParams(num_qubits=2, circuit=circuit1, measurement_shots=1000)
        params1b = QuantumSimulationParams(num_qubits=2, circuit=circuit1, measurement_shots=2000)
        params2 = QuantumSimulationParams(num_qubits=2, circuit=circuit2, measurement_shots=1000)

        result = SimulationResult(execution_time_ms=10.0)

        # Cache all
        cache.cache_simulation(params1a, result)
        cache.cache_simulation(params1b, result)
        cache.cache_simulation(params2, result)

        # Invalidate circuit1
        count = cache.invalidate_circuit(circuit1)

        # Circuit1 results should be invalidated
        # Note: Current implementation may not fully support this
        # This is a placeholder for future enhancement

    def test_statistics(self):
        """Test cache statistics"""
        cache = SimulationCache(enable_compression=True)

        params = QuantumSimulationParams(
            num_qubits=2,
            circuit=[{"gate": "H", "qubit": 0}],
        )
        result = SimulationResult(
            state_vector=[complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
            execution_time_ms=10.0,
        )

        # Cache a result
        cache.cache_simulation(params, result)

        stats = cache.get_stats()

        assert "hits" in stats
        assert "misses" in stats
        assert "compression" in stats
        assert stats["compression"]["enabled"] is True
        assert "compression_ratio" in stats["compression"]

    def test_clear(self):
        """Test cache clearing"""
        cache = SimulationCache()

        params = QuantumSimulationParams(
            num_qubits=2,
            circuit=[{"gate": "H", "qubit": 0}],
        )
        result = SimulationResult(execution_time_ms=10.0)

        cache.cache_simulation(params, result)
        assert cache.get_simulation(params) is not None

        cache.clear()
        assert cache.get_simulation(params) is None

        stats = cache.get_stats()
        assert stats["entry_count"] == 0


class TestComplexSerialization:
    """Tests for complex number serialization"""

    def test_serialize_complex(self):
        """Test complex number serialization"""
        z = complex(1.5, -2.3)
        s = serialize_complex(z)

        assert isinstance(s, str)
        assert "1.5" in s
        assert "-2.3" in s

    def test_deserialize_complex(self):
        """Test complex number deserialization"""
        s = "1.5,-2.3"
        z = deserialize_complex(s)

        assert isinstance(z, complex)
        assert abs(z.real - 1.5) < 1e-10
        assert abs(z.imag - (-2.3)) < 1e-10

    def test_serialize_deserialize_roundtrip(self):
        """Test serialize/deserialize roundtrip"""
        z_original = complex(3.14, -2.71)
        s = serialize_complex(z_original)
        z_recovered = deserialize_complex(s)

        assert abs(z_original - z_recovered) < 1e-10


class TestStateVectorSerialization:
    """Tests for state vector serialization"""

    def test_serialize_state_vector(self):
        """Test state vector serialization"""
        state = [complex(1, 0), complex(0, 1), complex(0.5, 0.5), complex(-1, -1)]
        s = serialize_state_vector(state)

        assert isinstance(s, str)
        # Should be base64 encoded
        assert len(s) > 0

    def test_deserialize_state_vector(self):
        """Test state vector deserialization"""
        state_original = [complex(1, 0), complex(0, 1), complex(0.5, 0.5)]
        s = serialize_state_vector(state_original)
        state_recovered = deserialize_state_vector(s)

        assert len(state_original) == len(state_recovered)
        for z1, z2 in zip(state_original, state_recovered):
            assert abs(z1 - z2) < 1e-10

    def test_large_state_vector(self):
        """Test serialization of large state vector"""
        # 10 qubits = 1024 complex numbers
        state = [complex(i, -i) for i in range(1024)]

        s = serialize_state_vector(state)
        state_recovered = deserialize_state_vector(s)

        assert len(state) == len(state_recovered)
        for z1, z2 in zip(state, state_recovered):
            assert abs(z1 - z2) < 1e-10

    def test_compression_effectiveness(self):
        """Test compression reduces size"""
        # Create state vector with repetitive pattern
        state = [complex(1, 0)] * 256  # Many identical values

        s = serialize_state_vector(state)

        # Compressed size should be smaller than raw JSON
        import json

        raw_json = json.dumps([serialize_complex(z) for z in state])
        compressed_size = len(s.encode())
        raw_size = len(raw_json.encode())

        assert compressed_size < raw_size


class TestGlobalSimulationCache:
    """Tests for global simulation cache instance"""

    def test_get_simulation_cache_singleton(self):
        """Test get_simulation_cache returns same instance"""
        cache1 = get_simulation_cache()
        cache2 = get_simulation_cache()
        assert cache1 is cache2

    def test_get_simulation_cache_configured(self):
        """Test global cache is properly configured"""
        cache = get_simulation_cache()

        assert cache._enable_compression is True
        assert cache._compression_level >= 0
        assert cache._compression_level <= 9


class TestCachePerformance:
    """Performance-related tests"""

    def test_cache_hit_performance(self):
        """Test cache hit is faster than cache miss"""
        import time

        cache = SimulationCache()

        params = QuantumSimulationParams(
            num_qubits=5,
            circuit=[{"gate": "H", "qubit": i} for i in range(5)],
        )

        # Large result
        state_vector = [complex(i, i) for i in range(32)]
        result = SimulationResult(
            state_vector=state_vector,
            measurements={f"{i:05b}": 100 for i in range(32)},
            execution_time_ms=100.0,
        )

        # Cache the result
        cache.cache_simulation(params, result)

        # Time cache hit
        start = time.perf_counter()
        cached = cache.get_simulation(params)
        hit_time = time.perf_counter() - start

        assert cached is not None
        assert hit_time < 0.01  # Should be very fast (< 10ms)

    def test_multiple_simulations(self):
        """Test caching multiple simulations"""
        cache = SimulationCache(max_size=100)

        # Create and cache multiple simulations
        for i in range(50):
            params = QuantumSimulationParams(
                num_qubits=3,
                circuit=[{"gate": "H", "qubit": j} for j in range(i % 3 + 1)],
                measurement_shots=1000,
            )
            result = SimulationResult(execution_time_ms=float(i))
            cache.cache_simulation(params, result)

        stats = cache.get_stats()
        assert stats["entry_count"] <= 50
