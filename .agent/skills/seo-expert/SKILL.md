---
name: seo-expert
description: >-
  Technical SEO for the prerendered Fiore Vera site (HU/DE/EN, static HTML per
  route on Vercel): per-route head contract in SeoHead, hreflang + canonical,
  LocalBusiness/ImageGallery JSON-LD, the native-404 rule, sitemap/robots, legacy URL
  preservation and the two permanent redirects, the `vercel.json` rules, image
  loading, Lighthouse/PageSpeed web vitals and Search Console. Use when touching
  `src/data/routes.ts`, `SeoHead.tsx`, `scripts/prerender.ts`,
  `scripts/generate-sitemap.ts`, `vercel.json`, meta copy in `meta.*` keys, or
  when auditing LCP/CLS/SEO scores or the live site's indexing.
---

# SEO Expert — Fiore Vera

Keeping the legacy rankings is a hard requirement (PRD D-18, Goal 4, US-9). Every route is
prerendered to `dist/<route>/index.html`, so the head must be correct **without JavaScript**.

*(WCAG → `accessibility-expert`. Locale keys and leaks → `i18n-guardian`. Image art direction → `design-system-expert`.)*

## When to use
- Adding or changing a route, slug or redirect (`src/data/routes.ts`, `vercel.json`)
- Editing `src/components/Seo/SeoHead.tsx`, `scripts/prerender.ts`, `scripts/generate-sitemap.ts`, `public/robots.txt`
- Writing or reviewing `meta.<page>.title|description` in `src/i18n/locales/*.json`
- Adding JSON-LD to a page, changing images above the fold, chasing Lighthouse numbers (MASTER-PLAN 3.3, 4.4)

## Architecture facts (read before editing)

| Fact | Where |
|---|---|
| **One route source**: `ROUTES`, `REDIRECTS`, `SITE_URL = https://www.fiorevera.hu`, `allRoutes()` (21 = 7 pages × 3 locales), `alternatesFor(page)` (hu/de/en + `x-default` → HU) | `src/data/routes.ts` |
| HU at root, DE keeps the Webnode slugs (`/de/dienstleistungen/`, `/de/referenzen/`, `/de/verleih/`, `/de/uebermich/`, `/de/kontakt/`, `/de/datenschutz/`), EN is new (`/en/portfolio/`, not "references") | PRD D-3 |
| `SeoHead` is **plain JSX** — React 19 hoists `<title>/<meta>/<link>/<script type=ld+json>` into `<head>`; no `useEffect`, no `document` | `src/components/Seo/SeoHead.tsx` |
| Prerender moves the hoistables into `<head>`, swaps `<html lang>`, localizes `<p data-noscript>`, writes one **empty-root `dist/404.html`** with `noindex` | `scripts/prerender.ts` |
| `trailingSlash: true`, `cleanUrls: false`, no rewrites, two permanent redirects (with and without trailing slash; answered as **308**, §3a), security headers + CSP. Schema keys only (§3a) | `vercel.json` |
| **Live since 2026-11-16** on Vercel (Hobby, owner's written risk acceptance — do not re-litigate), every push to `main` deploys production; canonical host `www`, apex redirects to it. Launch record, DNS values and verification commands | `docs/launch/domain-and-hosting-plan.md` §0a, `docs/launch/legacy-webnode-dns-2026-11-16.md` |
| Service areas per locale feed `areaServed` and the footer (D-11) | `src/data/serviceAreas.ts` |

## 1. Per-route head contract

Exact tag list per page type: `resources/head-contract.md`. Rules:

| Element | Rule | Gate |
|---|---|---|
| `<title>` | from `meta.<page>.title`, **≤ 60 chars**, unique per route, in the page locale | `tests/unit/i18n.test.ts` ("keeps SEO titles ≤ 60…") |
| `meta description` | `meta.<page>.description`, **70–160 chars**, unique | same test (≤ 160); the lower bound is a review check |
| `<html lang>` | the route locale (prerender) + `Layout` effect on client navigation | `navigation.spec.ts` |
| canonical | self-referencing `absoluteUrl(pathFor(page, locale))`; **absent on the 404** | `render.test.tsx`, `seo.spec.ts` |
| hreflang | `alternatesFor(page)`: `hu`, `de`, `en` + `x-default` → the HU URL; every alternate lists the same set → reciprocal by construction | `render.test.tsx`, `seo.spec.ts` |
| robots | `index, follow` on pages, `noindex, follow` on the 404 | `render.test.tsx` (404 cases) |
| OG / Twitter | `og:type=website`, `og:site_name`, `og:title`, `og:description`, `og:url` (= canonical), `og:image` (hero from `IMAGE_META.hero[0]`, absolute), `og:locale` (`hu_HU` / `de_AT` / `en_GB`), `twitter:card=summary_large_image` + title/description/image | `seo.spec.ts` (og:image host) |
| JSON-LD | see §2 | `render.test.tsx` |

Static shell (`index.html`): favicon stack (svg + 32/16 png + apple-touch + `site.webmanifest`), `theme-color #faf7f2`, four self-hosted font preloads, fallback `<title>` that prerender removes. The icon files change only through `npm run favicon` (`favicon-builder`) — never hand-export one; `theme-color` and the manifest colours stay linen by owner decision (2026-11-09). There is no `/favicon.ico` (blind requests for it get a 404; generating one is a proposal, not built).

## 2. Structured data

- **`LocalBusiness` is ONE stable entity on every page**: `@type: ["Florist","LocalBusiness"]`, `@id: https://www.fiorevera.hu/#business`, `url` = the **locale home** (never the current page), `description` = `meta.home.description` (never the page's), address/phone/email from `src/data/contact.ts`, `areaServed` from `serviceAreas[locale]`, `sameAs` Instagram + Facebook, `founder`. No `inLanguage` (not a LocalBusiness property). Asserted for all 21 routes by `render.test.tsx` (`"@type":["Florist","LocalBusiness"]` and `"url":…/<prefix>/`).
- **`ImageGallery`** on the gallery route only: page node + one `hasPart` node per album with `ImageObject`s (`contentUrl`, `width`, `height`, `caption` = templated alt). Built in `src/pages/GalleryPage.tsx`, passed via `SeoHead jsonLd={[...]}`. `render.test.tsx` expects 16 `"@type":"ImageGallery"` on `/munkaim/`.
- Page-specific data goes into a **new node** (`WebPage`, `Product`…), never into the business entity.
- JSON is emitted with `<` escaped as `<`; keep that when adding blocks.

## 3. The 404 rule

- `dist/404.html` has an **empty `#root`**, `noindex, follow`, **no canonical, no og:url, no hreflang**; the client renders `NotFound` in the locale of the requested path (`localeFromPath`), so one head, no duplicates.
- Vercel serves `404.html` natively with **HTTP 404**. **Never add catch-all rewrites** (`/:path*` → `/404.html`): a rewrite answers 200 = soft 404 (QA 2026-11-09 M2). MASTER-PLAN 4.1's "SPA rewrite" wording is superseded by this rule.
- Verified on the Vercel deployment by curl on 2026-11-16 (plan §0a, A2): `curl -s -o /dev/null -w '%{http_code}\n' https://www.fiorevera.hu/nincs-ilyen/` → `404`. The shell is locale-neutral, so **curl sees `lang="hu"` and the HU noscript on `/de/<unknown>/`, a browser sees the DE not-found page** — by design, do not "fix" it. `vite preview` falls back to `index.html` with 200, so it cannot prove the status.

## 3a. Vercel facts (launch 2026-11-16)

| Fact | Rule | Evidence |
|---|---|---|
| Unknown keys in `vercel.json` | **Schema keys only — no `_comment…` pseudo keys.** They pass every local gate and Vercel's validator rejects the import and every preview ("should NOT have additional property `_comment_404`"). Explanations go into `docs/`. | fix `dcd491e`; plan §0a note under A1 |
| `"permanent": true` | Vercel answers **308**, not 301. Google treats both as permanent, so the MASTER-PLAN "301" DoD is met in substance. A literal 301 would need `"statusCode": 301` — open owner decision (recommendation: keep 308, fix the wording). A curl check against the live site expects 308. | `curl -I https://www.fiorevera.hu/viragoskert/` → 308 |
| hreflang in the prerendered HTML | React emits the attribute as `hrefLang="…"`; grep case-insensitively (`grep -io 'hreflang="[a-z-]*"'`). | `dist/de/verleih/index.html` |
| One `sitemap.xml` and one `robots.txt` | They cover all three locales; no per-locale files. | `scripts/generate-sitemap.ts`, `public/robots.txt` |
| Search Console | Domain property `fiorevera.hu`, verified by DNS TXT on 2026-11-16 (the TXT value is in the plan and must move into the Rackhost zone with the domain — add a row, never overwrite the SPF TXT); indexing requested for the three home pages. **Open:** confirm *Sitemaps → Success*; hreflang + index coverage at day 7 and day 30, top-query comparison (MASTER-PLAN 4.4); field Core Web Vitals in about four weeks (no CrUX data yet). | plan §0a A7, §5 |
| Build on Vercel | `npm run build`, output `dist`; the install command is overridden in the dashboard to `npm ci --ignore-scripts` because `prepare` runs `git config core.hooksPath` (reported by the launch session; a dashboard setting, not in the repo — making `prepare` tolerant is a proposal). `VITE_*` values are browser-public and stored as Config, not Secret. | `package.json` (`prepare`), plan §0a |
| DNS, certificates, uptime | Not an SEO task and no skill owns it yet (a `launch-ops` skill is proposed, not created). Until then: values and commands live in the launch plan and the operations runbook; never copy an apex IP or CNAME from a guide (they are per project); Vercel issues one certificate per added hostname. | plan §0a, §3; `docs/operations/runbook.md` |

## 4. Sitemap, robots, legacy URLs

- `public/sitemap.xml` is generated from `allRoutes()` + `alternatesFor()` (`xhtml:link` per locale incl. `x-default`) by `npm run sitemap` (first step of `npm run build`). Never hand-edit. Sitemap = route table: adding a route to `ROUTES` is the only way to get it listed. Open: no `lastmod` (see backlog); `changefreq`/`priority` are ignored by Google.
- `public/robots.txt`: `Allow: /` + `Sitemap: https://www.fiorevera.hu/sitemap.xml`. Keep `/assets/` crawlable (images rank).
- **Legacy URL preservation (US-11)**: every legacy HU and DE slug stays identical. Only two redirects exist — `REDIRECTS` in `routes.ts` mirrored in `vercel.json`: `/viragoskert/` → `/rolunk/`, `/de/blumengarten/` → `/de/uebermich/` (permanent, both with and without trailing slash; revertible per D-16). Cutover check (MASTER-PLAN 4.3), done 2026-11-16: 14 of 14 legacy URLs answer 200, or 308 for the two above; re-run the sweep (commands in plan §0a A6) after the Rackhost transfer.

## 5. Images

`src/components/Common/Picture.tsx` is the only `<img>` path for photos: `srcSet` with three tiers (`srcSmall` 800w, `srcMedium` 1280w, `src` ≤ 1920w), `sizes` (default `100vw` — tighten per slot), explicit `width`/`height` (CLS 0), `loading="lazy"` by default; `priority` → `eager` + `fetchpriority="high"` + `decoding="sync"` for the **LCP image only** (hero, first gallery slide). Alt comes from `albumAlt()` templates (`gallery.albumAlt`), never hand-written per file. Assets are webp ≤ 200 KB (`tests/unit/assets.test.ts`), encoded with per-tier quality ceilings 82 / 76 / 70 (`TIER_QUALITY` in `scripts/optimize-images.js`); the header logo is the one `<img>` outside `Picture` and uses the 240 px brand tier (`Header.tsx`, `sizes="80px"`). Which tier a device picks: Lighthouse's Moto G (DPR 1.75) takes the 800w tier at `100vw`, a DPR-2 desktop takes the full 1920 tier, the 1280 tier serves DPR-1 screens 1280 px wide and DPR 2–3 phones. Open: hero + service-card photos ship `alt=""`; logo preload precedes the hero (QA minors); the hero's `sizes="100vw"` on desktop is untightened.

## 6. Lighthouse and web vitals

Targets (PRD Goal 3, MASTER-PLAN 3.3): mobile Performance / Accessibility / SEO ≥ 90 on every route, LCP < 2.5 s, CLS < 0.1. Latest live run (PageSpeed mobile, 2026-11-16, before the image fix `2f97d84`): 90 / 100 / 100 / 100, **LCP 3.6 s**, CLS 0, lab data only. All runs, the LCP breakdown and the ordered list of remaining levers: `resources/web-vitals.md`.

- **The hero LCP is render-bound, not download-bound** (800 ms element render delay): the four font preloads and the JS bundle delay the paint, so the next lever is font subsetting (`BACKLOG.md` `[PERF]`), not smaller images.
- **Lighthouse's image-savings figure is roughly double the real gain** at an acceptable quality, and its Moto G (DPR 1.75) picks the 800w tier — a change to the 1280 tier never shows in lab LCP.
- **Measure, deploy, re-measure, record**: name tool, device, date and commit; the re-run after `2f97d84` is still owed.

Local runs:

```bash
npm run build && npm run preview                       # http://localhost:4173, prerendered HTML
OUT=/private/tmp/claude-502/-Users-gabor-seboek-Documents-Projects-Private-fiorevera/<session>/scratchpad/lighthouse
npm exec --yes -- lighthouse http://localhost:4173/de/ --output=json --output=html \
  --output-path="$OUT/home-de-mobile" --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo        # mobile = default profile
npm exec --yes -- lighthouse http://localhost:4173/ --preset=desktop --output=json --output-path="$OUT/home-hu-desktop"
```
Run home, gallery, rental, contact in HU + one DE/EN each; rerun a Performance outlier twice before reporting it (TBT noise). Attach reports to the Review Brief.

## 7. Audit checks (atlas-style, run on `dist/` or the preview)

| Check | Command / assertion |
|---|---|
| Soft 404 | §3 curl → `404` (Vercel deployment only) |
| Duplicate head tags | `grep -c '<title>' dist/de/index.html` → 1; `grep -c 'rel="canonical"' dist/de/index.html` → 1; `grep -c 'rel="canonical"' dist/404.html` → 0; `grep -c 'noindex' dist/404.html` → 1 |
| Head without JS | `curl -s http://localhost:4173/en/contact/ \| grep -o '<title>[^<]*'` shows the EN title; same for `grep -io 'hreflang='` and `"LocalBusiness"` |
| hreflang reciprocity | every route's 4 alternates equal `alternatesFor(page)` — unit-tested; re-check only after editing `routes.ts`. In `dist/` grep `-i`: the attribute is spelled `hrefLang` |
| Title/description lengths | `npm test -- --run tests/unit/i18n.test.ts` |
| One `<h1>` per route, lang attribute, HU leaks on DE/EN | `./node_modules/.bin/playwright test tests/e2e/navigation.spec.ts` (the rtk hook rewrites `npx`) |
| Live redirects and 404 | `curl -I https://www.fiorevera.hu/viragoskert/` → 308 to `/rolunk/`; `curl -I https://www.fiorevera.hu/nincs-ilyen/` → 404; after a DNS change verify with `dig @8.8.8.8` / `curl --resolve`, the local cache lies for up to an hour |
| Sitemap = routes | `npm run sitemap && git diff --exit-code public/sitemap.xml` after a route change |

## 8. DoD hooks

`npm run lint` → `npm test -- --run` (`tests/unit/render.test.tsx`: title, canonical, hreflang ×4, Florist/LocalBusiness + stable `url`, localized noindex 404s, ImageGallery count; `tests/unit/i18n.test.ts`: lengths) → `npm run test:e2e` (`tests/e2e/seo.spec.ts`: title/description/canonical/hreflang/x-default/og:image/JSON-LD per route — runs against the **dev server (CSR)**; the prerendered head is covered by `render.test.tsx` and §7, not by e2e) → `npm run build` (sitemap + 21 pages + `404.html`).

## Open SEO backlog (do not re-invent; link, don't add)

| Item | Reference |
|---|---|
| `Product`/`Offer` on the rental page, `priceRange`/`geo` on the business | `BACKLOG.md` `[SEO]` M3 entry; QA minors |
| `BreadcrumbList` | `docs/qa/2026-11-09-qa-session.md` → Minor findings → SEO |
| Sitemap `lastmod` | `BACKLOG.md` `[SEO]` M3 entry |
| `og:image:width/height/alt`, `twitter:image:alt`, `og:locale:alternate`, per-page og:image | QA minors → SEO |
| Home `<h1>` is brand-only ("Fiore Vera"); topic words live in the subtitle | QA minors → SEO (copy sign-off, R-1) |
| Contact pages thinnest (≈ 700 chars) | QA minors → SEO |
| Search Console: sitemap status, hreflang + coverage at day 7 / 30, field Core Web Vitals; legacy Performance export if the old property exists | §3a; MASTER-PLAN 4.4; `BACKLOG.md` `[LAUNCH]` |
| Web-vitals levers (font subsetting first) and the web-vitals log | §6; `BACKLOG.md` `[PERF]` |
| `/favicon.ico`, maskable Android icon | `favicon-builder` (proposals) |

## Sparring Manifesto (push back, then propose)
- **Veto client-only head changes**: anything that sets `document.title`, injects `<meta>`/`<link>` in an effect, or depends on hydration to appear. The head must be in the prerendered HTML.
- **Veto a canonical (or `og:url`/hreflang) on a `noindex` page** — contradictory signals.
- **Veto per-page drift of the `LocalBusiness` entity** (`url`, `description`, `@id`, `@type` varying by route). Add a node instead.
- **Veto routes outside `routes.ts`** — a `<Route>`, sitemap line, redirect or hreflang added by hand elsewhere will desync router, sitemap, prerender and hreflang.
- **Veto hreflang without reciprocity or without `x-default`**, and any alternate whose URL is not in `ROUTES`.
- **Veto catch-all rewrites** in `vercel.json` (soft 404), **any key Vercel's schema does not know** (comments included), and any Lighthouse-degrading asset above the fold without a stated reason.
- **Veto performance claims without a measurement**: name the tool, device, date and commit, and re-measure after the deploy.
- **Veto hardcoded meta copy**: titles/descriptions live in `meta.*` keys in all three locales (hand off to `i18n-guardian`).

## Handshakes
- `i18n-guardian`: `meta.*` copy, `<html lang>`, HU leaks in head/JSON-LD/alt.
- `accessibility-expert`: heading order, skip link, image alt semantics.
- `qa-specialist`: DoD run, Lighthouse report in the Review Brief, Playwright gates; a compression change runs the visual suite but needs no re-baseline.
- `favicon-builder`: owns the icon files; this skill owns the `<link>` set and manifest validity.
- `gdpr-guardian`: CSP hosts in `vercel.json`, Vercel as processor.
