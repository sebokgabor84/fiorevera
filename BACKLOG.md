# Fiore Vera — Project Backlog

> Single source of truth for open, in-progress, and completed work items.
> Schema: `- [STATUS] **[CATEGORY]** Description — \`reference\` _(added: YYYY-MM-DD)_`

---

## 🟢 Open / Next Up

- [ ] **[BUILD]** Execute `MASTER-PLAN.md` phases 0–4 (frozen scope, 33 items) — `MASTER-PLAN.md` _(added: 2026-11-09)_
- [ ] **[TOOLING]** `scripts/archive-legacy.ts` — local copy of the Webnode site (texts, translations, images, manifest) before cutover — `MASTER-PLAN.md#0.1` _(added: 2026-11-09)_
- [ ] **[TOOLING]** `scripts/validate-i18n.ts` — HU/DE/EN key-parity gate run by `npm test` — `MASTER-PLAN.md#1.4` _(added: 2026-11-09)_
- [ ] **[TOOLING]** `scripts/optimize-images.js` — sharp pipeline to webp ≤ 200 KB + dimension manifest — `MASTER-PLAN.md#0.2` _(added: 2026-11-09)_
- [ ] **[SEO]** Prerender / SSG per route if Search Console shows weak indexing of any locale (PRD Honest Critique #1) — `docs/PRD.md#R-3` _(added: 2026-11-09)_
- [ ] **[SEO]** Per-album routes (`/munkaim/<slug>/`) for venue-level local SEO, if venue searches matter — `docs/PRD.md#D-6` _(added: 2026-11-09)_
- [ ] **[ASSETS]** Retina hero photoshoot (legacy cap 1920 px / hero 960×640) — `docs/PRD.md#R-2` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Instagram feed embed on the homepage (needs token + consent review) — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Blog / seasonal updates (Markdown, 3 locales) — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Approximate EUR prices next to HUF on DE/EN rental page — `docs/PRD.md#D-8` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Booking calendar / availability check for rental items — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[FEATURE]** Newsletter signup — `docs/PRD.md#D-14` _(added: 2026-11-09)_
- [ ] **[HARNESS]** Wire `to-prd` to GitHub Issues once a tracker exists (PRD currently local markdown) — `.agent/skills/to-prd/SKILL.md` _(added: 2026-11-09)_
- [ ] **[ASSETS]** Mac wallpaper via `desktop-background-generator` (parallel track, independent of the site build) — `.agent/skills/desktop-background-generator/SKILL.md` _(added: 2026-11-09)_
- [ ] **[LAUNCH]** Confirm who holds the `fiorevera.hu` registrar / DNS login before cutover — `docs/PRD.md#R-7` _(added: 2026-11-09)_

---

## 📦 Completed

- [x] **[PRD]** Draft PRD via `/grill-me` session to freeze MASTER-PLAN.md — `docs/PRD.md`, `MASTER-PLAN.md` _(completed: 2026-11-09)_
- [x] **[ASSETS]** Generate iPhone QR Lockscreen wallpaper for `fiorevera.hu` — `public/assets/lockscreen/fiore-vera-lockscreen-final.png` _(completed: 2026-10-10)_
- [x] **[DESIGN]** Reshape `design-system-expert` skill for floral/event decoration domain — `.agent/skills/design-system-expert/SKILL.md` _(completed: 2026-09-26)_
- [x] **[HARNESS]** Consolidate `AGENT.md` into `AGENTS.md` per Vibe Coding standards — `AGENTS.md` _(completed: 2026-09-26)_
- [x] **[HARNESS]** Create `.agent/hooks.json` for session-start boot injection — `.agent/hooks.json` _(completed: 2026-09-26)_
- [x] **[TYPE-SAFETY]** Strict TypeScript skill registry & automated Vitest drift gate — `src/types/skills.ts` & `tests/unit/skills.test.ts` _(completed: 2026-09-26)_
- [x] **[LINT-GATE]** Enforce AGENT.md deletion and reference cleanliness test gate — `tests/unit/skills.test.ts` _(completed: 2026-09-26)_
- [x] **[SKILLS]** Update `accessibility-expert` with skip-links and landmark roles — `.agent/skills/accessibility-expert/SKILL.md` _(completed: 2026-09-26)_
- [x] **[SKILLS]** Update `skill-creator` with update/reshape & cross-project sync — `.agent/skills/skill-creator/SKILL.md` _(completed: 2026-09-26)_
- [x] **[SKILLS]** Create `goodbye` session-close ritual skill — `.agent/skills/goodbye/SKILL.md` _(completed: 2026-09-26)_
- [x] **[HANDOVER]** Create `.agent/last-session-handover.md` context recovery checkpoint — `.agent/last-session-handover.md` _(completed: 2026-09-26)_
