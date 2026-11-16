/**
 * scripts/generate-favicons.ts
 *
 * Regenerates the whole icon set from public/favicon.svg with sharp, so the SVG is the
 * single source and the PNGs can never drift from it again:
 *
 *   public/favicon-16x16.png, favicon-32x32.png      — transparent corners (tab icons)
 *   public/apple-touch-icon.png (180)                 — opaque, flattened on the tile colour
 *   public/android-chrome-192x192.png, -512x512.png   — opaque, flattened on the tile colour
 *
 * Optionally ships a variant from the design round first:
 *   npm run favicon -- --from crest-clef-stem-bar-blush-sage
 * writes that variant's SVG (scripts/favicon/variants.ts) to public/favicon.svg, then renders.
 *
 * site.webmanifest theme_color / background_color describe the browser chrome, not the
 * icon — change them only when the owner wants the chrome tinted (the script reports the
 * tile colour so the decision is visible).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { TOKENS } from './favicon/crest';
import { VARIANTS } from './favicon/variants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SVG_PATH = path.join(PUBLIC, 'favicon.svg');

interface Target {
  file: string;
  size: number;
  /** Opaque icons are flattened on the tile colour: iOS and Android launchers do not honour alpha. */
  opaque: boolean;
}

const TARGETS: readonly Target[] = [
  { file: 'favicon-16x16.png', size: 16, opaque: false },
  { file: 'favicon-32x32.png', size: 32, opaque: false },
  { file: 'apple-touch-icon.png', size: 180, opaque: true },
  { file: 'android-chrome-192x192.png', size: 192, opaque: true },
  { file: 'android-chrome-512x512.png', size: 512, opaque: true },
];

/** The tile colour is the fill of the first <rect>/<circle> in the SVG; linen if none. */
function tileColour(svg: string): string {
  const m = svg.match(/<(?:rect|circle)[^>]*fill="(#[0-9a-fA-F]{6})"/);
  return m ? m[1] : TOKENS.linen;
}

function parseFrom(argv: readonly string[]): string | undefined {
  const i = argv.indexOf('--from');
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const from = parseFrom(process.argv.slice(2));
  if (from) {
    const variant = VARIANTS.find((v) => v.id === from);
    if (!variant) {
      throw new Error(`Unknown variant "${from}". Known ids: ${VARIANTS.map((v) => v.id).join(', ')}`);
    }
    fs.writeFileSync(SVG_PATH, variant.svg);
    console.log(`favicon: wrote public/favicon.svg from variant ${variant.label} (${variant.id})`);
  }
  if (!fs.existsSync(SVG_PATH)) throw new Error('public/favicon.svg is missing');
  const svg = fs.readFileSync(SVG_PATH, 'utf8');
  const tile = tileColour(svg);

  for (const t of TARGETS) {
    let image = sharp(Buffer.from(svg), { density: 72 * (t.size / 64) * 4 }).resize(t.size, t.size);
    if (t.opaque) image = image.flatten({ background: tile });
    const out = path.join(PUBLIC, t.file);
    await image.png({ compressionLevel: 9 }).toFile(out);
    const kb = (fs.statSync(out).size / 1024).toFixed(1);
    console.log(`favicon: ${t.file} ${t.size}×${t.size} ${t.opaque ? 'opaque' : 'alpha'} ${kb} KB`);
  }
  console.log(`favicon: tile colour ${tile} — site.webmanifest theme_color/background_color unchanged (browser chrome, not the icon)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
