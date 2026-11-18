import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect } from 'vitest';
import iconSet from '../../scripts/favicon/icon-set.json';
import { maskableSvg, packIco } from '../../scripts/generate-favicons';

const PUBLIC = path.resolve('public');
const sha256 = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');
const read = (file: string): Buffer => readFileSync(path.join(PUBLIC, file));

/**
 * Drift guard for the icon set (favicon-builder): the legacy site shipped a daisy SVG next to badge
 * PNGs because every file came from a different source. Here every icon is generated from
 * public/favicon.svg by `npm run favicon`, which records the hashes in scripts/favicon/icon-set.json.
 */
describe('favicon set is generated from the current favicon.svg', () => {
  it('favicon.svg is the SVG the icons were generated from (re-run `npm run favicon` after editing it)', () => {
    expect(sha256(read(iconSet.source.file).toString('utf8'))).toBe(iconSet.source.sha256);
  });

  it.each(Object.entries(iconSet.outputs))('%s is the generated file, not a hand-edited one', (file, hash) => {
    expect(existsSync(path.join(PUBLIC, file)), `${file} is missing from public/`).toBe(true);
    expect(sha256(read(file))).toBe(hash);
  });

  it('covers every icon index.html and the manifest point to', () => {
    const generated = new Set(Object.keys(iconSet.outputs));
    const html = readFileSync(path.resolve('index.html'), 'utf8');
    const linked = Array.from(html.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*href="\/([^"]+)"/g), (m) => m[1]);
    const manifest = JSON.parse(read('site.webmanifest').toString('utf8')) as { icons: { src: string; purpose?: string }[] };
    const fromManifest = manifest.icons.map((icon) => icon.src.replace(/^\//, ''));
    for (const file of [...linked, ...fromManifest]) {
      if (file !== iconSet.source.file) expect(generated.has(file), `${file} is referenced but not generated`).toBe(true);
    }
    expect(generated.has('favicon.ico')).toBe(true);
    expect(manifest.icons.filter((icon) => icon.purpose === 'maskable').map((icon) => icon.src)).toEqual(['/android-chrome-maskable-512x512.png']);
  });
});

describe('favicon.ico', () => {
  it('is an ICO container with 16, 32 and 48 px PNG entries', () => {
    const ico = read('favicon.ico');
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 3]);
    const entries = [0, 1, 2].map((i) => {
      const at = 6 + i * 16;
      return { size: ico.readUInt8(at), bytes: ico.readUInt32LE(at + 8), offset: ico.readUInt32LE(at + 12) };
    });
    expect(entries.map((e) => e.size)).toEqual([16, 32, 48]);
    for (const e of entries) {
      // Every entry is a complete PNG (signature) that lies inside the file.
      expect(ico.subarray(e.offset, e.offset + 8).toString('latin1')).toBe('\u0089PNG\r\n\u001a\n');
      expect(e.offset + e.bytes).toBeLessThanOrEqual(ico.length);
    }
    expect(entries[2].offset + entries[2].bytes).toBe(ico.length);
  });

  it('packIco writes one directory entry per image', () => {
    const png = Buffer.from('\u0089PNG\r\n\u001a\nfake', 'latin1');
    const ico = packIco([{ size: 16, png }, { size: 32, png }]);
    expect(ico.readUInt16LE(4)).toBe(2);
    expect(ico.length).toBe(6 + 2 * 16 + 2 * png.length);
    expect(ico.readUInt32LE(6 + 16 + 12)).toBe(6 + 2 * 16 + png.length);
  });
});

describe('maskable Android icon', () => {
  it('keeps every crest pixel inside the 80 % safe zone and bleeds the tile to all four corners', async () => {
    const { data, info } = await sharp(read('android-chrome-maskable-512x512.png')).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([512, 512]);
    const px = (x: number, y: number) => Array.from(data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3));
    const tile = px(0, 0);
    for (const [x, y] of [[511, 0], [0, 511], [511, 511]]) expect(px(x, y)).toEqual(tile);
    const safeRadius = 0.4 * 512;
    let farthest = 0;
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const p = px(x, y);
        // Anti-aliased edge pixels differ slightly from the tile; count only clearly different ones.
        if (Math.abs(p[0] - tile[0]) + Math.abs(p[1] - tile[1]) + Math.abs(p[2] - tile[2]) > 24) {
          farthest = Math.max(farthest, Math.hypot(x - 255.5, y - 255.5));
        }
      }
    }
    expect(farthest).toBeGreaterThan(safeRadius * 0.8); // the crest is not needlessly small
    expect(farthest).toBeLessThanOrEqual(safeRadius);
  });

  it('maskableSvg replaces the rounded tile with a square one and scales the rest', () => {
    const svg = maskableSvg(read('favicon.svg').toString('utf8'), '#7a8b7b');
    expect(svg).toContain('<rect width="64" height="64" fill="#7a8b7b"/>');
    expect(svg).not.toContain('rx="14"');
    expect(svg).toContain('scale(0.8)');
  });
});
