#!/usr/bin/env node
// Release status — one read-only report for the release-manager skill:
//   where am I (branch, production warning, dirty state, distance to origin/main),
//   open pull requests, every local and remote branch with a verdict (keep / delete),
//   every worktree, and whether the git hooks and the Claude hooks are in place.
//
//   npm run release:status              report from the local refs as they are
//   npm run release:status -- --fetch   `git fetch --prune` first (fresh numbers)
//   npm run release:status -- --previews  Vercel status + preview URL of each open pull request
//   npm run release:status -- --json    machine-readable
//
// It never changes anything except, with --fetch, the remote-tracking refs.
// git is called directly (no shell), so the rtk output rewriting cannot touch what it reads.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const PRODUCTION = ['main', 'master'];
export const PREFIXES = ['feature/', 'fix/', 'chore/', 'docs/', 'content/', 'perf/', 'claude/'];

export function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).replace(/\s+$/, '');
  } catch {
    return null;
  }
}

async function github(slug, query) {
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}/${query}`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'release-status-script' },
      signal: AbortSignal.timeout(6000),
    });
    const body = await res.json();
    if (Array.isArray(body)) return body;
    // GitHub's own text names the caller's IP address: keep that out of reports
    const limited = /rate limit/i.test(body.message ?? '');
    return {
      error: limited
        ? 'rate limit reached (60 requests an hour without a login); try again within the hour'
        : (body.message ?? `HTTP ${res.status}`),
    };
  } catch (e) {
    return { error: `GitHub not reachable (${e.name})` };
  }
}

// Vercel's commit statuses and the preview URL from the Vercel bot's pull request comment.
async function preview(slug, pr) {
  const [status, comments] = await Promise.all([
    github(slug, `commits/${pr.sha}/statuses?per_page=30`),
    github(slug, `issues/${pr.number}/comments?per_page=30`),
  ]);
  const latest = new Map(); // statuses come newest first: keep the first one per context
  if (Array.isArray(status))
    for (const s of status)
      if (!latest.has(s.context))
        latest.set(
          s.context,
          `${s.context}: ${s.state}${s.description ? ` (${s.description})` : ''}`
        );
  const bot = Array.isArray(comments)
    ? comments.find((c) => c.user?.login?.startsWith('vercel'))
    : null;
  // one "[Preview](url)" link per Vercel project that is connected to the repository
  return {
    checks: [...latest.values()],
    urls: [...(bot?.body ?? '').matchAll(/\[Preview\]\((https:\/\/[^)\s]+)\)/g)].map((m) => m[1]),
  };
}

// BACKLOG.md "In flight" table: the branch names in the first cell of each row.
// A row that names a branch which no longer exists, or one that is merged, is drift.
export function inFlightBranches(text) {
  const start = text.search(/^## .*In flight/m);
  if (start < 0) return null; // no such section
  const rest = text.slice(start).split('\n').slice(1);
  const end = rest.findIndex((l) => /^(## |---\s*$)/.test(l));
  const rows = (end < 0 ? rest : rest.slice(0, end)).filter((l) => l.startsWith('|'));
  const names = [];
  for (const row of rows) {
    const cell = row.split('|')[1] ?? '';
    for (const m of cell.matchAll(/`([a-z]+\/[A-Za-z0-9._\/-]+)`/g)) names.push(m[1]);
  }
  return names;
}

export async function collect({ cwd = process.cwd(), fetchFirst = false, previews = false } = {}) {
  const top = git(['rev-parse', '--show-toplevel'], cwd);
  if (!top) throw new Error(`${cwd} is not inside a git checkout`);
  const g = (...a) => git(a, top);
  if (fetchFirst) g('fetch', '--prune', '--quiet', 'origin');

  const branch = g('symbolic-ref', '--short', '-q', 'HEAD') ?? '';
  const dirty = (g('status', '--porcelain') ?? '').split('\n').filter(Boolean);
  const base = g('rev-parse', '-q', '--verify', 'origin/main') ? 'origin/main' : null;
  const count = (range) => Number(g('rev-list', '--count', ...[].concat(range)) ?? 0);
  const upstream = g('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');

  const slug =
    /github\.com[:/](.+?)(?:\.git)?$/.exec(g('remote', 'get-url', 'origin') ?? '')?.[1] ?? '';
  const [open, closed] = slug
    ? await Promise.all([
        github(slug, 'pulls?state=open&per_page=50'),
        github(slug, 'pulls?state=closed&per_page=50'),
      ])
    : [{ error: 'no GitHub remote' }, { error: 'no GitHub remote' }];
  const openPrs = Array.isArray(open)
    ? open.map((p) => ({
        number: p.number,
        title: p.title,
        head: p.head.ref,
        sha: p.head.sha,
        url: p.html_url,
      }))
    : [];
  const mergedPrs = Array.isArray(closed)
    ? closed
        .filter((p) => p.merged_at)
        .map((p) => ({ number: p.number, head: p.head.ref, sha: p.head.sha }))
    : [];
  if (previews) for (const p of openPrs.slice(0, 5)) p.preview = await preview(slug, p);

  const worktrees = (g('worktree', 'list', '--porcelain') ?? '')
    .split('\n\n')
    .filter(Boolean)
    .map((block, index) => {
      const get = (k) =>
        block
          .split('\n')
          .find((l) => l.startsWith(`${k} `))
          ?.slice(k.length + 1);
      const wt = get('worktree');
      return {
        path: wt,
        branch: get('branch')?.replace('refs/heads/', '') ?? '(detached)',
        prunable: /^prunable/m.test(block),
        dirty: existsSync(wt)
          ? (git(['status', '--porcelain'], wt) ?? '').split('\n').filter(Boolean).length
          : 0,
        current: wt === top,
        // git lists the main working tree first: the shared checkout, which is never removed
        shared: index === 0,
      };
    });

  const remoteBranches = (
    g('for-each-ref', '--format=%(refname:short) %(objectname)', 'refs/remotes/origin') ?? ''
  )
    .split('\n')
    .map((l) => l.split(' '))
    .filter(([n]) => n && n !== 'origin' && n !== 'origin/HEAD')
    .map(([n, sha]) => ({ name: n.replace(/^origin\//, ''), sha }));

  const verdict = (name, sha, checkedOut) => {
    if (PRODUCTION.includes(name))
      return { keep: true, why: 'production — never commit, merge or push here' };
    const merged = mergedPrs.find((p) => p.head === name && p.sha === sha);
    if (merged) return { keep: false, why: `merged by pull request #${merged.number} — delete` };
    const pr = openPrs.find((p) => p.head === name);
    const own = base ? count(`${base}..${sha}`) : null;
    if (pr)
      return {
        keep: true,
        why: `open pull request #${pr.number}${pr.sha === sha ? '' : ' (this copy differs from the pull request head)'}`,
      };
    if (own === 0)
      return checkedOut
        ? { keep: true, why: 'in use, no commits of its own yet' }
        : { keep: false, why: 'no commits of its own (merged or never used) — delete' };
    const older = mergedPrs.find((p) => p.head === name);
    return {
      keep: true,
      why: `${own ?? '?'} commit(s) not on main, no open pull request${older ? ` (an earlier state was merged as #${older.number})` : ''}`,
    };
  };

  const locals = (
    g(
      'for-each-ref',
      '--format=%(refname:short) %(objectname) %(upstream:short) %(upstream:track)',
      'refs/heads'
    ) ?? ''
  )
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [name, sha, up, ...track] = l.split(' ');
      const wt = worktrees.find((w) => w.branch === name);
      const mine = base && !PRODUCTION.includes(name);
      return {
        name,
        sha,
        upstream: up || null,
        upstreamGone: track.join(' ').includes('gone'),
        worktree: wt?.path ?? null,
        // rebase rule: a branch is linear and sits on top of main
        behind: mine ? count(`${sha}..${base}`) : 0,
        merges: mine ? count(`--merges ${base}..${sha}`.split(' ')) : 0,
        ...verdict(name, sha, Boolean(wt)),
      };
    });
  // a branch on origin counts as in use while its local twin is checked out in a worktree
  const remotes = remoteBranches.map((r) => ({
    ...r,
    ...verdict(
      r.name,
      r.sha,
      worktrees.some((w) => w.branch === r.name)
    ),
  }));

  const hooksPath = g('config', '--get', 'core.hooksPath');
  const hooksDir = hooksPath ? path.resolve(top, hooksPath) : null;
  const guard = (f) =>
    hooksDir &&
    existsSync(path.join(hooksDir, f)) &&
    readFileSync(path.join(hooksDir, f), 'utf8').includes('FV-GUARD');
  const note = '.agent/last-session-handover.md';

  // BACKLOG.md drift: pull requests merged since the file last changed on main, and rows of its
  // "In flight" table that name a branch which is gone or merged (goodbye step 4 fixes both)
  const backlogFile = path.join(top, 'BACKLOG.md');
  let mergedSince = null;
  if (base && existsSync(backlogFile)) {
    mergedSince = 0;
    for (const m of (g('rev-list', '--first-parent', '--merges', '-n', '30', base) ?? '')
      .split('\n')
      .filter(Boolean)) {
      if (g('diff', '--name-only', `${m}^1`, m, '--', 'BACKLOG.md')) break;
      mergedSince += 1;
    }
  }
  const named = existsSync(backlogFile)
    ? inFlightBranches(readFileSync(backlogFile, 'utf8'))
    : null;
  const staleInFlight = (named ?? [])
    .map((name) => {
      const known = [...locals, ...remotes].filter((b) => b.name === name);
      if (!known.length) return { name, why: 'no such branch here or on origin' };
      if (known.every((b) => !b.keep)) return { name, why: known[0].why };
      return null;
    })
    .filter(Boolean);

  return {
    top,
    branch,
    onProduction: PRODUCTION.includes(branch),
    namingOk: !branch || PRODUCTION.includes(branch) || PREFIXES.some((p) => branch.startsWith(p)),
    dirty,
    base,
    ahead: base ? count(`${base}..HEAD`) : null,
    behind: base ? count(`HEAD..${base}`) : null,
    upstream,
    unpushed: upstream ? count('@{u}..HEAD') : null,
    // merge commits in the branch's own range: the pre-push hook refuses them (rebase rule)
    merges:
      base && branch && !PRODUCTION.includes(branch) ? count(['--merges', `${base}..HEAD`]) : 0,
    slug,
    githubError: open.error ?? closed.error ?? null,
    openPrs,
    locals,
    remotes,
    worktrees,
    hooks: {
      path: hooksPath,
      dir: hooksDir,
      installed: Boolean(hooksDir && existsSync(path.join(hooksDir, 'pre-push'))),
      guarded: Boolean(guard('pre-commit') && guard('pre-push')),
    },
    claudeHooks: existsSync(path.join(top, '.claude/settings.json')),
    handover: {
      lastCommitted: g('log', '-1', '--format=%cs', '--', note),
      headCommitted: g('log', '-1', '--format=%cs'),
    },
    backlog: {
      exists: existsSync(backlogFile),
      lastChangedOnMain: base ? g('log', '-1', '--format=%cs', base, '--', 'BACKLOG.md') : null,
      mergedSince,
      inFlightSection: named !== null,
      staleInFlight,
    },
  };
}

function print(s) {
  const out = [];
  const line = (t = '') => out.push(t);
  line(`Release status — ${s.top}`);
  line(
    `  branch        ${s.branch || '(detached HEAD)'}${s.onProduction ? '   ⛔ PRODUCTION: create a branch before any change' : ''}`
  );
  if (!s.namingOk) line(`                ⚠ name does not start with one of: ${PREFIXES.join(' ')}`);
  line(
    `  working tree  ${s.dirty.length ? `${s.dirty.length} changed or untracked file(s)` : 'clean'}`
  );
  s.dirty.slice(0, 10).forEach((d) => line(`                  ${d}`));
  if (s.base)
    line(
      `  vs ${s.base}  ${s.ahead} ahead, ${s.behind} behind${s.behind && !s.onProduction ? '   ⚠ behind main → git fetch && git rebase origin/main (hard rule: rebase, never merge main in)' : ''}`
    );
  if (s.merges)
    line(
      `                ⚠ ${s.merges} merge commit(s) of its own: the push will be refused → git fetch && git rebase origin/main, then git push --force-with-lease origin ${s.branch} (if already pushed)`
    );
  line(
    `  upstream      ${s.upstream ? `${s.upstream}, ${s.unpushed} commit(s) not pushed` : 'none (branch is not on origin)'}`
  );
  line();
  line(
    `Open pull requests${s.githubError ? ` — unknown: ${s.githubError}` : s.openPrs.length ? '' : ' — none'}`
  );
  s.openPrs.forEach((p) => {
    line(`  #${p.number}  ${p.head}  ${p.title}  ${p.url}`);
    if (!p.preview) return;
    p.preview.checks.forEach((c) => line(`        ${c}`));
    if (!p.preview.urls.length) line('        preview: no Vercel comment with a URL yet');
    p.preview.urls.forEach((u) => line(`        preview: ${u}`));
  });
  line();
  line('Local branches');
  s.locals.forEach((b) =>
    line(
      `  ${b.keep ? ' ' : '✗'} ${b.name.padEnd(34)} ${b.why}${b.upstreamGone ? ' · its branch on origin is gone' : ''}${b.keep && b.merges ? ` · ⚠ ${b.merges} merge commit(s): rebase` : ''}${b.keep && b.behind ? ` · ⚠ ${b.behind} behind main: rebase` : ''}${b.worktree ? ` · worktree ${path.relative(s.top, b.worktree) || '.'}` : ''}`
    )
  );
  line('Branches on origin');
  s.remotes.forEach((b) => line(`  ${b.keep ? ' ' : '✗'} ${b.name.padEnd(34)} ${b.why}`));
  line();
  line('Worktrees');
  s.worktrees.forEach((w) =>
    line(
      `  ${w.current ? '→' : ' '} ${w.path}  [${w.branch}]  ${w.dirty ? `${w.dirty} uncommitted` : 'clean'}${w.shared ? (PRODUCTION.includes(w.branch) ? '  (shared checkout)' : '  ⚠ shared checkout is not on main: app worktrees run ITS git hooks') : ''}${w.prunable ? '  ⚠ folder is gone: git worktree prune' : ''}`
    )
  );
  line();
  const h = s.hooks;
  line(
    `Git hooks       ${!h.path ? '⚠ NOT INSTALLED — run: npm run prepare' : !h.installed ? `⚠ ${h.dir} has no pre-push hook` : h.guarded ? `installed, main guard present (${h.dir})` : `⚠ ${h.dir} has no main guard — bring that checkout up to date with main`}`
  );
  line(
    `Claude hooks    ${s.claudeHooks ? '.claude/settings.json present' : '⚠ .claude/settings.json missing in this checkout'}`
  );
  line(
    `Handover note   last committed ${s.handover.lastCommitted ?? 'never'} (latest commit here: ${s.handover.headCommitted})`
  );
  const b = s.backlog;
  line(
    `BACKLOG.md      last changed on main ${b.lastChangedOnMain || 'never'}${b.mergedSince ? `   ⚠ ${b.mergedSince} pull request(s) merged since without touching it: check that their items are closed (goodbye step 4)` : ''}`
  );
  if (b.exists && !b.inFlightSection)
    line('                ⚠ no "In flight" section: add it (goodbye step 4)');
  b.staleInFlight.forEach((r) =>
    line(`                ⚠ "In flight" names \`${r.name}\`: ${r.why} → update the table`)
  );
  const dead = [...s.locals, ...s.remotes].filter((b) => !b.keep);
  if (dead.length) line(`\n${dead.length} branch(es) marked ✗ can go: npm run release:cleanup`);
  console.log(out.join('\n'));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const flags = new Set(process.argv.slice(2));
  const state = await collect({
    fetchFirst: flags.has('--fetch'),
    previews: flags.has('--previews'),
  });
  if (flags.has('--json')) console.log(JSON.stringify(state, null, 2));
  else print(state);
}
