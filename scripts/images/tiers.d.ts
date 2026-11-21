/** Types for scripts/images/tiers.js (plain JavaScript so that `node scripts/optimize-images.js` can import it). */
export interface ImageAsset {
  src: string;
  srcMedium: string;
  srcSmall: string;
  width: number;
  height: number;
}
export interface ImageMeta {
  hero: ImageAsset[];
  about: ImageAsset[];
  brand: ImageAsset[];
  gallery: Record<string, ImageAsset[]>;
  rental: Record<string, ImageAsset[]>;
}

export const MAX_BYTES: number;
export const FULL_EDGE: number;
export const MEDIUM_EDGE: number;
export const SMALL_EDGE: number;
export const TIER_QUALITY: { full: number; medium: number; small: number };
export const BRAND_SMALL_EDGE: number;
export const IMAGE_RE: RegExp;

export function slugify(s: string): string;
export function outputName(position: number, sourceFile: string): string;
export function encodePhoto(
  src: string,
  out: string,
  edge: number,
  maxQuality: number
): Promise<{ width: number; height: number; bytes: number; quality: number }>;
export function photoPaths(slotRel: string, name: string): { src: string; srcMedium: string; srcSmall: string };
export function photoFiles(name: string): { full: string; medium: string; small: string };
export function renderImageMeta(meta: ImageMeta): string;
export function parseImageMeta(source: string): ImageMeta;
