/**
 * Mock Data & Fixtures
 * ====================
 * Reusable test data for consistent testing
 */

/**
 * User Fixtures
 */
export const userFixtures = {
  admin: {
    id: 'admin_1',
    email: 'admin@qurabia.com',
    name: 'المسؤول',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T12:00:00Z',
  },

  user: {
    id: 'user_1',
    email: 'user@qurabia.com',
    name: 'مستخدم عادي',
    role: 'user',
    permissions: ['read'],
    createdAt: '2024-01-10T00:00:00Z',
    lastLogin: '2024-01-15T10:00:00Z',
  },

  researcher: {
    id: 'researcher_1',
    email: 'researcher@qurabia.com',
    name: 'باحث',
    role: 'researcher',
    permissions: ['read', 'write', 'experiment'],
    createdAt: '2024-01-05T00:00:00Z',
    lastLogin: '2024-01-15T11:00:00Z',
  },
};

/**
 * Quantum Circuit Fixtures
 */
export const quantumCircuitFixtures = {
  bell_state: {
    name: 'حالة بيل',
    numQubits: 2,
    gates: [
      { type: 'H', qubit: 0 },
      { type: 'CNOT', control: 0, target: 1 },
    ],
    description: 'Creates an entangled Bell state |Φ+⟩',
  },

  ghz_state: {
    name: 'حالة GHZ',
    numQubits: 3,
    gates: [
      { type: 'H', qubit: 0 },
      { type: 'CNOT', control: 0, target: 1 },
      { type: 'CNOT', control: 1, target: 2 },
    ],
    description: 'Creates a 3-qubit GHZ state',
  },

  qft_2qubit: {
    name: 'تحويل فورييه الكمومي (2 كيوبت)',
    numQubits: 2,
    gates: [
      { type: 'H', qubit: 0 },
      { type: 'CPHASE', control: 1, target: 0, angle: Math.PI / 2 },
      { type: 'H', qubit: 1 },
    ],
    description: '2-qubit Quantum Fourier Transform',
  },

  grover_2qubit: {
    name: 'خوارزمية جروفر (2 كيوبت)',
    numQubits: 2,
    gates: [
      { type: 'H', qubit: 0 },
      { type: 'H', qubit: 1 },
      { type: 'CZ', control: 0, target: 1 }, // Oracle
      { type: 'H', qubit: 0 },
      { type: 'H', qubit: 1 },
      { type: 'X', qubit: 0 },
      { type: 'X', qubit: 1 },
      { type: 'CZ', control: 0, target: 1 }, // Diffusion
      { type: 'X', qubit: 0 },
      { type: 'X', qubit: 1 },
      { type: 'H', qubit: 0 },
      { type: 'H', qubit: 1 },
    ],
    description: "Grover's search for 2 qubits",
  },
};

/**
 * Quantum State Fixtures
 */
export const quantumStateFixtures = {
  zero: {
    numQubits: 1,
    amplitudes: [
      { re: 1, im: 0 },
      { re: 0, im: 0 },
    ],
    description: '|0⟩ state',
  },

  one: {
    numQubits: 1,
    amplitudes: [
      { re: 0, im: 0 },
      { re: 1, im: 0 },
    ],
    description: '|1⟩ state',
  },

  plus: {
    numQubits: 1,
    amplitudes: [
      { re: 0.7071067811865476, im: 0 },
      { re: 0.7071067811865476, im: 0 },
    ],
    description: '|+⟩ = (|0⟩ + |1⟩)/√2 state',
  },

  minus: {
    numQubits: 1,
    amplitudes: [
      { re: 0.7071067811865476, im: 0 },
      { re: -0.7071067811865476, im: 0 },
    ],
    description: '|−⟩ = (|0⟩ − |1⟩)/√2 state',
  },

  bell_phi_plus: {
    numQubits: 2,
    amplitudes: [
      { re: 0.7071067811865476, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 },
      { re: 0.7071067811865476, im: 0 },
    ],
    description: '|Φ+⟩ = (|00⟩ + |11⟩)/√2 Bell state',
  },
};

/**
 * API Response Fixtures
 */
export const apiResponseFixtures = {
  success: {
    status: 'success',
    data: { result: 'ok' },
    timestamp: Date.now(),
  },

  error: {
    status: 'error',
    error: {
      code: 'BAD_REQUEST',
      message: 'طلب غير صحيح',
      details: 'المعاملات المطلوبة مفقودة',
    },
    timestamp: Date.now(),
  },

  autdieDecision: {
    status: 'success',
    data: {
      decision: 'approve',
      confidence: 0.92,
      reasoning: 'تحليل متعدد الأبعاد يشير إلى قرار إيجابي',
      factors: {
        trust: 0.95,
        uncertainty: 0.15,
        temporal: 0.88,
        dimensional: 0.90,
        innovation: 0.94,
        ethical: 0.96,
      },
      recommendations: ['المتابعة بحذر', 'مراقبة المؤشرات الأخلاقية'],
    },
    timestamp: Date.now(),
  },

  alUtaibiResult: {
    status: 'success',
    data: {
      result: 42.857,
      equation: 'U(x,t) = ∫∫∫ Ψ(x,t) dx dt dE',
      variables: {
        x: 'position',
        t: 'time',
        E: 'energy',
      },
      convergence: true,
      iterations: 15,
    },
    timestamp: Date.now(),
  },
};

/**
 * Equation Fixtures
 */
export const equationFixtures = {
  einstein_mass_energy: {
    id: 'eq_001',
    name: 'معادلة أينشتاين للطاقة',
    expression: 'E = mc²',
    variables: {
      E: { name: 'Energy', unit: 'J', description: 'الطاقة' },
      m: { name: 'Mass', unit: 'kg', description: 'الكتلة' },
      c: { name: 'Speed of Light', unit: 'm/s', value: 299792458, description: 'سرعة الضوء' },
    },
    category: 'physics',
  },

  schrodinger: {
    id: 'eq_002',
    name: 'معادلة شرودنجر',
    expression: 'iℏ∂ψ/∂t = Ĥψ',
    variables: {
      ψ: { name: 'Wave function', description: 'دالة الموجة' },
      ℏ: { name: 'Reduced Planck constant', value: 1.054571817e-34, description: 'ثابت بلانك المختزل' },
      Ĥ: { name: 'Hamiltonian operator', description: 'مؤثر هاميلتون' },
    },
    category: 'quantum',
  },

  al_utaibi_v2: {
    id: 'eq_003',
    name: 'معادلة العتيبي v2.0',
    expression: 'U(x,t) = ∑ᵢ αᵢΨᵢ(x,t) × e^(iθᵢ)',
    variables: {
      U: { name: 'Unified field', description: 'المجال الموحد' },
      α: { name: 'Amplitude coefficients', description: 'معاملات السعة' },
      Ψ: { name: 'Basis states', description: 'الحالات الأساسية' },
      θ: { name: 'Phase angles', description: 'زوايا الطور' },
    },
    category: 'unified',
  },
};

/**
 * Arabic Text Fixtures
 */
export const arabicTextFixtures = {
  short: 'السلام عليكم',
  medium: 'مرحباً بكم في منصة قرابيا للذكاء الاصطناعي والحوسبة الكمومية',
  long: `قرابيا منصة عربية رائدة تجمع بين الذكاء الاصطناعي والحوسبة الكمومية.
    نهدف إلى بناء جسر بين الحضارة العربية وتقنيات المستقبل.
    نقدم أدوات متقدمة للباحثين والمطورين في المنطقة العربية.`,

  morphology: {
    verb: 'كتب',
    noun: 'كتاب',
    adjective: 'كبير',
    sentence: 'كتب الطالب الدرس في الكتاب الكبير',
  },

  scientific: {
    physics: 'الفيزياء الكمومية تدرس سلوك الجسيمات على المستوى الذري',
    chemistry: 'الكيمياء الكمومية تطبق مبادئ ميكانيكا الكم على الأنظمة الكيميائية',
    math: 'الرياضيات هي لغة العلوم الطبيعية والهندسة',
  },
};

/**
 * Performance Benchmarks
 */
export const performanceBenchmarks = {
  quantumSimulation: {
    twoQubits: { maxTime: 10, description: 'محاكاة 2 كيوبت' },
    fourQubits: { maxTime: 50, description: 'محاكاة 4 كيوبت' },
    eightQubits: { maxTime: 500, description: 'محاكاة 8 كيوبت' },
  },

  rendering: {
    componentMount: { maxTime: 100, description: 'تحميل المكون' },
    stateUpdate: { maxTime: 50, description: 'تحديث الحالة' },
    visualization: { maxTime: 200, description: 'رسم التصور' },
  },

  api: {
    health: { maxTime: 100, description: 'فحص الصحة' },
    autdie: { maxTime: 1000, description: 'محرك AUTDIE' },
    alUtaibi: { maxTime: 2000, description: 'معادلة العتيبي' },
  },
};

/**
 * Error Fixtures
 */
export const errorFixtures = {
  validation: {
    code: 'VALIDATION_ERROR',
    message: 'خطأ في التحقق من البيانات',
    details: { field: 'email', reason: 'صيغة البريد الإلكتروني غير صحيحة' },
  },

  authentication: {
    code: 'AUTH_ERROR',
    message: 'خطأ في المصادقة',
    details: 'الرمز المميز منتهي الصلاحية',
  },

  authorization: {
    code: 'FORBIDDEN',
    message: 'غير مصرح',
    details: 'ليس لديك الصلاحيات الكافية',
  },

  notFound: {
    code: 'NOT_FOUND',
    message: 'غير موجود',
    details: 'المورد المطلوب غير موجود',
  },

  serverError: {
    code: 'INTERNAL_ERROR',
    message: 'خطأ في الخادم',
    details: 'حدث خطأ غير متوقع',
  },
};
