# Fiore Vera

Website for a decoration & floristry business, built on the agent-driven, skill-based workflow proven in [GaborPortfolio](https://github.com/sebokgabor84/GaborPortfolio). Stack: **React + TypeScript + Vite + Vitest + Playwright**, multilingual SPA.

> **This README is a living checkpoint.** It records the plan and what has been done so any session can pick up where the last one stopped. Update it at the end of every iteration.

---

## Status

| | |
|---|---|
| **Current iteration** | 1 — repository scaffold + plan (this commit) |
| **Next iteration** | 2 — refine the plan, then reshape skills + build content |
| **Local path** | `/Users/gabor.seboek/Documents/Projects/Private/fiorevera` |
| **Remote** | `https://github.com/sebokgabor84/fiorevera` |
| **Template source** | `/Users/gabor.seboek/Documents/Projects/Private/Learning/GaborPortfolio` |

---

## The Plan

The goal is to rebuild the GaborPortfolio framework reshaped for the decoration business — same proven tech stack, QA pipeline, and skill-driven agent workflow, but reskinned and re-content-ed for the new domain.

### Steps

1. **Repository setup** — new `fiorevera` repo, GaborPortfolio used as the structural template. *(done — iteration 1)*
2. **Install planning skills** (global, via [mattpocock/skills](https://github.com/mattpocock/skills)):
   - `npx skills add mattpocock/skills --skill=grill-me -y -g` — stress-test the plan, surface weak spots.
   - `npx skills add mattpocock/skills --skill=to-prd -y -g` — turn the business concept into a proper PRD.
3. **Write the PRD** with `to-prd` — define pages, content, and what a decoration business needs (gallery/portfolio, services, about, contact, etc.).
4. **Grill the PRD** with `grill-me` — challenge assumptions, catch gaps before building.
5. **Reshape the 8 skills** for the decoration domain (see table below).
6. **QR-code quick win** — generate an iPhone-lockscreen QR pointing to the wife's current live website (via the `lockscreen-qr-generator` skill).

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
| `lockscreen-qr-generator` | Repurpose for the QR quick-win (step 6) |
| `desktop-background-generator` | Evaluate relevance; likely de-prioritised |

---

## Open Questions (resolve at start of iteration 2)

- [ ] **Business name** — is it literally "Fiore Vera"? (inferred from the repo name)
- [ ] **Current live website URL** — required for the QR-code quick win.
- [ ] **Primary locale(s)** — HU only, or HU/EN/DE like the portfolio?
- [ ] **Brand palette & typography** — drives the `design-system-expert` reshape.
- [ ] **Page list** — confirm via the PRD (gallery, services, about, contact, …).

---

## What's in this scaffold (iteration 1)

```
fiorevera/
├── .agent/
│   ├── rules/            # RTK token-efficiency rules (from template)
│   └── skills/           # 8 skills — GaborPortfolio versions, to be reshaped
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
