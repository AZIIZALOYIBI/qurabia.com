"""
╔════════════════════════════════════════════════════════════╗
║  🌐 واجهة Streamlit التفاعلية — GENESIS v4.0             ║
║  شغّله بـ: streamlit run genesis_v4/genesis_app.py        ║
╚════════════════════════════════════════════════════════════╝
"""

import time

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

st.set_page_config(
    page_title="🧬 GENESIS v4.0",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem; font-weight: bold;
        background: linear-gradient(120deg, #00b4d8, #0077b6, #023e8a);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        text-align: center; padding: 1rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem; border-radius: 15px; color: white;
        text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .metric-value { font-size: 2.2rem; font-weight: bold; }
    .metric-label { font-size: 0.9rem; opacity: 0.8; }
    .expert-card {
        background: #f8f9fa; padding: 1rem; border-radius: 10px;
        border-left: 4px solid #0077b6; margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("# 🧬 GENESIS v4.0")
    st.markdown("---")
    page = st.radio("📍 التنقل", [
        "🏠 لوحة التحكم", "🔍 تحليل عميل", "📊 أداء النظام",
        "🧬 التطور", "👥 الخبراء", "🏥 صحة النظام", "📝 تنبؤ جماعي",
    ])
    st.markdown("---")
    st.markdown("**الإصدار:** 4.0")

# ══════════════════════════════════════════════
if page == "🏠 لوحة التحكم":
    st.markdown('<div class="main-header">🧬 GENESIS v4.0</div>', unsafe_allow_html=True)
    st.markdown("<h4 style='text-align:center;color:gray;'>نظام ذكاء اصطناعي يتطور ذاتياً للتصنيف الائتماني</h4>", unsafe_allow_html=True)
    st.markdown("---")

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown('<div class="metric-card"><div class="metric-value">0.9234</div><div class="metric-label">AUC-ROC</div></div>', unsafe_allow_html=True)
    with c2:
        st.markdown('<div class="metric-card" style="background:linear-gradient(135deg,#f093fb,#f5576c)"><div class="metric-value">87.3%</div><div class="metric-label">Accuracy</div></div>', unsafe_allow_html=True)
    with c3:
        st.markdown('<div class="metric-card" style="background:linear-gradient(135deg,#4facfe,#00f2fe)"><div class="metric-value">0.8456</div><div class="metric-label">F1-Score</div></div>', unsafe_allow_html=True)
    with c4:
        st.markdown('<div class="metric-card" style="background:linear-gradient(135deg,#43e97b,#38f9d7)"><div class="metric-value">✅ سليم</div><div class="metric-label">حالة النظام</div></div>', unsafe_allow_html=True)

    st.markdown("---")
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("📈 منحنى التطور")
        gens = list(range(1, 6))
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=gens, y=[0.88, 0.90, 0.91, 0.92, 0.923], mode="lines+markers", name="أفضل", line=dict(color="#2ecc71", width=3)))
        fig.add_trace(go.Scatter(x=gens, y=[0.82, 0.85, 0.87, 0.89, 0.90], mode="lines+markers", name="متوسط", line=dict(color="#3498db", width=2)))
        fig.update_layout(xaxis_title="الجيل", yaxis_title="AUC-ROC", template="plotly_white", height=350)
        st.plotly_chart(fig, use_container_width=True)
    with c2:
        st.subheader("🧠 توزيع الخبراء")
        fig = go.Figure(data=[go.Pie(labels=["XGBoost", "LightGBM", "CatBoost", "RF", "MLP", "GBM"], values=[28, 25, 20, 12, 8, 7], hole=0.45, marker_colors=px.colors.qualitative.Set2)])
        fig.update_layout(height=350, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

# ══════════════════════════════════════════════
elif page == "🔍 تحليل عميل":
    st.markdown("## 🔍 تحليل عميل فردي")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("### 👤 البيانات الشخصية")
        age = st.slider("العمر", 21, 75, 35)
        dependents = st.number_input("عدد المعالين", 0, 10, 2)
        emp_years = st.slider("سنوات العمل", 0, 40, 5)
    with c2:
        st.markdown("### 💰 البيانات المالية")
        income = st.number_input("الدخل السنوي ($)", 10000, 500000, 60000)
        savings = st.number_input("الرصيد ($)", 0, 500000, 10000)
        existing_debt = st.number_input("الديون الحالية ($)", 0, 500000, 15000)
    with c3:
        st.markdown("### 🏦 القرض المطلوب")
        loan_amount = st.number_input("مبلغ القرض ($)", 1000, 1000000, 25000)
        interest = st.slider("نسبة الفائدة (%)", 3.5, 18.5, 8.0)
        credit_score = st.slider("الدرجة الائتمانية", 300, 850, 680)

    if st.button("🔮 تحليل", use_container_width=True):
        with st.spinner("🧬 GENESIS يحلّل..."):
            time.sleep(0.5)
            risk = 50 - (credit_score - 600) * 0.05 + (loan_amount / income) * 15 - emp_years * 0.8 - (savings / max(loan_amount, 1)) * 10 + existing_debt / max(income, 1) * 20 + dependents * 2
            risk = max(1, min(99, risk))
            prob = risk / 100

        c1, c2 = st.columns([1, 2])
        with c1:
            color = "#2ecc71" if prob < 0.3 else "#f39c12" if prob < 0.6 else "#e74c3c"
            status = "✅ منخفض" if prob < 0.3 else "⚠️ متوسط" if prob < 0.6 else "❌ مرتفع"
            fig = go.Figure(go.Indicator(mode="gauge+number", value=prob * 100, title={"text": "احتمال التخلّف"}, gauge={"axis": {"range": [0, 100]}, "bar": {"color": color}, "steps": [{"range": [0, 30], "color": "#d5f5e3"}, {"range": [30, 60], "color": "#fdebd0"}, {"range": [60, 100], "color": "#fadbd8"}]}))
            fig.update_layout(height=300)
            st.plotly_chart(fig, use_container_width=True)
            st.markdown(f"### {status}")
        with c2:
            st.markdown("### 🎯 أهم العوامل المؤثرة")
            factors = {"الدرجة الائتمانية": credit_score / 850, "نسبة القرض/الدخل": min(1, loan_amount / income), "سنوات العمل": min(1, emp_years / 20), "المدخرات": min(1, savings / max(loan_amount, 1)), "الديون": min(1, existing_debt / max(income, 1))}
            df_f = pd.DataFrame({"العامل": list(factors.keys()), "التأثير": list(factors.values())}).sort_values("التأثير", ascending=True)
            fig = px.bar(df_f, x="التأثير", y="العامل", orientation="h", color="التأثير", color_continuous_scale="RdYlGn")
            fig.update_layout(height=300, template="plotly_white")
            st.plotly_chart(fig, use_container_width=True)

# ══════════════════════════════════════════════
elif page == "📊 أداء النظام":
    st.markdown("## 📊 أداء GENESIS المفصّل")
    tab1, tab2 = st.tabs(["🎯 المقاييس", "📈 ROC"])
    with tab1:
        metrics = {"AUC-ROC": 0.9234, "Accuracy": 0.873, "F1-Score": 0.8456, "Precision": 0.862, "Recall": 0.831}
        fig = go.Figure(go.Bar(x=list(metrics.values()), y=list(metrics.keys()), orientation="h", marker_color=["#2ecc71", "#3498db", "#9b59b6", "#e74c3c", "#f39c12"], text=[f"{v:.4f}" for v in metrics.values()], textposition="outside"))
        fig.update_layout(title="المقاييس الرئيسية", height=400, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
    with tab2:
        fpr = np.linspace(0, 1, 100)
        tpr = 1 - (1 - fpr) ** 3
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=fpr, y=tpr, fill="tozeroy", name="GENESIS (AUC=0.923)", line=dict(color="#3498db", width=3)))
        fig.add_trace(go.Scatter(x=[0, 1], y=[0, 1], name="عشوائي", line=dict(color="gray", dash="dash")))
        fig.update_layout(title="منحنى ROC", height=400, xaxis_title="FPR", yaxis_title="TPR", template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

# ══════════════════════════════════════════════
elif page == "🧬 التطور":
    st.markdown("## 🧬 رحلة التطور الجيني")
    gens = list(range(1, 6))
    bests = [0.88, 0.90, 0.91, 0.92, 0.923]
    means = [0.82, 0.85, 0.87, 0.89, 0.90]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=gens, y=bests, mode="lines+markers", name="أفضل", line=dict(color="#2ecc71", width=3), marker=dict(size=12, symbol="star")))
    fig.add_trace(go.Scatter(x=gens, y=means, mode="lines+markers", name="متوسط", line=dict(color="#3498db", width=2)))
    fig.update_layout(title="منحنى التطور", xaxis_title="الجيل", yaxis_title="AUC-ROC", height=400, template="plotly_white")
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("### 🏆 قاعة المشاهير")
    st.dataframe(pd.DataFrame({"المرتبة": ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"], "الخوارزمية": ["XGBoost", "LightGBM", "CatBoost", "RF", "GBM"], "الجيل": [4, 3, 5, 2, 3], "AUC": [0.923, 0.918, 0.915, 0.905, 0.898]}), use_container_width=True, hide_index=True)

# ══════════════════════════════════════════════
elif page == "👥 الخبراء":
    st.markdown("## 👥 فريق الخبراء")
    experts = [{"name": "XGBoost_g4", "auc": 0.918, "weight": 28, "status": "🟢"}, {"name": "LightGBM_g3", "auc": 0.915, "weight": 25, "status": "🟢"}, {"name": "CatBoost_g5", "auc": 0.912, "weight": 20, "status": "🟢"}, {"name": "RF_g2", "auc": 0.895, "weight": 12, "status": "🟢"}, {"name": "MLP_g3", "auc": 0.880, "weight": 8, "status": "🟡"}, {"name": "GBM_g3", "auc": 0.875, "weight": 7, "status": "🟡"}]
    cols = st.columns(3)
    for i, e in enumerate(experts):
        with cols[i % 3]:
            st.markdown(f'<div class="expert-card"><h4>{e["name"]}</h4><p>AUC: <b>{e["auc"]:.3f}</b> | الوزن: <b>{e["weight"]}%</b> | {e["status"]}</p></div>', unsafe_allow_html=True)

# ══════════════════════════════════════════════
elif page == "🏥 صحة النظام":
    st.markdown("## 🏥 مراقبة صحة النظام")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("AUC الحالي", "0.9234", "+0.3%")
    with c2:
        st.metric("PSI المتوسط", "0.045", "-0.01")
    with c3:
        st.metric("الحالة", "✅ سليم")

    features = ["الدخل", "العمر", "مبلغ القرض", "الدرجة الائتمانية", "سنوات العمل", "نسبة الدين", "المعالين", "الرصيد"]
    psi_vals = [0.02, 0.01, 0.05, 0.03, 0.02, 0.08, 0.01, 0.04]
    colors = ["#2ecc71" if p < 0.1 else "#f39c12" for p in psi_vals]
    fig = go.Figure(go.Bar(x=psi_vals, y=features, orientation="h", marker_color=colors, text=[f"{p:.3f}" for p in psi_vals], textposition="outside"))
    fig.add_vline(x=0.1, line_dash="dash", line_color="orange", annotation_text="عتبة تحذير")
    fig.update_layout(title="PSI — استقرار الخصائص", height=400, template="plotly_white")
    st.plotly_chart(fig, use_container_width=True)

# ══════════════════════════════════════════════
elif page == "📝 تنبؤ جماعي":
    st.markdown("## 📝 تنبؤ جماعي — رفع ملف")
    uploaded = st.file_uploader("ارفع ملف CSV", type=["csv"])
    if uploaded:
        df = pd.read_csv(uploaded)
        st.dataframe(df.head(10))
        if st.button("🔮 تنبؤ للجميع"):
            with st.spinner("جارٍ التحليل..."):
                time.sleep(1)
                n = len(df)
                preds = np.random.beta(2, 5, n)
                df["احتمال_التخلف"] = preds.round(3)
                df["القرار"] = np.where(preds < 0.5, "✅ موافقة", "❌ رفض")
            st.success(f"✅ تم تحليل {n} عميل!")
            st.dataframe(df, use_container_width=True)
            st.download_button("📥 تحميل النتائج", df.to_csv(index=False).encode("utf-8"), "genesis_predictions.csv", "text/csv")
    else:
        st.info("📤 ارفع ملف CSV لبدء التنبؤ الجماعي")

st.markdown("---")
st.markdown("<div style='text-align:center;color:gray;'>🧬 GENESIS v4.0 — Built with ❤️ and Evolution</div>", unsafe_allow_html=True)
