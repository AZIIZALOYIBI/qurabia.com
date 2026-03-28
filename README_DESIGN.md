# QURABIA UI Design System — Material/Flat (vNext)

هذا التوثيق يشرح نظام التصميم الجديد الذي تم تطبيقه في الواجهة (الوضع النهاري/المظلم، مكوّنات UI، الوصولية، والتصميم المتجاوب).

## 1) نمط التصميم
- **Material/Flat**: أسطح واضحة، ظلال خفيفة، زوايا دائرية، وحالات تفاعل دقيقة (Hover/Focus/Disabled).
- يعتمد على Tokens داخل ملف واحد: [DesignSystem.css](file:///c:/Users/tkssy/OneDrive/ملفات%20الفيديو/سطح%20المكتب/qurabia.com/frontend/src/styles/DesignSystem.css)

## 2) لوحة الألوان (Hex)
الألوان الأساسية/الثانوية (تعمل في الوضعين، مع ضبط سطوع/أسطح مختلف):
- **Primary**: `#7C4DFF`
- **Secondary**: `#00B8D4`
- **Tertiary**: `#FFB300`
- **Error**: `#FF3D71`
- **Success**: `#00E5A8`

خلفيات/أسطح (Dark):
- **Background**: `#0B0D12`
- **Background 2**: `#0F131B`
- **Surface**: `rgba(255,255,255,0.06)`
- **Outline**: `rgba(255,255,255,0.12)`

خلفيات/أسطح (Light):
- **Background**: `#FBFBFF`
- **Background 2**: `#F2F3F8`
- **Surface**: `rgba(0,0,0,0.04)`
- **Outline**: `rgba(0,0,0,0.10)`

## 3) الخطوط (Typography)
- **Arabic UI**: Tajawal
- **Latin UI**: Inter
- **Mono**: JetBrains Mono

## 4) المكوّنات (Buttons / Inputs / Cards / Lists / Tables / Modals)
موجودة كـ CSS primitives:
- Buttons: `.ui-btn` مع `.ui-btn-filled / .ui-btn-tonal / .ui-btn-outlined / .ui-btn-danger`
- Inputs/Selects: `.ui-input`, `.ui-select`, `.ui-field`, `.ui-label`
- Cards: `.ui-card`, `.ui-divider`
- Lists: `.ui-list`, `.ui-list-item`
- Tables: `.ui-table`
- Modal/Overlay: `.ui-modal-backdrop`, `.ui-modal`, `.ui-modal-header`
- Snackbar: `.ui-snackbar`

## 5) الوضع النهاري/المظلم + Accent
- يتم ضبط الثيم عبر: `document.documentElement[data-theme="light|dark"]`
- Accent اختياري عبر: `data-accent="violet|cyan|amber|emerald"`
- يتم حفظ الاختيارات في LocalStorage:
  - `qurabia.uiTheme`
  - `qurabia.themePreset`
  - `qurabia.uiAccent`

## 6) التصميم المتجاوب (Responsive)
المخطط العام `.app-shell`:
- Desktop: Sidebar + Main + Panel
- Tablet: إخفاء panel تلقائيًا
- Mobile: إخفاء sidebar وتحويل main إلى ترتيب عمودي قابل للتمرير

## 7) الحركات (Motion)
- جميع الانتقالات تعتمد على CSS3 + احترام `prefers-reduced-motion`.
- مكوّنات مثل Modal و Snackbar تستخدم `uiFadeIn` و `uiPopIn`.

## 8) الوصولية (WCAG 2.1)
نقاط مطبّقة في الواجهة:
- Skip link: `.skip-link` إلى `#main`
- Focus واضح: `:focus-visible` مع `--focus-ring`
- عناصر التحكم الأساسية تحتوي `aria-label` و/أو `aria-pressed` عند الحاجة
- احترام `prefers-reduced-motion`

## 9) A/B Testing (قياس التحويل والرضا)
تم توفير بنية داخلية للقياس محليًا:
- تعيين Variant عبر `?ab=A` أو `?ab=B` (ويُحفظ في `qurabia.abVariant`)
- تسجيل أحداث (تحويل/رضا) في LocalStorage داخل `qurabia.analytics`
- تصدير البيانات عبر زر “تنزيل القياس” داخل الـTopbar

ملاحظة: تنفيذ اختبار A/B فعلي على **100 مستخدم** يتطلب نشرًا وجمع بيانات حقيقيين (تحليلات/Backend/أداة تجارب). الكود يوفّر القياس داخل التطبيق، لكن لا يمكن للمستودع وحده توفير عيّنة مستخدمين تلقائيًا.

## 10) ملفات التصميم المصدرية (PSD/Sketch/Figma)
المستودع يوفّر:
- Tokens داخل CSS (قابلة للنقل إلى Figma/Sketch عبر Plugins/Tokens import)

ولا يوفّر ملفات PSD/Sketch/Figma جاهزة لأن إنشاء هذه الملفات يتطلب أدوات تصميم خارجية وملفات مصدر غير قابلة للتوليد تلقائيًا داخل الكود.
