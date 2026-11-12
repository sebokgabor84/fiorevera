import { test, expect } from '@playwright/test';
import { T, hu } from './locales';
import { LOCALES, ROUTES } from '../../src/data/routes';

/**
 * Every host the app may post to: the fake host playwright.config.ts injects into its managed dev server,
 * plus the real providers, in case the dev server under test was started with a real VITE_FORM_ENDPOINT
 * (e.g. from .env.local). Mocking all of them keeps these tests offline and never hits a real inbox.
 */
const PROVIDER_HOSTS = ['**/mock-form-endpoint.test/**', '**/api.web3forms.com/**', '**/formspree.io/**'];
const mockProvider = async (page: import('@playwright/test').Page, handler: Parameters<typeof page.route>[1]) => {
  for (const host of PROVIDER_HOSTS) await page.route(host, handler);
};


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
  // The language toast is covered by locale.spec; here it would only sit over the submit button on phones.
  test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1')));

  test('shows field errors and focuses the first invalid field', async ({ page }) => {
    await page.goto('/kapcsolat/');
    await page.getByRole('button', { name: hu.contact.form.submit }).click();
    await expect(page.getByRole('alert').first()).toHaveText(hu.contact.form.errors.required);
    await expect(page.getByLabel(/^Név/)).toBeFocused();
  });

  test('names the problem: e-mail without a dot, malformed phone, over-long venue', async ({ page }) => {
    await page.goto('/kapcsolat/');
    await fill(page, 'hu');
    const f = hu.contact.form;
    await page.getByLabel(new RegExp(`^${f.email}`)).fill('anna@example'); // the browser accepts this; we want a real domain
    await page.getByLabel(new RegExp(`^${f.phone}`)).fill('+36-30-865-9108');
    await page.getByLabel(new RegExp(`^${f.venue}`)).fill('x'.repeat(151));
    await page.getByRole('button', { name: f.submit }).click();
    const alerts = page.getByRole('alert');
    await expect(alerts).toHaveText([f.errors.email, f.errors.phone, f.errors.tooLong.replace('{{max}}', '150')]);
    await expect(page.getByLabel(new RegExp(`^${f.email}`))).toBeFocused();
    // A well-formed phone with spaces passes and is not rewritten.
    await page.getByLabel(new RegExp(`^${f.email}`)).fill('anna@example.com');
    await page.getByLabel(new RegExp(`^${f.phone}`)).fill('+36 30 865 9108');
    await page.getByLabel(new RegExp(`^${f.venue}`)).fill('Zalakaros');
    await mockProvider(page, (route) => route.abort('failed'));
    await page.getByRole('button', { name: f.submit }).click();
    const fallback = page.getByRole('alert').locator('a[href^="mailto:"]');
    await expect(fallback).toHaveAttribute('href', /%2B36%2030%20865%209108/);
  });

  for (const locale of LOCALES) {
    test(`${locale}: success path with a mocked provider`, async ({ page }) => {
      await mockProvider(page, (route) =>
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
    await mockProvider(page, (route) => route.abort('failed'));
    await page.goto('/kapcsolat/');
    await fill(page, 'hu');
    await page.getByRole('button', { name: hu.contact.form.submit }).click();
    const err = page.getByRole('alert').filter({ hasText: hu.contact.form.error });
    await expect(err).toBeVisible();
    const fallback = err.locator('a[href^="mailto:"]');
    await expect(fallback).toBeVisible();
    // The fallback carries the typed inquiry (subject + body), so nothing has to be retyped in the mail app.
    await expect(fallback).toHaveAttribute('href', /\?subject=.+&body=.*Zalakaros/);
    await expect(page.getByTestId('inquiry-form')).toBeVisible();
  });
});
