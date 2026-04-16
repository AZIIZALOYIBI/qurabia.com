# نظام معالجة الأخطاء - QURABIA

نظام شامل ومتقدم لمعالجة الأخطاء في مشروع QURABIA، يغطي كلاً من الواجهة الأمامية (React/TypeScript) والواجهة الخلفية (FastAPI/Python).

## البنية العامة

```
frontend/src/
├── types/errors.ts                    # تعريفات أنواع الأخطاء
├── utils/error-handler.ts             # معالج الأخطاء المركزي
└── components/GlobalErrorBoundary.tsx # Error Boundary شامل

backend/
├── exceptions.py                      # استثناءات مخصصة
└── error_handlers.py                  # معالجات FastAPI
```

---

## الواجهة الأمامية (Frontend)

### 1. أنواع الأخطاء (`types/errors.ts`)

#### التصنيفات الرئيسية

- **ErrorCategory**: تصنيف الأخطاء حسب المصدر
  - `NETWORK` - أخطاء الشبكة
  - `API` - أخطاء API
  - `AUTH` - أخطاء المصادقة
  - `VALIDATION` - أخطاء التحقق
  - `STORAGE` - أخطاء التخزين
  - `COMPONENT` - أخطاء المكونات
  - `QUANTUM` - أخطاء محاكاة الكم
  - `WEBGL` - أخطاء WebGL/Three.js
  - `WORKER` - أخطاء Web Workers
  - `UNKNOWN` - أخطاء غير محددة

- **ErrorSeverity**: مستوى خطورة الخطأ
  - `LOW` - خطأ منخفض
  - `MEDIUM` - خطأ متوسط
  - `HIGH` - خطأ عالي
  - `CRITICAL` - خطأ حرج

#### الأصناف المتاحة

```typescript
// الكلاس الأساسي
AppError

// أصناف متخصصة
NetworkError
ApiError
AuthError
ValidationError
QuantumSimulationError
WebGLError
WorkerError
StorageError
ComponentError
```

### 2. معالج الأخطاء المركزي (`utils/error-handler.ts`)

#### الاستخدام الأساسي

```typescript
import { handleError, handleAsyncError } from '@/utils/error-handler';
import { NetworkError, ApiError } from '@/types/errors';

// معالجة خطأ مباشر
try {
  // code that might throw
} catch (error) {
  handleError(error, {
    componentName: 'MyComponent',
    metadata: { userId: '123' }
  });
}

// معالجة Promise
const data = await handleAsyncError(
  fetch('/api/data'),
  { componentName: 'DataFetcher' }
);
```

#### Wrappers للدوال

```typescript
import { withErrorHandler, withAsyncErrorHandler } from '@/utils/error-handler';

// Sync function wrapper
const safeFunction = withErrorHandler(
  (data) => processData(data),
  { componentName: 'DataProcessor' }
);

// Async function wrapper
const safeFetch = withAsyncErrorHandler(
  async (url) => fetch(url),
  { componentName: 'Fetcher' }
);
```

#### إنشاء أخطاء مخصصة

```typescript
import { createNetworkError, createApiError } from '@/utils/error-handler';

// خطأ شبكة
const netError = createNetworkError(
  new Error('Connection failed'),
  'https://api.example.com'
);

// خطأ API من Response
const apiError = await createApiError(
  response,
  '/api/quantum/simulate'
);
```

#### التحكم في الإعدادات

```typescript
import errorHandler from '@/utils/error-handler';

// تحديث الإعدادات
errorHandler.configure({
  enableConsoleLogging: true,
  enableRemoteLogging: true,
  remoteLoggingEndpoint: 'https://api.qurabia.com/logs',
  enableUserNotifications: true,
  notificationHandler: (message, severity) => {
    // عرض إشعار مخصص
    toast.error(message);
  },
  environment: 'production'
});

// الحصول على إحصائيات
const stats = errorHandler.getStatistics();
console.log(stats); // { total, byCategory, bySeverity, recent }
```

### 3. GlobalErrorBoundary

#### الاستخدام

```typescript
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

function App() {
  return (
    <GlobalErrorBoundary
      showResetButton={true}
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // معالجة مخصصة
        console.error('Global error:', error, errorInfo);
      }}
    >
      <YourApp />
    </GlobalErrorBoundary>
  );
}
```

#### Fallback مخصص

```typescript
<GlobalErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h1>حدث خطأ مخصص</h1>
      <p>{error.message}</p>
      <button onClick={reset}>المحاولة مرة أخرى</button>
    </div>
  )}
>
  <YourApp />
</GlobalErrorBoundary>
```

---

## الواجهة الخلفية (Backend)

### 1. الاستثناءات المخصصة (`exceptions.py`)

#### التصنيفات الرئيسية

```python
from exceptions import *

# المصادقة والتفويض
raise AuthenticationError("Invalid credentials")
raise AuthorizationError("Insufficient permissions")
raise TokenExpiredError()
raise InvalidTokenError()

# التحقق من البيانات
raise ValidationError("Invalid email", field="email")
raise InvalidInputError("Invalid JSON format")

# محاكاة الكم
raise QuantumSimulationError("Simulation failed")
raise QubitLimitExceededError(num_qubits=20, max_qubits=16)
raise InvalidQuantumGateError("CNOT", "Invalid target qubit")
raise StateVectorError("Invalid state vector dimensions")

# الأمان والتشفير
raise SecurityError("Security violation detected")
raise EncryptionError("Encryption failed")
raise DecryptionError("Decryption failed")
raise SignatureError("Invalid signature")
raise RateLimitExceededError(retry_after=60)

# قاعدة البيانات
raise DatabaseError("Query failed")
raise ResourceNotFoundError("User", "user-123")
raise ResourceAlreadyExistsError("Email", "user@example.com")

# الخدمات الخارجية
raise ExternalServiceError("OpenRouter", "API unavailable")
raise APIConnectionError("Google Auth", "Connection timeout")

# الإعدادات
raise ConfigurationError("Invalid config")
raise MissingEnvironmentVariableError("API_KEY")

# الذكاء الاصطناعي
raise AIEngineError("Engine initialization failed", engine_name="GPT")
raise ModelLoadError("gpt-4", "Model not found")
raise InferenceError("Inference timeout")

# WebSocket
raise WebSocketError("Connection closed unexpectedly")

# معالجة البيانات
raise DataProcessingError("Invalid data format")
raise SerializationError("Cannot serialize object")
raise DeserializationError("Invalid JSON")

# الأداء
raise ResourceExhaustedError("Memory", "Out of memory")
raise TimeoutError("quantum_simulation", 30.0)
```

#### خصائص الاستثناءات

```python
try:
    raise QubitLimitExceededError(num_qubits=20, max_qubits=16)
except QURABIAException as e:
    print(e.message)        # رسالة الخطأ
    print(e.status_code)    # HTTP status code (422)
    print(e.error_code)     # رمز الخطأ المخصص
    print(e.details)        # تفاصيل إضافية
    print(e.to_dict())      # تحويل لقاموس
```

### 2. معالجات الأخطاء (`error_handlers.py`)

#### التسجيل التلقائي

معالجات الأخطاء مسجلة تلقائياً في `main.py`:

```python
from error_handlers import register_error_handlers

app = FastAPI(...)
register_error_handlers(app)
```

#### معالجات مخصصة

المعالجات المسجلة:
- `QURABIAException` - جميع استثناءات QURABIA المخصصة
- `HTTPException` - استثناءات HTTP العامة
- `RequestValidationError` - أخطاء التحقق من Pydantic
- `ValidationError` - أخطاء Pydantic validation
- `Exception` - catch-all لجميع الأخطاء الأخرى

#### Decorator للمعالجة التلقائية

```python
from error_handlers import wrap_with_error_handling

@wrap_with_error_handling
async def my_endpoint():
    # الأخطاء ستُعالج تلقائياً
    result = await some_operation()
    return result
```

#### معالجة يدوية

```python
from error_handlers import handle_error

try:
    # code that might fail
    pass
except Exception as e:
    handle_error(
        e,
        context={"user_id": "123", "operation": "quantum_sim"},
        reraise=True
    )
```

#### شكل استجابة الأخطاء

جميع الأخطاء تُرجع بنفس التنسيق:

```json
{
  "error": "QUBIT_LIMIT_EXCEEDED",
  "message": "Number of qubits (20) exceeds maximum allowed (16)",
  "status_code": 500,
  "details": {
    "num_qubits": 20,
    "max_qubits": 16
  },
  "traceback": "..." // في بيئة التطوير فقط
}
```

---

## أمثلة عملية

### Frontend: معالجة خطأ API

```typescript
import { handleAsyncError, createApiError } from '@/utils/error-handler';
import { ApiError } from '@/types/errors';

async function fetchQuantumSimulation(params: SimulationParams) {
  try {
    const response = await fetch('/api/quantum/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw await createApiError(response, '/api/quantum/simulate');
    }

    return await response.json();
  } catch (error) {
    handleError(error, {
      componentName: 'QuantumSimulator',
      metadata: { params },
    });
    return null;
  }
}
```

### Frontend: Error Boundary لمكون محدد

```typescript
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

function QuantumSimulator() {
  return (
    <GlobalErrorBoundary
      showErrorDetails={true}
      fallback={(error, reset) => (
        <div className="error-container">
          <h2>فشلت المحاكاة الكمومية</h2>
          <p>{error.message}</p>
          <button onClick={reset}>إعادة المحاولة</button>
        </div>
      )}
    >
      <QuantumSimulationComponent />
    </GlobalErrorBoundary>
  );
}
```

### Backend: Endpoint مع معالجة أخطاء

```python
from fastapi import APIRouter
from exceptions import QubitLimitExceededError, QuantumSimulationError
from error_handlers import wrap_with_error_handling

router = APIRouter()

@router.post("/api/quantum/simulate")
@wrap_with_error_handling
async def simulate_quantum_circuit(request: SimulationRequest):
    MAX_QUBITS = 16

    if request.num_qubits > MAX_QUBITS:
        raise QubitLimitExceededError(
            num_qubits=request.num_qubits,
            max_qubits=MAX_QUBITS
        )

    try:
        result = perform_simulation(request)
        return {"success": True, "result": result}
    except Exception as e:
        raise QuantumSimulationError(
            f"Simulation failed: {str(e)}",
            details={"circuit": request.circuit}
        )
```

---

## Logging Structured

### Frontend

جميع الأخطاء تُسجل بشكل structured في الكونسول:

```
🚨 QUANTUM: Number of qubits exceeds limit
Severity: CRITICAL
User Message (AR): تجاوز عدد الكيوبتات الحد المسموح
Context: {
  componentName: "QuantumSimulator",
  timestamp: 1704067200000,
  metadata: { numQubits: 20 }
}
```

### Backend

استخدام structlog للتسجيل:

```python
import structlog

logger = structlog.get_logger(__name__)

# يُسجل تلقائياً بواسطة error_handlers
logger.error(
    "quantum_simulation_error",
    num_qubits=20,
    max_qubits=16,
    user_id="user-123",
    exc_info=True
)
```

---

## اختبار النظام

### Frontend Tests

```typescript
import { describe, it, expect } from 'vitest';
import { AppError, ErrorCategory, ErrorSeverity } from '@/types/errors';

describe('Error System', () => {
  it('should create AppError correctly', () => {
    const error = new AppError(
      'Test error',
      ErrorCategory.QUANTUM,
      ErrorSeverity.HIGH
    );

    expect(error.category).toBe(ErrorCategory.QUANTUM);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.isRecoverable).toBe(true);
  });
});
```

### Backend Tests

```python
import pytest
from exceptions import QubitLimitExceededError, QURABIAException

def test_qubit_limit_error():
    error = QubitLimitExceededError(num_qubits=20, max_qubits=16)

    assert error.status_code == 500
    assert error.error_code == "QUBIT_LIMIT_EXCEEDED"
    assert "20" in error.message
    assert "16" in error.message
    assert error.details["num_qubits"] == 20

def test_error_to_dict():
    error = QURABIAException(
        "Test error",
        status_code=400,
        error_code="TEST_ERROR",
        details={"key": "value"}
    )

    data = error.to_dict()
    assert data["error"] == "TEST_ERROR"
    assert data["message"] == "Test error"
    assert data["details"]["key"] == "value"
```

---

## Best Practices

### Frontend

1. **استخدم Error Boundaries** لتغليف المكونات المعقدة
2. **لا تبتلع الأخطاء** - دائماً سجل أو عالج
3. **استخدم أنواع مخصصة** بدلاً من Error العادي
4. **أضف context غني** لتسهيل التتبع
5. **اختبر سيناريوهات الأخطاء** في unit tests

### Backend

1. **استخدم استثناءات مخصصة** بدلاً من HTTPException مباشرة
2. **أضف تفاصيل كافية** في `details` dictionary
3. **سجل الأخطاء** قبل إعادة رفعها
4. **استخدم status codes صحيحة**
5. **لا تكشف تفاصيل حساسة** في الإنتاج

---

## التكامل مع الأنظمة الموجودة

### ThreeErrorBoundary

`GlobalErrorBoundary` يعمل جنباً إلى جنب مع `ThreeErrorBoundary` الموجود:

```typescript
<GlobalErrorBoundary>
  <App>
    <ThreeErrorBoundary>
      <ThreeJsComponent />
    </ThreeErrorBoundary>
  </App>
</GlobalErrorBoundary>
```

### ToastContext

يمكن ربط نظام الأخطاء مع Toast notifications:

```typescript
import { useToast } from '@/contexts/ToastContext';
import errorHandler from '@/utils/error-handler';

function setupErrorHandler() {
  const { showToast } = useToast();

  errorHandler.configure({
    notificationHandler: (message, severity) => {
      const type = severity === ErrorSeverity.CRITICAL ? 'error' :
                   severity === ErrorSeverity.HIGH ? 'error' :
                   severity === ErrorSeverity.MEDIUM ? 'warning' : 'info';
      showToast(message, type);
    }
  });
}
```

---

## الخلاصة

نظام معالجة الأخطاء في QURABIA يوفر:

- **تصنيف شامل** للأخطاء حسب المصدر والخطورة
- **معالجة موحدة** عبر Frontend و Backend
- **Logging structured** لتسهيل التتبع والتحليل
- **Recovery mechanisms** تلقائية حيث ممكن
- **تجربة مستخدم محسنة** مع رسائل واضحة بالعربية
- **Developer experience ممتاز** مع TypeScript types كاملة

جميع الأدوات جاهزة للاستخدام الفوري في المشروع!
