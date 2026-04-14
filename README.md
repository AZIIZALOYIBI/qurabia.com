# QURABIA — القوة الكمية العربية

منصة عربية مبتكرة تجمع الذكاء الاصطناعي والحوسبة الكمية.

## بنية المشروع

```
qurabia.com/
├── frontend/          # React 18 + TypeScript + Vite
├── backend/           # FastAPI (Python 3.11)
├── docker-compose.yml # بيئة تطوير محلية
├── render.yaml        # نشر الخلفية على Render
├── biome.json         # إعدادات Biome linter (JS/TS)
├── ruff.toml          # إعدادات Ruff linter (Python)
└── .pre-commit-config.yaml
```

## التشغيل السريع

### باستخدام Docker Compose (الطريقة الأسهل)

```bash
docker compose up
# الواجهة الأمامية: http://localhost:5173
# الخلفية: http://localhost:10000/health
```

### تشغيل يدوي

#### الواجهة الأمامية

```bash
cd frontend
npm install
npm run dev          # تشغيل خادم التطوير
npm run build        # بناء للإنتاج (tsc + vite build)
npm test             # تشغيل الاختبارات (vitest)
npm run test:coverage # اختبارات مع تغطية الكود
```

#### الخلفية
### تشغيل الخلفية
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```

### تشغيل الاختبارات

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# تشغيل الخادم
APP_ENV=development uvicorn main:app --reload --port 10000

# تشغيل الاختبارات
APP_ENV=development python -m pytest tests/ -v
```

## أدوات الجودة

### Linting

```bash
# JavaScript / TypeScript (Biome)
npx @biomejs/biome check frontend/src/

# Python (Ruff)
pip install ruff
ruff check backend/
ruff format backend/
```

### Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

## متغيرات البيئة

### الخلفية (`backend/.env`)

| المتغير | الوصف | مطلوب في الإنتاج |
|---------|-------|------------------|
| `APP_ENV` | `production` أو `development` | نعم |
| `KEM_MASTER_SEED` | بذرة التشفير KEM | نعم |
| `DSA_SIGNING_KEY` | مفتاح التوقيع الرقمي | نعم |
| `OPENROUTER_API_KEY` | مفتاح OpenRouter للذكاء الاصطناعي | لا |
| `RATE_LIMIT_DB_PATH` | مسار قاعدة بيانات حد الطلبات | لا |
| `LEARNING_DB_PATH` | مسار قاعدة بيانات التعلم | لا |
| `MEMORY_STORE_PATH` | مسار ملف تخزين الذاكرة | لا |

### الواجهة (`frontend/.env`)

| المتغير | الوصف |
|---------|-------|
| `VITE_API_BASE_URL` | عنوان الخلفية (مثال: `https://api.qurabia.com`) |
| `VITE_SITE_ACCESS_CODE` | الرقم السري للدخول (افتراضي: `2025`) — اتركه فارغاً لاستخدام الافتراضي |

## 🔒 نظام الحماية بالرقم السري

الموقع محمي برقم سري (PIN) يُطلب عند كل زيارة. للمزيد من التفاصيل، راجع [docs/SITE_ACCESS_PIN.md](docs/SITE_ACCESS_PIN.md).

**الرقم السري الحالي**: `2025` (يمكن تغييره من `frontend/.env`)

**تفعيل/تعطيل الحماية**:
```bash
# تفعيل (الحالة الحالية)
echo "VITE_SITE_ACCESS_CODE=2025" >> frontend/.env

# تعطيل (فتح الموقع للجميع)
echo "VITE_SITE_ACCESS_CODE=" >> frontend/.env
```

## النشر

- **الواجهة الأمامية**: GitHub Pages (تلقائي عبر `.github/workflows/deploy.yml`)
- **الخلفية**: Render.com (تلقائي عبر `render.yaml`)

## الاختبارات

```bash
# جميع الاختبارات
cd backend && APP_ENV=development python -m pytest tests/ -v
cd frontend && npm test

# تغطية الكود
cd frontend && npm run test:coverage
# الحد الأدنى: 70% للسطور/الدوال/العبارات، 50% للفروع
```

## CI/CD

- **deploy.yml** — بناء واختبار ونشر على GitHub Pages
- **lighthouse.yml** — فحص أداء Lighthouse على كل PR
---

### ملاحظة أمنية
لا تضع مفاتيح مزوّدي الذكاء الاصطناعي في الواجهة الأمامية. استخدم `backend/.env` محلياً أو Secrets في بيئة النشر.
