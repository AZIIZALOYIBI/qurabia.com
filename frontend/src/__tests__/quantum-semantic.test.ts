/**
 * اختبارات محلل القرارات الكمومي وبناء الدوائر الكمومية الدلالية
 */
import { describe, it, expect } from 'vitest';
import { analyzeDecision, extractOptions } from '../engine/GroverDecision';
import { analyzeSentence } from '../engine/ArabicMorphology';
import { buildSemanticCircuit, circuitToASCII } from '../engine/QuantumSemanticCircuit';

describe('GroverDecision — محلل القرارات الكمومي', () => {
  describe('extractOptions — استخراج الخيارات', () => {
    it('يستخرج خيارين من سؤال بـ "أم"', () => {
      const options = extractOptions('هل أفتح مطعم أم متجر إلكتروني؟');
      expect(options.length).toBe(2);
    });

    it('يستخرج خيارين من سؤال بـ "أو"', () => {
      const options = extractOptions('البرمجة أو التصميم');
      expect(options.length).toBe(2);
    });

    it('يتعامل مع خيار واحد', () => {
      const options = extractOptions('البرمجة');
      expect(options.length).toBeGreaterThanOrEqual(1);
    });

    it('ينظف علامات الاستفهام', () => {
      const options = extractOptions('هل أختار هذا أو ذاك؟');
      expect(options.length).toBe(2);
      for (const opt of options) {
        expect(opt).not.toContain('؟');
      }
    });
  });

  describe('analyzeDecision — التحليل الكامل', () => {
    it('يحلّل قرار مع خيارين', () => {
      const result = analyzeDecision('هل أفتح مشروع مطعم أم متجر إلكتروني؟');
      expect(result.options.length).toBe(2);
      expect(result.recommendedIndex).toBeGreaterThanOrEqual(0);
      expect(result.recommendedIndex).toBeLessThan(result.options.length);
      expect(result.recommendation.length).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('مجموع الاحتمالات المعززة ≈ 1', () => {
      const result = analyzeDecision('الذكاء الاصطناعي أو الحوسبة الكمية');
      const totalProb = result.options.reduce((s, o) => s + o.amplifiedProbability, 0);
      expect(totalProb).toBeCloseTo(1, 1);
    });

    it('يُطبّق تكرارات Grover', () => {
      const result = analyzeDecision('مطعم أم متجر أم شركة تقنية');
      expect(result.groverIterations).toBeGreaterThan(0);
      expect(result.searchSpaceSize).toBeGreaterThan(0);
    });

    it('يحسب درجة الوضوح', () => {
      const result = analyzeDecision('نجاح أم فشل');
      expect(result.decisionClarity).toBeGreaterThanOrEqual(0);
      expect(result.decisionClarity).toBeLessThanOrEqual(1);
    });

    it('كل خيار له درجات تقييم صحيحة', () => {
      const result = analyzeDecision('البرمجة أو التصميم أو التسويق');
      for (const opt of result.options) {
        expect(opt.semanticWeight).toBeGreaterThanOrEqual(0);
        expect(opt.semanticWeight).toBeLessThanOrEqual(1);
        expect(opt.positivityScore).toBeGreaterThanOrEqual(0);
        expect(opt.positivityScore).toBeLessThanOrEqual(1);
        expect(opt.practicalityScore).toBeGreaterThanOrEqual(0);
        expect(opt.practicalityScore).toBeLessThanOrEqual(1);
      }
    });

    it('يتعامل مع نص بدون خيارات واضحة', () => {
      const result = analyzeDecision('ماذا أفعل بحياتي');
      expect(result.options.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendation.length).toBeGreaterThan(0);
    });
  });
});

describe('QuantumSemanticCircuit — الدوائر الكمومية الدلالية', () => {
  describe('buildSemanticCircuit — بناء الدائرة', () => {
    it('يبني دائرة من جملة عربية', () => {
      const analysis = analyzeSentence('العلم نور والجهل ظلام');
      const circuit = buildSemanticCircuit(analysis);
      expect(circuit.qubits.length).toBeGreaterThan(0);
      expect(circuit.gates.length).toBeGreaterThan(0);
      expect(circuit.totalSteps).toBeGreaterThan(0);
    });

    it('يُنشئ بوابات Hadamard للكلمات المنكّرة', () => {
      const analysis = analyzeSentence('علم نور');
      const circuit = buildSemanticCircuit(analysis);
      const hGates = circuit.gates.filter(g => g.type === 'H');
      // الكلمات غير المعرّفة يجب أن تحصل على بوابة H
      expect(hGates.length).toBeGreaterThan(0);
    });

    it('يُنشئ بوابات Phase للإعراب', () => {
      const analysis = analyzeSentence('كتاب عالم');
      const circuit = buildSemanticCircuit(analysis);
      const phaseGates = circuit.gates.filter(g => g.type === 'Phase');
      expect(phaseGates.length).toBeGreaterThan(0);
    });

    it('يكتشف التشابك بين كلمات من نفس الحقل', () => {
      const analysis = analyzeSentence('كتاب علم دراسة'); // كلها من حقل المعرفة
      const circuit = buildSemanticCircuit(analysis);
      const cnotGates = circuit.gates.filter(g => g.type === 'CNOT');
      expect(cnotGates.length).toBeGreaterThan(0);
    });

    it('يحسب احتمالات نهائية صحيحة', () => {
      const analysis = analyzeSentence('العلم نور');
      const circuit = buildSemanticCircuit(analysis);
      for (const q of circuit.qubits) {
        expect(q.finalProb0 + q.finalProb1).toBeCloseTo(1, 1);
      }
    });

    it('كل بوابة لها شرح لغوي', () => {
      const analysis = analyzeSentence('العلم نور');
      const circuit = buildSemanticCircuit(analysis);
      for (const gate of circuit.gates) {
        expect(gate.linguisticMeaning.length).toBeGreaterThan(0);
        expect(gate.label.length).toBeGreaterThan(0);
      }
    });

    it('يتعامل مع نص فارغ', () => {
      const analysis = analyzeSentence('');
      const circuit = buildSemanticCircuit(analysis);
      expect(circuit.qubits.length).toBe(0);
      expect(circuit.gates.length).toBe(0);
    });
  });

  describe('circuitToASCII — عرض نصي', () => {
    it('يولّد تمثيل ASCII للدائرة', () => {
      const analysis = analyzeSentence('العلم نور');
      const circuit = buildSemanticCircuit(analysis);
      const ascii = circuitToASCII(circuit);
      expect(ascii.length).toBeGreaterThan(0);
      expect(ascii).toContain('q0');
    });

    it('يتعامل مع دائرة فارغة', () => {
      const analysis = analyzeSentence('');
      const circuit = buildSemanticCircuit(analysis);
      const ascii = circuitToASCII(circuit);
      expect(ascii).toContain('فارغة');
    });
  });
});
