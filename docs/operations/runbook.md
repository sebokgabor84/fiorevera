# Fiore Vera — operations runbook

> **State: 2026-11-16 (launch day).** Written from the session notes in `.agent/harvest/` and the launch record, so that the operational facts no longer live only in chat. Every statement names its source in brackets. Where the sources are silent the text says **"unknown, ask Gabor"** instead of guessing.
> No secret belongs in this file: environment variables are listed by **name only**, never by value.
>
> Source tags: **[plan §x]** = `docs/launch/domain-and-hosting-plan.md`, **[dns]** = `docs/launch/legacy-webnode-dns-2026-11-16.md`, **[h:name]** = `.agent/harvest/<name>.md`, **[code]** = the file named next to it.

---

## 1. What runs where

| Part | Where | Source |
|---|---|---|
| Live site | https://www.fiorevera.hu (primary host); https://fiorevera.hu redirects to www with HTTP 308 | [plan §0a checklist A4] |
| Hosting | Vercel, team `fiorevera`, project `fioreveraviragesdekor001`, Hobby plan | [plan §0a], [h:domain-move §3] |
| Source | GitHub `sebokgabor84/fiorevera`, production branch `main` | [plan §0a A1], [h:main-build §3] |
| DNS | Register.it nameservers, edited in Webnode's DNS centre, until the Rackhost transfer | [h:domain-move §3], [dns] |
| Domain | `fiorevera.hu`, paid to 2027-11-09 | [plan §0a] |
| Contact form | Web3Forms (free plan) → the business inbox info.fiorevera@gmail.com | [h:contact-form §3] |
| Analytics | Vercel Web Analytics, cookieless | [code] `src/lib/analytics.ts` |
| Uptime monitor | UptimeRobot, free plan | [plan §1.4] |
| Search | Google Search Console, Domain property `fiorevera.hu` | [plan §0a A7] |
| Legacy site | Webnode, plan expired, offline; content archived in `references/legacy/` | [h:domain-move §3], [dns] |

---

## 2. Hosting and deploys (Vercel)

**How a change reaches production**

- Every push to `main` builds and deploys production. There is no separate release step. [h:domain-move §1]
- For that reason agents never commit on `main`: work happens on a feature branch and reaches `main` through a pull request that the owner merges. [h:main-build §3], `CLAUDE.md`
- Pull requests get a Vercel preview check. A branch cut before a `vercel.json` fix fails that check even if it does not touch the file, so bring a branch up to date with `main` before opening the pull request. [h:firefox-e2e §2]

**Project settings that matter** [plan §0a A1], [h:domain-move §2–3]

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` (the log must say 21 prerendered pages + `404.html`) |
| Output directory | `dist` |
| Install command (override) | `npm ci --ignore-scripts` |
| Production branch | `main` |
| Domains | `www.fiorevera.hu` primary; `fiorevera.hu` redirects to www |

- Why the install override exists: the `prepare` script runs `git config core.hooksPath .githooks`, which can fail outside a git checkout; `sharp`'s install script is not needed for the build. Removing the override needs a tolerant `prepare` first (BACKLOG `[OPS]`, in flight). [h:domain-move §2, §4]
- **Environment variables (names only):** `VITE_FORM_ENDPOINT`, `VITE_FORM_ACCESS_KEY`, both set for Production and Preview. They are stored as plain config, not as secrets: Vercel refuses to store `VITE_`-prefixed variables as Secret because they are inlined into the browser bundle, and renaming them breaks the form. [h:domain-move §2–3], [code] `.env.example`
- Where the values come from: the access key lives only in the git-ignored `.env.local` on the build machine and in Vercel. It is never pasted into chat or committed; verify it by length only (a 36-character UUID). [h:contact-form §2–3]
- `vercel.json` (redirects, security headers with HSTS and CSP, `trailingSlash`) may contain only keys of Vercel's schema. A pseudo-comment key was rejected by the import validator on launch day (`dcd491e`). Explanations go in `docs/`. [h:domain-move §2], [plan §0a A1]
- Unknown URLs: Vercel serves the single `dist/404.html` with HTTP 404; the client renders the not-found page in the path's locale. There is no catch-all rewrite. `curl` therefore shows the HU shell on `/de/<unknown>/` while a browser shows DE; this is by design. [plan §0a A1], [h:domain-move §2]
- The two permanent redirects (`/viragoskert/` → `/rolunk/`, `/de/blumengarten/` → `/de/uebermich/`) answer HTTP **308**, not 301. [h:domain-move §2]
- Certificates: Vercel issues one certificate per added hostname (apex 2026-11-16 07:34 UTC, www 07:39 UTC). An edge can serve the apex certificate for www for some minutes after issuance. [h:domain-move §2]
- Hobby plan limits recorded so far: runtime logs are kept for 1 hour; Web Analytics includes 50,000 events a month with one month of history. [plan §7.1, §8 D5]
- The Hobby plan is a written risk acceptance (owner decision D1, 2026-11-12): Vercel's fair-use rules exclude commercial sites and Vercel may pause the deployment. Do not re-open the decision; the fall-back is in §4. [plan §1.4], [h:domain-move §2]
- Vercel account e-mail: must be an inbox that is read daily, because a pause notice goes there [plan §1.4 item 1]. Which address it is: **unknown, ask Gabor.**
- Vercel notification e-mails (deployment failed, domain): recommended, **not confirmed as switched on**. [h:domain-move §4]

---

## 3. DNS and the domain

**Where records are changed today:** Webnode → project `fiorevera-hu` → *Adminisztráció → Domainek → DNS kezelése* next to `fiorevera.hu` (Vera's Webnode login). The DNS centre stays editable although the Premium plan expired, because the domain is a separately paid service. This is the only place to change records until the transfer completes, so the Webnode login must stay alive. [plan §0a A5], [h:domain-move §2, §6]

**Records that serve the site** [plan §0a checklist A5], [dns]

| Type | Name | Value |
|---|---|---|
| A | `fiorevera.hu` | `216.198.79.1` (this Vercel project's IP; never copy an IP from a guide) |
| CNAME | `www.fiorevera.hu` | `f07e1d688aad7d56.vercel-dns-017.com.` |
| TXT | `fiorevera.hu` | the Google Search Console verification string, recorded in [dns] |
| TXT | `fiorevera.hu` | Webnode's SPF row (left untouched) |

- Nine Webnode mail rows (`_dmarc`, DKIM keys, `autoconfig`, `MX`, SPF, `SRV`) were left as they were. Nothing uses them: there is no domain mail (decision D4), the business address is the Gmail inbox. [plan §0a A5, §8 D4]
- Never overwrite an existing TXT row to add another one; add a row. SPF and the Google verification coexist. [h:domain-move §2]
- TTL is 3600 s: a change can take up to an hour to show, and a local resolver may answer from cache. Verify against `@ns1.register.it` or `@8.8.8.8`. [plan §0a A5], [h:domain-move §7]
- The zone as it was before the cutover, and how to point back at Webnode, is in [dns]. A rollback to Webnode restores Webnode's error page, not the old site.

**Registrar and renewal**

- Nameservers: `ns1.register.it`, `ns2.register.it` (the domain was registered through Webnode). [dns]
- Paid to **2027-11-09**. [plan §0a]
- Registrant on domain.hu: **unknown** until it is read on the domain.hu *Részletes keresés*; that is the next step of the transfer. Target registrant: Vera as a private person (decision D3). [plan §0a B2, §8 D3]
- **Transfer to Rackhost (Track B): open**, not urgent, within weeks. Before the transfer completes the Rackhost zone must already hold the Vercel A and CNAME records, the Google TXT, a null MX (`0 .`) and `v=spf1 -all`; an empty Rackhost zone at switch time takes the site down. After the transfer: nameservers `ns1`–`ns4.dns24.hu`, re-run the checks in §9, no further registrar or ownership change for 30 days, auto-renewal on, calendar entry 2027-10-09. Steps: [plan §0a Track B].
- Rackhost account (whose e-mail, created or not): **unknown, ask Gabor.**

---

## 4. Uptime monitor and what its alerts mean

- UptimeRobot, free plan, one monitor on `https://www.fiorevera.hu/`; dashboard https://dashboard.uptimerobot.com/monitors in Gabor's account; alerts by e-mail. [plan §1.4 item 5], [h:domain-move §3]
- Check interval and the exact alert recipients: **unknown, ask Gabor.** The plan's intent was a check every few minutes that mails both Gabor and Vera. [plan §1.4 item 5]
- No monitor yet on the apex redirect or the contact page (BACKLOG `[OPS]`). [h:domain-move §4]

| Alert / symptom | Meaning | What to do |
|---|---|---|
| HTTP 503 with `DEPLOYMENT_PAUSED` | Vercel paused the Hobby deployment (fair-use: commercial site on the free plan) | Upgrade the team to Pro: Vercel → Settings → Billing → Upgrade (minutes; one Developer seat, $20 a month plus VAT, covers both of Gabor's sites), then reply to Vercel's notice. This is the recorded fall-back, no other is needed. [plan §1.4 items 2 and 6, §8 D2] |
| Host does not resolve, or resolves to something else | DNS trouble (Webnode's zone today, Rackhost's after the transfer) | Compare the live records with the table in §3; fix them in the DNS centre named there. [plan §1.4 item 5] |
| Certificate error shortly after a domain change | An edge still serves the other hostname's certificate | Check with `openssl s_client -servername`, wait 5 minutes before treating it as a problem. [h:domain-move §2, §7] |
| Site is up but a new change is missing | The production build failed, or the change is not on `main` | Vercel → Deployments: read the latest build log. [plan §0a A1] |

---

## 5. Search Console and analytics

- **Search Console:** Domain property `fiorevera.hu`, verified on 2026-11-16 by a DNS TXT row; indexing requested for `/`, `/de/` and `/en/`. The TXT row must exist in whichever zone serves the domain, so it has to be carried into the Rackhost zone or the verification lapses. [plan §0a A7], [dns]
- Sitemap `https://www.fiorevera.hu/sitemap.xml`: that Search Console shows *Success* for it is **not confirmed yet**. [plan §0a checklist A7]
- Which Google account owns the property: **unknown, ask Gabor.** The launch plan assigns the Search Console tasks to Gabor. [plan §6.1 R8]
- Still to do: hreflang report and index coverage at day 7 (2026-11-23) and day 30 (2026-12-16), comparison with the legacy queries, and the legacy property's Performance export if that property exists (MASTER-PLAN 4.4). Field Core Web Vitals appear only after about four weeks of traffic. [h:domain-move §4], [h:seo-webvitals §4]
- The prerendered HTML writes the hreflang attribute as `hrefLang`; search for it case-insensitively. [h:domain-move §2]
- **Web Analytics:** the code starts it only on `fiorevera.hu`, `www.fiorevera.hu` and `*.vercel.app`. That the project's Analytics page says *Enabled* is **not confirmed yet**. A working setup shows a `/_vercel/insights/view` request in the browser's network panel on www. [code] `src/lib/analytics.ts`, [plan §0a A3]
- **First performance measurement (lab):** PageSpeed mobile on the home page, 2026-11-16: Performance 90, Accessibility 100, Best Practices 100, SEO 100; LCP 3.6 s. A re-run after the image fix `2f97d84` is still open. [h:seo-webvitals §1, §4]

---

## 6. Contact form provider (Web3Forms)

- Provider: Web3Forms, free plan, chosen on 2026-11-11. Endpoint `https://api.web3forms.com/submit`. Delivery from the live site was confirmed on 2026-11-16. [h:contact-form §1, §3]
- **Quota: 250 submissions a month**, one recipient. Web3Forms sends **warning mails at 90 % and at 100 %** of the quota to the business inbox; after that it **refuses submissions until the next month**. Visitors then see the form's error state with a prefilled `mailto:` link, so an inquiry can still be sent by e-mail. [h:contact-form §3, §6]
- **History: 30 days.** Web3Forms is not an archive; the delivered mail in the inbox is the record. [h:contact-form §3, §4]
- Every real submission costs quota and lands in the business inbox. Automated tests can never reach the provider (the e2e fixture aborts those requests); tests by hand in a browser are the only real sends, and the owner is asked before each extra one. For local work use `npm run dev:form` (fake provider). [h:contact-form §2], [code] `tests/e2e/fixtures.ts`, `scripts/fake-form-provider.ts`
- What the mail looks like: subject `Árajánlatkérés – fiorevera.hu (<name>)`, sender name "Fiore Vera weboldal", Reply-To = the visitor's e-mail address, field labels derived from the payload keys (English today: "Wedding date", "Venue"). That the sender name shows in Gmail was never explicitly confirmed. [h:contact-form §2, §3, §6]
- Spam protection: a honeypot field (`website`) that answers "ok" without sending, plus Web3Forms' server-side filter. hCaptcha or a server-side proxy are options only if real spam appears. [h:contact-form §3, §4]
- The access key is public by design (it is in the browser bundle and only selects the delivery inbox). Still: never ask for it or repeat it in chat. [h:contact-form §2]
- Data protection facts: company in Kerala (India), servers in US-East, logs purged after 2 months, a DPA is offered and **not accepted yet**; the privacy page does not name the processor yet (both in BACKLOG). [h:contact-form §3, §4]
- Web3Forms dashboard login (which account): **unknown, ask Gabor.**

---

## 7. Rolling back a bad deploy

1. **Through git (the recorded path).** Production is whatever `main` holds, and every push to `main` deploys [h:domain-move §1]. Revert the bad commit on a branch, run the gates, open a pull request, the owner merges it, Vercel deploys the reverted state. Agents do not push to `main` themselves.
2. **Through the Vercel dashboard.** The notes record only *Deployments → ⋯ → Redeploy* for the latest deployment [plan §0a A1 step 4]. Whether and how an earlier deployment can be promoted on the Hobby plan: **unknown, ask Gabor** (check Vercel's documentation on the day).
3. **Not a rollback:** pointing DNS back at Webnode. The Webnode project answers its own 404 page since the plan expired. [dns]
4. Before judging a local build after a failed one, delete `dist` and `dist-ssr`; a failed `tsc` leaves a stale `dist/` behind. [h:main-build §2]

---

## 8. Who can do what

| Task | Who | Source |
|---|---|---|
| Merge pull requests to `main` (= production deploy) | Gabor (owner of the GitHub repository; merged pull requests 5 and 6) | [plan §0a A1], [h:main-build §3] |
| Vercel dashboard: settings, environment variables, billing and the Pro upgrade | Gabor (the team is his) | [plan §0a A1, §1.4, §8 D2] |
| Vercel access for Vera | none recorded (on Pro she could be a free Viewer); **unknown, ask Gabor** | [plan §1.3] |
| DNS records until the transfer | Vera's Webnode login | [plan §0a A5] |
| Rackhost order and DNS zone after the transfer | Gabor in Rackhost | [plan §0a "The two tracks"] |
| Registry confirmation e-mail or SMS, signed declaration for the transfer | Vera (target registrant, D3) | [plan §0a "The two tracks", §8 D3] |
| UptimeRobot dashboard | Gabor's account | [h:domain-move §3] |
| Search Console checks | Gabor per the plan; account owner **unknown, ask Gabor** | [plan §6.1 R8] |
| Business inbox info.fiorevera@gmail.com (inquiries, Web3Forms quota mails) | Vera's inbox per the e2e fixture comment; who reads it daily: **unknown, ask Gabor** | [code] `tests/e2e/fixtures.ts`, [h:contact-form §6] |
| Web3Forms dashboard, DPA acceptance | **unknown, ask Gabor** | [h:contact-form §6] |
| Copy sign-off per locale, the 15 cover picks, phone review of the live site | Vera | [h:main-build §6], [h:domain-move §6] |
| Approval of new visual baselines | the owner, by name, through `npm run test:visual:update -- --approved-by="<name>"` | [h:baseline-review §3] |
| Commit and push | agents only after an explicit "GO", never on `main` | `AGENTS.md`, `CLAUDE.md` |

---

## 9. Checks

### After a deploy

- Vercel → Deployments: the build is green and the log says 21 prerendered pages + `404.html`. [plan §0a A1]
- `curl -I https://www.fiorevera.hu/` answers 200. [plan §0a A6]
- On www, the browser's network panel shows a `/_vercel/insights/view` request (the analytics gate is otherwise covered by a unit test only). [h:domain-move §4]
- After image or performance work: re-run PageSpeed and log the result. [h:seo-webvitals §4]

### First checks when something is wrong

Run these before changing anything. Commands from [plan §0a A6] and [h:domain-move §2, §7].

```bash
# 1. Is the site up, and what does it answer?
curl -I https://www.fiorevera.hu/                 # expect 200; 503 DEPLOYMENT_PAUSED = Hobby pause (see §4)
curl -IL https://fiorevera.hu/                    # must end at https://www.fiorevera.hu/ with 200

# 2. Does DNS still point at Vercel? Ask a public resolver, the local cache can lie for an hour.
dig +short A fiorevera.hu @8.8.8.8                # expect 216.198.79.1
dig +short CNAME www.fiorevera.hu @8.8.8.8        # expect f07e1d688aad7d56.vercel-dns-017.com.
dig +short NS fiorevera.hu                        # register.it until the transfer, dns24.hu after it

# 3. Is the certificate the right one for the host?
openssl s_client -servername www.fiorevera.hu -connect 216.198.79.1:443   # read the certificate's subject and names

# 4. Do pages, redirects and the 404 behave?
curl -I https://www.fiorevera.hu/szolgaltatasok/  # 200
curl -I https://www.fiorevera.hu/de/verleih/      # 200
curl -I https://www.fiorevera.hu/viragoskert/     # 308 → /rolunk/
curl -I https://www.fiorevera.hu/nincs-ilyen/     # 404
```

5. **Latest deployment.** Vercel → Deployments: did the last build fail? Typical cause seen so far: a key in `vercel.json` that is not in Vercel's schema. [h:domain-move §2]
6. **Form does not deliver.** Does the page show the error state with the mailto link? Then check, in this order: a Web3Forms quota mail in the inbox (90 % / 100 %); that both variable names from §2 exist in Vercel for Production; that the CSP in `vercel.json` still allows `api.web3forms.com`. Do not send test submissions without asking, each one costs quota. [h:contact-form §2, §3]
7. **A check "fails" but is by design:** 308 instead of 301 on the two redirects; the HU shell in `curl` on `/de/<unknown>/`; `hrefLang` in camel case; the native date input showing `mm/dd/yyyy` in the visual baselines. [h:domain-move §2], [h:baseline-review §2]
8. **Site paused or unreachable and nobody answers:** the upgrade path in §4 is the only fall-back; Webnode is not one. [plan §1.4], [dns]

`npm run verify:live` runs these checks as a script since pull request 9 (expectations in `docs/launch/live-expectations.json`); the block above is the manual fallback. [h:domain-move §4]

---

## 10. Related documents

- `docs/launch/domain-and-hosting-plan.md` — the launch plan and day-one record (§0a fast lane, §1.4 Hobby decision, §7 GDPR touchpoints, §8 owner decisions D1–D8)
- `docs/launch/legacy-webnode-dns-2026-11-16.md` — the legacy DNS zone, the Google TXT value, the rollback recipe
- `docs/gdpr/data-register.json` — every data sink and processor; checked by `npm run audit:gdpr`
- `docs/qa/` — QA session report, visual-regression plan, baseline log
- `BACKLOG.md` — open operations items (`[OPS]`, `[LAUNCH]`) and the "Owner decisions" section
- Owner-facing step list "Fiore Vera launch steps": https://claude.ai/artifact/CPCyojVVuxfP2xxwwJg2Dr (outside the repo) [h:domain-move §1]
