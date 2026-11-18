import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSitemap, currentFingerprints, LEDGER_PATH, readLedger, routeFingerprint, SITEMAP_PATH, updateLedger } from '../../scripts/generate-sitemap';
import { absoluteUrl, allRoutes } from '../../src/data/routes';

/**
 * Sitemap + lastmod (scripts/generate-sitemap.ts). Red here almost always means: copy or site data
 * changed and the generated files were not refreshed. Run `npm run sitemap` (or `npm run build`) and
 * commit public/sitemap.xml and scripts/sitemap-lastmod.json with the change. Never edit them by hand.
 */
const HOW = `run \`npm run sitemap\` and commit ${SITEMAP_PATH} + ${LEDGER_PATH} together with the content change`;

describe('sitemap.xml and its lastmod ledger', () => {
  const ledger = readLedger();
  const fingerprints = currentFingerprints();

  it('the ledger knows every route, with a real date that is not in the future', () => {
    expect(Object.keys(ledger).sort()).toEqual(allRoutes().map((r) => r.path).sort());
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    for (const [route, entry] of Object.entries(ledger)) {
      expect(entry.lastmod, `lastmod of ${route}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(entry.lastmod)), `lastmod of ${route} is a real date`).toBe(false);
      expect(entry.lastmod <= tomorrow, `lastmod of ${route} (${entry.lastmod}) is in the future`).toBe(true);
    }
  });

  it('the ledger matches the current copy and data of every route', () => {
    const stale = Object.keys(fingerprints).filter((route) => ledger[route]?.fingerprint !== fingerprints[route]);
    expect(stale, `content changed on ${stale.join(' ')} but the sitemap dates were not refreshed: ${HOW}`).toEqual([]);
  });

  it('the committed public/sitemap.xml is exactly what the generator writes from the ledger', () => {
    const committed = readFileSync(path.resolve(SITEMAP_PATH), 'utf8');
    expect(committed === buildSitemap(ledger), `${SITEMAP_PATH} is out of date: ${HOW}`).toBe(true);
  });

  it('lists all 21 routes once, each with loc, lastmod and four hreflang alternates', () => {
    const xml = buildSitemap(ledger);
    const urls = xml.split('<url>').slice(1);
    expect(urls).toHaveLength(21);
    for (const { path: p } of allRoutes()) {
      const url = urls.find((u) => u.includes(`<loc>${absoluteUrl(p)}</loc>`));
      expect(url, `route ${p} is in the sitemap`).toBeDefined();
      expect(url).toContain(`<lastmod>${ledger[p].lastmod}</lastmod>`);
      expect(url!.match(/<xhtml:link rel="alternate"/g)).toHaveLength(4);
    }
  });

  it('a date only moves for the routes whose content changed', () => {
    const old = Object.fromEntries(Object.entries(fingerprints).map(([route, fingerprint]) => [route, { fingerprint, lastmod: '2026-01-01' }]));
    const next = updateLedger(old, { ...fingerprints, '/kellekberles/': 'changed' }, '2026-02-02');
    expect(next['/kellekberles/']).toEqual({ fingerprint: 'changed', lastmod: '2026-02-02' });
    expect(Object.entries(next).filter(([route]) => route !== '/kellekberles/').every(([, e]) => e.lastmod === '2026-01-01')).toBe(true);
  });

  it("a page's fingerprint follows its own copy, shared copy and the site data — not another page's copy", () => {
    const copy = { meta: { siteName: 'Fiore Vera', rental: { title: 'Bérlés' }, about: { title: 'Rólam' } }, nav: { home: 'Kezdőlap' }, rental: { intro: 'a' }, about: { intro: 'b' } };
    const data = { 'src/data/rentalItems.ts': 'export const x = 1;' };
    const base = routeFingerprint('rental', copy, data);
    expect(routeFingerprint('rental', { ...copy, about: { intro: 'changed' } }, data)).toBe(base);
    expect(routeFingerprint('rental', { ...copy, meta: { ...copy.meta, about: { title: 'changed' } } }, data)).toBe(base);
    expect(routeFingerprint('rental', { ...copy, rental: { intro: 'changed' } }, data)).not.toBe(base);
    expect(routeFingerprint('rental', { ...copy, meta: { ...copy.meta, rental: { title: 'changed' } } }, data)).not.toBe(base);
    expect(routeFingerprint('rental', { ...copy, nav: { home: 'changed' } }, data)).not.toBe(base);
    expect(routeFingerprint('rental', copy, { 'src/data/rentalItems.ts': 'export const x = 2;' })).not.toBe(base);
  });
});
