/**
 * generate-sitemap.ts — MASTER-PLAN 1.8: public/sitemap.xml with all 21 routes
 * and xhtml:link alternates (incl. x-default). Idempotent; run by `npm run build`.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { absoluteUrl, allRoutes, alternatesFor, type PageId } from '../src/data/routes';

const PRIORITY: Record<PageId, string> = {
  home: '1.0',
  services: '0.9',
  gallery: '0.9',
  rental: '0.9',
  about: '0.7',
  contact: '0.8',
  privacy: '0.3',
};

export const buildSitemap = (): string => {
  const urls = allRoutes()
    .map(({ page, path: p }) => {
      const alternates = alternatesFor(page)
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
        .join('\n');
      return `  <url>\n    <loc>${absoluteUrl(p)}</loc>\n${alternates}\n    <changefreq>monthly</changefreq>\n    <priority>${PRIORITY[page]}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
};

if (process.argv[1]?.endsWith('generate-sitemap.ts')) {
  const out = path.resolve('public/sitemap.xml');
  writeFileSync(out, buildSitemap());
  console.log(`✓ wrote ${path.relative(process.cwd(), out)} (${allRoutes().length} routes)`);
}
