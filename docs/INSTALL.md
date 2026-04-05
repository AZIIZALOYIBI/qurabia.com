# دليل التثبيت والتشغيل (QURABIA)

## المتطلبات
- Node.js 20+
- Python 3.11+ (مُوصى 3.12)
- Git
- Docker (اختياري للتشغيل السريع)

## تشغيل محلي (بدون Docker)

### 1) الواجهة الأمامية
```bash
cd frontend
npm install
npm run dev
```
- تفتح عادة على: `http://localhost:5173`

### 2) الخلفية (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\\Scripts\\activate    # Windows PowerShell
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```
- فحص الصحة: `http://localhost:10000/health`

### 3) ربط الواجهة بالخلفية
- أنشئ ملف `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:10000
```

## تشغيل محلي (Docker Compose)
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:10000/health`

## متغيرات البيئة
- Frontend: راجع `frontend/.env.example`
- Backend: راجع `backend/.env.example`

## اختبارات
### Backend
```bash
cd backend
pytest -q
```

### Frontend
```bash
cd frontend
npm test
npm run build
```

