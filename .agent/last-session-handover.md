# 🌸 Fiore Vera — Session Handover Report
> **Last Updated:** 2026-11-09 · first build pass (iteration 3) on `feature/site-build` — **uncommitted, awaiting GO**

---

## 📊 Where this session stopped

- `main` now holds the lockscreen pipeline **and** the confirmed PRD + frozen `MASTER-PLAN.md` (merged by the owner). `feature/site-build` was cut from that `main`.
- Built on `feature/site-build` (all local, nothing committed or pushed):
  - **0.1** `scripts/archive-legacy.ts` → `references/legacy/` (HU+DE Markdown + raw HTML, `manifest.json`: 15 albums / 169 images, 24 page images, 4 testimonials, contact). Images + raw HTML + `assets-src/` are git-ignored (155 MB / 158 MB).
  - **0.2** `scripts/optimize-images.js` → 363 webp files ≤ 200 KB in `public/assets/{hero,about,brand,gallery/<slug>,rental/<id>}` + generated `src/data/generated/imageMeta.ts`.
  - **0.4** AGENTS.md page map updated (Privacy row, `/en/portfolio/`, 301 rows).
  - **Phase 1** complete: tokens/global CSS/self-hosted fonts, locale router (`src/data/routes.ts`), per-locale i18next instances, i18n parity gate, header + mobile menu, language toast, footer, `SeoHead` (plain JSX, hoisted), `scripts/prerender.ts` + `scripts/generate-sitemap.ts`, `vercel.json`.
  - **Phase 2** pages all render in HU/DE/EN with legacy copy (typos fixed, garden → one "paused" paragraph on About): Home, Services, Gallery (album carousel), Rental (7 items), About, Contact (+ form), Privacy, localized 404.
  - Tests: 54 Vitest tests green; Playwright specs written for navigation, locale/toast, gallery, rental, contact, SEO, vitals.
- Verified: `npm run lint` 0/0, `npm test -- --run` 54/54, `npm run build` prerenders 24 pages, visual check in the browser at desktop + 375 px.

## 🎯 Next unblocked actions

1. Owner GO → commit + push `feature/site-build`, open the MR with the review brief.
2. Vera: pick the 15 covers (`coverIndex` in `src/data/albums.ts`), sign off HU/DE/EN copy page by page (R-1).
3. Create the form endpoint (Web3Forms/Formspree), set `VITE_FORM_ENDPOINT`, run the contact E2E success path.
4. MASTER-PLAN 0.3 skill reshapes; Phase 3 (axe on every route, Lighthouse, firefox/webkit/Mobile Chrome runs); Phase 4 Vercel.

## 💡 Learnings this session

- Node ESM (Playwright) needs import attributes for JSON — specs read locale JSON via `fs` (`tests/e2e/locales.ts`).
- React 19 emits hoistable `<title>/<meta>/<link>` at the start of `renderToString` output; `scripts/prerender.ts` moves them into `<head>`. `hrefLang` is emitted camel-cased (valid HTML, case-insensitive) — assert case-insensitively.
- `react-hooks/set-state-in-effect` is an error in this ESLint setup: derive state (menu "open for pathname") or set state inside a callback (`requestAnimationFrame`) instead.
- The dev `index.html` keeps the `<!--app-html-->` marker inside `#root`; `entry-client` must check `firstElementChild`, not `hasChildNodes()`, before hydrating.
- `npx <bin>` inside background shells was rewritten by the rtk hook to `npm run <bin>`; call `./node_modules/.bin/<bin>` directly there.
