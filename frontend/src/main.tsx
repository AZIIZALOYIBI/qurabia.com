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
  return normalizeApiBase(import.meta.env.VITE_API_BASE_URL || 'https://api.qurabia.com');
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
