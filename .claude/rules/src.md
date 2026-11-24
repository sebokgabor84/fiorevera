---
paths:
  - "src/**"
  - "tests/**"
  - "index.html"
  - "vite.config.ts"
  - "playwright.config.ts"
  - "playwright.visual.config.ts"
  - "eslint.config.js"
  - "tsconfig*.json"
---

# Code, tests, i18n

## Source map

- `src/data/routes.ts` is the single route source (router, `SeoHead`, hreflang, sitemap, prerender).
- `src/i18n/config.ts` creates one pre-initialised i18next instance per locale from the pathname: no language detection, no `changeLanguage`, nothing reads `window` during render.
- `src/entry-client.tsx` hydrates when `#root` has element children, else renders (dev). `src/entry-server.tsx` is used by `scripts/prerender.ts` and `tests/unit/render.test.tsx`.
- Data lives in `src/data/*.ts` with Zod contracts in `src/data/types.ts`. Image lists come only from the generated `src/data/generated/imageMeta.ts`; data references slots and album slugs, never filenames (PRD D-5). If validation fails, fix the data, not the schema.
- `src/lib/analytics.ts` starts Vercel Web Analytics only on `fiorevera.hu`, `www.fiorevera.hu` and `*.vercel.app`, never in dev, preview, Playwright or the visual suite.
- `src/lib/submitInquiry.ts` is the only place that talks to the form provider (Web3Forms, `VITE_FORM_ENDPOINT` / `VITE_FORM_ACCESS_KEY` from `.env.example`).

## Conventions that break the build

- ESLint `check-file` naming (errors): `src/components/**/` folders and `*.tsx` in PascalCase, other `src/**/*.ts` camelCase, `src/**/*.css` kebab-case. ESLint covers every `*.ts`/`*.tsx` in the repo; `npm run lint` then type-checks `scripts/`, skill scripts, Playwright configs and `tests/` with `tsconfig.scripts.json`. Zero errors and zero warnings.
- Strict TS: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (`import type`), `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. No `any`, not even in temp scripts.
- Hydration safety (PRD D-18): no `window`/`document`/`localStorage`/`Intl`/`Date` in render paths, effects only. `react-hooks/set-state-in-effect` is an error: use a callback such as `requestAnimationFrame` inside the effect. `formatHuf` and `PRIVACY_UPDATED` are hand-formatted for this reason.
- a11y: `jsx-a11y` recommended is on; interactive elements are native `<button>`/`<a>`. The skip link to `#main-content` is rendered by `src/components/Layout/Layout.tsx` in the page's language.
- i18n: all copy is keyed in `src/i18n/locales/*.json`. `tests/unit/i18n.test.ts` fails on a missing key, an empty string, a value identical in all three locales (whitelist in `scripts/validate-i18n.ts`), legacy typos, garden mentions outside `about.garden.*` (PRD D-16), SEO titles over 60 or descriptions over 160 chars. Toast strings render in the target locale via `getI18n(target)`. Wording must read as an educated native speaker's.
- Generated files, never hand-edited: `src/data/generated/imageMeta.ts`, `public/sitemap.xml`, `scripts/sitemap-lastmod.json`, `docs/gdpr/data-register.seal.json`. After a copy or data change run `npm run sitemap` and commit both sitemap files (`tests/unit/sitemap.test.ts` fails while they are stale).
- Site images go in `public/assets/` as webp, at most 200 KB (`public/assets/lockscreen/` is exempt).

## Tests

- Single unit test: `npm test -- --run tests/unit/render.test.tsx` or `-t "name"`. Single e2e spec: `npx playwright test tests/e2e/<name>.spec.ts`.
- Every Playwright spec imports `test`/`expect` from `./fixtures` (`tests/e2e/fixtures.ts`, re-exported by `tests/visual/fixtures.ts`), never from `@playwright/test`: the fixture aborts every request to the real form providers. ESLint fails on a bare import. Tests that need a provider answer mock it with `page.route()`. The real quota is 250 submissions a month and reaches the business inbox.
- Server identity (`scripts/checkout.ts`, `tests/support/globalSetup.ts`): dev server :5173 and preview :4173 say which checkout they serve; a worktree gets its own ports. Both suites stop before the first test when the server belongs to another checkout, and the visual suite stops when `dist/` is missing or older than the sources.
- Compare the e2e total (413 passed / 7 skipped on 2026-11-19), and never judge a run through a pipe: `| tail` hides the exit code.
- Visual changes are approved only through `npm run visual:page` and the owner's answers (`docs/qa/visual-review-process.md`), then `npm run test:visual:update -- --approved-by="<name>"`.

## Brand tokens (locked, from `design-system-expert`)

Linen `#faf7f2`, sage `#7a8b7b`, blush `#e8c5c8`, gold `#d4af37`, text `#2c2825` / `#6b635b`. Headings Cormorant Garamond, body Inter. Romantic, rustic-elegant: the legacy look elevated, not replaced.
