# Visual baseline log

Every replacement of a pixel baseline, with who approved the reviewed diff and why. Written by `scripts/visual-approve.mjs`; never edit by hand except for this first row.

| Date | Approved by | Note | Baselines changed |
| --- | --- | --- | --- |
| 2026-11-09 | initial set (not yet owner-reviewed) | First 25 baselines generated from the production build after the M1–M13 fixes, the header-bar, sticky-column and toast fixes. The owner reviewed the fixes in chat, not the PNGs; review the set once in `playwright-report-visual/` or `tests/visual/__screenshots__/` and re-record with `npm run test:visual:update -- --approved-by="<name>"` if anything is off. | all 25 |
| 2026-11-09 | Gabor Sebők | Toast: one layout at every width (CTA fills the row, dismiss flush right); first toast-visible baselines at 375 and 1280 — owner asked for them in chat 2026-11-09 | snapshots.spec.ts/toast-1280.png<br>snapshots.spec.ts/toast-375.png |
