/**
 * visual-approve.mjs — the ONLY sanctioned way to replace visual baselines.
 *
 *   npm run test:visual:update -- --approved-by="Gabor" [--note="header bar widened to 90rem"]
 *
 * Refuses without --approved-by (an explicit owner GO on the reviewed diff), re-runs the visual
 * suite with --update-snapshots, lists every baseline that changed, and appends an entry to
 * docs/qa/visual-baselines-log.md so each baseline change has a date, an approver and a reason.
 * Review the differences first: `npm run visual:review` (opens expected / actual / diff per snapshot).
 */
import { execSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), 'true'];
  })
);
const approver = (args['approved-by'] ?? '').trim();
const note = (args.note ?? '').trim();

if (!approver) {
  console.error(
    [
      'visual-approve: refusing to replace baselines without an approver.',
      '',
      '  1. Look at the differences first:   npm run visual:review',
      '  2. Get the owner\'s GO on the new look at every affected width.',
      '  3. Then:  npm run test:visual:update -- --approved-by="<name>" --note="<what changed and why>"',
      '',
      'Never re-baseline to make a red run green.',
    ].join('\n')
  );
  process.exit(1);
}

const before = execSync('git status --porcelain -- tests/visual/__screenshots__', { encoding: 'utf8' });
const run = spawnSync('./node_modules/.bin/playwright', ['test', '-c', 'playwright.visual.config.ts', '--update-snapshots', '--reporter=dot'], {
  stdio: 'inherit',
});
if (run.status !== 0) {
  console.error('visual-approve: the suite did not complete cleanly; baselines were NOT recorded as approved.');
  process.exit(run.status ?? 1);
}
const after = execSync('git status --porcelain -- tests/visual/__screenshots__', { encoding: 'utf8' });
const changed = after
  .split('\n')
  .filter(Boolean)
  .map((l) => l.slice(3).trim())
  .filter((f) => !before.includes(f) || after.includes(f));

const date = new Date().toISOString().slice(0, 10);
const logPath = 'docs/qa/visual-baselines-log.md';
if (!existsSync(logPath)) {
  writeFileSync(
    logPath,
    '# Visual baseline log\n\nEvery replacement of a pixel baseline, with who approved the reviewed diff and why. Written by `scripts/visual-approve.mjs`; never edit by hand.\n\n| Date | Approved by | Note | Baselines changed |\n| --- | --- | --- | --- |\n'
  );
}
const list = changed.length ? changed.map((f) => f.replace('tests/visual/__screenshots__/', '')).join('<br>') : '(none — baselines already matched)';
appendFileSync(logPath, `| ${date} | ${approver} | ${note || '—'} | ${list} |\n`);

console.log(`\nvisual-approve: ${changed.length} baseline file(s) changed, approved by ${approver}; logged in ${logPath}.`);
for (const f of changed) console.log('  ' + f);
console.log('\nStage the baselines and the log together with the component change that caused them.');
