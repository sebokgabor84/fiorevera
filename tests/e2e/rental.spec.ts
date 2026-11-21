import { test, expect } from './fixtures';
import { LOCALES, ROUTES } from '../../src/data/routes';
import { rentalItems } from '../../src/data/rentalItems';
import { formatHuf } from '../../src/data/contact';

test.describe('rental catalog (PRD D-8)', () => {
  for (const locale of LOCALES) {
    test(`${locale}: every item with its price and deposit in HUF`, async ({ page }) => {
      await page.goto(ROUTES.rental[locale]);
      // Items, prices and deposits come from the data, never from a pinned number: they are
      // content the owner changes (docs/vera-agent/PRD.md, R1).
      await expect(page.getByTestId('rental-item')).toHaveCount(rentalItems.length);
      for (const item of rentalItems) {
        const card = page.locator(`#${item.id}`);
        await expect(card).toContainText(formatHuf(item.priceHuf));
        if (item.depositHuf) await expect(card).toContainText(formatHuf(item.depositHuf));
      }
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
