/**
 * ============================================================
 * keybindings/resolver.ts – محلل مطابقة الاختصارات
 * Keybindings System
 * ============================================================
 */

import type { ParsedKeystroke, ParsedBinding, KeybindingContext, ResolveResult } from './types';

/**
 * مقارنة ضغطتين.
 */
export function keystrokesEqual(a: ParsedKeystroke, b: ParsedKeystroke): boolean {
  return (
    a.key === b.key &&
    a.ctrl === b.ctrl &&
    (a.alt || a.meta) === (b.alt || b.meta) &&
    a.shift === b.shift
  );
}

/**
 * حل مفتاح واحد مقابل قائمة الأربطة.
 */
export function resolveKey(
  keystroke: ParsedKeystroke,
  activeContexts: readonly KeybindingContext[],
  bindings: readonly ParsedBinding[],
): ResolveResult {
  // البحث بترتيب عكسي (الأخير يفوز)
  for (let i = bindings.length - 1; i >= 0; i--) {
    const binding = bindings[i];
    if (binding.chord.length !== 1) continue;
    if (!activeContexts.includes(binding.context)) continue;
    if (!keystrokesEqual(keystroke, binding.chord[0])) continue;

    if (binding.action === null) {
      return { type: 'unbound' };
    }
    return { type: 'match', action: binding.action };
  }

  return { type: 'none' };
}

/**
 * حل مع دعم الأوتار (chord).
 */
export function resolveKeyWithChordState(
  keystroke: ParsedKeystroke,
  activeContexts: readonly KeybindingContext[],
  bindings: readonly ParsedBinding[],
  pending: ParsedKeystroke[] | null,
): ResolveResult {
  // إلغاء الوتر بالضغط على Escape
  if (pending && keystroke.key === 'escape') {
    return { type: 'chord_cancelled' };
  }

  // إكمال وتر قيد الانتظار
  if (pending) {
    const fullChord = [...pending, keystroke];

    for (let i = bindings.length - 1; i >= 0; i--) {
      const binding = bindings[i];
      if (binding.chord.length !== fullChord.length) continue;
      if (!activeContexts.includes(binding.context)) continue;

      const allMatch = binding.chord.every((ks, idx) => keystrokesEqual(ks, fullChord[idx]));
      if (!allMatch) continue;

      if (binding.action === null) return { type: 'unbound' };
      return { type: 'match', action: binding.action };
    }

    return { type: 'chord_cancelled' };
  }

  // البحث عن أوتار تبدأ بهذا المفتاح
  const chordCandidates = bindings.filter(
    (b) =>
      b.chord.length > 1 &&
      activeContexts.includes(b.context) &&
      keystrokesEqual(b.chord[0], keystroke)
  );

  if (chordCandidates.length > 0) {
    return { type: 'chord_started', pending: [keystroke] };
  }

  // حل مفتاح واحد عادي
  return resolveKey(keystroke, activeContexts, bindings);
}

/**
 * الحصول على نص عرض لإجراء معين.
 */
export function getBindingDisplayText(
  action: string,
  context: KeybindingContext,
  bindings: readonly ParsedBinding[],
): string | undefined {
  for (let i = bindings.length - 1; i >= 0; i--) {
    const binding = bindings[i];
    if (binding.action === action && binding.context === context) {
      return binding.chord
        .map((ks) => {
          const parts: string[] = [];
          if (ks.ctrl) parts.push('Ctrl');
          if (ks.alt) parts.push('Alt');
          if (ks.shift) parts.push('Shift');
          if (ks.meta) parts.push('⌘');
          parts.push(ks.key === ' ' ? 'Space' : ks.key === 'enter' ? '↵' : ks.key.toUpperCase());
          return parts.join('+');
        })
        .join(' ');
    }
  }
  return undefined;
}
