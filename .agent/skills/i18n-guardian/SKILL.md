---
name: i18n-guardian
description: >-
  Guards the HU/DE/EN copy of the Fiore Vera site: every string keyed in
  `src/i18n/locales/{hu,de,en}.json`, the parity gate (`scripts/validate-i18n.ts`),
  interpolation and plural keys, the language-suggestion toast, URL-driven locale
  with no detection, hydration-safe formatting, proper nouns, per-locale
  typography and the leak audit. Use when adding, renaming or removing a key,
  writing or translating copy, touching `LanguageSwitch`/`LanguageToast`/
  `languagePreference`, albums or rental labels, or auditing a locale.
---

# i18n Guardian — Fiore Vera

Goal 1 of the PRD: zero partial-i18n leaks (legacy bugs #1, #3, #7 — DE CTAs to HU URLs, HU cookie
text on DE, HU couple names on the DE gallery). The language is decided by the URL, never by the browser.

*(hreflang, `<html lang>` in the head, `meta.*` length rules → `seo-expert`. Visual length checks → `design-system-expert`.)*

## When to use
- Adding / renaming / removing any key in `src/i18n/locales/*.json`; adding a component with visible or ARIA text
- Writing or translating copy (D-12 voice), reviewing the owner's sign-off material (R-1)
- Touching `src/i18n/config.ts`, `src/i18n/localeContext.ts`, `src/components/Layout/{LanguageSwitch,LanguageToast,Layout}.tsx`, `src/lib/languagePreference.ts`, `src/lib/albums.ts`, `src/data/contact.ts`
- Before any commit that changes `src/data/`, `src/i18n/`, `scripts/prerender.ts`

## Architecture facts

| Fact | Where |
|---|---|
| **One pre-initialised i18next instance per locale**, `getI18n(locale)`, `initImmediate: false`, `fallbackLng: 'hu'`, `escapeValue: false`, `returnNull: false`. No detector, no `changeLanguage`, nothing async. `i18next-browser-languagedetector` sits in `package.json` **unused — never wire it in** (D-4). | `src/i18n/config.ts` |
| Locale comes from the pathname (`localeFromPath`, `matchRoute`) and is passed down via `LocaleContext { locale, page }` | `src/data/routes.ts`, `src/i18n/localeContext.ts` |
| Three files, same tree, **274 keys each** (counted 2026-11-18 — recount, never copy), 15 namespaces: `meta nav lang toast common home services gallery rental about contact privacy notFound footer testimonials` | `src/i18n/locales/{hu,de,en}.json` |
| Page intros and titles sit under `<page>.hero.{eyebrow,title,intro}` and are read through `PageHero` (`t('gallery.hero.intro')`); form errors are **codes** from `src/lib/validateInquiry.ts` that `InquiryForm` maps to `contact.form.errors.{required,email,phone,tooLong,consent}` | `src/pages/*.tsx`, `src/components/Contact/InquiryForm.tsx` |
| Data files hold **keys and proper nouns only** (`nameKey`, `descriptionKey`, `titleKey`, `partners`, venue names); Zod rejects anything else | `src/data/*.ts`, `src/data/types.ts` |
| `<html lang>` is set by `scripts/prerender.ts` per route and by a `Layout` effect on client navigation | `scripts/prerender.ts`, `Layout.tsx` |

## 1. Parity gate

`scripts/validate-i18n.ts` (`npm run validate:i18n`; also `tests/unit/i18n.test.ts`) flattens all three files with `hu` as reference and reports:

| kind | Meaning | Fix |
|---|---|---|
| `missing` | key in `hu`, absent in `de`/`en` | add the translation, never a copy of HU |
| `extra` | key in `de`/`en` not in `hu` | remove it or add the HU original |
| `empty` | `""` or whitespace | write the string |
| `identical` | same value in all three and not whitelisted | translate, or add to `IDENTICAL_WHITELIST` **only** for proper nouns / brand strings |

`IDENTICAL_WHITELIST` today: `meta.siteName`, `home.hero.title`, `lang.hu|de|en`, `common.instagram`, `common.facebook`, `notFound.eyebrow`. The same test also fails on legacy typos (`bújtatott kéltségek`, `Eskövő`, `hozzárulok`, `Burgendland`, `REferenzen`, `FRag nach einen`), on garden mentions outside `about.garden.*` (D-16) and on `meta.*.title` > 60 / `meta.*.description` > 160 chars.

**Workflows (one change set, all three files):**

| Action | Steps |
|---|---|
| **Edit existing copy** | **First find the key the component reads**: `grep -rn "gallery\." src/pages src/components` (quote the pattern, zsh). An intro edit once went to `gallery.intro`, a key the page never read — the page reads `gallery.hero.intro`. Then change all three locales and look at the page |
| Add key | write HU → DE → EN in the same namespace position; `npm run validate:i18n`; use via `t('ns.key')` |
| Rename key | update every `t()` / `*Key` field / `tests/e2e/locales.ts` consumer + all three files; grep the old key: `grep -rn "old.key" src tests scripts` |
| Remove key | delete from all three; grep proves zero consumers (the five dead keys of the 2026-11-09 QA report were removed on 2026-11-16) |
| Identical by design | add to `IDENTICAL_WHITELIST` with a reason in the PR; never for CTAs or labels |
| Placeholder | `{{name}}` identical in all three (`{{count}}`, `{{title}}`, `{{venue}}`, `{{n}}`, `{{total}}`, `{{date}}`, `{{areas}}`, `{{max}}` in `contact.form.errors.tooLong`, `{{phone}}` in the rental steps — Vera's number comes from `src/data/contact.ts`, never typed into copy); word order may change, names may not |
| Copy that is only a proposal | Keep it out of the locale files until the owner's GO — one key forces all three locales through the parity gate. Today: the greetings-list copy (`docs/gdpr/newsletter-consent-concept.md` §7) and the privacy hosting / Web3Forms lines (`docs/launch/domain-and-hosting-plan.md` §7.4) |

## 2. Plurals

i18next resolves `key_one` / `key_other` from `{{count}}` for all three locales (HU, DE and EN all have `one`/`other` rules). Counted strings carry both suffixes in **all three** files (HU does not inflect but needs both keys for parity): `gallery.photoCount`, `rental.labels.pieces|sets|walls`, `contact.form.errorSummary`. Call them with the bare key, `t('rental.labels.pieces', { count })`; the parity gate flattens suffixed keys like any other. A new counted string follows the same pattern — never `"{{count}} pcs"` alone ("1 pcs").

## 3. Language follows the URL

- `LanguageSwitch` links to `pathFor(page ?? 'home', code)` with `hrefLang` + `lang` attributes; accessible name starts with the visible code: `"DE – Deutsch"`, active one `"HU – Magyar (jelenlegi nyelv)"` (`lang.current`). Clicking calls `rememberLanguageChoice` (localStorage `fv-lang` + `fv-lang-toast-dismissed`). The switch keeps the page and the `#anchor` (`useLanguageLink`: the hash is read at click time, never rendered into the `href`, D-18).
- **No redirect anywhere**, no `Accept-Language` logic, no root bounce (the legacy site bounced non-HU browsers to `/de/`).
- Tests: `tests/e2e/locale.spec.ts` (switch lands on the same page, `lang` attribute), `tests/e2e/navigation.spec.ts` (`HU_LEAKS` list, DE CTAs only to `/de/…`, localized 404s).

## 4. Toast rules (PRD D-4, US-5)

`LanguageToast.tsx` + `languagePreference.ts`:
- Runs only in an effect, inside `requestAnimationFrame` (hydration-safe, no sync `setState`). `suggestedLocaleFor(navigator.languages)` returns `de` or `en` only; `hu` first → `null`; `fr`, empty, invalid → `null`.
- Shown only when the suggestion differs from the page locale. **Text is in the target language**: `getI18n(suggested).getFixedT(suggested)` for `toast.body|cta|dismiss`, and the toast carries `lang={suggested}`.
- CTA = `Link` to the same page in the target locale; dismiss and CTA both persist (`fv-lang-toast-dismissed`); never redirect, never auto-switch.
- Bottom-anchored, hidden while `body.menu-open`, `body.toast-visible` reserves space. UX follow-up is in `BACKLOG.md` `[UX]`.
- Spec: `locale.spec.ts` (`de-AT` sees DE toast on `/`, dismiss survives reload; `/de/` shows nothing; `en-US` on `/de/kontakt/` → `/en/contact/`; `fr-FR` nothing).

## 5. Hydration safety (PRD D-18) — nothing locale-dependent at render time

| Need | Do | Never |
|---|---|---|
| Footer year | `__BUILD_YEAR__` (Vite `define`, `src/vite-env.d.ts`) | `new Date()` in render |
| Prices | `formatHuf(19990)` → `19 990 Ft` (U+202F thousands, U+00A0 before `Ft`), same in all locales (D-8: HUF everywhere, DE/EN show a "prices in HUF" note) | `Intl.NumberFormat`, `toLocaleString` |
| Dates | `PRIVACY_UPDATED[locale]` hand-formatted (`2026. november 9.` / `9. November 2026` / `9 November 2026`) | `Intl.DateTimeFormat`, `Date` |
| Browser language | effect only (`LanguageToast`) | `navigator` in render |

Gate: `tests/unit/render.test.tsx` renders all 21 routes + 3 404s with `renderToString`. Zero hydration console errors was verified by hand in the 2026-11-09 QA session; no Playwright spec asserts it yet (`vitals.spec.ts` only logs) — check the console on the preview build when touching render paths.

## 6. Proper nouns and joiners

- Couples: `partners: [a, b]` in `src/data/albums.ts`, joined by `albumTitle()` with `` ` ${t('gallery.and')} ` `` → "Klaudia és Thomas" / "und" / "and" (fix of QA M5; 174 leaks per DE/EN page before). Non-couple albums use `titleKey`. Never store a joined string.
- Venue `name`/`town` are proper nouns (not translated); country via `gallery.countries.HU|AT` (shown for non-HU venues only, `albumVenue()`). Alt text: `gallery.albumAlt` / `albumAltNoVenue` templates (D-5).
- Brand strings stay identical (whitelist). Owner name order (HU "Sebőkné Antalics Veronika" vs Western order in DE/EN copy) is an open sign-off question — do not normalise silently.
- Open content questions live in `BACKLOG.md` `[CONTENT]` (Hannersberg venue label, EN rendering of "Esküvő Classic Magazin fotózás").

## 7. Register — owner decision, not yours

D-12 says informal first-person (HU *te*, DE *du*, EN *you*). What the owner decided since (review of 2026-11-16/18, `docs/qa/2026-11-16-minor-triage.md`):

| Question | Status |
|---|---|
| DE address of the couple | **Decided by the owner 2026-11-10: *ihr*.** New and edited DE copy uses *ihr*; the last five *du* strings were aligned on 2026-11-18 |
| HU *te* vs *ti* | **Decided 2026-11-18:** *te* for what one reader does (buttons, form, "Hívj bátran"), *ti* for the couple and their wedding ("esküvőtök", "nektek"). Only a sentence that switches inside itself gets aligned (the hero lead now starts "Álmaitok …"). No sweep |
| Hyphenation, emoji in the rental step, gold numerals, portrait crops | **Decided 2026-11-18:** no automatic hyphenation; the smiley stays; numerals done (QA M7); Vera picks landscape covers |
| Services eyebrow, hero buttons on phones | **Decided 2026-11-18:** the eyebrow is the pillar's position ("1 / 3", rendered in code, no copy key); both hero buttons are full width and stacked on phones, labels unchanged |
| Field labels in the delivered inquiry mail | **Decided and built:** Hungarian (`INQUIRY_MAIL_LABELS` in `src/lib/submitInquiry.ts`), confirmed by a delivered mail on 2026-11-18. Subject and sender name ("Fiore Vera weboldal") stay HU-only by design |
| Copy sign-off per locale (R-1), Vera's phone check of the three locales | **Open** (MASTER-PLAN 2.3/2.4, 4.2) |

Testimonials are verbatim (typo fixes only).

## 8. Typography and formatting per locale

| | HU | DE | EN |
|---|---|---|---|
| Quotes | „…” | „…“ | “…” |
| Dash in titles / ranges | spaced en dash ` – ` (never em dash) | same | same |
| Decimal / units | `2,8 m`, NBSP before units | `2,8 m` | `2.8 m` (`src/lib/rentalSize.ts` converts the shared `size` string) |
| Apostrophe | — | — | typographic `’` preferred; the files use `'` today, keep one style per file |

Testimonials take their quotation marks from `home.testimonials.quote` (`„{{text}}”` / `„{{text}}“` / `“{{text}}”`). Number and unit are joined by `\u00a0` in the locale files (rental notes, counts) and by `formatSize()` for rental sizes, which also gives EN a decimal point. There is no automatic hyphenation (owner decision 2026-11-18) — long HU/DE compounds wrap as whole words, so check new copy at 320 px.

**Length budgets**: DE runs ~30 % longer than HU/EN. Nav labels must fit the desktop header at 1024 px and the mobile menu at 320 px without wrapping; CTA buttons (`nav.quote`, `toast.cta`, form submit) stay single-line at 320 px; eyebrows/pills (`home.hero.eyebrow`) must not hyphenate at 320 px (QA: "ZALA ME-GYE"). Check at 320 / 375 / 1024 in the browser before sign-off.

## 9. Static shell localization

`index.html` ships HU only for the no-JS path: `<p data-noscript>` is replaced per route by `scripts/prerender.ts` with `common.noscript`; the skip link is rendered by `Layout` from `common.skipToContent` (fix of QA M4). `dist/404.html` is a locale-neutral shell (HU noscript, `lang="hu"` until the client mounts). Any new static-shell string needs the same `data-*` marker + prerender replacement, or must move into React.

## 10. Audit checklist (used 2026-11-09)

```bash
npm run validate:i18n && npm test -- --run tests/unit/i18n.test.ts tests/unit/render.test.tsx
npm run build
# leak scan: HU-only words on DE/EN pages (text, aria-label, alt, title, JSON-LD)
grep -rlE ' és |Szolgáltatások|Kellékbérlés|Kapcsolat|Rólam|Kérj árajánlatot|Ugrás a tartalomra' dist/de dist/en
grep -ohE 'aria-label="[^"]+"' dist/en/index.html | sort -u            # every label in English?
grep -ohE 'alt="[^"]*"' dist/de/referenzen/index.html | sort -u | head  # templated, DE, no "és"
grep -o '"caption":"[^"]*"' dist/en/portfolio/index.html | head -3      # JSON-LD captions localized
```
Then in the browser, per locale: 404 page title/h1/CTA, form states (empty submit, invalid email, config-missing error with mailto, success), toast text and dismiss, language switch labels, footer service areas, privacy date, HUF formatting. Mail subject is HU-only by design (optional locale suffix — minor).

## Sparring Manifesto (push back, then propose)
- **Veto hardcoded strings** in JSX — visible text, `aria-label`, `title`, `alt`, `placeholder`, JSON-LD names, form error messages, noscript. Everything goes through `t()` or a prerender replacement.
- **Veto keys added to one or two locales**, placeholder renames in one locale, or a HU value pasted into DE/EN "for now". The gate is red for a reason; fix the copy, not the whitelist.
- **Veto machine-translation artefacts**: literal idioms ("I was completely on fire", "costs running away"), German-isms in EN ("references"), HU word order in DE, wrong capitalisation ("Zala county"), untranslated conjunctions in proper-noun joins. Ask the owner for the practitioner's term instead of guessing (zero-guessing, `AGENTS.md`).
- **Veto register decisions without the owner** (HU *te* / *ti* and DE *ihr* are decided, see the table above) and any "normalisation" sweep before the BACKLOG decision lands.
- **Veto a copy edit made without reading the consumer**: name the key and the component that reads it in the Review Brief.
- **Veto locale from browser/storage during render**, redirects on language, and any use of `i18next-browser-languagedetector`.
- **Veto strings built by concatenation** (`name + ' és ' + name`, `count + ' db'`) — use interpolation and plural keys.

## Handshakes
- `seo-expert`: `meta.*` lengths, `<html lang>`, hreflang on new routes, head leaks.
- `accessibility-expert`: accessible-name rules (label-in-name, WCAG 2.5.3) for localized `aria-label`s.
- `qa-specialist`: DoD run; Playwright `locale.spec.ts` + `navigation.spec.ts` are the regression gates.
- `design-system-expert`: DE length overflow in nav/buttons/pills.
- `gdpr-guardian`: every `privacy.*` and `contact.form.consent*` string; a privacy edit bumps `PRIVACY_UPDATED` in `src/data/contact.ts` (hand-formatted per locale).
