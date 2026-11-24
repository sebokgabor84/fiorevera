// @vitest-environment node
/**
 * Boot budget. Every Claude Code session in this repo pays for CLAUDE.md and the handover note before
 * the first prompt, on every turn (token review 2026-11-23). This gate keeps them small and keeps the
 * detail in path-scoped rules, which load only when a matching file is read.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string): string => readFileSync(path.join(ROOT, rel), 'utf8');

/** About 550 tokens. Raise it only with the owner's GO, never to make a red run green. */
const CLAUDE_MD_MAX_CHARS = 2000;
/** The session-start hook prints the first 30 lines of the handover note; nothing below them is seen. */
const HANDOVER_MAX_LINES = 30;
const HANDOVER_MAX_CHARS = 3000;

describe('boot budget', () => {
  it(`CLAUDE.md stays at most ${CLAUDE_MD_MAX_CHARS} characters`, () => {
    expect(read('CLAUDE.md').length).toBeLessThanOrEqual(CLAUDE_MD_MAX_CHARS);
  });

  it(`the handover note stays at most ${HANDOVER_MAX_LINES} lines and ${HANDOVER_MAX_CHARS} characters`, () => {
    const note = read('.agent/last-session-handover.md');
    expect(note.trimEnd().split('\n').length).toBeLessThanOrEqual(HANDOVER_MAX_LINES);
    expect(note.length).toBeLessThanOrEqual(HANDOVER_MAX_CHARS);
  });

  it('every rule in .claude/rules is path-scoped, so none of them loads at launch', () => {
    const dir = path.join(ROOT, '.claude/rules');
    const rules = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')) : [];
    expect(rules.length).toBeGreaterThan(0);
    for (const name of rules) {
      const front = /^---\n([\s\S]*?)\n---\n/.exec(read(`.claude/rules/${name}`));
      expect(front, `${name} has no frontmatter`).not.toBeNull();
      expect(front?.[1] ?? '', `${name} has no paths list`).toMatch(/^paths:\s*\n(\s+- ".+"\n?)+/m);
    }
  });

  it('every rule CLAUDE.md lists exists, and every rule that exists is listed', () => {
    const listed = [...read('CLAUDE.md').matchAll(/`([a-z]+\.md)`/g)].map((match) => match[1]).filter((name) => name !== 'CLAUDE.md' && name !== 'AGENTS.md' && name !== 'BACKLOG.md' && name !== 'MASTER-PLAN.md');
    const present = readdirSync(path.join(ROOT, '.claude/rules')).filter((name) => name.endsWith('.md'));
    expect([...listed].sort()).toEqual([...present].sort());
  });
});
