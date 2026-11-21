/**
 * scripts/content/doctor.ts — `npm run content:doctor`
 *
 * What can this machine do for a content change? Run at the start of every CMS Coordinator session,
 * so a missing tool is found before the owner is in the middle of an album. Read-only.
 * The answer is ONE JSON object: `canPrepare` (a change can be made and checked here) and
 * `canPublish` (it can also be put live from here), with the reason for every "no".
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baselineHistory, baselineSet, healthy, sizeReport } from '../visual-baseline-size.mjs';
import { describeOperators, loadOperators, todaySession } from '../release/operator';
import { tryGit } from './lib/checkout';
import { loadState, validateState } from './lib/state';

export interface Check {
  name: string;
  ok: boolean;
  /** 'prepare' = needed to make and check a change; 'publish' = needed to put it live; 'info' = good to know. */
  needs: 'prepare' | 'publish' | 'info';
  detail: string;
}

const probe = (command: string, args: string[]): string | null => {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
};

export function doctor(root: string): { canPrepare: boolean; canPublish: boolean; checks: Check[] } {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, needs: Check['needs'], detail: string): void => void checks.push({ name, ok, needs, detail });

  add(
    'platform',
    process.platform === 'darwin',
    'prepare',
    process.platform === 'darwin' ? 'macOS: the comparison pictures in the repository were recorded on macOS and can be compared here' : `${process.platform}: the comparison pictures were recorded on macOS; on this system most screens would show as changed`
  );
  const major = Number(process.versions.node.split('.')[0]);
  add('node', major >= 22, 'prepare', `Node ${process.versions.node}${major >= 22 ? '' : ' — the project needs Node 22 or newer'}`);
  const installed = existsSync(path.join(root, 'node_modules/.bin/vitest')) && existsSync(path.join(root, 'node_modules/.bin/playwright'));
  add('dependencies', installed, 'prepare', installed ? 'installed' : 'node_modules is missing — run: npm ci');

  const branch = tryGit(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  add('git', branch !== null, 'prepare', branch === null ? 'not a git checkout' : `on branch ${branch}`);
  const hooks = tryGit(root, ['config', 'core.hooksPath']);
  add('git hooks', Boolean(hooks?.endsWith('.githooks')), 'prepare', hooks?.endsWith('.githooks') ? `installed (${hooks})` : 'not installed — run: npm run prepare');

  let contentProblems: string[];
  try {
    contentProblems = validateState(loadState(root));
  } catch (error) {
    contentProblems = [error instanceof Error ? error.message : String(error)];
  }
  add('content', contentProblems.length === 0, 'prepare', contentProblems.length ? `the content is invalid as it is: ${contentProblems[0]}` : 'valid');

  if (process.platform === 'darwin') {
    add('iPhone photos (HEIC)', existsSync('/usr/bin/sips'), 'info', existsSync('/usr/bin/sips') ? 'can be converted (sips)' : 'sips is missing — HEIC photos must be exported as JPEG first');
  } else add('iPhone photos (HEIC)', false, 'info', 'only convertible on a Mac — HEIC photos must be exported as JPEG first');

  const gh = probe('gh', ['--version']);
  add('GitHub CLI (gh)', gh !== null, 'publish', gh ? gh.split('\n')[0] : 'not installed — a change can be prepared here but not put live; install with: brew install gh');
  if (gh !== null) {
    const signedIn = probe('gh', ['auth', 'status']) !== null;
    add('GitHub sign-in', signedIn, 'publish', signedIn ? 'signed in' : 'not signed in — run once: gh auth login');
  }
  const people = describeOperators(loadOperators());
  add(
    'approvers (PIN)',
    people.people.length > 0,
    'publish',
    people.people.length
      ? `${people.people.map((person) => `${person.name} (${person.role})`).join(', ')}; today at the keyboard: ${todaySession()?.name ?? 'not said yet (npm run content:morning -- --as <id>)'}`
      : 'nobody is set up on this machine — the technical owner runs once: npm run release:operator -- --set <id> --role admin --name "<name>"'
  );
  const remote = tryGit(root, ['remote', 'get-url', 'origin']);
  add('remote', Boolean(remote), 'publish', remote ?? 'no origin remote');

  const originals = existsSync(path.join(root, 'assets-src'));
  add('photo originals (assets-src/)', true, 'info', originals ? 'a local archive exists; `npm run optimize:assets` still refuses to shrink the manifest' : 'none on this machine — normal; photos are added through `npm run content`, never through `npm run optimize:assets`');

  const set = baselineSet(root);
  const history = baselineHistory(root);
  add('comparison pictures (size)', healthy(set, history), 'info', sizeReport({ set, history }).join(' | '));

  const need = (kind: Check['needs']): boolean => checks.filter((check) => check.needs === kind).every((check) => check.ok);
  return { canPrepare: need('prepare'), canPublish: need('prepare') && need('publish'), checks };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(doctor(process.cwd()), null, 2));
}
