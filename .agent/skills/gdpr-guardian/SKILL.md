---
name: gdpr-guardian
description: >-
  Guards every change that touches visitor data on fiorevera.hu: the inquiry form
  and its provider, Web Storage keys, analytics and third-party hosts, cookies,
  consent texts, the privacy page, retention and the future greetings list (consent
  concept in `docs/gdpr/`). Use when adding or changing a form field, a fetch/POST,
  an env endpoint, a `localStorage`/cookie key, a third-party script or CSP host,
  any `privacy.*` or `contact.form.consent*` copy, or when planning anything that
  stores e-mail addresses. Not legal advice — it tells the owner what a lawyer must confirm.
---

# GDPR Guardian — Fiore Vera

The site is a static, no-backend SPA (PRD D-9/D-18): personal data exists only in transit (inquiry → form provider →
`info.fiorevera@gmail.com`) and as two consent-exempt `localStorage` keys. This skill keeps it that way until the owner
decides otherwise, and makes every new sink declare itself. Register: `docs/gdpr/data-register.json`.
Concept for the opt-in greetings list: `docs/gdpr/newsletter-consent-concept.md`.

*(Copy and key parity → `i18n-guardian`. Checkbox labels, `aria-describedby`, error announcements → `accessibility-expert`.
CSP and head → `seo-expert`. Gates → `qa-specialist`.)*

## When to use
- Any edit to `src/components/Contact/InquiryForm.tsx`, `src/lib/submitInquiry.ts`, `src/lib/inquiryMailto.ts`, `src/lib/languagePreference.ts`, `src/pages/PrivacyPage.tsx`, `src/data/contact.ts` (`PRIVACY_UPDATED`), `.env.example`, `vercel.json` (CSP), `index.html` (scripts)
- A new `<input name>`, `fetch`, `import.meta.env.VITE_*`, storage key, cookie, analytics or embed (Instagram feed, maps iframe, fonts from a CDN)
- Copy under `privacy.*`, `contact.form.consent*`, `contact.form.errors.consent`, any footer line about data
- Choosing or changing a processor (form provider, newsletter provider, mailbox, analytics, hosting)
- Before the Review Brief of any slice that touched the above

## Architecture facts (verified 2026-11-10)

| Fact | Where |
|---|---|
| One outbound request with personal data: `submitInquiry()` POSTs name, email, phone, wedding_date, venue, message, locale, subject (+ `access_key`) to `VITE_FORM_ENDPOINT`; honeypot `website` dropped client-side; no endpoint → `config` error + prefilled `mailto:` | `src/lib/submitInquiry.ts`, `inquiryMailto.ts` |
| Mandatory inquiry consent checkbox (`consent`, `required`, error `contact.form.errors.consent`), label links to the privacy page via `<Trans>` | `InquiryForm.tsx` |
| Privacy page = 4 hardcoded sections `form · storage · analytics · rights` from `privacy.sections.*`, date from `PRIVACY_UPDATED[locale]` (hand-formatted, D-18) | `PrivacyPage.tsx`, `contact.ts` |
| Storage: `fv-lang`, `fv-lang-toast-dismissed` only, effects only; `navigator.languages` read once, never stored | `languagePreference.ts`, `LanguageToast.tsx` |
| No cookies, no banner (D-10); Vercel Web Analytics is on the privacy page and in the CSP but **not wired in code** | `vercel.json`, `package.json` |
| CSP allows `api.web3forms.com`, `formspree.io`, `va.vercel-scripts.com`, `vitals.vercel-insights.com` — the only hosts the browser may talk to | `vercel.json` |
| Form provider not chosen, personal Gmail mailbox, processor unnamed on the privacy page — open items, see concept note §1 | `BACKLOG.md` `[FORM]` |

## 1. The gate — run on every change in scope

```bash
npm run audit:gdpr   # = tsx .agent/skills/gdpr-guardian/scripts/audit-personal-data.ts
```

Fails on: an `<input|textarea|select name>` not in `formFields`; a storage key (literal or `*_KEY` constant) not in `storage`;
an `import.meta.env.VITE_*` not in `env`; a file with `fetch`/`sendBeacon`/`XMLHttpRequest`/`WebSocket` not in `networkSinks`;
an `https://` host in `src/`, `index.html` or the CSP that is neither a declared processor (`hosts`) nor an `outboundLinks` entry;
`navigator.*` signals not in `browserSignals`; any register entry whose `privacyKey` does not exist in `hu.json`.
**Fix by declaring the sink with a purpose and a privacy key — never by widening the regexes.** If the purpose cannot be
written in one line, the sink should not exist.

## 2. Review checklist per change type

| Change | Must hold |
|---|---|
| New form field | Purpose in the register; `optional` unless the quote cannot be made without it; not pre-filled from storage; privacy `form` body lists it in all three locales; `PRIVACY_UPDATED` bumped |
| New request / provider | Processor named (company, country, transfer mechanism: EU hosting, adequacy or DPF certification), DPA available, host added to CSP `connect-src`/`form-action` and to `hosts`; the privacy section names it |
| Storage or cookie | Consent-exempt (strictly necessary or a user-chosen preference) **or** behind a real consent; key in the register; never read during render (D-18); privacy `storage` body updated |
| Analytics / embed / CDN | Cookieless and IP-anonymised, or it needs a consent banner (D-10 says none — then the answer is no); third-party `<script>`/`<iframe>` is a sink: declare it |
| Consent text | Separate from other matters, unticked, not `required` unless the processing is the service itself (the inquiry consent is; a marketing one never is); plain purpose, frequency, storage, withdrawal; links to the privacy page; versioned when changed |
| Privacy page | Every register entry explained; controller, purposes, basis, recipients, retention, rights, withdrawal, NAIH complaint route present; date bumped; same meaning in HU/DE/EN |
| Retention | Written down for every flow (quote validity / contract end today); deletion path exists and is mentioned |
| Storing e-mail addresses | Stop. Open the concept note, walk the owner through §5 and §6, get the lawyer's confirmation on §2 — then build |

## 3. Owner decisions this skill never makes

Provider choice (form, newsletter, mailbox) · analytics on/off · HU register of consent copy (DE = *ihr*, decided) · frequency promise and the
anniversary partial opt-out · retention periods · whether to involve a lawyer (recommended: yes, once, for §1 gaps + §2).
Legal statements are tagged **[INFO]** / **[CONFIRM]** in the concept note; the skill repeats that tagging in every Review Brief.

## Sparring Manifesto (push back, then propose)
- **Veto pre-ticked, bundled or required marketing consent**, and any inquiry flow that fails without the greetings box.
- **Veto reusing the wedding date, phone or message for a new purpose** without its own consent and privacy section.
- **Veto an undeclared sink** (a `fetch`, key, host or field the register does not know), and a privacy page that describes processing the code does not do — or does processing the page does not describe.
- **Veto secrets or API keys in the client bundle** (`VITE_*` is public by design — only public form keys belong there).
- **Veto a spreadsheet-plus-BCC mailing list** and open/click tracking without disclosure.
- **Veto "it is only a greeting"** as an argument against Grt. § 6 — every send-out is advertising until a lawyer says otherwise.

## Handshakes
- `i18n-guardian`: three-locale parity for every consent/privacy string; DE addresses the couple as *ihr* (owner decision 2026-11-10), HU te/ti follows the surrounding strings.
- `accessibility-expert`: checkbox has a visible label, `aria-describedby` for helper and error, error `role="alert"`.
- `seo-expert`: CSP hosts in `vercel.json`, no third-party script in the head without this skill's sign-off.
- `qa-specialist`: the audit script runs before the Review Brief; e2e asserts unticked defaults and the payload shape.
