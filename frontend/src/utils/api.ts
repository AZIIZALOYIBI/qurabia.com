type ApiError = {
  status: number;
  detail: string;
};

const API_BASE = (() => {
  try {
    const override = localStorage.getItem('qurabia.apiBase') || '';
    if (override) return override.trim().replace(/\/+$/, '');
  } catch {}
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '';
  return 'https://api.qurabia.com';
})();

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  fallback: T | null = null,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = (() => {
    try { return localStorage.getItem('qurabia.auth.token'); } catch { return null; }
  })();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const resp = await fetch(url, {
      ...options,
      headers,
    });

    if (!resp.ok) {
      let detail = `HTTP ${resp.status}`;
      try {
        const body = await resp.json();
        detail = body.detail || detail;
      } catch {}
      const err: ApiError = { status: resp.status, detail };
      throw err;
    }

    return await resp.json() as T;
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    if (fallback !== null) {
      return fallback;
    }
    throw { status: 0, detail: 'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.' } as ApiError;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'status' in err && 'detail' in err;
}

export { API_BASE };
export type { ApiError };
