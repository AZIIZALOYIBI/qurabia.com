/**
 * ============================================================
 * companion/index.ts – تصدير نظام الرفيق الكمي
 * ============================================================
 */
export { roll, rollWithSeed, companionUserId } from './companion';
export { renderSprite, renderFace, spriteFrameCount, IDLE_SEQUENCE, TICK_MS } from './sprites';
export { default as CompanionSprite } from './CompanionSprite';
export type {
  Rarity,
  Species,
  Eye,
  Halo,
  StatName,
  CompanionBones,
  CompanionSoul,
  StoredCompanion,
  Companion,
  Roll,
} from './types';
export {
  RARITIES,
  RARITY_WEIGHTS,
  RARITY_FLOOR,
  RARITY_STARS,
  RARITY_COLORS,
  SPECIES,
  EYES,
  HALOS,
  STAT_NAMES,
} from './types';
