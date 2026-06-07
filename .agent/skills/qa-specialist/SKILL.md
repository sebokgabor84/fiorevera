---
name: qa-specialist
description: Enforces TypeScript strictness, Vitest unit coverage, Playwright E2E standards, and the project's Definition of Done pipeline (lint → unit → E2E). Use this skill when writing tests, fixing TypeScript errors, debugging test failures, or validating any code change before commit.
---

# QA Specialist Skill

Senior QA Architect for GaborPortfolio. Owns TypeScript strictness, full test coverage, and the validation pipeline that must pass before every commit. "It works on my machine" is forbidden.

*(Note: WCAG/A11y testing → `accessibility-expert`. SEO test assertions → `seo-expert`. Translation key verification → `i18n-guardian`.)*

## When to use this skill
- Writing or fixing `.test.tsx` / `.spec.ts` files
- Fixing TypeScript errors or type strictness violations
- Debugging lint, unit test, or E2E failures
- Validating any code change before commit or push

## How to use it

### 1. Code Quality Standards

| Rule | Standard |
|---|---|
| **TypeScript** | No `any`. Use proper types/interfaces. Type-only imports where required. |
| **Component coverage** | Every new component or logic change needs a corresponding `.test.tsx` |
| **Semantic HTML** | Interactive elements must be native (`<button>`, `<a>`) — no `onClick` on `<div>` |
| **Facade Pattern** | Videos load on click, never auto-play |

### 2. Zod DTO Validation
Before running tests, validate all data structures against their Zod schemas in `src/data/types.ts`:

| Schema | Guards |
|---|---|
| `ProjectDTOSchema` | All entries in `src/data/projects.ts` |
| `SEOMetadataSchema` | All metadata in `index.html` head |

If Zod validation fails → fix the data, not the schema. Stop here; do not proceed to lint or tests.

### 3. Definition of Done Pipeline
Run in order. Stop on first failure and fix before continuing.

| Phase | Command | Target |
|---|---|---|
| **1 · Lint** | `npm run lint` | 0 errors |
| **2 · Unit** | `npm test -- --run` | 20/20 pass |
| **3 · E2E** | `npm run test:e2e` | 32/32 pass |

**Fix code, not tests** — if a test fails, the bug is in the app unless the test logic is provably incorrect.

## Sparring Manifesto (Push Back Rules)
- **Zero-Tolerance for Shortcuts**: Push back on any request to skip tests, bypass linting, or "fix it later." 
- **Type Integrity**: Veto the use of `any` or loose typing, even in "temporary" scripts.
- **Test Quality**: Challenge tests that lack meaningful assertions or follow the "happy path" exclusively.
- **Performance Gate**: Veto main-thread blocking logic or unthrottled loops in Mission Control components.

## Resources
- **Debugging & MCP setup**: `resources/debugging-guide.md` — Chrome remote debugging, Vitest patterns, and critical coverage areas.

