# Web vitals — runs, findings, remaining levers

Owned by `seo-expert` §6. Targets: mobile Performance / Accessibility / SEO ≥ 90, LCP < 2.5 s, CLS < 0.1 (PRD Goal 3, MASTER-PLAN 3.3).

## Runs

| Date | What was measured | Result |
|---|---|---|
| 2026-11-09 | Preview build (`vite preview`), Lighthouse 12.8 | SEO 100, Best Practices 100, Accessibility 100 (after M7/M8), Performance desktop 99, mobile 82–92 (home median 85; LCP 4.2–4.7 s) |
| 2026-11-16 | Live home page, PageSpeed mobile (Lighthouse 13.6.0, Moto G Power, slow 4G), before the image fix `2f97d84` | Performance 90 · Accessibility 100 · Best Practices 100 · SEO 100; FCP 0.9 s · LCP 3.6 s · TBT 30 ms · CLS 0 · SI 2.2 s. Diagnostics: 56 KiB unused JS, 2 long tasks, 100 ms render-blocking. Lab data only — no field (CrUX) data, the domain went live the same day |

Add a row per run: date, URL, tool and version, device, scores, metrics, commit under test. Owed: the re-run after `2f97d84` reached production. A `docs/qa/web-vitals-log.md` as the permanent home of these rows is proposed, not created.

## Findings (do not re-derive)

- **LCP breakdown of the hero (2026-11-16):** TTFB 0 ms · resource load delay 150 ms · resource load 410 ms · **element render delay 800 ms**. The image arrives early; the paint waits for the four font preloads (~200 KB, `index.html`) and the JS bundle.
- **Lighthouse's image-savings estimate assumes about q60.** PageSpeed claimed 108 KiB; `2f97d84` delivers about 60 KiB on the home page (hero 23 KB + card 22 KB + logo 10 KB) at the chosen ceilings.
- **Tier picking:** Lighthouse's Moto G (DPR 1.75) takes the 800w tier at `100vw`; a DPR-2 desktop takes the full 1920 tier for a `sizes="100vw"` hero; the 1280 tier serves DPR-1 screens 1280 px wide and DPR 2–3 phones. Lab LCP therefore never reflects the 1280 tier.
- **Probe before changing a quality ceiling:** encode the hero with sharp at q82 / 76 / 70 / 64 and compare sizes and looks (800 px tier: 80.2 / 63.8 / 57.4 / 53.8 KB). From a scratchpad script import sharp by absolute path from the repo's `node_modules`.
- **Re-encodes do not trip the pixel baselines** (q82 → q70 stayed inside `maxDiffPixelRatio 0.001` / 150 px): run `npm run test:visual`, do not re-baseline pre-emptively.
- **Reading PageSpeed:** separate lab from field data, open the LCP breakdown, and expand each audit before reading the page text — the per-image rows are collapsed by default.

## Remaining levers (all open; none is built)

| # | Lever | Attacks | Files | Acceptance | Owner decision? |
|---|---|---|---|---|---|
| 1 | Subset Cormorant/Inter to HU/DE/EN glyphs, preload only the heading face | 800 ms render delay | `index.html`, `src/styles/fonts.css`, `public/fonts/*` | mobile LCP < 2.5 s, no FOIT, ő ű ß ä ö ü render | no (`BACKLOG.md` `[PERF]`) |
| 2 | `<link rel="preload" as="image" imagesrcset imagesizes>` for the hero in the prerendered head (`Picture` already sets `fetchpriority="high"`) | 150 ms load delay | `scripts/prerender.ts` or `SeoHead.tsx` | breakdown "resource load delay" ≈ 0 | no |
| 3 | Inline critical CSS for header + hero | 100 ms render-blocking request | `scripts/prerender.ts` | no render-blocking audit on home | no |
| 4 | Route-level `React.lazy`, or inline SVGs instead of `react-icons` | 56 KiB unused JS | `src/App.tsx`, footer/contact icons | unused-JS audit < 20 KiB | no |
| 5 | Tighten the hero's `sizes` on desktop | DPR-2 desktops download the 1920 tier | `src/components/Home/HomeHero.tsx` | verified `currentSrc` at 1280 / 1440 / 1920 | no |
| 6 | Full tier ceiling 82 → 76 | ~12 % of the full tier | `scripts/optimize-images.js` | visual suite green, owner looks at the hero at 1920 | yes (taste) |
| 7 | A cleaner hero source photo | hero weight at every tier | `assets-src/hero/` | — | yes (Vera's cover pick, MASTER-PLAN 1.3) |
| 8 | Field data check in Search Console → Core Web Vitals | — | — | about four weeks after 2026-11-16 | no |
