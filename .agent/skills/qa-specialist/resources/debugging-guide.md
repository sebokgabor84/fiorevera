# Debugging a red gate — Fiore Vera

Everything here runs from the repo root. Call Playwright and Vitest through `./node_modules/.bin/<bin>`; the RTK shell hook rewrites `npx <bin>` to `npm run <bin>`, which only works for scripts in `package.json`.

## Where things land

| Suite | Config | Server | Artefacts |
|---|---|---|---|
| Unit | `vite.config.ts` (`test` block) | none (jsdom; `render.test.tsx` uses `src/entry-server.tsx`) | terminal only |
| E2E | `playwright.config.ts` | dev server :5173 (`npm run dev`, reused if running) | `test-results/` (traces on first retry only on CI → pass `--trace on` locally) |
| Visual | `playwright.visual.config.ts` | `vite preview --port 4173` serving `dist/` (reused if running) | `playwright-report-visual/index.html` (expected / actual / diff), `test-results/**/trace.zip` on failure |

`test-results/` and `playwright-report-visual/` are git-ignored. `tests/visual/__screenshots__/` is committed — do not delete or regenerate it to get green.

## Commands

```bash
# one unit file / one test name
npm test -- --run tests/unit/render.test.tsx
npm test -- --run -t "renders a localized 404"

# one e2e spec on one browser, line reporter, trace always
./node_modules/.bin/playwright test tests/e2e/contact.spec.ts --project=chromium --reporter=line --trace on

# only the tests matching a title
./node_modules/.bin/playwright test -g "mobile menu"

# visual: rebuild first, then one page, then open the report
npm run build
./node_modules/.bin/playwright test -c playwright.visual.config.ts -g "services @ 1280"
./node_modules/.bin/playwright show-report playwright-report-visual

# open a trace
./node_modules/.bin/playwright show-trace test-results/<test-dir>/trace.zip

# headed / step-through
./node_modules/.bin/playwright test tests/e2e/gallery.spec.ts --project=chromium --headed --debug
```

`--reporter=line` is the quiet choice inside an agent shell; the default `list` reporter prints one line per test × project (276 lines for the full e2e run).

## Reading a visual failure
1. Rebuild. `reuseExistingServer: true` means a preview started before your change serves the old `dist/`.
2. Open the HTML report; look at the diff image, then expected vs actual.
3. Diff limited to the component you changed → it is your change: show the owner, get a GO, then `npm run test:visual:update`.
4. Diff everywhere (text edges, 1-px shifts on every page) → machine/font difference or stale build, not a design change. Baselines were rendered on darwin; do not re-baseline from another OS.
5. `layout.spec.ts` failures are not pixels: the assertion message lists the element, its measured size and the limit (`.container 1840px exceeds 1152px`, `brand wraps: 92px tall at font-size 28px`, `sticky element … does not fit a 768px viewport`). Fix the CSS, re-run that one test with `-g`.

## False positives seen on 2026-11-09 — and the pattern that avoids them

| Symptom | Cause | Pattern |
|---|---|---|
| `elementFromPoint` hit-test on the carousel arrow reported "covered by" or `null` | the arrow was probed while below the fold; `elementFromPoint` only sees the viewport | `await locator.scrollIntoViewIfNeeded()` (or `el.scrollIntoView({ block: 'center' })` inside `page.evaluate`) before reading `boundingBox()` / probing the point — see `gallery.spec.ts` and the overlay test in `layout.spec.ts` |
| "carousel changed size" after clicking next, although the box is fixed 3:2 | `boundingBox()` returns viewport-relative `x`/`y`; the click scrolled the page, so the comparison included scroll offset | compare only `{ width, height }` (`gallery.spec.ts` `size()` helper) |
| `openStable()` hung until the test timeout | `await img.decode()` on a lazy image outside the viewport never resolves because the browser never starts loading it | force `img.loading = 'eager'` only for images inside the snapshot area, `.catch(() => undefined)`, and `Promise.race` against an 8 s cap (`tests/visual/helpers.ts`) |
| Toast assertions flaky on phone projects | the language toast overlaps the submit button / arrows for de-*/en-* browser locales | pre-dismiss via `page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1'))` in every spec except `locale.spec.ts` |
| 12 contact success-path tests "skipped" | an already-running dev server was started without `VITE_FORM_ENDPOINT`; the spec detects `data-endpoint !== 'configured'` and skips | stop the dev server and let Playwright start it (the managed `webServer` sets the env), or export `VITE_FORM_ENDPOINT=https://mock-form-endpoint.test/submit` before `npm run dev` |
| WebKit: Tab does not move focus to links | Safari's "Press Tab to highlight each item" default | focus the element directly (`page.locator('.skip-link').focus()`) as `navigation.spec.ts` does |

## Unit-test gotchas
- `render.test.tsx` runs in jsdom but renders through `renderToString`; a component that reads `window`, `localStorage`, `Intl` or `Date` during render passes in the browser and throws here — that is the point (PRD D-18). Move it into an effect.
- `data.test.ts` imports `flatten`/`loadLocales` from `scripts/validate-i18n.ts`; a key typo in `src/data/*.ts` surfaces there as `"<key> missing in de"`, not in the Zod parse.
- `skills.test.ts` fails on any new directory under `.agent/skills/` until `src/types/skills.ts` and `AGENTS.md` are updated.
