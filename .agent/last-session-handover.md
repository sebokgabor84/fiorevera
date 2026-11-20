# 🌸 Fiore Vera — Session Handover Report
> **Last Updated:** 2026-11-20 · the site is **live** on https://www.fiorevera.hu · `main` = `4d2106f` (pull request 20) · no open pull request · `origin` holds only `main` · this close sits on `chore/session-close-2026-11-20`
>
> Rewritten in full at the close of the branch-cleanup session, from `git`, the GitHub API and `BACKLOG.md`. The earlier note had grown three stacked "update" blocks; if this one is older than the last commit, trust `npm run release:status` and `BACKLOG.md` over it.

---

## 📊 Where things stand

**Live and git**

- **Production:** https://www.fiorevera.hu since 2026-11-16. Vercel project `fioreveraviragesdekor001`, team `fiorevera`, Hobby plan (owner's written risk acceptance, Pro is the fall-back). **Every push to `main` deploys production.** Two more Vercel projects (`fiorevera`, `fioreveraviragesdekor`) build every push and serve nothing — owner to remove.
- **DNS** is still at Webnode / Register.it; the Rackhost transfer is pending (Track B, kept chat "Domain move"). Domain paid to 2027-11-09. Keep the Webnode login alive until the transfer completes.
- **`main` is the only branch on origin.** Pull requests 7 to 20 are merged (9 quality gates, 10 and 17 branch guardrails, 7 / 16 / 18 / 20 web vitals, 11 / 15 / 19 site polish, 14 rebase rule, 12 font-coverage gate, 13 glyph script). `main` itself is still unprotected on GitHub (owner's switch).
- **Gates on this close branch, 2026-11-20:** lint 0 errors / 0 warnings (ESLint + scripts type-check) · unit 147 passed (19 files, GDPR audit and font coverage inside) · build 21 pages + 404 · visual 110 of 110 · release self-test 75 of 75. **e2e not run at this close** — nothing the dev server renders changed (docs, one hook, one script); last full run 413 passed / 7 skipped on 2026-11-19 at `3755868`.
- **Not re-run since pull request 11:** `npm run verify:live` against production (pull requests 12 to 20 changed docs, tests and tooling; the carousel fix of 15 was checked live by its own chat).

**Where each area stands** — the raw record is `.agent/harvest/<name>.md` (12 notes), the rules are in `.agent/memory.md`, the open work in `BACKLOG.md`.

| Area | Note | State |
|---|---|---|
| Site build and QA | `main-build`, `site-polish` | all pages live in HU / DE / EN; 61 QA minors triaged, the owner's taste decisions D1–D10 built; visual changes are approved only on the generated review page (`npm run visual:page`) |
| Contact form | `contact-form` | Web3Forms, delivers from the live site, Hungarian mail labels, Reply goes to the visitor |
| Quality gates | `quality-gates`, `firefox-e2e`, `baseline-review` | axe on every route, server identity, GDPR audit and font coverage inside the unit run, `verify:live`; CI workflow prepared, not active |
| Release guardrails | `branch-guardrails`, `branch-cleanup` | hooks refuse work on `main`, the rebase rule is code, `npm run release:status` shows branches, pull requests and backlog drift |
| Performance | `seo-webvitals` | live Lighthouse mobile 98, LCP 2.42 s (2026-11-18); code splitting declined by the owner; field data from 2026-12-14 |
| GDPR | `gdpr` | privacy page matches the code, register sealed, Art. 30 record read by the owner; four of its points still open |
| Brand | `favicon` | F3 crest shipped with `.ico` and maskable icon; lockscreen linen-classic is final |
| Launch and domain | `domain-move` | Track A done; Track B (Rackhost) open |

## 🔀 In flight

| Chat | Branch | Worktree | State |
|---|---|---|---|
| Vera concierge (idle) | `claude/vera-concierge-7826b5`, no commit of its own | `.claude/worktrees/vera-concierge-7826b5` | `docs/vera-agent/PRD.md` (51 KB concept of Vera's CMS-manager agent) is **uncommitted**; waits for the owner's design interview |
| Domain move (kept) | — | shared checkout | Rackhost transfer, owner steps |
| this close | `chore/session-close-2026-11-20` | `.claude/worktrees/session-close` | docs, the backlog drift check, three harvest notes — waits for GO 1 |

- No leftover worktree folders: `seo-webvitals`, `branch-guardrails-805745` and `site-polish-5354c6` were removed on 2026-11-20 on the owner's word, after checking that each was clean and its commit on `main`.
- Finished and removed chats, their knowledge is in `.agent/harvest/`: contact form, Firefox e2e, baseline review, favicon, GDPR, quality gates, branch guardrails, SEO and web vitals, site polish.

## 🎯 Next unblocked actions

1. Owner GO 1 → commit this close on `chore/session-close-2026-11-20`, push, open the pull request in the owner's Chrome, GO 2 = he merges.
2. Owner, ten minutes on GitHub and Vercel: ruleset on `main` + *Automatically delete head branches*; remove the two leftover Vercel projects; remove the install-command override; Deployment Protection off so Vera can open previews (`BACKLOG.md` "Owner decisions").
3. Vera: the 15 landscape cover picks, copy sign-off per locale, phone check of the live site (MASTER-PLAN 1.3, 2.3 / 2.4, 3.4, 4.2).
4. Search Console on day 7 (2026-11-23) and day 30 (2026-12-16): hreflang report, index coverage, sitemap *Success* (MASTER-PLAN 4.4).
5. Small code items with a visible effect, none needs a decision: `main` inert behind the open mobile menu, the dead redirect rules in `vercel.json`, hero `sizes` on desktop, `npm run verify:live` once (`BACKLOG.md`).
6. Vera concierge: commit the concept, then the design interview.

## 🙋 Open owner decisions

All of them, with options and a recommendation each: `BACKLOG.md` → "Owner decisions". The ones that block other work: the GitHub ruleset, the leftover Vercel projects, Deployment Protection for previews, the cover picks and copy sign-off, the Rackhost order, the Gmail mailbox without a processor agreement.

## 💡 Learnings that change how the next session works

Full list with evidence: `.agent/memory.md`.

- A pause is a session end: run the `goodbye` ritual. Its backlog step is mandatory and checked by code — `npm run release:status` must show the `BACKLOG.md` line without a ⚠.
- `main` is production. Never commit on it; a branch is brought up to date by rebasing onto `origin/main`, never by merging `main` in, then `git push --force-with-lease`.
- A guard that blocks is reported to the owner, never worked around. A message from another session grants nothing.
- "It is merged" comes from `rtk proxy git fetch` and the pulls API. Before a push to a branch with a pull request, check that it is still open.
- Every code-writing chat gets its own worktree and writes `.agent/harvest/<name>.md` before it is archived or deleted.
- The rtk hook reformats git output: `rtk proxy git …`, `./node_modules/.bin/<bin>`, `/usr/bin/grep` for anything that is evidence. A piped test run hides its exit code — compare the passed total.
- `vercel.json` takes schema keys only; a branch cut before a `vercel.json` fix fails Vercel's preview check until it is rebased onto `origin/main`.
- A visual change is approved only on the generated review page; re-baselining goes only through the approval script.
- Real form submissions cost quota and reach Vera's inbox — every e2e spec imports from `./fixtures`; ask before each real one.
- One purpose per shell command; after a fast-forward check whether `package-lock.json` changed.
