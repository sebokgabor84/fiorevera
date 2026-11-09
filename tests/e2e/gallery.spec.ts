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
    // Slides mount once a section is near the viewport: first album has all its slides, the last only its cover.
    await expect(page.locator(`#${albums[0].id} ul img`)).toHaveCount(albums[0].coverIndex >= 0 ? await page.locator(`#${albums[0].id} ul li`).count() : 0);
    expect(await page.locator(`#${albums[14].id} ul img`).count()).toBe(1);
  });

  test('every album is a carousel with always-visible arrows; arrows and keys navigate', async ({ page }) => {
    await page.goto('/munkaim/');
    const first = page.locator(`#${albums[0].id}`);
    const region = first.getByRole('region');
    await expect(region).toBeVisible();
    await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const prev = region.getByRole('button').nth(0);
    const next = region.getByRole('button').nth(1);
    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();
    // Controls sit above the images: the point at the arrow's centre hits the button itself.
    await next.scrollIntoViewIfNeeded();
    const box = await next.boundingBox();
    expect(box).not.toBeNull();
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label') ?? null,
      [box!.x + box!.width / 2, box!.y + box!.height / 2]
    );
    expect(hit).toBe(await next.getAttribute('aria-label'));

    const status = region.locator('[aria-live="polite"]');
    await expect(status).toContainText('1.');
    const size = async () => {
      const b = await region.boundingBox();
      return b && { width: b.width, height: b.height };
    };
    const sizeBefore = await size();
    await next.click();
    await expect(status).toContainText('2.');
    await region.locator('ul').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(status).toContainText('1.');
    // No jumping content: the carousel box keeps its size while slides change.
    expect(await size()).toEqual(sizeBefore);
  });

  test('deep link to an album anchor scrolls it into view', async ({ page }) => {
    await page.goto(`/munkaim/#${albums[5].id}`);
    await expect(page.locator(`#${albums[5].id}`)).toBeInViewport();
  });
});
