/**
 * optimize-images.js — MASTER-PLAN 0.2 (PRD D-5)
 *
 * Derives the shipped site imagery from the replaceable source slots:
 *
 *   assets-src/hero/*                 → public/assets/hero/*.webp
 *   assets-src/about/*                → public/assets/about/*.webp
 *   assets-src/gallery/<album>/*      → public/assets/gallery/<album>/*.webp
 *   assets-src/rental/<item>/*        → public/assets/rental/<item>/*.webp
 *   assets-src/brand/*                → public/assets/brand/*.webp (alpha kept)
 *
 * Every photo gets a full variant (long edge ≤ 1920 px, ≤ 200 KB) and a
 * small variant (long edge ≤ 800 px, suffix -w800). Outputs whose source is
 * gone are deleted, so re-running after swapping one album only changes that
 * album. The dimension manifest src/data/generated/imageMeta.ts is rewritten
 * on every run. Idempotent: unchanged sources are skipped (mtime check).
 *
 * Usage: node scripts/optimize-images.js [--force]
 */
import { readdir, stat, mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_ROOT = path.resolve('assets-src');
const OUT_ROOT = path.resolve('public/assets');
const META_FILE = path.resolve('src/data/generated/imageMeta.ts');
const MAX_BYTES = 200 * 1024;
const FULL_EDGE = 1920;
const SMALL_EDGE = 800;
const FORCE = process.argv.includes('--force');
const IMAGE_RE = /\.(jpe?g|png|webp|tiff?|heic)$/i;

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const listImages = async (dir) =>
  (await readdir(dir)).filter((f) => IMAGE_RE.test(f) && !f.startsWith('.')).sort((a, b) => a.localeCompare(b));

const listDirs = async (dir) => {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name).sort();
};

const isFresh = async (src, out) => {
  if (FORCE || !existsSync(out)) return false;
  const [s, o] = await Promise.all([stat(src), stat(out)]);
  return o.mtimeMs >= s.mtimeMs && o.size > 0;
};

/** Encodes to webp under MAX_BYTES: steps quality down, then shrinks the long edge. Returns final metadata. */
const encodePhoto = async (src, out, edge) => {
  let currentEdge = edge;
  for (let attempt = 0; attempt < 6; attempt++) {
    const base = sharp(src)
      .rotate()
      .resize({ width: currentEdge, height: currentEdge, fit: 'inside', withoutEnlargement: true });
    for (let quality = 82; quality >= 34; quality -= 6) {
      const buf = await base.clone().webp({ quality, effort: 5 }).toBuffer();
      if (buf.length <= MAX_BYTES) {
        await writeFile(out, buf);
        const meta = await sharp(buf).metadata();
        return { width: meta.width, height: meta.height, bytes: buf.length, quality };
      }
    }
    currentEdge = Math.round(currentEdge * 0.85);
  }
  throw new Error(`could not fit ${src} under ${MAX_BYTES} bytes`);
};

const encodeBrand = async (src, out) => {
  const buf = await sharp(src).webp({ quality: 90, alphaQuality: 90, effort: 6 }).toBuffer();
  await writeFile(out, buf);
  const meta = await sharp(buf).metadata();
  return { width: meta.width, height: meta.height };
};

const dims = async (file) => {
  const meta = await sharp(file).metadata();
  return { width: meta.width, height: meta.height };
};

/** Processes one slot folder; returns ordered asset entries. */
const processSlot = async (slotRel, { brand = false } = {}) => {
  const srcDir = path.join(SRC_ROOT, slotRel);
  const outDir = path.join(OUT_ROOT, slotRel);
  await mkdir(outDir, { recursive: true });
  const files = await listImages(srcDir);
  const expected = new Set();
  const entries = [];
  let done = 0;
  for (const [i, file] of files.entries()) {
    const name = `${String(i + 1).padStart(2, '0')}-${slugify(file)}`;
    const src = path.join(srcDir, file);
    const full = path.join(outDir, `${name}.webp`);
    expected.add(path.basename(full));
    const publicFull = `/assets/${slotRel}/${name}.webp`;
    if (brand) {
      const m = (await isFresh(src, full)) ? await dims(full) : await encodeBrand(src, full);
      entries.push({ src: publicFull, srcSmall: publicFull, width: m.width, height: m.height });
      continue;
    }
    const small = path.join(outDir, `${name}-w800.webp`);
    expected.add(path.basename(small));
    let m;
    if ((await isFresh(src, full)) && (await isFresh(src, small))) m = await dims(full);
    else {
      m = await encodePhoto(src, full, FULL_EDGE);
      await encodePhoto(src, small, SMALL_EDGE);
      done++;
    }
    entries.push({ src: publicFull, srcSmall: `/assets/${slotRel}/${name}-w800.webp`, width: m.width, height: m.height });
  }
  // Remove orphans (source replaced/removed)
  for (const f of await readdir(outDir)) {
    if (f.endsWith('.webp') && !expected.has(f)) await unlink(path.join(outDir, f));
  }
  console.log(`✓ ${slotRel}: ${files.length} images (${done} re-encoded)`);
  return entries;
};

const main = async () => {
  if (!existsSync(SRC_ROOT)) throw new Error(`missing ${SRC_ROOT} — run: npm run archive:legacy -- --seed-assets`);
  const meta = { hero: [], about: [], brand: [], gallery: {}, rental: {} };
  meta.brand = await processSlot('brand', { brand: true });
  meta.hero = await processSlot('hero');
  meta.about = await processSlot('about');
  for (const album of await listDirs(path.join(SRC_ROOT, 'gallery'))) meta.gallery[album] = await processSlot(`gallery/${album}`);
  for (const item of await listDirs(path.join(SRC_ROOT, 'rental'))) meta.rental[item] = await processSlot(`rental/${item}`);

  await mkdir(path.dirname(META_FILE), { recursive: true });
  const header = `// GENERATED by scripts/optimize-images.js — do not edit. Re-run: npm run optimize:assets\n`;
  const body =
    `export interface ImageAsset {\n  src: string;\n  srcSmall: string;\n  width: number;\n  height: number;\n}\n\n` +
    `export interface ImageMeta {\n  hero: ImageAsset[];\n  about: ImageAsset[];\n  brand: ImageAsset[];\n  gallery: Record<string, ImageAsset[]>;\n  rental: Record<string, ImageAsset[]>;\n}\n\n` +
    `export const IMAGE_META: ImageMeta = ${JSON.stringify(meta, null, 2)};\n`;
  await writeFile(META_FILE, header + body);
  const total = Object.values(meta.gallery).flat().length + Object.values(meta.rental).flat().length + meta.hero.length + meta.about.length;
  console.log(`✓ wrote ${path.relative(process.cwd(), META_FILE)} (${total} photos)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
