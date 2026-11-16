# Legacy DNS zone of fiorevera.hu at Webnode / Register.it — recovery snapshot

> Captured 2026-11-16 from the Webnode DNS centre (Adminisztráció → Domainek → DNS kezelése, Vera's account) and `dig`
> against `ns1.register.it`, **before** the A and www rows were repointed at Vercel (launch plan §0a step A5).
> Purpose: roll back to the Webnode front-ends if ever needed, and keep the mail records on file. Nothing uses the
> mail records (decision D4: the business address is info.fiorevera@gmail.com); they are listed for completeness only.

## Nameservers (registrar side, unchanged until the Rackhost transfer)

```
NS   fiorevera.hu   ns1.register.it.
NS   fiorevera.hu   ns2.register.it.
SOA  fiorevera.hu   ns1.register.it. hostmaster.register.it. 2026020901 10800 3600 604800 86400
```

## Records exactly as the Webnode DNS centre listed them

| Típus | Név / hosztnév | Érték | Notes |
|---|---|---|---|
| A | `fiorevera.hu` | `3.73.27.108` | Webnode front-end (AWS eu-central), TTL 3600 — **replaced by the Vercel A IP** |
| A | `fiorevera.hu` | `3.125.172.46` | Webnode front-end, TTL 3600 — **deleted** |
| CNAME | `_dmarc.fiorevera.hu` | `_dmarc-user.webnode.com.` | Webnode mail DMARC |
| CNAME | `mail._domainkey.fiorevera.hu` | `dkimuser.webnode.com.` | Webnode mail DKIM |
| CNAME | `www.fiorevera.hu` | `fiorevera-hu.webnode.hu.` | → `projects-lb.webnode.io.` → `18.185.25.67`, `3.79.173.192`; TTL 3600 — **replaced by the Vercel CNAME target** |
| CNAME | `key-wb001._domainkey.fiorevera.hu` | `key-wb001._domainkey.webnode.com.` | Webnode mail DKIM |
| CNAME | `key-wb002._domainkey.fiorevera.hu` | `key-wb002._domainkey.webnode.com.` | Webnode mail DKIM |
| CNAME | `autoconfig.fiorevera.hu` | `tb-wb.securemail.pro.` | Webnode mail autoconfig |
| MX | `fiorevera.hu` | `10 imap.mail.webnode.com.` | priority 10 per `dig` |
| TXT | `fiorevera.hu` | `"v=spf1 a mx include:spfuser.webnode.com -all"` | full value per `dig` (the centre truncates it) |
| SRV | `_autodiscover._tcp.fiorevera.hu` | `10 443 ms-wb.securemail.pro.` | as displayed; Webnode mail autodiscover |

## Added after the snapshot (keep when moving to Rackhost)

| Típus | Név | Érték | Notes |
|---|---|---|---|
| TXT | `fiorevera.hu` | `google-site-verification=PAUvTE8j94p1e7yIPnOHCmNnOoObRmOY3l0ro1FyHi0` | Google Search Console Domain-property verification, added 2026-11-16; public by nature; must exist in whichever zone serves the domain |

## How to roll back to Webnode (only meaningful while the Webnode project still exists)

1. Webnode → DNS kezelése → edit the `A fiorevera.hu` row back to `3.73.27.108`, add a second `A fiorevera.hu` = `3.125.172.46`.
2. Edit `CNAME www.fiorevera.hu` back to `fiorevera-hu.webnode.hu.`.
3. Wait up to the TTL (3600 s). Note that on 2026-11-16 the Webnode project itself answered HTTP 404 because the Premium plan had expired, so a rollback restores Webnode's error page, not the old site; the old site's content is archived under `references/legacy/` (PRD D-17).

## Legacy hosting facts kept for the record

- Webnode served `https://www.fiorevera.hu/` with `server: webnode`, apex → www as a 301, HTTP → HTTPS as a 301.
- Images were on `https://0666f3d337.clvaw-cdnwnd.com/…` (inventory in `references/legacy/manifest.json`).
- Project address: `https://fiorevera-hu.webnode.hu/`.
