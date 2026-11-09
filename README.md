# Fiore Vera

Website for a decoration & floristry business, built on the agent-driven, skill-based workflow proven in [GaborPortfolio](https://github.com/sebokgabor84/GaborPortfolio). Stack: **React + TypeScript + Vite + Vitest + Playwright**, multilingual SPA.

> **This README is a living checkpoint.** It records the plan and what has been done so any session can pick up where the last one stopped. Update it at the end of every iteration.

---

## Status

| | |
|---|---|
| **Current iteration** | 3 — first build pass on `feature/site-build`: MASTER-PLAN Phase 0 (archive + image pipeline), Phase 1 (tokens, locale router, i18n gate, header/toast/footer, SeoHead, prerender) and all Phase 2 pages render in HU/DE/EN with the archived legacy photography; unit + E2E suites in place |
| **Next iteration** | 3b — Vera's cover picks + copy sign-off per locale (1.3 / 2.4 / R-1), form provider wired (`VITE_FORM_ENDPOINT`, 2.10), skill reshapes (0.3), Phase 3 quality gates (axe, Lighthouse, all 4 Playwright projects), then Vercel (Phase 4) |
| **Local path** | `/Users/gabor.seboek/Documents/Projects/Private/fiorevera` |
| **Remote** | `https://github.com/sebokgabor84/fiorevera` |
| **Template source** | `/Users/gabor.seboek/Documents/Projects/Private/Learning/GaborPortfolio` |
| **Business / legacy site** | **Fiore Vera** — legacy origin: [www.fiorevera.hu](https://www.fiorevera.hu) (Webnode; baseline to improve on; QR target) |
| **PRD / scope** | [`docs/PRD.md`](docs/PRD.md) (decisions D-1…D-17, stories US-1…US-12) → frozen in [`MASTER-PLAN.md`](MASTER-PLAN.md) |

---

## The Plan

The goal is to build Fiore Vera on the **GaborPortfolio base** — same proven tech stack, QA pipeline, and skill-driven agent workflow — extended with new content blocks and multiple pages for the decoration domain. The bigger picture is a **digital + physical brand ecosystem** (see Ecosystem Vision), not just a website.

### Steps

1. **Repository setup** — new `fiorevera` repo, GaborPortfolio used as the structural template. *(done — iteration 1)*
2. **Install planning skills** from [mattpocock/skills](https://github.com/mattpocock/skills): `grill-me` (stress-test the plan) and `to-prd` (turn the concept into a PRD). *(done — iteration 1)*
   - Global install (`-g`) is **not supported** for these (PromptScript skills), so they were installed locally.
   - The CLI's `--skill=` filter is ignored — it pulls the whole catalog — so the 26 extras were pruned.
   - Both skills were then **consolidated into `.agent/skills/`** to match this repo's convention; the CLI's `.agents/` folder and `skills-lock.json` were removed. We are **not** using `npx skills` going forward — update these prompt files by hand.
   - ⚠️ `to-prd` expects a project issue tracker + label vocabulary to publish into. fiorevera has none yet — in iteration 2, either wire it to GitHub Issues on this repo or have it emit the PRD as a local markdown file.
3. **Gather references & brand assets** — collect the inspiration example pages we want to draw from, plus brand tokens (font style, logo, favicon), and audit the **legacy origin site [www.fiorevera.hu](https://www.fiorevera.hu)** as the starting baseline. These feed both the PRD and the `design-system-expert` reshape. Store them under a `references/` area in the repo.
4. **Draft the PRD — interview mode** (NOT the `to-prd` skill yet) — the agent interviews directly, one question at a time, to resolve the open questions and shape an initial PRD draft. *(done — 2026-11-09, 13 branches resolved; legacy site audited first)*
5. **Iterate & write the real PRD** — stress-test the draft with `grill-me`, then commit it to a real PRD document. (`to-prd` is deferred to a later iteration, once a publish/issue-tracker target exists.) *(done — [`docs/PRD.md`](docs/PRD.md))*
6. **Document the master plan** — freeze the PRD into a single execution contract (`MASTER-PLAN.md`): a numbered, point-by-point checklist the agent follows **verbatim** during the build. Every build action must trace to a numbered item; nothing gets built that isn't on the list. This is the anti-drift gate. Each item links back to its PRD user story / decision. *(done — [`MASTER-PLAN.md`](MASTER-PLAN.md), 34 items in 5 phases)* *(Relationship to `BACKLOG.md`: the master plan is the **frozen, closed scope** for this build; `BACKLOG.md` — per AGENTS.md — captures **emergent / out-of-scope** ideas found mid-build. New ideas go to the backlog, never silently into the master plan.)*
7. **Source & optimize content** — **decided (PRD D-5):** reuse the legacy CDN photos only (169 images, ≤ 1920 px), archived first by `scripts/archive-legacy.ts`, then converted to `webp` ≤ 200 KB into `public/assets/`. Copy: legacy HU rewritten + natively translated, Vera signs off (D-12). The build blocker is now copy sign-off, not photos.
8. **Reshape the skills** for the decoration domain (see table below), guided by the master plan — **`design-system-expert` first**, since the palette / typography / component system drives everything built in step 9. All 8 kept by design (see Ecosystem Vision / Honest Critique #4).
9. **Build the site — incremental slices** — build **one vertical slice at a time** (a single page or section), each tracing to a `MASTER-PLAN.md` item. Per-slice loop: build → `lint` + unit → **visual verification** (run the dev server, view it in a real browser / screenshot, eyeball against the references) → commit → next slice. **No slice is "done" until it has been seen** — the `qa-specialist` DoD checks lint/test/vitals but *not* whether it looks right, so the visual gate is mandatory. This step — not the planning — is where drift kills agentic builds.
10. **Launch / cutover** — deploy to **Vercel**, point the `fiorevera.hu` domain at the new site, retire the legacy page. Definition of *shipped* = new site live on the domain + legacy retired.

> **Parallel track — ship now, independent of the build:** the **iPhone-lockscreen QR** (digital visit card → fiorevera.hu) needs only the URL (known) + `lockscreen-qr-generator`, so it can ship immediately without waiting on steps 3–10. The **Mac wallpaper** (`desktop-background-generator`) is similarly standalone. Both are ecosystem pillars (see Ecosystem Vision), not gated behind the site build.

### Skills to reshape (iteration 2)

The `.agent/skills/` folder currently holds the **GaborPortfolio versions verbatim** — they are the base, not the final form.

| Skill | Reshape direction |
|---|---|
| `design-system-expert` | Steampunk dark mode → elegant / natural / floral aesthetic (palette + typography TBD) |
| `seo-expert` | Re-target keywords to decoration / floristry / events; local SEO |
| `accessibility-expert` | Keep — domain-agnostic; re-verify against new components |
| `i18n-guardian` | Multilingual HU / EN / DE (HU primary), like the portfolio; re-key all copy |
| `qa-specialist` | Keep DoD pipeline; re-baseline vitals/E2E for new pages |
| `skill-creator` | Keep — meta skill |
| `lockscreen-qr-generator` | iPhone lockscreen QR — her digital visit card → fiorevera.hu (parallel track — ship now) |
| `desktop-background-generator` | **Keep** — Mac wallpaper / company representation (ecosystem vision) |

---

## Ecosystem Vision

The website is one surface of a unified **digital + physical brand** for the floristry & decoration business:

- **Website** — the showcase / portfolio of her work (the core build), replacing the legacy [www.fiorevera.hu](https://www.fiorevera.hu).
- **iPhone lockscreen QR** — her phone becomes a digital visit card: people scan it in person and land on the site.
- **Mac wallpaper** — company representation on her working machine, part of a consistent brand presence.

This is why all 8 skills are retained: `lockscreen-qr-generator` and `desktop-background-generator` aren't portfolio leftovers — they are pillars of the ecosystem.

---

## Honest Critique

Per AGENTS.md, every plan must challenge its own assumptions. The risks below were raised across reviews — all are now resolved (each with the decision taken); remaining items are execution tasks, not open risks.

1. ✅ **Architecture mismatch.** GaborPortfolio is a single-person *showcase* (projects, KPIs, "Mission Control" carousel); a decoration business is a *marketing site* (gallery, services, about, contact). The stack + QA pipeline transfer cleanly; the IA and data contracts (`projects.ts`, `kpis.ts`, Mission Control) do not. **Resolved (accepted, known risk):** keep the GaborPortfolio base and extend it with new content blocks + multiple pages rather than rebuilding from scratch. The IA divergence is managed during the build.
2. ✅ **PRD sequencing.** `to-prd` explicitly does not interview — it synthesizes known context, so running it against unresolved questions yields a hallucinated PRD. **Resolved:** iteration-1 PRD is drafted in the agent's **interview mode** (not `to-prd`), iterated with `grill-me`, then written to a real PRD. `to-prd` deferred.
3. ✅ **Imagery, references & hosting are first-class.** A decoration site lives on its photography and visual references; it also needs a deploy target. **Resolved:** added a references & brand-assets step (incl. legacy-site audit + seed inspiration list) and a content-sourcing step; hosting is **Vercel** (setup pending as a build task), domain to take over `fiorevera.hu` when ready.
4. ✅ **Skill scope.** My recommendation was to prune the 8 skills for a small site — **overruled, correctly.** The skill set is intentional: the goal is the full digital + physical ecosystem above, where `desktop-background-generator` (Mac wallpaper) and `lockscreen-qr-generator` (iPhone visit card) are core pillars, not the QR quick win alone.
5. ✅ **Execution cadence, not just planning.** The plan was strong on planning but vague on the build itself — and for agentic dev, the build is where drift actually happens. **Resolved:** added an explicit incremental-build step (step 9 — vertical slices, each gated by a mandatory **visual verification** the `qa-specialist` DoD doesn't cover) + a launch/cutover step (10), pulled the QR quick win into an independent parallel track, and clarified `MASTER-PLAN.md` (frozen scope) vs `BACKLOG.md` (emergent tasks).

---

## Open Questions (resolve at start of iteration 2)

- [x] **Business name** — **Fiore Vera**. *(confirmed)*
- [x] **Current live website URL** — [www.fiorevera.hu](https://www.fiorevera.hu) — legacy origin; QR target & baseline. *(confirmed)*
- [x] **Locales** — **multilingual HU / EN / DE**, like GaborPortfolio (HU primary). `i18n-guardian` stays multi-locale. *(confirmed)*
- [x] **Brand palette & typography** — locked in `design-system-expert` (linen / sage / blush / gold; Cormorant Garamond + Inter). *(confirmed 2026-09-26)*
- [/] **Inspiration references** — seed list (more to come; treated as basic starting points): [akerteszlanya.hu](https://www.akerteszlanya.hu/), [naturalweddingdecor.hu](https://naturalweddingdecor.hu/). Expanded + audited in step 3.
- [x] **Page list** — **7 pages**: Home, Services, Gallery, Prop Rental, About, Contact, Privacy. Flower Garden **paused** (garden on hold through the dry summers, planned to return; 301 → About, revertible). Routes for HU/DE/EN in PRD D-3. *(confirmed 2026-11-09)*
- [x] **Hosting** — **Vercel** *(decided; not yet set up — setup is an iteration-2 task)*. Domain: take over `fiorevera.hu` once the new site is ready (timing TBD).
- [x] **Content / photography** — reuse the legacy site's ~169 professional wedding photos from the Webnode CDN as a replaceable first set; asset structure built for swapping (PRD D-5, risk R-2). *(confirmed 2026-11-09)*
- [x] **Rendering** — prerender every route to static HTML at build time to protect current rankings (PRD D-18). *(confirmed 2026-11-09)*
- [x] **Services** — 3 pillars: full wedding decoration, wedding floristry (seasonal, sourced), prop rental with HUF catalog (PRD D-8). *(confirmed 2026-11-09)*
- [x] **Contact flow** — Web3Forms/Formspree form + direct links; cookieless Vercel Analytics, no consent banner (PRD D-9, D-10). *(confirmed 2026-11-09)*
- [x] **Locale behaviour** — no auto-redirect; language-suggestion toast under the switcher (PRD D-4). *(confirmed 2026-11-09)*
- [ ] **DNS / registrar access** for `fiorevera.hu` — who holds the login? (PRD R-7; needed at MASTER-PLAN 4.3)

---

## What's in this scaffold (iteration 1)

```
fiorevera/
├── .agent/
│   ├── rules/            # RTK token-efficiency rules (from template)
│   └── skills/           # 8 portfolio skills (to reshape) + grill-me & to-prd (planning)
├── public/assets/        # (empty — assets added in iteration 2)
├── scripts/              # (empty — optimize-images.js etc. added in iteration 2)
├── src/
│   ├── components/       # (empty)
│   ├── data/             # (empty — projects/kpis/types added in iteration 2)
│   ├── i18n/locales/     # (empty — en/de/hu json added in iteration 2)
│   └── pages/            # (empty)
├── tests/e2e/            # (empty)
├── AGENTS.md              # agent router (identity adapted; skill routing inherited)
├── index.html           # adapted shell (Fiore Vera placeholders)
├── package.json          # name=fiorevera; deps/scripts from template
└── [tsconfig*, vite, eslint, prettier, playwright, .gitignore, .env.example]
```

> The app does **not** build yet — source files (`main.tsx`, components, data, locales) are intentionally absent and arrive in iteration 2. This commit is a structure + plan checkpoint only.

## Local dev

```bash
npm install
npm run dev              # vite dev server → http://localhost:5173 (CSR; prerendered HTML only in the build)
npm run lint             # eslint — 0 errors / 0 warnings
npm test -- --run        # vitest: routes, data contracts, i18n parity, server render of every route, archive, assets
npm run test:e2e         # playwright (chromium, firefox, webkit, Mobile Chrome) — reuses a running dev server
npm run test:visual      # visual regression + layout invariants against the production build (chromium; baselines committed)
npm run prepush          # lint → unit → build → visual — the same chain .githooks/pre-push runs before every push
npm run build            # sitemap → tsc → vite build → vite build --ssr → prerender 21 routes + a locale-neutral 404.html into dist/
npm run preview          # serve dist/ (static HTML per route)
```

### Legacy archive & replaceable assets (MASTER-PLAN 0.1 / 0.2)

```bash
npm run archive:legacy -- --seed-assets   # Webnode HU+DE pages → references/legacy/ (Markdown + raw HTML + manifest.json), 193 images, seeds assets-src/
npm run optimize:assets                   # assets-src/<slot>/ → public/assets/**/*.webp (≤ 200 KB, 1920 + 800 px) + src/data/generated/imageMeta.ts
```

- `references/legacy/manifest.json` and the Markdown copies are committed; `references/legacy/images/` + `references/legacy/raw/` (155 MB) and `assets-src/` (158 MB) are **git-ignored** because they exceed the 100 MB threshold (PRD D-17/R-6) — regenerate them with the two commands above. Local path on the build machine: `/Users/gabor.seboek/Documents/Projects/Private/fiorevera/references/legacy/images/`.
- To replace imagery (PRD D-5): drop originals into `assets-src/hero/`, `assets-src/gallery/<album-slug>/`, `assets-src/rental/<item-id>/` or `assets-src/about/`, run `npm run optimize:assets`, then adjust `coverIndex` in `src/data/albums.ts` if the cover moved.
- Contact form: set `VITE_FORM_ENDPOINT` (+ `VITE_FORM_ACCESS_KEY` for Web3Forms) — see `.env.example`. Without it the form fails cleanly and shows the e-mail fallback.
