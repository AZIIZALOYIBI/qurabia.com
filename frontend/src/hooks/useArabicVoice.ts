import { useCallback, useEffect, useRef, useState } from 'react';

interface VoiceCommand {
  id: string;
  phrases: string[];
  action: () => void;
}

interface UseArabicVoiceOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseArabicVoiceReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  lastCommand: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  registerCommand: (command: VoiceCommand) => void;
  unregisterCommand: (id: string) => void;
}

const DEFAULT_COMMANDS: VoiceCommand[] = [
  {
    id: 'run-simulation',
    phrases: ['شغّل المحاكاة', 'ابدأ المحاكاة', 'شغل المحاكاة', 'محاكاة'],
    action: () => {
      const btn = document.querySelector('[data-voice="run-simulation"]') as HTMLElement;
      btn?.click();
    },
  },
  {
    id: 'open-command-palette',
    phrases: ['لوحة الأوامر', 'أوامر', 'بحث'],
    action: () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    },
  },
  {
    id: 'go-overview',
    phrases: ['نظرة عامة', 'الرئيسية', 'الصفحة الرئيسية'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-overview"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'go-strategic',
    phrases: ['المحركات الاستراتيجية', 'استراتيجي', 'المحركات'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-strategic"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'go-simulation',
    phrases: ['مختبر المحاكاة', 'محاكاة الكم', 'مختبر'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-simulation"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'go-analytics',
    phrases: ['التحليلات', 'تحليل', 'إحصائيات'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-analytics"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'go-agents',
    phrases: ['الوكلاء', 'وكلاء الذكاء', 'الذكاء الاصطناعي'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-agents"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'go-audit',
    phrases: ['سجل المراجعة', 'مراجعة', 'التدقيق'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-audit"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'go-terminal',
    phrases: ['الطرفية', 'سطر الأوامر', 'terminal'],
    action: () => {
      const tab = document.querySelector('[data-voice="tab-terminal"]') as HTMLElement;
      tab?.click();
    },
  },
  {
    id: 'toggle-theme',
    phrases: ['غيّر المظهر', 'تبديل المظهر', 'وضع ليلي', 'وضع نهاري'],
    action: () => {
      const btn = document.querySelector('[data-voice="toggle-theme"]') as HTMLElement;
      btn?.click();
    },
  },
  {
    id: 'export-results',
    phrases: ['صدّر النتائج', 'تحميل النتائج', 'تصدير'],
    action: () => {
      const btn = document.querySelector('[data-voice="export-results"]') as HTMLElement;
      btn?.click();
    },
  },
];

const normalizeArabic = (text: string): string => {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

export const useArabicVoice = (options: UseArabicVoiceOptions = {}): UseArabicVoiceReturn => {
  const {
    lang = 'ar-SA',
    continuous = true,
    interimResults = true,
    onTranscript,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isSupported] = useState(
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  );

  const recognitionRef = useRef<any>(null);
  const commandsRef = useRef<Map<string, VoiceCommand>>(new Map(DEFAULT_COMMANDS.map((c) => [c.id, c])));

  const matchCommand = useCallback((text: string) => {
    const normalized = normalizeArabic(text);
    for (const [, command] of commandsRef.current) {
      for (const phrase of command.phrases) {
        if (normalized.includes(normalizeArabic(phrase))) {
          setLastCommand(command.id);
          command.action();
          return;
        }
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const full = finalTranscript || interimTranscript;
      setTranscript(full);
      onTranscript?.(full, !!finalTranscript);

      if (finalTranscript) {
        matchCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError?.(event.error);
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      if (continuous && recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          recognitionRef.current = null;
        }
      } else {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      onError?.('failed-to-start');
    }
  }, [isSupported, lang, continuous, interimResults, onTranscript, onError, matchCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const registerCommand = useCallback((command: VoiceCommand) => {
    commandsRef.current.set(command.id, command);
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    commandsRef.current.delete(id);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    registerCommand,
    unregisterCommand,
  };
};

export type { VoiceCommand, UseArabicVoiceOptions, UseArabicVoiceReturn };
