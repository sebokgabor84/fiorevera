# 🌸 Fiore Vera — Session Handover Report
> **Last Updated:** 2026-11-21 · the site is **live** on https://www.fiorevera.hu · `main` = `f83ab58` (pull request 21) · open pull request: **22** (`claude/vera-concierge-7826b5`, the CMS Coordinator) — waits for the owner's merge
>
> Rewritten in full at the close of the CMS Coordinator session, from `git`, `gh` and `BACKLOG.md`. If this note is older than the last commit, trust `npm run release:status` and `BACKLOG.md` over it.

---

## 📊 Where things stand

**Live and git**

- **Production:** https://www.fiorevera.hu since 2026-11-16. Vercel project `fioreveraviragesdekor001`, team `fiorevera`, Hobby plan (owner's written risk acceptance, Pro is the fall-back). **Every push to `main` deploys production.** Two more Vercel projects (`fiorevera`, `fioreveraviragesdekor`) build every push and every pull request and serve nothing — owner to remove.
- **`main` is protected since 2026-11-21:** the ruleset "main branch protection" is active (pull request required, no force push, no deletion, empty bypass list), read back through the GitHub API. *Automatically delete head branches* is not confirmed.
- **Pull requests 7 to 21 are merged.** Pull request 22 carries the whole CMS Coordinator work (concept, foundation, guide, language standard, this close). It does not change the public site: no rendered file under `src/`, nothing under `public/`, no locale file.
- **The shared checkout** (`/Users/gabor.seboek/Documents/Projects/Private/fiorevera`, on `main`) is four commits behind `origin/main`. An agent on a feature branch is refused the fast-forward by the guard; the owner runs `git -C <that folder> merge --ff-only origin/main`, best right after the merge of 22.
- **DNS** is still at Webnode / Register.it; the Rackhost transfer is pending (Track B, kept chat "Domain move", idle; the next step is the owner's). Domain paid to 2027-11-09. Keep the Webnode login alive until the transfer completes.
- **`gh`** is installed and signed in on Gabor's Mac since 2026-11-21. A typed `gh pr merge` is denied by the Bash guard.
- **Gates at this close, 2026-11-21, on `claude/vera-concierge-7826b5`:** lint 0 errors / 0 warnings with the script type check · unit 261 passed in 25 files · e2e 413 passed / 7 skipped on four browsers · build 21 pages + 404 · visual 110 of 110 · GDPR audit clean · release self-test 81 of 81.
- **Not re-run since pull request 11:** `npm run verify:live` as a recorded run (the morning routine's live check answered healthy on 2026-11-21).

**Content management, new with pull request 22** — the rules are in `.agent/skills/cms-coordinator/SKILL.md`, the concept in `docs/vera-agent/PRD.md`, the decisions in `docs/decisions/0001`–`0005`.

| Part | Where | State |
|---|---|---|
| Content operations | `npm run content -- <operation>`, `scripts/content/` | 23 operations, unit-tested, a refusal writes nothing |
| Content or owner-only | `npm run content:classify` | allowlist in `scripts/content/lib/classify.ts` |
| Gates for content | `npm run content:gates` | lint, unit, build, layout, pictures (`review`), e2e on two browsers |
| Content lane | `npm run release:publish-content` | refusal rules unit-tested; **its git and GitHub steps have never run for real** |
| Who is at the keyboard | `npm run release:operator`, `npm run content:morning` | Gábor's PIN set and checked on his Mac; Vera's not set |
| Start and end of the day | `/goodmorning`, `/goodbye` | the morning routine ran live on 2026-11-21; the short content close has not been used yet |
| Owner's guide | `docs/vera-agent/utmutato.md` | Hungarian, a day told as a story, working method; also as a private page: https://claude.ai/artifact/PT3bFPPgWWHUrmnXjcUUr3 (hand-built, source not in the repository) |
| Language standard | `AGENTS.md`, `i18n-guardian`, `tests/unit/language.test.ts` | Hungarian word list enforced; German and English by review only |
| Technical advice | `.agent/skills/tech-lead/SKILL.md`, `docs/decisions/` | five decisions logged |

**Where the other areas stand** — unchanged since 2026-11-20; the raw record is `.agent/harvest/<name>.md` (13 notes), the rules are in `.agent/memory.md`, the open work in `BACKLOG.md`.

| Area | Note | State |
|---|---|---|
| Site build and QA | `main-build`, `site-polish` | all pages live in HU / DE / EN; visual changes are approved only on the generated review page (`npm run visual:page`) |
| Contact form | `contact-form` | Web3Forms, delivers from the live site |
| Quality gates | `quality-gates`, `firefox-e2e`, `baseline-review` | axe on every route, GDPR audit and font coverage inside the unit run; CI workflow prepared, not active |
| Release guardrails | `branch-guardrails`, `branch-cleanup` | hooks refuse work on `main`, the rebase rule is code, the ruleset is active |
| Performance | `seo-webvitals` | live Lighthouse mobile 98 (2026-11-18); field data from 2026-12-14 |
| GDPR | `gdpr` | register sealed; four points of the Art. 30 record still open |
| Brand | `favicon` | F3 crest shipped; lockscreen linen-classic is final |
| Launch and domain | `domain-move` | Track A done; Track B (Rackhost) open |

## 🔀 In flight

| Chat | Branch | Worktree | State |
|---|---|---|---|
| CMS Coordinator ("vera-concierge", kept) | `claude/vera-concierge-7826b5`, pull request 22 | `.claude/worktrees/vera-concierge-7826b5` | everything committed and pushed; waits for GO 2 |
| Domain move (kept, idle) | — | shared checkout | nothing new; Track B is an owner item in `BACKLOG.md` |

Merge order: only pull request 22 is open. After its merge the branch and the worktree can go (`npm run release:cleanup -- --apply claude/vera-concierge-7826b5`, on the owner's word, once the chat is closed).

## 🎯 Next unblocked actions

1. **Owner GO 2: merge pull request 22** on GitHub, then fast-forward the shared checkout (command above).
2. **Owner, by hand:** Vera's PIN (`npm run release:operator -- --set vera --role content --name "Vera"`, she types it herself); on her Mac the Claude app, Git, Node 22, the clone, `npm ci`, `gh`, and in the git-ignored `.claude/settings.local.json` `"agent": "cms-coordinator"` and `"env": { "FV_OPERATOR": "vera" }` (`BACKLOG.md` "Owner decisions").
3. **The pilot** (`docs/vera-agent/PRD.md` §3.7): first `npm run test:visual` on an untouched `main` on Vera's Mac; then the first real content release, supervised, on one rental price (publish, undo, again); then the eight tasks.
4. **Owner:** share the guide page with Vera from its Share menu and put your own words into its dedication line.
5. Owner, ten minutes on GitHub and Vercel: *Automatically delete head branches*; remove the two leftover Vercel projects; remove the install-command override; Deployment Protection off so Vera can open previews.
6. Vera: the 15 landscape cover picks, copy sign-off per locale, phone check of the live site (MASTER-PLAN 1.3, 2.3 / 2.4, 3.4, 4.2).
7. Search Console on day 7 (2026-11-23) and day 30 (2026-12-16) (MASTER-PLAN 4.4).

## 🙋 Open owner decisions

All of them, with options and a recommendation each: `BACKLOG.md` → "Owner decisions". New on 2026-11-21: "e-mail cím" or "e-mail-cím" in the site copy (one of the three places is legal text); whether the guide page is generated from the guide or its source is committed; say so if the two-browser gate for content or the 100 MB budget for the baseline history was not meant as a yes.

## ⚠ Not verified

- The content lane's commit, push, pull request, merge, wait for the deployment, live check and clean-up have never run.
- A PIN being asked for in a real release, and the lock after three wrong tries.
- The visual suite on Vera's Mac (a second machine may render differently).
- The guide page in dark mode.
- German and English wording has no automated check.

## 💡 Learnings that change how the next session works

Full list with evidence: `.agent/memory.md` (25 lines from this session, tagged `[vera-concierge]`).

- A GO covers what was named when it was given. Before every commit say what it carries and where it goes.
- Content changes go only through `npm run content -- <operation>`; never edit `src/data/*.ts`, the locale files or `imageMeta.ts` by hand for content.
- A script or test that starts git inside a hook must strip git's variables (`repoEnv()`): on 2026-11-21 a test run inside the pre-push hook turned the shared repository bare.
- The agent never asks for, sees, repeats or stores a PIN. An approval the agent can type is not an approval.
- Texts in Hungarian, German and English are composed in the language, not translated into it; the rejected Hungarian words are one table, and a test reads it.
- A pause is a session end: run the `goodbye` ritual. A content session closes with its short form.
- `main` is production. A branch is rebased onto `origin/main`, never merged with it. A guard that blocks is reported, never worked around.
- Never `cd` inside a shell call of a worktree session; git facts through `rtk proxy git …`.
