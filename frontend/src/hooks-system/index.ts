/**
 * ============================================================
 * hooks-system/index.ts – تصدير نظام الخطافات
 * ============================================================
 */
export type {
  HookEvent,
  HookCommand,
  CommandHook,
  PromptHook,
  CallbackHook,
  HttpHook,
  HookMatcher,
  HooksSettings,
  HookContext,
  HookResult,
} from './types';
export { HOOK_EVENTS } from './types';
export { registerHooks, clearHooks, getHooksForEvent, runHooks } from './hookRunner';
