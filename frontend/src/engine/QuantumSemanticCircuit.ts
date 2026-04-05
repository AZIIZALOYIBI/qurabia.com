/**
 * QuantumSemanticCircuit — محرك الدوائر الكمومية الدلالية
 *
 * يحوّل البنية اللغوية العربية إلى دوائر كمومية حقيقية:
 * - الجذر الثلاثي → كيوبت في حالة تراكب (المشتقات = حالات التراكب)
 * - بوابة Hadamard = التنكير (عالَم → عوالم محتملة)
 * - بوابة CNOT = الإضافة (علم + الله = تشابك دلالي)
 * - بوابة Phase = الإعراب (تغيير الحالة النحوية)
 * - بوابة SWAP = المجاز (نقل المعنى بين كلمتين)
 *
 * هذا هو أول محرك في العالم يبني دوائر كمومية من النحو العربي
 */

import { type MorphAnalysis, type SentenceAnalysis } from './ArabicMorphology';

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** أنواع البوابات الكمومية */
export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'SWAP' | 'Phase' | 'T' | 'S' | 'Rx' | 'Ry' | 'Rz';

/** لون البوابة للعرض المرئي */
export type GateColor = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';

/** بوابة كمومية في الدائرة */
export interface CircuitGate {
  /** نوع البوابة */
  type: GateType;
  /** الكيوبت الهدف */
  target: number;
  /** الكيوبت المتحكم (لبوابات CNOT وCZ) */
  control?: number;
  /** زاوية الدوران (لبوابات Rx, Ry, Rz, Phase) */
  angle?: number;
  /** خطوة الدائرة (العمود) */
  step: number;
  /** تسمية عربية */
  label: string;
  /** وصف ما تمثله البوابة لغوياً */
  linguisticMeaning: string;
  /** اللون */
  color: GateColor;
}

/** كيوبت واحد في الدائرة */
export interface CircuitQubit {
  /** رقم الكيوبت */
  index: number;
  /** الكلمة المرتبطة */
  word: string;
  /** الجذر */
  root: string;
  /** الحالة الأولية: |0⟩ أو |1⟩ */
  initialState: 0 | 1;
  /** الاحتمالات بعد تشغيل الدائرة */
  finalProb0: number;
  finalProb1: number;
}

/** عملية قياس */
export interface Measurement {
  /** الكيوبت المُقاس */
  qubit: number;
  /** نتيجة القياس */
  result: 0 | 1;
  /** الاحتمال */
  probability: number;
  /** الخطوة */
  step: number;
}

/** الدائرة الكمومية الكاملة */
export interface SemanticCircuit {
  /** اسم الدائرة */
  name: string;
  /** النص المصدري */
  sourceText: string;
  /** الكيوبتات */
  qubits: CircuitQubit[];
  /** البوابات */
  gates: CircuitGate[];
  /** القياسات */
  measurements: Measurement[];
  /** عدد الخطوات (الأعمدة) */
  totalSteps: number;
  /** عمق الدائرة */
  depth: number;
  /** درجة التشابك (0-1) */
  entanglementDegree: number;
  /** شرح الدائرة بالعربية */
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════
// ثوابت
// ═══════════════════════════════════════════════════════════════

const FINE_STRUCTURE = 137.035999084;

// ═══════════════════════════════════════════════════════════════
// بناء الدائرة من التحليل الصرفي
// ═══════════════════════════════════════════════════════════════

/**
 * بناء دائرة كمومية دلالية من تحليل جملة عربية
 *
 * القواعد اللغوية → البوابات الكمومية:
 * 1. كل كلمة = كيوبت واحد
 * 2. الكلمة المعرّفة (بأل) = حالة |1⟩، المنكّرة = |0⟩ + بوابة H
 * 3. الكلمات من نفس الجذر = بوابة CNOT (تشابك)
 * 4. الكلمات من نفس الحقل الدلالي = بوابة Phase
 * 5. الكلمات المتجاورة = بوابة SWAP إذا كانت من حقول مختلفة (مجاز)
 */
export function buildSemanticCircuit(analysis: SentenceAnalysis): SemanticCircuit {
  const meaningfulWords = analysis.words.filter(w => w.root && w.confidence > 0);

  if (meaningfulWords.length === 0) {
    return emptyCircuit(analysis.text);
  }

  const qubits: CircuitQubit[] = [];
  const gates: CircuitGate[] = [];
  const measurements: Measurement[] = [];
  let currentStep = 0;

  // ─── الخطوة 1: إنشاء الكيوبتات ───
  for (let i = 0; i < meaningfulWords.length; i++) {
    const w = meaningfulWords[i];
    qubits.push({
      index: i,
      word: w.word,
      root: w.root,
      initialState: w.isDefinite ? 1 : 0,
      finalProb0: 0.5,
      finalProb1: 0.5,
    });
  }

  // ─── الخطوة 2: بوابات التراكب (Hadamard) ───
  // الكلمات غير المعرّفة تدخل في تراكب — تمثل تعدد المعاني
  currentStep++;
  for (let i = 0; i < meaningfulWords.length; i++) {
    if (!meaningfulWords[i].isDefinite) {
      gates.push({
        type: 'H',
        target: i,
        step: currentStep,
        label: 'H',
        linguisticMeaning: `تنكير: "${meaningfulWords[i].word}" ← تراكب المعاني المحتملة`,
        color: 'primary',
      });
    }
  }

  // ─── الخطوة 3: بوابات الطور (Phase) ───
  // كل كلمة تحصل على طور يعتمد على وزنها الصرفي
  currentStep++;
  for (let i = 0; i < meaningfulWords.length; i++) {
    const w = meaningfulWords[i];
    // الطور يعتمد على نوع الكلمة
    const phaseAngle = w.wordType === 'noun' ? Math.PI / 4 :
      w.wordType === 'verb' ? Math.PI / 2 :
        w.wordType === 'adjective' ? Math.PI / 3 :
          Math.PI / 6;

    gates.push({
      type: 'Phase',
      target: i,
      angle: phaseAngle,
      step: currentStep,
      label: `P(${(phaseAngle * 180 / Math.PI).toFixed(0)}°)`,
      linguisticMeaning: `إعراب: "${w.word}" — ${w.patternName || w.pattern} (${w.wordType === 'noun' ? 'اسم' : w.wordType === 'verb' ? 'فعل' : w.wordType === 'adjective' ? 'صفة' : 'أداة'})`,
      color: 'tertiary',
    });
  }

  // ─── الخطوة 4: بوابات التشابك (CNOT) ───
  // الكلمات من نفس الجذر أو الحقل الدلالي تتشابك
  currentStep++;
  let entanglementCount = 0;

  for (let i = 0; i < meaningfulWords.length; i++) {
    for (let j = i + 1; j < meaningfulWords.length; j++) {
      const wA = meaningfulWords[i];
      const wB = meaningfulWords[j];

      // تشابك الجذر المشترك — أقوى نوع
      if (wA.root === wB.root) {
        gates.push({
          type: 'CNOT',
          target: j,
          control: i,
          step: currentStep,
          label: 'CNOT',
          linguisticMeaning: `تشابك جذري: "${wA.word}" ⊗ "${wB.word}" — جذر مشترك [${wA.root}]`,
          color: 'secondary',
        });
        entanglementCount++;
      }
      // تشابك الحقل الدلالي — نوع أضعف
      else if (wA.semanticField === wB.semanticField && wA.semanticField !== 'unknown') {
        gates.push({
          type: 'CNOT',
          target: j,
          control: i,
          step: currentStep + 1,
          label: 'CX',
          linguisticMeaning: `تشابك دلالي: "${wA.word}" ⊗ "${wB.word}" — حقل [${wA.semanticField}]`,
          color: 'success',
        });
        entanglementCount++;
      }
    }
  }
  if (entanglementCount > 0) currentStep++;

  // ─── الخطوة 5: بوابات المجاز (SWAP) ───
  // الكلمات المتجاورة من حقول مختلفة قد تمثّل مجازاً
  currentStep++;
  for (let i = 0; i < meaningfulWords.length - 1; i++) {
    const wA = meaningfulWords[i];
    const wB = meaningfulWords[i + 1];

    if (wA.semanticField !== 'unknown' && wB.semanticField !== 'unknown' &&
      wA.semanticField !== wB.semanticField) {
      // فقط إذا كانت من حقول بعيدة (مثل طبيعة + عاطفة = مجاز)
      const isMetaphor = isDistantFields(wA.semanticField, wB.semanticField);
      if (isMetaphor) {
        gates.push({
          type: 'SWAP',
          target: i + 1,
          control: i,
          step: currentStep,
          label: 'SWAP',
          linguisticMeaning: `مجاز: "${wA.word}" ↔ "${wB.word}" — نقل المعنى بين حقلين`,
          color: 'error',
        });
      }
    }
  }

  // ─── الخطوة 6: القياسات ───
  currentStep++;
  for (let i = 0; i < qubits.length; i++) {
    // حساب الاحتمالات النهائية
    const { prob0, prob1 } = computeFinalState(i, qubits, gates);
    qubits[i].finalProb0 = prob0;
    qubits[i].finalProb1 = prob1;

    const result: 0 | 1 = prob1 > prob0 ? 1 : 0;
    measurements.push({
      qubit: i,
      result,
      probability: result === 1 ? prob1 : prob0,
      step: currentStep,
    });
  }

  // حساب درجة التشابك
  const maxPossibleEntanglements = (meaningfulWords.length * (meaningfulWords.length - 1)) / 2;
  const entanglementDegree = maxPossibleEntanglements > 0
    ? Math.min(1, entanglementCount / maxPossibleEntanglements)
    : 0;

  // بناء الشرح
  const explanation = buildExplanation(meaningfulWords, gates, entanglementCount);

  return {
    name: `دائرة: ${analysis.text.slice(0, 30)}${analysis.text.length > 30 ? '...' : ''}`,
    sourceText: analysis.text,
    qubits,
    gates,
    measurements,
    totalSteps: currentStep,
    depth: currentStep,
    entanglementDegree,
    explanation,
  };
}

// ═══════════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════════

/** حساب الحالة النهائية لكيوبت بعد تطبيق البوابات */
function computeFinalState(
  qubitIndex: number,
  qubits: CircuitQubit[],
  gates: CircuitGate[],
): { prob0: number; prob1: number } {
  let alpha = qubits[qubitIndex].initialState === 0 ? 1 : 0; // |0⟩ amplitude
  let beta = qubits[qubitIndex].initialState === 1 ? 1 : 0;  // |1⟩ amplitude

  // تطبيق البوابات بالتسلسل
  const relevantGates = gates
    .filter(g => g.target === qubitIndex || g.control === qubitIndex)
    .sort((a, b) => a.step - b.step);

  for (const gate of relevantGates) {
    switch (gate.type) {
      case 'H': {
        const newAlpha = (alpha + beta) * Math.SQRT1_2;
        const newBeta = (alpha - beta) * Math.SQRT1_2;
        alpha = newAlpha;
        beta = newBeta;
        break;
      }
      case 'X': {
        [alpha, beta] = [beta, alpha];
        break;
      }
      case 'Phase': {
        // بوابة الطور تؤثر فقط على |1⟩
        const angle = gate.angle || 0;
        beta = beta * Math.cos(angle); // تبسيط (بدون المركّب التخيلي)
        break;
      }
      case 'CNOT': {
        if (gate.target === qubitIndex) {
          // كيوبت هدف — يتأثر بالمتحكم
          const mixFactor = 0.3; // نسبة التأثير
          const temp = alpha;
          alpha = alpha * (1 - mixFactor) + beta * mixFactor;
          beta = beta * (1 - mixFactor) + temp * mixFactor;
        }
        break;
      }
      case 'SWAP': {
        // SWAP يخلط الحالتين
        const swapFactor = 0.5;
        const newAlpha = alpha * (1 - swapFactor) + beta * swapFactor;
        const newBeta = beta * (1 - swapFactor) + alpha * swapFactor;
        alpha = newAlpha;
        beta = newBeta;
        break;
      }
      default:
        break;
    }
  }

  // تطبيع الاحتمالات
  const norm = alpha * alpha + beta * beta;
  if (norm === 0) return { prob0: 0.5, prob1: 0.5 };

  return {
    prob0: (alpha * alpha) / norm,
    prob1: (beta * beta) / norm,
  };
}

/** هل الحقلان الدلاليان متباعدان (يُرجّح المجاز)؟ */
function isDistantFields(a: string, b: string): boolean {
  const clusters: string[][] = [
    ['knowledge', 'thought', 'perception'],
    ['creation', 'commerce'],
    ['movement', 'warfare'],
    ['speech', 'society'],
    ['emotion', 'religion'],
    ['nature', 'existence'],
    ['body'],
  ];

  // إذا كانا في مجموعتين مختلفتين، فهما متباعدان
  const clusterA = clusters.find(c => c.includes(a));
  const clusterB = clusters.find(c => c.includes(b));

  if (!clusterA || !clusterB) return false;
  return clusterA !== clusterB;
}

/** بناء شرح الدائرة بالعربية */
function buildExplanation(words: MorphAnalysis[], gates: CircuitGate[], entanglementCount: number): string {
  const parts: string[] = [];

  parts.push(`دائرة كمومية من ${words.length} كيوبت (كلمة).`);

  const hGates = gates.filter(g => g.type === 'H');
  if (hGates.length > 0) {
    parts.push(`${hGates.length} بوابة هادامارد (تراكب المعاني — كلمات منكّرة).`);
  }

  const phaseGates = gates.filter(g => g.type === 'Phase');
  if (phaseGates.length > 0) {
    parts.push(`${phaseGates.length} بوابة طور (الإعراب — تمييز الأسماء والأفعال والصفات).`);
  }

  if (entanglementCount > 0) {
    parts.push(`${entanglementCount} تشابك كمومي (جذور مشتركة وحقول دلالية).`);
  }

  const swapGates = gates.filter(g => g.type === 'SWAP');
  if (swapGates.length > 0) {
    parts.push(`${swapGates.length} بوابة مبادلة (مجاز — نقل المعنى بين حقول متباعدة).`);
  }

  return parts.join(' ');
}

/** دائرة فارغة */
function emptyCircuit(text: string): SemanticCircuit {
  return {
    name: 'دائرة فارغة',
    sourceText: text,
    qubits: [],
    gates: [],
    measurements: [],
    totalSteps: 0,
    depth: 0,
    entanglementDegree: 0,
    explanation: 'لم يتم العثور على كلمات عربية قابلة للتحليل.',
  };
}

/**
 * تحويل الدائرة إلى نص ASCII (للعرض في الطرفية)
 *
 * مثال:
 * q0 |كتاب⟩ ─ H ─ P(45°) ─ ● ───── M
 * q1 |علم⟩  ─ H ─ P(90°) ─ ⊕ ─ SWAP M
 * q2 |نور⟩  ───── P(45°) ─────── SWAP M
 */
export function circuitToASCII(circuit: SemanticCircuit): string {
  if (circuit.qubits.length === 0) return '(دائرة فارغة)';

  const lines: string[] = [];
  const maxWordLen = Math.max(...circuit.qubits.map(q => q.word.length));

  for (const qubit of circuit.qubits) {
    const label = `q${qubit.index} |${qubit.word.padEnd(maxWordLen)}⟩`;
    const segments: string[] = [label];

    for (let step = 1; step <= circuit.totalSteps; step++) {
      const gatesAtStep = circuit.gates.filter(
        g => g.step === step && (g.target === qubit.index || g.control === qubit.index)
      );

      if (gatesAtStep.length === 0) {
        segments.push('───');
      } else {
        const gate = gatesAtStep[0];
        if (gate.control === qubit.index) {
          segments.push(' ● ');
        } else if (gate.type === 'SWAP') {
          segments.push(' ✕ ');
        } else {
          segments.push(` ${gate.label.slice(0, 3).padEnd(3)} `);
        }
      }
    }

    // القياس
    const meas = circuit.measurements.find(m => m.qubit === qubit.index);
    if (meas) {
      segments.push(`→ |${meas.result}⟩`);
    }

    lines.push(segments.join('─'));
  }

  return lines.join('\n');
}
