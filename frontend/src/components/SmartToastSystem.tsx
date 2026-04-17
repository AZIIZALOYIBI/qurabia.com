/**
 * SmartToastSystem — نظام إشعارات ذكي بألوان Claude
 *
 * نظام إشعارات متقدم مع تصنيف ذكي، أولويات، وإجراءات سريعة
 * يستخدم ألوان Claude الدافئة والتصميم الحديث
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, Info, CheckCircle, AlertCircle, Zap, Sparkles } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'quantum';
type ToastPriority = 'low' | 'normal' | 'high';

interface ToastAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  priority: ToastPriority;
  duration?: number;
  actions?: ToastAction[];
  dismissible?: boolean;
  timestamp: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id' | 'timestamp'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = {
        ...toast,
        id,
        timestamp: Date.now(),
        dismissible: toast.dismissible ?? true,
        duration: toast.duration ?? 5000,
      };

      setToasts(prev => {
        // فرز حسب الأولوية
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const updated = [newToast, ...prev]
          .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
          .slice(0, maxToasts);
        return updated;
      });

      // إزالة تلقائية بعد المدة المحددة
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 420,
        pointerEvents: 'none',
      }}
      dir="rtl"
    >
      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
        }
        .toast-card {
          animation: toast-slide-in 0.3s var(--ease-emphasized) forwards;
          pointer-events: auto;
        }
        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, rgba(204, 120, 92, 0.3), rgba(204, 120, 92, 0.8));
          transform-origin: left;
          animation: toast-progress-bar linear forwards;
        }
        @keyframes toast-progress-bar {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>

      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onRemove }) => {
  const getTypeConfig = (type: ToastType) => {
    const configs = {
      success: {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.3)',
        icon: CheckCircle,
      },
      error: {
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.08)',
        border: 'rgba(239, 68, 68, 0.3)',
        icon: AlertCircle,
      },
      warning: {
        color: '#D4A574',
        bg: 'rgba(212, 165, 116, 0.08)',
        border: 'rgba(212, 165, 116, 0.3)',
        icon: Info,
      },
      info: {
        color: '#00D4FF',
        bg: 'rgba(0, 212, 255, 0.08)',
        border: 'rgba(0, 212, 255, 0.3)',
        icon: Info,
      },
      quantum: {
        color: '#CC785C',
        bg: 'rgba(204, 120, 92, 0.08)',
        border: 'rgba(204, 120, 92, 0.3)',
        icon: Sparkles,
      },
    };
    return configs[type];
  };

  const config = getTypeConfig(toast.type);
  const Icon = config.icon;

  return (
    <div
      className="toast-card"
      style={{
        background: `linear-gradient(135deg, ${config.bg}, rgba(0,0,0,0.4))`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${config.border}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* شريط التقدم */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="toast-progress"
          style={{
            animationDuration: `${toast.duration}ms`,
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
        {/* الأيقونة */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `${config.color}18`,
            border: `2px solid ${config.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={config.color} />
        </div>

        {/* المحتوى */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: 'var(--fs-base)',
                fontWeight: 700,
                color: config.color,
                fontFamily: 'var(--font-ar)',
              }}
            >
              {toast.title}
            </h4>

            {toast.dismissible && (
              <button
                onClick={() => onRemove(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-3)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  transition: 'all var(--dur-1) var(--ease-standard)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-sm)',
              color: 'var(--fg-2)',
              lineHeight: 1.5,
              fontFamily: 'var(--font-ar)',
            }}
          >
            {toast.message}
          </p>

          {/* الإجراءات */}
          {toast.actions && toast.actions.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {toast.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick();
                    onRemove(toast.id);
                  }}
                  style={{
                    background: action.primary
                      ? `linear-gradient(135deg, ${config.color}25, ${config.color}15)`
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${action.primary ? config.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: action.primary ? config.color : 'var(--fg-2)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ar)',
                    transition: 'all var(--dur-2) var(--ease-standard)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* مؤشر الأولوية */}
          {toast.priority === 'high' && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: config.color,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              <Zap size={10} style={{ display: 'inline', marginLeft: 2 }} />
              عاجل
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToastProvider;
