/**
 * ============================================================
 * hooks-system/hookRunner.ts – محرك تنفيذ الخطافات
 * Simulation Hooks System
 * ============================================================
 * يدير تسجيل وتنفيذ خطافات دورة حياة المحاكاة.
 */

import type {
  HookEvent,
  HookCommand,
  HookMatcher,
  HooksSettings,
  HookContext,
  HookResult,
} from './types';

// ─── السجل العام للخطافات ────────────────────────────────────
let _globalHooks: HooksSettings = {};
const _onceExecuted = new Set<string>();

/**
 * تسجيل خطافات جديدة.
 */
export function registerHooks(settings: HooksSettings): void {
  for (const [event, matchers] of Object.entries(settings)) {
    const hookEvent = event as HookEvent;
    if (!_globalHooks[hookEvent]) {
      _globalHooks[hookEvent] = [];
    }
    _globalHooks[hookEvent]!.push(...(matchers || []));
  }
}

/**
 * إلغاء تسجيل جميع الخطافات.
 */
export function clearHooks(): void {
  _globalHooks = {};
  _onceExecuted.clear();
}

/**
 * الحصول على الخطافات المسجلة لحدث معين.
 */
export function getHooksForEvent(event: HookEvent): HookMatcher[] {
  return _globalHooks[event] || [];
}

/**
 * تنفيذ خطاف واحد.
 */
async function executeHook(hook: HookCommand, context: HookContext): Promise<HookResult> {
  const start = performance.now();
  const timeout = hook.timeout || 30000;
  const hookKey = `${context.event}:${hook.type}:${
    hook.type === 'callback' ? 'fn' :
    hook.type === 'http' ? hook.url :
    hook.type === 'command' ? hook.command :
    hook.type === 'prompt' ? hook.prompt.slice(0, 50) : ''
  }`;

  // التحقق من الخطافات المنفذة مرة واحدة
  if (hook.once && _onceExecuted.has(hookKey)) {
    return { event: context.event, success: true, duration: 0 };
  }

  try {
    const promise = executeHookByType(hook, context);

    // مهلة زمنية
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Hook timeout after ${timeout}ms`)), timeout)
      ),
    ]);

    if (hook.once) {
      _onceExecuted.add(hookKey);
    }

    return {
      event: context.event,
      success: true,
      duration: performance.now() - start,
    };
  } catch (err) {
    return {
      event: context.event,
      success: false,
      duration: performance.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * تنفيذ خطاف حسب نوعه.
 */
async function executeHookByType(hook: HookCommand, context: HookContext): Promise<void> {
  switch (hook.type) {
    case 'callback':
      await hook.handler(context);
      break;

    case 'http': {
      const response = await fetch(hook.url, {
        method: hook.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(hook.headers || {}),
        },
        body: JSON.stringify(context),
      });
      if (!response.ok) {
        throw new Error(`HTTP hook failed: ${response.status} ${response.statusText}`);
      }
      break;
    }

    case 'prompt':
      // تسجيل البروميت للمعالجة لاحقاً
      console.log(`[Hook:prompt] ${hook.statusMessage || hook.prompt.slice(0, 100)}`);
      break;

    case 'command':
      // تسجيل الأمر للتنفيذ (في بيئة المتصفح، لا يمكن تنفيذ أوامر shell)
      console.log(`[Hook:command] ${hook.statusMessage || hook.command}`);
      break;
  }
}

/**
 * تشغيل جميع الخطافات لحدث معين.
 */
export async function runHooks(event: HookEvent, data: Record<string, unknown> = {}): Promise<HookResult[]> {
  const matchers = getHooksForEvent(event);
  if (matchers.length === 0) return [];

  const context: HookContext = {
    event,
    timestamp: Date.now(),
    data,
    simulationType: data.simulationType as string | undefined,
    status: data.status as string | undefined,
    error: data.error as Error | null | undefined,
  };

  const results: HookResult[] = [];

  for (const matcher of matchers) {
    // التحقق من المطابقة
    if (matcher.matcher && data.type && !matchesPattern(matcher.matcher, String(data.type))) {
      continue;
    }

    for (const hook of matcher.hooks) {
      if (hook.async) {
        // تنفيذ غير متزامن (لا ينتظر)
        executeHook(hook, context).then((r) => {
          if (!r.success) console.warn(`[Hook] Async hook failed:`, r.error);
        });
        results.push({ event, success: true, duration: 0 });
      } else {
        const result = await executeHook(hook, context);
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * مطابقة نمط بسيطة (يدعم * كبدل).
 */
function matchesPattern(pattern: string, value: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    return value.startsWith(pattern.slice(0, -1));
  }
  return pattern === value;
}
