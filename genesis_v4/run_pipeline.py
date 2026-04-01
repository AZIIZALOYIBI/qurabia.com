"""
🚀 تشغيل GENESIS v4.0 — Pipeline الكامل
"""

from genesis_v4.data_loader import RealDataLoader
from genesis_v4.genesis_system import GENESISv4

if __name__ == "__main__":
    print("=" * 70)
    print("🚀 تشغيل GENESIS v4.0 — Pipeline الكامل")
    print("=" * 70)

    df = RealDataLoader.load_credit_dataset("generate_realistic")

    print(f"\n📊 نظرة على البيانات:")
    print(df.head())
    print(f"\n📈 إحصائيات:")
    print(df.describe().round(2))

    genesis = GENESISv4(
        pop_size=3,
        n_generations=3,
        n_experts=6,
        enable_stacking=True,
        use_surrogate=True,
        multi_objective=True,
    )

    metrics = genesis.full_pipeline(df, target_col="target")

    print("\n🔍 تحليل عميل رقم ٤٢:")
    result = genesis.explain_customer(42)
    for k, v in result.items():
        if isinstance(v, dict):
            print(f"   {k}:")
            for ek, ev in v.items():
                print(f"      {ek}: {ev:.1f}%")
        else:
            print(f"   {k}: {v}")

    print("\n🏥 فحص الصحة:")
    genesis.monitor.full_health_check(genesis.moe, genesis._X_test, genesis._y_test)

    genesis.save("genesis_v4.pkl")
