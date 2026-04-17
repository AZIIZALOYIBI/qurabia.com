/**
 * NotificationSystem — نظام إشعارات متقدم
 * QURABIA Platform
 *
 * نظام إشعارات ديناميكي مع:
 * - Toast notifications مع تأثيرات حية
 * - مؤشر عدد الإشعارات
 * - تصنيف حسب الأهمية
 * - إشعارات صوتية (اختياري)
 */

import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // إزالة تلقائية بعد المدة المحددة
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC<{
  notifications: Notification[];
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        left: 20,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 420,
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} onRemove={onRemove} />
      ))}
    </div>
  );
};

const NotificationToast: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  }, [notification.id, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle2 size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          color: '#10b981',
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.4)',
          color: '#ef4444',
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          color: '#f59e0b',
        };
      case 'info':
        return {
          bg: 'rgba(0, 212, 255, 0.15)',
          border: 'rgba(0, 212, 255, 0.4)',
          color: '#00d4ff',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      role="alert"
      style={{
        background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}dd)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: `0 8px 32px ${colors.color}20, 0 0 0 1px ${colors.color}10`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        minWidth: 320,
        maxWidth: 420,
        pointerEvents: 'auto',
        animation: isExiting ? 'notif-slide-out 300ms ease-out forwards' : 'notif-slide-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <style>
        {`
          @keyframes notif-slide-in {
            from {
              transform: translateX(-120%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes notif-slide-out {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(-120%);
              opacity: 0;
            }
          }
        `}
      </style>

      {/* الأيقونة */}
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${colors.color}20`,
          border: `1px solid ${colors.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.color,
        }}
      >
        {getIcon()}
      </div>

      {/* المحتوى */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--fg)',
            marginBottom: 4,
          }}
        >
          {notification.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--fg-2)',
          }}
        >
          {notification.message}
        </div>
      </div>

      {/* زر الإغلاق */}
      <button
        type="button"
        onClick={handleRemove}
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg-3)',
          cursor: 'pointer',
          transition: 'all 200ms',
        }}
        aria-label="إغلاق الإشعار"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.color = 'var(--fg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'var(--fg-3)';
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationProvider;
