# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read this first

**`AGENTS.md` is the operating contract for this repo** — read it at the start of every session, then `README.md` (iteration checkpoint) and `.agent/last-session-handover.md` (where the previous session left off). `AGENTS.md` defines the coordinator persona ("Vera"), the working principles (push back on flawed plans, zero-guessing, mandatory Honest Critique, code-first skills), the 7-step Release Protocol (feature branch → plan + critique → DoD → review brief → commit/push only after an explicit "GO" → MR checklist → merge after second "GO"), the session boot sequence + State Report, the skill routing table, and the `BACKLOG.md` protocol. This file does not restate those; it captures the build-level facts around them.

Session close goes through the `goodbye` skill (`.agent/skills/goodbye/SKILL.md`): it syncs `BACKLOG.md`, appends learnings to `.agent/memory.md`, and rewrites `.agent/last-session-handover.md`.

## Project state (as of 2026-11-09)

**Fiore Vera** — a multilingual (HU primary / DE / EN) wedding decoration, floristry and prop-rental site, prerendered to static HTML per route (PRD D-18), replacing the Webnode legacy site www.fiorevera.hu. Hosting target: Vercel (not set up yet).

The scope contract is **`MASTER-PLAN.md`** (34 numbered items, frozen from `docs/PRD.md`). Every build action traces to an item; new ideas go to `BACKLOG.md`. As of the first build pass (`feature/site-build`):

- **Done:** Phase 0.1 archive (`scripts/archive-legacy.ts` → `references/legacy/`), 0.2 image pipeline (`assets-src/<slot>/` → `public/assets/**.webp` + generated `src/data/generated/imageMeta.ts`), 0.4 page map; Phase 1 (tokens, locale router, i18n parity gate, header + mobile menu, language toast, footer, `SeoHead`, prerender + sitemap); all Phase 2 pages render in all 3 locales with the archived legacy photography.
- **Open:** 1.3 Vera's 15 cover picks, 2.3/2.4 copy sign-off (R-1), 2.10 form provider endpoint, Phase 3: axe as a hard gate (the 4-browser e2e run, Lighthouse and the visual-regression gate are in place; QA session report in `docs/qa/`), Phase 4 Vercel + cutover.
- **Heavy folders are git-ignored** (`references/legacy/images/`, `references/legacy/raw/`, `assets-src/`, ~155 MB each side); regenerate with `npm run archive:legacy -- --seed-assets` then `npm run optimize:assets`. `references/legacy/manifest.json` + Markdown pages are committed.

Key source facts: `src/data/routes.ts` is the single route source (router, `SeoHead`, hreflang, sitemap, prerender). `src/i18n/config.ts` creates one pre-initialised i18next instance per locale from the pathname — no language detection, no `changeLanguage`, nothing reads `window` during render (hydration-safe). `src/entry-client.tsx` hydrates when `#root` has element children, else renders (dev). `src/entry-server.tsx` is used by `scripts/prerender.ts` and by `tests/unit/render.test.tsx`. Data lives in `src/data/*.ts` with Zod contracts in `src/data/types.ts`; image lists come only from the generated `imageMeta.ts` (data references slots/album slugs, never filenames — PRD D-5).

## Stack & commands

React 19 + TypeScript + Vite 7, Vitest 4 (jsdom, globals on, setup file `src/setupTests.ts`), Playwright (chromium, firefox, webkit, Mobile Chrome), i18next, react-router-dom 7, Zod 4, react-icons. Dev tooling: `sharp`, `qrcode`, `tsx`.

```bash
npm install
npm run dev              # Vite dev server (http://localhost:5173) — CSR in dev; prerendered HTML only in the build
npm run build            # sitemap → tsc -b → vite build → vite build --ssr → scripts/prerender.ts (dist/<route>/index.html)
npm run preview          # serve dist/
npm run lint             # eslint . — 0 errors AND 0 warnings before any commit
npm test -- --run        # vitest (54 tests: routes, data, i18n parity, server render of every route, archive, assets)
npm run test:e2e         # playwright — reuses a running dev server locally; specs in tests/e2e/
npm run test:visual      # visual regression + layout invariants vs the PRODUCTION build (vite preview :4173); chromium; baselines in tests/visual/__screenshots__/
npm run test:visual:update  # re-baseline — ONLY after the owner approved the new look
npm run prepush          # lint → unit → build → visual (what .githooks/pre-push runs)
npm run archive:legacy -- --seed-assets   # Webnode archive → references/legacy/ + assets-src/
npm run optimize:assets  # assets-src/ → public/assets/**.webp + src/data/generated/imageMeta.ts
npm run validate:i18n    # key-parity gate on the three locale files
npm run lockscreen       # regenerates the QR lockscreen PNGs
```

Run a single unit test: `npm test -- --run tests/unit/render.test.tsx` (or `-t "test name"`).
Run a single e2e spec: `npx playwright test tests/e2e/<name>.spec.ts`. Playwright reuses an already-running dev server locally (`reuseExistingServer`), uses 1 worker + 2 retries on CI.

## Definition of Done (enforced before every commit/push)

Run in order, stop on first failure, **fix the code not the test**: `npm run lint` → `npm test -- --run` → `npm run test:e2e` → `npm run build` (prerender must succeed) → `npm run test:visual` (layout invariants + pixel baselines against the production build). A build slice is additionally not "done" until it has been **visually verified** in a real browser at 375, 768, 1280 and 1920 px with the menu open and the toast visible (README step 9 / `AGENTS.md` POST-4) — the automated gates catch regressions, not taste. The git pre-push hook (`.githooks/pre-push`, installed by `npm run prepare`) runs lint → unit → build → visual; `FV_SKIP_HOOKS=1` bypasses it only in an emergency and must be recorded in the PR. Re-baseline (`npm run test:visual:update`) only after an explicit owner GO on the new look — never to make a red run green. No commit without an explicit user "GO".

## Conventions that will trip you up

- **Skill registry drift gate.** `src/types/skills.ts` holds the `SKILL_NAMES` const union (11 skills). `tests/unit/skills.test.ts` fails if a skill directory exists on disk without a union entry, if a union entry has no `SKILL.md`, or if a skill name is not mentioned in backticks in `AGENTS.md`. Adding/renaming a skill means touching all three. The same test also fails if `CLAUDE.md`, `README.md`, or `AGENTS.md` contain the legacy singular-named agent file name (`AGENTS.md` is canonical) — don't write that string anywhere in these docs.
- **ESLint `check-file` naming** (errors, not warnings):
  - `src/components/**/` folders → `PASCAL_CASE`
  - `src/components/**/*.tsx` → `PASCAL_CASE`
  - other `src/**/*.ts` → `camelCase`
  - `src/**/*.css` → `kebab-case`
  ESLint runs on every `*.ts`/`*.tsx` in the repo (`scripts/`, `tests/` included); only `dist` is ignored. `tsc -b` type-checks `src/` and `vite.config.ts` only, so `scripts/` and `tests/` are linted but not part of the build type-check.
- **TS is strict**: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports must use `import type`), `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. No `any` (qa-specialist vetoes it, even in temp scripts).
- **Zod DTOs**: data structures are validated against schemas in `src/data/types.ts` before tests. If validation fails, fix the data, not the schema.
- **Semantic HTML / a11y**: `jsx-a11y` recommended rules are on; interactive elements must be native (`<button>`, `<a>`), no `onClick` on `<div>`. `index.html` already ships the skip link targeting `#main-content`.
- **Images**: site assets go in `public/assets/` as `webp`, ≤ 200 KB. (The `lockscreen/` folder is exempt — it is a generated-asset workspace, not shipped site imagery.)
- **i18n**: all copy is keyed (HU/DE/EN) in `src/i18n/locales/*.json`; `tests/unit/i18n.test.ts` fails on a missing key, an empty string, or an identical value in all three locales (whitelist in `scripts/validate-i18n.ts`), on legacy typos, on garden mentions outside `about.garden.*` (PRD D-16) and on SEO titles > 60 / descriptions > 160 chars. The toast strings are rendered in the *target* locale via `getI18n(target)`.
- **Hydration safety (PRD D-18)**: no `window`/`document`/`localStorage`/`Intl`/`Date` in render paths — effects only (`react-hooks/set-state-in-effect` is an error: use a callback such as `requestAnimationFrame` inside the effect). `formatHuf` and `PRIVACY_UPDATED` are hand-formatted for this reason.
- **Generated files**: `src/data/generated/imageMeta.ts` and `public/sitemap.xml` are generated — never hand-edit, re-run the scripts.
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

Work is routed through `.agent/skills/<name>/SKILL.md`. 11 skills: 8 domain skills (design-system-expert, seo-expert, accessibility-expert, i18n-guardian, qa-specialist, skill-creator, lockscreen-qr-generator, desktop-background-generator), 2 planning skills (grill-me, to-prd), and the goodbye close ritual. `AGENTS.md`'s routing table maps trigger keywords → skill; if nothing matches, stop and propose creating one via `skill-creator` rather than guessing. All 8 domain skills are retained intentionally — the goal is a digital + physical brand ecosystem (website + iPhone-lockscreen QR + Mac wallpaper), not just the site.

**Reshape status (2026-11-09): all 11 skills describe this repo.** `design-system-expert`, `seo-expert`, `i18n-guardian`, `qa-specialist`, `lockscreen-qr-generator` and `desktop-background-generator` were rewritten code-first for Fiore Vera on 2026-11-09 (MASTER-PLAN 0.3); `accessibility-expert`, `skill-creator`, `goodbye` were updated earlier; `grill-me` and `to-prd` are project-neutral. If a skill contradicts the code, the code wins — fix the skill in the same change.

<!-- superseded on 2026-11-09:
- `design-system-expert` is **partially reshaped**: the palette/typography/CSS principles are Fiore Vera, but the asset library, "Sparring Manifesto" (still vetoes breaking the "Steampunk aesthetic"), artisan terminology, Mission Control vocabulary and `resources/*.md` are GaborPortfolio leftovers. Trust the token table, not the rest.
- `accessibility-expert`, `skill-creator`, `goodbye` have been updated for this repo.
- `seo-expert`, `i18n-guardian`, `qa-specialist`, `lockscreen-qr-generator`, `desktop-background-generator` are still the portfolio versions (steampunk prompts, portfolio data contracts). Their *process* transfers; their examples do not.
-->

**Lockscreen pipeline** (`scripts/generate-lockscreen.ts` + `scripts/lockscreen/designs.ts`, run via `npm run lockscreen` / `npm run lockscreen:variants`): sharp composites the brand badge and a `qrcode`-generated QR onto the committed inputs under `public/assets/lockscreen/`; linen-classic is the confirmed final, with an Instagram edition. All inputs are repo-local since 2026-11-08. Details, QR rules and the owner's taste constraints: `.agent/skills/lockscreen-qr-generator/SKILL.md`.

**Planning docs**: `BACKLOG.md` (repo root) is the single source of truth for open work, with the status schema defined in `AGENTS.md` (`- [STATUS] **[CATEGORY]** Description — \`reference\` _(added: YYYY-MM-DD)_`). Once the PRD is grilled, `MASTER-PLAN.md` becomes the frozen build scope: every build action traces to a numbered item; emergent ideas go to `BACKLOG.md`, never silently into the master plan.

**`.agent/` layout**: `hooks.json` (session-start injection of the handover note — honoured by the Antigravity IDE, not by Claude Code, so read the handover manually), `last-session-handover.md`, `memory.md` (cross-session learnings + improvement proposals), `rules/` (RTK), `skills/`.
