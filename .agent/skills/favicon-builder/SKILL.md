---
name: favicon-builder
description: >-
  Designs and ships the Fiore Vera favicon as a family crest ("címer"): the brand badge's
  open arc with trailing dots, always carrying a letter, rendered only from the locked
  tokens and proven at 16 px with sharp. Use for favicon, tab icon, apple-touch or
  android-chrome icon, manifest icon, crest or monogram requests. Interviews the owner
  before drawing; never picks the winner for him.
---

# Favicon Builder — Fiore Vera

The favicon is the smallest piece of the brand ecosystem (site → lockscreen QR → wallpaper) and the one most often judged at 16 px. It is a **crest, not a picture**: the badge's frame (open arc + three trailing dots per side) and a letter. Inspiration: the GaborPortfolio hexagon "S" insignia — a locked frame geometry with a letter inside, re-themed by palette only.

## When to use this skill
- A new favicon, a redesign ("looks generic", "smells like AI"), or a new letter/colourway
- Regenerating the PNG set after `public/favicon.svg` changed
- Any request mentioning favicon, tab icon, címer, crest, monogram, apple-touch, manifest icons

## What exists (code first — read before changing a rule)

| Item | Path / command |
|---|---|
| Crest builder (side-effect-free) | `scripts/favicon/crest.ts` — `TOKENS`, `COLOURWAYS`, `frame()`, `monogram()`, `clefLetter()`, `crestSvg()` |
| Design-round catalogue | `scripts/favicon/variants.ts` — every variant with id, rationale, critique, SVG |
| Letter outlines | `scripts/favicon/glyphs.ts` (generated) ← `scripts/favicon/extract-glyphs.py`, from `public/fonts/cormorant-garamond-latin.woff2`. **Python dependency, not part of `npm install`:** `python3 -m pip install fonttools brotli` (brotli opens `.woff2`); run `python3 scripts/favicon/extract-glyphs.py /tmp/glyphs.json` and copy the needed entries into `glyphs.ts`. Only for a new letter or weight — the script header has the details |
| Review page | `npm run favicon:variants` → `docs/design/favicon-variants.html` (inline SVG 16/32/48/180 on light + dark tab strips, sharp 16 px rasters ×6, critique per variant) |
| Ship the icon set | `npm run favicon [-- --from <variant-id>]` → `public/favicon.svg` + `favicon-16x16/32x32.png` (alpha) + `favicon.ico` (16 + 32 + 48, for clients that request `/favicon.ico` blindly) + `apple-touch-icon.png`, `android-chrome-192/512.png` (opaque, flattened on the tile colour) + `android-chrome-maskable-512x512.png` (square tile, crest scaled to 80 % around its centre so every mark stays inside Android's safe circle; `purpose: maskable` in `site.webmanifest`) |
| Drift guard | `scripts/favicon/icon-set.json` (generated: sha256 of the SVG and of every output) ↔ `tests/unit/favicon.test.ts` — editing `favicon.svg` without re-running `npm run favicon`, or touching an icon by hand, fails `npm test`; the test also checks the ICO structure and the maskable safe zone |
| HTML links | `index.html` `<!-- Favicons -->` block — SVG, 32, 16, apple-touch, manifest, theme-color |
| **Shipped (2026-11-09)** | F3 `crest-fv-sage` — sage tile, linen arc and FV (Cormorant 700), gold/blush/gold dots; owner's pick, against the recommendation (E / F1 / G3) — record the pick, do not re-argue. The clef family G1–G3 is **parked, not rejected** (the owner's own letter idea; a candidate for print where 16 px does not apply). Manifest + `theme-color` kept linen (browser chrome) |

## How to use it

### 1. Interview the owner (one question block, wait for answers)
1. **Letter(s)** — which letter or pair carries the crest (F, V, FV)?
2. **Letter style** — Cormorant Garamond outline (600/700), or a drawn form (e.g. the F as a treble clef / violin key)? A new letter or weight → run `extract-glyphs.py` first; a new drawn form → add a function in `crest.ts`.
3. **Colourway** — one of `COLOURWAYS` (`ink`, `blushSage`, `blushInk`, `sage`, `inkEditorial`) or a new one built only from the five tokens.
4. **Priority** — 16 px tab legibility, or the 180 px+ bookmark/home-screen sizes? (They trade off; say so.)

### 2. Draft, then prove at 16 px
- Append variants to `scripts/favicon/variants.ts` (never edit a shipped one silently), run `npm run favicon:variants`, open the page in the browser.
- Each variant gets a two-line rationale and an **honest critique**, and the page ends with a recommendation — the owner picks.
- Gate: every stroke ≥ 4 units of 64 (≈ 1 px at 16), no gradients, filters, live fonts, opacity; check both strips (`#f1f3f4`, `#202124`). Accents that vanish at 16 px are dropped, and the drop is written on the page.

### 3. Ship (only after the owner's pick)
`npm run favicon -- --from <id>` → verify the PNGs, the ICO and the maskable icon visually (a new crest geometry may need a new `MASKABLE_SCALE` / `CREST_CENTRE` in `scripts/generate-favicons.ts`; the safe-zone test tells) → commit `scripts/favicon/icon-set.json` with the icons → keep `index.html` links valid → `site.webmanifest` colours stay linen unless the owner wants the browser chrome tinted → DoD (`npm run lint`, `npm test -- --run`, `npm run build`, `npm run test:visual` — baselines do not include the favicon) → Review Brief → commit only on "GO".

## Sparring Manifesto (veto rules)
- **Crest veto**: a favicon without the arc-and-dots frame or without a letter is a different brand — stop and ask.
- **Palette veto**: any colour outside `TOKENS`, any gradient, filter or opacity — the GaborPortfolio insignia's metallic gradients are the counter-example.
- **16 px veto**: nothing ships that was not rasterised at 16 px on both strips and looked at.
- **Mood note**: the `inkEditorial` (dark) colourway is an exception to `design-system-expert`'s no-dark-surfaces rule, allowed because the lockscreen already shipped it — a decision, never a default.
- **Hand-off**: `seo-expert` owns the `<link>` set and manifest validity; `design-system-expert` owns the tokens.
