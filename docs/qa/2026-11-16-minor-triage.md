# QA minors — triage (2026-11-16, branch `claude/site-polish-5354c6`)

Every minor of `docs/qa/2026-11-09-qa-session.md` and every unbuilt visible or content item of the session harvest
(`.agent/harvest/*.md`, sections 4 and 6), each with one outcome:

- **Fixed** — changed in this branch, with the file and how it was checked.
- **Already fixed** — done between the QA session and today; verified again.
- **Decision** — taste or copy; options were prepared with screenshots and the owner chose on 2026-11-18 (rows marked `D… = letter`).
- **Not changed** — with the reason.
- **Handed over** — the file belongs to another session of 2026-11-16; noted in the shared session notes.

Checks named below: *probe* = scripted run against the production build (`vite preview`) in Chromium; *e2e* = the
Playwright suite in four browsers; *unit* = Vitest; *visual* = the pixel baselines (diff shown to the owner).

## i18n and copy

| # | Minor | Outcome | Detail |
|---|---|---|---|
| 1 | EN "1 pcs" (no plural) | **Fixed** | `pieces`, `sets`, `walls`, `photoCount` have `_one` / `_other` in all three locales. Probe: EN "1 pc", "10 pcs", "10 sets", "19 photos". |
| 2 | Five dead keys | **Fixed** | `common.instagram`, `common.facebook`, `common.readMore`, `common.openInMaps`, `rental.labels.available` removed from all three files (no consumer in `src/`). The whitelist in `scripts/validate-i18n.ts` keeps two stale entries — handed over, the gate passes. |
| 3 | English curly quotes around testimonials in all locales | **Fixed** | `home.testimonials.quote`: HU „…”, DE „…“, EN “…”. Probe confirms per locale. |
| 4 | Units without NBSP in rental notes | **Fixed** | ` ` between number and `cm` / `m` in the rental notes and counts; rental sizes through `src/lib/rentalSize.ts` (unit-tested). |
| 5 | Rental sizes with decimal commas on EN ("2,8 m") | **Fixed** | `formatSize()` gives EN "2.8 m × 2.5 m". Unit + probe. |
| 6 | Venue separator " — " vs "–" elsewhere | **Fixed** | En dash in the album heading (`AlbumSection.tsx`). Visual diff: gallery, carousel. |
| 7 | "About" label reused on the style fact | **Fixed** | New key `about.facts.styleLabel` (Stílus / Stil / Style). Visual diff: about. |
| 8 | Language switch drops the `#album` hash | **Fixed** | `src/lib/useLanguageLink.ts` (header switch, footer language links, toast). The hash is read at click time, never rendered (D-18). Probe: `/munkaim/#szilvi-lala` → `/de/referenzen/#szilvi-lala`, album under the header. |
| 9 | EN "Zala county" lower case ×2 | **Fixed** | "Zala County". |
| 10 | DE mixes *du* (4 strings) with *ihr* | **Fixed** | The owner decided *ihr* on 2026-11-10; the five remaining *du* strings follow (contact + privacy meta description, home CTA title, two form errors). |
| 11 | HU alternates singular and plural address | **Fixed (D4 = A)** | Owner, 2026-11-18: keep the rule — *te* for what one reader does, *ti* for the couple; only the hero lead switched inside one sentence and now reads "Álmaitok esküvői dekorációja …". |
| 12 | EN literal translations ("completely on fire", "costs running away", "humble work") | **Fixed (D10 = A)** | "buzzing with excitement", "without the costs spiralling", "dedicated work" — approved by the owner 2026-11-18. |
| 13 | DE home title mixes `&`, `–`, `\|` | **Fixed (D10 = A)** | "Hochzeitsdekoration & Floristik im Burgenland – Fiore Vera" (58 characters), approved 2026-11-18. |
| 14 | Emoji in rental step 2 | **Not changed (D6 = A)** | Owner, 2026-11-18: the smiley stays. |
| 15 | Owner name order (HU order vs Western in DE/EN) | **Not changed** | Open sign-off question (R-1); `i18n-guardian` forbids normalising it silently. |
| 16 | DE service areas list AT regions only while the tagline adds "Westungarn" | **Not changed** | Deliberate (local SEO per locale, PRD D-11). |
| 17 | Hardcoded `aria-label="Social"` | **Already fixed** | `footer.socialLabel` in all locales. |
| 18 | HU-only noscript | **Already fixed** | Localised by the prerender (QA M4). `dist/404.html` stays locale-neutral by design. |
| 19 | Honeypot label "Website" | **Not changed** | Hidden from people and from the accessibility tree; it is bait for bots, which look for English field names. |
| 20 | HU-only mail subject | **Not changed** | By design, and the mail now carries a "Nyelv" line. |

## Usability and UI

| # | Minor | Outcome | Detail |
|---|---|---|---|
| 21 | Hero secondary button reads as plain text | **Fixed** | Root cause was a cascade bug, not the design: `global.css` loads after the component CSS, so `.btn { border: 1px solid transparent }` beat `.heroGhost` and the outline never rendered. Selector raised to `.heroActions .heroGhost`. Visual diff: home ×4. Layout on phones (D1 = B, owner 2026-11-18): both buttons full width, stacked, in every language; a row from 48rem. |
| 22 | Hero eyebrow hyphenates at 320 ("ZALA ME-GYE") | **Fixed** | `hyphens: manual` on the eyebrow. |
| 23 | Album heading separator orphaned at a line end (375) | **Fixed** | "– Venue" is one inline block and wraps as a whole. |
| 24 | Consent "*" wraps alone | **Fixed** | No-break space before every required marker. |
| 25 | Contact-card phone / e-mail look like static text | **Fixed** | The card no longer removes the underline; they follow the global link style. |
| 26 | Rental step 2: phone number plain text | **Fixed** | `tel:` link through `<Trans>`. Probe: `tel:+36308659108`. Visual diff: rental. |
| 27 | Rental spec grid differs when a card has no size | **Fixed (D2 = B, phones only)** | On phones the price is the first, full-width row on every card. On desktop the owner preferred the earlier grid order after seeing it built (review round 2, 2026-11-18), so from 48rem the price stays in the grid. |
| 28 | Footer address wraps "53." alone | **Fixed** | `displayAddress()` joins street and number with a no-break space (footer + contact card; JSON-LD keeps the plain address). |
| 29 | Footer e-mail breaks mid-word | **Fixed** | `<EmailLink>`: one line when it fits, otherwise a break at the "@" only. Sweep 320–1920 on this branch alone: one line from 1100 px, "info.fiorevera / @gmail.com" from 768 to 1024, never mid-word, no overflow. Quality gates' branch (lands first) makes the footer two columns between 768 and 1119 px, so after the rebase the address is on one line at every checked width and the "@" break remains only as the safety net. |
| 30 | Footer pills "Insta-gram" / "Face-book" at 768 (found today) | **Fixed** | Pills never break inside the name; they wrap as a whole. |
| 31 | Fast flick skips several slides | **Fixed** | `scroll-snap-stop: always`. |
| 32 | Scroll-to-top button over the carousel "next" arrow | **Fixed** | The carousel sits one layer above the button (81 vs 80). Probe at 375: a tap on the arrow's centre hit "Vissza az oldal tetejére" before and hits "Következő kép" now. The overlap exists up to ~1180 px, not only at 375. |
| 33 | Doubled deep-link offset (heading 137 px below the header) | **Fixed** | `scroll-margin-top` removed from album, rental card and service pillar; `scroll-padding-top` on the page does it alone. Probe: album top at 88 px under a 73 px header. |
| 34 | Portrait cover of album 1 loses the top of the arrangement | **Not changed (D7 = C)** | Owner, 2026-11-18: Vera picks a landscape cover when she chooses the 15 covers (MASTER-PLAN 1.3); noted on that BACKLOG line. |
| 35 | Back / forward scroll restore races the scroll-to-top | **Fixed** | `Layout.tsx` forces the top only on a followed link, not on back/forward. Probe: back returns to the position the page was left at. |
| 36 | `/DE/kontakt/` answers the Hungarian 404 | **Fixed** | Route matching and the locale prefix ignore letter case (`routes.ts`, unit-tested). Probe: German contact page, canonical in lower case. On Vercel the HTTP status of such a URL stays 404 (static host, no file with that name). |
| 37 | Phone field accepts any string | **Already fixed** | Validation slice `f4feae3`. |
| 38 | Error banner below the fold after a failed submit, not focused | **Fixed** | The failure box scrolls into view and takes focus, like the success card. |
| 39 | Six simultaneous `role=alert` on an empty submit | **Fixed** | One summary alert ("6 mezőt még javítani kell."); field messages stay linked by `aria-describedby`. Probe: 1 alert, 6 field messages, focus on "name". The contact spec on `main` selects the field messages by id since the Quality gates merge (2026-11-18), so it is green with this markup. |
| 40 | Form lacks an accessible name | **Fixed** | `aria-labelledby` the form heading. Probe: `getByRole('form')` → "Árajánlatkérés". |
| 41 | Date input has no `min` | **Fixed** | Set to today after mount (not in the prerendered HTML, D-18). Guidance only: the owner chose "minimum only" validation, so a typed past date still sends. |
| 42 | Text lines of 120–150 characters at 1280 (BACKLOG `[UI]`) | **Fixed** | Privacy sections stop at 42rem, service steps and the rental pillar at 46rem. `.prose` on a `.container` never worked (same cascade bug as #21). Visual diff: privacy, services. |

## Accessibility

| # | Minor | Outcome | Detail |
|---|---|---|---|
| 43 | Focus not moved to `main` on route change | **Fixed** | `Layout.tsx`, StrictMode-safe. Probe: `activeElement` is `main-content` after a link. |
| 44 | Scroll-to-top keeps focus after fading out | **Fixed** | Focus goes to `main` on click. |
| 45 | Two carousels share the label "Csilla és András" | **Fixed** | Region label includes the venue (`gallery.carousel.labelWithVenue`). |
| 46 | Consent checkbox 22 px | **Fixed** | 24 px (WCAG 2.2 target size without relying on the label). |
| 47 | Hero lead over the brightest pixels 3.7–4.2:1 | **Fixed (D8 = B)** | Re-measured on every pixel behind the text at 5 widths × 3 locales: lead worst pixel 3.0, 5th percentile 4.0 (needs 4.5); subtitle worst 2.4 (needs 3.0). A stronger lower gradient brings the lead to ≥ 4.8 (5th percentile 5.9) and the subtitle to ≥ 4.2. It darkens the lower half of the key photo; the owner chose it on 2026-11-18. |
| 48 | 45 tab stops across the gallery | **Not changed** | Removing the arrows from the tab order changes an owner-approved component ("arrows always there, do not overcomplicate") and the gallery e2e. Arrow keys on the focused track already browse. |
| 49 | 30 arrow buttons share two names | **Not changed** | Each pair sits inside its own labelled region; adding the album name would change the names the e2e and visual specs select by. |
| 50 | `main` not `inert` while the menu is open | **Not changed** | `inert` cannot be scoped to a breakpoint: a resize to desktop with the menu open would leave the page dead. Focus trap and document-level Escape exist. |
| 51 | Language links 40 px, footer links 32 px, logo 44 × 48 | **Not changed** | All meet WCAG 2.2 AA (24 px). The 48 px house rule would add about 110 px to the footer on phones; say if you want it. |
| 52 | `--fs-xs` renders 12.6 px at 375 | **Not changed** | A global token: every eyebrow, label and counter and every baseline would move. Upper-case, tracked labels at 12.6 px are legible; raise it as its own change if wanted. |

## SEO

| # | Minor | Outcome | Detail |
|---|---|---|---|
| 53 | `inLanguage` on LocalBusiness; generic type | **Already fixed** | QA M3. |
| 54 | 404 pages combine `noindex` with a canonical | **Already fixed** | QA M2 (no canonical on the 404 shell). |
| 55 | No `priceRange` / `geo` | **Not changed** | Needs facts from the owner (a price range is a claim); zero-guessing. |
| 56 | No `Product` / `Offer` on the rental page, no `BreadcrumbList`, OG lacks `og:locale:alternate` and image dimensions | **Handed over** | Structured data and head tags: SEO Webvitals session (`SeoHead.tsx` is theirs to change while that work is open). |
| 57 | Sitemap lacks `lastmod`, carries ignored `changefreq` / `priority` | **Handed over** | `scripts/generate-sitemap.ts` — Quality gates / SEO. |
| 58 | Header logo preloaded ahead of the hero | **Handed over** | `index.html` preload tags — SEO Webvitals. |
| 59 | `seo.spec.ts` runs against the dev server | **Handed over** | `tests/e2e/` — Quality gates. |
| 60 | Home hero and service-card photos have `alt=""` | **Not changed** | They are decorative next to their own heading; an alt would be read twice. |
| 61 | Home `h1` is the brand only; contact pages are thin | **Not changed** | Copy for the R-1 sign-off, not a defect. |

## Harvest items (sections 4 and 6) not covered above

| Item | Outcome | Detail |
|---|---|---|
| Privacy: hosting section, Web3Forms named, date, register, Art. 30 record | **Fixed** | See the review brief; two statements of the launch-plan proposal were wrong and are not shipped. |
| `/favicon.ico`, maskable icon, drift guard, Python dependency | **Fixed** | `npm run favicon`, `tests/unit/favicon.test.ts`, script header + skill. |
| Hungarian field labels in the inquiry mail | **Fixed** | Confirmed by the owner with a real inquiry from the Vercel preview on 2026-11-18. |
| Services eyebrow repeats the heading | **Fixed (D3 = B)** | The eyebrow is the pillar's position, "1 / 3" … "3 / 3"; the three eyebrow keys are gone from the locale files. |
| Hyphenation policy | **Fixed (D5 = B)** | No automatic hyphenation at any width. |
| Speed Insights host in the CSP | **Fixed (D9a = A)** | `vitals.vercel-insights.com` removed from `vercel.json` and the register; it comes back with the change that enables Speed Insights. |
| "301" wording vs the 308 Vercel sends | **Fixed (D9b = A)** | 308 stays; MASTER-PLAN, AGENTS.md, README and the code comment now say "permanent redirect (308 on Vercel)". |
| Layout invariant "a one-token link must not wrap" | **Handed over** | Built by Quality gates (`tests/visual/layout.spec.ts`, invariant 7), together with a two-column footer between 768 and 1119 px that keeps the e-mail on one line there. |
| `scripts/lockscreen/designs.ts` stale comment | **Handed over** | `scripts/` — Quality gates. |
| Vitest wrapper for the GDPR audit, register version rule | **Handed over** | Quality gates is rewriting the audit (seal + fixtures). |
| DE/EN inner-page baselines, Linux baseline set, axe as a gate | **Handed over** | Quality gates. |
