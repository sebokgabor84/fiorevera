// @vitest-environment node
/**
 * The owner's language standard (2026-11-21): Hungarian, German and English texts read as an
 * educated native speaker's, without calques and without IT slang.
 *
 * Style cannot be tested, a list of words can. The words the owner rejected are ONE table, in
 * .agent/skills/cms-coordinator/resources/dialogue-hu.md ("Rejected words"). This test reads that
 * table and fails when one of its words appears in a Hungarian text a person reads: the site copy,
 * the owner's guide, the agent's model sentences and the scripts whose words reach the owner.
 * German and English have no such list: i18n-guardian's veto and the owner's review are the gate.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string): string => readFileSync(path.join(ROOT, rel), 'utf8');
const walk = (rel: string): string[] =>
  existsSync(path.join(ROOT, rel))
    ? readdirSync(path.join(ROOT, rel)).flatMap((name) => {
        const child = path.join(rel, name);
        return statSync(path.join(ROOT, child)).isDirectory() ? walk(child) : [child];
      })
    : [];

const DIALOGUE = '.agent/skills/cms-coordinator/resources/dialogue-hu.md';
/** Above this heading the dialogue file states the rule and may name the rejected words; below it are the sentences the agent says. */
const MODEL_SENTENCES = '## Opening and questions';

interface Rejected {
  stem: string;
  instead: string;
}

/** The rows of the "Rejected words" table. */
function rejectedWords(): Rejected[] {
  const section = read(DIALOGUE).split(/^## /m).find((part) => part.startsWith('Rejected words'));
  if (!section) throw new Error(`${DIALOGUE} has no "Rejected words" section`);
  return [...section.matchAll(/^\| `([^`]+)` \| (.+?) \|$/gm)].map((row) => ({ stem: row[1], instead: row[2] }));
}

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every rejected word in `text`, as `line: word → replacement`. */
function findings(text: string, words: readonly Rejected[]): string[] {
  const found: string[] = [];
  text.split('\n').forEach((line, index) => {
    for (const word of words) if (new RegExp(escape(word.stem), 'i').test(line)) found.push(`line ${index + 1}: "${word.stem}" → ${word.instead}`);
  });
  return found;
}

/** A word of the table that is right in one place (a guest's own words, a different meaning). Rewrite your own sentence instead of adding a row here. */
const ALLOWED: { file: string; phrase: string; why: string }[] = [];

/** The Hungarian texts a person reads. */
const OWNER_FACING: string[] = [
  'src/i18n/locales/hu.json',
  ...walk('src/data').filter((file) => file.endsWith('.ts') && !file.includes('/generated/')),
  'docs/vera-agent/utmutato.md',
  ...walk('.agent/skills/cms-coordinator').filter((file) => file !== DIALOGUE),
  ...walk('.agent/skills/goodmorning'),
  ...walk('.agent/skills/goodbye'),
  ...walk('.claude/skills'),
  ...walk('.claude/agents'),
  ...walk('scripts/content'),
  ...walk('scripts/release'),
  'scripts/visual-review-page.ts',
];

describe("the owner's language standard", () => {
  const words = rejectedWords();

  it('the table of rejected words is readable and every word has its replacement', () => {
    expect(words.length).toBeGreaterThanOrEqual(10);
    for (const word of words) {
      expect(word.stem.trim().length, `"${word.stem}" is too short to be a safe word stem`).toBeGreaterThanOrEqual(5);
      expect(word.instead.trim()).not.toBe('');
    }
    expect(new Set(words.map((word) => word.stem.toLowerCase())).size).toBe(words.length);
  });

  it('the check finds the sentence the owner rejected, and passes the sentence that replaced it', () => {
    expect(findings('Semmi nem kerül ki az igened nélkül.', words).length).toBeGreaterThanOrEqual(3);
    expect(findings('A jóváhagyásod nélkül semmi sem jelenik meg az oldalon.', words)).toEqual([]);
    // a photo may be sharp: "éles" alone is not slang
    expect(findings('A kép felbontása túl kicsi ahhoz, hogy élesen jelenjen meg.', words)).toEqual([]);
  });

  it('no rejected word in the site copy, the guide, the model sentences or the scripts that speak to the owner', () => {
    const files = OWNER_FACING.filter((file) => existsSync(path.join(ROOT, file)));
    expect(files.length).toBeGreaterThan(20);
    const found: string[] = [];
    for (const file of files) for (const finding of findings(read(file), words)) found.push(`${file} ${finding}`);
    const dialogue = read(DIALOGUE);
    const from = dialogue.indexOf(MODEL_SENTENCES);
    expect(from, `${DIALOGUE} lost its "${MODEL_SENTENCES}" heading`).toBeGreaterThan(0);
    const offset = dialogue.slice(0, from).split('\n').length - 1;
    for (const finding of findings(dialogue.slice(from), words)) found.push(`${DIALOGUE} ${finding.replace(/^line (\d+)/, (_, line: string) => `line ${Number(line) + offset}`)}`);
    const open = found.filter((entry) => !ALLOWED.some((allowed) => entry.startsWith(`${allowed.file} `) && entry.includes(`"${allowed.phrase}"`)));
    expect(open, 'rewrite the sentence (see the "Write instead" column of the table)').toEqual([]);
  });

  it('the standard is written where sessions read their rules, and each place points to the one table', () => {
    for (const file of ['AGENTS.md', '.agent/skills/i18n-guardian/SKILL.md', '.agent/skills/cms-coordinator/SKILL.md']) {
      const text = read(file);
      expect(text, `${file} does not state the language standard`).toMatch(/educated/);
      expect(text, `${file} does not point to the table of rejected words`).toContain('dialogue-hu.md');
      expect(text, `${file} does not name the test`).toContain('tests/unit/language.test.ts');
    }
  });
});
