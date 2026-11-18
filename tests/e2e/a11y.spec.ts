import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { T, hu } from './locales';
import { allRoutes, LOCALES, localePrefix, ROUTES } from '../../src/data/routes';

/**
 * Accessibility gate (MASTER-PLAN 3.1): axe-core on every route in every locale, on the localized 404s
 * and on the three states a page scan does not reach (open mobile menu, form with errors, language toast).
 * Zero violations, no rule switched off. A red test names the rule, the element and the page.
 *
 * What a violation means: a real visitor with a screen reader, a keyboard or low vision is blocked or
 * misled. Fix the markup or the styles (accessibility-expert skill); never disable the rule or exclude
 * the element to get green. axe finds only what a machine can check: the manual VoiceOver run stays.
 */
const scan = async (page: Page, where: string): Promise<void> => {
  // The page must be settled: late content (hero image, hydrated nav) changes what axe sees.
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main h1').first()).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  const report = violations.map(
    (v) =>
      `${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n` +
      v.nodes.map((n) => `    ${n.target.join(' ')}\n      ${(n.failureSummary ?? '').replace(/\n\s*/g, ' | ')}`).join('\n') +
      `\n    ${v.helpUrl}`
  );
  expect(report, `axe violations on ${where}:\n\n${report.join('\n\n')}\n`).toEqual([]);
};

test.describe('accessibility: axe on every route × locale (MASTER-PLAN 3.1)', () => {
  test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1')));

  for (const { locale, path } of allRoutes()) {
    test(`${path} (${locale}) has no axe violations`, async ({ page }) => {
      await page.goto(path);
      await scan(page, path);
    });
  }

  for (const locale of LOCALES) {
    test(`the ${locale} 404 page has no axe violations`, async ({ page }) => {
      const path = `${localePrefix(locale)}/nincs-ilyen-oldal/`;
      await page.goto(path);
      await scan(page, path);
    });
  }

  test('the contact form with validation errors has no axe violations', async ({ page }) => {
    await page.goto(ROUTES.contact.hu);
    await page.getByRole('button', { name: hu.contact.form.submit }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await scan(page, `${ROUTES.contact.hu} with field errors`);
  });

  test('the open mobile menu has no axe violations', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: hu.nav.openMenu }).click();
    await expect(page.getByRole('dialog', { name: hu.nav.menu })).toBeVisible();
    await scan(page, '/ with the menu open');
  });
});

test.describe('accessibility: language toast visible', () => {
  test.use({ locale: 'de-AT' });
  test('the HU home with the German toast has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('language-toast')).toContainText(T.de.toast.body);
    await scan(page, '/ with the language toast');
  });
});
