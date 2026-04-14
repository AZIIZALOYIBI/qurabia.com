"""
╔════════════════════════════════════════════════════════════╗
║  المرحلة ١-أ: تحميل ومعالجة بيانات ائتمانية حقيقية      ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import numpy as np
import pandas as pd


class RealDataLoader:
    """
    تحميل ومعالجة بيانات ائتمانية حقيقية.
    يدعم عدة مجموعات بيانات معروفة.
    """

    @staticmethod
    def load_credit_dataset(source: str = "generate_realistic") -> pd.DataFrame:
        """
        تحميل بيانات ائتمانية.

        المصادر المدعومة:
        - ``'german_credit'``: German Credit Dataset (UCI)
        - ``'generate_realistic'``: توليد بيانات واقعية بخصائص حقيقية
        """
        if source == "german_credit":
            return RealDataLoader._load_german_credit()
        if source == "generate_realistic":
            return RealDataLoader._generate_realistic()
        print(f"⚠️ مصدر غير معروف: {source}")
        return RealDataLoader._generate_realistic()

    @staticmethod
    def _load_german_credit() -> pd.DataFrame:
        """تحميل German Credit من UCI."""
        try:
            url = (
                "https://archive.ics.uci.edu/ml/machine-learning-databases/"
                "statlog/german/german.data"
            )
            columns = [
                "checking_status", "duration", "credit_history", "purpose",
                "credit_amount", "savings_status", "employment",
                "installment_commitment", "personal_status", "other_parties",
                "residence_since", "property_magnitude", "age",
                "other_payment_plans", "housing", "existing_credits", "job",
                "num_dependents", "own_telephone", "foreign_worker", "target",
            ]
            df = pd.read_csv(url, sep=" ", header=None, names=columns)
            df["target"] = (df["target"] == 2).astype(int)
            print(f"✅ German Credit: {df.shape[0]} صف × {df.shape[1]} عمود")
            return df
        except Exception as exc:
            print(f"⚠️ فشل تحميل German Credit: {exc}")
            return RealDataLoader._generate_realistic()

    @staticmethod
    def _generate_realistic(n: int = 10_000, seed: int = 42) -> pd.DataFrame:
        """
        توليد بيانات ائتمانية واقعية بخصائص حقيقية
        تحاكي بيانات Home Credit Default Risk.
        """
        rng = np.random.RandomState(seed)
        print("📊 توليد بيانات ائتمانية واقعية...")

        data: dict = {}

        # ═══ الخصائص الديموغرافية ═══
        data["age"] = rng.normal(40, 12, n).clip(21, 75).astype(int)
        data["gender"] = rng.choice([0, 1], n, p=[0.4, 0.6])
        data["dependents"] = rng.poisson(1.5, n).clip(0, 6)
        data["education_level"] = rng.choice(
            [1, 2, 3, 4], n, p=[0.15, 0.35, 0.35, 0.15],
        )

        # ═══ الخصائص المالية ═══
        base_income = rng.lognormal(10.5, 0.6, n)
        education_bonus = data["education_level"] * 0.15
        data["annual_income"] = (base_income * (1 + education_bonus)).astype(int)

        data["monthly_expenses"] = (
            data["annual_income"] / 12 * rng.uniform(0.3, 0.8, n)
        ).astype(int)

        data["savings_balance"] = (
            data["annual_income"] * rng.exponential(0.3, n)
        ).clip(0).astype(int)

        data["existing_debt"] = (
            data["annual_income"] * rng.exponential(0.4, n)
        ).clip(0).astype(int)

        # ═══ القرض المطلوب ═══
        data["loan_amount"] = (
            data["annual_income"] * rng.uniform(0.5, 4.0, n)
        ).astype(int)

        data["loan_term_months"] = rng.choice(
            [12, 24, 36, 48, 60, 72, 84, 120],
            n,
            p=[0.05, 0.1, 0.2, 0.25, 0.2, 0.1, 0.05, 0.05],
        )

        data["interest_rate"] = rng.uniform(3.5, 18.5, n).round(2)
        data["loan_purpose"] = rng.choice(
            [0, 1, 2, 3, 4], n, p=[0.3, 0.25, 0.2, 0.15, 0.1],
        )

        # ═══ التاريخ الائتماني ═══
        data["credit_score"] = rng.normal(680, 80, n).clip(300, 850).astype(int)

        data["years_credit_history"] = (
            (data["age"] - 20) * rng.uniform(0.2, 0.9, n)
        ).clip(0, 40).astype(int)

        data["num_credit_accounts"] = rng.poisson(4, n).clip(0, 15)
        data["num_late_payments"] = rng.poisson(0.8, n).clip(0, 10)
        data["num_defaults_history"] = rng.poisson(0.1, n).clip(0, 3)

        data["credit_utilization"] = rng.beta(2, 5, n).round(3)
        data["num_inquiries_6m"] = rng.poisson(1.2, n).clip(0, 8)

        # ═══ الوظيفة ═══
        data["employment_years"] = rng.exponential(5, n).clip(0, 40).astype(int)

        data["employment_type"] = rng.choice(
            [0, 1, 2, 3], n, p=[0.1, 0.5, 0.25, 0.15],
        )

        data["months_since_last_job_change"] = rng.exponential(
            24, n,
        ).clip(0, 240).astype(int)

        # ═══ السكن ═══
        data["housing_type"] = rng.choice([0, 1, 2], n, p=[0.35, 0.45, 0.2])

        data["years_at_address"] = rng.exponential(5, n).clip(0, 30).astype(int)

        # ═══ حساب الهدف (التخلّف عن السداد) ═══
        income_safe = np.maximum(data["annual_income"], 1)
        default_logit = (
            -3.0
            - 0.03 * (data["credit_score"] - 600)
            + 0.8 * (data["loan_amount"] / income_safe)
            + 0.5 * data["num_late_payments"]
            + 1.2 * data["num_defaults_history"]
            - 0.02 * data["age"]
            - 0.05 * data["employment_years"]
            + 0.3 * data["credit_utilization"]
            + 0.15 * data["num_inquiries_6m"]
            - 0.1 * data["education_level"]
            + 0.5 * (data["employment_type"] == 0).astype(int)
            + 0.2 * data["dependents"]
            + 0.01 * data["interest_rate"]
            - 0.3 * (data["savings_balance"] > data["loan_amount"] * 0.2).astype(int)
            + rng.normal(0, 0.5, n)
        )

        default_prob = 1 / (1 + np.exp(-default_logit))
        data["target"] = (rng.random(n) < default_prob).astype(int)

        df = pd.DataFrame(data)

        # ═══ إضافة قيم مفقودة واقعية ═══
        missing_cols = [
            "savings_balance", "employment_years",
            "credit_utilization", "months_since_last_job_change",
        ]
        for col in missing_cols:
            mask = rng.random(n) < 0.05
            df.loc[mask, col] = np.nan

        default_rate = df["target"].mean()
        print(f"✅ بيانات واقعية: {n:,} عميل × {len(df.columns)} خاصية")
        print(f"   نسبة التخلّف: {default_rate * 100:.1f}%")
        print(f"   القيم المفقودة: {df.isnull().sum().sum()}")

        return df
