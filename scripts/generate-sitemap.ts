/**
 * generate-sitemap.ts — MASTER-PLAN 1.8: public/sitemap.xml with all 21 routes,
 * xhtml:link alternates (incl. x-default) and a truthful <lastmod>. Run by `npm run build`.
 *
 * lastmod: search engines use it only while it is accurate, so it must move when a page's content
 * changes and stay put otherwise. public/sitemap.xml is committed, so the date cannot come from the
 * build clock (every build would change the file) or from `git log` (the date of a commit is not
 * known before the commit exists). Instead each route has a content fingerprint — its copy in its
 * own language plus the site data — recorded with a date in scripts/sitemap-lastmod.json:
 *
 *   fingerprint unchanged → the recorded date is kept
 *   fingerprint changed   → today's date, and the ledger is rewritten
 *
 * Commit public/sitemap.xml and scripts/sitemap-lastmod.json together with the content change
 * (tests/unit/sitemap.test.ts fails while they are out of date). Never edit either by hand.
 * After a merge conflict in them: take either side, then run `npm run sitemap`.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { absoluteUrl, allRoutes, alternatesFor, PAGE_IDS, type Locale, type PageId } from '../src/data/routes';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITEMAP_PATH = 'public/sitemap.xml';
export const LEDGER_PATH = 'scripts/sitemap-lastmod.json';

/** Route path → fingerprint of its content and the day that content last changed (YYYY-MM-DD). */
export type Ledger = Record<string, { fingerprint: string; lastmod: string }>;

const PRIORITY: Record<PageId, string> = {
  home: '1.0',
  services: '0.9',
  gallery: '0.9',
  rental: '0.9',
  about: '0.7',
  contact: '0.8',
  privacy: '0.3',
};

/**
 * What counts as the content of one page in one language: its copy (the locale file without the
 * namespaces of the other pages — shared copy such as navigation and footer stays in) and the site
 * data. Code and styles are deliberately left out: a refactor is not a content change.
 */
export const routeFingerprint = (page: PageId, copy: Record<string, unknown>, data: Record<string, string>): string => {
  const others = new Set<string>([...PAGE_IDS.filter((p) => p !== page), 'notFound']);
  const own = Object.fromEntries(Object.entries(copy).filter(([key]) => !others.has(key)));
  if (own.meta && typeof own.meta === 'object') {
    own.meta = Object.fromEntries(Object.entries(own.meta as Record<string, unknown>).filter(([key]) => !others.has(key)));
  }
  const hash = createHash('sha256').update(JSON.stringify(own));
  for (const file of Object.keys(data).sort()) hash.update(`\n${file}\n${data[file]}`);
  return hash.digest('hex').slice(0, 16);
};

/** Fingerprint of every route, from the files in this checkout. */
export const currentFingerprints = (root: string = ROOT): Record<string, string> => {
  const data: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(path.join(root, dir))) {
      const rel = path.join(dir, entry);
      if (statSync(path.join(root, rel)).isDirectory()) walk(rel);
      else data[rel] = readFileSync(path.join(root, rel), 'utf8');
    }
  };
  walk(path.join('src', 'data'));
  const copy = new Map<Locale, Record<string, unknown>>();
  const out: Record<string, string> = {};
  for (const { page, locale, path: p } of allRoutes()) {
    if (!copy.has(locale)) copy.set(locale, JSON.parse(readFileSync(path.join(root, 'src/i18n/locales', `${locale}.json`), 'utf8')) as Record<string, unknown>);
    out[p] = routeFingerprint(page, copy.get(locale)!, data);
  }
  return out;
};

/** Keeps the date of every route whose fingerprint is unchanged; stamps `today` on the others. */
export const updateLedger = (ledger: Ledger, fingerprints: Record<string, string>, today: string): Ledger =>
  Object.fromEntries(
    Object.entries(fingerprints).map(([route, fingerprint]) => [
      route,
      ledger[route]?.fingerprint === fingerprint ? ledger[route] : { fingerprint, lastmod: today },
    ])
  );

export const readLedger = (root: string = ROOT): Ledger => {
  const file = path.join(root, LEDGER_PATH);
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Ledger) : {};
};

export const buildSitemap = (ledger: Ledger): string => {
  const urls = allRoutes()
    .map(({ page, path: p }) => {
      const alternates = alternatesFor(page)
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
        .join('\n');
      const lastmod = ledger[p]?.lastmod;
      if (!lastmod) throw new Error(`no lastmod for ${p} in ${LEDGER_PATH} — run \`npm run sitemap\``);
      return `  <url>\n    <loc>${absoluteUrl(p)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n    <changefreq>monthly</changefreq>\n    <priority>${PRIORITY[page]}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
};

export const serializeLedger = (ledger: Ledger): string => `${JSON.stringify(ledger, null, 2)}\n`;

if (process.argv[1]?.endsWith('generate-sitemap.ts')) {
  const before = readLedger();
  const ledger = updateLedger(before, currentFingerprints(), new Date().toISOString().slice(0, 10));
  const changed = Object.keys(ledger).filter((route) => before[route]?.fingerprint !== ledger[route].fingerprint);
  if (serializeLedger(before) !== serializeLedger(ledger)) writeFileSync(path.join(ROOT, LEDGER_PATH), serializeLedger(ledger));
  writeFileSync(path.join(ROOT, SITEMAP_PATH), buildSitemap(ledger));
  console.log(`✓ wrote ${SITEMAP_PATH} (${allRoutes().length} routes)`);
  if (changed.length > 0) {
    console.log(`  content changed on ${changed.length} route(s) → lastmod ${ledger[changed[0]].lastmod}: ${changed.join(' ')}`);
    console.log(`  commit ${SITEMAP_PATH} and ${LEDGER_PATH} together with the content change`);
  }
}
