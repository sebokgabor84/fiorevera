# Fiore Vera

Website for a decoration & floristry business, built on the agent-driven, skill-based workflow proven in [GaborPortfolio](https://github.com/sebokgabor84/GaborPortfolio). Stack: **React + TypeScript + Vite + Vitest + Playwright**, multilingual SPA.

> **This README is a living checkpoint.** It records the plan and what has been done so any session can pick up where the last one stopped. Update it at the end of every iteration.

---

## Status

| | |
|---|---|
| **Current iteration** | 1 — repository scaffold + plan + planning skills installed |
| **Next iteration** | 2 — references & brand assets → interview-mode PRD → grill → real PRD → master plan → build |
| **Local path** | `/Users/gabor.seboek/Documents/Projects/Private/fiorevera` |
| **Remote** | `https://github.com/sebokgabor84/fiorevera` |
| **Template source** | `/Users/gabor.seboek/Documents/Projects/Private/Learning/GaborPortfolio` |
| **Business / legacy site** | **Fiore Vera** — legacy origin: [www.fiorevera.hu](https://www.fiorevera.hu) (baseline to improve on; QR target) |

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
4. **Draft the PRD — interview mode** (NOT the `to-prd` skill yet) — the agent interviews directly, one question at a time, to resolve the open questions and shape an initial PRD draft.
5. **Iterate & write the real PRD** — stress-test the draft with `grill-me`, then commit it to a real PRD document. (`to-prd` is deferred to a later iteration, once a publish/issue-tracker target exists.)
6. **Document the master plan** — freeze the PRD into a single execution contract (`MASTER-PLAN.md`): a numbered, point-by-point checklist the agent follows **verbatim** during the build. Every build action must trace to a numbered item; nothing gets built that isn't on the list. This is the anti-drift gate. Each item links back to its PRD user story / decision.
7. **Source & optimize content** — gather her real photography + copy; convert to `webp` ≤ 200 KB into `public/assets/` (per `qa-specialist` rules). A decoration site **is** its imagery — a hard build blocker, not an afterthought.
8. **Reshape the skills** for the decoration domain (see table below), guided by the master plan. **All 8 are kept by design** — see Ecosystem Vision and Honest Critique #4.
9. **Quick win → ecosystem** — ship the iPhone-lockscreen QR (her digital visit card → fiorevera.hu) first via `lockscreen-qr-generator`; the Mac wallpaper (company representation) and the full showcase site follow as the ecosystem builds out.

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
| `lockscreen-qr-generator` | iPhone lockscreen QR — her digital visit card → fiorevera.hu (step 9) |
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

Per AGENT.md, every plan must challenge its own assumptions. The four risks raised at v1 are below — all are now resolved (each with the decision taken); remaining items are execution tasks, not open risks.

1. ✅ **Architecture mismatch.** GaborPortfolio is a single-person *showcase* (projects, KPIs, "Mission Control" carousel); a decoration business is a *marketing site* (gallery, services, about, contact). The stack + QA pipeline transfer cleanly; the IA and data contracts (`projects.ts`, `kpis.ts`, Mission Control) do not. **Resolved (accepted, known risk):** keep the GaborPortfolio base and extend it with new content blocks + multiple pages rather than rebuilding from scratch. The IA divergence is managed during the build.
2. ✅ **PRD sequencing.** `to-prd` explicitly does not interview — it synthesizes known context, so running it against unresolved questions yields a hallucinated PRD. **Resolved:** iteration-1 PRD is drafted in the agent's **interview mode** (not `to-prd`), iterated with `grill-me`, then written to a real PRD. `to-prd` deferred.
3. ✅ **Imagery, references & hosting are first-class.** A decoration site lives on its photography and visual references; it also needs a deploy target. **Resolved:** added a references & brand-assets step (incl. legacy-site audit + seed inspiration list) and a content-sourcing step; hosting is **Vercel** (setup pending as a build task), domain to take over `fiorevera.hu` when ready.
4. ✅ **Skill scope.** My recommendation was to prune the 8 skills for a small site — **overruled, correctly.** The skill set is intentional: the goal is the full digital + physical ecosystem above, where `desktop-background-generator` (Mac wallpaper) and `lockscreen-qr-generator` (iPhone visit card) are core pillars, not the QR quick win alone.

---

## Open Questions (resolve at start of iteration 2)

- [x] **Business name** — **Fiore Vera**. *(confirmed)*
- [x] **Current live website URL** — [www.fiorevera.hu](https://www.fiorevera.hu) — legacy origin; QR target & baseline. *(confirmed)*
- [x] **Locales** — **multilingual HU / EN / DE**, like GaborPortfolio (HU primary). `i18n-guardian` stays multi-locale. *(confirmed)*
- [ ] **Brand palette & typography** — drives the `design-system-expert` reshape; partly derivable from the legacy site + chosen references (step 3).
- [/] **Inspiration references** — seed list (more to come; treated as basic starting points): [akerteszlanya.hu](https://www.akerteszlanya.hu/), [naturalweddingdecor.hu](https://naturalweddingdecor.hu/). Expanded + audited in step 3.
- [ ] **Page list** — confirm via the PRD (gallery, services, about, contact, …); multiple pages expected.
- [x] **Hosting** — **Vercel** *(decided; not yet set up — setup is an iteration-2 task)*. Domain: take over `fiorevera.hu` once the new site is ready (timing TBD).
- [ ] **Content / photography** — does she have a usable photo set, or must it be shot/sourced first? (gates step 7)

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
├── AGENT.md              # agent router (identity adapted; skill routing inherited)
├── index.html           # adapted shell (Fiore Vera placeholders)
├── package.json          # name=fiorevera; deps/scripts from template
└── [tsconfig*, vite, eslint, prettier, playwright, .gitignore, .env.example]
```

> The app does **not** build yet — source files (`main.tsx`, components, data, locales) are intentionally absent and arrive in iteration 2. This commit is a structure + plan checkpoint only.

## Local dev (once iteration 2 adds source)

```bash
npm install
npm run dev          # vite dev server
npm run lint         # eslint
npm test -- --run    # vitest
npm run test:e2e     # playwright
npm run build        # tsc + vite build
```
