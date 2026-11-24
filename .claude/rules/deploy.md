---
paths:
  - "vercel.json"
  - "docs/launch/**"
  - "docs/operations/**"
  - "scripts/verify-live*"
  - "public/sitemap.xml"
  - "public/robots.txt"
---

# Hosting and deploy

- Live on https://www.fiorevera.hu since 2026-11-16; it replaced the Webnode site (content archived under `references/legacy/`). Vercel team `fiorevera`, project `fioreveraviragesdekor001`, Hobby plan by owner decision D1 (Pro is the fall-back on a pause). Production deploys from `main` on every push; pull requests get a Vercel preview.
- DNS is still served from Webnode's DNS centre (Register.it nameservers) until the Rackhost transfer (launch plan Track B).
- Operations (hosting settings, DNS, uptime monitor, Search Console, form quota, rollback, who can do what): `docs/operations/runbook.md`. Launch record: `docs/launch/domain-and-hosting-plan.md` (§0a, §1.4) and `docs/launch/legacy-webnode-dns-2026-11-16.md`.
- `vercel.json` (redirects, security headers incl. CSP, `trailingSlash`) may contain only keys of Vercel's schema; a `_comment_*` key broke the first import on launch day (`dcd491e`). Explanations go in `docs/`.
- The two permanent redirects answer HTTP 308. Unknown URLs get a native 404 with the single `dist/404.html`; the client renders the localized page, so curl sees the HU shell on `/de/<unknown>/` by design.
- The Vercel project overrides the install command with `npm ci --ignore-scripts`, because `prepare` runs `git config`.
- `VITE_*` values are inlined into the bundle and therefore public; they are stored on Vercel as plain config, never as secrets.
- `npm run verify:live` is the read-only health check of the live site (expectations in `docs/launch/live-expectations.json`).
