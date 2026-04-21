# تقييم الوكلاء — Agent Evaluation Tasks

هذا المجلد يحتوي على مهام قابلة للتكرار لمقارنة أداء وكلاء البرمجة (Claude Code, Aider, Codex...) على كودقاعدة **QURABIA** الحقيقية.

---

## ⚡ البدء السريع / Quick Start

```bash
# 1. تثبيت agent-eval
pip install git+https://github.com/joaquinhuigomez/agent-eval

# 2. ضبط مفاتيح API
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."

# 3. تشغيل كل المهام مع كل الوكلاء (3 تكرارات لكل وكيل)
cd /path/to/qurabia.com
./tasks/run-eval.sh

# 4. تشغيل مهمة واحدة فقط
./tasks/run-eval.sh --task task-01

# 5. اختبار وكيل واحد فقط
./tasks/run-eval.sh --agent claude-code --runs 5
```

---

## 📋 المهام / Tasks

| # | الملف | المهمة | الملفات المتأثرة | الحكم |
|---|-------|---------|-----------------|-------|
| 1 | `task-01-add-swap-gate.yaml` | إضافة بوابة SWAP الكمية | `frontend/src/core/quantum-gates.ts` | grep + vitest build |
| 2 | `task-02-add-memory-stats-endpoint.yaml` | إضافة نقطة نهاية إحصاءات الذاكرة | `backend/main.py` | grep + pytest |
| 3 | `task-03-add-blackbody-validation.yaml` | التحقق من مدخلات الجسم الأسود | `backend/main.py` | grep + pytest |
| 4 | `task-04-add-arabic-batch-endpoint.yaml` | معالجة النصوص العربية دفعيًا | `backend/main.py` | grep + pytest |
| 5 | `task-05-add-statevector-norm.yaml` | دالة قياس القاعدة الإقليدية | `frontend/src/core/statevector.ts` | grep + vitest build |

---

## 📊 المقاييس المُجمَّعة / Metrics Collected

| المقياس | الوصف |
|---------|-------|
| **نسبة النجاح** | هل اجتاز الوكيل كل معايير الحكم؟ |
| **التكلفة** | الإنفاق على API لكل تشغيل (حيثما كان متاحاً) |
| **الوقت** | الثواني الفعلية حتى إتمام المهمة |
| **الاتساق** | نسبة النجاح عبر `--runs` تكرارات (مثال: 3/3 = 100%) |

---

## 🏛️ بنية ملفات المهام / Task File Structure

```yaml
name: task-name           # مُعرِّف المهمة
description: |            # وصف بشري
  ...

repo: .                   # مسار المستودع (نسبي أو مطلق)
commit: "abc1234"         # SHA المُثبَّت للتكرارية

files:                    # الملفات التي يُسمح للوكيل بتعديلها
  - path/to/file.ts

prompt: |                 # التعليمات المُرسَلة للوكيل
  ...

judge:                    # معايير الحكم على النجاح
  - type: grep            # البحث عن نمط في الكود
    pattern: "..."
    files:
      - path/to/file.ts

  - type: command         # تشغيل أمر (يجب أن يخرج بقيمة 0)
    command: "..."
```

---

## 🔒 نقاط الإثبات / Commit Pins

كل مهمة مُثبَّتة على commit:

```
0e7175cc81c8558daf14079789af2f030e6e01d9
```

هذا يضمن أن النتائج قابلة للمقارنة حتى لو تطوّرت قاعدة الكود.
لتحديث النقطة بعد merge: استبدل SHA في كل ملف YAML.

---

## 💡 أفضل الممارسات / Best Practices

- **شغّل 3 تكرارات على الأقل** لكل وكيل — الوكلاء غير حتميين
- **استخدم الاختبارات الحتمية** (pytest / vitest) كحكم أساسي
- **تتبع التكلفة** إلى جانب نسبة النجاح — وكيل بـ 95% بتكلفة 10x قد لا يكون الأنسب
- **عامِل ملفات المهام كاختبارات** — ضعها تحت مراقبة Git وارفض التعديلات غير الموثّقة

---

## 🔗 المراجع / References

- **agent-eval**: [github.com/joaquinhuigomez/agent-eval](https://github.com/joaquinhuigomez/agent-eval)
- **اختبارات الواجهة الأمامية**: `cd frontend && npx vitest run`
- **اختبارات الواجهة الخلفية**: `cd backend && APP_ENV=development python -m pytest tests/ -v`
