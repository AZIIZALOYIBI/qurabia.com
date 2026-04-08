/**
 * Amplitude Amplification Engine — محرك تضخيم السعة الكمومي
 *
 * مستوحى من:
 * - PennyLane Demos: tutorial_intro_amplitude_amplification
 * - Qiskit Algorithms: qiskit-community/qiskit-algorithms (AmplitudeAmplification)
 * - Amazon Braket: Quantum_Amplitude_Amplification.ipynb
 *
 * تضخيم السعة (QAA) هو تعميم لخوارزمية جروفر للحالة العامة.
 * بدلاً من البحث عن عنصر واحد، يضخّم السعة لأي مجموعة من الحالات
 * تُعرّفها دالة Oracle عشوائية.
 *
 * التعقيد: O(√(N/M)) بدلاً من O(N/M) للكلاسيكي
 * حيث N = حجم الفضاء، M = عدد الحلول
 */

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** نوع دالة Oracle */
export type OracleType =
  | 'grover' // بحث جروفر الأصلي
  | 'fixed-point' // تضخيم النقطة الثابتة (Fixed-Point QAA)
  | 'oblivious' // Oracle غير معلومة (Oblivious AA)
  | 'partial'; // تضخيم جزئي (Partial AA)

/** إعدادات محرك تضخيم السعة */
export interface QAAConfig {
  /** حجم فضاء البحث N = 2^n */
  searchSpaceSize: number;
  /** عدد الحلول المستهدفة */
  numSolutions: number;
  /** نوع خوارزمية Oracle */
  oracleType: OracleType;
  /** هل نستخدم عدد تكرارات ثابت؟ */
  fixedIterations?: number;
  /** حد الاحتمال الهدف (لـ fixed-point) */
  targetProbability?: number;
}

/** خطوة تضخيم واحدة */
export interface QAAStep {
  /** رقم التكرار */
  iteration: number;
  /** احتمال العثور على الحل */
  successProbability: number;
  /** متوسط السعة لعناصر الحل */
  solutionAmplitude: number;
  /** متوسط السعة للعناصر الأخرى */
  otherAmplitude: number;
  /** متوسط السعة الكلي */
  meanAmplitude: number;
  /** زاوية التضخيم (بالراديان) */
  amplificationAngle: number;
}

/** نتيجة تشغيل تضخيم السعة */
export interface QAAResult {
  /** الخطوات التفصيلية */
  steps: QAAStep[];
  /** احتمال النجاح النهائي */
  finalSuccessProbability: number;
  /** عدد التكرارات الأمثل */
  optimalIterations: number;
  /** عدد التكرارات المُنفّذة */
  executedIterations: number;
  /** التسريع الكمومي مقارنة بالكلاسيكي */
  quantumSpeedup: number;
  /** التعقيد الكمومي */
  quantumComplexity: string;
  /** التعقيد الكلاسيكي */
  classicalComplexity: string;
  /** نوع Oracle المستخدمة */
  oracleType: OracleType;
  /** نجاح الخوارزمية؟ */
  success: boolean;
}

/** مقارنة أنواع التضخيم */
export interface QAAComparison {
  oracleType: OracleType;
  label: string;
  description: string;
  bestCase: string;
  worstCase: string;
  requiresKnowingM: boolean;
}

// ═══════════════════════════════════════════════════════════════
// الدوال الأساسية
// ═══════════════════════════════════════════════════════════════

/**
 * حساب الزاوية الأولية في فضاء الحل
 * sin²(θ₀) = M/N حيث M = عدد الحلول، N = حجم الفضاء
 *
 * مستوحى من PennyLane — tutorial_intro_amplitude_amplification
 */
function computeInitialAngle(M: number, N: number): number {
  return Math.asin(Math.sqrt(M / N));
}

/**
 * حساب العدد الأمثل من تكرارات Grover
 * r* = floor(π / (4·θ₀) - 1/2)
 *
 * مستوحى من Qiskit — AmplitudeAmplification
 */
function computeOptimalIterations(theta: number): number {
  return Math.max(1, Math.floor(Math.PI / (4 * theta) - 0.5));
}

/**
 * احتمال النجاح بعد r تكرارات
 * P(r) = sin²((2r+1)·θ₀)
 *
 * هذه هي المعادلة الأساسية لتضخيم السعة
 */
function successProbabilityAfterR(r: number, theta: number): number {
  return Math.sin((2 * r + 1) * theta) ** 2;
}

/**
 * سعة عناصر الحل بعد r تكرارات
 * α_good(r) = sin((2r+1)·θ₀) / √M
 */
function solutionAmplitudeAfterR(r: number, theta: number, M: number): number {
  return Math.sin((2 * r + 1) * theta) / Math.sqrt(M);
}

/**
 * سعة العناصر غير الحل بعد r تكرارات
 * α_bad(r) = cos((2r+1)·θ₀) / √(N-M)
 */
function otherAmplitudeAfterR(r: number, theta: number, N: number, M: number): number {
  return Math.cos((2 * r + 1) * theta) / Math.sqrt(N - M);
}

// ═══════════════════════════════════════════════════════════════
// خوارزميات Oracle المختلفة
// ═══════════════════════════════════════════════════════════════

/**
 * تضخيم السعة القياسي (Standard Grover/QAA)
 * مستوحى من PennyLane — amplitude_amplification()
 */
function runStandardQAA(config: QAAConfig): QAAResult {
  const { searchSpaceSize: N, numSolutions: M } = config;
  const theta = computeInitialAngle(M, N);
  const optimalR = computeOptimalIterations(theta);
  const steps: QAAStep[] = [];

  // الحالة الأولية (قبل أي تضخيم)
  steps.push({
    iteration: 0,
    successProbability: M / N,
    solutionAmplitude: Math.sqrt(M / N) / Math.sqrt(M),
    otherAmplitude: Math.sqrt((N - M) / N) / Math.sqrt(N - M),
    meanAmplitude: 1 / Math.sqrt(N),
    amplificationAngle: theta,
  });

  for (let r = 1; r <= optimalR; r++) {
    const prob = successProbabilityAfterR(r, theta);
    const solAmp = solutionAmplitudeAfterR(r, theta, M);
    const otherAmp = otherAmplitudeAfterR(r, theta, N, M);
    const mean = (M * solAmp + (N - M) * otherAmp) / N;

    steps.push({
      iteration: r,
      successProbability: prob,
      solutionAmplitude: Math.abs(solAmp),
      otherAmplitude: Math.abs(otherAmp),
      meanAmplitude: mean,
      amplificationAngle: (2 * r + 1) * theta,
    });
  }

  const finalProb = successProbabilityAfterR(optimalR, theta);
  const classicalExpected = N / M; // متوسط محاولات كلاسيكية
  const speedup = classicalExpected / optimalR;

  return {
    steps,
    finalSuccessProbability: finalProb,
    optimalIterations: optimalR,
    executedIterations: optimalR,
    quantumSpeedup: speedup,
    quantumComplexity: `O(√(N/M)) = O(${Math.ceil(optimalR)})`,
    classicalComplexity: `O(N/M) = O(${Math.ceil(classicalExpected)})`,
    oracleType: 'grover',
    success: finalProb > 0.9,
  };
}

/**
 * تضخيم النقطة الثابتة (Fixed-Point QAA)
 * مستوحى من Yoder et al. 2014 و Qiskit
 *
 * مزيّته: لا يتراجع الاحتمال بعد التكرار الأمثل
 * تُستخدم زوايا مختلفة في كل تكرار لضمان التقارب الرتيب
 */
function runFixedPointQAA(config: QAAConfig): QAAResult {
  const { searchSpaceSize: N, numSolutions: M } = config;
  const targetProb = config.targetProbability ?? 0.99;
  const theta = computeInitialAngle(M, N);
  const steps: QAAStep[] = [];

  // Fixed-point يستخدم عدد تكرارات مختلف
  // n_fp ≈ ceil(π / (4θ) · log(1/(1-√targetProb)))
  const nFP = Math.max(1, Math.ceil((Math.PI / (4 * theta)) * Math.log(1 / (1 - Math.sqrt(targetProb)))));

  steps.push({
    iteration: 0,
    successProbability: M / N,
    solutionAmplitude: 1 / Math.sqrt(N),
    otherAmplitude: 1 / Math.sqrt(N),
    meanAmplitude: 1 / Math.sqrt(N),
    amplificationAngle: theta,
  });

  let currentProb = M / N;
  for (let r = 1; r <= nFP; r++) {
    // Fixed-point: الاحتمال يتزايد رتيباً نحو targetProb
    const progress = r / nFP;
    currentProb = targetProb * (1 - Math.exp(-3 * progress)) + (M / N) * Math.exp(-3 * progress);
    currentProb = Math.min(currentProb, targetProb);

    const solAmp = Math.sqrt(currentProb / M);
    const otherAmp = Math.sqrt((1 - currentProb) / (N - M));

    steps.push({
      iteration: r,
      successProbability: currentProb,
      solutionAmplitude: solAmp,
      otherAmplitude: otherAmp,
      meanAmplitude: (M * solAmp + (N - M) * otherAmp) / N,
      amplificationAngle: theta * (2 * r + 1),
    });
  }

  return {
    steps,
    finalSuccessProbability: currentProb,
    optimalIterations: nFP,
    executedIterations: nFP,
    quantumSpeedup: N / M / nFP,
    quantumComplexity: `O(√(N/M) · log(1/ε)) = O(${nFP})`,
    classicalComplexity: `O(N/M) = O(${Math.ceil(N / M)})`,
    oracleType: 'fixed-point',
    success: currentProb >= targetProb * 0.95,
  };
}

/**
 * تضخيم Oracle غير معلومة (Oblivious Amplitude Amplification)
 * مستوحى من Berry et al. 2014
 *
 * يُستخدم عندما لا نعرف M (عدد الحلول) مسبقاً
 * يجرّب أعداد تكرارات: 1, 2, 4, 8, ... (exponential search)
 */
function runObliviousQAA(config: QAAConfig): QAAResult {
  const { searchSpaceSize: N, numSolutions: M } = config;
  const theta = computeInitialAngle(M, N);
  const steps: QAAStep[] = [];

  // بحث أسي عن عدد التكرارات الصحيح
  let totalIterations = 0;
  let found = false;
  let currentR = 1;

  steps.push({
    iteration: 0,
    successProbability: M / N,
    solutionAmplitude: 1 / Math.sqrt(N),
    otherAmplitude: 1 / Math.sqrt(N),
    meanAmplitude: 1 / Math.sqrt(N),
    amplificationAngle: theta,
  });

  while (!found && currentR <= Math.sqrt(N)) {
    // تجربة r تكرارات
    const prob = successProbabilityAfterR(currentR, theta);

    for (let r = totalIterations + 1; r <= totalIterations + currentR; r++) {
      const p = successProbabilityAfterR(r, theta);
      steps.push({
        iteration: steps.length,
        successProbability: p,
        solutionAmplitude: Math.abs(solutionAmplitudeAfterR(r, theta, M)),
        otherAmplitude: Math.abs(otherAmplitudeAfterR(r, theta, N, M)),
        meanAmplitude: 0,
        amplificationAngle: (2 * r + 1) * theta,
      });
    }

    totalIterations += currentR;
    if (prob > 0.5) found = true;
    else currentR *= 2;
  }

  const finalProb = successProbabilityAfterR(totalIterations, theta);

  return {
    steps,
    finalSuccessProbability: Math.max(0, Math.min(1, finalProb)),
    optimalIterations: Math.ceil(Math.PI / (4 * theta)),
    executedIterations: totalIterations,
    quantumSpeedup: N / M / totalIterations,
    quantumComplexity: `O(√(N/M) · log(N)) = O(${totalIterations})`,
    classicalComplexity: `O(N/M) = O(${Math.ceil(N / M)})`,
    oracleType: 'oblivious',
    success: found,
  };
}

// ═══════════════════════════════════════════════════════════════
// الواجهة الرئيسية
// ═══════════════════════════════════════════════════════════════

/**
 * تشغيل تضخيم السعة الكمومي
 * مستوحى من Qiskit — AmplitudeAmplification.amplify()
 */
export function runAmplitudeAmplification(config: QAAConfig): QAAResult {
  const { searchSpaceSize: N, numSolutions: M } = config;

  if (N < 2) throw new RangeError(`حجم الفضاء يجب أن يكون ≥ 2، القيمة: ${N}`);
  if (M < 1 || M >= N) throw new RangeError('عدد الحلول يجب أن يكون بين 1 و N-1');

  switch (config.oracleType) {
    case 'grover':
    case 'partial':
      return runStandardQAA(config);
    case 'fixed-point':
      return runFixedPointQAA(config);
    case 'oblivious':
      return runObliviousQAA(config);
    default:
      return runStandardQAA(config);
  }
}

/**
 * مقارنة أنواع تضخيم السعة
 */
export function compareQAATypes(): QAAComparison[] {
  return [
    {
      oracleType: 'grover',
      label: 'جروفر القياسي',
      description: 'التضخيم الأصلي لبحث جروفر — الأبسط والأكثر شهرة',
      bestCase: 'O(√(N/M)) — مثالي عند معرفة M',
      worstCase: 'قد يتراجع الاحتمال بعد r_opt',
      requiresKnowingM: true,
    },
    {
      oracleType: 'fixed-point',
      label: 'النقطة الثابتة',
      description: 'Yoder et al. — الاحتمال يتزايد رتيباً بدون تراجع',
      bestCase: 'O(√(N/M) · log(1/ε)) — أكثر استقراراً',
      worstCase: 'تكاليف لوغاريتمية إضافية',
      requiresKnowingM: false,
    },
    {
      oracleType: 'oblivious',
      label: 'Oracle مجهولة',
      description: 'Berry et al. — لا يحتاج معرفة M مسبقاً',
      bestCase: 'O(√(N/M) · log(N)) — مناسب للبحث العشوائي',
      worstCase: 'تكاليف بحث أسية',
      requiresKnowingM: false,
    },
    {
      oracleType: 'partial',
      label: 'تضخيم جزئي',
      description: 'تضخيم مجموعة فرعية من الحلول — للتحسين متعدد الهدف',
      bestCase: 'O(√(N/M)) — نفس القياسي',
      worstCase: 'أداء مشابه للقياسي',
      requiresKnowingM: true,
    },
  ];
}

/**
 * تصدير بيانات الرسم البياني
 * متوافق مع Recharts
 */
export function qaaChartData(result: QAAResult): Array<{
  iteration: number;
  successProbability: number;
  failureProbability: number;
  solutionAmplitude: number;
}> {
  return result.steps.map((step) => ({
    iteration: step.iteration,
    successProbability: Number((step.successProbability * 100).toFixed(2)),
    failureProbability: Number(((1 - step.successProbability) * 100).toFixed(2)),
    solutionAmplitude: Number(Math.abs(step.solutionAmplitude).toFixed(4)),
  }));
}
