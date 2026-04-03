/**
 * ============================================================
 * skills/types.ts - انواع نظام المهارات
 * Skills System - مقتبس من نظام Skills
 * ============================================================
 */

export type SkillSource = 'bundled' | 'disk' | 'plugin' | 'mcp';

export interface SkillDefinition {
  name: string;
  description: string;
  source: SkillSource;
  aliases?: string[];
  whenToUse?: string;
  argumentHint?: string;
  allowedTools?: string[];
  isEnabled?: () => boolean;
  context?: 'inline' | 'fork';
  tags?: string[];
  getPrompt: (args: string) => Promise<string>;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  origin?: string;
  tools?: string;
  'argument-hint'?: string;
  'when-to-use'?: string;
  context?: 'inline' | 'fork';
  tags?: string;
}

export interface LoadedSkill extends SkillDefinition {
  filePath?: string;
  content?: string;
  frontmatter?: SkillFrontmatter;
}
