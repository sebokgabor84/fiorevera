/**
 * visual-baseline-size.mjs — how heavy are the pixel baselines, and is that still healthy?
 *
 *   npm run visual:size            the committed set and its weight in the git history
 *   npm run visual:size -- --json
 *
 * The baselines (tests/visual/__screenshots__/) live in the repository by the owner's decision
 * (2026-11-18). Every approved change of a screen adds a new PNG to the history, and history never
 * shrinks by itself, so content releases make the repository grow. This script is the reminder:
 * `npm run test:visual:update` prints it after every re-record, and tests/unit/visualBaselineSize
 * fails when the committed set leaves its budget. The maintenance mechanism itself (pruning old
 * baselines from history, or Git LFS) is a BACKLOG item.
 *
 * Two numbers, two budgets (owner-adjustable constants below):
 *   set      what a checkout holds today          budget 15 MB  (docs/qa/visual-regression-plan.md)
 *   history  every version ever committed          budget 100 MB (then plan the clean-up)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASELINE_DIR = 'tests/visual/__screenshots__';
export const SET_BUDGET = 15 * 1024 * 1024;
export const HISTORY_BUDGET = 100 * 1024 * 1024;
/** From this share of a budget on, the report says "getting full". */
export const WARN_SHARE = 0.75;

const walk = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : [];

/** The PNG files a checkout holds now: count and bytes. */
export function baselineSet(root = process.cwd()) {
  const files = walk(path.join(root, BASELINE_DIR)).filter((file) => file.endsWith('.png'));
  return { files: files.length, bytes: files.reduce((sum, file) => sum + statSync(file).size, 0) };
}

/** The repository at `cwd`, whatever repository a surrounding git hook points at (see scripts/content/lib/checkout.ts). */
const repoEnv = () => Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_(DIR|WORK_TREE|INDEX_FILE|COMMON_DIR|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|PREFIX|IMPLICIT_WORK_TREE|GRAFT_FILE|SHALLOW_FILE|NO_REPLACE_OBJECTS|REPLACE_REF_BASE|CONFIG|CONFIG_PARAMETERS|CONFIG_COUNT)$/.test(name)));

/** Every version of every baseline in the history of HEAD: count and bytes (null outside a git checkout). */
export function baselineHistory(root = process.cwd()) {
  try {
    const objects = execFileSync('git', ['rev-list', '--objects', 'HEAD', '--', BASELINE_DIR], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], env: repoEnv() })
      .split('\n')
      .filter((line) => line.endsWith('.png'))
      .map((line) => line.split(' ')[0]);
    if (objects.length === 0) return { versions: 0, bytes: 0 };
    const sizes = execFileSync('git', ['cat-file', '--batch-check=%(objectsize)'], { cwd: root, encoding: 'utf8', input: `${objects.join('\n')}\n`, maxBuffer: 64 * 1024 * 1024, env: repoEnv() });
    return { versions: objects.length, bytes: sizes.split('\n').filter(Boolean).reduce((sum, size) => sum + Number(size), 0) };
  } catch {
    return null;
  }
}

export const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const verdict = (bytes, budget) => (bytes > budget ? 'OVER BUDGET' : bytes > budget * WARN_SHARE ? 'getting full' : 'healthy');

/**
 * The report lines. `before` (a previous baselineSet()) adds what this re-record changed.
 * @param {{ set: {files:number, bytes:number}, history: {versions:number, bytes:number} | null, before?: {files:number, bytes:number} }} input
 */
export function sizeReport({ set, history, before }) {
  const lines = [];
  const delta = before ? set.bytes - before.bytes : null;
  lines.push(
    `baselines: ${set.files} pictures, ${mb(set.bytes)} of ${mb(SET_BUDGET)} (${Math.round((set.bytes / SET_BUDGET) * 100)} %) — ${verdict(set.bytes, SET_BUDGET)}` +
      (delta === null ? '' : `; this re-record changed the set by ${delta >= 0 ? '+' : '−'}${mb(Math.abs(delta))}`)
  );
  if (history) {
    lines.push(
      `baselines in git history: ${history.versions} versions, ${mb(history.bytes)} of ${mb(HISTORY_BUDGET)} (${Math.round((history.bytes / HISTORY_BUDGET) * 100)} %) — ${verdict(history.bytes, HISTORY_BUDGET)}; ` +
        'every re-record adds its pictures here once it is committed'
    );
  }
  if (set.bytes > SET_BUDGET * WARN_SHARE || (history && history.bytes > HISTORY_BUDGET * WARN_SHARE)) {
    lines.push('baselines: time to plan the clean-up (BACKLOG: baseline maintenance — prune old versions from history or move the pictures to Git LFS).');
  }
  return lines;
}

export const healthy = (set, history) => set.bytes <= SET_BUDGET && (!history || history.bytes <= HISTORY_BUDGET);

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const set = baselineSet();
  const history = baselineHistory();
  if (process.argv.includes('--json')) console.log(JSON.stringify({ set, history, budgets: { set: SET_BUDGET, history: HISTORY_BUDGET }, healthy: healthy(set, history) }, null, 2));
  else for (const line of sizeReport({ set, history })) console.log(line);
}
