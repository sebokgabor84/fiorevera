# Head contract per page type (Fiore Vera, prerendered)

Source of truth: `src/components/Seo/SeoHead.tsx` + `scripts/prerender.ts` + `index.html`.
`{path}` is `ROUTES[page][locale]`, `{home}` is `ROUTES.home[locale]`, `{hero}` is `IMAGE_META.hero[0].src`.

## Every indexable route (21)

```html
<html lang="{locale}">                                   <!-- prerender.ts -->
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="author" content="Fiore Vera" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#faf7f2" />
<link rel="preload" href="/fonts/…woff2" as="font" type="font/woff2" crossorigin />   <!-- ×4 -->
<!-- hoisted from SeoHead -->
<title>{meta.{page}.title}</title>                        <!-- ≤ 60 -->
<meta name="description" content="{meta.{page}.description}" />   <!-- 70–160 -->
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://www.fiorevera.hu{path}" />
<link rel="alternate" hreflang="hu" href="https://www.fiorevera.hu{ROUTES[page].hu}" />
<link rel="alternate" hreflang="de" href="https://www.fiorevera.hu{ROUTES[page].de}" />
<link rel="alternate" hreflang="en" href="https://www.fiorevera.hu{ROUTES[page].en}" />
<link rel="alternate" hreflang="x-default" href="https://www.fiorevera.hu{ROUTES[page].hu}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Fiore Vera" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:url" content="https://www.fiorevera.hu{path}" />
<meta property="og:image" content="https://www.fiorevera.hu{hero}" />
<meta property="og:locale" content="hu_HU | de_AT | en_GB" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="https://www.fiorevera.hu{hero}" />
<script type="application/ld+json">{LocalBusiness}</script>
```

`LocalBusiness` (identical shape on every page; only `areaServed` and the language of `description` vary):

```json
{ "@context": "https://schema.org", "@type": ["Florist", "LocalBusiness"],
  "@id": "https://www.fiorevera.hu/#business", "name": "Fiore Vera",
  "description": "{meta.home.description}", "url": "https://www.fiorevera.hu{home}",
  "telephone": "+36308659108", "email": "info.fiorevera@gmail.com", "image": "https://www.fiorevera.hu{hero}",
  "address": { "@type": "PostalAddress", "streetAddress": "Rózsa utca 53.", "postalCode": "8749",
               "addressLocality": "Zalakaros", "addressCountry": "HU" },
  "areaServed": [{ "@type": "Place", "name": "…" }],          /* serviceAreas[locale] */
  "sameAs": ["https://www.instagram.com/fioreveradekor", "https://www.facebook.com/fioreveradekor"],
  "founder": { "@type": "Person", "name": "Sebőkné Antalics Veronika" } }
```

## Gallery route (`/munkaim/`, `/de/referenzen/`, `/en/portfolio/`)

Everything above **plus** a second `ld+json` block from `src/pages/GalleryPage.tsx`:

```json
{ "@context": "https://schema.org", "@type": "ImageGallery", "name": "{meta.gallery.title}",
  "url": "https://www.fiorevera.hu{path}",
  "hasPart": [{ "@type": "ImageGallery", "name": "{albumTitle}", "url": "…{path}#{album.id}",
                "image": [{ "@type": "ImageObject", "contentUrl": "…", "width": 1920, "height": 1280,
                            "caption": "{albumAlt}" }] }] }
```

## `dist/404.html` (one file, served with HTTP 404 by Vercel)

- Static shell only: `<html lang="hu">` from the template, fallback `<title>`, favicons, fonts, **`<meta name="robots" content="noindex, follow" />`**.
- **No** canonical, `og:url`, hreflang, JSON-LD in the file. The client (`createRoot`, nothing to hydrate) renders `NotFound` with `SeoHead page={null}`: localized title/description, `noindex, follow`, OG without `og:url`, the `LocalBusiness` block. `document.documentElement.lang` follows the path's locale after mount.

## Noscript (body, not head)

`index.html` ships `<p data-noscript>` in HU; `prerender.ts` replaces it with `common.noscript` of the route locale. `404.html` keeps the HU text (locale-neutral shell).
