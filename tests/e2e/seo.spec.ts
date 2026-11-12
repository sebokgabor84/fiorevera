import { test, expect } from '@playwright/test';
import { T } from './locales';
import { allRoutes, LOCALES, ROUTES } from '../../src/data/routes';


test.describe('SEO head per route (US-9)', () => {
  for (const { page: pageId, locale, path } of allRoutes()) {
    test(`${path}: title, description, canonical, hreflang, OG, JSON-LD`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(T[locale].meta[pageId].title);
      await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', T[locale].meta[pageId].description);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://www.fiorevera.hu${path}`);
      for (const l of LOCALES) {
        await expect(page.locator(`head link[rel="alternate"][hreflang="${l}"]`)).toHaveAttribute('href', `https://www.fiorevera.hu${ROUTES[pageId][l]}`);
      }
      await expect(page.locator('head link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `https://www.fiorevera.hu${ROUTES[pageId].hu}`);
      await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/www\.fiorevera\.hu\/assets\//);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.some((s) => s.includes('"LocalBusiness"'))).toBe(true);
      if (pageId === 'gallery') expect(ld.some((s) => s.includes('"ImageGallery"'))).toBe(true);
    });
  }
});
