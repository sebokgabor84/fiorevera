# Fiore Vera — Product Requirements Document (PRD)

> **Status:** confirmed by the owner on 2026-11-09 after a `grill-me` interview (13 branches, every one resolved).
> **Frozen into:** [`MASTER-PLAN.md`](../MASTER-PLAN.md) — the numbered build checklist. Every build action traces to a story (`US-n`) or decision (`D-n`) in this document.
> **Emergent ideas:** go to [`BACKLOG.md`](../BACKLOG.md), never into the master plan.

---

## 1. Summary

Replace the legacy Webnode site at [www.fiorevera.hu](https://www.fiorevera.hu) with a fast, multilingual (HU primary / DE / EN) React + TypeScript + Vite single-page site for **Fiore Vera**, Veronika Sebőkné Antalics's wedding decoration, wedding floristry and prop-rental business based in Zalakaros (Zala county, Hungary), serving Zala / Lake Balaton and the Austrian border regions.

The site is a **7-page brochure site**. It must look premium (romantic, rustic-elegant), load fast on a phone, be fully translated in all three locales, rank locally in HU and AT, and turn visitors into quote requests. It is one surface of the brand ecosystem (website + iPhone lockscreen QR + Mac wallpaper); the QR lockscreen already ships (see `BACKLOG.md`).

---

## 2. Legacy baseline (audited 2026-11-08)

| Fact | Finding |
|---|---|
| Platform | **Webnode 2** (not WordPress). Images on `clvaw-cdnwnd.com`. |
| Locales | HU at `/`, DE at `/de/`. **No `/en/`** (404). No `hreflang`. Root auto-redirects non-HU browsers to `/de/`. |
| Pages | 7: Home, Szolgáltatások, Munkáim (gallery), Virágoskert, Kellékbérlés, Rólam (`/rolunk/`), Kapcsolat. |
| Content | 100 % wedding. 3 service pillars. 4 testimonials. Rental catalog of 7 items with HUF prices. |
| Gallery | Per-wedding albums "Couple — Venue". DE page: **15 albums / 169 images**; HU page: 12 albums / 133 images (HU stale). Lightbox JPEGs up to **1920 px** long edge. |
| SEO titles | HU: "… Fiore Vera Virág & Dekoráció - Zala megye". DE: "… Blumen & Deko - Burgenland - Wien - Niederösterreich". |
| Contact | +36-30-865-9108, info.fiorevera@gmail.com, 8749 Zalakaros, Rózsa utca 53., Webnode form (name, phone, email, message), Facebook + Instagram `fioreveradekor`. |
| Bugs (beyond `AGENTS.md` list) | HU gallery stale vs DE; DE rental page missing the mirror item; DE sub-heading "Árajánlat készítés" left in HU; DE Blumengarten H1 "Virágoskert" untranslated; footer year 2021; cookie banner HU-only. |

The full audit note lives in the session-notes folder (`legacy-site-audit-2026-11-08.md`).

---

## 3. Goals & non-goals

**Goals**
1. Every page fully translated in HU, DE, EN — zero partial-i18n leaks (legacy bug class #1, #3, #7).
2. Mobile-first premium feel on the locked design system (linen `#faf7f2`, sage `#7a8b7b`, blush `#e8c5c8`, gold `#d4af37`; Cormorant Garamond / Inter).
3. Lighthouse mobile ≥ 90 in Performance, Accessibility, SEO; LCP < 2.5 s; CLS < 0.1.
4. Local SEO per locale (see D-11) with `hreflang`, unique titles/descriptions, `LocalBusiness` JSON-LD, sitemap.
5. One clear conversion: **request a quote** (form + phone + email + Instagram).
6. Legacy HU and DE URLs keep working unchanged; discontinued pages 301.

**Non-goals (this build)** — see §7.

---

## 4. Users & stories

| Persona | Who |
|---|---|
| **P1 HU bride/couple** | Planning a wedding in Zala / Balaton, phone-first, wants to see real work and get a quote. |
| **P2 AT/DE couple** | Burgenland / Wien / Niederösterreich / Steiermark, found via German search, wants a fully German site and a price feel. |
| **P3 Destination couple (EN)** | Marrying at Lake Balaton / Western Hungary, English-speaking. |
| **P4 DIY bride** | Decorates herself, wants to rent props: needs size, stock, price, pickup rules. |
| **P5 Vera (owner)** | Needs to update albums, rental items and copy without a CMS, with agent help. |
| **P6 Search engine / assistive tech** | Must index each locale correctly; must be fully keyboard/screen-reader usable. |

### User stories (acceptance criteria are the DoD per master-plan item)

- **US-1** As P1, I land on the HU homepage and within one screen understand what Fiore Vera does (3 services), see real weddings, and can tap "Kérj árajánlatot". *(D-1, D-13)*
- **US-2** As P2, I open `/de/…` and every string — nav, headings, CTAs, form labels, cookie/privacy text, gallery captions — is German; CTAs link to German routes. *(D-3, D-12; legacy bugs #1, #3, #7)*
- **US-3** As P3, I open `/en/…` and get the same complete experience in English, targeted at Lake Balaton / Western Hungary. *(D-3, D-11)*
- **US-4** As P4, I browse the rental catalog with photo, size, stock count, HUF price, deposit and pickup rules per item, identical across locales, and can email or call to reserve. *(D-8)*
- **US-5** As any visitor with a DE or EN browser on a page in another locale, I see a dismissible toast under the language switcher offering my language; dismissing it is remembered. I am never redirected. *(D-4)*
- **US-6** As a mobile visitor on the gallery, I scroll a long page of album covers that load as I reach them; tapping a cover turns it into an in-place carousel with always-visible arrows and swipe. On desktop, hover does the same. *(D-6, D-7)*
- **US-7** As a keyboard or screen-reader user, I can reach every page, operate the language switch, the gallery carousel and the form; images have meaningful alt text; focus is visible. *(D-7; accessibility-expert)*
- **US-8** As P5, I add an album, change a cover image or edit a rental price by editing one typed data file (validated by Zod) and the locale JSON, and the agent runs the DoD. *(D-5, D-8, D-17)*
- **US-9** As P6, each route has a unique `<title>`/description in its locale, `<html lang>`, canonical, `hreflang` incl. `x-default`, Open Graph image, `LocalBusiness` JSON-LD with per-locale service areas, and is listed in `sitemap.xml`. *(D-11; seo-expert)*
- **US-10** As P5, I send an inquiry through the form (name, email, phone optional, wedding date, venue, message, GDPR consent) and it arrives at info.fiorevera@gmail.com; I see a success state or a clear error. *(D-9)*
- **US-11** As anyone with an old link, `/szolgaltatasok/`, `/de/verleih/` etc. still resolve; `/viragoskert/` and `/de/blumengarten/` 301 to About. *(D-16)*
- **US-12** As P5, before launch I review all three locales on my phone on a Vercel preview URL and sign off on a checklist. *(D-12, D-15)*

---

## 5. Decisions (resolved in the interview)

| # | Decision | Rationale / notes |
|---|---|---|
| **D-1** | **Positioning: wedding-first.** Core = full wedding decoration, wedding floristry, prop rental. Other events get one sentence ("rendezvényekre is"), no own page. | Matches what she sells and what ranks today. |
| **D-2** | **Pages (7):** Home, Services, Gallery, Prop Rental, About, Contact, **Privacy**. Flower Garden page **removed** (D-16). | Privacy page is required for a GDPR contact form; legacy had none. |
| **D-3** | **Routes** — HU at root, DE keeps legacy slugs, EN new: see route table below. | Legacy HU/DE URLs stay valid → no redirects except D-16. |
| **D-4** | **Locale behaviour:** no auto-redirect anywhere. On every route, if `navigator.languages` resolves to `de` or `en` and differs from the page locale, show a dismissible **toast under the language switcher** offering that locale. Anything else (hu, other, empty, invalid) → nothing, HU is the default. Dismissal / switch stored in `localStorage` (consent-exempt user preference, listed on the Privacy page). `hreflang` + `x-default=/` on every route. | SEO-safe (Googlebot sees stable pages), no banner needed. |
| **D-5** | **Photography: reuse the legacy CDN files only.** All ~169 gallery JPEGs + hero downloaded from the Webnode CDN, converted to webp ≤ 200 KB into `public/assets/`. No originals chase, no new shoot. Cap: 1920 px long edge; legacy hero is 960×640. | Unblocks the build today. Quality cap recorded as risk R-2. |
| **D-6** | **Gallery = one long page** (`/munkaim/`). Each album is a section: heading (couple — venue), one **Vera-chosen cover image** (`cover: true` in data). Albums below the fold **lazy-load by scroll position** (IntersectionObserver + `loading="lazy"`); first cover is eager with `fetchpriority="high"`. **Hover** turns the cover into an in-place **carousel** (scroll / left-right arrows) over the album's images. All images are in the DOM with alt text; each album has an `id` anchor for deep links. `ImageGallery` JSON-LD. | Owner's choice over album routes; usability is the primary directive. |
| **D-7** | **Touch & keyboard:** tap = carousel in place, arrows always visible on touch (≥ 48 px), swipe supported. Focus on the album activates the carousel; arrow keys navigate; `aria-roledescription="carousel"`, live region for slide index. One component, no hover dependency. | accessibility-expert rules. |
| **D-8** | **Services = 3 pillars:** (1) full wedding decoration with the 4-step process (free first meeting → detailed quote → free venue walkthrough → floral work) and the 12-item floral checklist; (2) **wedding floristry with seasonal flowers from local growers / wholesale** (own-grown argument removed); (3) prop rental. **Rental catalog is data-driven** (name, photo, size, stock, HUF price, deposit, pickup rule) and identical in all locales; DE/EN show HUF with a "prices in HUF" note. Decoration and floristry are quote-only. | Prices are why the rental page ranks. |
| **D-9** | **Contact:** form (name, email, phone optional, wedding date, venue, message, GDPR consent checkbox, honeypot) posting to **Web3Forms or Formspree** free tier → info.fiorevera@gmail.com. Plus click-to-call, mailto, Instagram, Facebook, address. Success / error states inline. | No server code; volume fits the free tier. |
| **D-10** | **Analytics: Vercel Web Analytics** (cookieless). **No cookie consent banner.** | Removes legacy bug #3 entirely. |
| **D-11** | **Local SEO per locale** — one `serviceAreas` list per locale, reused by `SeoHead` and JSON-LD: HU = Zala megye, Balaton, Nagykanizsa, Zalaegerszeg, Keszthely; DE = Burgenland, Wien, Niederösterreich, Steiermark; EN = Lake Balaton, Western Hungary. | DE keeps the Austrian-first framing that ranks today. |
| **D-12** | **Voice & copy:** first-person Vera, informal (HU *te*, DE *du*, EN *you*), warm-practical. Legacy HU copy is the source: typos fixed, tightened, then natively translated to DE/EN by the agent per `i18n-guardian`. Testimonials kept verbatim (typo fixes only). **Vera signs off every locale** before launch. | Keeps the personal trust the testimonials praise. |
| **D-13** | **Homepage sections, in order:** 1 Hero (cover photo, "Fiore Vera — virág és dekoráció", CTA → gallery) · 2 Pitch (3 reasons: seasonal flowers + rental keep the budget in check, planning burden lifted, growing prop range) · 3 Three service cards → Services (×2 anchors) / Rental · 4 Gallery teaser (4 covers) · 5 Testimonials (the 4 existing) · 6 About teaser · 7 CTA "Kérj árajánlatot" + contact strip. | Legacy flow, tightened for mobile. |
| **D-14** | **Out of scope:** blog, booking calendar, online shop, CMS, newsletter, Instagram feed embed, EUR prices, new photoshoot. → `BACKLOG.md`. | |
| **D-15** | **Launch:** Vercel preview → Vera sign-off (US-12) → DNS switch of `fiorevera.hu` to Vercel → **Webnode kept 30 days** as rollback → cancel. Search Console: submit sitemap, verify hreflang. | |
| **D-16** | **Own-grown flowers discontinued.** No Flower Garden page. `/viragoskert/` → 301 `/rolunk/`, `/de/blumengarten/` → 301 `/de/uebermich/` (in `vercel.json`). The About page gets **one past-tense paragraph** (she grew her own cut flowers for several seasons, which shaped her seasonal, natural style). Nothing else references the garden. | Owner statement 2026-11-09. |
| **D-17** | **Legacy archive:** before anything is touched, a deterministic script (`scripts/archive-legacy.ts`) saves a **local copy of the whole Webnode site** — every HU + DE page as Markdown (incl. Flower Garden), all images at original resolution, and a JSON manifest (album → image URLs, rental items) — under `references/legacy/`. Committed to the repo if ≤ 100 MB, otherwise kept outside the repo with the path recorded in README. | Owner requirement: texts, translations and images must be recoverable after Webnode is cancelled. |

### Route table (D-3)

| Page | HU | DE (legacy slug) | EN (new) |
|---|---|---|---|
| Home | `/` | `/de/` | `/en/` |
| Services | `/szolgaltatasok/` | `/de/dienstleistungen/` | `/en/services/` |
| Gallery | `/munkaim/` | `/de/referenzen/` | `/en/portfolio/` |
| Prop Rental | `/kellekberles/` | `/de/verleih/` | `/en/rentals/` |
| About | `/rolunk/` (nav label "Rólam") | `/de/uebermich/` | `/en/about/` |
| Contact | `/kapcsolat/` | `/de/kontakt/` | `/en/contact/` |
| Privacy | `/adatkezeles/` | `/de/datenschutz/` | `/en/privacy/` |
| 301 | `/viragoskert/` → `/rolunk/` | `/de/blumengarten/` → `/de/uebermich/` | — |
| 404 | localized 404 page on every prefix | | |

> EN gallery slug is `/en/portfolio/` (not `/en/references/` as the older AGENTS.md draft said): "references" is a German-ism in English; the AGENTS.md table is updated by the master plan.

### Data contracts (Zod, `src/data/types.ts`)

| File | Shape (summary) |
|---|---|
| `albums.ts` | `{ id, slug, couple, venue: { name, town, country }, year?, photographer?, images: [{ file, altKey, cover?: boolean }] }` — exactly one `cover: true` per album. Couple and venue are proper nouns (not translated); `altKey` is an i18n key. |
| `rentalItems.ts` | `{ id, nameKey, descriptionKey, image, size, quantity, priceHuf, unitKey, depositHuf?, pickupOnly: true, notesKey? }` |
| `services.ts` | `{ id, titleKey, introKey, steps?: [{ titleKey, bodyKey }], checklistKeys?: string[], ctaRoute }` |
| `testimonials.ts` | `{ id, author, quoteKey }` |
| `serviceAreas.ts` | `Record<Locale, string[]>` |
| `contact.ts` | phone, email, address, social URLs, map link |
| `routes.ts` | `Record<PageId, Record<Locale, string>>` — single source for router, `SeoHead`, sitemap, hreflang. |

### Non-functional requirements

- TypeScript strict, ESLint 0 errors, naming per `CLAUDE.md`; no `any`.
- Images: webp ≤ 200 KB, explicit `width`/`height`, `loading="lazy"` except LCP image.
- Fonts: Cormorant Garamond + Inter self-hosted woff2, preloaded, `font-display: swap`.
- i18n: every key present in `hu.json`, `de.json`, `en.json`; parity enforced by a unit test (`scripts/validate-i18n.ts`).
- WCAG 2.1 AA; axe check in E2E; skip link; semantic landmarks; 48 px touch targets.
- E2E (Playwright: chromium, firefox, webkit, Mobile Chrome): nav per locale, language switch + toast, gallery carousel, form (mocked endpoint), vitals spec.
- Security headers in `vercel.json` (CSP allowing the form endpoint and Vercel Analytics, `X-Content-Type-Options`, `Referrer-Policy`).

---

## 6. Open risks

| # | Risk | Mitigation |
|---|---|---|
| **R-1** | **Copy sign-off becomes the blocker.** Photos are solved (D-5); the schedule now depends on Vera reviewing 3 locales. | Review checklist (master-plan item) delivered per page as pages ship, not in one batch at the end. |
| **R-2** | **Legacy image quality cap** — 1920 px max, hero 960×640, some albums are phone photos (`IMG_2022…`). | Vera chooses covers (D-6) so weak shots never lead; hero uses the best 1920 px album image instead of the legacy hero; backlog item for a retina hero shoot. |
| **R-3** | **CSR SPA + SEO.** The GaborPortfolio base is client-rendered; Google must execute JS to see titles/hreflang. | `SeoHead` per route per `seo-expert`; Search Console check after launch (master-plan item); prerender/SSG kept as a backlog option if indexing gaps appear. See Honest Critique #1. |
| **R-4** | **Form provider dependency** (free tier limits, spam, provider outage). | Honeypot + provider spam filter; phone/email/Instagram always visible as fallback; provider swappable behind one `submitInquiry()` function. |
| **R-5** | **Gallery carousel complexity** — 15 carousels on one page, hover vs touch vs keyboard. | One `AlbumCarousel` component, only the visible one mounts its slides (IntersectionObserver), tested in E2E on Mobile Chrome + desktop. |
| **R-6** | **Repo weight** of the legacy archive (~169 JPEGs). | D-17 threshold: commit if ≤ 100 MB, else keep outside repo and record the path. |
| **R-7** | **DNS / domain access.** Who controls the `fiorevera.hu` DNS (registrar login) is not yet known. | Ask before launch item; Webnode kept 30 days (D-15). |

---

## 7. Out of scope (→ `BACKLOG.md`)

Blog · booking calendar · online shop / checkout · CMS or admin UI · newsletter · Instagram feed embed · EUR price display · new photoshoot / retina hero · per-album routes · prerender/SSG · GA4 · `to-prd` publishing to GitHub Issues · Mac wallpaper (separate parallel track, own skill).

---

## 8. Honest Critique (per `AGENTS.md`)

1. **CSR is the wrong default for a 7-page brochure site.** The base template is client-rendered because the portfolio needed it; this site would be strictly better served by prerendered static HTML per route (faster LCP, no JS dependency for `hreflang`/titles, cheaper indexing in 3 locales). I recommend keeping CSR for the build to stay on the proven base (decision stands), but the master plan includes a post-launch Search Console gate, and prerendering is the first backlog item to pull if any locale is indexed poorly.
2. **The hover-carousel on one long page trades SEO for feel.** Per-album routes would give 15 indexable venue pages ("esküvői dekoráció Tihany"); the long page gives anchors only. The owner chose usability deliberately; the mitigation is `ImageGallery` JSON-LD plus venue names in album headings. If venue searches matter later, album routes are a contained backlog change because albums are already data-driven.
3. **"Reuse legacy CDN files only" accepts a quality ceiling.** The site's promise is premium; the hero at 960×640 is not. The plan swaps the hero for a 1920 px album image, but a true retina hero needs a shoot. Recorded as R-2 and a backlog item.
4. **Dropping the flower garden removes the strongest differentiator in the legacy copy.** Every legacy page leaned on "own-grown, seasonal, cheaper". The new pitch has to earn trust without it — the testimonials and the rental price transparency carry that load now. The About paragraph (D-16) keeps the story as provenance, not as an offer.
5. **The interview resolved product scope, not content.** No copy exists yet for EN, and the HU rewrite is the agent's draft until Vera signs off (R-1). The master plan therefore ships copy per page with the page, so review happens in small pieces.
