---
name: qa-specialist
description: Owns the Fiore Vera quality pipeline — ESLint/tsc strictness, the 54 Vitest tests, the 4-browser Playwright suite, the production build + prerender, the chromium visual-regression gate and the pre-push hook. Use when writing or fixing tests, debugging a red gate, re-baselining screenshots, or validating a slice before any commit or push.
---

# QA Specialist — Fiore Vera

Senior QA for the HU/DE/EN prerendered React 19 + Vite 7 site. Owns the Definition of Done (DoD) that gates every commit in the Release Protocol (`AGENTS.md` POST-1…POST-4) and keeps the numbers in this file current. "It works on my machine" is not a result; a green run with the actual counts is.

*(Boundaries: WCAG/axe rules → `accessibility-expert`; SEO head/JSON-LD content → `seo-expert`; copy and key naming → `i18n-guardian`; CSS fixes → `design-system-expert`. This skill decides whether a gate is red, not what the page should say.)*

## When to use
- Writing or fixing anything under `tests/unit/`, `tests/e2e/`, `tests/visual/`
- A gate is red (lint, tsc, Vitest, Playwright, build, visual) or the pre-push hook refused a push
- Someone asks to skip a gate, re-baseline screenshots, or add `any` "just for now"
- Before every Review Brief: run the DoD, report the numbers

## 1. Definition of Done — run in order, stop on first failure, fix the code not the test

| # | Command | Current green result (2026-11-09) | What it enforces |
|---|---|---|---|
| 1 | `npm run lint` | 0 errors **and** 0 warnings | `eslint.config.js`: ts-eslint recommended, `jsx-a11y` recommended, `react-hooks` recommended incl. `set-state-in-effect` (error — use a callback such as `requestAnimationFrame` inside the effect), `react-refresh/only-export-components` (warn), `check-file`: `src/components/**/` folders and `.tsx` PASCAL_CASE, other `src/**/*.ts` camelCase, `src/**/*.css` kebab-case. Lints `scripts/` and `tests/` too; only `dist` is ignored. |
| 2 | `npx tsc -b` (also step 2 of `npm run build`) | clean | `tsconfig.app.json` (`src/`) + `tsconfig.node.json` (`vite.config.ts`): `strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` (type-only imports must be `import type`), `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. No `any`. `scripts/` and `tests/` are linted but not type-checked by the build — write them as if they were. |
| 3 | `npm test -- --run` | 54 passed in 7 files | Vitest 4, jsdom, `globals: true`, setup `src/setupTests.ts` (jest-dom). Excludes `tests/e2e/**`, `tests/visual/**`. Files below. |
| 4 | `npm run test:e2e` | 260 passed, 16 skipped | Playwright, 4 projects (chromium, firefox, webkit, Mobile Chrome = Pixel 5), 69 tests per project against the **dev server** (:5173, CSR). Skips below. |
| 5 | `npm run build` | 21 pages + `dist/404.html` | `scripts/generate-sitemap.ts` → `tsc -b` → `vite build` → `vite build --ssr src/entry-server.tsx --outDir dist-ssr` → `scripts/prerender.ts` (7 pages × 3 locales from `src/data/routes.ts`, one empty-root noindex 404). |
| 6 | `npm run test:visual` (after step 5) | all green vs committed baselines | Section 2. Replaces the "eyeball it at one width" step; the browser look-through (README step 9 / POST-4) still happens before the Review Brief. |

### Unit files (54 tests)

| File | Tests | Guards |
|---|---|---|
| `tests/unit/routes.test.ts` | 7 | `src/data/routes.ts`: 7 pages × 3 locales, legacy HU/DE slugs kept, unique paths, trailing-slash matching, localized 404 resolution, hreflang + `x-default → HU`, the two garden 301s (D-16) |
| `tests/unit/data.test.ts` | 6 | Zod contracts: 15 albums (unique ids, cover inside the image list, partners/titleKey), 169 gallery images, 7 rental items (mirror deposit 20 000), services/testimonials/areas/contact, every referenced i18n key exists in all 3 locales, `formatHuf` is hand-formatted |
| `tests/unit/i18n.test.ts` | 6 | parity gate (`validateLocales` → `[]`), negative cases for a missing key / identical value, garden only under `about.garden.*` (D-16), legacy typos absent, SEO titles ≤ 60 / descriptions ≤ 160 |
| `tests/unit/render.test.tsx` | 27 | `src/entry-server.tsx` renders all 21 routes with title, canonical, hreflang, `["Florist","LocalBusiness"]` + stable `url` (QA M3), `#main-content`; 3 localized 404s with `noindex`; no HU nav leaks on DE services; 7 rental items on DE; ImageGallery JSON-LD × 16 |
| `tests/unit/assets.test.ts` | 2 | `public/assets/**` is webp ≤ 200 KB (lockscreen workspace exempt); every `IMAGE_META` entry has dimensions and all three size variants exist on disk |
| `tests/unit/legacyArchive.test.ts` | 2 | `references/legacy/manifest.json` (15 albums / 169 images / 4 testimonials, garden archived) and the Markdown per legacy page |
| `tests/unit/skills.test.ts` | 4 | `SKILL_NAMES` ↔ `.agent/skills/*` ↔ backticked mention in `AGENTS.md`; no legacy singular agent-file name in the core docs |

### E2E (7 specs, 69 tests × 4 projects)
`navigation` (21 routes × locale, 3 localized 404s, DE CTAs stay in `/de/`, keyboard nav, mobile menu), `seo` (21 heads), `contact` (5), `locale` (5: toast for de-*/en-* browsers only, dismiss persists), `gallery` (3), `rental` (4), `vitals` (4: CLS < 0.1, LCP < 4 s on the dev build). The 16 skips are intentional: **4** are the `isMobile` split (`header navigation reaches every page by keyboard` skips on Mobile Chrome; `mobile menu opens…` skips on the 3 desktop projects) and **12** are the contact success paths (3 locales × 4 projects) that `test.skip` when Playwright reused an already-running dev server started without `VITE_FORM_ENDPOINT`. Start the suite with no dev server running and those 12 execute against the mocked endpoint — then the expected result is 272 passed / 4 skipped.

## 2. Visual regression gate (chromium, production build)

| Fact | Value |
|---|---|
| Config | `playwright.visual.config.ts` — `testDir: tests/visual`, chromium only (Desktop Chrome), `locale: hu-HU`, light scheme, `retries: 0`, `trace: retain-on-failure` |
| Target | `vite preview --port 4173 --strictPort` serving `dist/` (`reuseExistingServer: true` — a stale preview serves a stale build, rebuild first) |
| Comparison | `scale: 'css'`, `animations: 'disabled'`, `caret: 'hide'`, `maxDiffPixelRatio: 0.001`, `maxDiffPixels: 150` |
| Baselines | `tests/visual/__screenshots__/snapshots.spec.ts/<name>.png` — 25 PNGs, committed, rendered on darwin (other OSes rasterise fonts differently and would need their own set) |
| Report | `playwright-report-visual/` (git-ignored) — expected / actual / diff per failure; traces in `test-results/` |
| Run | `npm run build && npm run test:visual` |
| Review a diff | `npm run visual:review` — runs the suite and opens the HTML report (expected / actual / diff per snapshot). Show the owner the diff PNGs (`test-results/**/*-diff.png`) in chat BEFORE proposing anything |
| Re-baseline | `npm run test:visual:update -- --approved-by="<name>" --note="<what changed and why>"` → `scripts/visual-approve.mjs`: refuses without an approver, re-records, lists every changed PNG and appends a row to `docs/qa/visual-baselines-log.md`. **Only after the owner approved the reviewed diff (explicit GO)**, never to make a red run green; never call `--update-snapshots` directly |

`tests/visual/helpers.ts` defines the page set (`PAGES`: 8 HU pages incl. the 404 path `/nincs-ilyen-oldal/`, plus DE/EN home at 375 only), the widths and `openStable()` — toast pre-dismissed, animations and smooth scroll off, `document.fonts.ready`, scroll-through so lazy images mount, then every image inside the 1500 px snapshot area is force-decoded with an 8 s cap.

**`tests/visual/layout.spec.ts` — 82 structural tests, no pixels** (10 pages × 8 widths `320 375 768 1024 1120 1280 1440 1920`; desktop widths use a 768 px tall viewport, phones 812). Each invariant encodes a regression that reached a reviewer on 2026-11-09:

| Invariant | Regression it pins |
|---|---|
| `documentElement.scrollWidth ≤ innerWidth + 1` | horizontal overflow at 320 |
| every `.container` ≤ `--content-max` (`rootRemVar`), header bar ≤ 90rem | QA M1: the safety layer `body, main, section, .container { max-width: 100% }` overrode `--content-max` → 185-char lines, 1840 px carousel |
| header children inside the bar; brand `span` height ≤ 1.6 × font-size; `header nav a, header button` ≤ 2.6 line-heights | wordmark wrapping per character at ≥ 1280 after the bar was capped |
| any `position: sticky` inside `main`: `top + height ≤ innerHeight` | sticky image column pinned under the header on phones, text scrolled behind it |
| no `overflow: hidden` text element with `scrollWidth > clientWidth + 2` (ellipsis allowed) | clipped headings |
| `<img>` without `object-fit: cover/contain` keeps its natural ratio within 2 % | distorted photos |
| overlay hit-tests (home @ 375 / 1280): centre of the first 20 header/CTA controls hits itself via `elementFromPoint` | QA M9: toast (z 120) over the H1, CTAs and the first two menu items (the carousel-arrow hit-test lives in `tests/e2e/gallery.spec.ts`) |
| `< 1120`: menu panel `[role="dialog"]` covers > 70 % of the viewport and owns the centre point; Escape → `aria-expanded="false"` | header `backdrop-filter` became the containing block of the fixed panel; QA M10 Escape only inside the panel |

**`tests/visual/snapshots.spec.ts` — 25 pixel tests**: full-page clips `1500 px` tall (gallery 1100) at 375 and 1280 for the 8 HU pages; `home-de-375`, `home-en-375`; header strip (96 px) at 1120/1280/1440/1920; `menu-open-375`; first gallery carousel on slide 2 at 375 and 1280.

Reading a failure: open `playwright-report-visual/index.html`, look at the diff image first. A diff confined to one component after a CSS change is the change — decide with the owner. A diff everywhere (fonts, anti-aliasing) means a different machine or a stale `dist/`; rebuild, do not re-baseline. A layout invariant failure prints the offending element and numbers in the assertion message — fix the CSS.

## 3. Git hooks
`.githooks/pre-commit`: when staged files touch `src/`, `index.html`, `public/fonts/` or `tests/visual/`, it builds and runs the visual suite; a red run blocks the commit and prints the review → fix-or-approve steps above (measured: ~26 s).
`.githooks/pre-push`: lint → `npm test -- --run` → `npm run build` → `npm run test:visual` (`npm run prepush` runs the same chain by hand). Installed by `npm run prepare` (`git config core.hooksPath .githooks`; verify with `git config core.hooksPath`). E2E is not in the hook (4 browsers ≈ minutes) — run it yourself before the Review Brief. `FV_SKIP_HOOKS=1 git push` bypasses the hook for emergencies only, and the PR body must say so and why.

## 4. Data validation is QA
- **Zod** — `src/data/types.ts` (`AlbumSchema`, `RentalItemSchema`, `ServiceSchema`, `TestimonialSchema`, `ServiceAreasSchema`, `ContactSchema`, `validate*()`), executed by `tests/unit/data.test.ts`. Validation fails → fix the data in `src/data/*.ts`, never widen the schema. Data references slots/album slugs, never filenames (PRD D-5).
- **Images** — `tests/unit/assets.test.ts` checks `public/assets/**` and `src/data/generated/imageMeta.ts` (generated by `npm run optimize:assets`; never hand-edit).
- **i18n** — `scripts/validate-i18n.ts` (parity, empty, identical unless in `IDENTICAL_WHITELIST`, extra keys; CLI `npm run validate:i18n`) + `tests/unit/i18n.test.ts`.
- **Hydration safety (PRD D-18)** — `tests/unit/render.test.tsx` renders every route through `src/entry-server.tsx` without a DOM; anything touching `window`/`document`/`localStorage`/`Intl`/`Date` in a render path throws here. Build-time constants (`__BUILD_YEAR__`, `PRIVACY_UPDATED`, `formatHuf`) exist for this reason.

## 5. Writing a new test

| Question | Put it in |
|---|---|
| Pure data, route table, i18n keys, server HTML | `tests/unit/*.test.ts(x)` — import from `src/`, no browser |
| Behaviour a user triggers (click, type, keyboard, network) in any browser | `tests/e2e/*.spec.ts` — runs in 4 projects; use `test.skip(!isMobile, …)` for project-specific tests |
| "Does it still look / lay out like the approved build" | `tests/visual/` — add a page to `PAGES` in `helpers.ts` (gets 8 layout tests + 2 snapshots), or a new invariant in `layout.spec.ts`; new baselines need a GO |

- **Toast pre-dismissal**: `test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1')))`. The language toast (`LanguageToast.tsx`) shows for de-*/en-* browsers on other-locale pages and sits over the submit button / carousel arrows on phones. Every spec that is not `locale.spec.ts` pre-dismisses it; `openStable()` does it for the visual suite.
- **Strings come from the locale JSON**, never literals: `import { T, hu, de, en } from './locales'` (e2e) or `flatten(loadLocales()[l])` (unit).
- **Binaries**: call `./node_modules/.bin/playwright …` and `./node_modules/.bin/vitest …`. The RTK shell hook rewrites `npx <bin>` to `npm run <bin>`, which fails for anything that is not a script.
- One spec / one project: `./node_modules/.bin/playwright test tests/e2e/gallery.spec.ts --project=chromium`; one unit file: `npm test -- --run tests/unit/render.test.tsx` or `-t "test name"`; one visual test: `./node_modules/.bin/playwright test -c playwright.visual.config.ts -g "home @ 375"`.
- **Form endpoint mock**: `playwright.config.ts` starts the dev server with `VITE_FORM_ENDPOINT=https://mock-form-endpoint.test/submit`; `contact.spec.ts` fulfils that host with `page.route` for success and `route.abort('failed')` for the failure path. No real provider is ever called.
- E2E targets the CSR dev server; anything about the **prerendered** HTML belongs in `render.test.tsx` or the visual suite.

## 6. Debugging
`resources/debugging-guide.md` — traces (`./node_modules/.bin/playwright show-trace test-results/<dir>/trace.zip`), `--reporter=line`, the report folders, and the false positives met on 2026-11-09 (probing below the fold, `boundingBox()` including scroll offset, lazy `img.decode()` hanging).

## 7. Sparring Manifesto (push back, then do it right)
- **No skipped gates.** "Lint later", "e2e is slow", `FV_SKIP_HOOKS=1` without a written reason in the PR — refuse and run the gate.
- **Fix code, not tests.** A test changes only when it is provably wrong (wrong selector, wrong expected copy after an approved copy change) — say which and why in the commit.
- **Never re-baseline to hide a diff.** `test:visual:update` requires the owner's GO on the new look; a red snapshot after an unrelated change is a regression.
- **No `any`, no loose typing**, in `scripts/` and `tests/` as well as `src/`.
- **No visual sign-off from a single width.** The 2026-11-09 session shipped a `backdrop-filter` containing-block bug and a toast over the menu because one width looked fine; `LAYOUT_WIDTHS` exists so that cannot repeat.
- **Numbers live here.** When test counts, skip counts, widths or thresholds change, update this file in the same commit.

## Resources
- `resources/debugging-guide.md` — traces, reporters, false positives, where artefacts land.
