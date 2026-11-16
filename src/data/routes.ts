/**
 * Single route source (PRD D-3, MASTER-PLAN 1.2): router, SeoHead, hreflang,
 * sitemap and prerender all read from here. HU lives at the root, DE keeps the
 * legacy Webnode slugs, EN is new.
 */
export const LOCALES = ['hu', 'de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'hu';

export const PAGE_IDS = ['home', 'services', 'gallery', 'rental', 'about', 'contact', 'privacy'] as const;
export type PageId = (typeof PAGE_IDS)[number];

/** Pages shown in the main navigation, in order. */
export const NAV_PAGE_IDS: readonly PageId[] = ['home', 'services', 'gallery', 'rental', 'about', 'contact'];

export const ROUTES: Record<PageId, Record<Locale, string>> = {
  home: { hu: '/', de: '/de/', en: '/en/' },
  services: { hu: '/szolgaltatasok/', de: '/de/dienstleistungen/', en: '/en/services/' },
  gallery: { hu: '/munkaim/', de: '/de/referenzen/', en: '/en/portfolio/' },
  rental: { hu: '/kellekberles/', de: '/de/verleih/', en: '/en/rentals/' },
  about: { hu: '/rolunk/', de: '/de/uebermich/', en: '/en/about/' },
  contact: { hu: '/kapcsolat/', de: '/de/kontakt/', en: '/en/contact/' },
  privacy: { hu: '/adatkezeles/', de: '/de/datenschutz/', en: '/en/privacy/' },
};

/** Legacy URLs that 301 to a page (PRD D-16); mirrored in vercel.json. */
export const REDIRECTS: { from: string; to: string }[] = [
  { from: '/viragoskert/', to: ROUTES.about.hu },
  { from: '/de/blumengarten/', to: ROUTES.about.de },
];

export const SITE_URL = 'https://www.fiorevera.hu';

export const localePrefix = (locale: Locale): string => (locale === DEFAULT_LOCALE ? '' : `/${locale}`);

export const pathFor = (page: PageId, locale: Locale): string => ROUTES[page][locale];

export const absoluteUrl = (path: string): string => `${SITE_URL}${path}`;

const normalize = (pathname: string): string => {
  const p = pathname.replace(/\/{2,}/g, '/');
  return p.endsWith('/') ? p : `${p}/`;
};

/** Locale of any pathname, from its prefix (unknown paths still resolve to a locale for the 404). */
export const localeFromPath = (pathname: string): Locale => {
  const p = normalize(pathname);
  if (p === '/de/' || p.startsWith('/de/')) return 'de';
  if (p === '/en/' || p.startsWith('/en/')) return 'en';
  return 'hu';
};

export interface RouteMatch {
  locale: Locale;
  page: PageId | null;
}

/** Resolves a pathname to its page + locale; `page: null` means localized 404. */
export const matchRoute = (pathname: string): RouteMatch => {
  const p = normalize(pathname);
  for (const page of PAGE_IDS) {
    for (const locale of LOCALES) {
      if (ROUTES[page][locale] === p) return { locale, page };
    }
  }
  return { locale: localeFromPath(p), page: null };
};

export interface RouteEntry {
  page: PageId;
  locale: Locale;
  path: string;
}

/** Every concrete route (21 = 7 pages × 3 locales). */
export const allRoutes = (): RouteEntry[] =>
  PAGE_IDS.flatMap((page) => LOCALES.map((locale) => ({ page, locale, path: ROUTES[page][locale] })));

/** hreflang alternates for a page: one per locale + x-default → HU. */
export const alternatesFor = (page: PageId): { hreflang: string; href: string }[] => [
  ...LOCALES.map((locale) => ({ hreflang: locale, href: absoluteUrl(ROUTES[page][locale]) })),
  { hreflang: 'x-default', href: absoluteUrl(ROUTES[page][DEFAULT_LOCALE]) },
];
