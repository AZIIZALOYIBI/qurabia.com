# QURABIA

مستودع موقع QURABIA الرئيسي.

## محتوى المستودع
- `frontend/` — الواجهة الأمامية مع الاختبارات.
- `backend/` — الخدمات الخلفية مع الاختبارات.

---

### تشغيل الواجهة الأمامية

```bash
cd frontend
npm install
npm run dev
```

### تشغيل الاختبارات

```bash
# اختبارات الواجهة الأمامية
cd frontend
npm test

# اختبارات الخلفية
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

---

### أمثلة بيئة التشغيل
- Frontend: `frontend/.env.example`
- Backend: `backend/.env.example`

### ملاحظة مفاتيح الذكاء الاصطناعي
- لا تضع مفاتيح مزوّدي LLM داخل الواجهة (Frontend). استخدم:
  - `GEMINI_API_KEY`
  - `GROK_API_KEY`
  داخل `backend/.env` أو Secrets في بيئة النشر للـBackend.
