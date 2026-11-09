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
| Three files, same tree, **267 keys each**, 15 namespaces: `meta nav lang toast common home services gallery rental about privacy notFound footer testimonials` | `src/i18n/locales/{hu,de,en}.json` |
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
| Add key | write HU → DE → EN in the same namespace position; `npm run validate:i18n`; use via `t('ns.key')` |
| Rename key | update every `t()` / `*Key` field / `tests/e2e/locales.ts` consumer + all three files; grep the old key: `grep -rn "old.key" src tests scripts` |
| Remove key | delete from all three; grep proves zero consumers. Known dead keys (QA minor): `common.instagram|facebook|readMore|openInMaps`, `rental.labels.available` |
| Identical by design | add to `IDENTICAL_WHITELIST` with a reason in the PR; never for CTAs or labels |
| Placeholder | `{{name}}` identical in all three (`{{count}}`, `{{title}}`, `{{venue}}`, `{{n}}`, `{{total}}`, `{{date}}`, `{{areas}}`); word order may change, names may not |

## 2. Plurals

i18next resolves `key_one` / `key_other` from `{{count}}` for all three locales (HU, DE and EN all have `one`/`other` rules). The locale files currently have **no plural suffixes**: `rental.labels.pieces = "{{count}} pcs"` renders **"1 pcs"** on EN (QA minor, open). Fix pattern: replace `pieces` with `pieces_one` + `pieces_other` in **all three** files (HU/DE do not inflect but need both keys for parity), same for `sets`, `walls`, `photoCount`; the parity gate flattens suffixed keys like any other.

## 3. Language follows the URL

- `LanguageSwitch` links to `pathFor(page ?? 'home', code)` with `hrefLang` + `lang` attributes; accessible name starts with the visible code: `"DE – Deutsch"`, active one `"HU – Magyar (jelenlegi nyelv)"` (`lang.current`). Clicking calls `rememberLanguageChoice` (localStorage `fv-lang` + `fv-lang-toast-dismissed`). The switch keeps the page but drops `#album` hashes (QA minor).
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

D-12 says informal first-person (HU *te*, DE *du*, EN *you*), but the shipped copy mixes HU singular/plural (*Álmaid … figyelnetek*) and DE *du* (4 strings) with *ihr* (~40). The decision is listed under `BACKLOG.md` `[CONTENT]` "Owner decisions from the QA session" and `docs/qa/2026-11-09-qa-session.md#owner-decisions-needed`. Until it is made: keep the register of the surrounding strings when editing, flag inconsistencies in the Review Brief, **do not pick a side**. Testimonials are verbatim (typo fixes only).

## 8. Typography and formatting per locale

| | HU | DE | EN |
|---|---|---|---|
| Quotes | „…” | „…“ | “…” |
| Dash in titles / ranges | spaced en dash ` – ` (never em dash) | same | same |
| Decimal / units | `2,8 m`, NBSP before units | `2,8 m` | `2.8 m` (open minor: rental sizes are a shared `size` string with commas) |
| Apostrophe | — | — | typographic `’` preferred; the files use `'` today, keep one style per file |

Open minor: testimonials use English curly quotes in all three locales. Hyphenation is CSS-side (`global.css`, mobile body text only) — not a copy concern.

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
- **Veto register decisions without the owner** (te/ti, du/ihr) and any "normalisation" sweep before the BACKLOG decision lands.
- **Veto locale from browser/storage during render**, redirects on language, and any use of `i18next-browser-languagedetector`.
- **Veto strings built by concatenation** (`name + ' és ' + name`, `count + ' db'`) — use interpolation and plural keys.

## Handshakes
- `seo-expert`: `meta.*` lengths, `<html lang>`, hreflang on new routes, head leaks.
- `accessibility-expert`: accessible-name rules (label-in-name, WCAG 2.5.3) for localized `aria-label`s.
- `qa-specialist`: DoD run; Playwright `locale.spec.ts` + `navigation.spec.ts` are the regression gates.
- `design-system-expert`: DE length overflow in nav/buttons/pills.
