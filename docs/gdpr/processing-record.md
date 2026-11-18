# Record of processing activities (GDPR Art. 30) — fiorevera.hu

> **Status: read by the owner on 2026-11-18** (reported as done in the site-polish review); the points at the end that are still open are marked. Prepared by `gdpr-guardian` on 2026-11-16 from the code and
> `docs/gdpr/data-register.json` (version 2026-11-18). Not legal advice: the owner decided on 2026-11-12 (launch plan D8)
> that no lawyer is involved, so the `[CONFIRM]` marks show what nobody with legal training has checked.
> The under-250-employees exemption of Art. 30(5) probably does not apply, because answering inquiries is not occasional
> processing `[CONFIRM]` — hence this page. Keep it with the business papers; the authority (NAIH) may ask for it.

| | |
|---|---|
| **Controller** | Sebőkné Antalics Veronika (Fiore Vera), 8749 Zalakaros, Rózsa utca 53., Hungary · info.fiorevera@gmail.com · +36 30 865 9108 |
| **Data protection officer** | none appointed (not required for this scale of processing `[CONFIRM]`) |
| **Record last reviewed** | 2026-11-18, read by the owner — *signature on the printed copy: ______________________* |

## Processing activities

| # | Activity and purpose | Data subjects | Personal data | Lawful basis | Recipients (processors) | Transfer outside the EEA | Retention |
|---|---|---|---|---|---|---|---|
| 1 | **Quote requests through the contact form** — answering the inquiry, preparing the quote | couples and other visitors who send the form | name, e-mail address, phone number (optional), wedding date, venue, free-text message, page language; IP address and time recorded by the form provider | consent, Art. 6(1)(a) — mandatory, unticked checkbox with a link to the privacy notice; withdrawable at any time | **Web3Forms**, operated by Web3Creative (India) — form delivery, processor under its DPA v1.0 (2026-07-13); its sub-processors AWS, Cloudflare, Hetzner (EU), CleanTalk and Akismet (US, spam check on IP + e-mail). **Google** (Gmail mailbox info.fiorevera@gmail.com) | India and the US: EU Standard Contractual Clauses (2021/914) incorporated in the Web3Forms DPA. Gmail: consumer account, no DPA available `[CONFIRM]` — open decision: Google Workspace or a Hungarian mailbox | mailbox: until the quote expires, with an order until the contract is closed `[CONFIRM the concrete period, e.g. 1 year after the wedding]`; Web3Forms: up to 3 years on its servers (30 days visible in its dashboard on the free plan) |
| 2 | **Quote requests by e-mail or phone** (mailto links, `tel:` links, the prefilled mail fallback of the form) — same purpose | as in 1 | whatever the sender writes or says; sender address / phone number | steps prior to a contract at the request of the person, Art. 6(1)(b) `[CONFIRM]` | Google (Gmail); the phone operator | as in 1 for Gmail | as in 1 for the mailbox |
| 3 | **Serving the website** — delivering pages, keeping the site secure and available | every visitor | IP address, user agent, requested URL, time (server and CDN logs) | legitimate interest in a working, secure site, Art. 6(1)(f) `[CONFIRM]` | **Vercel Inc.** (Covina, CA, USA) — hosting and CDN | USA: Vercel Inc. is listed as *Active* under the EU-U.S. Data Privacy Framework (dataprivacyframework.gov, checked 2026-11-16). Vercel's DPA names Pro and Enterprise plans; the site runs on Hobby, so there is no written processor contract `[CONFIRM]` — closing this gap means upgrading to Pro | logs visible to the owner: 1 hour (Hobby); Vercel's own retention is not published per plan |
| 4 | **Visitor statistics** (Vercel Web Analytics) — counting page views without identifying anyone | every visitor on fiorevera.hu | page URL, referrer, coarse location (country), device and browser type, time; a daily-discarded hash of the request instead of an identifier; no cookie | legitimate interest in knowing which pages are used, Art. 6(1)(f); cookieless, so no consent banner (PRD D-10) `[CONFIRM]` | Vercel Inc. | as in 3 | aggregated statistics; one month of history on Hobby |
| 5 | **Language preference** — not asking again for the language | visitors who switch language or dismiss the language hint | two `localStorage` entries on the visitor's own device (`fv-lang`, `fv-lang-toast-dismissed`); the browser language is read once and neither stored nor sent | no personal data leaves the device; strictly a user-chosen preference (ePrivacy exemption) | none | none | until the visitor clears the browser data |

## Security measures (Art. 32, short form)

- The site is static: no database, no user accounts, no server-side code of its own. Form data exists only in transit and in the two places named above.
- HTTPS everywhere (certificates by Vercel); a Content-Security-Policy that lets the browser talk only to the declared hosts (`vercel.json`); a honeypot field and the provider's spam filter instead of tracking-based bot detection.
- The Gmail account is protected by two-step verification — **owner to confirm that it is switched on.**
- Every place where the code collects, stores or sends visitor data is declared in `docs/gdpr/data-register.json`; `npm run audit:gdpr` fails on an undeclared one.

## Data subject requests

Requests for access, correction, deletion or withdrawal of consent arrive at info.fiorevera@gmail.com. To fulfil a deletion:
delete the thread in Gmail (and from the bin), and delete the submission in the Web3Forms dashboard if it is still listed there.
Answer within one month. Complaints: Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), naih.hu.

## What the owner has to confirm or decide

Read on 2026-11-18. Points 1, 2, 4 and 5 still need an explicit answer; point 3 is done.

1. The table above describes what really happens (in particular: nobody else reads the mailbox; nothing is copied into a spreadsheet or a phone contact list that outlives the quote).
2. The retention period for inquiries in the mailbox, as a concrete rule, and that old threads are actually deleted.
3. ~~Web3Forms: open the dashboard once and accept the DPA if it is presented.~~ **Done by the owner on 2026-11-18.**
4. Gmail without a DPA: keep, or move to Google Workspace / a Hungarian provider (recommended after the Rackhost transfer).
5. Vercel Hobby without a written processor contract: accept, or upgrade to Pro.
6. Not yet in this record on purpose: the opt-in greetings list (`docs/gdpr/newsletter-consent-concept.md`) — add a row before it goes live.
