# QURABIA — Claude Code Project Context

> منصة عربية للذكاء الاصطناعي والحوسبة الكمية  
> **qurabia.com** — "نبني جسراً بين الحضارة العربية وتقنيات الغد"

---

## بنية المشروع

```
qurabia.com/
├── frontend/          # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # مكونات React (DashboardV5, UnifiedQuantumPlatform…)
│   │   ├── engine/       # محركات الاستراتيجية والمحاكاة (17 محرك)
│   │   ├── core/         # منطق الكم الأساسي (statevector, gates…)
│   │   ├── ethics/       # وحدة الأخلاقيات
│   │   └── utils/        # أدوات مساعدة
│   └── public/
│       └── landing.html  # صفحة الهبوط الرئيسية
├── backend/           # FastAPI (Python 3.11)
│   ├── main.py           # نقطة الدخول + API routes
│   ├── dsa_service.py    # خدمة التوقيع الرقمي (DSA)
│   ├── kem_service.py    # خدمة التشفير الكمي (KEM)
│   └── tests/            # اختبارات pytest
├── .claude/
│   ├── commands/         # أوامر Claude Code المخصصة (slash commands)
│   └── settings.json     # إعدادات ECC
├── docs/              # التوثيق التقني
├── genesis_v4/        # النسخة الرابعة من المحرك الأساسي
├── scripts/           # أدوات الأتمتة والنشر
├── docker-compose.yml # بيئة التطوير المحلية
├── render.yaml        # إعدادات النشر على Render
└── Makefile           # أوامر البناء والاختبار
```

---

## أوامر التطوير الأساسية

### الواجهة الأمامية

```bash
cd frontend
npm install          # تثبيت التبعيات
npm run dev          # خادم التطوير على http://localhost:5173
npm run build        # بناء للإنتاج
npx vitest run       # تشغيل الاختبارات (426 اختبار)
npx vitest run --coverage  # مع تغطية الكود
```

### الواجهة الخلفية

```bash
cd backend
pip install -r requirements.txt
APP_ENV=development python -m pytest tests/ -v  # تشغيل الاختبارات (186 اختبار)
uvicorn main:app --reload --port 10000          # خادم التطوير
```

### باستخدام Makefile

```bash
make install   # تثبيت جميع التبعيات
make build     # بناء المشروع
make test      # تشغيل جميع الاختبارات
make lint      # فحص جودة الكود
make dev       # تشغيل خوادم التطوير
make quality   # فحص شامل: lint + test + build
```

### باستخدام Docker

```bash
docker compose up
# الواجهة الأمامية: http://localhost:5173
# الخلفية:         http://localhost:10000/health
```

---

## Slash Commands المخصصة

هذه الأوامر متاحة في Claude Code عبر `/command-name`:

| الأمر | الوصف |
|-------|-------|
| `/backend-service-fix-or-refactor` | إصلاح أو إعادة هيكلة خدمات الخلفية (dsa_service, kem_service, main.py) |
| `/design-system-update` | تحديث نظام التصميم والمتغيرات البصرية في `DesignSystem.css` |
| `/frontend-type-safety-and-code-quality-improvement` | تحسين سلامة الأنواع TypeScript وجودة الكود في الواجهة الأمامية |
| `/graphify` | بناء knowledge graph للمشروع، استعلام عن الاتصالات، وشرح المكونات |
| `/landing-page-redesign` | إعادة تصميم أو تحديث صفحة الهبوط في `frontend/public/landing.html` |

---

## قواعد المشروع

### الأمان

- **لا توجد أسرار مباشرة في الكود** — استخدم متغيرات البيئة دائماً
- **تحقق من كل مدخل** — XSS وSQL Injection وCSRF محظورة
- في الإنتاج، يُطلب `KEM_MASTER_SEED` و`DSA_SIGNING_KEY` عبر `APP_ENV=production`
- متغيرات الإنتاج الحساسة في `.env` (مُدرجة في `.gitignore`)

### واجهة المستخدم

- **RTL أولاً** — `dir="rtl"` و`lang="ar"` في كل الصفحات
- **Mobile First** — التصميم يبدأ من الجوال ثم يتوسع
- **Dark Theme** — التصميم الداكن هو الأساسي
- ألوان CSS: متغيرات في `frontend/src/styles/DesignSystem.css`

### الكود

- الواجهة الأمامية: TypeScript صارم، بدون `any`
- Linting: Biome (JS/TS)، Ruff (Python)
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, …)
- الاختبارات: Vitest (frontend)، pytest (backend)

### التسمية

| النوع | النمط | مثال |
|-------|-------|------|
| ملفات المكونات | PascalCase | `DashboardV5.tsx` |
| ملفات أخرى | kebab-case أو camelCase | `quantum-gates.ts` |
| المتغيرات والدوال | camelCase | `getUserData()` |
| الثوابت | UPPER_SNAKE_CASE | `MAX_QUBITS` |

---

## بيئة النشر

- **الواجهة الأمامية**: GitHub Pages — ينشر تلقائياً عند الدمج في `main`
- **الواجهة الخلفية**: Render.com — إعدادات في `render.yaml`
- **النطاق**: `qurabia.com` / `www.qurabia.com` — معرّف في `CNAME`

---

## هيكل API الخلفية

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/health` | GET | فحص صحة الخادم |
| `/api/autdie` | POST | محرك AUTDIE الاستراتيجي |
| `/api/al-utaibi-v2` | POST | معادلة العتيبي v2.0 |

---

## نصائح مفيدة

- استخدم `ThreeErrorBoundary` لتغليف أي مكونات Three.js
- `UnifiedQuantumPlatform.tsx` هو المكون الرئيسي للمنصة (4 تبويبات)
- حد المحاكاة: 16 كيوبت (معرّف في `statevector.ts:40`)
- البيانات في الإنتاج مؤقتة (تُحفظ في `/tmp/` على Render)

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
