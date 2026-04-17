# 🛡️ QURABIA Security Tools — أدوات الأمان المتقدمة

نظام شامل ومبتكر لإدارة الأمان في مشروع QURABIA، يوفر حماية متعددة الطبقات وإصلاح ذاتي ذكي.

## 🌟 المميزات الابتكارية

### 1. Security Guardian — الحارس الذكي
نظام فحص أمني متقدم مع:
- ✅ فحص شامل لتبعيات npm و Python
- 📊 تحليل الاتجاهات الزمنية للثغرات
- 🧠 تصنيف ذكي حسب الخطورة
- 📈 تتبع تاريخ الثغرات
- 🎨 واجهة ملونة وواضحة

### 2. Auto-Healer — الإصلاح الذاتي
نظام إصلاح تلقائي ذكي مع:
- 🤖 تقييم المخاطر المدعوم بالذكاء الاصطناعي
- 🔄 اختبار تلقائي بعد كل إصلاح
- ↩️ Rollback تلقائي عند الفشل
- 📚 التعلم من الأخطاء السابقة
- 🎯 استراتيجيات إصلاح متعددة

### 3. تكامل مع CI/CD
- ⚙️ GitHub Actions للمراقبة المستمرة
- 📧 تنبيهات تلقائية عند اكتشاف ثغرات
- 📋 إنشاء Issues تلقائياً
- 🔒 فحص أسبوعي مجدول

## 🚀 الاستخدام السريع

### فحص الثغرات

```bash
# الطريقة الأولى: عبر Makefile (موصى به)
make security

# الطريقة الثانية: مباشرة
bash scripts/security-guardian.sh
```

### إصلاح تلقائي

```bash
# إصلاح ذكي مع اختبار
make security-fix

# أو مباشرة
python scripts/auto-healer.py
```

### توليد تقرير

```bash
make security-report
```

## 📚 دليل الاستخدام التفصيلي

### Security Guardian

**الوظائف:**
1. فحص npm audit للواجهة الأمامية
2. فحص pip-audit للخلفية
3. تحليل الاتجاهات الزمنية
4. توليد تقارير بصيغ متعددة (JSON, Markdown)

**المخرجات:**
```
security-reports/
├── npm-audit-{timestamp}.json      # تقرير npm مفصل
├── pip-audit-{timestamp}.json      # تقرير Python مفصل
├── security-audit-{timestamp}.json # تقرير موحد
├── security-audit-{timestamp}.md   # تقرير Markdown
└── history/                        # سجل تاريخي
    └── security-*.json
```

**مثال على الإخراج:**
```
═══════════════════════════════════════════════════════════
🛡️ QURABIA Security Guardian — حارس الأمان الذكي
═══════════════════════════════════════════════════════════

▶ فحص تبعيات npm (Frontend)
───────────────────────────────────────────────────────────
✅ npm: لا توجد ثغرات أمنية

▶ فحص تبعيات Python (Backend)
───────────────────────────────────────────────────────────
✅ Python: لا توجد ثغرات أمنية

▶ تحليل الاتجاهات الزمنية 📊
───────────────────────────────────────────────────────────
📈 اتجاهات الثغرات:
────────────────────────────────────────────────────────────
🟢 2026-04-17: npm=0, python=0, total=0 ✓

📊 متوسط الثغرات: 0.0
✅ الاتجاه: تحسن ملحوظ في الأمان
```

### Auto-Healer

**استراتيجيات الإصلاح:**

1. **AUTO_FIX**: إصلاح تلقائي آمن
   - `npm audit fix`
   - مناسب للثغرات متوسطة الخطورة

2. **SAFE_UPDATE**: تحديث آمن (نفس الإصدار الرئيسي)
   - تحديث patch/minor فقط
   - يحافظ على التوافق

3. **MAJOR_UPDATE**: تحديث كبير
   - `npm audit fix --force`
   - يستخدم عند الضرورة القصوى

4. **ALTERNATIVE_PKG**: استبدال الحزمة
   - البحث عن بدائل آمنة
   - حل للمكتبات المهجورة

5. **MANUAL**: يتطلب تدخل يدوي
   - للحالات المعقدة
   - توثيق الخطوات المطلوبة

**تقييم المخاطر:**

يستخدم Auto-Healer نظام تقييم متقدم:

```python
risk_score = (
    severity_score +        # حسب الخطورة
    cve_factor +           # عدد الـ CVEs
    history_factor         # سجل الإصلاحات السابقة
)
```

**مثال على التنفيذ:**
```
🤖 QURABIA Auto-Healer — نظام الإصلاح الذاتي الذكي
════════════════════════════════════════════════════════════

📦 فحص تبعيات npm...

🔧 معالجة vite...
   الخطورة: high
   المخاطر: 75.0%
   الاستراتيجية: safe_update
   📋 نسخ احتياطي للملفات
   📦 npm update vite
   🧪 تشغيل الاختبارات...
   ✅ اكتملت الاختبارات بنجاح
   ✅ تم الإصلاح بنجاح

════════════════════════════════════════════════════════════
📊 الإحصائيات:
   vulnerabilities_found: 2
   vulnerabilities_fixed: 2
   tests_passed: 2
   tests_failed: 0
   rollbacks: 0

✅ تم إصلاح جميع الثغرات بنجاح
```

## 🏗️ البنية المعمارية

```
scripts/
├── security-guardian.sh    # الماسح الذكي
└── auto-healer.py         # نظام الإصلاح الذاتي

docs/
└── SECURITY_AUDIT_APRIL_2026.md  # تقرير الأمان الشامل

.github/workflows/
└── dependency-security.yml        # CI/CD automation

Makefile
└── security targets              # أوامر مدمجة
```

## 🔐 أفضل الممارسات

### 1. المراقبة المستمرة

```bash
# فحص أسبوعي
# يتم تلقائياً عبر GitHub Actions كل أربعاء

# فحص يدوي قبل كل release
make security-scan
```

### 2. الإصلاح الآمن

```bash
# 1. فحص أولاً
make security-scan

# 2. نسخ احتياطي (يتم تلقائياً)
# 3. إصلاح ذكي
make security-fix

# 4. تشغيل الاختبارات (يتم تلقائياً)
# 5. مراجعة التغييرات
git diff
```

### 3. التوثيق

كل عملية إصلاح تُوثق في:
```
security-reports/healing-history.json
```

يحتوي على:
- timestamp
- الثغرة المُصلَحة
- الاستراتيجية المستخدمة
- نتيجة الاختبارات
- هل تطلب rollback

## 🎯 حالات الاستخدام

### حالة 1: دورة تطوير عادية

```bash
# قبل البدء
make install
make security-scan

# أثناء التطوير
git add .
make quality  # يتضمن فحص أمني

# قبل commit
make security-scan
```

### حالة 2: اكتشاف ثغرة

```bash
# فحص تفصيلي
make security-scan

# مراجعة التقرير
cat security-reports/security-audit-*.md

# إصلاح تلقائي
make security-fix

# إذا فشل، إصلاح يدوي
cd frontend && npm audit
npm update <package>
npm test
```

### حالة 3: CI/CD Pipeline

```yaml
# في .github/workflows/
- name: Security Scan
  run: make security-scan

- name: Auto-fix (optional)
  run: make security-fix
  continue-on-error: true
```

## 📊 مؤشرات الأداء (KPIs)

يتتبع النظام:
- 🎯 عدد الثغرات المكتشفة
- ✅ نسبة الإصلاح التلقائي الناجح
- ⏱️ متوسط وقت الإصلاح
- 🔄 عدد عمليات الـ rollback
- 📈 اتجاه الثغرات عبر الزمن

## 🤝 المساهمة

لتحسين أدوات الأمان:

1. اقترح استراتيجيات إصلاح جديدة
2. أضف دعم لأدوات فحص إضافية
3. حسّن خوارزميات تقييم المخاطر
4. أضف تكامل مع خدمات أمنية خارجية

## 📞 الدعم

- 📧 security@qurabia.com
- 🐛 [GitHub Issues](https://github.com/AZIIZALOYIBI/qurabia.com/issues)
- 📚 [SECURITY.md](../SECURITY.md)

## 📝 الترخيص

جزء من مشروع QURABIA
© 2026 عبدالعزيز بن سلطان العتيبي

---

**ملاحظة:** هذه الأدوات جزء من نظام دفاعي متكامل. استخدمها بانتظام للحفاظ على أمان المشروع.
