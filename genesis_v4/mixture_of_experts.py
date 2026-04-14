"""
╔════════════════════════════════════════════════════════════╗
║  MixtureOfExperts — مزيج الخبراء مع OOF + Stacking       ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import copy
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score

try:
    import lightgbm as lgb
except ImportError:  # pragma: no cover
    lgb = None  # type: ignore[assignment]

from genesis_v4.gating import GatingNetwork


class MixtureOfExperts(BaseEstimator, ClassifierMixin):
    """مزيج الخبراء مع بوابة OOF + Stacking Meta-Learner."""

    def __init__(
        self,
        experts: List[Tuple[str, Any]],
        gate_hidden: int = 64,
        gate_epochs: int = 100,
        temperature: float = 1.0,
        n_oof_folds: int = 5,
        lazy_threshold: float = 0.05,
        enable_stacking: bool = True,
    ) -> None:
        self.experts = experts
        self.gate_hidden = gate_hidden
        self.gate_epochs = gate_epochs
        self.temperature = temperature
        self.n_oof_folds = n_oof_folds
        self.lazy_threshold = lazy_threshold
        self.enable_stacking = enable_stacking
        self.gating_network: Optional[GatingNetwork] = None
        self.meta_learner = None
        self.meta_cv_auc: float = 0.0
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.classes_: Optional[np.ndarray] = None
        self.expert_individual_scores_: Dict[str, float] = {}
        self.removed_experts_: List[str] = []
        self.best_gate_state_: Optional[dict] = None
        self.last_gate_weights_: Optional[np.ndarray] = None
        self.last_attention_: Optional[torch.Tensor] = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> "MixtureOfExperts":
        self.classes_ = np.unique(y)
        n_exp = len(self.experts)
        print(f"\n🧠 تدريب MoE ({n_exp} خبير) — OOF + Stacking")

        # ١- OOF
        oof_preds = np.zeros((len(X), n_exp))
        skf = StratifiedKFold(
            n_splits=self.n_oof_folds, shuffle=True, random_state=42,
        )

        for i, (name, model) in enumerate(self.experts):
            try:
                fold_preds = np.zeros(len(X))
                for train_idx, val_idx in skf.split(X, y):
                    m = copy.deepcopy(model)
                    m.fit(X[train_idx], y[train_idx])
                    fold_preds[val_idx] = m.predict_proba(X[val_idx])[:, 1]
                oof_preds[:, i] = fold_preds
                auc = roc_auc_score(y, fold_preds)
                self.expert_individual_scores_[name] = auc
                print(f"   ✅ {name:<30} OOF-AUC: {auc:.4f}")
            except Exception as exc:
                oof_preds[:, i] = 0.5
                self.expert_individual_scores_[name] = 0.5
                print(f"   ⚠️ {name:<30} {str(exc)[:30]}")

        # ٢- البوابة
        self._train_gate(X, y, oof_preds)

        # ٣- Stacking
        if self.enable_stacking and lgb is not None:
            self._train_meta_learner(X, y, oof_preds)

        # ٤- إعادة تدريب على كل البيانات
        for _name, model in self.experts:
            try:
                model.fit(X, y)
            except Exception:
                pass

        return self

    def _train_gate(
        self, X: np.ndarray, y: np.ndarray, expert_preds_oof: np.ndarray,
    ) -> None:
        input_dim = X.shape[1]
        n_exp = len(self.experts)
        self.gating_network = GatingNetwork(
            input_dim, n_exp, self.gate_hidden, self.temperature,
        ).to(self.device)

        errors = np.abs(expert_preds_oof - y.reshape(-1, 1))
        best_expert = np.argmin(errors, axis=1)

        X_t = torch.FloatTensor(X).to(self.device)
        tgt_t = torch.LongTensor(best_expert).to(self.device)
        y_t = torch.FloatTensor(y).to(self.device)
        exp_t = torch.FloatTensor(expert_preds_oof).to(self.device)

        opt = torch.optim.AdamW(
            self.gating_network.parameters(), lr=0.001, weight_decay=1e-4,
        )
        sched = torch.optim.lr_scheduler.CosineAnnealingLR(
            opt, T_max=self.gate_epochs,
        )

        ds = torch.utils.data.TensorDataset(X_t, tgt_t, y_t, exp_t)
        loader = torch.utils.data.DataLoader(ds, batch_size=128, shuffle=True)

        self.gating_network.train()
        best_loss = float("inf")
        patience_count = 0

        for _epoch in range(self.gate_epochs):
            eloss = 0.0
            for bX, btgt, by, bexp in loader:
                opt.zero_grad()
                gw, _ = self.gating_network(bX)

                loss_gate = F.cross_entropy(gw.log().clamp(min=-10), btgt)
                wpred = (gw * bexp).sum(dim=1)
                loss_pred = F.binary_cross_entropy(
                    wpred.clamp(1e-7, 1 - 1e-7), by,
                )
                entropy = -(gw * gw.log().clamp(min=-10)).sum(dim=1).mean()
                loss_div = -0.1 * entropy

                loss = 0.4 * loss_gate + 0.5 * loss_pred + 0.1 * loss_div
                loss.backward()
                torch.nn.utils.clip_grad_norm_(
                    self.gating_network.parameters(), 1.0,
                )
                opt.step()
                eloss += loss.item()
            sched.step()

            if eloss < best_loss:
                best_loss = eloss
                self.best_gate_state_ = copy.deepcopy(
                    self.gating_network.state_dict(),
                )
                patience_count = 0
            else:
                patience_count += 1
                if patience_count >= 15:
                    break

        if self.best_gate_state_:
            self.gating_network.load_state_dict(self.best_gate_state_)
        print(f"   ✅ البوابة: loss={best_loss:.4f}")

    def _train_meta_learner(
        self, X: np.ndarray, y: np.ndarray, oof_preds: np.ndarray,
    ) -> None:
        meta_feats = np.hstack([
            oof_preds,
            oof_preds.mean(axis=1, keepdims=True),
            oof_preds.std(axis=1, keepdims=True),
            oof_preds.max(axis=1, keepdims=True),
            oof_preds.min(axis=1, keepdims=True),
            (
                oof_preds.max(axis=1, keepdims=True)
                - oof_preds.min(axis=1, keepdims=True)
            ),
        ])
        self.meta_learner = lgb.LGBMClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            num_leaves=15, random_state=42, verbose=-1,
        )
        cv_scores = cross_val_score(
            self.meta_learner,
            meta_feats,
            y,
            cv=StratifiedKFold(3, shuffle=True, random_state=42),
            scoring="roc_auc",
        )
        self.meta_learner.fit(meta_feats, y)
        self.meta_cv_auc = float(cv_scores.mean())
        print(f"   ✅ Meta-Learner CV AUC: {self.meta_cv_auc:.4f}")

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        n_exp = len(self.experts)
        exp_preds = np.zeros((len(X), n_exp))
        for i, (_name, model) in enumerate(self.experts):
            try:
                exp_preds[:, i] = model.predict_proba(X)[:, 1]
            except Exception:
                exp_preds[:, i] = 0.5

        if self.gating_network is None:
            final = exp_preds.mean(axis=1)
            return np.column_stack([1 - final, final])

        self.gating_network.eval()
        X_t = torch.FloatTensor(X).to(self.device)
        with torch.no_grad():
            gw, self.last_attention_ = self.gating_network(X_t)
            gw = gw.cpu().numpy()
        self.last_gate_weights_ = gw
        gate_prob = (gw * exp_preds).sum(axis=1)

        if self.enable_stacking and self.meta_learner is not None:
            meta_feats = np.hstack([
                exp_preds,
                exp_preds.mean(axis=1, keepdims=True),
                exp_preds.std(axis=1, keepdims=True),
                exp_preds.max(axis=1, keepdims=True),
                exp_preds.min(axis=1, keepdims=True),
                (
                    exp_preds.max(axis=1, keepdims=True)
                    - exp_preds.min(axis=1, keepdims=True)
                ),
            ])
            meta_prob = self.meta_learner.predict_proba(meta_feats)[:, 1]
            final = 0.45 * gate_prob + 0.55 * meta_prob
        else:
            final = gate_prob

        return np.column_stack([1 - final, final])

    def predict(self, X: np.ndarray) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)

    def retire_lazy_experts(
        self,
        X: np.ndarray,
        y: np.ndarray,
        replacements: Optional[list] = None,
    ) -> List[int]:
        if self.gating_network is None:
            return []

        self.gating_network.eval()
        X_t = torch.FloatTensor(X).to(self.device)
        with torch.no_grad():
            gw, _ = self.gating_network(X_t)
            gw = gw.cpu().numpy()
        mean_w = gw.mean(axis=0)

        lazy: List[int] = []
        for i, (name, _) in enumerate(self.experts):
            w = mean_w[i]
            s = "🟢" if w >= self.lazy_threshold else "🔴"
            print(f"   {s} {name:<30} {w * 100:>5.1f}%")
            if w < self.lazy_threshold:
                lazy.append(i)

        if lazy and replacements:
            for idx in lazy:
                old = self.experts[idx][0]
                if replacements:
                    new_dna = replacements.pop(0)
                    new_model = new_dna.build_model()
                    new_model.fit(X, y)
                    self.experts[idx] = (
                        f"{new_dna.algorithm_type}_fresh",
                        new_model,
                    )
                    self.removed_experts_.append(old)
                    print(f"   🪦 {old} → 🌱 {self.experts[idx][0]}")

        return lazy
