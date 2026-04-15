import { describe, it, expect } from 'vitest';
import {
  runQKDSession,
  analyzeTrafficQNIDS,
  generateMultiLayerEncryption,
  simulateQuantumAttacks,
  runQuantumForensics,
  assessPQCReadiness,
  generateComprehensiveReport,
  generateQuantumFingerprint,
  monitorEntanglement,
  computeAdaptiveShield,
  generateMultiPathEncryption,
  QUANTUM_THREAT_TIER_AR,
  QUANTUM_ATTACKS_AR,
  type QKDSessionResult,
  type QNIDSAnalysis,
  type MultiLayerEncryptionResult,
  type QuantumAttackSimResult,
  type ForensicAnalysisResult,
  type PQCReadinessReport,
  type ComprehensiveShieldReport,
  type QuantumFingerprint,
  type EntanglementMonitorResult,
  type AdaptiveShieldState,
  type MultiPathEncryptionResult,
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
  it('should generate three encryption layers with real NIST specs', () => {
    const result = generateMultiLayerEncryption('test-seed');

    expect(result.layers).toHaveLength(3);
    expect(result.combinedSecurityBits).toBe(462); // حساب واقعي ثابت
    expect(result.totalTimeMs).toBeGreaterThan(0);
    expect(result.totalCiphertextSize).toBeGreaterThan(0);
    expect(result.estimatedYearsSecure).toBe(50); // تقدير محافظ ثابت
    expect(result.pqcReadiness).toBe(0.95); // ثلاث طبقات Level 5
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

  it('should recommend PQC defense for each attack with zero post-defense rate', () => {
    const results = simulateQuantumAttacks(2048, 'defense-test');

    for (const result of results) {
      expect(result.recommendedDefense.length).toBeGreaterThan(0);
      expect(result.postDefenseSuccessRate).toBe(0);
    }
  });

  it('should require massive qubits for RSA attack (Gidney & Ekerå 2021)', () => {
    const results = simulateQuantumAttacks(4096, 'qubit-test');
    const rsaAttack = results.find(r => r.attack === 'shor_rsa');

    expect(rsaAttack).toBeDefined();
    // Gidney & Ekerå: 20M كيوبت صاخب لـ RSA-2048، أكثر لـ 4096
    expect(rsaAttack!.requiredQubits).toBeGreaterThanOrEqual(20000000);
  });

  it('should have AES-256 Grover attack as practically infeasible', () => {
    const results = simulateQuantumAttacks(256, 'grover-test');
    const groverAes = results.find(r => r.attack === 'grover_aes');

    expect(groverAes).toBeDefined();
    expect(groverAes!.currentlyFeasible).toBe(false);
    // غير ممكن عملياً أبداً (2^128 عملية)
    expect(groverAes!.estimatedFeasibleYear).toBe(9999);
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
  it('should generate readiness report with realistic assessment', () => {
    const result = assessPQCReadiness('https://example.com');

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(['critical', 'poor', 'fair', 'good', 'excellent'].includes(result.rating)).toBe(true);
    expect(result.ratingAr.length).toBeGreaterThan(0);
    expect(result.categories).toHaveLength(5);
    // تقدير واقعي: 12 سنة حتى التهديد الكمومي (مبني على IBM Roadmap)
    expect(result.yearsUntilQuantumThreat).toBe(12);
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

  it('should have correct rating based on score (realistic: most sites score low)', () => {
    const result = assessPQCReadiness('https://example.com');

    // معظم المواقع اليوم لا تستخدم PQC — الدرجة ستكون منخفضة
    // HTTPS site: 4 + 3 + 16 + 8 + 5 = 36
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

// ═══════════════════════════════════════════════════════════════
// اختبارات البيانات الحقيقية
// ═══════════════════════════════════════════════════════════════

describe('Real Data Validation — NIST PQC Specs', () => {
  it('Kyber-1024 should have correct NIST FIPS 203 sizes', () => {
    const result = generateMultiLayerEncryption('nist-verify');
    const kyber = result.layers.find(l => l.algorithm === 'CRYSTALS-Kyber-1024');

    expect(kyber).toBeDefined();
    expect(kyber!.publicKeySize).toBe(1568);   // FIPS 203
    expect(kyber!.privateKeySize).toBe(3168);  // FIPS 203
    expect(kyber!.ciphertextSize).toBe(1568);  // FIPS 203
    expect(kyber!.nistLevel).toBe(5);
  });

  it('McEliece-6960119 should have correct published sizes', () => {
    const result = generateMultiLayerEncryption('mceliece-verify');
    const mceliece = result.layers.find(l => l.algorithm === 'Classic-McEliece-6960119');

    expect(mceliece).toBeDefined();
    expect(mceliece!.publicKeySize).toBe(1044992);
    expect(mceliece!.ciphertextSize).toBe(226);
  });

  it('SPHINCS+-SHA2-256f should have correct FIPS 205 sizes', () => {
    const result = generateMultiLayerEncryption('sphincs-verify');
    const sphincs = result.layers.find(l => l.algorithm === 'SPHINCS+-SHA2-256f');

    expect(sphincs).toBeDefined();
    expect(sphincs!.publicKeySize).toBe(64);   // FIPS 205
    expect(sphincs!.privateKeySize).toBe(128);  // FIPS 205
    expect(sphincs!.ciphertextSize).toBe(49856); // FIPS 205
  });

  it('Shor RSA-2048 should require 20M qubits (Gidney & Ekerå 2021)', () => {
    const attacks = simulateQuantumAttacks(2048, 'gidney-verify');
    const shorRsa = attacks.find(a => a.attack === 'shor_rsa');

    expect(shorRsa).toBeDefined();
    expect(shorRsa!.requiredQubits).toBe(20000000);
    expect(shorRsa!.estimatedTimeHours).toBe(8);
    expect(shorRsa!.estimatedFeasibleYear).toBe(2035);
  });

  it('ECDSA P-256 should require 2330 logical qubits (Häner et al. 2020)', () => {
    const attacks = simulateQuantumAttacks(256, 'haner-verify');
    const shorEcc = attacks.find(a => a.attack === 'shor_ecc');

    expect(shorEcc).toBeDefined();
    expect(shorEcc!.requiredQubits).toBe(2330);
    expect(shorEcc!.gateCount).toBe(1.26e11);
  });

  it('Grover AES-256 should be practically impossible (2^128 ops)', () => {
    const attacks = simulateQuantumAttacks(256, 'grassl-verify');
    const grover = attacks.find(a => a.attack === 'grover_aes');

    expect(grover).toBeDefined();
    expect(grover!.requiredQubits).toBe(6681);
    expect(grover!.estimatedTimeHours).toBe(Number.POSITIVE_INFINITY);
    expect(grover!.estimatedFeasibleYear).toBe(9999);
  });

  it('PQC readiness should estimate 12 years until quantum threat (IBM Roadmap)', () => {
    const result = assessPQCReadiness('https://example.com');
    expect(result.yearsUntilQuantumThreat).toBe(12);
  });

  it('attack data should be deterministic (no randomness)', () => {
    const attacks1 = simulateQuantumAttacks(2048, 'determinism-test');
    const attacks2 = simulateQuantumAttacks(2048, 'determinism-test');

    for (let i = 0; i < attacks1.length; i++) {
      expect(attacks1[i].requiredQubits).toBe(attacks2[i].requiredQubits);
      expect(attacks1[i].estimatedTimeHours).toBe(attacks2[i].estimatedTimeHours);
      expect(attacks1[i].successProbability).toBe(attacks2[i].successProbability);
      expect(attacks1[i].estimatedFeasibleYear).toBe(attacks2[i].estimatedFeasibleYear);
      expect(attacks1[i].postDefenseSuccessRate).toBe(attacks2[i].postDefenseSuccessRate);
    }
  });
});

// ═════════════════════════════════════════════════════════════
// 7. نظام البصمة الكمومية الحية (Quantum Fingerprinting)
// ═══════════════════════════════════════════════════════════════

describe('Quantum Fingerprinting', () => {
  it('should generate unique fingerprint for each IP', () => {
    const fp1 = generateQuantumFingerprint('192.168.1.1', 'test-seed');
    const fp2 = generateQuantumFingerprint('192.168.1.2', 'test-seed');

    expect(fp1.id).toMatch(/^QFP-/);
    expect(fp2.id).toMatch(/^QFP-/);
    expect(fp1.id).not.toBe(fp2.id);
    expect(fp1.sourceIp).toBe('192.168.1.1');
    expect(fp2.sourceIp).toBe('192.168.1.2');
  });

  it('should have valid quantum state properties', () => {
    const fp = generateQuantumFingerprint('10.0.0.1', 'quantum-test');

    expect(fp.entanglementLevel).toBeGreaterThanOrEqual(0.5);
    expect(fp.entanglementLevel).toBeLessThanOrEqual(1);
    expect(fp.quantumPhase).toBeGreaterThanOrEqual(0);
    expect(fp.quantumPhase).toBeLessThanOrEqual(2 * Math.PI);
    expect(fp.densityMatrix).toHaveLength(4);
    expect(fp.confidence).toBeGreaterThanOrEqual(0.85);
    expect(fp.confidence).toBeLessThanOrEqual(1);
  });

  it('should classify connections correctly', () => {
    const fp = generateQuantumFingerprint('172.16.0.1', 'classification-test');
    expect(['legitimate', 'suspicious', 'malicious', 'unknown'].includes(fp.classification)).toBe(true);
  });

  it('should have quantum hash signature', () => {
    const fp = generateQuantumFingerprint('8.8.8.8', 'hash-test');
    expect(fp.stateSignature).toMatch(/^qsh2-/);
    expect(fp.timestamp).toBeGreaterThan(0);
  });

  it('density matrix should preserve trace = 1', () => {
    const fp = generateQuantumFingerprint('1.1.1.1', 'trace-test');
    const trace = fp.densityMatrix[0] + fp.densityMatrix[3];
    expect(Math.abs(trace - 1)).toBeLessThan(0.001);
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. محرك التشابك الكمومي (Entanglement Monitor)
// ═══════════════════════════════════════════════════════════════

describe('Entanglement Monitor', () => {
  it('should monitor multiple entangled pairs', () => {
    const result = monitorEntanglement('test-network', 20);

    expect(result.totalPairs).toBe(20);
    expect(result.pairs).toHaveLength(20);
    expect(result.avgConcurrence).toBeGreaterThan(0);
    expect(result.avgConcurrence).toBeLessThanOrEqual(1);
    expect(result.avgFidelity).toBeGreaterThan(0.8);
    expect(result.networkSecurityScore).toBeGreaterThanOrEqual(0);
    expect(result.networkSecurityScore).toBeLessThanOrEqual(100);
  });

  it('should have valid EPR pair structure', () => {
    const result = monitorEntanglement('epr-test', 10);

    for (const pair of result.pairs) {
      expect(pair.pairId).toMatch(/^EPR-/);
      expect(pair.nodeA).toMatch(/^node-/);
      expect(pair.nodeB).toMatch(/^node-/);
      expect(pair.concurrence).toBeGreaterThanOrEqual(0.5);
      expect(pair.concurrence).toBeLessThanOrEqual(1);
      expect(pair.fidelity).toBeGreaterThanOrEqual(0.85);
      expect(pair.fidelity).toBeLessThanOrEqual(1);
      expect(pair.bellViolation).toBeGreaterThanOrEqual(2);
      expect(pair.bellViolation).toBeLessThanOrEqual(2.828);
      expect(typeof pair.eavesdropDetected).toBe('boolean');
      expect(pair.qber).toBeGreaterThanOrEqual(0);
      expect(pair.qber).toBeLessThanOrEqual(0.15);
      expect(['intact', 'degraded', 'compromised', 'broken'].includes(pair.status)).toBe(true);
    }
  });

  it('should detect compromised pairs correctly', () => {
    const result = monitorEntanglement('compromise-test', 50);
    expect(result.compromisedCount).toBeGreaterThanOrEqual(0);
    expect(result.compromisedCount).toBeLessThanOrEqual(result.totalPairs);

    const compromisedPairs = result.pairs.filter(
      p => p.status === 'compromised' || p.status === 'broken'
    );
    expect(compromisedPairs.length).toBe(result.compromisedCount);
  });

  it('Bell violation should indicate eavesdropping', () => {
    const result = monitorEntanglement('bell-test', 30);

    for (const pair of result.pairs) {
      if (pair.bellViolation < 2.3) {
        expect(pair.eavesdropDetected).toBe(true);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. الدرع الكمومي التكيفي (Adaptive Quantum Shield)
// ═══════════════════════════════════════════════════════════════

describe('Adaptive Quantum Shield', () => {
  it('should adapt shield level to threat count', () => {
    const low = computeAdaptiveShield(5, 0.1);
    const medium = computeAdaptiveShield(100, 0.4);
    const high = computeAdaptiveShield(600, 0.8);
    const critical = computeAdaptiveShield(1500, 0.95);

    expect(low.level).toBeLessThan(medium.level);
    expect(medium.level).toBeLessThan(high.level);
    expect(high.level).toBeLessThan(critical.level);
  });

  it('should have correct level descriptions', () => {
    const shield = computeAdaptiveShield(250, 0.6);
    expect(shield.level).toBeGreaterThanOrEqual(0);
    expect(shield.level).toBeLessThanOrEqual(5);
    expect(shield.levelDescription.length).toBeGreaterThan(0);
    expect(['passive', 'active', 'aggressive', 'lockdown'].includes(shield.mode)).toBe(true);
  });

  it('should activate more rules at higher levels', () => {
    const level1 = computeAdaptiveShield(20, 0.2);
    const level5 = computeAdaptiveShield(2000, 0.95);

    expect(level5.activeRules.length).toBeGreaterThan(level1.activeRules.length);
    expect(level5.strength).toBeGreaterThanOrEqual(level1.strength);
  });

  it('should have valid rule structure', () => {
    const shield = computeAdaptiveShield(100, 0.5);

    for (const rule of shield.activeRules) {
      expect(rule.name.length).toBeGreaterThan(0);
      expect(rule.nameAr.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high', 'critical'].includes(rule.priority)).toBe(true);
    }
  });

  it('should block most threats at high level', () => {
    const shield = computeAdaptiveShield(500, 0.8);
    expect(shield.blockedThreats).toBeGreaterThan(shield.recentThreats * 0.8);
  });

  it('should have faster response time at higher levels', () => {
    const low = computeAdaptiveShield(10, 0.1);
    const high = computeAdaptiveShield(800, 0.9);

    expect(high.responseTimeMs).toBeLessThan(low.responseTimeMs);
    expect(high.adaptationRate).toBeGreaterThan(low.adaptationRate);
  });

  it('lockdown mode should activate for existential threats', () => {
    const shield = computeAdaptiveShield(1200, 0.92);
    expect(shield.level).toBe(5);
    expect(shield.mode).toBe('lockdown');
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. نظام التشفير متعدد المسارات (Multi-Path Encryption)
// ═══════════════════════════════════════════════════════════════

describe('Multi-Path Encryption', () => {
  it('should generate multiple encryption paths', () => {
    const result = generateMultiPathEncryption('https://example.com', 5);

    expect(result.paths).toHaveLength(5);
    expect(result.primaryPath).toMatch(/^PATH-/);
    expect(result.backupPaths.length).toBeGreaterThanOrEqual(0);
    expect(result.redundancyFactor).toBeGreaterThan(0);
    expect(result.redundancyFactor).toBeLessThanOrEqual(1);
    expect(result.successProbability).toBeGreaterThan(0);
    expect(result.successProbability).toBeLessThanOrEqual(1);
    expect(result.combinedSecurity).toBeGreaterThan(0);
  });

  it('should have valid path structure', () => {
    const result = generateMultiPathEncryption('https://test.com', 8);

    for (const path of result.paths) {
      expect(path.pathId).toMatch(/^PATH-/);
      expect(path.algorithm.length).toBeGreaterThan(0);
      expect(path.hopCount).toBeGreaterThanOrEqual(2);
      expect(path.hopCount).toBeLessThanOrEqual(7);
      expect(path.latencyMs).toBeGreaterThan(0);
      expect(path.errorRate).toBeGreaterThanOrEqual(0);
      expect(path.errorRate).toBeLessThanOrEqual(0.05);
      expect(path.securityStrength).toBeGreaterThanOrEqual(256);
      expect(path.securityStrength).toBeLessThanOrEqual(512);
      expect(['active', 'standby', 'degraded', 'failed'].includes(path.status)).toBe(true);
    }
  });

  it('should use different PQC algorithms', () => {
    const result = generateMultiPathEncryption('https://qurabia.com', 6);
    const algorithms = new Set(result.paths.map(p => p.algorithm));
    expect(algorithms.size).toBeGreaterThan(1);
  });

  it('primary path should be first and active', () => {
    const result = generateMultiPathEncryption('https://quantum.com', 10);
    expect(result.primaryPath).toBe(result.paths[0].pathId);
    expect(result.paths[0].status).toBe('active');
  });

  it('should have high success probability with multiple paths', () => {
    const single = generateMultiPathEncryption('https://test1.com', 1);
    const multiple = generateMultiPathEncryption('https://test2.com', 10);
    expect(multiple.successProbability).toBeGreaterThan(single.successProbability);
  });

  it('combined security should be max of all paths', () => {
    const result = generateMultiPathEncryption('https://secure.com', 7);
    const maxSecurity = Math.max(...result.paths.map(p => p.securityStrength));
    expect(result.combinedSecurity).toBe(maxSecurity);
  });
});
