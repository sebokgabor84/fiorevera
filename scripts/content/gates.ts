/**
 * scripts/content/gates.ts — `npm run content:gates`
 *
 * Runs the checks of a CONTENT change in order and stops at the first failure:
 *   lint → unit → build → layout (structure at 8 widths) → pictures (pixel comparison) → e2e
 * and writes the result for exactly this state of the checkout to .content/gates.json, which the
 * release lane reads. No step can be skipped and there is no bypass flag.
 *
 * The picture step is different from the others: a content change is SUPPOSED to change pixels.
 * A difference there is not a failure but `review`: the owner looks at the review page
 * (npm run visual:page) and says whether the new look is right. A layout or any other failure is a
 * failure.
 *
 * e2e runs on chromium and Mobile Chrome (docs/vera-agent/PRD.md R6): content cannot change
 * browser-specific behaviour, and the accessibility scan (a11y.spec.ts) is part of that run. Code
 * changes keep the full four-browser run (qa-specialist).
 *
 * The answer is ONE JSON object on stdout; the raw output of every step is in .content/gates/.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeBase, repoEnv, workFingerprint } from './lib/checkout';

export type StepStatus = 'pass' | 'fail' | 'review' | 'not-run';
export interface StepResult {
  name: string;
  status: StepStatus;
  seconds: number;
  log: string;
  /** The last lines of the step's output when it did not pass: the raw facts, not an explanation. */
  excerpt?: string;
}
export interface GateReceipt {
  fingerprint: string;
  base: string;
  at: string;
  /** Every step passed, or only the pictures need the owner's look. */
  ok: boolean;
  needsReview: boolean;
  steps: StepResult[];
}

export const STEPS: { name: string; command: string[]; reviewOnFail?: boolean }[] = [
  { name: 'lint', command: ['npm', 'run', 'lint'] },
  { name: 'unit', command: ['npm', 'test', '--', '--run'] },
  { name: 'build', command: ['npm', 'run', 'build'] },
  { name: 'layout', command: ['./node_modules/.bin/playwright', 'test', '-c', 'playwright.visual.config.ts', 'tests/visual/layout.spec.ts', '--reporter=line'] },
  { name: 'pictures', command: ['./node_modules/.bin/playwright', 'test', '-c', 'playwright.visual.config.ts', 'tests/visual/snapshots.spec.ts', '--reporter=line'], reviewOnFail: true },
  { name: 'e2e', command: ['./node_modules/.bin/playwright', 'test', '--project=chromium', '--project=Mobile Chrome', '--reporter=line'] },
];

// eslint-disable-next-line no-control-regex
const plain = (text: string): string => text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
export const excerpt = (output: string, lines = 30): string =>
  plain(output)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-lines)
    .join('\n');

export const RECEIPT = '.content/gates.json';

export function runGates(root: string, only?: readonly string[]): GateReceipt {
  const base = mergeBase(root);
  const fingerprint = workFingerprint(root, base);
  const logDir = path.join(root, '.content', 'gates');
  mkdirSync(logDir, { recursive: true });
  const steps: StepResult[] = [];
  let stopped = false;
  for (const step of STEPS) {
    const log = path.relative(root, path.join(logDir, `${step.name}.log`));
    if (stopped || (only && !only.includes(step.name))) {
      steps.push({ name: step.name, status: 'not-run', seconds: 0, log });
      continue;
    }
    const started = Date.now();
    const result = spawnSync(step.command[0], step.command.slice(1), { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: repoEnv({ CI: '', FORCE_COLOR: '0' }) });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    writeFileSync(path.join(root, log), output);
    const seconds = Math.round((Date.now() - started) / 1000);
    if (result.status === 0) steps.push({ name: step.name, status: 'pass', seconds, log });
    else if (step.reviewOnFail) steps.push({ name: step.name, status: 'review', seconds, log, excerpt: excerpt(output, 12) });
    else {
      steps.push({ name: step.name, status: 'fail', seconds, log, excerpt: excerpt(output) });
      stopped = true;
    }
  }
  const receipt: GateReceipt = {
    fingerprint,
    base,
    at: new Date().toISOString(),
    ok: !only && steps.every((step) => step.status === 'pass' || step.status === 'review'),
    needsReview: steps.some((step) => step.status === 'review'),
    steps,
  };
  if (!only) writeFileSync(path.join(root, RECEIPT), `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const receipt = runGates(process.cwd(), onlyArg ? onlyArg.slice('--only='.length).split(',') : undefined);
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.steps.some((step) => step.status === 'fail')) process.exitCode = 1;
}
