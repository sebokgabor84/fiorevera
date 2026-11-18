---
name: release-manager
description: >-
  Owns the path from a change to production for the Fiore Vera site: branch first, two separate
  human gates (GO 1 = commit and push the branch, GO 2 = the owner merges the pull request),
  previews, cleanup after the merge and rollback. Use when the user says branch, commit, push,
  pull request, merge, release, publish, deploy, go live, preview, rollback, revert, worktree or
  cleanup, or when a guard hook blocks an edit, a commit or a push.
---

# Release Manager

`main` is production: Vercel deploys every push to `main` to https://www.fiorevera.hu. So nothing is edited, committed, merged or pushed on `main`; a change reaches it only through a pull request that the owner merges on GitHub. The guards below enforce this; this skill is how to work with them.

## 1. The guards (code, not habit)

| Layer | Where | Stops | Can be bypassed by |
|---|---|---|---|
| Claude edit guard | `.claude/hooks/guard-main-edit.sh` | Edit / Write in a checkout on `main` (git-ignored files stay writable) | shell writes — caught by the next layers |
| Claude Bash guard | `.claude/hooks/guard-bash.sh` | `--no-verify`, `FV_SKIP_HOOKS=1`, changing `core.hooksPath`, push to `main`, force push, merge into local `main`, `vercel --prod / promote / rollback` | `sh -c '…'` (quoted text is not inspected) |
| Git hooks | `.githooks/pre-commit`, `pre-merge-commit`, `pre-push` | commit and merge commit on `main`, any push to `main`; runs lint → unit → build → visual on every other push | the owner's `FV_SKIP_HOOKS=1`; a clone where `npm install` never ran |
| GitHub ruleset on `main` | GitHub → Settings → Rules (§8) | every direct push, force push and deletion, for everybody | nobody on the bypass list = nobody |

Session hooks: `session-start.sh` prints branch, dirty state, open pull requests, hook health and the handover note; `stop-reminder.sh` reminds once an hour when work is uncommitted and `goodbye` has not run; `session-end.sh` records how a session ended for the next one.

## 2. Scripts — run these instead of typing git by hand

| Command | Use |
|---|---|
| `npm run release:status` (`-- --fetch`, `-- --previews`, `-- --json`) | Branch, ahead/behind, open pull requests, every branch and worktree with a keep/delete verdict, hook health. Run it before GO 1, before cleanup and whenever unsure |
| `npm run release:cleanup` (`-- --apply <branch>`) | Dry run by default. Deletes a merged branch: worktree, local, origin. Refuses a dirty worktree or one a process is still working in |
| `npm run release:selftest` (`-v`) | Replays the forbidden moves in a throw-away repository and prints each refusal. Run after any change to `.claude/hooks/` or `.githooks/` |

## 3. The path (maps to the 7-step Release Protocol in `AGENTS.md`)

1. **Branch.** `git switch -c <prefix>/<short-desc> origin/main` after `git fetch`. Prefixes: `feature/`, `fix/`, `chore/`, `docs/`, `content/` (text, photo and price changes), `perf/`; the app's own `claude/<name>-<id>` worktree branches count as well.
2. **Plan + Honest Critique**, wait for the owner's OK (AGENTS.md PRE-4/5).
3. **Build + gates** (POST-1…5; `qa-specialist` owns the gates).
4. **Review Brief.** Say what the push will carry: `rtk proxy git log --oneline origin/main..HEAD` and `rtk proxy git status --porcelain`.
5. **GO 1 → commit and push the branch.** Immediately before staging: `rtk proxy git branch --show-current` — a branch check from an earlier turn does not count (the owner or another session may have switched it). Stage by explicit path, never `git add -A`. If `origin/main` moved: `git merge origin/main`, re-run the gates. `git push -u origin <branch>`, then confirm with `rtk proxy git rev-parse @{u}`.
6. **Pull request brief.** There is no `gh`: give the owner `https://github.com/sebokgabor84/fiorevera/compare/main...<branch>?expand=1`, a drafted title and body, a reviewer checklist and the preview link (§4).
7. **GO 2 = the owner presses "Merge pull request" on GitHub.** The agent never merges and cannot. A "GO" in chat after step 5 is answered with the pull request link, not with a merge. GO 1 never implies GO 2.

## 4. Previews

Vercel builds every pushed branch (on by default) and comments the preview URLs on the pull request; `npm run release:status -- --previews` prints the Vercel statuses and those URLs. The one that counts is the live project's, `https://fioreveraviragesdekor001-git-<branch>-fiorevera.vercel.app`; take it from the pull request comment, not from this pattern, because a long branch name is shortened with a hash (2026-11-18: the pattern did not resolve for `claude/branch-guardrails-805745`). Measured 2026-11-18 on pull request 7: the preview answers `302` to `vercel.com/sso-api`, so it sits behind Vercel Authentication and only a logged-in Vercel member can open it. Re-measure with `curl -sI <url>` (`200` = public). Until the owner changes that (§8), he creates a Shareable Link in the Vercel deployment view for whoever must look; an agent cannot open the preview either and verifies on the local production build (`npm run build && npm run preview`). A preview check can fail on a branch that is behind `main` (2026-11-16, `vercel.json`): merge `origin/main` in first.

## 5. Rules that come from incidents (`.agent/harvest/`, 2026-11-16)

| Rule | Why |
|---|---|
| One worktree per code-writing session; the shared checkout stays on an up-to-date `main` and is not edited | Shared checkouts mixed `.env.local`, dev servers and commits of four sessions. App worktrees also run the git hooks of the shared checkout (absolute `core.hooksPath`) |
| Once a branch is pushed, update it by merging `origin/main`; no rebase, no force push | A force push landed on a branch the owner was merging |
| Never remove a worktree or branch a session may still use; cleanup goes through the script and the owner's yes | A worktree vanished under a running visual suite |
| Git facts that decide a commit, push or delete come from `rtk proxy git …` | The rtk hook reformats and has shown stale refs |
| Never `git stash` | The stash is shared by every worktree and session |
| The goodbye close commit follows the same path | `goodbye` writes tracked files, so it runs on the working branch before the merge, or on `chore/session-close-<date>` |

## 6. After the merge

`git fetch --prune`, then `npm run release:cleanup` (dry run) and, with the owner's yes, `-- --apply <branch>`. An app session's worktree is removed by archiving that session in the app. Update `BACKLOG.md` on the next branch, never on `main`.

## 7. Rolling back production

| Situation | Path |
|---|---|
| The live site is broken now | Owner: Vercel → project → Production Deployment → **Instant Rollback**. Hobby plan: only to the immediately previous deployment. Afterwards Vercel stops putting new `main` pushes live until the owner undoes it (**Manage** → pick the deployment → Confirm) |
| A merged change must go | `git switch -c fix/revert-<what> origin/main`, `git revert -m 1 <merge-sha>`, gates, GO 1, pull request, GO 2 |
| Never | `git reset` or a force push on `main`; pointing DNS back at Webnode (`docs/operations/runbook.md`) |

## 8. When a hook blocks

| Message | Do |
|---|---|
| `BLOCKED by the branch guard` (edit) / `pre-commit: REFUSED` | You are on `main`. `git switch -c <prefix>/<short-desc>` — the changes travel with you — and repeat |
| `BLOCKED by the release guard` (Bash) | Do not rephrase the command. Tell the owner what you wanted and why; he runs it in his terminal if it is really needed |
| `pre-push: REFUSED` or GitHub answers "protected branch" | The push targeted `main`. Push the branch and go through the pull request |
| A gate in `pre-push` is red | Fix the code, not the gate (`qa-specialist`). `FV_SKIP_HOOKS=1` is the owner's emergency switch only, recorded in the pull request |
| `release:status` says hooks are not installed or have no main guard | `npm run prepare`; bring the shared checkout up to date with `main` |

**Owner-only switches** (an agent cannot set them): GitHub → Settings → Rules → Rulesets → new branch ruleset targeting `main`, enforcement Active, empty bypass list, rules *Restrict deletions*, *Block force pushes*, *Require a pull request before merging* (0 approvals); Settings → General → *Automatically delete head branches*. Vercel → project → Settings → Deployment Protection decides whether previews need a login (§4).
