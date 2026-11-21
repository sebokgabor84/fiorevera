/**
 * scripts/content/lib/changelog.ts — docs/vera-agent/changelog.md, the owner-readable record of
 * every content change: what, when, approved by whom, where it stands. Written only by the release
 * lane and the escalation hand-over, never by hand. Newest entry first.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const CHANGELOG = 'docs/vera-agent/changelog.md';

/** megjelent = published · visszavonva = rolled back · Gáborra vár = waiting for the technical owner */
export type ChangeState = 'megjelent' | 'visszavonva' | 'Gáborra vár';

export interface ChangeEntry {
  /** YYYY-MM-DD */
  date: string;
  /** In the owner's words, Hungarian: "A fa boldogságkapu ára 19 990 Ft → 21 990 Ft". */
  what: string;
  approvedBy: string;
  state: ChangeState;
  /** Branch of the change (the commit on main is found through it). */
  branch: string;
}

const HEADER = `# Változásnapló — a weboldal tartalma

Minden tartalmi változtatás, amely a CMS-koordinátor közreműködésével készült: mi változott, mikor, ki hagyta jóvá, és milyen állapotban van.
A fájlt a közzétételi szkript írja (\`scripts/release/publish-content.ts\`); kézzel nem szerkesztjük. A legfrissebb bejegyzés áll legfelül.

| Dátum | Mi változott | Jóváhagyta | Állapot | Munkapéldány |
| --- | --- | --- | --- | --- |
`;

const cell = (text: string): string => text.replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();
export const row = (entry: ChangeEntry): string => `| ${entry.date} | ${cell(entry.what)} | ${cell(entry.approvedBy)} | ${entry.state} | \`${cell(entry.branch)}\` |`;

/** Parses the table rows back (for "what changed lately?" and for the rollback). */
export function readChanges(root: string): ChangeEntry[] {
  const file = path.join(root, CHANGELOG);
  return existsSync(file) ? parseChanges(readFileSync(file, 'utf8')) : [];
}

/** The entries of a change log text (for reading the log of another commit, e.g. origin/main). */
export function parseChanges(text: string): ChangeEntry[] {
  return text
    .split('\n')
    .map((line) => /^\| (\d{4}-\d{2}-\d{2}) \| (.*) \| (.*) \| (megjelent|visszavonva|Gáborra vár) \| `(.*)` \|$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ date: m[1], what: m[2], approvedBy: m[3], state: m[4] as ChangeState, branch: m[5] }));
}

/** Adds an entry at the top of the table; an entry for the same branch is replaced (its state moved on). */
export function recordChange(root: string, entry: ChangeEntry): void {
  const file = path.join(root, CHANGELOG);
  const rest = readChanges(root).filter((existing) => existing.branch !== entry.branch);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}${[entry, ...rest].map(row).join('\n')}\n`);
}
