# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read this first

**`AGENTS.md` is the operating contract for this repo** — read it at the start of every session. It defines the working principles (push back on flawed plans, zero-guessing, mandatory Honest Critique), the 7-step Release Management Protocol, the skill routing table, and the proactive repo-hygiene scan. CLAUDE.md does not restate those; it captures the build-level facts around them.

`README.md` is the living iteration checkpoint — the plan and what's been done so far. Update it at the end of every iteration.

## Project state

**Fiore Vera** — a multilingual SPA (HU primary / EN / DE) for a decoration & floristry business, built on the GaborPortfolio template (same stack + QA pipeline + skill-driven workflow).

This repo is currently an **iteration-1 scaffold**: configs, `AGENTS.md`, `index.html`, and the `.agent/skills/` framework exist, but **`src/` is intentionally empty** — `main.tsx`, components, `src/data/*.ts`, and `src/i18n/locales/*.json` arrive in iteration 2. The app does **not** build yet. The `src/**/.gitkeep` files mark the planned tree. Before assuming a file exists, check — most source referenced in the skills (e.g. `src/data/types.ts`, `projects.ts`) is not written yet and describes the GaborPortfolio base to be reshaped.

The skills in `.agent/skills/` are the **GaborPortfolio versions verbatim** — a base to reshape for the decoration domain (see README "Skills to reshape"), not final. Their trigger keywords and aesthetics still reference the portfolio.

## Stack & commands

React 19 + TypeScript + Vite, Vitest (unit, jsdom) + Playwright (E2E), i18next, react-router-dom, Zod, react-icons.

```bash
npm install
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # tsc -b && vite build
npm run lint             # eslint . — must be 0 errors before any commit
npm test -- --run        # vitest, single run (CI mode)
npm test                 # vitest watch
npm run test:e2e         # playwright (chromium, firefox, webkit, Mobile Chrome)
npm run test:vitals      # only the web-vitals e2e spec
npm run format           # prettier --write .
npm run optimize:assets  # node scripts/optimize-images.js (sharp; script added iteration 2)
```

Run a single unit test: `npm test -- --run path/to/file.test.tsx` (or `-t "test name"`).
Run a single e2e spec: `npx playwright test tests/e2e/<name>.spec.ts`. Playwright auto-starts the dev server via `webServer`.

## Definition of Done (enforced before every commit/push)

Run in order, stop on first failure, **fix the code not the test**: `npm run lint` → `npm test -- --run` → `npm run test:e2e`. Per the incremental-build plan (README step 9), a slice is also not "done" until it has been **visually verified** in a real browser — the DoD pipeline checks lint/test/vitals but not whether it looks right.

## Conventions that will trip you up

- **ESLint `check-file` enforces naming** (these are errors, not warnings):
  - `src/components/**/` folders → `PASCAL_CASE`
  - `src/components/**/*.tsx` → `PASCAL_CASE`
  - other `src/**/*.ts` → `camelCase`
  - `src/**/*.css` → `kebab-case`
- **TS is strict**: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports must use `import type`), `erasableSyntaxOnly`. No `any` (qa-specialist vetoes it, even in temp scripts).
- **Zod DTOs**: data structures are validated against schemas in `src/data/types.ts` before tests. If validation fails, fix the data, not the schema.
- **Semantic HTML / a11y**: `jsx-a11y` recommended rules are on; interactive elements must be native (`<button>`, `<a>`), no `onClick` on `<div>`.
- **Images**: assets go in `public/assets/` as `webp`, ≤ 200 KB.
- **i18n**: all copy is keyed (HU/EN/DE); never hardcode user-facing strings.

## Architecture: skill-driven agent workflow

Work is routed through skills in `.agent/skills/<name>/SKILL.md`, each owning a domain (design-system, seo, accessibility, i18n-guardian, qa-specialist, skill-creator, lockscreen-qr-generator, desktop-background-generator) plus planning skills (grill-me, to-prd). `AGENTS.md`'s routing table maps trigger keywords → skill; if nothing matches, stop and propose creating one via `skill-creator` rather than guessing. The 8 domain skills are retained intentionally — the project goal is a digital + physical brand ecosystem (website + iPhone-lockscreen QR + Mac wallpaper), not just the site.

`BACKLOG.md` (repo root, created when first work item lands) is the single source of truth for open work, with the status schema defined in `AGENTS.md`. Once iteration 2 starts, `MASTER-PLAN.md` becomes the frozen build scope; `BACKLOG.md` captures emergent/out-of-scope ideas — new ideas go to the backlog, never silently into the master plan.
