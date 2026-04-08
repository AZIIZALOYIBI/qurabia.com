/**
 * ============================================================
 * skills/index.ts - تصدير نظام المهارات
 * ============================================================
 */
export type { SkillSource, SkillDefinition, SkillFrontmatter, LoadedSkill } from './types';
export {
  registerSkill,
  getSkills,
  getSkill,
  getSkillsBySource,
  clearSkills,
  parseFrontmatter,
  loadSkillFromMarkdown,
  initBundledSkills,
} from './skillsRegistry';
