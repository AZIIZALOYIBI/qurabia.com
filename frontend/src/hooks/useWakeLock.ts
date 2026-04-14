import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWakeLockReturn {
  isLocked: boolean;
  isSupported: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
  toggle: () => Promise<void>;
}

export const useWakeLock = (): UseWakeLockReturn => {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported] = useState(
    typeof window !== 'undefined' && 'wakeLock' in navigator,
  );
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      wakeLockRef.current = lock;
      setIsLocked(true);

      lock.addEventListener('release', () => {
        wakeLockRef.current = null;
        setIsLocked(false);
      });
    } catch {}
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isLocked) {
      await release();
    } else {
      await request();
    }
  }, [isLocked, request, release]);

  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLockRef.current !== null) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          wakeLockRef.current = lock;
          setIsLocked(true);
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  return { isLocked, isSupported, request, release, toggle };
};

export type { UseWakeLockReturn };
