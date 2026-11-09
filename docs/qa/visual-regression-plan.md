# Visual regression plan — Fiore Vera

Added 2026-11-09 after two layout regressions reached the owner on the same day the automated suite was green: the header wordmark wrapping per character at ≥ 1280 px, and the About/Contact sticky column pinning under the header on phones. Neither pixels nor layout were asserted anywhere. This plan closes that gap and gates every push on it.

## What runs

| Layer | File | Asserts | Runtime |
|---|---|---|---|
| Layout invariants | `tests/visual/layout.spec.ts` | 10 pages × 8 widths (320 → 1920): no horizontal overflow; every `.container` ≤ `--content-max` (header bar ≤ 90rem); header brand on one line, no header control wrapping, no bar child outside the bar; any sticky block in `main` fits the viewport (desktop checked at 768 px height); no clipped single-line text; no distorted image. Plus overlay hit-tests on home at 375/1280 and the mobile menu panel above the page with Escape closing it. | ~8 s |
| Pixel baselines | `tests/visual/snapshots.spec.ts` | Full-page clips (1500 px, gallery 1100 px) at 375 and 1280 for the 8 HU pages, DE/EN home at 375, header strips at 1120/1280/1440/1920, menu open at 375, first carousel on slide 2 at 375/1280. Chromium, CSS pixels, animations off, toast pre-dismissed, lazy images in the clip force-decoded. Threshold `maxDiffPixelRatio` 0.001 or 150 px. | ~12 s |
| Harness | `playwright.visual.config.ts`, `tests/visual/helpers.ts` | Runs against `vite preview` of the **production build** on :4173 (`reuseExistingServer`), 60 s per test, HTML report in `playwright-report-visual/`. | |

Baselines: `tests/visual/__screenshots__/` (25 PNGs, 9.2 MB, platform-specific: generated on macOS; a CI runner needs its own set).

## When it runs

- `npm run test:visual` — any time, after `npm run build`.
- `.githooks/pre-push` — on every `git push`: lint → unit → build → visual. Installed by `npm run prepare` (`git config core.hooksPath .githooks`), which `npm install` triggers. Emergency bypass `FV_SKIP_HOOKS=1 git push`, to be recorded in the PR.
- Release protocol: POST-5 in `AGENTS.md`; part of the Definition of Done in `CLAUDE.md`.

## How a failure is handled

1. Open `playwright-report-visual/index.html`; the diff shows expected / actual / diff per snapshot, the layout spec prints the exact violation (`brand wraps: 96px tall at font-size 24px`).
2. Decide: regression → fix the code, rerun; intended change → show the owner the new look at the affected widths and get an explicit GO.
3. Only with that GO: `npm run build && npm run test:visual:update`, commit the new baselines together with the change that caused them, and name the approval in the commit message.
4. Never re-baseline to make a red run green, never widen thresholds to pass.

## Proof it catches the real thing

With the header fix temporarily reverted (bar capped at `--content-max` again) and the suite run against that build, the layout spec failed with `page overflows: 1283 > 1280` and `header child DIV leaves the bar`, and the three header snapshots failed with 7 369 to 9 977 differing pixels. With the fix restored, 107 of 107 pass twice in a row.

## Scope rules

- Chromium only. WebKit and Firefox stay in the functional e2e suite; their rasterisation differs enough to need separate baselines without adding regression coverage for CSS layout.
- Pixel snapshots cover the first viewport-and-a-half per page; the layout invariants cover the full page. Long pages (gallery) do not get full-height pixel baselines.
- New page → add it to `PAGES` in `tests/visual/helpers.ts`; new overlay or fixed element → add its hit-test to the overlay block in `layout.spec.ts`; new breakpoint → add it to `LAYOUT_WIDTHS` and, if it changes the header, to `HEADER_WIDTHS`.
- Baseline size budget: keep the committed set under 15 MB; prefer clips and strips over whole pages; consider Git LFS if re-baselining becomes frequent.

## Next steps (backlog)

- axe-core assertions in the same run (dependency already installed) to turn accessibility into a hard gate.
- Baselines for the DE and EN inner pages once the owner has signed off the copy (R-1), to avoid re-baselining text churn.
- A CI job running the same chain on Linux with its own baseline set before the Vercel preview is created.
