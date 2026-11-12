# fiorevera.hu — domain move to Rackhost and launch on Vercel

> **Status:** plan, 2026-11-12; owner decisions D1–D8 recorded the same day (§8). Nothing in this document has been executed. Traces to `MASTER-PLAN.md` Phase 4 (4.1–4.5), PRD D-10, D-15, D-16, D-18, R-7.
> **This is not legal advice.** The author is a build assistant, not a lawyer. Tags as in `docs/gdpr/`: **[INFO]** = taken from the cited source, **[CONFIRM]** = a lawyer, accountant or the provider's support should confirm, **[DECISION]** = the owner decides.
> Every policy statement below links to the page it was read from on 2026-11-12. Pages change; re-check the Vercel fair-use page and the Rackhost price list on the day you act.

---

## 0. The owner's question: "can I get into trouble with this approach?"

**Short answer: not with the domain move, yes with the free Vercel plan, and the trouble is operational, not legal.**

| Part of the approach | Risk | Verdict |
|---|---|---|
| Moving `fiorevera.hu` from Webnode's registrar to Rackhost | None if the domain is active and the registrant data is Vera's. The .hu registry (ISZT) has a documented registrar-change procedure; you keep the domain, the expiry extends by a year. The real risk is a stalled transfer or a lost confirmation e-mail, both recoverable. | **Safe.** Do it first, before anything else. |
| Hosting the business site on the Vercel **Hobby** (free) plan | Vercel's own fair-use page restricts Hobby teams to "non-commercial personal use only" and lists "advertising the sale of a product or service" as commercial use. A wedding-decoration company's site exists to sell a service. Vercel's terms let it disable the project "with or without notice". Its knowledge base names commercial use on Hobby as a frequent trigger for pauses. | **A breach of Vercel's terms.** The consequence is the site going dark (HTTP 503 `DEPLOYMENT_PAUSED`), not a fine or a lawsuit. **Recommendation: launch on Pro.** |
| Vercel as a US company hosting an EU site | Vercel is certified under the EU-US Data Privacy Framework and offers a DPA with Standard Contractual Clauses, but the DPA text names Pro and Enterprise customers. Hosting logs IP addresses, so Vercel is a processor. | **Manageable on Pro**, questionable on Hobby. See §7. |
| SEO | Same URLs, same `www` host, faster site, prerendered HTML, two 301s only. Google's own guide for a hosting change expects a short crawl-rate dip and recovery within days. | **Low risk** if the runbook in §6 is followed (Search Console Domain property verified *before* the cutover). |

What "trouble" is **not** on the table: nobody fines a Hungarian sole trader for using a US host; the domain cannot be taken by Webnode (its terms say the user is the lawful owner); the legacy site stays live as rollback until DNS is verified.

The honest recommendation, in one line: **transfer the domain to Rackhost now, launch on Vercel Pro ($20 per month plus VAT), keep Webnode for 30 days, cancel it.** If the owner decides to launch on Hobby anyway, §1.4 says what that means and how to make the fall-back fast.

---

## 1. Vercel plan: Hobby vs Pro

### 1.1 What the terms say [INFO]

- Fair-use guidelines, "Commercial usage": *Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan.* Commercial usage is "any Deployment that is used for the purpose of financial gain of anyone involved in any part of the production of the project", with the examples: requesting or processing payment from visitors; **advertising the sale of a product or service**; receiving payment to create, update or host the site; affiliate linking as the primary purpose; advertisements. Asking for donations is not commercial. "If you are unsure ... contact the Vercel Support team." — [vercel.com/docs/limits/fair-use-guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- Hobby plan page: "the Hobby plan restricts users to non-commercial, personal use only." — [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby)
- Terms of Service §4: Hobby is for "your personal or non-commercial use"; Vercel may "disable or remove any Project or website deployment on the Hobby plan with or without notice" and may change or discontinue the plan. — [vercel.com/legal/terms](https://vercel.com/legal/terms)

**Does fiorevera.hu fall under it?** Yes. The site's purpose (PRD §1) is to "turn visitors into quote requests" for a paid service; the rental page lists HUF prices. That is "advertising the sale of a product or service" on the page's own list. That Gabor builds it unpaid does not change the site's purpose. There is no reading of the text under which a company website is personal use.

### 1.2 What Vercel actually enforces [INFO]

- The fair-use page: "We will notify you if your usage is an outlier ... Where possible, we'll reach out before taking action."
- The pause knowledge-base article: Vercel's team may pause an account or deployment for policy reasons; "commercial use on a Hobby plan is a frequent trigger"; a paused production deployment answers `503 DEPLOYMENT_PAUSED`; the notice e-mail carries the steps to resolve it; there is no self-service resume for a policy pause. — [vercel.com/kb/guide/why-is-my-account-deployment-blocked](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked)

So in practice: small brochure sites on Hobby mostly run unnoticed, and when Vercel acts, the usual outcome is an e-mail and a pause until you upgrade. The risk is therefore **a business site going offline without warning, possibly on a Saturday in wedding season, with the fix depending on an e-mail reaching Gabor and a card being entered**. There is no evidence of anything worse (no fines, no account bans for first offences in the sources read), but Vercel reserves "without notice".

### 1.3 Cost and what Pro changes [INFO]

| | Hobby | Pro |
|---|---|---|
| Price | $0 | **$20 per month** per Developer seat, Viewer seats free, VAT added per billing address ([vercel.com/pricing](https://vercel.com/pricing), [docs/plans/hobby](https://vercel.com/docs/plans/hobby)) |
| Commercial use | not allowed | allowed |
| Fast Data Transfer | 100 GB / month, then paused for 30 days | 1 TB / month included, overage from $0.15/GB |
| Web Analytics | 50,000 events / month, 1 month of data, collection pauses after the grace period (resume after 7 days) | on-demand events, longer history |
| Runtime logs | 1 hour | 1 day |
| E-mail support | none | yes |
| DPA | text names Pro/Enterprise (§7) | covered |
| Preview sharing | Vercel Authentication + Shareable Links | same + password protection ($20/project) |

Fiore Vera's traffic will not come near the Hobby limits (the whole prerendered site plus images is a few MB per visit); the plan question is purely about the commercial clause and the DPA.

One seat is enough: Gabor is the Developer, Vera can be a free Viewer. **[CONFIRM] with the accountant:** whether the Vercel invoice should go to the business (Sebőkné Antalics Veronika e.v.) for deductibility, and how VAT is handled on a US-issued invoice for a Hungarian sole trader.

### 1.4 If the owner still launches on Hobby [DECISION]

**Decided 2026-11-12 (D1): launch on Hobby, with close monitoring of the Vercel e-mail and of the site over the following weeks and months.** This paragraph is the written acceptance of the risk in §1.1–1.2. Make the fall-back fast:

1. Keep the Vercel account's e-mail on an inbox that is read daily (the pause notice goes there).
2. Keep a card on file and know the upgrade path: Settings → Billing → Upgrade (minutes). An upgrade mid-pause is the documented resolution.
3. Keep Webnode alive until the decision is final; a paused Vercel site can be rolled back by DNS within the TTL (§3).
4. Re-read the fair-use page every few months; Vercel changed it on 2026-09-14.
5. Monitoring that does not depend on anyone opening the site by hand: Vercel's own notifications on (Account → Notifications: deployment, domain and usage e-mails), plus a free external uptime check that requests `https://www.fiorevera.hu/` every few minutes and e-mails both Gabor and Vera on a non-200 answer. A `503 DEPLOYMENT_PAUSED` from Vercel is exactly what such a check catches; a DNS failure at Rackhost too. Add the monitor on cutover day (runbook R7).
6. If Vercel pauses the site: upgrade the team to Pro (§1.3; one seat, both of Gabor's sites, no doubling — see D2) and reply to the notice. No other fall-back is needed while Webnode is alive; after R10 the upgrade is the only fall-back, which is fine.

Alternative free hosts whose free tiers permit commercial sites exist, but they were **not** researched for this plan (out of scope: PRD D-15 fixes Vercel). If the owner wants "free and compliant", that is a separate research task, not a quiet switch.

---

## 2. The domain: who holds it and how it moves to Rackhost

### 2.1 Facts verified from the live DNS on 2026-11-12

```
whois.nic.hu     fiorevera.hu   record created: 2021-11-08
NS               ns1.register.it, ns2.register.it            (SOA hostmaster.register.it)
A   @            3.125.172.46, 3.73.27.108                   TTL 3600
CNAME www        fiorevera-hu.webnode.hu → projects-lb.webnode.io   TTL 3600 / 360 / 60
MX               10 imap.mail.webnode.com.
TXT              "v=spf1 a mx include:spfuser.webnode.com -all"
HTTPS            https://fiorevera.hu/ → 301 → https://www.fiorevera.hu/ (server: webnode)
```

What this tells us:

- The **DNS is run by Register.it** (an Italian registrar; Webnode and Register.it are both team.blue brands — [press.team.blue](https://press.team.blue/193649-website-builder-webnode-becomes-part-of-team-blue)). That is consistent with the domain having been registered **through Webnode** when the site was built in November 2021. Webnode's own policy says a Webnode domain is tied to a Webnode project ([webnode.helpjuice.com/domain-names-policies](https://webnode.helpjuice.com/domain-names-policies)).
- The registry's public WHOIS no longer shows the registrar or registrant. **Owner action:** open [domain.hu/domain-kereses/](https://www.domain.hu/domain-kereses/), use the *részletes keresés* (advanced search) on the home page for `fiorevera.hu`, and note three things: the **registrant** (should be Vera or the business, not a Webnode proxy), the **registrar** (expected: Webnode's partner), and whether the status is active. Also log in to Webnode → Administration → Domain management and note the **expiry date** and whether auto-renewal is on. The record was created on 8 November, so the renewal anniversary was **four days ago**; confirm it renewed. A .hu transfer can only be started on an active domain ([Rackhost](https://www.rackhost.hu/tudasbazis/domain/hu-domain-atregisztracioja-masik-regisztratortol/)).
- The MX record points at Webnode's mail service. §4 decides what to do with it.

### 2.2 The .hu registrar-change procedure [INFO]

Source: ISZT Domain Registration Policy §3.7 and the Domain Transfer page ([domain.hu/domain-transfer/](https://www.domain.hu/domain-transfer/), [domain.hu/domain-registration-policy/](https://www.domain.hu/domain-registration-policy/)), plus Rackhost's step list ([rackhost.hu/tudasbazis/.../hu-domain-atregisztracioja-masik-regisztratortol](https://www.rackhost.hu/tudasbazis/domain/hu-domain-atregisztracioja-masik-regisztratortol/)).

1. **The registrant asks the current registrar for the Domain Authorization Code.** The registrar identifies the registrant and files the request; the registry sends an e-mail from `confirmation@domain.hu` to the registrant's registered address to confirm the request (that first code is only a security code). After confirmation the real auth code arrives: 4 groups of 4 characters. If the registrar's request fails, the registrant can obtain the code directly at `start.domain.hu` after identification.
   - For a Webnode-registered domain this means **writing to Webnode support from the project owner's e-mail address** via [webnode.com/support/transfer-domain-away/](https://www.webnode.com/support/transfer-domain-away/). If Webnode's privacy protection is on, include the owner details Webnode lists (name, address, date of birth, phone, e-mail) so Webnode first sets Vera as the registrant, then generates the code.
   - Domains registered before the 2025 policy change may be "document-protected"; then the registrant signs a short document (Policy §3.3.1) to move to factor-based authentication instead of a code. Rackhost or Webnode will say which case applies ([Rackhost on the 2025 change](https://www.rackhost.hu/tudasbazis/domain/domainregisztracios-szabalyzat-valtozasa/)).
2. **Order the transfer at Rackhost:** domain search → *átregisztráció* → cart → billing profile. Enter the **current** registrant data exactly; different data turns it into an ownership change (extra fee, 30-day lock afterwards).
3. **Confirm the e-mail address** Rackhost sends (30-day window).
4. **Pay** the registrar-change fee including one year of renewal: **4,400 HUF net / 5,588 HUF gross**; renewals afterwards 2,900 net / 3,683 gross per year ([rackhost.hu/domain-tld/hu](https://www.rackhost.hu/domain-tld/hu), prices read 2026-11-12).
5. **Enter the auth code** under *Tennivalók → Auth kód megadása*.
6. After the transfer the expiry extends by one year; the anniversary date stays. For **30 days after a transfer no further transfer or trade** can be started (Policy §3.7.1). A registry lock, if any, must be lifted first.

**Duration [INFO/estimate]:** the registry side is e-mail-confirmation based and fast; the slow part is Webnode support generating the code. Plan **one to two weeks** end to end and do it *before* the launch week, not during it. No ICANN 60-day lock applies (.hu is a ccTLD with its own policy); the domain is five years old, so no new-registration lock either.

**What happens to Webnode [INFO]:** once the domain leaves, Webnode deletes it from its system; the site stays reachable only on its `*.webnode.hu` project address; **any Webnode e-mail mailboxes on the domain are permanently deleted**. The Premium subscription is separate: it keeps running until cancelled through support ([webnode.com/support/payments-and-invoices-faq/](https://www.webnode.com/support/payments-and-invoices-faq/)); after expiry Premium features are blocked for 30 days, then the project reverts to the free tier and over-quota content is deleted. Completed domain registrations and transfers are non-refundable; the 15-day money-back guarantee applies only to a first Premium purchase. **[DECISION]** whether to let the plan run out or cancel it right after the 30-day rollback window (MASTER-PLAN 4.5).

### 2.3 Why transfer first, DNS later (and not the other way round)

Webnode does let you edit A and CNAME records of a Webnode-managed domain (Administration → Domain management → Manage DNS; [webnode.com/support/setting-up-dns-records/](https://www.webnode.com/support/setting-up-dns-records/)), so pointing the domain at Vercel *before* transferring is technically possible. It is the worse order:

- Webnode's DNS editor exposes no TTL field in its guide, so the one-hour TTL cannot be shortened for a fast rollback.
- The zone is deleted when the domain leaves Webnode, so the cutover would have to be done twice.
- The Webnode subscription and the domain would stay coupled during the most sensitive weeks.

Rackhost's "transfer without downtime" recipe does the right thing: recreate the current records in a Rackhost zone, switch the nameservers to `ns1.dns24.hu` … `ns4.dns24.hu` while the site is still Webnode, and only then (§3) repoint to Vercel from one panel with a short TTL.

---

## 3. DNS at Rackhost → Vercel

### 3.1 Canonical host

The code fixes `SITE_URL = 'https://www.fiorevera.hu'` (`src/data/routes.ts`); canonical tags, hreflang, sitemap and JSON-LD all carry `www`. The legacy site already 301s apex → www. **Keep `www` canonical.** Vercel recommends exactly that: www as primary (a CNAME the CDN can steer), apex redirected to it ([deploying-and-redirecting](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)).

### 3.2 Records (values come from the Vercel dashboard, not from this document) [INFO]

Vercel assigns the A-record IP **per project** ("many projects show `76.76.21.21`, newer projects can show an address such as `216.198.79.1`"); the `www` CNAME target is also project-specific (`<id>.vercel-dns-0xx.com.`). Copying a value from a guide leaves the domain in "DNS Change Required". Read both from **Project → Settings → Domains** after adding `www.fiorevera.hu` and `fiorevera.hu` ([troubleshooting#working-with-apex-domain](https://vercel.com/docs/domains/troubleshooting#working-with-apex-domain), [add-a-domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)).

Target zone at Rackhost (*DNS zónák → Rekordok szerkesztése*; [Rackhost guide](https://www.rackhost.hu/tudasbazis/domain/hogyan-allithatom-be-a-domainhez-tartozo-rekordokat/)):

| Type | Name | Value | TTL | Note |
|---|---|---|---|---|
| A | `@` (empty) | *IP shown by Vercel for `fiorevera.hu`* | 300 → 3600 after verification | remove the two Webnode A records; no AAAA (Vercel has no IPv6) |
| CNAME | `www` | *target shown by Vercel for `www.fiorevera.hu`*, with the trailing dot | 300 → 3600 | replaces the `fiorevera-hu.webnode.hu` CNAME |
| TXT | `@` | `google-site-verification=…` | 3600 | Search Console Domain property (§5) — add *before* cutover |
| MX / TXT (SPF) | `@` | see §4 | 3600 | decided in §4 |
| CAA | — | none needed | | no CAA today; Vercel needs Let's Encrypt allowed only if a CAA policy exists |

In Vercel: add both domains, mark **`www.fiorevera.hu` as primary** and set `fiorevera.hu` → *Redirect to* `www.fiorevera.hu`. (Vercel attempts the www/non-www redirect automatically but recommends setting it explicitly.) Preview and production: `vercel.json` already has `trailingSlash: true`, the four 301s and the headers; nothing in it depends on the DNS provider.

### 3.3 TTL plan [INFO]

Today both records carry a 3600 s TTL. Vercel: shorten to 60 s "about 24 hours in advance", switch, then raise again once stable ([working-with-dns](https://vercel.com/docs/domains/working-with-dns), [troubleshooting](https://vercel.com/docs/domains/troubleshooting#dns-record-propagation-times)). Google: lower the TTL "at least a week before the move" ([Google site move, no URL change](https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes)). Rackhost's guides default to 3600 and accept lower values. Plan: 300 s one week before, cutover, back to 3600 after the 48-hour watch. Nameserver changes (the Rackhost step) can take 24–48 h to settle worldwide; A/CNAME changes follow the TTL.

### 3.4 HTTPS [INFO]

Vercel issues a Let's Encrypt certificate automatically for every domain added to the project, via the HTTP-01 challenge, as soon as the DNS points at Vercel; renewal is automatic 14–30 days before expiry; `/.well-known/acme-challenge` must not be redirected (it is not: `vercel.json` has no catch-all) ([working-with-ssl](https://vercel.com/docs/domains/working-with-ssl)). Expect a few minutes between DNS propagation and a valid certificate; during that window a visitor may see a certificate warning. Cut over at a low-traffic hour (a weekday morning, outside the Friday–Sunday wedding window). HTTP → HTTPS redirect is Vercel's default.

---

## 4. E-mail: nothing should depend on domain mail — verify it

Facts: the business address is `info.fiorevera@gmail.com` (PRD, contact data, privacy page, Web3Forms target). The DNS nevertheless carries `MX 10 imap.mail.webnode.com` and an SPF record that authorises Webnode to send as `@fiorevera.hu`. These are Webnode's defaults for a hosted domain.

**Owner check before the transfer [DECISION]:** in Webnode → E-mail / Mailboxes, confirm that **no `…@fiorevera.hu` mailbox or forwarder exists**, and that nothing (Instagram login, Facebook page, Google Business Profile, bank, NAV, supplier accounts) is registered with an `@fiorevera.hu` address. Webnode deletes mailboxes irrecoverably at transfer-out; if one exists, export it and change the registered address *first*.

Records at Rackhost, assuming no domain mail (recommended):

| Type | Name | Value | Why |
|---|---|---|---|
| MX | `@` | `0 .` (null MX, RFC 7505) | tells the world the domain receives no mail; bounces instead of timeouts |
| TXT | `@` | `v=spf1 -all` | nobody may send as `@fiorevera.hu`; blocks spoofing of the brand |
| TXT | `_dmarc` | `v=DMARC1; p=reject;` | same, for DMARC-checking receivers (optional, cheap) |

Do **not** copy the Webnode MX/SPF into the Rackhost zone unless a mailbox is confirmed in use. If Vera ever wants `info@fiorevera.hu`, Rackhost sells mailboxes and the MX simply changes then; Vercel provides no mail service.

---

## 5. SEO continuity

Google classifies this as a **site move without URL changes** (same host `www.fiorevera.hu`, same paths): prepare the new host, verify Googlebot can reach it, lower the TTL a week ahead, switch DNS, watch Index Coverage; expect a temporary drop in crawl rate and recovery over the following days, no change-of-address needed ([Google](https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes)).

1. **Search Console before the cutover.** The legacy property is probably a URL-prefix property verified by Webnode's HTML tag; that verification dies with the Webnode HTML. Create a **Domain property** `fiorevera.hu` verified by DNS TXT ([Google verification](https://support.google.com/webmasters/answer/9008080)); add the TXT in Webnode's DNS editor now (or in the Rackhost zone once nameservers moved) and **keep it forever**: Google re-checks and revokes after a grace period if it disappears. The Domain property covers http/https, www and apex, all three locales.
2. **Export the legacy data** (Performance → Export, 16 months) before 4.3. MASTER-PLAN 4.4 already requires this; it is the only way to measure the "ranking wobble".
3. **Sitemap:** after cutover submit `https://www.fiorevera.hu/sitemap.xml` in the Domain property (the build writes hreflang alternates for all 21 routes). Remove nothing from the old property; it simply stops verifying.
4. **The two 301s** (`/viragoskert/`, `/de/blumengarten/`) are in `vercel.json`; verify with `curl -I` after cutover (4.3 DoD). Every other legacy HU/DE slug is served 200 by the new route set (`src/data/routes.ts` keeps them).
5. **Legacy image URLs** (`…clvaw-cdnwnd.com/…jpg`, 169 gallery + 24 page images in `references/legacy/manifest.json`) are on Webnode's CDN, not on a host the owner controls, so Search Console's Removals tool does not apply to them ([Google remove-information](https://developers.google.com/search/docs/crawling-indexing/remove-information)). They drop out of Google Images on their own once the Webnode project is deleted and the URLs 404 (weeks to months). Nothing on the new site links to them (data references slots, never CDN filenames — PRD D-5), so no action; optionally use Google's "Refresh outdated content" request once the URLs really 404. The new `/assets/**.webp` files are picked up with the pages.
6. **Expected wobble [INFO/estimate]:** days of reduced crawl, no ranking cliff for same-URL moves per Google's guide; the prerendered HTML, faster LCP and correct hreflang are net positives. Check the hreflang and Index Coverage reports at day 7 and day 30 (4.4). Watch for one self-inflicted risk: a `noindex` or Deployment Protection left on the production deployment. Vercel Authentication protects *preview* deployments by default; confirm production is public on the first deploy.
7. **Not-found behaviour:** unknown URLs must answer **HTTP 404** with `dist/404.html` (BACKLOG `[LAUNCH]` item, QA M2); verify on the first preview before DNS moves.

---

## 6. Cutover runbook

### 6.1 Order and timing

| Step | When | Who | Rollback |
|---|---|---|---|
| **R0** Owner checks: domain.hu registrant/registrar/status, Webnode expiry + auto-renew, mailboxes, who owns the Vercel account | now | Gabor + Vera | — |
| **R1** Vercel project (4.1): import the GitHub repo, production branch `main`, env vars `VITE_FORM_ENDPOINT` + `VITE_FORM_ACCESS_KEY` (Production + Preview), **plan: Pro** (§1), enable Web Analytics only if §7.3 says so | week 0 | Gabor | delete project |
| **R2** Preview sign-off (4.2): Vera on her phone via a Shareable Link, all three locales; 404 check; both 301s with `curl -I` on the `*.vercel.app` URL | week 0 | Vera | — |
| **R3** Domain transfer to Rackhost (§2.2): auth code from Webnode, order, pay, zone recreated **with the current Webnode records**, nameservers → `ns1–4.dns24.hu` | week 0–2 | Gabor (from Vera's Webnode login) | nameservers back to Register.it until the transfer completes |
| **R4** Pre-cutover DNS: Search Console TXT, TTL 300 on `@` and `www` | ≥ 1 week before R6 | Gabor | — |
| **R5** Add `fiorevera.hu` + `www.fiorevera.hu` to the Vercel project, www primary, apex redirect; read the project-specific A/CNAME values | day before R6 | Gabor | remove domains |
| **R6 Cutover** (4.3): replace A `@` and CNAME `www` at Rackhost with the Vercel values; delete Webnode A/CNAME; MX/SPF per §4 | weekday morning, outside wedding days | Gabor | **put the Webnode A/CNAME back** (5 min + 300 s TTL); Webnode is untouched and still serving |
| **R7** Verify (4.3 DoD): `dig +short A fiorevera.hu`, `dig +short CNAME www.fiorevera.hu`, `curl -IL https://fiorevera.hu/` ends at `https://www.fiorevera.hu/` with a valid certificate, `curl -I` on every URL in `references/legacy/manifest.json` → 200 or the two 301s, unknown URL → 404, form submission from the live site reaches the inbox, [whatsmydns.net](https://www.whatsmydns.net) green; **external uptime monitor on `https://www.fiorevera.hu/` with e-mail alerts to Gabor and Vera (D1 monitoring)** | within 1 h of R6, again at 24 h | Gabor | as R6 |
| **R8** Search Console (4.4): submit sitemap, URL Inspection on the HU/DE/EN home, hreflang report at day 7, compare top queries at day 30 | day 0 / 7 / 30 | Gabor | — |
| **R9** TTL back to 3600; privacy page hosting line live (§7.4) | day 2 | Gabor | — |
| **R10** Retire Webnode (4.5): auto-renewal off right after R7 is green; the plan runs out on its own (D6); confirm `references/legacy/` archive complete; README status → shipped | day 30 or plan expiry | Vera (account holder) | none needed, domain already at Rackhost |

### 6.2 Pre-launch checklist (maps to MASTER-PLAN 4.x)

- [ ] 4.1 Vercel project created on Hobby (risk accepted 2026-11-12, §1.4), Vercel notification e-mails on, env vars set, first production deploy green, `vercel.json` 301s verified with `curl`, unknown URL → 404
- [ ] 4.1 Web Analytics wired (`inject()` in `src/entry-client.tsx`, enabled in the dashboard) — D5
- [ ] 4.2 Vera signed off all three locales on the preview URL on her phone (US-12)
- [ ] 4.3 Domain at Rackhost, registrant = Vera, Webnode records recreated, nameservers settled (`dig NS`)
- [ ] 4.3 Mailbox check done; MX/SPF decision applied (§4)
- [ ] 4.3 Search Console Domain property verified by DNS TXT; legacy Performance export saved
- [ ] 4.3 TTL at 300 for ≥ 24 h (Vercel) / 1 week (Google)
- [ ] 4.3 Cutover done on a weekday morning; R7 verification green at 1 h and 24 h; HTTPS valid on apex and www
- [ ] 4.4 Sitemap submitted; hreflang report clean at day 7
- [ ] 4.5 Webnode auto-renewal off, plan left to expire (D6); README "Status" → shipped once the 30-day rollback window (or the plan's expiry, whichever is earlier) has passed
- [ ] GDPR (§7): privacy page names Vercel as host, transfer mechanism stated, data register updated, `npm run audit:gdpr` green

---

## 7. GDPR touchpoints → `gdpr-guardian`

Hand these to the `gdpr-guardian` skill; they are listed here so the launch plan is complete, not to pre-empt the skill.

### 7.1 Vercel as a processor [INFO / CONFIRM]

- Serving the site means Vercel's CDN sees every visitor's IP address, user agent and requested URL and keeps runtime logs (1 hour on Hobby, 1 day on Pro). That is processing of personal data on the controller's behalf → **Art. 28 processor**, needs a DPA.
- Vercel's DPA (effective 2026-03-31) is incorporated by reference in the Terms (§11.1) and uses the 2021 EU Standard Contractual Clauses for EEA transfers; its own scope sentence names "Customers who are on Enterprise and Pro plans" ([vercel.com/legal/dpa](https://vercel.com/legal/dpa), [terms §11.1](https://vercel.com/legal/terms)). **[CONFIRM]** whether a Hobby customer is covered at all; the safe reading is that only Pro gives a written processor contract — the second reason for Pro.
- Primary processing facilities are in the **United States**; sub-processor list at security.vercel.com. Vercel states it is **certified under the EU-US Data Privacy Framework** ([vercel.com/kb/guide/is-vercel-certified-under-dpf](https://vercel.com/kb/guide/is-vercel-certified-under-dpf)); **[CONFIRM]** by checking the live listing at [dataprivacyframework.gov/list](https://www.dataprivacyframework.gov/list) on the day the privacy page is updated, and record the date in the data register.
- Register: add `host: vercel.app / Vercel Inc.` under a new `hosting` entry in `docs/gdpr/data-register.json` with purpose "serving the site; access logs", processor "Vercel Inc. (US, DPF + SCC)", privacy key `privacy.sections.hosting`. The audit script must keep passing.

### 7.2 Rackhost and ISZT

Rackhost (Szeged, HU) holds the registrant's data (name, address, e-mail) as registrar and publishes what the .hu policy requires; the registry's annual data update e-mail must reach Vera ([domain.hu/annual-data-update/](https://www.domain.hu/annual-data-update/)). This is the owner's data, not visitor data; nothing for the privacy page. DNS queries carry no visitor identity to Rackhost beyond the resolver's.

### 7.3 Vercel Web Analytics [DECISION]

PRD D-10 chose it; it is on the privacy page and in the CSP but **not wired in code** (BACKLOG `[GDPR]`). Facts: cookieless, visitors identified by a hash of the request that is discarded after 24 h, data points are URL, referrer, coarse geolocation, device/browser, timestamp; Vercel designed it to need no consent banner but it is still processing by a US processor ([analytics/privacy-policy](https://vercel.com/docs/analytics/privacy-policy)). For a Vite site the integration is `inject()` from `@vercel/analytics` (no route support) plus "Enable" in the dashboard ([quickstart](https://vercel.com/docs/analytics/quickstart)); Hobby includes 50,000 events/month. **Decided 2026-11-12 (D5): wire it** (free on Hobby). Small code change in the next build session: `inject()` from `@vercel/analytics` once on the client, dashboard "Enable"; privacy section, CSP hosts and register entries already describe it. The one state to leave, a privacy page describing processing that does not happen, ends with that change.

### 7.4 Privacy page: the hosting line [copy proposal, not in the locale files]

A fifth section `privacy.sections.hosting` is new copy → `i18n-guardian` parity + owner sign-off (R-1) before it enters `src/i18n/locales/*.json`. Proposal:

- **HU — Tárhely:** „A weboldalt a Vercel Inc. (San Francisco, USA) szerverei szolgálják ki. A kiszolgálás során a látogató IP-címe és a lekért oldal címe rövid ideig (legfeljebb egy napig) technikai naplóban szerepel. A Vercel az EU–USA adatvédelmi keretrendszer (Data Privacy Framework) tanúsított résztvevője, és adatfeldolgozási szerződés (DPA) köti; a feldolgozás jogalapja a weboldal biztonságos működtetéséhez fűződő jogos érdek."
- **DE — Hosting:** „Die Website wird von Vercel Inc. (San Francisco, USA) ausgeliefert. Dabei werden die IP-Adresse des Besuchers und die aufgerufene Seite kurzzeitig (höchstens einen Tag) in technischen Protokollen gespeichert. Vercel ist unter dem EU-US Data Privacy Framework zertifiziert und durch einen Auftragsverarbeitungsvertrag (DPA) gebunden; Rechtsgrundlage ist das berechtigte Interesse am sicheren Betrieb der Website."
- **EN — Hosting:** "The site is served by Vercel Inc. (San Francisco, USA). While serving a page, the visitor's IP address and the requested URL are kept for a short time (at most one day) in technical logs. Vercel is certified under the EU-US Data Privacy Framework and bound by a data processing agreement (DPA); the legal basis is our legitimate interest in running the site securely."

**[CONFIRM]** the "at most one day" figure against the plan actually chosen (Hobby logs: 1 hour) and the legitimate-interest basis (Art. 6(1)(f)) with the lawyer; the Web3Forms processor line from BACKLOG `[GDPR]` should land in the same privacy edit.

---

## 8. Owner decisions (answered 2026-11-12)

| # | Decision | Owner's answer | Consequence in this plan |
|---|---|---|---|
| D1 | Vercel Pro or Hobby | **Hobby**, with close monitoring of e-mail and site over the next weeks and months | Risk accepted in writing (§1.4). Monitoring steps added to §1.4 and R7. Fall-back = upgrade to Pro on a pause notice. |
| D2 | Can Gabor's account become Pro and serve two sites; does that double the cost? | question | **No doubling.** Pro is per *team*, billed per Developer seat at $20/month; projects on Pro are unlimited and the included usage (1 TB transfer, $20 credit) is shared across the team's projects ([Hobby vs Pro table](https://vercel.com/docs/plans/hobby#comparing-hobby-and-pro-plans), [pricing](https://vercel.com/pricing)). Upgrading Gabor's Hobby team to Pro costs one seat, $20/month plus VAT, for both sites together; Vera as a Viewer is free. Only usage beyond the included amounts is extra, and neither site comes close. Moot while D1 = Hobby; it is the fall-back price. |
| D3 | Registrant identity at Rackhost | **Vera as a private person** | Holds only if domain.hu already shows Vera (private person) as registrant. If the record shows the business or a Webnode proxy, entering Vera's private data at Rackhost is an **ownership change**: extra fee (3,000 HUF net plus Rackhost's admin fee) and a 30-day lock on further changes. R0 (domain.hu advanced search) decides which case it is; Webnode's transfer-out article covers the proxy case. |
| D4 | Domain e-mail | business address is `info.fiorevera@gmail.com` | Confirms §4: no domain mail. Null MX + `v=spf1 -all` at Rackhost. The two-minute check in Webnode's mailbox panel stays in R0 because the live MX record exists and Webnode deletes mailboxes irrecoverably. |
| D5 | Vercel Web Analytics | **wire it if free** | It is free on Hobby: 50,000 events/month included, one month of history, collection pauses after the grace period and resumes after 7 days ([Hobby plan](https://vercel.com/docs/plans/hobby)). → code change for the next build session (BACKLOG): `@vercel/analytics` `inject()` called once on the client in `src/entry-client.tsx` (never in a render path, D-18), "Enable" in the dashboard, CSP hosts and `privacy.sections.analytics` already in place, register entries already declared. |
| D6 | Webnode | **let it expire** | Needs the expiry date from R0. If the Premium plan still has months to run, it is a free rollback for that long and nothing to do except switching auto-renewal off in Webnode (self-service; removing paid services needs support). If it expires *before* day 30 after cutover, the rollback window is shorter than 4.5 assumes; acceptable because the domain will already be at Rackhost and the archive (D-17) is complete. After the transfer, Webnode no longer bills the domain. MASTER-PLAN 4.5 reworded accordingly. |
| D7 | Cutover date | not known yet | Runbook stays date-free; R0–R5 are the gate, not a calendar. |
| D8 | Lawyer / [CONFIRM] items | **no lawyer**; "we store no data, the newsletter is not live, no major risk" | Accepted as the owner's call. One correction so the record is accurate: the site **does process** personal data (the inquiry form → Web3Forms → Gmail; Vercel's access logs with IP addresses). Nothing is *stored by the site*, the volume is tiny and the basis is consent, so the risk is indeed low. The cheap parts still ship: the hosting line (§7.4) and the Web3Forms processor line on the privacy page, because naming the recipients is what Art. 13 asks for and it costs three sentences per locale. The [CONFIRM] tags stay in the document as markers of what was *not* checked, not as blockers. |

## 9. Honest critique

1. **The plan's biggest cost is not money, it is Webnode support latency.** Everything hinges on Webnode generating the .hu auth code; its article gives no timeline. If the owner wants a date, start R3 today and treat the launch date as "two weeks after the code arrives", not a calendar promise.
2. **Pro is the recommendation, but the odds matter.** A seven-page site with a few hundred visits a month will very likely never be noticed on Hobby. The recommendation stands because the downside is asymmetric (the business site goes dark in peak season, fix depends on an e-mail) and because the DPA question is cleaner on Pro. Those are the two facts; the owner weighed $240 a year against them and chose Hobby with monitoring (D1, 2026-11-12). That is a legitimate choice and it is written down (§1.4); the plan's job is now to make the pause-to-upgrade path a ten-minute event, which §1.4 and R7 do.
3. **Rackhost is one more account to keep alive.** The domain was safe-ish inside Webnode (auto-renewed with the plan). At Rackhost the yearly renewal and the ISZT annual data update become Vera's responsibility; a missed renewal is the one way to actually lose `fiorevera.hu`. Mitigation: card-based auto-renew at Rackhost if offered, calendar reminder on the anniversary (8 November), registrant e-mail = an inbox that is read.
4. **MASTER-PLAN 4.1 still says "SPA rewrite"**; `vercel.json` has none (QA M2 removed the catch-all so unknown URLs answer a real 404). The wording is corrected in the same change as this document so the plan does not describe a configuration that would reintroduce the soft-404 bug.
5. **Not researched:** alternative free hosts that allow commercial sites, and the exact VAT treatment of a US SaaS invoice for a Hungarian sole trader. Both are named as decisions, not answered.

---

## 10. Sources (read 2026-11-12)

Vercel: [Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) · [Hobby plan](https://vercel.com/docs/plans/hobby) · [Pricing](https://vercel.com/pricing) · [Terms of Service](https://vercel.com/legal/terms) · [Why is my account/deployment paused](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked) · [Add a domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) · [Deploying & redirecting domains](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting) · [Working with DNS](https://vercel.com/docs/domains/working-with-dns) · [Troubleshooting domains](https://vercel.com/docs/domains/troubleshooting) · [Working with SSL](https://vercel.com/docs/domains/working-with-ssl) · [Web Analytics privacy](https://vercel.com/docs/analytics/privacy-policy) · [Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart) · [DPA](https://vercel.com/legal/dpa) · [DPF certification](https://vercel.com/kb/guide/is-vercel-certified-under-dpf)

.hu registry (ISZT): [Domain transfer](https://www.domain.hu/domain-transfer/) · [Domain Registration Policy](https://www.domain.hu/domain-registration-policy/) · [Annual data update](https://www.domain.hu/annual-data-update/) · [Domain search](https://www.domain.hu/domain-search/)

Rackhost: [.hu transfer from another registrar](https://www.rackhost.hu/tudasbazis/domain/hu-domain-atregisztracioja-masik-regisztratortol/) · [.hu prices](https://www.rackhost.hu/domain-tld/hu) · [2025 policy change](https://www.rackhost.hu/tudasbazis/domain/domainregisztracios-szabalyzat-valtozasa/) · [DNS records](https://www.rackhost.hu/tudasbazis/domain/hogyan-allithatom-be-a-domainhez-tartozo-rekordokat/)

Webnode: [Transfer a domain away](https://www.webnode.com/support/transfer-domain-away/) · [Payments and invoices FAQ](https://www.webnode.com/support/payments-and-invoices-faq/) · [Edit DNS records](https://www.webnode.com/support/setting-up-dns-records/) · [Domain names policies](https://webnode.helpjuice.com/domain-names-policies) · [team.blue acquisition](https://press.team.blue/193649-website-builder-webnode-becomes-part-of-team-blue)

Google: [Site move without URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes) · [Verify site ownership](https://support.google.com/webmasters/answer/9008080) · [Remove information](https://developers.google.com/search/docs/crawling-indexing/remove-information)

Live checks: `whois fiorevera.hu`, `dig` (NS/A/CNAME/MX/TXT/SOA), `curl -I` on apex and www, 2026-11-12 11:24 UTC.
