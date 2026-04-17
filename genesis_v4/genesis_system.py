"""
╔════════════════════════════════════════════════════════════╗
║  🧬 GENESIS v4.0 — النظام الكامل المتكامل                ║
║                                                            ║
║  Pipeline:                                                 ║
║  بيانات حقيقية → هندسة خصائص → تطور متقدم →              ║
║  مزيج خبراء → مراقبة → واجهة تفاعلية                     ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import pickle
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import torch
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, RobustScaler

try:
    from imblearn.combine import SMOTETomek
except ImportError:  # pragma: no cover
    SMOTETomek = None  # type: ignore[assignment,misc]

from genesis_v4.evolution import EvolutionEngineV3
from genesis_v4.feature_engineer import AutoFeatureEngineer
from genesis_v4.mixture_of_experts import MixtureOfExperts
from genesis_v4.self_monitor import SelfMonitor


class GENESISv4:
    """
    🧬 GENESIS v4.0 — النظام الكامل المتكامل.

    Pipeline:
    بيانات حقيقية → هندسة خصائص → تطور متقدم →
    مزيج خبراء → مراقبة → واجهة تفاعلية
    """

    def __init__(
        self,
        pop_size: int = 3,
        n_generations: int = 3,
        n_experts: int = 6,
        enable_stacking: bool = True,
        use_surrogate: bool = True,
        multi_objective: bool = True,
    ) -> None:
        self.evolution = EvolutionEngineV3(
            population_size_per_type=pop_size,
            n_generations=n_generations,
            top_k_survive=2,
            mutation_rate=0.3,
            use_surrogate=use_surrogate,
            multi_objective=multi_objective,
        )
        self.n_experts = n_experts
        self.enable_stacking = enable_stacking
        self.moe: Optional[MixtureOfExperts] = None
        self.monitor = SelfMonitor(threshold_drop=0.02)
        self.feature_engineer: Optional[AutoFeatureEngineer] = None
        self.scaler: Optional[RobustScaler] = None
        self.imputer: Optional[SimpleImputer] = None
        self.version = "4.7"
        self.creation_time = datetime.now().isoformat()
        self.metrics: Dict[str, float] = {}
        self.feature_names: List[str] = []
        self.reserve_dnas: list = []

        # v4.7 Advanced Features
        self.quantum_optimization_enabled = True
        self.xai_enabled = True
        self.federated_learning_support = True

        # حفظ بيانات التدريب/الاختبار للتحليل
        self._X_train: Optional[np.ndarray] = None
        self._y_train: Optional[np.ndarray] = None
        self._X_test: Optional[np.ndarray] = None
        self._y_test: Optional[np.ndarray] = None

    def full_pipeline(
        self,
        df: pd.DataFrame,
        target_col: str = "target",
        test_size: float = 0.25,
    ) -> Dict[str, float]:
        """🚀 Pipeline الكامل: من البيانات الخام حتى النموذج الجاهز."""
        print("""
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║          🧬 G E N E S I S  v4.0 — Pipeline الكامل               ║
║                                                                   ║
║    📊 بيانات → 🔧 هندسة → 🧬 تطور → 🧠 خبراء → 🌐 جاهز        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
        """)

        total_start = time.time()

        # ════════════════════════════════════════
        # ① تحضير البيانات
        # ════════════════════════════════════════
        print("█▓░ ① تحضير البيانات")
        y = df[target_col].values
        X_df = df.drop(columns=[target_col])

        cat_cols = X_df.select_dtypes(include=["object", "category"]).columns
        for col in cat_cols:
            le = LabelEncoder()
            X_df[col] = le.fit_transform(X_df[col].astype(str))

        print(f"   📊 {len(X_df):,} صف × {len(X_df.columns)} عمود")
        print(f"   🎯 نسبة الهدف: {y.mean() * 100:.1f}% إيجابي")

        # ════════════════════════════════════════
        # ② هندسة الخصائص
        # ════════════════════════════════════════
        print("\n█▓░ ② هندسة الخصائص التلقائية")
        self.feature_engineer = AutoFeatureEngineer(
            create_ratios=True,
            create_bins=True,
            create_interactions=True,
            create_target_enc=True,
            create_cluster_features=True,
            n_clusters=5,
            interaction_top_k=8,
        )

        X_engineered = self.feature_engineer.fit_transform(X_df, y)
        self.feature_names = list(X_engineered.columns)

        # ════════════════════════════════════════
        # ③ التقسيم والتحضير
        # ════════════════════════════════════════
        print("\n█▓░ ③ التقسيم والتوحيد")
        X = X_engineered.values
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y,
        )

        self.scaler = RobustScaler()
        X_train = self.scaler.fit_transform(X_train)
        X_test = self.scaler.transform(X_test)

        self.imputer = SimpleImputer(strategy="median")
        X_train = self.imputer.fit_transform(X_train)
        X_test = self.imputer.transform(X_test)

        # SMOTE
        imbalance_ratio = y_train.mean()
        if SMOTETomek is not None and (imbalance_ratio < 0.4 or imbalance_ratio > 0.6):
            smote = SMOTETomek(random_state=42)
            X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
            print(f"   ⚖️ SMOTE+Tomek: {len(X_train):,} → {len(X_train_res):,}")
        else:
            X_train_res, y_train_res = X_train, y_train
            print("   ⚖️ متوازن — بدون SMOTE")

        print(f"   📊 تدريب: {X_train_res.shape} | اختبار: {X_test.shape}")

        # ════════════════════════════════════════
        # ④ التطور
        # ════════════════════════════════════════
        print("\n█▓░ ④ التطور الجيني المتقدم")
        best_dnas = self.evolution.evolve(X_train_res, y_train_res)

        # ════════════════════════════════════════
        # ⑤ بناء الخبراء
        # ════════════════════════════════════════
        print(f"\n█▓░ ⑤ بناء الخبراء ({self.n_experts})")
        experts = []
        for dna in best_dnas[: self.n_experts]:
            try:
                model = dna.build_model()
                name = f"{dna.algorithm_type}_g{dna.generation}"
                experts.append((name, model))
                print(f"   ✅ {name:<30} AUC:{dna.fitness:.4f}")
            except Exception as exc:
                print(f"   ⚠️ {dna.algorithm_type}: {str(exc)[:30]}")

        self.reserve_dnas = best_dnas[self.n_experts :]

        # ════════════════════════════════════════
        # ⑥ تدريب مزيج الخبراء
        # ════════════════════════════════════════
        print("\n█▓░ ⑥ تدريب MoE + بوابة OOF + Stacking")
        self.moe = MixtureOfExperts(
            experts=experts,
            gate_hidden=128,
            gate_epochs=100,
            temperature=0.8,
            n_oof_folds=5,
            lazy_threshold=0.05,
            enable_stacking=self.enable_stacking,
        )
        self.moe.fit(X_train_res, y_train_res)

        # ════════════════════════════════════════
        # ⑦ استبدال الكسالى
        # ════════════════════════════════════════
        print("\n█▓░ ⑦ فحص الخبراء الكسالى")
        lazy = self.moe.retire_lazy_experts(
            X_train_res, y_train_res, self.reserve_dnas,
        )
        if lazy:
            print("   🔄 إعادة تدريب بعد الاستبدال...")
            self.moe.fit(X_train_res, y_train_res)

        # ════════════════════════════════════════
        # ⑧ التقييم النهائي
        # ════════════════════════════════════════
        print("\n█▓░ ⑧ التقييم النهائي")
        y_pred = self.moe.predict(X_test)
        y_prob = self.moe.predict_proba(X_test)[:, 1]

        self.metrics = {
            "AUC-ROC": roc_auc_score(y_test, y_prob),
            "Accuracy": accuracy_score(y_test, y_pred),
            "F1-Score": f1_score(y_test, y_pred),
            "Precision": precision_score(y_test, y_pred),
            "Recall": recall_score(y_test, y_pred),
            "Log-Loss": log_loss(y_test, y_prob),
            "Avg-Precision": average_precision_score(y_test, y_prob),
        }

        if self.enable_stacking and self.moe.meta_cv_auc > 0:
            self.metrics["Meta-CV-AUC"] = self.moe.meta_cv_auc

        self.monitor.set_baseline(
            self.metrics["AUC-ROC"], X_train_res, self.feature_names,
        )

        total_time = time.time() - total_start

        # ════════════════════════════════════════
        # التقرير
        # ════════════════════════════════════════
        print(f"""
╔═══════════════════════════════════════════════════════════════════╗
║               🧬 GENESIS v4.0 — التقرير النهائي                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║""")

        for name, val in self.metrics.items():
            if val <= 1:
                bar = "█" * int(val * 22)
                print(f"║   {name:<18} {val:.4f}  {bar:<22}      ║")
            else:
                print(f"║   {name:<18} {val:.4f}                              ║")

        n_experts_final = len(self.moe.experts) if self.moe else 0
        print(f"""║                                                                   ║
║   ⏱️ الوقت الكلي:       {total_time:>7.1f}s                           ║
║   📊 الخصائص:           {len(self.feature_names):>7}                           ║
║   👥 الخبراء:           {n_experts_final:>7}                           ║
║   🧬 الأجيال:           {self.evolution.n_generations:>7}                           ║
║   🏆 أفضل تطوري:        {self.evolution.best_ever_fitness:>7.4f}                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝""")

        self._X_train = X_train_res
        self._y_train = y_train_res
        self._X_test = X_test
        self._y_test = y_test

        return self.metrics

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.moe is None:
            raise RuntimeError("Model not trained. Call full_pipeline() first.")
        return self.moe.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.moe is None:
            raise RuntimeError("Model not trained. Call full_pipeline() first.")
        return self.moe.predict_proba(X)

    def predict_new(self, df_new: pd.DataFrame) -> np.ndarray:
        """تنبؤ على بيانات جديدة خام."""
        if self.feature_engineer is None or self.scaler is None or self.imputer is None:
            raise RuntimeError("Model not trained. Call full_pipeline() first.")
        X_eng = self.feature_engineer.transform(df_new)
        X_scaled = self.scaler.transform(X_eng.values)
        X_clean = self.imputer.transform(X_scaled)
        return self.predict_proba(X_clean)[:, 1]

    def explain_customer(self, idx: int) -> Dict[str, Any]:
        """شرح قرار عميل."""
        if self.moe is None or self._X_test is None:
            raise RuntimeError("Model not trained.")
        X = self._X_test[idx]
        gating = self.moe.gating_network
        if gating is None:
            return {"error": "Gating network not available"}

        gating.eval()
        X_t = torch.FloatTensor(X.reshape(1, -1)).to(self.moe.device)

        with torch.no_grad():
            gw, _att = gating(X_t)

        weights = gw.cpu().numpy()[0]
        pred = self.moe.predict(X.reshape(1, -1))[0]
        prob = self.moe.predict_proba(X.reshape(1, -1))[0]

        return {
            "prediction": int(pred),
            "confidence": float(max(prob) * 100),
            "probability_default": float(prob[1] * 100),
            "expert_weights": {
                self.moe.experts[i][0]: float(weights[i] * 100)
                for i in range(len(self.moe.experts))
            },
        }

    def save(self, path: str = "genesis_v4.pkl") -> None:
        """حفظ كامل."""
        if self.moe is None or self.moe.gating_network is None:
            raise RuntimeError("Model not trained.")
        state = {
            "version": self.version,
            "metrics": self.metrics,
            "feature_names": self.feature_names,
            "feature_engineer": self.feature_engineer,
            "scaler": self.scaler,
            "imputer": self.imputer,
            "experts": self.moe.experts,
            "gate_state": self.moe.gating_network.state_dict(),
            "gate_config": {
                "input_dim": self.moe.gating_network.gate[0].in_features,
                "n_experts": self.moe.gating_network.n_experts,
                "hidden_dim": self.moe.gate_hidden,
            },
            "meta_learner": self.moe.meta_learner,
            "evolution_history": self.evolution.history,
        }
        with open(path, "wb") as f:
            pickle.dump(state, f)
        print(f"💾 تم حفظ GENESIS v4.0: {path}")
