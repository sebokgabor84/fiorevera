---
name: qa-specialist
description: Owns the Fiore Vera quality pipeline — ESLint/tsc strictness, the Vitest unit suite, the 4-browser Playwright suite with axe on every route and the fail-closed form-provider guard, the production build + prerender, the chromium visual-regression gate with its owner review flow, the server-identity check and the git hooks. Use when writing or fixing tests, debugging a red gate (incl. Firefox not launching), reviewing or re-baselining screenshots, or validating a slice before any commit or push.
---

# QA Specialist — Fiore Vera

Senior QA for the HU/DE/EN prerendered React 19 + Vite 7 site. Owns the Definition of Done (DoD) that gates every commit in the Release Protocol (`AGENTS.md` POST-1…POST-5) and keeps the numbers in this file current. "It works on my machine" is not a result; a green run with the actual counts is.

*(Boundaries: WCAG/axe rules → `accessibility-expert`; SEO head/JSON-LD content, Lighthouse and PageSpeed numbers → `seo-expert` (§6, `resources/web-vitals.md`); visitor-data audit → `gdpr-guardian`; copy and key naming → `i18n-guardian`; CSS fixes → `design-system-expert`. This skill decides whether a gate is red, not what the page should say.)*

## When to use
- Writing or fixing anything under `tests/unit/`, `tests/e2e/`, `tests/visual/`
- A gate is red (lint, tsc, Vitest, Playwright, build, visual) or the pre-push hook refused a push
- Someone asks to skip a gate, re-baseline screenshots, or add `any` "just for now"
- Before every Review Brief: run the DoD, report the numbers

## 1. Definition of Done — run in order, stop on first failure, fix the code not the test

| # | Command | Current green result (2026-11-16) | What it enforces |
|---|---|---|---|
| 1 | `npm run lint` | 0 errors **and** 0 warnings | `eslint.config.js`: ts-eslint recommended, `jsx-a11y` recommended, `react-hooks` recommended incl. `set-state-in-effect` (error — use a callback such as `requestAnimationFrame` inside the effect), `react-refresh/only-export-components` (warn), `check-file`: `src/components/**/` folders and `.tsx` PASCAL_CASE, other `src/**/*.ts` camelCase, `src/**/*.css` kebab-case. Lints `scripts/` and `tests/` too; only `dist` is ignored. `@typescript-eslint/no-restricted-imports`: a spec or helper under `tests/e2e/` or `tests/visual/` that imports values from `@playwright/test` is an error (import from `./fixtures`; type-only imports are fine). **Then `tsc -p tsconfig.scripts.json`**: type-check of `scripts/`, the skill scripts, the Playwright configs and all of `tests/` — same strict flags as the app. |
| 2 | `./node_modules/.bin/tsc -b` (also step 2 of `npm run build`) | clean | `tsconfig.app.json` (`src/`) + `tsconfig.node.json` (`vite.config.ts`): `strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` (type-only imports must be `import type`), `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. No `any`. `scripts/` and `tests/` are not part of the build's `tsc -b`; step 1 type-checks them. Declare `useCallback`s above the effects that use them: the TDZ error surfaces only here. |
| 3 | `npm test -- --run` | 147 passed in 19 files | Vitest 4, jsdom, `globals: true`, setup `src/setupTests.ts` (jest-dom). Excludes `tests/e2e/**`, `tests/visual/**`. Files below. |
| 4 | `npm run test:e2e` | 397 passed, 7 skipped | Playwright, 4 projects (chromium, firefox, webkit, Mobile Chrome = Pixel 5), 101 tests per project against the **dev server** (CSR; :5173 in the main checkout, an own port in a worktree — section 5 "Server identity"). Skips below. |
| 5 | `npm run build` | 21 pages + `dist/404.html` | `scripts/generate-sitemap.ts` → `tsc -b` → `vite build` → `vite build --ssr src/entry-server.tsx --outDir dist-ssr` → `scripts/prerender.ts` (7 pages × 3 locales from `src/data/routes.ts`, one empty-root noindex 404). A failed build leaves the previous `dist/` behind: `rm -rf dist dist-ssr` before trusting anything served from it (a TDZ error in `tsc` did exactly that on 2026-11-09). |
| 6 | `npm run test:visual` (after step 5) | all green vs committed baselines | Section 2. Replaces the "eyeball it at one width" step; the browser look-through (README step 9 / POST-5) still happens before the Review Brief. |

### Unit files (147 tests — recount with `npm test -- --run`, never from memory)

| File | Tests | Guards |
|---|---|---|
| `tests/unit/routes.test.ts` | 7 | `src/data/routes.ts`: 7 pages × 3 locales, legacy HU/DE slugs kept, unique paths, trailing-slash matching, localized 404 resolution, hreflang + `x-default → HU`, the two garden 301s (D-16) |
| `tests/unit/data.test.ts` | 6 | Zod contracts: 15 albums (unique ids, cover inside the image list, partners/titleKey), 169 gallery images, 7 rental items (mirror deposit 20 000), services/testimonials/areas/contact, every referenced i18n key exists in all 3 locales, `formatHuf` is hand-formatted |
| `tests/unit/i18n.test.ts` | 6 | parity gate (`validateLocales` → `[]`), negative cases for a missing key / identical value, garden only under `about.garden.*` (D-16), legacy typos absent, SEO titles ≤ 60 / descriptions ≤ 160 |
| `tests/unit/render.test.tsx` | 27 | `src/entry-server.tsx` renders all 21 routes with title, canonical, hreflang, `["Florist","LocalBusiness"]` + stable `url` (QA M3), `#main-content`; 3 localized 404s with `noindex`; no HU nav leaks on DE services; 7 rental items on DE; ImageGallery JSON-LD × 16 |
| `tests/unit/assets.test.ts` | 2 | `public/assets/**` is webp ≤ 200 KB (lockscreen workspace exempt); every `IMAGE_META` entry has dimensions and all three size variants exist on disk |
| `tests/unit/legacyArchive.test.ts` | 2 | `references/legacy/manifest.json` (15 albums / 169 images / 4 testimonials, garden archived) and the Markdown per legacy page |
| `tests/unit/skills.test.ts` | 4 | `SKILL_NAMES` ↔ `.agent/skills/*` ↔ backticked mention in `AGENTS.md`; no legacy singular agent-file name in the core docs |
| `tests/unit/submitInquiry.test.ts` | 6 | `submitInquiry` through its injectable `fetchImpl`: no endpoint, honeypot, body keys, access key, rejected, network error |
| `tests/unit/inquiryMailto.test.ts` | 4 | the prefilled `mailto:` fallback |
| `tests/unit/validateInquiry.test.ts` | 9 | field validation codes (the "minimum only" rules) |
| `tests/unit/analytics.test.ts` | 4 | Vercel Web Analytics only on the served hosts |
| `tests/unit/gdpr.test.ts` | 15 | the personal-data audit on the real repo (`[]`), a finding per deleted register entry, hosts in comments ignored, iframe / external script / preconnect / web font / cookie write caught, the request body has exactly the keys in `inquiryPayload`, the register matches its seal (a register change without `npm run audit:gdpr -- --seal` fails) |
| `tests/unit/sitemap.test.ts` | 6 | `scripts/sitemap-lastmod.json` knows all 21 routes and matches the current copy + data; committed `public/sitemap.xml` equals the generator's output; a date moves only for changed routes. Red → `npm run sitemap`, commit both files |
| `tests/unit/gates.test.ts` | 12 | the gates fail on what they exist for: a server from another checkout / without identity / wrong mode is refused, worktree ports, missing or stale `dist/`, ESLint error on a bare `@playwright/test` import |
| `tests/unit/fonts.test.ts` | 5 | every character in the three locale files and in the literals of `src/` (comments stripped, emoji and control characters exempt) lies inside a `unicode-range` of every font family and style in `src/styles/fonts.css`; otherwise the browser draws it in a system font. Reads the declared ranges, does not open the `.woff2` files. Green on `main` since the font subset of pull request 7 landed (2026-11-18); a new character in the copy that the subset lacks turns it red — re-run `scripts/subset-fonts.mjs` or change the copy. |
| `tests/unit/verifyLive.test.ts` | 6 | judging logic of `npm run verify:live` (legacy URL list, nameserver families, permanent redirects and chains, certificate names and expiry) — no network |

### E2E (8 specs, 101 tests × 4 projects)
`navigation` (27: 21 routes × locale, 3 localized 404s, DE CTAs stay in `/de/`, keyboard nav, mobile menu), `seo` (21 heads), `a11y` (27, below), `contact` (10), `locale` (5: toast for de-*/en-* browsers only, dismiss persists), `gallery` (3), `rental` (4), `vitals` (4: CLS < 0.1, LCP < 4 s on the dev build). The 7 skips are intentional: **4** are the `isMobile` split (`header navigation reaches every page by keyboard` skips on Mobile Chrome; `mobile menu opens…` skips on the 3 desktop projects) and **3** are `the open mobile menu has no axe violations` on the 3 desktop projects. Always compare the passed total with the expected one: a piped `| tail` hides the exit code (2026-11-16: 210 passed looked green while Firefox never launched).

**`tests/e2e/a11y.spec.ts` — axe as a hard gate (MASTER-PLAN 3.1).** `@axe-core/playwright` with its full default rule set on all 21 routes, the 3 localized 404s, the contact form with validation errors, the open mobile menu and the HU home with the language toast; zero violations, no rule disabled, no element excluded. A failure prints rule id, impact, the element's selector, axe's fix hint and the help URL. Fix the markup or CSS (`accessibility-expert`), never the rule list. axe covers only what a machine can check; the manual VoiceOver run of 3.1 is still open.

**`tests/e2e/contact.spec.ts`** (10): field errors; named errors; per locale: the consent box starts unticked and nothing is sent without it; per locale: success path (one request, body keys = `inquiryPayload` in `docs/gdpr/data-register.json`, honeypot and consent flag never sent, confirmation focused and in view); un-mocked submission blocked by the fixture; failure path with the mailto fallback. The success path skips only when Playwright reused a dev server of this checkout that the owner started without `VITE_FORM_ENDPOINT`; **with `CI` set that is a failure, not a skip**.

| Rule | Why | Where |
|---|---|---|
| **Tests must not depend on the server's env** | Locally Playwright reuses whatever listens on :5173 (`reuseExistingServer`), and Vite restarts on any `.env*` change — a `.env.local` with the real endpoint reached a sibling session's run and produced 12 failures (2026-11-09). | `playwright.config.ts` (`webServer`), `contact.spec.ts` (`PROVIDER_HOSTS` mocks the fake and the real hosts) |
| **Real submissions only by hand, and ask before each one** | They cost quota; the owner treats a wasted one as a major bug. Use a sender address that is not the inbox's own, so Reply-To is visibly the customer's. | owner, 2026-11-11 |
| **Never judge a run through `\| tail`** | A pipe hides the exit code: a background run reported 0 while all 71 Firefox tests failed to launch (210 passed). Use `set -o pipefail` (zsh has `pipestatus`, not `PIPESTATUS`) or run unpiped, and compare the passed total with the table above. | 2026-11-16 |

## 2. Visual regression gate (chromium, production build)

| Fact | Value |
|---|---|
| Config | `playwright.visual.config.ts` — `testDir: tests/visual`, chromium only (Desktop Chrome), `locale: hu-HU`, light scheme, `retries: 0`, `trace: retain-on-failure` |
| Target | `vite preview --strictPort` serving `dist/`, :4173 in the main checkout, an own port in a worktree (`reuseExistingServer: true`). The server command and `tests/support/globalSetup.ts` refuse a missing `dist/`, a `dist/` older than `src/`, `public/`, `index.html`, `vite.config.ts` or `scripts/prerender.ts`, and a preview that serves another checkout — the message says to run `npm run build` or which process to stop |
| Comparison | `scale: 'css'`, `animations: 'disabled'`, `caret: 'hide'`, `maxDiffPixelRatio: 0.001`, `maxDiffPixels: 150` |
| Baselines | `tests/visual/__screenshots__/snapshots.spec.ts/<name>.png` — 27 PNGs (count them with `ls`, the history is in `docs/qa/visual-baselines-log.md`), committed, rendered on darwin (other OSes rasterise fonts differently and would need their own set) |
| Report | `playwright-report-visual/` (git-ignored) — expected / actual / diff per failure; traces in `test-results/` |
| Run | `npm run build && npm run test:visual` |
| Owner's review of a red run | `npm run visual:page` → `.visual-review/` → Artifact → pasted answers → `npm run visual:page -- --answers <file>` (`scripts/visual-review-page.ts`, `docs/qa/visual-review-process.md`) |
| Review a diff | `npm run visual:sheet` → `tests/visual/review.html` (serve it: `.claude/launch.json` → `visual-review`): after a red run it opens with expected / actual / diff per failed snapshot, followed by every baseline with its checklist. Generated and git-ignored — regenerate, never commit. `npm run visual:review` opens Playwright's own HTML report instead. Pre-screen the sheet yourself, then show the owner BEFORE proposing anything |
| Re-baseline | `npm run test:visual:update -- --approved-by="<name>" --note="<what changed and why>"` → `scripts/visual-approve.mjs`: refuses without an approver, re-records, lists every changed PNG and appends a row to `docs/qa/visual-baselines-log.md`. **Only after the owner approved the reviewed diff (explicit GO)**, never to make a red run green; never call `--update-snapshots` directly. The script logs a row even when no PNG changed — use that to record "set confirmed" |

`tests/visual/helpers.ts` defines the page set (`PAGES`: 8 HU pages incl. the 404 path `/nincs-ilyen-oldal/`, plus DE/EN home at 375 only), the widths and `openStable()` — toast pre-dismissed, animations and smooth scroll off, `document.fonts.ready`, scroll-through so lazy images mount, then every image inside the 1500 px snapshot area is set to `loading = 'eager'` and decoded, raced against an 8 s cap (**eager-image rule**: `img.decode()` on a lazy image outside the viewport never resolves — never await it without forcing eager and a timeout).

**`tests/visual/layout.spec.ts` — 83 structural tests, no pixels** (80 = 10 pages × 8 widths `320 375 768 1024 1120 1280 1440 1920`; desktop widths use a 768 px tall viewport, phones 812). Each invariant encodes a regression that reached a reviewer on 2026-11-09:

| Invariant | Regression it pins |
|---|---|
| `documentElement.scrollWidth ≤ innerWidth + 1` | horizontal overflow at 320 |
| every `.container` ≤ `--content-max` (`rootRemVar`), header bar ≤ 90rem | QA M1: the safety layer `body, main, section, .container { max-width: 100% }` overrode `--content-max` → 185-char lines, 1840 px carousel |
| header children inside the bar; brand `span` height ≤ 1.6 × font-size; `header nav a, header button` ≤ 2.6 line-heights | wordmark wrapping per character at ≥ 1280 after the bar was capped |
| any `position: sticky` inside `main`: `top + height ≤ innerHeight` | sticky image column pinned under the header on phones, text scrolled behind it |
| no `overflow: hidden` text element with `scrollWidth > clientWidth + 2` (ellipsis allowed) | clipped headings |
| `<img>` without `object-fit: cover/contain` keeps its natural ratio within 2 % | distorted photos |
| a link whose text is one token (e-mail, phone number, one word) renders on one line (`wrappedSingleTokenLinks` in `helpers.ts`) | `overflow-wrap: anywhere` on links broke the footer e-mail mid-word ("gmail.co / m") when its column was a few px short — at 1280 on 2026-11-09, at 768 and 1024 until 2026-11-16 |
| self-test: the footer e-mail link squeezed by 12 px must be reported | an invariant that silently stops matching |
| overlay hit-tests (home @ 375 / 1280): centre of the first 20 header/CTA controls hits itself via `elementFromPoint` | QA M9: toast (z 120) over the H1, CTAs and the first two menu items (the carousel-arrow hit-test lives in `tests/e2e/gallery.spec.ts`) |
| `< 1120`: menu panel `[role="dialog"]` covers > 70 % of the viewport and owns the centre point; Escape → `aria-expanded="false"` | header `backdrop-filter` became the containing block of the fixed panel; QA M10 Escape only inside the panel |

**`tests/visual/snapshots.spec.ts` — 27 pixel tests**: full-page clips `1500 px` tall (gallery 1100) at 375 and 1280 for the 8 HU pages; `home-de-375`, `home-en-375`; header strip (96 px) at 1120/1280/1440/1920; language toast at 375 and 1280; `menu-open-375`; the first gallery carousel (`[aria-roledescription="carousel"]`) on slide 2 at 375 and 1280. Element snapshots go through `snapshotElement()` only: it asserts that the element lies fully inside the viewport first, because Chromium leaves the part below the viewport edge unpainted and the PNG would freeze a cut frame. The native date input shows `mm/dd/yyyy` in the contact baselines (headless Chromium's UI locale); that is not a site defect.

DE/EN inner pages have no pixel baseline on purpose until copy sign-off R-1 — only the layout invariants cover them.

Reading a failure: open `playwright-report-visual/index.html`, look at the diff image first. A diff confined to one component after a CSS change is the change — decide with the owner. A diff everywhere (fonts, anti-aliasing) means a different machine or a stale `dist/`; rebuild, do not re-baseline. A layout invariant failure prints the offending element and numbers in the assertion message — fix the CSS.

**Review flow — one way only since 2026-11-18 (owner: "always do this artifact like review … build this into code"); the full procedure is `docs/qa/visual-review-process.md`. A green pixel gate proves "like before", never "correct"; 2 of the first 27 baselines froze defects:**
1. Red run → `npm run visual:page` (add `-- --spec docs/qa/reviews/<date>-<topic>.json` for notes per screen and picture decisions) → `.visual-review/`. Publish it as a private Artifact (`root: .visual-review`, `files:` from `.visual-review/files.json`; the same artifact in later rounds) or serve `local.html`; give the owner the link and stop. `npm run visual:sheet` / `npm run visual:review` are for your own look and for reviewing the committed baseline set, not for the owner's approval.
2. Pre-screen the contact sheet yourself with measurements before the owner looks: both real defects came from the agent's pass, the owner's pass confirms. The footer e-mail once broke mid-word at 1280 while every invariant was green; single-token links are an invariant since 2026-11-18 (`wrappedSingleTokenLinks` in `tests/visual/helpers.ts`), other wrapping is still caught by eyes only.
3. The owner marks every screen OK / Issue, picks decisions, answers BASELINES and COMMIT, and pastes "Copy answers". Save the text to a file and run `npm run visual:page -- --answers <file>`: it lists issues and unanswered screens and says whether the re-record and the commit are allowed (every screen OK, BASELINES = YES, answers for exactly this build). An Issue note is an instruction; if it can be read two ways, ask one question. Then the next round.
4. Only when step 3 allows it: `npm run test:visual:update -- --approved-by="<name>" --note="…"`, commit baselines + log row with the change that caused them. `tests/visual/review.html` is generated and git-ignored: regenerate it, never commit it.

Known non-defects — do not "fix": the native date input shows `mm/dd/yyyy` in `contact-*.png` (headless Chromium's UI locale is en-US whatever `locale` says; HU visitors see the HU format). An image re-encode (q82 → q70 on 2026-11-16) stays inside the pixel tolerance: run the suite, do not re-baseline pre-emptively.

## 3. Git hooks
`.githooks/pre-commit`: when staged files touch `src/`, `index.html`, `public/fonts/` or `tests/visual/`, it builds and runs the visual suite; a red run blocks the commit and prints the review → fix-or-approve steps above (measured: ~26 s).
`.githooks/pre-push`: lint → `npm test -- --run` → `npm run build` → `npm run test:visual` (`npm run prepush` runs the same chain by hand). Installed by `npm run prepare` (`git config core.hooksPath .githooks`; verify with `git config core.hooksPath`). E2E is not in the hook (4 browsers ≈ minutes) — run it yourself before the Review Brief. `FV_SKIP_HOOKS=1 git push` bypasses the hook for emergencies only, and the PR body must say so and why.

| Hook and push caveat | Do |
|---|---|
| The pre-commit hook builds and runs the visual suite when UI files are staged (about half a minute alone, minutes on a busy machine), the pre-push hook runs the full chain on every push — also for `git push --delete` (no deletion check; skipping it there is an open proposal, it changes a gate) | Run the commit or push in the background; never read a slow hook as a hang |
| A push carries **every** unpushed commit on the branch, including a sibling session's | `git fetch`, then `rtk proxy git log origin/<branch>..HEAD` before asking for GO, and say what the push will carry |
| The rtk hook rewrites or compresses `git` output (`git push` → `ok <branch>`, blank `diff --stat`, a stale `origin/main` tip on 2026-11-16) | For any fact that gates a commit, merge or delete: `rtk proxy git …`; verify a push with `git fetch` + `rtk proxy git rev-parse origin/<branch>` |
| Vercel validates `vercel.json` against its schema at import and on every preview — no local gate does | Schema keys only, no `_comment` keys (`seo-expert` §3a, which also records the dashboard install command `npm ci --ignore-scripts`). A branch cut before a `vercel.json` fix fails the preview check: merge `main` in before opening the PR |
| Shared checkout: other sessions' hunks sit in `package.json`, `BACKLOG.md`, `AGENTS.md`, the data register | Stage by explicit path or hunk, `rtk proxy git diff --cached` every shared file, never `git add -A` |
| A pull request is open | Hard rule (owner, 2026-11-18): update the branch by rebasing onto `origin/main`, never by merging `main` in, then `git push --force-with-lease`; ask whether the PR is still open right before that push (the owner merged one mid-rebase on 2026-11-16). Details: `release-manager` §5 |
| Gates run inside a worktree, or beside other sessions | Servers on :5173 / :4173 may belong to another checkout (§1 E2E rules, §2 Target); never remove a worktree or switch a shared checkout while a session may be mid-gate in it — the red result is an artefact. A worktree runs every gate with a `node_modules` symlink to the main checkout (all green on 2026-11-16), no `npm install` needed |

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
- **Binaries**: call `./node_modules/.bin/playwright …`, `./node_modules/.bin/vitest …`, `./node_modules/.bin/tsx …`. The RTK shell hook rewrites `npx <bin>` to `npm run <bin>`, which fails for anything that is not a script; it also summarises `grep`/`ls` output (use `/usr/bin/grep`, `/bin/ls` or `rtk proxy` when the exact text is evidence). Probe scripts outside the repo cannot resolve `@playwright/test` or `sharp` — import them by absolute path from the repo's `node_modules`.
- One spec / one project: `./node_modules/.bin/playwright test tests/e2e/gallery.spec.ts --project=chromium`; one unit file: `npm test -- --run tests/unit/render.test.tsx` or `-t "test name"`; one visual test: `./node_modules/.bin/playwright test -c playwright.visual.config.ts -g "home @ 375"`.
- **Import `test` and `expect` from `./fixtures`, never from `@playwright/test`** (e2e and visual; ESLint enforces it). The auto fixture in `tests/e2e/fixtures.ts` aborts every request to `api.web3forms.com` and `formspree.io` in every test: a reused dev server may carry the real endpoint from `.env.local`, the production build under the visual suite always does, and each real submission costs quota and lands in the owner's inbox.
- **Form endpoint mock**: the dev server Playwright starts itself gets `VITE_FORM_ENDPOINT=https://mock-form-endpoint.test/submit` (`playwright.config.ts`); `contact.spec.ts` mocks that host **and** the real provider hosts with `page.route` (fulfil for success, `route.abort('failed')` for failure), and the auto fixture blocks the real hosts for every other test (§1 E2E rules). By hand, without any provider: `npm run dev:form` (fake provider on :8787 + Vite) or `npm run form:fake` (`scripts/fake-form-provider.ts`, `--status=500` for the error state).
- **Server identity** (`scripts/checkout.ts`): the dev and the preview server answer `/__fv/checkout` with the folder they serve. `tests/support/globalSetup.ts` stops both suites before the first test when the server on the test port was started in another checkout, does not answer the question (foreign or outdated server), or is the wrong kind. The main checkout uses :5173 / :4173; a git worktree gets its own stable ports (`checkoutPort()`), so a worktree session and the owner's dev server never collide. Never start a server by hand on another checkout's port.
- **Accessibility**: a new page or a new state (dialog, expanded panel, error state) gets a scan in `tests/e2e/a11y.spec.ts`.
- **State swap pattern** (form → success card): assert `toBeInViewport({ ratio: 1 })` and `toBeFocused()` on the new region (`contact.spec.ts`) — replacing a tall element with a short one clamps the scroll to the page bottom.
- **Scroll probes**: `scroll-behavior: smooth` makes programmatic scroll checks lie — verify scrolling with real wheel or keyboard input, or switch smooth scroll off as `openStable()` does.
- E2E targets the CSR dev server; anything about the **prerendered** HTML belongs in `render.test.tsx` or the visual suite.
- **The live site** is checked by `npm run verify:live` (`scripts/verify-live.ts`, read-only: DNS, certificates, all routes, the 14 legacy URLs, redirects, 404s, sitemap, security headers; expectations in `docs/launch/live-expectations.json`). Run it after any DNS, domain or `vercel.json` change. It is not part of the gates: it needs the network and the production site.

## 6. Debugging
`resources/debugging-guide.md` — traces (`./node_modules/.bin/playwright show-trace test-results/<dir>/trace.zip`), `--reporter=line`, the report folders, the false positives met so far (probing below the fold, `boundingBox()` including scroll offset, lazy `img.decode()` hanging) and the shell/rtk traps.

**Firefox will not launch (macOS 27).** Symptom: every `firefox` test fails with `browserType.launch: Failed to launch the browser process` and `Could not find profile folder.` Cause: at startup the test browser reads the INSTALLED Firefox's `~/Library/Application Support/Firefox/profiles.ini`, and macOS 27 denies that read — it is not about the `-profile` path. Recognise it: `ls ~/Library/Application\ Support/Firefox` → "Operation not permitted", and `log show --last 1m --predicate 'process == "kernel" AND eventMessage CONTAINS "System Policy"'` shows `deny(1) file-read-data`. Fix in place since `d6846bb`: `playwright.config.ts` gives the `firefox` project `launchOptions.env = { ...process.env, CFFIXED_USER_HOME: <existing empty folder under os.tmpdir()> }`. Rules that keep it working: the folder must exist (`mkdirSync`), `HOME` alone is not enough, `launchOptions.env` replaces the whole environment so always spread `process.env`, and browser-specific env stays on the project — process-wide it would also move WebKit's and the dev server's home. Do not upgrade Playwright as a first reflex (1.63.0 kept; whether a newer build needs the override is untested): reproduce a launch failure with the bare browser binary first (command in the guide).

## 7. Sparring Manifesto (push back, then do it right)
- **No skipped gates.** "Lint later", "e2e is slow", `FV_SKIP_HOOKS=1` without a written reason in the PR — refuse and run the gate.
- **Fix code, not tests.** A test changes only when it is provably wrong (wrong selector, wrong expected copy after an approved copy change) — say which and why in the commit.
- **Never re-baseline to hide a diff.** `test:visual:update` requires the owner's GO on the new look; a red snapshot after an unrelated change is a regression.
- **No `any`, no loose typing**, in `scripts/` and `tests/` as well as `src/`.
- **No visual sign-off from a single width.** The 2026-11-09 session shipped a `backdrop-filter` containing-block bug and a toast over the menu because one width looked fine; `LAYOUT_WIDTHS` exists so that cannot repeat.
- **Numbers live here, and they are measured.** When test counts, skip counts, widths or thresholds change, update this file in the same commit — from `npm test -- --run`, `playwright test --list` and `ls`, never from memory or another document (a baseline count was once reported as 27 when it was 25).
- **A green pixel gate is not a review.** Every new or re-recorded baseline gets one human look on the contact sheet before the Review Brief (§2 review flow).

## Resources
- `resources/debugging-guide.md` — traces, reporters, false positives, where artefacts land.
