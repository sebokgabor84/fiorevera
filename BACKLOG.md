# Fiore Vera — Project Backlog

> Single source of truth for open, in-progress, and completed work items.
> Schema: `- [STATUS] **[CATEGORY]** Description — \`reference\` _(added: YYYY-MM-DD)_`

---

## 🟢 Open / Next Up

- [/] **[BUILD]** Execute `MASTER-PLAN.md` phases 0–4 (frozen scope, 34 items) — Phase 0.1/0.2/0.4, Phase 1 and the Phase 2 pages are built on `feature/site-build`; open: 1.3 cover picks, 2.3/2.4/2.10 sign-offs + form endpoint, Phase 3–4 — `MASTER-PLAN.md` _(added: 2026-11-09)_
- [x] **[QA]** Visual regression framework: `playwright.visual.config.ts`, `tests/visual/{layout,snapshots}.spec.ts` (107 checks: layout invariants on 10 pages × 8 widths + 25 pixel baselines), `.githooks/pre-commit` (runs on staged UI files) + `.githooks/pre-push` (lint → unit → build → visual), `npm run visual:review`, approval-gated re-baseline `scripts/visual-approve.mjs` with `docs/qa/visual-baselines-log.md` — proven against the header regression — `docs/qa/visual-regression-plan.md` _(added: 2026-11-09)_
- [x] **[UI]** Header wordmark broke per character at ≥ 1280 px after M1 (bar capped at 72rem, quote button no longer fit) — **fixed 2026-11-09:** `.header .bar` max 90rem, logo `flex: 0 0 auto`, brand/tagline `nowrap`; covered by layout invariants + header strips — `src/components/Layout/header.module.css` _(added: 2026-11-09)_
- [x] **[UX]** About/Contact: sticky image column applied on phones → text scrolled behind the portrait (critical) — **fixed 2026-11-09:** sticky only ≥ 48rem, portrait capped `min(60vh, 32rem)` so the desktop sticky block fits a 768 px viewport; invariant "sticky must fit viewport" — `src/pages/pages.module.css` _(added: 2026-11-09)_
- [x] **[UI]** Language toast on phones left dead space right of the dismiss button — **fixed 2026-11-09:** action row fills its line, CTA grows, × flush right — `src/components/Layout/language-toast.module.css` _(added: 2026-11-09)_
- [x] **[HARNESS]** MASTER-PLAN 0.3 skill reshapes done: all 11 skills describe this repo (CLAUDE.md reshape status updated) — `.agent/skills/` _(added: 2026-11-09)_
- [ ] **[QA]** Visual gate follow-ups: axe in the visual run, DE/EN inner-page baselines after copy sign-off, Linux baseline set for CI, Git LFS if the 9 MB baseline set churns — `docs/qa/visual-regression-plan.md#next-steps-backlog` _(added: 2026-11-09)_
- [ ] **[DOCS]** `scripts/lockscreen/designs.ts` header comment calls ink-editorial "the shipped final" while linen-classic is the confirmed final — fix the comment — `scripts/lockscreen/designs.ts` _(added: 2026-11-09)_
- [ ] **[UI]** Services step cards and privacy paragraphs run ~120 characters per line at ≥ 1280 (M1 brought them down from 185); apply `.prose` / `--prose-max` to text-only sections — `src/pages/pages.module.css` _(added: 2026-11-09)_
- [ ] **[CONTENT]** Vera picks the 15 album covers (`coverIndex` in `src/data/albums.ts`; first pass chosen from the contact sheet) and signs off HU/DE/EN copy per page — `src/i18n/locales/*.json` _(added: 2026-11-09)_
- [ ] **[CONTENT]** Confirm the Hannersberg venue label (legacy says only "Ausztria – Hannersberg"; no town/region added) and the English rendering of "Esküvő Classic Magazin fotózás" — `src/data/albums.ts` _(added: 2026-11-09)_
- [ ] **[FORM]** Create the Web3Forms/Formspree endpoint for info.fiorevera@gmail.com, set `VITE_FORM_ENDPOINT` locally + on Vercel, send one real test submission — `src/lib/submitInquiry.ts` _(added: 2026-11-09)_
- [/] **[QA]** Playwright on firefox, webkit and Mobile Chrome now runs green (260 passed); axe still to be added to every route as a gate (MASTER-PLAN 3.1) — `tests/e2e/`, `@axe-core/playwright` installed _(added: 2026-11-09)_
- [/] **[QA]** Full QA session 2026-11-09: 0 blockers, 13 majors (all 13 fixed 2026-11-09, see below), ~55 minors still open; report + owner decisions — `docs/qa/2026-11-09-qa-session.md` _(added: 2026-11-09)_
- [ ] **[PERF]** Mobile LCP 4.2–4.7 s in Lighthouse is bandwidth-bound: 4 font preloads (~200 KB) + the JS bundle compete with the hero on slow 4G — subset Cormorant/Inter to HU+DE+EN glyphs, preload only the heading face, consider inlining critical CSS — `index.html`, `src/styles/fonts.css` _(added: 2026-11-09)_
- [ ] **[LAUNCH]** Verify on the first Vercel preview that an unknown URL returns HTTP 404 with `dist/404.html` and that `/de/<unknown>/` renders the DE not-found page (local emulation only so far) — `vercel.json`, `scripts/prerender.ts` _(added: 2026-11-09)_
- [ ] **[UX]** Bottom-anchored language toast covers the lower ~100 px on phones until dismissed (one-time; page end stays reachable). Revisit if Vera finds it intrusive: in-flow bar (costs CLS) or auto-hide on first scroll — `src/components/Layout/LanguageToast.tsx` _(added: 2026-11-09)_
- [x] **[UI]** M1 · `.container` max-width is overridden by the safety layer (`body, main, section, .container { max-width: 100% }`) → 120–185 cpl at ≥1280 and a 1840×1227 carousel at 1920 — **fixed 2026-11-09:** container capped via `min(100%, var(--content-max))`, safety layer no longer lists `.container` (1152 px at 1920) — `src/styles/global.css` _(added: 2026-11-09)_
- [x] **[SEO]** M2 · Soft 404: catch-all rewrites to `/404.html` answer 200 on Vercel; use native 404 per locale folder (verify on the Vercel preview) — **fixed 2026-11-09:** catch-all rewrites removed; single empty-root `dist/404.html` (noindex, no canonical) that the client renders per locale — verified with a static-host emulation (HTTP 404, `lang=de`, DE title/h1) — `vercel.json` _(added: 2026-11-09)_
- [x] **[SEO]** M3 · LocalBusiness JSON-LD `url`/`description` vary per page under one `@id`; also drop `inLanguage`, add `priceRange`/`geo`/`Florist`, Product/Offer on rental, `lastmod` in sitemap — **fixed 2026-11-09:** `url` = locale home, stable description, `@type` `["Florist","LocalBusiness"]`, `inLanguage` dropped; unit test asserts it — `src/components/Seo/SeoHead.tsx`, `scripts/generate-sitemap.ts` _(added: 2026-11-09)_
- [x] **[I18N]** M4 · HU skip link + `<noscript>` (second h1) on DE/EN pages → localize in prerender — **fixed 2026-11-09:** skip link rendered by `Layout` from `common.skipToContent`; noscript paragraph localized by `prerender.ts` (`data-noscript`) — `index.html`, `scripts/prerender.ts` _(added: 2026-11-09)_
- [x] **[I18N]** M5 · Album names keep the HU "és" on DE/EN (h2, alt, aria-label, JSON-LD ×13) → partner pair + `gallery.and` key — **fixed 2026-11-09:** `albums.ts` stores `partners: [a, b]` (Zod tuple, refine vs `titleKey`); `albumTitle` joins with `gallery.and` → "Klaudia und Thomas" on DE (23 occurrences verified) — `src/data/albums.ts`, `src/lib/albums.ts` _(added: 2026-11-09)_
- [x] **[BUILD]** M6 · `new Date().getFullYear()` in Footer render violates D-18 → build-time constant — **fixed 2026-11-09:** `__BUILD_YEAR__` injected by Vite `define`, declared in `src/vite-env.d.ts` — `src/components/Layout/Footer.tsx` _(added: 2026-11-09)_
- [x] **[A11Y]** M7 · Home reason-card numerals gold-on-white 2.1:1 (axe/Lighthouse); M8 · label-in-name mismatch on logo link and language switch (WCAG 2.5.3) — **fixed 2026-11-09:** numerals use `--color-sage-deep` (5.2:1); logo link has no aria-label (name = visible text); switch labels "HU – Magyar" / "DE – Deutsch (aktuelle Sprache)"; Lighthouse a11y 100 on home — `src/components/Home/home.module.css`, `src/components/Layout/{Header,LanguageSwitch}.tsx` _(added: 2026-11-09)_
- [x] **[UI]** M9 · Language toast covers the H1 on mobile and the open mobile menu (z 120 vs 99) → in-flow bar or hide while `body.menu-open` — **fixed 2026-11-09:** toast bottom-anchored, hidden while `body.menu-open`, `body.toast-visible` reserves 7rem so the page end stays reachable; gallery/contact specs pre-dismiss it (locale.spec still covers it) — `src/components/Layout/LanguageToast.tsx` _(added: 2026-11-09)_
- [x] **[A11Y]** M10 · Mobile menu Escape only works with focus inside the panel → document-level listener; M11 · carousel track focus ring clipped by `overflow:hidden` → `outline-offset:-3px` — **fixed 2026-11-09:** document-level Escape listener while open (verified from the toggle); `.track:focus-visible { outline-offset: -4px }` — `src/components/Layout/Header.tsx`, `src/components/Gallery/gallery.module.css` _(added: 2026-11-09)_
- [x] **[UI]** M12 · 768 px three-column reason cards hyphenate 6–8× per card; global `hyphens:auto` hits desktop text and headings → 1 column until 64rem, hyphens on mobile body text only — **fixed 2026-11-09:** `.reasons` three-up only ≥ 64rem; `hyphens: auto` only on p/li/figcaption/blockquote ≤ 48rem — `src/components/Home/home.module.css`, `src/styles/global.css` _(added: 2026-11-09)_
- [x] **[PERF]** M13 · Mobile LCP 4.2–4.7 s: hero/first slide pick the 1920 px variant on phones → add ~1200 px variant + tighter `sizes` — **fixed 2026-11-09:** 1280 px tier (`-w1280`, `srcMedium`, 181 files / 20 MB) in `optimize-images.js` + `Picture` srcset; lab LCP unchanged (4.3 s) because Lighthouse's Moto G DPR 1.75 already picked the 800 px variant — the remaining lever is font subsetting / fewer preloads (new item below) — `scripts/optimize-images.js`, `src/components/Common/Picture.tsx` _(added: 2026-11-09)_
- [ ] **[CONTENT]** Owner decisions from the QA session: HU ti/te and DE ihr/du voice, gold numerals, hyphenation policy, portrait crop, emoji in rental step — `docs/qa/2026-11-09-qa-session.md#owner-decisions-needed` _(added: 2026-11-09)_
- [x] **[DESIGN]** Carousel: D-6 asks for all album images in the DOM, 2.8 for slides mounted only when active — **resolved 2026-11-09:** owner dropped the cover/hover swap; every album is an always-rendered carousel with all images in the DOM (lazy-loaded), arrows always visible — `src/components/Gallery/AlbumSection.tsx` _(added: 2026-11-09)_
- [x] **[A11Y]** Header over the photo hero failed contrast (worst case 1.1:1 vs 4.5:1) — **fixed 2026-11-09:** header always carries the frosted-linen glass surface; scroll only adds hairline + shadow — `src/components/Layout/header.module.css` _(added: 2026-11-09)_
- [ ] **[SEO]** Per-album routes (`/munkaim/<slug>/`) for venue-level local SEO, if venue searches matter — `docs/PRD.md#D-6` _(added: 2026-11-09; **declined by owner 2026-11-09** — revisit only with Search Console evidence)_
- [ ] **[ASSETS]** Replace the legacy image set with new photography (owner-planned; drop originals into `assets-src/<slot>/`, re-run `npm run optimize:assets`, re-pick covers) — `docs/PRD.md#D-5` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Re-enable the Flower Garden page (HU `/viragoskert/`, DE `/de/blumengarten/`, EN `/en/flower-garden/`) from the archived copy when the garden returns; revert the two 301s — `references/legacy/`, `docs/PRD.md#D-16` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Instagram feed embed on the homepage (needs token + consent review) — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Blog / seasonal updates (Markdown, 3 locales) — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Approximate EUR prices next to HUF on DE/EN rental page — `docs/PRD.md#D-8` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Booking calendar / availability check for rental items — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Newsletter signup — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[HARNESS]** Wire `to-prd` to GitHub Issues once a tracker exists (PRD currently local markdown) — `.agent/skills/to-prd/SKILL.md` _(added: 2026-11-09)_
- [ ] **[ASSETS]** Mac wallpaper via `desktop-background-generator` (parallel track, independent of the site build) — `.agent/skills/desktop-background-generator/SKILL.md` _(added: 2026-11-09)_
- [ ] **[LAUNCH]** Confirm who holds the `fiorevera.hu` registrar / DNS login before cutover — `docs/PRD.md#R-7` _(added: 2026-11-09)_

---

## 📦 Completed

- [x] **[TOOLING]** `scripts/archive-legacy.ts` — Webnode HU+DE pages as Markdown + raw HTML, 15 albums / 169 gallery images + 24 page images, Zod-validated `manifest.json`, `--seed-assets` fills `assets-src/` — `MASTER-PLAN.md#0.1` _(completed: 2026-11-09)_
- [x] **[TOOLING]** `scripts/optimize-images.js` — sharp pipeline to webp ≤ 200 KB (1920 + 800 px variants) + generated `src/data/generated/imageMeta.ts` — `MASTER-PLAN.md#0.2` _(completed: 2026-11-09)_
- [x] **[TOOLING]** `scripts/validate-i18n.ts` — HU/DE/EN key-parity gate (+ no empty / untranslated strings) run by `npm test` — `MASTER-PLAN.md#1.4` _(completed: 2026-11-09)_
- [x] **[TOOLING]** `scripts/prerender.ts` + `scripts/generate-sitemap.ts` — static HTML per route (21 + 3 localized 404s), sitemap with hreflang alternates — `MASTER-PLAN.md#1.8/1.9` _(completed: 2026-11-09)_
- [x] **[QA]** Exclude `.claude/**`, `references/**`, `assets-src/**` from Vitest — `vite.config.ts` _(completed: 2026-11-09)_

- [x] **[PRD]** Draft PRD via `/grill-me` session to freeze MASTER-PLAN.md — `docs/PRD.md`, `MASTER-PLAN.md` _(completed: 2026-11-09)_
- [x] **[ASSETS]** Lockscreen design competition: linen-classic design confirmed as final; final + Instagram edition (`instagram.com/fioreveradekor`) now generated by `npm run lockscreen`, three alternates by `npm run lockscreen:variants` — `scripts/lockscreen/designs.ts` _(completed: 2026-11-09)_
- [x] **[ASSETS]** Make lockscreen pipeline reproducible from repo-local inputs only (keyed watercolour wreath + photographed gold frames, build-time QR, no absolute paths) — `scripts/generate-lockscreen.ts` _(completed: 2026-11-08)_
- [x] **[ASSETS]** Generate iPhone QR Lockscreen wallpaper for `fiorevera.hu` — `public/assets/lockscreen/fiore-vera-lockscreen-final.png` _(completed: 2026-10-10)_
- [x] **[DESIGN]** Reshape `design-system-expert` skill for floral/event decoration domain — `.agent/skills/design-system-expert/SKILL.md` _(completed: 2026-09-26)_
- [x] **[HARNESS]** Consolidate `AGENT.md` into `AGENTS.md` per Vibe Coding standards — `AGENTS.md` _(completed: 2026-09-26)_
- [x] **[HARNESS]** Create `.agent/hooks.json` for session-start boot injection — `.agent/hooks.json` _(completed: 2026-09-26)_
- [x] **[TYPE-SAFETY]** Strict TypeScript skill registry & automated Vitest drift gate — `src/types/skills.ts` & `tests/unit/skills.test.ts` _(completed: 2026-09-26)_
- [x] **[LINT-GATE]** Enforce AGENT.md deletion and reference cleanliness test gate — `tests/unit/skills.test.ts` _(completed: 2026-09-26)_
- [x] **[SKILLS]** Update `accessibility-expert` with skip-links and landmark roles — `.agent/skills/accessibility-expert/SKILL.md` _(completed: 2026-09-26)_
- [x] **[SKILLS]** Update `skill-creator` with update/reshape & cross-project sync — `.agent/skills/skill-creator/SKILL.md` _(completed: 2026-09-26)_
- [x] **[SKILLS]** Create `goodbye` session-close ritual skill — `.agent/skills/goodbye/SKILL.md` _(completed: 2026-09-26)_
- [x] **[HANDOVER]** Create `.agent/last-session-handover.md` context recovery checkpoint — `.agent/last-session-handover.md` _(completed: 2026-09-26)_
