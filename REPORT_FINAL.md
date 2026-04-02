## تقرير التحسين الشامل — QURABIA.com

### النطاق
- إعادة هندسة مسار الدخول لتقليل الارتداد وزيادة وضوح القيمة.
- تحسين UX داخل لوحة التحكم عبر Onboarding + أزرار تشغيل/تصدير واضحة.
- تعزيز الأتمتة عبر “التعلم من الأخطاء” (جمع/تلخيص/مقاييس).
- تقوية البنية التحتية (CI/CD) لمنع نشر نسخ معطلة.
- تحسين الأداء والأمان على مستوى الـBackend (ضغط GZip، Rate Limit بكفاءة أعلى، قيود حجم الطلب، ترويسات أمنية).
- تجهيز أدوات اختبار أداء قابلة للتشغيل على بيئة مطابقة للإنتاج.

---

## 1) مراجعة الشيفرة: نقاط الضعف والفرص

### نقاط ضعف مُلاحظة
- صفحة `/` كانت تُدخل المستخدم مباشرة في لوحة تقنية بدون سياق أو توجيه.
- حالة `IDLE` و`Awaiting quantum stream…` كانت بلا تعليمات أو أزرار واضحة.
- عدم وجود مؤشر لحالة الـAPI داخل الواجهة يؤدي لتشخيص بطيء ورفع تكلفة الدعم.
- Rate limit في الـBackend كان يعتمد على List مع تنظيف عبر comprehension (أقل كفاءة مع زيادة الطلب).
- عدم وجود قيود حجم طلب أو ضغط استجابة افتراضي للـBackend.
- عدم وجود “بوابة جودة” على CI تمنع نشر Frontend بينما Backend مكسور.

### فرص متاحة
- تحويل “التعلم من الأخطاء” إلى طبقة أتمتة تخفض التكاليف (جمع أخطاء + ملخص + Metrics).
- توحيد التشغيل عبر Config بالـENV لتسهيل التدرج وتخفيض كلفة التشغيل.
- إضافة أدوات اختبار حمل بسيطة بدون مكتبات ثقيلة (اعتماداً على httpx الموجود).

---

## 2) ما تم تنفيذه (تنفيذيًا داخل المستودع)

### UX / UI
- جعل `/` في الإنتاج يوجّه إلى `/landing.html` افتراضياً (مع خيار دخول مباشر للوحة عبر `/?app=1`).
- إضافة Onboarding داخل لوحة التحكم لأول زيارة.
- تحسين “سجل القياسات”:
  - زر تشغيل واضح عند الجاهزية.
  - رسائل واضحة عند IDLE/ERROR.
  - تصدير CSV للـTelemetry.

### API / Learning
- إضافة Endpoint جديد:
  - `GET /api/learning/metrics?window_s=3600&top=6`
- تحسين نموذج إدخال الخطأ بقيود أطوال (منع payloads الضخمة).
- إضافة تخزين اختياري للأحداث عبر SQLite داخل LearningMemory:
  - تفعيل عبر ENV: `LEARNING_DB_PATH`
  - حد أقصى لعدد الصفوف عبر ENV: `LEARNING_DB_MAX_ROWS`

### Backend Performance + Security
- GZip للردود الكبيرة (minimum_size=800).
- Rate limit باستخدام deque بدل list.
- حد أقصى لحجم الطلب (افتراضي 256KB) عبر ENV: `MAX_BODY_BYTES`.
- ترويسات أمنية افتراضية على الردود:
  - X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP

### CI/CD
- تشغيل اختبارات الـBackend ضمن GitHub Pages workflow قبل بناء الـFrontend.

---

## 3) الإعدادات (Configuration)

### Backend ENV
- `APP_ENV=production|dev`
- `RATE_LIMIT_REQUESTS=60`
- `RATE_LIMIT_WINDOW_S=60`
- `MAX_BODY_BYTES=262144`
- `LEARNING_MAX_EVENTS=500`
- `LEARNING_DB_PATH=./data/qurabia.db` (اختياري)
- `LEARNING_DB_MAX_ROWS=25000`

---

## 4) اختبارات الوحدة/التكامل (Coverage)

تم تشغيلها محلياً:
- Backend: `pytest -q` (102 اختبار ناجح)
- Frontend: `npm test` (161 اختبار ناجح)

كما تم دمج اختبارات الـBackend داخل Workflow للنشر.

---

## 5) اختبار الأداء (Load Test)

### أداة الاختبار
- الملف: `backend/tools/load_test.py`
- التشغيل:
  - `python tools/load_test.py --base http://127.0.0.1:8000 --requests 200 --concurrency 1 10 50`

### ملاحظة Rate Limit
عند اختبار الضغط محلياً يجب رفع الحد مؤقتاً لتفادي 429:
- `RATE_LIMIT_REQUESTS=100000`

### نتائج تشغيل محلي (localhost)
Health:
- c=1: p50=2.2ms p95=2.7ms rps=429.13
- c=10: p50=21.3ms p95=49.4ms rps=382.25
- c=50: p50=135.1ms p95=576.9ms rps=205.48

Learning summary:
- c=1: p50=2.4ms p95=3.0ms rps=404.85
- c=10: p50=23.3ms p95=53.1ms rps=347.93
- c=50: p50=134.1ms p95=651.1ms rps=198.63

---

## 6) خطة صيانة ومراقبة (Maintenance)

### مراقبة التشغيل
- `GET /health` للتحقق من جاهزية الخدمة.
- `GET /api/learning/metrics` لمراقبة كثافة الأخطاء وتكرارها.

### سياسة تشغيل مقترحة
- ابدأ بـRate limit محافظ في الإنتاج ثم قم برفعه تدريجياً حسب القياسات.
- فعّل `LEARNING_DB_PATH` للاحتفاظ التاريخي وتفادي فقدان الذاكرة بعد إعادة التشغيل.

