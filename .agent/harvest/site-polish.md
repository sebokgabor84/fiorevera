# Harvest: Site polish (visible and content improvements, visual review as code, carousel fix)
Session: site-polish · period: 2026-11-16–2026-11-19 · commits on main: `3741eb4`, `eddd37b`, `34f7a42` (pull request 11, merge `5c211c7`), `a9150b0` (pull request 15, merge `bd7e986`), `6c9b150` (pull request 13, carried over by the cleanup session)

## 1. What this session delivered
- Privacy page names its processors in HU/DE/EN: `privacy.sections.hosting` (Vercel) and `privacy.sections.form.processor` (Web3Forms), `PRIVACY_UPDATED` 16 Nov 2026 — `src/pages/PrivacyPage.tsx`, locale files / `3741eb4`
- Data register: `hosting` entry, Web3Forms facts as read on 2026-11-16, 11 `inquiryPayload` keys, sealed 2026-11-18; Art. 30 record `docs/gdpr/processing-record.md` (read by the owner 2026-11-18) — `3741eb4`, `eddd37b`
- Footer e-mail breaks at the "@" only (`src/components/Common/EmailLink.tsx`), house number stays with the street (`displayAddress()`), social pills never break — `3741eb4`
- Icon set: `/favicon.ico` (16/32/48), maskable Android icon + manifest entry, drift guard `scripts/favicon/icon-set.json` ↔ `tests/unit/favicon.test.ts`, Python dependency documented — `3741eb4`; glyph script reads `scripts/fonts-src/` — `6c9b150`
- Inquiry mail with Hungarian field labels (`INQUIRY_MAIL_LABELS`, `replyto`) — `src/lib/submitInquiry.ts` / `3741eb4`; confirmed by the owner with a delivered mail 2026-11-18
- QA minors: 61 rows triaged, 33 fixed — `docs/qa/2026-11-16-minor-triage.md` (plurals, dead keys, tel link, `scroll-snap-stop`, deep-link offset, form name / date min / one error summary, focus on route change, back/forward scroll, hash-keeping language links, case-insensitive routes, readable line length, carousel above the scroll-to-top button)
- Ten owner decisions prepared with rendered options, decided 2026-11-18 and built (D1–D10 in the triage file)
- Visual review as code: `scripts/visual-review-page.ts` (`npm run visual:page`, `-- --spec`, `-- --answers`), `docs/qa/visual-review-process.md`, `docs/qa/reviews/2026-11-18-site-polish.json`, `tests/unit/visualReview.test.ts`; AGENTS.md POST-4 and `qa-specialist` point to it — `3741eb4`, `34f7a42`
- 20 baselines re-recorded through the approval script after three review rounds — `docs/qa/visual-baselines-log.md`
- Carousel: counter shows the destination, presses continue from it, cut-short moves are finished; four new e2e tests — `src/components/Gallery/AlbumSection.tsx`, `tests/e2e/gallery.spec.ts` / `a9150b0`
- Review artifact (three rounds): https://claude.ai/artifact/FR8axYy8QmqtURQNZCA9so — not in the repo

## 2. Learnings (rules a future agent must follow)
- **`global.css` loads after the component modules, so a global utility beats a module class on the same element** — `.btn` hid the hero ghost button's outline ("reads as plain text" in the QA report was this bug), `.container` cancelled `.prose` (150-character lines). Use two classes or target the children. `home.module.css` (`.heroActions .heroGhost`), `pages.module.css` (`.prose > *`), `3741eb4`. [architecture] [design]
- **Check a copy proposal's facts against the provider's pages on the day it ships** — the launch plan's §7.4 said "bound by a DPA" and "San Francisco"; Vercel's DPA names Pro and Enterprise only and the company sits in Covina, CA; the register's Web3Forms facts ("Kerala, US-East, 2 months") were no longer on its pages. Sources read 2026-11-16, register `hosting` / `env`. [legal]
- **web3forms.com answers 403 to plain fetches; open it in a browser** — `docs.web3forms.com` works either way. Unknown payload keys are forwarded to the mail as-is; reserved: `access_key`, `email`, `subject`, `replyto`, `ccemail`, `redirect`, `botcheck`, `from_name`. 2026-11-16. [tooling] [ops]
- **A visual change is approved on the generated review page only** (`npm run visual:page` → Artifact → pasted answers → `-- --answers`) — owner, 2026-11-18: "always do this artifact like review … build this into code". An `Issue` note is an instruction; a screen marked OK that did not change since is listed, not asked again. `docs/qa/visual-review-process.md`. [workflow] [owner-preference]
- **Show a taste decision as the real page with the option applied, and expect the pick to change when it is built** — D2 "price first" was picked from a crop and rejected on desktop when seen in the full page ("the previous version was better"); phones kept it. Round 2, 2026-11-18. [owner-preference] [design]
- **Measure contrast over a photo on every pixel behind the text, with transitions off** — the first run reported 1.98:1 for the ghost button because a `color` transition was mid-flight; real worst cases were lead 3.0 and subtitle 2.4. Fixed by gradient stops measured at 320–1920 px × 3 locales (`home.module.css`). [testing] [design]
- **Before pushing to a branch that has a pull request, check that the pull request is still open** — the owner merged pull request 11 while gates ran; my push re-created the deleted branch with a stray commit (`36ff081`), which the cleanup session had to carry over as pull request 13. `npm run release:status` right before `git push`. 2026-11-18. [workflow]
- **Do not claim a regression without reading the "before"** — I reported that the font subsetting dropped U+202F; the cmap of the full source fonts shows the glyph never existed. A WOFF2 cmap can be read with Node alone (brotli + table directory). 2026-11-19, note in `src/styles/fonts.css`. [workflow] [testing]
- **A comment in `src/data/**` moves the sitemap date of every route** — the `lastmod` fingerprint hashes the files, not the data. Keep notes out of data files. 2026-11-19. [seo] [tooling]
- **`scrollend` does not mean "came to rest"** — Chromium also fires it for an animation that a newer programmatic scroll replaced; Chromium and WebKit drop a smooth scroll when its scroll container takes focus (Chromium 20 of 20). The carousel therefore checks arrival per frame while a move is in flight. `AlbumSection.tsx` `ensureArrival`, `a9150b0`. [architecture] [testing]
- **A flaky e2e test is a bug report until proven otherwise** — "arrows and keys" failed 1 run in 16 in Firefox; the cause was a real stale-index race that also ran the live-region counter through 18 photos. Make the race deterministic in a test first (wait for `scrollLeft > 2`, record every counter text with a MutationObserver), then fix. [testing]
- **The app's Browser pane runs as a background page while hidden: no `requestAnimationFrame`, no smooth scrolling** — a manual check there proved nothing; `tabs_context` says whether the pane is hidden. Use the e2e engines for anything animated. 2026-11-19. [tooling]
- **`preview_start` on a name another checkout's server already uses can leave that server gone** — the main checkout's dev server on :5173 disappeared when this worktree started `fiorevera-dev`. Since pull request 9 each worktree has its own test ports. [tooling]
- **The rtk hook rewrites `curl` output too** — JSON from the GitHub API came back unparseable; use `rtk proxy curl`. Unauthenticated API calls are rate-limited (60 per hour): `release:cleanup` could not ask GitHub after my status checks. [tooling]

## 3. Facts and decisions (must exist in the repo as code or docs)
| Fact / decision | Decided by, when | Lives in the repo at | Missing? |
|---|---|---|---|
| D1 hero buttons full width and stacked below 48rem, all locales | owner, 2026-11-18 | `home.module.css`, triage file | no |
| D2 rental price first on phones; grid order on desktop | owner, 2026-11-18 (round 2 revert) | `RentalCard.tsx`, `rental.module.css` | no |
| D3 services eyebrow = "1 / 3" | owner, 2026-11-18 | `ServicesPage.tsx` | no |
| D4 HU: *te* for the reader's action, *ti* for the couple; only mixed sentences aligned | owner, 2026-11-18 | `i18n-guardian` §7 | no |
| D5 no automatic hyphenation at any width | owner, 2026-11-18 | `global.css`, `design-system-expert` | no |
| D6 the emoji in the rental step stays | owner, 2026-11-18 | triage file | no |
| D7 portrait covers: Vera picks landscape covers, no focus-point field | owner, 2026-11-18 | `BACKLOG.md` `[CONTENT]` | no |
| D8 stronger hero gradient (lead ≥ 4.8:1, subtitle ≥ 4.2:1) | owner, 2026-11-18 | `home.module.css` comment | no |
| D9 Speed Insights host out of the CSP; 308 stays, wording "permanent redirect" | owner, 2026-11-18 | `vercel.json`, MASTER-PLAN, AGENTS.md | no |
| D10 three EN phrases + DE home title | owner, 2026-11-18 | locale files | no |
| Hungarian mail labels work in a delivered mail; Reply goes to the visitor | owner's test from the Vercel preview, 2026-11-18 | `BACKLOG.md` `[FORM]` | no |
| Web3Forms DPA accepted in the dashboard | owner, 2026-11-18 | `docs/gdpr/processing-record.md` | no |
| Visual review procedure | owner, 2026-11-18 | `docs/qa/visual-review-process.md`, AGENTS.md POST-4 | no |
| U+202F is not in the brand fonts and needs no fix | measured 2026-11-19 | `src/styles/fonts.css`, `scripts/subset-fonts.mjs` | no |

## 4. Improvements NOT implemented yet
- [ ] JSON → `glyphs.ts` converter for `extract-glyphs.py` — the copy step is manual — `scripts/favicon/` — a new letter needs no hand copy — S — n
- [ ] `visual:page`: build option pictures from a list of style overrides instead of hand-written scratch scripts (the option shots of D1–D8 were made with throw-away Playwright scripts) — `scripts/visual-review-page.ts` — `--spec` can name an override per option — M — n
- [ ] `visual:page -- --answers` could write the approval-script command with the owner's name filled in — S — n
- [ ] Contrast check of the hero text as a gate (the measuring script lives only in the session scratchpad) — `tests/visual/` or a script — fails when the lead drops under 4.5:1 on any pixel — M — n
- [ ] Carousel: 45 tab stops across the gallery; arrow buttons share two names — not changed (owner-approved component) — S — y
- [ ] `main` not `inert` while the mobile menu is open — needs a breakpoint-safe design — S — n
- [ ] Target sizes at the 48 px house rule (footer links 32 px, language links 40 px) and `--fs-xs` at 12.6 px on phones — taste — S — y
- [ ] `priceRange` / `geo` in the JSON-LD, Product / Offer on the rental page, BreadcrumbList, OG image dimensions — needs facts from the owner and belongs to the SEO work — M — y
- [ ] `a11y.spec.ts` Firefox `networkidle` timeout on the contact page, seen once on 2026-11-18, not reproduced — watch — S — n
- [ ] Release-manager rule "check the pull request state right before any push to its branch" — today the skill says it for force pushes only — S — n
- [ ] The four open points of the processing record (retention rule, Gmail without a DPA, Vercel Hobby without a processor contract, two-step verification) — y

## 5. Skill updates needed
- `.agent/skills/release-manager/SKILL.md`: add the row "before ANY push to a branch with a pull request, run `npm run release:status`" (incident 2026-11-18, pull request 11 / `36ff081`).
- `.agent/skills/qa-specialist/SKILL.md`: the hidden Browser pane is a background page (no animation); a flaky test gets a deterministic reproduction before a retry; `rtk proxy curl` for API JSON.
- `.agent/skills/accessibility-expert/SKILL.md`: a live region must show the destination of an animated move, not the positions on the way.
- `.agent/skills/seo-expert/SKILL.md`: the sitemap fingerprint covers every byte of `src/data/**`, comments included.

## 6. Open owner decisions / things only Gabor or Vera can do
- The four open points of `docs/gdpr/processing-record.md` (see § 4).
- Vera: the 15 cover picks, now "landscape only" (D7); copy sign-off per locale (R-1); a look at the favicon on her phone.
- Whether `fix/carousel-key-race` and the other merged branches on origin may be deleted (`npm run release:cleanup`, from a checkout that is not on the branch).
- Vera's Claude gets `npm run visual:page` once her checkout is on the current `main`; nothing else to install.

## 7. Friction (what cost time and how to avoid it next time)
- `main` moved four times under one branch (pull requests 9, 10, 7, 14) and the update rule changed from merge to rebase in between → fetch right before every commit, read `release-manager` again when a guard or rule lands, expect doc conflicts with a harvest branch and resolve them by keeping its text and updating the facts.
- Two hand-built review rounds before the generator existed → the generator is in the repo now; start every review with `npm run visual:page`.
- Port 5173 and 4173 shared between checkouts until pull request 9 → solved by `scripts/checkout.ts`; before that, uncommitted Playwright configs on other ports.
- Vitest picked up a scratch copy of a spec placed inside the repo → keep scratch files outside the repo or delete them before the unit run.
- A wrong claim about the fonts cost a round with the owner → read the source artefact before naming a cause.
