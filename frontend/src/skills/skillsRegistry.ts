/**
 * ============================================================
 * skills/skillsRegistry.ts - سجل المهارات
 * Skills System
 * ============================================================
 * يدير تسجيل واكتشاف وتنفيذ المهارات.
 */

import type { LoadedSkill, SkillDefinition, SkillFrontmatter, SkillSource } from './types';

const _registry: Map<string, LoadedSkill> = new Map();

/**
 * تسجيل مهارة جديدة.
 */
export function registerSkill(skill: SkillDefinition): void {
  _registry.set(skill.name, { ...skill });
}

/**
 * الحصول على جميع المهارات المسجلة.
 */
export function getSkills(): LoadedSkill[] {
  return Array.from(_registry.values()).filter((s) => !s.isEnabled || s.isEnabled());
}

/**
 * الحصول على مهارة بالاسم.
 */
export function getSkill(name: string): LoadedSkill | undefined {
  const skill = _registry.get(name);
  if (skill?.isEnabled && !skill.isEnabled()) return undefined;
  return skill;
}

/**
 * الحصول على مهارات حسب المصدر.
 */
export function getSkillsBySource(source: SkillSource): LoadedSkill[] {
  return getSkills().filter((s) => s.source === source);
}

/**
 * مسح السجل (للاختبار).
 */
export function clearSkills(): void {
  _registry.clear();
}

/**
 * تحليل frontmatter من محتوى Markdown.
 */
export function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const frontmatter: Record<string, string> = {};
  let body = content;

  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (match) {
    const fmLines = match[1].split('\n');
    body = match[2];

    for (const line of fmLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, body };
}

/**
 * تحميل مهارة من محتوى Markdown.
 */
export function loadSkillFromMarkdown(filename: string, content: string, source: SkillSource = 'disk'): LoadedSkill {
  const { frontmatter, body } = parseFrontmatter(content);

  const name = frontmatter.name || filename.replace(/\.md$/i, '');
  const description = frontmatter.description || '';
  const tags = frontmatter.tags ? frontmatter.tags.split(',').map((t) => t.trim()) : [];
  const tools = frontmatter.tools ? frontmatter.tools.split(',').map((t) => t.trim()) : undefined;

  return {
    name,
    description,
    source,
    whenToUse: frontmatter['when-to-use'],
    argumentHint: frontmatter['argument-hint'],
    allowedTools: tools,
    context: (frontmatter.context as 'inline' | 'fork') || 'inline',
    tags,
    content: body,
    frontmatter: frontmatter as unknown as SkillFrontmatter,
    getPrompt: async (args: string) => {
      let prompt = body;
      prompt = prompt.replace(/\$ARGUMENTS/g, args);
      return prompt;
    },
  };
}

// ─── المهارات المدمجة ────────────────────────────────────────

/**
 * تهيئة المهارات المدمجة.
 */
export function initBundledSkills(): void {
  registerSkill({
    name: 'analyze',
    description: 'تحليل نتائج المحاكاة الكمية',
    source: 'bundled',
    tags: ['quantum', 'analysis'],
    getPrompt: async (args) => `قم بتحليل النتائج التالية للمحاكاة الكمية وقدم ملخصا شاملا:\n${args}`,
  });

  registerSkill({
    name: 'optimize',
    description: 'تحسين معاملات المحاكاة',
    source: 'bundled',
    tags: ['quantum', 'optimization'],
    getPrompt: async (args) => `قم بتحسين معاملات المحاكاة الكمية التالية لتحقيق افضل اداء:\n${args}`,
  });

  registerSkill({
    name: 'explain',
    description: 'شرح المفاهيم الكمية',
    source: 'bundled',
    tags: ['quantum', 'education'],
    getPrompt: async (args) => `اشرح المفهوم الكمي التالي بطريقة مبسطة وواضحة:\n${args}`,
  });

  registerSkill({
    name: 'debug',
    description: 'تصحيح اخطاء المحاكاة',
    source: 'bundled',
    tags: ['debugging'],
    getPrompt: async (args) => `ساعد في تصحيح الخطا التالي في المحاكاة الكمية:\n${args}`,
  });

  registerSkill({
    name: 'export',
    description: 'تصدير النتائج بتنسيقات مختلفة',
    source: 'bundled',
    tags: ['export', 'data'],
    getPrompt: async (args) => `قم بتصدير البيانات التالية بالتنسيق المطلوب:\n${args}`,
  });
}
