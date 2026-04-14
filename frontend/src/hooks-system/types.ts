/**
 * ============================================================
 * hooks-system/types.ts – أنواع نظام الخطافات
 * Simulation Hooks System – مُقتبس من نظام Hooks
 * ============================================================
 * خطافات دورة حياة المحاكاة: PreSimulation, PostSimulation, OnError, OnComplete
 */

// ─── أحداث الخطافات ─────────────────────────────────────────
export const HOOK_EVENTS = [
  'PreSimulation',
  'PostSimulation',
  'OnError',
  'OnComplete',
  'OnStateChange',
  'PreAnalysis',
  'PostAnalysis',
] as const;
export type HookEvent = (typeof HOOK_EVENTS)[number];

// ─── أنواع الخطافات ─────────────────────────────────────────
export type CommandHook = {
  type: 'command';
  command: string;
  timeout?: number;
  statusMessage?: string;
  once?: boolean;
  async?: boolean;
};

export type PromptHook = {
  type: 'prompt';
  prompt: string;
  timeout?: number;
  statusMessage?: string;
  once?: boolean;
};

export type CallbackHook = {
  type: 'callback';
  handler: (context: HookContext) => void | Promise<void>;
  timeout?: number;
  statusMessage?: string;
  once?: boolean;
};

export type HttpHook = {
  type: 'http';
  url: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
  statusMessage?: string;
  once?: boolean;
};

export type HookCommand = CommandHook | PromptHook | CallbackHook | HttpHook;

// ─── مطابق الخطاف ───────────────────────────────────────────
export interface HookMatcher {
  matcher?: string;
  hooks: HookCommand[];
}

// ─── إعدادات الخطافات ────────────────────────────────────────
export type HooksSettings = Partial<Record<HookEvent, HookMatcher[]>>;

// ─── سياق الخطاف ─────────────────────────────────────────────
export interface HookContext {
  event: HookEvent;
  timestamp: number;
  data: Record<string, unknown>;
  simulationType?: string;
  status?: string;
  error?: Error | null;
}

// ─── نتيجة تنفيذ الخطاف ─────────────────────────────────────
export interface HookResult {
  event: HookEvent;
  success: boolean;
  duration: number;
  error?: string;
}
