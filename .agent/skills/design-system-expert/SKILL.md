---
name: design-system-expert
description: >-
  Owns every visual decision on the Fiore Vera site: the linen/sage/blush/gold
  tokens in src/styles/tokens.css, self-hosted Cormorant Garamond + Inter, fluid
  clamp() type, CSS-module layout, the glass header, the 3:2 gallery carousel,
  overlay stacking and the image pipeline (assets-src → public/assets, three WebP
  tiers ≤ 200 KB). Use for CSS, layout, mobile, typography, palette, hero,
  gallery, animation or any photo/asset change.
---

# Design System Expert — Fiore Vera

Keeps the site romantic, rustic-elegant and warm: the legacy Webnode aesthetic elevated, not replaced. Every rule below describes code that exists — read the named file before changing the rule.

*(Contrast maths and ARIA → `accessibility-expert`. `alt`, CLS, LCP → `seo-expert`. Copy → `i18n-guardian`.)*

## When to use this skill
- Any change under `src/styles/` or in a `*.module.css`
- Mobile layout, overflow, line length, hyphenation, stacking (toast / menu / scroll-to-top)
- Adding or replacing photography (hero, about, gallery album, rental item, brand)
- Header, hero, carousel, cards, buttons, forms — anything a visitor sees

## How to use it

### 1. CSS principles (what the code does today)

| Principle | Rule | Where |
|---|---|---|
| Tokens only | Every colour, font, size, space, radius, shadow and duration is a custom property from `src/styles/tokens.css`. No hex, no magic `px` in modules. | `tokens.css` |
| Fluid type | Sizes come from `--fs-xs … --fs-3xl` (`clamp()`); `h1–h4` are mapped in `global.css`. Never a fixed `px` font-size. | `global.css` |
| CSS modules | One `kebab-case.module.css` per `PascalCase` component folder (`eslint-plugin-check-file` enforces both). Shared utilities (`.container`, `.section`, `.btn`, `.card`, `.eyebrow`, `.glass-panel`, `.ornament`) live in `global.css`. | `src/components/**` |
| Cascade order | `global.css` is imported after the component modules, so at equal specificity a **global utility beats a module class on the same element**: `.btn` hid the hero ghost button's outline, `.container` cancelled `.prose` (2026-11-16). A module rule that overrides a utility on its own element needs two classes (`.heroActions .heroGhost`) or must target the children (`.prose > *`). | `home.module.css`, `pages.module.css` |
| Layout | Grid/Flex with `gap`; breakpoints in `rem` (`48rem`, `64rem`, `70rem`, `80rem`). Add columns only when each is wide enough to avoid hyphen soup — reason cards go 3-up at `≥ 64rem`, not `48rem` (QA M12). | `home.module.css` |
| Content column | `.container { max-width: min(100%, var(--content-max)) }` (72rem). The header bar is wider on purpose: `.header .bar { max-width: min(100%, 90rem) }`, because logo + 6 nav items + language switch + quote button need ~1180 px; at 72rem the wordmark broke per character at 1280–1920 (2026-11-09 regression). | `global.css`, `header.module.css` |
| Safety Layer | The block at the end of `global.css` applies `max-width: 100%` to `body, main, section` and `overflow-wrap: anywhere` to text. **Never add `.container` to it** — an equal-specificity rule after the utility re-capped it to 100 % on every page, producing 120–185-character lines (QA M1). | `global.css` |
| Hyphenation | **None, at any width** (owner decision 2026-11-18; before: `hyphens: auto` on body text `≤ 48rem`, which produced "terve-zéstől", "kell-jen"). `overflow-wrap: anywhere` in the Safety Layer keeps an over-long word from overflowing. Nav links and the wordmark use `white-space: nowrap; hyphens: manual`. | `global.css`, `header.module.css` |
| Glass header | **Owner decision 2026-11-09 ("option A"): always glass, never scroll-dependent** — a contrast failure is a hard no-go for the owner, and over the hero photo no text colour or shadow can guarantee WCAG contrast. The header always carries an 85 % linen surface (`--glass-bg` + `--glass-blur`); scrolling only adds the gold hairline and a deeper shadow (`.scrolled`). The glass sits on `.header::before`, not on `.header` — `backdrop-filter` makes an element the containing block for `position: fixed` descendants and would trap the mobile menu panel inside the header box. | `header.module.css` |
| Overlays | Stacking: header 100 · menu panel 99 · toast 120 · carousel 81 · scroll-to-top 80 (the carousel sits above the button on purpose: below ~1180 px the button shares its column with the "next" arrow, and a tap on the arrow must never jump to the top). The toast is bottom-anchored, hidden while `body.menu-open`, and `body.toast-visible` reserves `padding-bottom: 7rem`. Any new fixed element is hit-tested at 375 and 1280 with the menu open and the toast visible (QA M9: a top toast covered every H1 and the first menu items). | `language-toast.module.css`, `scroll-to-top.module.css` |
| One layout per component | **Owner decision 2026-11-09** on the toast ("simplify the implementation, to not depend on device"): text row, then an action row where the CTA fills the line and the × sits flush right — identical at every width; the only media query caps the toast's own width (`≥ 40rem`: `max-width: 28rem`, right-aligned). Default for new components: one layout, a breakpoint only when it is unavoidable, and say why in a comment. | `language-toast.module.css` |
| Sticky columns | **Never sticky below `48rem`.** In a single column the sticky image pinned under the header and the text scrolled behind it (owner: "critical UX bug", 2026-11-09). `.sticky` is `static` by default and `sticky` only in the two-column layout; `layout.spec.ts` asserts that every sticky element fits the viewport. | `src/pages/pages.module.css` |
| Footer grid | One column below `48rem`, **two columns from `48rem`, four from `70rem`** (`1.6fr 1.15fr 0.9fr 0.9fr`): with four columns below ~1050 px the contact column was narrower than `info.fiorevera@gmail.com` (218 px at 18 px Inter) and the address broke mid-word ("gmail.co / m"); layout invariant 7 (`tests/visual/layout.spec.ts`) now fails on any one-token link that wraps. Second line of defence: e-mail addresses are rendered by `<EmailLink>` and can break at the `@` only. When a column needs more room, shrink the short-content columns, **not** the brand column — `1.5fr 1.15fr 1fr 1fr` pushed the tagline to a 4th line and grew the 404 page by 28 px. | `footer.module.css`, `EmailLink.tsx`, `global.css` |
| Carousel | **Owner rules 2026-11-09: arrows always rendered — also on phones — on top of the image, constant box size, nothing jumps; "do not overcomplicate".** Every album renders its carousel directly (the cover/hover swap was dropped: it re-fitted the image and read as cropping, MASTER-PLAN 2.8 amendment). Fixed `aspect-ratio: 3 / 2` box, `object-fit: cover; object-position: center` — no letterbox bars, no resize between slides; the few portrait shots are centre-cropped (owner decision 2026-11-18: no per-photo focus point; Vera picks landscape covers). One slide per swipe (`scroll-snap-stop: always`). The carousel is `z-index: 81`, one layer above the scroll-to-top button — see Overlays. Arrows are `--touch` (48 px), absolutely positioned, always visible, `z-index: 1`. Track focus ring uses `outline-offset: -4px` because the box clips (QA M11). | `gallery.module.css` |
| Long tokens | The Safety Layer lets links break anywhere. E-mail addresses use `<EmailLink>` (`.email-link`): one line when it fits, otherwise a break at the `@` only — the footer no longer depends on its column ratio. Deep-link offset comes from `html { scroll-padding-top }` alone; never add `scroll-margin-top` on the target as well (the two added up to 137 px). | `EmailLink.tsx`, `global.css` |
| Reading measure | Text-only blocks stop at `--prose-max` (42rem) or the pillar measure (46rem): privacy sections, service steps. | `pages.module.css` |
| Hero | Phones: the two hero buttons are stacked full width in every language; from `48rem` they sit in a row. The shade's lower gradient stops are measured for contrast (lead ≥ 4.8:1, subtitle ≥ 4.2:1 on every pixel behind them, 320–1920 px, three locales) — re-measure when the hero photo or the stops change. Rental cards: on phones the price is the first, full-width row of the spec grid (CSS `order`); from `48rem` it stays in the grid in source order — the owner saw the full-width row on desktop and preferred the grid (2026-11-18). | `home.module.css`, `RentalCard.tsx` |
| Numerals & gold | `--color-gold` is a border/ornament/focus colour. Text-sized gold on white is 2.1:1 → numerals and labels use `--color-sage-deep` or `--color-gold-deep` (QA M7). | `home.module.css` |
| Motion | `--dur-fast`/`--dur-base` + `--ease-out`; animate `transform`/`opacity` only; `prefers-reduced-motion` is honoured globally. | `global.css` |
| Hydration | No `window`/`document` in render; `body` class toggles (`menu-open`, `toast-visible`) happen in effects (PRD D-18). | `Layout.tsx` |

### 2. Tokens (copied from `src/styles/tokens.css`)

| Token | Variable | Value | Use |
|---|---|---|---|
| Linen | `--color-bg-linen` | `#faf7f2` | page background |
| Surface / warm surface | `--color-surface` / `--color-surface-warm` | `#ffffff` / `#f3ede4` | cards / alternating sections |
| Text main / muted | `--color-text-main` / `--color-text-muted` | `#2c2825` / `#6b635b` | body / captions |
| Sage / deep / soft | `--color-sage` / `--color-sage-deep` / `--color-sage-soft` | `#7a8b7b` / `#5f6f60` / `#e3e8e2` | accent / AA text, links, buttons / tints |
| Blush / soft | `--color-blush` / `--color-blush-soft` | `#e8c5c8` / `#f6e7e8` | hover underline, `::selection` / tints |
| Gold / deep / soft | `--color-gold` / `--color-gold-deep` / `--color-gold-soft` | `#d4af37` / `#a4841f` / `rgba(212, 175, 55, 0.25)` | focus ring, ornaments / AA small text / hairlines |
| Error / success | `--color-error` / `--color-success` | `#9b3b3b` / `#4e6b4f` | form states |
| Glass | `--glass-bg` / `--glass-border` / `--glass-blur` | `rgba(250, 247, 242, 0.85)` / `1px solid rgba(212, 175, 55, 0.25)` / `blur(12px)` | header, toast, `.glass-panel` |
| Type scale | `--fs-xs … --fs-3xl` | `clamp(0.78rem, …)` → `clamp(2.6rem, 1.8rem + 4vw, 5rem)` | all text |
| Line heights | `--lh-tight` / `--lh-snug` / `--lh-body` | `1.1` / `1.3` / `1.65` | headings / leads / body |
| Space | `--space-1 … --space-9`, `--gutter` | `0.25rem` → `clamp(4rem, 3rem + 6vw, 8rem)`, `clamp(1rem, 4vw, 2.5rem)` | padding, gaps |
| Widths | `--content-max` / `--prose-max` | `72rem` / `42rem` | `.container` / `.prose` |
| Shape | `--radius-sm/md/lg`, `--shadow-soft/card`, `--border-hairline` | `4px/10px/18px`, … | cards, images |
| Motion | `--ease-out`, `--dur-fast` / `--dur-base` | `cubic-bezier(0.22, 1, 0.36, 1)`, `160ms` / `260ms` | transitions |
| Layout | `--header-h` / `--touch` | `4.5rem` / `48px` | sticky offset / min target |

Adding a token: add it to `tokens.css`, use it through `var()`, extend this table. Never introduce a parallel palette inside a module.

### 3. Typography

| Role | Stack (`tokens.css`) | Files (`public/fonts/`, declared in `src/styles/fonts.css`) |
|---|---|---|
| Headings `h1–h4`, wordmark, quotes, hero subtitle (italic) | `--font-heading: 'Cormorant Garamond', 'Playfair Display', Georgia, serif` | `cormorant-garamond-latin{,-ext}{,-italic}.woff2`, variable 400–700 |
| Body, controls, eyebrows | `--font-body: 'Inter', 'Lato', system-ui, -apple-system, sans-serif` | `inter-latin{,-ext}.woff2`, variable 400–600 |

Self-hosted, `font-display: swap`, latin + latin-ext subsets (HU/DE diacritics), preloaded in `index.html`. Headings: weight 500, `--lh-tight`, `text-wrap: balance`. Eyebrows: `--fs-xs`, 600, `--tracking-caps`, uppercase, `--color-sage-deep`. No Google Fonts `<link>`.

### 4. Images & asset slots

| Slot (`public/assets/…`) | Source (`assets-src/…`) | Referenced from |
|---|---|---|
| `hero/` | `hero/` | `IMAGE_META.hero[0]` — `HomeHero.tsx`, `SeoHead.tsx` (OG image) |
| `about/` | `about/` | `IMAGE_META.about[…]` — About page, about teaser |
| `brand/` | `brand/` | `IMAGE_META.brand[0]` — logo, alpha kept, two files: the full mark and a 240 px header tier (`srcSmall`, `-w240.webp`). `Header.tsx` serves `srcSmall` with `srcset 240w, <full>w` and `sizes="80px"`; the logo renders 2.75rem (44 px) wide. After a logo swap re-run `npm run optimize:assets` and look at the header at 375 and 1280 |
| `gallery/<album-slug>/` | `gallery/<album-slug>/` | `src/data/albums.ts` by `id` + `coverIndex` (PRD D-6) |
| `rental/<item-id>/` | `rental/<item-id>/` | `src/data/rentalItems.ts` by `id`; `rental/_page/` = page hero |
| `lockscreen/` | — | not site imagery; owned by `lockscreen-qr-generator` |

Adding or replacing a photo: drop the original into `assets-src/<slot>/` (git-ignored; re-seed with `npm run archive:legacy -- --seed-assets`), run `npm run optimize:assets`, commit `public/assets/**` and the regenerated `src/data/generated/imageMeta.ts`. The script writes three WebP tiers per photo (long edge ≤ 1920 / `-w1280` / `-w800`, each ≤ 200 KB, quality ceilings 82 / 76 / 70 — `TIER_QUALITY`) and deletes orphans. `--force` re-encodes **every** tier: when only a lower tier's ceiling changed, restore the untouched tier's files with `git checkout` so the binary diff stays honest. A re-encode stays inside the visual gate's tolerance — run `npm run test:visual`, do not re-baseline for it. Data files reference slots and slugs, never filenames (PRD D-5). Render with `<Picture asset={…} alt sizes priority? />` (`src/components/Common/Picture.tsx`): it emits `srcset`, `width`/`height`, lazy/eager. Never hand-place a file in `public/assets/`, never `<img src="/assets/…">` by path. Details: `resources/image-pipeline.md`.

### 5. Brand marks

| Mark | Rule | Owner |
|---|---|---|
| Badge (`logo-badge.jpg`, header logo) | Never recoloured, redrawn or cropped | `lockscreen-qr-generator`, this skill |
| Family crest (favicon) | The badge's open arc (200° → 340°) with three trailing dots per side, **always carrying a letter**; shipped: F3 `crest-fv-sage` (sage tile, linen arc + "FV", gold/blush/gold dots). Built only from the five tokens, no gradients | `favicon-builder` (`scripts/favicon/crest.ts`) |
| Browser chrome | `theme-color` and the manifest colours stay linen `#faf7f2` (owner 2026-11-09, "Keep linen"): they tint the mobile browser bar above the linen glass header, they are not "the icon colour" | `index.html`, `public/site.webmanifest` |

Small-mark warning: the brand tints are low-contrast against each other — linen on sage ≈ 3.3:1, sage on blush ≈ 2.3:1 (critiques in `scripts/favicon/variants.ts`). Fine for a tile or an ornament, not for thin strokes or text; structure goes in ink or linen, tints carry at most 2–3 accents per mark ("more colourful, but not a rainbow", owner).

### 6. Open owner decisions (not rules — do not settle them in code)
Portrait crops in the 3:2 carousel · gold numerals · hyphenation policy · emoji in the rental step (`BACKLOG.md` `[CONTENT]`, QA report § "Owner decisions needed") · hero secondary CTA at 375 (HU/DE wrap under the primary) · rental price-cell order · full image tier at q76 instead of q82 · whether the crest also signs the wallpaper or stationery (`favicon-builder`).

### 7. Accessibility handshake
Contrast 4.5:1 for text, 3:1 for large text and UI; every control ≥ `--touch` (48 px); the 3 px gold `:focus-visible` ring must stay visible (watch `overflow: hidden`); native `<button>`/`<a>` only. This skill picks the colour, `accessibility-expert` verifies with axe. If a pair fails, change the token use (e.g. `--color-sage-deep` instead of `--color-gold`), never the ratio.

## Sparring Manifesto (veto rules)
- **Mood veto**: anything that leaves linen/sage/blush/gold — dark themes, neon, saturated accents, metallic textures, heavy shadows. The reference is a florist's printed stationery, not a tech product.
- **Token veto**: a hex value, an `rgba()` outside a token, or a fixed `px` font-size in a module is rejected; add a token instead.
- **Overlay veto**: any fixed or sticky element not hit-tested at 375 and 1280 with the menu open and the toast visible.
- **Width veto**: touching `.container`, the Safety Layer, `--content-max` or `.header .bar` without screenshots at 375 / 768 / 1280 / 1920 (`resources/layout-safety-checklist.md`).
- **Asset veto**: a file > 200 KB in `public/assets/` (except `lockscreen/`), a hand-placed image, a filename in a data file, a Google Fonts request.
- **Vocabulary veto**: portfolio/steampunk/industrial terms ("cockpit", "HUD", "mission control", "artisan", gears, copper) in code, copy or comments. Names describe wedding-site things: `hero`, `album`, `carousel`, `reason`, `quote`, `rental`.
- **Regression veto**: no visual change ships verified on one viewport. Visual verification (README step 9 / `AGENTS.md` POST-5) is part of the DoD; the unit and e2e suites do not assert widths, stacking or line length, and the visual gate's invariants do not assert **wrapping** — a mid-word break is caught by eyes only (`qa-specialist` §2 review flow).

## Resources
- `resources/image-pipeline.md` — the three WebP tiers, the manifest shape, `Picture` usage, how `sizes` picks a tier.
- `resources/layout-safety-checklist.md` — widths and states to screenshot before any layout, header, overlay or Safety-Layer change.
