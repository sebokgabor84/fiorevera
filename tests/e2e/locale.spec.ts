import { test, expect } from '@playwright/test';
import { de, en } from './locales';

test.describe('language switch + suggestion toast (PRD D-4)', () => {
  test('switching locale lands on the same page in the target locale', async ({ page }) => {
    await page.goto('/de/verleih/');
    // The footer language links are visible on every viewport (the header switch sits in the mobile menu on phones).
    await page.locator('footer').getByRole('link', { name: 'Magyar' }).click();
    await expect(page).toHaveURL(/\/kellekberles\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
    await expect(page.getByTestId('language-toast')).toHaveCount(0);
  });

  test.describe('German browser', () => {
    test.use({ locale: 'de-AT' });

    test('sees the toast on the HU home, dismisses it, and it stays dismissed', async ({ page }) => {
      await page.goto('/');
      const toast = page.getByTestId('language-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText(de.toast.body);
      await expect(toast.getByRole('link')).toHaveAttribute('href', '/de/');
      await toast.getByRole('button', { name: de.toast.dismiss }).click();
      await expect(toast).toHaveCount(0);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('language-toast')).toHaveCount(0);
    });

    test('never sees the toast on a German page and is never redirected', async ({ page }) => {
      await page.goto('/de/');
      await expect(page).toHaveURL(/\/de\/$/);
      await page.waitForTimeout(300);
      await expect(page.getByTestId('language-toast')).toHaveCount(0);
    });
  });

  test.describe('English browser', () => {
    test.use({ locale: 'en-US' });
    test('is offered English on a DE page', async ({ page }) => {
      await page.goto('/de/kontakt/');
      const toast = page.getByTestId('language-toast');
      await expect(toast).toContainText(en.toast.body);
      await expect(toast.getByRole('link')).toHaveAttribute('href', '/en/contact/');
    });
  });

  test.describe('French browser', () => {
    test.use({ locale: 'fr-FR' });
    test('never sees the toast', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(300);
      await expect(page.getByTestId('language-toast')).toHaveCount(0);
    });
  });
});
