import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/DesignSystem.css';
import './styles/ClaudeDesignSystem.css';

const normalizeApiBase = (value: string) => value.trim().replace(/\/+$/, '');

const getApiBase = () => {
  try {
    const override = localStorage.getItem('qurabia.apiBase') || '';
    if (override) return normalizeApiBase(override);
  } catch {}
  const fromEnv = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '';
  return normalizeApiBase('https://api.qurabia.com');
};

const safeReportError = async (payload: Record<string, unknown>) => {
  try {
    const apiBase = getApiBase();
    if (!apiBase) return;

    const resp = await fetch(`${apiBase}/api/learning/error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!resp.ok) {
      console.warn(`Error reporting failed: HTTP ${resp.status}`);
    }
  } catch (err) {
    console.warn('Failed to report error to backend:', err);
  }
};

// Landing page redirect — في الإنتاج، حوّل الزائر الجديد إلى landing.html
if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  try {
    const url = new URL(window.location.href);
    const hasRedirect = url.searchParams.has('redirect');
    if (!hasRedirect) {
      const wantsApp = url.searchParams.get('app') === '1';
      if (wantsApp) {
        localStorage.setItem('qurabia.skipLanding', '1');
      } else {
        const skipLanding = localStorage.getItem('qurabia.skipLanding') === '1';
        if (!skipLanding && url.pathname === '/') {
          window.location.replace('/landing.html');
        }
      }
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const message = (event.error?.message || event.message || 'Unknown error').toString().slice(0, 500);
    const stack = (event.error?.stack || '').toString().slice(0, 2000);
    void safeReportError({
      kind: 'window_error',
      message,
      url: window.location.href,
      stack,
      user_agent: navigator.userAgent,
      release: import.meta.env.VITE_APP_VERSION || '',
      ts: Date.now() / 1000,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason: unknown = event.reason;
    const message = (
      typeof reason === 'object' && reason !== null && 'message' in reason
        ? String((reason as { message: unknown }).message)
        : String(reason || 'Unhandled rejection')
    ).slice(0, 500);
    const stack = (
      typeof reason === 'object' && reason !== null && 'stack' in reason
        ? String((reason as { stack: unknown }).stack)
        : ''
    ).slice(0, 2000);
    void safeReportError({
      kind: 'unhandled_rejection',
      message,
      url: window.location.href,
      stack,
      user_agent: navigator.userAgent,
      release: import.meta.env.VITE_APP_VERSION || '',
      ts: Date.now() / 1000,
    });
  });
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('العنصر الجذري #root غير موجود');
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            const banner = document.createElement('div');
            banner.setAttribute('role', 'alert');
            banner.setAttribute('dir', 'rtl');
            Object.assign(banner.style, {
              position: 'fixed',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: '99999',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              fontFamily: 'system-ui, sans-serif',
            });
            banner.textContent = 'يتوفر تحديث جديد — ';
            const btn = document.createElement('button');
            Object.assign(btn.style, {
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '800',
            });
            btn.textContent = 'تحديث الآن';
            btn.onclick = () => {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            };
            banner.appendChild(btn);
            document.body.appendChild(banner);
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch {
      // SW registration failed silently
    }
  });
}
