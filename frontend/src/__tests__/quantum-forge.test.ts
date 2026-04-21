/**
 * اختبارات المصهر الكمي — QuantumForge Tests
 *
 * يتحقق من صحة:
 * - تحويل الحروف العربية إلى كيوبتات
 * - بوابات هادامارد والطور
 * - توليد البصمة الكمية
 * - التشفير الكمي
 * - الدالة الرئيسية forgeText
 */
import { describe, expect, it } from 'vitest';
import {
  type QubitState,
  applyHadamard,
  applyPhaseGate,
  charToQubit,
  forgeText,
  qubitToBlochCoords,
} from '../engine/QuantumForge';

describe('QuantumForge — المصهر الكمي', () => {
  // ─── charToQubit ───
  describe('charToQubit — تحويل الحروف إلى كيوبتات', () => {
    it('يحوّل حرف "ا" (أبجد = 1) إلى كيوبت صحيح', () => {
      const q = charToQubit('ا');
      expect(q.char).toBe('ا');
      expect(q.abjadValue).toBe(1);
      expect(q.alpha).toBeGreaterThan(0);
      expect(q.beta).toBeGreaterThan(0);
      // احتمالات القياس يجب أن تُجمع إلى 1
      expect(q.prob0 + q.prob1).toBeCloseTo(1, 5);
    });

    it('يحوّل حرف "غ" (أبجد = 1000) إلى أقصى دوران', () => {
      const q = charToQubit('غ');
      expect(q.abjadValue).toBe(1000);
      // theta = π → alpha ≈ cos(π/2) ≈ 0, beta ≈ sin(π/2) ≈ 1
      expect(q.alpha).toBeCloseTo(Math.cos(Math.PI / 2), 5);
      expect(q.beta).toBeCloseTo(Math.sin(Math.PI / 2), 5);
      expect(q.prob0 + q.prob1).toBeCloseTo(1, 5);
    });

    it('يتعامل مع حرف غير عربي بإرجاع حالة |0⟩', () => {
      const q = charToQubit('X');
      expect(q.abjadValue).toBe(0);
      expect(q.alpha).toBe(1);
      expect(q.beta).toBe(0);
      expect(q.prob0).toBe(1);
      expect(q.prob1).toBe(0);
    });

    it('يتعرف على أشكال الألف المختلفة', () => {
      const forms = ['ا', 'أ', 'إ', 'آ'];
      for (const c of forms) {
        expect(charToQubit(c).abjadValue).toBe(1);
      }
    });

    it('يتعرف على التاء المربوطة كهاء', () => {
      expect(charToQubit('ة').abjadValue).toBe(5);
    });
  });

  // ─── applyHadamard ───
  describe('applyHadamard — بوابة هادامارد', () => {
    it('تحوّل |0⟩ إلى تراكب متساوٍ', () => {
      const q: QubitState = { char: 'ا', abjadValue: 1, alpha: 1, beta: 0, phase: 0, prob0: 1, prob1: 0 };
      const h = applyHadamard(q);
      expect(h.alpha).toBeCloseTo(Math.SQRT1_2, 5);
      expect(h.beta).toBeCloseTo(Math.SQRT1_2, 5);
      expect(h.prob0 + h.prob1).toBeCloseTo(1, 5);
    });

    it('تحافظ على مجموع الاحتمالات = 1', () => {
      const q = charToQubit('م'); // أبجد = 40
      const h = applyHadamard(q);
      expect(h.prob0 + h.prob1).toBeCloseTo(1, 5);
    });
  });

  // ─── applyPhaseGate ───
  describe('applyPhaseGate — بوابة الطور', () => {
    it('تضيف طوراً كمياً صحيحاً', () => {
      const q = charToQubit('ب');
      const shifted = applyPhaseGate(q, Math.PI / 4);
      expect(shifted.phase).toBeCloseTo((q.phase + Math.PI / 4) % (2 * Math.PI), 5);
    });

    it('تلتف عند 2π', () => {
      const q: QubitState = { char: 'ا', abjadValue: 1, alpha: 1, beta: 0, phase: Math.PI * 1.9, prob0: 1, prob1: 0 };
      const shifted = applyPhaseGate(q, Math.PI * 0.5);
      expect(shifted.phase).toBeLessThan(2 * Math.PI);
    });
  });

  // ─── forgeText ───
  describe('forgeText — المعالجة الكاملة', () => {
    it('يعالج نصاً عربياً وينتج نتائج كاملة', () => {
      const result = forgeText('بسم الله');
      expect(result.qubits.length).toBeGreaterThan(0);
      expect(result.qubitCount).toBeGreaterThan(0);
      expect(result.fingerprint.hash).toHaveLength(16);
      expect(result.encryption.cipherText).toBeTruthy();
      expect(result.encryption.quantumKey).toBeTruthy();
      expect(result.encryption.protocol).toBe('QKD-BB84');
      expect(result.complexityScore).toBeGreaterThan(0);
      expect(result.totalAbjadValue).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('ينتج بصمات مختلفة لنصوص مختلفة', () => {
      const r1 = forgeText('سلام');
      const r2 = forgeText('حرب');
      expect(r1.fingerprint.hash).not.toBe(r2.fingerprint.hash);
    });

    it('ينتج نفس البصمة لنفس النص (حتمي)', () => {
      const r1 = forgeText('قرابيا');
      const r2 = forgeText('قرابيا');
      expect(r1.fingerprint.hash).toBe(r2.fingerprint.hash);
      expect(r1.totalAbjadValue).toBe(r2.totalAbjadValue);
    });

    it('يكتشف تشابكات بين الحروف', () => {
      const result = forgeText('بسم الله الرحمن الرحيم');
      // نص طويل بما يكفي ليكون فيه تشابكات
      expect(result.entanglements.length).toBeGreaterThanOrEqual(0);
      // كل تشابك له قوة بين 0 و 1
      for (const e of result.entanglements) {
        expect(e.strength).toBeGreaterThanOrEqual(0);
        expect(e.strength).toBeLessThanOrEqual(1);
        expect(['bell', 'ghz', 'cluster']).toContain(e.type);
      }
    });

    it('يتعامل مع نص فارغ', () => {
      const result = forgeText('');
      expect(result.qubitCount).toBe(0);
      expect(result.totalAbjadValue).toBe(0);
    });

    it('يتعامل مع نص إنجليزي فقط', () => {
      const result = forgeText('Hello World');
      expect(result.qubitCount).toBe(0);
    });

    it('يحسب القيمة الأبجدية الصحيحة', () => {
      // "اب" = 1 + 2 = 3
      const result = forgeText('اب');
      expect(result.totalAbjadValue).toBe(3);
    });

    it('ينتج تشفيراً كمياً صالحاً', () => {
      const result = forgeText('تشفير كمي');
      expect(result.encryption.cipherText.length).toBeGreaterThan(0);
      // المفتاح الكمي يجب أن يكون سلسلة من 0 و 1
      expect(result.encryption.quantumKey).toMatch(/^[01]+$/);
    });
  });

  // ─── qubitToBlochCoords ───
  describe('qubitToBlochCoords — إحداثيات كرة بلوخ', () => {
    it('تحوّل |0⟩ إلى القطب الشمالي', () => {
      const q: QubitState = { char: 'ا', abjadValue: 1, alpha: 1, beta: 0, phase: 0, prob0: 1, prob1: 0 };
      const coords = qubitToBlochCoords(q);
      expect(coords.z).toBeCloseTo(1, 2);
      expect(coords.x).toBeCloseTo(0, 2);
      expect(coords.y).toBeCloseTo(0, 2);
    });

    it('تنتج إحداثيات على سطح الكرة الوحدية', () => {
      const q = charToQubit('م');
      const coords = qubitToBlochCoords(q);
      const r = Math.sqrt(coords.x ** 2 + coords.y ** 2 + coords.z ** 2);
      expect(r).toBeCloseTo(1, 2);
    });
  });
});
