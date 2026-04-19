# QURABIA LingBot-Map — دليل التكامل الشامل

> خدمة معالجة اللغة الطبيعية العربية المتقدمة
> **الإصدار**: 1.0.0
> **المطور**: عبدالعزيز بن سلطان العتيبي

---

## 📋 نظرة عامة

**LingBot-Map** هي خدمة micro-service متخصصة في معالجة اللغة الطبيعية العربية (Arabic NLP)، مبنية على:
- **Python 3.10** في بيئة conda معزولة
- **FastAPI** للـ APIs السريعة
- **Docker** للنشر السهل
- **Transformers & NLP Models** للتحليل المتقدم

### لماذا بيئة منفصلة؟

| الميزة | Backend الرئيسي | LingBot-Map |
|--------|-----------------|------------|
| Python Version | 3.11/3.12 | 3.10 |
| Package Manager | pip + venv | conda |
| Port | 10000 | 10001 |
| Focus | Quantum + Security | Arabic NLP |
| Dependencies | FastAPI, Redis | Transformers, CAMeL Tools |

---

## 🚀 البدء السريع

### 1. باستخدام Docker Compose (موصى به)

```bash
# من مجلد qurabia.com الرئيسي
docker compose up lingbot-service

# أو تشغيل جميع الخدمات
docker compose up
```

✅ الخدمة ستكون متاحة على: **http://localhost:10001**

### 2. باستخدام Conda (تطوير محلي)

```bash
cd lingbot-service

# إنشاء البيئة
conda env create -f environment.yml

# تفعيل البيئة
conda activate lingbot-map

# تشغيل الخدمة
python main.py
```

### 3. باستخدام Docker فقط

```bash
cd lingbot-service

# بناء الصورة
docker build -t qurabia-lingbot:latest .

# تشغيل الحاوية
docker run -p 10001:10001 \
  -e APP_ENV=development \
  qurabia-lingbot:latest
```

---

## 📡 استخدام API

### Health Check

```bash
curl http://localhost:10001/health
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

### تحليل نص عربي

```bash
curl -X POST http://localhost:10001/api/lingbot/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "قرابيا هي منصة عربية رائدة في مجال الذكاء الاصطناعي والحوسبة الكمومية",
    "include_sentiment": true,
    "include_entities": true,
    "include_topics": false
  }'
```

**Response:**
```json
{
  "text_length": 75,
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

### تلخيص نص

```bash
curl -X POST http://localhost:10001/api/lingbot/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "نص طويل هنا...",
    "max_length": 150,
    "style": "extractive"
  }'
```

---

## 💻 التكامل مع Frontend

### استيراد الخدمة

```typescript
import { LingBotClient, analyzeSentiment, summarize } from '@/services/lingbot';
```

### استخدام Client الكامل

```typescript
const client = new LingBotClient();

// تحليل شامل
const analysis = await client.analyzeText({
  text: "النص العربي هنا",
  include_sentiment: true,
  include_entities: true,
  include_topics: true
});

console.log(analysis.sentiment);
console.log(analysis.entities);
console.log(analysis.topics);
```

### استخدام الدوال المساعدة

```typescript
// تحليل المشاعر فقط
const sentiment = await analyzeSentiment("نص عربي إيجابي رائع");
// { polarity: "positive", score: 0.85, confidence: 0.93 }

// تلخيص سريع
const summary = await summarize(longText, 100);
// "ملخص النص الطويل..."

// استخراج الكيانات
const entities = await extractEntities("محمد يعمل في شركة قرابيا");
// [{ text: "محمد", type: "PER" }, { text: "قرابيا", type: "ORG" }]
```

### مثال في React Component

```tsx
import { useState } from 'react';
import { LingBotClient } from '@/services/lingbot';

function ArabicTextAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const analyzeText = async () => {
    const client = new LingBotClient();
    const analysis = await client.analyzeText({
      text,
      include_sentiment: true,
      include_entities: true
    });
    setResult(analysis);
  };

  return (
    <div dir="rtl">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="أدخل النص العربي هنا"
      />
      <button onClick={analyzeText}>تحليل</button>

      {result && (
        <div>
          <p>المشاعر: {result.sentiment?.polarity}</p>
          <p>الثقة: {result.sentiment?.confidence}</p>
          <p>الكيانات: {result.entities?.length}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
cd lingbot-service
conda activate lingbot-map

# اختبارات كاملة
pytest tests/ -v

# مع تغطية
pytest tests/ --cov=. --cov-report=html

# اختبار endpoint معين
pytest tests/test_main.py::TestNLPEndpoints::test_analyze_text_basic -v
```

### إضافة اختبار جديد

```python
# tests/test_custom.py
def test_arabic_sentiment_positive():
    """Test positive Arabic sentiment"""
    payload = {
        "text": "هذا رائع جداً وممتاز",
        "include_sentiment": True
    }
    response = client.post("/api/lingbot/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"]["polarity"] == "positive"
```

---

## 🛠️ التطوير والتوسع

### إضافة endpoint جديد

1. **أضف Models في `main.py`:**

```python
class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "ar"
    target_lang: str = "en"

class TranslateResponse(BaseModel):
    original: str
    translated: str
    confidence: float
```

2. **أضف Endpoint:**

```python
@app.post("/api/lingbot/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    # TODO: Implement translation
    return TranslateResponse(
        original=request.text,
        translated="Translation here",
        confidence=0.95
    )
```

3. **أضف الاختبار:**

```python
def test_translate():
    payload = {"text": "مرحباً", "target_lang": "en"}
    response = client.post("/api/lingbot/translate", json=payload)
    assert response.status_code == 200
```

### إضافة نموذج NLP جديد

1. **أضف التبعية في `environment.yml`:**

```yaml
- pip:
  - arabert>=1.0.0
```

2. **حمّل النموذج عند Startup:**

```python
from transformers import AutoTokenizer, AutoModel

@app.on_event("startup")
async def load_models():
    global tokenizer, model
    tokenizer = AutoTokenizer.from_pretrained("aubmindlab/bert-base-arabertv2")
    model = AutoModel.from_pretrained("aubmindlab/bert-base-arabertv2")
```

3. **استخدم النموذج في Endpoint:**

```python
async def analyze_with_arabert(text: str):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model(**inputs)
    return outputs
```

---

## 🔧 متغيرات البيئة

| Variable | الوصف | القيمة الافتراضية |
|----------|-------|-------------------|
| `APP_ENV` | بيئة التشغيل | `development` |
| `PORT` | منفذ الخدمة | `10001` |
| `LOG_LEVEL` | مستوى التسجيل | `info` |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `LINGBOT_CACHE_DIR` | مجلد Cache | `/tmp/lingbot-cache` |
| `LINGBOT_MODELS_DIR` | مجلد Models | `/tmp/lingbot-models` |

---

## 📊 الأداء

### Benchmarks

| العملية | الزمن المتوقع | الحجم الأقصى |
|---------|---------------|--------------|
| تحليل نص | 10-50 ms | 10,000 حرف |
| تلخيص | 50-200 ms | 50,000 حرف |
| استخراج كيانات | 20-80 ms | 10,000 حرف |

### التحسين

```python
# استخدم Caching للنتائج المتكررة
from functools import lru_cache

@lru_cache(maxsize=1000)
def analyze_cached(text: str):
    return analyze_text_internal(text)
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: Conda environment لا يعمل

```bash
# إعادة إنشاء البيئة
conda env remove -n lingbot-map
conda env create -f environment.yml
```

### المشكلة: Docker build بطيء

```bash
# استخدم layer caching
docker build --cache-from qurabia-lingbot:latest -t qurabia-lingbot:latest .
```

### المشكلة: Port 10001 مشغول

```bash
# تغيير Port في docker-compose.yml
ports:
  - "10002:10001"  # استخدم 10002 بدلاً من 10001
```

---

## 📚 موارد إضافية

- [CAMeL Tools Docs](https://camel-tools.readthedocs.io/)
- [Hugging Face Arabic Models](https://huggingface.co/models?language=ar)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Conda User Guide](https://docs.conda.io/projects/conda/en/latest/user-guide/)

---

## 🤝 المساهمة

للمساهمة في تطوير LingBot-Map:

1. Fork المستودع
2. إنشاء فرع: `git checkout -b feature/amazing-nlp-feature`
3. Commit التغييرات مع اتباع Conventional Commits
4. Push وإنشاء Pull Request
5. تأكد من اجتياز جميع الاختبارات

---

## 📞 الدعم

للأسئلة والمشاكل:
- GitHub Issues: https://github.com/AZIIZALOYIBI/qurabia.com/issues
- Email: contact@qurabia.com
- التوثيق: `/lingbot-service/README.md`

---

**تم بناؤه بـ ❤️ للمجتمع العربي**

© 2026 QURABIA — نبني جسراً بين الحضارة العربية وتقنيات الغد
