"""
Tests for quantum_agi_engine.py
"""
import math
import sys
import os
import time

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient

from main import app
from quantum_agi_engine import (
    IntentCategory,
    EthicsViolationType,
    AGIDecision,
    EthicsMatrix,
    PerceptionMatrix,
    EthicalGovernanceSystem,
    GenesisAlgorithmDNA,
    GenesisEngine,
    SelfEvolutionModule,
    QuantumAGIEngine,
)

client = TestClient(app)


# ─── EthicsMatrix ─────────────────────────────────────────────────────────────

class TestEthicsMatrix:
    def test_default_values(self):
        m = EthicsMatrix()
        assert m.non_maleficence == 0.95
        assert m.beneficence == 0.80
        assert m.autonomy == 0.90
        assert m.justice == 0.85

    def test_integrity_valid_on_creation(self):
        m = EthicsMatrix()
        assert m.verify_integrity() is True

    def test_integrity_fails_after_tampering(self):
        m = EthicsMatrix()
        m.non_maleficence = 0.0  # tamper
        assert m.verify_integrity() is False

    def test_hash_is_sha256_hex(self):
        m = EthicsMatrix()
        assert len(m._integrity_hash) == 64
        assert all(c in "0123456789abcdef" for c in m._integrity_hash)

    def test_custom_values(self):
        m = EthicsMatrix(non_maleficence=0.99, beneficence=0.99, autonomy=0.99, justice=0.99)
        assert m.verify_integrity() is True


# ─── PerceptionMatrix ─────────────────────────────────────────────────────────

class TestPerceptionMatrix:
    def setup_method(self):
        self.pm = PerceptionMatrix()

    def test_perceive_drug_discovery(self):
        intent, conf = self.pm.perceive("I need vqe for drug protein analysis")
        assert intent == IntentCategory.DRUG_DISCOVERY
        assert conf > 0.1

    def test_perceive_cryptography(self):
        intent, conf = self.pm.perceive("setup bb84 qkd key")
        assert intent == IntentCategory.CRYPTOGRAPHY

    def test_perceive_genomics(self):
        intent, conf = self.pm.perceive("analyze dna mutation genomics")
        assert intent == IntentCategory.GENOMICS

    def test_perceive_physics_simulation(self):
        intent, conf = self.pm.perceive("physics simulation محاكاة كم")
        assert intent == IntentCategory.PHYSICS_SIMULATION

    def test_perceive_code_optimization(self):
        intent, conf = self.pm.perceive("code refactor optimization")
        assert intent == IntentCategory.CODE_OPTIMIZATION

    def test_perceive_unknown(self):
        intent, conf = self.pm.perceive("random garbage text zzz")
        assert intent == IntentCategory.UNKNOWN
        assert conf == 0.1

    def test_confidence_range(self):
        _, conf = self.pm.perceive("drug protein vqe دواء جزيء")
        assert 0.0 <= conf <= 1.0

    def test_confidence_capped_at_1(self):
        # Many keywords → confidence should not exceed 1.0
        _, conf = self.pm.perceive("drug دواء protein جزيء vqe drug protein")
        assert conf <= 1.0

    def test_get_preload_modules_drug(self):
        modules = self.pm.get_preload_modules(IntentCategory.DRUG_DISCOVERY)
        assert "VQEEngine" in modules

    def test_get_preload_modules_unknown(self):
        modules = self.pm.get_preload_modules(IntentCategory.UNKNOWN)
        assert "QuantumCore" in modules

    def test_get_preload_modules_all_intents(self):
        for intent in IntentCategory:
            modules = self.pm.get_preload_modules(intent)
            assert isinstance(modules, list)
            assert len(modules) > 0


# ─── EthicalGovernanceSystem ──────────────────────────────────────────────────

class TestEthicalGovernanceSystem:
    def setup_method(self):
        self.gov = EthicalGovernanceSystem()

    def _make_decision(self, intent=IntentCategory.UNKNOWN):
        return AGIDecision(intent=intent)

    def test_approves_safe_action(self):
        decision = self._make_decision()
        allowed, score, violation = self.gov.evaluate(decision, {
            "harm_potential": 0.01,
            "benefit_score": 0.9,
            "user_consent": True,
            "fairness_score": 0.95,
        })
        assert allowed is True
        assert violation == EthicsViolationType.NONE
        assert 0.0 <= score <= 1.0

    def test_rejects_high_harm(self):
        decision = self._make_decision()
        allowed, score, violation = self.gov.evaluate(decision, {
            "harm_potential": 0.99,
            "benefit_score": 0.9,
            "user_consent": True,
            "fairness_score": 0.95,
        })
        assert allowed is False
        assert violation == EthicsViolationType.HARM_POTENTIAL

    def test_rejects_no_consent(self):
        decision = self._make_decision()
        allowed, score, violation = self.gov.evaluate(decision, {
            "harm_potential": 0.0,
            "benefit_score": 0.9,
            "user_consent": False,
            "fairness_score": 0.95,
        })
        assert allowed is False
        assert violation == EthicsViolationType.AUTONOMY_OVERRIDE

    def test_rejects_low_benefit(self):
        decision = self._make_decision()
        allowed, score, violation = self.gov.evaluate(decision, {
            "harm_potential": 0.0,
            "benefit_score": 0.1,
            "user_consent": True,
            "fairness_score": 0.95,
        })
        assert allowed is False
        assert violation == EthicsViolationType.JUSTICE_VIOLATION

    def test_score_in_valid_range(self):
        decision = self._make_decision()
        _, score, _ = self.gov.evaluate(decision, {
            "harm_potential": 0.05,
            "benefit_score": 0.8,
            "user_consent": True,
            "fairness_score": 0.9,
        })
        assert 0.0 <= score <= 1.0

    def test_audit_log_grows(self):
        decision = self._make_decision()
        ctx = {"harm_potential": 0.0, "benefit_score": 0.9, "user_consent": True, "fairness_score": 0.9}
        self.gov.evaluate(decision, ctx)
        self.gov.evaluate(decision, ctx)
        assert len(self.gov._audit) == 2

    def test_tampered_matrix_raises_system_exit(self):
        self.gov._matrix.non_maleficence = 0.0  # tamper
        with pytest.raises(SystemExit):
            self.gov.evaluate(self._make_decision(), {})

    def test_default_context_values(self):
        decision = self._make_decision()
        # Call with empty context – should use defaults and not raise
        allowed, score, violation = self.gov.evaluate(decision, {})
        assert isinstance(allowed, bool)
        assert isinstance(score, float)


# ─── SelfEvolutionModule ──────────────────────────────────────────────────────

class TestSelfEvolutionModule:
    def setup_method(self):
        self.ethics = EthicalGovernanceSystem()
        self.sem = SelfEvolutionModule(self.ethics)

    def test_valid_code_is_applied(self):
        code = "x = 1 + 1\n"
        result = self.sem.propose_refactoring("my_module", code)
        assert result["applied"] is True
        assert "optimized" in result["code"]
        assert result["quality_score"] > 0

    def test_invalid_syntax_rejected(self):
        code = "def broken(:\n"
        result = self.sem.propose_refactoring("bad", code)
        assert result["applied"] is False
        assert result["reason"] == "invalid_syntax"
        assert result["quality_score"] == 0.0

    def test_quality_score_in_range(self):
        result = self.sem.propose_refactoring("m", "a = 1\n")
        assert 0.0 <= result["quality_score"] <= 1.0

    def test_refactoring_prepends_comment(self):
        result = self.sem.propose_refactoring("m", "y = 2\n")
        assert result["applied"] is True
        assert result["code"].startswith("# optimized\n")


# ─── QuantumAGIEngine ─────────────────────────────────────────────────────────

class TestQuantumAGIEngine:
    def setup_method(self):
        self.engine = QuantumAGIEngine()

    def test_process_returns_agi_decision(self):
        decision = self.engine.process("bb84 cryptography key")
        assert isinstance(decision, AGIDecision)

    def test_process_detects_cryptography_intent(self):
        decision = self.engine.process("setup bb84 qkd")
        assert decision.intent == IntentCategory.CRYPTOGRAPHY

    def test_process_detects_drug_discovery(self):
        decision = self.engine.process("run vqe for drug protein")
        assert decision.intent == IntentCategory.DRUG_DISCOVERY


class TestGenesisAlgorithmDNA:
    def test_mutate_increments_generation(self):
        dna = GenesisAlgorithmDNA(algorithm_type="xgboost", genes={"n_estimators": 100, "learning_rate": 0.1}, generation=0)
        child = dna.mutate(mutation_rate=1.0)
        assert child.generation == dna.generation + 1
        assert child.algorithm_type == dna.algorithm_type

    def test_crossover_requires_same_type_else_mutates(self):
        a = GenesisAlgorithmDNA(algorithm_type="xgboost", genes={"n_estimators": 100}, generation=0)
        b = GenesisAlgorithmDNA(algorithm_type="lightgbm", genes={"n_estimators": 200}, generation=0)
        child = GenesisAlgorithmDNA.crossover(a, b)
        assert child.algorithm_type == a.algorithm_type

    def test_to_dict_contains_expected_keys(self):
        dna = GenesisAlgorithmDNA(algorithm_type="knn", genes={"n_neighbors": 7, "weights": "distance"})
        d = dna.to_dict()
        assert d["algorithm_type"] == "knn"
        assert "genes" in d
        assert "id" in d


class TestGenesisEngine:
    def setup_method(self):
        self.engine = QuantumAGIEngine()

    def test_population_size(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=2, seed=123)
        assert len(pop) > 0
        assert len(pop) == 2 * 10

    def test_process_unknown_intent(self):
        decision = self.engine.process("zzz meaningless xyz")
        assert decision.intent == IntentCategory.UNKNOWN

    def test_process_ethics_score_in_range(self):
        decision = self.engine.process("physics simulation")
        assert 0.0 <= decision.ethics_score <= 1.0

    def test_process_high_harm_rejected(self):
        decision = self.engine.process("do something", {
            "harm_potential": 0.99,
            "user_consent": False,
        })
        assert decision.ethics_violation != EthicsViolationType.NONE
        assert "مرفوض" in decision.recommended_action

    def test_process_adds_preloaded_modules(self):
        decision = self.engine.process("analyze dna genomics mutation")
        assert len(decision.preloaded_modules) > 0

    def test_process_execution_plan_high_confidence(self):
        decision = self.engine.process("drug protein vqe دواء جزيء")
        if decision.ethics_violation == EthicsViolationType.NONE:
            assert "estimated_ms" in decision.execution_plan
            assert "parallel" in decision.execution_plan

    def test_process_no_context_uses_defaults(self):
        decision = self.engine.process("physics simulation")
        assert isinstance(decision, AGIDecision)

    def test_self_evolve_valid_code(self):
        result = self.engine.self_evolve("core", "x = 1\n")
        assert "applied" in result

    def test_build_action_all_intents(self):
        for intent in IntentCategory:
            action = QuantumAGIEngine._build_action(intent, 0.8)
            assert isinstance(action, str)
            assert "ثقة" in action

    def test_decision_id_is_uuid(self):
        import re
        decision = self.engine.process("test")
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        assert re.match(uuid_pattern, decision.decision_id)

    def test_confidence_in_range(self):
        decision = self.engine.process("run drug vqe protein")
        assert 0.0 <= decision.confidence <= 1.0


class TestGenesisApi:
    def test_population_endpoint(self):
        resp = client.post("/api/genesis/population", json={"size_per_type": 2, "seed": 1})
        assert resp.status_code == 200
        body = resp.json()
        assert body["size"] == 20
        assert isinstance(body["population"], list)
        assert len(body["population"]) == 20

    def test_mutate_endpoint(self):
        resp = client.post("/api/genesis/mutate", json={
            "dna": {"algorithm_type": "logistic", "genes": {"C": 1.0, "max_iter": 1000}, "generation": 0},
            "mutation_rate": 1.0,
        })
        assert resp.status_code == 200
        child = resp.json()["child"]
        assert child["algorithm_type"] == "logistic"
        assert child["generation"] == 1

    def test_crossover_endpoint(self):
        resp = client.post("/api/genesis/crossover", json={
            "parent_a": {"algorithm_type": "knn", "genes": {"n_neighbors": 7, "weights": "distance"}, "generation": 1, "fitness": 0.7},
            "parent_b": {"algorithm_type": "knn", "genes": {"n_neighbors": 9, "weights": "uniform"}, "generation": 2, "fitness": 0.8},
        })
        assert resp.status_code == 200
        child = resp.json()["child"]
        assert child["algorithm_type"] == "knn"
        assert child["generation"] == 3


class TestLearningApi:
    def test_learning_error_and_summary(self):
        r1 = client.post("/api/learning/error", json={
            "kind": "window_error",
            "message": "ChunkLoadError: Loading chunk 123 failed.",
            "url": "https://qurabia.com/",
            "stack": "ChunkLoadError at /assets/index.js",
            "user_agent": "test",
            "release": "test",
            "ts": time.time(),
        })
        assert r1.status_code == 200
        body1 = r1.json()
        assert body1["ok"] is True
        assert isinstance(body1["signature"], str)
        assert body1["count"] == 1

        r2 = client.get("/api/learning/summary?top=5")
        assert r2.status_code == 200
        body2 = r2.json()
        assert "total_events" in body2
        assert "top" in body2
        assert "suggestions" in body2

        r3 = client.get("/api/learning/metrics?window_s=3600&top=3")
        assert r3.status_code == 200
        body3 = r3.json()
        assert body3["window_s"] == 3600
        assert body3["events"] >= 1
        assert "events_per_min" in body3
        assert "top" in body3


class TestLLMProxy:
    def test_llm_gemini_fallback(self):
        r = client.post("/api/llm/gemini/analyze", json={"results": {"fidelity": 0.9985, "energy": -1.137}})
        assert r.status_code == 200
        body = r.json()
        assert body["provider"] == "gemini"
        assert isinstance(body["text"], str) and len(body["text"]) > 0
        assert body["mode"] in {"provider", "local_fallback"}

    def test_llm_grok_fallback(self):
        r = client.post("/api/llm/grok/analyze", json={"results": {"fidelity": 0.9985, "energy": -1.137}})
        assert r.status_code == 200
        body = r.json()
        assert body["provider"] == "grok"
        assert isinstance(body["text"], str) and len(body["text"]) > 0
        assert body["mode"] in {"provider", "local_fallback"}
