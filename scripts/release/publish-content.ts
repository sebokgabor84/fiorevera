/**
 * scripts/release/publish-content.ts — the CONTENT LANE: the one door through which an agent may
 * put a change live (owner decision G3, docs/vera-agent/PRD.md; release-manager §9).
 *
 *   npm run release:publish-content -- --what "<what changed, in the owner's words>" --answers <file> [--as <person>]
 *   npm run release:publish-content -- --what "…" --approved-in-chat "<their sentence>"   (no screen changed)
 *   npm run release:publish-content -- --check …        the refusal rules only, from the last gate result; nothing runs, nothing changes
 *   npm run release:publish-content -- --handoff --what "…"   needs the technical owner: commit, push, hand over; never merges
 *   npm run release:publish-content -- --rollback [--as <person>]   undo the last content release
 *   npm run release:publish-content -- --abandon                    drop an unreleased content change ("mégsem kérem")
 *
 * Everything else in this repository reaches `main` through a pull request the owner merges
 * (GO 2). This script merges on its own ONLY when all of this holds for the exact state of the
 * checkout. It trusts nothing it is handed: it establishes every point itself, in this order.
 *   1. The branch is a content/ branch, up to date with origin/main.
 *   2. The change is class `content` (scripts/content/lib/classify.ts: paths AND what moved in them).
 *   3. It RUNS the gates itself (lint, unit, build, layout, pictures, e2e) — a result file from an
 *      earlier `npm run content:gates` is not accepted as proof (hardened 2026-11-21).
 *   4. The owner approved the look: every changed screen OK, "the new look is right" = YES and
 *      "put it live" = GO on the review page, for exactly these pictures — or, when no screen
 *      changed, a recorded sentence from the chat.
 *   5. THE LAST LINE: the approver types their PIN into a system dialog (scripts/release/operator.ts).
 *      It is asked only now, when everything automatic is green, and it names what goes live.
 *      Who is asked: --as, else whoever said "it is me" at the start of the day (npm run content:morning).
 *   6. After the comparison pictures are re-recorded under that name, the picture check is green.
 * Then: change log entry, one commit, push (the pre-push hook runs four of the gates once more),
 * pull request, merge, wait for the production deployment, `npm run verify:live`.
 *
 * The answer is ONE JSON object on stdout: { ok, stage, … } or { ok: false, code, message }.
 * It needs `gh` (signed in) on the machine; without it use --handoff.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyCheckout, type Classification } from '../content/lib/classify';
import { CHANGELOG, parseChanges, recordChange, type ChangeEntry } from '../content/lib/changelog';
import { git, gitFile, mergeBase, repoEnv, tryGit, workFingerprint } from '../content/lib/checkout';
import { RECEIPT, runGates, type GateReceipt } from '../content/gates';
import { judgeAnswers, parseAnswers, type AnswerVerdict, type ReviewData } from '../visual-review-page';
import { OperatorError, verifyOperator } from './operator';

/** The Vercel project that serves fiorevera.hu (the repo also carries two retired ones). */
export const LIVE_VERCEL_PROJECT = 'fioreveraviragesdekor001';
export const REPO_COMPARE = 'https://github.com/sebokgabor84/fiorevera/compare';

export class LaneRefusal extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// ── The refusal rules (pure: facts in, verdict out) ───────────────────────────────────────────

export interface LaneFacts {
  branch: string;
  /** origin/main is an ancestor of HEAD's merge base == the tip of origin/main. */
  upToDate: boolean;
  classification: Pick<Classification, 'class' | 'reasons'>;
  /** The gate result (run by the lane itself for a release; the file on disk only for --check), and the fingerprint of the checkout right now. */
  receipt: Pick<GateReceipt, 'ok' | 'needsReview' | 'fingerprint' | 'steps'> | null;
  fingerprint: string;
  /** Name of the person whose PIN was accepted; empty until the last line has been passed. */
  approvedBy: string;
  /** Verdict on the pasted review answers, when a review page exists for this state. */
  answers: AnswerVerdict | null;
  /** The owner's sentence from the chat; only counts when no screen changed. */
  approvedInChat: string;
  what: string;
}

/** Why this state may not go live through the content lane; null when it may. Order = what to fix first. */
export function refusal(facts: LaneFacts): { code: string; message: string } | null {
  return (
    refusalBeforeApproval(facts) ??
    (facts.approvedBy.trim() ? null : { code: 'approver-missing', message: 'nobody has approved with their PIN yet: the last line before anything goes live' })
  );
}

/** Everything a release needs BEFORE the approver is asked for the PIN. */
export function refusalBeforeApproval(facts: LaneFacts): { code: string; message: string } | null {
  const no = (code: string, message: string) => ({ code, message });
  if (!facts.branch.startsWith('content/')) {
    return no('branch', `the content lane only releases content/ branches (this is "${facts.branch}"). Everything else goes through a pull request the owner merges.`);
  }
  if (!facts.what.trim()) return no('what-missing', 'say what changed, in the owner\'s words (--what "…"); it goes into the change log');
  if (facts.classification.class !== 'content') {
    return no('needs-gabor', `this change is not pure catalogue content, so it waits for the technical owner:\n- ${facts.classification.reasons.join('\n- ')}\nPrepare the hand-over with --handoff.`);
  }
  if (!facts.upToDate) return no('main-moved', 'main has moved since this change was started: git fetch && git rebase origin/main, then check and show it again');
  if (!facts.receipt) return no('gates-missing', 'the gates have not run for this change: npm run content:gates');
  if (facts.receipt.fingerprint !== facts.fingerprint) return no('gates-stale', 'the content changed after the gates ran: run them again');
  if (!facts.receipt.ok) {
    const failed = facts.receipt.steps.find((step) => step.status === 'fail' || step.status === 'not-run');
    return no('gates-red', `the gates are not green (${failed?.name ?? 'unknown step'}): fix the content and run npm run content:gates again`);
  }
  if (facts.receipt.needsReview) {
    if (!facts.answers) return no('answers-missing', 'screens changed, so the owner must look at the review page (npm run visual:page) and paste the answers: --answers <file>');
    if (facts.answers.issues.length) return no('review-issues', `the owner marked ${facts.answers.issues.length} screen(s) as not right: ${facts.answers.issues.map((i) => `${i.id}${i.note ? ` (${i.note})` : ''}`).join('; ')}`);
    if (!facts.answers.mayRecord) return no('review-incomplete', `the review answers do not approve this state:\n- ${facts.answers.problems.join('\n- ')}`);
    if (!facts.answers.mayCommit) return no('not-go', 'the owner approved the look but did not say "put it live" (COMMIT is not GO)');
  } else if (!facts.approvedInChat.trim()) {
    return no('approval-missing', 'no screen changed, so there is no review page: record the owner\'s own sentence of approval (--approved-in-chat "…")');
  }
  return null;
}

// ── Facts from the checkout ───────────────────────────────────────────────────────────────────

const arg = (argv: readonly string[], name: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
};

const run = (root: string, command: string, args: string[], input?: string): { status: number; output: string } => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', input, maxBuffer: 256 * 1024 * 1024, env: repoEnv() });
  return { status: result.status ?? 1, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
};

const must = (root: string, command: string, args: string[], code: string, what: string): string => {
  const result = run(root, command, args);
  if (result.status !== 0) throw new LaneRefusal(code, `${what} failed:\n${result.output.split('\n').slice(-25).join('\n')}`);
  return result.output;
};

function gatherFacts(root: string, argv: readonly string[], receipt: GateReceipt | null): LaneFacts & { base: string; classificationFull: Classification } {
  must(root, 'git', ['fetch', '--quiet', 'origin', 'main'], 'fetch', 'git fetch');
  const base = mergeBase(root);
  const classification = classifyCheckout(root);
  let answers: AnswerVerdict | null = null;
  const answersFile = arg(argv, 'answers');
  const reviewFile = path.join(root, '.visual-review', 'review.json');
  if (answersFile) {
    if (!existsSync(reviewFile)) throw new LaneRefusal('review-missing', 'there is no review page for these answers: npm run visual:page');
    answers = judgeAnswers(parseAnswers(readFileSync(path.resolve(root, answersFile), 'utf8')), JSON.parse(readFileSync(reviewFile, 'utf8')) as ReviewData);
  }
  return {
    branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
    upToDate: base === git(root, ['rev-parse', 'origin/main']),
    classification,
    classificationFull: classification,
    receipt,
    fingerprint: workFingerprint(root, base),
    approvedBy: '',
    answers,
    approvedInChat: arg(argv, 'approved-in-chat'),
    what: arg(argv, 'what'),
    base,
  };
}

const today = (): string => new Date().toISOString().slice(0, 10);

/** Stages exactly the files of the change (never `git add -A`) and commits. */
function commit(root: string, files: readonly string[], subject: string, trailers: string[]): void {
  must(root, 'git', ['add', '--', ...files], 'stage', 'staging the files');
  must(root, 'git', ['commit', '-m', subject, '-m', trailers.join('\n')], 'commit', 'the commit (the pre-commit hook runs the visual check)');
}

/** Opens the pull request, merges it and returns the merge commit on main. */
function mergeThroughPullRequest(root: string, branch: string, title: string, body: string): string {
  must(root, 'git', ['push', '-u', 'origin', branch], 'push', 'the push (the pre-push hook runs lint, unit tests, build and the visual check again)');
  const existing = run(root, 'gh', ['pr', 'view', branch, '--json', 'state', '-q', '.state']);
  if (existing.status !== 0 || existing.output !== 'OPEN') must(root, 'gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body], 'pull-request', 'opening the pull request');
  must(root, 'gh', ['pr', 'merge', branch, '--merge'], 'merge', 'merging the pull request');
  return must(root, 'gh', ['pr', 'view', branch, '--json', 'mergeCommit', '-q', '.mergeCommit.oid'], 'merge', 'reading the merge commit');
}

/** Waits for the production deployment of `sha` (Vercel reports it as a commit status). */
function waitForDeployment(root: string, sha: string, minutes = 8): 'success' | 'failure' | 'unknown' {
  const deadline = Date.now() + minutes * 60_000;
  while (Date.now() < deadline) {
    const result = run(root, 'gh', ['api', `repos/{owner}/{repo}/commits/${sha}/statuses`, '-q', `[.[] | select(.context | contains("${LIVE_VERCEL_PROJECT}"))][0].state`]);
    if (result.status === 0 && result.output === 'success') return 'success';
    if (result.status === 0 && (result.output === 'failure' || result.output === 'error')) return 'failure';
    spawnSync('sleep', ['15']);
  }
  return 'unknown';
}

function afterMerge(root: string, sha: string): Record<string, unknown> {
  const deployment = waitForDeployment(root, sha);
  const live = deployment === 'failure' ? { status: 1, output: 'the production deployment failed' } : run(root, 'npm', ['run', '--silent', 'verify:live']);
  // Leave the checkout on an up-to-date main where that is possible (a worktree cannot switch to a main checked out elsewhere).
  run(root, 'git', ['fetch', '--quiet', '--prune', 'origin']);
  const released = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const switched = run(root, 'git', ['switch', 'main']).status === 0 && run(root, 'git', ['merge', '--ff-only', 'origin/main']).status === 0;
  // The merged branch is done: remove it locally and on origin (refuses by itself if anything is unmerged or dirty).
  const cleaned = switched && run(root, 'node', ['scripts/release/cleanup.mjs', '--apply', released]).status === 0;
  return { branchRemoved: cleaned, mergeCommit: sha, deployment, liveCheck: live.status === 0 ? 'pass' : 'fail', ...(live.status === 0 ? {} : { liveCheckOutput: live.output.split('\n').slice(-20).join('\n') }), backOnMain: switched };
}

// ── The three ways to call it ─────────────────────────────────────────────────────────────────

const diskReceipt = (root: string): GateReceipt | null => (existsSync(path.join(root, RECEIPT)) ? (JSON.parse(readFileSync(path.join(root, RECEIPT), 'utf8')) as GateReceipt) : null);
/** A stand-in that lets the rules before the gates be checked first (cheap refusals before minutes of checks). */
const notRunYet = (fingerprint: string): GateReceipt => ({ fingerprint, base: '', at: '', ok: true, needsReview: false, steps: [] });

export function publish(root: string, argv: readonly string[]): Record<string, unknown> {
  if (argv.includes('--check')) {
    const facts = gatherFacts(root, argv, diskReceipt(root));
    const refused = refusalBeforeApproval(facts);
    if (refused) throw new LaneRefusal(refused.code, refused.message);
    return { ok: true, stage: 'check', note: 'by the last gate result this state may go live; a release runs every gate again itself and then asks for the PIN. Nothing was changed.' };
  }
  // 1 + 2: branch and change class — refused before the slow part.
  const first = gatherFacts(root, argv, null);
  const early = refusalBeforeApproval({ ...first, receipt: notRunYet(first.fingerprint), approvedInChat: first.approvedInChat || 'checked after the gates' , answers: null });
  if (early) throw new LaneRefusal(early.code, early.message);
  if (run(root, 'gh', ['auth', 'status']).status !== 0) throw new LaneRefusal('gh-missing', 'the GitHub command line (gh) is not installed or not signed in on this machine — the change can be handed over with --handoff');

  // 3: the gates, run here and now. A result file from an earlier run is not proof.
  const receipt = runGates(root);
  // 4: the owner's approval of the look, judged against the fresh result.
  const facts = { ...gatherFacts(root, argv, receipt), base: first.base };
  const refused = refusalBeforeApproval(facts);
  if (refused) throw new LaneRefusal(refused.code, refused.message);

  // 5: the last line. Everything automatic is green; now a person says yes with their PIN.
  const person = verifyOperator(`Közzététel a fiorevera.hu oldalon:\n„${facts.what}”\n\nMinden ellenőrzés sikeresen lezárult. A PIN-kód megadásával a változtatás megjelenik a nyilvános oldalon.`, { as: arg(argv, 'as') || undefined });
  facts.approvedBy = person.name;
  const last = refusal(facts); // the complete rule set once more, now with the approver: nothing below runs on a partial yes
  if (last) throw new LaneRefusal(last.code, last.message);

  let baselines: string[] = [];
  if (facts.receipt!.needsReview) {
    must(root, 'npm', ['run', '--silent', 'test:visual:update', '--', `--approved-by=${facts.approvedBy}`, `--note=${facts.what}`], 'baselines', 're-recording the comparison pictures');
    const pictures = runGates(root, ['pictures']);
    if (pictures.steps.find((step) => step.name === 'pictures')?.status !== 'pass') throw new LaneRefusal('pictures-red', 'the picture check is still not green after the re-record — stop and hand over');
    baselines = [...git(root, ['diff', '--name-only']).split('\n'), ...git(root, ['ls-files', '--others', '--exclude-standard']).split('\n')].filter((file) => /^(tests\/visual\/__screenshots__\/|docs\/qa\/visual-baselines-log\.md$)/.test(file));
  }
  if (workFingerprint(root, facts.base) !== facts.fingerprint) throw new LaneRefusal('changed-underfoot', 'the content changed while the release was running — start again with the gates');

  const entry: ChangeEntry = { date: today(), what: facts.what, approvedBy: facts.approvedBy, state: 'megjelent', branch: facts.branch };
  recordChange(root, entry);
  const again = classifyCheckout(root);
  if (again.class !== 'content') throw new LaneRefusal('needs-gabor', `after the re-record the change is no longer pure content:\n- ${again.reasons.join('\n- ')}`);
  const approval = `PIN; ${facts.receipt!.needsReview ? 'review page: every screen OK, look approved, go-live GO' : `in chat: "${facts.approvedInChat}"`}`;
  commit(root, [...new Set([...again.files, ...baselines, CHANGELOG])], `content: ${facts.what}`, [
    `Approved-by: ${facts.approvedBy} (${approval})`,
    'Change-class: content',
    `Gates: ${facts.fingerprint}`,
    'Released-by: scripts/release/publish-content.ts',
  ]);
  const sha = mergeThroughPullRequest(root, facts.branch, `content: ${facts.what}`, `Content release through the content lane (release-manager §9).\n\n- What: ${facts.what}\n- Approved by: ${facts.approvedBy} (${approval})\n- Change class: content (scripts/content/lib/classify.ts)\n- Gates: green for ${facts.fingerprint}`);
  return { ok: true, stage: 'live', branch: facts.branch, what: facts.what, approvedBy: facts.approvedBy, ...afterMerge(root, sha) };
}

/** Needs the technical owner: save the work on its branch, push it, write the hand-over. Never merges. */
export function handoff(root: string, argv: readonly string[]): Record<string, unknown> {
  const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch === 'main' || branch === 'master') throw new LaneRefusal('branch', 'there is nothing to hand over on main');
  const what = arg(argv, 'what');
  if (!what) throw new LaneRefusal('what-missing', 'say what the owner wants, in her words (--what "…")');
  const classification = classifyCheckout(root);
  recordChange(root, { date: today(), what, approvedBy: '—', state: 'Gáborra vár', branch });
  const files = [...new Set([...git(root, ['diff', '--name-only']).split('\n'), ...git(root, ['ls-files', '--others', '--exclude-standard']).split('\n'), CHANGELOG])].filter(Boolean);
  must(root, 'git', ['add', '--', ...files], 'stage', 'staging the files');
  // The git hooks stay in force: a change whose checks are red cannot be committed or pushed, and
  // nothing here bypasses them. Then the work stays on this machine, on its branch, and the answer says so.
  let saved: 'pushed' | 'committed on this machine' | 'uncommitted on this machine' = 'uncommitted on this machine';
  let problem = '';
  const committed =
    run(root, 'git', ['diff', '--cached', '--quiet']).status === 0 ||
    (() => {
      const result = run(root, 'git', ['commit', '-m', `wip(content): ${what} — waiting for the technical owner`, '-m', `Change-class: ${classification.class}\n${classification.reasons.map((r) => `Reason: ${r}`).join('\n')}`]);
      if (result.status !== 0) problem = result.output.split('\n').slice(-12).join('\n');
      return result.status === 0;
    })();
  if (committed) {
    saved = 'committed on this machine';
    const pushed = run(root, 'git', ['push', '-u', 'origin', branch]);
    if (pushed.status === 0) saved = 'pushed';
    else problem = pushed.output.split('\n').slice(-12).join('\n');
  }
  return {
    ok: true,
    stage: 'waiting-for-gabor',
    branch,
    what,
    saved,
    reasons: classification.reasons,
    ...(saved === 'pushed' ? { compare: `${REPO_COMPARE}/main...${branch}?expand=1` } : { notPushedBecause: problem }),
  };
}

/**
 * "Mégsem kérem": drops an UNRELEASED content change. Only files the classifier knows as content are
 * touched: changed ones go back to their state on main, new ones (photos, pictures) are deleted.
 * Refuses when anything else changed — that work may be someone's code and is handed over instead.
 */
export function abandon(root: string, argv: readonly string[]): Record<string, unknown> {
  const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!branch.startsWith('content/')) throw new LaneRefusal('branch', `only a content/ branch can be dropped this way (this is "${branch}")`);
  const base = mergeBase(root);
  if (git(root, ['rev-list', '--count', `${base}..HEAD`]) !== '0') throw new LaneRefusal('already-saved', 'part of this change is already saved on the branch — hand it over (--handoff) or let the technical owner remove the branch');
  const classification = classifyCheckout(root);
  if (classification.files.length === 0) return { ok: true, stage: 'abandoned', dropped: [], note: 'there was nothing to drop' };
  if (classification.class !== 'content') throw new LaneRefusal('needs-gabor', `not only content changed here, so nothing was dropped:\n- ${classification.reasons.join('\n- ')}`);
  if (argv.includes('--check')) return { ok: true, stage: 'check', wouldDrop: classification.files };
  for (const file of classification.files) {
    if (gitFile(root, base, file) !== null) must(root, 'git', ['checkout', base, '--', file], 'restore', `restoring ${file}`);
    else {
      rmSync(path.join(root, file), { force: true });
      run(root, 'git', ['rm', '--cached', '--quiet', '--ignore-unmatch', '--', file]);
      const dir = path.dirname(path.join(root, file));
      if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
    }
  }
  run(root, 'git', ['reset', '--quiet']);
  const left = git(root, ['status', '--porcelain']);
  const switched = !left && run(root, 'git', ['switch', 'main']).status === 0;
  if (switched) run(root, 'git', ['branch', '-d', branch]);
  return { ok: true, stage: 'abandoned', dropped: classification.files, backOnMain: switched, ...(left ? { stillChanged: left.split('\n') } : {}) };
}

/** The last content release on main, if it is the newest change there. */
export function lastContentRelease(log: string): { sha: string; branch: string; latest: boolean } | null {
  const merges = log.split('\n').filter(Boolean).map((line) => line.split('\t'));
  for (const [i, [sha, subject]] of merges.entries()) {
    const match = /^Merge pull request #\d+ from [^/\s]+\/(content\/\S+)$/.exec(subject ?? '');
    if (match) return match[1].startsWith('content/revert-') ? null : { sha, branch: match[1], latest: i === 0 };
  }
  return null;
}

/** "Undo the last change": a revert of the last content release, through the same gates and the same lane. */
export function rollback(root: string, argv: readonly string[]): Record<string, unknown> {
  if (git(root, ['status', '--porcelain'])) throw new LaneRefusal('dirty', 'there is unfinished work in this checkout — finish, hand over or drop it first');
  must(root, 'git', ['fetch', '--quiet', 'origin', 'main'], 'fetch', 'git fetch');
  const target = lastContentRelease(git(root, ['log', 'origin/main', '--first-parent', '-n', '40', '--format=%H%x09%s']));
  if (!target) throw new LaneRefusal('nothing-to-undo', 'the newest content change on the site is itself a rollback, or there is no content release to undo');
  if (!target.latest) throw new LaneRefusal('needs-gabor', `other changes went live after "${target.branch}"; undoing it now could clash with them — this needs the technical owner`);
  const undone = parseChanges(gitFile(root, 'origin/main', CHANGELOG) ?? '').find((entry) => entry.branch === target.branch);
  const what = undone?.what ?? target.branch;
  const branch = `content/revert-${today()}-${target.sha.slice(0, 7)}`;
  if (argv.includes('--check')) return { ok: true, stage: 'check', wouldUndo: what };
  if (run(root, 'gh', ['auth', 'status']).status !== 0) throw new LaneRefusal('gh-missing', 'the GitHub command line (gh) is not installed or not signed in on this machine');
  must(root, 'git', ['switch', '-c', branch, 'origin/main'], 'branch', 'creating the branch');
  must(root, 'git', ['revert', '-m', '1', '--no-edit', target.sha], 'revert', 'the revert');
  const receipt = runGates(root);
  if (!receipt.ok || receipt.needsReview) throw new LaneRefusal('gates-red', `the gates are not green on the restored state (${receipt.steps.find((s) => s.status !== 'pass')?.name}) — this needs the technical owner; the work is on ${branch}`);
  // The last line: the restored state is green; a person confirms the rollback with their PIN.
  const person = verifyOperator(`Visszavonás a fiorevera.hu oldalon:\n„${what}”\n\nAz előző állapot ellenőrzése sikeresen lezárult. A PIN-kód megadásával a nyilvános oldal visszaáll erre az állapotra.`, { as: arg(argv, 'as') || undefined });
  recordChange(root, { date: today(), what, approvedBy: person.name, state: 'visszavonva', branch: target.branch });
  commit(root, [CHANGELOG], `content: undo "${what}"`, [`Approved-by: ${person.name} (PIN; asked for the rollback)`, 'Change-class: content', `Reverts: ${target.sha}`, 'Released-by: scripts/release/publish-content.ts']);
  const sha = mergeThroughPullRequest(root, branch, `content: undo "${what}"`, `Rollback of ${target.sha} (${target.branch}) through the content lane, confirmed by ${person.name} with their PIN. The restored state was approved before; gates green.`);
  return { ok: true, stage: 'rolled-back', undone: what, approvedBy: person.name, ...afterMerge(root, sha) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const root = tryGit(process.cwd(), ['rev-parse', '--show-toplevel']) ?? process.cwd();
  try {
    const answer = argv.includes('--rollback') ? rollback(root, argv) : argv.includes('--abandon') ? abandon(root, argv) : argv.includes('--handoff') ? handoff(root, argv) : publish(root, argv);
    console.log(JSON.stringify(answer, null, 2));
    if (answer.liveCheck === 'fail') process.exitCode = 3;
  } catch (error) {
    const refused = error instanceof LaneRefusal || error instanceof OperatorError ? { code: error.code, message: error.message } : { code: 'unexpected', message: error instanceof Error ? error.message : String(error) };
    console.log(JSON.stringify({ ok: false, ...refused }, null, 2));
    process.exitCode = 1;
  }
}
