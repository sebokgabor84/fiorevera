---
name: accessibility-expert
description: Enforces WCAG 2.2 AA compliance, semantic HTML, ARIA attributes, and accessible automated testing (Axe/Vitest). Use this skill when building or refactoring UI components, writing UI tests, or addressing linting/Axe DevTools errors.
---

# Accessibility (A11y) Expert Skill

Foundational rulebook for WCAG 2.2 AA compliance in GaborPortfolio — covers semantic HTML, ARIA usage, and Shift-Left QA automation via Axe DevTools.

*(Note: Technical SEO, SSG rendering, and Lighthouse performance → `seo-expert`.)*

## When to use this skill
- Building or refactoring interactive elements (buttons, links, forms)
- Writing layout structures (headings, images)
- Configuring or fixing ESLint (`eslint-plugin-jsx-a11y`), Vitest, or Playwright a11y checks
- Debugging Axe DevTools violations

## How to use it

### 1. Semantic Structure
- **One `<h1>` per page** — visually hidden is acceptable if the hero content serves the purpose.
- **No skipped heading levels** — if a smaller visual size is needed, apply CSS to the correct semantic tag.
- **Skip-links** — implement `<a href="#main-content">` to allow keyboard users to bypass navigation.

### 2. Interactive Elements
- **Icon-only links** — add `aria-label` on the `<a>`, and `aria-hidden="true" focusable="false"` on the embedded `<svg>`.
- **Click actions** — must use a semantic `<button>` with `aria-label`. Never attach `onClick` to `<div>` or `<span>` without full ARIA roles and keyboard handlers.

### 3. Visual & Media
- **Color contrast** — minimum 4.5:1 for normal text (WCAG 2.2 AA).
- **Image `alt`** — informative images: descriptive text. Decorative images: `alt=""` + `aria-hidden="true"`.
- *`width`/`height` on images → `seo-expert` (CLS prevention)*

## Shift-Left QA Automation

| Layer | Tool | Assertion |
|---|---|---|
| Static | `eslint-plugin-jsx-a11y` | Zero warnings — all escalated to hard errors |
| Unit | `vitest-axe` | `expect(results).toHaveNoViolations()` after `axe(container)` |
| E2E | `@axe-core/playwright` | `expect(violations).toEqual([])` with `wcag2a/aa/21a/21aa` tags |

**Enforcement**: Zero lint errors (including WCAG 2.2) is a mandatory Definition of Done. Refactor existing violations before adding new features.
## Sparring Manifesto (Push Back Rules)
- **Non-Negotiable WCAG**: Veto any UI update that introduces an Axe violation or fails the 4.5:1 contrast ratio (WCAG 2.2 AA). Style never overrides access.
- **Semantic Purity**: Automatically block any `onClick` or interactivity attached to non-semantic elements (`div`, `span`). Demand a `<button>` or `<a>`.
- **Interactive Integrity**: Veto any widget or button that lacks focus management, keyboard support, or descriptive `aria-label`.

## Implicit Loading (Handshakes)
This skill should almost always be loaded alongside:
- `design-system-expert`: Whenever visual components are changed, their accessibility must also be verified.
- `qa-specialist`: To ensure `@axe-core/playwright` and `vitest-axe` are correctly configured in the pipeline.
