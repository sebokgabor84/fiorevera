import type { FullConfig } from '@playwright/test';
import { assertDistIsFresh, assertServesThisCheckout, type CheckoutIdentity } from '../../scripts/checkout';

/**
 * Runs once before the first test of the e2e and of the visual suite (after Playwright has started
 * or reused the web server): proves that the server under test belongs to THIS checkout, and for the
 * visual suite that dist/ is a build of the current sources. See scripts/checkout.ts for the why.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const server = config.metadata.fvServer as { origin: string; mode: CheckoutIdentity['mode'] } | undefined;
  if (!server) throw new Error('playwright config must set metadata.fvServer = { origin, mode } (see playwright.config.ts)');
  if (server.mode === 'preview') assertDistIsFresh();
  await assertServesThisCheckout(server.origin, { mode: server.mode });
}
