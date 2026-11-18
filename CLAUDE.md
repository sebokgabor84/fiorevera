# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read this first

**`AGENTS.md` is the operating contract for this repo** — read it at the start of every session, then `README.md` (iteration checkpoint) and `.agent/last-session-handover.md` (where the previous session left off). `AGENTS.md` defines the coordinator persona ("Vera"), the working principles (push back on flawed plans, zero-guessing, mandatory Honest Critique, code-first skills), the 7-step Release Protocol (feature branch → plan + critique → DoD → review brief → commit/push only after an explicit "GO" → MR checklist → merge after second "GO"), the session boot sequence + State Report, the skill routing table, and the `BACKLOG.md` protocol. This file does not restate those; it captures the build-level facts around them.

Session close goes through the `goodbye` skill (`.agent/skills/goodbye/SKILL.md`): it syncs `BACKLOG.md`, appends learnings to `.agent/memory.md`, and rewrites `.agent/last-session-handover.md`.

## Project state (as of 2026-11-16)

**Fiore Vera** — a multilingual (HU primary / DE / EN) wedding decoration, floristry and prop-rental site, prerendered to static HTML per route (PRD D-18). **Live on https://www.fiorevera.hu since 2026-11-16**; it replaced the Webnode legacy site, whose plan had expired (content archived under `references/legacy/`). Hosting: Vercel, team `fiorevera`, project `fioreveraviragesdekor001`, Hobby plan by owner decision D1 (Pro is the fall-back on a pause). **Production deploys from `main` on every push**; pull requests get a Vercel preview check. DNS is still served from Webnode's DNS centre (Register.it nameservers) until the Rackhost transfer (launch plan Track B). Operational facts (hosting settings, DNS, uptime monitor, Search Console, form quota, rollback, who can do what): `docs/operations/runbook.md`; launch record: `docs/launch/domain-and-hosting-plan.md` (§0a, §1.4) and `docs/launch/legacy-webnode-dns-2026-11-16.md`.

The scope contract is **`MASTER-PLAN.md`** (34 numbered items, frozen from `docs/PRD.md`). Every build action traces to an item; new ideas go to `BACKLOG.md`. As of 2026-11-16 (the first build pass, the QA fixes and the launch work are all merged to `main`):

- **Done:** Phase 0.1 archive (`scripts/archive-legacy.ts` → `references/legacy/`), 0.2 image pipeline (`assets-src/<slot>/` → `public/assets/**.webp` + generated `src/data/generated/imageMeta.ts`), 0.4 page map; Phase 1 (tokens, locale router, i18n parity gate, header + mobile menu, language toast, footer, `SeoHead`, prerender + sitemap); all Phase 2 pages render in all 3 locales with the archived legacy photography; 2.10 contact form on Web3Forms (a real submission from the live site was delivered); 3.2 e2e suite green on all 4 browsers; 4.1 Vercel project; 4.3 DNS cutover. The visual-regression gate is in place (QA reports in `docs/qa/`).
- **Open:** 1.3 Vera's 15 cover picks, 2.3/2.4 copy sign-off (R-1), 3.1 the manual VoiceOver run (axe is a hard gate in the e2e suite since 2026-11-16, `tests/e2e/a11y.spec.ts`), 3.3 Lighthouse ≥ 90 on every route, 3.4 Vera's review checklist, 4.2 Vera's phone sign-off, 4.4 Search Console follow-up (day 7 / day 30), 4.5 Webnode retirement, which ends with the Rackhost transfer. Open work, in-flight branches and owner decisions: `BACKLOG.md`.
- **Heavy folders are git-ignored** (`references/legacy/images/`, `references/legacy/raw/`, `assets-src/`, ~155 MB each side); regenerate with `npm run archive:legacy -- --seed-assets` then `npm run optimize:assets`. `references/legacy/manifest.json` + Markdown pages are committed.

Key source facts: `src/data/routes.ts` is the single route source (router, `SeoHead`, hreflang, sitemap, prerender). `src/i18n/config.ts` creates one pre-initialised i18next instance per locale from the pathname — no language detection, no `changeLanguage`, nothing reads `window` during render (hydration-safe). `src/entry-client.tsx` hydrates when `#root` has element children, else renders (dev). `src/entry-server.tsx` is used by `scripts/prerender.ts` and by `tests/unit/render.test.tsx`. Data lives in `src/data/*.ts` with Zod contracts in `src/data/types.ts`; image lists come only from the generated `imageMeta.ts` (data references slots/album slugs, never filenames — PRD D-5). `src/lib/analytics.ts` starts Vercel Web Analytics only on `fiorevera.hu`, `www.fiorevera.hu` and `*.vercel.app` (never in dev, `vite preview`, Playwright or the visual suite); `src/entry-client.tsx` calls it once after hydration. `src/lib/submitInquiry.ts` is the single place that talks to the form provider (Web3Forms, endpoint and access key from `VITE_FORM_ENDPOINT` / `VITE_FORM_ACCESS_KEY`).

Deploy facts: `vercel.json` (redirects, security headers incl. CSP, `trailingSlash`) may contain only keys of Vercel's schema — the import validator rejects anything else, a `_comment_*` pseudo-key broke the first import on launch day (`dcd491e`); explanations go in `docs/`. The two permanent redirects answer HTTP 308 on Vercel. Unknown URLs get a native HTTP 404 with the single `dist/404.html`; the client renders the localized page (curl therefore sees the HU shell on `/de/<unknown>/`, by design). The Vercel project overrides the install command with `npm ci --ignore-scripts` because `prepare` runs `git config`. `VITE_*` values are inlined into the bundle and therefore public; they are stored on Vercel as plain config, never as secrets.

## Stack & commands

React 19 + TypeScript + Vite 7, Vitest 4 (jsdom, globals on, setup file `src/setupTests.ts`), Playwright (chromium, firefox, webkit, Mobile Chrome), i18next, react-router-dom 7, Zod 4, react-icons. Dev tooling: `sharp`, `qrcode`, `tsx`.

```bash
npm install
npm run dev              # Vite dev server (http://localhost:5173) — CSR in dev; prerendered HTML only in the build
npm run dev:form         # fake form provider + Vite dev server wired to it: test the contact form locally without spending real submissions
npm run form:fake        # only the fake provider (logs JSON POSTs, answers CORS preflight; port FAKE_FORM_PORT, default 8787; add -- --status=500 to test the failure path)
npm run build            # sitemap → tsc -b → vite build → vite build --ssr → scripts/prerender.ts (dist/<route>/index.html)
npm run preview          # serve dist/
npm run lint             # eslint . (0 errors AND 0 warnings) + tsc -p tsconfig.scripts.json (type-check of scripts/, skill scripts, Playwright configs, tests/)
npm run format           # prettier --write .
npm test -- --run        # vitest (116 tests in 15 files: routes, data, i18n parity, server render of every route, archive, assets, form logic, GDPR audit + register seal, sitemap + lastmod, self-tests of the gates)
npm run test:e2e         # playwright, 4 browsers, incl. axe on every route × locale (tests/e2e/a11y.spec.ts); reuses a running dev server only if it was started in THIS checkout (397 passed / 7 skipped on 2026-11-16: compare the total, a piped `| tail` hides the exit code)
npm run test:vitals      # only tests/e2e/vitals.spec.ts
npm run test:visual      # visual regression + layout invariants vs the PRODUCTION build (vite preview :4173); chromium; baselines in tests/visual/__screenshots__/
npm run visual:review    # the same run with the HTML report (expected / actual / diff per snapshot) — for your own look at a red run
npm run visual:page      # the owner's review page for a red visual run (.visual-review/, publish as an Artifact); `-- --answers <file>` judges the pasted answers — the only way a visual change is approved: docs/qa/visual-review-process.md
npm run test:visual:update  # re-baseline — ONLY after the owner approved the new look (scripts/visual-approve.mjs, needs -- --approved-by="<name>")
npm run visual:sheet     # tests/visual/review.html: every baseline on one page; after a red run, expected / actual / diff per failed snapshot (generated, git-ignored)
npm run prepush          # lint → unit → build → visual (the gates .githooks/pre-push runs; the GDPR audit is part of the unit run)
npm run prepare          # git config core.hooksPath .githooks || true (runs on npm install; tolerant, so a plain `npm ci` works outside a git checkout)
npm run release:status   # branch, ahead/behind, open pull requests, keep/delete verdict per branch and worktree, hook health (-- --fetch, -- --previews, -- --json)
npm run release:cleanup  # dry run; -- --apply <branch> deletes a MERGED branch (worktree, local, origin)
npm run release:selftest # replays the forbidden moves (edit/commit/push on main, bypass flags) in a throw-away repo and prints each refusal
npm run archive:legacy -- --seed-assets   # Webnode archive → references/legacy/ + assets-src/
npm run optimize:assets  # assets-src/ → public/assets/**.webp + src/data/generated/imageMeta.ts
npm run sitemap          # regenerates public/sitemap.xml (also the first step of the build)
npm run validate:i18n    # key-parity gate on the three locale files
npm run audit:gdpr       # every data sink in src/, index.html and the CSP must be declared in docs/gdpr/data-register.json (also runs inside npm test); `-- --seal` after an intended register change
npm run verify:live      # read-only health check of https://www.fiorevera.hu: DNS, certificates, all routes, legacy URLs, redirects, 404s (expectations in docs/launch/live-expectations.json)
npm run lockscreen       # regenerates the QR lockscreen PNGs
npm run lockscreen:variants  # regenerates the three alternate lockscreen designs
npm run favicon          # public/favicon.svg → favicon-16/32, apple-touch-icon, android-chrome PNGs (add -- --from <variant-id> to ship a design-round variant first)
npm run favicon:variants # regenerates docs/design/favicon-variants.html (the favicon design round, with 16 px raster proof)
```

Run a single unit test: `npm test -- --run tests/unit/render.test.tsx` (or `-t "test name"`).
Run a single e2e spec: `npx playwright test tests/e2e/<name>.spec.ts`. Playwright reuses an already-running dev server locally (`reuseExistingServer`), uses 1 worker + 2 retries on CI. **Server identity** (`scripts/checkout.ts`, `tests/support/globalSetup.ts`): the dev server (:5173) and the preview (:4173) say which checkout they serve; a git worktree gets its own ports, and both suites stop before the first test when the server belongs to another checkout or, for the visual suite, when `dist/` is missing or older than the sources. No CI runs yet; the prepared workflow and what the pixel gate would need there are in `docs/ci/README.md`.

## Definition of Done (enforced before every commit/push)

Run in order, stop on first failure, **fix the code not the test**: `npm run lint` → `npm test -- --run` → `npm run test:e2e` → `npm run build` (prerender must succeed) → `npm run test:visual` (layout invariants + pixel baselines against the production build). A build slice is additionally not "done" until it has been **visually verified** in a real browser at 375, 768, 1280 and 1920 px with the menu open and the toast visible (README step 9 / `AGENTS.md` POST-5) — the automated gates catch regressions, not taste. The git pre-push hook (`.githooks/pre-push`, installed by `npm run prepare`) refuses any push to `main` and otherwise runs lint → unit → build → visual (a push that only deletes branches skips the gates); `FV_SKIP_HOOKS=1` is the owner's emergency bypass for his own terminal and must be recorded in the PR — an agent never sets it. Re-baseline (`npm run test:visual:update`) only after an explicit owner GO on the new look — never to make a red run green. No commit without an explicit user "GO".

**Code-writing agents never commit on `main`.** `main` deploys production on Vercel with every push; work happens on a `feature/<short-desc>` branch (in its own worktree when several sessions run at once) and reaches `main` only through a pull request the owner merges. This is enforced in code, not by habit — see "Release guardrails" below and `.agent/skills/release-manager/SKILL.md`.

## Conventions that will trip you up

- **Skill registry drift gate.** `src/types/skills.ts` holds the `SKILL_NAMES` const union (14 skills). `tests/unit/skills.test.ts` fails if a skill directory exists on disk without a union entry, if a union entry has no `SKILL.md`, or if a skill name is not mentioned in backticks in `AGENTS.md`. Adding/renaming a skill means touching all three. The same test also fails if `CLAUDE.md`, `README.md`, or `AGENTS.md` contain the legacy singular-named agent file name (`AGENTS.md` is canonical) — don't write that string anywhere in these docs.
- **ESLint `check-file` naming** (errors, not warnings):
  - `src/components/**/` folders → `PASCAL_CASE`
  - `src/components/**/*.tsx` → `PASCAL_CASE`
  - other `src/**/*.ts` → `camelCase`
  - `src/**/*.css` → `kebab-case`
  ESLint runs on every `*.ts`/`*.tsx` in the repo (`scripts/`, `tests/` included); only `dist` is ignored. `tsc -b` type-checks `src/` and `vite.config.ts` only; `scripts/`, the skill scripts, the Playwright configs and `tests/` are type-checked by `tsc -p tsconfig.scripts.json`, which `npm run lint` runs after ESLint.
- **Playwright specs import `test`/`expect` from `./fixtures`** (`tests/e2e/fixtures.ts`, re-exported by `tests/visual/fixtures.ts`), never from `@playwright/test`: the fixture aborts every request to a real form provider. ESLint (`no-restricted-imports`) fails on a bare import; type-only imports are fine.
- **TS is strict**: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports must use `import type`), `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. No `any` (qa-specialist vetoes it, even in temp scripts).
- **Zod DTOs**: data structures are validated against schemas in `src/data/types.ts` before tests. If validation fails, fix the data, not the schema.
- **Semantic HTML / a11y**: `jsx-a11y` recommended rules are on; interactive elements must be native (`<button>`, `<a>`), no `onClick` on `<div>`. The skip link targeting `#main-content` is rendered by `src/components/Layout/Layout.tsx` in the page's language (`common.skipToContent`), as the first focusable element; `index.html` does not ship one.
- **E2E fixture rule**: every spec in `tests/e2e/` imports `test` and `expect` from `./fixtures` (`tests/e2e/fixtures.ts`), never from `@playwright/test`. The auto fixture aborts every request to the real form providers (`api.web3forms.com`, `formspree.io`) in every test; a spec with the bare import loses that guard and can spend real submissions (250 a month) and reach the business inbox. Tests that need a provider answer mock it with `page.route()`. The visual specs still use the bare import and never press submit.
- **Images**: site assets go in `public/assets/` as `webp`, ≤ 200 KB. (The `lockscreen/` folder is exempt — it is a generated-asset workspace, not shipped site imagery.)
- **i18n**: all copy is keyed (HU/DE/EN) in `src/i18n/locales/*.json`; `tests/unit/i18n.test.ts` fails on a missing key, an empty string, or an identical value in all three locales (whitelist in `scripts/validate-i18n.ts`), on legacy typos, on garden mentions outside `about.garden.*` (PRD D-16) and on SEO titles > 60 / descriptions > 160 chars. The toast strings are rendered in the *target* locale via `getI18n(target)`.
- **Hydration safety (PRD D-18)**: no `window`/`document`/`localStorage`/`Intl`/`Date` in render paths — effects only (`react-hooks/set-state-in-effect` is an error: use a callback such as `requestAnimationFrame` inside the effect). `formatHuf` and `PRIVACY_UPDATED` are hand-formatted for this reason.
- **Generated files**: `src/data/generated/imageMeta.ts`, `public/sitemap.xml`, `scripts/sitemap-lastmod.json` (per-route content fingerprint + `lastmod` date) and `docs/gdpr/data-register.seal.json` are generated — never hand-edit, re-run the scripts. After a copy or data change `npm run sitemap` (part of `npm run build`) refreshes the sitemap dates; commit both files with the change (`tests/unit/sitemap.test.ts` fails while they are stale).
- `.env.example` lists `VITE_FORM_ENDPOINT` / `VITE_FORM_ACCESS_KEY` (contact form provider).
- **Shell**: prefix commands with `rtk` (see `.agent/rules/antigravity-rtk-rules.md` and the global RTK rule); the Claude Code hook rewrites them automatically.

## Brand tokens (locked)

Confirmed in `design-system-expert` and `.agent/memory.md` — use these, do not re-derive from the legacy site:

| Token | Value |
|---|---|
| Background linen | `#faf7f2` |
| Soft sage | `#7a8b7b` |
| Muted blush | `#e8c5c8` |
| Warm gold | `#d4af37` |
| Text main / muted | `#2c2825` / `#6b635b` |
| Headings | Cormorant Garamond (fallback Playfair Display, serif) |
| Body | Inter (fallback Lato, sans-serif) |

Mood: romantic, rustic-elegant, warm, organic — the legacy aesthetic elevated, not replaced.

## Architecture: skill-driven agent workflow

Work is routed through `.agent/skills/<name>/SKILL.md`. 14 skills: 10 domain skills (design-system-expert, seo-expert, accessibility-expert, i18n-guardian, gdpr-guardian, qa-specialist, skill-creator, lockscreen-qr-generator, desktop-background-generator, favicon-builder), 2 planning skills (grill-me, to-prd), the goodbye close ritual and the release-manager (branch → GO 1 → pull request → GO 2). `AGENTS.md`'s routing table maps trigger keywords → skill; if nothing matches, stop and propose creating one via `skill-creator` rather than guessing. All 10 domain skills are retained intentionally — the goal is a digital + physical brand ecosystem (website + iPhone-lockscreen QR + Mac wallpaper), not just the site.

**Reshape status (2026-11-18): all 14 skills describe this repo.** `release-manager` was created code-first on 2026-11-18 (branch and release guardrails). `design-system-expert`, `seo-expert`, `i18n-guardian`, `qa-specialist`, `lockscreen-qr-generator` and `desktop-background-generator` were rewritten code-first for Fiore Vera on 2026-11-09 (MASTER-PLAN 0.3); `accessibility-expert`, `skill-creator`, `goodbye` were updated earlier; `grill-me` and `to-prd` are project-neutral; `favicon-builder` was created code-first on 2026-11-09 (favicon design round); `gdpr-guardian` was created code-first on 2026-11-10 (greetings-list concept). If a skill contradicts the code, the code wins — fix the skill in the same change.

**Release guardrails** (`main` = production; nothing is edited, committed, merged or pushed there). Four layers: (1) Claude Code hooks wired in the committed `.claude/settings.json` — `.claude/hooks/guard-main-edit.sh` denies Edit/Write in a checkout on `main` (git-ignored files stay writable), `guard-bash.sh` denies the bypass routes (`--no-verify`, `FV_SKIP_HOOKS=1`, changing `core.hooksPath`, push to `main`, force push, merge into local `main`, `vercel --prod/promote/rollback`), `session-start.sh` prints branch, dirty state, open pull requests, hook health and the handover note, `stop-reminder.sh` reminds when work is uncommitted and `goodbye` has not run, `session-end.sh` records how a session ended; all are bash + git + jq, no node. (2) Git hooks in `.githooks/`: `pre-commit` and `pre-merge-commit` refuse on `main`, `pre-push` refuses any push to `main`. (3) The GitHub ruleset on `main` — the only layer nobody can bypass; the owner switches it on. (4) Two human gates: GO 1 = commit and push the branch, GO 2 = the owner merges the pull request on GitHub. Scripts: `scripts/release/status.mjs`, `cleanup.mjs`, `selftest.sh` (`npm run release:*`). App-created worktrees run the git hooks of the shared checkout (worktree-scoped absolute `core.hooksPath`), so the shared checkout stays on an up-to-date `main`. `.claude/settings.local.json` stays git-ignored and personal. Rules: `.agent/skills/release-manager/SKILL.md`.

**Personal-data register** (`docs/gdpr/data-register.json`, checked by `npm run audit:gdpr`): every form field, storage key, `VITE_*` endpoint, network-sending file, external host and `navigator.*` signal in `src/`, `index.html` and the CSP must be declared with a purpose and the `privacy.*` key that explains it — the audit fails on an undeclared sink. The consent-based greetings list (opt-in e-mail, a few mails a year + anniversary) is a concept only: `docs/gdpr/newsletter-consent-concept.md` holds the legal basis, the design and the HU/DE/EN copy proposals, which stay out of the locale files until the owner's GO. Rules: `.agent/skills/gdpr-guardian/SKILL.md`.

<!-- superseded on 2026-11-09:
- `design-system-expert` is **partially reshaped**: the palette/typography/CSS principles are Fiore Vera, but the asset library, "Sparring Manifesto" (still vetoes breaking the "Steampunk aesthetic"), artisan terminology, Mission Control vocabulary and `resources/*.md` are GaborPortfolio leftovers. Trust the token table, not the rest.
- `accessibility-expert`, `skill-creator`, `goodbye` have been updated for this repo.
- `seo-expert`, `i18n-guardian`, `qa-specialist`, `lockscreen-qr-generator`, `desktop-background-generator` are still the portfolio versions (steampunk prompts, portfolio data contracts). Their *process* transfers; their examples do not.
-->

**Favicon pipeline** (`scripts/favicon/crest.ts` side-effect-free crest builder, `scripts/favicon/variants.ts` design-round catalogue, `scripts/favicon/glyphs.ts` Cormorant outlines generated by `scripts/favicon/extract-glyphs.py`, `scripts/generate-favicons.ts` → `npm run favicon`, `scripts/favicon-variants.ts` → `npm run favicon:variants`): the favicon is a family crest — the badge's open arc with three trailing dots per side, always carrying a letter — rendered only from the five locked tokens and checked at 16 px with sharp. Rules and the owner interview: `.agent/skills/favicon-builder/SKILL.md`.

**Lockscreen pipeline** (`scripts/generate-lockscreen.ts` + `scripts/lockscreen/designs.ts`, run via `npm run lockscreen` / `npm run lockscreen:variants`): sharp composites the brand badge and a `qrcode`-generated QR onto the committed inputs under `public/assets/lockscreen/`; linen-classic is the confirmed final, with an Instagram edition. All inputs are repo-local since 2026-11-08. Details, QR rules and the owner's taste constraints: `.agent/skills/lockscreen-qr-generator/SKILL.md`.

**Planning docs**: `BACKLOG.md` (repo root) is the single source of truth for open work, with the status schema defined in `AGENTS.md` (`- [STATUS] **[CATEGORY]** Description — \`reference\` _(added: YYYY-MM-DD)_`). Once the PRD is grilled, `MASTER-PLAN.md` becomes the frozen build scope: every build action traces to a numbered item; emergent ideas go to `BACKLOG.md`, never silently into the master plan.

**`.agent/` layout**: `hooks.json` (session-start injection of the handover note — honoured by the Antigravity IDE, not by Claude Code, so read the handover manually), `last-session-handover.md`, `memory.md` (cross-session learnings + improvement proposals), `rules/` (RTK), `skills/`.
