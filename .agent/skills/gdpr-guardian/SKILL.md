---
name: gdpr-guardian
description: >-
  Guards every change that touches visitor data on fiorevera.hu: the inquiry form
  and its provider, Web Storage keys, analytics and third-party hosts, cookies,
  consent texts, the privacy page, retention and the future greetings list (consent
  concept in `docs/gdpr/`). Use when adding or changing a form field, a fetch/POST,
  an env endpoint, a `localStorage`/cookie key, a third-party script or CSP host,
  any `privacy.*` or `contact.form.consent*` copy, a processor (Web3Forms, Vercel,
  the mailbox), or when planning anything that stores e-mail addresses. Not legal
  advice — it marks what was never confirmed by a lawyer.
---

# GDPR Guardian — Fiore Vera

The site is a static, no-backend SPA (PRD D-9/D-18): personal data exists only in transit (inquiry → Web3Forms →
`info.fiorevera@gmail.com`), in Vercel's access logs and cookieless page-view counts, and as two consent-exempt
`localStorage` keys. Nothing is stored by the site itself — but it **does process** personal data, so "we store no data"
is not an argument. This skill keeps it that way until the owner decides otherwise, and makes every new sink declare
itself. Register: `docs/gdpr/data-register.json`. Hosting touchpoints: `docs/launch/domain-and-hosting-plan.md` §7.
Concept for the opt-in greetings list: `docs/gdpr/newsletter-consent-concept.md`.

*(Copy and key parity → `i18n-guardian`. Checkbox labels, `aria-describedby`, error announcements → `accessibility-expert`.
CSP and head → `seo-expert`. Gates → `qa-specialist`.)*

## When to use
- Any edit to `src/components/Contact/InquiryForm.tsx`, `src/lib/submitInquiry.ts`, `src/lib/validateInquiry.ts`, `src/lib/inquiryMailto.ts`, `src/lib/analytics.ts`, `src/entry-client.tsx` (analytics start), `src/lib/languagePreference.ts`, `src/pages/PrivacyPage.tsx`, `src/data/contact.ts` (`PRIVACY_UPDATED`), `.env.example`, `vercel.json` (CSP), `index.html` (scripts)
- A new `<input name>`, `fetch`, `import.meta.env.VITE_*`, storage key, cookie, analytics or embed (Instagram feed, maps iframe, fonts from a CDN)
- Copy under `privacy.*`, `contact.form.consent*`, `contact.form.errors.consent`, any footer line about data
- Choosing or changing a processor (form provider, newsletter provider, mailbox, analytics, hosting)
- Before the Review Brief of any slice that touched the above

## Architecture facts (verified against the code 2026-11-16)

| Fact | Where |
|---|---|
| One outbound request with personal data: `submitInquiry()` POSTs name, email, phone, wedding_date, venue, message, locale, subject, `from_name` ("Fiore Vera weboldal", no personal data) (+ `access_key`) to `VITE_FORM_ENDPOINT`; honeypot `website` dropped client-side; no endpoint → `config` error + prefilled `mailto:` | `src/lib/submitInquiry.ts`, `inquiryMailto.ts` |
| Mandatory inquiry consent checkbox (`consent`, `required`, error `contact.form.errors.consent`), label links to the privacy page via `<Trans>` | `InquiryForm.tsx` |
| Privacy page = 4 hardcoded sections `form · storage · analytics · rights` from `privacy.sections.*`, date from `PRIVACY_UPDATED[locale]` (hand-formatted, D-18) | `PrivacyPage.tsx`, `contact.ts` |
| Storage: `fv-lang`, `fv-lang-toast-dismissed` only, effects only; `navigator.languages` read once, never stored | `languagePreference.ts`, `LanguageToast.tsx` |
| No cookies, no banner (D-10). **Vercel Web Analytics is wired** (owner decision D5, `698b150`): `startAnalytics(window.location.hostname)` runs once on the client and calls `inject({ mode: 'production' })` only on `fiorevera.hu`, `www.fiorevera.hu` and `*.vercel.app` — never on dev, preview or the test runners; script and beacons are same-origin (`/_vercel/insights/*`). The dashboard switch "Analytics → Enabled" is still an unticked item in the launch plan's fast-lane checklist (A3) | `src/lib/analytics.ts`, `src/entry-client.tsx`, `tests/unit/analytics.test.ts` |
| CSP allows `api.web3forms.com`, `formspree.io`, `va.vercel-scripts.com`, `vitals.vercel-insights.com` — the only hosts the browser may talk to | `vercel.json` |
| `VITE_*` values are inlined into the bundle: public by design. The Web3Forms access key only selects the delivery inbox and cannot be hidden in a static site (Vercel stores it as Config, not Secret); hiding it needs a server-side proxy — a proposal for the day spam appears, not built | `submitInquiry.ts`, `.env.example` |
| Register `version` is still `2026-11-10` although the register was edited on 2026-11-12 and 2026-11-16 — see the version rule in §1 | `docs/gdpr/data-register.json` |

## Processors (who receives visitor data today)

| Processor | Facts | Open |
|---|---|---|
| **Web3Forms** — form delivery, chosen by the owner 2026-11-11 | Free plan: 250 submissions/month, one recipient, 30-day history (not an archive); company in Kerala (India), servers US-East, DPA offered; logs purged after two months (read from web3forms.com 2026-11-10). Payload keys are the mail's field labels; `email` becomes Reply-To | **The privacy page still says "az űrlapszolgáltató" and does not name it** (Art. 13(1)(e)) — needs the three-locale copy GO (R-1) and a `PRIVACY_UPDATED` bump. DPA not yet accepted in the dashboard (owner step). Register `hosts` still call it a "candidate" |
| **Vercel Inc.** — hosting since 2026-11-16 (Hobby), Web Analytics | Serving the site logs IP, user agent and URL → Art. 28 processor. US, certified under the EU-US Data Privacy Framework; its DPA text names Pro and Enterprise customers | **[CONFIRM]** whether a Hobby customer is covered by the DPA. `hosting` entry in the register and `privacy.sections.hosting` are both missing; the HU/DE/EN proposal is in the launch plan §7.4, not in the locale files (R-1) |
| **Gmail** — `info.fiorevera@gmail.com`, where every inquiry ends up | Consumer mailbox, **no DPA** | Owner decision: keep it, or move to Google Workspace / a HU provider (session recommendation: Workspace, after the Rackhost transfer) |
| `formspree.io` | In the CSP and the register as an unused alternative provider; nothing is sent to it | No decision to remove it |

Test sends: a real submission costs quota and lands in the owner's inbox — ask before each one, send only to the owner's inbox, and use a customer address that is not the inbox's own. Never ask for the access key or repeat it in chat; the owner pastes it into the git-ignored `.env.local`; verify by length only (36-character UUID).

## 1. The gate — run on every change in scope

```bash
npm run audit:gdpr   # = tsx .agent/skills/gdpr-guardian/scripts/audit-personal-data.ts
```

Fails on: an `<input|textarea|select name>` not in `formFields`; a storage key (literal or `*_KEY` constant) not in `storage`;
an `import.meta.env.VITE_*` not in `env`; a file with `fetch`/`sendBeacon`/`XMLHttpRequest`/`WebSocket` not in `networkSinks`;
an `https://` host in `src/`, `index.html` or the CSP that is neither a declared processor (`hosts`) nor an `outboundLinks` entry;
`navigator.*` signals not in `browserSignals`; any register entry whose `privacyKey` does not exist in `hu.json`.
**Fix by declaring the sink with a purpose and a privacy key — never by widening the regexes.** If the purpose cannot be
written in one line, the sink should not exist. The script strips comments before matching (`code()`), so a host or key
mentioned only in a comment is not a sink.

**Version rule:** every edit of `docs/gdpr/data-register.json` sets `version` to the date of the edit, in the same commit.
Nothing enforces it yet (a test is a proposal), so check it in review.

**What the gate does not see (verified in the script, 2026-11-16) — review these by hand:**
- It is **not part of `npm test` or either git hook**; it runs only when someone runs it. Run it before every Review Brief in scope and say so.
- Only `https://` hosts are detected: a same-origin or package-injected script (`@vercel/analytics` `inject()` talks to `/_vercel/insights/*`) passes without a `networkSinks` entry; a `<script src>`, `<iframe>` or `<link rel="preconnect">` is caught as a host at best, never as a sink.
- `document.cookie` is checked for presence only, not per cookie name.
- `privacyKey` existence is checked in `hu.json` only (parity with DE/EN comes from the i18n gate).
- It does not check that the privacy page **names** a processor, nor the register's `version`.

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
| Storing e-mail addresses | Stop. Open the concept note, walk the owner through §5 and §6 and the open [CONFIRM] items of §2 — then build. The greetings list is a wish, not a feature (`BACKLOG.md` `[FEATURE]`) |
| Concept or copy proposal | Stays in `docs/` (concept note §7, launch plan §7.4) until the owner's GO: a key in one locale file forces all three through the parity gate. A concept-only brief stays concept-only — say in the first Review Brief what was deliberately not implemented |

## 3. Owner decisions this skill never makes

Provider choice (form, newsletter, mailbox) · analytics on/off · HU register of consent copy (DE = *ihr*, decided) · frequency promise and the
anniversary partial opt-out · retention periods · whether to involve a lawyer.

**Decided:** Web3Forms (2026-11-11) · analytics on (D5, 2026-11-12) · Hobby hosting, risk accepted (D1) · **no lawyer (D8, 2026-11-12)** —
do not re-recommend one in every Review Brief. The [CONFIRM] tags stay as markers of what was never checked, not as blockers.

**Open [CONFIRM] items (unchecked by a lawyer):** Hobby coverage of Vercel's DPA · Grt. § 6 scope for the greetings · DE/AT proof standard
for double opt-in · how long consent proof may be kept · whether the Art. 30 record applies. Session recommendation, not a decision: one paid
hour with a HU data-protection lawyer before the greetings list goes live; the current site ships without it.

**Open owner decisions:** greetings provider and transfer path (recommended: an EU-hosted list tool with a DPA) · mailbox (Gmail vs Workspace) ·
HU te/ti for the greetings copy · frequency ceiling and the anniversary opt-out · R-1 sign-off on the privacy lines for Web3Forms and hosting.

Legal statements are tagged **[INFO]** / **[CONFIRM]** / **[DECISION]** in the concept note and the launch plan; the skill repeats that tagging in every Review Brief.

## Sparring Manifesto (push back, then propose)
- **Veto pre-ticked, bundled or required marketing consent**, and any inquiry flow that fails without the greetings box.
- **Veto reusing the wedding date, phone or message for a new purpose** without its own consent and privacy section.
- **Veto an undeclared sink** (a `fetch`, key, host or field the register does not know), and a privacy page that describes processing the code does not do — or does processing the page does not describe.
- **Veto secrets or API keys in the client bundle** (`VITE_*` is public by design — only public form keys belong there).
- **Veto form-level escaping as a security argument for the inbox**: anyone can mail the inbox directly, so an agent that ever reads it works read-and-draft only, with human approval for outward actions (policy proposed 2026-11-10, not written into `BACKLOG.md` yet).
- **Veto a spreadsheet-plus-BCC mailing list** and open/click tracking without disclosure.
- **Veto "it is only a greeting"** as an argument against Grt. § 6 — every send-out is advertising until a lawyer says otherwise.

## Handshakes
- `i18n-guardian`: three-locale parity for every consent/privacy string; DE addresses the couple as *ihr* (owner decision 2026-11-10), HU te/ti follows the surrounding strings.
- `accessibility-expert`: checkbox has a visible label, `aria-describedby` for helper and error, error `role="alert"`.
- `seo-expert`: CSP hosts in `vercel.json`, no third-party script in the head without this skill's sign-off.
- `qa-specialist`: the audit script runs before the Review Brief (it is not in the hooks); the e2e provider guard (`tests/e2e/fixtures.ts`) keeps tests away from the real inbox. Not built yet: an e2e assertion for the unticked consent default and the exact payload fields.
