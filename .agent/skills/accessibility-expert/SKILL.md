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
| **Required on every page** | Rendered by `src/components/Layout/Layout.tsx` as the first focusable element, in the page's language: `<a href="#main-content" className="skip-link">{t('common.skipToContent')}</a>`. It is **not** in `index.html` any more (a static HU link leaked onto DE/EN pages, QA M4) |
| **Visually hidden until focused** | Use `.skip-link { position: absolute; transform: translateY(-100%); }` + `:focus { transform: translateY(0); }` |
| **Target must have `id`** | `<main id="main-content" tabIndex={-1}>` in `Layout.tsx` — `tabIndex={-1}` lets the link move focus to a non-interactive element. Gate: `tests/e2e/navigation.spec.ts` (skip link → Enter → `#main-content` focused) |
| **SPA route changes** | Target rule: on every React Router navigation focus returns to `main`. **Not implemented**: the `Layout` effect only scrolls (to the hash target or the top). Open with the accessibility pass, MASTER-PLAN 3.1 — add it there, in an effect, never in render (PRD D-18) |
| **Additional skip targets** | If a page has a long nav + sidebar, add a second `<a href="#page-content">Skip to page content</a>` before the sidebar |

### 3. ARIA Landmark Roles

Every page must have a complete and non-overlapping landmark structure so screen
readers can navigate by region.

| HTML Element | Implicit Role | Fiore Vera usage |
|---|---|---|
| `<header>` (top-level) | `banner` | Site-wide header — one per page |
| `<nav aria-label={t('nav.mainLabel')}>` | `navigation` | Primary nav (inside `<header>`); every label comes from a locale key, never a literal (`i18n-guardian`) |
| `<nav aria-label={t('lang.label')}>` | `navigation` | Language toggle (separate label required) |
| `<main id="main-content">` | `main` | Page content — exactly one per page |
| `<footer>` | `contentinfo` | Site-wide footer — one per page |
| `<section aria-labelledby="...">` | `region` | Named page sections (hero, gallery, services) — label required or it won't become a landmark |
| `<aside aria-label="...">` | `complementary` | Sidebar or supplementary content |
| `<form aria-label=…>` | `form` | Contact form — **the inquiry form has no accessible name yet** (open QA minor, `docs/qa/2026-11-09-qa-session.md`) |

**Rules:**
- **Unique labels on repeated landmarks** — two `<nav>` elements on the same page MUST have different `aria-label` values.
- **No orphaned content** — every visible content block must be inside a landmark.
- **No nested `<main>`** — React page components mount *inside* the single `<main>` in `Layout.tsx`; never render a second `<main>` in a child component.
- **Sections without a label are invisible to landmark navigation** — always pair `<section>` with `aria-labelledby="<heading-id>"`.

### 4. Interactive Elements
- **Icon-only links** — add `aria-label` on the `<a>`, and `aria-hidden="true" focusable="false"` on the embedded `<svg>`.
- **Click actions** — must use a semantic `<button>` with `aria-label`. Never attach `onClick` to `<div>` or `<span>` without full ARIA roles and keyboard handlers.
- **Focus ring** — never suppress `outline` without providing an equivalent custom focus indicator.
- **Label in name (WCAG 2.5.3)** — the accessible name must contain the visible text: the logo link carries no `aria-label`, language-switch labels start with the visible code ("DE – Deutsch"), `Header.tsx` / `LanguageSwitch.tsx` (QA M8).

### 4a. State swaps and form feedback (pattern from `src/components/Contact/InquiryForm.tsx`)

| Situation | Pattern | Why |
|---|---|---|
| A region is replaced by another (form → confirmation card) | In an effect on the state change: `el.scrollIntoView({ block: 'start' })` (the global `scroll-padding-top` keeps it under the sticky header), then `el.focus({ preventScroll: true })`; the new region carries `tabIndex={-1}` and `role="status"` | Swapping a tall element for a short one clamps the scroll to the new page bottom — the visitor landed in the footer (owner report 2026-11-11) — and a screen reader hears nothing unless focus moves |
| Test for it | `await expect(region).toBeInViewport({ ratio: 1 })` and `toBeFocused()` | `tests/e2e/contact.spec.ts` |
| Field errors | Validation is a pure function returning codes (`src/lib/validateInquiry.ts`); the form is `noValidate`, each error is `role="alert"` linked by `aria-describedby`, and focus goes to the first invalid field — the order of the error object is the focus order | Browser bubbles are not localizable or consistent; open QA minor: an empty submit raises six alerts at once |

### 5. Visual & Media
- **Color contrast** — minimum 4.5:1 for normal text, 3:1 for large text (WCAG 2.2 AA). For the owner a contrast failure is a hard no-go: that is why the header is always glass instead of changing with scroll (`design-system-expert`), and why text-sized gold is banned (2.1:1 on white).
- **Image `alt`** — informative images: descriptive text. Decorative images: `alt=""` + `aria-hidden="true"`.
- *`width`/`height` on images → `seo-expert` (CLS prevention)*

---

## Shift-Left QA Automation

| Layer | Tool | Assertion | Status in this repo (2026-11-16) |
|---|---|---|---|
| Static | `eslint-plugin-jsx-a11y` (recommended set, `eslint.config.js`) | `npm run lint` → 0 errors and 0 warnings | **In place**, hard gate |
| Unit | `vitest-axe` | `expect(results).toHaveNoViolations()` after `axe(container)` | **Not installed**, no test |
| E2E | `@axe-core/playwright` | `expect(violations).toEqual([])` with `wcag2a/aa/21a/21aa` tags | Package is a devDependency, **no spec uses it** — axe as a hard gate on every route × locale is MASTER-PLAN 3.1, open |
| E2E — skip link | Playwright | focus `.skip-link` → Enter → `#main-content` focused | **In place**: `tests/e2e/navigation.spec.ts` (desktop projects) |
| E2E — menu | Playwright | dialog opens, first link focused, Escape closes, focus back on the toggle | **In place**: `navigation.spec.ts` (Mobile Chrome) |
| E2E — landmarks | Playwright | Assert `main`, `banner`, `contentinfo` exist; no duplicate `main` | Not written; `tests/unit/render.test.tsx` only asserts `#main-content` on every route |
| Lab score | Lighthouse / PageSpeed | Accessibility 100 on the home page (2026-11-09 preview, 2026-11-16 live) | Measured by hand, `seo-expert` §6 — a score, not a substitute for axe on every route |

**Enforcement**: Zero lint errors and warnings is a mandatory Definition of Done. Refactor existing violations before adding new features. Until 3.1 lands, do not write "axe clean" in a Review Brief unless axe was actually run — say which tool, on which routes.

---

## Sparring Manifesto (Push Back Rules)
- **Non-Negotiable WCAG**: Veto any UI update that introduces an Axe violation or fails contrast ratios.
- **Semantic Purity**: Block any `onClick` on non-semantic elements. Demand `<button>` or `<a>`.
- **Landmark Completeness**: Veto any page layout that has unlabelled regions or missing `<main>`.
- **Skip Link Mandatory**: Veto any new page component that does not receive focus on route change.

## Implicit Loading (Handshakes)
- `design-system-expert`: Whenever visual components are changed, a11y must be co-verified.
- `qa-specialist`: owns the gates; wiring `@axe-core/playwright` into the e2e or visual run is the open MASTER-PLAN 3.1 item.
- `gdpr-guardian`: consent checkbox label, helper and error wiring.
