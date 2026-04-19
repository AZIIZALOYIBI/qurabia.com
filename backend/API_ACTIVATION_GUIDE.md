# دليل تفعيل API - QURABIA Backend

## ✅ الحالة: API مُفعّل ويعمل بنجاح

تم تفعيل API بنجاح وهو جاهز للاستخدام في بيئة التطوير والإنتاج.

---

## 🚀 التشغيل السريع

### 1. بيئة التطوير (محلياً)

```bash
cd backend

# تثبيت التبعيات (إذا لم تكن مثبتة)
pip install -r requirements.txt

# تشغيل الخادم
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```

**الخادم سيعمل على:**
- URL: `http://localhost:10000`
- Swagger Docs: `http://localhost:10000/docs`
- Health Check: `http://localhost:10000/health`

### 2. باستخدام Docker

```bash
# من المجلد الرئيسي
docker compose up

# أو بناء وتشغيل خاص بالـ backend
cd backend
docker build -t qurabia-backend .
docker run -p 10000:10000 --env-file .env qurabia-backend
```

---

## 📋 المتغيرات البيئية

تم إنشاء ملف `.env` في `backend/.env` بالقيم الافتراضية للتطوير.

### المتغيرات الأساسية (مطلوبة)

```bash
APP_ENV=development          # development أو production
KEM_MASTER_SEED=***         # للتشفير الكمي
DSA_SIGNING_KEY=***         # للتوقيع الرقمي
```

### المتغيرات الاختيارية (لتفعيل ميزات إضافية)

```bash
# لتفعيل خدمات LLM (تلخيص النصوص، الذكاء الاصطناعي)
OPENROUTER_API_KEY=***
GEMINI_API_KEY=***
GROK_API_KEY=***

# لتفعيل GLM-4.7 المحلي
VLLM_BASE_URL=http://localhost:8000
GLM_MODEL_NAME=glm-4.7-fp8
```

---

## 🔍 اختبار API

### فحص الصحة

```bash
curl http://localhost:10000/health
```

**استجابة ناجحة:**
```json
{
  "status": "ok",
  "uptime_s": 4.8,
  "response_ms": 0.02,
  "memory_mb": 94.0,
  "database": {"ok": true, "error": null},
  "blackbody": {"available": true, "error": null},
  "learning": {"total_events": 0},
  "security_shield": {"blocked": 0, "allowed": 0, "total": 0}
}
```

### عرض جميع Endpoints

افتح في المتصفح (في بيئة التطوير فقط):
```
http://localhost:10000/docs
```

### مثال: تلخيص نص

```bash
curl -X POST http://localhost:10000/api/text/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "نص طويل للتلخيص..."
  }'
```

**ملاحظة:** يتطلب `OPENROUTER_API_KEY` أو `GITHUB_TOKEN` في `.env`

---

## 🌐 النشر على Render.com

API مُعد مسبقاً للنشر على Render عبر `render.yaml`.

### الخطوات:

1. **ادفع التغييرات إلى GitHub**
   ```bash
   git push origin main
   ```

2. **أضف المتغيرات السرية في لوحة تحكم Render:**
   - `KEM_MASTER_SEED` - قيمة سرية قوية
   - `DSA_SIGNING_KEY` - قيمة سرية قوية
   - `OPENROUTER_API_KEY` - (اختياري) للـ LLM
   - `GEMINI_API_KEY` - (اختياري) للـ Gemini
   - `GROK_API_KEY` - (اختياري) للـ Grok

3. **Render سينشر تلقائياً**
   - URL الإنتاج: `https://qurabia-backend.onrender.com`
   - Health check: `https://qurabia-backend.onrender.com/health`

---

## 📍 Endpoints الرئيسية

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/health` | GET | فحص صحة الخادم |
| `/docs` | GET | توثيق Swagger (تطوير فقط) |
| `/api/text/summarize` | POST | تلخيص النص |
| `/api/autdie` | POST | محرك AUTDIE الاستراتيجي |
| `/api/al-utaibi-v2` | POST | معادلة العتيبي v2.0 |
| `/api/quantum/fingerprint` | POST | توليد البصمة الكمية |
| `/api/security/multipath-encrypt` | POST | التشفير متعدد المسارات |
| `/api/arabic/analyze` | POST | تحليل النصوص العربية |

**للقائمة الكاملة:** راجع `/docs` في بيئة التطوير

---

## 🔒 الأمان

### في التطوير:
- استخدم القيم الافتراضية في `.env`
- Swagger docs مُفعّل على `/docs`
- CORS مفتوح للتطوير

### في الإنتاج:
- **لا تستخدم القيم الافتراضية** - استبدلها بقيم سرية قوية
- Swagger docs **مُعطّل** تلقائياً
- CORS محدود للنطاقات المصرح بها
- استخدم HTTPS دائماً

---

## ⚠️ استكشاف الأخطاء

### خطأ: "Missing required environment variable(s)"
**الحل:** تأكد من وجود ملف `.env` وأنه يحتوي على:
```bash
APP_ENV=development
KEM_MASTER_SEED=dev_seed_for_testing_only
DSA_SIGNING_KEY=dev_key_for_testing_only
```

### خطأ: "Redis connection failed"
**الحل:** هذا تحذير فقط - API سيعمل بدون Redis (سيُعطّل التخزين المؤقت)

### خطأ: "LLM client is not available"
**الحل:** أضف أحد المفاتيح التالية في `.env`:
- `OPENROUTER_API_KEY`
- `GITHUB_TOKEN`
- `GEMINI_API_KEY`

---

## 📚 المزيد من المعلومات

- **CLAUDE.md** - سياق المشروع والتعليمات
- **backend/.env.example** - قالب متغيرات البيئة
- **render.yaml** - إعدادات النشر
- **Dockerfile** - صورة Docker

---

**تم التفعيل بتاريخ:** 2026-04-19
**الحالة:** ✅ جاهز للاستخدام
