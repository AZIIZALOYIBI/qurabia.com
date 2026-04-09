import { Terminal } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';

/* ─── أنواع البيانات ─── */
type LogTab = 'planck' | 'crypto' | 'vqe' | 'alutaibiv2' | 'agi' | 'medical' | 'grover';
type RunStatus = 'idle' | 'running';
type EntryType = 'command' | 'output' | 'error' | 'system' | 'info' | 'success';

interface TerminalEntry {
  id: number;
  type: EntryType;
  text: string;
  color?: string;
}

/* ─── سجلات المحاكاة لكل محرك كمومي ─── */
const SIMULATION_LOGS: Record<LogTab, string> = {
  planck: `[System] RUNNING AL-OTAIBI-PLANCK SIMULATION...
--------------------------------------------------
> Target: الشمس (Sun) | Temp: 5778 K
> Peak Wavelength: 501 nm (نطاق الضوء المرئي - أخضر)
> Classicity Degree (درجة الكلاسيكية): 99.98%
> Quantum Correction: 0.02%
[Result]: النظام كلاسيكي جداً. معادلة بلانك العادية تكفي.

> Target: فضاء عميق (Deep Space) | Temp: 3 K
> Peak Wavelength: 1 mm (إشعاع الخلفية الكونية)
> Classicity Degree (درجة الكلاسيكية): 5.0%
> Quantum Correction: 25.0%
[Result]: تحذير! انهيار الفيزياء الكلاسيكية. معادلة العتيبي-بلانك حتمية لحساب الطاقة بدقة.
--------------------------------------------------`,
  crypto: `[System] INITIALIZING QUANTUM SECURE CHANNEL (E91/AUTDIE)...
=================================================================
[ Bell |Φ+> + AUTDIE ]
 T1 hbar-nabla^2-psi    = 1.0546e-34  (الانتشار الكمي)
 T2 alpha(kappa)V_ent   = 2.0840e+10  (طاقة التشابك) <- T2 >> T1,T3,T4
 T3 beta-d-psi/dt       = 0.0000e+00  (الديناميكا)
 T4 gamma-I_q           = 1.6180e+00  (كثافة المعلومات)

 Psi_AUTDIE             = 2.084000e+10
 V_ent (Entanglement)   = 1.000000 bit (= 1.0 bit حالة تشابك قصوى Bell OK)
 S_AUTDIE (Security)    = 0.999999  (حد الأمان تجاوز 0.35 بنجاح)
 QBER_AUTDIE            = 0.092000  (< 11% OK آمن ضد التنصت)

[Result] القناة محصنة فيزيائياً. أي تدخل سيؤدي لانهيار الدالة الموجية فوراً.
=================================================================`,
  vqe: `[System] RUNNING VQE BINDING SCAN...
Target: إنزيم BACE-1 للزهايمر
--------------------------------------------------
Classically best (Lanabecestat):
  Delta-G: -9.45 kcal/mol
  وقت المعالجة: 47 يوم (Classical MD)

Quantum best (Q-Compound-3 via VQE):
  Delta-G: -13.21 kcal/mol
  وقت المعالجة: 3.2 ساعة (Quantum VQE)

[Result]
- تحسن في طاقة الارتباط بمقدار 39.8% أفضل.
- توفير: 99.7% من الزمن الحسابي. تم العثور على المركب الأفضل.
--------------------------------------------------`,
  alutaibiv2: `======================================================================
[System] RUNNING AL-OTAIBI UNIFIED EQUATION v2.0
[Task] Cosmic Energy Calculation at Planck Scale (r = 1.616e-35 m)
======================================================================
> 1. E_basic (الأساس الكمومي)         : 3.313e-24 J
> 2. Otaibi Factor (معامل التضخيم)    : 665.3
   >> الطاقة بـ v1.0                  : 2.204e-21 J

> 3. Dark Correction (تصحيح المظلم)   : 4.900e+10
> 4. QM Effect (الدالة الموجية)       : 0.539
> 5. Fine-Tuning (الضبط الدقيق)       : 0.937

----------------------------------------------------------------------
> E_TOTAL v2.0                         : 5.451e-11 J
> eV                                   : 3.403e+11 eV
----------------------------------------------------------------------
[AGI Analytics]: مستوى الثقة: 99.27%.
[Godel Warning]: تقريب رياضي وليس الحقيقة المطلقة.
======================================================================`,
  agi: `[AGI] initiating conscious refactoring for DynamicWorkspace...
[AGI] Analyzing user workflow...
[AGI] Bottleneck detected in user intent: BlackHole_Simulation
[AGI] Status: DEPRECATED_UI
[AGI] Generating new React code on-the-fly...
[AGI] Integrating @quantum/LQG (Loop Quantum Gravity)
[AGI] Running sandbox safety check...
[AGI] Sandbox check passed (0 errors).
[AGI] Auto-Deployment / Hot-swapping initiated.
[AGI] SUCCESS. UI updated dynamically.`,
  medical: `======================================================================
[System] INITIATING CONSCIOUS QUANTUM MEDICAL DIAGNOSIS...
[Target] تحليل بيانات مريض مركبة (صور طبية + تسلسل جينومي)
======================================================================

>>> 1. Genomic Analysis (Sanger Institute Protocol)
[Module]: Quantum Support Vector Machine (QSVM)
[Task]: 20,000 genes classification
- Projecting data into Hilbert space...
- Result: 3 subtle mutations discovered.
[Performance]:
  >> Accuracy   : 99.8%
  >> Speedup    : 143,227,382x
  >> Time       : 0.02 s

----------------------------------------------------------------------

>>> 2. Medical Imaging Diagnosis (Johns Hopkins Protocol)
[Module]: Conscious Quantum Neural Networks (CQNN)
[Task]: Early cancer detection (MRI)
- Activating Quantum Attention mechanism...
- Result: Cancer cells detected at Stage 0.
[Performance]:
  >> Accuracy   : 99.5%
  >> Speedup    : 2,800,000x

----------------------------------------------------------------------
[AGI Treatment Recommendation]:
Design custom drug via VQE engine.
Data forwarded to Quantum Chemistry module.
======================================================================`,
  grover: `======================================================================
[System] INITIATING GROVER'S QUANTUM SEARCH ALGORITHM...
[Target] Unstructured Database Search
======================================================================
> Database size (N) : 64 items
> Target index      : 42
> Classical steps (O(N/2)): 32
> Quantum steps (O(sqrt(N))): 6

[Execution Log]:
- Step 0: Equal Superposition initialized.     P = 1.56%
- Step 1: Oracle + Diffusion applied.          P = 13.67%
- Step 2: Amplitude Amplification.             P = 36.34%
- Step 3: Amplitude Amplification.             P = 64.28%
- Step 4: Amplitude Amplification.             P = 89.26%
- Step 5: Amplitude Amplification.             P = 99.66%  <-- PEAK
- Step 6: Amplitude Amplification.             P = 95.27%  (past peak)

[Result]:
Algorithm halted at Step 5 (max probability 99.66%).
Target item (Index 42) found successfully.
Quantum Speedup: 5.3x over classical search.
======================================================================`,
};

/* ─── ألوان المحاكاة ─── */
const ENGINE_COLORS: Record<LogTab, string> = {
  grover:     '#f97316',
  medical:    '#14b8a6',
  alutaibiv2: '#ec4899',
  agi:        '#eab308',
  planck:     '#3b82f6',
  crypto:     '#10b981',
  vqe:        '#a855f7',
};

const ENGINE_NAMES: Record<LogTab, string> = {
  grover:     'Grover Search',
  medical:    'Medical CQNN',
  alutaibiv2: 'Al-Utaibi v2.0',
  agi:        'AGI Refactor',
  planck:     'Planck',
  crypto:     'AUTDIE Crypto',
  vqe:        'VQE',
};

/* ─── قراءة عنوان API الخلفية ─── */
function getApiBase(): string {
  const normalize = (s: string) => s.replace(/\/$/, '');
  const fromEnv = normalize(import.meta.env.VITE_API_BASE_URL || '');
  if (!import.meta.env.DEV) return normalize(window.location.origin);
  return fromEnv || 'http://localhost:10000';
}

/* ─── نص المساعدة ─── */
const HELP_TEXT = `
QUANTUM_TERMINAL_v5.0  —  QURABIA Platform Shell
=================================================
الأوامر المتاحة:

  help                   عرض هذه المساعدة
  clear                  مسح الشاشة
  date                   عرض التاريخ والوقت الحالي
  echo <نص>             طباعة النص
  about                  معلومات عن المنصة

  engines                قائمة محركات المحاكاة
  run <engine>           تشغيل محرك محاكاة
  stop                   إيقاف المحاكاة الجارية

  status                 فحص صحة الخادم  (/health)
  genesis                حالة محرك Genesis الكمي

  calc <تعبير>          حاسبة رياضية  (مثال: calc 2^10)

اختصارات:
  Up / Down              التنقل في سجل الأوامر
  Tab                    إكمال الأمر تلقائياً
  Ctrl+L                 مسح الشاشة
  Ctrl+C                 إلغاء التشغيل الحالي

محركات المحاكاة:
  planck | crypto | vqe | alutaibiv2 | agi | medical | grover
`.trim();

/* ─── محلّل رياضي آمن (بدون eval / Function) ─── */
function evalMath(expr: string): number {
  let pos = 0;
  const len = expr.length;
  const skip = () => { while (pos < len && expr[pos] === ' ') pos++; };

  function primary(): number {
    skip();
    if (pos < len && expr[pos] === '(') {
      pos++;
      const v = addSub();
      skip();
      if (pos >= len || expr[pos] !== ')') throw new Error('missing )');
      pos++;
      return v;
    }
    if (pos < len && expr[pos] === '-') { pos++; return -primary(); }
    if (pos < len && expr[pos] === '+') { pos++; return primary(); }
    // parse number (including scientific notation)
    const start = pos;
    while (pos < len && /[0-9.]/.test(expr[pos])) pos++;
    if (pos < len && (expr[pos] === 'e' || expr[pos] === 'E')) {
      pos++;
      if (pos < len && (expr[pos] === '+' || expr[pos] === '-')) pos++;
      while (pos < len && /[0-9]/.test(expr[pos])) pos++;
    }
    const s = expr.slice(start, pos);
    if (!s) throw new Error(`unexpected char at pos ${pos}: "${expr[pos] ?? 'EOF'}"`);
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error(`invalid number: "${s}"`);
    return n;
  }

  function power(): number {
    const left = primary();
    skip();
    if (pos + 1 < len && expr[pos] === '*' && expr[pos + 1] === '*') {
      pos += 2;
      return left ** power(); // right-associative
    }
    return left;
  }

  function mulDiv(): number {
    let result = power();
    while (true) {
      skip();
      if (pos >= len) break;
      const op = expr[pos];
      if (op === '*' && (pos + 1 >= len || expr[pos + 1] !== '*')) {
        pos++;
        result *= power();
      } else if (op === '/') {
        pos++;
        const r = power();
        if (r === 0) throw new Error('division by zero');
        result /= r;
      } else if (op === '%') {
        pos++;
        const r = power();
        if (r === 0) throw new Error('modulo by zero');
        result %= r;
      } else break;
    }
    return result;
  }

  function addSub(): number {
    let result = mulDiv();
    while (true) {
      skip();
      if (pos >= len) break;
      const op = expr[pos];
      if (op === '+') { pos++; result += mulDiv(); }
      else if (op === '-') { pos++; result -= mulDiv(); }
      else break;
    }
    return result;
  }

  const result = addSub();
  skip();
  if (pos < len) throw new Error(`unexpected: "${expr[pos]}"`);
  return result;
}

/* ─── استدعاء HTTP مع مهلة يدوية (متوافق مع Safari 15+) ─── */
function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

/* ─── الأوامر للإكمال التلقائي ─── */
const ALL_COMMANDS = [
  'help', 'clear', 'date', 'echo', 'about',
  'engines', 'run', 'stop',
  'status', 'genesis',
  'calc',
];

const ALL_ENGINES = ['planck', 'crypto', 'vqe', 'alutaibiv2', 'agi', 'medical', 'grover'];

/* ─── مكوّن الطرفية ─── */
export const VirtualLogsTerminal: React.FC = () => {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [simStatus, setSimStatus] = useState<RunStatus>('idle');
  const [currentEngine, setCurrentEngine] = useState<LogTab | null>(null);

  const entryIdRef     = useRef(0);
  const scrollRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const lineTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef       = useRef(false);
  const savedInputRef  = useRef('');

  const nextId = useCallback(() => { entryIdRef.current += 1; return entryIdRef.current; }, []);

  const addEntry = useCallback((type: EntryType, text: string, color?: string) => {
    setEntries((prev) => [...prev, { id: nextId(), type, text, color }]);
  }, [nextId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  /* ─── رسالة ترحيب (تعمل مرة واحدة عند التحميل) ─── */
  const welcomeShown = useRef(false);
  useEffect(() => {
    if (welcomeShown.current) return;
    welcomeShown.current = true;
    addEntry('system',  '╔══════════════════════════════════════════╗');
    addEntry('system',  '║    QUANTUM_TERMINAL_v5.0  —  QURABIA    ║');
    addEntry('system',  '╚══════════════════════════════════════════╝');
    addEntry('info',    'اكتب "help" لعرض الأوامر المتاحة.');
    addEntry('info',    `الوقت: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}`);
  }, [addEntry]);

  /* ─── إيقاف المحاكاة ─── */
  const stopSimulation = useCallback(() => {
    abortRef.current = true;
    if (lineTimerRef.current) { clearTimeout(lineTimerRef.current); lineTimerRef.current = null; }
    setSimStatus('idle');
  }, []);

  useEffect(() => () => { abortRef.current = true; if (lineTimerRef.current) clearTimeout(lineTimerRef.current); }, []);

  /* ─── تشغيل محاكاة بتأثير الكتابة ─── */
  const runEngine = useCallback((engine: LogTab) => {
    stopSimulation();
    abortRef.current = false;
    setSimStatus('running');
    setCurrentEngine(engine);

    const color = ENGINE_COLORS[engine];
    const lines = SIMULATION_LOGS[engine].split('\n');
    let idx = 0;

    addEntry('info', `> run ${engine} — ${ENGINE_NAMES[engine]}`, color);

    const scheduleNext = () => {
      if (abortRef.current || idx >= lines.length) {
        if (!abortRef.current) {
          addEntry('success', `[DONE] ${ENGINE_NAMES[engine]}`, color);
          setSimStatus('idle');
          setCurrentEngine(null);
        }
        return;
      }
      lineTimerRef.current = setTimeout(() => {
        if (abortRef.current) return;
        addEntry('output', lines[idx], color);
        idx++;
        scheduleNext();
      }, 80);
    };

    scheduleNext();
  }, [stopSimulation, addEntry]);

  /* ─── API: فحص الصحة ─── */
  const cmdStatus = useCallback(async () => {
    addEntry('info', 'connecting to server...');
    try {
      const t0 = Date.now();
      const res = await fetchWithTimeout(`${getApiBase()}/health`, 8000);
      const ms = Date.now() - t0;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      addEntry('success', `[OK] server healthy  [${ms}ms]`, '#10b981');
      for (const [k, v] of Object.entries(data)) {
        addEntry('output', `  ${k}: ${JSON.stringify(v)}`, '#34d399');
      }
    } catch (err) {
      addEntry('error', `[ERR] ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addEntry]);

  /* ─── API: حالة Genesis ─── */
  const cmdGenesis = useCallback(async () => {
    addEntry('info', 'querying Genesis Engine...');
    try {
      const t0 = Date.now();
      const res = await fetchWithTimeout(`${getApiBase()}/api/genesis/status`, 8000);
      const ms = Date.now() - t0;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      addEntry('success', `[OK] Genesis Engine status  [${ms}ms]`, '#8b5cf6');
      for (const [k, v] of Object.entries(data)) {
        addEntry('output', `  ${k}: ${JSON.stringify(v)}`, '#a78bfa');
      }
    } catch (err) {
      addEntry('error', `[ERR] ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addEntry]);

  /* ─── معالج الأوامر ─── */
  const processCommand = useCallback(async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    addEntry('command', `quantum@qurabia:~$ ${cmd}`);
    setHistory((prev) => (prev[prev.length - 1] === cmd ? prev : [...prev, cmd]));
    setHistoryIdx(-1);

    const parts = cmd.split(/\s+/);
    const verb  = parts[0].toLowerCase();
    const args  = parts.slice(1);

    switch (verb) {
      case 'help':
        HELP_TEXT.split('\n').forEach((line) => addEntry('info', line));
        break;

      case 'clear':
      case 'cls':
        setEntries([]);
        break;

      case 'date':
        addEntry('output', new Date().toLocaleString('ar-SA', {
          timeZone: 'Asia/Riyadh', weekday: 'long', year: 'numeric',
          month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
        }), '#94a3b8');
        break;

      case 'echo':
        addEntry('output', args.join(' '), '#94a3b8');
        break;

      case 'about':
        addEntry('output', 'QURABIA — منصة عربية للذكاء الاصطناعي والحوسبة الكمية', '#8b5cf6');
        addEntry('output', 'Version  : QUANTUM_OS v5.0', '#a78bfa');
        addEntry('output', 'Website  : https://qurabia.com', '#c4b5fd');
        addEntry('output', 'Author   : عبدالعزيز بن سلطان العتيبي', '#ddd6fe');
        addEntry('output', 'Engines  : 17 strategic | 10 quantum gates | 16 qubits max', '#e9d5ff');
        break;

      case 'engines':
      case 'ls':
        addEntry('output', '── Simulation Engines ──', '#64748b');
        for (const [key, name] of Object.entries(ENGINE_NAMES)) {
          addEntry('output', `  run ${key.padEnd(14)} # ${name}`, ENGINE_COLORS[key as LogTab]);
        }
        break;

      case 'run': {
        const engine = args[0]?.toLowerCase() as LogTab | undefined;
        if (!engine || !ALL_ENGINES.includes(engine)) {
          addEntry('error', `unknown engine: "${args[0] ?? ''}". type "engines" to list available.`);
          break;
        }
        if (simStatus === 'running') {
          addEntry('error', 'simulation already running. type "stop" first.');
          break;
        }
        runEngine(engine);
        break;
      }

      case 'stop':
        if (simStatus === 'running') {
          stopSimulation();
          addEntry('info', `[STOPPED] ${currentEngine ?? ''}`, '#f97316');
        } else {
          addEntry('info', 'no active simulation.');
        }
        break;

      case 'status':
        await cmdStatus();
        break;

      case 'genesis':
        await cmdGenesis();
        break;

      case 'calc': {
        const expr = args.join(' ');
        if (!expr) { addEntry('error', 'usage: calc <expression>  e.g. calc 2^10'); break; }
        try {
          // استبدال ^ بـ ** ثم التحقق من الأحرف المسموحة قبل الإرسال للمحلّل
          const normalized = expr.replace(/\^/g, '**');
          if (/[^0-9+\-*/.() %eE\s]/.test(normalized)) throw new Error('invalid characters in expression');
          const result = evalMath(normalized);
          addEntry('output', `= ${String(result)}`, '#fbbf24');
        } catch (err) {
          addEntry('error', `invalid expression: ${err instanceof Error ? err.message : String(err)}`);
        }
        break;
      }

      default:
        addEntry('error', `command not found: "${verb}". type "help" for available commands.`);
    }
  }, [addEntry, simStatus, currentEngine, runEngine, stopSimulation, cmdStatus, cmdGenesis]);

  /* ─── الإكمال التلقائي بـ Tab ─── */
  const handleTabComplete = useCallback(() => {
    const parts = input.split(/\s+/);
    if (parts.length === 1) {
      const partial = parts[0].toLowerCase();
      const matches = ALL_COMMANDS.filter((c) => c.startsWith(partial));
      if (matches.length === 1) { setInput(`${matches[0]} `); }
      else if (matches.length > 1) { addEntry('info', matches.join('  ')); }
    } else if (parts[0].toLowerCase() === 'run' && parts.length === 2) {
      const partial = parts[1].toLowerCase();
      const matches = ALL_ENGINES.filter((e) => e.startsWith(partial));
      if (matches.length === 1) { setInput(`run ${matches[0]}`); }
      else if (matches.length > 1) { addEntry('info', matches.join('  ')); }
    }
  }, [input, addEntry]);

  /* ─── معالج لوحة المفاتيح ─── */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input;
      setInput(''); savedInputRef.current = '';
      void processCommand(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistory((hist) => {
        if (!hist.length) return hist;
        setHistoryIdx((prev) => {
          const newIdx = prev < 0 ? hist.length - 1 : Math.max(0, prev - 1);
          if (prev < 0) savedInputRef.current = input;
          setInput(hist[newIdx]);
          return newIdx;
        });
        return hist;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIdx((prev) => {
        if (prev < 0) return prev;
        setHistory((hist) => {
          const newIdx = prev + 1;
          if (newIdx >= hist.length) { setInput(savedInputRef.current); return hist; }
          setInput(hist[newIdx]);
          return hist;
        });
        return prev + 1;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabComplete();
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setEntries([]);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (simStatus === 'running') {
        stopSimulation();
        addEntry('info', `^C — stopped ${currentEngine ?? ''}`, '#f97316');
      } else {
        addEntry('command', `quantum@qurabia:~$ ${input}^C`);
        setInput(''); savedInputRef.current = '';
      }
    }
  }, [input, processCommand, handleTabComplete, simStatus, stopSimulation, currentEngine, addEntry]);

  /* ─── لون كل نوع مدخلة ─── */
  const entryColor = (entry: TerminalEntry): string => {
    if (entry.color) return entry.color;
    switch (entry.type) {
      case 'command': return '#94a3b8';
      case 'error':   return '#f87171';
      case 'success': return '#34d399';
      case 'system':  return '#8b5cf6';
      case 'info':    return '#64748b';
      default:        return '#34d399';
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontFamily: "'JetBrains Mono','Cascadia Code','Fira Code','Courier New',monospace",
      }}
      onClick={() => inputRef.current?.focus()}
      role="application"
      aria-label="طرفية كوانتم التفاعلية"
    >
      {/* ─── شريط العنوان ─── */}
      <div
        className="px-4 py-2.5 flex items-center justify-between shrink-0"
        style={{ background: '#151619', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          <Terminal size={14} className="text-slate-400 ml-2" />
          <span className="text-slate-300 text-xs tracking-widest font-semibold">
            QUANTUM_TERMINAL_v5.0
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {simStatus === 'running' && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ animation: 'qtPulse 1s ease-in-out infinite' }}
              />
              {currentEngine}
            </span>
          )}
          <span className="text-slate-600">quantum@qurabia</span>
        </div>
      </div>

      {/* ─── منطقة الإخراج ─── */}
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 pb-1"
        style={{ background: 'transparent' }}
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="leading-relaxed text-sm whitespace-pre-wrap break-words"
            style={{ color: entryColor(entry) }}
            dir="ltr"
          >
            {entry.text}
          </div>
        ))}
        <div className="h-1" />
      </div>

      {/* ─── سطر الإدخال ─── */}
      <div
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d0d10' }}
      >
        <span className="text-emerald-400 text-sm shrink-0 select-none font-mono">
          quantum@qurabia:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="إدخال الأوامر"
          className="flex-grow bg-transparent outline-none text-sm text-slate-200 caret-emerald-400 font-mono"
          onChange={(e) => { setInput(e.target.value); setHistoryIdx(-1); }}
          onKeyDown={handleKeyDown}
          placeholder="اكتب أمراً… (help للمساعدة)"
        />
        {simStatus === 'running' && (
          <button
            type="button"
            onClick={() => { stopSimulation(); addEntry('info', '^C — stopped', '#f97316'); }}
            className="shrink-0 px-2 py-0.5 text-xs rounded border border-red-500/30
                       text-red-400 hover:bg-red-500/10 transition-colors font-mono"
          >
            STOP
          </button>
        )}
      </div>

      <style>{`
        @keyframes qtPulse { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </div>
  );
};

export default VirtualLogsTerminal;
