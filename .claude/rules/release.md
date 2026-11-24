---
paths:
  - ".githooks/**"
  - ".claude/hooks/**"
  - ".claude/settings.json"
  - "scripts/release/**"
  - ".agent/skills/release-manager/**"
---

# Release guardrails

`main` is production; nothing is edited, committed, merged or pushed there. Rules and the full protocol: `.agent/skills/release-manager/SKILL.md`. Four layers:

1. Claude Code hooks in the committed `.claude/settings.json`: `.claude/hooks/guard-main-edit.sh` denies Edit/Write in a checkout on `main` (git-ignored files stay writable); `.claude/hooks/guard-bash.sh` denies the bypass routes (`--no-verify`, `FV_SKIP_HOOKS=1`, changing `core.hooksPath`, push to `main`, plain force push, merging `main` into a branch, merge into local `main`, `vercel --prod/promote/rollback`); `.claude/hooks/session-start.sh` prints branch, dirty state, open pull requests, hook health, `BACKLOG.md` freshness, who is at the keyboard and the handover note; `.claude/hooks/stop-reminder.sh` reminds when work is uncommitted and `goodbye` has not run; `.claude/hooks/session-end.sh` records how a session ended. All are bash, git and jq, no node.
2. Git hooks in `.githooks/`: `pre-commit` and `pre-merge-commit` refuse on `main` and refuse a merge of `main` into a branch; `pre-push` refuses any push to `main`, a branch carrying its own merge commit, and otherwise runs lint, unit, build and visual (`npm run prepush`). A push that only deletes branches skips the gates. `FV_SKIP_HOOKS=1` is the owner's emergency bypass in his own terminal, recorded in the PR; an agent never sets it.
3. The GitHub ruleset on `main`, active since 2026-11-21: pull request required, no force push, no deletion, empty bypass list.
4. Two human gates: GO 1 = commit and push the branch; GO 2 = the owner merges the pull request on GitHub. The only exception is the content lane (`scripts/release/publish-content.ts`); a typed `gh pr merge` is denied.

- A feature branch is updated with `git fetch && git rebase origin/main`, then pushed with `--force-with-lease`. Never merge `main` in (owner's hard rule, 2026-11-18).
- App-created worktrees run the git hooks of the shared checkout (worktree-scoped absolute `core.hooksPath`), so the shared checkout stays on an up-to-date `main`. `.claude/settings.local.json` stays git-ignored and personal.
- Scripts: `scripts/release/status.mjs`, `scripts/release/cleanup.mjs`, `scripts/release/selftest.sh`, `scripts/release/operator.ts`.
- Committed token defaults in `.claude/settings.json`: `autoCompactWindow: 200000` for every model and the Vercel plugin off for this project (token review 2026-11-23). A personal override goes in `.claude/settings.local.json`, never by removing the key.
- No CI runs yet; the prepared workflow and what the pixel gate would need there are in `docs/ci/README.md`.
