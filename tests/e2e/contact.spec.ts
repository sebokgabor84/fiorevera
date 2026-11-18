import { test, expect, REAL_PROVIDER_HOSTS } from './fixtures';
import { INQUIRY_PAYLOAD, T, hu } from './locales';
import { LOCALES, ROUTES } from '../../src/data/routes';

/**
 * Every host the app may post to: the fake host playwright.config.ts injects into its managed dev server,
 * plus the real providers, in case the dev server under test was started with a real VITE_FORM_ENDPOINT
 * (e.g. from .env.local). Mocking all of them keeps these tests offline and never hits a real inbox.
 */
const PROVIDER_HOSTS = ['**/mock-form-endpoint.test/**', ...REAL_PROVIDER_HOSTS];
const mockProvider = async (page: import('@playwright/test').Page, handler: Parameters<typeof page.route>[1]) => {
  for (const host of PROVIDER_HOSTS) await page.route(host, handler);
};


/**
 * The per-field error messages, by their id (`<useId>-<field>-error`), not by ARIA role: whether each
 * message is its own role="alert" or one summary announces them is a markup decision this spec must survive.
 */
const fieldErrors = (page: import('@playwright/test').Page) => page.getByTestId('inquiry-form').locator('p[id$="-error"]');

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
    await expect(fieldErrors(page).first()).toHaveText(hu.contact.form.errors.required);
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
    await expect(fieldErrors(page)).toHaveText([f.errors.email, f.errors.phone, f.errors.tooLong.replace('{{max}}', '150')]);
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
    test(`${locale}: the consent box starts unticked and nothing is sent without it`, async ({ page }) => {
      const requests: string[] = [];
      await mockProvider(page, (route) => {
        requests.push(route.request().url());
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      });
      await page.goto(ROUTES.contact[locale]);
      const consent = page.getByRole('checkbox');
      // GDPR Art. 7 / recital 32: consent is an action of the visitor, never a pre-ticked box.
      await expect(consent).toHaveCount(1);
      await expect(consent).not.toBeChecked();
      await fill(page, locale);
      await consent.uncheck();
      await page.getByRole('button', { name: T[locale].contact.form.submit }).click();
      await expect(fieldErrors(page)).toHaveText([T[locale].contact.form.errors.consent]);
      await expect(consent).toBeFocused();
      expect(requests, 'no request may leave the page without consent').toEqual([]);
    });

    test(`${locale}: success path with a mocked provider`, async ({ page }) => {
      const bodies: Record<string, unknown>[] = [];
      await mockProvider(page, (route) => {
        bodies.push(route.request().postDataJSON() as Record<string, unknown>);
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      });
      await page.goto(ROUTES.contact[locale]);
      const form = page.getByTestId('inquiry-form');
      const configured = (await form.getAttribute('data-endpoint')) === 'configured';
      // Locally Playwright may reuse a dev server the owner started without VITE_FORM_ENDPOINT; then the
      // form cannot post anywhere and the path is skipped. On CI the server is always the managed one
      // (playwright.config.ts sets the endpoint), so a missing endpoint there is a broken setup, not a skip.
      expect(
        configured || !process.env.CI,
        'CI must exercise the success path: the dev server has no VITE_FORM_ENDPOINT although playwright.config.ts sets it for its own server'
      ).toBe(true);
      test.skip(!configured, 'dev server started without VITE_FORM_ENDPOINT (playwright.config.ts sets it for the managed webServer)');
      await fill(page, locale);
      await page.getByRole('button', { name: T[locale].contact.form.submit }).click();
      const success = page.getByTestId('inquiry-success');
      await expect(success).toContainText(T[locale].contact.form.success);
      // The tall form is gone; the page must show the confirmation, not clamp to the footer.
      await expect(success).toBeInViewport({ ratio: 1 });
      await expect(success).toBeFocused();

      // Exactly one request, carrying exactly the keys the personal-data register declares
      // (docs/gdpr/data-register.json → inquiryPayload): a new field must be declared before it ships.
      expect(bodies).toHaveLength(1);
      const sent = Object.keys(bodies[0]).sort();
      const required = INQUIRY_PAYLOAD.filter((p) => !p.optional).map((p) => p.key);
      const allowed = INQUIRY_PAYLOAD.map((p) => p.key);
      expect(sent.filter((k) => !allowed.includes(k)), 'keys sent to the provider but not declared in the register').toEqual([]);
      expect(required.filter((k) => !sent.includes(k)), 'declared keys missing from the request').toEqual([]);
      // The honeypot and the consent flag stay in the browser.
      expect(sent).not.toContain('website');
      expect(sent).not.toContain('consent');
      // What the visitor typed arrives, whatever the keys are called (the key names are the register's business).
      const values = Object.values(bodies[0]);
      for (const typed of ['Teszt Anna', 'anna@example.com', '2027-06-12', 'Zalakaros', 'Szeretnénk árajánlatot kérni.', locale]) {
        expect(values, `"${typed}" is part of the request`).toContain(typed);
      }
    });
  }

  test('never reaches a real provider: an un-mocked submission is blocked and shows the fallback', async ({ page }) => {
    // No mockProvider() here on purpose — the auto fixture in ./fixtures must stop the request on its own.
    await page.goto('/kapcsolat/');
    await fill(page, 'hu');
    await page.getByRole('button', { name: hu.contact.form.submit }).click();
    await expect(page.getByRole('alert')).toContainText(hu.contact.form.error);
    await expect(page.getByTestId('inquiry-success')).toHaveCount(0);
  });

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
