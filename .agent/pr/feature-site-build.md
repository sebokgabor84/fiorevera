# PR title

feat(site): Fiore Vera HU/DE/EN site — build, QA session fixes, visual regression gate

# PR body

## What changed

Three commits on top of `main` (lockscreen pipeline + PRD + MASTER-PLAN):

1. **`1ca5d84` first build pass** — MASTER-PLAN Phase 0–2: legacy Webnode archive (`scripts/archive-legacy.ts` → `references/legacy/`, images git-ignored), image pipeline (`scripts/optimize-images.js` → WebP tiers + generated manifest), locale router (HU root, `/de/`, `/en/`, legacy slugs kept), one i18next instance per locale, Zod data contracts, tokens + self-hosted fonts, header/menu/toast/footer, `SeoHead` (hreflang, OG, JSON-LD), sitemap, SSG prerender, `vercel.json`, all 8 pages in 3 locales, 54 unit + Playwright specs.
2. **`ff65def` owner feedback round** — always-on glass header (contrast over the hero was 1.1:1), gallery as an always-rendered carousel (cover as slide 1, arrows on top, 3:2 cover-fit, slides mount near the viewport), class-based menu scroll lock, rental copy, full QA session report (`docs/qa/2026-11-09-qa-session.md`: 0 blockers, 13 majors, ~55 minors).
3. **`697cc81` QA fixes + visual gate + skills** — all 13 majors fixed (container width, Vercel-native 404 with a single `dist/404.html`, stable LocalBusiness entity, localized skip link/noscript, album `partners` + locale joiner, build-time year, sage numerals, accessible names, bottom toast, document-level Escape, inset focus ring, 64rem reason cards + body-only hyphenation, 1280 px image tier); second-round fixes (header bar to 90rem so the wordmark never wraps, sticky column only ≥ 48rem, toast action row); visual regression framework; all 11 agent skills rewritten for this repo.

## Why

Replaces the Webnode legacy site with a prerendered, hydration-safe SPA that keeps every legacy HU/DE URL and photo, per the frozen MASTER-PLAN. The QA session and the two review rounds hardened it before any deploy.

## Verification (final state of the branch)

| Gate | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `tsc -b` | clean |
| `npm test -- --run` | 54 passed (7 files) |
| `npm run test:e2e` (chromium, firefox, webkit, Mobile Chrome) | 260 passed, 16 skipped (contact success path needs `VITE_FORM_ENDPOINT`; device-specific tests) |
| `npm run build` | 21 pages + `404.html` prerendered |
| `npm run test:visual` (new) | 107 passed: 82 layout invariants (10 pages × 8 widths, overlays, menu) + 25 pixel baselines against the production build |
| Lighthouse (production build, mobile) | SEO 100, best practices 100, accessibility 100; performance 83–92 mobile, 99 desktop |
| Atlas web-qa modules | UI: zero CLS, no overflow/clipping/broken images on 48 loads; axe: 0 violations after fixes |

Hooks: `.githooks/pre-commit` (build + visual when UI files are staged) and `.githooks/pre-push` (lint → unit → build → visual) ran green on the last commit and push. Install locally with `npm install` (runs `npm run prepare`).

## Decisions a reviewer should know

- Baselines (`tests/visual/__screenshots__/`, 25 PNGs, 9.2 MB) were generated after the reviewed fixes but not yet eyeballed one by one by the owner; see `docs/qa/visual-baselines-log.md`. Re-baselining requires `npm run test:visual:update -- --approved-by="<name>"`.
- Vercel 404: catch-all rewrites removed; `dist/404.html` is an empty-root shell with noindex that the client renders per locale. Verified with a static-host emulation locally; needs a check on the first Vercel preview.
- Portrait photos (73 of 170) are centre-cropped in the 3:2 carousel; Vera's cover picks (item 1.3) still pending.
- Mobile LCP in Lighthouse (4.2–4.7 s) is bandwidth-bound by four font preloads + JS; follow-up is font subsetting (BACKLOG).
- Open owner decisions: HU/DE address voice, hyphenation policy, emoji in rental copy, portrait crops (report § "Owner decisions needed").

## Reviewer checklist

- [ ] `npm install && npm run dev` — three locales load; language switch keeps the page
- [ ] Click through every page in HU and DE; compare copy with the legacy site
- [ ] Header at 1120 / 1280 / 1440 / 1920 px: wordmark on one line, quote button visible from 1280
- [ ] About and Contact at 375 px: image scrolls with the text (not sticky)
- [ ] Gallery: arrows always visible and on top; arrows and arrow keys move slides; Escape not needed
- [ ] Contact form: empty, bad email, valid data; without endpoint shows the config-missing error, never a fake success
- [ ] Mobile menu: Escape closes it even with focus on the toggle; toast hidden while open
- [ ] `npm run build && npm run test:visual` — 107 green; open `playwright-report-visual/` once to see the baselines
- [ ] `npm run test:e2e` locally — expect 16 skipped
- [ ] `vercel.json`: two garden 301s present, no rewrites, headers intact

🤖 Generated with [Claude Code](https://claude.com/claude-code)
