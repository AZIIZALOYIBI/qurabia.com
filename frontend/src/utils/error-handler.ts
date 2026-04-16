/**
 * ============================================================
 * error-handler.ts - نظام معالجة الأخطاء المركزي
 * QURABIA
 *
 * يوفر نظاماً موحداً لمعالجة جميع أنواع الأخطاء في التطبيق،
 * مع logging structured وإشعارات المستخدم والتعافي التلقائي.
 * ============================================================
 */

import {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  NetworkError,
  ApiError,
  AuthError,
  ValidationError,
  QuantumSimulationError,
  WebGLError,
  WorkerError,
  StorageError,
  ComponentError,
  isAppError,
  isError,
} from '../types/errors';

/**
 * إعدادات معالج الأخطاء
 */
export interface ErrorHandlerConfig {
  /** تفعيل logging للكونسول */
  enableConsoleLogging: boolean;
  /** تفعيل إرسال الأخطاء لخادم بعيد */
  enableRemoteLogging: boolean;
  /** endpoint لإرسال الأخطاء */
  remoteLoggingEndpoint?: string;
  /** تفعيل إشعارات المستخدم */
  enableUserNotifications: boolean;
  /** دالة لعرض الإشعارات */
  notificationHandler?: (message: string, severity: ErrorSeverity) => void;
  /** البيئة الحالية */
  environment: 'development' | 'production' | 'test';
}

/**
 * سجل الأخطاء
 */
interface ErrorLog {
  error: AppError;
  timestamp: number;
  handled: boolean;
}

/**
 * معالج الأخطاء المركزي
 */
class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLogs: ErrorLog[] = [];
  private readonly maxLogs = 100;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      enableUserNotifications: true,
      environment: 'development',
      ...config,
    };

    // تسجيل معالج للأخطاء غير المعالجة
    this.setupGlobalHandlers();
  }

  /**
   * إعداد معالجات الأخطاء العامة
   */
  private setupGlobalHandlers(): void {
    // معالج الأخطاء غير المعالجة
    window.addEventListener('error', (event) => {
      const error = new ComponentError(
        event.message,
        'Window',
        {
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          stack: event.error?.stack,
        },
      );
      this.handle(error);
    });

    // معالج الوعود المرفوضة غير المعالجة
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.normalizeError(event.reason);
      this.handle(error);
    });
  }

  /**
   * تحديث الإعدادات
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * معالجة خطأ
   */
  handle(error: unknown, context?: Partial<ErrorContext>): void {
    const appError = this.normalizeError(error, context);

    // إضافة للسجل
    this.addToLog(appError);

    // logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(appError);
    }

    // إرسال للخادم
    if (this.config.enableRemoteLogging && this.config.remoteLoggingEndpoint) {
      this.logToRemote(appError);
    }

    // إشعار المستخدم
    if (this.config.enableUserNotifications && appError.severity !== ErrorSeverity.LOW) {
      this.notifyUser(appError);
    }
  }

  /**
   * معالجة خطأ async مع Promise
   */
  async handleAsync<T>(
    promise: Promise<T>,
    context?: Partial<ErrorContext>,
  ): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  /**
   * تطبيع الخطأ إلى AppError
   */
  private normalizeError(error: unknown, context?: Partial<ErrorContext>): AppError {
    // إذا كان بالفعل AppError
    if (isAppError(error)) {
      return error;
    }

    // إذا كان Error عادي
    if (isError(error)) {
      // التحقق من نوع الخطأ وإنشاء AppError مناسب
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new NetworkError(
          error.message,
          { type: 'connection', url: context?.metadata?.url as string },
          context,
        );
      }

      return new ComponentError(
        error.message,
        context?.componentName || 'Unknown',
        {
          ...context,
          stack: error.stack,
        },
      );
    }

    // إذا كان string
    if (typeof error === 'string') {
      return new AppError(
        error,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        context,
      );
    }

    // خطأ غير معروف
    return new AppError(
      'حدث خطأ غير متوقع',
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      context,
    );
  }

  /**
   * إضافة خطأ للسجل
   */
  private addToLog(error: AppError): void {
    this.errorLogs.push({
      error,
      timestamp: Date.now(),
      handled: true,
    });

    // الحفاظ على حد أقصى للسجلات
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }
  }

  /**
   * logging للكونسول
   */
  private logToConsole(error: AppError): void {
    const style = this.getConsoleStyle(error.severity);
    const prefix = this.getLogPrefix(error.severity);

    console.group(`${prefix} ${error.category.toUpperCase()}: ${error.message}`);
    console.log('%cSeverity:', 'font-weight: bold', error.severity);
    console.log('%cUser Message (AR):', 'font-weight: bold', error.userMessageAr);
    console.log('%cContext:', 'font-weight: bold', error.context);

    if (error.stack) {
      console.log('%cStack Trace:', 'font-weight: bold');
      console.log(error.stack);
    }

    console.log('%cFull Error:', 'font-weight: bold', error.toJSON());
    console.groupEnd();
  }

  /**
   * الحصول على نمط الكونسول حسب الخطورة
   */
  private getConsoleStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'color: #ffffff; background-color: #dc2626; padding: 2px 4px; border-radius: 2px;';
      case ErrorSeverity.HIGH:
        return 'color: #ffffff; background-color: #ea580c; padding: 2px 4px; border-radius: 2px;';
      case ErrorSeverity.MEDIUM:
        return 'color: #000000; background-color: #fbbf24; padding: 2px 4px; border-radius: 2px;';
      case ErrorSeverity.LOW:
        return 'color: #ffffff; background-color: #3b82f6; padding: 2px 4px; border-radius: 2px;';
    }
  }

  /**
   * الحصول على prefix للـ log
   */
  private getLogPrefix(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '⛔';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.LOW:
        return 'ℹ️';
    }
  }

  /**
   * إرسال للخادم البعيد
   */
  private async logToRemote(error: AppError): Promise<void> {
    if (!this.config.remoteLoggingEndpoint) return;

    try {
      await fetch(this.config.remoteLoggingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error.toJSON(),
          environment: this.config.environment,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (err) {
      // فشل الإرسال للخادم - نتجاهله لتجنب حلقة لا نهائية
      if (this.config.environment === 'development') {
        console.warn('Failed to send error to remote logging endpoint:', err);
      }
    }
  }

  /**
   * إشعار المستخدم
   */
  private notifyUser(error: AppError): void {
    if (this.config.notificationHandler) {
      this.config.notificationHandler(error.userMessageAr, error.severity);
    } else {
      // fallback إلى alert في حالة الأخطاء الحرجة فقط
      if (error.severity === ErrorSeverity.CRITICAL && this.config.environment !== 'test') {
        alert(error.userMessageAr);
      }
    }
  }

  /**
   * الحصول على جميع سجلات الأخطاء
   */
  getLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * مسح سجلات الأخطاء
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  /**
   * الحصول على إحصائيات الأخطاء
   */
  getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorLog[];
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const log of this.errorLogs) {
      byCategory[log.error.category] = (byCategory[log.error.category] || 0) + 1;
      bySeverity[log.error.severity] = (bySeverity[log.error.severity] || 0) + 1;
    }

    return {
      total: this.errorLogs.length,
      byCategory,
      bySeverity,
      recent: this.errorLogs.slice(-10),
    };
  }
}

// Instance واحد مشترك
const errorHandler = new ErrorHandler();

/**
 * معالجة خطأ - دالة مساعدة
 */
export function handleError(error: unknown, context?: Partial<ErrorContext>): void {
  errorHandler.handle(error, context);
}

/**
 * معالجة خطأ async - دالة مساعدة
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  context?: Partial<ErrorContext>,
): Promise<T | null> {
  return errorHandler.handleAsync(promise, context);
}

/**
 * wrapper لمعالجة أخطاء الدوال
 */
export function withErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => R,
  context?: Partial<ErrorContext>,
): (...args: T) => R | undefined {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      errorHandler.handle(error, context);
      return undefined;
    }
  };
}

/**
 * wrapper لمعالجة أخطاء الدوال async
 */
export function withAsyncErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>,
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handle(error, context);
      return null;
    }
  };
}

/**
 * إنشاء خطأ شبكة من fetch error
 */
export function createNetworkError(error: unknown, url?: string): NetworkError {
  let type: 'timeout' | 'offline' | 'connection' | 'cors' | 'unknown' = 'unknown';
  let message = 'Network error occurred';

  if (isError(error)) {
    if (error.name === 'AbortError') {
      type = 'timeout';
      message = 'Request timeout';
    } else if (error.message.includes('CORS')) {
      type = 'cors';
      message = 'CORS error';
    } else if (!navigator.onLine) {
      type = 'offline';
      message = 'No internet connection';
    } else {
      type = 'connection';
      message = error.message;
    }
  }

  return new NetworkError(message, { type, url });
}

/**
 * إنشاء خطأ API من Response
 */
export async function createApiError(
  response: Response,
  endpoint?: string,
): Promise<ApiError> {
  let serverMessage = `HTTP ${response.status}: ${response.statusText}`;
  let errorCode: string | undefined;

  try {
    const data = await response.json();
    if (data.message) serverMessage = data.message;
    if (data.error) serverMessage = data.error;
    if (data.code) errorCode = data.code;
    if (data.detail) serverMessage = data.detail;
  } catch {
    // تعذر قراءة JSON من الاستجابة
  }

  return new ApiError(
    serverMessage,
    {
      statusCode: response.status,
      errorCode,
      serverMessage,
      endpoint,
      method: 'unknown',
    },
  );
}

/**
 * تصدير instance المعالج للاستخدام المتقدم
 */
export default errorHandler;

// تصدير الأنواع
export type { ErrorHandlerConfig, ErrorLog };
export {
  ErrorHandler,
  NetworkError,
  ApiError,
  AuthError,
  ValidationError,
  QuantumSimulationError,
  WebGLError,
  WorkerError,
  StorageError,
  ComponentError,
  AppError,
  ErrorCategory,
  ErrorSeverity,
};
