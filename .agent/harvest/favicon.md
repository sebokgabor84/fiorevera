# Harvest: Favicon design round + favicon-builder skill
Session: favicon (side session of "Webpage build and local setup") · period: 2026-11-09 · commits: `10c51f3` (on main via PR #6 merge `5218579`)

## 1. What this session delivered
- Audit finding: the shipped icon set was inconsistent (`public/favicon.svg` = generic daisy; every PNG = the whole line-art badge, unreadable at 16/32 px) — fixed by generating all icons from one SVG — `10c51f3`
- Shipped favicon **F3 `crest-fv-sage`**: sage tile, linen open arc + linen "FV" (Cormorant Garamond 700 outlines), gold/blush/gold trailing dots — `public/favicon.svg`
- Regenerated icon set from that SVG: `favicon-16x16.png`, `favicon-32x32.png` (alpha), `apple-touch-icon.png` 180, `android-chrome-192x192.png`, `android-chrome-512x512.png` (opaque, flattened on the tile colour) — `public/`
- Crest builder, side-effect-free: `TOKENS`, `COLOURWAYS` (ink, blushSage, blushInk, sage, inkEditorial), `frame()`, `monogram()`, `clefLetter()`, `crestSvg()`, `singleLetterCrest()`, `monogramCrest()` — `scripts/favicon/crest.ts`
- Design-round catalogue, 13 variants A–E, F, F1–F4, G1–G3 with rationale + critique, `SHIPPED_VARIANT_ID = 'crest-fv-sage'` — `scripts/favicon/variants.ts`
- Cormorant outlines F/V at wght 600/700 as SVG path data — `scripts/favicon/glyphs.ts` (generated) ← `scripts/favicon/extract-glyphs.py` (fontTools varLib instancer + brotli)
- `npm run favicon [-- --from <id>]` → `scripts/generate-favicons.ts`; `npm run favicon:variants` → `scripts/favicon-variants.ts` — `package.json`
- Review page, 14 cards (current + 13), inline SVG 16/32/48/180 on light `#f1f3f4` + dark `#202124` strips, true 16 px sharp rasters ×6 nearest-neighbour, "shipped" marker + decision line — `docs/design/favicon-variants.html` (~286 KB, generated)
- New skill `favicon-builder` (owner interview, 16 px gate, ship steps, vetoes) — `.agent/skills/favicon-builder/SKILL.md`, registered in `src/types/skills.ts`, `AGENTS.md` routing row, `CLAUDE.md` (skill count, two commands, "Favicon pipeline" paragraph)
- Gates at commit: eslint 0/0, vitest 64/64, pre-commit build + visual green, pre-push lint/unit/build/visual 109/109 green

## 2. Learnings (rules a future agent must follow)
- **Never judge a favicon from the vector preview; rasterise at 16 px and look at it on a light and a dark tab strip.** — magnolia B's first draft looked fine as SVG and read as an orchid/moth at 16 px; F/F3 letters look crisp at 48 and go soft at 16. Proof pipeline: sharp density `72*(size/64)*4`, nearest-neighbour ×6 magnification — `scripts/favicon-variants.ts`, 2026-11-09. [testing] [design]
- **Favicon SVGs must carry glyph outlines as paths, never live text/web fonts.** — a favicon SVG cannot load `@font-face`; the browser falls back to a system serif. Outlines extracted from `public/fonts/cormorant-garamond-latin.woff2` (1000 upm, cap height 625, placed with `translate` + `scale(s,-s)`) — `scripts/favicon/extract-glyphs.py`, `scripts/favicon/glyphs.ts`. [tooling] [design]
- **One source SVG → every icon by script; never hand-export a PNG.** — the legacy set drifted (daisy SVG vs badge PNGs) because each file came from a different source — `scripts/generate-favicons.ts`, `10c51f3`. [architecture]
- **Two letters inside the crest cost 16 px legibility.** — cap height drops 28 → 22 of 64 units for "FV" vs a single letter; at 16 px the pair becomes a bar under the arc. Single-letter crest: cap 28 / base 53 / tight frame; monogram: cap 22 / base 54 / wide frame — `scripts/favicon/crest.ts`. [design]
- **Measure palette contrast for small marks; the brand tints are low-contrast against each other.** — linen on sage ≈ 3.3:1 (F3 letters soften at 16 px), sage on blush ≈ 2.3:1 (F1 arc fades to a hint) — critiques in `scripts/favicon/variants.ts:174-210`. [design]
- **Stroke floor ≥ 4 of 64 units (≈1 px at 16), no gradients/filters/opacity, palette only from the 5 tokens.** — the GaborPortfolio insignia's metallic gradients are the counter-example — `.agent/skills/favicon-builder/SKILL.md` vetoes. [design]
- **`theme-color` / manifest colours tint the mobile browser chrome — they are not "the icon colour".** — a sage bar above the linen glass header would clash; kept `#faf7f2` — `index.html:17`, `public/site.webmanifest`; owner confirmed "Keep linen". [design] [owner-preference]
- **Present options with an honest critique and a recommendation; the owner picks, and may pick against the recommendation.** — I recommended E (16 px) / F1 (colour) / G3 (clef); the owner picked F3 anyway — record the pick, do not re-argue. [workflow] [owner-preference]
- **Owner taste: rejects generic/AI-looking marks; "more colourful, but not a rainbow" = 2–3 brand tints per mark, structure in ink or linen.** — D (gold rosette) was the generic counter-example; F1–F4 were the colour answer. [owner-preference]
- **The favicon is a family crest ("címer"): the badge's open arc (200°→340°) + three trailing dots per side, always with a letter.** — owner's brief 2026-11-09, inspired by GaborPortfolio's hexagon-"S" insignia (locked frame, letter inside, re-themed by palette only). [owner-preference] [design]
- **In a shared checkout, stage by hunk and diff every shared file before commit.** — `package.json` already carried the contact-form session's edits; only the two favicon lines were staged, `AGENTS.md`/`CLAUDE.md` diffs checked line by line — `10c51f3`. [workflow]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| Shipped favicon = F3 `crest-fv-sage` | owner, 2026-11-09 ("my favorite is the F3") | `scripts/favicon/variants.ts` `SHIPPED_VARIANT_ID`, SKILL.md "Shipped" row, review page decision line | no |
| Manifest `theme_color`/`background_color` + `<meta theme-color>` stay linen `#faf7f2` | owner, 2026-11-09 ("Keep linen") | `public/site.webmanifest`, `index.html:17`, SKILL.md | no |
| Favicon = crest (arc + dots + letter), always a letter | owner, 2026-11-09 | `.agent/skills/favicon-builder/SKILL.md` | no |
| F as treble clef ("violin key") was the owner's stated letter form; G1–G3 drawn, not picked | owner brief + pick, 2026-11-09 | `scripts/favicon/variants.ts` G1–G3, `clefLetter()` | partly — that the clef is *parked, not rejected* is not written anywhere → SKILL.md "Shipped" row |
| `inkEditorial` colourway allowed only because the lockscreen shipped it | session, 2026-11-09 | SKILL.md mood note | no |
| Favicon work done / MASTER-PLAN 1.8 favicon stack redone | session, 2026-11-09 | commit only | YES → `BACKLOG.md` (no favicon entry) and `.agent/memory.md` (no favicon learnings) |
| Visual baselines do not cover the favicon | fact | SKILL.md ship step | no |

## 4. Improvements NOT implemented yet
- [ ] Add `/favicon.ico` (16+32+48 multi-size) generated by `npm run favicon` — crawlers, some RSS readers and old browsers request `/favicon.ico` blindly and get a 404 on Vercel — `scripts/generate-favicons.ts`, `public/` — `curl -I https://www.fiorevera.hu/favicon.ico` → 200 — S — n
- [ ] Icon-set drift guard: unit test that the five PNGs were generated from the current `favicon.svg` (e.g. store the SVG hash in a generated manifest and compare) — prevents the exact legacy drift from recurring — `tests/unit/`, `scripts/generate-favicons.ts` — test fails after editing the SVG without re-running `npm run favicon` — M — n
- [ ] Maskable Android icon (`"purpose": "maskable"`, crest inside the 80 % safe zone) — Android launchers crop round; the current 512 tile may lose the outer dots — `scripts/generate-favicons.ts`, `public/site.webmanifest` — Chrome DevTools Application → Manifest shows no maskable warning — S — n
- [ ] Type-check `scripts/` (`tsc --noEmit` with a scripts tsconfig, or a lint-stage step) — `tsc -b` covers only `src/` + `vite.config.ts`, so `crest.ts`/`generate-favicons.ts` run under `tsx` without type checking — `tsconfig.scripts.json`, `package.json` — a type error in `scripts/favicon/` fails `npm run lint` or a new `typecheck` script — M — n
- [ ] Document the Python dependency of `extract-glyphs.py` (fontTools + brotli, `pip install fonttools brotli`) in the script header and SKILL.md "What exists" — only needed for a new letter/weight, but undocumented setup costs the next agent time — S — n
- [ ] Decide whether `docs/design/favicon-variants.html` (~286 KB, generated, base64 rasters) stays committed or becomes git-ignored and regenerated on demand — repo weight vs. reviewable history — S — y
- [ ] Reuse the F3 crest across the ecosystem (lockscreen badge corner, Mac wallpaper signature, e-mail signature, wedding stationery) — one mark everywhere — `scripts/lockscreen/designs.ts`, desktop-background skill — M — y
- [ ] Revisit the clef F (G2/G3) for print/stationery where 16 px does not apply — it was the owner's own letter idea — `scripts/favicon/variants.ts` — S — y
- [ ] Optional dark-mode treatment inside `favicon.svg` (`@media (prefers-color-scheme: dark)`) — low value because the sage tile is opaque and F3 is the clearest card on the dark strip; noted, not recommended — S — n
- [ ] Single-letter "F" crest in the F3 colourway as a 16 px-first alternative (cap 28 instead of 22) — if tab legibility ever matters more than the monogram — `scripts/favicon/variants.ts` — S — y
- [ ] Add a `BACKLOG.md` entry marking the favicon redo done (trace to MASTER-PLAN 1.8) and a `.agent/memory.md` favicon section — consolidation step of this goodbye — S — n

## 5. Skill updates needed
- `.agent/skills/favicon-builder/SKILL.md`: "Shipped" row should say the clef family G1–G3 is parked (owner's idea, not rejected) and that the owner picked F3 against the recommendation (E / F1 / G3); add the Python setup line for `extract-glyphs.py`; mention `favicon.ico` once it exists.
- `.agent/skills/seo-expert/SKILL.md`: should point to `npm run favicon` as the only way to change the `<link>` icon set, and note `theme-color` stays linen by owner decision (check its current favicon section against `index.html:12-17`).
- `.agent/skills/design-system-expert/SKILL.md`: add the crest (arc + dots + letter, F3 colourway) as a brand asset next to the badge, and the measured low contrasts (linen/sage 3.3:1, sage/blush 2.3:1) as a small-mark warning.

## 6. Open owner decisions / things only Gabor or Vera can do
- Clef F: keep parked, or use G2/G3 on print/stationery? Recommendation: show Vera G3 at large size for print only; the tab stays F3.
- Crest across the ecosystem (lockscreen, wallpaper, signature)? Recommendation: yes for the wallpaper signature, no change to the confirmed linen-classic lockscreen.
- Commit the 286 KB review page long-term, or ignore it? Recommendation: keep it (it is the decision record), regenerate only when a new round runs.
- Vera has not seen the favicon round as far as this session knows; Gabor picked F3. Worth a 1-minute look on her phone (home-screen icon = apple-touch 180).

## 7. Friction (what cost time and how to avoid it next time)
- Drafting started in the session scratchpad (`build.mjs`, `page.mjs`, `glyphs.json`) and was then ported to `scripts/favicon/` → for any design round, write the catalogue + builder in the repo from the first variant; the scratchpad copy was throw-away work.
- `PIPESTATUS` in an `rtk`-wrapped piped command printed an empty lint exit code → run gates unpiped (`npm run lint; echo $?`) or trust the pre-push hook.
- Shared checkout with the contact-form and i18n sessions (same files: `package.json`, `AGENTS.md`, `CLAUDE.md`) → stage hunks, `git diff --cached` every shared file, never `git add -A`.
- Scope grew mid-session from "five variants" to a new skill + three more rounds because the owner steered the side session directly → record each scope change in the shared notes file immediately (done in `favicon-variants-step1.md`), so the parent session is not surprised.
- Brief said "no commit"; the owner's own "push to remote" overrode it → when the owner overrides a parent-session constraint, say so in the reply and in the hand-over note (done).
