# لمحة معمارية — منصة QURABIA (عرب qu)

> **المستودع:** `qurabia.com`
> **اللغات الأساسية:** TypeScript/React (الواجهة), Python/FastAPI (الخلفية)
> **منصة النشر:** GitHub Pages (الواجهة) + Render.com (الخلفية)
> **النطاق:** `qurabia.com`

---

## 1. ما هي QURABIA؟

منصة عربية مبتكرة تجمع بين الذكاء الاصطناعي والحوسبة الكمية. شعارها: "نبني جسراً بين الحضارة العربية وتقنيات الغد". تقدم تجربة تفاعلية فريدة تشمل محاكاة كمومية حقيقية في المتصفح، تحليل صرفي عربي متقدم، تشفير كمومي، وتحليلات ذكية بالذكاء الاصطناعي.

---

## 2. بنية المستودع

```
qurabia.com/
├── frontend/          # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # 37 مكون React (لوحات، محركات، صفحات)
│   │   ├── engine/       # 17 محرك (محاكاة، تشفير، تحليل)
│   │   ├── core/         # منطق الكم الأساسي (statevector, gates)
│   │   ├── contexts/     # AuthContext, ToastContext
│   │   ├── companion/    # نظام الرفيق الكمي
│   │   ├── hooks/        # 11 خطاف React مخصص
│   │   ├── ethics/       # وحدة الأخلاقيات
│   │   ├── styles/       # نظام التصميم (DesignSystem.css)
│   │   └── types/        # أنواع TypeScript
│   └── public/           # صفحات ثابتة، PWA, SEO
├── backend/           # FastAPI (Python 3.11)
│   ├── main.py           # نقطة الدخول + 40+ نقطة نهاية API
│   ├── auth_service.py    # المصادقة (JWT, Google OAuth)
│   ├── kem_service.py    # تشفير KEM
│   ├── dsa_service.py    # توقيع رقمي DSA
│   ├── agents_service.py # نظام الوكلاء الذكيين
│   ├── quantum_agi_engine.py # محرك AGI الكمي
│   ├── quantum_chemistry.py # محرك VQE
│   └── tests/            # اختبارات pytest
├── docs/              # التوثيق التقني
├── .github/workflows/ # CI/CD (9 سير عمل)
├── docker-compose.yml # بيئة تطوير محلية
└── render.yaml        # إعدادات النشر
```

---

## 3. التقنيات الأساسية

| الطبقة | التقنية |
|--------|---------|
| الواجهة | React 18, TypeScript 5.6, Vite 6 |
| التنقل | React Router v6 |
| المصادقة | JWT + Google OAuth + bcrypt |
| الرسوم | Recharts, Three.js (كرة بلوخ) |
| الأنماط | CSS Custom Properties, RTL-first, Dark Theme |
| الخلفية | FastAPI, Python 3.11, Uvicorn |
| التشفير | ML-KEM, ML-DSA, BB84, Post-Quantum |
| الذكاء | Gemini, Grok, OpenRouter, GLM-4.7 |
| التخزين | SQLite (optional), JSON files, In-memory |
| النشر | GitHub Pages (SPA) + Render.com (API) |
| PWA | Service Worker, Web App Manifest, Offline |

---

## 4. نظام التوجيه (Routing)

| المسار | المكون | الوصف |
|--------|--------|-------|
| `/` | `LandingPage` | صفحة الهبوط الرئيسية |
| `/forge` | `QuantumForgePage` | المصهر الكمومي |
| `/boot` | `BootScreen` | شاشة الإقلاع |
| `/platform` | `UnifiedQuantumPlatform` | المنصة الكمية الموحدة |
| `/pricing` | `PricingPage` | خطط التسعير |
| `/auth` | `AuthPage` | تسجيل الدخول/إنشاء حساب |
| `/contact` | `ContactPage` | نموذج الاتصال |
| `*` | `NotFoundPage` | صفحة 404 |

---

## 5. نظام المصادقة

- **JWT**: رموز تنتهي بعد 72 ساعة
- **Google OAuth**: عبر `@react-oauth/google`
- **bcrypt**: تجزئة كلمات المرور
- **AuthContext**: يوفر `user`, `login`, `register`, `loginWithGoogle`, `logout`
- **نقاط النهاية**: `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/me`

---

## 6. الإشعارات

نظام Toast يعمل عبر `ToastProvider` + `useToast`:
- `success()`, `error()`, `warning()`, `info()`
- إشعارات تلقائية الإخفاء مع دعم RTL
- أيقونات ملونة حسب النوع

---

## 7. API الخلفية (أبرز نقاط النهاية)

| الفئة | نقطة النهاية | الوصف |
|-------|-------------|-------|
| المصادقة | `POST /api/auth/*` | تسجيل، دخول، Google |
| المحاكاة | `POST /process` | معالجة AGI |
| التحليل | `POST /api/analytics/analyze` | تحليل ذكي |
| LLM | `POST /api/llm/{provider}/analyze` | Gemini, Grok, OpenRouter |
| العربية | `POST /api/arabic/analyze` | تحليل صرفي |
| التشفير | `POST /api/autdie` | محرك AUTDIE |
| الكيمياء | `POST /api/chemistry/vqe` | محرك VQE |
| الذاكرة | `CRUD /api/memory/*` | نظام الذاكرة المنظمة |
| الاتصال | `POST /api/contact` | نموذج الاتصال |
| WebSocket | `WS /api/ws/simulate` | محاكاة حية |
| الأداء | `POST /api/analytics/vitals` | مقاييس Web Vitals |

---

## 8. نظام الرفيق الكمي

كل مستخدم يحصل على رفيق افتراضي حتمي مبني من معرّف الجلسة:
- 5 مستويات ندرة (common → legendary)
- 18 نوع جسيم كمي
- إحصائيات: COHERENCE, ENTANGLEMENT, SPIN, ENERGY, CHARM
- رسم متحرك ASCII في زاوية المنصة
