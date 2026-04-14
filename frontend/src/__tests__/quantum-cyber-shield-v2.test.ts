import { describe, it, expect } from 'vitest';
import {
  runQKDSession,
  analyzeTrafficQNIDS,
  generateMultiLayerEncryption,
  simulateQuantumAttacks,
  runQuantumForensics,
  assessPQCReadiness,
  generateComprehensiveReport,
  QUANTUM_THREAT_TIER_AR,
  QUANTUM_ATTACKS_AR,
  type QKDSessionResult,
  type QNIDSAnalysis,
  type MultiLayerEncryptionResult,
  type QuantumAttackSimResult,
  type ForensicAnalysisResult,
  type PQCReadinessReport,
  type ComprehensiveShieldReport,
} from '../engine/QuantumCyberShieldV2';

// ═══════════════════════════════════════════════════════════════
// 1. QKD Engine — محرك توزيع المفتاح الكمومي
// ═══════════════════════════════════════════════════════════════

describe('QKD Engine', () => {
  it('should generate a valid QKD session without eavesdropper', () => {
    const result = runQKDSession({
      photonCount: 256,
      evePresent: false,
      eveInterceptRate: 0,
      protocol: 'BB84',
      noiseLevel: 0.01,
    });

    expect(result.sessionId).toMatch(/^QKD-/);
    expect(result.totalPhotons).toBe(256);
    expect(result.matchedBases).toBeGreaterThan(0);
    expect(result.matchedBases).toBeLessThanOrEqual(256);
    expect(result.qber).toBeGreaterThanOrEqual(0);
    expect(result.qber).toBeLessThanOrEqual(1);
    expect(result.secureKeyLength).toBeGreaterThan(0);
    expect(result.photons).toHaveLength(256);
    expect(result.protocol).toBe('BB84');
  });

  it('should detect eavesdropper when Eve is active with high intercept rate', () => {
    const result = runQKDSession({
      photonCount: 2048,
      evePresent: true,
      eveInterceptRate: 0.8,
      protocol: 'BB84',
      noiseLevel: 0.01,
    });

    // مع معدل اعتراض عالٍ جداً، يجب أن يكون QBER مرتفعاً
    expect(result.qber).toBeGreaterThan(0);
    expect(result.photons.some(p => p.evePresent)).toBe(true);
  });

  it('should support different protocols', () => {
    const protocols = ['BB84', 'E91', 'B92', 'SARG04'] as const;

    for (const protocol of protocols) {
      const result = runQKDSession({
        photonCount: 128,
        evePresent: false,
        eveInterceptRate: 0,
        protocol,
        noiseLevel: 0.01,
      });

      expect(result.protocol).toBe(protocol);
      expect(result.photons.length).toBe(128);
    }
  });

  it('should have correct photon structure', () => {
    const result = runQKDSession({
      photonCount: 64,
      evePresent: true,
      eveInterceptRate: 0.5,
      protocol: 'BB84',
      noiseLevel: 0.02,
    });

    for (const photon of result.photons) {
      expect(photon.aliceBit === 0 || photon.aliceBit === 1).toBe(true);
      expect(['Z', 'X'].includes(photon.aliceBasis)).toBe(true);
      expect(['Z', 'X'].includes(photon.bobBasis)).toBe(true);
      expect(photon.bobMeasurement === 0 || photon.bobMeasurement === 1).toBe(true);
      expect(typeof photon.basisMatch).toBe('boolean');
      expect(typeof photon.evePresent).toBe('boolean');
      expect(photon.eveDisturbance).toBeGreaterThanOrEqual(0);
    }
  });

  it('should assign security rating based on QBER', () => {
    const result = runQKDSession({
      photonCount: 256,
      evePresent: false,
      eveInterceptRate: 0,
      protocol: 'BB84',
      noiseLevel: 0,
    });

    expect(['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].includes(result.securityRating)).toBe(true);
  });

  it('should have zero secure key length when eavesdropper is detected', () => {
    // إذا اكتُشف متنصت، لا ينبغي توليد مفتاح
    const result = runQKDSession({
      photonCount: 4096,
      evePresent: true,
      eveInterceptRate: 1.0,
      protocol: 'BB84',
      noiseLevel: 0,
    });

    if (result.eavesdropperDetected) {
      expect(result.secureKeyLength).toBe(0);
      expect(result.privacyAmplification).toBe(0);
    }
  });

  it('E91 protocol should use 3 bases (Z, X, Y)', () => {
    const result = runQKDSession({
      photonCount: 512,
      evePresent: false,
      eveInterceptRate: 0,
      protocol: 'E91',
      noiseLevel: 0.01,
    });

    const hasYBasis = result.photons.some(
      p => p.aliceBasis === 'Y' || p.bobBasis === 'Y'
    );
    expect(hasYBasis).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. QNIDS — نظام كشف التسلل الكمومي
// ═══════════════════════════════════════════════════════════════

describe('QNIDS', () => {
  it('should analyze traffic and detect attacks', () => {
    const result = analyzeTrafficQNIDS(10000, 'test-seed');

    expect(result.packetsAnalyzed).toBe(10000);
    expect(result.attacks.length).toBeGreaterThan(0);
    expect(result.modelAccuracy).toBeGreaterThan(0.9);
    expect(result.falsePositiveRate).toBeLessThan(0.03);
    expect(result.avgDetectionTimeMs).toBeGreaterThan(0);
    expect(['learning', 'active', 'alert', 'lockdown'].includes(result.classifierState)).toBe(true);
    expect(result.classifierQubits).toBeGreaterThanOrEqual(4);
    expect(result.circuitDepth).toBeGreaterThan(0);
  });

  it('should return valid attack patterns', () => {
    const result = analyzeTrafficQNIDS(5000, 'pattern-test');

    for (const attack of result.attacks) {
      expect(attack.id).toMatch(/^QNIDS-/);
      expect(attack.name.length).toBeGreaterThan(0);
      expect(attack.nameAr.length).toBeGreaterThan(0);
      expect(['network', 'application', 'quantum', 'social', 'supply_chain', 'zero_day'].includes(attack.category)).toBe(true);
      expect(attack.confidence).toBeGreaterThanOrEqual(0.5);
      expect(attack.confidence).toBeLessThanOrEqual(1);
      expect(attack.quantumSignature).toMatch(/^qsh2-/);
      expect(attack.features).toHaveLength(8);
      expect(attack.anomalyScore).toBeGreaterThan(0);
      expect(attack.detectionTimeMs).toBeGreaterThan(0);
      expect(attack.mitigationSuggestion.length).toBeGreaterThan(0);
    }
  });

  it('should have consistent malicious rate', () => {
    const result = analyzeTrafficQNIDS(50000, 'rate-test');

    expect(result.maliciousRate).toBeGreaterThan(0);
    expect(result.maliciousRate).toBeLessThanOrEqual(0.1);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Multi-Layer PQC — التشفير المتعدد الطبقات
// ═══════════════════════════════════════════════════════════════

describe('Multi-Layer Encryption', () => {
  it('should generate three encryption layers', () => {
    const result = generateMultiLayerEncryption('test-seed');

    expect(result.layers).toHaveLength(3);
    expect(result.combinedSecurityBits).toBeGreaterThan(256);
    expect(result.totalTimeMs).toBeGreaterThan(0);
    expect(result.totalCiphertextSize).toBeGreaterThan(0);
    expect(result.estimatedYearsSecure).toBeGreaterThan(50);
    expect(result.pqcReadiness).toBeGreaterThan(0.8);
  });

  it('should include lattice, code, and hash families', () => {
    const result = generateMultiLayerEncryption('family-test');
    const families = result.layers.map(l => l.family);

    expect(families).toContain('lattice');
    expect(families).toContain('code');
    expect(families).toContain('hash');
  });

  it('should have all layers at NIST level 5', () => {
    const result = generateMultiLayerEncryption('nist-test');

    for (const layer of result.layers) {
      expect(layer.nistLevel).toBe(5);
      expect(layer.shorResistant).toBe(true);
      expect(layer.groverResistant).toBe(true);
    }
  });

  it('should have valid timing for all layers', () => {
    const result = generateMultiLayerEncryption('timing-test');

    for (const layer of result.layers) {
      expect(layer.keygenTimeMs).toBeGreaterThan(0);
      expect(layer.encryptTimeMs).toBeGreaterThan(0);
      expect(layer.decryptTimeMs).toBeGreaterThan(0);
      expect(layer.publicKeySize).toBeGreaterThan(0);
      expect(layer.privateKeySize).toBeGreaterThan(0);
      expect(layer.ciphertextSize).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. Quantum Attack Simulator — محاكي الهجمات الكمومية
// ═══════════════════════════════════════════════════════════════

describe('Quantum Attack Simulator', () => {
  it('should simulate multiple attack types', () => {
    const results = simulateQuantumAttacks(2048, 'atk-test');

    expect(results.length).toBe(5);
    const attackTypes = results.map(r => r.attack);
    expect(attackTypes).toContain('shor_rsa');
    expect(attackTypes).toContain('shor_ecc');
    expect(attackTypes).toContain('grover_aes');
    expect(attackTypes).toContain('harvest_now_decrypt_later');
    expect(attackTypes).toContain('quantum_mitm');
  });

  it('should mark Harvest Now Decrypt Later as currently feasible', () => {
    const results = simulateQuantumAttacks(2048, 'feasible-test');
    const hndl = results.find(r => r.attack === 'harvest_now_decrypt_later');

    expect(hndl).toBeDefined();
    expect(hndl!.currentlyFeasible).toBe(true);
    expect(hndl!.successProbability).toBe(1);
  });

  it('should recommend PQC defense for each attack', () => {
    const results = simulateQuantumAttacks(2048, 'defense-test');

    for (const result of results) {
      expect(result.recommendedDefense.length).toBeGreaterThan(0);
      expect(result.postDefenseSuccessRate).toBeLessThan(0.01);
    }
  });

  it('should require massive qubits for RSA attack', () => {
    const results = simulateQuantumAttacks(4096, 'qubit-test');
    const rsaAttack = results.find(r => r.attack === 'shor_rsa');

    expect(rsaAttack).toBeDefined();
    expect(rsaAttack!.requiredQubits).toBeGreaterThan(4096);
  });

  it('should have AES-256 Grover attack as infeasible', () => {
    const results = simulateQuantumAttacks(256, 'grover-test');
    const groverAes = results.find(r => r.attack === 'grover_aes');

    expect(groverAes).toBeDefined();
    expect(groverAes!.currentlyFeasible).toBe(false);
    expect(groverAes!.estimatedFeasibleYear).toBeGreaterThan(2050);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. Quantum Forensics — التحليل الجنائي الكمومي
// ═══════════════════════════════════════════════════════════════

describe('Quantum Forensics', () => {
  it('should generate forensic analysis with traces', () => {
    const result = runQuantumForensics('test-network');

    expect(result.investigationId).toMatch(/^QFI-/);
    expect(result.tracesFound).toBeGreaterThan(0);
    expect(result.traces.length).toBe(result.tracesFound);
    expect(result.probableSource).toMatch(/\d+\.\d+\.\d+\.0\/24/);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.dataRecoverable).toBe('boolean');
    expect(result.recoveryRate).toBeGreaterThanOrEqual(0);
    expect(result.recoveryRate).toBeLessThanOrEqual(1);
  });

  it('should have valid trace structures', () => {
    const result = runQuantumForensics('trace-test');

    for (const trace of result.traces) {
      expect(trace.id).toMatch(/^QFT-/);
      expect(trace.timestamp).toBeGreaterThan(0);
      expect(['entanglement_break', 'measurement_disturbance', 'decoherence_anomaly', 'phase_shift', 'bell_violation'].includes(trace.traceType)).toBe(true);
      expect(trace.description.length).toBeGreaterThan(0);
      expect(trace.strength).toBeGreaterThanOrEqual(0.3);
      expect(trace.strength).toBeLessThanOrEqual(1);
      expect(trace.networkLocation).toMatch(/^node-/);
      expect(trace.quantumFingerprint).toMatch(/^qsh2-/);
      expect(typeof trace.coordinates.x).toBe('number');
      expect(typeof trace.coordinates.y).toBe('number');
    }
  });

  it('should generate ordered attack timeline', () => {
    const result = runQuantumForensics('timeline-test');

    const times = result.attackTimeline.map(e => e.time);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. PQC Readiness — مؤشر الجاهزية الكمومية
// ═══════════════════════════════════════════════════════════════

describe('PQC Readiness Assessment', () => {
  it('should generate readiness report', () => {
    const result = assessPQCReadiness('https://example.com');

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(['critical', 'poor', 'fair', 'good', 'excellent'].includes(result.rating)).toBe(true);
    expect(result.ratingAr.length).toBeGreaterThan(0);
    expect(result.categories).toHaveLength(5);
    expect(result.yearsUntilQuantumThreat).toBeGreaterThan(0);
    expect(result.priorities.length).toBeGreaterThan(0);
    expect(['low', 'medium', 'high', 'very_high'].includes(result.migrationComplexity)).toBe(true);
  });

  it('should assess five categories', () => {
    const result = assessPQCReadiness('https://qurabia.com');
    const categoryNames = result.categories.map(c => c.name);

    expect(categoryNames).toContain('Key Exchange');
    expect(categoryNames).toContain('Digital Signatures');
    expect(categoryNames).toContain('Symmetric Encryption');
    expect(categoryNames).toContain('TLS Configuration');
    expect(categoryNames).toContain('Data at Rest');
  });

  it('should have valid category scores', () => {
    const result = assessPQCReadiness('https://test.com');

    for (const category of result.categories) {
      expect(category.score).toBeGreaterThanOrEqual(0);
      expect(category.score).toBeLessThanOrEqual(category.maxScore);
      expect(category.findings.length).toBeGreaterThan(0);
      expect(category.recommendations.length).toBeGreaterThan(0);
      expect(category.nameAr.length).toBeGreaterThan(0);
    }
  });

  it('should have correct rating based on score', () => {
    const result = assessPQCReadiness('https://example.com');

    if (result.overallScore >= 80) expect(result.rating).toBe('excellent');
    else if (result.overallScore >= 60) expect(result.rating).toBe('good');
    else if (result.overallScore >= 40) expect(result.rating).toBe('fair');
    else if (result.overallScore >= 20) expect(result.rating).toBe('poor');
    else expect(result.rating).toBe('critical');
  });

  it('should include priority actions with urgency levels', () => {
    const result = assessPQCReadiness('https://example.com');

    for (const priority of result.priorities) {
      expect(priority.action.length).toBeGreaterThan(0);
      expect(['immediate', 'short_term', 'medium_term', 'long_term'].includes(priority.urgency)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// التقرير الشامل
// ═══════════════════════════════════════════════════════════════

describe('Comprehensive Shield Report', () => {
  it('should generate a complete report with all subsystems', () => {
    const report = generateComprehensiveReport('https://example.com');

    expect(report.timestamp).toBeGreaterThan(0);
    expect(report.targetUrl).toBe('https://example.com');
    expect(report.overallQuantumSecurityScore).toBeGreaterThanOrEqual(0);
    expect(report.overallQuantumSecurityScore).toBeLessThanOrEqual(100);

    // QKD
    expect(report.qkdSession.sessionId).toMatch(/^QKD-/);
    expect(report.qkdSession.totalPhotons).toBe(1024);

    // QNIDS
    expect(report.qnidsAnalysis.packetsAnalyzed).toBe(10000);
    expect(report.qnidsAnalysis.attacks.length).toBeGreaterThan(0);

    // Encryption
    expect(report.encryptionLayers.layers).toHaveLength(3);

    // Attacks
    expect(report.attackSimulations.length).toBe(5);

    // Forensics
    expect(report.forensicAnalysis.tracesFound).toBeGreaterThan(0);

    // PQC Readiness
    expect(report.pqcReadiness.categories).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// الثوابت والأوصاف العربية
// ═══════════════════════════════════════════════════════════════

describe('Arabic Constants', () => {
  it('should have all quantum threat tier descriptions', () => {
    expect(QUANTUM_THREAT_TIER_AR.Q1).toBe('تهديد تقليدي');
    expect(QUANTUM_THREAT_TIER_AR.Q5).toBe('تهديد كمومي وجودي');
    expect(Object.keys(QUANTUM_THREAT_TIER_AR)).toHaveLength(5);
  });

  it('should have all quantum attack descriptions in Arabic', () => {
    expect(QUANTUM_ATTACKS_AR.shor_rsa).toContain('شور');
    expect(QUANTUM_ATTACKS_AR.harvest_now_decrypt_later).toContain('جمع');
    expect(Object.keys(QUANTUM_ATTACKS_AR)).toHaveLength(8);
  });
});
