"""
Tests for quantum_agi_engine.py
"""
import os
import sys
import time

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
from quantum_agi_engine import (
    AGIDecision,
    EthicalGovernanceSystem,
    EthicsMatrix,
    EthicsViolationType,
    GenesisAlgorithmDNA,
    GenesisEngine,
    IntentCategory,
    PerceptionMatrix,
    QuantumAGIEngine,
    SelfEvolutionModule,
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

    def test_evaluate_population_assigns_fitness(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=1, seed=42)
        result = engine.evaluate_population(pop)
        for dna in result:
            assert 0.0 <= dna.fitness <= 1.0

    def test_evaluate_population_sorted_descending(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=2, seed=7)
        result = engine.evaluate_population(pop)
        fitnesses = [d.fitness for d in result]
        assert fitnesses == sorted(fitnesses, reverse=True)

    def test_heuristic_fitness_boosting_types(self):
        engine = GenesisEngine()
        for algo in ["xgboost", "lightgbm", "catboost", "gradient_boosting"]:
            # بناء DNA مثالي لكل خوارزمية تعزيز
            dna = GenesisAlgorithmDNA(
                algorithm_type=algo,
                genes={"learning_rate": 0.05, "n_estimators": 200, "iterations": 200,
                       "max_depth": 5, "depth": 5, "subsample": 0.8},
            )
            f = engine._heuristic_fitness(dna)
            assert 0.0 < f <= 1.0, f"Fitness should be positive for {algo}: {f}"

    def test_heuristic_fitness_knn_optimal(self):
        engine = GenesisEngine()
        dna = GenesisAlgorithmDNA(algorithm_type="knn", genes={"n_neighbors": 7, "weights": "distance"})
        f = engine._heuristic_fitness(dna)
        assert f > 0.5

    def test_heuristic_fitness_logistic_optimal(self):
        engine = GenesisEngine()
        dna = GenesisAlgorithmDNA(algorithm_type="logistic", genes={"C": 1.0, "max_iter": 1000})
        f = engine._heuristic_fitness(dna)
        assert f > 0.5

    def test_heuristic_fitness_age_penalty(self):
        engine = GenesisEngine()
        young = GenesisAlgorithmDNA(algorithm_type="logistic", genes={"C": 1.0}, age=0)
        old = GenesisAlgorithmDNA(algorithm_type="logistic", genes={"C": 1.0}, age=5)
        young.fitness = engine._heuristic_fitness(young)
        old.fitness = engine._heuristic_fitness(old)
        assert young.fitness >= old.fitness

    def test_evolve_generation_preserves_size(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=2, seed=1)
        evolved = engine.evolve_generation(pop, mutation_rate=0.3)
        assert len(evolved) == len(pop)

    def test_evolve_generation_increments_count(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=1, seed=2)
        assert engine._generation_count == 0
        engine.evolve_generation(pop)
        assert engine._generation_count == 1
        engine.evolve_generation(pop)
        assert engine._generation_count == 2

    def test_evolve_generation_updates_hall_of_fame(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=2, seed=3)
        engine.evolve_generation(pop)
        assert len(engine.hall_of_fame) > 0
        for d in engine.hall_of_fame:
            assert 0.0 <= d.fitness <= 1.0

    def test_evolve_generation_all_fitness_in_range(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=1, seed=9)
        evolved = engine.evolve_generation(pop)
        for d in evolved:
            assert 0.0 <= d.fitness <= 1.0

    def test_evolve_generation_best_is_first(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=2, seed=4)
        evolved = engine.evolve_generation(pop)
        fitnesses = [d.fitness for d in evolved]
        assert fitnesses[0] == max(fitnesses)

    def test_get_status_structure(self):
        engine = GenesisEngine()
        status = engine.get_status()
        assert "generation_count" in status
        assert "hall_of_fame_size" in status
        assert isinstance(status["hall_of_fame"], list)
        assert "best_fitness" in status
        assert "algorithm_types" in status
        assert status["n_algorithm_types"] == 10

    def test_hall_of_fame_max_10(self):
        engine = GenesisEngine()
        for _ in range(5):
            pop = engine.create_population(size_per_type=3, seed=_)
            engine.evolve_generation(pop)
        assert len(engine.hall_of_fame) <= 10

    def test_hall_of_fame_sorted_descending(self):
        engine = GenesisEngine()
        pop = engine.create_population(size_per_type=3, seed=5)
        engine.evolve_generation(pop)
        hof_fitnesses = [d.fitness for d in engine.hall_of_fame]
        assert hof_fitnesses == sorted(hof_fitnesses, reverse=True)

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

    def test_evolve_endpoint_returns_evolved_population(self):
        pop = [
            {"algorithm_type": "logistic", "genes": {"C": 1.0, "max_iter": 1000}, "generation": 0, "fitness": 0.6},
            {"algorithm_type": "logistic", "genes": {"C": 0.5, "max_iter": 500}, "generation": 0, "fitness": 0.5},
            {"algorithm_type": "knn", "genes": {"n_neighbors": 7, "weights": "uniform"}, "generation": 1, "fitness": 0.55},
            {"algorithm_type": "knn", "genes": {"n_neighbors": 9, "weights": "distance"}, "generation": 1, "fitness": 0.58},
        ]
        resp = client.post("/api/genesis/evolve", json={
            "population": pop,
            "mutation_rate": 0.3,
            "elite_fraction": 0.25,
            "tournament_size": 2,
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "generation" in body
        assert body["generation"] >= 1
        assert isinstance(body["population"], list)
        assert len(body["population"]) == len(pop)
        assert "stats" in body
        assert "best_fitness" in body["stats"]
        assert 0.0 <= body["stats"]["best_fitness"] <= 1.0
        assert "mean_fitness" in body["stats"]
        assert "best" in body
        assert isinstance(body["best"]["algorithm_type"], str)
        assert len(body["best"]["algorithm_type"]) > 0
        assert "hall_of_fame" in body

    def test_evolve_endpoint_rejects_empty_population(self):
        resp = client.post("/api/genesis/evolve", json={
            "population": [
                {"algorithm_type": "logistic", "genes": {"C": 1.0}, "generation": 0},
            ],
            "mutation_rate": 0.3,
        })
        # min_length=2 → 422
        assert resp.status_code == 422

    def test_evolve_best_fitness_in_range(self):
        pop = [
            {"algorithm_type": t, "genes": g, "generation": 0, "fitness": 0.0}
            for t, g in [
                ("xgboost", {"n_estimators": 200, "max_depth": 5, "learning_rate": 0.05,
                              "subsample": 0.8, "colsample_bytree": 0.8,
                              "min_child_weight": 3, "gamma": 0.1,
                              "reg_alpha": 0.1, "reg_lambda": 1.0}),
                ("random_forest", {"n_estimators": 150, "max_depth": 8,
                                   "min_samples_split": 5, "min_samples_leaf": 2}),
            ]
        ]
        resp = client.post("/api/genesis/evolve", json={
            "population": pop, "mutation_rate": 0.2,
        })
        assert resp.status_code == 200
        stats = resp.json()["stats"]
        assert 0.0 <= stats["best_fitness"] <= 1.0
        assert stats["mean_fitness"] <= stats["best_fitness"]

    def test_status_endpoint(self):
        resp = client.get("/api/genesis/status")
        assert resp.status_code == 200
        body = resp.json()
        assert "generation_count" in body
        assert "hall_of_fame_size" in body
        assert isinstance(body["hall_of_fame"], list)
        assert "best_fitness" in body
        assert "algorithm_types" in body
        assert len(body["algorithm_types"]) == 10
        assert body["n_algorithm_types"] == 10

    def test_status_best_fitness_grows_after_evolve(self):
        # تطور مجتمع ثم تحقق من أن best_fitness تحدّث
        pop = [
            {"algorithm_type": "mlp", "genes": {"layer1": 128, "layer2": 64, "layer3": 32,
                                                  "learning_rate": 0.001, "max_iter": 200,
                                                  "alpha": 0.001}, "generation": 0},
            {"algorithm_type": "mlp", "genes": {"layer1": 64, "layer2": 32, "layer3": 16,
                                                  "learning_rate": 0.005, "max_iter": 100,
                                                  "alpha": 0.01}, "generation": 0},
        ]
        client.post("/api/genesis/evolve", json={"population": pop, "mutation_rate": 0.3})
        resp = client.get("/api/genesis/status")
        assert resp.status_code == 200
        body = resp.json()
        assert body["generation_count"] >= 1
        assert body["best_fitness"] > 0.0


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
        assert body1["count"] >= 1

        r2 = client.get("/api/learning/summary?top=5")
        assert r2.status_code == 200
        body2 = r2.json()
        assert "total_events" in body2
        assert "top" in body2
        assert "suggestions" in body2
        # ChunkLoadError should trigger a suggestion
        assert len(body2["suggestions"]) > 0

        r3 = client.get("/api/learning/metrics?window_s=3600&top=3")
        assert r3.status_code == 200
        body3 = r3.json()
        assert body3["window_s"] == 3600
        assert body3["events"] >= 1
        assert "events_per_min" in body3
        assert "top" in body3

    def test_duplicate_errors_increment_count(self):
        from quantum_agi_engine import ErrorEvent, LearningMemory
        mem = LearningMemory(max_events=100)
        ev = ErrorEvent(kind="window_error", message="Failed to fetch data", url="https://qurabia.com/")
        r1 = mem.record_error(ev)
        r2 = mem.record_error(ev)
        assert r2["count"] == 2
        summary = mem.summary(top=5)
        assert summary["total_events"] == 2
        top_sigs = [t["signature"] for t in summary["top"]]
        assert r1["signature"] in top_sigs

    def test_summary_total_events_accurate(self):
        from quantum_agi_engine import ErrorEvent, LearningMemory
        mem = LearningMemory(max_events=100)
        for i in range(10):
            mem.record_error(ErrorEvent(kind="window_error", message=f"Error {i}", url="https://qurabia.com/"))
        summary = mem.summary(top=5)
        assert summary["total_events"] == 10

    def test_suggestions_cover_known_patterns(self):
        from quantum_agi_engine import ErrorEvent, LearningMemory
        LearningMemory(max_events=100)
        test_cases = [
            ("Failed to fetch /api/health", ["VITE_API_BASE_URL", "CORS"]),
            ("cors access-control-allow-origin missing", ["allow_origins"]),
            ("ChunkLoadError: Loading chunk 5 failed.", ["sw.js", "كاش"]),
            ("TypeError: Cannot read properties of undefined", ["optional chaining"]),
            ("ReferenceError: myVar is not defined", ["ReferenceError"]),
            ("Request timeout: etimedout", ["retry"]),
            ("HTTP 401 Unauthorized", ["Authorization"]),
            ("HTTP 403 Forbidden", ["صلاحيات"]),
            ("Internal Server Error 500", ["Render logs"]),
        ]
        for message, expected_keywords in test_cases:
            ev = ErrorEvent(kind="window_error", message=message, url="https://qurabia.com/")
            suggestions = LearningMemory._suggestions_for(ev)
            found = any(
                any(kw.lower() in s.lower() for kw in expected_keywords)
                for s in suggestions
            )
            assert found, f"No suggestion for: {message!r} (expected keywords: {expected_keywords})"

    def test_metrics_time_window(self):
        from quantum_agi_engine import ErrorEvent, LearningMemory
        mem = LearningMemory(max_events=100)
        old_ev = ErrorEvent(kind="window_error", message="Old error", url="https://qurabia.com/", ts=time.time() - 7200)
        new_ev = ErrorEvent(kind="window_error", message="New error", url="https://qurabia.com/", ts=time.time())
        mem.record_error(old_ev)
        mem.record_error(new_ev)
        metrics_1h = mem.metrics(window_s=3600)
        metrics_3h = mem.metrics(window_s=10800)
        assert metrics_1h["events"] == 1
        assert metrics_3h["events"] == 2

    def test_empty_summary(self):
        from quantum_agi_engine import LearningMemory
        mem = LearningMemory(max_events=100)
        summary = mem.summary()
        assert summary["total_events"] == 0
        assert summary["top"] == []
        assert summary["suggestions"] == []

    def test_learning_error_validation(self):
        # رسالة مطلوبة
        r = client.post("/api/learning/error", json={"kind": "window_error"})
        assert r.status_code == 422

        # رسالة طويلة جداً (> 500 حرف) تُرفض
        r = client.post("/api/learning/error", json={
            "kind": "window_error",
            "message": "x" * 600,
        })
        assert r.status_code == 422


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

    def test_llm_openrouter_fallback(self):
        r = client.post("/api/llm/openrouter/analyze", json={"results": {"fidelity": 0.9985, "energy": -1.137}})
        assert r.status_code == 200
        body = r.json()
        assert body["provider"] == "openrouter"
        assert isinstance(body["text"], str) and len(body["text"]) > 0
        assert body["mode"] in {"provider", "local_fallback"}


class TestCyberAIAnalyze:
    """اختبار نقطة نهاية تحليل الأمن السيبراني بالذكاء الاصطناعي"""

    def test_cyber_ai_analyze_local_fallback(self):
        """التحليل المحلي يعمل عند عدم توفر مفاتيح API"""
        scan_data = {
            "url": "https://example.com",
            "vulnerability_score": 45,
            "quantum_resistance_score": 60,
            "is_https": True,
            "headers": [
                {"header": "Content-Security-Policy", "present": True, "value": "default-src 'self'", "status": "secure", "recommendation": ""}
            ],
            "threats_count": 3,
            "open_ports": 2,
            "shield_state": {"integrity": 0.95, "entanglement": 0.92, "superposition": 0.88, "coherence": 0.97, "fidelity": 0.99},
        }
        r = client.post("/api/cyber/ai-analyze", json={"scan_result": scan_data, "provider": "auto"})
        assert r.status_code == 200
        body = r.json()
        assert "provider" in body
        assert isinstance(body["text"], str) and len(body["text"]) > 0
        assert body["mode"] in {"ai", "local_fallback"}

    def test_cyber_ai_analyze_explicit_openrouter(self):
        """طلب OpenRouter مباشرة يعود بتحليل محلي عند عدم توفر المفتاح"""
        scan_data = {
            "url": "https://qurabia.com",
            "vulnerability_score": 20,
            "quantum_resistance_score": 85,
            "is_https": True,
            "headers": [],
            "threats_count": 0,
            "open_ports": 0,
            "shield_state": {"integrity": 0.99, "entanglement": 0.95, "superposition": 0.91, "coherence": 0.98, "fidelity": 0.99},
        }
        r = client.post("/api/cyber/ai-analyze", json={"scan_result": scan_data, "provider": "openrouter"})
        assert r.status_code == 200
        body = r.json()
        assert body["provider"] in {"openrouter", "local"}
        assert isinstance(body["text"], str) and len(body["text"]) > 0

    def test_cyber_scan_endpoint(self):
        """فحص الأمان يعمل بشكل صحيح"""
        r = client.post("/api/cyber/scan", json={"url": "https://example.com"})
        assert r.status_code == 200
        body = r.json()
        assert "vulnerability_score" in body
        assert "quantum_resistance_score" in body
        assert "headers" in body
        assert "shield_state" in body


class TestSiteAnalysis:
    def test_site_scan_endpoint(self, monkeypatch):
        # Mock DNS resolution to avoid network dependency
        def mock_resolve_host_ips(host):
            if host == "example.com":
                return ["93.184.216.34"]  # Real IP of example.com
            return []

        import main
        monkeypatch.setattr(main, "_resolve_host_ips", mock_resolve_host_ips)

        # Mock httpx request to avoid actual network call
        html_content = "<html><head><title>Example Domain</title><meta name='description' content='Example domain for testing'></head><body><h1>Example</h1><img src='test.jpg' alt='test'/></body></html>"

        class MockResponse:
            status_code = 200
            text = html_content
            content = html_content.encode('utf-8')
            headers = {"content-type": "text/html", "content-length": str(len(html_content))}
            history = []  # Required by the site scan code
            url = "https://example.com"
            encoding = "utf-8"

        async def mock_get(*args, **kwargs):
            return MockResponse()

        import httpx
        monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

        r = client.post("/api/site/scan", json={"url": "https://example.com", "render": False, "max_resources": 4})
        assert r.status_code == 200
        body = r.json()
        assert body["url"].startswith("https://")
        assert "final_url" in body
        assert "performance" in body
        assert "security" in body
        assert "frontend" in body
        assert "scores" in body
        assert isinstance(body.get("recommendations", []), list)

    def test_site_ai_insights_local_fallback(self):
        report = {
            "final_url": "https://example.com",
            "scores": {"seo": 70, "security": 80, "performance": 65},
            "recommendations": [
                {"severity": "high", "title": "Missing <title>", "fix": "Add a title"},
                {"severity": "medium", "title": "Missing meta description", "fix": "Add description"},
            ],
        }
        r = client.post("/api/site/ai-insights", json={"report": report, "provider": "auto", "language": "ar"})
        assert r.status_code == 200
        body = r.json()
        assert body["provider"] in {"local", "gemini", "grok", "openrouter"}
        assert isinstance(body["text"], str) and len(body["text"]) > 0
        assert body["mode"] in {"ai", "local_fallback"}


class TestDatasetInsights:
    def test_dataset_upload_analyze_and_ai(self):
        csv_content = "age,salary,text,label\n30,1000,hello world,A\n31,1050,hello there,A\n22,700,buy now,B\n23,720,checkout cart,B\n"
        r = client.post(
            "/api/datasets/upload?pii_mode=hash",
            files={"file": ("sample.csv", csv_content.encode("utf-8"), "text/csv")},
        )
        assert r.status_code == 200
        body = r.json()
        assert "dataset_id" in body
        dataset_id = body["dataset_id"]
        assert body["rows"] >= 4
        assert "data_schema" in body and "columns" in body["data_schema"]

        r2 = client.post(
            "/api/datasets/analyze",
            json={"dataset_id": dataset_id, "target": "label", "k_folds": 2, "n_clusters": 2, "model": "auto"},
        )
        assert r2.status_code == 200
        rep = r2.json()
        assert rep["dataset_id"] == dataset_id
        assert "profiles" in rep
        assert "scores" in rep or "supervised" in rep

        r3 = client.post("/api/datasets/ai-insights", json={"dataset_id": dataset_id, "provider": "auto", "language": "ar"})
        assert r3.status_code == 200
        ai = r3.json()
        assert ai["provider"] in {"local", "gemini", "grok", "openrouter"}
        assert isinstance(ai["text"], str) and len(ai["text"]) > 0

