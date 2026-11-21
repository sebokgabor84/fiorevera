/**
 * scripts/content/lib/photos.ts — photo intake for ONE slot (an album or a rental item).
 *
 * Takes original photos (a folder, or files), checks them, and writes the same three WebP tiers
 * the bulk pipeline writes (scripts/images/tiers.js: ≤ 1920 / 1280 / 800 px, each ≤ 200 KB) into
 * public/assets/<slot>/. It never reads or rewrites another slot and never calls
 * scripts/optimize-images.js — that script rebuilds the manifest from assets-src/, which is
 * complete on one machine only. The manifest entry for the slot is returned to the caller, who
 * puts it into the content state.
 *
 * Originals are copied to the git-ignored assets-src/<slot>/ as a local archive; the committed WebP
 * files are the source of truth. The encoder drops EXIF data, so no location leaves the phone.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {
  FULL_EDGE,
  MEDIUM_EDGE,
  SMALL_EDGE,
  TIER_QUALITY,
  encodePhoto,
  outputName,
  photoFiles,
  photoPaths,
  type ImageAsset,
} from '../../images/tiers.js';
import { ContentError } from './state';

/** What a phone or a camera hands over. HEIC/HEIF are converted first (the encoder cannot read them). */
export const SOURCE_RE = /\.(jpe?g|png|webp|tiff?|heic|heif)$/i;
const HEIC_RE = /\.(heic|heif)$/i;
/** Below this long edge a photo looks soft on a desktop screen: refused. */
export const MIN_EDGE = 1000;
/** Below this long edge it is accepted with a warning. */
export const GOOD_EDGE = 1600;
export const MAX_PHOTOS = 40;

/** The photos of a folder in name order ("IMG_2" before "IMG_10"); hidden files and other types ignored. */
export function listSourcePhotos(folder: string): string[] {
  if (!existsSync(folder) || !statSync(folder).isDirectory()) throw new ContentError('folder-missing', `the folder "${folder}" does not exist`);
  return readdirSync(folder)
    .filter((name) => SOURCE_RE.test(name) && !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((name) => path.join(folder, name));
}

/** Highest leading number among a slot's existing photos ("07-07-img-1234.webp" → 7); new photos count on from it. */
export const lastPhotoNumber = (existing: readonly ImageAsset[]): number =>
  existing.reduce((max, photo) => Math.max(max, Number(/^(\d+)-/.exec(path.basename(photo.src))?.[1] ?? 0)), 0);

/** Converts a HEIC/HEIF photo to a JPEG the encoder can read. macOS only (its built-in `sips`). */
function heicToJpeg(source: string, workDir: string): string {
  if (process.platform !== 'darwin') {
    throw new ContentError('heic-unsupported', `"${path.basename(source)}" is an iPhone HEIC photo; it can only be converted on a Mac — export it as JPEG first`);
  }
  const out = path.join(workDir, `${path.basename(source).replace(HEIC_RE, '')}.jpg`);
  try {
    execFileSync('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '95', source, '--out', out], { stdio: 'pipe' });
  } catch {
    throw new ContentError('photo-unreadable', `"${path.basename(source)}" could not be converted from HEIC`);
  }
  return out;
}

export interface IntakeResult {
  photos: ImageAsset[];
  /** Plain-English notes for the person: soft photos, duplicates that were skipped. */
  warnings: string[];
  /** Repo-relative files written, for the caller to undo if a later step refuses. */
  written: string[];
}

/**
 * Encodes `sources` into public/assets/<slotRel>/, numbering on from `existing`. All-or-nothing:
 * if any photo is refused, the files written so far are removed and a ContentError is thrown.
 */
export async function intakePhotos(root: string, slotRel: string, sources: readonly string[], existing: readonly ImageAsset[] = []): Promise<IntakeResult> {
  if (sources.length === 0) throw new ContentError('no-photos', 'no photos found — the folder holds no JPEG, PNG, WebP, TIFF or HEIC files');
  if (existing.length + sources.length > MAX_PHOTOS) {
    throw new ContentError('too-many-photos', `an album or item holds at most ${MAX_PHOTOS} photos (${existing.length} there, ${sources.length} new)`);
  }
  const outDir = path.join(root, 'public/assets', slotRel);
  const archiveDir = path.join(root, 'assets-src', slotRel);
  const workDir = mkdtempSync(path.join(os.tmpdir(), 'fv-intake-'));
  const written: string[] = [];
  const warnings: string[] = [];
  const photos: ImageAsset[] = [];
  const seen = new Map<string, string>();
  let number = lastPhotoNumber(existing);
  try {
    mkdirSync(outDir, { recursive: true });
    for (const source of sources) {
      const label = path.basename(source);
      if (!existsSync(source)) throw new ContentError('photo-missing', `"${label}" does not exist`);
      if (!SOURCE_RE.test(source)) throw new ContentError('photo-type', `"${label}" is not a photo type the site can use (JPEG, PNG, WebP, TIFF, HEIC)`);
      const hash = createHash('sha256').update(readFileSync(source)).digest('hex');
      const twin = seen.get(hash);
      if (twin) {
        warnings.push(`"${label}" is the same file as "${twin}" and was skipped`);
        continue;
      }
      seen.set(hash, label);
      const readable = HEIC_RE.test(source) ? heicToJpeg(source, workDir) : source;
      let meta: sharp.Metadata;
      try {
        meta = await sharp(readable).metadata();
      } catch {
        throw new ContentError('photo-unreadable', `"${label}" could not be read as a photo`);
      }
      const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
      if (longEdge < MIN_EDGE) throw new ContentError('photo-too-small', `"${label}" is ${meta.width}×${meta.height} px; a photo needs at least ${MIN_EDGE} px on its long side to look sharp`);
      if (longEdge < GOOD_EDGE) warnings.push(`"${label}" is ${meta.width}×${meta.height} px; it will look soft on large screens (${GOOD_EDGE} px or more is better)`);

      number += 1;
      const archiveName = `${String(number).padStart(2, '0')}-${label}`;
      const name = outputName(number, archiveName);
      const files = photoFiles(name);
      const full = await encodePhoto(readable, path.join(outDir, files.full), FULL_EDGE, TIER_QUALITY.full);
      written.push(path.join('public/assets', slotRel, files.full));
      await encodePhoto(readable, path.join(outDir, files.medium), MEDIUM_EDGE, TIER_QUALITY.medium);
      written.push(path.join('public/assets', slotRel, files.medium));
      await encodePhoto(readable, path.join(outDir, files.small), SMALL_EDGE, TIER_QUALITY.small);
      written.push(path.join('public/assets', slotRel, files.small));
      photos.push({ ...photoPaths(slotRel, name), width: full.width, height: full.height });

      mkdirSync(archiveDir, { recursive: true });
      copyFileSync(source, path.join(archiveDir, archiveName));
    }
    if (photos.length === 0) throw new ContentError('no-photos', 'every photo was a duplicate of another one');
    return { photos, warnings, written };
  } catch (error) {
    discardIntake(root, written);
    throw error;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

/** Removes files an intake wrote (used when a later step of the same operation refuses). */
export function discardIntake(root: string, written: readonly string[]): void {
  const dirs = new Set<string>();
  for (const rel of written) {
    const file = path.join(root, rel);
    if (existsSync(file)) rmSync(file);
    dirs.add(path.dirname(file));
  }
  for (const dir of dirs) if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}
