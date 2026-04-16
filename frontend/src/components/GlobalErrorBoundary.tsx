/**
 * ============================================================
 * GlobalErrorBoundary.tsx - حدود الخطأ العامة للتطبيق
 * QURABIA
 *
 * مكون React Error Boundary شامل يلتقط جميع أخطاء المكونات
 * غير المعالجة ويعرض واجهة مستخدم احترافية مع خيارات التعافي.
 * ============================================================
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import errorHandler, {
  ComponentError,
  ErrorSeverity,
  ErrorCategory,
} from './utils/error-handler';
import { isAppError, getErrorMessageAr } from './types/errors';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  /** مكون fallback مخصص */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** دالة تُستدعى عند حدوث خطأ */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** عرض زر إعادة التحميل */
  showResetButton?: boolean;
  /** عرض تفاصيل الخطأ التقنية */
  showErrorDetails?: boolean;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * حدود الخطأ العامة للتطبيق.
 * يلتقط جميع أخطاء React غير المعالجة ويعرض واجهة بديلة أنيقة.
 */
class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // تسجيل الخطأ في النظام المركزي
    const componentError = new ComponentError(
      error.message,
      this.extractComponentName(errorInfo.componentStack),
      {
        metadata: {
          componentStack: errorInfo.componentStack,
        },
        stack: error.stack,
      },
    );

    errorHandler.handle(componentError);

    // تحديث الحالة
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // استدعاء callback المخصص
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // في حالة تكرار الأخطاء بشكل سريع، قد نحتاج لإعادة تحميل الصفحة
    if (this.state.errorCount > 5) {
      console.error('Too many errors detected. Consider reloading the page.');
    }
  }

  /**
   * استخراج اسم المكون من component stack
   */
  private extractComponentName(componentStack?: string): string {
    if (!componentStack) return 'Unknown';

    const match = componentStack.match(/^\s*at (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * إعادة تعيين حالة الخطأ
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * إعادة تحميل الصفحة
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * نسخ تفاصيل الخطأ للحافظة
   */
  private handleCopyError = (): void => {
    if (!this.state.error) return;

    const errorDetails = {
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const text = JSON.stringify(errorDetails, null, 2);

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('تم نسخ تفاصيل الخطأ');
      })
      .catch(() => {
        // فشل النسخ - نعرض في نافذة جديدة
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<pre>${text}</pre>`);
        }
      });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // إذا كان هناك fallback مخصص
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // الواجهة الافتراضية
      const showDetails = this.props.showErrorDetails ?? process.env.NODE_ENV === 'development';
      const showReset = this.props.showResetButton ?? true;
      const errorMessage = getErrorMessageAr(this.state.error);
      const isRecoverable = !isAppError(this.state.error) || this.state.error.isRecoverable;

      return (
        <div
          role="alert"
          aria-live="assertive"
          aria-label="خطأ في التطبيق"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'var(--bg, #09090b)',
            fontFamily: 'var(--font-ui, system-ui)',
          }}
        >
          <div
            className="ui-card"
            style={{
              maxWidth: 600,
              width: '100%',
              padding: 32,
              borderRadius: 24,
              background: 'var(--surface, #18181b)',
              border: '1px solid var(--outline, #27272a)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* أيقونة ورأسية */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}
              >
                ⚠️
              </div>
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <h1
                  style={{
                    fontFamily: 'var(--font-ar, system-ui)',
                    fontSize: 24,
                    fontWeight: 900,
                    color: 'var(--q-error, #ef4444)',
                    marginBottom: 8,
                  }}
                >
                  حدث خطأ غير متوقع
                </h1>
                <p
                  style={{
                    fontFamily: 'var(--font-ar, system-ui)',
                    fontSize: 15,
                    color: 'var(--fg-2, #a1a1aa)',
                    lineHeight: 1.6,
                  }}
                >
                  {errorMessage}
                </p>
              </div>
            </div>

            {/* تفاصيل الخطأ التقنية */}
            {showDetails && (
              <div
                style={{
                  marginBottom: 24,
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--surface-2, #27272a)',
                  border: '1px solid var(--outline, #3f3f46)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12,
                    color: 'var(--fg-3, #71717a)',
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  التفاصيل التقنية:
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    color: 'var(--q-error, #ef4444)',
                    wordBreak: 'break-word',
                    marginBottom: 8,
                  }}
                >
                  {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <details>
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 11,
                        color: 'var(--fg-3, #71717a)',
                        marginBottom: 8,
                      }}
                    >
                      Stack Trace
                    </summary>
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 10,
                        color: 'var(--fg-3, #71717a)',
                        overflow: 'auto',
                        maxHeight: 200,
                        marginTop: 8,
                        padding: 8,
                        background: 'var(--bg, #09090b)',
                        borderRadius: 8,
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* الأزرار */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {isRecoverable && showReset && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="ui-btn ui-btn-filled"
                  style={{
                    flex: '1 1 auto',
                    minWidth: 120,
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: 'var(--p-primary, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    fontFamily: 'var(--font-ar, system-ui)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  المحاولة مرة أخرى
                </button>
              )}
              <button
                type="button"
                onClick={this.handleReload}
                className="ui-btn ui-btn-outlined"
                style={{
                  flex: '1 1 auto',
                  minWidth: 120,
                  padding: '12px 24px',
                  borderRadius: 12,
                  background: 'transparent',
                  color: 'var(--fg-2, #a1a1aa)',
                  border: '1px solid var(--outline, #3f3f46)',
                  fontFamily: 'var(--font-ar, system-ui)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                إعادة تحميل الصفحة
              </button>
              {showDetails && (
                <button
                  type="button"
                  onClick={this.handleCopyError}
                  className="ui-btn ui-btn-text"
                  style={{
                    flex: '1 1 auto',
                    minWidth: 120,
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: 'transparent',
                    color: 'var(--fg-3, #71717a)',
                    border: 'none',
                    fontFamily: 'var(--font-ar, system-ui)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  نسخ التفاصيل
                </button>
              )}
            </div>

            {/* معلومات إضافية */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid var(--outline, #3f3f46)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-ar, system-ui)',
                  fontSize: 12,
                  color: 'var(--fg-3, #71717a)',
                  lineHeight: 1.6,
                }}
              >
                إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
                <br />
                <a
                  href="/contact"
                  style={{
                    color: 'var(--p-primary, #8b5cf6)',
                    textDecoration: 'underline',
                  }}
                >
                  اتصل بنا
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
