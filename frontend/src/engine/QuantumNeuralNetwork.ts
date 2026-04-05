/**
 * Quantum Neural Network Training Simulator
 * محاكاة تدريب الشبكات العصبية الكمومية
 *
 * مستوحى من mit-han-lab/torchquantum و sQUlearn/squlearn
 *
 * تحسينات:
 * - طبقات دوائر كمومية متغيرة (Variational Quantum Circuits)
 * - حساب التدرجات (Parameter-Shift Rule)
 * - استراتيجيات تحسين متعددة (SGD, Adam)
 * - تتبع مقاييس التدريب (فقدان, دقة, تدرجات)
 */

// ═══════════════════════════════════════════════════════════════
// أنواع البيانات
// ═══════════════════════════════════════════════════════════════

/** طبقة دائرة كمومية متغيرة */
export interface QuantumLayer {
  /** اسم الطبقة */
  name: string;
  /** عدد الكيوبتات */
  numQubits: number;
  /** المعاملات القابلة للتعلم */
  parameters: number[];
  /** نوع الطبقة */
  type: 'rx' | 'ry' | 'rz' | 'entangling' | 'measurement';
}

/** إحصائيات خطوة تدريب واحدة */
export interface TrainingStep {
  /** رقم الحقبة */
  epoch: number;
  /** الدقة الحالية */
  accuracy: number;
  /** الفقدان الحالي */
  loss: number;
  /** معيار التدرجات */
  gradientNorm: number;
  /** معدل التعلم الحالي */
  learningRate: number;
}

/** نتيجة التدريب الكاملة */
export interface QNNTrainingResult {
  /** الدقة النهائية */
  finalAccuracy: number;
  /** الفقدان النهائي */
  finalLoss: number;
  /** سجل التدريب */
  history: TrainingStep[];
  /** عدد المعاملات */
  totalParameters: number;
  /** عدد الطبقات */
  numLayers: number;
}

/** إعدادات التدريب */
export interface QNNConfig {
  /** عدد الحقبات */
  epochs: number;
  /** معدل التقارب */
  convergenceRate: number;
  /** عدد الكيوبتات */
  numQubits: number;
  /** عدد طبقات الدائرة */
  numLayers: number;
  /** استراتيجية التحسين */
  optimizer: 'sgd' | 'adam';
  /** معدل التعلم الابتدائي */
  learningRate: number;
}

// ═══════════════════════════════════════════════════════════════
// بناء الدائرة المتغيرة (Variational Circuit)
// ═══════════════════════════════════════════════════════════════

/**
 * بناء دائرة كمومية متغيرة (Ansatz)
 * مستوحى من torchquantum — StronglyEntanglingLayers
 *
 * كل طبقة تتكون من:
 * 1. بوابات RY/RZ محلية (معاملات قابلة للتعلم)
 * 2. بوابات CNOT متشابكة (ربط الكيوبتات)
 */
export function buildVariationalCircuit(numQubits: number, numLayers: number): QuantumLayer[] {
  const layers: QuantumLayer[] = [];

  for (let l = 0; l < numLayers; l++) {
    // طبقة دوران RY
    layers.push({
      name: `RY-Layer-${l}`,
      numQubits,
      parameters: Array.from({ length: numQubits }, () => Math.random() * 2 * Math.PI),
      type: 'ry',
    });

    // طبقة دوران RZ
    layers.push({
      name: `RZ-Layer-${l}`,
      numQubits,
      parameters: Array.from({ length: numQubits }, () => Math.random() * 2 * Math.PI),
      type: 'rz',
    });

    // طبقة تشابك CNOT
    layers.push({
      name: `Entangling-Layer-${l}`,
      numQubits,
      parameters: [], // CNOT لا تحتاج معاملات
      type: 'entangling',
    });
  }

  // طبقة القياس
  layers.push({
    name: 'Measurement',
    numQubits,
    parameters: [],
    type: 'measurement',
  });

  return layers;
}

/**
 * حساب عدد المعاملات في الدائرة
 */
export function countParameters(layers: QuantumLayer[]): number {
  return layers.reduce((sum, layer) => sum + layer.parameters.length, 0);
}

// ═══════════════════════════════════════════════════════════════
// التدريب
// ═══════════════════════════════════════════════════════════════

/**
 * محاكاة قاعدة إزاحة المعامل (Parameter-Shift Rule)
 * مستوحى من torchquantum — gradient computation
 *
 * ∂f/∂θ ≈ [f(θ+π/2) - f(θ-π/2)] / 2
 *
 * هذه الطريقة تعطي التدرج الدقيق للدوائر الكمومية
 */
function computeGradient(parameters: number[], lossFunction: (params: number[]) => number): number[] {
  const shift = Math.PI / 2;
  const gradients = new Array(parameters.length);

  for (let i = 0; i < parameters.length; i++) {
    // إزاحة للأمام
    const paramsPlus = [...parameters];
    paramsPlus[i] += shift;
    const lossPlus = lossFunction(paramsPlus);

    // إزاحة للخلف
    const paramsMinus = [...parameters];
    paramsMinus[i] -= shift;
    const lossMinus = lossFunction(paramsMinus);

    // التدرج
    gradients[i] = (lossPlus - lossMinus) / 2;
  }

  return gradients;
}

/**
 * تدريب الشبكة العصبية الكمومية (الواجهة الأصلية — متوافقة للخلف)
 */
export function trainQNN(
  epochs: number = 100,
  convergenceRate: number = 2.8,
  onProgress: (epoch: number, accuracy: number, loss: number) => void,
): Promise<{ finalAccuracy: number }> {
  let currentAccuracy = 50.0;
  const expectedAccuracy = 99.5;
  let currentLoss = 2.0;

  return new Promise((resolve) => {
    let epoch = 0;
    const interval = setInterval(() => {
      if (epoch >= epochs) {
        clearInterval(interval);
        resolve({ finalAccuracy: currentAccuracy });
        return;
      }

      const improvement =
        (expectedAccuracy - currentAccuracy) * (convergenceRate / 50);
      currentAccuracy += improvement + (Math.random() * 0.4 - 0.2);
      if (currentAccuracy > 99.9) currentAccuracy = 99.9;

      currentLoss =
        currentLoss * Math.exp(-convergenceRate / 20) + Math.random() * 0.05;
      if (currentLoss < 0.01) currentLoss = 0.01;

      onProgress(epoch + 1, currentAccuracy, currentLoss);
      epoch++;
    }, 50);
  });
}

/**
 * تدريب متقدم مع دائرة متغيرة (واجهة جديدة)
 * مستوحى من torchquantum و squlearn
 *
 * يدعم:
 * - استراتيجيات تحسين SGD و Adam
 * - تتبع التدرجات
 * - جدولة معدل التعلم (Learning Rate Scheduling)
 */
export function trainVariationalQNN(
  config: QNNConfig,
  onProgress?: (step: TrainingStep) => void,
): QNNTrainingResult {
  const { epochs, convergenceRate, numQubits, numLayers, optimizer, learningRate } = config;

  // بناء الدائرة
  const layers = buildVariationalCircuit(numQubits, numLayers);
  const totalParams = countParameters(layers);

  // تهيئة المعاملات
  let parameters = layers
    .filter(l => l.parameters.length > 0)
    .flatMap(l => l.parameters);

  // حالة محسّن Adam
  let m = new Array(parameters.length).fill(0); // اللحظة الأولى
  let v = new Array(parameters.length).fill(0); // اللحظة الثانية
  const beta1 = 0.9;
  const beta2 = 0.999;
  const epsilon = 1e-8;

  let currentAccuracy = 50.0;
  let currentLoss = 2.0;
  let currentLR = learningRate;
  const history: TrainingStep[] = [];

  // دالة الفقدان المحاكاة
  const lossFunction = (_params: number[]): number => {
    return currentLoss + (Math.random() * 0.1 - 0.05);
  };

  for (let epoch = 0; epoch < epochs; epoch++) {
    // حساب التدرجات
    const gradients = computeGradient(parameters, lossFunction);
    const gradNorm = Math.sqrt(
      gradients.reduce((sum, g) => sum + g * g, 0)
    );

    // تحديث المعاملات
    if (optimizer === 'adam') {
      for (let i = 0; i < parameters.length; i++) {
        m[i] = beta1 * m[i] + (1 - beta1) * gradients[i];
        v[i] = beta2 * v[i] + (1 - beta2) * gradients[i] * gradients[i];

        const mHat = m[i] / (1 - Math.pow(beta1, epoch + 1));
        const vHat = v[i] / (1 - Math.pow(beta2, epoch + 1));

        parameters[i] -= currentLR * mHat / (Math.sqrt(vHat) + epsilon);
      }
    } else {
      // SGD
      for (let i = 0; i < parameters.length; i++) {
        parameters[i] -= currentLR * gradients[i];
      }
    }

    // تحديث الدقة والفقدان
    const improvement = (99.5 - currentAccuracy) * (convergenceRate / 50);
    currentAccuracy += improvement + (Math.random() * 0.4 - 0.2);
    if (currentAccuracy > 99.9) currentAccuracy = 99.9;

    currentLoss = currentLoss * Math.exp(-convergenceRate / 20) + Math.random() * 0.05;
    if (currentLoss < 0.01) currentLoss = 0.01;

    // جدولة معدل التعلم (Cosine Annealing)
    currentLR = learningRate * 0.5 * (1 + Math.cos(Math.PI * epoch / epochs));

    const step: TrainingStep = {
      epoch: epoch + 1,
      accuracy: currentAccuracy,
      loss: currentLoss,
      gradientNorm: gradNorm,
      learningRate: currentLR,
    };

    history.push(step);
    onProgress?.(step);
  }

  return {
    finalAccuracy: currentAccuracy,
    finalLoss: currentLoss,
    history,
    totalParameters: totalParams,
    numLayers: numLayers,
  };
}

