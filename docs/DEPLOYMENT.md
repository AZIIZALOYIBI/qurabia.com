# دليل النشر (QURABIA)

## الواجهة الأمامية (GitHub Pages)
- النشر يتم عبر GitHub Actions:
  - `.github/workflows/deploy.yml`
- يتم بناء:
  - `frontend` عبر `tsc && vite build`
- يتم رفع `frontend/dist` إلى Pages.

### متغيرات البيئة المطلوبة للواجهة
- `VITE_API_BASE_URL`
  - يجب أن يشير إلى عنوان الخلفية في الإنتاج (مثال: `https://api.qurabia.com`).

## الخلفية (Render.com)
- الإعداد:
  - `render.yaml`
  - `backend/Dockerfile`
- نقطة فحص الصحة:
  - `/health`

### متغيرات البيئة المطلوبة للخلفية
- تشغيل/سياسة:
  - `APP_ENV=production`
- مفاتيح خدمات (لا توضع في الواجهة):
  - `GEMINI_API_KEY`
  - `GROK_API_KEY`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`
- مفاتيح خدمات ما بعد الكمي (إن فعّلتها):
  - `KEM_MASTER_SEED`
  - `DSA_SIGNING_KEY`

## بروتوكول نشر آمن
- قبل النشر:
  - `python scripts/secret_scan.py`
  - `pytest -q` داخل `backend/`
  - `npm test` و `npm run build` داخل `frontend/`
- النسخ الاحتياطي:
  - استخدم tag قبل تغييرات كبيرة (مثال):
    - `git tag backup-before-release-YYYYMMDD-HHMM`
    - `git push origin --tags`
