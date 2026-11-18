import { defineConfig, devices } from '@playwright/test';
import { checkoutPort } from './scripts/checkout';

/**
 * Visual regression + layout invariants — runs against the PRODUCTION build served by
 * `vite preview` (prerendered dist/), chromium only (deterministic rendering; webkit/firefox
 * differ in font rasterisation and would need their own baselines).
 *
 *   npm run build && npm run test:visual            # compare against committed baselines
 *   npm run build && npm run test:visual:update     # re-baseline after an APPROVED visual change
 *
 * Baselines live in tests/visual/__screenshots__/ and are platform-specific (darwin on this machine).
 * The pre-push hook (.githooks/pre-push) runs lint → unit → build → this suite.
 *
 * The preview under test must serve THIS checkout's dist/, built from the current sources: the main
 * checkout uses :4173, a git worktree gets its own port (scripts/checkout.ts), the server command
 * refuses a missing or stale dist/, and tests/support/globalSetup.ts checks both again when a
 * running server is reused.
 */
const origin = `http://localhost:${checkoutPort(4173)}`;

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  globalSetup: './tests/support/globalSetup.ts',
  metadata: { fvServer: { origin, mode: 'preview' } },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      maxDiffPixels: 150,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: origin,
    locale: 'hu-HU',
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `./node_modules/.bin/tsx scripts/checkout.ts --assert-dist && npm run preview -- --port ${new URL(origin).port} --strictPort`,
    url: `${origin}/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
