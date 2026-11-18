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

## Architecture facts (verified 2026-11-16)

| Fact | Where |
|---|---|
| One outbound request with personal data: `submitInquiry()` POSTs the seven fields under Hungarian keys (`Név`, `E-mail`, `Telefonszám`, `Esküvő dátuma`, `Helyszín`, `Üzenet`, `Nyelv` — `INQUIRY_MAIL_LABELS`; the keys are the labels of the delivered mail) plus the reserved `replyto`, `subject`, `from_name` (+ `access_key`) to `VITE_FORM_ENDPOINT`; honeypot `website` dropped client-side; no endpoint → `config` error + prefilled `mailto:` | `src/lib/submitInquiry.ts`, `inquiryMailto.ts` |
| Mandatory inquiry consent checkbox (`consent`, `required`, error `contact.form.errors.consent`), label links to the privacy page via `<Trans>` | `InquiryForm.tsx` |
| Privacy page = 5 hardcoded sections `form · hosting · storage · analytics · rights` from `privacy.sections.*` (`form` has a second paragraph `processor`), date from `PRIVACY_UPDATED[locale]` (hand-formatted, D-18; bump it with every change of meaning) | `PrivacyPage.tsx`, `contact.ts` |
| Storage: `fv-lang`, `fv-lang-toast-dismissed` only, effects only; `navigator.languages` read once, never stored | `languagePreference.ts`, `LanguageToast.tsx` |
| No cookies, no banner (D-10); Vercel Web Analytics is wired since 2026-11-12: `inject()` runs once on the client, only on fiorevera.hu / www / `*.vercel.app` | `src/lib/analytics.ts`, `src/entry-client.tsx` |
| CSP allows `api.web3forms.com`, `formspree.io`, `va.vercel-scripts.com` — the only hosts the browser may talk to. The Speed Insights host `vitals.vercel-insights.com` was removed on 2026-11-18 (owner decision; unused): add it back, with a register entry, in the change that switches Speed Insights on | `vercel.json` |
| Form processor = **Web3Forms**, operated by Web3Creative (India): DPA v1.0 (2026-07-13) incorporated in its Terms, EEA transfers under SCC 2021/914, sub-processors AWS, Cloudflare, Hetzner, CleanTalk and Akismet (spam check on IP + e-mail), submissions kept up to 3 years on its side. Named on the privacy page since 2026-11-16. Facts read on web3forms.com/privacy and /dpa — **re-read them before changing the copy**; the pages return 403 to plain fetches, open them in a browser | `privacy.sections.form.processor`, register `env` |
| Hosting = **Vercel Inc.** (Covina, CA): listed as Active under the EU-U.S. DPF (dataprivacyframework.gov, checked 2026-11-16). Its DPA names Pro and Enterprise only — the site is on Hobby, so the privacy page **does not claim a DPA**; logs visible to the owner 1 hour (Hobby) / 1 day (Pro) | `privacy.sections.hosting`, register `hosting`, `docs/launch/domain-and-hosting-plan.md` §7 |
| Art. 30 record (draft, owner to confirm) | `docs/gdpr/processing-record.md` |
| Still open: personal Gmail mailbox without a DPA; Vercel Hobby without a written processor contract | `docs/gdpr/processing-record.md` "What the owner has to confirm" |

## 1. The gate — run on every change in scope

```bash
npm run audit:gdpr             # = tsx .agent/skills/gdpr-guardian/scripts/audit-personal-data.ts
npm run audit:gdpr -- --seal   # after an intended register change: stamps today's date as `version`, records the fingerprint
```

The same checks run inside `npm test` (`tests/unit/gdpr.test.ts`, so also in the pre-push hook): nobody has to remember the command.

Fails on: an `<input|textarea|select name>` not in `formFields`; a storage key (literal or `*_KEY` constant) not in `storage`;
a cookie write (`document.cookie = …`, `cookieStore.set`) whose name is not declared with kind `cookie`, or cannot be read from the source;
an `import.meta.env.VITE_*` not in `env`; a file with `fetch`/`sendBeacon`/`XMLHttpRequest`/`WebSocket` not in `networkSinks`;
an `https://` host in `src/` (code and CSS), `index.html` or the CSP that is neither a declared processor (`hosts`) nor an `outboundLinks` entry;
**anything the browser loads without a click** — `<script src>`, `<iframe>`, `<embed>`, `<object>`, a resource `<link>` (preconnect, dns-prefetch, preload, stylesheet), media with a literal external source, CSS `@import` / `url()` — from a host that is not in `hosts` (an `outboundLinks` entry is not enough: the host sees the visitor's IP before any click);
`navigator.*` signals not in `browserSignals`; any register entry whose `privacyKey` does not exist in `hu.json`.

Two more rules live in the tests: the request sent to the form provider carries **exactly** the keys listed under `inquiryPayload`
(`tests/unit/gdpr.test.ts`, `tests/e2e/contact.spec.ts`; the honeypot and the consent flag are never sent), and **a register change needs a new seal**:
`docs/gdpr/data-register.seal.json` holds the register's fingerprint and version, and the unit test fails until `npm run audit:gdpr -- --seal` was run (the seal also stamps the register's `version` with the date of the change).
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
anniversary partial opt-out · retention periods · whether to involve a lawyer (**decided 2026-11-12, launch plan D8: no lawyer** — do not re-recommend it in every Review Brief; the tags below stay as markers of what was never checked).
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
- `qa-specialist`: the audit runs inside `npm test`; e2e asserts the unticked consent box in all three locales, that nothing is sent without consent, and the payload keys (`tests/e2e/contact.spec.ts`).
