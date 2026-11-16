import { test as base, expect } from '@playwright/test';

/**
 * Real form providers. No e2e test may ever reach them: locally Playwright reuses the owner's running dev
 * server, which may carry the real VITE_FORM_ENDPOINT / VITE_FORM_ACCESS_KEY from .env.local, and every
 * request that gets through costs one of the 250 monthly Web3Forms submissions and lands in Vera's inbox.
 * This auto fixture aborts them at the browser-context level for every test of every spec; a test that
 * wants a provider answer mocks it with page.route(), which takes precedence over the context route.
 */
export const REAL_PROVIDER_HOSTS = ['**/api.web3forms.com/**', '**/formspree.io/**'];

export const test = base.extend<{ offlineProviders: void }>({
  offlineProviders: [
    async ({ context }, use) => {
      for (const host of REAL_PROVIDER_HOSTS) await context.route(host, (route) => route.abort('blockedbyclient'));
      await use();
    },
    { auto: true },
  ],
});

export { expect };
