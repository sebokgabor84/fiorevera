import { describe, it, expect } from 'vitest';
import { render } from '../../src/entry-server';
import { allRoutes, LOCALES, localePrefix, ROUTES } from '../../src/data/routes';
import { loadLocales, flatten } from '../../scripts/validate-i18n';

const locales = loadLocales();

describe('server render of every route (PRD D-18, MASTER-PLAN 1.2/1.9)', () => {
  for (const { page, locale, path } of allRoutes()) {
    it(`renders ${path} in ${locale} with the right title and hreflang`, () => {
      const { html, locale: resolved } = render(path);
      expect(resolved).toBe(locale);
      const title = flatten(locales[locale]).get(`meta.${page}.title`);
      expect(html).toContain(`<title>${title?.replace(/&/g, '&amp;')}</title>`);
      expect(html).toContain(`<link rel="canonical" href="https://www.fiorevera.hu${path}"/>`);
      for (const l of LOCALES) expect(html).toMatch(new RegExp(`hreflang="${l}" href="https://www.fiorevera.hu${ROUTES[page][l]}"`, "i"));
      expect(html).toMatch(/hreflang="x-default"/i);
      expect(html).toContain('"@type":["Florist","LocalBusiness"]');
      // One stable business entity: url is the locale home, never the current page (QA M3).
      expect(html).toContain(`"url":"https://www.fiorevera.hu${localePrefix(locale)}/"`);
      expect(html).toContain('id="main-content"');
    });
  }

  for (const locale of LOCALES) {
    it(`renders a localized 404 under ${localePrefix(locale) || '/'}`, () => {
      const { html } = render(`${localePrefix(locale)}/does-not-exist/`);
      expect(html).toContain(flatten(locales[locale]).get('notFound.title'));
      expect(html).toContain('noindex');
    });
  }

  it('renders the DE services page without Hungarian nav strings (legacy bug #7)', () => {
    const { html } = render('/de/dienstleistungen/');
    expect(html).not.toContain('Szolgáltatások');
    expect(html).toContain('href="/de/kontakt/"');
    expect(html).not.toMatch(/href="\/kapcsolat\/"/);
  });

  it('renders all 7 rental items on the DE rental page (legacy bug: missing mirror)', () => {
    const { html } = render('/de/verleih/');
    expect(html.match(/data-testid="rental-item"/g)).toHaveLength(7);
    expect(html).toContain('Hochzeitsspiegel');
  });

  it('renders ImageGallery JSON-LD with 15 albums on the gallery page', () => {
    const { html } = render('/munkaim/');
    expect(html.match(/"@type":"ImageGallery"/g)?.length).toBe(16); // page + 15 albums
    expect(html.match(/<section id="[a-z0-9-]+" class="_album/g)).toHaveLength(15);
  });
});
