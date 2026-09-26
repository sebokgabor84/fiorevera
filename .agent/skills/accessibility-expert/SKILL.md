---
name: accessibility-expert
description: >-
  Enforces WCAG 2.2 AA compliance, semantic HTML, ARIA landmark roles, skip
  links, focus management, and accessible automated testing (Axe/Vitest). Use
  when building or refactoring UI components, writing UI tests, adding navigation
  or page layouts, or addressing linting/Axe DevTools errors.
---

# Accessibility (A11y) Expert Skill

Foundational rulebook for WCAG 2.2 AA compliance in Fiore Vera — covers semantic
HTML, ARIA landmark roles, skip-link patterns, focus management, and Shift-Left
QA automation via Axe DevTools.

*(Note: Technical SEO, SSG rendering, and Lighthouse performance → `seo-expert`.)*

## When to use this skill
- Building or refactoring interactive elements (buttons, links, forms)
- Adding page layouts, navigation, or regions (landmarks)
- Adding or repositioning skip-link targets
- Configuring or fixing ESLint (`eslint-plugin-jsx-a11y`), Vitest, or Playwright a11y checks
- Debugging Axe DevTools violations

## How to use it

### 1. Semantic Structure
- **One `<h1>` per page** — visually hidden is acceptable if the hero content serves the purpose.
- **No skipped heading levels** — if a smaller visual size is needed, apply CSS to the correct semantic tag.

### 2. Skip Links

Skip links allow keyboard and screen-reader users to jump past repeated navigation.

| Rule | Implementation |
|---|---|
| **Required on every page** | `<a href="#main-content" class="skip-link">Skip to main content</a>` — first focusable element in `<body>` |
| **Visually hidden until focused** | Use `.skip-link { position: absolute; transform: translateY(-100%); }` + `:focus { transform: translateY(0); }` |
| **Target must have `id`** | `<main id="main-content" tabindex="-1">` — `tabindex="-1"` lets the link move focus to a non-interactive element |
| **SPA route changes** | On every React Router navigation, call `document.getElementById('main-content')?.focus()` to reset focus to `main` |
| **Additional skip targets** | If a page has a long nav + sidebar, add a second `<a href="#page-content">Skip to page content</a>` before the sidebar |

### 3. ARIA Landmark Roles

Every page must have a complete and non-overlapping landmark structure so screen
readers can navigate by region.

| HTML Element | Implicit Role | Fiore Vera usage |
|---|---|---|
| `<header>` (top-level) | `banner` | Site-wide header — one per page |
| `<nav aria-label="Main navigation">` | `navigation` | Primary nav (inside `<header>`) |
| `<nav aria-label="Language switcher">` | `navigation` | Language toggle (separate label required) |
| `<main id="main-content">` | `main` | Page content — exactly one per page |
| `<footer>` | `contentinfo` | Site-wide footer — one per page |
| `<section aria-labelledby="...">` | `region` | Named page sections (hero, gallery, services) — label required or it won't become a landmark |
| `<aside aria-label="...">` | `complementary` | Sidebar or supplementary content |
| `<form aria-label="Contact inquiry">` | `form` | Contact form (must have accessible label) |

**Rules:**
- **Unique labels on repeated landmarks** — two `<nav>` elements on the same page MUST have different `aria-label` values.
- **No orphaned content** — every visible content block must be inside a landmark.
- **No nested `<main>`** — React page components mount *inside* a single `<main>` in `App.tsx`; never render a second `<main>` in a child component.
- **Sections without a label are invisible to landmark navigation** — always pair `<section>` with `aria-labelledby="<heading-id>"`.

### 4. Interactive Elements
- **Icon-only links** — add `aria-label` on the `<a>`, and `aria-hidden="true" focusable="false"` on the embedded `<svg>`.
- **Click actions** — must use a semantic `<button>` with `aria-label`. Never attach `onClick` to `<div>` or `<span>` without full ARIA roles and keyboard handlers.
- **Focus ring** — never suppress `outline` without providing an equivalent custom focus indicator.

### 5. Visual & Media
- **Color contrast** — minimum 4.5:1 for normal text, 3:1 for large text (WCAG 2.2 AA).
- **Image `alt`** — informative images: descriptive text. Decorative images: `alt=""` + `aria-hidden="true"`.
- *`width`/`height` on images → `seo-expert` (CLS prevention)*

---

## Shift-Left QA Automation

| Layer | Tool | Assertion |
|---|---|---|
| Static | `eslint-plugin-jsx-a11y` | Zero warnings — all escalated to hard errors |
| Unit | `vitest-axe` | `expect(results).toHaveNoViolations()` after `axe(container)` |
| E2E | `@axe-core/playwright` | `expect(violations).toEqual([])` with `wcag2a/aa/21a/21aa` tags |
| E2E — skip link | Playwright | Tab to first element → assert `href="#main-content"` is focused + visible |
| E2E — landmarks | Playwright | Assert `main`, `banner`, `contentinfo` exist; assert no duplicate `main` per page |

**Enforcement**: Zero lint errors (including WCAG 2.2) is a mandatory Definition of Done. Refactor existing violations before adding new features.

---

## Sparring Manifesto (Push Back Rules)
- **Non-Negotiable WCAG**: Veto any UI update that introduces an Axe violation or fails contrast ratios.
- **Semantic Purity**: Block any `onClick` on non-semantic elements. Demand `<button>` or `<a>`.
- **Landmark Completeness**: Veto any page layout that has unlabelled regions or missing `<main>`.
- **Skip Link Mandatory**: Veto any new page component that does not receive focus on route change.

## Implicit Loading (Handshakes)
- `design-system-expert`: Whenever visual components are changed, a11y must be co-verified.
- `qa-specialist`: Ensures `@axe-core/playwright` and `vitest-axe` are correctly configured.
