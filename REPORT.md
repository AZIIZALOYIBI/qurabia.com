# تقرير شامل بالاقتراحات — مستودع QURABIA

> **التاريخ:** 2026-04-03
> **المستودع:** `AZIIZALOYIBI/qurabia.com`
> **الإصدار:** SuperSystem v5.0

---

## ١. ملخص تنفيذي

مشروع QURABIA منصة عربية طموحة تجمع بين الحوسبة الكمية والذكاء الاصطناعي، تتكون من:

| المكوّن | التقنية | عدد الملفات | عدد الأسطر (تقريباً) |
|---------|---------|-------------|---------------------|
| **الواجهة الأمامية** | React 18 + TypeScript + Vite | 46 ملف `.ts/.tsx` | ~9,800 |
| **الخدمات الخلفية** | FastAPI + Python | 9 ملفات `.py` | ~2,250 |
| **اختبارات الخلفية** | pytest | 5 ملفات | ~1,160 |
| **اختبارات الواجهة** | vitest | 6 ملفات | ~1,270 |
| **GENESIS v4** | Python (ML Pipeline) | 13 ملف | ~2,340 |

**النشر:**
- الواجهة → GitHub Pages (عبر `deploy.yml`)
- الخلفية → Render.com (عبر `render.yaml` + Docker)

---

## ٢. الاقتراحات الأمنية 🔒

### ٢.١ CORS مفتوح بالكامل في خدمتي KEM و DSA (⚠️ حرج)

**المشكلة:** في `kem_service.py` و `dsa_service.py` السطر:
```python
allow_origins=["*"]
```
هذا يسمح لأي موقع بالوصول إلى خدمات التشفير الكمي.

**الاقتراح:** طبّق نفس نمط `main.py` الذي يحدد الأصول حسب البيئة:
```python
_ALLOWED_ORIGINS = ["https://qurabia.com", "https://www.qurabia.com"]
```

---

### ٢.٢ Vault Client لا يزال Mock في الإنتاج (⚠️ حرج)

**المشكلة:** `vault_client.py` يستخدم `MockVaultClient` يخزّن الأسرار في الذاكرة فقط. حتى عند ضبط `VAULT_ADDR` و `VAULT_TOKEN`، لا يتم الاتصال بـ HashiCorp Vault الحقيقي:
```python
# TODO: initialise hvac.Client(url=_VAULT_ADDR, token=_VAULT_TOKEN)
logger.info("VaultClient: VAULT_ADDR is set but real client not wired — using mock")
return MockVaultClient()
```

**الاقتراح:**
1. أضف مكتبة `hvac` إلى `requirements.txt`.
2. فعّل الاتصال الحقيقي عند وجود `VAULT_ADDR` و `VAULT_TOKEN`.
3. أبقِ Mock كـ fallback للتطوير المحلي فقط.

---

### ٢.٣ خوارزميات التشفير KEM و DSA هي محاكاة (Mock)

**المشكلة:** كلتا الخدمتين تستخدمان محاكاة وليست خوارزميات كمية حقيقية:
```
# TODO: Replace mock crypto implementations with liboqs / pqcrypto bindings
```

**الاقتراح:**
1. استبدل بمكتبة `liboqs-python` (Open Quantum Safe) لدعم CRYSTALS-Kyber و CRYSTALS-Dilithium الحقيقيين.
2. أو استخدم `pqcrypto` كبديل.

---

### ٢.٤ سياسة أمن المحتوى (CSP) تحتوي على `unsafe-inline`

**المشكلة:** في `index.html`:
```
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```
`unsafe-inline` يُضعف حماية CSP ضد هجمات XSS عبر الأنماط المضمنة.

**الاقتراح:** استخدم `nonce` أو `hash` بدلاً من `unsafe-inline` للأنماط، أو انقل جميع الأنماط المضمنة إلى ملفات CSS خارجية.

---

### ٢.٥ لا يوجد حد لحجم الطلب على GET endpoints

**المشكلة:** في `main.py`، التحقق من `content-length` يتم فقط لـ `POST/PUT/PATCH`. نقاط GET مثل `/api/learning/summary` و `/api/learning/metrics` ليس عليها حماية من الاستعلامات المكثفة.

**الاقتراح:** أضف تحقق من معاملات الاستعلام (مثلاً `top` في `/api/learning/summary` محدود بـ 50 في الكود، وهذا جيد — تأكد من تطبيق نفس المبدأ في كل مكان).

---

## ٣. اقتراحات CI/CD 🔄

### ٣.١ اختبارات الواجهة الأمامية لا تعمل في CI (⚠️ مهم)

**المشكلة:** يوجد 6 ملفات اختبار في `frontend/src/__tests__/` لكن `deploy.yml` يُشغّل فقط:
```yaml
- name: Run backend tests
  run: pytest -q
```
ولا يوجد خطوة لتشغيل `npm test` للواجهة.

**الاقتراح:** أضف خطوة بعد `npm install`:
```yaml
- name: Run frontend tests
  working-directory: frontend
  run: npm test
```

---

### ٣.٢ لا يوجد Linting في CI

**المشكلة:** لا يوجد ESLint أو Prettier أو Ruff/Black في خط الأنابيب.

**الاقتراح:**
- **الواجهة:** أضف `eslint` و `prettier` مع خطوة `npm run lint` في CI.
- **الخلفية:** أضف `ruff` أو `black` مع خطوة `ruff check .` في CI.

---

### ٣.٣ لا يوجد فحص أمني للتبعيات

**الاقتراح:**
- أضف `npm audit` في خطوة CI للواجهة.
- أضف `pip-audit` أو `safety` للخلفية.
- أو فعّل Dependabot في `.github/dependabot.yml`.

---

### ٣.٤ لا يوجد اختبار بناء للخلفية في CI

**المشكلة:** CI يشغّل `pytest` فقط، لكن لا يتحقق من أن Docker build ينجح.

**الاقتراح:** أضف خطوة `docker build` تجريبية للتأكد من سلامة `Dockerfile`.

---

## ٤. اقتراحات معمارية 🏗️

### ٤.١ ازدواجية `SimulationFactory.ts`

**المشكلة:** يوجد ملفان بنفس الاسم:
- `frontend/src/engine/SimulationFactory.ts` (128 سطر)
- `frontend/src/engines/SimulationFactory.ts` (70 سطر)

**الاقتراح:** ادمجهما في ملف واحد أو وضّح الفرق بينهما بتسمية مختلفة.

---

### ٤.٢ مجلدان متشابهان: `engine/` و `engines/`

**المشكلة:**
- `frontend/src/engine/` — يحتوي GeminiService, GrokService, SimulationFactory, TaskOrchestrator
- `frontend/src/engines/` — يحتوي AdvancedCrypto, CodeRefactoring, QuantumChemistry, QuantumML, SimulationFactory

**الاقتراح:** ادمجهما في مجلد واحد (مثلاً `engine/`) مع تصنيف فرعي واضح.

---

### ٤.٣ مكون `Dashboard.tsx` غير مستخدم

**المشكلة:** `App.tsx` يستورد `DashboardV5` فقط:
```tsx
const Dashboard = React.lazy(() => import('./components/DashboardV5'));
```
بينما `Dashboard.tsx` (الإصدار القديم) لا يزال موجوداً.

**الاقتراح:** احذف `Dashboard.tsx` إذا لم يعد مستخدماً، لتقليل حجم المستودع وتجنب الالتباس.

---

### ٤.٤ خدمات KEM و DSA و Main كل منها تطبيق FastAPI منفصل

**المشكلة:** يوجد 3 تطبيقات FastAPI منفصلة (`main.py`, `kem_service.py`, `dsa_service.py`)، لكن `Dockerfile` و `render.yaml` ينشران `main:app` فقط.

**الاقتراح:**
- **الخيار أ:** ادمج KEM و DSA كـ routers داخل `main.py` باستخدام `APIRouter`.
- **الخيار ب:** أنشئ Dockerfile منفصل لكل خدمة إذا أردت بنية Microservices.

---

### ٤.٥ GENESIS v4 معزول تماماً

**المشكلة:** مجلد `genesis_v4/` يعتمد على مكتبات ثقيلة (PyTorch, XGBoost, LightGBM, CatBoost, scikit-learn) لكنه غير متصل بالخلفية أو CI.

**الاقتراح:**
1. أضف اختبارات لـ `genesis_v4/` في CI.
2. أو أنشئ خدمة FastAPI مستقلة تكشف وظائف GENESIS عبر API.
3. إذا كان تجريبياً فقط، وثّق ذلك في README.

---

## ٥. اقتراحات تحسين الأداء ⚡

### ٥.١ ملف `QuantumMath.ts` ضخم (1,394 سطر)

**الاقتراح:** قسّمه إلى وحدات أصغر (مثلاً: `linear-algebra.ts`, `fourier.ts`, `optimization.ts`).

---

### ٥.٢ ملف `landing.html` كبير جداً (146 كيلوبايت)

**المشكلة:** ملف HTML واحد بحجم ~147KB يُحمّل كاملاً قبل أي تفاعل.

**الاقتراح:**
1. أخرج CSS و JavaScript المضمّنة إلى ملفات منفصلة.
2. استخدم ضغط gzip/brotli (GitHub Pages يدعمه تلقائياً).
3. أو حوّل الصفحة إلى مكوّن React ضمن التطبيق الرئيسي.

---

### ٥.٣ Service Worker يستخدم `cache-first` للصور والخطوط

**المشكلة:** في `sw.js`، الصور والخطوط تستخدم `cacheFirst` مما قد يمنع تحديثها.

**الاقتراح:** استخدم `stale-while-revalidate` للصور أيضاً، أو أضف آلية إبطال الكاش بناءً على إصدار التطبيق.

---

## ٦. اقتراحات تحسين الاختبارات 🧪

### ٦.١ لا توجد اختبارات للمكونات الـ React

**المشكلة:** اختبارات الواجهة تغطي فقط الوحدات المنطقية (`quantum-core`, `quantum-gates`, `statevector`, `entropic-compression`, `ethical-governance`, `task-orchestrator`). لا يوجد اختبار واحد لمكونات React (مثل `DashboardV5`, `AGIConsole`, `ProblemConfig`).

**الاقتراح:**
1. أضف `@testing-library/react` (موجود بالفعل في devDependencies ضمنياً عبر jest-dom).
2. اكتب اختبارات تصيير (render tests) للمكونات الرئيسية.

---

### ٦.٢ لا توجد اختبارات لـ `main.py` (واجهة الـ API الرئيسية)

**المشكلة:** ملف `main.py` (316 سطر) هو نقطة الدخول الرئيسية للـ API ويحتوي على rate limiting و CORS و middleware، لكن لا يوجد ملف `test_main.py`.

**الاقتراح:** أنشئ `backend/tests/test_main.py` يغطي:
- نقطة `/health`
- نقطة `/process`
- نقاط `/api/learning/*`
- نقاط `/api/blackbody/*`
- نقاط `/api/genesis/*`
- سلوك rate limiting
- سلوك التحقق من حجم الطلب

---

### ٦.٣ لا توجد اختبارات لـ `blackbody.py` و `autdie_framework.py`

**الاقتراح:** أضف `test_blackbody.py` و `test_autdie_framework.py`.

---

## ٧. اقتراحات التوثيق 📝

### ٧.١ لا يوجد CONTRIBUTING.md

**الاقتراح:** أنشئ دليل مساهمة يشمل: إعداد بيئة التطوير، أسلوب الكود، كيفية تشغيل الاختبارات.

---

### ٧.٢ لا يوجد CHANGELOG.md

**الاقتراح:** أنشئ سجل تغييرات يتتبع الإصدارات والتحديثات.

---

### ٧.٣ لا يوجد توثيق API تفاعلي

**المشكلة:** FastAPI يُولّد `/docs` (Swagger) تلقائياً، لكن هذا غير مذكور في README.

**الاقتراح:** أضف رابط `/docs` في README واذكر أن التوثيق التفاعلي متاح تلقائياً.

---

### ٧.٤ GENESIS v4 بلا README خاص

**الاقتراح:** أنشئ `genesis_v4/README.md` يشرح الغرض، المتطلبات، وكيفية التشغيل.

---

## ٨. اقتراحات بنية تحتية 🛠️

### ٨.١ لا يوجد Dependabot

**الاقتراح:** أنشئ `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

### ٨.٢ لا يوجد `.env.example` للخلفية

**المشكلة:** `main.py` يقرأ عدة متغيرات بيئية (`APP_ENV`, `LEARNING_MAX_EVENTS`, `LEARNING_DB_PATH`, `RATE_LIMIT_REQUESTS`, إلخ) لكن لا يوجد ملف مرجعي يوثّقها.

**الاقتراح:** أنشئ `backend/.env.example` يسرد جميع المتغيرات مع قيمها الافتراضية.

---

### ٨.٣ Render.com خطة مجانية (Free Plan)

**المشكلة:** في `render.yaml`:
```yaml
plan: free
```
الخطة المجانية في Render تنام بعد 15 دقيقة من عدم النشاط.

**الاقتراح:**
1. إذا كان الموقع إنتاجياً، انتقل لخطة مدفوعة أو أضف cron job للإبقاء على الخدمة.
2. أو انتقل لمنصة بديلة (Railway, Fly.io).

---

## ٩. ملخص الأولويات

| الأولوية | الاقتراح | الأثر |
|----------|----------|-------|
| 🔴 حرج | إصلاح CORS المفتوح في KEM/DSA | أمني |
| 🔴 حرج | ربط Vault Client الحقيقي | أمني |
| 🟠 مهم | إضافة اختبارات الواجهة في CI | جودة |
| 🟠 مهم | إضافة `test_main.py` | تغطية |
| 🟡 متوسط | دمج `engine/` و `engines/` | صيانة |
| 🟡 متوسط | إضافة Dependabot | أمن التبعيات |
| 🟡 متوسط | إضافة Linting في CI | جودة كود |
| 🟢 تحسيني | تقسيم `QuantumMath.ts` | أداء/صيانة |
| 🟢 تحسيني | تحسين `landing.html` | أداء |
| 🟢 تحسيني | إضافة CONTRIBUTING.md | توثيق |

---

> **ملاحظة:** هذا التقرير مبني على تحليل شامل للمستودع. الاقتراحات مرتّبة حسب الأهمية والأثر.
