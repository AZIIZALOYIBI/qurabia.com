# QURABIA

مستودع موقع QURABIA الرئيسي. يحتوي المشروع على صفحة الواجهة الأمامية للموقع وجزء تجريبي بحثي باسم `ultimate-quantum-supersystem`.

## محتوى المستودع
- `qurabia.html` — صفحة الهبوط الرئيسية (RTL، عربية).
- `sw.js`, `manifest.webmanifest`, `netlify.toml` — إعدادات PWA وNetlify.
- `ultimate-quantum-supersystem/` — مشروع فرعي يحتوي على واجهة React وBack-end بايثون تجريبي.

## تشغيل المشروع الفرعي (Ultimate Quantum SuperSystem)

Frontend:
```bash
cd ultimate-quantum-supersystem/frontend
npm install
npm run dev
```

Backend (Python - simple API):
```bash
cd ultimate-quantum-supersystem/backend
python -m venv .venv  # اختياري
pip install -r requirements.txt
python quantum_agi_engine.py
```

إذا رغبت، يمكنني إكمال المزيد من الميزات أو نشر التغييرات إلى المستودع الرئيسي.
