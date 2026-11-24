// @vitest-environment node
/**
 * No dead documentation. The docs an agent or an owner acts on must name commands, operations and
 * files that exist. This test reads them and fails when one drifts from the code — the same idea
 * as the skill registry gate (tests/unit/skills.test.ts), for everything a session is told to run
 * or read.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { OPERATIONS, run } from '../../scripts/content/cli';

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string): string => readFileSync(path.join(ROOT, rel), 'utf8');
const walk = (rel: string): string[] =>
  existsSync(path.join(ROOT, rel))
    ? readdirSync(path.join(ROOT, rel)).flatMap((name) => {
        const child = path.join(rel, name);
        return statSync(path.join(ROOT, child)).isDirectory() ? walk(child) : [child];
      })
    : [];

/** The documents a session acts on. Historical records (harvest notes, QA reports, launch plans, the archived project plan) are not in it. */
const LIVING_DOCS = [
  'README.md',
  'CLAUDE.md',
  'AGENTS.md',
  ...walk('.agent/skills').filter((file) => file.endsWith('.md')),
  ...walk('.claude/skills').filter((file) => file.endsWith('.md')),
  ...walk('.claude/agents').filter((file) => file.endsWith('.md')),
  ...walk('.claude/rules').filter((file) => file.endsWith('.md')),
  ...walk('docs/decisions'),
  'docs/vera-agent/utmutato.md',
  'docs/qa/visual-review-process.md',
  'docs/ci/README.md',
  'docs/template/README.md',
].filter((file) => existsSync(path.join(ROOT, file)));

describe('documentation names things that exist', () => {
  const scripts = Object.keys((JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts);

  it('every `npm run <script>` in the living docs is a script of package.json', () => {
    const unknown: string[] = [];
    for (const file of LIVING_DOCS) {
      for (const match of read(file).matchAll(/npm run (?:--silent )?([a-z][a-z0-9:-]*)/g)) {
        const name = match[1];
        const known = scripts.includes(name) || (name.endsWith(':') && scripts.some((script) => script.startsWith(name)));
        if (!known) unknown.push(`${file}: npm run ${name}`);
      }
    }
    expect([...new Set(unknown)]).toEqual([]);
  });

  it('every content operation is in the command help and in the catalogue the agent reads, and the catalogue invents none', async () => {
    const help = ((await run(['help'], ROOT)) as { operations: Record<string, string> }).operations;
    expect(Object.keys(help).sort()).toEqual([...OPERATIONS].sort());
    const catalogue = read('.agent/skills/cms-coordinator/resources/catalogue.md');
    for (const operation of OPERATIONS) expect(catalogue, `catalogue.md does not document "${operation}"`).toMatch(new RegExp(`\`${operation}[ \`]`));
    // an operation-shaped word in the catalogue is a real operation or a refusal code the scripts really give
    const codes = new Set(
      walk('scripts/content')
        .filter((file) => file.endsWith('.ts'))
        .flatMap((file) => [...read(file).matchAll(/ContentError\('([a-z-]+)'/g)].map((match) => match[1]))
    );
    const mentioned = [...catalogue.matchAll(/`((?:album|photos|rental|testimonial|contact|areas|text)-[a-z]+)[ `]/g)].map((match) => match[1]);
    expect([...new Set(mentioned)].filter((word) => !OPERATIONS.includes(word) && !codes.has(word))).toEqual([]);
    // … and every refusal code the catalogue promises exists
    const promised = [...catalogue.matchAll(/`([a-z]+(?:-[a-z]+)+)`/g)].map((match) => match[1]).filter((word) => !OPERATIONS.includes(word) && /-(missing|invalid|unknown|featured|removed|range|small|unreadable|count|duplicate|photo|album|item|testimonial|empty)$/.test(word));
    expect(promised.filter((code) => !codes.has(code))).toEqual([]);
  });

  it('every repository path named in the new skills, the decision log and the owner\'s guide exists', () => {
    /** Named before they exist, on purpose. */
    const NOT_YET: Record<string, string> = {
      'docs/vera-agent/changelog.md': 'written by the release script at the first content release',
    };
    const files = LIVING_DOCS.filter((file) => /cms-coordinator|tech-lead|goodmorning|docs\/decisions|utmutato|docs\/template|\.claude\/rules|\.claude\/agents\/explore|^CLAUDE\.md$/.test(file));
    expect(files.length).toBeGreaterThan(8);
    const missing: string[] = [];
    for (const file of files) {
      for (const match of read(file).matchAll(/`((?:\.agent|\.claude|\.githooks|docs|scripts|src|tests|public)\/[^`\s]+)`/g)) {
        const target = match[1].replace(/[.,;:]$/, '');
        if (/[*<>{}…|]|NNNN/.test(target) || target in NOT_YET) continue; // patterns and placeholders are not paths
        if (!existsSync(path.join(ROOT, target))) missing.push(`${file}: ${target}`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  it('the skills a slash command points to exist, and the agent definition reads real files', () => {
    for (const pointer of walk('.claude/skills').filter((file) => file.endsWith('SKILL.md'))) {
      const name = path.basename(path.dirname(pointer));
      expect(existsSync(path.join(ROOT, '.agent/skills', name, 'SKILL.md')), `${pointer} points to a skill that is not in the registry`).toBe(true);
      expect(read(pointer)).toContain(`.agent/skills/${name}/SKILL.md`);
    }
  });
});
