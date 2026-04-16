/**
 * ============================================================
 * USAGE_EXAMPLES.md - أمثلة استخدام Zustand Stores
 * QURABIA
 * ============================================================
 */

# أمثلة الاستخدام - Zustand Stores

## مثال 1: مكون محاكاة كمومية بسيط

```typescript
import { useQuantumStatus, useQuantumProgress, useQuantumActions } from '@/stores';

function QuantumSimulator() {
  const status = useQuantumStatus();
  const progress = useQuantumProgress();
  const { startSimulation, stopSimulation, updateProgress } = useQuantumActions();

  const handleStart = () => {
    startSimulation();
    // Simulate progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      updateProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <div className="p-4">
      <h2>محاكي كمومي</h2>
      <p>الحالة: {status}</p>
      <p>التقدم: {progress}%</p>
      <div className="mt-4">
        <button onClick={handleStart} className="btn-primary">
          ابدأ المحاكاة
        </button>
        <button onClick={stopSimulation} className="btn-secondary">
          إيقاف
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded h-4 mt-4">
        <div
          className="bg-blue-500 h-4 rounded transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

---

## مثال 2: نظام التوست (Toast Notifications)

```typescript
import { useToasts, useUIActions } from '@/stores';

function ToastNotifications() {
  const toasts = useToasts();
  const { addToast, removeToast } = useUIActions();

  const showSuccess = () => {
    addToast({
      message: 'تمت العملية بنجاح!',
      type: 'success',
      duration: 3000,
    });
  };

  const showError = () => {
    addToast({
      message: 'حدث خطأ ما',
      type: 'error',
      duration: 5000,
    });
  };

  return (
    <div>
      {/* Toast Container */}
      <div className="fixed top-4 left-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500'
                : toast.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            } text-white`}
          >
            <div className="flex items-center justify-between">
              <p>{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="mr-2">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trigger Buttons */}
      <div className="space-x-2">
        <button onClick={showSuccess}>عرض نجاح</button>
        <button onClick={showError}>عرض خطأ</button>
      </div>
    </div>
  );
}
```

---

## مثال 3: نظام المصادقة

```typescript
import { useState } from 'react';
import { useUser, useIsAuthenticated, useAuthActions, useAuthError } from '@/stores';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const error = useAuthError();
  const { login, logout } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is already in store
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div>
        <h2>مرحباً، {user.name}!</h2>
        <p>البريد الإلكتروني: {user.email}</p>
        <p>الخطة: {user.plan}</p>
        <button onClick={logout}>تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2>تسجيل الدخول</h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}
      <input
        type="email"
        placeholder="البريد الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
        دخول
      </button>
    </form>
  );
}
```

---

## مثال 4: إعدادات التصور

```typescript
import {
  useVisualizationSettings,
  useSettingsActions,
} from '@/stores';

function VisualizationSettingsPanel() {
  const settings = useVisualizationSettings();
  const { updateVisualization, resetVisualization } = useSettingsActions();

  return (
    <div className="p-4 space-y-4">
      <h2>إعدادات التصور</h2>

      {/* Grid Toggle */}
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={settings.showGrid}
          onChange={(e) =>
            updateVisualization({ showGrid: e.target.checked })
          }
        />
        <span>عرض الشبكة</span>
      </label>

      {/* Axes Toggle */}
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={settings.showAxes}
          onChange={(e) =>
            updateVisualization({ showAxes: e.target.checked })
          }
        />
        <span>عرض المحاور</span>
      </label>

      {/* Animations Toggle */}
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={settings.enableAnimations}
          onChange={(e) =>
            updateVisualization({ enableAnimations: e.target.checked })
          }
        />
        <span>تفعيل الحركات</span>
      </label>

      {/* Render Quality */}
      <div>
        <label>جودة العرض:</label>
        <select
          value={settings.renderQuality}
          onChange={(e) =>
            updateVisualization({
              renderQuality: e.target.value as 'low' | 'medium' | 'high',
            })
          }
          className="w-full p-2 border rounded"
        >
          <option value="low">منخفض</option>
          <option value="medium">متوسط</option>
          <option value="high">عالي</option>
        </select>
      </div>

      {/* Particle Count */}
      <div>
        <label>عدد الجزيئات: {settings.particleCount}</label>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={settings.particleCount}
          onChange={(e) =>
            updateVisualization({ particleCount: Number(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* FPS */}
      <div>
        <label>معدل الإطارات: {settings.fps}</label>
        <input
          type="range"
          min="30"
          max="120"
          step="10"
          value={settings.fps}
          onChange={(e) =>
            updateVisualization({ fps: Number(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={resetVisualization}
        className="w-full p-2 bg-gray-200 rounded"
      >
        إعادة تعيين الإعدادات الافتراضية
      </button>
    </div>
  );
}
```

---

## مثال 5: مبدل الثيم واللغة

```typescript
import { useTheme, useLanguage, useUIActions } from '@/stores';

function ThemeLanguageSwitcher() {
  const theme = useTheme();
  const language = useLanguage();
  const { toggleTheme, setLanguage } = useUIActions();

  return (
    <div className="flex items-center space-x-4">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded bg-gray-200 dark:bg-gray-700"
      >
        {theme === 'dark' ? '☀️ فاتح' : '🌙 داكن'}
      </button>

      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="p-2 rounded bg-gray-200 dark:bg-gray-700"
      >
        {language === 'ar' ? 'English' : 'عربي'}
      </button>
    </div>
  );
}
```

---

## مثال 6: Modal Management

```typescript
import { useModalState, useUIActions } from '@/stores';

function ModalExample() {
  const { open, content } = useModalState();
  const { openModal, closeModal } = useUIActions();

  const showConfirmation = () => {
    openModal(
      <div className="p-6 bg-white rounded">
        <h3>تأكيد الحذف</h3>
        <p>هل أنت متأكد من رغبتك في حذف هذا العنصر؟</p>
        <div className="mt-4 space-x-2">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">
            إلغاء
          </button>
          <button
            onClick={() => {
              // Perform delete action
              console.log('Deleted!');
              closeModal();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            حذف
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <button onClick={showConfirmation}>حذف العنصر</button>

      {/* Modal Container */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div onClick={(e) => e.stopPropagation()}>{content}</div>
        </div>
      )}
    </div>
  );
}
```

---

## مثال 7: Custom Hook يجمع عدة Stores

```typescript
import {
  useQuantumState,
  useQuantumActions,
  useUser,
  useUIActions,
} from '@/stores';

// Custom hook يجمع logic من stores متعددة
function useQuantumSimulation() {
  const { status, progress, error, isRunning } = useQuantumState();
  const { startSimulation, stopSimulation, setError, updateProgress } =
    useQuantumActions();
  const user = useUser();
  const { addToast, setLoading } = useUIActions();

  const runSimulation = async (qubits: number) => {
    // Check authentication
    if (!user) {
      addToast({
        message: 'يجب تسجيل الدخول لتشغيل المحاكاة',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true, 'جارٍ تشغيل المحاكاة...');
      startSimulation();

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        updateProgress(i);
      }

      addToast({
        message: 'اكتملت المحاكاة بنجاح!',
        type: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ';
      setError(message);
      addToast({
        message: `فشلت المحاكاة: ${message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    progress,
    error,
    isRunning,
    runSimulation,
    stopSimulation,
  };
}

// استخدام الـ Custom Hook
function QuantumDashboard() {
  const { status, progress, runSimulation } = useQuantumSimulation();

  return (
    <div>
      <h2>لوحة التحكم الكمومية</h2>
      <p>الحالة: {status}</p>
      <p>التقدم: {progress}%</p>
      <button onClick={() => runSimulation(8)}>
        تشغيل محاكاة 8 كيوبت
      </button>
    </div>
  );
}
```

---

## مثال 8: Loading State Management

```typescript
import { useLoadingState, useUIActions } from '@/stores';

function AsyncDataFetcher() {
  const { isLoading, message } = useLoadingState();
  const { setLoading } = useUIActions();

  const fetchData = async () => {
    setLoading(true, 'جارٍ تحميل البيانات...');
    try {
      await fetch('/api/data');
      // Process data...
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <p className="mr-4">{message}</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={fetchData}>تحميل البيانات</button>
    </div>
  );
}
```

---

## نصائح للاستخدام الأمثل

### 1. استخدم Selectors المحسّنة

```typescript
// ❌ سيء
const store = useQuantumStore();
const status = store.status;

// ✅ جيد
const status = useQuantumStatus();
```

### 2. فصل State عن Actions

```typescript
// ✅ جيد - واضح ومنظم
const status = useQuantumStatus();
const { setStatus } = useQuantumActions();
```

### 3. استخدم Custom Hooks للـ Logic المعقد

```typescript
// ✅ جيد - إخفاء التعقيد
function useMyFeature() {
  const stateA = useStoreA();
  const stateB = useStoreB();

  // Complex logic here

  return { /* simplified API */ };
}
```

### 4. Handle Errors بشكل صحيح

```typescript
const error = useAuthError();

if (error) {
  return <ErrorMessage message={error} />;
}
```

---

هذه الأمثلة توضح أفضل الممارسات لاستخدام Zustand في مشروع QURABIA.
