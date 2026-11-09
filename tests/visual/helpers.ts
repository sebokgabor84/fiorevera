import type { Page } from '@playwright/test';
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
