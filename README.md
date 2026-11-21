# Fiore Vera

The website of **Fiore Vera**, a wedding decoration, floristry and prop-rental business in Zalakaros, Hungary: [www.fiorevera.hu](https://www.fiorevera.hu). Hungarian, German and English; every page prerendered to static HTML; no backend, no database, no CMS. The site is built and maintained by AI coding agents under a written contract, and its owners change the content by talking to one of them.

> **This README is a living checkpoint.** It says what the project is, how it works and where it stands, so any session can pick up where the last one stopped. Update the Status table at the end of every iteration.

---

## Status

| | |
|---|---|
| **Status** | **Live since 2026-11-16** on [www.fiorevera.hu](https://www.fiorevera.hu) (Vercel, Hobby plan; production deploys from `main` on every push). DNS is still served from Webnode's DNS centre until the domain moves to Rackhost |
| **Current iteration** | 5 — content management without a CMS (built 2026-11-21, pull request 22; the pilot with Vera has not started): the CMS Coordinator agent, content operations as tested scripts, the content release path with a PIN as its last line, the `/goodmorning` routine, a tech-lead skill and a decision log. Before it: 4 — launch week: MASTER-PLAN Phases 0–2 built and merged to `main`; contact form on Web3Forms (2.10), E2E green on 4 browsers (3.2), Vercel project (4.1) and DNS cutover (4.3) done; visual-regression gate, GDPR audit and the F3 crest favicon in place |
| **Next iteration** | 5b — the pilot with Vera on her Mac (set-up by Gabor: approvers' PINs, `gh`, the family account; then eight tasks, the first real content release supervised): [`docs/vera-agent/PRD.md`](docs/vera-agent/PRD.md) §3.7. Still open from 4b — Rackhost domain transfer (4.5), Search Console follow-up at day 7 / day 30 (4.4), Vera's cover picks, copy sign-off and phone review (1.3 / 2.3 / 2.4 / 3.4 / 4.2; the pilot is built around them), the manual VoiceOver run (3.1), Lighthouse ≥ 90 per route (3.3). Open work and owner decisions: [`BACKLOG.md`](BACKLOG.md) |
| **Changing content** | There is no CMS. The owners talk to the **CMS Coordinator** (`cms-coordinator` skill); it changes content only through `npm run content`, shows the result on a review page and puts it live through one checked script. Vera's one-page guide (Hungarian): [`docs/vera-agent/utmutato.md`](docs/vera-agent/utmutato.md); concept: [`docs/vera-agent/PRD.md`](docs/vera-agent/PRD.md); what went live: `docs/vera-agent/changelog.md` (written by the release script) |
| **Decisions** | Technical decisions of the owner, one file each: [`docs/decisions/`](docs/decisions/README.md) (`tech-lead` skill). Product decisions: `docs/PRD.md` |
| **Operations** | [`docs/operations/runbook.md`](docs/operations/runbook.md) (hosting, DNS, uptime monitor, form quota, rollback, first checks); launch record: [`docs/launch/domain-and-hosting-plan.md`](docs/launch/domain-and-hosting-plan.md) |
| **Remote** | `https://github.com/sebokgabor84/fiorevera` |
| **Business / legacy site** | **Fiore Vera** — the legacy Webnode site on the same domain expired in November 2026 and is archived under `references/legacy/` (the baseline the new site improved on); the QR target stays www.fiorevera.hu |
| **PRD / scope** | [`docs/PRD.md`](docs/PRD.md) (decisions D-1…D-18, stories US-1…US-12) → frozen in [`MASTER-PLAN.md`](MASTER-PLAN.md) |
| **Origin** | Built on the structure of [GaborPortfolio](https://github.com/sebokgabor84/GaborPortfolio) (stack, quality pipeline, skill-driven agents). How the project was planned and built, as written at the time: [`docs/history/project-plan-2026.md`](docs/history/project-plan-2026.md) |
| **Template** | This is the first site of its kind and the model for sibling sites. Nothing has been extracted yet; the inventory for that work is [`docs/template/README.md`](docs/template/README.md) |

---

## How it works

- **Static site.** React 19 + TypeScript + Vite 7. `npm run build` prerenders 7 pages × 3 languages into `dist/` and Vercel serves the files; the browser hydrates them. Nothing reads the clock, the browser or storage while rendering.
- **Content is code.** Albums, rental items, testimonials, contact data and service areas are TypeScript data files checked by Zod contracts (`src/data/`); every sentence is a key in three locale files held in parity by a test (`src/i18n/locales/`); photos are WebP files in three sizes with a generated manifest (`public/assets/`, `src/data/generated/imageMeta.ts`).
- **One source per fact.** Routes, hreflang, sitemap and prerender all read `src/data/routes.ts`. Counts in tests are derived from the data.
- **Gates are code.** Lint and type check, unit tests, four-browser end-to-end tests with an accessibility scan, the production build, and a visual check (layout invariants at eight widths plus pixel baselines) run before every push. A visual change is approved by the owner on a generated review page, never in chat.
- **`main` is production.** Vercel deploys every push to `main`. Nothing is edited there: work happens on a branch and arrives through a pull request. Git hooks, agent hooks and a GitHub ruleset enforce it.
- **Agents work by contract.** `AGENTS.md` is the operating contract; 17 skills under `.agent/skills/` each own one area (design, SEO, accessibility, languages, privacy, quality, release, content, technical decisions, the start and the end of the day).
- **Owners change content without git.** The CMS Coordinator turns a request in plain Hungarian into a tested operation, shows it, and puts it live through one script after the approver's PIN.

## Repository map

```
AGENTS.md            the operating contract: principles, release protocol, skill routing
CLAUDE.md            build-level facts for agents: commands, conventions, architecture
MASTER-PLAN.md       the frozen build scope (34 items) · BACKLOG.md: everything that is open
src/                 the site: components, pages, data + contracts, locales, styles
public/assets/       shipped photos (WebP, three sizes) · tests/visual/__screenshots__/: pixel baselines
scripts/content/     content operations, classifier, gates, machine check, morning routine
scripts/release/     branch and release tooling, the content release path, approver identity
scripts/images/      the one image encoder (shared by the bulk script and the content operations)
scripts/*.ts|js|mjs  build steps (prerender, sitemap), checks (i18n, live site), asset generators
tests/               unit (Vitest), e2e (Playwright, 4 browsers), visual (production build)
.agent/skills/       the 17 skills · .agent/harvest/: session records · .agent/memory.md: learnings
.claude/             agent hooks and guards, the CMS Coordinator agent, slash-command pointers
.githooks/           pre-commit, pre-merge-commit, pre-push
docs/                PRD, decisions, operations runbook, launch record, QA, GDPR, CI proposal,
                     the owners' guide, template inventory, project history
references/legacy/   the archived Webnode site this one replaced
```

## A working day

| When | What | How |
|---|---|---|
| Start of the day | The agent asks who is at the keyboard (Vera or Gabor) and runs the morning routine: machine, checkout, what is open, is the live site healthy. Gabor proves it with his PIN (admin mode) | `/goodmorning` → `npm run content:morning -- --as <id>` (`goodmorning` skill) |
| A content change | One request in plain words → a `content/` branch → a tested operation → the gates → the review page (Before / After) → the owner's answers → the script runs every gate again → **the approver's PIN in a system dialog** → live, verified, logged | `cms-coordinator` skill; `npm run content -- help` |
| Undo, or never mind | "Vond vissza az utolsó változtatást" reverts the last content release through the same path; "mégsem kérem" drops an unreleased change | `npm run release:publish-content -- --rollback` / `-- --abandon` |
| Anything that is not content | Layout, components, legal texts, e-mail and address, the hero photo, new kinds of content, dependencies: assessed by `tech-lead`, built on a feature branch, merged by Gabor on GitHub (GO 1 / GO 2) | `release-manager` skill, `AGENTS.md` Release Protocol |
| End of the day | Backlog sync, learnings, handover note (admin sessions) | `goodbye` skill |

Who may approve: each owner has a PIN they chose themselves, typed only into a macOS dialog, stored hashed outside the repository (`npm run release:operator`; [`docs/decisions/0005`](docs/decisions/0005-who-is-at-the-keyboard.md)). `main` is protected on GitHub by a ruleset (pull request required, no force push, no deletion).

## Commands

```bash
npm install
npm run dev              # vite dev server → http://localhost:5173 (CSR; prerendered HTML only in the build)
npm run dev:form         # dev server + local fake form provider (npm run form:fake = provider only): test the contact form without real submissions
npm run lint             # eslint — 0 errors / 0 warnings
npm test -- --run        # vitest: routes, data contracts, i18n parity, server render of every route, archive, assets
npm run test:e2e         # playwright (chromium, firefox, webkit, Mobile Chrome) — reuses a running dev server
npm run test:visual      # visual regression + layout invariants against the production build (chromium; baselines committed)
npm run prepush          # lint → unit → build → visual — the same chain .githooks/pre-push runs before every push
npm run build            # sitemap → tsc → vite build → vite build --ssr → prerender 21 routes + a locale-neutral 404.html into dist/
npm run preview          # serve dist/ (static HTML per route)

npm run content -- help  # every content operation (albums, photos, covers, texts in 3 languages, rental items, testimonials, contact)
npm run content:morning -- --as <id>   # start-of-day routine (who is here, machine, checkout, open work, live site)
npm run content:doctor   # what this machine can do for a content change
npm run content:gates    # the gates of a content change, result for exactly this state
npm run content:classify # pure catalogue content, or does it need the technical owner?
npm run release:publish-content   # the content release path (--check, --handoff, --rollback, --abandon)
npm run release:operator # who may approve on this machine (PINs)
npm run release:status   # branch, open pull requests, hook health
npm run visual:page      # the owner's review page for a red visual run (docs/qa/visual-review-process.md)
npm run visual:size      # weight of the pixel baselines against their budgets
npm run verify:live      # read-only health check of the live site
```

The complete command list with what each one enforces is in `CLAUDE.md`.

### Legacy archive & replaceable assets (MASTER-PLAN 0.1 / 0.2)

```bash
npm run archive:legacy -- --seed-assets   # Webnode HU+DE pages → references/legacy/ (Markdown + raw HTML + manifest.json), 193 images, seeds assets-src/
npm run optimize:assets                   # BULK rebuild: assets-src/<slot>/ → public/assets/**/*.webp (≤ 200 KB; 1920 / 1280 / 800 px) + src/data/generated/imageMeta.ts — refuses when it would delete or reorder photos the manifest holds (--rebuild overrides)
```

- `references/legacy/manifest.json` and the Markdown copies are committed; `references/legacy/images/` + `references/legacy/raw/` (155 MB) and `assets-src/` (158 MB) are **git-ignored** because they exceed the 100 MB threshold (PRD D-17/R-6) — regenerate them with the two commands above; they exist complete on the technical owner's machine only.
- Photos of one album or rental item (PRD D-5) are added, removed and reordered with `npm run content -- album-add | photos-add | photos-remove | photos-move | rental-add`: same encoder, same limits, only that album's entry of the manifest changes, and no complete `assets-src/` is needed. The committed WebP files are the source of truth; originals are a local archive.
- The bulk script is for the hero, About and brand photos and for a full rebuild on the one machine that holds the complete `assets-src/`: drop originals into `assets-src/hero/` or `assets-src/about/`, run `npm run optimize:assets`.
- Contact form: set `VITE_FORM_ENDPOINT` (+ `VITE_FORM_ACCESS_KEY` for Web3Forms) — see `.env.example`. Without it the form fails cleanly and shows the e-mail fallback.

## Documentation map

| Read this | For | Kind |
|---|---|---|
| [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) | How agents work here; commands and conventions | living |
| [`BACKLOG.md`](BACKLOG.md), [`MASTER-PLAN.md`](MASTER-PLAN.md) | What is open; the frozen build scope | living |
| [`docs/vera-agent/utmutato.md`](docs/vera-agent/utmutato.md) | The owner's one-page guide to changing content (Hungarian) | living |
| [`docs/vera-agent/PRD.md`](docs/vera-agent/PRD.md) | Concept and decisions of the CMS Coordinator | decided; the code wins where they differ |
| [`docs/decisions/`](docs/decisions/README.md) | Technical decisions of the owner, one file each | append-only |
| [`docs/operations/runbook.md`](docs/operations/runbook.md) | Hosting, DNS, monitoring, form quota, rollback | living |
| [`docs/qa/visual-review-process.md`](docs/qa/visual-review-process.md), [`docs/qa/visual-regression-plan.md`](docs/qa/visual-regression-plan.md) | How a visual change is checked and approved | living |
| [`docs/gdpr/`](docs/gdpr/) | Personal-data register, processing record, greetings-list concept | living |
| [`docs/ci/README.md`](docs/ci/README.md) | A prepared, inactive CI workflow and what it would need | proposal |
| [`docs/template/README.md`](docs/template/README.md) | What is framework and what is this site, for the template work | inventory |
| [`docs/PRD.md`](docs/PRD.md), [`docs/launch/`](docs/launch/), `docs/qa/2026-*.md`, [`docs/history/`](docs/history/project-plan-2026.md), `.agent/harvest/` | The product decisions, the launch, QA sessions, the original plan, session notes | records |

A unit test (`tests/unit/docs.test.ts`) fails when a living document names a command, a content operation or a file that does not exist. A second one (`tests/unit/language.test.ts`) fails when a Hungarian word the owner rejected returns to the site copy or to a text the owners read.

## Ecosystem Vision

The website is one surface of a unified **digital + physical brand** for the floristry & decoration business:

- **Website** — the showcase / portfolio of her work (the core build), replacing the legacy [www.fiorevera.hu](https://www.fiorevera.hu).
- **iPhone lockscreen QR** — her phone becomes a digital visit card: people scan it in person and land on the site.
- **Mac wallpaper** — company representation on her working machine, part of a consistent brand presence.

This is why all 8 skills are retained: `lockscreen-qr-generator` and `desktop-background-generator` aren't portfolio leftovers — they are pillars of the ecosystem.
