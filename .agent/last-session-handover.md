# 🌸 Fiore Vera — Session Handover Report
> **Last Updated:** 2026-11-24 · the site is **live** on https://www.fiorevera.hu · `main` = `2dff6ca` (pull request 23) · open pull requests: none until this close's own
>
> Rewritten at the close of the token-review session, from `git`, `gh` and `BACKLOG.md`. If this note is older than the last commit, trust `npm run release:status` and `BACKLOG.md` over it.

---

## 📊 Where things stand

- **Production:** https://www.fiorevera.hu since 2026-11-16. Vercel project `fioreveraviragesdekor001`, team `fiorevera`, Hobby plan (owner's written risk acceptance). Every push to `main` deploys; `main` is protected by the GitHub ruleset since 2026-11-21.
- **Pull requests 7 to 23 are merged.** 22 (2026-11-21) brought the CMS Coordinator: content operations, the content lane with the approver's PIN, `/goodmorning`, the owner's guide, the language standard. 23 (2026-11-24) puts `"autoCompactWindow": 200000` into the committed `.claude/settings.json`, so every session here compacts at 200k tokens, for everyone, on every model.
- **The shared checkout** (`/Users/gabor.seboek/Documents/Projects/Private/fiorevera`, on `main`) is two commits behind `origin/main`; the Bash guard refuses an agent the fast-forward there, so the owner runs `git pull --ff-only` in it.
- **DNS** is still at Webnode / Register.it; the Rackhost transfer is pending (Track B, kept chat "Domain move", idle). Domain paid to 2027-11-09.
- **Gates:** pull request 23 passed lint, unit (261 in 25 files), build and visual in the pre-push hook on 2026-11-24. e2e last ran in full on 2026-11-21 (413 passed / 7 skipped); nothing that reaches the site changed since.
- **Token review (2026-11-23):** a session here boots at ≈ 32k tokens before the first prompt (≈ 21k from `CLAUDE.md` plus the three files it says to read first, ≈ 7k from the Vercel plugin). RTK, Caveman and code-review-graph were checked against independent benchmarks and rejected. Report: https://claude.ai/artifact/A7GytLxavEwxbS1txC1AsD. The follow-ups are three `[HARNESS]` lines at the top of `BACKLOG.md`.

Content management, quality gates, guardrails, GDPR, brand and launch are unchanged since the close of 2026-11-21: rules in the skills and `.agent/memory.md`, raw record in `.agent/harvest/` (13 notes), open work in `BACKLOG.md`.

## 🔀 In flight

| Chat / branch | Worktree | State |
|---|---|---|
| this close, `chore/session-close-2026-11-24` | `.claude/worktrees/autocompact-window` | backlog, memory, `AGENTS.md` principle, this note; waits for GO 1, then its pull request |
| Domain move (kept chat, idle) | shared checkout | nothing new; Track B is an owner item |
| linked chats "Finish and commit the QR lockscreen", "init-fork", "init-fork-2" | none | idle, their work is long merged; no harvest notes; archive on the owner's word |

Merged branches to delete on the owner's word (`npm run release:cleanup`): `claude/vera-concierge-7826b5` (its detached worktree `.claude/worktrees/vera-concierge-7826b5` is clean) and `chore/autocompact-window`.

## 🎯 Next unblocked actions

1. **Owner:** GO 1 for this close, then merge its pull request; `git pull --ff-only` in the shared checkout.
2. **Token diet, repo part** (`BACKLOG.md` `[HARNESS]`): split `CLAUDE.md` into a short core plus path-scoped `.claude/rules/`, shrink this note to ≤ 30 lines, commit the token defaults (Vercel plugin off for the project, Haiku explore agent, test-output tail hook). One feature branch, measured with `/context all` before and after.
3. **Owner, by hand:** Vera's PIN (`npm run release:operator -- --set vera --role content --name "Vera"`, she types it); on her Mac the Claude app, Git, Node 22, the clone, `npm ci`, `gh`, and `"agent": "cms-coordinator"` plus `"env": { "FV_OPERATOR": "vera" }` in the git-ignored `.claude/settings.local.json`.
4. **The pilot** (`docs/vera-agent/PRD.md` §3.7): `npm run test:visual` on an untouched `main` on Vera's Mac, then one supervised content release on a rental price.
5. **Owner, on GitHub and Vercel:** *Automatically delete head branches*; remove the two leftover Vercel projects; Deployment Protection off so Vera can open previews.
6. **Vera:** the 15 landscape cover picks, copy sign-off per locale, phone check (MASTER-PLAN 1.3, 2.3 / 2.4, 3.4, 4.2).
7. **Search Console:** day 7 was due 2026-11-23 and is not recorded; day 30 is 2026-12-16 (MASTER-PLAN 4.4).

## ⚠ Not verified

- The content lane's real commit, push, merge and live check have never run; neither has a PIN prompt in a real release.
- The visual suite on Vera's Mac.
- The boot-token figures are character-based estimates; `/context all` gives the exact grid.

## 💡 Learnings that change how the next session works

Full list with evidence: `.agent/memory.md`.

- **Shared by default (owner, 2026-11-24):** a change that helps other contributors goes into the repo as code or committed config, not into one person's settings (`AGENTS.md` Working Principles).
- Project settings outrank user settings: a personal override of a committed key goes into `.claude/settings.local.json`.
- `rtk git push` hides the pre-push gate output; prove the gates from `dist/` and `test-results/.last-run.json`, or push through `rtk proxy`.
- A GO covers what was named when it was given; say what a commit carries and where it goes before asking.
- `main` is production; rebase, never merge `main` into a branch; git facts through `rtk proxy git …`; never `cd` inside a worktree session's shell call.
