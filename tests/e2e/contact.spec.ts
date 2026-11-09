import { test, expect } from '@playwright/test';
import { T, hu } from './locales';
import { LOCALES, ROUTES } from '../../src/data/routes';


const fill = async (page: import('@playwright/test').Page, locale: keyof typeof T) => {
  const f = T[locale].contact.form;
  await page.getByLabel(new RegExp(`^${f.name}`)).fill('Teszt Anna');
  await page.getByLabel(new RegExp(`^${f.email}`)).fill('anna@example.com');
  await page.getByLabel(new RegExp(`^${f.date}`)).fill('2027-06-12');
  await page.getByLabel(new RegExp(`^${f.venue}`)).fill('Zalakaros');
  await page.getByLabel(new RegExp(`^${f.message}`)).fill('Szeretnénk árajánlatot kérni.');
  await page.getByRole('checkbox').check();
};

test.describe('contact form (PRD D-9, US-10)', () => {
  test('shows field errors and focuses the first invalid field', async ({ page }) => {
    await page.goto('/kapcsolat/');
    await page.getByRole('button', { name: hu.contact.form.submit }).click();
    await expect(page.getByRole('alert').first()).toHaveText(hu.contact.form.errors.required);
    await expect(page.getByLabel(/^Név/)).toBeFocused();
  });

  for (const locale of LOCALES) {
    test(`${locale}: success path with a mocked provider`, async ({ page }) => {
      await page.route('**/mock-form-endpoint.test/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
      );
      await page.goto(ROUTES.contact[locale]);
      const form = page.getByTestId('inquiry-form');
      const configured = (await form.getAttribute('data-endpoint')) === 'configured';
      test.skip(!configured, 'dev server started without VITE_FORM_ENDPOINT (playwright.config.ts sets it for the managed webServer)');
      await fill(page, locale);
      await page.getByRole('button', { name: T[locale].contact.form.submit }).click();
      await expect(page.getByTestId('inquiry-success')).toContainText(T[locale].contact.form.success);
    });
  }

  test('failure path shows the error with the email fallback', async ({ page }) => {
    // Provider unreachable (no endpoint, or the mocked host aborted) → inline error + mailto fallback.
    await page.route('**/mock-form-endpoint.test/**', (route) => route.abort('failed'));
    await page.goto('/kapcsolat/');
    await fill(page, 'hu');
    await page.getByRole('button', { name: hu.contact.form.submit }).click();
    const err = page.getByRole('alert').filter({ hasText: hu.contact.form.error });
    await expect(err).toBeVisible();
    await expect(err.locator('a[href^="mailto:"]')).toBeVisible();
    await expect(page.getByTestId('inquiry-form')).toBeVisible();
  });
});
