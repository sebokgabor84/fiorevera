import { test, expect } from '@playwright/test';
import { albums } from '../../src/data/albums';

test.describe('gallery (PRD D-6/D-7)', () => {
  test('renders 15 album sections and only loads above-the-fold images', async ({ page }) => {
    const imageRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/assets/gallery/')) imageRequests.push(req.url());
    });
    await page.goto('/munkaim/');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main section[id]').count()).toBe(15);
    for (const a of albums) await expect(page.locator(`#${a.id}`)).toBeAttached();
    expect(imageRequests.length, 'all gallery images requested on load').toBeLessThan(169 / 4);
  });

  test('tap/click turns the cover into a carousel with arrows, status and Escape', async ({ page }) => {
    await page.goto('/munkaim/');
    const first = page.locator(`#${albums[0].id}`);
    await first.getByRole('button').first().click();
    const region = first.getByRole('region');
    await expect(region).toBeVisible();
    await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const status = region.locator('[aria-live="polite"]');
    await expect(status).toContainText(`${albums[0].coverIndex + 1}.`);
    await region.getByRole('button').nth(1).click(); // next
    await expect(status).toContainText(`${albums[0].coverIndex + 2}.`);
    await region.locator('ul').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(status).toContainText(`${albums[0].coverIndex + 1}.`);
    await page.keyboard.press('Escape');
    await expect(first.getByRole('region')).toHaveCount(0);
    await expect(first.getByRole('button').first()).toBeFocused();
  });

  test('deep link to an album anchor scrolls it into view', async ({ page }) => {
    await page.goto(`/munkaim/#${albums[5].id}`);
    await expect(page.locator(`#${albums[5].id}`)).toBeInViewport();
  });
});
