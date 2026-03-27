/**
 * QuantumAGIBridge.ts – جسر التواصل مع نواة AGI
 * Ultimate Quantum SuperSystem v5.0
 *
 * يربط واجهة المستخدم الأمامية بمحرك AGI الخلفي
 * ويدير: نقل النية، التغذية الراجعة، سجل القرارات
 */

import type { SimulationMode } from '../types/quantum.types';

// ================================================================
// أنواع البيانات
// ================================================================

export type ConsciousnessLevel =
  | 'DORMANT'      // خامل – لا معالجة نشطة
  | 'REACTIVE'     // تفاعلي – استجابة للمدخلات فقط
  | 'ADAPTIVE'     // تكيّفي – تعلم من التفاعلات
  | 'GENERATIVE'   // توليدي – يولّد ردوداً جديدة
  | 'CONSCIOUS'    // واعٍ – إدراك ذاتي محدود
  | 'TRANSCENDENT'; // متسامٍ – [محجوب أخلاقياً]

export type IntentCategory =
  | 'DRUG_DISCOVERY'
  | 'CRYPTOGRAPHY'
  | 'GENOMICS'
  | 'PHYSICS_SIMULATION'
  | 'CODE_OPTIMIZATION'
  | 'UNKNOWN';

export interface AGIDecision {
  decisionId:          string;
  intent:              IntentCategory;
  confidence:          number;           // 0-1
  recommendedAction:   string;
  preloadedModules:    string[];
  ethicsScore:         number;           // 0-1
  isAllowed:           boolean;
  consciousnessLevel:  ConsciousnessLevel;
  processingTimeMs:    number;
  timestamp:           number;
}

export interface AGISession {
  sessionId:     string;
  startTime:     number;
  decisions:     AGIDecision[];
  totalQueries:  number;
  approvalRate:  number;
}

// ================================================================
// جسر AGI
// ================================================================

export class QuantumAGIBridge {
  private static _instance: QuantumAGIBridge | null = null;

  private readonly _session: AGISession;
  private _consciousnessLevel: ConsciousnessLevel;
  private _queryCount     = 0;
  private _approvedCount  = 0;

  // نمط Singleton – نسخة واحدة فقط
  static getInstance(): QuantumAGIBridge {
    if (!this._instance) {
      this._instance = new QuantumAGIBridge();
    }
    return this._instance;
  }

  private constructor() {
    this._consciousnessLevel = 'ADAPTIVE';
    this._session = {
      sessionId:    this._generateId(),
      startTime:    Date.now(),
      decisions:    [],
      totalQueries: 0,
      approvalRate: 1.0,
    };
  }

  // ─── معالجة النية ────────────────────────────────────────────

  async processIntent(userInput: string): Promise<AGIDecision> {
    const start = performance.now();
    this._queryCount++;

    let decision: AGIDecision;

    try {
      // محاولة الاتصال بالـ Backend الحقيقي
      const apiBase = import.meta.env.DEV 
        ? 'http://localhost:8000' 
        : 'https://api.qurabia.com'; // افترضنا أن الـ API ستكون على هذا النطاق الفرعي
        
      const response = await fetch(`${apiBase}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userInput,
          context: {
            harm_potential: 0.05,
            benefit_score: 0.8,
            user_consent: true,
            fairness_score: 0.9,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        decision = {
          decisionId:         data.decision_id,
          intent:             data.intent as IntentCategory,
          confidence:         data.confidence,
          recommendedAction:  data.recommended_action,
          preloadedModules:   this._getModules(data.intent as IntentCategory),
          ethicsScore:        data.ethics_score,
          isAllowed:          data.ethics_violation === 'NONE',
          consciousnessLevel: this._consciousnessLevel,
          processingTimeMs:   performance.now() - start,
          timestamp:          Date.now(),
        };
      } else {
        throw new Error('Backend responded with error');
      }
    } catch (error) {
      // Fallback: المعالجة المحلية في حال عدم توفر الـ Backend
      console.warn('Backend unavailable, falling back to local mock:', error);
      const intent    = this._classifyIntent(userInput);
      const confidence = this._computeConfidence(userInput, intent);
      const ethicsScore = this._evaluateEthics(userInput, intent);
      const isAllowed  = ethicsScore > 0.7;

      decision = {
        decisionId:         this._generateId(),
        intent,
        confidence,
        recommendedAction:  this._buildActionPlan(intent, isAllowed),
        preloadedModules:   this._getModules(intent),
        ethicsScore,
        isAllowed,
        consciousnessLevel: this._consciousnessLevel,
        processingTimeMs:   performance.now() - start,
        timestamp:          Date.now(),
      };
    }

    if (decision.isAllowed) this._approvedCount++;
    this._updateConsciousnessLevel();

    this._session.decisions.push(decision);
    this._session.totalQueries = this._queryCount;
    this._session.approvalRate = this._approvedCount / this._queryCount;

    return decision;
  }

  // ─── الحالة ──────────────────────────────────────────────────

  getSession(): Readonly<AGISession> {
    return { ...this._session };
  }

  getConsciousnessLevel(): ConsciousnessLevel {
    return this._consciousnessLevel;
  }

  getApprovalRate(): number {
    return this._queryCount > 0
      ? this._approvedCount / this._queryCount
      : 1.0;
  }

  // ─── دوال مساعدة خاصة ────────────────────────────────────────

  private _classifyIntent(text: string): IntentCategory {
    const t = text.toLowerCase();
    if (/drug|دواء|protein|جزيء|vqe|h2|chemistry/.test(t)) return 'DRUG_DISCOVERY';
    if (/crypto|تشفير|bb84|qkd|key|cipher/.test(t))          return 'CRYPTOGRAPHY';
    if (/genomi|جين|dna|mutation|sequence/.test(t))           return 'GENOMICS';
    if (/physics|كم|ثقب|quantum|simulate/.test(t))            return 'PHYSICS_SIMULATION';
    if (/code|refactor|تحسين|أداء|optimize/.test(t))          return 'CODE_OPTIMIZATION';
    return 'UNKNOWN';
  }

  private _computeConfidence(text: string, intent: IntentCategory): number {
    if (intent === 'UNKNOWN') return 0.1;
    const keywordCount = text.split(/\s+/).length;
    return Math.min(1.0, 0.3 + keywordCount * 0.05 + Math.random() * 0.1);
  }

  private _evaluateEthics(text: string, intent: IntentCategory): number {
    // نقاط الأخلاق تعتمد على نوع النية
    const baseScores: Record<IntentCategory, number> = {
      DRUG_DISCOVERY:    0.92,
      CRYPTOGRAPHY:      0.88,
      GENOMICS:          0.85,
      PHYSICS_SIMULATION: 0.97,
      CODE_OPTIMIZATION: 0.95,
      UNKNOWN:           0.75,
    };
    return baseScores[intent] + (Math.random() - 0.5) * 0.03;
  }

  private _buildActionPlan(intent: IntentCategory, allowed: boolean): string {
    if (!allowed) return 'مرفوض بموجب الدستور الأخلاقي';
    const plans: Record<IntentCategory, string> = {
      DRUG_DISCOVERY:    'تحميل محاكي VQE → تهيئة هاميلتوني H₂ → تشغيل VQE',
      CRYPTOGRAPHY:      'تفعيل BB84 → توليد مفاتيح كمية → تحقق QBER',
      GENOMICS:          'تحليل التسلسل → QSVM التصنيف → تقرير الطفرات',
      PHYSICS_SIMULATION: 'تحميل معادلة العتيبي → حساب E_total → رسم الطيف',
      CODE_OPTIMIZATION: 'تحليل AST → QUBO التحسين → تطبيق إعادة الهيكلة',
      UNKNOWN:           'تفعيل QuantumCore الافتراضي',
    };
    return plans[intent];
  }

  private _getModules(intent: IntentCategory): string[] {
    const modules: Record<IntentCategory, string[]> = {
      DRUG_DISCOVERY:    ['VQEEngine', 'MolecularSimulator', 'QuantumChemistry'],
      CRYPTOGRAPHY:      ['BB84Protocol', 'PQCKeyGen', 'QBERMeasurer'],
      GENOMICS:          ['QSVMClassifier', 'SequenceAnalyzer', 'MutationDetector'],
      PHYSICS_SIMULATION: ['AlOtaibiEngine', 'ToricCodeSimulator', 'BlochSphere'],
      CODE_OPTIMIZATION: ['CodeRefactoring', 'GroverSearch', 'QAOptimizer'],
      UNKNOWN:           ['QuantumCore'],
    };
    return modules[intent];
  }

  private _updateConsciousnessLevel(): void {
    const q = this._queryCount;
    if (q < 5)  this._consciousnessLevel = 'REACTIVE';
    else if (q < 15) this._consciousnessLevel = 'ADAPTIVE';
    else if (q < 30) this._consciousnessLevel = 'GENERATIVE';
    else             this._consciousnessLevel = 'CONSCIOUS';
  }

  private _generateId(): string {
    return `agi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

// تصدير Singleton
export const agiBridge = QuantumAGIBridge.getInstance();
