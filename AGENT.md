# Fiore Vera Agent Router

This is the primary entrypoint. Read this first every session to understand the project context and route to the correct skill(s).

> **Status:** Iteration-1 scaffold. The skill framework below is copied verbatim from GaborPortfolio and is the **base to be reshaped** for the decoration business in iteration 2. Trigger keywords, aesthetics, and data contracts still reference the portfolio domain — do not treat them as final. See `README.md` for the iteration plan.

## Project Identity
**Fiore Vera** — a multilingual SPA for a decoration & floristry business (weddings, events, home styling). Stack: React + TypeScript + Vite + Vitest + Playwright. Aesthetic: TBD in iteration 2 (working direction: elegant, natural, floral — replacing GaborPortfolio's steampunk dark mode).

> ⚠️ **Open questions (resolve in iteration 2):** confirmed business name, primary locale set (HU/EN/DE?), current live website URL (needed for the QR quick-win), brand palette & typography.

## Working Principles

- **Be honest, push back.** If the user proposes a plan that is flawed, inefficient, redundant, missing a step, or based on a wrong assumption — say so directly and propose the better path. Do not silently comply. Disagreement is a feature, not friction.
- **Stop & Debate Protocol**: Whenever a suboptimal, redundant, or "bullshit" path is detected, the Agent MUST immediately stop and initiate a technical debate, regardless of task delays.
- **Vibe Coding Integrity (Zero-Hallucination & Zero-Guessing)**: NEVER MAKE THINGS UP. Applies across all domains — translations, technical implementations, SEO, A11y, code logic. If a pattern might already exist in the codebase, search the repo first to reuse it. If you do not know something for certain, STOP and ask explicitly instead of guessing.
- **Mandatory Critique**: Every implementation plan MUST contain an "Honest Critique" section challenging at least one user assumption or proposing a superior alternative.
- **Release Management Protocol**: Every task MUST follow the 7-step cycle:
    1. **Initialization**: Create a `feature/<short-desc>` branch.
    2. **Design**: Submit an implementation plan with an Honest Critique.
    3. **Execution**: Perform local changes + full DoD (lint, unit, e2e).
    4. **Local Review**: Provide a "Review Brief" summarizing technical decisions and diffs.
    5. **Staging Approval**: Commit & Push ONLY after explicit human "GO" on the brief.
    6. **Remote MR Advice**: Generate a reviewer checklist for the human to use on GitHub.
    7. **Final Merge**: Human executes merge after a second "GO" in the MR context.
- **Unconditional User Approval**: No changes are executed before explicit plan approval.

## Repo Hygiene (proactive — don't wait to be asked)

At the start of every session, silently scan for drift and inconsistency. If you find issues, raise them before starting the requested work (stale docs, orphaned files, naming violations, skill/config divergence, dead references, BACKLOG drift). State what's wrong, where, and propose a fix — don't silently fix. Bundle related issues into one concise list. If no issues are found, say nothing.

## Backlog Protocol

`BACKLOG.md` (repo root, created when first work item lands) is the single source of truth for open work. Maintain it via three hooks: (1) Session-start drift scan, (2) Task-completion update before every commit, (3) Immediate new-idea capture when the user says "we should…", "idea:", "what about…". Schema: `- [STATUS] **[CATEGORY]** Description — \`reference\` _(added: YYYY-MM-DD)_`. Statuses: `[ ]` open · `[/]` in progress · `[x]` done · `[?]` needs decision · `[~]` deferred.

## Skill Routing Table

> Trigger keywords below are inherited from GaborPortfolio and will be re-tuned for the decoration domain in iteration 2.

| Trigger keywords / context | Load skill |
|---|---|
| CSS, layout, mobile, overflow, flexbox, grid, image, asset, thumbnail, animation, gallery, hero, content copy, refactor component, new feature | `design-system-expert` |
| SEO, meta, Open Graph, hreflang, Lighthouse, LCP, CLS, JSON-LD, robots, sitemap, SPA SEO, performance, structured data, schema | `seo-expert` |
| WCAG, accessibility, aria, a11y, axe, screen reader, contrast, keyboard, skip-link, UI refactor, interactive element | `accessibility-expert` |
| translation, locale, i18n, language, titleKey, descKey, labelKey, new language, text change, copy update, data change | `i18n-guardian` |
| test, lint, TypeScript, E2E, Playwright, Vitest, unit test, type error, DoD, commit, push, build | `qa-specialist` |
| new skill, refactor rules, legacy prompt, create agent file | `skill-creator` |
| lock screen, wallpaper, QR code, mobile background | `lockscreen-qr-generator` |
| desktop wallpaper, animated background, video background | `desktop-background-generator` |

### 🚨 Missing Skill Fallback
If no skill matches the user intent: STOP, do not guess, suggest creating/refactoring a skill via `skill-creator`, and wait for approval.

## Key File Map

| What you're changing | Where to look |
|---|---|
| Agent router | `AGENT.md` |
| Iteration plan / checkpoint | `README.md` |
| Backlog / task tracking | `BACKLOG.md` (created in iteration 2) |
| Skill definitions | `.agent/skills/*/SKILL.md` |
| Project data | `src/data/*.ts` (built in iteration 2) |
| Translations | `src/i18n/locales/*.json` (built in iteration 2) |
| Components & Pages | `src/components/`, `src/pages/` |
| E2E tests | `tests/` |
| Images / assets | `public/assets/` |

## Mandatory Actions (Always)

| Event | Action |
|---|---|
| Any code change | `npm run lint` — 0 errors before commit |
| Any component change | `npm test -- --run` — all pass |
| Before push | `npm run test:e2e` — all pass |
| New image asset | Verify `webp`, ≤ 200 KB, stored in `public/assets/` |
