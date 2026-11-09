import { defineConfig, devices } from '@playwright/test';

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
 */
export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
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
    baseURL: 'http://localhost:4173',
    locale: 'hu-HU',
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
