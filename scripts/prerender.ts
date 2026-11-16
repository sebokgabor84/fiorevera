/**
 * prerender.ts — MASTER-PLAN 1.9 (PRD D-18)
 * Runs after `vite build` (client → dist/) and `vite build --ssr` (→ dist-ssr/).
 * Renders all 21 routes with entry-server and writes dist/<route>/index.html. React 19
 * emits the hoistable <title>/<meta>/<link> at the start of the markup; we move them into
 * <head>. The <noscript> paragraph is localized per route.
 *
 * 404: a single dist/404.html with an EMPTY root and a noindex meta. Vercel serves it with
 * HTTP 404 for every unmatched path (no rewrites → no soft 404, QA M2); the client renders
 * the NotFound page in the locale of the requested path (createRoot, nothing to hydrate, so
 * no duplicated head tags).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { allRoutes, type Locale } from '../src/data/routes';

interface ServerEntry {
  render: (url: string) => { html: string; locale: string };
}

const DIST = path.resolve('dist');
const SSR_ENTRY = path.resolve('dist-ssr/entry-server.js');
const HEAD_TAG_RE = /<(title|meta|link)\b[^>]*>(?:[^<]*<\/title>)?/g;
const NOSCRIPT_RE = /(<p data-noscript>)[^<]*(<\/p>)/;

const noscriptText = (locale: Locale): string => {
  const json = JSON.parse(readFileSync(path.resolve(`src/i18n/locales/${locale}.json`), 'utf8')) as {
    common: { noscript: string };
  };
  return json.common.noscript;
};

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

  const targets = allRoutes().map(({ path: p }) => ({ url: p, out: path.join(DIST, p, 'index.html') }));

  for (const { url, out } of targets) {
    const { html, locale } = render(url);
    const { head, body } = splitHoistables(html);
    const page = template
      .replace('<html lang="hu">', `<html lang="${locale}">`)
      .replace(/<title>[^<]*<\/title>/, '') // the static fallback title gives way to the route title
      .replace('</head>', `${head}\n  </head>`)
      .replace(NOSCRIPT_RE, `$1${noscriptText(locale as Locale)}$2`)
      .replace('<!--app-html-->', body);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, page);
  }

  // Single locale-neutral 404 shell (see header comment).
  const notFound = template
    .replace('</head>', '<meta name="robots" content="noindex, follow" />\n  </head>')
    .replace('<!--app-html-->', '');
  writeFileSync(path.join(DIST, '404.html'), notFound);

  console.log(`✓ prerendered ${targets.length} pages + 404.html into dist/`);
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
