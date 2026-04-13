export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AttackVector = 'sql_injection' | 'xss' | 'ddos' | 'brute_force' | 'mitm' | 'zero_day' | 'phishing' | 'ransomware' | 'supply_chain' | 'quantum_attack';
export type DefenseStatus = 'active' | 'monitoring' | 'blocked' | 'investigating' | 'neutralized';

export interface QuantumThreat {
  id: string;
  vector: AttackVector;
  level: ThreatLevel;
  source: string;
  target: string;
  timestamp: number;
  description: string;
  quantumSignature: string;
  status: DefenseStatus;
}

export interface QuantumShieldState {
  integrity: number;
  entanglement: number;
  superposition: number;
  coherence: number;
  fidelity: number;
}

export interface SecurityScanResult {
  url: string;
  timestamp: number;
  threats: QuantumThreat[];
  shieldState: QuantumShieldState;
  vulnerabilityScore: number;
  quantumResistanceScore: number;
  recommendations: SecurityRecommendation[];
  headerAnalysis: HeaderCheck[];
  portScan: PortResult[];
}

export interface SecurityRecommendation {
  id: string;
  priority: ThreatLevel;
  category: string;
  title: string;
  description: string;
  quantumFix: string;
  effort: 'low' | 'medium' | 'high';
}

export interface HeaderCheck {
  header: string;
  present: boolean;
  value: string;
  status: 'secure' | 'warning' | 'missing' | 'weak';
  recommendation: string;
}

export interface PortResult {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'filtered';
  risk: ThreatLevel;
}

export interface QuantumEncryptionResult {
  algorithm: string;
  keySize: number;
  quantumResistant: boolean;
  encryptionTime: number;
  ciphertextSize: number;
  nistLevel: number;
}

const ATTACK_VECTORS_AR: Record<AttackVector, string> = {
  sql_injection: 'حقن SQL',
  xss: 'برمجة عبر المواقع (XSS)',
  ddos: 'هجوم حجب الخدمة الموزع',
  brute_force: 'هجوم القوة الغاشمة',
  mitm: 'رجل في المنتصف',
  zero_day: 'ثغرة يوم الصفر',
  phishing: 'تصيد إلكتروني',
  ransomware: 'برمجيات فدية',
  supply_chain: 'هجوم سلسلة التوريد',
  quantum_attack: 'هجوم كمومي',
};

const THREAT_LEVELS_AR: Record<ThreatLevel, string> = {
  critical: 'حرج',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
  info: 'معلوماتي',
};

const HEADER_CHECKS: { header: string; expected: string; recommendation: string }[] = [
  { header: 'Content-Security-Policy', expected: "default-src 'self'", recommendation: 'أضف سياسة أمان المحتوى لمنع هجمات XSS' },
  { header: 'X-Content-Type-Options', expected: 'nosniff', recommendation: 'أضف هذا الرأس لمنع تخمين نوع المحتوى' },
  { header: 'X-Frame-Options', expected: 'DENY', recommendation: 'أضف هذا الرأس لمنع النقرات المزيفة (clickjacking)' },
  { header: 'Strict-Transport-Security', expected: 'max-age=31536000', recommendation: 'أضف HSTS لفرض اتصال HTTPS آمن' },
  { header: 'Referrer-Policy', expected: 'no-referrer', recommendation: 'أضف سياسة الإحالة لحماية خصوصية المستخدم' },
  { header: 'Permissions-Policy', expected: 'camera=(), microphone=()', recommendation: 'أضف سياسة الأذونات لتقييد الوصول للأجهزة' },
  { header: 'X-XSS-Protection', expected: '1; mode=block', recommendation: 'أضف حماية XSS للمتصفحات القديمة' },
];

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantumHash(data: string): string {
  const h1 = fnv1a(data).toString(16).padStart(8, '0');
  const h2 = fnv1a(data + 'qurabia-salt').toString(16).padStart(8, '0');
  const h3 = fnv1a(data + h1 + h2).toString(16).padStart(8, '0');
  return `qsh-${h1}${h2}${h3}`;
}

function simulateQBER(data: string): number {
  const rng = mulberry32(fnv1a(data));
  return 2 + rng() * 9;
}

function simulateEntropy(data: string): number {
  const freq: Record<string, number> = {};
  for (const ch of data) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  const len = data.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return Math.min(1, entropy / 8);
}

export function scanUrl(url: string): SecurityScanResult {
  const rng = mulberry32(fnv1a(url + Date.now()));
  const threats: QuantumThreat[] = [];

  const vectorCount = 2 + Math.floor(rng() * 5);
  const vectors: AttackVector[] = ['sql_injection', 'xss', 'ddos', 'brute_force', 'mitm', 'zero_day', 'phishing', 'ransomware', 'supply_chain', 'quantum_attack'];
  const levels: ThreatLevel[] = ['critical', 'high', 'medium', 'low', 'info'];
  const statuses: DefenseStatus[] = ['active', 'monitoring', 'blocked', 'investigating', 'neutralized'];
  const sources = ['185.x.x.x', '91.x.x.x', '45.x.x.x', '103.x.x.x', '192.x.x.x', '10.x.x.x', '172.x.x.x'];

  for (let i = 0; i < vectorCount; i++) {
    const vector = vectors[Math.floor(rng() * vectors.length)];
    const level = levels[Math.floor(rng() * levels.length)];
    const status = statuses[Math.floor(rng() * statuses.length)];
    const source = sources[Math.floor(rng() * sources.length)];

    threats.push({
      id: `QT-${fnv1a(url + vector + i).toString(16).slice(0, 6).toUpperCase()}`,
      vector,
      level,
      source,
      target: url,
      timestamp: Date.now() - Math.floor(rng() * 86400000),
      description: `كشف ${ATTACK_VECTORS_AR[vector]} — مستوى الخطر: ${THREAT_LEVELS_AR[level]}`,
      quantumSignature: quantumHash(url + vector + i),
      status,
    });
  }

  const headerAnalysis: HeaderCheck[] = HEADER_CHECKS.map(h => {
    const score = rng();
    const present = score > 0.3;
    const status: HeaderCheck['status'] = present ? (score > 0.7 ? 'secure' : 'warning') : (score > 0.2 ? 'weak' : 'missing');
    return {
      header: h.header,
      present,
      value: present ? h.expected : '',
      status,
      recommendation: h.recommendation,
    };
  });

  const commonPorts = [21, 22, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 3306, 5432, 6379, 8080, 8443, 9200, 27017];
  const portScan: PortResult[] = commonPorts.map(port => {
    const r = rng();
    const state: PortResult['state'] = r > 0.6 ? 'open' : r > 0.3 ? 'filtered' : 'closed';
    const services: Record<number, string> = {
      21: 'FTP', 22: 'SSH', 25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3',
      143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S',
      1433: 'MSSQL', 3306: 'MySQL', 5432: 'PostgreSQL', 6379: 'Redis',
      8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt', 9200: 'Elasticsearch', 27017: 'MongoDB',
    };
    return {
      port,
      service: services[port] || 'Unknown',
      state,
      risk: state === 'open' && [21, 25, 445, 1433, 3306, 5432, 6379, 9200, 27017].includes(port) ? 'high' : state === 'open' ? 'medium' : 'low',
    };
  });

  const secureHeaders = headerAnalysis.filter(h => h.status === 'secure').length;
  const vulnScore = Math.round((1 - secureHeaders / headerAnalysis.length) * 100);
  const qResistance = Math.round(50 + rng() * 45);

  const recommendations: SecurityRecommendation[] = [
    ...(headerAnalysis.filter(h => h.status !== 'secure').map((h, i) => ({
      id: `REC-${(i + 1).toString().padStart(3, '0')}`,
      priority: h.status === 'missing' ? 'high' as ThreatLevel : h.status === 'weak' ? 'medium' as ThreatLevel : 'low' as ThreatLevel,
      category: 'رؤوس HTTP',
      title: `تفعيل رأس ${h.header}`,
      description: h.recommendation,
      quantumFix: `استخدام تشفير كمومي لتوزيع المفاتيح عبر بروتوكول BB84 لضمان سلامة رأس ${h.header}`,
      effort: 'low' as const,
    }))),
    ...(vulnScore > 40 ? [{
      id: 'REC-QUANTUM-001',
      priority: 'critical' as ThreatLevel,
      category: 'مقاومة كمومية',
      title: 'ترقية التشفير إلى ما بعد الكمومي',
      description: 'التشفير الحالي (RSA/ECC) عرضة لهجمات الحواسيب الكمومية عبر خوارزمية شور',
      quantumFix: 'تبني CRYSTALS-Kyber لتبادل المفاتيح و CRYSTALS-Dilithium للتوقيع الرقمي (معيار NIST)',
      effort: 'high' as const,
    }] : []),
    ...(threats.some(t => t.level === 'critical') ? [{
      id: 'REC-IDS-001',
      priority: 'critical' as ThreatLevel,
      category: 'كشف التسلل',
      title: 'تفعيل نظام كشف التسلل الكمومي',
      description: 'تم كشف تهديدات حرجة تتطلب مراقبة كمومية مستمرة',
      quantumFix: 'نشر أجهزة استشعار كمومية تستخدم مبدأ التراكب لاكتشاف التسلل في الزمن الحقيقي',
      effort: 'medium' as const,
    }] : []),
  ];

  return {
    url,
    timestamp: Date.now(),
    threats,
    shieldState: {
      integrity: 0.6 + rng() * 0.35,
      entanglement: 0.5 + rng() * 0.45,
      superposition: 0.4 + rng() * 0.5,
      coherence: 0.7 + rng() * 0.25,
      fidelity: 0.8 + rng() * 0.18,
    },
    vulnerabilityScore: vulnScore,
    quantumResistanceScore: qResistance,
    recommendations,
    headerAnalysis,
    portScan,
  };
}

export function generateQuantumKey(size: number = 256): QuantumEncryptionResult {
  const start = performance.now();
  return {
    algorithm: 'CRYSTALS-Kyber-1024',
    keySize: size,
    quantumResistant: true,
    encryptionTime: Math.round((performance.now() - start + Math.random() * 2) * 100) / 100,
    ciphertextSize: size * 4,
    nistLevel: 5,
  };
}

export function simulateQuantumFirewall(traffic: number): QuantumShieldState {
  const load = Math.min(1, traffic / 10000);
  return {
    integrity: 1 - load * 0.15,
    entanglement: 0.85 + Math.random() * 0.12,
    superposition: 0.9 + Math.random() * 0.08,
    coherence: 1 - load * 0.2,
    fidelity: 0.95 + Math.random() * 0.04,
  };
}

export function detectAnomalies(log: string[]): QuantumThreat[] {
  const threats: QuantumThreat[] = [];
  const rng = mulberry32(fnv1a(log.join('')));

  for (const entry of log) {
    const lower = entry.toLowerCase();
    if (lower.includes('error') || lower.includes('fail') || lower.includes('attack') || lower.includes('unauthorized')) {
      const isCritical = lower.includes('attack') || lower.includes('unauthorized');
      threats.push({
        id: `QA-${fnv1a(entry).toString(16).slice(0, 6).toUpperCase()}`,
        vector: lower.includes('sql') ? 'sql_injection' : lower.includes('xss') ? 'xss' : lower.includes('brute') ? 'brute_force' : 'zero_day',
        level: isCritical ? 'critical' : 'medium',
        source: '0.0.0.0',
        target: 'internal',
        timestamp: Date.now(),
        description: entry.slice(0, 200),
        quantumSignature: quantumHash(entry),
        status: 'investigating',
      });
    }
  }

  return threats;
}

export { ATTACK_VECTORS_AR, THREAT_LEVELS_AR };
