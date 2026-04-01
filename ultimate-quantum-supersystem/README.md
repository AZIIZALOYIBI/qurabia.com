# Ultimate Quantum SuperSystem v5.0

منصة بحثية تجمع بين:
- نواة فيزيائية كمية (معادلة العتيبي)
- مرئيات تفاعلية متقدمة (React + TypeScript)
- محاكاة تصحيح أخطاء طوبولوجي (Toric Code)
- طبقة حوكمة أخلاقية صلبة
- Backend Python لمحرك AGI

## التشغيل السريع

### Backend

```bash
cd ultimate-quantum-supersystem/backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd ultimate-quantum-supersystem/frontend
npm install
npm run dev
```
