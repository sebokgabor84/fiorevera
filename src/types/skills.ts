/**
 * Fiore Vera — Canonical Skill Registry & Type Contract
 * Single source of truth for all agent skills in the codebase.
 */

export const SKILL_NAMES = [
  'accessibility-expert',
  'design-system-expert',
  'desktop-background-generator',
  'goodbye',
  'grill-me',
  'i18n-guardian',
  'lockscreen-qr-generator',
  'qa-specialist',
  'seo-expert',
  'skill-creator',
  'to-prd',
] as const;

export type SkillName = (typeof SKILL_NAMES)[number];

export type SkillPath = `.agent/skills/${SkillName}/SKILL.md`;

export interface SkillMetadata {
  name: SkillName;
  path: SkillPath;
  description: string;
  triggerKeywords: readonly string[];
  hasExecutableScript: boolean;
}

export type SkillRegistryMap = Record<SkillName, SkillMetadata>;
