# QURABIA — تعليمات GitHub Copilot

> منصة عربية للذكاء الاصطناعي والحوسبة الكمية  
> **qurabia.com** — "نبني جسراً بين الحضارة العربية وتقنيات الغد"  
> **المالك**: عبدالعزيز بن سلطان العتيبي | **AZIIZALOYIBI**

---

## 🏗️ بنية المشروع

```
qurabia.com/
├── frontend/                  # React 18 + TypeScript + Vite 6
│   ├── src/
│   │   ├── components/        # DashboardV5, UnifiedQuantumPlatform, SiteAccessGate…
│   │   ├── engine/            # 17 محرك استراتيجي (AUTDIE, VQE, Grover…)
│   │   ├── core/              # statevector.ts (حد 16 كيوبت), quantum-gates.ts (10 بوابات)
│   │   ├── ethics/            # وحدة الأخلاقيات الكمية
│   │   ├── styles/            # DesignSystem.css — نظام التصميم الوحيد (~85KB)
│   │   └── utils/             # أدوات مساعدة
│   ├── public/
│   │   └── landing.html       # صفحة الهبوط (HTML خالص، Quantum Cyber v3.0)
│   └── vite.config.ts         # base: '/'
├── backend/                   # FastAPI + Python 3.11
│   ├── main.py                # نقطة الدخول + جميع API routes
│   ├── dsa_service.py         # توقيع رقمي DSA
│   ├── kem_service.py         # تشفير كمي KEM (ما بعد الكم)
│   └── tests/                 # pytest — 186 اختبار
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml         # ✅ النشر الصحيح الوحيد (peaceiris → gh-pages)
│   │   ├── static.yml         # ⚠️ يدوي فقط — لا push تلقائي
│   │   └── jekyll-gh-pages.yml# ⚠️ يدوي فقط — لا push تلقائي
│   └── agents/                # وكلاء Copilot المخصصون
├── .claude/commands/          # Slash commands (design-system-update, landing-page-redesign…)
├── tasks/                     # مهام تقييم الوكلاء (YAML)
└── scripts/                   # أدوات الأتمتة والنشر
```

---

## 🚀 أوامر البناء والاختبار

```bash
# الواجهة الأمامية
cd frontend && npm install
cd frontend && npm run dev           # http://localhost:5173
cd frontend && npm run build         # dist/ → ينشر إلى gh-pages
cd frontend && npx vitest run        # ~612 اختبار
cd frontend && npx vitest run --coverage
cd frontend && npx biome check src/  # linting

# الواجهة الخلفية
cd backend && pip install -r requirements.txt
cd backend && APP_ENV=development python -m pytest tests/ -v   # 186 اختبار
cd backend && ruff check .           # linting
cd backend && uvicorn main:app --reload --port 10000

# الكل دفعة واحدة
make install && make test && make build
```

---

## 📐 قواعد الكود الصارمة

### TypeScript / الواجهة الأمامية
- **لا `any`** — TypeScript صارم دائماً (`tsconfig.json: strict: true`)
- **Biome** للـ linting — لا ESLint
- مكونات React: `PascalCase.tsx` | ملفات أخرى: `kebab-case.ts`
- متغيرات/دوال: `camelCase` | ثوابت: `UPPER_SNAKE_CASE`
- **حد محاكاة الكم: 16 كيوبت** — معرّف في `statevector.ts:40`، لا تتجاوزه
- **غلّف Three.js دائماً** بـ `ThreeErrorBoundary`
- **`SiteAccessGate`** يغلف التطبيق كاملاً — PIN افتراضي `2025` (أو `VITE_SITE_ACCESS_CODE`)

### Python / الواجهة الخلفية
- **Ruff** للـ linting — لا flake8/pylint
- **Pydantic** لتحقق المدخلات في كل endpoint
- **structlog** للتسجيل — لا `print()` في الإنتاج
- `try/except` شامل مع رسائل خطأ واضحة للمستخدم

### الأمان (غير قابل للتفاوض)
- **لا أسرار في الكود** — متغيرات البيئة دائماً (`process.env` / `os.environ`)
- **لا `innerHTML = userInput`** — استخدم `textContent` أو sanitization
- في الإنتاج: `KEM_MASTER_SEED` و`DSA_SIGNING_KEY` مطلوبان (`APP_ENV=production`)
- **XSS / CSRF / SQL Injection**: تحقق من كل مدخل على الخادم

---

## 🎨 نظام التصميم — Quantum Cyber v3.0

نظام التصميم كاملاً في ملف واحد: `frontend/src/styles/DesignSystem.css`

### لوح الألوان الأساسي
| الرمز | القيمة | الاستخدام |
|-------|--------|-----------|
| `--primary` | `#00D4FF` | سماوي نيون — الأساسي |
| `--secondary` | `#00FF88` | أخضر كمي — الثانوي |
| `--tertiary` | `#8B5CF6` | بنفسجي نيون — التمييز |
| `--bg` | `#030812` | فضاء عميق — الخلفية |
| `--fg` | `#E2F3FF` | نص فاتح |
| `--error` | `#FF3D71` | خطأ/تحذير |

### الخطوط
- **عربي / UI**: `Readex Pro` ← `system-ui`
- **عناوين**: `Reem Kufi`
- **إنجليزي / تقني**: `Space Grotesk`
- **أكواد**: `Space Grotesk` (مونو)

### قواعد التصميم
- **RTL أولاً**: `dir="rtl"` و`lang="ar"` في كل صفحة
- **Mobile First**: ابدأ من 320px ثم وسّع
- **Quantum Cyber Dark**: الثيم الداكن هو الوحيد للإنتاج
- **Glassmorphism**: بطاقات ذات `backdrop-filter: blur` + حدود سماوية شفافة
- **لا Tailwind / لا SCSS** — CSS variables خالص فقط

### الكلاسات الكمية الجديدة
```css
.q-card-cyber    /* بطاقة glassmorphism كمية */
.q-btn-cyber     /* زر سماوي مضيء */
.q-text-glow-cyan   /* نص بتوهج سماوي */
.q-text-glow-green  /* نص بتوهج أخضر */
.q-chip-cyber    /* شريحة/badge كمية */
.q-orb           /* كرة كمية دوارة */
.q-hologram      /* تأثير هولوغرام */
.q-loading-bar   /* شريط تحميل متدفق */
.q-gradient-text /* نص بتدرج سماوي-أخضر */
```

---

## 🌐 API الخلفية

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/health` | GET | فحص صحة الخادم |
| `/api/autdie` | POST | محرك AUTDIE الاستراتيجي |
| `/api/al-utaibi-v2` | POST | معادلة العتيبي v2.0 |
| `/api/kem/encrypt` | POST | تشفير KEM (ما بعد الكم) |
| `/api/dsa/sign` | POST | توقيع رقمي DSA |

---

## 🚢 النشر — معلومات حرجة

### GitHub Pages (الواجهة الأمامية)
- **فرع النشر**: `gh-pages` (بُني بـ `peaceiris/actions-gh-pages`)
- **نوع البناء**: `legacy` (يدفع مباشرة إلى الفرع — **لا** `workflow` artifacts)
- **GitHub Actions**: معطّلة للمستخدم — النشر يدوي:
  ```bash
  cd frontend && npm run build
  # ثم push إلى gh-pages عبر git worktree
  ```
- **Workflow صحيح**: `deploy.yml` فقط — `static.yml` و`jekyll-gh-pages.yml` يدويان فقط
- **النطاق**: `qurabia.com` (CNAME في فرع `gh-pages`)

### Render (الواجهة الخلفية)
- **URL**: `https://api.qurabia.com`
- **الإعداد**: `render.yaml`
- **البيانات مؤقتة**: تُحفظ في `/tmp/` — لا تعتمد على استمرارية الملفات

---

## 📝 قواعد Git Commits

```
feat: إضافة ميزة جديدة
fix: إصلاح خلل
refactor: إعادة هيكلة بدون تغيير السلوك
docs: تحديث توثيق
style: تغييرات شكلية (تنسيق، مسافات)
perf: تحسين أداء
test: إضافة/تعديل اختبارات
chore: مهام صيانة (تبعيات، إعدادات)
security: إصلاح أمني
deploy: نشر أو تحديث بنية CI/CD
```

---

## 🤖 بروتوكول الوكيل

عند تلقي issue أو مهمة:
1. **اقرأ أولاً** — افهم الملفات المرتبطة قبل أي تعديل
2. **أصغر تغيير ممكن** — لا تعدّل ملفات غير مرتبطة
3. **اختبر دائماً** — `npm run build` + `npx vitest run` بعد كل تعديل
4. **وثّق التغيير** — commit message وصفي ومفيد بـ Conventional Commits
5. **لا تكسر موجوداً** — جميع الاختبارات يجب أن تمر
6. **مراجعة أمنية** — تحقق من الأمان قبل الانتهاء
7. **احفظ ثيم Quantum Cyber** — لا تعود للألوان الدافئة القديمة

---

## 🔗 مراجع سريعة

| المورد | الرابط |
|--------|--------|
| الموقع | https://qurabia.com |
| API الخلفية | https://api.qurabia.com |
| المستودع | https://github.com/AZIIZALOYIBI/qurabia.com |
| نظام التصميم | `frontend/src/styles/DesignSystem.css` |
| صفحة الهبوط | `frontend/public/landing.html` |
| Slash Commands | `.claude/commands/` |
| وكلاء Copilot | `.github/agents/` |
