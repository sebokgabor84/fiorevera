import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/*
 * Firefox on macOS: at startup the test browser reads the profile registry of the INSTALLED Firefox
 * (~/Library/Application Support/Firefox/profiles.ini). macOS 27 denies that read to other apps
 * (kernel log: "System Policy: deny file-read-data"), and Firefox then exits before any page loads with
 * "Could not find profile folder." CFFIXED_USER_HOME moves CoreFoundation's home lookup to an empty
 * private folder, so the test browser never touches the real Firefox data. The folder has to exist;
 * the variable means nothing outside macOS.
 */
const firefoxHome = join(tmpdir(), 'fiorevera-playwright-firefox-home');
mkdirSync(firefoxHome, { recursive: true });

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                launchOptions: { env: { ...process.env, CFFIXED_USER_HOME: firefoxHome } },
            },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        // Contact-form E2E: the app posts to this host, which the specs mock with page.route (success) / abort (failure).
        env: { VITE_FORM_ENDPOINT: 'https://mock-form-endpoint.test/submit' },
    },
});
