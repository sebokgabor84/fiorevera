# Harvest: Quality gates (axe gate, server identity, GDPR audit in the unit run, scripts type-check, verify-live, sitemap lastmod)
Session: quality-gates (`claude/quality-gates-e8a654`) · period: 2026-11-16–2026-11-18, follow-up merged 2026-11-19 · commits on main: `4e5c3cc` (pull request 9, merge `3fd956a`), `e82068e` (pull request 12, merge `3a73c15`)

Written on 2026-11-20 by the session-close chat, not by the session itself: the chat was merged and removed without a note. Sources: the session's working note (outside the repo), `git`, `docs/ci/README.md`, `.agent/skills/qa-specialist/SKILL.md`, `BACKLOG.md`. What these do not say is "not recorded". Code facts are those of `main` at `4d2106f`; "in BACKLOG" means the working copy of the close branch `chore/session-close-2026-11-20` on 2026-11-20.

## 1. What this session delivered
All in `4e5c3cc` unless a commit is named. Its message says it builds what the sessions of 2026-11-09..16 proposed in section 4 of their harvest notes.
- Server identity: the dev and the preview server answer `/__fv/checkout` with the folder they serve; both Playwright suites refuse a server of another checkout; a git worktree gets its own ports; the visual suite refuses a missing or stale `dist/` — `scripts/checkout.ts`, `tests/support/globalSetup.ts`, `playwright.config.ts`, `playwright.visual.config.ts`
- axe as a hard gate (MASTER-PLAN 3.1, machine part): full default rule set on 21 routes, the 3 localized 404s, form errors, the open mobile menu and the language toast, 4 browsers — `tests/e2e/a11y.spec.ts`
- Provider guard made structural: ESLint `no-restricted-imports` fails on a bare `@playwright/test` import in a spec; the visual specs use the blocking fixture — `eslint.config.js`, `tests/visual/fixtures.ts`
- Contact e2e: consent box unticked in all locales and nothing sent without it; request body = exactly the keys of `inquiryPayload`; the success path fails instead of skipping when `CI` is set; errors located by id, values by value — `tests/e2e/contact.spec.ts`
- Personal-data audit as a function inside `npm test` (so also in the pre-push hook); it also catches iframes, external scripts, preconnects, web fonts in CSS and cookie writes; register got `inquiryPayload` and a seal (`npm run audit:gdpr -- --seal`) — `tests/unit/gdpr.test.ts`, `.agent/skills/gdpr-guardian/scripts/audit-personal-data.ts`, `docs/gdpr/data-register.seal.json`
- Type-check of `scripts/`, the skill scripts, the Playwright configs and `tests/`, run by `npm run lint` — `tsconfig.scripts.json`, `package.json`
- `npm run verify:live`: read-only check of DNS, certificates, routes, legacy URLs, redirects, 404s on the live site; 20 of 20 green after the deploy of 2026-11-18 — `scripts/verify-live.ts`, `docs/launch/live-expectations.json`, `tests/unit/verifyLive.test.ts`
- Sitemap `<lastmod>` from a per-route content fingerprint (that page's copy in its language + `src/data/**`); the live sitemap carried 21 `<lastmod>` lines on 2026-11-18 — `scripts/generate-sitemap.ts`, `scripts/sitemap-lastmod.json`, `tests/unit/sitemap.test.ts`
- Visual suite: `snapshotElement()` (viewport guard on every element snapshot), guard on the menu-open shot, new layout invariant "a single-token link never wraps" with a self-test; the carousel slide-2 snapshots target the carousel element (two baselines re-recorded through `scripts/visual-approve.mjs`) — `tests/visual/helpers.ts`, `tests/visual/layout.spec.ts`, `tests/visual/snapshots.spec.ts`, `docs/qa/visual-baselines-log.md` (row 2026-11-18)
- Contact sheet shows expected / actual / diff per failed snapshot; `npm run visual:sheet`; `tests/visual/review.html` is generated and git-ignored — `scripts/visual-contact-sheet.mjs`, `.gitignore`
- Self-tests of the gates (foreign server, missing identity, wrong mode, worktree ports, stale `dist/`, the ESLint rule) — `tests/unit/gates.test.ts`
- CI proposal, prepared and NOT active — `docs/ci/README.md`, `docs/ci/github-actions-ci.yml` (no `.github/workflows/` exists on 2026-11-20)
- Two fixes in `src/components/`, both found by the new gates: footer grid two columns from 48rem and four from 70rem (the e-mail broke mid-word at 768 and 1024 px on the live site) — `src/components/Layout/footer.module.css`; the carousel's accessible name carries the venue (axe `landmark-unique`: two albums share a couple's names) — `src/components/Gallery/AlbumSection.tsx`
- Font-coverage test (5 tests): every character in the three locale files and in the literals of `src/` lies inside a declared `unicode-range` — `tests/unit/fonts.test.ts` / `e82068e`. The working note names it as local commit `77d6e43` on `test/font-coverage`; it reached `main` from branch `chore/font-coverage`. Who pushed it: not recorded.
- Numbers measured by the session: unit 116 in 15 files, e2e 397 passed / 7 skipped (101 per project), visual 110 (83 layout, 27 pixel); with the font test unit 121 in 16 files.

## 2. Learnings (rules a future agent must follow)
- **Never start a dev or preview server by hand on another checkout's port; a worktree has its own** — a reused server of another checkout made green and red meaningless; the suite now stops with "serves another checkout" and prints the `lsof` command. `scripts/checkout.ts`, `tests/unit/gates.test.ts`, `4e5c3cc`. [testing] [tooling]
- **`npm run test:visual` needs a build newer than the sources** — otherwise "dist/ is older than the sources: <file>"; run `npm run build` and repeat. `tests/support/globalSetup.ts`. [testing]
- **A copy or `src/data/**` change needs `npm run sitemap`, and both `public/sitemap.xml` and `scripts/sitemap-lastmod.json` in the commit; after a merge conflict in those two take either side and run `npm run sitemap`** — `tests/unit/sitemap.test.ts` is red otherwise. An image re-optimisation that changes `src/data/generated/imageMeta.ts` moves the date of every route, by intent. Working note, 2026-11-16. [seo] [tooling]
- **A register change needs a new seal; a new data sink is declared first, then sealed** — form field, provider key, cookie, iframe, external script, preconnect, web font: `tests/unit/gdpr.test.ts` or `tests/e2e/contact.spec.ts` is red until `docs/gdpr/data-register.json` names it and `npm run audit:gdpr -- --seal` ran. [legal] [testing]
- **A new page or UI state (dialog, expanded panel) gets its scan in `tests/e2e/a11y.spec.ts` by hand** — nothing fails by itself when it is forgotten. `.agent/skills/qa-specialist/SKILL.md` §5. [testing]
- **A wrapped single-token link is fixed in the layout, never excluded from the invariant** — on its first run the invariant found the footer e-mail breaking at 768 and 1024 px on every page of the live site. `tests/visual/layout.spec.ts`, `4e5c3cc`. [testing] [design]
- **If the footer is restyled, the e-mail stays on one line at every width in `LAYOUT_WIDTHS`** — the contact column was 151 / 201 px wide, the address needs 218 px. `src/components/Layout/footer.module.css`. [design]
- **Two regions with the same accessible name fail axe `landmark-unique`; album names repeat, so the name needs the venue** — `src/components/Gallery/AlbumSection.tsx`, `4e5c3cc`. [architecture] [testing]
- **A new gate that is red on today's `main` lands after the change that makes it green** — the font test was red on `main` (U+2192 after the service-card links, `src/components/Home/HomeSections.tsx`, outside the declared ranges) and green on `perf/web-vitals`; it was held back and merged as pull request 12 after pull request 7. `e82068e`. [workflow] [testing]
- **A spec locates by id and value, not by markup or key names a sibling session is about to change** — `tests/e2e/contact.spec.ts` no longer depends on `role="alert"` per field or on payload key names (agreed with Site polish, 2026-11-18). [testing] [workflow]
- **On Vercel the trailing slash is added before the redirect rules run** — the two no-slash rules in `vercel.json` never fire; `/viragoskert` takes two 308 hops. Found by `npm run verify:live`, 2026-11-16. [seo] [ops]
- **A workflow that never ran is a proposal** — nothing in `docs/ci/` has run on Linux; duration (5–8 minutes) is an estimate. `docs/ci/README.md` "Never verified". [ops] [testing]
- **Superseded: "an open pull request's branch is updated by merging `main` in, never by force-push"** — the session's rule on 2026-11-18 morning; the owner's hard rule of the same day says rebase + `--force-with-lease` (`9b03afe`, `.agent/skills/release-manager/SKILL.md` §5). [workflow]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| GO to commit and push `4e5c3cc`; merged as pull request 9 | owner, 2026-11-18 | merge `3fd956a` | no |
| The two carousel baselines (1072×833 → 1072×716, 343×395 → 343×230) | owner in chat, 2026-11-18 | `docs/qa/visual-baselines-log.md` | no |
| Ports: main checkout :5173 / :4173, a worktree its own stable ports | built 2026-11-16 | `scripts/checkout.ts`, `qa-specialist` §5 | no |
| `tests/visual/review.html` is generated, git-ignored, never committed | decided by: not recorded; built in `4e5c3cc` | `.gitignore`, `qa-specialist` §2 | no |
| `verify:live` is not a gate (needs the network and the live site) | session | `qa-specialist` §5 | no |
| `verify:live` exists | `4e5c3cc` | `scripts/verify-live.ts` | YES → `docs/operations/runbook.md` line 196 still calls it "proposed and in flight" |
| Sitemap `lastmod` is built | `4e5c3cc` | `scripts/generate-sitemap.ts` | YES → `.agent/skills/seo-expert/SKILL.md` "Open SEO backlog" still lists it as open |
| "Conflict in the two sitemap files: take either side, run `npm run sitemap`" | session note, 2026-11-16 | — | YES → `seo-expert` or `qa-specialist` (no skill or doc says it) |
| CI: GitHub Actions, free for this public repo; start without the pixel gate | proposal of the session; owner has not decided | `docs/ci/README.md` | no |
| Register version 2026-11-16, sealed (re-sealed 2026-11-18 by Site polish) | session | `docs/gdpr/data-register.seal.json`, `gdpr-guardian` | no |
| Three Vercel projects deploy every commit of the repository (`fioreveraviragesdekor001`, `fioreveraviragesdekor`, `fiorevera`) | observed 2026-11-18 | `BACKLOG.md` `[OWNER]` | no |

## 4. Improvements NOT implemented yet
- [ ] Switch on the prepared CI workflow (move `docs/ci/github-actions-ci.yml` to `.github/workflows/ci.yml`) — gates on a neutral machine, no bypass — acceptance: a green run on a pull request — S — y (in BACKLOG: yes)
- [ ] Make that check mandatory in a ruleset on `main` — without it a red pull request can still be merged — `docs/ci/README.md` — S — y (in BACKLOG: yes)
- [ ] Linux baseline set for the pixel gate on CI: record in the pinned Playwright container, per-platform folder in `playwright.visual.config.ts`, a re-record workflow, a Linux approval path in `scripts/visual-approve.mjs`; every visual change is then approved twice — L — y (in BACKLOG: yes)
- [ ] Alternative not taken: the container as the only baseline truth, visual suite in Docker locally too (one set, needs Docker on the owner's Mac, slower pre-commit) — `docs/ci/README.md` — L — y (in BACKLOG: NO)
- [ ] Firefox, WebKit and Mobile Chrome as a second CI job — they stay local today; roughly triples the run time — `docs/ci/github-actions-ci.yml` — S — y (in BACKLOG: NO)
- [ ] Pin the workflow's actions (`actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`) to commit hashes — safer against a moved tag; the hashes were not looked up — S — n (in BACKLOG: NO)
- [ ] First Linux run: the layout invariants and `tests/e2e/vitals.spec.ts` (LCP, CLS on a slow runner) were never verified there — acceptance: green on a runner, or the invariant's numbers explain the difference — S — n (in BACKLOG: NO; the Firefox-on-Linux check is listed)
- [ ] Manual VoiceOver run of MASTER-PLAN 3.1 — axe covers only what a machine can check — acceptance: a dated record of the run — S — y (in BACKLOG: NO as a line of its own; it is named inside the `[BUILD]` umbrella line and the closed `[QA]` Playwright line, and open in `MASTER-PLAN.md` 3.1)
- [ ] Drop the two dead no-slash redirect rules in `vercel.json`, or accept the two hops — S — y (in BACKLOG: yes)
- [ ] Remove the two leftover Vercel projects that build every commit — owner's dashboard — S — y (in BACKLOG: yes)

## 5. Skill updates needed
- `.agent/skills/qa-specialist/SKILL.md` §1: row 4 says "413 passed, 7 skipped (2026-11-19)" next to "101 tests per project", and the E2E heading says "101 tests × 4 projects" with `gallery` (3). 413 + 7 = 420 = 105 × 4, and `tests/e2e/gallery.spec.ts` holds 7 tests since `a9150b0`. Recount with `playwright test --list`; `CLAUDE.md` still quotes 397 / 7 of 2026-11-16.
- `.agent/skills/qa-specialist/SKILL.md` §3 and `.agent/skills/seo-expert/SKILL.md`: add the sitemap conflict rule (§ 3 above).
- `.agent/skills/seo-expert/SKILL.md` "Open SEO backlog": remove the "Sitemap `lastmod`" row (done in `4e5c3cc`).
- `.agent/skills/accessibility-expert/SKILL.md` §3 "Unique labels on repeated landmarks" names `<nav>` only: add the carousel regions (name + venue).
- `docs/operations/runbook.md` line 196 (not a skill): `npm run verify:live` exists; the hand-typed block above it is the fall-back, not the procedure.

## 6. Open owner decisions / things only Gabor or Vera can do
- CI. Options: (a) switch it on without the pixel gate, (b) with a Linux baseline set and double approvals, (c) leave it off. Recommendation in `docs/ci/README.md`: (a), revisit pixels when a second person or machine pushes. Pushing a file under `.github/workflows/` over HTTPS needs a token with the `workflow` scope. (in BACKLOG: yes)
- Whether the CI check becomes mandatory on `main` (GitHub ruleset). No recommendation beyond "without that rule a red pull request can still be merged". (in BACKLOG: yes)
- The manual VoiceOver run (MASTER-PLAN 3.1). Who runs it: not recorded. (in BACKLOG: NO as a line of its own)
- The two dead redirect rules: drop or accept. The note calls it harmless. (in BACKLOG: yes)
- The two leftover Vercel projects. (in BACKLOG: yes)

## 7. Friction (what cost time and how to avoid it next time)
- Ports 5173 / 4173 shared between checkouts made runs unreliable → solved in this session (`scripts/checkout.ts`).
- Pull request 9 was merged before pull request 8 (`chore/goodbye-harvest`); the two overlapped in six files (`CLAUDE.md`, `BACKLOG.md`, `MASTER-PLAN.md`, the `qa-specialist`, `gdpr-guardian` and `seo-expert` skills) → agree the merge order before the first pull request opens; in a doc conflict the measured test counts of the gates branch win and the other text goes around them.
- A test that depends on a sibling branch (`perf/web-vitals`) had to wait as a stacked, unpushed local branch → keep such a test as its own commit from the start and say in its message what it depends on (`e82068e` does).
- The chat was removed without its harvest note → this file had to be rebuilt from a working note and `git`; write the note before the pull request is merged.
