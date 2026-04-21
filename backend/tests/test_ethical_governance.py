"""
Tests for ethical_governance.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ethical_governance import (
    ETHICAL_CONSTITUTION,
    EthicalGovernanceSystem,
    EthicsDecision,
    EthicsScore,
    EthicsViolationType,
    ethics_governor,
)

# ─── EthicsScore ──────────────────────────────────────────────────────────────

class TestEthicsScore:
    def test_as_dict(self):
        score = EthicsScore(nonMaleficence=0.9, beneficence=0.8, autonomy=0.95, justice=0.85)
        d = score.as_dict()
        assert d == {
            "nonMaleficence": 0.9,
            "beneficence": 0.8,
            "autonomy": 0.95,
            "justice": 0.85,
        }

    def test_as_dict_keys(self):
        score = EthicsScore(0.9, 0.8, 0.9, 0.85)
        assert set(score.as_dict().keys()) == {"nonMaleficence", "beneficence", "autonomy", "justice"}


# ─── ETHICAL_CONSTITUTION ─────────────────────────────────────────────────────

class TestEthicalConstitution:
    def test_has_all_keys(self):
        assert "nonMaleficence" in ETHICAL_CONSTITUTION
        assert "beneficence" in ETHICAL_CONSTITUTION
        assert "autonomy" in ETHICAL_CONSTITUTION
        assert "justice" in ETHICAL_CONSTITUTION

    def test_values(self):
        assert ETHICAL_CONSTITUTION["nonMaleficence"] == 0.95
        assert ETHICAL_CONSTITUTION["beneficence"] == 0.80
        assert ETHICAL_CONSTITUTION["autonomy"] == 0.90
        assert ETHICAL_CONSTITUTION["justice"] == 0.85


# ─── EthicalGovernanceSystem.evaluate ────────────────────────────────────────

class TestEthicalGovernanceSystemEvaluate:
    def setup_method(self):
        self.gov = EthicalGovernanceSystem()

    def _good_score(self):
        return EthicsScore(nonMaleficence=0.99, beneficence=0.95, autonomy=0.99, justice=0.95)

    def test_approves_fully_compliant_score(self):
        decision = self.gov.evaluate(self._good_score())
        assert decision.approved is True
        assert len(decision.violations) == 0
        assert decision.notes == "Ethical policy satisfied."

    def test_rejects_low_non_maleficence(self):
        score = EthicsScore(nonMaleficence=0.5, beneficence=0.9, autonomy=0.95, justice=0.9)
        decision = self.gov.evaluate(score)
        assert decision.approved is False
        assert EthicsViolationType.HARM_RISK in decision.violations

    def test_rejects_low_beneficence(self):
        score = EthicsScore(nonMaleficence=0.99, beneficence=0.5, autonomy=0.99, justice=0.9)
        decision = self.gov.evaluate(score)
        assert decision.approved is False
        assert EthicsViolationType.LOW_BENEFIT in decision.violations

    def test_rejects_low_autonomy(self):
        score = EthicsScore(nonMaleficence=0.99, beneficence=0.9, autonomy=0.5, justice=0.9)
        decision = self.gov.evaluate(score)
        assert decision.approved is False
        assert EthicsViolationType.AUTONOMY_OVERRIDE in decision.violations

    def test_rejects_low_justice(self):
        score = EthicsScore(nonMaleficence=0.99, beneficence=0.9, autonomy=0.99, justice=0.5)
        decision = self.gov.evaluate(score)
        assert decision.approved is False
        assert EthicsViolationType.FAIRNESS_BIAS in decision.violations

    def test_multiple_violations_detected(self):
        score = EthicsScore(nonMaleficence=0.5, beneficence=0.5, autonomy=0.5, justice=0.5)
        decision = self.gov.evaluate(score)
        assert len(decision.violations) == 4

    def test_average_score_calculation(self):
        score = EthicsScore(nonMaleficence=1.0, beneficence=1.0, autonomy=1.0, justice=1.0)
        decision = self.gov.evaluate(score)
        assert abs(decision.average_score - 1.0) < 1e-9

    def test_average_score_for_mixed(self):
        score = EthicsScore(nonMaleficence=0.8, beneficence=0.6, autonomy=0.7, justice=0.5)
        decision = self.gov.evaluate(score)
        expected = (0.8 + 0.6 + 0.7 + 0.5) / 4.0
        assert abs(decision.average_score - expected) < 1e-9

    def test_returns_ethics_decision(self):
        decision = self.gov.evaluate(self._good_score())
        assert isinstance(decision, EthicsDecision)

    def test_notes_contain_violation_names(self):
        score = EthicsScore(nonMaleficence=0.5, beneficence=0.9, autonomy=0.99, justice=0.9)
        decision = self.gov.evaluate(score)
        assert "harm_risk" in decision.notes

    def test_exact_threshold_boundary_pass(self):
        # Exactly at threshold: should pass (no violation for >=)
        score = EthicsScore(
            nonMaleficence=0.95,
            beneficence=0.80,
            autonomy=0.90,
            justice=0.85,
        )
        decision = self.gov.evaluate(score)
        assert decision.approved is True

    def test_just_below_threshold_fails(self):
        score = EthicsScore(
            nonMaleficence=0.94,
            beneficence=0.80,
            autonomy=0.90,
            justice=0.85,
        )
        decision = self.gov.evaluate(score)
        assert decision.approved is False

    def test_custom_constitution(self):
        gov = EthicalGovernanceSystem(constitution={"nonMaleficence": 0.5, "beneficence": 0.5, "autonomy": 0.5, "justice": 0.5})
        score = EthicsScore(nonMaleficence=0.6, beneficence=0.6, autonomy=0.6, justice=0.6)
        decision = gov.evaluate(score)
        assert decision.approved is True


# ─── enforce_minimum ──────────────────────────────────────────────────────────

class TestEnforceMinimum:
    def setup_method(self):
        self.gov = EthicalGovernanceSystem()

    def test_clamps_above_1(self):
        result = self.gov.enforce_minimum({"nonMaleficence": 1.5, "beneficence": 0.8, "autonomy": 0.9, "justice": 0.85})
        assert result["nonMaleficence"] == 1.0

    def test_clamps_below_0(self):
        result = self.gov.enforce_minimum({"nonMaleficence": -0.5, "beneficence": 0.8, "autonomy": 0.9, "justice": 0.85})
        assert result["nonMaleficence"] == 0.0

    def test_valid_values_unchanged(self):
        values = {"nonMaleficence": 0.9, "beneficence": 0.8, "autonomy": 0.9, "justice": 0.85}
        result = self.gov.enforce_minimum(values)
        for k, v in values.items():
            assert abs(result[k] - v) < 1e-9

    def test_missing_keys_default_to_zero(self):
        result = self.gov.enforce_minimum({})
        assert all(v == 0.0 for v in result.values())

    def test_returns_only_constitution_keys(self):
        result = self.gov.enforce_minimum({"nonMaleficence": 0.9, "unknown_key": 0.5, "beneficence": 0.8, "autonomy": 0.9, "justice": 0.85})
        assert set(result.keys()) == set(ETHICAL_CONSTITUTION.keys())


# ─── merge_signals ────────────────────────────────────────────────────────────

class TestMergeSignals:
    def setup_method(self):
        self.gov = EthicalGovernanceSystem()

    def test_empty_signals_returns_perfect_score(self):
        result = self.gov.merge_signals([])
        assert result.nonMaleficence == 1.0
        assert result.beneficence == 1.0
        assert result.autonomy == 1.0
        assert result.justice == 1.0

    def test_single_signal_identity(self):
        signal = {"nonMaleficence": 0.9, "beneficence": 0.85, "autonomy": 0.95, "justice": 0.88}
        result = self.gov.merge_signals([signal])
        assert abs(result.nonMaleficence - 0.9) < 1e-9
        assert abs(result.beneficence - 0.85) < 1e-9

    def test_two_signals_averaged(self):
        s1 = {"nonMaleficence": 0.8, "beneficence": 0.8, "autonomy": 0.8, "justice": 0.8}
        s2 = {"nonMaleficence": 1.0, "beneficence": 1.0, "autonomy": 1.0, "justice": 1.0}
        result = self.gov.merge_signals([s1, s2])
        assert abs(result.nonMaleficence - 0.9) < 1e-9

    def test_returns_ethics_score(self):
        from ethical_governance import EthicsScore
        result = self.gov.merge_signals([
            {"nonMaleficence": 0.9, "beneficence": 0.85, "autonomy": 0.92, "justice": 0.88}
        ])
        assert isinstance(result, EthicsScore)

    def test_clamping_applied_in_merge(self):
        signal = {"nonMaleficence": 1.5, "beneficence": -0.5, "autonomy": 0.9, "justice": 0.9}
        result = self.gov.merge_signals([signal])
        assert result.nonMaleficence == 1.0
        assert result.beneficence == 0.0


# ─── Singleton ────────────────────────────────────────────────────────────────

class TestSingleton:
    def test_ethics_governor_is_instance(self):
        assert isinstance(ethics_governor, EthicalGovernanceSystem)

    def test_singleton_evaluate_works(self):
        score = EthicsScore(0.99, 0.95, 0.99, 0.95)
        decision = ethics_governor.evaluate(score)
        assert decision.approved is True
