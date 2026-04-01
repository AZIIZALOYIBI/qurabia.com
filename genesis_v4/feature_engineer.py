"""
╔════════════════════════════════════════════════════════════╗
║  المرحلة ١-ب: هندسة الخصائص التلقائية                    ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

from itertools import combinations
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.cluster import KMeans
from sklearn.feature_selection import mutual_info_classif
from sklearn.preprocessing import StandardScaler


class AutoFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    مهندس خصائص تلقائي — يُنشئ خصائص جديدة ذكية.

    يشمل:
    • النسب المالية (DTI, PTI, …)
    • التقسيم الذكي (Binning)
    • التفاعلات بين الخصائص
    • الترميز المستهدف (Target Encoding) مع تنعيم بيزي
    • خصائص إحصائية تجميعية
    • خصائص المجموعات (Cluster Features)
    """

    def __init__(
        self,
        create_ratios: bool = True,
        create_bins: bool = True,
        create_interactions: bool = True,
        create_target_enc: bool = True,
        create_cluster_features: bool = True,
        n_clusters: int = 5,
        interaction_top_k: int = 8,
        verbosity: int = 1,
    ) -> None:
        self.create_ratios = create_ratios
        self.create_bins = create_bins
        self.create_interactions = create_interactions
        self.create_target_enc = create_target_enc
        self.create_cluster_features = create_cluster_features
        self.n_clusters = n_clusters
        self.interaction_top_k = interaction_top_k
        self.verbosity = verbosity

        self.target_enc_maps_: Dict[str, Dict[Any, float]] = {}
        self.kmeans_: Optional[KMeans] = None
        self.cluster_scaler_: Optional[StandardScaler] = None
        self.selected_interactions_: list = []
        self.top_features_: list = []
        self.feature_names_out_: list = []
        self.original_columns_: list = []
        self.numeric_columns_: list = []
        self.is_fitted_: bool = False

    def fit(self, X: pd.DataFrame | np.ndarray, y: Optional[np.ndarray] = None):
        df = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()

        self.original_columns_ = list(df.columns)
        self.numeric_columns_ = df.select_dtypes(include=[np.number]).columns.tolist()

        # ═══ Target Encoding ═══
        if self.create_target_enc and y is not None:
            categorical_cols: List[str] = df.select_dtypes(
                include=["object", "category"],
            ).columns.tolist()
            for col in self.numeric_columns_:
                if df[col].nunique() < 10:
                    categorical_cols.append(col)

            global_mean = float(np.mean(y))
            smoothing = 20
            for col in categorical_cols:
                enc_map: Dict[Any, float] = {}
                for val in df[col].unique():
                    mask = df[col] == val
                    n_cat = int(mask.sum())
                    cat_mean = float(y[mask].mean()) if n_cat > 0 else global_mean
                    enc_map[val] = (n_cat * cat_mean + smoothing * global_mean) / (
                        n_cat + smoothing
                    )
                self.target_enc_maps_[col] = enc_map

        # ═══ التفاعلات ═══
        if self.create_interactions and y is not None:
            mi = mutual_info_classif(
                df[self.numeric_columns_].fillna(0), y, random_state=42,
            )
            top_idx = np.argsort(mi)[::-1][: self.interaction_top_k]
            self.top_features_ = [self.numeric_columns_[i] for i in top_idx]
            self.selected_interactions_ = list(combinations(self.top_features_, 2))

        # ═══ Cluster Features ═══
        if self.create_cluster_features:
            numeric_data = df[self.numeric_columns_].fillna(0).values
            self.cluster_scaler_ = StandardScaler()
            numeric_scaled = self.cluster_scaler_.fit_transform(numeric_data)
            self.kmeans_ = KMeans(
                n_clusters=self.n_clusters, random_state=42, n_init=10,
            )
            self.kmeans_.fit(numeric_scaled)

        self.is_fitted_ = True
        return self

    def transform(self, X: pd.DataFrame | np.ndarray, y: Any = None) -> pd.DataFrame:
        if isinstance(X, pd.DataFrame):
            df = X.copy()
        else:
            df = pd.DataFrame(X, columns=self.original_columns_)

        new_features: Dict[str, Any] = {}
        initial_cols = len(df.columns)

        # ═══ ١- النسب المالية ═══
        if self.create_ratios:
            if "annual_income" in df.columns and "loan_amount" in df.columns:
                income = df["annual_income"].replace(0, 1)
                new_features["ratio_loan_to_income"] = df["loan_amount"] / income

                if "existing_debt" in df.columns:
                    new_features["ratio_debt_to_income"] = df["existing_debt"] / income
                if "monthly_expenses" in df.columns:
                    new_features["ratio_expenses_to_income"] = (
                        df["monthly_expenses"] * 12 / income
                    )
                if "savings_balance" in df.columns:
                    new_features["ratio_savings_to_loan"] = df[
                        "savings_balance"
                    ] / df["loan_amount"].replace(0, 1)
                if "loan_term_months" in df.columns:
                    monthly_payment = df["loan_amount"] / df[
                        "loan_term_months"
                    ].replace(0, 1)
                    new_features["monthly_payment"] = monthly_payment
                    new_features["payment_to_income"] = monthly_payment / (income / 12)
                if "credit_score" in df.columns:
                    new_features["score_x_income"] = df["credit_score"] * np.log1p(
                        income,
                    )

            if "age" in df.columns:
                new_features["age_squared"] = df["age"] ** 2
                if "employment_years" in df.columns:
                    new_features["employment_ratio"] = df["employment_years"] / df[
                        "age"
                    ].replace(0, 1)

        # ═══ ٢- التقسيم الذكي ═══
        if self.create_bins:
            bin_cols = ["credit_score", "age", "annual_income", "credit_utilization"]
            for col in bin_cols:
                if col in df.columns:
                    try:
                        new_features[f"{col}_bin"] = pd.qcut(
                            df[col], q=5, labels=False, duplicates="drop",
                        )
                    except Exception:
                        new_features[f"{col}_bin"] = pd.cut(
                            df[col], bins=5, labels=False,
                        )

        # ═══ ٣- التفاعلات ═══
        if self.create_interactions and self.selected_interactions_:
            for col_a, col_b in self.selected_interactions_:
                if col_a in df.columns and col_b in df.columns:
                    a = df[col_a].fillna(0)
                    b = df[col_b].fillna(0)
                    new_features[f"interact_{col_a}_x_{col_b}"] = a * b
                    denom = b.replace(0, 1)
                    new_features[f"ratio_{col_a}_div_{col_b}"] = a / denom

        # ═══ ٤- Target Encoding ═══
        if self.create_target_enc and self.target_enc_maps_:
            for col, enc_map in self.target_enc_maps_.items():
                if col in df.columns:
                    global_mean = float(np.mean(list(enc_map.values())))
                    new_features[f"{col}_target_enc"] = (
                        df[col].map(enc_map).fillna(global_mean)
                    )

        # ═══ ٥- Cluster Features ═══
        if self.create_cluster_features and self.kmeans_ is not None:
            numeric_data = df[self.numeric_columns_].fillna(0).values
            numeric_scaled = self.cluster_scaler_.transform(numeric_data)
            new_features["cluster_id"] = self.kmeans_.predict(numeric_scaled)
            distances = self.kmeans_.transform(numeric_scaled)
            new_features["cluster_distance"] = distances.min(axis=1)

        # ═══ ٦- خصائص إحصائية ═══
        numeric_cols_avail = [c for c in self.numeric_columns_ if c in df.columns]
        if numeric_cols_avail:
            numeric_vals = df[numeric_cols_avail].fillna(0)
            new_features["row_mean"] = numeric_vals.mean(axis=1)
            new_features["row_std"] = numeric_vals.std(axis=1)
            new_features["row_max"] = numeric_vals.max(axis=1)
            new_features["row_min"] = numeric_vals.min(axis=1)
            new_features["row_skew"] = numeric_vals.skew(axis=1)
            new_features["n_missing"] = df.isnull().sum(axis=1)

        # ═══ دمج ═══
        new_df = pd.DataFrame(new_features, index=df.index)
        result = pd.concat([df, new_df], axis=1)
        result = result.replace([np.inf, -np.inf], np.nan)
        result = result.fillna(result.median())

        self.feature_names_out_ = list(result.columns)

        if self.verbosity > 0:
            n_new = len(result.columns) - initial_cols
            print(
                f"   🔧 هندسة الخصائص: {initial_cols} → "
                f"{len(result.columns)} (+{n_new} جديدة)",
            )

        return result
