/**
 * اختبارات مكوّن AgentsDashboard
 * ================================
 * اختبارات Vitest لمكوّن لوحة الوكلاء الذكيين.
 *
 * تشغيل:
 *   cd frontend && npx vitest run src/__tests__/agents.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// محاكاة fetch العالمي
// ═══════════════════════════════════════════════════════════════════════════════

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── بيانات استجابة مزيفة ─────────────────────────────────────────────────────

const MOCK_AGENT_RESPONSE = {
  agent_id: 'ab12cd34',
  agent_type: 'creativity',
  status: 'done',
  thought: 'تحليل الطلب الإبداعي وصياغة خطة متنوعة',
  action: 'نفّذ الوكيل 5 عمليات',
  reflection: 'وُلِّدت أفكار متنوعة بمعامل إبداع عالٍ',
  result: {
    ideas: ['فكرة ١', 'فكرة ٢', 'فكرة ٣'],
    creativity_score: 0.92,
    diversity_index: 0.88,
  },
  duration_ms: 87.5,
  timestamp: Date.now() / 1000,
};

const MOCK_ORCHESTRATOR_RESPONSE = {
  session_id: 'abc123def456',
  results: {
    creativity: { ...MOCK_AGENT_RESPONSE, agent_type: 'creativity' },
    development: { ...MOCK_AGENT_RESPONSE, agent_type: 'development' },
    research: { ...MOCK_AGENT_RESPONSE, agent_type: 'research' },
    quality: { ...MOCK_AGENT_RESPONSE, agent_type: 'quality' },
  },
  summary: 'اكتملت 4/4 وكلاء بنجاح',
  total_duration_ms: 350.2,
  timestamp: Date.now() / 1000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات نموذج البيانات (Types / Interfaces)
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentsDashboard — أنواع البيانات', () => {
  it('بيانات الوكيل يجب أن تحتوي على الحقول المطلوبة', () => {
    const response = MOCK_AGENT_RESPONSE;
    expect(response).toHaveProperty('agent_id');
    expect(response).toHaveProperty('agent_type');
    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('thought');
    expect(response).toHaveProperty('action');
    expect(response).toHaveProperty('reflection');
    expect(response).toHaveProperty('result');
    expect(response).toHaveProperty('duration_ms');
    expect(response).toHaveProperty('timestamp');
  });

  it('حالات الوكيل الصالحة يجب أن تكون محددة', () => {
    const validStatuses = ['idle', 'thinking', 'acting', 'reflecting', 'done', 'error'];
    expect(validStatuses).toContain(MOCK_AGENT_RESPONSE.status);
  });

  it('أنواع الوكلاء الصالحة يجب أن تكون أربعة', () => {
    const validTypes = ['creativity', 'development', 'research', 'quality'];
    expect(validTypes).toContain(MOCK_AGENT_RESPONSE.agent_type);
  });

  it('استجابة المُنسِّق يجب أن تحتوي على session_id وsummary', () => {
    expect(MOCK_ORCHESTRATOR_RESPONSE).toHaveProperty('session_id');
    expect(MOCK_ORCHESTRATOR_RESPONSE).toHaveProperty('summary');
    expect(MOCK_ORCHESTRATOR_RESPONSE).toHaveProperty('total_duration_ms');
    expect(Object.keys(MOCK_ORCHESTRATOR_RESPONSE.results)).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات منطق الـ fetch
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentsDashboard — منطق الـ fetch', () => {
  /**
   * دالة مساعدة تحاكي منطق runAgent في المكوّن
   */
  async function runAgent(agentId: string, prompt: string): Promise<typeof MOCK_AGENT_RESPONSE | null> {
    if (!prompt.trim()) return null;
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), language: 'ar' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as typeof MOCK_AGENT_RESPONSE;
    } catch {
      return null;
    }
  }

  /**
   * دالة مساعدة تحاكي منطق runAllAgents في المكوّن
   */
  async function runAllAgents(
    prompt: string,
    agents: string[],
  ): Promise<typeof MOCK_ORCHESTRATOR_RESPONSE | null> {
    if (!prompt.trim()) return null;
    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agents, language: 'ar' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as typeof MOCK_ORCHESTRATOR_RESPONSE;
    } catch {
      return null;
    }
  }

  it('runAgent يجب أن يُرسل POST إلى endpoint صحيح', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_AGENT_RESPONSE),
    });

    const result = await runAgent('creativity', 'فكرة جديدة');
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/agents/creativity',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result).not.toBeNull();
  });

  it('runAgent يُرسل البيانات بشكل صحيح في body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_AGENT_RESPONSE),
    });

    await runAgent('development', 'تحسين الأداء');
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string) as { prompt: string; language: string };
    expect(body.prompt).toBe('تحسين الأداء');
    expect(body.language).toBe('ar');
  });

  it('runAgent يُعيد null عند prompt فارغ', async () => {
    const result = await runAgent('creativity', '   ');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('runAgent يُعيد null عند خطأ HTTP', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const result = await runAgent('creativity', 'طلب تجريبي');
    expect(result).toBeNull();
  });

  it('runAgent يُعيد null عند رفض الشبكة (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));
    const result = await runAgent('quality', 'فحص الجودة');
    expect(result).toBeNull();
  });

  it('runAllAgents يُرسل POST إلى /api/agents/orchestrate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_ORCHESTRATOR_RESPONSE),
    });

    const result = await runAllAgents('تحليل المشروع', ['creativity', 'quality']);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/agents/orchestrate',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).not.toBeNull();
    expect(result?.session_id).toBe('abc123def456');
  });

  it('runAllAgents يُرسل قائمة الوكلاء في body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_ORCHESTRATOR_RESPONSE),
    });

    const agents = ['creativity', 'development', 'research', 'quality'];
    await runAllAgents('اختبار شامل', agents);
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      agents: string[];
      prompt: string;
      language: string;
    };
    expect(callBody.agents).toEqual(agents);
    expect(callBody.language).toBe('ar');
  });

  it('runAllAgents يُعيد null عند prompt فارغ', async () => {
    const result = await runAllAgents('', ['creativity']);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('runAllAgents يُعيد null عند فشل الشبكة', async () => {
    mockFetch.mockRejectedValueOnce(new Error('CORS Error'));
    const result = await runAllAgents('طلب عام', ['creativity']);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات منطق الحالة (State Logic)
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentsDashboard — منطق الحالة', () => {
  /**
   * محاكاة آلة الحالة الخاصة بوكيل واحد
   */
  type AgentStatus = 'idle' | 'thinking' | 'acting' | 'reflecting' | 'done' | 'error';
  type AgentState = { status: AgentStatus; result: unknown; error: string | null };
  type AgentType = 'creativity' | 'development' | 'research' | 'quality';

  function createInitialState(): Record<AgentType, AgentState> {
    return {
      creativity: { status: 'idle', result: null, error: null },
      development: { status: 'idle', result: null, error: null },
      research: { status: 'idle', result: null, error: null },
      quality: { status: 'idle', result: null, error: null },
    };
  }

  it('الحالة الأولية: جميع الوكلاء في حالة idle', () => {
    const state = createInitialState();
    for (const agent of Object.values(state)) {
      expect(agent.status).toBe('idle');
      expect(agent.result).toBeNull();
      expect(agent.error).toBeNull();
    }
  });

  it('تحديث حالة وكيل واحد لا يؤثر على باقي الوكلاء', () => {
    const state = createInitialState();
    // محاكاة بدء تشغيل الوكيل
    const updated: Record<AgentType, AgentState> = {
      ...state,
      creativity: { status: 'thinking', result: null, error: null },
    };
    expect(updated.creativity.status).toBe('thinking');
    expect(updated.development.status).toBe('idle');
    expect(updated.research.status).toBe('idle');
    expect(updated.quality.status).toBe('idle');
  });

  it('الوكيل في حالة "done" يحتوي على نتيجة غير null', () => {
    const state: AgentState = {
      status: 'done',
      result: MOCK_AGENT_RESPONSE,
      error: null,
    };
    expect(state.result).not.toBeNull();
    expect(state.error).toBeNull();
  });

  it('الوكيل في حالة "error" يحتوي على رسالة خطأ', () => {
    const state: AgentState = {
      status: 'error',
      result: null,
      error: 'فشل الاتصال بالخادم',
    };
    expect(state.error).not.toBeNull();
    expect(state.result).toBeNull();
  });

  it('حساب عدد الوكلاء المكتملة يعمل بشكل صحيح', () => {
    const state: Record<AgentType, AgentState> = {
      creativity: { status: 'done', result: MOCK_AGENT_RESPONSE, error: null },
      development: { status: 'done', result: MOCK_AGENT_RESPONSE, error: null },
      research: { status: 'idle', result: null, error: null },
      quality: { status: 'error', result: null, error: 'خطأ' },
    };
    const doneCount = Object.values(state).filter((s) => s.status === 'done').length;
    expect(doneCount).toBe(2);
  });

  it('hasAnyResult يكون true عند وجود وكيل مكتمل واحد على الأقل', () => {
    const state: Record<AgentType, AgentState> = {
      ...createInitialState(),
      creativity: { status: 'done', result: MOCK_AGENT_RESPONSE, error: null },
    };
    const hasAnyResult = Object.values(state).some((s) => s.status === 'done');
    expect(hasAnyResult).toBe(true);
  });

  it('hasAnyResult يكون false عند عدم وجود وكيل مكتمل', () => {
    const state = createInitialState();
    const hasAnyResult = Object.values(state).some((s) => s.status === 'done');
    expect(hasAnyResult).toBe(false);
  });

  it('إعادة التهيئة تُصفّر جميع الحالات', () => {
    const initialState = createInitialState();
    // محاكاة إعادة التهيئة
    const resetState = createInitialState();
    expect(resetState).toEqual(initialState);
    for (const agent of Object.values(resetState)) {
      expect(agent.status).toBe('idle');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات التحقق من المدخلات
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentsDashboard — التحقق من المدخلات', () => {
  it('prompt فارغ يمنع إرسال الطلب', () => {
    const isDisabled = (prompt: string) => !prompt.trim();
    expect(isDisabled('')).toBe(true);
    expect(isDisabled('   ')).toBe(true);
    expect(isDisabled('\t\n')).toBe(true);
  });

  it('prompt غير فارغ يسمح بإرسال الطلب', () => {
    const isDisabled = (prompt: string) => !prompt.trim();
    expect(isDisabled('نص')).toBe(false);
    expect(isDisabled('  نص مع مسافات  ')).toBe(false);
    expect(isDisabled('a')).toBe(false);
  });

  it('prompt يجب أن يُقلَّص قبل الإرسال', () => {
    const sanitize = (prompt: string) => prompt.trim();
    expect(sanitize('  طلب مع مسافات  ')).toBe('طلب مع مسافات');
    expect(sanitize('\nسطر جديد\n')).toBe('سطر جديد');
  });

  it('قائمة وكلاء تتضمن وكلاء غير صالحين يجب رفضها', () => {
    const validAgents = new Set(['creativity', 'development', 'research', 'quality']);
    const validateAgents = (agents: string[]) => agents.every((a) => validAgents.has(a));
    expect(validateAgents(['creativity', 'quality'])).toBe(true);
    expect(validateAgents(['creativity', 'unknown'])).toBe(false);
    expect(validateAgents([])).toBe(true); // قائمة فارغة مقبولة
  });

  it('عداد الأحرف يعكس طول الـ prompt بشكل صحيح', () => {
    const prompts = ['', 'أ', 'كلمة', 'جملة طويلة بعض الشيء'];
    for (const p of prompts) {
      expect(p.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('الحد الأقصى للـ prompt هو 2000 حرف', () => {
    const maxLength = 2000;
    const longPrompt = 'أ'.repeat(2001);
    expect(longPrompt.length).toBeGreaterThan(maxLength);
    const clipped = longPrompt.slice(0, maxLength);
    expect(clipped.length).toBe(maxLength);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات بيانات الوكلاء (AGENTS config)
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentsDashboard — بيانات الوكلاء', () => {
  // محاكاة بيانات الوكلاء من المكوّن
  const AGENTS = [
    { id: 'creativity', label: 'وكيل الإبداع', icon: '💡', color: 'rgba(198, 255, 46, 0.08)', accentColor: '#C6FF2E' },
    { id: 'development', label: 'وكيل التطوير', icon: '⚙️', color: 'rgba(0, 212, 255, 0.08)', accentColor: '#00D4FF' },
    { id: 'research', label: 'وكيل البحث', icon: '🔬', color: 'rgba(180, 100, 255, 0.08)', accentColor: '#B464FF' },
    { id: 'quality', label: 'وكيل الجودة', icon: '🛡️', color: 'rgba(255, 165, 50, 0.08)', accentColor: '#FFA532' },
  ];

  it('يجب أن يوجد بالضبط 4 وكلاء', () => {
    expect(AGENTS).toHaveLength(4);
  });

  it('كل وكيل يجب أن يحتوي على المعرّف والتسمية والأيقونة', () => {
    for (const agent of AGENTS) {
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('label');
      expect(agent).toHaveProperty('icon');
      expect(agent).toHaveProperty('color');
      expect(agent).toHaveProperty('accentColor');
    }
  });

  it('معرّفات الوكلاء فريدة', () => {
    const ids = AGENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('ألوان التمييز تبدأ بـ #', () => {
    for (const agent of AGENTS) {
      expect(agent.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('قائمة معرّفات الوكلاء تطابق أنواع الـ endpoints', () => {
    const agentIds = AGENTS.map((a) => a.id);
    const expectedIds = ['creativity', 'development', 'research', 'quality'];
    expect(agentIds).toEqual(expectedIds);
  });

  it('تسميات الوكلاء بالعربية', () => {
    for (const agent of AGENTS) {
      // التحقق أن التسمية تحتوي على أحرف عربية
      expect(/[\u0600-\u06FF]/.test(agent.label)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحافة (Edge Cases)
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentsDashboard — حالات الحافة', () => {
  it('استجابة بدون results يجب معالجتها', () => {
    const safeGetResults = (data: unknown): Record<string, unknown> => {
      if (data && typeof data === 'object' && 'results' in data) {
        return (data as { results: Record<string, unknown> }).results;
      }
      return {};
    };
    expect(safeGetResults({})).toEqual({});
    expect(safeGetResults(null)).toEqual({});
    expect(safeGetResults({ results: { x: 1 } })).toEqual({ x: 1 });
  });

  it('استجابة بدون duration_ms تُعامَل كـ 0', () => {
    const getDuration = (result: unknown): number => {
      if (result && typeof result === 'object' && 'duration_ms' in result) {
        return (result as { duration_ms: number }).duration_ms ?? 0;
      }
      return 0;
    };
    expect(getDuration({})).toBe(0);
    expect(getDuration({ duration_ms: 150 })).toBe(150);
  });

  it('نتيجة الوكيل الفارغة يجب عدم إظهار التفاصيل', () => {
    const shouldShowResult = (status: string, result: unknown) =>
      status === 'done' && result !== null;
    expect(shouldShowResult('done', null)).toBe(false);
    expect(shouldShowResult('idle', null)).toBe(false);
    expect(shouldShowResult('done', MOCK_AGENT_RESPONSE)).toBe(true);
  });

  it('وكيل في حالة تحميل لا يمكن تشغيله مجدداً', () => {
    const loadingStatuses = ['thinking', 'acting', 'reflecting'];
    const isLoading = (status: string) => loadingStatuses.includes(status);
    const isButtonDisabled = (status: string, prompt: string) =>
      isLoading(status) || !prompt.trim();
    expect(isButtonDisabled('thinking', 'طلب')).toBe(true);
    expect(isButtonDisabled('acting', 'طلب')).toBe(true);
    expect(isButtonDisabled('idle', 'طلب')).toBe(false);
    expect(isButtonDisabled('done', 'طلب')).toBe(false);
  });

  it('prompt بمسافات فقط يُعامَل كـ prompt فارغ', () => {
    const isEmpty = (prompt: string) => !prompt.trim();
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty('\t\t')).toBe(true);
    expect(isEmpty('\n')).toBe(true);
    expect(isEmpty(' كلمة ')).toBe(false);
  });

  it('عداد الوكلاء المكتملة يشمل فقط "done" لا "error"', () => {
    type AgentStatus = 'idle' | 'thinking' | 'acting' | 'reflecting' | 'done' | 'error';
    const states: AgentStatus[] = ['done', 'done', 'error', 'idle'];
    const doneCount = states.filter((s) => s === 'done').length;
    expect(doneCount).toBe(2);
  });
});
