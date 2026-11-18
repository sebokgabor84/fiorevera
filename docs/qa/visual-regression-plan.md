# Visual regression plan — Fiore Vera

Added 2026-11-09 after two layout regressions reached the owner on the same day the automated suite was green: the header wordmark wrapping per character at ≥ 1280 px, and the About/Contact sticky column pinning under the header on phones. Neither pixels nor layout were asserted anywhere. This plan closes that gap and gates every push on it.

## What runs

| Layer | File | Asserts | Runtime |
|---|---|---|---|
| Layout invariants | `tests/visual/layout.spec.ts` | 10 pages × 8 widths (320 → 1920): no horizontal overflow; every `.container` ≤ `--content-max` (header bar ≤ 90rem); header brand on one line, no header control wrapping, no bar child outside the bar; any sticky block in `main` fits the viewport (desktop checked at 768 px height); no clipped single-line text; no distorted image; no single-token link (e-mail, phone number, one word) wrapping onto a second line. Plus overlay hit-tests on home at 375/1280, the mobile menu panel above the page with Escape closing it, and a self-test that squeezes the footer e-mail link and expects the invariant to report it. | ~8 s |
| Pixel baselines | `tests/visual/snapshots.spec.ts` | Full-page clips (1500 px, gallery 1100 px) at 375 and 1280 for the 8 HU pages, DE/EN home at 375, header strips at 1120/1280/1440/1920, menu open at 375, first carousel on slide 2 at 375/1280. Chromium, CSS pixels, animations off, toast pre-dismissed, lazy images in the clip force-decoded. Threshold `maxDiffPixelRatio` 0.001 or 150 px. | ~12 s |
| Harness | `playwright.visual.config.ts`, `tests/visual/helpers.ts`, `tests/visual/fixtures.ts`, `tests/support/globalSetup.ts`, `scripts/checkout.ts` | Runs against `vite preview` of the **production build**, 60 s per test, HTML report in `playwright-report-visual/`. Port :4173 in the main checkout, an own port in a git worktree. Before the first test the run proves that the server serves **this checkout's `dist/`** and that `dist/` is not older than the sources; otherwise it stops with the reason and the command to run. Specs import `test`/`expect` from `./fixtures` (requests to the real form providers are aborted; ESLint rejects a bare `@playwright/test` import). | |

Baselines: `tests/visual/__screenshots__/` (27 PNGs, 9.2 MB, platform-specific: generated on macOS; a CI runner needs its own set).

## Reviewing the set (once, and after every re-baseline)

A pixel baseline only proves "renders like the committed PNG"; a flaw frozen into one is defended as the approved look from then on. So every baseline gets a human look once: `npm run visual:sheet` writes `tests/visual/review.html`, one scrollable page with every PNG scaled down, grouped by what it covers, with the checklist for that group and an OK / Issue verdict per image that can be copied as text (images without a verdict are listed as `NO VERDICT`). **After a red run the sheet opens with one row per failed snapshot: expected, actual and diff side by side**, so a red run is reviewed on the same page. `review.html` and `tests/visual/review-diffs/` are generated and git-ignored: regenerate them, never commit them (decision 2026-11-16: the content depends on the last run, and GitHub shows an HTML file as source anyway). Serve it (`.claude/launch.json` → `visual-review`, or any static server over `tests/visual/`); a `file://` page cannot load the images in the app's browser pane. The owner reviewed the initial set this way on 2026-11-09 (see `visual-baselines-log.md`).

## When it runs

- `npm run test:visual` — any time, after `npm run build`.
- `.githooks/pre-push` — on every `git push`: lint → unit → build → visual. Installed by `npm run prepare` (`git config core.hooksPath .githooks`), which `npm install` triggers. Emergency bypass `FV_SKIP_HOOKS=1 git push`, to be recorded in the PR.
- Release protocol: POST-5 in `AGENTS.md`; part of the Definition of Done in `CLAUDE.md`.

## How a failure is handled

1. Run `npm run visual:sheet` and open `tests/visual/review.html` (or `playwright-report-visual/index.html`); the diff shows expected / actual / diff per snapshot, the layout spec prints the exact violation (`brand wraps: 96px tall at font-size 24px`).
2. Decide: regression → fix the code, rerun; intended change → show the owner the new look at the affected widths and get an explicit GO.
3. Only with that GO: `npm run build && npm run test:visual:update -- --approved-by="<name>" --note="<why>"`, commit the new baselines together with the change that caused them, and name the approval in the commit message.
4. Never re-baseline to make a red run green, never widen thresholds to pass.

## Proof it catches the real thing

With the header fix temporarily reverted (bar capped at `--content-max` again) and the suite run against that build, the layout spec failed with `page overflows: 1283 > 1280` and `header child DIV leaves the bar`, and the three header snapshots failed with 7 369 to 9 977 differing pixels. With the fix restored, 107 of 107 pass twice in a row.

The single-token link invariant (added 2026-11-16) failed 20 of 80 layout tests on its first run against the production build: the footer e-mail `info.fiorevera@gmail.com` broke mid-word at 768 and 1024 px on every page (contact column 151 / 201 px wide, the address needs 218 px). The fix is a two-column footer between 48rem and 70rem (`src/components/Layout/footer.module.css`); four columns start at 70rem. The suite carries its own proof: `layout.spec.ts` squeezes that link by 12 px and expects the invariant to report it.

## Scope rules

- Chromium only. WebKit and Firefox stay in the functional e2e suite; their rasterisation differs enough to need separate baselines without adding regression coverage for CSS layout.
- Pixel snapshots cover the first viewport-and-a-half per page; the layout invariants cover the full page. Long pages (gallery) do not get full-height pixel baselines.
- New page → add it to `PAGES` in `tests/visual/helpers.ts`; new overlay or fixed element → add its hit-test to the overlay block in `layout.spec.ts`; new breakpoint → add it to `LAYOUT_WIDTHS` and, if it changes the header, to `HEADER_WIDTHS`.
- Baseline size budget: keep the committed set under 15 MB; prefer clips and strips over whole pages; consider Git LFS if re-baselining becomes frequent.
- An element snapshot must fit the viewport: Chromium leaves the part of a scroll container below the viewport edge unpainted, so the PNG freezes a half-painted frame (the first carousel-1280 baseline lost the bottom 108 px and the counter pill that way). Raise the viewport height for that test. Element snapshots are taken only through `snapshotElement()` from `helpers.ts`, which runs `expectFullyInViewport` first; a viewport shot of an overlay (menu open) calls `expectFullyInViewport` on the overlay.

## Next steps (backlog)

- ~~axe-core assertions to turn accessibility into a hard gate~~ — done 2026-11-16 in the e2e suite (`tests/e2e/a11y.spec.ts`: every route × locale, the 404s, open menu, form errors, toast; four browsers).
- Baselines for the DE and EN inner pages once the owner has signed off the copy (R-1), to avoid re-baselining text churn.
- A CI job on Linux: the workflow is prepared but not active (`docs/ci/README.md`). It runs the layout invariants; the pixel comparison needs a Linux baseline set and a second approval per visual change, described there.
