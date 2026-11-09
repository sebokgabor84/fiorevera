# QA session — 2026-11-09 · `feature/site-build` (post-commit `1ca5d84` + uncommitted fixes)

Scope: full E2E session on the production build (`npm run build` → `vite preview` at :4173) covering SEO, accessibility, i18n, usability/UI and performance, reusing the QA atlas `web-qa` method (its `seo` / `ui` / `a11y` modules driven locally, since its CLI is bound to the shop hosts). Five inputs: atlas web-qa run, static SEO audit of `dist/`, i18n audit, usability/UI sweep (chromium + webkit + firefox, 320–1920 px), Lighthouse 12.8 (6 pages). Nothing in the repo was changed by the audits; this file records the result.

Evidence (outside the repo):

| Source | Location |
|---|---|
| Atlas web-qa run (42 findings, 104 suppressed, 180 PNGs, board `index.html`) | `/Users/gabor.seboek/Documents/Projects/aw-qa-atlas/data/personal/gabor/web-qa-runs/2026-11-09-fiorevera-all/` |
| SEO audit script + `results.json` | scratchpad `seo/` |
| i18n scripts + `report.json` + PNGs | scratchpad `i18n/` |
| UI sweep scripts, `measurements.json`, 164 PNGs | scratchpad `ui/` |
| Lighthouse HTML/JSON reports | scratchpad `lighthouse/` |

Scratchpad root: `/private/tmp/claude-502/-Users-gabor-seboek-Documents-Projects-Private-fiorevera/5669bea9-dbc7-488d-aa54-fcb1f84e3a4d/scratchpad/` (session-scoped; copy anything worth keeping).

## Scorecard

| Gate | Result |
|---|---|
| Lint / unit / Playwright (4 browsers) | 0 warnings · 54/54 · 260 passed, 16 skipped |
| Lighthouse SEO / Best practices | 100 / 100 on all 6 pages |
| Lighthouse Accessibility | 100 (gallery, rental, contact) · 96 (home HU/DE: gold numerals + logo label) |
| Lighthouse Performance | desktop home 99 · mobile 82–92 (home 85 median; one 61 run was a TBT outlier, 0 ms on two reruns) |
| Atlas UI module (48 loads) | CLS 0.000, no overflow, no clipped text, no broken/distorted images |
| axe WCAG 2.x A/AA (48 loads + open mobile menu) | 2 rule groups: `color-contrast` (home numerals), `label-content-name-mismatch` (logo, language switch) |
| SEO hard checks (24 pages) | titles/descriptions unique & in range, lang, canonical, hreflang + x-default reciprocal, sitemap = routes, noindex on 404s, alt/width/height on every img, assets ≤ 200 KB |
| i18n parity | 265/265/265 keys, placeholders identical, no empty/identical values, toast + switch behaviour correct |

Blockers: **0**. Majors: **13** (below). Minors/Nits: ~55, grouped after.

## Major findings (fix before launch)

| # | Area | Finding | Evidence | Fix direction |
|---|---|---|---|---|
| M1 | UI | `.container` has no effective max-width: the safety layer `body, main, section, .container { max-width: 100% }` (`global.css` ~L251) comes after `.container { max-width: var(--content-max) }` and wins. Text runs 120–185 characters per line at 1280–1920; the gallery carousel is 1840 × 1227 px at 1920 (taller than the viewport). | `ui/slices/services-hu-1920-p1.png`, `ui/slices/gallery-hu-1920-p1.png` | Change the safety-layer selector (or use `min(100%, var(--content-max))`); re-check `.inner`/`--prose-max`. Root cause of 3 downstream issues. |
| M2 | SEO | Soft 404: `vercel.json` rewrites `/:path*` → `/404.html` (+ `/de/`, `/en/`); a rewrite keeps HTTP 200 on Vercel, so unknown URLs answer 200 with a `noindex` page. | atlas `seo-soft404-*`, SEO audit #1 (assumption [A2], verify on the Vercel preview) | Drop the catch-all rewrites and let Vercel serve its native `404.html` with status 404 (per locale folder), or use `routes` with `status: 404`. |
| M3 | SEO | `LocalBusiness` JSON-LD keeps one `@id` but `url` and `description` change per page (`SeoHead.tsx`). Entity must be stable. | SEO audit #2 | `url` = locale home, fixed business description; move page data to a `WebPage` node if wanted. |
| M4 | i18n / SEO | Hungarian strings in the static shell on DE/EN pages: skip link "Ugrás a tartalomra" (first Tab stop), `<noscript>` block with a second `<h1>`. | `i18n/skip-link-en.png`, atlas `seo.h1.multiple` (suppressed as noscript) | Localize both in `scripts/prerender.ts` per route; demote the noscript heading to `<p>`. |
| M5 | i18n / SEO | Album names carry the HU conjunction "és" on DE/EN: 13 albums × h2 + alt + carousel `aria-label` + ImageGallery JSON-LD (174 hits per DE/EN gallery page). | `/de/referenzen/` h2 "Klaudia és Thomas — Hannersberg, Österreich" | Store partners as a pair in `albums.ts` and join with a locale key (`gallery.and`: és/und/and), or use "&". |
| M6 | Hydration (D-18) | `Footer.tsx:16` `new Date().getFullYear()` in render; prerendered year will mismatch the client after 31 Dec. | code | Build-time constant (like `PRIVACY_UPDATED`) or set in an effect. |
| M7 | A11Y | Reason-card numerals "01/02/03" on home: `#d4af37` on white = 2.1:1 (large text needs 3:1). They are `aria-hidden` decorative indices, so a judgment call, but Lighthouse/axe flag them on every home locale. | atlas `a11y-axe-color-contrast-home-*`, Lighthouse a11y 96 | Use `--color-sage-deep` or a darker gold for text-sized indices, or render them as true decoration (background numeral). |
| M8 | A11Y (WCAG 2.5.3) | Label-in-name mismatch: logo link `aria-label="Fiore Vera – kezdőlap"` vs visible "Fiore Vera virág és dekoráció"; language switch `aria-label="Váltás erre a nyelvre: Deutsch"` vs visible "DE". Speech-input users cannot say the visible text. | atlas `a11y-axe-label-content-name-mismatch-*` | Start the accessible name with the visible text ("Fiore Vera – kezdőlap" already does for the brand; drop the tagline from the link or include it); switch: `aria-label="DE – Deutsch"` or visible full names. |
| M9 | UI / A11Y | Language toast (z-index 120) covers the first line of every inner-page H1 and the hero text at 320/375, and covers the first two items of the open mobile menu (panel z-index 99). Affects every DE/AT visitor on HU pages and every EN browser. | `ui/slices/services-hu-375-p1.png`, `ui/menu-open-375.png` | Render the toast in flow under the header (push content) or at the bottom on mobile; hide it while `body.menu-open`. |
| M10 | A11Y | Mobile menu: Escape only works while focus is inside the panel; after tapping empty panel space or with focus on the toggle, Escape does nothing and the scroll lock stays. | `ui/menu.mjs` | Attach the Escape listener to `document` while open. |
| M11 | A11Y | Carousel track focus ring is clipped by `.carousel { overflow: hidden }` (6 px of 722 850 changed on focus). | `ui/kbd-gallery-track-focus-1280-v2.png` | `outline-offset: -3px` on the track, or `.carousel:has(:focus-visible)` ring. |
| M12 | UI | 768 px: three ~190 px reason-card columns with 6–8 hyphenated breaks per card; global `hyphens: auto` also hyphenates desktop hero/footer text ("más-napi", "Nagykani-zsa"). | `ui/slices/home-hu-768-p1.png`, `ui/slices/home-hu-1280-p1.png` | 1 column until 64rem (or 2+1); restrict `hyphens:auto` to ≤ 48rem body text, never headings. |
| M13 | Perf | Mobile LCP 4.2 s (home) / 4.7 s (gallery): the hero `<img sizes="100vw">` picks the 1920 px variant on phones though an 800 px one exists; gallery first slide likewise; Lighthouse "uses-responsive-images" 179–873 KB savings. | `lighthouse/home-hu-mobile.report.html` | `sizes="(max-width: 48rem) 100vw, 1920px"` is not enough; add a ~1200 px variant and tighten `sizes`; keep `fetchpriority=high` + preload. |

## Minor findings (grouped)

**SEO** — `inLanguage` is not a LocalBusiness property; no `priceRange`/`geo`, generic type instead of `Florist`; no `Product`/`Offer` on the rental page (strongest commercial page); no `BreadcrumbList`; home h1 is brand-only "Fiore Vera" (topic lives in the subtitle); 404 pages combine `noindex` with a canonical to the locale home (contradictory); sitemap lacks `lastmod` and carries ignored `changefreq`/`priority`; OG lacks `og:locale:alternate`, `og:image:width/height/alt`, `twitter:image:alt`, one global og:image; home hero + 3 service-card photos have `alt=""`; header logo gets a `<link rel=preload>` ahead of the hero; `seo.spec.ts` runs against the dev server (CSR), the prerendered head is not asserted by any gate; contact pages are the thinnest (≈700 chars); DE home title mixes `&`, `–`, `|`.

**A11Y** — 45 tab stops across the gallery (track + 2 arrows × 15) before the CTA → roving tabindex or "skip album" link; 30 arrow buttons share two names (each inside its own labelled region, borderline); two carousels share the label "Csilla és András" (`csilla-andras-1/2`) → add venue to the region label; scroll-to-top keeps focus after fading out; focus is not moved to `main` on route change (skill §2); `main` not `inert` while the dialog is open; language-switch links 40 × 40 px in the desktop header, footer links 32 px tall, consent checkbox 22 px (label clickable), logo 44 × 48 on mobile; `--fs-xs` renders 12.6 px at 375 (eyebrows, dt labels, counter, units); hero lead over the brightest pixels 3.7–4.2:1 (average 5.5–7.6:1).

**i18n / copy (R-1 sign-off material)** — DE mixes `du` (4 strings: form errors, home CTA, privacy meta) with `ihr` (~40); HU alternates singular and plural address site-wide ("Álmaid … figyelnetek", "Foglaljátok le … hívj fel") → decide one voice; EN "1 pcs" (no `_one` plural) → add `pieces_one/_other` (mirror in all locales); hardcoded `aria-label="Social"`, English curly quotes around testimonials in all locales, honeypot label "Website", HU-only noscript in formal register; EN "Zala county" lowercase ×2, "I was completely on fire", "humble work", "costs running away" read as literal translations; rental sizes with decimal commas on EN ("2,8 m"); owner name order HU vs Western in DE/EN copy; DE `areaServed`/footer list AT regions only while the tagline says "…und Westungarn" (assumed deliberate); switch drops the `#album` hash; 5 dead keys (`common.instagram/facebook/readMore/openInMaps`, `rental.labels.available`); venue separator " — " vs "–" elsewhere; units without NBSP in rental notes; "About: …" dt label reuse on the style fact; HU-only mail subject (fine, optionally append locale); emoji in rental step 2 (owner choice).

**UI / usability** — hero eyebrow pill wraps and hyphenates at 320 ("ZALA ME-GYE"); hero secondary CTA reads as plain text; album heading separator orphaned at line end at 375; consent "*" wraps alone; contact-card tel/mailto look like static text; rental step 2 phone number is plain text while the same number is a link elsewhere; rental spec grid differs when a card has no size; footer address wraps "53." alone; fast flick skips several slides (`scroll-snap-stop: always`); scroll-to-top button sits over the carousel "next" arrow at 375; double deep-link offset (`scroll-padding-top` + `scroll-margin-top` both 88 px → heading 137 px below header); first album's cover (portrait) loses the top of the arrangement in the 3:2 crop; back/forward scroll restore races `Layout`'s scroll-to-top; `/DE/kontakt/` → HU 404; phone field accepts any string; error banner below the fold after a failed mobile submit, not focused/scrolled; six simultaneous `role=alert`s on empty submit; form lacks an accessible name; date input has no `min`.

## What passed cleanly

Zero CLS and zero horizontal overflow at every width; all images alt/width/height, ≤ 200 KB, lazy except the preloaded LCP; skip link first and functional; 3 px gold focus ring on every stop (except the clipped track); carousel keyboard/touch/live-region behaviour, constant box size, one-slide swipe, arrows always visible and topmost; mobile menu trap, scroll lock (now class-based and breakpoint-scoped), return focus; all form validation, ARIA wiring, honeypot hidden from the a11y tree, config-missing error with mailto fallback, values retained, no fake success; tel/mailto well-formed; active nav state; localized 404s; language switch keeps the page and remembers `fv-lang`; toast only for de-*/en-* on other-locale pages, text in the target language, dismiss persists; HUF formatting with NNBSP/NBSP; privacy date per locale; no hydration console errors on any route; identical rendering in chromium, webkit and firefox (fonts, backdrop-filter, aspect-ratio, scroll-snap).

## Owner decisions needed

1. Address voice in HU (ti vs te) and DE (ihr vs du) — one choice, then align copy (R-1).
2. Keep the gold "01/02/03" numerals decorative (accept the axe flag) or recolor.
3. Hyphenation policy: body text only on mobile, never headings (recommended).
4. Portrait photos in the 3:2 carousel: accept centre crop, or landscape covers for album 1 and per-asset focal point.
5. Emoji in rental step 2.

## Honest critique

Two of the thirteen majors are regressions from this session's own work: the global safety layer (M1) silently undid the container width on every page, and the always-visible toast's z-index (M9) was never tested against the mobile menu. The always-glass header fix also introduced a `backdrop-filter` containing-block bug that trapped the menu panel; it was caught and fixed within the session, but it shows that visual verification at one width is not a gate. The unit/E2E suite is green through all of this because none of these are asserted: no test checks container width, line length, toast stacking, or the prerendered head. The Phase 3 gates (axe on every route, Lighthouse, prerendered-head assertions) should land as tests before the fixes, so they stay fixed.
