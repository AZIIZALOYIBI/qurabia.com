/**
 * اختبارات محرك التحليل الصرفي الكمومي العربي
 */
import { describe, expect, it } from 'vitest';
import {
  SEMANTIC_FIELD_NAMES,
  analyzeSentence,
  analyzeWord,
  getAllRoots,
  normalizeArabic,
} from '../engine/ArabicMorphology';

describe('ArabicMorphology — التحليل الصرفي', () => {
  // ─── normalizeArabic ───
  describe('normalizeArabic — تطبيع النص', () => {
    it('يزيل التشكيل', () => {
      expect(normalizeArabic('كِتَابٌ')).toBe('كتاب');
    });

    it('يوحّد أشكال الألف', () => {
      expect(normalizeArabic('أحمد')).toBe('احمد');
      expect(normalizeArabic('إسلام')).toBe('اسلام');
      expect(normalizeArabic('آمن')).toBe('امن');
    });

    it('يوحّد الياء', () => {
      expect(normalizeArabic('مصطفى')).toBe('مصطفي');
    });

    it('يزيل التطويل', () => {
      expect(normalizeArabic('كتـــاب')).toBe('كتاب');
    });
  });

  // ─── analyzeWord ───
  describe('analyzeWord — تحليل كلمة واحدة', () => {
    it('يحلّل "كتاب" ويستخرج الجذر ك-ت-ب', () => {
      const result = analyzeWord('كتاب');
      expect(result.root).toContain('كتب');
      expect(result.rootLetters[0]).toBe('ك');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.semanticField).toBe('knowledge');
    });

    it('يحلّل "مكتبة" ويستخرج الجذر ك-ت-ب', () => {
      const result = analyzeWord('مكتبة');
      expect(result.root).toContain('كتب');
      expect(result.semanticField).toBe('knowledge');
    });

    it('يحلّل "عالم" ويستخرج الجذر ع-ل-م', () => {
      const result = analyzeWord('عالم');
      expect(result.root).toContain('علم');
      expect(result.semanticField).toBe('knowledge');
      expect(result.superpositionStates.length).toBeGreaterThan(1);
    });

    it('يكتشف التعريف بأل', () => {
      const definite = analyzeWord('العلم');
      expect(definite.isDefinite).toBe(true);
      const indefinite = analyzeWord('علم');
      expect(indefinite.isDefinite).toBe(false);
    });

    it('يتعرف على الحروف/الأدوات', () => {
      const result = analyzeWord('في');
      expect(result.wordType).toBe('particle');
    });

    it('يتعامل مع نص فارغ', () => {
      const result = analyzeWord('');
      expect(result.confidence).toBe(0);
    });

    it('يتعامل مع نص إنجليزي', () => {
      const result = analyzeWord('Hello');
      expect(result.confidence).toBe(0);
      expect(result.semanticField).toBe('unknown');
    });

    it('يحلّل كلمات من حقول دلالية مختلفة', () => {
      expect(analyzeWord('نور').semanticField).toBe('nature');
      expect(analyzeWord('حكمة').semanticField).toBe('society');
      expect(analyzeWord('قلب').semanticField).toBe('body');
    });

    it('يُرجع مشتقات (حالات التراكب) لجذور معروفة', () => {
      const result = analyzeWord('كتاب');
      expect(result.superpositionStates.length).toBeGreaterThan(3);
      expect(result.superpositionStates).toContain('كتاب');
    });
  });

  // ─── analyzeSentence ───
  describe('analyzeSentence — تحليل جملة', () => {
    it('يحلّل جملة عربية ويستخرج جذور متعددة', () => {
      const result = analyzeSentence('العلم نور');
      expect(result.words.length).toBeGreaterThan(0);
      expect(result.uniqueRoots).toBeGreaterThan(0);
      expect(result.semanticFields.length).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('يحسب التماسك الدلالي', () => {
      // جملة من حقل واحد (أكثر تماسكاً)
      const coherent = analyzeSentence('كتاب علم دراسة');
      // جملة من حقول متعددة (أقل تماسكاً)
      const _diverse = analyzeSentence('كتاب حرب نور فرح');
      // التماسك يجب أن يكون رقماً بين 0 و 1
      expect(coherent.semanticCoherence).toBeGreaterThanOrEqual(0);
      expect(coherent.semanticCoherence).toBeLessThanOrEqual(1);
    });

    it('يتعامل مع نص فارغ', () => {
      const result = analyzeSentence('');
      expect(result.words.length).toBe(0);
      expect(result.uniqueRoots).toBe(0);
    });

    it('يتعامل مع جمل طويلة', () => {
      const result = analyzeSentence('بسم الله الرحمن الرحيم الحمد لله رب العالمين');
      expect(result.words.length).toBeGreaterThan(5);
    });
  });

  // ─── getAllRoots ───
  describe('getAllRoots — قاعدة البيانات', () => {
    it('يُرجع قائمة جذور غير فارغة', () => {
      const roots = getAllRoots();
      expect(roots.length).toBeGreaterThan(50);
    });

    it('كل جذر له معنى وحقل دلالي', () => {
      const roots = getAllRoots();
      for (const r of roots) {
        expect(r.meaning.length).toBeGreaterThan(0);
        expect(r.field).toBeDefined();
        expect(r.derivativeCount).toBeGreaterThan(0);
      }
    });
  });

  // ─── SEMANTIC_FIELD_NAMES ───
  describe('SEMANTIC_FIELD_NAMES — أسماء الحقول', () => {
    it('كل حقل له اسم عربي', () => {
      const fields: string[] = [
        'knowledge',
        'creation',
        'movement',
        'speech',
        'emotion',
        'nature',
        'body',
        'society',
        'religion',
        'commerce',
        'warfare',
        'thought',
        'perception',
        'existence',
        'unknown',
      ];
      for (const f of fields) {
        expect(SEMANTIC_FIELD_NAMES[f as keyof typeof SEMANTIC_FIELD_NAMES]).toBeDefined();
        expect(SEMANTIC_FIELD_NAMES[f as keyof typeof SEMANTIC_FIELD_NAMES].length).toBeGreaterThan(0);
      }
    });
  });
});
