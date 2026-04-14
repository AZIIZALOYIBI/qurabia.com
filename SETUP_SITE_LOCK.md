# إعداد قفل الموقع — خطوات سريعة

## ✅ ما تم إنجازه

تم تفعيل نظام القفل بالكامل في الكود:
- ✅ مكون `SiteAccessGate` جاهز ويعمل
- ✅ `landing.html` يحقق من المصادقة
- ✅ GitHub Actions يمرر `VITE_SITE_ACCESS_CODE` عند البناء
- ✅ التوثيق الكامل في `docs/SITE_ACCESS_GATE.md`

## 🔧 ما تحتاج لفعله (خطوة واحدة فقط!)

لتفعيل القفل في الإنتاج، أضف السر في GitHub:

### الخطوات:

1. اذهب إلى صفحة المستودع على GitHub
2. اضغط على **Settings** (الإعدادات)
3. في القائمة الجانبية: **Secrets and variables** → **Actions**
4. اضغط **New repository secret**
5. املأ البيانات:
   - **Name**: `VITE_SITE_ACCESS_CODE`
   - **Secret**: الرمز الذي تريده (مثال: `7891` أو `mysecret2025`)
6. اضغط **Add secret**

### مثال بالصور:
```
Settings → Secrets and variables → Actions → New repository secret

Name: VITE_SITE_ACCESS_CODE
Secret: ••••••••  (الرمز السري الخاص بك)

[Add secret]
```

## 🚀 التفعيل التلقائي

بعد إضافة السر:
- في المرة القادمة التي تدمج فيها إلى `main`
- GitHub Actions سيبني الموقع مع الرمز الجديد
- القفل سيعمل تلقائياً على الموقع المنشور

## 🧪 الاختبار المحلي

لاختبار القفل محلياً:

```bash
cd frontend
echo "VITE_SITE_ACCESS_CODE=2025" > .env
npm run dev
```

افتح `http://localhost:5173` → يجب أن يطلب منك رمز PIN

## 📱 كيف يعمل للمستخدمين

1. يزور المستخدم `qurabia.com` أو `qurabia.com/landing.html`
2. يظهر له شاشة قفل أنيقة 🔒
3. يطلب منه إدخال رمز PIN
4. بعد الإدخال الصحيح → يحفظ في localStorage
5. لن يُطلب منه مرة أخرى حتى يمسح cache المتصفح

## ⚙️ التحكم

### تغيير الرمز
- غيّر قيمة السر في GitHub Settings
- أو غيّره في `frontend/.env` للتطوير المحلي

### تعطيل القفل مؤقتاً
- احذف السر من GitHub أو اتركه فارغاً
- سيستخدم النظام الرمز الافتراضي `2025`

### إزالة القفل نهائياً
راجع `docs/SITE_ACCESS_GATE.md` في قسم "إزالة القفل"

## 📞 الدعم

أي سؤال؟ راجع التوثيق الكامل: `docs/SITE_ACCESS_GATE.md`

---

**ملاحظة**: الرمز الافتراضي الحالي هو `2025` — تأكد من تغييره للأمان!
