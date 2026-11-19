# 🌸 Fiore Vera — Session Handover Report
> **Last Updated:** 2026-11-19 · the site is **live** on https://www.fiorevera.hu · `main` = `af6e497` · no open pull request · close of the Site polish sub chat on `chore/session-close-site-polish`
>
> **Update 2026-11-19 (read first — written by the Site polish sub chat at its close, from `git` and the GitHub API):** pull requests 7 to 18 are all merged; nothing is open. On `main` since the note below was written: the harvest (8), branch guardrails (10), web vitals (7: subset fonts, inlined stylesheet), **site polish (11)**, the rebase hard rule (14), the **carousel fix (15)**, the web-vitals live log (16), the cleanup fix (17), the font-coverage gate (12), the glyph-script fix (13) and the close of the SEO and web-vitals chat (18, its harvest note only). What site polish changed that this note still describes as open is corrected in place below (marked 2026-11-19). **New way of working, owner's rule of 2026-11-18: every visual change is reviewed on the generated page — `npm run visual:page`, `docs/qa/visual-review-process.md`.** **Gates on `main`, measured at this close on 2026-11-19 at `3755868` (pull request 18 after it changed one harvest note, nothing that builds):** lint 0/0 (ESLint + scripts type-check) · unit 147 passed (19 files) · e2e 413 passed / 7 skipped (4 browsers, axe on every route) · build 21 pages + 404 · visual 110 of 110 · GDPR audit green (register 2026-11-18). Branches on origin at this close (`git ls-remote`): `main` and the merged `chore/harvest-seo-webvitals-close` (pull request 18) — `npm run release:cleanup` (owner's yes); the five merged branches listed earlier in the day are gone. The shared checkout sat on `main` at `436f4de`, 11 commits behind `origin/main`.
>
> **Earlier update 2026-11-18 (superseded where the block above says so):** pull request 9 (`claude/quality-gates-e8a654`) is merged: axe gate, server identity, GDPR audit and register seal in the unit run, scripts type-check, `verify:live`, sitemap `lastmod`, contact-sheet diffs. Gates on `main` now: unit 116 (15 files), e2e 397 passed / 7 skipped. Open pull requests: 8 (this harvest), 7 (`perf/web-vitals`: fonts 243 → 93 KB, inlined stylesheet; its script needs the dev dependency `subset-font`, not yet in `package.json`). `claude/branch-guardrails-805745` is pushed (`8e245a8`), stacked on the harvest branch. `claude/site-polish-5354c6` waited for the owner's second look at 13 screens (2026-11-19: reviewed in three rounds and merged as pull request 11). `claude/vera-concierge-7826b5` waits for the owner's design interview. Known live defect until pull request 7 merges: the "→" after the home service-card links is drawn in a system font (outside the declared `unicode-range`). Three Vercel projects build this repo (`fioreveraviragesdekor001` = production; `fioreveraviragesdekor` and `fiorevera` look like leftovers, owner to check). The five finished sub chats are deleted; their notes are in `.agent/harvest/`.

---

## 📊 Where this session stopped

**Live and git**

- **Production:** https://www.fiorevera.hu since 2026-11-16. Vercel project `fioreveraviragesdekor001`, team `fiorevera`, Hobby plan (owner's written risk acceptance, Pro is the fall-back). **Every push to `main` deploys production.** Install command on Vercel: `npm ci --ignore-scripts`.
- **DNS** is still at Webnode / Register.it (A + www CNAME point at Vercel, edited in Webnode's DNS centre); the Rackhost transfer is pending (Track B). Domain paid to 2027-11-09. Keep the Webnode login alive until the transfer completes.
- **`main` is the only long-lived branch**, tip `676f62b`; pull requests 5 and 6 are merged. Never commit on `main` — every change goes on a branch and through a pull request (no `gh` CLI: push, compare link, drafted body).
- **Gates, measured 2026-11-16:** lint 0/0 · unit 77 passed (11 files) · e2e 280 passed / 4 skipped (4 browsers) · build 21 pages + 404 · visual 109 checks, 27 baselines.

**Where things stand per area** (details and evidence: `.agent/harvest/<name>.md`, § 1)

- **Site build and QA** (`main-build`): first build pass, owner feedback round, QA session with 0 blockers, 13 majors all fixed (`697cc81`), about 55 minors open (`docs/qa/2026-11-09-qa-session.md`). Visual regression gate with git hooks and the approval script in place; language toast is one layout at every width (`410c6d0`).
- **Contact form** (`contact-form`): Web3Forms (free plan, 250 submissions/month) delivers from the live site (confirmed 2026-11-16). Field validation as a pure function, prefilled `mailto:` fallback, local fake provider (`npm run dev:form`, `npm run form:fake`), fail-closed e2e fixture (`tests/e2e/fixtures.ts`) — `742fa67`, `189cc00`, `f4feae3`, `a22e629`.
- **Firefox e2e** (`firefox-e2e`): launch failure on macOS 27 fixed in `playwright.config.ts` (`CFFIXED_USER_HOME` on the `firefox` project only) — `d6846bb`; Playwright stays at 1.63.0.
- **Visual baselines** (`baseline-review`): all 27 baselines are the owner-approved reference look (`docs/qa/visual-baselines-log.md`, `docs/qa/visual-baseline-review-2026-11-10.md`); contact sheet via `node scripts/visual-contact-sheet.mjs` → `tests/visual/review.html`, served by the `visual-review` launch entry — `8fdea0c`, `da226a1`.
- **Favicon** (`favicon`): F3 `crest-fv-sage` shipped, whole icon set generated from `public/favicon.svg` by `npm run favicon`; `favicon-builder` skill — `10c51f3`. 2026-11-19: `/favicon.ico`, a maskable Android icon and a drift-guard test exist (pull request 11); the glyph script reads `scripts/fonts-src/` (pull request 13).
- **GDPR** (`gdpr`): `gdpr-guardian` skill, `npm run audit:gdpr`, `docs/gdpr/data-register.json`, greetings-list concept (concept only, nothing in the locale files) — `aefc023`. **2026-11-19: the gaps named here on 2026-11-16 are closed** — the privacy page names Web3Forms and Vercel in HU/DE/EN (`PRIVACY_UPDATED` 16 Nov 2026), the register has a `hosting` entry and is sealed (version 2026-11-18), the audit runs inside `npm test`, the Art. 30 record is `docs/gdpr/processing-record.md` (read by the owner; four points in it still open: mailbox retention rule, Gmail without a DPA, Vercel Hobby without a processor contract, two-step verification).
- **Domain and launch** (`domain-move`): Track A done — launch plan, DNS snapshot with rollback recipe (`docs/launch/`), Vercel Web Analytics wired and host-gated (`698b150`), 14/14 legacy URLs answer 200/308, HTTPS on apex + www, Search Console Domain property verified, UptimeRobot monitor on the www home page. Track B (Rackhost) open.
- **SEO and web vitals** (`seo-webvitals`): PageSpeed mobile on the live home page 90 / 100 / 100 / 100, LCP 3.6 s (measured before the image fix was deployed); image tiers fix `2f97d84` (240 px logo tier, quality ceilings 82 / 76 / 70) is on `main`. Re-measurement and `docs/qa/web-vitals-log.md` do not exist yet.
- **Docs drift found by the harvest** (being corrected in this consolidation — verify after it lands): `CLAUDE.md` project state, test counts and skip-link note; `README.md` Status; `AGENTS.md` open question 4 and Gate G; counts in `qa-specialist`; stale facts in `gdpr-guardian`; `.agent/pr/feature-site-build.md` belongs to a merged pull request.

## 🔀 In flight

| Sub chat | Branch (local ref on 2026-11-16) | Checkout | Scope |
|---|---|---|---|
| this session | `chore/goodbye-harvest` | main checkout | the eight harvest notes + their consolidation into memory, skills, BACKLOG and docs — docs only |
| Branch guardrails | `branch-guardrails` (`claude/branch-guardrails-805745`) | `.claude/worktrees/branch-guardrails-805745` | Claude hooks, git hooks refusing commits on `main`, `release-manager` skill |
| Quality gates hardening | `quality-gates` (`claude/quality-gates-e8a654`) | `.claude/worktrees/quality-gates-e8a654` | hardening of the gates |
| Site polish — **finished 2026-11-19** | merged: `claude/site-polish-5354c6` (pull request 11), `fix/carousel-key-race` (15); close on `chore/session-close-site-polish` | `.claude/worktrees/site-polish-5354c6` | notes in `.agent/harvest/site-polish.md`; the worktree goes when the chat is archived |
| Vera concierge | `vera-concierge` (`claude/vera-concierge-7826b5`) | `.claude/worktrees/vera-concierge-7826b5` | concept and foundation for the agent that lets Vera, who is not technical, maintain the site as her CMS manager |
| SEO Webvitals (kept) | `perf/web-vitals` | `.claude/worktrees/seo-webvitals` | remaining performance work |
| Domain move (kept) | — | — | Rackhost transfer track (owner steps + docs) |

- All five worktree branches pointed at `676f62b` (no commits of their own) when this note was written.
- **Intended merge order:** `chore/goodbye-harvest` → `branch-guardrails` → `quality-gates` → `site-polish` → `vera-concierge`, each rebased on `main` **before** its pull request is opened (after that, too: rebase onto `main` and `--force-with-lease`; owner's hard rule of 2026-11-18).
- **Finished and removed sub chats** — their knowledge lives in `.agent/harvest/`: contact form, Firefox e2e, baseline review, favicon, GDPR.

## 🎯 Next unblocked actions

1. Owner GO → commit the consolidation on `chore/goodbye-harvest`, push, open the pull request (compare link + drafted body), merge. Docs only, but the merge still triggers a production deploy.
2. Pull requests in the merge order above; before each: rebase on `main`, full DoD (`npm run lint` → `npm test -- --run` → `npm run test:e2e` → `npm run build` → `npm run test:visual` → `npm run audit:gdpr`), Review Brief, GO.
3. Re-run PageSpeed mobile on https://www.fiorevera.hu now that `2f97d84` is on `main`, and start `docs/qa/web-vitals-log.md` with both runs (SEO Webvitals chat). Then font subsetting — the 800 ms render delay is the remaining LCP lever (`BACKLOG.md` `[PERF]`).
4. ~~Gate hardening~~ done with pull request 9 (2026-11-18). Left from that chat: the font-coverage test (`tests/unit/fonts.test.ts`), held back until `perf/web-vitals` is on `main`, and switching on the prepared CI workflow (`docs/ci/README.md`, owner decision).
5. Search Console: hreflang report and index coverage on day 7 (2026-11-23) and day 30 (2026-12-16) — MASTER-PLAN 4.4.
6. ~~Privacy page lines, `hosting` register entry, `PRIVACY_UPDATED` bump~~ (done, pull request 11). Still open: Rackhost zone pre-fill and post-transfer sweep (plan §0a B7–B9), DE/EN inner-page baselines after copy sign-off.

## 🙋 Open owner decisions (details in `BACKLOG.md` and § 6 of each harvest note)

- **Vera:** the 15 cover picks, copy sign-off per locale (R-1), phone check of the three locales — `BACKLOG.md` `[CONTENT]`, MASTER-PLAN 1.3 / 3.4 / 4.2.
- ~~**Privacy copy GO**~~ — given through the visual review of 2026-11-16/18 and shipped (without the two claims of §7.4 that the sources contradict: a DPA on Hobby, San Francisco).
- **Processors:** the Web3Forms DPA is accepted (owner, 2026-11-18). Open: keep consumer Gmail or move the mailbox to Workspace / a HU provider; Vercel Hobby has no written processor contract — `docs/gdpr/processing-record.md`, `BACKLOG.md` `[GDPR]`.
- **Track B at Rackhost:** read registrant + registrar on domain.hu, order with 1 year, registrant = Vera as a private person (D3), mail check before the transfer — `BACKLOG.md` `[LAUNCH]`.
- **Dashboards only the owner can see:** Vercel Analytics shows *Enabled*, Search Console Sitemaps shows *Success*, Vercel deployment-failed notifications on, Gmail shows the sender "Fiore Vera weboldal" with Reply-To = the customer.
- ~~**Voice and copy**~~ — decided 2026-11-18 (HU *te* for the reader's action / *ti* for the couple, no hyphenation, the emoji stays, Vera picks landscape covers): `docs/qa/2026-11-16-minor-triage.md`, `i18n-guardian` §7.
- **Gate changes that need a yes:** pre-push hook skips deletion-only pushes; carousel snapshot targets the carousel itself (re-records two baselines); ~~"301" wording~~ (decided 2026-11-18: 308 stays, wording corrected).
- **Greetings list:** provider and transfer path, frequency ceiling, anniversary opt-out — `BACKLOG.md` `[FEATURE]`, `docs/gdpr/newsletter-consent-concept.md` §5.
- **Taste calls parked in the notes:** full image tier at q76, ~~hero CTA at 375 px, rental price-cell order~~ (decided and built 2026-11-18), the crest across lockscreen / wallpaper / signature, the clef F for print.

## 💡 Learnings this session

Full list with evidence: `.agent/memory.md` (consolidated 2026-11-16). The ones that change how the next session works:

- A pause is a session end. Run the `goodbye` ritual on "we pause" too — this note was a week stale because nobody did. `.agent/hooks.json` is not honoured by Claude Code, so read this file by hand and compare its date with the last commit.
- `main` is production. Never commit on it; fetch and fast-forward before committing; update a branch by rebasing onto `origin/main`, never by merging `main` in (owner's hard rule of 2026-11-18), then `git push --force-with-lease`.
- Every code-writing sub chat gets its own worktree. One checkout means one `.env.local`, one dev server on :5173, one preview on :4173, one branch — and a push carries every unpushed commit on it.
- A sub chat writes `.agent/harvest/<name>.md` before it is archived or deleted; do not remove a worktree while its session may be mid-gate.
- The rtk hook reformats git output and rewrites `npx`: use `rtk proxy git …`, `./node_modules/.bin/<bin>`, `/usr/bin/grep` for anything that is evidence. A piped test run hides its exit code — compare the passed total with the expected one.
- Every e2e spec imports `test, expect` from `./fixtures`; real form submissions cost quota and reach Vera's inbox — ask before each one.
- A green pixel gate proves "like before", not "correct": every new baseline gets a human look, and re-baselining goes only through `npm run test:visual:update -- --approved-by="<name>"`.
- `vercel.json` takes schema keys only; a branch cut before a `vercel.json` fix fails Vercel's preview check until `main` is merged in.
- The privacy page must describe exactly what the code does (2026-11-19: it does again; check a copy proposal's facts against the provider's pages on the day it ships).
- Added 2026-11-19 by the Site polish close: a visual change is approved only on the generated review page (`npm run visual:page`); before any push to a branch with a pull request, check that it is still open; a flaky test is a bug report until proven otherwise; `global.css` loads after the component modules, so a utility class beats a module class on the same element.
