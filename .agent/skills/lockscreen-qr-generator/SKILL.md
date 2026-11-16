---
name: lockscreen-qr-generator
description: >-
  Produces the Fiore Vera iPhone lock-screen wallpapers (1179×2556) that frame a
  scannable QR code — a website edition and an Instagram edition — by compositing
  real painted/photographed material with sharp in scripts/lockscreen/designs.ts.
  Use for QR, iPhone, lockscreen, visit-card or phone-wallpaper requests.
---

# Lockscreen QR Generator — Fiore Vera

Vera's phone is her visit card: a guest scans the lock screen and lands on fiorevera.hu or Instagram. Everything renders deterministically from files in the repo — no image model, no manual compositing, no absolute paths.

## When to use this skill
- Regenerating the shipped lock screens after a URL, logo, frame or layout change
- Proposing a new lock-screen design or a new QR target
- Any "QR", "iPhone", "lockscreen", "visit card" request

## What exists

| Item | Path / command |
|---|---|
| Shipped editions | `scripts/generate-lockscreen.ts` → `npm run lockscreen` |
| Alternates (design-round losers) | `scripts/generate-lockscreen-variants.ts` → `npm run lockscreen:variants` → `public/assets/lockscreen/variants/` (generated on demand, folder absent until run) |
| Designs + compositing | `scripts/lockscreen/designs.ts` — side-effect-free; exports `renderLinenClassic`, `renderInkEditorial`, `renderSageGarland`, `renderBlushMinimal`, `ASSETS`, `SITE_URL`, `VARIANTS_DIR` |
| Libraries | `sharp` (keying, resize, composite, PNG), `qrcode` (`QRCode.create`, modules drawn as SVG rects) |
| Canvas | 1179 × 2556 px (iPhone 15/16 @3x), PNG `compressionLevel: 9` |

Inputs, all committed in `public/assets/lockscreen/`:

| File | Role |
|---|---|
| `wreath-source.jpg` (700 × 667) | Painted rose + eucalyptus wreath on cream paper; keyed in code (`keyWreath`: flood-fill from the border + pink-gated closing, soft 1 px edge) |
| `frame-gold.jpg` | Slender carved gold frame on white → linen-classic, blush-minimal |
| `ornate-frame.jpg` | Baroque gold frame on white → ink-editorial |
| `delicate-filigree-frame.jpg` | Openwork filigree frame on white → sage-garland |
| `logo-badge.jpg` | Fiore Vera wordmark badge on white; placed with `multiply`, never redrawn |

Outputs (same folder, committed):

| File | QR target |
|---|---|
| `fiore-vera-lockscreen-final.png` | `https://www.fiorevera.hu` (`SITE_URL` in `designs.ts`) |
| `fiore-vera-lockscreen-instagram.png` | `https://www.instagram.com/fioreveradekor/` (`INSTAGRAM_URL` in `generate-lockscreen.ts`) |

## Confirmed design: linen-classic (owner decision 2026-11-09, `BACKLOG.md`)

`renderLinenClassic`: linen `#faf7f2` canvas, blush `#e8c5c8` radial wash (30 % → 0, ellipse 700 × 640) centred at y 1350, wreath at scale 1.8 behind a 760 px slender gold frame, QR filling the frame aperture, soft frame shadow, logo badge 300 px wide at y 1985 (`multiply`). It beat ink-editorial, sage-garland and blush-minimal.

Owner feedback that shaped it: AI-collage renders, candles and flat code-drawn line art were rejected; only realistic material passed — the painted wreath, photographed frames and the untouched badge. It must read as a florist's printed piece, not a template.

## QR rules (`qrSvg`, `framedQr`)
- Generated at build time from the URL: `QRCode.create(url, { errorCorrectionLevel: 'H' })`, 2-module quiet zone, ink `#2c2825` modules on linen `#faf7f2`, `shape-rendering: crispEdges`, cells overdrawn by 0.3 px so no hairline gaps.
- Sized to the frame aperture (plus a small overlap under the frame); the console prints the final QR pixel size.
- Scannability is **not** automated: scan each PNG from a second phone and once more zoomed out to ~20 % — error-correction H gives headroom for the overlap and the wash.
- Never paste a pre-rendered QR image.

## iOS layout zones (1179 × 2556)

| Zone | Rule |
|---|---|
| Top ≈ 0–600 px (time, date, widgets) | Plain linen + wash only; nothing the clock can collide with |
| Centre ≈ 900–1800 px | Wreath, frame, QR |
| ≈ 1985 px | Badge |
| Bottom ≈ 2300–2556 px (flashlight, camera, home indicator) | Plain background |
| Anywhere | Nothing that imitates UI (no fake clock, icons, bars) |

## Brand tokens in the script
`LINEN #faf7f2`, `SAGE #7a8b7b`, `BLUSH #e8c5c8`, `GOLD #d4af37`, `INK #2c2825` — identical to `src/styles/tokens.css` (`--color-bg-linen`, `--color-sage`, `--color-blush`, `--color-gold`, `--color-text-main`). Change tokens there first, mirror here.

## Workflow
1. Edit a constant or design in `scripts/lockscreen/designs.ts`, or the URL in `scripts/generate-lockscreen.ts`.
2. `npm run lockscreen` (both editions) · `npm run lockscreen:variants` (alternates, only when comparing designs).
3. Open the PNG at 100 %, then scan it (phone + 20 % zoom-out).
4. Show the owner **one design at a time and name it** ("linen-classic"), never "option 2": a mislabelled button once promoted ink-editorial by mistake.
5. Commit the PNGs. They are exempt from the site's ≤ 200 KB webp rule (`tests/unit/assets.test.ts` skips `lockscreen/`); the two finals are ~2.7 MB each.

## Adding a design
Export `renderX(out: string, url = SITE_URL)` in `designs.ts` using the existing helpers — `backgroundSvg(body, defs)`, `wreathLayer(scale, flop?)`, `frameLayer(FRAMES.gold | ornate | filigree, outerWidth)`, `badgeLayer(width)`, `framedQr(frame, cx, cy, url, { shadow?, card? })`, `place(layer, left, top, blend?)`, `render(out, background, overlays, qrSize)`. Register it in `generate-lockscreen-variants.ts` until the owner promotes it to the final.

## Constraints
- No new AI-generated imagery without asking the owner. New material = a real photograph or painting dropped into `public/assets/lockscreen/` and keyed in code, with its geometry added to `FRAMES` / `WREATH_CROP`.
- Logo badge untouched: no recolour, redraw or crop.
- Portrait only; the Mac wallpaper is `desktop-background-generator`.
- Stale notes elsewhere: `CLAUDE.md` still describes the earlier pipeline (`BG_SOURCE` absolute path outside the repo, 768 px canvas, `qr-fiorevera.png`). That limitation was removed on 2026-11-08 (`BACKLOG.md`, "reproducible from repo-local inputs only") — the script runs on any machine after `npm install`. The header comment in `designs.ts` still calls ink-editorial "the shipped final"; the entry point and the owner decision say linen-classic.
