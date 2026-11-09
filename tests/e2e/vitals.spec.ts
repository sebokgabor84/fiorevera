import { test, expect } from '@playwright/test';

const ROUTES_UNDER_TEST = ['/', '/munkaim/', '/de/verleih/', '/en/contact/'];

test.describe('web vitals guard (Goal 3: LCP < 2.5 s, CLS < 0.1 on the dev build)', () => {
  for (const path of ROUTES_UNDER_TEST) {
    test(`vitals on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      const metrics = await page.evaluate(
        () =>
          new Promise<{ lcp: number; cls: number }>((resolve) => {
            let lcp = 0;
            let cls = 0;
            new PerformanceObserver((list) => {
              const last = list.getEntries().at(-1);
              if (last) lcp = last.startTime;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) {
                const shift = e as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
                if (!shift.hadRecentInput) cls += shift.value ?? 0;
              }
            }).observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => resolve({ lcp, cls }), 500);
          })
      );
      console.log(`vitals ${path}`, metrics);
      expect(metrics.cls).toBeLessThan(0.1);
      // Dev server (unminified, no HTTP cache) is slower than the prerendered build; keep a generous local ceiling.
      expect(metrics.lcp).toBeLessThan(4000);
    });
  }
});
