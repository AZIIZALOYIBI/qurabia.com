import { describe, it, expect, beforeEach } from 'vitest';
import { EthicalGovernanceSystem, ethicsGuard, type EthicsContext } from '../ethics/EthicalGovernance';

// ─── evaluate ─────────────────────────────────────────────────────────────────

describe('EthicalGovernanceSystem.evaluate', () => {
  let gov: EthicalGovernanceSystem;

  beforeEach(() => {
    gov = new EthicalGovernanceSystem();
  });

  const goodCtx: EthicsContext = {
    harmPotential: 0.0,
    benefitScore: 0.9,
    userConsent: true,
    fairnessScore: 0.9,
    actionType: 'test-action',
  };

  it('approves action meeting all thresholds', () => {
    const result = gov.evaluate(goodCtx);
    expect(result.isViolation).toBe(false);
    expect(result.overallScore).toBeGreaterThan(0.8);
  });

  it('nonMaleficence = 1 - harmPotential', () => {
    const result = gov.evaluate({ ...goodCtx, harmPotential: 0.3 });
    expect(result.nonMaleficence).toBeCloseTo(0.7, 10);
  });

  it('rejects when harmPotential > 0.05 (non-maleficence < 0.95)', () => {
    const result = gov.evaluate({ ...goodCtx, harmPotential: 0.1 });
    expect(result.isViolation).toBe(true);
    expect(result.reason).toMatch(/رفض/);
  });

  it('rejects when userConsent=false (autonomy=0 < 0.90)', () => {
    const result = gov.evaluate({ ...goodCtx, userConsent: false });
    expect(result.isViolation).toBe(true);
    expect(result.reason).toMatch(/رفض/);
  });

  it('rejects when benefitScore < 0.80', () => {
    const result = gov.evaluate({ ...goodCtx, benefitScore: 0.5 });
    expect(result.isViolation).toBe(true);
    expect(result.reason).toMatch(/رفض/);
  });

  it('autonomy=1.0 when userConsent=true, 0.0 when false', () => {
    expect(gov.evaluate({ ...goodCtx, userConsent: true }).autonomy).toBe(1.0);
    expect(gov.evaluate({ ...goodCtx, userConsent: false }).autonomy).toBe(0.0);
  });

  it('justice = fairnessScore', () => {
    const result = gov.evaluate({ ...goodCtx, fairnessScore: 0.75 });
    expect(result.justice).toBeCloseTo(0.75, 10);
  });

  it('overallScore formula: (2·NM + 1·BN + 1.5·AU + 1·JU) / 5.5', () => {
    const nm = 1.0, bn = 0.9, au = 1.0, ju = 0.9;
    const expected = (2 * nm + 1 * bn + 1.5 * au + 1 * ju) / 5.5;
    const result = gov.evaluate(goodCtx);
    expect(result.overallScore).toBeCloseTo(expected, 5);
  });

  it('non-maleficence violation takes priority over autonomy', () => {
    // Both NM violated and no consent
    const result = gov.evaluate({ ...goodCtx, harmPotential: 0.99, userConsent: false });
    expect(result.isViolation).toBe(true);
    expect(result.reason).toMatch(/ضرر/); // NM violation message
  });

  it('returns EthicsState structure', () => {
    const result = gov.evaluate(goodCtx);
    expect(result).toHaveProperty('nonMaleficence');
    expect(result).toHaveProperty('beneficence');
    expect(result).toHaveProperty('autonomy');
    expect(result).toHaveProperty('justice');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('isViolation');
    expect(result).toHaveProperty('reason');
  });
});

// ─── getAuditLog ──────────────────────────────────────────────────────────────

describe('EthicalGovernanceSystem.getAuditLog', () => {
  it('initially empty', () => {
    const gov = new EthicalGovernanceSystem();
    expect(gov.getAuditLog()).toHaveLength(0);
  });

  it('records each evaluation', () => {
    const gov = new EthicalGovernanceSystem();
    const ctx: EthicsContext = {
      harmPotential: 0, benefitScore: 0.9, userConsent: true,
      fairnessScore: 0.9, actionType: 'a1',
    };
    gov.evaluate(ctx);
    gov.evaluate({ ...ctx, actionType: 'a2' });
    expect(gov.getAuditLog()).toHaveLength(2);
  });

  it('returns at most 20 entries', () => {
    const gov = new EthicalGovernanceSystem();
    const ctx: EthicsContext = {
      harmPotential: 0, benefitScore: 0.9, userConsent: true,
      fairnessScore: 0.9, actionType: 'x',
    };
    for (let i = 0; i < 25; i++) gov.evaluate(ctx);
    expect(gov.getAuditLog().length).toBeLessThanOrEqual(20);
  });

  it('each entry has required fields', () => {
    const gov = new EthicalGovernanceSystem();
    gov.evaluate({ harmPotential: 0, benefitScore: 0.9, userConsent: true, fairnessScore: 0.9, actionType: 'x' });
    const entry = gov.getAuditLog()[0];
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('action');
    expect(entry).toHaveProperty('score');
    expect(entry).toHaveProperty('allowed');
    expect(entry).toHaveProperty('reason');
  });

  it('records the actionType in the log', () => {
    const gov = new EthicalGovernanceSystem();
    gov.evaluate({ harmPotential: 0, benefitScore: 0.9, userConsent: true, fairnessScore: 0.9, actionType: 'drug-discovery' });
    expect(gov.getAuditLog()[0].action).toBe('drug-discovery');
  });
});

// ─── getApprovalRate ──────────────────────────────────────────────────────────

describe('EthicalGovernanceSystem.getApprovalRate', () => {
  it('returns 1 when no evaluations', () => {
    const gov = new EthicalGovernanceSystem();
    expect(gov.getApprovalRate()).toBe(1);
  });

  it('100% approval rate when all pass', () => {
    const gov = new EthicalGovernanceSystem();
    const ctx: EthicsContext = {
      harmPotential: 0, benefitScore: 0.9, userConsent: true,
      fairnessScore: 0.9, actionType: 'ok',
    };
    gov.evaluate(ctx);
    gov.evaluate(ctx);
    expect(gov.getApprovalRate()).toBeCloseTo(1.0, 5);
  });

  it('0% approval rate when all fail', () => {
    const gov = new EthicalGovernanceSystem();
    const ctx: EthicsContext = {
      harmPotential: 1.0, benefitScore: 0, userConsent: false,
      fairnessScore: 0, actionType: 'harm',
    };
    gov.evaluate(ctx);
    gov.evaluate(ctx);
    expect(gov.getApprovalRate()).toBeCloseTo(0, 5);
  });

  it('50% when half approved', () => {
    const gov = new EthicalGovernanceSystem();
    gov.evaluate({ harmPotential: 0, benefitScore: 0.9, userConsent: true, fairnessScore: 0.9, actionType: 'ok' });
    gov.evaluate({ harmPotential: 1.0, benefitScore: 0, userConsent: false, fairnessScore: 0, actionType: 'bad' });
    expect(gov.getApprovalRate()).toBeCloseTo(0.5, 5);
  });
});

// ─── Singleton ────────────────────────────────────────────────────────────────

describe('ethicsGuard singleton', () => {
  it('is an EthicalGovernanceSystem instance', () => {
    expect(ethicsGuard).toBeInstanceOf(EthicalGovernanceSystem);
  });
});
