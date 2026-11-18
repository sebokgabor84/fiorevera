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

## Architecture facts (verified against the code 2026-11-18)

| Fact | Where |
|---|---|
| One outbound request with personal data: `submitInquiry()` POSTs the seven fields under Hungarian keys (`Név`, `E-mail`, `Telefonszám`, `Esküvő dátuma`, `Helyszín`, `Üzenet`, `Nyelv` — `INQUIRY_MAIL_LABELS`; the keys are the labels of the delivered mail) plus the reserved `replyto` (the visitor's address, sets Reply-To), `subject`, `from_name` ("Fiore Vera weboldal", no personal data) (+ `access_key`); the register's `inquiryPayload` lists exactly these keys to `VITE_FORM_ENDPOINT`; honeypot `website` dropped client-side; no endpoint → `config` error + prefilled `mailto:` | `src/lib/submitInquiry.ts`, `inquiryMailto.ts` |
| Mandatory inquiry consent checkbox (`consent`, `required`, error `contact.form.errors.consent`), label links to the privacy page via `<Trans>` | `InquiryForm.tsx` |
| Privacy page = 5 hardcoded sections `form · hosting · storage · analytics · rights` from `privacy.sections.*` (`form` has a second paragraph `processor`), date from `PRIVACY_UPDATED[locale]` (hand-formatted, D-18; bump it with every change of meaning) | `PrivacyPage.tsx`, `contact.ts` |
| Storage: `fv-lang`, `fv-lang-toast-dismissed` only, effects only; `navigator.languages` read once, never stored | `languagePreference.ts`, `LanguageToast.tsx` |
| No cookies, no banner (D-10). **Vercel Web Analytics is wired** (owner decision D5, `698b150`): `startAnalytics(window.location.hostname)` runs once on the client and calls `inject({ mode: 'production' })` only on `fiorevera.hu`, `www.fiorevera.hu` and `*.vercel.app` — never on dev, preview or the test runners; script and beacons are same-origin (`/_vercel/insights/*`). The dashboard switch "Analytics → Enabled" is still an unticked item in the launch plan's fast-lane checklist (A3) | `src/lib/analytics.ts`, `src/entry-client.tsx`, `tests/unit/analytics.test.ts` |
| CSP allows `api.web3forms.com`, `formspree.io`, `va.vercel-scripts.com` — the only hosts the browser may talk to. The Speed Insights host `vitals.vercel-insights.com` was removed on 2026-11-18 (owner decision; unused): add it back, with a register entry, in the change that switches Speed Insights on | `vercel.json` |
| `VITE_*` values are inlined into the bundle: public by design. The Web3Forms access key only selects the delivery inbox and cannot be hidden in a static site (Vercel stores it as Config, not Secret); hiding it needs a server-side proxy — a proposal for the day spam appears, not built | `submitInquiry.ts`, `.env.example` |
| Register `version` is the date of its last change, stamped by `npm run audit:gdpr -- --seal` together with the fingerprint in `data-register.seal.json` (2026-11-18 after the site-polish changes) | `docs/gdpr/data-register.json` |

## Processors (who receives visitor data today)

| Processor | Facts | Open |
|---|---|---|
| **Web3Forms** — form delivery, chosen by the owner 2026-11-11 | Operated by Web3Creative (India). Free plan: 250 submissions/month, one recipient, 30-day dashboard history (not an archive). DPA v1.0 (2026-07-13) is part of its Terms; EEA transfers under SCC 2021/914; sub-processors AWS, Cloudflare, Hetzner (EU), CleanTalk and Akismet (US, spam check on IP + e-mail); submissions kept up to 3 years on its side. Read on web3forms.com/privacy and /dpa on 2026-11-16 — the earlier "Kerala, US-East, logs purged after two months" is no longer on its pages; **re-read before changing the copy** (the pages answer 403 to plain fetches, open them in a browser). Payload keys are the mail's field labels (Hungarian since 2026-11-18); the visitor's address travels as `replyto` | Named on the privacy page since 2026-11-16 (`privacy.sections.form.processor`). DPA accepted by the owner in the dashboard 2026-11-18. Nothing open |
| **Vercel Inc.** (Covina, CA) — hosting since 2026-11-16 (Hobby), Web Analytics | Serving the site logs IP, user agent and URL → Art. 28 processor. Listed as Active under the EU-U.S. Data Privacy Framework (dataprivacyframework.gov, checked 2026-11-16); logs visible to the owner 1 hour on Hobby (1 day on Pro). Its DPA names Pro and Enterprise customers only | `privacy.sections.hosting` and the register's `hosting` entry exist since 2026-11-16; the page **does not claim a DPA** and does not name a city. Open owner decision: Hobby without a written processor contract (`docs/gdpr/processing-record.md`) |
| **Gmail** — `info.fiorevera@gmail.com`, where every inquiry ends up | Consumer mailbox, **no DPA** | Owner decision: keep it, or move to Google Workspace / a HU provider (session recommendation: Workspace, after the Rackhost transfer) |
| `formspree.io` | In the CSP and the register as an unused alternative provider; nothing is sent to it | No decision to remove it |

Art. 30 record of processing: `docs/gdpr/processing-record.md` — read by the owner 2026-11-18; four points there still need his explicit answer (mailbox retention rule, Gmail without a DPA, Vercel Hobby without a processor contract, two-step verification).

Test sends: a real submission costs quota and lands in the owner's inbox — ask before each one, send only to the owner's inbox, and use a customer address that is not the inbox's own. Never ask for the access key or repeat it in chat; the owner pastes it into the git-ignored `.env.local`; verify by length only (36-character UUID).

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
written in one line, the sink should not exist. The script strips comments before matching (`code()`), so a host or key
mentioned only in a comment is not a sink.

**Version rule:** every edit of `docs/gdpr/data-register.json` sets `version` to the date of the edit, in the same commit.
Enforced since 2026-11-18: `npm run audit:gdpr -- --seal` stamps the date and writes `docs/gdpr/data-register.seal.json`; `tests/unit/gdpr.test.ts` fails on a register change without a new seal.

**What the gate does not see (verified in the script, 2026-11-16) — review these by hand:**
- It runs inside `npm test` (`tests/unit/gdpr.test.ts`) and therefore in the pre-push hook; still say in the Review Brief that the slice touched visitor data.
- An iframe, an external `<script src>`, a `<link rel="preconnect">`, a web font and a cookie write are caught since 2026-11-18 (see the cases in `tests/unit/gdpr.test.ts`). Still invisible: a same-origin or package-injected script (`@vercel/analytics` `inject()` talks to `/_vercel/insights/*`) passes without a `networkSinks` entry.
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
HU te/ti for the greetings copy · frequency ceiling and the anniversary opt-out · the four open points of the processing record. (The privacy lines for Web3Forms and hosting shipped with the owner's approval of the privacy screens, 2026-11-16/18.)

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
- `qa-specialist`: the audit runs inside `npm test`; e2e asserts the unticked consent box in all three locales, that nothing is sent without consent, and the payload keys (`tests/e2e/contact.spec.ts`).
