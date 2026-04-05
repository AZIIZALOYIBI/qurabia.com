/**
 * اختبارات التحسينات الجديدة — مستوحاة من مشاريع GitHub
 * يغطي: Grover المحسّن، QNN المتقدم، QEC المحسّن، بوابات statevector الجديدة
 */
import { describe, it, expect } from 'vitest';
import {
  GroverSimulator,
  groverChartData,
} from '../engine/GroverAlgorithm';
import {
  buildVariationalCircuit,
  countParameters,
  trainVariationalQNN,
} from '../engine/QuantumNeuralNetwork';
import { ToricCodeSimulator } from '../engine/TopologicalQEC';
import {
  createZeroState,
  createBasisState,
  applyGate,
  applyCNOT,
  applySWAP,
  applyCZ,
  applyToffoli,
  runCircuit,
  getProbabilities,
} from '../core/statevector';
import { GATE_H, GATE_X } from '../core/quantum-gates';
import {
  getRootsCount,
  getPatternsCount,
  getMorphologyStats,
} from '../engine/ArabicMorphology';
import { buildSemanticCircuit } from '../engine/QuantumSemanticCircuit';
import { analyzeSentence } from '../engine/ArabicMorphology';

// ═══════════════════════════════════════════════════════════════
// Grover المحسّن (مستوحى من QuantumKatas)
// ═══════════════════════════════════════════════════════════════

describe('GroverSimulator Enhanced', () => {
  it('runWithTracking يُنتج خطوات بالاحتمالات', () => {
    const sim = new GroverSimulator(16, 5);
    const result = sim.runWithTracking();

    expect(result.steps.length).toBeGreaterThan(1);
    expect(result.probability).toBeGreaterThan(0.5);
    expect(result.foundIndex).toBe(5);
    expect(result.speedup).toBeGreaterThan(1);

    // كل خطوة تحتوي بيانات صحيحة
    for (const step of result.steps) {
      expect(step.amplitudes.length).toBe(16);
      expect(step.probabilities.length).toBe(16);
      expect(step.targetProbability).toBeGreaterThanOrEqual(0);
      expect(step.targetProbability).toBeLessThanOrEqual(1);
    }
  });

  it('الأهداف المتعددة تعمل بشكل صحيح', () => {
    const sim = GroverSimulator.withMultipleTargets(16, [2, 5, 10]);
    const result = sim.runWithTracking();

    // الاحتمال الكلي للأهداف يجب أن يكون عالياً
    expect(result.probability).toBeGreaterThan(0.5);
    // التسريع الكمومي يجب أن يكون > 1
    expect(result.speedup).toBeGreaterThan(1);
  });

  it('عدد الخطوات الأمثل مع أهداف متعددة أقل', () => {
    const single = new GroverSimulator(64, 0);
    const multi = GroverSimulator.withMultipleTargets(64, [0, 1, 2, 3]);

    expect(multi.getOptimalSteps()).toBeLessThan(single.getOptimalSteps());
  });

  it('groverChartData يُنتج بيانات للرسم البياني', () => {
    const sim = new GroverSimulator(8, 3);
    const result = sim.runWithTracking();
    const chartData = groverChartData(result);

    expect(chartData.length).toBe(result.steps.length);
    for (const point of chartData) {
      expect(point.targetProbability + point.otherProbability).toBeCloseTo(1.0, 5);
    }
  });

  it('يرفض أهدافاً خارج النطاق', () => {
    expect(() => GroverSimulator.withMultipleTargets(8, [0, 10])).toThrow();
  });

  it('يرفض أهدافاً فارغة', () => {
    expect(() => GroverSimulator.withMultipleTargets(8, [])).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// QNN المتقدم (مستوحى من torchquantum)
// ═══════════════════════════════════════════════════════════════

describe('QuantumNeuralNetwork Enhanced', () => {
  it('buildVariationalCircuit ينشئ طبقات صحيحة', () => {
    const layers = buildVariationalCircuit(4, 3);

    // 3 طبقات × (RY + RZ + Entangling) + Measurement = 10
    expect(layers.length).toBe(10);

    // التحقق من أنواع الطبقات
    const types = layers.map(l => l.type);
    expect(types.filter(t => t === 'ry').length).toBe(3);
    expect(types.filter(t => t === 'rz').length).toBe(3);
    expect(types.filter(t => t === 'entangling').length).toBe(3);
    expect(types.filter(t => t === 'measurement').length).toBe(1);
  });

  it('countParameters يحسب العدد الصحيح', () => {
    const layers = buildVariationalCircuit(4, 2);
    const count = countParameters(layers);

    // 2 طبقات × (4 RY + 4 RZ) = 16 معامل
    expect(count).toBe(16);
  });

  it('trainVariationalQNN ينتج نتائج تدريب', () => {
    const result = trainVariationalQNN({
      epochs: 20,
      convergenceRate: 3.0,
      numQubits: 4,
      numLayers: 2,
      optimizer: 'adam',
      learningRate: 0.1,
    });

    expect(result.finalAccuracy).toBeGreaterThan(50);
    expect(result.finalLoss).toBeLessThan(2);
    expect(result.history.length).toBe(20);
    expect(result.totalParameters).toBe(16);
    expect(result.numLayers).toBe(2);

    // التحقق من بنية التاريخ
    for (const step of result.history) {
      expect(step.epoch).toBeGreaterThan(0);
      expect(step.accuracy).toBeGreaterThan(0);
      expect(step.loss).toBeGreaterThan(0);
      expect(step.gradientNorm).toBeGreaterThanOrEqual(0);
      expect(step.learningRate).toBeGreaterThan(0);
    }
  });

  it('SGD optimizer يعمل أيضاً', () => {
    const result = trainVariationalQNN({
      epochs: 10,
      convergenceRate: 2.5,
      numQubits: 2,
      numLayers: 1,
      optimizer: 'sgd',
      learningRate: 0.05,
    });

    expect(result.finalAccuracy).toBeGreaterThan(50);
    expect(result.history.length).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════
// QEC المحسّن (مستوحى من panqec)
// ═══════════════════════════════════════════════════════════════

describe('ToricCodeSimulator Enhanced', () => {
  it('detectSyndromes يكتشف المتلازمات', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 5, physicalErrorRate: 0.1 });
    sim.simulateErrorCorrectionCycle();
    const { syndromes, count } = sim.detectSyndromes();

    expect(syndromes.length).toBe(5);
    expect(syndromes[0].length).toBe(5);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('الدورة تُنتج أنواع أخطاء مختلفة', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 10, physicalErrorRate: 0.2 });
    const result = sim.simulateErrorCorrectionCycle();

    expect(result.xErrors).toBeGreaterThanOrEqual(0);
    expect(result.zErrors).toBeGreaterThanOrEqual(0);
    expect(result.yErrors).toBeGreaterThanOrEqual(0);
    expect(result.syndromeCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.logicalErrorRate).toBe('number');
  });

  it('getStats يُرجع إحصائيات تراكمية', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 4, physicalErrorRate: 0.05 });

    for (let i = 0; i < 5; i++) {
      sim.simulateErrorCorrectionCycle();
    }

    const stats = sim.getStats();
    expect(stats.totalCycles).toBe(5);
    expect(stats.totalErrorsDetected).toBeGreaterThanOrEqual(0);
    expect(stats.totalErrorsCorrected).toBeGreaterThanOrEqual(0);
    expect(stats.correctionRate).toBeGreaterThanOrEqual(0);
    expect(stats.correctionRate).toBeLessThanOrEqual(1);
  });

  it('getThreshold يُرجع 10.3%', () => {
    const sim = new ToricCodeSimulator({ latticeSize: 4, physicalErrorRate: 0.05 });
    expect(sim.getThreshold()).toBeCloseTo(0.103, 3);
  });

  it('isBelowThreshold يعمل بشكل صحيح', () => {
    const belowThreshold = new ToricCodeSimulator({ latticeSize: 4, physicalErrorRate: 0.05 });
    expect(belowThreshold.isBelowThreshold()).toBe(true);

    const aboveThreshold = new ToricCodeSimulator({ latticeSize: 4, physicalErrorRate: 0.15 });
    expect(aboveThreshold.isBelowThreshold()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// بوابات statevector الجديدة (مستوحاة من Quirk)
// ═══════════════════════════════════════════════════════════════

describe('StateVector Enhanced Gates', () => {
  describe('SWAP Gate', () => {
    it('SWAP(|01⟩) = |10⟩', () => {
      // |01⟩ = الكيوبت 0 = 1, الكيوبت 1 = 0
      let sv = createBasisState(2, 1); // |01⟩
      sv = applySWAP(sv, 0, 1);
      const probs = getProbabilities(sv);

      // يجب أن تكون |10⟩ = index 2
      expect(probs[2]).toBeCloseTo(1.0, 10);
    });

    it('SWAP(|10⟩) = |01⟩', () => {
      let sv = createBasisState(2, 2); // |10⟩
      sv = applySWAP(sv, 0, 1);
      const probs = getProbabilities(sv);

      expect(probs[1]).toBeCloseTo(1.0, 10);
    });

    it('SWAP(|00⟩) = |00⟩', () => {
      let sv = createZeroState(2);
      sv = applySWAP(sv, 0, 1);
      const probs = getProbabilities(sv);

      expect(probs[0]).toBeCloseTo(1.0, 10);
    });

    it('SWAP(|11⟩) = |11⟩', () => {
      let sv = createBasisState(2, 3); // |11⟩
      sv = applySWAP(sv, 0, 1);
      const probs = getProbabilities(sv);

      expect(probs[3]).toBeCloseTo(1.0, 10);
    });

    it('SWAP مع 3 كيوبتات', () => {
      let sv = createBasisState(3, 1); // |001⟩
      sv = applySWAP(sv, 0, 2);
      const probs = getProbabilities(sv);

      // SWAP(q0, q2): |001⟩ → |100⟩ = index 4
      expect(probs[4]).toBeCloseTo(1.0, 10);
    });

    it('يرفض نفس الكيوبت', () => {
      const sv = createZeroState(2);
      expect(() => applySWAP(sv, 0, 0)).toThrow();
    });
  });

  describe('CZ Gate', () => {
    it('CZ(|11⟩) = -|11⟩', () => {
      let sv = createBasisState(2, 3); // |11⟩
      sv = applyCZ(sv, 0, 1);

      // السعة عند |11⟩ يجب أن تكون -1
      expect(sv.amplitudes[3].real).toBeCloseTo(-1.0, 10);
    });

    it('CZ لا تؤثر على |00⟩, |01⟩, |10⟩', () => {
      for (const basis of [0, 1, 2]) {
        let sv = createBasisState(2, basis);
        sv = applyCZ(sv, 0, 1);
        const probs = getProbabilities(sv);
        expect(probs[basis]).toBeCloseTo(1.0, 10);
      }
    });
  });

  describe('Toffoli (CCX) Gate', () => {
    it('CCX(|110⟩) = |111⟩', () => {
      let sv = createBasisState(3, 6); // |110⟩
      sv = applyToffoli(sv, 1, 2, 0);
      const probs = getProbabilities(sv);

      // |111⟩ = index 7
      expect(probs[7]).toBeCloseTo(1.0, 10);
    });

    it('CCX لا تؤثر إذا أحد المتحكمين = 0', () => {
      let sv = createBasisState(3, 4); // |100⟩
      sv = applyToffoli(sv, 1, 2, 0);
      const probs = getProbabilities(sv);

      // يبقى |100⟩
      expect(probs[4]).toBeCloseTo(1.0, 10);
    });

    it('يرفض كيوبتات متطابقة', () => {
      const sv = createZeroState(3);
      expect(() => applyToffoli(sv, 0, 0, 1)).toThrow();
      expect(() => applyToffoli(sv, 0, 1, 0)).toThrow();
    });
  });

  describe('runCircuit with new gates', () => {
    it('SWAP في الدائرة', () => {
      const sv = runCircuit(2, [
        { gate: 'X', target: 0 },     // |01⟩
        { gate: 'SWAP', target: 1, control: 0 }, // → |10⟩
      ]);
      const probs = getProbabilities(sv);
      expect(probs[2]).toBeCloseTo(1.0, 10);
    });

    it('CZ في الدائرة', () => {
      const sv = runCircuit(2, [
        { gate: 'X', target: 0 },
        { gate: 'X', target: 1 },
        { gate: 'CZ', target: 1, control: 0 },
      ]);
      // |11⟩ يجب أن يكون بطور -1
      expect(sv.amplitudes[3].real).toBeCloseTo(-1.0, 10);
    });

    it('Toffoli في الدائرة', () => {
      const sv = runCircuit(3, [
        { gate: 'X', target: 1 },
        { gate: 'X', target: 2 },
        { gate: 'CCX', target: 0, control: 1, control2: 2 },
      ]);
      const probs = getProbabilities(sv);
      // |110⟩ → CCX → |111⟩ = index 7
      expect(probs[7]).toBeCloseTo(1.0, 10);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// ArabicMorphology المحسّن (مستوحى من pysarf)
// ═══════════════════════════════════════════════════════════════

describe('ArabicMorphology Enhanced', () => {
  it('قاعدة البيانات موسّعة لأكثر من 150 جذر', () => {
    expect(getRootsCount()).toBeGreaterThan(150);
  });

  it('الأوزان الصرفية موسّعة لأكثر من 30 وزن', () => {
    expect(getPatternsCount()).toBeGreaterThan(30);
  });

  it('getMorphologyStats تُرجع إحصائيات صحيحة', () => {
    const stats = getMorphologyStats();

    expect(stats.rootsCount).toBeGreaterThan(150);
    expect(stats.patternsCount).toBeGreaterThan(30);
    expect(stats.totalDerivatives).toBeGreaterThan(500);
    expect(Object.keys(stats.fieldDistribution).length).toBeGreaterThan(10);
  });

  it('الجذور الجديدة تعمل بشكل صحيح', () => {
    const analysis = analyzeSentence('الطائرة تحلق فوق المطار');
    const words = analysis.words.filter(w => w.confidence > 0);
    expect(words.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// QuantumSemanticCircuit المحسّن (مستوحى من lambeq)
// ═══════════════════════════════════════════════════════════════

describe('QuantumSemanticCircuit Enhanced', () => {
  it('الدائرة تحتوي على compositionalityScore', () => {
    const analysis = analyzeSentence('كتب العالم كتاباً في العلم');
    const circuit = buildSemanticCircuit(analysis);

    expect(circuit.compositionalityScore).toBeGreaterThanOrEqual(0);
    expect(circuit.compositionalityScore).toBeLessThanOrEqual(1);
    expect(circuit.syntacticStructure).toBeDefined();
  });

  it('جملة فارغة تُنتج درجة 0', () => {
    const analysis = analyzeSentence('');
    const circuit = buildSemanticCircuit(analysis);

    expect(circuit.compositionalityScore).toBe(0);
    expect(circuit.syntacticStructure).toBe('unknown');
  });

  it('الأنواع النحوية مكتشفة', () => {
    // جملة فعلية
    const verbal = analyzeSentence('كتب الطالب الدرس');
    const verbalCircuit = buildSemanticCircuit(verbal);
    expect(verbalCircuit.syntacticStructure).toBeDefined();

    // جملة اسمية
    const nominal = analyzeSentence('العلم نور');
    const nominalCircuit = buildSemanticCircuit(nominal);
    expect(nominalCircuit.syntacticStructure).toBeDefined();
  });
});
