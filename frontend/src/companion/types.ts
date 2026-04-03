/**
 * ============================================================
 * companion/types.ts – أنواع نظام الرفيق الكمي
 * Quantum Companion System – مُقتبس من نظام Buddy/Tamagotchi
 * ============================================================
 * نظام رفيق افتراضي يظهر كجسيم كمي متحرك بجانب لوحة التحكم.
 * كل مستخدم يحصل على رفيق حتمي مبني من معرّف الجلسة.
 */

// ─── مستويات الندرة ─────────────────────────────────────────
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
} as const;

export const RARITY_FLOOR: Record<Rarity, number> = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
};

export const RARITY_STARS: Record<Rarity, string> = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  epic: '★★★★',
  legendary: '★★★★★',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#888',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

// ─── أنواع الجسيمات الكمية (18 نوع) ─────────────────────────
export const SPECIES = [
  'qubit', 'photon', 'electron', 'neutrino', 'muon', 'gluon',
  'boson', 'fermion', 'hadron', 'meson', 'tachyon', 'graviton',
  'positron', 'proton', 'neutron', 'quark', 'lepton', 'plasmon',
] as const;
export type Species = (typeof SPECIES)[number];

// ─── أنماط العيون ─────────────────────────────────────────────
export const EYES = ['·', '✦', '◉', '⊙', '◈', '°'] as const;
export type Eye = (typeof EYES)[number];

// ─── أنماط الهالة (بدل القبعة) ──────────────────────────────
export const HALOS = [
  'none', 'quantum', 'entangled', 'superposed',
  'coherent', 'tunneling', 'orbital', 'wave',
] as const;
export type Halo = (typeof HALOS)[number];

// ─── أسماء الإحصائيات ────────────────────────────────────────
export const STAT_NAMES = ['COHERENCE', 'ENTANGLEMENT', 'SPIN', 'ENERGY', 'CHARM'] as const;
export type StatName = (typeof STAT_NAMES)[number];

// ─── الهيكل العظمي (حتمي، لا يُخزن) ────────────────────────
export interface CompanionBones {
  rarity: Rarity;
  species: Species;
  eye: Eye;
  halo: Halo;
  shiny: boolean;
  stats: Record<StatName, number>;
}

// ─── الروح (مولّدة، تُخزن) ──────────────────────────────────
export interface CompanionSoul {
  name: string;
  personality: string;
}

// ─── الرفيق المخزّن ─────────────────────────────────────────
export interface StoredCompanion extends CompanionSoul {
  hatchedAt: number;
}

// ─── الرفيق الكامل (وقت التشغيل) ───────────────────────────
export interface Companion extends CompanionBones, CompanionSoul {
  hatchedAt: number;
}

// ─── نتيجة القرعة ────────────────────────────────────────────
export interface Roll {
  bones: CompanionBones;
  inspirationSeed: number;
}
