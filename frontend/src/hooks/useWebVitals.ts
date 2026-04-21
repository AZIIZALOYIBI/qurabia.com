import { useEffect, useRef, useCallback } from 'react';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
  timestamp: number;
}

interface WebVitalsReport {
  metrics: VitalMetric[];
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  fcpl: number | null;
}

const STORAGE_KEY = 'qurabia.web_vitals';
const MAX_STORED_METRICS = 50;

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    INP: [200, 500],
    TTFB: [800, 1800],
    FCPL: [1800, 3000],
  };
  const [good, poor] = thresholds[name] ?? [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function loadStoredMetrics(): VitalMetric[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeMetric(metric: VitalMetric) {
  try {
    const existing = loadStoredMetrics();
    existing.push(metric);
    const trimmed = existing.slice(-MAX_STORED_METRICS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

function observeLCP(callback: (v: VitalMetric) => void) {
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        callback({
          name: 'LCP',
          value: last.startTime,
          rating: getRating('LCP', last.startTime),
          delta: last.startTime,
          navigationType: performance.navigation.type.toString(),
          timestamp: Date.now(),
        });
      }
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    return po;
  } catch {
    return null;
  }
}

function observeCLS(callback: (v: VitalMetric) => void) {
  try {
    let clsValue = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        navigationType: performance.navigation.type.toString(),
        timestamp: Date.now(),
      });
    });
    po.observe({ type: 'layout-shift', buffered: true });
    return po;
  } catch {
    return null;
  }
}

function observeINP(callback: (v: VitalMetric) => void) {
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let maxDuration = 0;
      for (const entry of entries) {
        const d = (entry as any).duration ?? 0;
        if (d > maxDuration) maxDuration = d;
      }
      if (maxDuration > 0) {
        callback({
          name: 'INP',
          value: maxDuration,
          rating: getRating('INP', maxDuration),
          delta: maxDuration,
          navigationType: performance.navigation.type.toString(),
          timestamp: Date.now(),
        });
      }
    });
    po.observe({ type: 'event', buffered: true });
    return po;
  } catch {
    return null;
  }
}

function getTTFB(): VitalMetric | null {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return null;
    const value = nav.responseStart - nav.requestStart;
    return {
      name: 'TTFB',
      value,
      rating: getRating('TTFB', value),
      delta: value,
      navigationType: nav.type,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

function getFCP(): VitalMetric | null {
  try {
    const entries = performance.getEntriesByName('first-contentful-paint');
    if (entries.length === 0) return null;
    const value = entries[0].startTime;
    return {
      name: 'FCPL',
      value,
      rating: getRating('FCPL', value),
      delta: value,
      navigationType: performance.navigation.type.toString(),
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

export const useWebVitals = () => {
  const metricsRef = useRef<VitalMetric[]>([]);
  const observersRef = useRef<PerformanceObserver[]>([]);

  const getReport = useCallback((): WebVitalsReport => {
    const metrics = loadStoredMetrics();
    const find = (name: string) => {
      const m = metrics.filter((x) => x.name === name);
      return m.length > 0 ? m[m.length - 1].value : null;
    };
    return {
      metrics,
      lcp: find('LCP'),
      fid: find('FID'),
      cls: find('CLS'),
      inp: find('INP'),
      ttfb: find('TTFB'),
      fcpl: find('FCPL'),
    };
  }, []);

  const clearMetrics = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    metricsRef.current = [];
  }, []);

  const reportToBackend = useCallback(async (apiBase: string) => {
    try {
      const report = getReport();
      await fetch(`${apiBase}/api/analytics/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true,
      });
    } catch {}
  }, [getReport]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const handleMetric = (metric: VitalMetric) => {
      metricsRef.current.push(metric);
      storeMetric(metric);
    };

    const ttfb = getTTFB();
    if (ttfb) handleMetric(ttfb);

    const fcp = getFCP();
    if (fcp) handleMetric(fcp);

    const lcpObs = observeLCP(handleMetric);
    if (lcpObs) observersRef.current.push(lcpObs);

    const clsObs = observeCLS(handleMetric);
    if (clsObs) observersRef.current.push(clsObs);

    const inpObs = observeINP(handleMetric);
    if (inpObs) observersRef.current.push(inpObs);

    return () => {
      for (const obs of observersRef.current) {
        obs.disconnect();
      }
      observersRef.current = [];
    };
  }, []);

  return { getReport, clearMetrics, reportToBackend };
};

export type { VitalMetric, WebVitalsReport };
