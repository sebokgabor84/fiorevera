# PR title

feat(site): first build pass — HU/DE/EN SPA with prerender, data pipeline and e2e suite

# PR body

## What changed

First build pass of the Fiore Vera site on top of the merged `main` (lockscreen pipeline + PRD + MASTER-PLAN). Implements MASTER-PLAN Phase 0–2:

- **0.1 Legacy archive** — `scripts/archive-legacy.ts` saves every HU/DE Webnode page as Markdown + raw HTML under `references/legacy/` with a Zod-validated `manifest.json`. Images and raw HTML are git-ignored (~155 MB each); regenerate with `npm run archive:legacy -- --seed-assets`.
- **0.2 Image pipeline** — `scripts/optimize-images.js` derives ≤200 KB webp variants (1920/800 px) into `public/assets/` and generates `src/data/generated/imageMeta.ts`. Data files reference slots/album slugs only (PRD D-5).
- **Phase 1** — design tokens, self-hosted Cormorant Garamond + Inter, locale router (HU root, `/de/`, `/en/`) in `src/data/routes.ts`, one pre-initialised i18next instance per locale, i18n parity gate, header + mobile menu, DE/EN suggestion toast, footer, `SeoHead` (hreflang, OG, LocalBusiness JSON-LD), sitemap, `vercel.json` redirects/headers, SSG prerender of 21 routes + 3 localized 404s.
- **Phase 2** — Home, Services, Gallery (in-place carousel), Rental (7 items incl. mirror deposit), About, Contact (validated inquiry form, honeypot, `VITE_FORM_ENDPOINT`), Privacy and 404 in all three locales.
- **Tests** — 54 Vitest unit tests; Playwright specs for navigation, locale, gallery, rental, contact, SEO, vitals across chromium / firefox / webkit / Mobile Chrome.
- **Docs** — MASTER-PLAN checkboxes, BACKLOG, README, AGENTS page map, CLAUDE.md, session handover.

## Why

Replaces the Webnode legacy site with a prerendered, hydration-safe SPA that keeps the legacy HU/DE URLs and photography, per the frozen MASTER-PLAN.

## Verification

| Gate | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm test -- --run` | 54 passed |
| `npm run test:e2e` (4 browsers) | 259 passed, 16 skipped, 0 failed |
| `npm run build` | 24 pages prerendered, hydration clean in preview |
| Visual check | desktop + 375 px: home, gallery, rental, services, contact, 404 |

Skipped e2e tests are the contact success path (needs `VITE_FORM_ENDPOINT`) and viewport-specific tests.

## Decisions a reviewer should know

- Covers are a provisional first pass; Vera picks the final 15 (`coverIndex` in `src/data/albums.ts`, item 1.3).
- Hero uses the pier ceremony photo from the Orsi & Anti album.
- Carousel mounts slides only for the active album (MASTER-PLAN 2.8) while every image is listed in the ImageGallery JSON-LD. Logged in BACKLOG against PRD D-6.
- An unverifiable founding-year fact was removed rather than guessed.
- Playwright browser builds were installed locally (~300 MB cache), not committed.

## Still open before launch

- 1.3 cover picks, 2.3/2.4 copy sign-off, 2.10 real form endpoint
- 0.3 skill reshapes, Phase 3 quality gates (axe, Lighthouse), Phase 4 Vercel + cutover

## Reviewer checklist

- [ ] `npm install && npm run dev` — all three locales load; language switch keeps the same page
- [ ] Click through every page in HU and DE; compare copy with the legacy site
- [ ] Gallery: open by click and keyboard, arrows step, Escape closes, focus returns without reopening
- [ ] Contact form: empty, bad email, valid data; without endpoint shows config-missing state, not fake success
- [ ] Rental: 7 items, prices and mirror deposit match current quotes
- [ ] 375 px: header menu, hero legibility, no horizontal scroll
- [ ] `npm run build`, open `dist/de/index.html` — renders before JS
- [ ] `npm run test:e2e` locally — expect 16 skipped
- [ ] `vercel.json` redirects cover both legacy garden URLs

🤖 Generated with [Claude Code](https://claude.com/claude-code)
