# 📊 تقرير شامل عن التقنيات المستخدمة في منصة QURABIA

> **تاريخ التقرير**: أبريل 2026
> **المستودع**: [qurabia.com](https://github.com/AZIIZALOYIBI/qurabia.com)
> **المالك**: عبدالعزيز بن سلطان العتيبي
> **الموقع**: https://qurabia.com
> **الشعار**: "نبني جسراً بين الحضارة العربية وتقنيات الغد"

---

## 📑 فهرس المحتويات

1. [ملخص تنفيذي](#-ملخص-تنفيذي)
2. [بنية المشروع](#-بنية-المشروع)
3. [تقنيات الواجهة الأمامية (Frontend)](#-تقنيات-الواجهة-الأمامية-frontend)
4. [تقنيات الواجهة الخلفية (Backend)](#-تقنيات-الواجهة-الخلفية-backend)
5. [محرك GENESIS v4 — الذكاء الاصطناعي التطوري](#-محرك-genesis-v4--الذكاء-الاصطناعي-التطوري)
6. [المحركات الكمية (Quantum Engines)](#-المحركات-الكمية-quantum-engines)
7. [تقنيات الذكاء الاصطناعي](#-تقنيات-الذكاء-الاصطناعي)
8. [تقنيات الأمن السيبراني](#-تقنيات-الأمن-السيبراني)
9. [البنية التحتية والنشر (Infrastructure)](#-البنية-التحتية-والنشر-infrastructure)
10. [أدوات جودة الكود](#-أدوات-جودة-الكود)
11. [الاختبارات](#-الاختبارات)
12. [أنظمة الوكلاء الذكيين (AI Agents)](#-أنظمة-الوكلاء-الذكيين-ai-agents)
13. [نقاط النهاية (API Endpoints)](#-نقاط-النهاية-api-endpoints)
14. [الإحصائيات الشاملة](#-الإحصائيات-الشاملة)

---

## 🎯 ملخص تنفيذي

منصة **QURABIA** هي منصة تقنية عربية شاملة تجمع بين **الذكاء الاصطناعي** و**الحوسبة الكمية** و**الأمن السيبراني**. المنصة مبنية بهندسة Full-Stack حديثة تعتمد على:

| الطبقة | التقنية الرئيسية | لغة البرمجة |
|--------|------------------|-------------|
| الواجهة الأمامية | React 18 + TypeScript + Vite | TypeScript / TSX |
| الواجهة الخلفية | FastAPI + Pydantic | Python 3.11+ |
| المحرك التطوري | GENESIS v4 + Scikit-learn + XGBoost | Python |
| المحاكاة الكمية | محركات كمية مخصصة (17 محرك) | TypeScript |
| النشر | GitHub Pages + Render.com + Docker | YAML / Dockerfile |
| جودة الكود | Biome + Ruff + Pre-commit | JSON / TOML |
| الوكلاء الذكيون | Codex CLI Multi-Agent + GitHub Copilot | TOML |

---

## 🏗️ بنية المشروع

```
qurabia.com/
├── .codex/                    # إعدادات Codex CLI (وكلاء ذكيون متعددون)
│   ├── config.toml            # الإعداد الرئيسي
│   └── agents/                # وكلاء متخصصون (explorer, reviewer, docs-researcher)
├── .github/
│   ├── agents/                # وكلاء GitHub Copilot المخصصون
│   └── workflows/             # CI/CD (deploy, lighthouse, cleanup-branches)
├── backend/                   # الواجهة الخلفية — FastAPI
│   ├── main.py                # التطبيق الرئيسي (1048 سطر)
│   ├── quantum_agi_engine.py  # محرك AGI الكمي (716 سطر)
│   ├── kem_service.py         # خدمة تغليف المفاتيح (KEM)
│   ├── dsa_service.py         # خدمة التوقيع الرقمي (DSA)
│   ├── quantum_chemistry.py   # محاكاة الكيمياء الكمية
│   ├── blackbody.py           # محرك إشعاع الجسم الأسود
│   ├── ethical_governance.py  # نظام الحوكمة الأخلاقية
│   ├── memory_system/         # نظام الذاكرة المهيكلة
│   ├── autdie_framework.py    # إطار عمل AUTDIE الأمني
│   ├── vault_client.py        # عميل HashiCorp Vault
│   ├── Dockerfile             # صورة Docker للنشر
│   ├── requirements.txt       # التبعيات (8 حزم)
│   └── tests/                 # اختبارات (231 اختبار)
├── frontend/                  # الواجهة الأمامية — React + TypeScript
│   ├── src/
│   │   ├── components/        # 24 مكون React (7,600 سطر)
│   │   ├── engine/            # 17 محرك كمي (3,106 سطر)
│   │   ├── core/              # الأساسيات الكمية (3 ملفات)
│   │   ├── utils/             # خوارزميات متقدمة (6 ملفات)
│   │   ├── ethics/            # الحوكمة الأخلاقية
│   │   ├── memory/            # نظام الذاكرة المحلية
│   │   ├── companion/         # نظام الرفيق الكمي
│   │   ├── skills/            # سجل المهارات
│   │   ├── hooks/             # React Hooks مخصصة
│   │   ├── hooks-system/      # نظام Hook Middleware
│   │   ├── keybindings/       # اختصارات لوحة المفاتيح
│   │   ├── output-styles/     # أنماط الإخراج
│   │   ├── visualizers/       # تصورات ثلاثية الأبعاد
│   │   ├── types/             # أنواع TypeScript
│   │   ├── styles/            # نظام التصميم (CSS)
│   │   └── __tests__/         # 16 ملف اختبار
│   ├── index.html             # نقطة الدخول (RTL + CSP)
│   ├── package.json           # التبعيات (22 حزمة)
│   ├── vite.config.ts         # إعداد Vite
│   └── tsconfig.json          # إعداد TypeScript
├── genesis_v4/                # محرك التعلم الآلي التطوري (14 ملف)
├── scripts/                   # سكربتات الأتمتة والجودة
├── docs/                      # التوثيق
├── skills/                    # مهارات AI قابلة لإعادة الاستخدام
├── docker-compose.yml         # بيئة التطوير المحلية
├── render.yaml                # إعداد النشر على Render
├── biome.json                 # إعداد Biome (TS/JS)
├── ruff.toml                  # إعداد Ruff (Python)
├── .pre-commit-config.yaml    # خطافات Pre-commit
├── .lighthouserc.json         # عتبات أداء Lighthouse
├── CNAME                      # النطاق: www.qurabia.com
└── README.md                  # توثيق المشروع
```

---

## ⚛️ تقنيات الواجهة الأمامية (Frontend)

### الإطار والأدوات الأساسية

| التقنية | الإصدار | الوظيفة |
|---------|---------|---------|
| **React** | ^18.3.1 | إطار واجهة المستخدم الرئيسي |
| **TypeScript** | ^5.6.3 | لغة البرمجة مع أنواع ثابتة |
| **Vite** | ^6.0.0 | أداة البناء وخادم التطوير |
| **React DOM** | ^18.3.1 | محرك تقديم React |

### مكتبات واجهة المستخدم

| المكتبة | الإصدار | الوظيفة |
|---------|---------|---------|
| **Three.js** | ^0.160.1 | رسومات ثلاثية الأبعاد (WebGL) — كرة Bloch |
| **@types/three** | ^0.160.0 | أنواع TypeScript لـ Three.js |
| **Recharts** | ^2.15.4 | مكتبة الرسوم البيانية والتصورات |
| **Lucide React** | ^0.300.0 | مكتبة أيقونات React |
| **clsx** | ^2.1.1 | أداة بناء أسماء CSS Classes |
| **tailwind-merge** | ^2.6.1 | دمج فئات Tailwind CSS |

### مكتبات الحساب والمصادقة

| المكتبة | الإصدار | الوظيفة |
|---------|---------|---------|
| **mathjs** | ^12.4.3 | مكتبة رياضيات شاملة (حاسبات كمية) |
| **@react-oauth/google** | ^0.13.4 | مصادقة Google OAuth |
| **jwt-decode** | ^4.0.0 | فك تشفير رموز JWT |

### أدوات التطوير والاختبار

| الأداة | الإصدار | الوظيفة |
|--------|---------|---------|
| **Vitest** | ^4.1.2 | إطار الاختبار الوحدوي |
| **@vitest/coverage-v8** | ^4.1.2 | تغطية الكود |
| **@testing-library/jest-dom** | ^6.9.1 | أدوات اختبار DOM |
| **jsdom** | ^29.0.1 | محاكاة DOM لبيئة الاختبار |
| **@vitejs/plugin-react** | ^4.3.2 | إضافة React لـ Vite |

### إعداد Vite (التحسينات)

- **تقسيم الحزم**: فصل Three.js و Recharts في حزم vendor منفصلة
- **إزالة console/debugger**: في بيئة الإنتاج
- **تسمية الأصول**: بصمة محتوى (Content Hash) للتخزين المؤقت
- **حد حجم الحزمة**: تحذير عند تجاوز 1000 كيلوبايت

### إعداد TypeScript

- **الهدف**: ES2020
- **الوحدة**: ESNext مع Bundler Resolution
- **JSX**: react-jsx
- **الوضع الصارم**: مُفعّل

### مكونات React الرئيسية (24 مكون)

| المكون | الوظيفة |
|--------|---------|
| `UnifiedQuantumPlatform.tsx` | المنصة الرئيسية الموحدة — تدمج DashboardV5 + StrategicPlatform بأربعة تبويبات |
| `LandingPage.tsx` | صفحة الهبوط مع أداة Quantum Forge التفاعلية وعرض الخدمات |
| `QuantumForgePage.tsx` | صفحة مصهر الكم — 4 أدوات: تكميم النص، التشفير، تحليل القرار، البصمة الكمية |
| `DashboardV5.tsx` | لوحة تحكم المحاكاة الكمية — كرة Bloch، مخططات الطاقة، بحث Grover، مختبر الابتكار |
| `StrategicPlatform.tsx` | المنصة الاستراتيجية — معادلات العتيبي، اكتشاف الأدوية، تصحيح الأخطاء الطوبولوجي |
| `AIAnalyticsDashboard.tsx` | لوحة تحليلات الذكاء الاصطناعي |
| `BlackbodyTab.tsx` | تصور طيف إشعاع الجسم الأسود |
| `AlOtaibiPlanckModule.tsx` | وحدة محرك إشعاع بلانك-العتيبي |
| `AlUtaibiV2Module.tsx` | وحدة المعادلة الكونية الموحدة v2.0 |
| `QuantumCryptoModule.tsx` | عرض تفاعلي لبروتوكول BB84 الكمي |
| `QuantumNeuralNetworkModule.tsx` | تصور تدريب الشبكة العصبية الكمية |
| `QuantumDrugDiscovery.tsx` | واجهة محاكاة اكتشاف الأدوية الكمية |
| `GroverSearchModule.tsx` | عرض خوارزمية Grover للبحث الكمي |
| `TopologicalQECVisualizer.tsx` | تصور تصحيح الأخطاء الطوبولوجي (Toric Code) |
| `SovereignDashboard.tsx` | لوحة التحكم السيادية — حالة النظام |
| `NeuroCustomization.tsx` | تخصيص الواجهة العصبية |
| `QuantumNeuralOverlay.tsx` | طبقة تصور الشبكة العصبية |
| `CommandPalette.tsx` | لوحة الأوامر (⌘/Ctrl+K) |
| `MobileBottomNav.tsx` | شريط التنقل السفلي للجوال |
| `VirtualLogsTerminal.tsx` | محطة طرفية افتراضية لعرض السجلات |
| `PageTransition.tsx` | انتقالات الصفحات المتحركة |
| `ThreeErrorBoundary.tsx` | حدود الخطأ لمكونات Three.js |
| `ProblemConfig.tsx` | إعداد معاملات المحاكاة |
| `ResultsDisplay.tsx` | عرض نتائج المحاكاة والتوصيات |

### أنظمة فرعية في الواجهة الأمامية

| النظام | الملفات | الوصف |
|--------|---------|-------|
| **Memory System** | 4 ملفات | إدارة الذاكرة المحلية (localStorage) بحد 200 إدخال مع تتبع العمر والاضمحلال |
| **Skills Registry** | 3 ملفات | سجل لاكتشاف وتسجيل واستدعاء المهارات القابلة لإعادة الاستخدام |
| **Companion System** | 5 ملفات | توليد رفيق كمي فريد من معرف المستخدم باستخدام PRNG حتمي + رسوم Three.js |
| **Hooks System** | 3 ملفات | نظام Hook Middleware لتنفيذ الخطافات المسجلة بخط أنابيب |
| **Keybindings** | 6 ملفات | نظام اختصارات لوحة المفاتيح مع تحليل وتفسير تركيبات المفاتيح |
| **Output Styles** | 3 ملفات | إدارة أنماط وسمات الإخراج |
| **Ethics** | 1 ملف | دستور الأمان غير القابل للتغيير (عتبات: عدم الأذى 0.95، الإحسان 0.80، الاستقلالية 0.90، العدالة 0.85) |

---

## 🐍 تقنيات الواجهة الخلفية (Backend)

### الإطار والتبعيات

| الحزمة | الإصدار | الوظيفة |
|--------|---------|---------|
| **FastAPI** | ≥0.100.0 | إطار ويب غير متزامن عالي الأداء |
| **Uvicorn** | ≥0.20.0 | خادم ASGI |
| **Pydantic** | ≥2.0.0 | التحقق من البيانات والتسلسل |
| **NumPy** | ≥1.26.0 | الحوسبة العددية |
| **httpx** | ≥0.27.0 | عميل HTTP غير متزامن |
| **structlog** | ≥25.1.0 | تسجيل مهيكل (JSON في الإنتاج) |
| **pytest** | ≥7.0.0 | إطار الاختبار |
| **pytest-asyncio** | ≥0.23.0 | دعم الاختبارات غير المتزامنة |

### البنية المعمارية

```
الطبقات المعمارية:
┌─────────────────────────────────┐
│     Middleware Layer             │  ← CORS, GZip, Rate Limiting, Security Headers
├─────────────────────────────────┤
│     Route Layer                 │  ← 25+ نقطة نهاية عبر 8 وحدات
├─────────────────────────────────┤
│     Business Logic Layer        │  ← محرك AGI, الأخلاقيات, Genesis, الكيمياء الكمية
├─────────────────────────────────┤
│     Storage Layer               │  ← SQLite (تقييد, تعلم), JSON (ذاكرة), ذاكرة مؤقتة
├─────────────────────────────────┤
│     Integration Layer           │  ← وكلاء LLM (Gemini, Grok, OpenRouter)
└─────────────────────────────────┘
```

### الوحدات الخلفية الرئيسية

| الوحدة | الأسطر | الوصف |
|--------|--------|-------|
| `main.py` | 1,048 | التطبيق الرئيسي — الوسيط، المسارات، بدء التشغيل |
| `quantum_agi_engine.py` | 716 | محرك AGI الكمي — تصنيف النوايا، تقييم الأخلاقيات، التطور الذاتي |
| `dsa_service.py` | 306 | خدمة التوقيع الرقمي — ML_DSA, SLH_DSA, HYBRID |
| `kem_service.py` | 275 | خدمة تغليف المفاتيح — ML_KEM, X25519, HYBRID |
| `autdie_framework.py` | 210 | إطار AUTDIE — أمان كمي وتوزيع مفاتيح |
| `memory_system/` | 269 | ذاكرة مهيكلة — بحث بالصلة، تصدير Manifest |
| `quantum_chemistry.py` | 153 | محرك VQE — محاكاة جزيئات (H₂, LiH, BeH₂, H₂O) |
| `ethical_governance.py` | 134 | نظام حوكمة أخلاقية — 4 أعمدة مع كشف التلاعب |
| `blackbody.py` | 95 | محرك إشعاع الجسم الأسود — بلانك + تصحيحات QED/LQG/GUP |
| `vault_client.py` | 54 | عميل HashiCorp Vault لتخزين الأسرار |

### طبقة الوسيط (Middleware)

| الوسيط | الوصف |
|--------|-------|
| **CORS** | حسب البيئة — إنتاج: qurabia.com فقط، تطوير: localhost |
| **GZip** | ضغط الاستجابات أكبر من 800 بايت |
| **Rate Limiting** | 60 طلب/60 ثانية لكل IP — وضعان: ذاكرة مؤقتة أو SQLite |
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS |
| **Content-Length** | رفض الطلبات أكبر من 256 كيلوبايت |

### قواعد البيانات

| قاعدة البيانات | النوع | الوظيفة |
|----------------|-------|---------|
| **Rate Limit DB** | SQLite (WAL) | تتبع طلبات كل IP مع تنظيف دوري |
| **Learning Memory DB** | SQLite | تجميع أحداث الأخطاء مع إزالة التكرار (حد 25,000 صف) |
| **Structured Memory** | JSON | ذاكرة مهيكلة بأربعة أنواع (مستخدم, ملاحظات, مشروع, مرجع) |

---

## 🧬 محرك GENESIS v4 — الذكاء الاصطناعي التطوري

### التبعيات الخاصة

| الحزمة | الوظيفة |
|--------|---------|
| **NumPy** | الحوسبة العددية |
| **Pandas** | معالجة وتحليل البيانات |
| **Scikit-learn** | خوارزميات التعلم الآلي التقليدية |
| **XGBoost** | Gradient Boosting متقدم |
| **LightGBM** | Gradient Boosting خفيف وسريع |
| **CatBoost** | Gradient Boosting مع دعم البيانات الفئوية |
| **PyTorch** | إطار التعلم العميق |
| **Streamlit** | واجهة تطبيق ويب تفاعلية |
| **Plotly** | تصورات بيانية تفاعلية |

### المكونات (14 ملف)

| الملف | الوظيفة |
|-------|---------|
| `run_pipeline.py` | نقطة الدخول — تشغيل خط أنابيب GENESIS v4.0 الكامل |
| `genesis_system.py` | منسق النظام الأساسي |
| `genesis_app.py` | واجهة Streamlit التفاعلية |
| `data_loader.py` | تحميل بيانات الائتمان (توليد واقعي) |
| `algorithm_dna.py` | ترميز DNA للخوارزميات — تمثيل جيني |
| `evolution.py` | محرك التطور الجيني — طفرة، تقاطع، انتخاب |
| `feature_engineer.py` | هندسة الميزات الآلية |
| `gating.py` | آلية البوابات لمزيج الخبراء |
| `mixture_of_experts.py` | نظام مزيج الخبراء (Ensemble) |
| `multi_objective.py` | تحسين متعدد الأهداف |
| `surrogate.py` | نموذج بديل لتقدير الأداء |
| `self_monitor.py` | مراقبة ذاتية وتتبع الأداء |

**الغرض**: نظام تعلم آلي تطوري متقدم لتوليد النماذج تلقائياً باستخدام خوارزميات جينية، مزيج الخبراء، والتحسين الكمي.

---

## 🔮 المحركات الكمية (Quantum Engines)

### النواة الكمية (`src/core/` — 3 ملفات)

| الملف | الوظيفة |
|-------|---------|
| `quantum-core.ts` | دوال رياضيات كمية نقية — حساب معقد، إسقاط كرة Bloch، معادلة العتيبي الموحدة، إنتروبيا ثنائية |
| `quantum-gates.ts` | مصفوفات البوابات 2×2 و 4×4: Hadamard (H), Pauli (X/Y/Z), CNOT, RX/RY/RZ, Phase, T, S |
| `statevector.ts` | محاكي متجه الحالة لـ n-كيوبت — إدارة 2^n سعة، تطبيق البوابات، القياس، التشابك |

### المحركات الكمية (`src/engine/` — 17 محرك)

| المحرك | التقنية | الوصف |
|--------|---------|-------|
| **AlOtaibiPlanck.ts** | فيزياء الإشعاع | محرك إشعاع بلانك المحسّن بنموذج العتيبي للطيف الحراري |
| **AlUtaibiEquationV2.ts** | كوزمولوجيا | معادلة كونية موحدة v2.0 تجمع المادة المظلمة والطاقة المظلمة مع تصحيحات كمية |
| **ArabicMorphology.ts** | لغويات كمية | تحليل صرفي كمي: استخراج الجذور العربية، أنماط الأوزان، ربط بحالات كمية |
| **QuantumForge.ts** | ابتكار أساسي | تحويل النص العربي → أرقام أبجد → حالات كيوبت → بوابات كمية (Hadamard, Phase, CNOT) |
| **QuantumSemanticCircuit.ts** | دوائر دلالية | تحويل النحو العربي إلى دوائر كمية: الجذور→تراكب، CNOT=إضافة، Phase=حالات إعرابية |
| **GroverAlgorithm.ts** | بحث كمي | محاكاة خوارزمية Grover مع Oracle ومعاملات الانتشار |
| **GroverDecision.ts** | تحليل قرار | تطبيق Grover على تحليل القرار العربي بترجيح دلالي |
| **QuantumCrypto.ts** | تشفير كمي | دالة AUTDIE — بروتوكول BB84 وتوزيع المفاتيح الكمية |
| **QuantumNeuralNetwork.ts** | شبكات عصبية كمية | محاكاة تدريب QNN مع تتبع التقارب والتعلم بالحقب |
| **TopologicalQEC.ts** | تصحيح أخطاء | محاكاة Toric Code لتصحيح الأخطاء الكمية الطوبولوجية |
| **BlackbodyEngine.ts** | فيزياء الإشعاع | حاسبة طيف الجسم الأسود مع تصحيحات QED و LQG و GUP |
| **SimulationFactory.ts** | تنسيق | نمط المصنع — تنسيق محاكاة (فيزياء، كيمياء، تشفير، AI، مالية، هجين) |
| **TaskOrchestrator.ts** | إدارة مهام | إدارة مهام متزامنة بطابور أولوية وموازنة حمل (4 متزامنة كحد أقصى) |
| **AIResultsAnalyzer.ts** | تحليل | تكامل مع Grok/Gemini لتحليل نتائج المحاكاة |
| **GeminiService.ts** | تكامل AI | تكامل Google Gemini لتحليل النتائج عبر API الخلفية |
| **GrokService.ts** | تكامل AI | تكامل xAI Grok لتفسير القياسات الكمية |
| **OpenRouterService.ts** | تكامل AI | تكامل OpenRouter لتحليل AI مرن |

### الخوارزميات المتقدمة (`src/utils/` — 6 ملفات)

| الخوارزمية | النوع | الوصف |
|-------------|-------|-------|
| **QuantumMath.ts** | رياضيات | جداء تنسوري، مصفوفات كثافة، آثار جزئية باستخدام mathjs |
| **QuantumAlgorithms.ts** | خوارزميات | VQE, Grover, Shor, بروتوكول BB84 |
| **EntropicCompression.ts** | ابتكار | ضغط إنتروبي كمي باستخدام إنتروبيا ثنائية ومفاتيح رنين العتيبي |
| **QuantumResonancePathfinder.ts** | ابتكار (QRP) | إيجاد المسار بتدرجات الطور ومحاكاة الحقل الكمي |
| **QuantumGeneticEvolution.ts** | ابتكار (QAGE) | تطور جيني تكيفي كمي — ضوضاء كمية وتشابك لتحسين المجموعات |
| **InnovationTester.ts** | اختبار | مجموعة اختبار QRP و EDC و QAGE مقارنة بالخوارزميات الكلاسيكية |

### الثوابت الفيزيائية المستخدمة

```typescript
// ثوابت NIST 2018
h  = 6.62607015e-34    // ثابت بلانك (J·s)
ℏ  = 1.054571817e-34   // ثابت بلانك المخفض
c  = 299792458         // سرعة الضوء (m/s)
G  = 6.67430e-11       // ثابت الجاذبية
kB = 1.380649e-23      // ثابت بولتزمان
α  = 7.2973525693e-3   // ثابت البنية الدقيقة

// ثوابت العتيبي
α_otaibi = 25.3        // معامل تعديل الطيف
β_otaibi = 0.9985      // عامل تصحيح الرنين
```

---

## 🤖 تقنيات الذكاء الاصطناعي

### نماذج اللغة الكبيرة (LLM) المتكاملة

| المزود | النموذج | الاستخدام | طريقة الاتصال |
|--------|---------|-----------|--------------|
| **Google Gemini** | gemini-pro | تحليل نتائج المحاكاة الكمية | API مباشر عبر Backend |
| **xAI Grok** | grok-beta | تفسير القياسات الكمية | API عبر x-api-key |
| **OpenRouter** | GPT-3.5-turbo | تحليل كمي مرن | API عبر openrouter.ai |

> **استراتيجية الاحتياط**: جميع مزودي LLM لديهم رد محلي (Local Fallback) عند فشل الاتصال أو غياب المفاتيح.

### محرك AGI الكمي (`quantum_agi_engine.py`)

| المكون | الوظيفة |
|--------|---------|
| **QuantumAGIEngine** | محرك اتخاذ القرار — تصنيف النوايا → تقييم أخلاقي → خطة تنفيذ |
| **IntentCategory** | 6 فئات: اكتشاف أدوية، تشفير، جينوميات، محاكاة فيزيائية، تحسين كود، غير معروف |
| **PerceptionMatrix** | مصنف NLP — مطابقة كلمات مفتاحية لتحديد النية |
| **EthicsMatrix** | مصفوفة أخلاقية رباعية — عدم الأذى، الإحسان، الاستقلالية، العدالة |
| **SelfEvolutionModule** | تحسين ذاتي — إعادة هيكلة كود Python عبر AST |
| **GenesisAlgorithmDNA** | تمثيل جيني لمعاملات الخوارزميات |
| **GenesisEngine** | محرك تطوري — تكاثر، طفرة، تقاطع المجموعات |

### تحليلات الذكاء الاصطناعي

- **تحليلات بالعربية**: استجابات التحليل مولّدة بالعربية الفصحى
- **استراتيجية متعددة المزودين**: Grok → Gemini → OpenRouter → محلي
- **تحليل المحاكاة**: درجات الدقة، الطاقة، توزيع الأنواع
- **توصيات ذكية**: اقتراحات تحسين مبنية على نتائج المحاكاة

---

## 🔒 تقنيات الأمن السيبراني

### التشفير والتوقيع الرقمي

| الخدمة | الخوارزميات | الوصف |
|--------|-------------|-------|
| **KEM Service** | ML_KEM, X25519, HYBRID | تغليف المفاتيح — توليد، تغليف، فك تغليف |
| **DSA Service** | ML_DSA, SLH_DSA, HYBRID | التوقيع الرقمي — توليد مفاتيح، توقيع، تحقق |
| **AUTDIE Framework** | BB84, QKD | أمان كمي — توزيع مفاتيح كمية |
| **Vault Client** | HashiCorp Vault | تخزين آمن للأسرار والمفاتيح |

### حماية الطبقات

| الطبقة | الحماية |
|--------|---------|
| **الشبكة** | CORS مقيد، HSTS (إنتاج)، Rate Limiting (60/60s) |
| **الرؤوس** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` |
| **المحتوى** | CSP في `index.html` — تقييد `img-src`, `style-src`, `connect-src` |
| **المدخلات** | Pydantic v2 للتحقق الصارم، حد حجم المحتوى 256KB |
| **الأسرار** | متغيرات بيئة (لا Hardcoding)، التحقق عند بدء التشغيل |
| **الأخلاقيات** | كشف التلاعب عبر SHA-256، سجل مراجعة |
| **البيانات** | تجزئة الأخطاء بـ SHA-256، عدم تسجيل الأسرار |
| **الكود** | فحص الأسرار التلقائي (`secret_scan.py`) في CI |

### فحص الأسرار (`scripts/secret_scan.py`)

يكتشف تلقائياً:
- مفاتيح Google / OpenAI / GitHub / AWS / Render
- رموز JWT
- مفاتيح PEM
- عتبة إنتروبيا 24+ حرف للأسرار العشوائية
- قائمة استثناء للإيجابيات الكاذبة

---

## 🏭 البنية التحتية والنشر (Infrastructure)

### بيئة الإنتاج

| الخدمة | المنصة | الطريقة |
|--------|--------|---------|
| **الواجهة الأمامية** | GitHub Pages | نشر تلقائي عبر `deploy.yml` عند Push إلى `main` |
| **الواجهة الخلفية** | Render.com | نشر تلقائي عبر Docker (`render.yaml`) |
| **النطاق** | www.qurabia.com | GitHub Pages Custom Domain (CNAME) |

### Docker

| الملف | الوظيفة |
|-------|---------|
| `backend/Dockerfile` | صورة Python 3.11-slim — uvicorn على المنفذ 10000 |
| `docker-compose.yml` | بيئة تطوير محلية — Backend (10000) + Frontend (5173) |

### متغيرات البيئة

| المتغير | الوظيفة | مطلوب في الإنتاج |
|---------|---------|-------------------|
| `APP_ENV` | بيئة التشغيل (development/production) | ✅ |
| `KEM_MASTER_SEED` | بذرة تشفير KEM | ✅ |
| `DSA_SIGNING_KEY` | مفتاح توقيع رقمي | ✅ |
| `OPENROUTER_API_KEY` | مفتاح OpenRouter API | ❌ |
| `RATE_LIMIT_DB_PATH` | مسار قاعدة تقييد المعدل | ❌ |
| `LEARNING_DB_PATH` | مسار قاعدة التعلم | ❌ |
| `MEMORY_STORE_PATH` | مسار ملف الذاكرة | ❌ |
| `VITE_API_BASE_URL` | عنوان API الخلفي | ✅ (بناء) |

### CI/CD Workflows

| Workflow | المحفز | الوظيفة |
|----------|--------|---------|
| **deploy.yml** | Push `main`, Manual | فحص أسرار → اختبار Backend → اختبار Frontend → بناء → نشر GitHub Pages |
| **lighthouse.yml** | Push `main` (frontend), PRs (frontend) | بناء → تشغيل Lighthouse CI |
| **cleanup-branches.yml** | إغلاق PR, Manual | حذف الفروع المدمجة تلقائياً (يحمي `main` و `gh-pages`) |

### Lighthouse CI Thresholds

| المقياس | الحد الأدنى |
|---------|-------------|
| الأداء (Performance) | ≥ 70% |
| إمكانية الوصول (Accessibility) | ≥ 80% |
| أفضل الممارسات (Best Practices) | ≥ 80% |
| SEO | ≥ 80% |

---

## 🧹 أدوات جودة الكود

### Biome (JavaScript / TypeScript)

| الإعداد | القيمة |
|---------|--------|
| الإصدار | 1.9.4 |
| المسافات | 2 مسافات |
| عرض السطر | 120 حرف |
| علامات الاقتباس | مفردة (single) |
| فاصلة منقوطة | دائماً |
| القواعد المهمة | عدم استخدام `var`، تفضيل `const`، تحذير على `any` |

### Ruff (Python)

| الإعداد | القيمة |
|---------|--------|
| هدف Python | 3.11 |
| عرض السطر | 120 حرف |
| القواعد | E, W (pycodestyle), F (pyflakes), I (isort), B (bugbear), C4, UP, S (bandit), SIM |
| التنسيق | علامات اقتباس مزدوجة، مسافات |

### Pre-commit Hooks

| Hook | الوظيفة |
|------|---------|
| `ruff` | فحص وإصلاح Python |
| `ruff-format` | تنسيق Python |
| `trailing-whitespace` | إزالة المسافات الزائدة |
| `end-of-file-fixer` | إصلاح نهاية الملفات |
| `check-yaml` | التحقق من YAML |
| `check-json` | التحقق من JSON |
| `check-added-large-files` | رفض الملفات > 500KB |
| `no-commit-to-branch` | منع الالتزام المباشر على `main` |

---

## 🧪 الاختبارات

### اختبارات الواجهة الخلفية (231 اختبار)

| ملف الاختبار | عدد الاختبارات | المجال |
|--------------|----------------|--------|
| `test_quantum_agi_engine.py` | 68 | محرك AGI، تصنيف النوايا، الأخلاقيات، DNA، وكلاء LLM |
| `test_ethical_governance.py` | 51 | مصفوفة الأخلاقيات، الأعمدة الأربعة، العتبات |
| `test_blackbody.py` | 33 | دالة بلانك، Bose-Einstein، تصحيحات QED/GUP/LQG |
| `test_kem_service.py` | 27 | خوارزميات KEM، توليد مفاتيح، تغليف/فك تغليف |
| `test_dsa_service.py` | 25 | خوارزميات DSA، توقيع/تحقق، تجزئة |
| `test_quantum_chemistry.py` | 18 | VQE، قاعدة بيانات الجزيئات، التقارب |
| `test_security.py` | 9 | تقييد المعدل، HSTS، CSP، التحقق البيئي |

```bash
# تشغيل اختبارات الخلفية
cd backend && APP_ENV=development python -m pytest tests/ -v
```

### اختبارات الواجهة الأمامية (16 ملف اختبار)

| ملف الاختبار | المجال |
|--------------|--------|
| `quantum-core.test.ts` | دوال الرياضيات الكمية |
| `quantum-gates.test.ts` | مصفوفات البوابات |
| `statevector.test.ts` | محاكي متجه الحالة |
| `quantum-algorithms.test.ts` | VQE, Grover, Shor, BB84 |
| `quantum-semantic.test.ts` | الدائرة الدلالية الكمية |
| `quantum-forge.test.ts` | تحويل النص العربي → كيوبت |
| `grover-decision.test.ts` | تحليل القرار بـ Grover |
| `arabic-morphology.test.ts` | استخراج الجذور والأنماط |
| `blackbody-engine.test.ts` | حسابات الطيف |
| `entropic-compression.test.ts` | ضغط البيانات |
| `innovation-tester.test.ts` | خوارزميات QRP, EDC, QAGE |
| `quantum-genetic-evolution.test.ts` | محاكي التطور الجيني |
| `ai-results-analyzer.test.ts` | توليد رؤى AI |
| `task-orchestrator.test.ts` | طابور المهام والتنفيذ |
| `ethical-governance.test.ts` | صمام الأمان الأخلاقي |
| `strategic-engines.test.ts` | سير عمل المحركات المجمعة |

```bash
# تشغيل اختبارات الواجهة الأمامية
cd frontend && npx vitest run
```

### عتبات التغطية

| المقياس | الحد الأدنى |
|---------|-------------|
| الأسطر (Lines) | 70% |
| الدوال (Functions) | 70% |
| الفروع (Branches) | 50% |
| البيانات (Statements) | 70% |

> **النطاق**: `src/core/`, `src/engine/`, `src/ethics/`, `src/utils/`, `src/types/` — مكونات UI مستثناة.

---

## 🤖 أنظمة الوكلاء الذكيين (AI Agents)

### Codex CLI Multi-Agent (`.codex/`)

| الوكيل | النموذج | الصلاحية | الوظيفة |
|--------|---------|----------|---------|
| **explorer** | GPT-5.4 | قراءة فقط | استكشاف الكود والبنية |
| **reviewer** | GPT-5.4 | قراءة فقط | مراجعة الصحة والأمان |
| **docs-researcher** | GPT-5.4 | قراءة فقط | التحقق من التوثيق |

**الإعداد الرئيسي** (`config.toml`):
- `approval_policy = "on-request"` — طلب موافقة
- `sandbox_mode = "workspace-write"` — كتابة في المستودع
- `web_search = "live"` — بحث ويب مباشر
- `multi_agent = true` — تعدد الوكلاء
- `max_threads = 6` — 6 خيوط كحد أقصى

### خوادم MCP (Model Context Protocol)

| الخادم | الوظيفة |
|--------|---------|
| **GitHub MCP** | أدوات GitHub (المستودع، الإجراءات، القضايا) |
| **Context7/Upstash** | سياق ذاكرة طويلة المدى |
| **Exa** | بحث ويب ذكي |
| **Memory** | ذاكرة مستمرة |
| **Playwright** | أتمتة المتصفح |
| **Sequential Thinking** | تفكير متسلسل |

### GitHub Copilot Agents (`.github/agents/`)

وكلاء GitHub Copilot مخصصون لتطوير المنصة مع تعليمات مفصلة بالعربية.

---

## 🌐 نقاط النهاية (API Endpoints)

### 25+ نقطة نهاية عبر 8 وحدات

| الوحدة | المسار | الطريقة | الوصف |
|--------|--------|---------|-------|
| **الصحة** | `/health` | GET | حالة النظام، الذاكرة، وقت التشغيل |
| **AUTDIE** | `/api/autdie` | POST | مقاييس الأمان الكمي (κ, λ → S_AUTDIE, QBER) |
| **المعادلة الكونية** | `/api/al-utaibi-v2` | POST | طاقة كونية مع تصحيحات المادة/الطاقة المظلمة |
| **معالجة AGI** | `/process` | POST | قرار AGI — نية + أخلاقيات + خطة تنفيذ |
| **تسجيل الأخطاء** | `/api/learning/error` | POST | تسجيل أحداث الأخطاء مع إزالة التكرار |
| **ملخص الأخطاء** | `/api/learning/summary` | GET | أكثر الأخطاء تكراراً مع اقتراحات |
| **مقاييس التعلم** | `/api/learning/metrics` | GET | مقاييس زمنية (أحداث/دقيقة) |
| **تحليل Gemini** | `/api/llm/gemini/analyze` | POST | تحليل نتائج كمية عبر Google Gemini |
| **تحليل Grok** | `/api/llm/grok/analyze` | POST | تحليل نتائج كمية عبر xAI Grok |
| **تحليل OpenRouter** | `/api/llm/openrouter/analyze` | POST | تحليل نتائج كمية عبر OpenRouter |
| **تحليلات AI** | `/api/analytics/analyze` | POST | تحليل شامل بالعربية مع استراتيجية متعددة |
| **طيف الجسم الأسود** | `/api/blackbody/spectrum` | POST | طيف إشعاع مع تصحيحات QED/LQG/GUP |
| **إنشاء مجموعة** | `/api/genesis/population` | POST | إنشاء مجموعة DNA خوارزمية |
| **طفرة** | `/api/genesis/mutate` | POST | طفرة DNA خوارزمية |
| **تقاطع** | `/api/genesis/crossover` | POST | تقاطع زوج DNA |
| **إنشاء ذاكرة** | `/api/memory/create` | POST | إنشاء إدخال ذاكرة (حد 10KB) |
| **قائمة الذاكرة** | `/api/memory/list` | GET | عرض جميع الذكريات مع تصفية حسب النوع |
| **جلب ذاكرة** | `/api/memory/{id}` | GET | استرجاع إدخال واحد مع تحذير عمر |
| **تحديث ذاكرة** | `/api/memory/{id}` | PUT | تحديث إدخال ذاكرة |
| **حذف ذاكرة** | `/api/memory/{id}` | DELETE | حذف إدخال ذاكرة |
| **بحث الذاكرة** | `/api/memory/search` | POST | بحث بالصلة (50 نتيجة كحد أقصى) |
| **تصدير الذاكرة** | `/api/memory/manifest` | GET | تصدير كل الذكريات كـ Manifest |

---

## 📈 الإحصائيات الشاملة

### حجم الكود

| الطبقة | الملفات | الأسطر (تقريبي) |
|--------|---------|------------------|
| **الواجهة الأمامية** (مكونات) | 24 ملف | ~7,600 سطر |
| **الواجهة الأمامية** (محركات) | 17 ملف | ~3,106 سطر |
| **الواجهة الأمامية** (أنظمة فرعية) | ~30 ملف | ~3,000 سطر |
| **الواجهة الأمامية** (اختبارات) | 16 ملف | ~2,500 سطر |
| **الواجهة الخلفية** (كود) | ~12 ملف | ~3,000 سطر |
| **الواجهة الخلفية** (اختبارات) | 7 ملفات | ~2,000 سطر |
| **GENESIS v4** | 14 ملف | ~2,000 سطر |
| **المجموع التقريبي** | ~120 ملف | ~23,200+ سطر |

### تعداد التقنيات

| الفئة | العدد |
|-------|-------|
| **لغات البرمجة** | 4 (TypeScript, Python, CSS, Bash) |
| **أُطر العمل** | 3 (React 18, FastAPI, Streamlit) |
| **مكتبات Frontend** | 11 حزمة |
| **مكتبات Backend** | 8 حزمة |
| **مكتبات GENESIS** | 9 حزمة (sklearn, xgboost, lightgbm, catboost, torch, ...) |
| **محركات كمية** | 17 محرك |
| **بوابات كمية** | 10+ (H, X, Y, Z, CNOT, RX, RY, RZ, Phase, T, S) |
| **خوارزميات كمية** | 7 (Grover, VQE, Shor, BB84, QEC, QNN, QAGE) |
| **نماذج AI** | 3 مزودين (Gemini, Grok, OpenRouter) |
| **خوارزميات تشفير** | 9 (3 KEM + 3 DSA + 3 HYBRID) |
| **نقاط نهاية API** | 25+ |
| **اختبارات Backend** | 231 |
| **اختبارات Frontend** | 16 ملف (~300+ اختبار) |
| **CI/CD Workflows** | 3 (deploy, lighthouse, cleanup) |
| **وكلاء ذكيون** | 3+ (explorer, reviewer, docs-researcher) |
| **خوادم MCP** | 6 |

### الابتكارات الأصلية

| الابتكار | الوصف |
|----------|-------|
| **Quantum Forge** | تحويل النص العربي إلى حالات كمية عبر نظام الأبجد |
| **Quantum Semantic Circuit** | تحويل النحو العربي (جذور، إعراب، إضافة) إلى دوائر كمية |
| **Arabic Morphology Engine** | محرك صرفي يربط الأوزان العربية بالحالات الكمية |
| **QRP** | إيجاد المسار بتدرجات الطور الكمي |
| **EDC** | ضغط إنتروبي كمي بمفاتيح رنين العتيبي |
| **QAGE** | تطور جيني تكيفي كمي بالتشابك |
| **Al-Otaibi Planck Model** | نموذج محسّن لطيف بلانك الحراري |
| **Al-Utaibi Equation v2.0** | معادلة كونية موحدة: مادة مظلمة + طاقة مظلمة + ميكانيكا كمية |
| **AUTDIE Framework** | إطار أمان كمي يدمج BB84 وتوزيع المفاتيح الكمية |

---

## 🗺️ خريطة التقنيات

```
                        ┌──────────────────────────────┐
                        │      QURABIA Platform        │
                        │   www.qurabia.com            │
                        └──────────┬───────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼─────────┐ ┌───────▼────────┐ ┌─────────▼─────────┐
    │    Frontend        │ │    Backend     │ │   GENESIS v4      │
    │  GitHub Pages      │ │   Render.com   │ │   ML Pipeline     │
    ├────────────────────┤ ├────────────────┤ ├───────────────────┤
    │ React 18           │ │ FastAPI        │ │ Scikit-learn      │
    │ TypeScript 5.6     │ │ Python 3.11    │ │ XGBoost           │
    │ Vite 6.0           │ │ Pydantic v2    │ │ LightGBM          │
    │ Three.js           │ │ Uvicorn        │ │ CatBoost          │
    │ Recharts           │ │ NumPy          │ │ PyTorch           │
    │ mathjs             │ │ httpx          │ │ Streamlit         │
    │ tailwind-merge     │ │ structlog      │ │ Plotly            │
    └────────┬───────────┘ └───────┬────────┘ └───────────────────┘
             │                     │
    ┌────────▼───────────────────────▼──────────┐
    │           Quantum Engines (17)            │
    ├───────────────────────────────────────────┤
    │ Al-Otaibi Planck  │ Grover Algorithm      │
    │ Al-Utaibi v2.0    │ Quantum Crypto BB84   │
    │ Arabic Morphology │ Quantum Neural Network│
    │ Quantum Forge     │ Topological QEC       │
    │ Semantic Circuit  │ Blackbody Engine      │
    │ Grover Decision   │ Simulation Factory    │
    │ Task Orchestrator │ AI Results Analyzer   │
    │ Gemini Service    │ Grok / OpenRouter     │
    └───────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │           Security Layer                  │
    ├───────────────────────────────────────────┤
    │ KEM (ML_KEM, X25519, HYBRID)             │
    │ DSA (ML_DSA, SLH_DSA, HYBRID)           │
    │ AUTDIE Framework (BB84, QKD)             │
    │ Ethical Governance (4 Pillars)            │
    │ Rate Limiting + CORS + CSP + HSTS        │
    │ Secret Scanning + Vault                  │
    └───────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │           AI Agents                       │
    ├───────────────────────────────────────────┤
    │ Codex CLI (explorer, reviewer, docs)      │
    │ GitHub Copilot Custom Agents              │
    │ MCP Servers (GitHub, Exa, Memory, ...)    │
    └───────────────────────────────────────────┘
```

---

> **ملاحظة**: هذا التقرير يغطي جميع التقنيات الموجودة في المستودع حتى تاريخ إعداده. المنصة في تطور مستمر وقد تُضاف تقنيات جديدة في المستقبل.

---

*تم إعداد هذا التقرير تلقائياً بواسطة وكيل QURABIA الذكي — أبريل 2026*
