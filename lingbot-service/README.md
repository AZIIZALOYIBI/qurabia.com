# LingBot-Map Service

## 🌟 نظرة عامة

**LingBot-Map** هي خدمة متخصصة في معالجة اللغة الطبيعية العربية (Arabic NLP) ضمن منصة QURABIA. تعمل الخدمة بشكل مستقل على Python 3.10 باستخدام بيئة conda معزولة.

## ✨ المميزات

- ✅ **تحليل النصوص العربية** — Sentiment Analysis, NER, Topic Extraction
- ✅ **تلخيص ذكي** — Extractive & Abstractive Summarization
- ✅ **عزل كامل** — بيئة conda منفصلة (Python 3.10)
- ✅ **FastAPI** — واجهات API سريعة ومتطورة
- ✅ **Logging منظم** — Structlog for production-ready logging
- ✅ **Docker Support** — نشر سهل مع Docker Compose

## 🚀 التشغيل السريع

### باستخدام Conda (محلياً)

```bash
# إنشاء البيئة
conda env create -f environment.yml

# تفعيل البيئة
conda activate lingbot-map

# تشغيل الخدمة
python main.py

# الخدمة متاحة على: http://localhost:10001
```

### باستخدام Docker

```bash
# بناء الصورة
docker build -t qurabia-lingbot:latest .

# تشغيل الحاوية
docker run -p 10001:10001 \
  -e APP_ENV=development \
  -e LOG_LEVEL=info \
  qurabia-lingbot:latest

# الخدمة متاحة على: http://localhost:10001
```

### باستخدام Docker Compose (مع باقي المشروع)

```bash
# من مجلد qurabia.com الرئيسي
docker compose up lingbot-service
```

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "lingbot-map",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": 1713478800.123
}
```

### تحليل النص

```bash
POST /api/lingbot/analyze
Content-Type: application/json

{
  "text": "مرحباً بكم في قرابيا، منصة الذكاء الاصطناعي العربية",
  "include_sentiment": true,
  "include_entities": true,
  "include_topics": false
}
```

**Response:**
```json
{
  "text_length": 54,
  "language": "ar",
  "sentiment": {
    "polarity": "positive",
    "score": 0.75,
    "confidence": 0.92
  },
  "entities": [
    {
      "text": "قرابيا",
      "type": "ORG",
      "start": 0,
      "end": 5
    }
  ],
  "topics": null,
  "processing_time_ms": 12.45
}
```

### تلخيص النص

```bash
POST /api/lingbot/summarize
Content-Type: application/json

{
  "text": "نص طويل هنا...",
  "max_length": 150,
  "style": "extractive"
}
```

**Response:**
```json
{
  "summary": "ملخص النص...",
  "original_length": 1000,
  "summary_length": 150,
  "compression_ratio": 0.15,
  "processing_time_ms": 45.67
}
```

## 🧪 الاختبارات

```bash
# تفعيل البيئة أولاً
conda activate lingbot-map

# تشغيل الاختبارات
pytest tests/ -v

# مع تغطية الكود
pytest tests/ --cov=. --cov-report=html
```

## 🔧 التكوين

جميع الإعدادات في ملف `.env`:

```bash
APP_ENV=development
PORT=10001
LOG_LEVEL=info
REDIS_HOST=redis
REDIS_PORT=6379
```

للإنتاج، استخدم متغيرات البيئة الآمنة.

## 📊 البنية التقنية

```
lingbot-service/
├── main.py                 # FastAPI application
├── environment.yml         # Conda environment definition
├── Dockerfile              # Docker image with conda
├── requirements.txt        # Alternative pip requirements
├── .env.example            # Environment variables template
├── models/                 # NLP models (to be added)
├── utils/                  # Utility functions
├── config/                 # Configuration files
└── tests/
    └── test_main.py        # Test suite
```

## 🔗 التكامل مع QURABIA

الخدمة مدمجة في `docker-compose.yml` الرئيسي:

```yaml
lingbot-service:
  build:
    context: ./lingbot-service
  ports:
    - "10001:10001"
  environment:
    - APP_ENV=development
  networks:
    - qurabia-network
```

## 🛠️ التطوير

### إضافة وظائف NLP جديدة

1. أضف نموذج Pydantic في `main.py`
2. أنشئ endpoint جديد
3. أضف اختبارات في `tests/test_main.py`
4. وثّق الوظيفة في README

### إضافة نماذج جديدة

1. حمّل النموذج في `models/`
2. أضف التبعيات في `environment.yml`
3. قم بتحميل النموذج عند startup

## 📝 Notes

- **Python Version**: 3.10 (معزول عن البيئة الرئيسية 3.11/3.12)
- **Conda**: لإدارة التبعيات المعقدة (transformers, torch, etc.)
- **Port**: 10001 (لتجنب التعارض مع backend:10000)
- **Production**: استخدم Gunicorn + Uvicorn workers للإنتاج

## 🔒 الأمان

- ✅ لا توجد أسرار في الكود
- ✅ متغيرات البيئة فقط
- ✅ CORS محدود
- ✅ Rate limiting (قريباً)
- ✅ Input validation مع Pydantic

## 📞 الدعم

للأسئلة والمساعدة:
- GitHub Issues: https://github.com/AZIIZALOYIBI/qurabia.com/issues
- Email: contact@qurabia.com

---

**تم بناؤه بـ ❤️ من المملكة العربية السعودية**

© 2026 QURABIA — قوة الذكاء الاصطناعي العربي
