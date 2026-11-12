import { test, expect } from '@playwright/test';
import { HEADER_WIDTHS, PAGES, SNAPSHOT_HEIGHT, SNAPSHOT_WIDTHS, expectFullyInViewport, openStable } from './helpers';

/**
 * Pixel baselines (chromium, css pixels, animations off, toast dismissed).
 * A failure means "something looks different from the approved build": inspect the diff in
 * playwright-report-visual/, then either fix the regression or, after the owner approves the
 * new look, re-baseline with `npm run test:visual:update`.
 */
for (const { id, path, widths = SNAPSHOT_WIDTHS, height = SNAPSHOT_HEIGHT } of PAGES) {
  for (const width of widths) {
    test(`${id} @ ${width}`, async ({ page }) => {
      await openStable(page, path, width);
      await expect(page).toHaveScreenshot(`${id}-${width}.png`, {
        fullPage: true,
        clip: { x: 0, y: 0, width, height },
      });
    });
  }
}

test.describe('header strip across desktop widths', () => {
  for (const width of HEADER_WIDTHS) {
    test(`home header @ ${width}`, async ({ page }) => {
      await openStable(page, PAGES[0].path, width);
      await expect(page).toHaveScreenshot(`header-${width}.png`, { clip: { x: 0, y: 0, width, height: 96 } });
    });
  }
});

test.describe('language toast (German browser on the HU home)', () => {
  test.use({ locale: 'de-DE' });
  for (const width of SNAPSHOT_WIDTHS) {
    test(`toast @ ${width}`, async ({ page }) => {
      await openStable(page, PAGES[0].path, width, 812, { keepToast: true });
      const toast = page.getByTestId('language-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toHaveScreenshot(`toast-${width}.png`);
    });
  }
});

test.describe('interactive states', () => {
  test('mobile menu open @ 375', async ({ page }) => {
    await openStable(page, PAGES[0].path, 375, 812);
    await page.getByRole('button', { name: /men/i }).first().click();
    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot('menu-open-375.png');
  });

  for (const width of SNAPSHOT_WIDTHS) {
    test(`gallery first carousel on slide 2 @ ${width}`, async ({ page }) => {
      // The first album section (heading + carousel) is 832 px tall at 1280: it must fit the viewport,
      // otherwise the element screenshot freezes a half-painted frame (see expectFullyInViewport).
      await openStable(page, PAGES[2].path, width, width >= 1024 ? 1200 : 900);
      const region = page.getByRole('region').first();
      await region.getByRole('button').nth(1).click();
      await page.waitForTimeout(400);
      await expectFullyInViewport(region);
      await expect(region).toHaveScreenshot(`carousel-slide2-${width}.png`);
    });
  }
});
