import { describe, it, expect } from 'vitest';
import { LOCALES, PAGE_IDS, ROUTES, allRoutes, alternatesFor, localeFromPath, matchRoute, REDIRECTS } from '../../src/data/routes';

describe('route table (PRD D-3)', () => {
  it('has every page in all three locales', () => {
    for (const page of PAGE_IDS) for (const locale of LOCALES) expect(ROUTES[page][locale]).toMatch(/^\/.*\/$|^\/$/);
    expect(allRoutes()).toHaveLength(PAGE_IDS.length * LOCALES.length);
  });

  it('keeps the legacy HU and DE slugs', () => {
    expect(ROUTES.services.hu).toBe('/szolgaltatasok/');
    expect(ROUTES.gallery.hu).toBe('/munkaim/');
    expect(ROUTES.rental.de).toBe('/de/verleih/');
    expect(ROUTES.about.de).toBe('/de/uebermich/');
    expect(ROUTES.gallery.en).toBe('/en/portfolio/');
  });

  it('has unique paths', () => {
    const paths = allRoutes().map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('matches paths with and without trailing slash', () => {
    expect(matchRoute('/de/verleih/')).toEqual({ locale: 'de', page: 'rental' });
    expect(matchRoute('/de/verleih')).toEqual({ locale: 'de', page: 'rental' });
    expect(matchRoute('/')).toEqual({ locale: 'hu', page: 'home' });
    expect(matchRoute('/en')).toEqual({ locale: 'en', page: 'home' });
  });

  it('resolves unknown paths to a localized 404', () => {
    expect(matchRoute('/de/gibt-es-nicht/')).toEqual({ locale: 'de', page: null });
    expect(matchRoute('/en/nope')).toEqual({ locale: 'en', page: null });
    expect(matchRoute('/nincs/')).toEqual({ locale: 'hu', page: null });
    expect(localeFromPath('/dezember/')).toBe('hu'); // prefix must be a full segment
  });

  it('emits hreflang alternates with x-default → HU', () => {
    const alts = alternatesFor('rental');
    expect(alts.map((a) => a.hreflang)).toEqual(['hu', 'de', 'en', 'x-default']);
    expect(alts.at(-1)?.href).toBe('https://www.fiorevera.hu/kellekberles/');
  });

  it('301s the garden pages to About (D-16)', () => {
    expect(REDIRECTS).toEqual([
      { from: '/viragoskert/', to: '/rolunk/' },
      { from: '/de/blumengarten/', to: '/de/uebermich/' },
    ]);
  });
});
