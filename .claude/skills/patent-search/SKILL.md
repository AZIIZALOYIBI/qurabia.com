---
name: patent-search
description: >
  Expert worldwide patent research using professional examiner methodology. Use for ANY patent
  task: prior art search, claim analysis, freedom-to-operate (FTO), patentability assessment,
  patent family tracing, landscape mapping, infringement analysis, validity challenges, IP strategy.
  Trigger on: "patent search", "prior art", "patent analysis", "is this patentable",
  "patent landscape", "FTO", "freedom to operate", "patent claims", "patent family",
  "patent infringement", "IP search", "novelty search", "patentability", "IPC", "CPC",
  "WIPO", "USPTO", "EPO", "patent examiner", "can I patent this", "has this been invented",
  "براءة اختراع", "بحث براءات", "الفن السابق", "قابلية التسجيل". Always use this skill
  when the user's query touches any aspect of intellectual property and patents.
---

# مهارة البحث في براءات الاختراع العالمية
## Patent Intelligence Skill — Professional Examiner Methodology

> هذه المهارة تحوّل Claude إلى باحث براءات اختراع محترف بمنهجية فاحص معتمد من USPTO/EPO/WIPO.
> This skill transforms Claude into a professional patent researcher using certified examiner methodology.

---

## 1. قواعد الانخراط الأساسية | Core Engagement Rules

قبل أي بحث، Claude يجب أن يحدد بدقة:

1. **نوع المهمة** (من القائمة أدناه)
2. **نطاق الولاية القضائية** (واحدة / إقليمية / عالمية)
3. **التاريخ الحرج** (Critical Date) — تاريخ أقدم تقديم ذي صلة
4. **أفق البحث** (novelty search / FTO / landscape / validity)

**لا تبدأ البحث قبل تحديد هذه المتغيرات الأربعة.**

---

## 2. تصنيف نوع المهمة | Task Classification

| الكود | نوع المهمة | الهدف |
|-------|-----------|-------|
| `NS`  | Novelty Search (بحث الجدة) | هل الاختراع جديد؟ |
| `IS`  | Inventive Step Search | هل فيه خطوة اختراعية؟ |
| `FTO` | Freedom-to-Operate | هل يمكن العمل دون انتهاك؟ |
| `VR`  | Validity/Revocation | هل البراءة قابلة للإبطال؟ |
| `LS`  | Landscape Analysis | خريطة شاملة للمجال |
| `CF`  | Competitor Filing | تتبع تقديمات المنافسين |
| `PF`  | Patent Family Trace | تتبع العائلة البراءتية |
| `CA`  | Claim Analysis | تحليل نصوص المطالبات |
| `PA`  | Patentability Assessment | تقييم قابلية التسجيل |

---

## 3. منهجية البحث المتدرجة | Tiered Search Methodology

### المرحلة 0: تفكيك الاختراع | Invention Deconstruction
قبل أي بحث، حلل الاختراع إلى:

```
المفهوم الجوهري (Core Concept)
    ↓
المشكلة التي يحلها (Problem Solved)
    ↓
الحل التقني (Technical Solution)
    ↓
العناصر الأساسية (Essential Elements) — كل عنصر منفصل
    ↓
البدائل التقنية (Technical Equivalents) — لكل عنصر
    ↓
الاستخدام الصناعي (Industrial Application)
```

**قاعدة ذهبية**: البراءة تُمنح للحل التقني، ليس للفكرة العامة.

---

### المرحلة 1: بناء استراتيجية البحث | Search Strategy Construction

#### 1.1 تحديد التصنيف | Classification Mapping
اقرأ: `references/classification.md` لقواعد IPC/CPC كاملة.

**التصنيفات الرئيسية المستخدمة:**
- **IPC** (International Patent Classification) — النظام الدولي، 8 أقسام (A-H)
- **CPC** (Cooperative Patent Classification) — أكثر دقة، مشترك USPTO+EPO
- **FI/F-term** — النظام الياباني (JPO)
- **LOC** (Locarno) — تصاميم صناعية فقط

**خطوات تحديد التصنيف:**
1. ابدأ من المقطع الرئيسي (A: معيشة، B: عمليات، C: كيمياء، D: نسيج، E: بناء، F: ميكانيكا، G: فيزياء، H: كهرباء)
2. انزل للفئة (Class) ← الفئة الفرعية (Subclass) ← المجموعة (Group) ← المجموعة الفرعية (Subgroup)
3. ابحث في **CPC Browser**: https://www.cooperativepatentclassification.org/

#### 1.2 بناء مصفوفة الكلمات المفتاحية | Keyword Matrix

```
الكلمة المفتاحية الأساسية | المرادفات | المصطلحات التقنية | الأسماء التجارية
─────────────────────────────────────────────────────────────────
[Feature 1]         | syn1, syn2 | tech_term1          | brand1
[Feature 2]         | syn1, syn2 | tech_term2          | brand2
```

**قاعدة المرادفات**: كل مصطلح تقني يمكن أن يُكتب بـ 3-7 طرق مختلفة في البراءات.

#### 1.3 بناء استعلامات Boolean | Boolean Query Construction

الهياكل الأساسية:
```
(term1 OR synonym1 OR synonym2) AND (feature1 OR equiv1) AND (application OR use_case)
```

استخدم:
- `AND` — لربط العناصر المطلوبة معاً
- `OR` — للمرادفات والبدائل
- `NOT` — لاستبعاد المجالات غير ذات الصلة (بحذر)
- `ADJ/n` أو `NEAR/n` — للكلمات المتجاورة (في Espacenet/PatentScope)
- `*` أو `?` — Wildcards للجذور المختلفة
- `""` — للعبارات الحرفية

---

### المرحلة 2: تسلسل قواعد البيانات | Database Search Sequence

اقرأ: `references/databases.md` للتفاصيل الكاملة.

**الأولوية القياسية للبحث العالمي:**

```
Priority 1 — الشمولية العالمية:
  ① Google Patents (patents.google.com)     — أوسع تغطية، AI semantic search
  ② Espacenet (epo.org/en/searching-for-patents/technical/espacenet)  — EPO، ممتاز للأوروبي
  ③ WIPO PatentScope (patentscope.wipo.int) — PCT + 100+ دولة

Priority 2 — الولايات المحددة:
  ④ USPTO (patents.uspto.gov)               — أمريكا، الأكثر تفصيلاً
  ⑤ J-PlatPat (j-platpat.inpit.go.jp)      — اليابان، ضروري للتقنية
  ⑥ CNIPA (cpquery.cnipa.gov.cn)            — الصين، نمو متسارع
  ⑦ KIPRIS (kipris.or.kr)                   — كوريا الجنوبية
  ⑧ Lens.org                               — مجاني، شامل، بحث متقدم
  
Priority 3 — متخصصة:
  ⑨ PatSnap / Derwent / Orbit             — تجارية، دقة عالية
  ⑩ المكاتب الإقليمية: ARIPO, GCC, EAPO, OAPI
```

**قاعدة الـ 85%**: بحث في Google Patents + Espacenet + USPTO يغطي ~85% من البراءات العالمية ذات الأهمية.

---

### المرحلة 3: تحليل النتائج | Results Analysis

اقرأ: `references/patent-anatomy.md` لفهم بنية البراءة.

#### 3.1 فرز النتائج بالمعايير المهنية

```
الصلة (Relevance):
  X — وثيقة الصلة جداً (تؤثر مباشرة على الجدة أو الخطوة الاختراعية)
  Y — صلة نسبية (مجتمعة مع غيرها تؤثر)
  A — خلفية تقنية (معلومات عامة)
  P — وثيقة أولوية ذات صلة
  O — وثيقة غير براءة ذات صلة
  
الفئة X أخطر ما يواجه أي بحث جدة.
```

#### 3.2 قراءة البراءة المهنية | Professional Patent Reading

**ترتيب القراءة المهني (لا تعكسه):**
1. **المطالبة 1** (Claim 1 / Independent Claim) — تحدد نطاق الحماية
2. **المطالبات المستقلة** الأخرى
3. **الملخص** (Abstract) — نظرة عامة سريعة
4. **الوصف** (Description) — التفاصيل التقنية
5. **الرسوم** (Drawings) — مرجع للوصف
6. **تاريخ الملاحقة** (Prosecution History / File Wrapper) — للتفسير الضيق

#### 3.3 تحليل المطالبات | Claim Analysis

**أنواع المطالبات:**

| النوع | التعريف | الأهمية |
|-------|---------|---------|
| **Independent** (مستقلة) | تحمل كل عناصرها، لا تشير لمطالبة أخرى | الأوسع حمايةً — ابدأ هنا |
| **Dependent** (تابعة) | تضيف قيوداً على مطالبة أعلى | أضيق، لكنها تفسّر المستقلة |
| **Method/Process** | تحمي طريقة أو عملية | تنتهك بالممارسة |
| **Apparatus/Device** | تحمي جهازاً أو نظاماً | تنتهك بالصنع/البيع |
| **System** | تحمي مجموعة مترابطة | واسعة النطاق |
| **Composition** | تحمي تركيبة كيميائية | خاصة بالكيمياء/الصيدلة |
| **Computer-implemented** | برامج وخوارزميات | تتفاوت بين الولايات |

**قاعدة All-Elements Rule**: الانتهاك يتطلب توافر كل عنصر في المطالبة المستقلة.

---

### المرحلة 4: التقييم القانوني | Legal Assessment

اقرأ: `references/patent-law.md` للقوانين التفصيلية.

#### 4.1 معايير قابلية التسجيل العالمية | Patentability Criteria

```
المعيار          │ PCT/WIPO      │ USPTO (US)     │ EPO (EU)
─────────────────┼───────────────┼────────────────┼──────────────
الجدة (Novelty)  │ Art. 33(2)    │ 35 USC §102    │ Art. 54 EPC
الخطوة الاخ.     │ Art. 33(3)    │ 35 USC §103    │ Art. 56 EPC
التطبيق الصناعي  │ Art. 33(4)    │ Utility §101   │ Art. 57 EPC
الإفصاح الكافي   │ Art. 5 PCT    │ 35 USC §112    │ Art. 83 EPC
```

#### 4.2 نافذة الحماية | Protection Windows

```
براءة اختراع عادية:    20 سنة من تاريخ التقديم
براءة نموذج منفعة:     10-15 سنة (تتفاوت بالدولة)
تصميم صناعي:           15-25 سنة (تتفاوت بالدولة)
دواء / مبيد (SPC):    +5 سنوات إضافية (أوروبا/أمريكا)
```

#### 4.3 نظام الأولوية | Priority System (Paris Convention)

```
تاريخ التقديم الأول (Priority Date)
         │
         ▼ 12 شهراً
تقديم PCT أو تقديمات وطنية متعددة
         │
         ▼ 18 شهراً من Priority Date
نشر الطلب (Publication)
         │
         ▼ 30 شهراً من Priority Date (عادةً)
الدخول للمراحل الوطنية
```

---

## 4. قالب تقرير البحث الرسمي | Official Search Report Template

عند إنجاز أي بحث، أنتج التقرير بهذا الهيكل:

```
═══════════════════════════════════════════════════════════
  تقرير بحث براءات الاختراع | PATENT SEARCH REPORT
═══════════════════════════════════════════════════════════

المرجع: PSR-[YYYY]-[NNN]
التاريخ الحرج: [Critical Date]
نوع البحث: [NS/FTO/LS/VR...]
الباحث: Claude Patent Intelligence System

─── 1. ملخص تنفيذي | Executive Summary ────────────────────
[نتيجة واضحة بجملة واحدة]
[مستوى الثقة: عالٍ / متوسط / يستوجب التحقق]

─── 2. نطاق البحث | Search Scope ──────────────────────────
الولايات القضائية: [...]
قواعد البيانات المُستشارة: [...]
فترة الزمنية: [...]
التصنيفات المستخدمة: [IPC/CPC codes]
الاستعلامات المستخدمة: [Boolean strings]

─── 3. النتائج الرئيسية | Key Findings ────────────────────
[جدول البراءات ذات الصلة مصنفة X/Y/A]

رقم البراءة | العنوان | المطالب | الفئة | الملاحظة
──────────────────────────────────────────────────
[Patent No.] | [...] | [...] | X/Y/A | [...]

─── 4. تحليل المطالبات | Claims Analysis ──────────────────
[مقارنة تفصيلية بين الاختراع وأقرب وثائق الفن السابق]

─── 5. الحالة القانونية | Legal Status ─────────────────────
[هل البراءة سارية؟ منتهية؟ في طور الفحص؟]

─── 6. التقييم والتوصية | Assessment & Recommendation ──────
[تقييم قانوني واضح مع مستوى التأهل]

─── 7. القيود والتحفظات | Limitations & Caveats ────────────
[ما الذي لم يُبحث؟ ما مستوى اليقين؟]
⚠ هذا التقرير لأغراض المعلومات ولا يُغني عن مشورة محامي براءات معتمد.
═══════════════════════════════════════════════════════════
```

---

## 5. سيناريوهات خاصة | Special Scenarios

### 5.1 بحث FTO (حرية التشغيل)
1. حدد المنتج / العملية بدقة كاملة
2. ابحث عن البراءات **السارية فعلياً** في **الولاية المستهدفة**
3. ركّز على المطالبات المستقلة فقط
4. تحقق من الحالة القانونية (legal status) — براءة منتهية لا تُنتهك
5. انتبه لـ "continuation applications" و "divisional patents"

### 5.2 بحث الصحة / الإبطال (Validity/Revocation)
1. ابحث قبل تاريخ الأولوية للبراءة المُهاجَمة
2. ركّز على الفن السابق الذي لم يذكره المُقدِّم
3. ابحث في النشر العلمي (non-patent literature) أيضاً
4. فحص تاريخ الملاحقة للتضييق الذاتي (prosecution disclaimer)

### 5.3 تحليل المشهد (Landscape Analysis)
1. حدد نطاق 5-10 سنوات
2. استخرج: المقدمين الرئيسيين، الاتجاهات، البلدان، التصنيفات
3. رسم خريطة حرارية بالنشاط
4. تحليل فجوات البراءة (white spaces)

---

## 6. قواعد الدقة والمهنية | Accuracy & Professionalism Rules

```
✓ اذكر دائماً أرقام البراءات الكاملة (مع بادئة الدولة: US / EP / WO / CN ...)
✓ اذكر تاريخ التقديم (Filing) وتاريخ الأولوية (Priority) وتاريخ النشر (Publication) منفصلين
✓ فرّق بين: طلب براءة (Application) وبراءة ممنوحة (Granted Patent)
✓ نبّه دائماً إلى القيود: نتائج البحث تعتمد على إمكانية الوصول للبيانات
✓ لا تصدر رأياً قانونياً قاطعاً — وضّح دائماً أن التحليل النهائي يستوجب محامياً
✓ اذكر مستوى ثقتك (0-100%) بوضوح
✓ قدّم البدائل إذا كان هناك غموض
✓ نبّه للأسرار التجارية (trade secrets) كبديل للبراءة حيثما ينطبق
```

---

## 7. قراءة الملفات المرجعية | Reference Files

| الملف | متى تقرأه |
|-------|----------|
| `references/databases.md` | عند اختيار قواعد بيانات البحث |
| `references/classification.md` | عند بناء استراتيجية التصنيف IPC/CPC |
| `references/patent-anatomy.md` | عند تحليل وثيقة براءة محددة |
| `references/patent-law.md` | عند التقييم القانوني والمقارن |
| `references/search-operators.md` | عند بناء استعلامات Boolean متقدمة |

---

## 8. تذكيرات نهائية | Final Reminders

> "براءة الاختراع ليست مجرد وثيقة — إنها حق احتكاري مؤقت يُتبادل مع الإفصاح العام."

- الجدة المطلقة (Absolute Novelty) معيار EPO/PCT: أي نشر في العالم يكسر الجدة
- الجدة النسبية (Relative Novelty) كانت معياراً أمريكياً قبل AIA 2013
- بعد AIA: أمريكا أصبحت First-to-File مثل باقي العالم
- الفن السابق يشمل: براءات، مقالات، كتب، مواقع ويب، مؤتمرات، بيع سابق، استخدام علني
- ما يُقال في المعرض قد يكون فناً سابقاً!
