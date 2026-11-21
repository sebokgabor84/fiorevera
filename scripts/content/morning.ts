/**
 * scripts/content/morning.ts — `npm run content:morning -- --as <vera|gabor>`
 *
 * The start-of-day routine, as one command with one JSON answer (owner decision 2026-11-21). The
 * agent first ASKS who is at the keyboard, then runs this with the answer. In order:
 *
 *   1. who       records today's person; an admin proves it with the PIN now (scripts/release/operator.ts)
 *   2. machine   what this machine can do for a content change (doctor)
 *   3. checkout  fetch; a clean checkout on `main` that is behind is fast-forwarded; branch, unfinished work
 *   4. record    the last changes and anything that waits for the technical owner (change log)
 *   5. handover  how old the last session's handover note is, in commits and days: a note is a claim
 *                to verify against the repository, never a fact (admin mode reads it; `goodbye` wrote it)
 *   6. site      `npm run verify:live` — is the live site healthy (skipped with --offline)
 *
 * Shaped after the start-of-session routines of the widely used agent repositories (sources:
 * .agent/skills/goodmorning/resources/sources.md): state by code, one explicit command a day, a
 * bounded report, distrust of old notes, nothing modified.
 *
 * `attention` lists, in plain English, everything the person should hear about before work starts;
 * an empty list means "all is well". Nothing here changes content, commits or pushes.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OperatorError, startDay, type DaySession } from '../release/operator';
import { doctor } from './doctor';
import { readChanges, type ChangeEntry } from './lib/changelog';
import { repoEnv, tryGit } from './lib/checkout';

export interface Morning {
  ok: true;
  who: DaySession;
  /** What the role may do today, for the agent's mode. */
  mode: 'content (CMS Coordinator: content changes only)' | 'admin (content changes and, under the release protocol, framework work)';
  canPrepare: boolean;
  canPublish: boolean;
  checkout: { branch: string | null; clean: boolean; behindMain: number; fastForwarded: boolean; unfinished: string[] };
  lastChanges: ChangeEntry[];
  waitingForGabor: ChangeEntry[];
  /** The last session's handover note: when it was last committed and how much has landed since. */
  handover: { file: string; lastCommitted: string | null; commitsSince: number; daysOld: number | null; freshness: 'fresh' | 'aging' | 'stale' | 'missing' };
  site: 'healthy' | 'problem' | 'not-checked';
  attention: string[];
}

const run = (root: string, command: string, args: string[]): { status: number; output: string } => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: repoEnv() });
  return { status: result.status ?? 1, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
};

export const HANDOVER = '.agent/last-session-handover.md';

/** Age of the handover note against `origin/main`: fresh = nothing landed since; stale = more than 10 commits or 7 days. */
export function handoverAge(root: string, now: Date): Morning['handover'] {
  const last = tryGit(root, ['log', '-1', '--format=%H %cs', 'origin/main', '--', HANDOVER]) || tryGit(root, ['log', '-1', '--format=%H %cs', '--', HANDOVER]);
  if (!last) return { file: HANDOVER, lastCommitted: null, commitsSince: 0, daysOld: null, freshness: 'missing' };
  const [sha, day] = last.split(' ');
  const commitsSince = Number(tryGit(root, ['rev-list', '--count', `${sha}..origin/main`]) ?? tryGit(root, ['rev-list', '--count', `${sha}..HEAD`]) ?? 0);
  const daysOld = Math.max(0, Math.floor((now.getTime() - new Date(`${day}T00:00:00`).getTime()) / 86_400_000));
  const freshness = commitsSince > 10 || daysOld > 7 ? 'stale' : commitsSince === 0 ? 'fresh' : 'aging';
  return { file: HANDOVER, lastCommitted: day, commitsSince, daysOld, freshness };
}

export function morning(root: string, who: DaySession, options: { offline?: boolean } = {}): Morning {
  const attention: string[] = [];

  const machine = doctor(root);
  for (const check of machine.checks) if (!check.ok && check.needs !== 'info') attention.push(`${check.name}: ${check.detail}`);
  const size = machine.checks.find((check) => check.name === 'comparison pictures (size)');
  if (size && !size.ok) attention.push(size.detail);

  if (!options.offline) run(root, 'git', ['fetch', '--quiet', '--prune', 'origin']);
  const branch = tryGit(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const dirty = (tryGit(root, ['status', '--porcelain']) ?? '').split('\n').filter(Boolean);
  let behindMain = Number(tryGit(root, ['rev-list', '--count', 'HEAD..origin/main']) ?? 0);
  let fastForwarded = false;
  if (branch === 'main' && dirty.length === 0 && behindMain > 0) {
    fastForwarded = run(root, 'git', ['merge', '--ff-only', 'origin/main']).status === 0;
    if (fastForwarded) behindMain = 0;
  }
  if (branch && branch !== 'main') {
    attention.push(
      branch.startsWith('content/')
        ? `an unfinished content change is open on "${branch}"${dirty.length ? ` (${dirty.length} file(s) changed)` : ''}: continue it, release it or drop it before starting another`
        : `this checkout is on "${branch}", not on main`
    );
  } else if (dirty.length) attention.push(`${dirty.length} changed file(s) on main that belong to no change: ask the technical owner`);
  if (behindMain > 0) attention.push(`this checkout is ${behindMain} change(s) behind the live site's code`);

  const changes = readChanges(root);
  const waitingForGabor = changes.filter((entry) => entry.state === 'Gáborra vár');
  if (waitingForGabor.length) attention.push(`${waitingForGabor.length} change(s) wait for the technical owner: ${waitingForGabor.map((entry) => entry.what).join('; ')}`);

  const handover = handoverAge(root, new Date());
  if (who.role === 'admin' && handover.freshness === 'stale') {
    attention.push(`the handover note is stale (${handover.commitsSince} commit(s) and ${handover.daysOld} day(s) since it was written): verify every claim in it against the repository`);
  }

  let site: Morning['site'] = 'not-checked';
  if (!options.offline) {
    const live = run(root, 'npm', ['run', '--silent', 'verify:live']);
    site = live.status === 0 ? 'healthy' : 'problem';
    if (site === 'problem') attention.push(`the live site check reports a problem — tell the technical owner:\n${live.output.split('\n').slice(-8).join('\n')}`);
  }

  return {
    ok: true,
    who,
    mode: who.role === 'admin' ? 'admin (content changes and, under the release protocol, framework work)' : 'content (CMS Coordinator: content changes only)',
    canPrepare: machine.canPrepare,
    canPublish: machine.canPublish,
    checkout: { branch, clean: dirty.length === 0, behindMain, fastForwarded, unfinished: dirty.slice(0, 20) },
    lastChanges: changes.slice(0, 3),
    waitingForGabor,
    handover,
    site,
    attention,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const as = argv.indexOf('--as');
  try {
    const who = startDay(as >= 0 ? argv[as + 1] : undefined);
    console.log(JSON.stringify(morning(process.cwd(), who, { offline: argv.includes('--offline') }), null, 2));
  } catch (error) {
    const refused = error instanceof OperatorError ? { code: error.code, message: error.message } : { code: 'unexpected', message: error instanceof Error ? error.message : String(error) };
    console.log(JSON.stringify({ ok: false, ...refused }, null, 2));
    process.exitCode = 1;
  }
}
