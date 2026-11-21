import type { Locator, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { albums } from '../../src/data/albums';
import { IMAGE_META } from '../../src/data/generated/imageMeta';

/** Derived, never pinned: albums and photos are content the owner changes (docs/vera-agent/PRD.md, R1). */
const galleryPhotoCount = Object.values(IMAGE_META.gallery).reduce((n, photos) => n + photos.length, 0);

test.describe('gallery (PRD D-6/D-7)', () => {
  // The language toast is covered by locale.spec; here it would only sit over the carousel arrows on phones.
  test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1')));

  test('renders one section per album and only loads above-the-fold images', async ({ page }) => {
    const imageRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/assets/gallery/')) imageRequests.push(req.url());
    });
    await page.goto('/munkaim/');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main section[id]').count()).toBe(albums.length);
    for (const a of albums) await expect(page.locator(`#${a.id}`)).toBeAttached();
    expect(imageRequests.length, 'all gallery images requested on load').toBeLessThan(galleryPhotoCount / 4);
    // Slides mount once a section is near the viewport: first album has all its slides, the last only its cover.
    await expect(page.locator(`#${albums[0].id} ul img`)).toHaveCount(albums[0].coverIndex >= 0 ? await page.locator(`#${albums[0].id} ul li`).count() : 0);
    expect(await page.locator(`#${albums[albums.length - 1].id} ul img`).count()).toBe(1);
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

  /**
   * The counter must only ever show where the carousel is heading. Before 2026-11-19 the scroll
   * listener rewrote the index with every position the slide animation passed: the counter (a live
   * region) ran through the photos in between, and a key pressed early in an animation started from
   * a stale index — "next" then "previous" could land on the LAST photo instead of the first.
   */
  const watchCounter = async (page: Page, albumId: string) => {
    const region = page.locator(`#${albumId}`).getByRole('region');
    const status = region.locator('[aria-live="polite"]');
    await region.getByRole('button').nth(1).scrollIntoViewIfNeeded();
    await status.evaluate((el) => {
      const seen: string[] = [];
      (window as unknown as { fvCounterSeen: string[] }).fvCounterSeen = seen;
      new MutationObserver(() => seen.push(el.textContent ?? '')).observe(el, { childList: true, characterData: true, subtree: true });
    });
    const numbersSeen = async (): Promise<number[]> => {
      const seen = await page.evaluate(() => (window as unknown as { fvCounterSeen: string[] }).fvCounterSeen);
      return [...new Set(seen.map((text) => parseInt(text, 10)))];
    };
    return { region, status, track: region.locator('ul'), numbersSeen };
  };
  const settledAt = (track: Locator, slide: number) =>
    expect.poll(() => track.evaluate((el) => Math.round(el.scrollLeft / el.clientWidth)), { timeout: 10_000 }).toBe(slide);

  test('a key pressed while a slide is still moving continues from its target, never from a stale position', async ({ page }) => {
    await page.goto('/munkaim/');
    const { region, status, track, numbersSeen } = await watchCounter(page, albums[0].id);
    await region.getByRole('button').nth(1).click();
    await expect(status).toHaveText(/^2\./);
    // The slide has started to move and is not there yet: the moment the old code read index 0 from the scroll position.
    await track.evaluate((el) => new Promise<void>((resolve) => {
      const tick = () => (el.scrollLeft > 2 ? resolve() : requestAnimationFrame(tick));
      tick();
    }));
    await track.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(status).toHaveText(/^1\./);
    await settledAt(track, 0);
    expect(await numbersSeen(), 'the counter showed only the photos that were asked for').toEqual([2, 1]);
  });

  test('three quick presses of "next" move three photos on', async ({ page }) => {
    await page.goto('/munkaim/');
    const { region, status, track, numbersSeen } = await watchCounter(page, albums[0].id);
    const next = region.getByRole('button').nth(1);
    await next.click();
    await next.click();
    await next.click();
    await expect(status).toHaveText(/^4\./);
    await settledAt(track, 3);
    expect(await numbersSeen()).toEqual([2, 3, 4]);
  });

  test('moving focus onto the photos does not drop a slide that is on its way', async ({ page }) => {
    // Chromium cancels a running smooth scroll when its scroll container is focused; the carousel resumes it.
    await page.goto('/munkaim/');
    const { region, status, track, numbersSeen } = await watchCounter(page, albums[0].id);
    await region.getByRole('button').nth(1).click();
    await track.focus();
    await settledAt(track, 1);
    await expect(status).toHaveText(/^2\./);
    expect(await numbersSeen()).toEqual([2]);
  });

  test('going back from the first photo shows the last one at once, not every photo on the way', async ({ page }) => {
    await page.goto('/munkaim/');
    const { region, status, track, numbersSeen } = await watchCounter(page, albums[0].id);
    const total = await region.locator('ul > li').count();
    await track.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(status).toHaveText(new RegExp(`^${total}\\.`));
    await settledAt(track, total - 1);
    expect(await numbersSeen(), 'the counter jumped straight to the last photo').toEqual([total]);
    // Swiping by hand afterwards is still followed: scroll back to the first photo without the arrows.
    await track.evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' }));
    await expect(status).toHaveText(/^1\./);
  });

  test('deep link to an album anchor scrolls it into view', async ({ page }) => {
    await page.goto(`/munkaim/#${albums[5].id}`);
    await expect(page.locator(`#${albums[5].id}`)).toBeInViewport();
  });
});
