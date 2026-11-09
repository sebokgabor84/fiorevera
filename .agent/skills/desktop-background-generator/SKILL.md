---
name: desktop-background-generator
description: >-
  Brand wallpaper for Vera's Mac (16:10 MacBook, optional 16:9 external) in the
  Fiore Vera linen/sage/blush/gold system, built with the same sharp compositing
  approach as the iPhone lock screen. No script exists yet; this skill fixes the
  intended pipeline and constraints. Use for wallpaper, Mac background, desktop
  requests.
---

# Desktop Background Generator — Fiore Vera

**Status: not built.** Open item in `BACKLOG.md` (`[ASSETS] Mac wallpaper`), a parallel track independent of the site build (README "Ecosystem Vision"). The lock screen (`lockscreen-qr-generator`, `scripts/lockscreen/designs.ts`) is the proven template; this skill describes how to extend it, not a finished tool.

## When to use this skill
- The owner asks for a Mac wallpaper / desktop background / "company representation on my machine"
- Reusing the lock-screen material for a landscape format

## Intended pipeline (mirror of the lock screen)

| Step | Lock screen today | Wallpaper (to build) |
|---|---|---|
| Entry point | `scripts/generate-lockscreen.ts` → `npm run lockscreen` | `scripts/generate-wallpaper.ts` → add `"wallpaper": "npx tsx scripts/generate-wallpaper.ts"` to `package.json` |
| Canvas | 1179 × 2556 portrait | `2880 × 1800` (MacBook Pro 13/14" 16:10 @2x); optional `3840 × 2160` (external 16:9). One render function, canvas as parameter |
| Background | `backgroundSvg()`: linen rect + blush radial wash + 5 % fractal grain | Same helpers. Extract them (`keyWreath`, `frameLayer`, `badgeLayer`, `backgroundSvg`, `place`, `render`) from `designs.ts` into a shared module rather than copying; `npm run lockscreen` must produce byte-identical PNGs afterwards |
| Material | `wreath-source.jpg`, `frame-*.jpg`, `logo-badge.jpg` keyed/multiplied | Same inputs from `public/assets/lockscreen/`; any new material is a real photo or painting, keyed in code |
| QR | Required, fills the frame aperture | Optional. If included: `framedQr`, ≥ 600 px, placed where no icons or windows normally sit; scan-test like the lock screen |
| Output | PNG, `public/assets/lockscreen/` | PNG, `public/assets/wallpaper/`. **200 KB is not a limit** (it is a rule for site webp only); the folder must be exempted from `tests/unit/assets.test.ts` the way `lockscreen/` is — a `tests/` change, so it goes through `qa-specialist` and its own GO |

## macOS layout zones (2880 × 1800, @2x)

| Zone | Rule |
|---|---|
| Top ≈ 0–80 px (menu bar) | Plain, light linen so macOS keeps the menu bar legible; no texture or wreath leaves under it |
| Right ≈ 20 % (desktop icons stack top-right by default) | Calm background only |
| Bottom ≈ 0–220 px (Dock, if shown) | Plain |
| Centre-left | Wreath, frame/QR if any, badge; badge ≤ 15 % of canvas width |
| Everywhere | Mostly empty linen — the image lives behind windows all day; it is a mood, not a poster |

## Design direction (owner-confirmed through the lock-screen round)
- **Linen-classic family**: linen base, blush wash, painted wreath, slender gold frame, the real badge. Same tokens as the script: `LINEN #faf7f2`, `SAGE #7a8b7b`, `BLUSH #e8c5c8`, `GOLD #d4af37`, `INK #2c2825` (= `src/styles/tokens.css`).
- **Rejected by the owner**: AI-collage renders, candles, flat code-drawn line art. No image-model output without asking first.
- Prefer a light base over the ink variant on the desktop: windows and the menu bar sit on it, and a dark base flips the menu bar to dark.
- Logo badge untouched.
- Present one named draft at a time ("linen-classic wide"), never positional options.

## Workflow when building it
1. Plan + Honest Critique, `feature/wallpaper` branch, explicit GO (`AGENTS.md` release protocol).
2. Extract the shared helpers; prove the lock screen is unchanged (`npm run lockscreen`, compare hashes of the two PNGs before/after).
3. Write `scripts/generate-wallpaper.ts`, render both sizes, view at 100 % on the actual Mac with the Dock and a Finder window open.
4. Scan-test if a QR is included. Commit the PNGs, mark the BACKLOG item, record learnings in `.agent/memory.md`.

## Out of scope
Animated / live wallpapers (the old steampunk animation resource was removed), dark-mode variants, and any 8K/"cinematic render" output — the deliverable is one or two calm PNGs that match the printed brand.
