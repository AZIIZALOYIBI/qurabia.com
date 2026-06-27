# مشغّلات البحث المتقدم | Advanced Search Operators
## بناء استعلامات بحث براءات احترافية

---

## 1. المشغّلات الأساسية عبر المنصات

| المشغّل | المعنى | مثال |
|---------|--------|------|
| `AND` | كلا الشرطين | `battery AND charging` |
| `OR` | أي من الشرطين | `battery OR cell OR accumulator` |
| `NOT` / `AND NOT` | استثناء | `wireless NOT Bluetooth` |
| `( )` | تجميع | `(solar OR photovoltaic) AND storage` |
| `"..."` | عبارة حرفية | `"machine learning model"` |
| `*` | Wildcard متعدد الأحرف | `charg*` يطابق charging, charger, charged |
| `?` | حرف واحد | `col?r` يطابق color, colour |
| `$` | لاحقة اختيارية | نادر الاستخدام |

---

## 2. مشغّلات القرب | Proximity Operators

### Espacenet / ep.espacenet.com:
```
NEAR/n  ← الكلمتان ضمن n كلمة، أي ترتيب
ADJ/n   ← الكلمتان ضمن n كلمة، بالترتيب
PRE/n   ← الكلمة الأولى تسبق الثانية بـ n كلمة

مثال:
  neural NEAR/3 network
  machine ADJ/2 learning
  deep PRE/2 learning
```

### WIPO PatentScope:
```
[TERM1] NEAR [TERM2]     ← ضمن 10 كلمات
[TERM1] NEAR5 [TERM2]    ← ضمن 5 كلمات
```

### Lens.org:
```
"term1 term2"~5    ← proximity بـ ~n
```

---

## 3. بحث حقل محدد | Field-Specific Search

### Google Patents:
```
title:(autonomous vehicle)             ← في العنوان
abstract:(neural network)              ← في الملخص
claims:(wireless charging)             ← في المطالبات
description:(solid state battery)      ← في الوصف
assignee:(Apple Inc)                   ← المالك
inventor:("Elon Musk")                ← المخترع
cpc:(H02J7/00)                        ← التصنيف
before:priority:20240101              ← قبل تاريخ محدد
after:filing:20200101                 ← بعد تاريخ تقديم
country:(US OR EP OR WO)             ← الدولة
status:(GRANT)                        ← ممنوحة
language:(en)                         ← اللغة
```

### Espacenet (Smart Search):
```
ta=(autonomous vehicle)               ← title/abstract
cl=(H02J)                            ← classification
pa=(Apple)                           ← patent applicant
in=(Jobs,Steve)                      ← inventor
ap=(EP OR WO)                        ← application type
pd=2020:2024                         ← publication date range
pn=US                                ← patent number starts with
```

### USPTO (Full Text):
```
TTL/"machine learning"                ← title
ABST/neural AND ABST/network          ← abstract
ACLM/blockchain                       ← claims
SPEC/autonomous                       ← specification
AN/"Tesla, Inc"                       ← assignee name
IN/"Musk, Elon"                       ← inventor name
APD/20200101->20231231               ← app date range
ISD/20220101->20231231               ← issue date range
CPC/G06N20                           ← CPC classification
```

### WIPO PatentScope:
```
FP:(autonomous driving)              ← full text + priority claims
BI:(wireless power)                  ← bibliographic
CL:(H02J50)                         ← classification
PA:(Qualcomm)                       ← patent applicant
IN:(Viterbi,Andrew)                 ← inventor
PD:[2022-01-01 TO 2024-12-31]       ← date range
AP:(WO OR US OR EP)                 ← office filter
```

---

## 4. بناء استعلام شامل خطوة بخطوة

### مثال: اختراع "نظام شحن لاسلكي للسيارات الكهربائية"

**الخطوة 1: تحليل المكونات**
```
المكون الرئيسي: شحن لاسلكي
المجال: مركبات كهربائية
التقنية: انتقال طاقة بالحث المغناطيسي
التطبيق: موقف سيارات / طريق
```

**الخطوة 2: بناء مصفوفة المصطلحات**
```
العمود A (الشحن اللاسلكي):
  wireless charging, inductive charging, contactless charging,
  resonant charging, WPT (wireless power transfer),
  IPT (inductive power transfer), DWPT (dynamic WPT)

العمود B (المركبات الكهربائية):
  electric vehicle, EV, BEV (battery EV), plug-in vehicle,
  automobile, car, transportation, road vehicle

العمود C (الآلية):
  magnetic induction, electromagnetic resonance,
  primary coil, secondary coil, pickup coil,
  resonance coil, transmitter coil, receiver coil
```

**الخطوة 3: بناء الاستعلام**
```
استعلام واسع (للاستكشاف):
(("wireless charging" OR "inductive charging" OR "wireless power transfer") 
AND ("electric vehicle" OR "EV" OR "electric car"))

استعلام تصنيف:
CPC:(B60L53/12 OR B60L53/10 OR H02J50/10)

استعلام مدمج:
(wireless OR inductive OR contactless) AND (charging OR power) 
AND (vehicle OR car OR automobile OR EV) 
AND (H02J OR B60L)
```

**الخطوة 4: تحسين النتائج**
```
إذا كثرت النتائج (>500): أضف قيوداً
إذا قلّت النتائج (<20): وسّع بـ OR وأقل التصنيفات
```

---

## 5. استعلامات بالتصنيف فقط (Classification-Only Search)

```
استراتيجية "تصنيف + فترة زمنية":
CPC:(H02J50/00) AND year:2018:2024
IPC:(H02J) AND PD:[2020 TO 2024]

فائدة:
  تجد براءات بمصطلحات نادرة أو غير متوقعة
  ضرورية للمجالات بلغات متعددة (صيني، ياباني، كوري)
```

---

## 6. بحث البيانات الببليوغرافية (Non-Text Search)

### بحث شركة محددة:
```
Google Patents: assignee:(SAMSUNG ELECTRONICS)
Espacenet: pa=SAMSUNG
          pa=SAMSUNG ELECTRONICS CO AND cl=H04W

تحذير: اسم الشركة قد يتغير!
  "Apple Computer" → "Apple Inc"
  "Google Inc" → "Google LLC"
  يُفضل استخدام Duns Number أو tax ID للدقة
```

### بحث مخترع محدد:
```
Google Patents: inventor:("Jobs, Steve")
USPTO: IN/"Jobs; Steven"

تحذير: تهجئة متعددة، أسماء مكررة!
  البحث بالشركة + المخترع معاً أكثر دقة
```

---

## 7. بحث الاقتباسات | Citation Search Strategy

```
Forward Citation (من استشهد بها):
  → يكشف التطوير اللاحق لهذا الاختراع
  → مهم لـ Landscape و Validity
  في Google Patents: "Cited by" section
  في Espacenet: "Cited by" tab
  في Lens.org: Citing Patents

Backward Citation (ما استشهدت به):
  → يكشف الفن السابق المُعترف به من المُقدِّم نفسه
  → مفيد للبدء من براءة ذات صلة وتوسيع البحث
  في كل قواعد البيانات: References / Prior Art

استراتيجية Pearl Growing:
  1. ابدأ ببراءة واحدة ذات صلة عالية (Pearl)
  2. تتبع Forward Citations → تجد أحدث الأعمال
  3. تتبع Backward Citations → تجد الأساس
  4. كرر من كل براءة جديدة ذات صلة
```

---

## 8. التحقق الذاتي | Search Validation

بعد إنجاز البحث، تحقق:

```
✓ هل بحثت في ≥ 3 قواعد بيانات؟
✓ هل استخدمت بحث CPC/IPC مستقل عن الكلمات المفتاحية؟
✓ هل بحثت بالمصطلحات غير الإنجليزية (صيني/ياباني/كوري) عبر Google Patents?
✓ هل تحققت من براءات النماذج (Utility Models) وليس فقط الاختراعات؟
✓ هل بحثت في الأوراق العلمية (NPL) بجانب البراءات؟
✓ هل تحققت من حالة كل براءة مهمة (سارية/منتهية/في طور الفحص)؟
✓ هل الفترة الزمنية لبحثك تغطي 20+ سنة ماضية على الأقل؟
✓ هل سجّلت الاستعلامات المستخدمة للمراجعة؟
```
