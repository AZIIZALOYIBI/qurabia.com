"""
quantum_chemistry.py – وحدة الكيمياء الكمية
QURABIA

محاكاة مبسطة لـ VQE على جزيئات مرجعية مع تتبع التقارب.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

# ====================================================================
# قاعدة بيانات مرجعية
# ====================================================================

MOLECULE_DATABASE: dict[str, dict[str, float | int | str]] = {
    "H2": {
        "electrons": 2,
        "orbitals": 2,
        "basis": "STO-3G",
        "exact_energy_hartree": -1.13727,
        "bond_length_angstrom": 0.7414,
    },
    "LiH": {
        "electrons": 4,
        "orbitals": 6,
        "basis": "STO-3G",
        "exact_energy_hartree": -7.882,
        "bond_length_angstrom": 1.595,
    },
    "BeH2": {
        "electrons": 6,
        "orbitals": 8,
        "basis": "6-31G",
        "exact_energy_hartree": -15.64,
        "bond_length_angstrom": 1.326,
    },
    "H2O": {
        "electrons": 10,
        "orbitals": 7,
        "basis": "6-31G",
        "exact_energy_hartree": -75.02,
        "bond_length_angstrom": 0.958,
    },
}


@dataclass
class VQEResult:
    molecule: str
    exact_energy_hartree: float
    estimated_energy_hartree: float
    optimization_steps: int
    converged: bool
    final_gradient_norm: float
    convergence_trace: list[float] = field(default_factory=list)

    @property
    def error_milli_hartree(self) -> float:
        return abs(self.estimated_energy_hartree - self.exact_energy_hartree) * 1000.0


class QuantumChemistryEngine:
    """محرك مبسط للكيمياء الكمية مبني على VQE."""

    def __init__(self, seed: int = 42) -> None:
        self._rng = random.Random(seed)

    def list_molecules(self) -> list[str]:
        return sorted(MOLECULE_DATABASE.keys())

    def get_molecule(self, name: str) -> dict[str, float | int | str]:
        if name not in MOLECULE_DATABASE:
            raise ValueError(f"Unknown molecule: {name}")
        return dict(MOLECULE_DATABASE[name])

    def run_vqe(
        self,
        molecule: str,
        max_steps: int = 120,
        learning_rate: float = 0.08,
    ) -> VQEResult:
        if molecule not in MOLECULE_DATABASE:
            raise ValueError(f"Unsupported molecule: {molecule}")

        exact_energy = float(MOLECULE_DATABASE[molecule]["exact_energy_hartree"])

        # parameterized ansatz parameters
        params = [self._rng.uniform(-math.pi, math.pi) for _ in range(4)]

        trace: list[float] = []
        converged = False
        final_grad_norm = 0.0

        for _step in range(max_steps):
            energy = self._estimate_energy(exact_energy, params)
            trace.append(energy)

            grads = self._parameter_shift_gradient(exact_energy, params)
            final_grad_norm = math.sqrt(sum(g * g for g in grads))

            for i in range(len(params)):
                params[i] -= learning_rate * grads[i]

            if final_grad_norm < 1e-3:
                converged = True
                break

        estimated = trace[-1] if trace else exact_energy

        return VQEResult(
            molecule=molecule,
            exact_energy_hartree=exact_energy,
            estimated_energy_hartree=estimated,
            optimization_steps=len(trace),
            converged=converged,
            final_gradient_norm=final_grad_norm,
            convergence_trace=trace,
        )

    def _estimate_energy(self, exact_energy: float, params: list[float]) -> float:
        # surrogate landscape around the exact energy
        penalty = 0.0
        for p in params:
            penalty += 0.03 * math.cos(p) ** 2 + 0.015 * math.sin(2 * p)

        noise = self._rng.uniform(-0.0004, 0.0004)
        return exact_energy + penalty + noise

    def _parameter_shift_gradient(self, exact_energy: float, params: list[float]) -> list[float]:
        shift = math.pi / 2.0
        grads: list[float] = []

        for i in range(len(params)):
            p_plus = params.copy()
            p_minus = params.copy()
            p_plus[i] += shift
            p_minus[i] -= shift

            e_plus = self._estimate_energy(exact_energy, p_plus)
            e_minus = self._estimate_energy(exact_energy, p_minus)

            grads.append(0.5 * (e_plus - e_minus))

        return grads


# Singleton helper
quantum_chemistry_engine = QuantumChemistryEngine()
