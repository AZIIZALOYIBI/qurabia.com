# Ultimate Quantum SuperSystem v5.0

This workspace contains a frontend (Vite + React + TypeScript) and a backend (FastAPI) scaffold for the Ultimate Quantum SuperSystem.

Quick start (backend):

1. Create and activate a Python virtualenv

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r backend/requirements.txt
uvicorn ultimate-quantum-supersystem.backend.main:app --reload --port 8000
```

Quick start (frontend):

```bash
cd ultimate-quantum-supersystem
npm install
npm run dev --workspace-root
```
# Ultimate Quantum SuperSystem v5.0

منصة بحثية تجمع بين:
- نواة فيزيائية كمية (معادلة العتيبي)
- مرئيات تفاعلية متقدمة (React + TypeScript)
- محاكاة تصحيح أخطاء طوبولوجي (Toric Code)
- طبقة حوكمة أخلاقية صلبة
- Backend Python لمحرك AGI

## التشغيل السريع

### Frontend
```bash
cd ultimate-quantum-supersystem/frontend
npm install
npm run dev
```

### Backend
```bash
cd ultimate-quantum-supersystem/backend
pip install -r requirements.txt
python main.py
```
