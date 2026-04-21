import { useCallback, useState } from 'react';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface UseNativeShareReturn {
  isSupported: boolean;
  shared: boolean;
  share: (data: ShareData) => Promise<boolean>;
  shareSimulationResult: (result: Record<string, unknown>) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
}

export const useNativeShare = (): UseNativeShareReturn => {
  const [shared, setShared] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'share' in navigator;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    setShared(false);

    if (isSupported) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        setShared(true);
        return true;
      } catch {
        return false;
      }
    }

    if (data.url || data.text) {
      const text = data.text ?? data.url ?? '';
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }, [isSupported]);

  const shareSimulationResult = useCallback(
    async (result: Record<string, unknown>): Promise<boolean> => {
      const title = 'نتائج المحاكاة الكمية — عرب qu';
      const text = `نتائج محاكاة كمية من منصة عرب qu:\n${JSON.stringify(result, null, 2)}`;
      const url = 'https://www.qurabia.com';
      return share({ title, text, url });
    },
    [share],
  );

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  return { isSupported, shared, share, shareSimulationResult, copyToClipboard };
};

export type { ShareData, UseNativeShareReturn };
