import { test, expect } from '@playwright/test';
import { LOCALES, ROUTES } from '../../src/data/routes';

test.describe('rental catalog (PRD D-8)', () => {
  for (const locale of LOCALES) {
    test(`${locale}: all 7 items incl. the mirror with deposit; HUF prices`, async ({ page }) => {
      await page.goto(ROUTES.rental[locale]);
      const items = page.getByTestId('rental-item');
      await expect(items).toHaveCount(7);
      const mirror = page.locator('#wedding-mirror');
      await expect(mirror).toContainText('38 000 Ft');
      await expect(mirror).toContainText('20 000 Ft');
      await expect(page.locator('#wooden-arch')).toContainText('19 990 Ft');
      const mailto = page.locator('main a[href^="mailto:"]').first();
      await expect(mailto).toHaveAttribute('href', /subject=/);
    });
  }
  test('DE/EN show the HUF note, HU does not', async ({ page }) => {
    await page.goto('/de/verleih/');
    await expect(page.getByText('ungarischen Forint')).toBeVisible();
    await page.goto('/kellekberles/');
    await expect(page.getByText('forintban (HUF)')).toHaveCount(0);
  });
});
