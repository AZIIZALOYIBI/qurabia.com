# 🛡️ QURABIA Security Documentation

هذا المجلد يحتوي على التوثيق الأمني لمنصة QURABIA.

## 📚 الوثائق المتاحة

### [AUDIT_REPORT_INTEGRATION.md](./AUDIT_REPORT_INTEGRATION.md)
دليل شامل حول تكامل نظام توليد تقارير التدقيق الأمني مع CI/CD Pipeline:
- شرح المكونات الرئيسية
- كيفية عمل النظام
- الوصول إلى التقارير
- استكشاف الأخطاء
- التخصيص والصيانة

---

## 🎯 ملخص نظام الأمان

منصة QURABIA تستخدم نهجاً متعدد الطبقات للأمان:

### 1. **Security Shield** (`backend/security_shield.py`)
- حماية من هجمات DDoS
- حظر IPs المشبوهة تلقائياً
- مراقبة الأنماط غير الطبيعية

### 2. **Quantum Rate Limiting** (`backend/rate_limiting/`)
- نظام حماية كمومي تكيفي
- تحليل سلوكي للمستخدمين
- اكتشاف الأنماط المشبوهة بالذكاء الاصطناعي

### 3. **Post-Quantum Cryptography** (PQC)
- تشفير Kyber (KEM)
- توقيع رقمي Dilithium (DSA)
- حماية من هجمات الحواسيب الكمومية المستقبلية

### 4. **Security Audit Reports**
- توليد تلقائي لتقارير الأمان
- تكامل إلزامي مع CI/CD
- تتبع تاريخي لمستوى الأمان

---

## 🚀 البدء السريع

### تشغيل فحص أمني محلي:

```bash
# تشغيل الخادم الخلفي
cd backend
APP_ENV=development uvicorn main:app --reload --port 10000

# توليد تقرير أمني
curl -X GET "http://localhost:10000/api/v2.5/generate_audit_report" | python -m json.tool
```

### مشاهدة التقارير في CI/CD:

1. انتقل إلى [GitHub Actions](../../actions)
2. اختر أي Workflow Run
3. قم بتنزيل Artifact: `security-audit-report-{sha}`

---

## 📊 مستويات الأمان

| الدرجة | المستوى | الوصف |
|-------|---------|-------|
| 90-100 | ممتاز ✅ | النظام آمن للنشر في الإنتاج |
| 75-89 | جيد ⚠️ | موصى بتحسينات غير حرجة |
| 60-74 | مقبول ⚠️ | يحتاج تحسينات أمنية |
| <60 | ضعيف ❌ | غير آمن للنشر في الإنتاج |

---

## 🔗 روابط مفيدة

- [Backend Security API](../../backend/main.py#L4552)
- [CI/CD Workflow](../../.github/workflows/deploy.yml)
- [Security Shield](../../backend/security_shield.py)
- [Quantum Trust Engine](../../backend/rate_limiting/quantum_trust_engine.py)

---

**آخر تحديث**: 2026-04-17
**الإصدار**: v2.5
