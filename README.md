# QURABIA

مستودع موقع QURABIA الرئيسي. يحتوي المشروع على واجهة React أمامية وخدمات FastAPI خلفية، إضافةً إلى طبقة التكامل المؤسسي (SNQSP Enterprise Integration Layer).

## محتوى المستودع
- `frontend/` — واجهة React/TypeScript (Vite) مع اختبارات Vitest.
- `backend/` — خدمات FastAPI (KEM + DSA + AGI Engine) مع اختبارات pytest.
- `genesis_v4/` — محرك تطور جيني ذاتي متقدم (GENESIS v4).
- `.github/workflows/deploy.yml` — بناء ونشر تلقائي عبر GitHub Pages.

---

## SNQSP Enterprise Integration Layer

### خدمات FastAPI المتاحة

| الخدمة | ملف | المسار الجذري |
|--------|-----|--------------|
| KEM (Key Encapsulation Mechanism) | `backend/kem_service.py` | `/api/v2/kem` |
| DSA (Digital Signature Algorithm) | `backend/dsa_service.py` | `/api/v2/dsa` |

---

### KEM Service — `/api/v2/kem`

خدمة توليد وتغليف المفاتيح الكمية. تدعم الأوضاع: `ML_KEM` و`X25519` و`HYBRID` (افتراضي).

#### تشغيل الخدمة
```bash
cd backend
uvicorn kem_service:app --host 0.0.0.0 --port 8001 --reload
```

#### نقاط الاتصال (Endpoints)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/v2/kem/health` | فحص الحياة |
| POST | `/api/v2/kem/generate` | توليد زوج مفاتيح |
| POST | `/api/v2/kem/encapsulate` | تغليف سر مشترك بالمفتاح العام |
| POST | `/api/v2/kem/decapsulate` | فك تغليف السر بالمفتاح الخاص |

#### أمثلة

```bash
# توليد زوج مفاتيح هجين
curl -X POST http://localhost:8001/api/v2/kem/generate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "HYBRID", "security_level": 3}'

# تغليف سر مشترك
curl -X POST http://localhost:8001/api/v2/kem/encapsulate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "HYBRID", "public_key": "<BASE64_PUBLIC_KEY>"}'

# فك تغليف السر
curl -X POST http://localhost:8001/api/v2/kem/decapsulate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "HYBRID", "private_key": "<BASE64_PRIVATE_KEY>", "ciphertext": "<BASE64_CIPHERTEXT>"}'
```

---

### DSA Service — `/api/v2/dsa`

خدمة التوقيع الرقمي الكمي. تدعم الأوضاع: `ML_DSA` و`SLH_DSA` و`HYBRID` (افتراضي).

#### تشغيل الخدمة
```bash
cd backend
uvicorn dsa_service:app --host 0.0.0.0 --port 8002 --reload
```

#### نقاط الاتصال (Endpoints)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/v2/dsa/health` | فحص الحياة |
| POST | `/api/v2/dsa/generate` | توليد زوج مفاتيح التوقيع |
| POST | `/api/v2/dsa/sign` | توقيع رسالة |
| POST | `/api/v2/dsa/verify` | التحقق من التوقيع |

#### أمثلة

```bash
# توليد زوج مفاتيح
curl -X POST http://localhost:8002/api/v2/dsa/generate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "HYBRID", "security_level": 3}'

# توقيع رسالة
curl -X POST http://localhost:8002/api/v2/dsa/sign \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "HYBRID", "private_key": "<BASE64_PRIVATE_KEY>", "message": "Hello quantum world"}'

# التحقق من التوقيع
curl -X POST http://localhost:8002/api/v2/dsa/verify \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "HYBRID", "public_key": "<BASE64_PUBLIC_KEY>", "message": "Hello quantum world", "signature": "<BASE64_SIGNATURE>"}'
```

---

### إعداد Vault

تُستخدم `backend/vault_client.py` للتحكم في الأسرار. في الوضع الافتراضي تعمل كـ mock آمن في الذاكرة.

للاتصال بـ HashiCorp Vault حقيقي، اضبط المتغيرات البيئية:
```bash
export VAULT_ADDR=https://your-vault-instance:8200
export VAULT_TOKEN=your-vault-token
```

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
