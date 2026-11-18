import type { Locator, Page } from '@playwright/test';
import { expect } from './fixtures';
import { ROUTES } from '../../src/data/routes';

/** Pages under visual regression: every HU page, the DE and EN home, and the localized 404. */
export interface VisualPage {
  id: string;
  path: string;
  /** Snapshot widths (default: SNAPSHOT_WIDTHS). DE/EN home differ from HU only in copy → phone only. */
  widths?: readonly number[];
  /** Snapshot clip height (default: SNAPSHOT_HEIGHT). The gallery is photo-heavy → shorter clip. */
  height?: number;
}
export const PAGES: readonly VisualPage[] = [
  { id: 'home', path: ROUTES.home.hu },
  { id: 'services', path: ROUTES.services.hu },
  { id: 'gallery', path: ROUTES.gallery.hu, height: 1100 },
  { id: 'rental', path: ROUTES.rental.hu },
  { id: 'about', path: ROUTES.about.hu },
  { id: 'contact', path: ROUTES.contact.hu },
  { id: 'privacy', path: ROUTES.privacy.hu },
  { id: 'notfound', path: '/nincs-ilyen-oldal/' },
  { id: 'home-de', path: ROUTES.home.de, widths: [375] },
  { id: 'home-en', path: ROUTES.home.en, widths: [375] },
];

/** Widths that caught real regressions: phone, small tablet, the 70rem/80rem nav breakpoints, wide desktop. */
export const LAYOUT_WIDTHS = [320, 375, 768, 1024, 1120, 1280, 1440, 1920] as const;
export const SNAPSHOT_WIDTHS = [375, 1280] as const;
export const HEADER_WIDTHS = [1120, 1280, 1440, 1920] as const;

/** Height of the full-page snapshots: enough to show hero + first sections, small enough to keep PNGs lean. */
export const SNAPSHOT_HEIGHT = 1500;

/**
 * Deterministic page state: toast pre-dismissed, animations and smooth scroll off, fonts ready,
 * every lazy image decoded (scroll-through), then back to the top.
 */
export const openStable = async (
  page: Page,
  path: string,
  width: number,
  height = 900,
  { keepToast = false }: { keepToast?: boolean } = {}
): Promise<void> => {
  await page.setViewportSize({ width, height });
  if (!keepToast) await page.addInitScript(() => localStorage.setItem('fv-lang-toast-dismissed', '1'));
  await page.goto(path);
  await page.addStyleTag({
    content: 'html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (snapshotHeight) => {
    await document.fonts.ready;
    const step = Math.max(400, Math.floor(innerHeight * 0.8));
    const limit = Math.min(document.documentElement.scrollHeight, snapshotHeight + innerHeight);
    for (let y = 0; y <= limit; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    // Images inside the snapshot area must be decoded; force-load lazy ones there and never wait
    // for images further down (a lazy image outside the viewport would keep decode() pending).
    const inArea = Array.from(document.images).filter((img) => img.getBoundingClientRect().top < snapshotHeight + 200);
    for (const img of inArea) img.loading = 'eager';
    const decodeAll = Promise.all(inArea.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
    await Promise.race([decodeAll, new Promise((r) => setTimeout(r, 8000))]);
  }, SNAPSHOT_HEIGHT);
  await page.waitForLoadState('networkidle');
};

/** px value of a rem-based CSS custom property on :root. */
export const rootRemVar = async (page: Page, name: string): Promise<number> =>
  page.evaluate((n) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return raw.endsWith('rem') ? parseFloat(raw) * rem : parseFloat(raw);
  }, name);

/**
 * Element screenshots only paint what lies inside the viewport: the part of a scroll container below
 * the viewport edge comes out blank (the first carousel-slide2-1280 baseline froze a cut photo and a
 * missing counter pill that way). Fail loudly instead, so the fix is a taller viewport, not a bad PNG.
 */
export const expectFullyInViewport = async (locator: Locator): Promise<void> => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), innerHeight };
  });
  expect(box.top >= 0 && box.bottom <= box.innerHeight, `element spans ${box.top}–${box.bottom}px in a ${box.innerHeight}px viewport; raise the viewport height for this snapshot`).toBe(true);
};

/**
 * The only way to take an element snapshot: checks that the element fits the viewport first
 * (expectFullyInViewport), so a too-short viewport fails the test instead of freezing a cut PNG.
 */
export const snapshotElement = async (locator: Locator, name: string): Promise<void> => {
  await expectFullyInViewport(locator);
  await expect(locator).toHaveScreenshot(name);
};

/**
 * Links whose text is a single token (an e-mail address, a phone number without spaces, one word)
 * and that render on more than one line. `overflow-wrap: anywhere` on links lets such a token break
 * mid-word when its column is a few pixels short — the footer e-mail showed as "gmail.co / m" at 1280
 * and no gate saw it (2026-11-09). Returns one description per offending link.
 */
export const wrappedSingleTokenLinks = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const out: string[] = [];
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a')) {
      const text = a.textContent?.trim() ?? '';
      if (text.length < 2 || /\s/.test(text)) continue;
      const box = a.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || getComputedStyle(a).visibility === 'hidden') continue;
      // One line box per rendered line of text: collect the distinct tops of the text's client rects.
      const tops = new Set<number>();
      const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) if (r.width > 0) tops.add(Math.round(r.top));
      }
      if (tops.size > 1) out.push(`link "${text.slice(0, 40)}" wraps onto ${tops.size} lines (${Math.round(box.width)}px wide box)`);
    }
    return out;
  });
