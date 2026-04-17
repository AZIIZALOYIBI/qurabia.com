# 🚀 QURABIA v4.7 — دليل المطور

دليل شامل للتطوير على منصة QURABIA v4.7 مع نظام التصميم المستوحى من Claude.

---

## 📋 جدول المحتويات

1. [بيئة التطوير](#بيئة-التطوير)
2. [نظام التصميم](#نظام-التصميم)
3. [المكونات](#المكونات)
4. [أفضل الممارسات](#أفضل-الممارسات)
5. [الاختبار](#الاختبار)
6. [النشر](#النشر)

---

## 🛠️ بيئة التطوير

### المتطلبات الأساسية

```bash
Node.js: >= 18.0.0
npm: >= 9.0.0
Python: >= 3.11
Git: >= 2.40.0
```

### الإعداد الأولي

```bash
# استنساخ المستودع
git clone https://github.com/AZIIZALOYIBI/qurabia.com.git
cd qurabia.com

# تثبيت تبعيات الواجهة الأمامية
cd frontend
npm install

# تثبيت تبعيات الواجهة الخلفية
cd ../backend
pip install -r requirements.txt

# إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env بقيمك الخاصة
```

### تشغيل بيئة التطوير

#### الطريقة 1: Docker Compose (موصى به)
```bash
docker compose up
# الواجهة الأمامية: http://localhost:5173
# الخلفية: http://localhost:10000
```

#### الطريقة 2: يدوياً
```bash
# في نافذة طرفية أولى - الواجهة الأمامية
cd frontend
npm run dev

# في نافذة طرفية ثانية - الخلفية
cd backend
uvicorn main:app --reload --port 10000
```

---

## 🎨 نظام التصميم

### نظرة عامة

QURABIA v4.7 يستخدم نظام تصميم مخصص مستوحى من ألوان Claude الدافئة.

### الملفات الرئيسية

```
frontend/src/styles/
├── ClaudeDesignSystem.css  # نظام التصميم الرئيسي
└── DesignSystem.css         # النظام القديم (للتوافق)
```

### استخدام نظام التصميم

#### 1. استيراد نظام التصميم

```tsx
// في مكون React
import '../styles/ClaudeDesignSystem.css';
```

#### 2. استخدام المتغيرات

```css
/* في CSS أو styled-components */
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--r-3);
  padding: var(--sp-4);
  box-shadow: var(--sh-soft);
}
```

#### 3. استخدام الـ Utility Classes

```tsx
<div className="container">
  <div className="card">
    <h2 className="font-display text-primary">عنوان</h2>
    <p className="text-secondary">وصف</p>
    <button className="btn">إجراء</button>
  </div>
</div>
```

### لوحة الألوان

#### Light Mode (الوضع الفاتح)
```css
--cl-cream: #FAF9F7         /* خلفية رئيسية */
--cl-cream-dark: #F5F2ED    /* خلفية ثانوية */
--cl-orange: #D97757         /* لون مميز أساسي */
--cl-brown: #9B6B3A          /* لون مميز ثانوي */
--cl-text-primary: #1C1917   /* نص رئيسي */
```

#### Dark Mode (الوضع الداكن)
```css
--cl-warm-dark: #1C1917      /* خلفية رئيسية */
--cl-orange-vibrant: #E88965 /* لون مميز أساسي */
--cl-cream: #FAF9F7          /* نص رئيسي */
```

### Typography (الطباعة)

#### الخطوط
```css
--font-ar: 'Readex Pro'      /* النص العربي */
--font-display: 'Reem Kufi'  /* العناوين */
--font-mono: 'JetBrains Mono' /* الكود */
```

#### أحجام الخطوط (Fluid Typography)
```css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem)
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)
```

### Spacing (المسافات)

```css
--sp-1: 4px    /* صغير جداً */
--sp-2: 8px    /* صغير */
--sp-3: 12px   /* صغير-متوسط */
--sp-4: 16px   /* متوسط */
--sp-5: 24px   /* متوسط-كبير */
--sp-6: 32px   /* كبير */
--sp-7: 40px   /* كبير جداً */
--sp-8: 48px   /* ضخم */
```

### Motion (الحركة)

```css
/* دوال التسارع */
--ease-standard: cubic-bezier(0.2, 0, 0, 1)
--ease-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1)
--ease-claude: cubic-bezier(0.12, 0.72, 0.18, 0.99)

/* المدة */
--dur-1: 120ms   /* سريع جداً */
--dur-2: 180ms   /* سريع */
--dur-3: 240ms   /* متوسط */
--dur-4: 400ms   /* بطيء */
```

### تبديل الثيمات

```tsx
// تبديل يدوي للثيم
const [theme, setTheme] = useState<'light' | 'dark'>('light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);

// زر التبديل
<button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
  {theme === 'light' ? '🌙' : '☀️'}
</button>
```

---

## 🧩 المكونات

### إنشاء مكون جديد

#### بنية الملف
```
frontend/src/components/
└── MyComponent/
    ├── MyComponent.tsx       # المكون الرئيسي
    ├── MyComponent.test.tsx  # الاختبارات
    └── index.ts              # نقطة التصدير
```

#### قالب مكون أساسي

```tsx
/**
 * MyComponent - وصف المكون
 * @version 4.7
 */

import React from 'react';
import '../styles/ClaudeDesignSystem.css';

interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  description,
  onAction
}) => {
  return (
    <div className="my-component card">
      <h2 className="font-display">{title}</h2>
      {description && <p className="text-secondary">{description}</p>}
      {onAction && (
        <button className="btn" onClick={onAction}>
          إجراء
        </button>
      )}
    </div>
  );
};

export default MyComponent;
```

### مكونات UI الأساسية

#### Button (زر)
```tsx
<button className="btn">زر أساسي</button>
<button className="btn-secondary">زر ثانوي</button>
<button className="btn-ghost">زر شفاف</button>
```

#### Card (بطاقة)
```tsx
<div className="card">
  <h3>عنوان البطاقة</h3>
  <p>محتوى البطاقة</p>
</div>

<div className="card-glass">
  <h3>بطاقة زجاجية</h3>
  <p>مع تأثير glass morphism</p>
</div>
```

#### Badge (شارة)
```tsx
<span className="badge">جديد</span>
<span className="badge badge-secondary">v4.7</span>
```

---

## ✅ أفضل الممارسات

### TypeScript

```typescript
// ✅ جيد: أنواع صريحة
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): Promise<User> => {
  // ...
};

// ❌ سيء: استخدام any
const getUser = (id: any): any => {
  // ...
};
```

### React Hooks

```tsx
// ✅ جيد: hooks في الترتيب الصحيح
const MyComponent = () => {
  const [state, setState] = useState(0);

  useEffect(() => {
    // side effects
  }, []);

  const handleClick = useCallback(() => {
    setState(prev => prev + 1);
  }, []);

  return <button onClick={handleClick}>{state}</button>;
};
```

### Styling

```tsx
// ✅ جيد: استخدام متغيرات CSS
const MyComponent = () => (
  <div style={{
    padding: 'var(--sp-4)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--r-3)'
  }}>
    محتوى
  </div>
);

// ❌ سيء: قيم ثابتة
const MyComponent = () => (
  <div style={{
    padding: '16px',
    background: '#FFFFFF',
    borderRadius: '16px'
  }}>
    محتوى
  </div>
);
```

### إمكانية الوصول

```tsx
// ✅ جيد: تسميات واضحة
<button
  aria-label="إغلاق النافذة"
  onClick={handleClose}
>
  ✕
</button>

// ❌ سيء: بدون تسمية
<button onClick={handleClose}>✕</button>
```

### RTL/LTR Support

```tsx
// ✅ جيد: دعم كلا الاتجاهين
<div dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
  <p>{isRTL ? 'نص عربي' : 'English text'}</p>
</div>
```

---

## 🧪 الاختبار

### تشغيل الاختبارات

```bash
# جميع الاختبارات
npm test

# اختبارات محددة
npm test MyComponent

# مع التغطية
npm run test:coverage

# وضع المراقبة
npm run test:watch
```

### كتابة اختبار

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const handleAction = vi.fn();
    render(<MyComponent title="Test" onAction={handleAction} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleAction).toHaveBeenCalledOnce();
  });
});
```

---

## 🚢 النشر

### الواجهة الأمامية (GitHub Pages)

```bash
# البناء
cd frontend
npm run build

# النشر (تلقائي عبر GitHub Actions)
git push origin main
```

### الواجهة الخلفية (Render.com)

```bash
# التحقق من render.yaml
cat render.yaml

# الدفع إلى المستودع (نشر تلقائي)
git push origin main
```

---

## 📚 موارد إضافية

### التوثيق
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### أدوات التطوير
- [VS Code](https://code.visualstudio.com/)
- [Biome](https://biomejs.dev/) - Linting & Formatting
- [Vitest](https://vitest.dev/) - Unit Testing

### المجتمع
- [GitHub Repository](https://github.com/AZIIZALOYIBI/qurabia.com)
- [Documentation](https://qurabia.com/docs)

---

## 🤝 المساهمة

### سير العمل

1. Fork المستودع
2. إنشاء فرع للميزة: `git checkout -b feature/my-feature`
3. Commit التغييرات: `git commit -m 'feat: add my feature'`
4. Push الفرع: `git push origin feature/my-feature`
5. فتح Pull Request

### Commit Messages

نتبع معيار [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: إضافة ميزة جديدة
fix: إصلاح خلل
docs: تحديث التوثيق
style: تعديلات تنسيقية
refactor: إعادة هيكلة
test: إضافة اختبارات
chore: مهام صيانة
```

---

## 📞 الدعم

- 📧 البريد: alotaibiaziz322@gmail.com
- 🌐 الموقع: https://qurabia.com
- 📚 التوثيق: https://qurabia.com/docs

---

**"نبني جسراً بين الحضارة العربية وتقنيات الغد"** 🌉

© 2026 QURABIA — جميع الحقوق محفوظة
