/**
 * prerender.ts — MASTER-PLAN 1.9 (PRD D-18)
 * Runs after `vite build` (client → dist/) and `vite build --ssr` (→ dist-ssr/).
 * Renders all 21 routes + 3 localized 404s with entry-server and writes
 * dist/<route>/index.html (and dist[/<prefix>]/404.html). React 19 emits the
 * hoistable <title>/<meta>/<link> at the start of the markup; we move them into <head>.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { allRoutes, LOCALES, localePrefix } from '../src/data/routes';

interface ServerEntry {
  render: (url: string) => { html: string; locale: string };
}

const DIST = path.resolve('dist');
const SSR_ENTRY = path.resolve('dist-ssr/entry-server.js');
const HEAD_TAG_RE = /<(title|meta|link)\b[^>]*>(?:[^<]*<\/title>)?/g;

const splitHoistables = (markup: string): { head: string; body: string } => {
  // Hoistables appear before the first real element (<header>…), as a run of title/meta/link tags.
  let head = '';
  let rest = markup;
  for (;;) {
    const m = /^(<(title|meta|link)\b[^>]*>(?:[^<]*<\/title>)?)/.exec(rest);
    if (!m) break;
    head += m[1];
    rest = rest.slice(m[1].length);
  }
  if (!head) {
    // Fallback: collect any top-level head tags left in the body
    head = (markup.match(HEAD_TAG_RE) ?? []).join('');
    rest = markup.replace(HEAD_TAG_RE, '');
  }
  return { head, body: rest };
};

const main = async () => {
  const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  if (!template.includes('<!--app-html-->')) throw new Error('dist/index.html lacks <!--app-html--> marker');
  const { render } = (await import(pathToFileURL(SSR_ENTRY).href)) as ServerEntry;

  const targets = [
    ...allRoutes().map(({ path: p }) => ({ url: p, out: path.join(DIST, p, 'index.html') })),
    ...LOCALES.map((l) => ({ url: `${localePrefix(l)}/__404__/`, out: path.join(DIST, localePrefix(l), '404.html') })),
  ];

  for (const { url, out } of targets) {
    const { html, locale } = render(url);
    const { head, body } = splitHoistables(html);
    const page = template
      .replace('<html lang="hu">', `<html lang="${locale}">`)
      .replace(/<title>[^<]*<\/title>/, '') // the static fallback title gives way to the route title
      .replace('</head>', `${head}\n  </head>`)
      .replace('<!--app-html-->', body);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, page);
  }
  console.log(`✓ prerendered ${targets.length} pages into dist/`);
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
