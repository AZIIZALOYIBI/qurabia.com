import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Play, Square, RotateCcw } from 'lucide-react';

/* ─── أنواع البيانات ─── */
type LogTab =
  | 'planck'
  | 'crypto'
  | 'vqe'
  | 'alutaibiv2'
  | 'agi'
  | 'medical'
  | 'grover';

type RunStatus = 'idle' | 'running' | 'complete';

/* ─── سجلات المحاكاة لكل محرك كمومي ─── */
const logs: Record<LogTab, string> = {
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
[ Bell |Φ⁺⟩ + AUTDIE ]
 T1 ℏ∇²ψ          = 1.0546e-34  (الانتشار الكمي)
 T2 α(κ)V_ent     = 2.0840e+10  (طاقة التشابك) ← T2 >> T1,T3,T4
 T3 β∂ψ/∂t        = 0.0000e+00  (الديناميكا)
 T4 γI_q          = 1.6180e+00  (كثافة المعلومات)

 Ψ_AUTDIE         = 2.084000e+10
 V_ent (Entanglement) = 1.000000 bit (= 1.0 bit حالة تشابك قصوى Bell ✓)
 S_AUTDIE (Security)  = 0.999999  (حد الأمان تجاوز 0.35 بنجاح)
 QBER_AUTDIE          = 0.092000  (< 11% ✓ آمن ضد التنصت)

[Result] القناة محصنة فيزيائياً. أي تدخل سيؤدي لانهيار الدالة الموجية فوراً.
=================================================================`,
  vqe: `[System] RUNNING VQE BINDING SCAN...
Target: إنزيم BACE-1 للزهايمر
--------------------------------------------------
🖥 الأفضل كلاسيكياً (Lanabecestat):
  ΔG: -9.45 kcal/mol
  وقت المعالجة: 47 يوم (Classical MD)

⚛ الأفضل كمومياً (Q-Compound-3 عبر VQE):
  ΔG: -13.21 kcal/mol
  وقت المعالجة: 3.2 ساعة (Quantum VQE)

[Result]
- تحسن في طاقة الارتباط بمقدار 39.8% أفضل.
- توفير: 99.7% من الزمن الحسابي. تم العثور على المركب الأفضل.
--------------------------------------------------`,
  alutaibiv2: `======================================================================
[System] RUNNING AL-OTAIBI UNIFIED EQUATION v2.0
[Task] Cosmic Energy Calculation at Planck Scale (r = 1.616e-35 m)
======================================================================
> 1. الأساس الكمومي (E_basic)      : 3.313e-24 J
> 2. معامل التضخيم (Otaibi Factor): 665.3
   >> الطاقة بـ v1.0              : 2.204e-21 J

> 3. تصحيح القطاع المظلم (Dark)   : 4.900e+10  [تم تضمين 96% من الكون المفقود]
> 4. تأثير الدالة الموجية (QM)    : 0.539      [تثبيط الانحناء اللانهائي - Singularity Suppressed]
> 5. الضبط الدقيق (Fine-Tuning)   : 0.937      [متوافق مع فرضية الأكوان المتعددة]

----------------------------------------------------------------------
> [النتيجة] الطاقة الكلية v2.0 (E_TOTAL): 5.451e-11 J
> بوحدات الإلكترون فولت                 : 3.403e+11 eV
----------------------------------------------------------------------
[AGI Analytics]:
مستوى الثقة في النموذج: 99.27%.
تحذير (مبرهنة غودل): النموذج شامل بنسبة شبه كاملة، لكنه يمثل تقريباً رياضياً وليس الحقيقة المطلقة للكون.
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
[Target] تحليل بيانات مريض مركبة (صور طبية + تسلسل جينومي كامل)
======================================================================

>>> 🧬 1. التحليل الجينومي (Sanger Institute Protocol)
[Module]: Quantum Support Vector Machine (QSVM)
[Task]: تصنيف عالي الأبعاد لـ 20,000 جين متزامن
- جاري إسقاط البيانات في فضاء هيلبرت...
- النتيجة: تم اكتشاف 3 طفرات دقيقة جداً (شبه مخفية كلاسيكياً).
[Performance]:
  >> الدقة النهائية (Accuracy) : 99.8%
  >> التسريع الكمومي (Speedup): 143,227,382 ضعف (143 مليون ضعف)
  >> زمن المعالجة             : 0.02 ثانية (بدلاً من أسابيع كلاسيكياً)

----------------------------------------------------------------------

>>> 🏥 2. التشخيص الطبي للصور (Johns Hopkins Protocol)
[Module]: Conscious Quantum Neural Networks (CQNN)
[Task]: الكشف المبكر عن السرطان (رنين مغناطيسي MRI)
- تفعيل آلية الانتباه الكمومي (Quantum Attention)...
- النتيجة: اكتشاف خلايا سرطانية في المرحلة الصفرية (Early Stage 0).
[Performance]:
  >> الدقة النهائية (Accuracy) : 99.5%
  >> التسريع الكمومي (Speedup): 2,800,000 ضعف (2.8 مليون ضعف)

----------------------------------------------------------------------
[AGI Treatment Recommendation]:
بناءً على التحليل الجينومي للورم (QSVM) والصور الطبية (CQNN)، يُنصح بتصميم دواء
مخصص عبر محرك (VQE). تم إرسال البيانات إلى وحدة الكيمياء الكمومية.
======================================================================`,
  grover: `======================================================================
[System] INITIATING GROVER'S QUANTUM SEARCH ALGORITHM...
[Target] البحث في قاعدة بيانات غير مهيكلة (Unstructured Database)
======================================================================
> حجم قاعدة البيانات (N) : 64 عنصر
> العنصر المستهدف (Target): Index 42
> عدد الخطوات الكلاسيكية المتوقعة (O(N/2)): 32 خطوة
> عدد الخطوات الكمومية المثلى (O(√N))   : 6 خطوات

[Execution Log]:
- Step 0: تهيئة التراكب المتساوي (Equal Superposition). الاحتمال = 1.56%
- Step 1: تطبيق الأوراكل (Oracle) والانتشار (Diffusion). الاحتمال = 13.67%
- Step 2: تضخيم السعة (Amplitude Amplification). الاحتمال = 36.34%
- Step 3: تضخيم السعة (Amplitude Amplification). الاحتمال = 64.28%
- Step 4: تضخيم السعة (Amplitude Amplification). الاحتمال = 89.26%
- Step 5: تضخيم السعة (Amplitude Amplification). الاحتمال = 99.66%
- Step 6: تضخيم السعة (Amplitude Amplification). الاحتمال = 95.27% (تجاوز القمة)

[Result]:
تم إيقاف الخوارزمية عند الخطوة 5 (الاحتمال الأقصى 99.66%).
تم العثور على العنصر المستهدف (Index 42) بنجاح.
التسريع الكمومي (Speedup): 5.3x أسرع من البحث الكلاسيكي.
======================================================================`,
};

/* ─── إعداد التبويبات ─── */
const tabConfig: { key: LogTab; label: string; color: string; activeClass: string }[] = [
  { key: 'grover', label: 'Grover Search', color: '#f97316', activeClass: 'bg-orange-500/20 text-orange-400' },
  { key: 'medical', label: 'Medical (CQNN)', color: '#14b8a6', activeClass: 'bg-teal-500/20 text-teal-400' },
  { key: 'alutaibiv2', label: 'Al-Utaibi v2.0', color: '#ec4899', activeClass: 'bg-pink-500/20 text-pink-400' },
  { key: 'agi', label: 'AGI Refactor', color: '#eab308', activeClass: 'bg-yellow-500/20 text-yellow-400' },
  { key: 'planck', label: 'Planck', color: '#3b82f6', activeClass: 'bg-blue-500/20 text-blue-400' },
  { key: 'crypto', label: 'AUTDIE', color: '#10b981', activeClass: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'vqe', label: 'VQE', color: '#a855f7', activeClass: 'bg-purple-500/20 text-purple-400' },
];

/* ─── شريط الحالة: ألوان ونصوص ─── */
const STATUS_DISPLAY: Record<RunStatus, { label: string; dotClass: string; textClass: string }> = {
  idle: { label: 'IDLE', dotClass: 'bg-slate-500', textClass: 'text-slate-500' },
  running: { label: 'RUNNING', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
  complete: { label: 'COMPLETE', dotClass: 'bg-cyan-400', textClass: 'text-cyan-400' },
};

/* ─── سرعة الكتابة (مللي ثانية لكل سطر) ─── */
const LINE_DELAY_MS = 90;

export const VirtualLogsTerminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LogTab>('grover');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  // مراجع داخلية للتحكم في التشغيل
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const currentLineRef = useRef(0);
  const abortRef = useRef(false);
  const allLinesRef = useRef<string[]>([]);

  /* ─── تنظيف المؤقتات عند الإزالة ─── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    };
  }, []);

  /* ─── تمرير تلقائي للأسفل عند إضافة أسطر جديدة ─── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines]);

  /* ─── إيقاف التشغيل ─── */
  const stopExecution = useCallback(() => {
    abortRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (lineTimerRef.current) { clearTimeout(lineTimerRef.current); lineTimerRef.current = null; }
  }, []);

  /* ─── إضافة سطر تالٍ (recursive setTimeout) ─── */
  const scheduleNextLine = useCallback(() => {
    if (abortRef.current) return;
    const idx = currentLineRef.current;
    if (idx >= allLinesRef.current.length) {
      // اكتمل التنفيذ
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setStatus('complete');
      return;
    }
    lineTimerRef.current = setTimeout(() => {
      if (abortRef.current) return;
      setVisibleLines(prev => [...prev, allLinesRef.current[currentLineRef.current]]);
      currentLineRef.current++;
      scheduleNextLine();
    }, LINE_DELAY_MS);
  }, []);

  /* ─── بدء التشغيل ─── */
  const runSimulation = useCallback(() => {
    stopExecution();
    abortRef.current = false;

    const lines = logs[activeTab].split('\n');
    allLinesRef.current = lines;
    currentLineRef.current = 0;
    startTimeRef.current = Date.now();

    setVisibleLines([]);
    setElapsedMs(0);
    setStatus('running');

    // عداد الزمن المنقضي
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    scheduleNextLine();
  }, [activeTab, stopExecution, scheduleNextLine]);

  /* ─── إعادة التشغيل ─── */
  const resetTerminal = useCallback(() => {
    stopExecution();
    setStatus('idle');
    setVisibleLines([]);
    setElapsedMs(0);
  }, [stopExecution]);

  /* ─── عند تغيير التبويب: إيقاف وتصفير ─── */
  const handleTabChange = useCallback((tab: LogTab) => {
    stopExecution();
    setActiveTab(tab);
    setStatus('idle');
    setVisibleLines([]);
    setElapsedMs(0);
  }, [stopExecution]);

  /* ─── تشغيل تلقائي عند أول تحميل ─── */
  const hasAutoRun = useRef(false);
  const runSimulationRef = useRef(runSimulation);
  useEffect(() => { runSimulationRef.current = runSimulation; }, [runSimulation]);

  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      // تأخير بسيط ليظهر المكون أولاً
      const t = setTimeout(() => runSimulationRef.current(), 400);
      return () => clearTimeout(t);
    }
  }, []);

  /* ─── تنسيق الزمن ─── */
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}.${tenths}` : `${sec}.${tenths}s`;
  };

  const activeTabConfig = tabConfig.find(t => t.key === activeTab);
  const statusInfo = STATUS_DISPLAY[status];
  const totalLines = logs[activeTab].split('\n').length;
  const progress = status === 'idle' ? 0 : Math.min((visibleLines.length / totalLines) * 100, 100);

  return (
    <div
      className="p-0 flex flex-col h-full overflow-hidden"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
      }}
    >
      {/* ─── شريط العنوان ─── */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{
          background: '#151619',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal size={18} />
            <span className="font-mono text-sm font-semibold tracking-wider">
              QUANTUM_TERMINAL_v5.0
            </span>
          </div>
          {/* مؤشر الحالة */}
          <div className={`flex items-center gap-1.5 font-mono text-xs ${statusInfo.textClass}`}>
            <span
              className={`inline-block w-2 h-2 rounded-full ${statusInfo.dotClass}`}
              style={status === 'running' ? { animation: 'qtPulse 1s ease-in-out infinite' } : undefined}
            />
            {statusInfo.label}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center gap-2">
          {status !== 'running' ? (
            <button
              onClick={runSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all
                         bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300
                         border border-emerald-500/20"
              aria-label="تشغيل المحاكاة - Run"
            >
              <Play size={12} />
              <span lang="en">RUN</span>
            </button>
          ) : (
            <button
              onClick={stopExecution}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all
                         bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300
                         border border-red-500/20"
              aria-label="إيقاف المحاكاة - Stop"
            >
              <Square size={12} />
              <span lang="en">STOP</span>
            </button>
          )}
          <button
            onClick={resetTerminal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all
                       bg-slate-500/15 text-slate-400 hover:bg-slate-500/25 hover:text-slate-300
                       border border-slate-500/20"
            aria-label="إعادة تعيين الطرفية - Reset"
          >
            <RotateCcw size={12} />
            <span lang="en">RESET</span>
          </button>
        </div>
      </div>

      {/* ─── شريط التبويبات ─── */}
      <div
        className="px-4 py-2 flex gap-2 flex-wrap"
        style={{
          background: '#111214',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === tab.key
                ? tab.activeClass
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── شريط التقدم ─── */}
      <div style={{ height: 2, background: '#1a1b1e' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: activeTabConfig?.color ?? '#10b981',
            transition: 'width 120ms linear',
          }}
        />
      </div>

      {/* ─── منطقة السجلات الحية ─── */}
      <div
        ref={scrollRef}
        className="p-4 flex-grow overflow-auto"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        {status === 'idle' && visibleLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600 font-mono text-sm select-none">
            <Terminal size={32} className="opacity-30" />
            <span>اضغط <span lang="en" className="text-emerald-500 font-bold">RUN</span> لتشغيل المحاكاة</span>
            <span className="text-xs text-slate-700">أو اختر محركاً كمومياً من التبويبات أعلاه</span>
          </div>
        ) : (
          <pre
            className="font-mono text-sm whitespace-pre-wrap"
            dir="ltr"
            style={{ margin: 0, color: activeTabConfig?.color ?? '#34d399' }}
          >
            {visibleLines.map((line, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-600 select-none" style={{ fontSize: 10 }}>
                  {String(i + 1).padStart(2, ' ')} │{' '}
                </span>
                {line}
                {'\n'}
              </React.Fragment>
            ))}
            {/* مؤشر الوميض */}
            {status === 'running' && (
              <span
                className="inline-block w-2 h-4 align-middle"
                style={{
                  background: activeTabConfig?.color ?? '#34d399',
                  animation: 'qtBlink 0.8s step-end infinite',
                }}
              />
            )}
          </pre>
        )}
      </div>

      {/* ─── شريط المعلومات السفلي ─── */}
      <div
        className="px-4 py-2 flex items-center justify-between font-mono text-xs"
        style={{
          background: '#111214',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: '#555',
        }}
      >
        <div className="flex items-center gap-4">
          <span>
            ENGINE: <span style={{ color: activeTabConfig?.color ?? '#10b981' }}>{activeTabConfig?.label ?? '—'}</span>
          </span>
          <span>
            LINES: {visibleLines.length}/{totalLines}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>TIME: {formatTime(elapsedMs)}</span>
          <span>
            QURABIA <span style={{ color: '#8b5cf6' }}>Quantum OS</span>
          </span>
        </div>
      </div>

      {/* ─── أنماط CSS للتحريكات ─── */}
      <style>{`
        @keyframes qtBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes qtPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default VirtualLogsTerminal;
