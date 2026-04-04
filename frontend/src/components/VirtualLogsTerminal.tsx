import React, { useState } from 'react';
import { Terminal } from 'lucide-react';

type LogTab =
  | 'planck'
  | 'crypto'
  | 'vqe'
  | 'alutaibiv2'
  | 'agi'
  | 'medical'
  | 'grover';

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

const tabConfig: { key: LogTab; label: string; activeClass: string }[] = [
  { key: 'grover', label: 'Grover Search', activeClass: 'bg-orange-500/20 text-orange-400' },
  { key: 'medical', label: 'Medical (CQNN)', activeClass: 'bg-teal-500/20 text-teal-400' },
  { key: 'alutaibiv2', label: 'Al-Utaibi v2.0', activeClass: 'bg-pink-500/20 text-pink-400' },
  { key: 'agi', label: 'AGI Refactor', activeClass: 'bg-yellow-500/20 text-yellow-400' },
  { key: 'planck', label: 'Planck', activeClass: 'bg-blue-500/20 text-blue-400' },
  { key: 'crypto', label: 'AUTDIE', activeClass: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'vqe', label: 'VQE', activeClass: 'bg-purple-500/20 text-purple-400' },
];

export const VirtualLogsTerminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LogTab>('grover');

  return (
    <div
      className="p-0 flex flex-col h-full overflow-hidden"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{
          background: '#151619',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal size={18} />
          <span className="font-mono text-sm font-semibold tracking-wider">
            QUANTUM_TERMINAL_v5.0
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
      </div>
      <div className="p-4 flex-grow overflow-auto bg-black/50">
        <pre
          className="font-mono text-sm text-emerald-400/90 whitespace-pre-wrap"
          dir="ltr"
        >
          {logs[activeTab]}
        </pre>
      </div>
    </div>
  );
};

export default VirtualLogsTerminal;
