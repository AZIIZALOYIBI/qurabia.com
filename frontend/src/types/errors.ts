/**
 * ============================================================
 * errors.ts - نظام أنواع الأخطاء المركزي
 * QURABIA
 *
 * يوفر تعريفات TypeScript شاملة لجميع أنواع الأخطاء المحتملة
 * في التطبيق، مع دعم التصنيف والسياق الغني.
 * ============================================================
 */

/**
 * مستويات خطورة الأخطاء
 */
export enum ErrorSeverity {
  /** خطأ منخفض الأهمية - لا يؤثر على وظائف أساسية */
  LOW = 'low',
  /** خطأ متوسط - قد يؤثر على بعض الوظائف */
  MEDIUM = 'medium',
  /** خطأ عالي - يؤثر على وظائف مهمة */
  HIGH = 'high',
  /** خطأ حرج - يمنع استخدام التطبيق */
  CRITICAL = 'critical',
}

/**
 * فئات الأخطاء الرئيسية
 */
export enum ErrorCategory {
  /** أخطاء الشبكة والاتصال */
  NETWORK = 'network',
  /** أخطاء واجهة برمجة التطبيقات */
  API = 'api',
  /** أخطاء المصادقة والتفويض */
  AUTH = 'auth',
  /** أخطاء التحقق من صحة البيانات */
  VALIDATION = 'validation',
  /** أخطاء التخزين المحلي */
  STORAGE = 'storage',
  /** أخطاء المكونات والتصيير */
  COMPONENT = 'component',
  /** أخطاء محاكاة الكم */
  QUANTUM = 'quantum',
  /** أخطاء WebGL وThree.js */
  WEBGL = 'webgl',
  /** أخطاء Web Workers */
  WORKER = 'worker',
  /** أخطاء غير متوقعة */
  UNKNOWN = 'unknown',
}

/**
 * معلومات سياق الخطأ
 */
export interface ErrorContext {
  /** مكون React الذي حدث فيه الخطأ */
  componentName?: string;
  /** المسار الحالي في التطبيق */
  routePath?: string;
  /** معرف المستخدم (إن وُجد) */
  userId?: string;
  /** معلومات إضافية مخصصة */
  metadata?: Record<string, unknown>;
  /** stack trace الأصلي */
  stack?: string;
  /** الطابع الزمني */
  timestamp: number;
}

/**
 * تفاصيل خطأ API
 */
export interface ApiErrorDetails {
  /** HTTP status code */
  statusCode?: number;
  /** رمز الخطأ من الخادم */
  errorCode?: string;
  /** رسالة من الخادم */
  serverMessage?: string;
  /** endpoint الذي فشل */
  endpoint?: string;
  /** HTTP method */
  method?: string;
}

/**
 * تفاصيل خطأ الشبكة
 */
export interface NetworkErrorDetails {
  /** نوع خطأ الشبكة */
  type: 'timeout' | 'offline' | 'connection' | 'cors' | 'unknown';
  /** URL الذي فشل */
  url?: string;
  /** وقت الانتظار المستخدم */
  timeout?: number;
}

/**
 * تفاصيل خطأ محاكاة الكم
 */
export interface QuantumErrorDetails {
  /** عدد الكيوبتات المطلوب */
  numQubits?: number;
  /** الحد الأقصى المسموح */
  maxQubits?: number;
  /** نوع البوابة التي فشلت */
  gateType?: string;
  /** رسالة تقنية */
  technicalMessage?: string;
}

/**
 * تفاصيل خطأ WebGL
 */
export interface WebGLErrorDetails {
  /** هل WebGL مدعوم */
  isSupported: boolean;
  /** إصدار WebGL */
  version?: string;
  /** معلومات GPU */
  gpuInfo?: string;
  /** السبب المحدد */
  reason?: string;
}

/**
 * الكلاس الأساسي لجميع أخطاء التطبيق
 */
export class AppError extends Error {
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly context: ErrorContext;
  readonly isRecoverable: boolean;
  readonly userMessage: string;
  readonly userMessageAr: string;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: Partial<ErrorContext> = {},
    isRecoverable = true,
    userMessage?: string,
    userMessageAr?: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.severity = severity;
    this.context = {
      timestamp: Date.now(),
      ...context,
    };
    this.isRecoverable = isRecoverable;
    this.userMessage = userMessage || message;
    this.userMessageAr = userMessageAr || this.getDefaultArabicMessage();

    // الحفاظ على stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private getDefaultArabicMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 'حدث خطأ في الاتصال بالشبكة';
      case ErrorCategory.API:
        return 'حدث خطأ في الاتصال بالخادم';
      case ErrorCategory.AUTH:
        return 'حدث خطأ في المصادقة';
      case ErrorCategory.VALIDATION:
        return 'البيانات المدخلة غير صحيحة';
      case ErrorCategory.STORAGE:
        return 'حدث خطأ في حفظ البيانات';
      case ErrorCategory.COMPONENT:
        return 'حدث خطأ في عرض الواجهة';
      case ErrorCategory.QUANTUM:
        return 'حدث خطأ في محاكاة الكم';
      case ErrorCategory.WEBGL:
        return 'حدث خطأ في التصيير ثلاثي الأبعاد';
      case ErrorCategory.WORKER:
        return 'حدث خطأ في معالجة البيانات';
      default:
        return 'حدث خطأ غير متوقع';
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      isRecoverable: this.isRecoverable,
      userMessage: this.userMessage,
      userMessageAr: this.userMessageAr,
      stack: this.stack,
    };
  }
}

/**
 * خطأ الشبكة
 */
export class NetworkError extends AppError {
  readonly details: NetworkErrorDetails;

  constructor(
    message: string,
    details: NetworkErrorDetails,
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.HIGH,
      context,
      true,
      'فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
      'فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
    );
    this.name = 'NetworkError';
    this.details = details;
  }
}

/**
 * خطأ API
 */
export class ApiError extends AppError {
  readonly details: ApiErrorDetails;

  constructor(
    message: string,
    details: ApiErrorDetails,
    context: Partial<ErrorContext> = {},
  ) {
    const severity = details.statusCode && details.statusCode >= 500
      ? ErrorSeverity.HIGH
      : ErrorSeverity.MEDIUM;

    super(
      message,
      ErrorCategory.API,
      severity,
      context,
      true,
      details.serverMessage || 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.',
      details.serverMessage || 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.',
    );
    this.name = 'ApiError';
    this.details = details;
  }
}

/**
 * خطأ المصادقة
 */
export class AuthError extends AppError {
  readonly reason: 'unauthorized' | 'forbidden' | 'expired' | 'invalid';

  constructor(
    message: string,
    reason: 'unauthorized' | 'forbidden' | 'expired' | 'invalid',
    context: Partial<ErrorContext> = {},
  ) {
    const userMessageAr = reason === 'expired'
      ? 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.'
      : reason === 'forbidden'
        ? 'ليس لديك صلاحية للوصول إلى هذا المورد.'
        : 'فشلت عملية المصادقة. يرجى تسجيل الدخول.';

    super(
      message,
      ErrorCategory.AUTH,
      ErrorSeverity.HIGH,
      context,
      true,
      userMessageAr,
      userMessageAr,
    );
    this.name = 'AuthError';
    this.reason = reason;
  }
}

/**
 * خطأ التحقق من البيانات
 */
export class ValidationError extends AppError {
  readonly field?: string;
  readonly value?: unknown;
  readonly constraints?: string[];

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    constraints?: string[],
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      context,
      true,
      message,
      message,
    );
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.constraints = constraints;
  }
}

/**
 * خطأ محاكاة الكم
 */
export class QuantumSimulationError extends AppError {
  readonly details: QuantumErrorDetails;

  constructor(
    message: string,
    details: QuantumErrorDetails,
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.QUANTUM,
      ErrorSeverity.MEDIUM,
      context,
      true,
      details.technicalMessage || message,
      details.technicalMessage || message,
    );
    this.name = 'QuantumSimulationError';
    this.details = details;
  }
}

/**
 * خطأ WebGL
 */
export class WebGLError extends AppError {
  readonly details: WebGLErrorDetails;

  constructor(
    message: string,
    details: WebGLErrorDetails,
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.WEBGL,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'تعذر تحميل التصيير ثلاثي الأبعاد. قد لا يدعم متصفحك WebGL.',
      'تعذر تحميل التصيير ثلاثي الأبعاد. قد لا يدعم متصفحك WebGL.',
    );
    this.name = 'WebGLError';
    this.details = details;
  }
}

/**
 * خطأ Web Worker
 */
export class WorkerError extends AppError {
  readonly workerName: string;

  constructor(
    message: string,
    workerName: string,
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.WORKER,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'حدث خطأ في معالجة البيانات في الخلفية.',
      'حدث خطأ في معالجة البيانات في الخلفية.',
    );
    this.name = 'WorkerError';
    this.workerName = workerName;
  }
}

/**
 * خطأ التخزين المحلي
 */
export class StorageError extends AppError {
  readonly storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
  readonly operation: 'read' | 'write' | 'delete';

  constructor(
    message: string,
    storageType: 'localStorage' | 'sessionStorage' | 'indexedDB',
    operation: 'read' | 'write' | 'delete',
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.STORAGE,
      ErrorSeverity.LOW,
      context,
      true,
      'حدث خطأ في حفظ البيانات محلياً.',
      'حدث خطأ في حفظ البيانات محلياً.',
    );
    this.name = 'StorageError';
    this.storageType = storageType;
    this.operation = operation;
  }
}

/**
 * خطأ المكون
 */
export class ComponentError extends AppError {
  readonly componentName: string;

  constructor(
    message: string,
    componentName: string,
    context: Partial<ErrorContext> = {},
  ) {
    super(
      message,
      ErrorCategory.COMPONENT,
      ErrorSeverity.MEDIUM,
      {
        ...context,
        componentName,
      },
      true,
      'حدث خطأ في عرض هذا الجزء من الواجهة.',
      'حدث خطأ في عرض هذا الجزء من الواجهة.',
    );
    this.name = 'ComponentError';
    this.componentName = componentName;
  }
}

/**
 * Type guard للتحقق من كون الخطأ من نوع AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard للتحقق من كون الخطأ من نوع Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * استخراج رسالة من أي نوع خطأ
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'حدث خطأ غير متوقع';
}

/**
 * استخراج رسالة عربية من أي نوع خطأ
 */
export function getErrorMessageAr(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessageAr;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'حدث خطأ غير متوقع';
}
