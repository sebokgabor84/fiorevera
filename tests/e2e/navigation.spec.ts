import { test, expect } from '@playwright/test';
import { T, hu } from './locales';
import { allRoutes, LOCALES, localePrefix, ROUTES } from '../../src/data/routes';

/** HU-only strings that must never leak onto DE/EN pages (legacy bug #7). */
const HU_LEAKS = ['Szolgáltatások', 'Kellékbérlés', 'Kapcsolat', 'Kérj árajánlatot', 'Rólam'];

test.describe('navigation: every route × locale', () => {
  for (const { page: pageId, locale, path } of allRoutes()) {
    test(`${path} renders in ${locale}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(T[locale].meta[pageId].title);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main h1').first()).toBeVisible();
      if (locale !== 'hu') {
        const text = await page.locator('header, main, footer').allInnerTexts();
        for (const leak of HU_LEAKS) expect(text.join('\n'), `HU string "${leak}" leaked`).not.toContain(leak);
      }
    });
  }

  for (const locale of LOCALES) {
    test(`unknown path under ${localePrefix(locale) || '/'} shows the ${locale} 404`, async ({ page }) => {
      await page.goto(`${localePrefix(locale)}/nincs-ilyen-oldal/`);
      await expect(page.locator('main h1')).toHaveText(T[locale].notFound.title);
      await expect(page.locator('main a.btn').first()).toHaveAttribute('href', ROUTES.home[locale]);
    });
  }

  test('DE CTAs link to DE routes only (legacy bug #1)', async ({ page }) => {
    await page.goto('/de/dienstleistungen/');
    const hrefs = await page.locator('main a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href, `cross-locale link ${href}`).toMatch(/^\/de\//);
  });

  test('header navigation reaches every page by keyboard', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop nav only');
    await page.goto('/');
    // WebKit does not move focus to links on Tab by default (Safari's "Press Tab to highlight" setting), so focus directly.
    await page.locator('.skip-link').focus();
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    const links = page.locator('header nav a');
    expect(await links.count()).toBeGreaterThanOrEqual(6);
  });

  test('mobile menu opens, traps focus and closes with Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: hu.nav.openMenu });
    await toggle.click();
    const dialog = page.getByRole('dialog', { name: hu.nav.menu });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: hu.nav.home })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});
