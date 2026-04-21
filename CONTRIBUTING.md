# المساهمة في QURABIA

شكراً لاهتمامك بالمساهمة في منصة **QURABIA** — AI & Quantum Technology! 🚀

## اللغات

| السياق | اللغة |
|--------|-------|
| التوثيق | العربية (الأساسية) + الإنجليزية |
| الكود (أسماء المتغيرات/الدوال) | الإنجليزية |
| التعليقات في الكود | العربية أو الإنجليزية |
| رسائل الالتزام (Commits) | الإنجليزية مع وصف عربي اختياري |
| رسائل الخطأ للمستخدم | العربية |

## قبل المساهمة

### إعداد بيئة التطوير

```bash
# استنساخ المستودع
git clone https://github.com/AZIIZALOYIBI/qurabia.com.git
cd qurabia.com

# تثبيت أدوات Pre-commit
pre-commit install

# تشغيل البيئة المحلية عبر Docker
docker compose up
```

### التحقق قبل الدفع

```bash
# اختبارات الواجهة الخلفية
cd backend && APP_ENV=development python -m pytest tests/ -v

# اختبارات الواجهة الأمامية
cd frontend && npm install && npx vitest run

# بناء الواجهة الأمامية
cd frontend && npm run build
```

## بنية الفروع

| الفرع | الغرض |
|-------|-------|
| `main` | الإنتاج (محمي — يتطلب مراجعة) |
| `feature/*` | ميزات جديدة |
| `fix/*` | إصلاحات أخطاء |
| `quantum/*` | محركات كمومية جديدة |
| `docs/*` | تحديثات التوثيق |

## أسلوب الالتزامات (Conventional Commits)

```
feat: إضافة ميزة جديدة
fix: إصلاح خلل
refactor: إعادة هيكلة بدون تغيير السلوك
docs: تحديث التوثيق
style: تغييرات شكلية (تنسيق، مسافات)
perf: تحسين الأداء
test: إضافة أو تعديل اختبارات
chore: مهام صيانة (تبعيات، إعدادات)
security: إصلاح أمني
```

**أمثلة:**
```bash
git commit -m "feat: إضافة نقطة نهاية التحليل الصرفي الكمومي"
git commit -m "fix: إصلاح استخراج الجذر للكلمات المعرّفة"
git commit -m "docs: تحديث توثيق API الجسر الكمومي"
```

## معايير الكود

### Python (Backend)
- تنسيق: [Ruff](https://docs.astral.sh/ruff/) (مُعدّ في `ruff.toml`)
- أنواع البيانات: استخدم Pydantic للنماذج
- التسجيل: `structlog` (لا `print()`)
- الأخطاء: `try/except` شامل مع رسائل واضحة

### TypeScript (Frontend)
- تنسيق: [Biome](https://biomejs.dev/) (مُعدّ في `biome.json`)
- المكونات: React مع TypeScript صارم
- الأنماط: CSS-in-JS أو Tailwind حسب المكون
- RTL: دعم اتجاه النص العربي في كل مكان

## الأمان

⚠️ **قواعد صارمة:**

1. **لا تضف أبداً** مفاتيح API أو أسرار في الكود
2. **تحقق** من كل مدخل من المستخدم
3. **شغّل** `python scripts/secret_scan.py` قبل الدفع
4. **اقرأ** [SECURITY.md](./SECURITY.md) للتفاصيل

## إرسال Pull Request

1. أنشئ فرعاً من `main`
2. أضف تغييراتك مع اختبارات
3. تأكد من نجاح جميع الاختبارات
4. اكتب وصفاً واضحاً للـ PR
5. انتظر المراجعة من [@AZIIZALOYIBI](https://github.com/AZIIZALOYIBI)

## الإبلاغ عن مشاكل

- **خلل عام**: افتح Issue على GitHub
- **ثغرة أمنية**: راجع [SECURITY.md](./SECURITY.md) — لا تفتح Issue عام

---

> **QURABIA** — نبني جسراً بين الحضارة العربية وتقنيات الغد 🌍
