import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/DesignSystem.css';

const normalizeApiBase = (value: string) => value.trim().replace(/\/+$/, '');

const getApiBase = () => {
  try {
    const override = localStorage.getItem('qurabia.apiBase') || '';
    if (override) return normalizeApiBase(override);
  } catch {}
  const fromEnv = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || '');
  if (fromEnv) return fromEnv;
  if (!import.meta.env.DEV && typeof window !== 'undefined') return normalizeApiBase(window.location.origin);
  if (import.meta.env.DEV) return '';
  return normalizeApiBase('https://api.qurabia.com');
};

const safeReportError = async (payload: Record<string, any>) => {
  try {
    const apiBase = getApiBase();
    if (!apiBase) return;

    await fetch(`${apiBase}/api/learning/error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
};

if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  try {
    const url = new URL(window.location.href);
    const wantsApp = url.searchParams.get('app') === '1';
    if (wantsApp) {
      localStorage.setItem('qurabia.skipLanding', '1');
    } else {
      const skipLanding = localStorage.getItem('qurabia.skipLanding') === '1';
      if (!skipLanding && url.pathname === '/') {
        window.location.replace('/landing.html');
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

  window.addEventListener('unhandledrejection', (event) => {
    const reason: any = (event as any).reason;
    const message = (reason?.message || String(reason || 'Unhandled rejection')).toString().slice(0, 500);
    const stack = (reason?.stack || '').toString().slice(0, 2000);
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
