/**
 * ============================================================
 * keybindings/useKeybindings.ts – خطاف React لنظام الاختصارات
 * Keybindings System
 * ============================================================
 */

import { useEffect, useMemo, useCallback, useState } from 'react';
import type { KeybindingAction, KeybindingContext, ParsedKeystroke, ParsedBinding } from './types';
import { parseBindings } from './parser';
import { DEFAULT_BINDINGS } from './defaultBindings';
import { resolveKeyWithChordState } from './resolver';

/**
 * خطاف React لإدارة اختصارات لوحة المفاتيح.
 */
export function useKeybindings(
  activeContexts: KeybindingContext[],
  handlers: Partial<Record<KeybindingAction, () => void>>,
) {
  const [pending, setPending] = useState<ParsedKeystroke[] | null>(null);

  const bindings: ParsedBinding[] = useMemo(() => {
    return parseBindings(DEFAULT_BINDINGS);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keystroke: ParsedKeystroke = {
        key: e.key.toLowerCase(),
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      };

      // تجاهل الضغطات داخل حقول الإدخال
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const result = resolveKeyWithChordState(keystroke, activeContexts, bindings, pending);

      switch (result.type) {
        case 'match':
          e.preventDefault();
          e.stopPropagation();
          setPending(null);
          handlers[result.action]?.();
          break;

        case 'chord_started':
          e.preventDefault();
          setPending(result.pending);
          break;

        case 'chord_cancelled':
          setPending(null);
          break;

        case 'unbound':
          setPending(null);
          break;

        case 'none':
          // لا شيء
          break;
      }
    },
    [activeContexts, bindings, handlers, pending],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { pending };
}
