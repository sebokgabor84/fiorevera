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
 * Every photo gets a full variant (long edge ≤ 1920 px, ≤ 200 KB, quality ≤ 82), a medium
 * variant (≤ 1280 px, suffix -w1280, quality ≤ 76 — what phones at DPR 2–3 should pick, QA M13)
 * and a small variant (≤ 800 px, suffix -w800, quality ≤ 70 — PageSpeed 2026-11-16 flagged the
 * 800 w tier as under-compressed). Brand marks keep their alpha and additionally get a -w240
 * variant for the header (displayed at ≤ 80 px; the full 810 px mark cost 16 KB per page view). Outputs whose source is
 * gone are deleted, so re-running after swapping one album only changes that
 * album. The dimension manifest src/data/generated/imageMeta.ts is rewritten
 * on every run. Idempotent: unchanged sources are skipped (mtime check).
 *
 * The limits, the file naming, the encoder and the manifest format live in scripts/images/tiers.js,
 * shared with the single-slot operations in scripts/content/ (the CMS Coordinator). This script is
 * the BULK tool: it rebuilds every slot from assets-src/, which is complete on one machine only.
 * Before it writes anything it compares what it would produce with the committed manifest and
 * REFUSES when a rebuild would delete or reorder photos the manifest holds (a checkout without the
 * originals, or a slot changed by a content operation). Override, knowingly: --rebuild.
 *
 * Usage: node scripts/optimize-images.js [--force] [--tier=full|medium|small] [--rebuild]
 *   --force        re-encode every tier of every photo (ignores the mtime check)
 *   --rebuild      skip the refusal above: the manifest is rebuilt from assets-src/ as it is
 *   --tier=small   re-encode only that tier of every photo (e.g. after changing its quality
 *                  ceiling) and leave the other tiers' files byte-identical — keeps the git diff
 *                  to the files that actually changed (web-vitals 2026-11-16)
 */
import { readdir, readFile, stat, mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  BRAND_SMALL_EDGE,
  FULL_EDGE,
  IMAGE_RE,
  MEDIUM_EDGE,
  SMALL_EDGE,
  TIER_QUALITY,
  encodePhoto,
  outputName,
  parseImageMeta,
  renderImageMeta,
} from './images/tiers.js';

const SRC_ROOT = path.resolve('assets-src');
const OUT_ROOT = path.resolve('public/assets');
const META_FILE = path.resolve('src/data/generated/imageMeta.ts');
const FORCE = process.argv.includes('--force');
const REBUILD = process.argv.includes('--rebuild');
const TIER = (process.argv.find((a) => a.startsWith('--tier=')) ?? '').slice('--tier='.length) || null;
if (TIER && !['full', 'medium', 'small'].includes(TIER)) throw new Error(`--tier must be full, medium or small (got "${TIER}")`);

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

const encodeBrand = async (src, out) => {
  const buf = await sharp(src).webp({ quality: 90, alphaQuality: 90, effort: 6 }).toBuffer();
  await writeFile(out, buf);
  const meta = await sharp(buf).metadata();
  return { width: meta.width, height: meta.height };
};

/** Header-sized brand mark: alpha kept, long edge 240 px (3× the 80 px display size). */
const encodeBrandSmall = async (src, out) => {
  const buf = await sharp(src)
    .resize({ width: BRAND_SMALL_EDGE, height: BRAND_SMALL_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 70, effort: 6 })
    .toBuffer();
  await writeFile(out, buf);
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
    const name = outputName(i + 1, file);
    const src = path.join(srcDir, file);
    const full = path.join(outDir, `${name}.webp`);
    expected.add(path.basename(full));
    const publicFull = `/assets/${slotRel}/${name}.webp`;
    if (brand) {
      const small = path.join(outDir, `${name}-w${BRAND_SMALL_EDGE}.webp`);
      expected.add(path.basename(small));
      let m;
      if ((await isFresh(src, full)) && (await isFresh(src, small))) m = await dims(full);
      else {
        m = await encodeBrand(src, full);
        await encodeBrandSmall(src, small);
        done++;
      }
      entries.push({
        src: publicFull,
        srcMedium: publicFull,
        srcSmall: `/assets/${slotRel}/${name}-w${BRAND_SMALL_EDGE}.webp`,
        width: m.width,
        height: m.height,
      });
      continue;
    }
    const medium = path.join(outDir, `${name}-w${MEDIUM_EDGE}.webp`);
    const small = path.join(outDir, `${name}-w${SMALL_EDGE}.webp`);
    expected.add(path.basename(medium));
    expected.add(path.basename(small));
    // --tier=X re-encodes exactly that tier; otherwise a stale (or missing) output re-encodes all three.
    let todo;
    if (TIER) todo = { full: TIER === 'full', medium: TIER === 'medium', small: TIER === 'small' };
    else {
      const stale = !((await isFresh(src, full)) && (await isFresh(src, medium)) && (await isFresh(src, small)));
      todo = { full: stale, medium: stale, small: stale };
    }
    const m = todo.full ? await encodePhoto(src, full, FULL_EDGE, TIER_QUALITY.full) : await dims(full);
    if (todo.medium) await encodePhoto(src, medium, MEDIUM_EDGE, TIER_QUALITY.medium);
    if (todo.small) await encodePhoto(src, small, SMALL_EDGE, TIER_QUALITY.small);
    if (todo.full || todo.medium || todo.small) done++;
    entries.push({
      src: publicFull,
      srcMedium: `/assets/${slotRel}/${name}-w${MEDIUM_EDGE}.webp`,
      srcSmall: `/assets/${slotRel}/${name}-w${SMALL_EDGE}.webp`,
      width: m.width,
      height: m.height,
    });
  }
  // Remove orphans (source replaced/removed)
  for (const f of await readdir(outDir)) {
    if (f.endsWith('.webp') && !expected.has(f)) await unlink(path.join(outDir, f));
  }
  console.log(`✓ ${slotRel}: ${files.length} images (${done} re-encoded)`);
  return entries;
};

/**
 * What a rebuild would lose: for every slot of the committed manifest, the photos that assets-src/
 * would not reproduce under the same name and in the same order. Empty = safe to run.
 */
const rebuildLosses = async () => {
  if (!existsSync(META_FILE)) return [];
  const meta = parseImageMeta(await readFile(META_FILE, 'utf8'));
  const slots = [
    ['brand', meta.brand],
    ['hero', meta.hero],
    ['about', meta.about],
    ...Object.entries(meta.gallery).map(([id, list]) => [`gallery/${id}`, list]),
    ...Object.entries(meta.rental).map(([id, list]) => [`rental/${id}`, list]),
  ];
  const losses = [];
  for (const [slotRel, entries] of slots) {
    if (entries.length === 0) continue;
    const have = entries.map((e) => path.basename(e.src, '.webp'));
    const srcDir = path.join(SRC_ROOT, slotRel);
    if (!existsSync(srcDir)) {
      losses.push(`${slotRel}: ${have.length} photo(s) in the manifest, no originals folder assets-src/${slotRel}/`);
      continue;
    }
    const plan = (await listImages(srcDir)).map((file, i) => outputName(i + 1, file));
    const kept = plan.filter((name) => have.includes(name));
    const missing = have.filter((name) => !plan.includes(name));
    if (missing.length) losses.push(`${slotRel}: ${missing.length} of ${have.length} photo(s) would be deleted or renamed (first: ${missing[0]})`);
    else if (kept.join('|') !== have.join('|')) losses.push(`${slotRel}: the photo order chosen by a content operation would be reset to file-name order`);
  }
  return losses;
};

const main = async () => {
  if (!existsSync(SRC_ROOT)) throw new Error(`missing ${SRC_ROOT} — run: npm run archive:legacy -- --seed-assets`);
  const losses = REBUILD ? [] : await rebuildLosses();
  if (losses.length) {
    console.error('optimize-images: REFUSED — nothing was written. A rebuild from assets-src/ would change photos the site shows today:');
    for (const line of losses) console.error(`  - ${line}`);
    console.error(
      'The originals are complete on one machine only, and slots changed through `npm run content` keep their own order.\n' +
        'To add or change photos of one album or item use `npm run content -- <operation>` (.agent/skills/cms-coordinator).\n' +
        'To rebuild everything from assets-src/ anyway: npm run optimize:assets -- --rebuild'
    );
    process.exit(2);
  }
  const meta = { hero: [], about: [], brand: [], gallery: {}, rental: {} };
  meta.brand = await processSlot('brand', { brand: true });
  meta.hero = await processSlot('hero');
  meta.about = await processSlot('about');
  for (const album of await listDirs(path.join(SRC_ROOT, 'gallery'))) meta.gallery[album] = await processSlot(`gallery/${album}`);
  for (const item of await listDirs(path.join(SRC_ROOT, 'rental'))) meta.rental[item] = await processSlot(`rental/${item}`);

  await mkdir(path.dirname(META_FILE), { recursive: true });
  await writeFile(META_FILE, renderImageMeta(meta));
  const total = Object.values(meta.gallery).flat().length + Object.values(meta.rental).flat().length + meta.hero.length + meta.about.length;
  console.log(`✓ wrote ${path.relative(process.cwd(), META_FILE)} (${total} photos)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
