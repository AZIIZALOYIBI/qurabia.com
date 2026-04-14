# 🧠 Sentient Core v2.0 — النواة الواعية

> **وكيل ذكاء اصطناعي مستقل** لتوليد الكود ومحاكاة التطبيقات قبل النشر  
> مدمج في منصة QURABIA ضمن `backend/sentient_core/`

---

## البنية المعمارية

```
backend/sentient_core/
├── core_brain/              # النواة الواعية
│   ├── main.py              # SentientCore: ينسق كل المراحل
│   ├── architect.py         # Architect: يصمم المخطط المعماري (LLM)
│   ├── coder.py             # Coder: يكتب الكود وتصحيح الأخطاء
│   ├── validator.py         # Validator: يفحص الكود محلياً
│   ├── security_shield.py   # SecurityShield: يرفض المهام الخطيرة
│   └── memory.py            # GeneticMemory: ذاكرة دائمة عبر الجلسات
│
├── phantom_sandbox/         # الساندبوكس الشبحي (7 طبقات)
│   ├── phantom_manager.py   # PhantomSandboxManager: المنسق الرئيسي
│   ├── container_nursery.py # ContainerNursery: بناء وتشغيل الحاوية
│   ├── phantom_probes.py    # PhantomProbes: اختبار نقاط النهاية
│   ├── memory_analyzer.py   # MemoryAnalyzer: كشف تسرب الذاكرة
│   ├── chaos_engine.py      # ChaosEngine: حقن أعطال مقصودة
│   ├── behavior_oracle.py   # BehaviorOracle: مقارنة مع الـ baseline
│   ├── immune_system.py     # DigitalImmuneSystem: الحكم النهائي
│   └── autopsy.py           # PhantomAutopsy: تشريح عند الفشل
│
└── ai_genome/
    └── experiences.json     # ذاكرة التجارب الجينية
```

---

## دورة تنفيذ المهمة

```
Issue/Task
    │
    ▼
🛡️ Security Shield     ← رفض المهام الخطيرة
    │
    ▼
🧬 Genetic Memory      ← استدعاء التجارب السابقة
    │
    ▼
📐 Architect (LLM)     ← تصميم المخطط المعماري
    │
    ▼
💻 Coder (LLM)         ← كتابة الكود
    │
    ▼
🔍 Validator           ← lint + tests محلية
    │ (فشل → تصحيح تلقائي × 3)
    ▼
👻 Phantom Sandbox     ← محاكاة في حاوية Docker
    ├── 🏗️ Birth        (بناء + تشغيل)
    ├── 🎯 Probes       (اختبار نقاط النهاية)
    ├── 🧠 Memory       (كشف تسرب)
    ├── 💪 Stress       (اختبار إجهاد)
    ├── 🌪️ Chaos        (حقن أعطال)
    ├── 🔮 Oracle       (مقارنة سلوكية)
    └── 🦠 Immune       (الحكم: CLEAN/WARN/BLOCK)
    │
    ▼
📤 Pull Request        ← مع تقرير الساندبوكس
```

---

## الاستخدام

### عبر GitHub Actions

```yaml
# يدوياً من GitHub UI:
# Actions → "Sentient Core v2.0" → Run workflow → أدخل وصف المهمة

# أو تلقائياً عند تسمية Issue بـ "sentient":
# يأخذ عنوان الـ Issue كوصف المهمة
```

### برمجياً في Python

```python
import sys
sys.path.insert(0, 'backend/sentient_core')

from core_brain.main import SentientCore

core = SentientCore()
success = core.execute_task(
    task="أضف endpoint جديد /api/users يعيد قائمة المستخدمين",
    branch_name="feature/users-endpoint",
    repo_path="."
)
```

---

## متطلبات البيئة

```bash
# متغيرات البيئة المطلوبة:
OPENAI_API_KEY=sk-...        # لتوليد الكود (اختياري - يعمل بدونه)
GITHUB_TOKEN=ghp_...         # لإنشاء PRs
GITHUB_REPOSITORY=owner/repo # اسم المستودع

# تثبيت التبعيات:
pip install openai PyGithub flake8 pytest psutil

# Docker مطلوب للساندبوكس الشبحي
docker --version
```

---

## الأمان

- **SecurityShield** يرفض أي مهمة تحتوي على أنماط خطيرة
- الحاويات الشبحية **معزولة** بشبكة `phantom_net` خاصة
- حدود الموارد: `512MB RAM`, `1 CPU`, `100 PIDs`
- نظام ملفات **للقراءة فقط** (`--read-only`)
- جميع الملفات الشبحية تُحذف تلقائياً بعد الاختبار

---

## الذاكرة الجينية

يخزن النظام كل تجربة (مهمة + خطأ + حل) في `ai_genome/experiences.json`.  
في المرة القادمة بمهمة مشابهة، يستدعي هذه التجارب لتجنب نفس الأخطاء.

---

*مصدر الكود: [AZIIZALOYIBI/3z](https://github.com/AZIIZALOYIBI/3z)*
