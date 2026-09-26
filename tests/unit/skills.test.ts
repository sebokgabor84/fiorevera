import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SKILL_NAMES } from '../../src/types/skills';

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const SKILLS_DIR = path.join(PROJECT_ROOT, '.agent/skills');
const AGENTS_MD_PATH = path.join(PROJECT_ROOT, 'AGENTS.md');

describe('Skill Registry & Type Contract Integrity', () => {
  it('should have a physical directory and SKILL.md for every typed SkillName', () => {
    for (const skillName of SKILL_NAMES) {
      const skillFolderPath = path.join(SKILLS_DIR, skillName);
      const skillFilePath = path.join(skillFolderPath, 'SKILL.md');

      expect(fs.existsSync(skillFolderPath), `Skill directory missing: ${skillName}`).toBe(true);
      expect(fs.existsSync(skillFilePath), `SKILL.md missing for: ${skillName}`).toBe(true);
    }
  });

  it('should not have any untyped / orphaned skill directories on disk', () => {
    const onDiskSkills = fs
      .readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const typedSet = new Set<string>(SKILL_NAMES);

    for (const diskSkill of onDiskSkills) {
      expect(
        typedSet.has(diskSkill),
        `Found untyped skill on disk "${diskSkill}". Add it to src/types/skills.ts!`
      ).toBe(true);
    }
  });

  it('should have every typed SkillName listed in AGENTS.md toolbox table', () => {
    expect(fs.existsSync(AGENTS_MD_PATH), 'AGENTS.md file missing!').toBe(true);
    const agentsMdContent = fs.readFileSync(AGENTS_MD_PATH, 'utf-8');

    for (const skillName of SKILL_NAMES) {
      const isMentioned = agentsMdContent.includes(`\`${skillName}\``);
      expect(
        isMentioned,
        `Skill "${skillName}" is defined in TypeScript but missing in AGENTS.md!`
      ).toBe(true);
    }
  });

  it('should enforce AGENT.md deletion and zero dead AGENT.md references in core docs', () => {
    const legacyAgentMdPath = path.join(PROJECT_ROOT, 'AGENT.md');
    expect(
      fs.existsSync(legacyAgentMdPath),
      'Legacy AGENT.md file must not exist! Use canonical AGENTS.md.'
    ).toBe(false);

    // Verify CLAUDE.md and README.md do not reference legacy AGENT.md
    const filesToCheck = ['CLAUDE.md', 'README.md', 'AGENTS.md'];
    for (const relativePath of filesToCheck) {
      const fullPath = path.join(PROJECT_ROOT, relativePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(
          content.includes('AGENT.md'),
          `File "${relativePath}" contains dead reference to legacy AGENT.md! Change to AGENTS.md.`
        ).toBe(false);
      }
    }
  });
});
