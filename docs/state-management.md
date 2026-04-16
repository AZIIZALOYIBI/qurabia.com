# إدارة الحالة المركزية - Zustand State Management

## نظرة عامة

تم إضافة نظام إدارة حالة مركزي لمشروع QURABIA باستخدام **Zustand**، مما يوفر:

- **Type Safety كامل** مع TypeScript
- **Persistence** تلقائي للبيانات المهمة
- **DevTools Integration** للتطوير
- **Selectors محسّنة** لتحسين الأداء
- **Backward Compatibility** مع الكود الموجود

---

## البنية

```
frontend/src/stores/
├── quantum-store.ts    # حالة المحاكاة الكمومية
├── ui-store.ts         # حالة واجهة المستخدم
├── auth-store.ts       # حالة المصادقة
├── settings-store.ts   # إعدادات التطبيق
└── index.ts            # نقطة التصدير المركزية
```

---

## 1. Quantum Store - حالة المحاكاة الكمومية

### الاستخدام الأساسي

```typescript
import { useQuantumStore, useQuantumActions } from '@/stores';

function QuantumSimulator() {
  // الطريقة الأولى: استخدام Store كامل
  const { status, progress, isRunning } = useQuantumStore();

  // الطريقة الثانية: استخدام Selectors محسّنة
  const status = useQuantumStatus();
  const progress = useQuantumProgress();
  const actions = useQuantumActions();

  const handleStart = () => {
    actions.startSimulation();
    actions.setStatus('QUANTUM_INIT');
  };

  return (
    <div>
      <p>الحالة: {status}</p>
      <p>التقدم: {progress}%</p>
      <button onClick={handleStart}>ابدأ المحاكاة</button>
    </div>
  );
}
```

### API Reference

#### State

```typescript
interface QuantumState {
  status: SystemStatus;          // حالة النظام
  progress: number;              // التقدم (0-100)
  lastResult: SimulationResult | null;
  error: string | null;
  activeQubits: number;          // عدد الكيوبتات النشطة
  maxQubits: number;             // الحد الأقصى (16)
  isRunning: boolean;            // هل المحاكاة قيد التشغيل
}

type SystemStatus =
  | 'IDLE'
  | 'QUANTUM_INIT'
  | 'CALIBRATION'
  | 'AUDIO_TRAINING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR';
```

#### Actions

```typescript
interface QuantumActions {
  setStatus: (status: SystemStatus) => void;
  updateProgress: (progress: number) => void;
  setLastResult: (result: SimulationResult) => void;
  setError: (error: string | null) => void;
  setActiveQubits: (qubits: number) => void;
  resetState: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}
```

#### Selectors

```typescript
// Selectors محسّنة لتجنب re-renders غير ضرورية
const status = useQuantumStatus();
const progress = useQuantumProgress();
const result = useQuantumResult();
const error = useQuantumError();
const qubits = useQuantumQubits();
const isRunning = useQuantumIsRunning();
```

#### Persistence

يتم حفظ تلقائياً:
- `activeQubits` - عدد الكيوبتات المفضل
- `lastResult` - آخر نتيجة محاكاة

**لا** يتم حفظ الحالة المؤقتة مثل `progress` و `isRunning`.

---

## 2. UI Store - حالة واجهة المستخدم

### الاستخدام الأساسي

```typescript
import { useUIStore, useUIActions, useTheme } from '@/stores';

function ThemeSwitcher() {
  const theme = useTheme();
  const { toggleTheme } = useUIActions();

  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function ToastExample() {
  const { addToast } = useUIActions();
  const toasts = useToasts();

  const showSuccess = () => {
    addToast({
      message: 'تم الحفظ بنجاح!',
      type: 'success',
      duration: 3000
    });
  };

  return (
    <div>
      <button onClick={showSuccess}>عرض إشعار</button>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
```

### API Reference

#### State

```typescript
interface UIState {
  theme: 'dark' | 'light';
  language: 'ar' | 'en';
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: React.ReactNode | null;
  toasts: Toast[];
  isLoading: boolean;
  loadingMessage: string | null;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
```

#### Actions

```typescript
interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}
```

#### Selectors

```typescript
const theme = useTheme();
const language = useLanguage();
const sidebarOpen = useSidebarOpen();
const { open, content } = useModalState();
const toasts = useToasts();
const { isLoading, message } = useLoadingState();
```

#### Features

- **Auto-dismiss Toasts**: يتم إزالة الإشعارات تلقائياً بعد المدة المحددة
- **Document Integration**: يتم تحديث `document.documentElement` تلقائياً عند تغيير Theme/Language
- **Persistence**: يتم حفظ `theme`, `language`, `sidebarOpen` في localStorage

---

## 3. Auth Store - حالة المصادقة

### الاستخدام الأساسي

```typescript
import { useAuthStore, useUser, useAuthActions } from '@/stores';

function LoginForm() {
  const { login } = useAuthActions();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      console.log('تم تسجيل الدخول بنجاح');
    } catch (err) {
      console.error('فشل تسجيل الدخول:', error);
    }
  };

  return <form>...</form>;
}

function UserProfile() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { logout } = useAuthActions();

  if (!isAuthenticated) {
    return <div>غير مسجل الدخول</div>;
  }

  return (
    <div>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      <p>الخطة: {user?.plan}</p>
      <button onClick={logout}>تسجيل الخروج</button>
    </div>
  );
}
```

### API Reference

#### State

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: PlanId;
  provider: 'google' | 'email' | 'guest';
}

type PlanId = 'explorer' | 'researcher' | 'professional' | 'enterprise';
```

#### Actions

```typescript
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updatePlan: (plan: PlanId) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  checkTokenExpiration: () => void;
}
```

#### Selectors

```typescript
const user = useUser();
const isAuthenticated = useIsAuthenticated();
const isLoading = useAuthLoading();
const error = useAuthError();
const token = useAuthToken();
```

#### Features

- **Token Management**: فك تشفير JWT تلقائياً
- **Expiration Check**: فحص انتهاء صلاحية التوكن عند التحميل
- **Error Handling**: إدارة الأخطاء مركزية
- **Persistence**: حفظ `token` و `user` في localStorage

---

## 4. Settings Store - إعدادات التطبيق

### الاستخدام الأساسي

```typescript
import {
  useSettingsStore,
  useVisualizationSettings,
  useSettingsActions
} from '@/stores';

function VisualizationSettings() {
  const settings = useVisualizationSettings();
  const { updateVisualization } = useSettingsActions();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.showGrid}
          onChange={(e) => updateVisualization({ showGrid: e.target.checked })}
        />
        عرض الشبكة
      </label>

      <label>
        جودة العرض:
        <select
          value={settings.renderQuality}
          onChange={(e) => updateVisualization({
            renderQuality: e.target.value as 'low' | 'medium' | 'high'
          })}
        >
          <option value="low">منخفض</option>
          <option value="medium">متوسط</option>
          <option value="high">عالي</option>
        </select>
      </label>
    </div>
  );
}
```

### API Reference

#### State

```typescript
interface SettingsState {
  visualization: VisualizationSettings;
  quantum: QuantumSettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  notifications: NotificationSettings;
}

interface VisualizationSettings {
  showGrid: boolean;
  showAxes: boolean;
  enableAnimations: boolean;
  particleCount: number;
  renderQuality: 'low' | 'medium' | 'high';
  fps: number;
}

interface QuantumSettings {
  defaultQubits: number;
  maxQubits: number;
  enableOptimizations: boolean;
  enableCaching: boolean;
  simulationTimeout: number;
}

interface PerformanceSettings {
  enableWorkers: boolean;
  maxWorkers: number;
  enableGPU: boolean;
  memoryLimit: number;
}

interface AccessibilitySettings {
  enableScreenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

interface NotificationSettings {
  enableSound: boolean;
  enableDesktopNotifications: boolean;
  enableEmailNotifications: boolean;
}
```

#### Actions

```typescript
interface SettingsActions {
  updateVisualization: (settings: Partial<VisualizationSettings>) => void;
  updateQuantum: (settings: Partial<QuantumSettings>) => void;
  updatePerformance: (settings: Partial<PerformanceSettings>) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
  resetVisualization: () => void;
  resetQuantum: () => void;
  resetPerformance: () => void;
}
```

#### Selectors

```typescript
const visualization = useVisualizationSettings();
const quantum = useQuantumSettings();
const performance = usePerformanceSettings();
const accessibility = useAccessibilitySettings();
const notifications = useNotificationSettings();
```

#### Features

- **Document Integration**: تطبيق إعدادات الوصول على `document.documentElement`
- **Defaults**: قيم افتراضية معقولة لجميع الإعدادات
- **Reset Functions**: إعادة تعيين مجموعات معينة دون التأثير على الأخرى
- **Full Persistence**: حفظ جميع الإعدادات في localStorage

---

## Migration من useState إلى Zustand

### Before (useState)

```typescript
const [theme, setTheme] = useState<'dark' | 'light'>('dark');
const [isLoading, setIsLoading] = useState(false);

// مشكلة: الحالة منفصلة في كل مكون
// مشكلة: لا يوجد persistence
// مشكلة: صعوبة مشاركة الحالة بين المكونات
```

### After (Zustand)

```typescript
// في المكون الأول
const { theme, isLoading } = useUIStore();
const { setTheme, setLoading } = useUIActions();

// في المكون الثاني - نفس الحالة!
const theme = useTheme(); // محسّن - يعيد render فقط عند تغيير theme
```

### Backward Compatibility

الـ hook القديم `useQuantumState` ما زال يعمل:

```typescript
// الكود القديم يعمل بدون تغيير
const { status, progress, setStatus } = useQuantumState();

// لكن للكود الجديد، استخدم:
const status = useQuantumStatus();
const { setStatus } = useQuantumActions();
```

---

## Best Practices

### 1. استخدم Selectors المحسّنة

```typescript
// ❌ سيء - re-render عند أي تغيير في UI store
const uiStore = useUIStore();

// ✅ جيد - re-render فقط عند تغيير theme
const theme = useTheme();
```

### 2. فصل State عن Actions

```typescript
// ✅ جيد - واضح ومنظم
const { status, progress } = useQuantumState();
const { setStatus, updateProgress } = useQuantumActions();
```

### 3. استخدم Partial Updates

```typescript
// ✅ جيد - تحديث جزئي
updateVisualization({ showGrid: true });

// بدلاً من
setVisualizationSettings({ ...settings, showGrid: true });
```

### 4. Handle Async Errors

```typescript
const { login } = useAuthActions();

try {
  await login(email, password);
} catch (error) {
  // الخطأ موجود بالفعل في store
  const errorMessage = useAuthError();
  console.error(errorMessage);
}
```

---

## DevTools

في بيئة التطوير، يمكنك استخدام Redux DevTools:

1. ثبت [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
2. افتح DevTools في المتصفح
3. ستجد كل الـ stores مع أسمائها:
   - `QuantumStore`
   - `UIStore`
   - `AuthStore`
   - `SettingsStore`
4. يمكنك:
   - رؤية جميع التغييرات
   - Time-travel debugging
   - تصدير/استيراد الحالة

---

## Testing

### مثال: اختبار Quantum Store

```typescript
import { renderHook, act } from '@testing-library/react';
import { useQuantumStore } from '@/stores';

describe('QuantumStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useQuantumStore.getState().resetState();
  });

  it('should start simulation', () => {
    const { result } = renderHook(() => useQuantumStore());

    act(() => {
      result.current.startSimulation();
    });

    expect(result.current.status).toBe('QUANTUM_INIT');
    expect(result.current.isRunning).toBe(true);
  });

  it('should update progress', () => {
    const { result } = renderHook(() => useQuantumStore());

    act(() => {
      result.current.updateProgress(50);
    });

    expect(result.current.progress).toBe(50);
  });
});
```

---

## Performance Tips

### 1. Avoid Over-subscribing

```typescript
// ❌ سيء - الكثير من subscriptions
const status = useQuantumStore(state => state.status);
const progress = useQuantumStore(state => state.progress);
const error = useQuantumStore(state => state.error);

// ✅ أفضل - استخدم selector واحد
const { status, progress, error } = useQuantumState();
```

### 2. Memoize Selectors

```typescript
// ✅ Zustand يقوم بـ memoization تلقائياً
const status = useQuantumStatus(); // مُحسّن بالفعل
```

### 3. Use Shallow Equality

```typescript
import { shallow } from 'zustand/shallow';

// للـ objects/arrays
const { theme, language } = useUIStore(
  state => ({ theme: state.theme, language: state.language }),
  shallow
);
```

---

## Troubleshooting

### Store لا يتم حفظه

تأكد من أن اسم الـ store صحيح في `persist`:

```typescript
persist(
  (set) => ({ ... }),
  {
    name: 'qurabia-quantum-store', // يجب أن يكون unique
  }
)
```

### DevTools لا يعمل

تأكد من:
1. Redux DevTools Extension مثبتة
2. في بيئة التطوير (`import.meta.env.DEV`)
3. `enabled: true` في devtools middleware

### Type Errors

تأكد من استيراد Types من `stores/index.ts`:

```typescript
import type { QuantumState, QuantumActions } from '@/stores';
```

---

## أمثلة متقدمة

### Combining Multiple Stores

```typescript
function QuantumDashboard() {
  // State من stores مختلفة
  const { status, progress } = useQuantumState();
  const theme = useTheme();
  const user = useUser();
  const visualization = useVisualizationSettings();

  // Actions من stores مختلفة
  const quantumActions = useQuantumActions();
  const uiActions = useUIActions();

  const handleStart = () => {
    if (!user) {
      uiActions.addToast({
        message: 'يجب تسجيل الدخول أولاً',
        type: 'error'
      });
      return;
    }

    uiActions.setLoading(true, 'جارٍ بدء المحاكاة...');
    quantumActions.startSimulation();
  };

  return <div>...</div>;
}
```

### Custom Hooks with Zustand

```typescript
// Hook مخصص يجمع logic متعدد
function useQuantumSimulation() {
  const { status, progress, error } = useQuantumState();
  const { startSimulation, stopSimulation, setError } = useQuantumActions();
  const { addToast } = useUIActions();

  const runSimulation = async (qubits: number) => {
    try {
      startSimulation();
      // ... simulation logic
      addToast({ message: 'اكتملت المحاكاة!', type: 'success' });
    } catch (err) {
      setError(err.message);
      addToast({ message: 'فشلت المحاكاة', type: 'error' });
    }
  };

  return {
    status,
    progress,
    error,
    runSimulation,
    stopSimulation
  };
}
```

---

## الخلاصة

تم إضافة نظام Zustand بنجاح مع:

✅ Type Safety كامل
✅ Persistence تلقائي
✅ DevTools integration
✅ Selectors محسّنة
✅ Backward compatibility
✅ لا breaking changes
✅ Documentation شاملة

للمزيد من المعلومات، راجع:
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Guide](https://github.com/pmndrs/zustand#typescript)
- [Best Practices](https://github.com/pmndrs/zustand#best-practices)
