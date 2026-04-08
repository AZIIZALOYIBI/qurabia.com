/**
 * useQuantumWebSocket — hook لإدارة WebSocket مع backend المحاكاة الكمومية
 * QURABIA
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface WSProgress {
  step: number;
  total: number;
  progress: number;
  partial?: Record<string, unknown>;
}

export interface WSResult {
  success: boolean;
  simType: string;
  energy?: number;
  fidelity?: number;
  message?: string;
}

export type WSStatus = 'idle' | 'connecting' | 'connected' | 'simulating' | 'done' | 'error';

export const useQuantumWebSocket = (apiBase: string) => {
  const [wsStatus, setWsStatus] = useState<WSStatus>('idle');
  const [wsProgress, setWsProgress] = useState<WSProgress | null>(null);
  const [wsResult, setWsResult] = useState<WSResult | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const runSimulation = useCallback(
    (simType: string, params: Record<string, unknown>) => {
      if (!apiBase) {
        setWsError('لم يُحدَّد عنوان API');
        return;
      }
      wsRef.current?.close();

      const wsUrl = `${apiBase.replace(/^http/, 'ws')}/api/ws/simulate`;
      setWsStatus('connecting');
      setWsProgress(null);
      setWsResult(null);
      setWsError(null);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('simulating');
        ws.send(JSON.stringify({ type: 'SIMULATE', payload: { simType, params } }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.done) {
          setWsResult(data.result);
          setWsStatus('done');
          ws.close();
        } else if (data.error) {
          setWsError(data.error);
          setWsStatus('error');
        } else {
          setWsProgress({ step: data.step, total: data.total, progress: data.progress, partial: data.partial });
        }
      };

      ws.onerror = () => {
        setWsError('خطأ في الاتصال بـ WebSocket');
        setWsStatus('error');
      };
      ws.onclose = () => {
        if (ws.readyState === WebSocket.CLOSED) setWsStatus((s) => (s === 'simulating' ? 'done' : s));
      };
    },
    [apiBase],
  );

  const reset = useCallback(() => {
    wsRef.current?.close();
    setWsStatus('idle');
    setWsProgress(null);
    setWsResult(null);
    setWsError(null);
  }, []);

  return { wsStatus, wsProgress, wsResult, wsError, runSimulation, reset };
};
