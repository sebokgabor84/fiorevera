# Harvest: Visual baseline review (contact sheet, owner verdict, re-recorded baselines)
Session: baseline-review · period: 2026-11-09–2026-11-10 · commits: `8fdea0c`, `da226a1` (both on main)

## 1. What this session delivered
- Contact sheet generator — `scripts/visual-contact-sheet.mjs` → `tests/visual/review.html` (27 PNGs, 6 groups, per-group checklist, OK/Issue + note per image in localStorage, "Copy verdicts" text export; no dependencies, PNG sizes read from the IHDR chunk) — `8fdea0c`
- `visual-review` entry in `.claude/launch.json` (`vite preview --outDir tests/visual --port 4174`) because a `file://` page cannot load the PNGs in the app's browser pane — `8fdea0c`
- Carousel snapshot fix — `tests/visual/snapshots.spec.ts` uses a 1200 px viewport at desktop; new `expectFullyInViewport(locator)` guard in `tests/visual/helpers.ts` — `8fdea0c`
- Footer fix — `src/components/Layout/footer.module.css:96` grid `1.6fr 1.15fr 0.9fr 0.9fr` (was `1.6fr 1fr 1fr 1fr`) so `info.fiorevera@gmail.com` no longer breaks mid-word at 1280 — `8fdea0c`
- Re-recorded through the approval script only: `carousel-slide2-1280.png`, `notfound-1280.png`, `privacy-1280.png` — `8fdea0c`; second run on 2026-11-10 from the build at `f4feae3`: 0 files changed, logged — `da226a1`
- Records — `docs/qa/visual-baselines-log.md` (two script rows + one hand-written row approving the 24 unchanged baselines), `docs/qa/visual-baseline-review-2026-11-10.md` (owner's verdict verbatim + reading), `docs/qa/visual-regression-plan.md` ("Reviewing the set" section, viewport pitfall, 27 PNGs), `.agent/pr/feature-site-build.md` ("not yet eyeballed" sentence replaced; 109 tests / 27 baselines)

## 2. Learnings (rules a future agent must follow)
- **An element snapshot must fit the viewport, or the PNG freezes a half-painted frame.** [testing] Chromium does not paint the part of a scroll container below the viewport edge in `locator.toHaveScreenshot()`. The first `carousel-slide2-1280` baseline (album section 832 px at y=176 in a 900 px viewport) lost the bottom 108 px and the "2. kép, összesen 19" pill, yet the suite was green against it for a day. Evidence: pixel probe of the old PNG (linen from y=725 down, no pill), harness DOM probe (carousel 715 px, pill visible), `tests/visual/helpers.ts` `expectFullyInViewport`, `8fdea0c`.
- **A green pixel gate proves "like before", never "correct"; every new baseline gets one human look.** [workflow] [testing] Two of 27 machine-recorded baselines froze defects (the carousel artifact and the footer e-mail "gmail.co / m"). Evidence: `docs/qa/visual-baseline-review-2026-11-10.md`, log rows of 2026-11-09.
- **Pre-screen the sheet yourself before the owner looks; the owner's pass confirms, it does not find.** [workflow] [owner-preference] The owner's verdict was 23 × OK and three ISSUE marks that all meant "page is being changed elsewhere"; both real defects came from the agent's own pass with measurements (212 px column vs 218 px text; viewport arithmetic). Evidence: chat 2026-11-09/10, verdict file.
- **`getByRole('region').first()` resolves to a labelled `<section>`, not the `role="region"` carousel div.** [testing] The test name says "first carousel" but the baseline is the whole album section (heading + carousel). Kept as is to avoid changing the 375 baseline; see § 4 for the cleanup. Evidence: `tests/visual/snapshots.spec.ts:56`, `src/components/Gallery/AlbumSection.tsx:97` (`<section aria-labelledby>`).
- **Global `overflow-wrap: anywhere` on `a` turns a 6 px shortfall into a mid-word break.** [design] [testing] `src/styles/global.css:267`; the layout invariants check clipping and overflow, not wrapping, so this class of defect is only caught by eyes. Evidence: footer probe at 1280 (link height 51.7 px = 2 lines).
- **Widen the column that needs it by shrinking the columns with short content, not the brand column.** [design] First fix (`1.5fr 1.15fr 1fr 1fr`) pushed the footer tagline to a 4th line and grew the 404 page by 28 px; `1.6fr 1.15fr 0.9fr 0.9fr` kept brand width and page height. Evidence: run 1 "Expected 1280×1196, received 1280×1224" vs run 2 same size.
- **Baselines are machine-bound: darwin Chromium rasterisation.** [testing] [ops] A CI container needs its own recorded set; nothing on Linux has been recorded. Evidence: `playwright.visual.config.ts` header comment, plan doc.
- **DE/EN inner pages have no pixel baseline (deliberate until copy sign-off R-1).** [testing] Only `home-de-375` / `home-en-375`; a DE/EN inner-page regression is caught only by the layout invariants. Evidence: `tests/visual/helpers.ts` `PAGES`.
- **The native date input shows `mm/dd/yyyy` in the baselines.** [testing] Headless Chromium's UI locale is en-US regardless of `locale: 'hu-HU'`; real HU visitors see the HU format. Not a site bug; do not "fix" it. Evidence: `contact-1280.png`, `contact-375.png`.
- **The approval script logs a row even when nothing changed — use that to record a "set confirmed" decision.** [workflow] `scripts/visual-approve.mjs` wrote "(none — baselines already matched)" on 2026-11-10. Evidence: last row of `docs/qa/visual-baselines-log.md`.
- **A pasted verdict with "being updated at the moment" is not a defect report.** [owner-preference] Ask what it means before fixing; here the owner then chose "good to go with the first version". Evidence: chat 2026-11-10.
- **Sibling sessions in the same checkout change the branch under you.** [workflow] Between my two commits, four sibling commits landed; the push of `da226a1` carried three unpushed sibling commits, which the owner approved explicitly. Always state what a push will carry. Evidence: `git log 8fdea0c..da226a1`.

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
| --- | --- | --- | --- |
| All 27 baselines are the approved reference look; the first version of contact/privacy stays the reference "for now" | owner, 2026-11-09 (GO fix + re-record) and 2026-11-10 ("good to go with the first version") | `docs/qa/visual-baselines-log.md`, `docs/qa/visual-baseline-review-2026-11-10.md` | no |
| header-1440 had no verdict on the sheet; covered by the owner's "good to go" + agent check | owner, 2026-11-10 | `docs/qa/visual-baseline-review-2026-11-10.md` | no |
| Re-baseline only via `npm run test:visual:update -- --approved-by="<name>"`; the sheet is the review tool | repo rule, 2026-11-09 | `docs/qa/visual-regression-plan.md` § Reviewing the set, `scripts/visual-approve.mjs` | no |
| Element snapshots must fit the viewport (`expectFullyInViewport`) | agent, 2026-11-09, owner GO | `tests/visual/helpers.ts`, plan doc § Scope rules | no |
| Footer grid ratio 1.6/1.15/0.9/0.9 and why | agent, 2026-11-09, owner GO | `src/components/Layout/footer.module.css:95-96` (comment) | no |
| `visual-review` static server for the sheet | agent, 2026-11-09 | `.claude/launch.json` | no |
| Baselines are darwin-only; CI needs its own set | plan doc, 2026-11-09 | `docs/qa/visual-regression-plan.md`, `playwright.visual.config.ts` | no (no CI set exists yet) |
| `tests/visual/review.html` is generated and committed; regenerating changes only the date stamp | agent, 2026-11-10 | file header comment in `scripts/visual-contact-sheet.mjs` | YES → say in the plan doc that `review.html` is regenerated on demand and a date-only diff is not to be committed |

## 4. Improvements NOT implemented yet
- [ ] Target the carousel element itself in the slide-2 snapshot (`[aria-roledescription="carousel"]`) instead of the album section — test name and target disagree; cheaper PNG — `tests/visual/snapshots.spec.ts` — both carousel PNGs re-recorded with GO, 109 green — S — owner decision? y (changes 2 baselines)
- [ ] Apply `expectFullyInViewport` to every element snapshot (toast) and to the menu-open page shot as a habit, or build it into a `snapshotElement()` helper — prevents the artifact class generically — `tests/visual/helpers.ts`, `snapshots.spec.ts` — guard present on all element snapshots — S — n
- [ ] Add an `npm run visual:sheet` script for `node scripts/visual-contact-sheet.mjs` (I avoided `package.json` because a sibling session was active) — discoverability — `package.json`, `CLAUDE.md` command list — command listed and works — S — n
- [ ] Show expected/actual/diff triplets from `test-results/` on the contact sheet when a run is red, so the owner reviews a red run on the same page — `scripts/visual-contact-sheet.mjs` — sheet renders diff rows after a failing run — M — n
- [ ] Decide whether `tests/visual/review.html` should be committed or git-ignored and regenerated (date stamp churn; the PNG paths are relative so the committed file is useful for reviewers) — `.gitignore` or plan doc — one documented rule — S — y
- [ ] DE/EN inner-page baselines after copy sign-off R-1 (`PAGES` in `helpers.ts`, widths `[375]` at least) — regression cover for 2 of 3 locales — ~12 new PNGs reviewed on the sheet — M — y (after R-1)
- [ ] Linux baseline set + CI job running lint → unit → build → visual (plan doc "Next steps") — hooks are local-only today — a green CI run on a PR — L — y (CI provider)
- [ ] Footer: let long single-token links break at `@` or `/` (`<wbr>` or `overflow-wrap: normal` on `.footer a` with `min-width: 0`) instead of relying on column width — robustness at 1024/1120 — `Footer.tsx` / `footer.module.css` — e-mail one line at 1024–1920, no overflow — S — n
- [ ] Layout invariant: no inline link whose text is one token may wrap (height > 1.6 × line-height) — turns the footer class of defect into a hard gate — `tests/visual/layout.spec.ts` — invariant fails on the pre-fix footer, passes now — S — n
- [ ] Hero secondary CTA at 375 (HU/DE wrap under the primary and read as loose text; EN fits one line) — taste; options: full-width stacked buttons or shorter HU/DE labels — `Home` hero + locale JSON — owner look at 375 — S — y
- [ ] Rental cards: price cell position differs between cards with and without a size row — consistent spec-grid order (price always last or always first) — `src/components/Rental/*` — both cards aligned at 1280 — S — y (taste)
- [ ] Services eyebrow repeats the H2 text ("1 · TELJES KÖRŰ ESKÜVŐI DEKORÁCIÓ" over "Teljes körű esküvői dekoráció") — copy, R-1 — locale JSON — n/a — S — y
- [ ] Contact page: the 12 e2e failures of 2026-11-09 ("success path with a mocked provider", element not found, all 4 browsers) predate `189cc00`/`f4feae3`; confirm they are gone with a full `npm run test:e2e` before the next PR — `tests/e2e/contact.spec.ts` — 0 failed — S — n

## 5. Skill updates needed
- `.agent/skills/qa-specialist/SKILL.md`: line 51 says "25 PNGs" → 27 (and the number will drift again; say "see `docs/qa/visual-baselines-log.md`" instead of a count). Add the review step: after any re-record, `node scripts/visual-contact-sheet.mjs` and the owner's look at `tests/visual/review.html` (served via `visual-review`), before the Review Brief. Add the rule "element snapshots must fit the viewport — `expectFullyInViewport`" next to the "Reading a failure" paragraph (line 74). Add the `mm/dd/yyyy` date-input note as a known non-defect. Add "a push carries every unpushed commit on the shared branch; state it before asking GO".
- `.agent/skills/design-system-expert/SKILL.md`: note that `global.css` applies `overflow-wrap: anywhere` to links and the footer column widths are sized for the longest single-token link (the e-mail, 218 px at 18 px Inter).

## 6. Open owner decisions / things only Gabor or Vera can do
- Whether the contact and privacy pages get a second look on the sheet once the form-provider and GDPR copy work is final (the owner marked them "being updated" and then chose the first version "for now"); recommendation: re-run the sheet after R-1 and the provider endpoint land, re-record only with the approval script.
- Carousel snapshot target cleanup (§ 4, item 1) changes two approved baselines; needs GO.
- Hero secondary CTA at 375 (HU/DE), rental price-cell order, services eyebrow copy — taste/copy calls listed in § 4.
- CI provider and the Linux baseline set (needs an account decision).

## 7. Friction (what cost time and how to avoid it next time)
- `file://` pages render as static snapshots in the app's browser pane, images do not load → serve any local HTML review page over HTTP (`.claude/launch.json` entry; `vite preview --outDir <dir>` works for any static folder, Python's `http.server` was blocked by the sandbox).
- `preview_start` moved ports (4173 and 4174 were taken by a sibling session's `vite preview` and by the first failed attempt) → always read the port from the tool result, never assume the configured one.
- Running a one-off Playwright probe from the scratchpad failed on `@playwright/test` resolution → import it by absolute path from the repo's `node_modules`, or keep probes inside the repo in a git-ignored folder.
- The rtk hook compressed `git push` output to "ok feature/site-build" → verify with `git fetch && git rev-parse origin/<branch>` instead of reading push output.
- Proving the carousel artifact took a pixel probe of the PNG plus a harness DOM probe; a generic `expectFullyInViewport` guard (now in place) would have failed the test immediately → keep guards that assert preconditions of a screenshot, not only the screenshot.
- The owner's pasted verdict used the "Copy verdicts" text; one row (header-1440) came back blank because the radio was not clicked → the sheet should refuse to copy while any image is unmarked, or mark blanks loudly.
