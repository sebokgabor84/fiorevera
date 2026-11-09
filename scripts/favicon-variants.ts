/**
 * scripts/favicon-variants.ts
 *
 * Renders the favicon design round (scripts/favicon/variants.ts) into a self-contained
 * review page, docs/design/favicon-variants.html: every variant as inline SVG at
 * 16 / 32 / 48 / 180 px on a light and a dark browser-tab strip, plus the true 16 px
 * pixels as rasterised by sharp (magnified ×6), its rationale and honest critique.
 * The current public/favicon.svg is shown first for comparison.
 *
 * Usage:
 *   npm run favicon:variants
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { PALETTE_NOTE, RECOMMENDATION, SHIPPED_VARIANT_ID, VARIANTS, type FaviconVariant } from './favicon/variants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs/design/favicon-variants.html');
const CURRENT_SVG = path.join(ROOT, 'public/favicon.svg');

/** Chrome's tab strip colours — what a favicon is actually seen against. */
const STRIPS = { light: '#f1f3f4', dark: '#202124' } as const;
const SIZES = [32, 48, 180] as const;

async function rasterise(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 72 * (size / 64) * 4 })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function onStrip(png: Buffer, size: number, background: string, magnify: number): Promise<string> {
  const pad = 6;
  const framed = await sharp({ create: { width: size + pad * 2, height: size + pad * 2, channels: 4, background } })
    .composite([{ input: png, left: pad, top: pad }])
    .png()
    .toBuffer();
  const out =
    magnify > 1
      ? await sharp(framed)
          .resize((size + pad * 2) * magnify, (size + pad * 2) * magnify, { kernel: 'nearest' })
          .png()
          .toBuffer()
      : framed;
  return `data:image/png;base64,${out.toString('base64')}`;
}

const inline = (svg: string, size: number): string =>
  svg.trim().replace('<svg ', `<svg width="${size}" height="${size}" role="img" aria-hidden="true" `);

const tabChip = (svg: string, theme: 'light' | 'dark'): string =>
  `<div class="tab ${theme}"><div class="tabinner">${inline(svg, 16)}<span>Fiore Vera | virág és dekoráció</span></div></div>`;

async function card(v: FaviconVariant): Promise<string> {
  const png16 = await rasterise(v.svg, 16);
  const light = await onStrip(png16, 16, STRIPS.light, 6);
  const dark = await onStrip(png16, 16, STRIPS.dark, 6);
  const sizes = SIZES.map(
    (s) =>
      `<div class="size"><div class="pair"><div class="sq light">${inline(v.svg, s)}</div><div class="sq dark">${inline(v.svg, s)}</div></div><small>${s} px</small></div>`,
  ).join('');
  return `
  <section class="card" id="variant-${v.id}">
    <header><span class="letter">${v.label}</span><h2>${v.name}</h2></header>
    <div class="tabs">${tabChip(v.svg, 'light')}${tabChip(v.svg, 'dark')}</div>
    <div class="sizes">${sizes}</div>
    <div class="raster">
      <small>True 16 px raster by sharp, magnified ×6 (nearest neighbour) — light / dark strip</small>
      <div class="pair"><img src="${light}" width="168" height="168" alt=""><img src="${dark}" width="168" height="168" alt=""></div>
    </div>
    <p class="rationale">${v.rationale[0]}<br>${v.rationale[1]}</p>
    <p class="critique"><strong>Honest critique.</strong> ${v.critique}</p>
    <p class="id">id: <code>${v.id}</code>${v.id === SHIPPED_VARIANT_ID ? ' · <strong>shipped</strong>' : ''}</p>
  </section>`;
}

function currentCard(): FaviconVariant | null {
  if (!fs.existsSync(CURRENT_SVG)) return null;
  return {
    id: 'current',
    label: '—',
    name: 'Current favicon (for comparison)',
    rationale: [
      'The SVG shipped today, read from public/favicon.svg.',
      'Shown so every proposal is judged against what visitors see now.',
    ],
    critique:
      'Whatever public/favicon.svg holds when this page is generated. Since 2026-11-09 that is F3 (crest-fv-sage), and npm run favicon regenerates every PNG size from this one file.',
    svg: fs.readFileSync(CURRENT_SVG, 'utf8'),
  };
}

async function main(): Promise<void> {
  const current = currentCard();
  const all = current ? [current, ...VARIANTS] : [...VARIANTS];
  const cards = await Promise.all(all.map(card));
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fiore Vera — favicon variants review</title>
<style>
  :root { --linen:#faf7f2; --sage:#7a8b7b; --blush:#e8c5c8; --gold:#d4af37; --ink:#2c2825; --muted:#6b635b; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--linen); color:var(--ink); font: 16px/1.6 Inter, Lato, system-ui, sans-serif; padding: 2rem clamp(1rem, 4vw, 3rem) 4rem; }
  h1, h2 { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; font-weight: 500; line-height:1.1; margin:0; }
  h1 { font-size: clamp(2rem, 1.5rem + 2vw, 3rem); }
  .lead, .meta { max-width: 60rem; color: var(--muted); }
  .finding { max-width: 60rem; border-left: 3px solid var(--gold); padding: .6rem 1rem; background:#fff; margin: 1.25rem 0 2rem; }
  .grid { display:grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); }
  .card { background:#fff; border:1px solid rgba(212,175,55,.35); border-radius: 12px; padding: 1.25rem; display:flex; flex-direction:column; gap: 1rem; }
  .card header { display:flex; align-items:center; gap:.75rem; }
  .letter { display:inline-grid; place-items:center; min-width:2rem; height:2rem; padding:0 .4rem; border-radius:1rem; background:var(--ink); color:var(--linen); font-weight:600; font-size:.85rem; }
  .card h2 { font-size: 1.45rem; }
  .tabs { display:grid; gap:.5rem; }
  .tab { border-radius: 8px; padding: .5rem; }
  .tab.light { background:#dee1e6; } .tab.dark { background:#202124; }
  .tabinner { display:flex; align-items:center; gap:.5rem; border-radius: 8px 8px 0 0; padding: .4rem .75rem; font-size: 12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 16rem; }
  .tab.light .tabinner { background:#fff; color:#202124; } .tab.dark .tabinner { background:#35363a; color:#e8eaed; }
  .tabinner span { overflow:hidden; text-overflow:ellipsis; }
  .sizes { display:flex; flex-wrap:wrap; gap: 1rem; align-items:flex-end; }
  .size small, .raster small, .id { display:block; color:var(--muted); font-size:.75rem; margin:0; }
  .pair { display:flex; gap:.5rem; }
  .sq { display:grid; place-items:center; padding:6px; border-radius:6px; }
  .sq.light { background:#f1f3f4; } .sq.dark { background:#202124; }
  .raster img { image-rendering: pixelated; border-radius: 6px; }
  .rationale { margin:0; }
  .critique { margin:0; color: var(--muted); font-size:.95rem; border-top:1px dashed rgba(122,139,123,.5); padding-top:.75rem; }
  .reco { max-width: 60rem; margin-top: 2.5rem; background:#fff; border:1px solid rgba(122,139,123,.4); border-radius:12px; padding:1.25rem 1.5rem; }
  .reco h2 { font-size: 1.6rem; margin-bottom:.5rem; }
  .meta { font-size:.85rem; margin-top:2rem; }
  code { font-size:.85em; background:#f3ede4; padding:.1em .3em; border-radius:4px; }
</style>
</head>
<body>
  <h1>Favicon variants — Fiore Vera</h1>
  <p class="lead">The family crest (“címer”) direction for the tab icon: the badge’s open arc with its trailing dots, always carrying a letter. Each variant is shown as inline SVG at 16 / 32 / 48 / 180 px on a light and a dark browser-tab strip, plus the real 16 px pixels as rasterised by <code>sharp</code>. Palette limited to the locked tokens; letterforms are Cormorant Garamond converted to paths — no live font.</p>
  <div class="finding"><strong>Finding while auditing the current set (2026-11-09).</strong> <code>public/favicon.svg</code> was a generic daisy, while every PNG (<code>favicon-16x16</code>, <code>-32x32</code>, <code>apple-touch-icon</code>, <code>android-chrome-*</code>) was the full line-art badge squeezed into a square — unreadable at 16 and 32 px. Chrome/Firefox showed the daisy, Safari and home-screen bookmarks the smudged badge. <code>npm run favicon</code> now regenerates all of them from one SVG so this cannot drift again.</div>

  <div class="grid">
${cards.join('\n')}
  </div>

  <section class="reco">
    <h2>Recommendation</h2>
    ${RECOMMENDATION}
  </section>

  <p class="meta">Generated by <code>npm run favicon:variants</code> (scripts/favicon-variants.ts) from scripts/favicon/variants.ts; rasters by sharp at 16 px on <code>#f1f3f4</code> (light strip) and <code>#202124</code> (dark strip). ${PALETTE_NOTE} Glyph outlines: scripts/favicon/glyphs.ts, extracted from public/fonts/cormorant-garamond-latin.woff2 by scripts/favicon/extract-glyphs.py.</p>
</body>
</html>
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log(`favicon-variants: wrote ${path.relative(ROOT, OUT)} (${all.length} cards, ${(html.length / 1024).toFixed(0)} KB)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
