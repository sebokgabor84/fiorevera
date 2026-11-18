/**
 * scripts/generate-favicons.ts
 *
 * Regenerates the whole icon set from public/favicon.svg with sharp, so the SVG is the
 * single source and the PNGs can never drift from it again:
 *
 *   public/favicon-16x16.png, favicon-32x32.png      — transparent corners (tab icons)
 *   public/favicon.ico (16 + 32 + 48)                 — for clients that request /favicon.ico blindly
 *   public/apple-touch-icon.png (180)                 — opaque, flattened on the tile colour
 *   public/android-chrome-192x192.png, -512x512.png   — opaque, flattened on the tile colour
 *   public/android-chrome-maskable-512x512.png        — full-bleed tile, crest inside the 80 % safe zone
 *
 * It also writes scripts/favicon/icon-set.json (sha256 of the SVG and of every output), which
 * tests/unit/favicon.test.ts compares with the files on disk: editing the SVG without re-running
 * this script, or touching a PNG by hand, fails the unit suite.
 *
 * Optionally ships a variant from the design round first:
 *   npm run favicon -- --from crest-clef-stem-bar-blush-sage
 * writes that variant's SVG (scripts/favicon/variants.ts) to public/favicon.svg, then renders.
 *
 * site.webmanifest theme_color / background_color describe the browser chrome, not the
 * icon — change them only when the owner wants the chrome tinted (the script reports the
 * tile colour so the decision is visible).
 */

import { createHash } from 'crypto';
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

/** Sizes packed into favicon.ico. */
const ICO_SIZES = [16, 32, 48] as const;
const ICO_FILE = 'favicon.ico';
const MASKABLE_FILE = 'android-chrome-maskable-512x512.png';
const ICON_SET_PATH = path.join(ROOT, 'scripts', 'favicon', 'icon-set.json');

/**
 * Android masks launcher icons (circle, squircle, …) and only guarantees the central circle with a
 * radius of 40 % of the icon. The crest (arc, dots, letters) fits a circle of r ≈ 30.5 units around
 * (32, 33) in the 64-unit tile, so scaling it by 0.8 around that point keeps every mark inside the
 * 25.6-unit safe radius; the tile itself becomes a full-bleed square.
 */
const MASKABLE_SCALE = 0.8;
const CREST_CENTRE = { x: 32, y: 33 } as const;

/** The favicon SVG re-composed for a maskable icon: square tile, crest shrunk into the safe zone. */
export function maskableSvg(svg: string, tile: string): string {
  const open = svg.match(/<svg[^>]*>/)?.[0];
  const tileRect = svg.match(/<rect width="64" height="64"[^>]*\/>/)?.[0];
  if (!open) throw new Error('favicon.svg has no <svg> element');
  // Without the standard tile <rect> the whole drawing (its own background included) is shrunk.
  const inner = svg.replace(open, '').replace('</svg>', '').replace(tileRect ?? '', '');
  const { x, y } = CREST_CENTRE;
  return [
    open,
    `  <rect width="64" height="64" fill="${tile}"/>`,
    `  <g transform="translate(32 32) scale(${MASKABLE_SCALE}) translate(${-x} ${-y})">${inner}</g>`,
    '</svg>',
  ].join('\n');
}

/** ICO container with PNG-encoded images (every browser since IE 11 reads PNG entries). */
export function packIco(images: readonly { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;
  images.forEach(({ size, png }, i) => {
    const at = i * 16;
    directory.writeUInt8(size, at); // width (px)
    directory.writeUInt8(size, at + 1); // height (px)
    directory.writeUInt8(0, at + 2); // palette size
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });
  return Buffer.concat([header, directory, ...images.map((i) => i.png)]);
}

const sha256 = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');
const render = (svg: string, size: number) => sharp(Buffer.from(svg), { density: 72 * (size / 64) * 4 }).resize(size, size);

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

  const written: string[] = [];
  const report = (file: string, note: string) => {
    written.push(file);
    const kb = (fs.statSync(path.join(PUBLIC, file)).size / 1024).toFixed(1);
    console.log(`favicon: ${file} ${note} ${kb} KB`);
  };

  for (const t of TARGETS) {
    let image = render(svg, t.size);
    if (t.opaque) image = image.flatten({ background: tile });
    await image.png({ compressionLevel: 9 }).toFile(path.join(PUBLIC, t.file));
    report(t.file, `${t.size}×${t.size} ${t.opaque ? 'opaque' : 'alpha'}`);
  }

  const icoImages = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, png: await render(svg, size).png({ compressionLevel: 9 }).toBuffer() }))
  );
  fs.writeFileSync(path.join(PUBLIC, ICO_FILE), packIco(icoImages));
  report(ICO_FILE, `${ICO_SIZES.join('+')} alpha`);

  await render(maskableSvg(svg, tile), 512).flatten({ background: tile }).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC, MASKABLE_FILE));
  report(MASKABLE_FILE, `512×512 maskable, crest at ${MASKABLE_SCALE * 100} %`);

  const iconSet = {
    $comment: 'Generated by scripts/generate-favicons.ts (npm run favicon). Do not edit: tests/unit/favicon.test.ts compares these hashes with the files in public/.',
    source: { file: 'favicon.svg', sha256: sha256(svg) },
    outputs: Object.fromEntries(written.map((file) => [file, sha256(fs.readFileSync(path.join(PUBLIC, file)))])),
  };
  fs.writeFileSync(ICON_SET_PATH, JSON.stringify(iconSet, null, 2) + '\n');
  console.log(`favicon: scripts/favicon/icon-set.json records ${written.length} outputs`);
  console.log(`favicon: tile colour ${tile} — site.webmanifest theme_color/background_color unchanged (browser chrome, not the icon)`);
}

// Run only as a script (`npm run favicon`); the unit test imports the helpers above.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
