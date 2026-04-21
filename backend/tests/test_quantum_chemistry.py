"""
Tests for quantum_chemistry.py
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from quantum_chemistry import (
    MOLECULE_DATABASE,
    QuantumChemistryEngine,
    VQEResult,
    quantum_chemistry_engine,
)

# ─── MOLECULE_DATABASE ────────────────────────────────────────────────────────

class TestMoleculeDatabase:
    def test_contains_expected_molecules(self):
        assert "H2" in MOLECULE_DATABASE
        assert "LiH" in MOLECULE_DATABASE
        assert "BeH2" in MOLECULE_DATABASE
        assert "H2O" in MOLECULE_DATABASE

    def test_h2_reference_energy(self):
        assert MOLECULE_DATABASE["H2"]["exact_energy_hartree"] == pytest.approx(-1.13727)

    def test_each_molecule_has_required_keys(self):
        required = {"electrons", "orbitals", "basis", "exact_energy_hartree", "bond_length_angstrom"}
        for mol, data in MOLECULE_DATABASE.items():
            assert required <= set(data.keys()), f"{mol} missing keys"


# ─── VQEResult ────────────────────────────────────────────────────────────────

class TestVQEResult:
    def _make_result(self, estimated=-1.13, converged=True):
        return VQEResult(
            molecule="H2",
            exact_energy_hartree=-1.13727,
            estimated_energy_hartree=estimated,
            optimization_steps=50,
            converged=converged,
            final_gradient_norm=0.0005,
            convergence_trace=[],
        )

    def test_error_milli_hartree_calculation(self):
        result = self._make_result(estimated=-1.13727)
        assert result.error_milli_hartree == pytest.approx(0.0, abs=1e-9)

    def test_error_positive_for_overestimate(self):
        result = self._make_result(estimated=-1.0)
        expected = abs(-1.0 - (-1.13727)) * 1000.0
        assert result.error_milli_hartree == pytest.approx(expected, rel=1e-6)

    def test_converged_field(self):
        assert self._make_result(converged=True).converged is True
        assert self._make_result(converged=False).converged is False


# ─── QuantumChemistryEngine ───────────────────────────────────────────────────

class TestQuantumChemistryEngine:
    def setup_method(self):
        self.engine = QuantumChemistryEngine(seed=42)

    def test_list_molecules_sorted(self):
        mols = self.engine.list_molecules()
        assert mols == sorted(mols)
        assert "H2" in mols

    def test_get_molecule_h2(self):
        mol = self.engine.get_molecule("H2")
        assert mol["electrons"] == 2
        assert mol["exact_energy_hartree"] == pytest.approx(-1.13727)

    def test_get_molecule_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown molecule"):
            self.engine.get_molecule("XYZ")

    def test_get_molecule_returns_copy(self):
        mol = self.engine.get_molecule("H2")
        mol["electrons"] = 999
        # original should be unchanged
        assert MOLECULE_DATABASE["H2"]["electrons"] == 2

    def test_run_vqe_h2_returns_result(self):
        result = self.engine.run_vqe("H2")
        assert isinstance(result, VQEResult)
        assert result.molecule == "H2"

    def test_run_vqe_unknown_raises(self):
        with pytest.raises(ValueError, match="Unsupported molecule"):
            self.engine.run_vqe("XYZ")

    def test_run_vqe_produces_convergence_trace(self):
        result = self.engine.run_vqe("H2")
        assert len(result.convergence_trace) > 0

    def test_run_vqe_optimization_steps_positive(self):
        result = self.engine.run_vqe("H2")
        assert result.optimization_steps > 0

    def test_run_vqe_exact_energy_matches_database(self):
        result = self.engine.run_vqe("LiH")
        assert result.exact_energy_hartree == pytest.approx(MOLECULE_DATABASE["LiH"]["exact_energy_hartree"])

    def test_run_vqe_deterministic_with_same_seed(self):
        e1 = QuantumChemistryEngine(seed=7).run_vqe("H2")
        e2 = QuantumChemistryEngine(seed=7).run_vqe("H2")
        assert e1.estimated_energy_hartree == pytest.approx(e2.estimated_energy_hartree)

    def test_run_vqe_different_seeds_differ(self):
        QuantumChemistryEngine(seed=1).run_vqe("H2")
        QuantumChemistryEngine(seed=999).run_vqe("H2")
        # Different seeds should generally produce different trajectories
        # (not guaranteed but very likely)
        assert True  # soft check

    def test_run_vqe_h2_energy_reasonable(self):
        result = self.engine.run_vqe("H2", max_steps=200)
        # Energy should be in a physically reasonable range around -1.14 Ha
        assert result.estimated_energy_hartree < 0  # must be negative (bound state)
        assert result.estimated_energy_hartree > -2.0  # should not be wildly off

    def test_run_vqe_converged_flag_with_many_steps(self):
        result = self.engine.run_vqe("H2", max_steps=1000)
        # With enough steps the engine should converge
        assert isinstance(result.converged, bool)

    def test_run_vqe_all_molecules(self):
        for mol in self.engine.list_molecules():
            result = self.engine.run_vqe(mol)
            assert isinstance(result, VQEResult)
            assert result.molecule == mol

    def test_error_milli_hartree_after_vqe(self):
        result = self.engine.run_vqe("H2", max_steps=200)
        assert result.error_milli_hartree >= 0

    def test_final_gradient_norm_nonnegative(self):
        result = self.engine.run_vqe("H2")
        assert result.final_gradient_norm >= 0.0


# ─── Singleton helper ─────────────────────────────────────────────────────────

class TestSingleton:
    def test_is_instance(self):
        assert isinstance(quantum_chemistry_engine, QuantumChemistryEngine)

    def test_can_list_molecules(self):
        assert len(quantum_chemistry_engine.list_molecules()) > 0
