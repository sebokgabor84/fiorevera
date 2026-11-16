import { test, expect } from '@playwright/test';
import { LAYOUT_WIDTHS, PAGES, openStable, rootRemVar } from './helpers';

/**
 * Layout invariants — structural assertions that are stable across machines (no pixels).
 * Each one encodes a regression that reached a reviewer on 2026-11-09:
 *  - header wordmark wrapping per character at ≥ 1280 px (bar capped at --content-max)
 *  - .container losing its max-width (safety layer) → 185-character lines, oversized carousel
 *  - sticky image column pinning under the header on phones (text scrolled behind the image)
 *  - toast / scroll-to-top covering controls; menu panel trapped by backdrop-filter
 */
for (const { id, path } of PAGES) {
  for (const width of LAYOUT_WIDTHS) {
    test(`${id} @ ${width}: no overflow, capped container, readable header, no oversized sticky`, async ({ page }) => {
      // Desktop widths use a 768 px tall viewport (1366×768 laptops): the harshest common case for sticky columns.
      await openStable(page, path, width, width >= 1024 ? 768 : 812);
      const contentMax = await rootRemVar(page, '--content-max');

      const r = await page.evaluate(
        ({ contentMax }) => {
          const px = (n: number) => Math.round(n * 10) / 10;
          const issues: string[] = [];

          // 1. No horizontal page overflow.
          if (document.documentElement.scrollWidth > innerWidth + 1) issues.push(`page overflows: ${document.documentElement.scrollWidth} > ${innerWidth}`);

          // 2. Every content container respects --content-max; the header bar may go to 90rem.
          const headerBar = document.querySelector('header .container');
          for (const c of document.querySelectorAll<HTMLElement>('.container')) {
            const w = c.getBoundingClientRect().width;
            const limit = c === headerBar ? 90 * parseFloat(getComputedStyle(document.documentElement).fontSize) : contentMax;
            if (w > limit + 1) issues.push(`.container ${px(w)}px exceeds ${px(limit)}px`);
          }

          // 3. Header: brand on one line, every bar child inside the bar, no child squeezed.
          const bar = headerBar as HTMLElement | null;
          if (bar) {
            const b = bar.getBoundingClientRect();
            for (const child of Array.from(bar.children) as HTMLElement[]) {
              const cb = child.getBoundingClientRect();
              if (cb.width > 0 && (cb.left < b.left - 1 || cb.right > b.right + 1)) issues.push(`header child ${child.tagName} leaves the bar`);
            }
            const brand = document.querySelector<HTMLElement>('header a span span');
            if (brand && getComputedStyle(brand).display !== 'none') {
              const fs = parseFloat(getComputedStyle(brand).fontSize);
              const h = brand.getBoundingClientRect().height;
              if (h > fs * 1.6) issues.push(`brand wraps: ${px(h)}px tall at font-size ${px(fs)}px`);
            }
            for (const a of document.querySelectorAll<HTMLElement>('header nav a, header button')) {
              const cs = getComputedStyle(a);
              if (cs.display === 'none' || a.getBoundingClientRect().width === 0) continue;
              const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
              if (a.getBoundingClientRect().height > lh * 2.6) issues.push(`header control "${a.textContent?.trim().slice(0, 20)}" wraps to several lines`);
            }
          }

          // 4. A sticky block inside main must fit the viewport below its own top offset, otherwise its
          //    lower part can never be seen while it is pinned (and on phones it would hide the text).
          for (const el of document.querySelectorAll<HTMLElement>('main *')) {
            const cs = getComputedStyle(el);
            if (cs.position !== 'sticky') continue;
            const h = el.getBoundingClientRect().height;
            const top = parseFloat(cs.top) || 0;
            if (top + h > innerHeight) issues.push(`sticky element ${el.className} (${px(h)}px + top ${px(top)}px) does not fit a ${innerHeight}px viewport`);
          }

          // 5. No clipped single-line text (overflow hidden + content wider than the box).
          for (const el of document.querySelectorAll<HTMLElement>('h1, h2, h3, p, li, a, button, dt, dd')) {
            const cs = getComputedStyle(el);
            if (cs.overflow !== 'hidden' && cs.overflowX !== 'hidden') continue;
            if (cs.textOverflow === 'ellipsis') continue;
            if (el.scrollWidth > el.clientWidth + 2) issues.push(`clipped text in ${el.tagName}: "${el.textContent?.trim().slice(0, 30)}"`);
          }

          // 6. Images keep their aspect ratio unless object-fit: cover/contain is intended.
          for (const img of Array.from(document.images)) {
            if (!img.complete || img.naturalWidth === 0) continue;
            const fit = getComputedStyle(img).objectFit;
            if (fit === 'cover' || fit === 'contain') continue;
            const r = img.getBoundingClientRect();
            if (r.width === 0) continue;
            const natural = img.naturalWidth / img.naturalHeight;
            const shown = r.width / r.height;
            if (Math.abs(natural - shown) / natural > 0.02) issues.push(`distorted image ${img.currentSrc.split('/').pop()}`);
          }
          return issues;
        },
        { contentMax }
      );
      expect(r, r.join('\n')).toEqual([]);
    });
  }
}

test.describe('overlays never cover primary controls', () => {
  for (const width of [375, 1280] as const) {
    test(`home @ ${width}: header controls and CTAs are hit-testable; menu panel is above the page`, async ({ page }) => {
      await openStable(page, PAGES[0].path, width);
      const covered = await page.evaluate(() => {
        const out: string[] = [];
        const controls = Array.from(document.querySelectorAll<HTMLElement>('header a, header button, main .btn, main a[href]')).filter(
          (el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden'
        );
        for (const el of controls.slice(0, 20)) {
          el.scrollIntoView({ block: 'center' });
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (hit && !el.contains(hit) && !hit.contains(el)) out.push(`${el.tagName} "${el.textContent?.trim().slice(0, 24)}" covered by ${hit.tagName}.${(hit as HTMLElement).className}`);
        }
        window.scrollTo(0, 0);
        return out;
      });
      expect(covered, covered.join('\n')).toEqual([]);

      if (width < 1120) {
        await page.getByRole('button', { name: /men/i }).first().click();
        const panelState = await page.evaluate(() => {
          const panel = document.querySelector<HTMLElement>('header [role="dialog"]');
          if (!panel) return { ok: false, why: 'no dialog panel' };
          const r = panel.getBoundingClientRect();
          const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
          return { ok: r.height > innerHeight * 0.7 && !!mid && panel.contains(mid), why: `panel ${Math.round(r.height)}px; centre hit ${mid?.tagName}` };
        });
        expect(panelState.ok, panelState.why).toBe(true);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', { name: /men/i }).first()).toHaveAttribute('aria-expanded', 'false');
      }
    });
  }
});
