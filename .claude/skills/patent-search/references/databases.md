# قواعد بيانات البراءات العالمية | Global Patent Databases
## دليل شامل لكل قاعدة بيانات، قدراتها، وكيفية الاستخدام المتقدم

---

## 1. قواعد البيانات المجانية | Free Databases

### 1.1 Google Patents
**الرابط**: https://patents.google.com  
**التغطية**: 120+ مليون وثيقة، 100+ دولة  
**نقاط القوة**:
- بحث دلالي (Semantic Search) بالذكاء الاصطناعي
- ترجمة فورية لبراءات الصين/اليابان/كوريا
- مجاني وسريع وبدون تسجيل
- ربط ببراءات مستشهد بها (cited/citing)
- تحليل الحالة القانونية (active/expired/pending)

**استعلامات متقدمة:**
```
assignee:(شركة) before:priority:20200101 after:priority:20150101
inventor:(اسم المخترع)
cpc:(H04L63/00)  ← تصنيف محدد
country:(US) language:(en)
status:(GRANT) ← ممنوحة فقط
```

**قيود**: قد تفوتها بعض الوثائق الحديثة جداً، وبعض الأرشيفات القديمة.

---

### 1.2 Espacenet (EPO)
**الرابط**: https://worldwide.espacenet.com  
**التغطية**: 130+ مليون وثيقة  
**نقاط القوة**:
- بيانات عائلة براءات (Patent Family) دقيقة جداً (DOCDB)
- مزود رسمي لـ CPC
- بحث متقدم بـ Smart Search و Classification Search
- تاريخ قانوني دقيق لـ EP documents

**استعلامات متقدمة (Smart Search syntax):**
```
ta="wireless charging" AND ic=H02J AND pd=2020:2024
pa="Samsung" AND pn=EP
ct="electric vehicle" AND st=pending
```

**ميزة INPADOC**: تتبع الحالة القانونية لـ 50+ دولة.

---

### 1.3 WIPO PatentScope
**الرابط**: https://patentscope.wipo.int  
**التغطية**: 100+ مليون وثيقة، أفضل تغطية لـ PCT  
**نقاط القوة**:
- أفضل مصدر لطلبات PCT الدولية
- بحث كيميائي (Chemical Structure Search)
- Cross-lingual Expansion: بحث بلغة يُعطي نتائج بلغات أخرى
- تنزيل مباشر لملفات XML

**استعلامات متقدمة:**
```
FP:(solar energy storage) AND IPC:(H01M)
PA:(Huawei) AND AP:(WO)
PD:[2022-01-01 TO 2024-12-31] AND CL:(artificial intelligence)
```

---

### 1.4 USPTO (United States)
**الرابط البراءات**: https://patents.uspto.gov  
**الرابط طلبات**: https://appft.uspto.gov  
**نقاط القوة**:
- المصدر الأصلي لكل بيانات أمريكية
- وصول كامل لـ File Wrapper (تاريخ الملاحقة)
- Patent Trial and Appeal Board (PTAB) decisions
- Patent Center: الأحدث والأشمل

**استعلام متقدم USPTO (Full Text Search):**
```
TTL/"machine learning" AND ACLM/"neural network" AND APD/20200101->20231231
AANM/"Elon Musk" 
AN/"Tesla, Inc"
```

---

### 1.5 Lens.org
**الرابط**: https://lens.org  
**التغطية**: 125+ مليون وثيقة + نشر أكاديمي  
**نقاط القوة**:
- مجاني بالكامل بلا حدود
- دمج براءات + أوراق علمية (Scholarly Works)
- استخراج بيانات بـ CSV/JSON
- تحليل تنافسي مجاني
- CitedBy / Cites للأوراق العلمية

---

### 1.6 J-PlatPat (اليابان)
**الرابط**: https://j-platpat.inpit.go.jp  
**التغطية**: كل البراءات اليابانية  
**مهم لـ**: تقنيات السيارات، الإلكترونيات، الروبوتات  
**ملاحظة**: يتطلب ترجمة، واجهة معقدة، لكن لا غنى عنه للمجالات اليابانية.

---

### 1.7 CNIPA (الصين)
**الرابط**: https://cpquery.cnipa.gov.cn  
**الرابط إضافي**: https://pss-system.cponline.cnipa.gov.cn  
**التغطية**: 18+ مليون وثيقة  
**مهم جداً**: الصين أصبحت أكبر مُقدِّم براءات في العالم (2022+)  
**بديل أسهل**: Google Patents يوفر ترجمة جيدة للبراءات الصينية.

---

### 1.8 مكاتب إقليمية أخرى

| المكتب | الرابط | التغطية |
|--------|--------|---------|
| ARIPO (أفريقيا) | aripo.org | 19 دولة أفريقية |
| GCC Patent Office | gcc-sg.org | 6 دول خليجية |
| EAPO (يوراسيا) | eapo.org | 9 دول سوفييتية سابقة |
| OAPI (غرب أفريقيا) | oapi.int | 17 دولة أفريقية |
| EUIPO (تصاميم أوروبا) | euipo.europa.eu | الاتحاد الأوروبي |

---

## 2. قواعد البيانات التجارية | Commercial Databases

> هذه الأدوات تُستخدم من محامي براءات محترفين وشركات IP، ميزتها الدقة العالية والتحليلات المتقدمة.

| الأداة | المميز الرئيسي | مناسبة لـ |
|--------|---------------|----------|
| **Derwent Innovation** (Clarivate) | إثراء بيانات الفن السابق | Landscape، FTO |
| **PatSnap** | AI + تحليل المنافسين | Strategy، M&A |
| **Orbit Intelligence** (Questel) | عائلات براءات دقيقة | تحليل قانوني |
| **LexisNexis TotalPatent** | نصوص كاملة + FTO | مكاتب القانون |
| **Minesoft PatBase** | بحث عميق متعدد اللغات | R&D |
| **Innography** | مقاييس قوة البراءة | M&A، Licensing |

---

## 3. قواعد بيانات الأدوية والتقنيات الحيوية

| القاعدة | الاختصاص |
|---------|---------|
| Orange Book (FDA) | أدوية مُعتمدة + براءاتها |
| Purple Book (FDA) | البيولوجية + biosimilars |
| PatentLens | علوم الحياة + أدوات مفتوحة |
| DrugPatentWatch | انتهاء براءات الأدوية |
| STN Global | CAS + كيمياء عميقة |

---

## 4. البحث في الفن السابق غير البراءتي | Non-Patent Literature (NPL)

**مهم جداً**: الفن السابق لا يقتصر على البراءات!

| المصدر | الاستخدام |
|--------|----------|
| Google Scholar | أوراق علمية أكاديمية |
| IEEE Xplore | تقنية وهندسة |
| PubMed / NCBI | علوم حياة وطب |
| arXiv | فيزياء، رياضيات، حاسب |
| ACM Digital Library | علوم الحاسوب |
| Springer / Elsevier | نشر علمي شامل |
| Internet Archive | نشر إلكتروني تاريخي |
| YouTube/Vimeo | عروض وإعلانات تجارية سابقة |
| منتديات تقنية قديمة | Stack Overflow، Reddit، GitHub |

---

## 5. التحقق من الحالة القانونية | Legal Status Verification

| الأداة | الاستخدام |
|--------|----------|
| INPADOC (عبر Espacenet) | حالة 50+ دولة |
| Google Patents "Legal Events" | سريع وشامل |
| USPTO Patent Center | الأمريكية بالتفصيل |
| WIPO PATENTSCOPE Legal Status | PCT والوطنية |
| national office websites | الأكثر دقة لكل دولة |

**حالات البراءة الممكنة:**
- `Active/In Force` — سارية، انتبه!
- `Expired` — منتهية بطبيعي بعد 20 سنة
- `Lapsed` — سقطت لعدم دفع رسوم التجديد
- `Revoked` — أُبطلت قانونياً
- `Abandoned` — تُرك الطلب
- `Pending` — طلب قيد الفحص
- `Granted` — مُمنحة وسارية
