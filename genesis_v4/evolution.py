"""
╔════════════════════════════════════════════════════════════╗
║  EvolutionEngineV3 + CheckpointManager                    ║
║  Surrogate-guided + Multi-Objective + Adaptive Mutation   ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import copy
import pickle
import random
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score

from genesis_v4.algorithm_dna import AlgorithmDNA, DNAFactory
from genesis_v4.multi_objective import MultiObjectiveFitness
from genesis_v4.surrogate import SurrogateModel


class CheckpointManager:
    """مدير نقاط الحفظ."""

    def __init__(self, save_dir: str = "genesis_v4_checkpoints") -> None:
        self.save_dir = Path(save_dir)
        self.save_dir.mkdir(parents=True, exist_ok=True)

    def save(
        self,
        generation: int,
        population: List[AlgorithmDNA],
        history: list,
        hall_of_fame: List[AlgorithmDNA],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        checkpoint = {
            "generation": generation,
            "timestamp": datetime.now().isoformat(),
            "population": [
                (d.algorithm_type, d.genes, d.fitness, d.generation, d.age, d.id)
                for d in population
            ],
            "history": history,
            "hall_of_fame": [
                (d.algorithm_type, d.genes, d.fitness, d.generation)
                for d in hall_of_fame
            ],
            "metadata": metadata or {},
        }
        path = self.save_dir / f"gen_{generation:03d}.pkl"
        with open(path, "wb") as f:
            pickle.dump(checkpoint, f)
        latest = self.save_dir / "latest.pkl"
        with open(latest, "wb") as f:
            pickle.dump(checkpoint, f)

    def load_latest(self) -> Optional[dict]:
        latest = self.save_dir / "latest.pkl"
        if latest.exists():
            with open(latest, "rb") as f:
                return pickle.load(f)  # noqa: S301
        return None


class EvolutionEngineV3:
    """
    محرك التطور v3 مع:
    • Surrogate Model (Bayesian-like)
    • Multi-Objective Fitness
    • Adaptive Mutation Rate
    """

    def __init__(
        self,
        population_size_per_type: int = 4,
        n_generations: int = 5,
        top_k_survive: int = 3,
        mutation_rate: float = 0.3,
        use_surrogate: bool = True,
        multi_objective: bool = True,
    ) -> None:
        self.pop_size = population_size_per_type
        self.n_generations = n_generations
        self.top_k = top_k_survive
        self.base_mutation_rate = mutation_rate
        self.mutation_rate = mutation_rate
        self.use_surrogate = use_surrogate
        self.multi_objective = multi_objective

        self.history: List[Dict[str, Any]] = []
        self.hall_of_fame: List[AlgorithmDNA] = []
        self.best_ever_fitness = 0.0

        self.surrogate = SurrogateModel() if use_surrogate else None
        self.mo_fitness = MultiObjectiveFitness() if multi_objective else None
        self.checkpoint_mgr = CheckpointManager()
        self.stagnation_counter = 0

    def _adaptive_mutation_rate(self) -> float:
        if len(self.history) < 2:
            return self.base_mutation_rate
        recent_bests = [h["best"] for h in self.history[-3:]]
        improvement = max(recent_bests) - min(recent_bests)
        if improvement < 0.001:
            self.stagnation_counter += 1
            self.mutation_rate = min(
                0.8, self.base_mutation_rate + 0.1 * self.stagnation_counter,
            )
        else:
            self.stagnation_counter = 0
            self.mutation_rate = self.base_mutation_rate
        return self.mutation_rate

    def evaluate_fitness(
        self,
        dna: AlgorithmDNA,
        X: np.ndarray,
        y: np.ndarray,
        cv: int = 3,
        fast: bool = False,
        seed: int = 42,
    ) -> float:
        if self.use_surrogate and self.surrogate and self.surrogate.is_fitted and fast:
            predicted = self.surrogate.predict_fitness(dna)
            if predicted < 0.55:
                dna.fitness = predicted
                return predicted

        try:
            model = dna.build_model()

            if fast:
                n_sample = max(300, int(len(X) * 0.35))
                rng = np.random.RandomState(seed)
                idx = rng.choice(len(X), min(n_sample, len(X)), replace=False)
                X_sub, y_sub = X[idx], y[idx]

                skf = StratifiedKFold(n_splits=2, shuffle=True, random_state=seed)
                train_idx, val_idx = next(iter(skf.split(X_sub, y_sub)))
                model.fit(X_sub[train_idx], y_sub[train_idx])

                if self.multi_objective and self.mo_fitness:
                    mo_result = self.mo_fitness.compute(
                        dna, X_sub[val_idx], y_sub[val_idx], model,
                    )
                    dna.fitness = mo_result["combined"]
                    dna.mo_scores = mo_result
                else:
                    y_prob = model.predict_proba(X_sub[val_idx])[:, 1]
                    dna.fitness = roc_auc_score(y_sub[val_idx], y_prob)
            else:
                skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=seed)
                scores = cross_val_score(
                    model, X, y, cv=skf, scoring="roc_auc", n_jobs=-1,
                )
                dna.fitness = float(scores.mean())

        except Exception:
            dna.fitness = 0.45

        return dna.fitness

    def evolve(self, X_train: np.ndarray, y_train: np.ndarray) -> List[AlgorithmDNA]:
        print("\n" + "═" * 70)
        print("🧬 التطور v3 — Bayesian + Multi-Objective + Adaptive")
        print("═" * 70)

        population = DNAFactory.create_population(self.pop_size)
        total_start = time.time()

        features_str = (
            f"Surrogate: {'✅' if self.use_surrogate else '❌'} | "
            f"Multi-Obj: {'✅' if self.multi_objective else '❌'}"
        )
        print(f"   🌍 المجتمع: {len(population)} | {features_str}")

        for gen in range(self.n_generations):
            gen_start = time.time()
            seed = 42 + gen * 137
            is_early = gen < int(self.n_generations * 0.65)
            mutation_rate = self._adaptive_mutation_rate()

            mode = "⚡ سريع" if is_early else "🎯 دقيق"
            print(f"\n{'─' * 60}")
            print(
                f"   🔬 الجيل {gen + 1}/{self.n_generations} [{mode}] "
                f"طفرة={mutation_rate:.0%}",
            )
            print(f"{'─' * 60}")

            skipped = 0
            for dna in population:
                before = dna.fitness
                self.evaluate_fitness(
                    dna, X_train, y_train, cv=3, fast=is_early, seed=seed,
                )
                if dna.fitness == before and self.use_surrogate:
                    skipped += 1

            if skipped > 0:
                print(f"   ⏭️ تخطي {skipped} كائن (Surrogate)")

            population.sort(key=lambda d: d.fitness, reverse=True)
            if is_early:
                elite_n = max(3, len(population) // 5)
                for dna in population[:elite_n]:
                    self.evaluate_fitness(
                        dna, X_train, y_train, cv=3, fast=False, seed=seed,
                    )
                population.sort(key=lambda d: d.fitness, reverse=True)

            if self.use_surrogate and self.surrogate:
                self.surrogate.record(population)
                if self.surrogate.fit():
                    print(
                        f"   🔮 Surrogate مُحدَّث "
                        f"({len(self.surrogate.observations)} ملاحظة)",
                    )

            fitnesses = [d.fitness for d in population]
            gen_stats: Dict[str, Any] = {
                "generation": gen + 1,
                "best": max(fitnesses),
                "mean": float(np.mean(fitnesses)),
                "worst": min(fitnesses),
                "std": float(np.std(fitnesses)),
                "mutation_rate": mutation_rate,
                "mode": "fast" if is_early else "precise",
            }
            self.history.append(gen_stats)

            print("\n   🏆 أفضل ٥:")
            medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]
            for i, dna in enumerate(population[:5]):
                medal = medals[i] if i < len(medals) else f"{i + 1}."
                mo = ""
                if dna.mo_scores:
                    mo = (
                        f" [AUC:{dna.mo_scores.get('auc', 0):.3f} "
                        f"Speed:{dna.mo_scores.get('speed', 0):.2f}]"
                    )
                print(
                    f"      {medal} {dna.algorithm_type:<20} "
                    f"Fit:{dna.fitness:.4f}{mo}",
                )

            print(
                f"\n   📊 Best={gen_stats['best']:.4f} | "
                f"Mean={gen_stats['mean']:.4f} | σ={gen_stats['std']:.4f}",
            )

            if population[0].fitness > self.best_ever_fitness:
                self.best_ever_fitness = population[0].fitness
                self.hall_of_fame.append(copy.deepcopy(population[0]))

            self.checkpoint_mgr.save(
                gen + 1, population, self.history, self.hall_of_fame,
            )

            if gen < self.n_generations - 1:
                population = self._next_generation_smart(population)

            print(f"   ⏱️ {time.time() - gen_start:.1f}s")

        total_time = time.time() - total_start
        print(f"\n{'═' * 70}")
        print(f"🏁 انتهى: {total_time:.1f}s | أفضل: {self.best_ever_fitness:.4f}")
        print(f"{'═' * 70}")

        population.sort(key=lambda d: d.fitness, reverse=True)
        return self._select_diverse_top(population)

    def _next_generation_smart(
        self, population: List[AlgorithmDNA],
    ) -> List[AlgorithmDNA]:
        new_pop: List[AlgorithmDNA] = []
        target_size = len(population)

        # ── ① Elitism: أفضل %15 يبقون مباشرة ──────────────────────────────
        elite_n = max(2, int(target_size * 0.15))
        for dna in population[:elite_n]:
            dna.age += 1
            new_pop.append(dna)

        # ── ② تزاوج داخل النوع عبر اختيار البطولة (%30) ─────────────────
        types_pool: Dict[str, List[AlgorithmDNA]] = defaultdict(list)
        for dna in population[: len(population) // 2]:
            types_pool[dna.algorithm_type].append(dna)

        while len(new_pop) < int(target_size * 0.45):
            algo_type = random.choice(list(types_pool.keys()))
            pool = types_pool[algo_type]
            if len(pool) >= 2:
                a = DNAFactory.tournament_select(pool, k=3)
                b = DNAFactory.tournament_select(pool, k=3)
                # BLX-α crossover إذا كلاهما من نفس النوع
                child = AlgorithmDNA.blend_crossover(a, b, alpha=0.3)
            else:
                child = pool[0].mutate(self.mutation_rate)
            new_pop.append(child)

        # ── ③ تزاوج عبر-النوع مع طفرة عشوائية (%15) ─────────────────────
        top_half = population[: len(population) // 2]
        while len(new_pop) < int(target_size * 0.6):
            a = DNAFactory.tournament_select(top_half, k=3)
            b = DNAFactory.tournament_select(top_half, k=3)
            if a.algorithm_type == b.algorithm_type:
                child = AlgorithmDNA.blend_crossover(a, b, alpha=0.2)
            else:
                child = a.mutate(self.mutation_rate)
            new_pop.append(child)

        # ── ④ طفرات للتنوع (%20) ─────────────────────────────────────────
        while len(new_pop) < int(target_size * 0.8):
            parent = DNAFactory.tournament_select(
                population[: len(population) // 2], k=2,
            )
            new_pop.append(parent.mutate(self.mutation_rate))

        # ── ⑤ أفراد جدد موجّهون بالـSurrogate أو عشوائيون (%20) ─────────
        if self.use_surrogate and self.surrogate and self.surrogate.is_fitted:
            candidates: List[AlgorithmDNA] = []
            all_types = list({d.algorithm_type for d in population})
            for _ in range(target_size * 3):
                c = DNAFactory.create_random(random.choice(all_types))
                c.mo_scores = {"_surrogate": self.surrogate.acquisition_score(c)}
                candidates.append(c)
            candidates.sort(
                key=lambda c: c.mo_scores.get("_surrogate", 0), reverse=True,
            )
            while len(new_pop) < target_size and candidates:
                new_pop.append(candidates.pop(0))
        else:
            all_types = list({d.algorithm_type for d in population})
            while len(new_pop) < target_size:
                new_pop.append(DNAFactory.create_random(random.choice(all_types)))

        return new_pop

    @staticmethod
    def _compute_pareto_ranks(population: List[AlgorithmDNA]) -> Dict[str, int]:
        """NSGA-II: احسب رتب بارتو بناءً على mo_scores متعدد الأهداف.

        الرتبة 1 = جبهة بارتو الأولى (غير مهيمن عليها بأحد).
        تُستخدم بعد التقييم المتعدد الأهداف لاختيار أكثر تنوعاً وكفاءةً.
        """
        ranks: Dict[str, int] = {}
        n = len(population)
        domination_count: Dict[str, int] = {d.id: 0 for d in population}
        dominated_by: Dict[str, List[str]] = {d.id: [] for d in population}

        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                di, dj = population[i], population[j]
                si = di.mo_scores
                sj = dj.mo_scores
                if not si or not sj:
                    continue
                keys = set(si) & set(sj) - {"_surrogate"}
                if not keys:
                    continue
                # dj يهيمن على di إذا كان أفضل أو مساوياً في كل المحاور
                # وأفضل منه في محور واحد على الأقل
                j_better_or_equal = all(sj.get(k, 0) >= si.get(k, 0) for k in keys)
                j_strictly_better = any(sj.get(k, 0) > si.get(k, 0) for k in keys)
                if j_better_or_equal and j_strictly_better:
                    domination_count[di.id] += 1
                    dominated_by[dj.id].append(di.id)

        # الجبهة الأولى: كل من لا يهيمن عليه أحد
        current_front = [d for d in population if domination_count[d.id] == 0]
        rank = 1
        while current_front:
            for d in current_front:
                ranks[d.id] = rank
            next_front = []
            for d in current_front:
                for dominated_id in dominated_by[d.id]:
                    domination_count[dominated_id] -= 1
                    if domination_count[dominated_id] == 0:
                        dominated_dna = next(
                            (x for x in population if x.id == dominated_id), None,
                        )
                        if dominated_dna:
                            next_front.append(dominated_dna)
            current_front = next_front
            rank += 1

        # أي فرد لم يُصنَّف (لا mo_scores) يحصل على رتبة عالية
        for d in population:
            if d.id not in ranks:
                ranks[d.id] = rank

        return ranks

    @staticmethod
    def _select_diverse_top(
        population: List[AlgorithmDNA], n: int = 8,
    ) -> List[AlgorithmDNA]:
        selected: List[AlgorithmDNA] = []
        seen: set = set()
        for dna in population:
            if dna.algorithm_type not in seen:
                selected.append(dna)
                seen.add(dna.algorithm_type)
            if len(selected) >= n:
                break
        for dna in population:
            if dna not in selected and len(selected) < n:
                selected.append(dna)
        return selected[:n]
