# Harvest: Domain move to Rackhost + Vercel launch (fast lane)
Session: domain-move · period: 2026-11-12–2026-11-16 · commits on main: 23512dd, 698b150, c3ea238, dcd491e, b26a493, 48cdc89 (plus PR #3/#4 merged by the owner)

## 1. What this session delivered
- Launch plan with sourced risk answer (Hobby fair-use, .hu transfer, DNS, mail, SEO, GDPR, runbook, honest critique) — `docs/launch/domain-and-hosting-plan.md` / 23512dd, c3ea238, b26a493, 48cdc89
- Vercel Web Analytics wired, gated to served hosts only — `src/lib/analytics.ts`, `src/entry-client.tsx`, `tests/unit/analytics.test.ts`, `docs/gdpr/data-register.json` / 698b150
- `vercel.json` fixed for Vercel's import validator (`_comment_404` removed) — dcd491e
- Legacy Webnode DNS zone snapshot + rollback recipe + Google TXT — `docs/launch/legacy-webnode-dns-2026-11-16.md` / b26a493, 48cdc89
- Live site on https://www.fiorevera.hu (2026-11-16, Track A): Vercel project `fioreveraviragesdekor001`, team `fiorevera` (Hobby), deploys every push to `main`; DNS repointed inside Webnode's DNS centre; certs apex 07:34 / www 07:39 UTC; 14/14 legacy URLs 200/308 — recorded in plan §0a, MASTER-PLAN 4.1 [x] 4.2 [/] 4.3 [x], BACKLOG
- Shareable owner doc "Fiore Vera launch steps" (Claude Docs artifact https://claude.ai/artifact/CPCyojVVuxfP2xxwwJg2Dr) — not in the repo
- Memory notes for future sessions: `fiorevera-hosting-vercel-hobby.md`, `fiorevera-uptime-monitor.md` (Claude auto-memory, outside the repo)

## 2. Learnings (rules a future agent must follow)
- **Vercel rejects unknown keys in `vercel.json` at import ("should NOT have additional property")** — JSON has no comments; notes go in docs. Evidence: owner screenshot 2026-11-16, fix dcd491e. [tooling]
- **`npm ci --ignore-scripts` is the Vercel install command for this repo** — `prepare` runs `git config core.hooksPath`, which can fail outside a git checkout; `sharp`'s install script is not needed for the build. Evidence: `package.json:29`, build succeeded with the override 2026-11-16. [ops]
- **`VITE_`-prefixed env vars are browser-public; Vercel refuses to store them as Secret, and renaming breaks the form** — store as Config; the Web3Forms key is public by design. Evidence: owner report 2026-11-16, `src/lib/submitInquiry.ts` reads `import.meta.env.VITE_FORM_ACCESS_KEY`. [architecture]
- **Vercel sends `permanent: true` redirects as 308, not 301** — Google treats both as permanent; MASTER-PLAN "301" DoD is met in substance. Evidence: `curl -I https://www.fiorevera.hu/viragoskert/` → 308, 2026-11-16. [seo]
- **Vercel issues one certificate per added hostname; the automatic apex↔www redirect does not add www** — check with `openssl s_client -servername www.… -connect <ip>:443`; an edge can serve the apex cert for www for minutes after issuance. Evidence: www cert issued 07:39, still mismatched at 08:36 on one edge, fine at 08:41. [ops]
- **Vercel's apex A IP is per project (this project: `216.198.79.1`; www CNAME `f07e1d688aad7d56.vercel-dns-017.com.`)** — never copy `76.76.21.21` from guides. Evidence: Vercel troubleshooting doc, dashboard 2026-11-16. [ops]
- **Webnode's DNS centre stays editable after the Premium plan expires (domain is a separate paid service)** — DNS-first cutover beat the registrar transfer by days. Evidence: owner screenshot of `webnode.com/hu/fiorevera-hu/dns-management/fiorevera.hu/`, cutover 2026-11-16. [ops]
- **Never overwrite an existing TXT row to add another (SPF vs Google verification coexist)** — add a row. Evidence: `dig TXT fiorevera.hu` shows both, 2026-11-16. [ops]
- **The .hu auth code can bypass the old registrar**: registrant via start.domain.hu (factor-based) or, for document-protected domains, the new registrar moves it without a code since 2025-05-06. Evidence: domain.hu "Megújul a .HU domainregisztráció", Policy §3.7. [legal]
- **Static site + 404.html: curl sees HU on `/de/<unknown>/`, browsers see DE** — by design (QA M2), do not "fix". Evidence: plan §0a note, `scripts/prerender.ts`. [architecture]
- **Shared-checkout commits must be staged by hunk** (`git diff -U0` → filtered patch → `git apply --cached --unidiff-zero`) because BACKLOG.md/data-register.json carried another session's hunks. Evidence: 23512dd, 698b150 staging. [workflow]
- **Hobby plan is a written risk acceptance, not an oversight** — do not re-litigate; fall-back = Pro, one $20 seat covers both of Gabor's sites. Evidence: plan §1.4, §8 D1/D2, owner 2026-11-12. [owner-preference]
- **Google hreflang attribute is emitted camel-cased (`hrefLang`) in prerendered HTML** — grep case-insensitively. Evidence: `curl https://fiorevera.vercel.app/de/verleih/`, handover note. [testing]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| Hosting = Vercel Hobby, risk accepted; Pro is the fall-back | owner, 2026-11-12 | plan §1.4, §8; MASTER-PLAN 4.1 | no |
| Vercel team `fiorevera`, project `fioreveraviragesdekor001`, production branch `main`, build `npm run build`, out `dist`, install `npm ci --ignore-scripts` | this session + owner, 2026-11-16 | plan §0a A1, memory note | YES → CLAUDE.md "Project state" still says Vercel not set up; README Status not *shipped* |
| Env vars `VITE_FORM_ENDPOINT`/`VITE_FORM_ACCESS_KEY` as Config on Vercel | owner, 2026-11-16 | BACKLOG [FORM] [x], plan §0a | no |
| DNS still at Register.it (Webnode); A `216.198.79.1`, www CNAME Vercel target; Webnode mail rows untouched | 2026-11-16 | plan §0a, `legacy-webnode-dns-2026-11-16.md` | no |
| Domain paid to 2027-11-09 (Rackhost cart); registrant to be Vera as private person (D3) | owner, 2026-11-12/16 | plan §8, BACKLOG [LAUNCH] D3 | no |
| No domain mail (Gmail); target zone null MX + `v=spf1 -all` | owner D4, 2026-11-12 | plan §4, §0a B7 | no |
| Search Console Domain property verified by TXT `google-site-verification=PAUvTE8j94p1e7yIPnOHCmNnOoObRmOY3l0ro1FyHi0`; indexing requested | owner, 2026-11-16 | plan §0a A7/B7, snapshot file | no |
| UptimeRobot free plan on `https://www.fiorevera.hu/`, dashboard in Gabor's account | owner, 2026-11-16 | plan §1.4, BACKLOG | no |
| Web Analytics wired (D5), hosts `fiorevera.hu`/`www`/`*.vercel.app`; dashboard "Enable" not yet confirmed | owner D5 2026-11-12, code 698b150 | `src/lib/analytics.ts` | partly → confirm Enable |
| Webnode: let the plan expire (D6); it expired before cutover; site served 404 ~2026-11-12→16 | owner, 2026-11-12/16 | MASTER-PLAN 4.5, plan §0a | no |
| No lawyer (D8); [CONFIRM] tags stay as markers; hosting + Web3Forms recipient lines still to ship on the privacy page | owner, 2026-11-12 | plan §8, BACKLOG [GDPR] | YES → privacy copy not in locale files |
| Vercel is DPF-certified; DPA text names Pro/Enterprise | Vercel docs, 2026-11-12 | plan §7.1, data register role text | no |
| 308 for permanent redirects | Vercel behaviour | plan §0a note | MASTER-PLAN 4.1/4.3 still say "301" |

## 4. Improvements NOT implemented yet
- [ ] Make `prepare` tolerant (`git config core.hooksPath .githooks || true`) so Vercel can use plain `npm ci` — removes a hidden project setting — `package.json` — Vercel build green without the install override — S — n
- [ ] Privacy page `privacy.sections.hosting` (HU/DE/EN proposal in plan §7.4) + Web3Forms recipient sentence; `hosting` entry in `docs/gdpr/data-register.json`; visual baselines for privacy pages re-approved — Art. 13 accuracy — `src/i18n/locales/*.json`, `PrivacyPage.tsx`, register — `npm run audit:gdpr` green, i18n parity green — M — y (copy GO, R-1)
- [ ] CLAUDE.md "Project state"/hosting paragraph, README "Status", AGENTS.md open question #4 and Gate G: update to *live on Vercel since 2026-11-16, DNS at Webnode until Rackhost* — drift gate for future sessions — `CLAUDE.md`, `README.md`, `AGENTS.md` — skills drift test green — S — n
- [ ] MASTER-PLAN 4.1/4.3 wording "301" → "permanent redirect (308 on Vercel)", or set `"statusCode": 301` in `vercel.json` if the owner wants literal 301s — `MASTER-PLAN.md` / `vercel.json` — curl shows the chosen code — S — y
- [ ] `lastmod` in `scripts/generate-sitemap.ts` (from git log per route or build date) — QA M3 follow-up — sitemap test — S — n
- [ ] Stale `.agent/pr/feature-site-build.md` (PR already merged) — delete or mark merged — S — n
- [ ] Remove `vitals.vercel-insights.com` (Speed Insights) from the CSP and register if Speed Insights is never enabled — smaller CSP — `vercel.json`, register — audit green — S — y
- [ ] UptimeRobot: add a second check for `https://fiorevera.hu/` (apex redirect) and the contact page — catches a broken redirect — owner's dashboard — alerts tested — S — y
- [ ] Vercel → Account → Notifications: deployment-failed and domain e-mails on — fall-back for the Hobby decision — Vercel dashboard — S — y (owner)
- [ ] Export the legacy Search Console property's Performance data (if that property exists) before it ages out — MASTER-PLAN 4.4 comparison — Search Console — S — y (owner)
- [ ] Search Console: check hreflang + Index Coverage at day 7 and day 30 (MASTER-PLAN 4.4), compare top queries — owner + agent — M — n
- [ ] After the Rackhost transfer: `dig NS` check, re-run the legacy-URL sweep (plan A6 commands), tick 4.3 "Rackhost" line, set calendar 2027-10-09 — plan §0a B8/B9 — S — y
- [ ] Google "Refresh outdated content" for the dead `clvaw-cdnwnd.com` image URLs once they 404 (optional) — plan §5 — S — n
- [ ] Alternative free hosts that allow commercial sites were explicitly not researched (owner chose Hobby) — only if the owner reopens D1 — L — y
- [ ] VAT/accountant question on a US Vercel invoice if Pro is ever bought — plan §1.3 — S — y
- [ ] e2e/visual coverage of the analytics gate is unit-only (`tests/unit/analytics.test.ts`); a production smoke check (`/_vercel/insights/view` request on www) could be a manual checklist line — S — n
- [ ] Scripted launch verification (`scripts/verify-live.ts`: dig A/CNAME/NS/TXT, cert SANs via openssl, legacy-URL sweep from `references/legacy/manifest.json`, 404 + 308 checks) — this session ran it ad hoc in Bash three times — code-first rule — `npm run verify:live` green — M — n

## 5. Skill updates needed
- `AGENTS.md` routing table: no trigger for *hosting, DNS, domain, Vercel, cutover, launch, uptime* → missing-skill fallback would fire; propose a `launch-ops` skill via `skill-creator` (code-first: the verify-live script above, Vercel project settings, DNS record table, Rackhost/.hu procedure) or extend `seo-expert` + `qa-specialist`.
- `.agent/skills/seo-expert/SKILL.md`: add Search Console Domain-property-by-TXT, 308 semantics, `hrefLang` casing, one sitemap/robots for all locales, `lastmod` todo.
- `.agent/skills/gdpr-guardian/SKILL.md`: architecture facts row "Web Analytics NOT wired" is now wrong (wired in `src/lib/analytics.ts`, gated); add Vercel as processor (US, DPF, DPA Pro/Enterprise [CONFIRM]), the hosting-line proposal location (plan §7.4), and that `VITE_` env values are public.
- `.agent/skills/qa-specialist/SKILL.md`: add "vercel.json must contain only schema keys" and the Vercel install command; the DoD list should mention `npm run audit:gdpr`.
- `CLAUDE.md` build facts: Vercel settings, analytics file, `docs/launch/` folder.

## 6. Open owner decisions / things only Gabor or Vera can do
- Track B at Rackhost (not urgent, within weeks): cart 1 year (recommended) vs more; read registrant on domain.hu first; pay; **pre-fill the Rackhost zone before the transfer completes** (plan §0a B7 values); authorisation path 1 (Rackhost ticket, document-protected) → 2 (start.domain.hu) → 3 (Webnode). Next exact step: domain.hu *Részletes keresés* for `fiorevera.hu`, note registrant + registrar.
- Vera's phone sign-off of the three locales (MASTER-PLAN 4.2).
- Confirm Vercel Analytics shows *Enabled*; confirm Sitemaps shows *Success*.
- GO on the privacy hosting + recipient copy (plan §7.4) — recommendation: ship as proposed.
- "301" wording vs literal 301 in `vercel.json` — recommendation: keep 308, fix wording.
- When/if Vercel pauses the site: upgrade team to Pro (one seat) — recommendation already recorded.
- Keep the Webnode login alive until the transfer completes (DNS editor is the only place to change records until then).

## 7. Friction (what cost time and how to avoid it next time)
- Auto-mode classifier refused batched WebSearch/WebFetch/Bash calls after a hook rewrote one (`rtk git show`) → issue web calls one per response; avoid `git show` in pipelines or expect a re-issue.
- `cd` into the shared notes folder changed the shell's cwd for the session → always use absolute paths, never `cd`.
- zsh has no `PIPESTATUS` → use `cmd; echo $?` or `pipestatus`.
- Filtering diff lines with `grep -v "^[-+][-+]"` hides every BACKLOG line (they start with `- [`) → print diff lines with python or `grep -E "^(@@|\+- |-- \[)"`.
- Shared BACKLOG/data-register hunks from idle sessions forced patch-filtered staging for every commit → one session owns BACKLOG edits per day, or sessions append under their own heading.
- Vercel edge served the apex certificate for www minutes after issuance → test certs with `openssl s_client -servername`, wait 5 min before declaring a cert problem.
- Local DNS cache (TTL 3600) made curl show Webnode's 404 after the switch → verify via `dig @ns1.register.it` / `@8.8.8.8` and `curl --resolve host:443:IP`.
- The owner merged to `main` while my checkout sat on the feature branch → `git merge --ff-only origin/main` before committing; push `HEAD:main` directly on GO (fast-forward).
- Docs connector: `projection` reads cannot ride in a `batch`; load the standalone `read` tool first.
