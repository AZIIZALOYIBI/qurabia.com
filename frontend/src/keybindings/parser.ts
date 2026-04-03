/**
 * ============================================================
 * keybindings/parser.ts – محلل اختصارات لوحة المفاتيح
 * Keybindings System
 * ============================================================
 */

import type { ParsedKeystroke, Chord, ParsedBinding, KeybindingBlock, KeybindingAction, KeybindingContext } from './types';
import { KEYBINDING_ACTIONS, KEYBINDING_CONTEXTS } from './types';

// ─── أسماء المفاتيح المعروفة ────────────────────────────────
const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  space: ' ',
  '↑': 'up', '↓': 'down', '←': 'left', '→': 'right',
};

const MODIFIER_ALIASES: Record<string, keyof ParsedKeystroke> = {
  ctrl: 'ctrl', control: 'ctrl',
  alt: 'alt', opt: 'alt', option: 'alt',
  shift: 'shift',
  meta: 'meta', cmd: 'meta', command: 'meta', super: 'meta', win: 'meta',
};

/**
 * تحليل ضغطة مفتاح واحدة من نص.
 */
export function parseKeystroke(input: string): ParsedKeystroke {
  const parts = input.toLowerCase().split('+');
  const result: ParsedKeystroke = { key: '', ctrl: false, alt: false, shift: false, meta: false };

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed in MODIFIER_ALIASES) {
      const mod = MODIFIER_ALIASES[trimmed];
      (result as Record<string, boolean>)[mod] = true;
    } else {
      result.key = KEY_ALIASES[trimmed] || trimmed;
    }
  }

  return result;
}

/**
 * تحليل وتر (ضغطات متعددة مفصولة بمسافات).
 */
export function parseChord(input: string): Chord {
  // حالة خاصة: مسافة وحدها = مفتاح المسافة
  if (input.trim() === ' ') {
    return [{ key: ' ', ctrl: false, alt: false, shift: false, meta: false }];
  }
  return input.split(/\s+/).filter(Boolean).map(parseKeystroke);
}

/**
 * تحويل ضغطة إلى نص قابل للقراءة.
 */
export function keystrokeToString(ks: ParsedKeystroke): string {
  const parts: string[] = [];
  if (ks.ctrl) parts.push('ctrl');
  if (ks.alt) parts.push('alt');
  if (ks.shift) parts.push('shift');
  if (ks.meta) parts.push('meta');
  parts.push(ks.key);
  return parts.join('+');
}

/**
 * تحويل ضغطة إلى نص عرض (مع رموز المنصة).
 */
export function keystrokeToDisplayString(ks: ParsedKeystroke, platform?: string): string {
  const isMac = platform === 'darwin' || (typeof navigator !== 'undefined' && /mac/i.test(navigator.platform));
  const parts: string[] = [];
  if (ks.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (ks.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (ks.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (ks.meta) parts.push(isMac ? '⌘' : 'Super');
  const keyDisplay = ks.key === ' ' ? 'Space' : ks.key === 'enter' ? '↵' : ks.key.toUpperCase();
  parts.push(keyDisplay);
  return parts.join(isMac ? '' : '+');
}

/**
 * تحليل كتل إعدادات إلى قائمة أربطة محللة.
 */
export function parseBindings(blocks: KeybindingBlock[]): ParsedBinding[] {
  const result: ParsedBinding[] = [];

  for (const block of blocks) {
    const context = block.context as KeybindingContext;
    if (!KEYBINDING_CONTEXTS.includes(context)) continue;

    for (const [key, action] of Object.entries(block.bindings)) {
      const chord = parseChord(key);
      const validAction = action !== null && KEYBINDING_ACTIONS.includes(action as KeybindingAction)
        ? (action as KeybindingAction)
        : null;
      result.push({ chord, action: validAction, context });
    }
  }

  return result;
}
