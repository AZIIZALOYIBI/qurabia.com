/**
 * API Client with Caching Integration
 * عميل API مع التخزين المؤقت المدمج
 *
 * This module provides cached API calls for QURABIA platform endpoints
 */

import { createCachedAPI, cachedFetch } from './query-cache';

// API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000';

// Create cached API client
const api = createCachedAPI(API_BASE_URL);

// ── Type Definitions ──────────────────────────────────────────────────────────

interface AUTDIERequest {
  kappa?: number;
  lam?: number;
}

interface AUTDIEResponse {
  S_AUTDIE: number;
  QBER_AUTDIE: number;
  secure: boolean;
  cached?: boolean;
}

interface AlUtaibiV2Request {
  r?: number;
  rho_dm?: number;
  rho_de?: number;
}

interface AlUtaibiV2Response {
  E_basic: number;
  otaibi_factor: number;
  E_v1: number;
  dark_correction: number;
  qm_effect: number;
  E_total: number;
  eV: number;
  cached?: boolean;
}

interface HealthResponse {
  status: string;
  timestamp: number;
  cache?: {
    status: string;
    hit_rate: number;
    entries: number;
    size_mb: number;
  };
}

// ── Cached API Functions ──────────────────────────────────────────────────────

/**
 * Compute AUTDIE quantum security metrics (cached)
 */
export async function computeAUTDIE(
  params: AUTDIERequest = {}
): Promise<AUTDIEResponse> {
  return api.post<AUTDIEResponse>('/api/autdie', params, {
    ttl: 3600000, // 1 hour cache
    staleWhileRevalidate: true,
    persist: true, // Persist to localStorage
  });
}

/**
 * Compute Al-Utaibi Unified Cosmic Equation v2.0 (cached)
 */
export async function computeAlUtaibiV2(
  params: AlUtaibiV2Request = {}
): Promise<AlUtaibiV2Response> {
  return api.post<AlUtaibiV2Response>('/api/al-utaibi-v2', params, {
    ttl: 3600000, // 1 hour cache
    staleWhileRevalidate: true,
    persist: true,
  });
}

/**
 * Get health status (short cache)
 */
export async function getHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>('/health', {
    ttl: 30000, // 30 seconds cache
    staleWhileRevalidate: true,
    persist: false, // Don't persist health checks
  });
}

/**
 * Get cache statistics from backend
 */
export async function getCacheStats() {
  return api.get<any>('/api/cache/stats', {
    ttl: 5000, // 5 seconds cache
    staleWhileRevalidate: false,
    persist: false,
  });
}

// ── Cache Management Functions ────────────────────────────────────────────────

/**
 * Invalidate AUTDIE cache entries
 */
export function invalidateAUTDIECache(): number {
  return api.invalidate('*autdie*');
}

/**
 * Invalidate Al-Utaibi cache entries
 */
export function invalidateAlUtaibiCache(): number {
  return api.invalidate('*al-utaibi*');
}

/**
 * Get client-side cache statistics
 */
export function getClientCacheStats() {
  return api.getStats();
}

/**
 * Clear all client-side cache
 */
export function clearClientCache(): void {
  const cache = api.getStats();
  // Clear via the cache instance
  import('./query-cache').then(({ default: getQueryCache }) => {
    getQueryCache().clear();
  });
}

// ── Cache Warming ──────────────────────────────────────────────────────────────

/**
 * Warm cache with common parameter values
 */
export async function warmCache(): Promise<void> {
  console.info('[API] Warming cache with common parameters...');

  try {
    // Warm AUTDIE cache
    const autdiePromises = [
      computeAUTDIE({ kappa: 0.7854, lam: 1.0 }), // Default
      computeAUTDIE({ kappa: 0.0, lam: 1.0 }),
      computeAUTDIE({ kappa: 1.5708, lam: 1.0 }), // π/2
      computeAUTDIE({ kappa: 3.1416, lam: 1.0 }), // π
    ];

    // Warm Al-Utaibi cache
    const alUtaibiPromises = [
      computeAlUtaibiV2({ r: 1.616e-35, rho_dm: 1.8e10, rho_de: 1e-10 }), // Default
      computeAlUtaibiV2({ r: 1e-34, rho_dm: 1.8e10, rho_de: 1e-10 }),
      computeAlUtaibiV2({ r: 1e-36, rho_dm: 1.8e10, rho_de: 1e-10 }),
    ];

    await Promise.allSettled([...autdiePromises, ...alUtaibiPromises]);

    const stats = getClientCacheStats();
    console.info(`[API] Cache warmed. Stats:`, stats);
  } catch (error) {
    console.warn('[API] Cache warming failed:', error);
  }
}

// ── React Hooks (if using React) ───────────────────────────────────────────────

/**
 * React hook for cached AUTDIE computation
 */
export function useAUTDIE(params: AUTDIERequest = {}) {
  const [data, setData] = React.useState<AUTDIEResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await computeAUTDIE(params);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}

/**
 * React hook for cached Al-Utaibi computation
 */
export function useAlUtaibiV2(params: AlUtaibiV2Request = {}) {
  const [data, setData] = React.useState<AlUtaibiV2Response | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await computeAlUtaibiV2(params);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}

// Export API client for advanced usage
export { api };

// Export for importing React if available
declare const React: any;
