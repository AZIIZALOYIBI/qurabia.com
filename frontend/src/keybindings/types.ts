/**
 * ============================================================
 * keybindings/types.ts – أنواع نظام اختصارات لوحة المفاتيح
 * Keybindings System – مُقتبس من نظام Keybindings
 * ============================================================
 */

// ─── سياقات الاختصارات ──────────────────────────────────────
export const KEYBINDING_CONTEXTS = [
  'Global',
  'Dashboard',
  'Simulation',
  'Settings',
  'Modal',
  'BlochSphere',
  'Results',
  'Innovation',
] as const;
export type KeybindingContext = (typeof KEYBINDING_CONTEXTS)[number];

// ─── إجراءات الاختصارات ─────────────────────────────────────
export const KEYBINDING_ACTIONS = [
  'app:run',
  'app:reset',
  'app:toggleTheme',
  'app:toggleVisualEngine',
  'app:toggleAnalytics',
  'app:help',
  'app:export',
  'simulation:start',
  'simulation:stop',
  'simulation:configure',
  'dashboard:refresh',
  'dashboard:toggleSidebar',
  'modal:close',
  'modal:confirm',
  'bloch:rotateLeft',
  'bloch:rotateRight',
  'bloch:reset',
  'innovation:runSuite',
  'innovation:runQRP',
  'innovation:runEDC',
  'innovation:runQAGE',
] as const;
export type KeybindingAction = (typeof KEYBINDING_ACTIONS)[number];

// ─── ضغطة مفتاح محللة ──────────────────────────────────────
export interface ParsedKeystroke {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

// ─── وتر (ضربات متعددة) ─────────────────────────────────────
export type Chord = ParsedKeystroke[];

// ─── ربط محلل ────────────────────────────────────────────────
export interface ParsedBinding {
  chord: Chord;
  action: KeybindingAction | null;
  context: KeybindingContext;
}

// ─── كتلة إعدادات ────────────────────────────────────────────
export interface KeybindingBlock {
  context: string;
  bindings: Record<string, string | null>;
}

// ─── نتيجة الحل ─────────────────────────────────────────────
export type ResolveResult =
  | { type: 'match'; action: KeybindingAction }
  | { type: 'none' }
  | { type: 'unbound' }
  | { type: 'chord_started'; pending: ParsedKeystroke[] }
  | { type: 'chord_cancelled' };

// ─── اختصارات غير قابلة لإعادة الربط ────────────────────────
export const NON_REBINDABLE = ['ctrl+c', 'ctrl+d'] as const;
