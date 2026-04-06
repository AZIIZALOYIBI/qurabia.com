# QURABIA — تعليمات GitHub Copilot

> منصة عربية للذكاء الاصطناعي والحوسبة الكمية  
> **qurabia.com** — "نبني جسراً بين الحضارة العربية وتقنيات الغد"  
> **المالك**: عبدالعزيز بن سلطان العتيبي | **AZIIZALOYIBI**

---

## 🏗️ بنية المشروع

```
qurabia.com/
├── frontend/          # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # مكونات React (DashboardV5, UnifiedQuantumPlatform…)
│   │   ├── engine/       # 17 محرك استراتيجي وكمي
│   │   ├── core/         # منطق الكم (statevector, quantum-gates: 10 بوابات)
│   │   ├── ethics/       # وحدة الأخلاقيات
│   │   ├── styles/       # DesignSystem.css + متغيرات CSS
│   │   └── utils/        # أدوات مساعدة
│   └── public/
│       └── landing.html  # صفحة الهبوط (HTML خالص)
├── backend/           # FastAPI Python 3.11
│   ├── main.py           # نقطة الدخول + جميع API routes
│   ├── dsa_service.py    # توقيع رقمي (DSA)
│   ├── kem_service.py    # تشفير كمي (KEM)
│   └── tests/            # pytest (186 اختبار)
├── .claude/commands/  # Slash commands لـ Claude Code
├── tasks/             # مهام تقييم الوكلاء (YAML)
└── scripts/           # أدوات الأتمتة
```

---

## 🚀 أوامر البناء والاختبار

```bash
# الواجهة الأمامية
cd frontend && npm install
cd frontend && npm run dev          # http://localhost:5173
cd frontend && npm run build        # بناء للإنتاج
cd frontend && npx vitest run       # 426 اختبار
cd frontend && npx vitest run --coverage

# الواجهة الخلفية
cd backend && pip install -r requirements.txt
cd backend && APP_ENV=development python -m pytest tests/ -v  # 186 اختبار
cd backend && uvicorn main:app --reload --port 10000

# الكل مرة واحدة
make install && make test && make build
```

---

## 📐 قواعد الكود الصارمة

### TypeScript / الواجهة الأمامية
- **لا `any`** — TypeScript صارم دائماً
- **Biome** للـ linting: `cd frontend && npx biome check src/`
- مكونات React: PascalCase (`MyComponent.tsx`)
- ملفات أخرى: kebab-case (`quantum-gates.ts`)
- متغيرات/دوال: camelCase | ثوابت: UPPER_SNAKE_CASE
- **لا تتجاوز 16 كيوبت** — حد المحاكاة في `statevector.ts:40`
- استخدم `ThreeErrorBoundary` لتغليف أي مكونات Three.js

### Python / الواجهة الخلفية
- **Ruff** للـ linting: `cd backend && ruff check .`
- **Pydantic** لتحقق المدخلات في كل endpoint
- **structlog** للتسجيل (لا `print()` في الإنتاج)
- معالجة الأخطاء: `try/except` شامل مع رسائل واضحة

### الأمان (غير قابل للتفاوض)
- **لا أسرار مكشوفة** — متغيرات البيئة دائماً
- **لا `innerHTML = userInput`** — استخدم `textContent` أو sanitization
- **لا hardcoding لـ API keys** في أي مكان
- تحقق من الإنتاج: `KEM_MASTER_SEED` و`DSA_SIGNING_KEY` مطلوبان

---

## 🎨 معايير واجهة المستخدم

- **RTL أولاً**: `dir="rtl"` و`lang="ar"` في كل الصفحات
- **Mobile First**: صمم للجوال أولاً
- **Dark Theme**: الثيم الداكن هو الأساسي
- المتغيرات البصرية في: `frontend/src/styles/DesignSystem.css`

---

## 🌐 API الخلفية

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/health` | GET | فحص صحة الخادم |
| `/api/autdie` | POST | محرك AUTDIE الاستراتيجي |
| `/api/al-utaibi-v2` | POST | معادلة العتيبي v2.0 |

---

## 📝 قواعد Git Commits

```
feat: إضافة ميزة جديدة
fix: إصلاح خلل
refactor: إعادة هيكلة
docs: تحديث توثيق
style: تغييرات شكلية
perf: تحسين أداء
test: إضافة/تعديل اختبارات
chore: مهام صيانة
security: إصلاح أمني
```

---

## 🤖 بروتوكول الوكيل

عند تلقي issue أو مهمة:
1. **اقرأ أولاً** — افهم الملفات المرتبطة قبل أي تعديل
2. **أصغر تغيير ممكن** — لا تعدّل ملفات غير مرتبطة
3. **اختبر دائماً** — شغّل الاختبارات المناسبة بعد التعديل
4. **وثّق التغيير** — commit message وصفي ومفيد
5. **لا تكسر موجوداً** — تأكد من اجتياز جميع الاختبارات
6. **مراجعة أمنية** — تحقق من الأمان قبل الانتهاء

---

## 🔗 مراجع سريعة

- **الموقع**: https://qurabia.com
- **الخلفية (Render)**: https://api.qurabia.com
- **النشر**: GitHub Pages (تلقائي عند push إلى `main`)
- **Claude Commands**: `.claude/commands/`
- **مهام التقييم**: `tasks/`
