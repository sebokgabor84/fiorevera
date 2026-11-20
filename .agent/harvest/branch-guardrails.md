# Harvest: Branch guardrails (Claude hooks, git hooks, release scripts, release-manager skill, rebase rule as code)
Session: branch-guardrails (`claude/branch-guardrails-805745`, follow-up `fix/release-cleanup-shared-checkout`) · period: 2026-11-16–2026-11-19 · commits on main: `8e245a8`, `cbc019c`, `ff536c1` (pull request 10, merge `5dbb825`), `2d684b8`, `be5d047` (pull request 17, merge `478a77e`)

Written on 2026-11-20 by the session-close chat, not by the session itself: the chat was merged and closed without a note. Sources: the session's three working notes (outside the repo), `git`, `.agent/skills/release-manager/SKILL.md`, `.claude/hooks/`, `.githooks/`, `scripts/release/`, `BACKLOG.md`. What these do not say is "not recorded". Code facts are those of `main` at `4d2106f`; "in BACKLOG" means the working copy of the close branch `chore/session-close-2026-11-20` on 2026-11-20.

Two attributions the sources state differently: (1) pull request 10 also carried the harvest branch (`0abc07e`, `668f981`, merge `8ff120c`); `main` has no separate merge commit for pull request 8. (2) The closing note counts pull request 14 (`9b03afe`, the rebase hard rule) as this session's work; that commit's message says the overarching session wrote it from this session's reverted draft.

## 1. What this session delivered
- Claude Code hooks, wired in `.claude/settings.json` (bash + git + jq): `guard-main-edit.sh` denies Edit / Write in a checkout on `main` (git-ignored files stay writable); `guard-bash.sh` denies `--no-verify`, `FV_SKIP_HOOKS=1`, changing `core.hooksPath`, push to `main`, force push, merge into local `main`, `vercel --prod / promote / rollback`; `session-start.sh` prints the release state; `stop-reminder.sh` reminds at most hourly; `session-end.sh` records how a session ended — `.claude/hooks/` / `8e245a8`
- Git hooks: `pre-commit` and the new `pre-merge-commit` refuse on `main`; `pre-push` refuses every push that targets `main` and skips the gates when a push only deletes refs — `.githooks/` / `8e245a8`
- Release scripts: `scripts/release/status.mjs` (`npm run release:status`, `-- --fetch`, `-- --previews`, `-- --json`), `scripts/release/cleanup.mjs` (dry run by default, `-- --apply <branch>`), `scripts/release/selftest.sh` (46 cases in `8e245a8`, 72 after `be5d047`)
- `release-manager` skill (14th skill), `AGENTS.md` Release Protocol with GO 1 / GO 2, routing row, `src/types/skills.ts`, `CLAUDE.md` — `8e245a8`
- Tolerant `prepare` (`git config core.hooksPath .githooks || true`), so a plain `npm ci` works outside a git checkout — `package.json` / `8e245a8`
- Temporary GDPR audit step in `pre-push`, removed again once pull request 9 had moved the audit into `npm test` — `cbc019c`
- Skill correction: take the preview URL from the pull request comment — `ff536c1`
- Cleanup fix after the first real dry run: never proposes removing the shared checkout; a branch is a candidate only when its local and its origin copy both say delete; busy check at path boundaries (`ps` instead of `pgrep`); a neutral line instead of GitHub's rate-limit text; branches created with `--no-track` — `scripts/release/cleanup.mjs`, `scripts/release/status.mjs`, `.claude/hooks/session-start.sh` / `2d684b8`
- Rebase rule as code: `pre-push` refuses a branch whose own range holds a merge commit (it fetches `main` first; tags and delete-only pushes are exempt); `release:status` flags such a branch and one behind `main` with the rebase command, also in `--json` (`merges`, `behind`) — `.githooks/pre-push`, `scripts/release/status.mjs` / `be5d047`
- A draft of the rebase hard rule (patch over 10 files, 247 lines), written and reverted when the owner redirected the rule; `9b03afe` is based on it. The patch file is not in the repo.
- Owner lines in `BACKLOG.md`: GitHub ruleset, leftover Vercel projects, preview access, merge method — `8e245a8`, `be5d047`

## 2. Learnings (rules a future agent must follow)
- **The Claude Bash guard is a tripwire, not a wall** — quoted text and heredoc bodies are not inspected (a commit message may name a forbidden flag), so `sh -c '…'` passes. The walls are the git hooks and the GitHub ruleset. `.claude/hooks/guard-bash.sh` lines 15–17. [architecture]
- **App-created worktrees run the git hooks of the shared checkout** (worktree-scoped absolute `core.hooksPath`) — until the shared checkout holds the current `.githooks/`, no worktree has the main guard; keep it on an up-to-date `main`. Working note, 2026-11-18; `release-manager` §5. [architecture] [workflow]
- **Claude Code hooks load at session start** — a session that began before `.claude/settings.json` existed in its checkout does not have them (observed in this session). [tooling]
- **A rule and its guards change in one commit** — the guards of pull request 10 enforced "merge `main`, no force push"; the rebase rule needed changes in eight places or agents get a contradiction and a blocked push (`--force-with-lease` was denied). Draft note 2026-11-18, `9b03afe`. [workflow] [architecture]
- **Run `npm run release:selftest` after any change to `.claude/hooks/` or `.githooks/`** — it replays the forbidden moves in a throw-away repository. `release-manager` §2. [testing]
- **Take a preview URL from the pull request comment (`npm run release:status -- --previews`), not from the name pattern** — a long branch name is shortened with a hash; the pattern did not resolve for this branch on 2026-11-18. `ff536c1`. [ops]
- **Previews sit behind Vercel Authentication** — pull request 7's preview answered HTTP 302 to `vercel.com/sso-api` (2026-11-18); an agent cannot open one and verifies on the local production build. `release-manager` §4. [ops]
- **Create a branch with `--no-track`** — otherwise `origin/main` becomes its upstream. `2d684b8`, `release-manager` §3. [workflow]
- **A delete verdict needs every copy of a branch to agree, and the shared checkout is never a removal candidate** — the first real dry run proposed `git worktree remove` for the main working tree and could list an in-use branch while GitHub was unreachable. `scripts/release/cleanup.mjs`, `2d684b8`. [tooling]
- **Do not print GitHub's rate-limit text** — it names the caller's IP address. `2d684b8`. [tooling]
- **Measure a branch's own range against a freshly fetched `main`** — `pre-push` fetches first, else an old `origin/main` gives a wrong range. `.githooks/pre-push`, `be5d047`. [tooling]
- **GitHub's "Update branch" button adds a merge of `main`** unless "Update with rebase" is picked; `pre-push` then refuses the branch. `release-manager` §5, `be5d047`. [workflow]
- **GO 1 never implies GO 2** — a "GO" in chat after the push is answered with the pull request link; the agent never merges. `release-manager` §3. [workflow] [owner-preference]
- **Do not stack a branch on an unmerged branch** — this one sat on `chore/goodbye-harvest`; pull request 9 was merged first, the pull request was blocked, and two merge commits (`668f981`, `8ff120c`) reached `main` with pull request 10. [workflow]
- **A message that reaches the wrong session: revert the edits, keep the draft as a note** — the owner's rebase message was meant for another session; the kept draft saved the second writing. 2026-11-18. [workflow]
- **Never `git stash`** — the stash is shared by every worktree and session. `release-manager` §5. [workflow]
- **Hobby plan: Instant Rollback only to the previous deployment, and it stops new `main` pushes going live until undone** — `release-manager` §7. [ops]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| `main` = production; no session edits, commits, merges or pushes on it | owner, GO 1 on `8e245a8`, 2026-11-18 | `release-manager`, `AGENTS.md`, `CLAUDE.md` | no |
| A delete-only push skips the gates; a delete of `main` is refused | owner, 2026-11-18 | `.githooks/pre-push`, `BACKLOG.md` | no |
| Rebase onto `origin/main`, never merge `main` in | owner, 2026-11-18 | `release-manager` §5, `AGENTS.md`, `.githooks/` | no |
| Branch prefixes `feature/ fix/ chore/ docs/ content/ perf/` + `claude/<name>-<id>` | session | `release-manager` §3 | no |
| Rollback: owner's Instant Rollback, or `git revert -m 1 <merge-sha>` through a pull request | session | `release-manager` §7 | no |
| `main` is NOT protected on GitHub | measured 2026-11-18, not re-measured | `BACKLOG.md` `[OWNER]` | no |
| Three Vercel projects build every push; only `fioreveraviragesdekor001` is live | measured 2026-11-18 | `BACKLOG.md` `[OWNER]` | no |
| Fields of `release:status -- --json` (`branch`, `onProduction`, `dirty`, `ahead`, `behind`, `upstream`, `unpushed`, `openPrs`, `locals`, `remotes`, `worktrees`, `hooks`, `merges`) | session, contract for the concierge | code only: `scripts/release/status.mjs` | YES → `release-manager` §2 or a `resources/` file |
| Self-test size: 46 (`8e245a8`) → 66 (`9b03afe`) → 72 (`be5d047`) | commits | `scripts/release/selftest.sh` | YES → `BACKLOG.md` `[HARNESS]` "Confirm the Claude Code hooks live" still says 46 |
| "The agent merges pure content after the owner's yes on the review page" (CMS Coordinator, request R5) | Gabor, 2026-11-18; concept not approved | not on `main`; `docs/vera-agent/PRD.md` exists only in the `vera-concierge-7826b5` worktree | YES → that session's own harvest and `BACKLOG.md` |

## 4. Improvements NOT implemented yet
- [ ] Content lane (R5): one script `release:publish-content` that re-checks gates, review answers and change class for the current commit, then commits, pushes, opens and merges the pull request through `gh`; a Bash guard rule against a typed `gh pr merge`; a self-test case; a skill section for the one exception to "the agent never merges" — `scripts/release/`, `.claude/hooks/guard-bash.sh`, `release-manager` — acceptance: self-test refuses a class `needs-gabor` publish — L — y (in BACKLOG: NO)
- [ ] Confirm the Claude Code hooks live in one new session ("release state" block appears, an Edit on `main` is denied) — S — n (in BACKLOG: yes; its line says on 2026-11-20 that the block and two Bash denials were seen live, the Edit denial on `main` not yet)
- [ ] Vercel status of the live project as a required check on `main`; blocked by the leftover projects — S — y (in BACKLOG: yes)
- [ ] `goodbye` step 2 offers "stash" on `main` at `4d2106f` (`.agent/skills/goodbye/SKILL.md` line 55); reworded on the close branch on 2026-11-20, not committed when this note was written — S — n (in BACKLOG: yes, marked done there)
- [ ] After the merge of the tolerant `prepare`: remove the install-command override in the Vercel project and check one preview build — S — y (in BACKLOG: yes)
- [ ] Bash guard against destructive working-tree commands while a release is open (`git reset --hard`, `git clean`, `git checkout -- .`); asked for by the concierge because unpublished photos live in git-ignored `assets-src/`; `guard-bash.sh` has no such rule — S — n (in BACKLOG: NO)
- [ ] Bind `npm run test:visual:update` to an approval for the current commit; `scripts/visual-approve.mjs` only checks that `--approved-by` is not empty — M — n (in BACKLOG: NO)
- [ ] Defined gate behaviour off macOS: `pre-push` always runs `npm run test:visual`, and the pixel baselines are macOS-rendered, so a push from Linux or a cloud session is red for rasterisation reasons — `.githooks/pre-push` — acceptance: layout invariants only, with a line that says so — M — y (in BACKLOG: NO for the hook; the Linux baseline set is listed)
- [ ] Document the `release:status -- --json` fields (§ 3) — S — n (in BACKLOG: NO)
- [ ] Tests pin content counts (`tests/unit/data.test.ts`: 15 albums, 169 images, 7 rental items; `tests/unit/render.test.tsx`; `tests/e2e/gallery.spec.ts`, `tests/e2e/rental.spec.ts`), so adding one album turns the gates red by design; the concierge asks for derived invariants — M — y (in BACKLOG: NO)
- [ ] `npm run optimize:assets` on a checkout without the full `assets-src/` rebuilds `src/data/generated/imageMeta.ts` from the folders present and deletes "orphans"; noted by the concierge, not checked by this session — S — n (in BACKLOG: NO)

## 5. Skill updates needed
- `.agent/skills/qa-specialist/SKILL.md` §3, first caveat row: "the pre-push hook runs the full chain … also for `git push --delete` (no deletion check; … an open proposal)" is wrong since `8e245a8`; `.githooks/pre-push` prints "only ref deletions — gates skipped".
- `.agent/skills/qa-specialist/SKILL.md` §3, `vercel.json` row: "merge `main` in before opening the PR" contradicts the rebase hard rule; it should say rebase onto `origin/main`.
- `.agent/skills/release-manager/SKILL.md` §2: list the `--json` fields; add the content-lane exception only if the owner approves R5.
- `.agent/skills/goodbye/SKILL.md` step 2: drop "stash" (commit on the branch or leave as-is) — already reworded on the close branch, see § 4.

## 6. Open owner decisions / things only Gabor or Vera can do
- Switch on the GitHub ruleset for `main` (target `main`, Active, empty bypass list, *Restrict deletions*, *Block force pushes*, *Require a pull request before merging*) and *Automatically delete head branches*. The only guard nobody can bypass. (in BACKLOG: yes)
- Remove or disconnect the leftover Vercel projects `fiorevera` and `fioreveraviragesdekor`. (in BACKLOG: yes)
- Preview access. Options: (A) Vercel Authentication off for the project, (B) a Shareable Link per preview. Recommendation on the session's BACKLOG line: A. (in BACKLOG: yes)
- How pull requests land on `main`: merge commit (recommended) or "Rebase and merge" + *Require linear history*. (in BACKLOG: yes)
- Remove the Vercel install-command override, then check one preview build. (in BACKLOG: yes)
- Approve or reject the content lane (R5): it is the one exception to "the agent never merges", and it needs `gh`, which is not installed on Gabor's Mac. No recommendation in the notes; the concept is not approved. (in BACKLOG: NO)
- Content-count tests: keep the fixed numbers or derive them from the data. The concierge note says it asks Gabor; an answer is not recorded. (in BACKLOG: NO)
- The worktree `.claude/worktrees/branch-guardrails-805745` is still registered on 2026-11-20 (clean, detached at `be5d047`, which is on `main`): archive that session in the app. The local branch `fix/release-cleanup-shared-checkout` named in the note is already gone. (in BACKLOG: yes, `[OPS]` line of 2026-11-20)

## 7. Friction (what cost time and how to avoid it next time)
- The branch was stacked on `chore/goodbye-harvest` and blocked when pull request 9 landed first (seven conflicting files) → cut from `origin/main`, agree the merge order before the first pull request.
- The session predates `.claude/settings.json` and the headless CLI was not logged in, so its own hooks were never seen running through Claude Code → start one fresh session as the last step of any hook change.
- The owner's rebase message arrived in this chat by mistake; edits were made and reverted → on a rule change, ask which session owns it before editing.
- The GDPR step was added to `pre-push` and removed a day later because a sibling branch moved the audit (`8e245a8` → `cbc019c`) → check the in-flight table in `BACKLOG.md` before adding a temporary gate.
- Unauthenticated GitHub API calls ran into the rate limit and made cleanup verdicts unreliable → fixed in `2d684b8` (every copy must agree); no `gh`, so pull requests are opened by hand from the compare link.
- The chat was closed without its harvest note → this file had to be rebuilt from working notes and `git`; write the note before the last pull request is merged.
