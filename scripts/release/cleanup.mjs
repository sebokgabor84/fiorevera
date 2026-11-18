#!/usr/bin/env node
// Release cleanup — removes branches (and their worktrees) whose work is on main.
//
//   npm run release:cleanup                      dry run: what could go, and what blocks it
//   npm run release:cleanup -- --apply <branch>  delete that branch: worktree, local, origin
//
// A branch qualifies only when status.mjs marks it ✗: merged by a pull request whose head is
// exactly this commit, or no commits of its own and not checked out anywhere. It refuses:
//   · main, and the branch of the checkout it is run from (run it from another checkout);
//   · a worktree with uncommitted files;
//   · a worktree some process is still working in (2026-11-16: a worktree was removed under a
//     running visual suite and the red result looked like a regression).
// Deleting on origin is a push that only deletes a ref; the pre-push hook lets it through
// without running the gates.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { collect, git, PRODUCTION } from './status.mjs';

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const wanted = argv.filter((a) => !a.startsWith('--'));

const state = await collect({ fetchFirst: true });
if (state.githubError)
  console.log(
    `⚠ GitHub could not be asked (${state.githubError}): only branches without own commits can be judged.\n`
  );

function busy(dir) {
  // pids whose working directory is inside the worktree (lsof), or whose command line names it (pgrep)
  const pids = new Set();
  try {
    const out = execFileSync('lsof', ['-a', '-d', 'cwd', '-Fpn'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let pid = '';
    for (const l of out.split('\n')) {
      if (l.startsWith('p')) pid = l.slice(1);
      else if (l.startsWith('n') && (l.slice(1) === dir || l.slice(1).startsWith(`${dir}/`)))
        pids.add(pid);
    }
  } catch {
    /* lsof missing or nothing found */
  }
  try {
    execFileSync('pgrep', ['-f', dir], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean)
      .forEach((p) => pids.add(p));
  } catch {
    /* no match */
  }
  pids.delete(String(process.pid));
  return [...pids];
}

const names = new Set(
  [...state.locals, ...state.remotes].filter((b) => !b.keep).map((b) => b.name)
);
const plan = [...names].map((name) => {
  const local = state.locals.find((b) => b.name === name);
  const remote = state.remotes.find((b) => b.name === name && !b.keep);
  const wt = state.worktrees.find((w) => w.branch === name);
  const blockers = [];
  if (PRODUCTION.includes(name)) blockers.push('production branch');
  if (name === state.branch)
    blockers.push(
      'this is the branch of the checkout you are running from — run cleanup from another checkout'
    );
  if (wt?.dirty) blockers.push(`its worktree has ${wt.dirty} uncommitted file(s)`);
  const pids = wt && existsSync(wt.path) ? busy(wt.path) : [];
  if (pids.length)
    blockers.push(
      `process(es) ${pids.join(', ')} are working in its worktree — wait for that session to finish`
    );
  const steps = [];
  if (wt) steps.push(['worktree', 'remove', wt.path]);
  if (local)
    steps.push([
      'branch',
      git(['merge-base', '--is-ancestor', local.sha, 'origin/main'], state.top) !== null
        ? '-d'
        : '-D',
      name,
    ]);
  if (remote) steps.push(['push', 'origin', '--delete', name]);
  return { name, why: (local ?? remote).why, wt, blockers, steps };
});

if (!plan.length) {
  console.log('Nothing to clean up: no merged or empty branches.');
  process.exit(0);
}

let failed = false;
for (const p of plan) {
  const selected = apply && wanted.includes(p.name);
  console.log(`${p.name} — ${p.why}`);
  if (p.wt?.path.includes('/.claude/worktrees/'))
    console.log(
      '    note: this worktree belongs to an app session; archiving that session in the app removes it too'
    );
  p.blockers.forEach((b) => console.log(`    ⛔ ${b}`));
  for (const step of p.steps) {
    if (!selected || p.blockers.length) {
      console.log(`    ${p.blockers.length ? 'blocked' : 'would run'}: git ${step.join(' ')}`);
      continue;
    }
    try {
      execFileSync('git', step, { cwd: state.top, stdio: 'inherit' });
      console.log(`    done: git ${step.join(' ')}`);
    } catch {
      console.log(`    FAILED: git ${step.join(' ')} — stopped here for this branch`);
      failed = true;
      break;
    }
  }
}
const unknown = wanted.filter((w) => !names.has(w));
if (unknown.length) {
  console.log(`\nNot touched (not merged, or not found): ${unknown.join(', ')}`);
  failed = true;
}
if (!apply) console.log('\nDry run. To delete one: npm run release:cleanup -- --apply <branch>');
else git(['worktree', 'prune'], state.top);
process.exit(failed ? 1 : 0);
