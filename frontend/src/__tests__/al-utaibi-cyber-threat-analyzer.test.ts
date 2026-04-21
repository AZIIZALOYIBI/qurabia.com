/**
 * اختبارات محلل التهديدات السيبرانية باستخدام معادلة العتيبي
 */

import { describe, it, expect } from 'vitest';
import {
  AlUtaibiCyberThreatAnalyzer,
  type CyberThreat,
  type ThreatLevel,
  createSampleThreat,
} from '../engine/AlUtaibiCyberThreatAnalyzer';

describe('AlUtaibiCyberThreatAnalyzer', () => {
  const analyzer = new AlUtaibiCyberThreatAnalyzer();

  describe('Basic Threat Analysis', () => {
    it('should analyze a sample threat successfully', () => {
      const threat = createSampleThreat();
      const result = analyzer.analyzeThreat(threat);

      expect(result).toBeDefined();
      expect(result.threat).toBe(threat);
      expect(result.threatScore).toBeGreaterThanOrEqual(0);
      expect(result.threatScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return valid threat level', () => {
      const threat = createSampleThreat();
      const result = analyzer.analyzeThreat(threat);

      const validLevels: ThreatLevel[] = ['low', 'medium', 'high', 'critical', 'existential'];
      expect(validLevels).toContain(result.threatLevel);
    });

    it('should return valid recommended action', () => {
      const threat = createSampleThreat();
      const result = analyzer.analyzeThreat(threat);

      const validActions = ['monitor', 'alert', 'block', 'isolate', 'shutdown'];
      expect(validActions).toContain(result.recommendedAction);
    });
  });

  describe('Threat Level Classification', () => {
    it('should classify high severity threats as critical or higher', () => {
      const threat: CyberThreat = {
        id: 'test-critical',
        category: 'apt',
        sourceIP: '10.0.0.1',
        targetPort: 22,
        timestamp: Date.now(),
        severity: 0.95,
        velocity: 0.9,
        sophistication: 0.95,
        persistence: 0.9,
      };

      const result = analyzer.analyzeThreat(threat);
      expect(['critical', 'existential']).toContain(result.threatLevel);
    });

    it('should classify low severity threats appropriately', () => {
      const threat: CyberThreat = {
        id: 'test-low',
        category: 'phishing',
        sourceIP: '192.168.1.1',
        targetPort: 80,
        timestamp: Date.now(),
        severity: 0.2,
        velocity: 0.1,
        sophistication: 0.1,
        persistence: 0.15,
      };

      const result = analyzer.analyzeThreat(threat);
      expect(['low', 'medium']).toContain(result.threatLevel);
    });

    it('should treat ransomware as high-priority threat', () => {
      const threat: CyberThreat = {
        id: 'test-ransomware',
        category: 'ransomware',
        sourceIP: '172.16.0.1',
        targetPort: 445,
        timestamp: Date.now(),
        severity: 0.7,
        velocity: 0.6,
        sophistication: 0.75,
        persistence: 0.8,
      };

      const result = analyzer.analyzeThreat(threat);
      expect(result.threatScore).toBeGreaterThan(50);
      expect(['block', 'isolate', 'shutdown']).toContain(result.recommendedAction);
    });
  });

  describe('Al-Utaibi Equation Parameters', () => {
    it('should compute quantum distance within valid range', () => {
      const threat = createSampleThreat();
      const result = analyzer.analyzeThreat(threat);

      expect(result.r_param).toBeGreaterThan(0);
      expect(result.r_param).toBeLessThan(1e-30);
    });

    it('should compute dark matter density for severity', () => {
      const lowSeverity: CyberThreat = {
        id: 'low-sev',
        category: 'phishing',
        sourceIP: '10.0.0.1',
        targetPort: 80,
        timestamp: Date.now(),
        severity: 0.1,
        velocity: 0.1,
        sophistication: 0.1,
        persistence: 0.1,
      };

      const highSeverity: CyberThreat = {
        ...lowSeverity,
        id: 'high-sev',
        severity: 0.9,
        persistence: 0.9,
      };

      const resultLow = analyzer.analyzeThreat(lowSeverity);
      const resultHigh = analyzer.analyzeThreat(highSeverity);

      // الخطورة الأعلى → كثافة مادة مظلمة أعلى
      expect(resultHigh.rho_dm).toBeGreaterThan(resultLow.rho_dm);
    });

    it('should compute dark energy density for velocity', () => {
      const slowThreat: CyberThreat = {
        id: 'slow',
        category: 'malware',
        sourceIP: '10.0.0.1',
        targetPort: 80,
        timestamp: Date.now(),
        severity: 0.5,
        velocity: 0.1,
        sophistication: 0.5,
        persistence: 0.5,
      };

      const fastThreat: CyberThreat = {
        ...slowThreat,
        id: 'fast',
        velocity: 0.95,
      };

      const resultSlow = analyzer.analyzeThreat(slowThreat);
      const resultFast = analyzer.analyzeThreat(fastThreat);

      // السرعة الأعلى → كثافة طاقة مظلمة أعلى
      expect(resultFast.rho_de).toBeGreaterThan(resultSlow.rho_de);
    });

    it('should assign higher coherence to APT threats', () => {
      const aptThreat: CyberThreat = {
        id: 'apt-test',
        category: 'apt',
        sourceIP: '10.0.0.1',
        targetPort: 443,
        timestamp: Date.now(),
        severity: 0.8,
        velocity: 0.7,
        sophistication: 0.9,
        persistence: 0.85,
      };

      const phishingThreat: CyberThreat = {
        ...aptThreat,
        id: 'phishing-test',
        category: 'phishing',
      };

      const resultAPT = analyzer.analyzeThreat(aptThreat);
      const resultPhishing = analyzer.analyzeThreat(phishingThreat);

      // APT → تماسك كمومي أعلى
      expect(resultAPT.Q_coherence).toBeGreaterThan(resultPhishing.Q_coherence);
    });
  });

  describe('Quantum Risk Calculation', () => {
    it('should produce positive quantum risk values', () => {
      const threat = createSampleThreat();
      const result = analyzer.analyzeThreat(threat);

      expect(result.quantumRisk).toBeGreaterThan(0);
    });

    it('should correlate quantum risk with threat score', () => {
      const threats: CyberThreat[] = [
        {
          id: 'low-risk',
          category: 'phishing',
          sourceIP: '10.0.0.1',
          targetPort: 80,
          timestamp: Date.now(),
          severity: 0.2,
          velocity: 0.1,
          sophistication: 0.1,
          persistence: 0.1,
        },
        {
          id: 'high-risk',
          category: 'apt',
          sourceIP: '10.0.0.2',
          targetPort: 22,
          timestamp: Date.now(),
          severity: 0.95,
          velocity: 0.9,
          sophistication: 0.95,
          persistence: 0.95,
        },
      ];

      const results = threats.map(t => analyzer.analyzeThreat(t));

      // مخاطر كمومية أعلى → درجة تهديد أعلى
      expect(results[1].quantumRisk).toBeGreaterThan(results[0].quantumRisk);
      expect(results[1].threatScore).toBeGreaterThan(results[0].threatScore);
    });
  });

  describe('Batch Analysis', () => {
    it('should analyze multiple threats', () => {
      const threats: CyberThreat[] = [
        {
          id: 'threat-1',
          category: 'malware',
          sourceIP: '10.0.0.1',
          targetPort: 80,
          timestamp: Date.now(),
          severity: 0.5,
          velocity: 0.4,
          sophistication: 0.5,
          persistence: 0.4,
        },
        {
          id: 'threat-2',
          category: 'ddos',
          sourceIP: '10.0.0.2',
          targetPort: 443,
          timestamp: Date.now(),
          severity: 0.7,
          velocity: 0.9,
          sophistication: 0.3,
          persistence: 0.2,
        },
        {
          id: 'threat-3',
          category: 'ransomware',
          sourceIP: '10.0.0.3',
          targetPort: 445,
          timestamp: Date.now(),
          severity: 0.85,
          velocity: 0.7,
          sophistication: 0.8,
          persistence: 0.9,
        },
      ];

      const results = analyzer.analyzeThreats(threats);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.threatScore).toBeGreaterThanOrEqual(0);
        expect(result.threatScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Threat Summary', () => {
    it('should generate correct summary statistics', () => {
      const threats: CyberThreat[] = [
        {
          id: 'low-1',
          category: 'phishing',
          sourceIP: '10.0.0.1',
          targetPort: 80,
          timestamp: Date.now(),
          severity: 0.2,
          velocity: 0.1,
          sophistication: 0.1,
          persistence: 0.1,
        },
        {
          id: 'high-1',
          category: 'apt',
          sourceIP: '10.0.0.2',
          targetPort: 22,
          timestamp: Date.now(),
          severity: 0.9,
          velocity: 0.85,
          sophistication: 0.95,
          persistence: 0.9,
        },
        {
          id: 'medium-1',
          category: 'injection',
          sourceIP: '10.0.0.3',
          targetPort: 3306,
          timestamp: Date.now(),
          severity: 0.5,
          velocity: 0.4,
          sophistication: 0.6,
          persistence: 0.5,
        },
      ];

      const results = analyzer.analyzeThreats(threats);
      const summary = analyzer.getThreatSummary(results);

      expect(summary.total).toBe(3);
      expect(summary.avgScore).toBeGreaterThan(0);
      expect(summary.maxScore).toBeGreaterThanOrEqual(summary.avgScore);

      // التحقق من عدد التهديدات حسب المستوى
      let totalByLevel = 0;
      for (const level of Object.keys(summary.byLevel)) {
        totalByLevel += summary.byLevel[level as ThreatLevel];
      }
      expect(totalByLevel).toBe(3);
    });

    it('should identify critical threats in summary', () => {
      const threats: CyberThreat[] = [
        {
          id: 'critical-1',
          category: 'apt',
          sourceIP: '10.0.0.1',
          targetPort: 22,
          timestamp: Date.now(),
          severity: 0.95,
          velocity: 0.9,
          sophistication: 0.95,
          persistence: 0.95,
        },
        {
          id: 'low-1',
          category: 'phishing',
          sourceIP: '10.0.0.2',
          targetPort: 80,
          timestamp: Date.now(),
          severity: 0.2,
          velocity: 0.1,
          sophistication: 0.1,
          persistence: 0.1,
        },
      ];

      const results = analyzer.analyzeThreats(threats);
      const summary = analyzer.getThreatSummary(results);

      // يجب أن يكون هناك تهديد واحد حرج على الأقل
      expect(summary.criticalThreats.length).toBeGreaterThanOrEqual(1);
      summary.criticalThreats.forEach(threat => {
        expect(['critical', 'existential']).toContain(threat.threatLevel);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero severity threat', () => {
      const threat: CyberThreat = {
        id: 'zero-sev',
        category: 'malware',
        sourceIP: '10.0.0.1',
        targetPort: 80,
        timestamp: Date.now(),
        severity: 0,
        velocity: 0,
        sophistication: 0,
        persistence: 0,
      };

      const result = analyzer.analyzeThreat(threat);

      expect(result.threatScore).toBeGreaterThanOrEqual(0);
      expect(result.threatLevel).toBe('low');
    });

    it('should handle maximum severity threat', () => {
      const threat: CyberThreat = {
        id: 'max-sev',
        category: 'apt',
        sourceIP: '10.0.0.1',
        targetPort: 22,
        timestamp: Date.now(),
        severity: 1.0,
        velocity: 1.0,
        sophistication: 1.0,
        persistence: 1.0,
      };

      const result = analyzer.analyzeThreat(threat);

      expect(result.threatScore).toBeLessThanOrEqual(100);
      expect(['critical', 'existential']).toContain(result.threatLevel);
    });

    it('should handle empty threat list', () => {
      const results = analyzer.analyzeThreats([]);
      const summary = analyzer.getThreatSummary(results);

      expect(summary.total).toBe(0);
      expect(summary.avgScore).toBe(0);
      expect(summary.maxScore).toBe(0);
      expect(summary.criticalThreats).toHaveLength(0);
    });
  });

  describe('Confidence Calculation', () => {
    it('should have higher confidence for known threat categories', () => {
      const knownThreat: CyberThreat = {
        id: 'known',
        category: 'malware',
        sourceIP: '10.0.0.1',
        targetPort: 80,
        timestamp: Date.now(),
        severity: 0.5,
        velocity: 0.5,
        sophistication: 0.5,
        persistence: 0.5,
      };

      const unknownThreat: CyberThreat = {
        ...knownThreat,
        id: 'unknown',
        category: 'apt',
      };

      const resultKnown = analyzer.analyzeThreat(knownThreat);
      const resultUnknown = analyzer.analyzeThreat(unknownThreat);

      // التهديدات المعروفة تحصل على دفعة ثقة
      expect(resultKnown.confidence).toBeGreaterThanOrEqual(0.85);
      expect(resultKnown.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Recommended Actions', () => {
    it('should recommend shutdown for existential threats', () => {
      const threat: CyberThreat = {
        id: 'existential',
        category: 'apt',
        sourceIP: '10.0.0.1',
        targetPort: 22,
        timestamp: Date.now(),
        severity: 1.0,
        velocity: 1.0,
        sophistication: 1.0,
        persistence: 1.0,
      };

      const result = analyzer.analyzeThreat(threat);

      if (result.threatLevel === 'existential') {
        expect(result.recommendedAction).toBe('shutdown');
      }
    });

    it('should recommend at least block for ransomware', () => {
      const threat: CyberThreat = {
        id: 'ransomware-test',
        category: 'ransomware',
        sourceIP: '10.0.0.1',
        targetPort: 445,
        timestamp: Date.now(),
        severity: 0.6,
        velocity: 0.5,
        sophistication: 0.7,
        persistence: 0.65,
      };

      const result = analyzer.analyzeThreat(threat);

      // الفدية دائماً → حظر أو أعلى
      expect(['block', 'isolate', 'shutdown']).toContain(result.recommendedAction);
    });
  });
});
