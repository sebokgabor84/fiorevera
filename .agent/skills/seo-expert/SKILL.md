---
name: seo-expert
description: Enforces Technical SEO, Lighthouse Performance optimization, SPA/CSR dynamic meta injection, and per-route structured data. Supports both SPA (Client-Side Rendering) and SSG architectures. Use this skill when configuring meta tags, optimizing loading speed (LCP/CLS), structured data, hreflang maps, or adding/changing routes. Also use when auditing or fixing base HTML (favicon, heading hierarchy, lang attribute, manifest, robots.txt, sitemap).
---

# SEO & Lighthouse Performance Expert Skill

Rendering strategy, Lighthouse scores, and technical SEO. Project-agnostic — specifics live in config variables.

*(WCAG → `accessibility-expert`. i18n keys → `i18n-guardian`. Image format → `design-system-expert`.)*

## Config Variables
Projects MUST define: `{DOMAIN}`, `{LOCALES}` (array), `{DEFAULT_LOCALE}`, `{ROUTES}` (array), `{PERSON_SCHEMA}` (JSON-LD).

## When to use this skill
- Adding/modifying routes or pages
- Editing `<head>` elements (meta, OG, Twitter Cards, hreflang)
- Optimizing Lighthouse (LCP, CLS, font preloading)
- Auditing or fixing favicon, heading structure, lang attribute, manifest, robots.txt
- Writing SEO-focused tests

---

## How to use it

### 1. Rendering Mode — Choose One

#### A) SPA / CSR — `react-router-dom` with `BrowserRouter` (Current Active Strategy)
- Per-route SEO is injected via `useEffect` in a `<SeoHead />` component (see Section 2).
- There is **no static HTML per route** — Googlebot must execute JS to read SEO tags.
- Use `preconnect`, font preload, and `fetchpriority` in the static `index.html`.
- "SSR Verify" does not apply — use the SPA Crawl Check in Section 5 instead.

#### B) SSG — React Router v7 Framework Mode (Optional)
- Use `@react-router/dev` Vite plugin with file-based `routes/` directory.
- `react-router.config.ts`: list all `{ROUTES}` in `prerender()`. Set `ssr: false` for static hosting.
- Build: `"build": "react-router build"`. Output: static HTML per route in `build/client/`.

---

### 2. Per-Route SEO — `<SeoHead />` Component

Every route renders `<SeoHead />` with `PageSeoProps`:

| Prop | Rule |
|---|---|
| `title` | ≤ 60 chars, **unique per route** |
| `description` | ≤ 155 chars, **unique per route** |
| `canonicalUrl` | `{DOMAIN}` + route path, must match actual deployed domain exactly |
| `ogImage` | Absolute URL to route-specific or fallback image |
| `locale` | Current i18n locale code (e.g. `en`, `{LOCALE}`) |
| `jsonLd` | `Person` (home), `CollectionPage` (listings), etc. |

Injects via `useEffect`: `document.title`, `<meta>`, `<link canonical>`, hreflang alternates, JSON-LD.

**SPA: also update `<html lang>` per locale switch:**
```ts
useEffect(() => {
  document.documentElement.lang = locale;
}, [locale]);
```
This is critical — `<html lang="en">` must not be hardcoded when multiple locales exist.

> 🚨 **Critical Cross-Language Leakage Rule:**
> NEVER hardcode language-specific strings into `<SeoHead>` components (`title="My Page"`). You MUST use dynamic i18n locale keys (`title={t('seo.home_title')}`). If the `hreflang` / `<html lang>` declares a specific target route but the DOM `<head>` nodes output static strings from a different locale, search indexers will heavily penalize the site with 'Soft 404s' or duplicate content. Always extract structural SEO strings to your locale dictionary files (e.g. `en.json`, `locales/*.json`).

---

### 3. Base HTML — Full Checklist

Every project's `index.html` (or `root.tsx` Layout for SSG) **must** contain all of the following. Claude must check each item when touching `<head>`.

#### 3a. Document
```html
<html lang="{DEFAULT_LOCALE}">   <!-- Must match actual language; update dynamically for SPA multilingual -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

#### 3b. Favicon — full stack (all four tags required)
```html
<!-- 1. SVG — modern browsers (scalable, dark mode via CSS) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- 2. PNG fallback — legacy browsers, social scrapers, Slack/Teams unfurls -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

<!-- 3. Apple touch icon — must be PNG, 180×180, no transparency -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- 4. Web App Manifest — required for Android homescreen + PWA signals -->
<link rel="manifest" href="/site.webmanifest" />
```

> ⚠️ **WebP favicons are NOT valid.** Safari rejects them. ICO is legacy-only. Use SVG + PNG.

`site.webmanifest` minimum content:
```json
{
  "name": "{SITE_NAME}",
  "short_name": "{SHORT_NAME}",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "{BRAND_COLOR}",
  "background_color": "{BG_COLOR}",
  "display": "standalone"
}
```

#### 3c. Theme & platform
```html
<meta name="theme-color" content="{BRAND_COLOR}" />
<meta name="msapplication-TileColor" content="{BRAND_COLOR}" />
```

#### 3d. Primary SEO meta
```html
<title>{PAGE_TITLE}</title>                            <!-- ≤ 60 chars, unique per route -->
<meta name="description" content="{DESCRIPTION}" />   <!-- ≤ 155 chars, unique per route -->
<meta name="robots" content="index, follow" />
<meta name="author" content="{AUTHOR}" />
<link rel="canonical" href="{DOMAIN}{ROUTE_PATH}" />  <!-- Must match deployed domain exactly -->
```

#### 3e. Open Graph + Twitter
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="{DOMAIN}{ROUTE_PATH}" />
<meta property="og:title" content="{OG_TITLE}" />
<meta property="og:description" content="{OG_DESCRIPTION}" />
<meta property="og:image" content="{ABSOLUTE_OG_IMAGE_URL}" />
<meta property="og:locale" content="{LOCALE_CODE}" />   <!-- e.g. en_US, de_DE, etc -->

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{OG_TITLE}" />
<meta name="twitter:description" content="{OG_DESCRIPTION}" />
<meta name="twitter:image" content="{ABSOLUTE_OG_IMAGE_URL}" />
```

#### 3f. Performance
```html
<!-- Preconnect for any external origin used on page load -->
<link rel="preconnect" href="https://fonts.googleapis.com" />

<!-- Preload the primary web font (LCP impact) -->
<link rel="preload" as="font" type="font/woff2" href="{FONT_URL}" crossorigin />
```

#### 3g. Accessibility & fallback
```html
<!-- Skip link (visually hidden until focused) -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Noscript fallback — required for React SPA -->
<noscript>
  <div>This site requires JavaScript. Please enable it in your browser settings.</div>
</noscript>
```

---

### 4. Heading Hierarchy — Rules

| Rule | Detail |
|---|---|
| **One H1 per route** | Every page/route must have exactly one `<h1>`. This is the primary crawl signal. |
| **H1 must render in initial viewport** | Particularly important for SPA/CSR — if H1 is below the fold, it still counts, but above-fold is preferred. |
| **No H1 in `index.html`** | The static shell has no H1 — H1 lives in each route component. |
| **No skipping levels** | H1 → H2 → H3. Never jump from H1 to H3. |
| **No heading for styling** | Never use `<h2>` etc. for visual size — use CSS. |
| **Section pages need their own H1** | If `/featured-projects` has no `<h1>`, Google has no primary signal for that URL. Add one even if visually it looks like a section title. |

---

### 5. Technical SEO

| Area | Rule |
|---|---|
| **hreflang** | Each route × locale → `<link rel="alternate" hreflang="{L}" href="{DOMAIN}/{L}{R}">`. Plus `x-default`. Must be injected client-side in SPA. |
| **JSON-LD** | Route-specific. Home → `Person`. Listing → `CollectionPage` + `ItemList`. |
| **robots.txt** | Must exist at `{DOMAIN}/robots.txt`. Point to sitemap. Disallow `/assets/` if applicable. |
| **sitemap.xml** | Cover all `{ROUTES}` × `{LOCALES}`. Auto-generate at build time. Reference in robots.txt. |
| **Canonical domain** | `{DOMAIN}` must be the **exact** deployed domain (protocol + host). Never mix `gaborseboek.com` with `sebokgabor.com` — canonical mismatch is treated as duplicate content. |
| **`<html lang>`** | Must match the current active locale. Hardcoding `lang="en"` on a multilingual SPA is an accessibility and SEO error. |

**Minimum `robots.txt`:**
```
User-agent: *
Allow: /
Sitemap: {DOMAIN}/sitemap.xml
```

---

### 6. Lighthouse (Target: 100/100)
...
---

### 7. Shift-Left SEO Testing (Mandatory)

Every route/page component MUST have a unit test verifying that it correctly initializes the `SeoHead` component with localized data. This prevents silent regression of meta tags into hardcoded English.

**Example Test Pattern:**
```ts
it('renders SeoHead with localized home metadata', () => {
  render(<HomePage />);
  // We check that SeoHead is called with the correct i18n key result
  // Note: Mocking i18next or checking the DOM in a unit test depends on implementation
  expect(document.title).toMatch(/Gabor Seboek/);
});
```

---

### 8. Technical SEO Summary Table

| Layer | Mechanism | Assertion |
|---|---|---|
| TypeScript | `PageSeoProps` interface | Compile-time guarantee of required SEO props per route |
| Unit (Vitest) | `<SeoHead />` isolation test | Valid DOM output from `PageSeoProps` |
| E2E (Playwright) | `page.goto()` per route, **after JS execution** | Unique `<title>`, `<meta description>`, `<h1>`, hreflang, canonical |
| **SPA Crawl Check** | `page.goto()` then `page.locator('h1').count()` | Asserts exactly one H1 per route |
| **Favicon Check** | `page.goto('/favicon.svg')` + `page.goto('/apple-touch-icon.png')` | Both return 200 (not 404) |
| **robots.txt Check** | `request.get('{DOMAIN}/robots.txt')` | Contains `Sitemap:` directive |

> Note: For SPA/CSR, all Playwright SEO assertions must run **after `networkidle`** or after the page has fully hydrated — not on raw HTML. The "SSR Verify" pattern (checking raw HTML before JS) only applies to SSG/prerendered builds.

---

## Sparring Manifesto (Push Back Rules)
- **Veto on Performance Drains**: Automatically block any script, asset, or component update that degrades Lighthouse performance scores below 95 without a documented business-critical justification.
- **Single H1 Enforcement**: Veto any layout that lacks a unique `<h1>` per route or contains multiple `<h1>` elements.
- **Canonical Integrity**: Stop any route deployment that fails to explicitly define its canonical URL and `hreflang` map.
- **Localized Meta**: Push back on any "quick" SEO overrides that are not externalized to the i18n locale files. No hardcoded SEO strings allowed.

## Implicit Loading (Handshakes)
- `design-system-expert`: Asset/layout changes (CLS/LCP). Favicon image format decisions.
- `i18n-guardian`: hreflang verification, locale changes, `<html lang>` sync.
- `qa-specialist`: SSR/SEO E2E tests (DoD pipeline).
