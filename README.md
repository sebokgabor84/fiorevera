# Fiore Vera

Website for a decoration & floristry business, built on the agent-driven, skill-based workflow proven in [GaborPortfolio](https://github.com/sebokgabor84/GaborPortfolio). Stack: **React + TypeScript + Vite + Vitest + Playwright**, multilingual SPA.

> **This README is a living checkpoint.** It records the plan and what has been done so any session can pick up where the last one stopped. Update it at the end of every iteration.

---

## Status

| | |
|---|---|
| **Current iteration** | 1 — repository scaffold + plan + planning skills installed |
| **Next iteration** | 2 — grill open questions → PRD → master plan → source content → build |
| **Local path** | `/Users/gabor.seboek/Documents/Projects/Private/fiorevera` |
| **Remote** | `https://github.com/sebokgabor84/fiorevera` |
| **Template source** | `/Users/gabor.seboek/Documents/Projects/Private/Learning/GaborPortfolio` |

---

## The Plan

The goal is to rebuild the GaborPortfolio framework reshaped for the decoration business — same proven tech stack, QA pipeline, and skill-driven agent workflow, but reskinned and re-content-ed for the new domain.

### Steps

1. **Repository setup** — new `fiorevera` repo, GaborPortfolio used as the structural template. *(done — iteration 1)*
2. **Install planning skills** from [mattpocock/skills](https://github.com/mattpocock/skills): `grill-me` (stress-test the plan) and `to-prd` (turn the concept into a PRD). *(done — iteration 1)*
   - Global install (`-g`) is **not supported** for these (PromptScript skills), so they were installed locally.
   - The CLI's `--skill=` filter is ignored — it pulls the whole catalog — so the 26 extras were pruned.
   - Both skills were then **consolidated into `.agent/skills/`** to match this repo's convention; the CLI's `.agents/` folder and `skills-lock.json` were removed. We are **not** using `npx skills` going forward — update these prompt files by hand.
   - ⚠️ `to-prd` expects a project issue tracker + label vocabulary to publish into. fiorevera has none yet — in iteration 2, either wire it to GitHub Issues on this repo or have it emit the PRD as a local markdown file.
3. **Resolve the open questions** with `grill-me` — interview, one question at a time, to settle business name, current URL, locale scope, page list, brand palette, and hosting target. `grill-me` walks the decision tree until there is shared understanding. This must come **before** the PRD (see Honest Critique #2).
4. **Synthesize the PRD** with `to-prd` — turn the resolved understanding into a PRD. `to-prd` does **not** interview; it synthesizes what is already known — which is exactly why step 3 comes first.
5. **Document the master plan** — freeze the PRD into a single execution contract (`MASTER-PLAN.md`): a numbered, point-by-point checklist the agent follows **verbatim** during the build. Every build action must trace to a numbered item; nothing gets built that isn't on the list. This is the anti-drift gate. Each item links back to its PRD user story / decision.
6. **Source & optimize content** — gather her real photography + copy; convert to `webp` ≤ 200 KB into `public/assets/` (per `qa-specialist` rules). A decoration site **is** its imagery — a hard build blocker, not an afterthought.
7. **Reshape / prune the skills** for the decoration domain (see table below), guided by the master plan. Drop any skill that doesn't earn its place at this site's scale (see Honest Critique #4).
8. **QR-code quick win** — iPhone-lockscreen QR to her current live site via `lockscreen-qr-generator`. Independent of the rest — can ship as soon as the URL (step 3) is known.

### Skills to reshape (iteration 2)

The `.agent/skills/` folder currently holds the **GaborPortfolio versions verbatim** — they are the base, not the final form.

| Skill | Reshape direction |
|---|---|
| `design-system-expert` | Steampunk dark mode → elegant / natural / floral aesthetic (palette + typography TBD) |
| `seo-expert` | Re-target keywords to decoration / floristry / events; local SEO |
| `accessibility-expert` | Keep — domain-agnostic; re-verify against new components |
| `i18n-guardian` | Confirm locale set (HU primary? + EN/DE); re-key all copy |
| `qa-specialist` | Keep DoD pipeline; re-baseline vitals/E2E for new pages |
| `skill-creator` | Keep — meta skill |
| `lockscreen-qr-generator` | Repurpose for the QR quick-win (step 8) |
| `desktop-background-generator` | Evaluate relevance; likely dropped (see Honest Critique #4) |

---

## Honest Critique

Per AGENT.md, every plan must challenge its own assumptions. Top risks in this plan, ordered by impact:

1. **Architecture mismatch — reuse the stack, rebuild the IA.** GaborPortfolio is a single-person *showcase* (projects, KPIs, "Mission Control" carousel). A decoration business is a *small-business marketing site* (gallery, services, about, contact/booking). The tech stack + QA pipeline transfer cleanly; the information architecture and data contracts (`projects.ts`, `kpis.ts`, Mission Control) do **not**. Treat `src/data` and `src/pages` as a **rebuild**, not a reskin — don't force floral content into a KPI carousel.
2. **`grill-me` must precede `to-prd`.** `to-prd` explicitly does not interview — it synthesizes known context. Running it while the open questions are unresolved yields a hallucinated PRD (violates zero-hallucination). Hence the reordered steps 3→4.
3. **Imagery and hosting are first-class, not afterthoughts.** A decoration site lives on its photography (step 6) and needs a named deploy target (open questions). Both were absent from the first draft and are real build blockers.
4. **Scope: prune skills to fit a ~5-page site.** 8 domain skills is portfolio-scale over-engineering. `desktop-background-generator` and the Mission Control asset generators add nothing here; `i18n-guardian` collapses if HU-only. Keep only what earns its place — decide once locale + page count are fixed.

---

## Open Questions (resolve at start of iteration 2)

- [ ] **Business name** — is it literally "Fiore Vera"? (inferred from the repo name)
- [ ] **Current live website URL** — required for the QR-code quick win.
- [ ] **Primary locale(s)** — HU only, or HU/EN/DE like the portfolio? (decides whether `i18n-guardian` stays)
- [ ] **Brand palette & typography** — drives the `design-system-expert` reshape.
- [ ] **Page list** — confirm via the PRD (gallery, services, about, contact, …).
- [ ] **Hosting & domain** — where does the *new* site deploy (GitHub Pages / Netlify / Vercel), under what domain? The QR (step 8) points at the *current* site; the goal is to replace it.
- [ ] **Content / photography** — does she have a usable photo set, or must it be shot/sourced first? (gates step 6)

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
