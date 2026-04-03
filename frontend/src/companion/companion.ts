/**
 * ============================================================
 * companion/companion.ts – منطق توليد الرفيق الكمي
 * Quantum Companion System
 * ============================================================
 * يستخدم PRNG حتمي (mulberry32) لتوليد رفيق فريد من معرّف المستخدم.
 */

import {
  type CompanionBones,
  type Rarity,
  type Roll,
  type StatName,
  RARITIES,
  RARITY_WEIGHTS,
  RARITY_FLOOR,
  SPECIES,
  EYES,
  HALOS,
  STAT_NAMES,
} from './types';

const SALT = 'qurabia-quantum-2026';

// ─── FNV-1a 32-bit hash ─────────────────────────────────────
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ─── Mulberry32 PRNG ─────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── اختيار عنصر عشوائي من مصفوفة ──────────────────────────
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── اختيار الندرة بالأوزان ─────────────────────────────────
function pickRarity(rng: () => number): Rarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = rng() * totalWeight;
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity];
    if (roll <= 0) return rarity;
  }
  return 'common';
}

// ─── توليد الإحصائيات ────────────────────────────────────────
function rollStats(rng: () => number, rarity: Rarity): Record<StatName, number> {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);

  const stats = {} as Record<StatName, number>;
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, Math.floor(floor + 50 + rng() * 30));
    } else if (name === dump) {
      stats[name] = Math.max(1, Math.floor(floor - 10 + rng() * 15));
    } else {
      stats[name] = Math.floor(floor + rng() * 40);
    }
  }
  return stats;
}

// ─── التوليد الحتمي ─────────────────────────────────────────
function rollFrom(seed: string): Roll {
  const hash = fnv1a(seed + SALT);
  const rng = mulberry32(hash);

  const rarity = pickRarity(rng);
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const halo = rarity === 'common' ? 'none' as const : pick(rng, HALOS);
  const shiny = rng() < 0.01;
  const stats = rollStats(rng, rarity);
  const inspirationSeed = Math.floor(rng() * 0xffffffff);

  return {
    bones: { rarity, species, eye, halo, shiny, stats },
    inspirationSeed,
  };
}

// ─── التخزين المؤقت ─────────────────────────────────────────
let _cachedRoll: { key: string; roll: Roll } | null = null;

/**
 * توليد رفيق حتمي من معرّف المستخدم (مع تخزين مؤقت).
 */
export function roll(userId: string): Roll {
  const key = userId + SALT;
  if (_cachedRoll && _cachedRoll.key === key) return _cachedRoll.roll;
  const result = rollFrom(userId);
  _cachedRoll = { key, roll: result };
  return result;
}

/**
 * توليد رفيق من بذرة عشوائية.
 */
export function rollWithSeed(seed: string): Roll {
  return rollFrom(seed);
}

/**
 * الحصول على معرّف المستخدم للجلسة الحالية.
 */
export function companionUserId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    let id = window.localStorage.getItem('qurabia-companion-id');
    if (!id) {
      id = 'user-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      window.localStorage.setItem('qurabia-companion-id', id);
    }
    return id;
  }
  return 'anon';
}
