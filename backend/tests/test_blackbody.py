"""Tests for the BlackbodyEngine (backend/blackbody.py)."""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from blackbody import BlackbodyEngine, c, h, kB  # noqa: E402


@pytest.fixture
def engine() -> BlackbodyEngine:
    return BlackbodyEngine()


# ─── Planck function ──────────────────────────────────────────

class TestPlanck:
    def test_zero_temperature_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.planck(1e14, 0) == 0.0

    def test_negative_temperature_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.planck(1e14, -100) == 0.0

    def test_zero_frequency_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.planck(0, 5778) == 0.0

    def test_negative_frequency_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.planck(-1e14, 5778) == 0.0

    def test_positive_for_valid_inputs(self, engine: BlackbodyEngine) -> None:
        B = engine.planck(5e14, 5778)
        assert B > 0

    def test_wien_peak(self, engine: BlackbodyEngine) -> None:
        """Wien displacement law: peak ν ≈ 2.821 * kB * T / h."""
        T = 5778
        nu_peak_expected = 2.821 * kB * T / h
        # Check that B at peak is larger than B at half and double peak
        B_peak = engine.planck(nu_peak_expected, T)
        B_half = engine.planck(nu_peak_expected / 2, T)
        B_double = engine.planck(nu_peak_expected * 2, T)
        assert B_peak > B_half
        assert B_peak > B_double

    def test_overflow_protection(self, engine: BlackbodyEngine) -> None:
        """Very high x = hν/(kBT) should return 0 instead of raising."""
        assert engine.planck(1e20, 1) == 0.0


# ─── Bose-Einstein distribution ──────────────────────────────

class TestBoseEinstein:
    def test_zero_temp_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.n0(1e14, 0) == 0.0

    def test_positive_for_valid_inputs(self, engine: BlackbodyEngine) -> None:
        n = engine.n0(1e12, 5778)
        assert n > 0

    def test_approaches_classical_limit(self, engine: BlackbodyEngine) -> None:
        """At low x = hν/(kBT), n ≈ kBT/(hν) - 1/2."""
        T = 5778
        nu = 1e10  # very low frequency → x ≪ 1
        n = engine.n0(nu, T)
        classical = kB * T / (h * nu)
        assert abs(n / classical - 1) < 0.01


# ─── QED correction ──────────────────────────────────────────

class TestQED:
    def test_zero_temp_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.cr_qed(1e14, 0) == 0.0

    def test_positive_correction(self, engine: BlackbodyEngine) -> None:
        r = engine.cr_qed(5e14, 5778)
        assert r > 0

    def test_tiny_at_room_temperature(self, engine: BlackbodyEngine) -> None:
        r = engine.cr_qed(5e14, 300)
        assert abs(r) < 1e-20


# ─── GUP correction ──────────────────────────────────────────

class TestGUP:
    def test_zero_freq_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.cr_gup(0) == 0.0

    def test_negative_correction(self, engine: BlackbodyEngine) -> None:
        """GUP correction is always non-positive."""
        r = engine.cr_gup(5e14)
        assert r <= 0

    def test_negligible_at_optical_frequencies(self, engine: BlackbodyEngine) -> None:
        r = engine.cr_gup(5e14)
        assert abs(r) < 1e-30


# ─── LQG correction ──────────────────────────────────────────

class TestLQG:
    def test_zero_temp_returns_zero(self, engine: BlackbodyEngine) -> None:
        assert engine.cr_lqg(1e14, 0) == 0.0

    def test_positive_correction(self, engine: BlackbodyEngine) -> None:
        r = engine.cr_lqg(5e14, 5778)
        assert r > 0

    def test_negligible_at_ordinary_temps(self, engine: BlackbodyEngine) -> None:
        r = engine.cr_lqg(5e14, 5778)
        assert r < 1e-40


# ─── Spectrum generation ─────────────────────────────────────

class TestSpectrum:
    def test_returns_correct_structure(self, engine: BlackbodyEngine) -> None:
        result = engine.spectrum(5778, 1e11, 1e15, 50)
        assert result["temperature_K"] == 5778
        assert result["num_points"] == 50
        assert len(result["spectrum"]) == 50
        assert len(result["freq_range_Hz"]) == 2

    def test_peak_frequency_reasonable(self, engine: BlackbodyEngine) -> None:
        """Peak should be near Wien's law prediction."""
        T = 5778
        result = engine.spectrum(T, 1e11, 1e15, 200)
        nu_peak = result["peak_frequency_Hz"]
        nu_wien = 2.821 * kB * T / h
        assert abs(nu_peak / nu_wien - 1) < 0.1  # within 10%

    def test_peak_wavelength_sun(self, engine: BlackbodyEngine) -> None:
        """Wavelength at peak frequency (ν-domain Wien) should be ~870 nm for Sun."""
        result = engine.spectrum(5778, 1e11, 1e15, 200)
        lam = result["peak_wavelength_nm"]
        # Peak is in frequency domain: λ = c/ν_max ≈ c/(2.821·kB·T/h) ≈ 870 nm
        assert 750 < lam < 1000

    def test_spectrum_points_have_all_fields(self, engine: BlackbodyEngine) -> None:
        result = engine.spectrum(5778, 1e11, 1e15, 10)
        for p in result["spectrum"]:
            assert "freq_Hz" in p
            assert "wavelength_m" in p
            assert "B_planck" in p
            assert "delta_total" in p
            assert "B_corrected" in p

    def test_corrections_enabled(self, engine: BlackbodyEngine) -> None:
        """With corrections, B_corrected should differ slightly from B_planck."""
        engine.enable_qed = True
        engine.enable_lqg = True
        engine.enable_gup = True
        result = engine.spectrum(5778, 1e11, 1e15, 50)
        # At least one point should have non-zero delta
        deltas = [p["delta_total"] for p in result["spectrum"]]
        assert any(d != 0 for d in deltas)

    def test_corrections_disabled(self, engine: BlackbodyEngine) -> None:
        """With all corrections disabled, delta should be zero."""
        engine.enable_qed = False
        engine.enable_lqg = False
        engine.enable_gup = False
        result = engine.spectrum(5778, 1e11, 1e15, 50)
        for p in result["spectrum"]:
            assert p["delta_total"] == 0.0
            assert p["B_corrected"] == p["B_planck"]

    def test_geomspace_frequencies(self, engine: BlackbodyEngine) -> None:
        """Frequencies should be geometrically spaced."""
        result = engine.spectrum(5778, 1e11, 1e15, 100)
        freqs = [p["freq_Hz"] for p in result["spectrum"]]
        ratios = [freqs[i + 1] / freqs[i] for i in range(len(freqs) - 1)]
        # All ratios should be approximately equal
        assert all(abs(r / ratios[0] - 1) < 1e-10 for r in ratios)


# ─── Point function ──────────────────────────────────────────

class TestPoint:
    def test_wavelength_consistent_with_frequency(self, engine: BlackbodyEngine) -> None:
        p = engine.point(5e14, 5778)
        assert abs(p["wavelength_m"] * p["freq_Hz"] - c) / c < 1e-10

    def test_corrected_equals_planck_times_one_plus_delta(self, engine: BlackbodyEngine) -> None:
        p = engine.point(5e14, 5778)
        expected = p["B_planck"] * (1 + p["delta_total"])
        assert abs(p["B_corrected"] - expected) < 1e-30
