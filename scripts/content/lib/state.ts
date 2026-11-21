/**
 * scripts/content/lib/state.ts — the site's content as one value: load it, check it, save it.
 *
 * Every content operation is a function from one ContentState to the next (scripts/content/ops.ts).
 * This module is the only place that touches the files: it reads the data modules without running
 * them (tsData.ts), checks a state against the same contracts the unit suite uses (Zod schemas,
 * locale parity, cross references between data, copy and photos) and writes back only the files
 * whose content changed, in their existing style.
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  AlbumSchema,
  ContactSchema,
  RentalItemSchema,
  ServiceAreasSchema,
  TestimonialSchema,
  type Album,
  type Contact,
  type RentalItem,
  type ServiceAreas,
  type Testimonial,
} from '../../../src/data/types';
import { LOCALES, type Locale } from '../../../src/data/routes';
import { flatten, validateLocales, type LocaleTree } from '../../validate-i18n';
import { parseImageMeta, photoFiles, renderImageMeta, type ImageAsset, type ImageMeta } from '../../images/tiers.js';
import { blockLiteral, inlineLiteral, readArray, readValue, replaceLiteral, writeArray } from './tsData';

/** A refusal the caller can explain: `code` is stable, `message` says what and why in plain English. */
export class ContentError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface ContentState {
  albums: Album[];
  featured: string[];
  rental: RentalItem[];
  testimonials: Testimonial[];
  contact: Contact;
  areas: ServiceAreas;
  locales: Record<Locale, LocaleTree>;
  images: ImageMeta;
}

export const FILES = {
  albums: 'src/data/albums.ts',
  rental: 'src/data/rentalItems.ts',
  testimonials: 'src/data/testimonials.ts',
  contact: 'src/data/contact.ts',
  areas: 'src/data/serviceAreas.ts',
  images: 'src/data/generated/imageMeta.ts',
  locale: (locale: Locale): string => `src/i18n/locales/${locale}.json`,
} as const;

const read = (root: string, rel: string): string => readFileSync(path.join(root, rel), 'utf8');

export function loadState(root: string): ContentState {
  const albumsSource = read(root, FILES.albums);
  return {
    albums: readArray(albumsSource, 'albums').map((e) => e.value) as Album[],
    featured: readValue(albumsSource, 'featuredAlbumIds') as string[],
    rental: readArray(read(root, FILES.rental), 'rentalItems').map((e) => e.value) as RentalItem[],
    testimonials: readArray(read(root, FILES.testimonials), 'testimonials').map((e) => e.value) as Testimonial[],
    contact: readValue(read(root, FILES.contact), 'contact') as Contact,
    areas: readValue(read(root, FILES.areas), 'serviceAreas') as ServiceAreas,
    locales: Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(root, FILES.locale(l))) as LocaleTree])) as Record<Locale, LocaleTree>,
    images: parseImageMeta(read(root, FILES.images)),
  };
}

// ── Locale tree helpers ───────────────────────────────────────────────────────────────────────

export const getText = (tree: LocaleTree, key: string): string | undefined => {
  let node: string | LocaleTree | undefined = tree;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
};

/** Sets a string; a new key is appended at the end of its namespace (key order is otherwise kept). */
export const setText = (tree: LocaleTree, key: string, value: string): void => {
  const parts = key.split('.');
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    if (typeof next === 'string') throw new ContentError('key-is-text', `"${key}": "${part}" is a text, not a group of texts`);
    if (next === undefined) node[part] = {};
    node = node[part] as LocaleTree;
  }
  const leaf = parts[parts.length - 1];
  if (typeof node[leaf] === 'object') throw new ContentError('key-is-group', `"${key}" is a group of texts, not one text`);
  node[leaf] = value;
};

/** Removes a string and any group it leaves empty. */
export const removeText = (tree: LocaleTree, key: string): void => {
  const parts = key.split('.');
  const trail: LocaleTree[] = [tree];
  for (const part of parts.slice(0, -1)) {
    const next = trail[trail.length - 1][part];
    if (next === undefined || typeof next === 'string') return;
    trail.push(next);
  }
  delete trail[trail.length - 1][parts[parts.length - 1]];
  for (let i = trail.length - 1; i > 0; i--) if (Object.keys(trail[i]).length === 0) delete trail[i - 1][parts[i - 1]];
};

/**
 * A locale file's text. Invisible characters (no-break spaces between a number and its unit, and
 * their relatives) are written as \\uXXXX escapes, as the files do today: a raw one is
 * indistinguishable from a space in an editor and in a diff.
 */
export const renderLocale = (tree: LocaleTree): string =>
  `${JSON.stringify(tree, null, 2).replace(/[\u00a0\u202f\u2009\u200b-\u200d\u2060\ufeff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)}\n`;

const placeholders = (value: string): string =>
  [...value.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}|<\/?(\d+)>/g)]
    .map((m) => m[0].replace(/\s+/g, ''))
    .sort()
    .join(' ');

// ── Validation ────────────────────────────────────────────────────────────────────────────────

const zodProblems = (label: string, result: { success: boolean; error?: z.ZodError }): string[] =>
  result.success || !result.error ? [] : result.error.issues.map((issue) => `${label}${issue.path.length ? ` [${issue.path.join('.')}]` : ''}: ${issue.message}`);

const duplicates = (ids: readonly string[]): string[] => [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

/** Every reason this state must not be written. Empty = valid. Mirrors tests/unit/{data,i18n}.test.ts. */
export function validateState(state: ContentState): string[] {
  const problems: string[] = [];
  problems.push(...zodProblems('albums', z.array(AlbumSchema).min(1).safeParse(state.albums)));
  problems.push(...zodProblems('rental items', z.array(RentalItemSchema).min(1).safeParse(state.rental)));
  problems.push(...zodProblems('testimonials', z.array(TestimonialSchema).min(1).safeParse(state.testimonials)));
  problems.push(...zodProblems('contact', ContactSchema.safeParse(state.contact)));
  problems.push(...zodProblems('service areas', ServiceAreasSchema.safeParse(state.areas)));
  if (problems.length) return problems; // the cross checks below assume well-formed data

  for (const id of duplicates(state.albums.map((a) => a.id))) problems.push(`album id "${id}" is used twice`);
  for (const id of duplicates(state.rental.map((r) => r.id))) problems.push(`rental item id "${id}" is used twice`);
  for (const id of duplicates(state.testimonials.map((t) => t.id))) problems.push(`testimonial id "${id}" is used twice`);

  const texts = Object.fromEntries(LOCALES.map((l) => [l, flatten(state.locales[l])])) as Record<Locale, Map<string, string>>;
  const needKey = (key: string, owner: string): void => {
    for (const l of LOCALES) if (!texts[l].has(key)) problems.push(`${owner}: text "${key}" is missing in ${l}`);
  };

  for (const album of state.albums) {
    const photos = state.images.gallery[album.id];
    if (!photos || photos.length === 0) problems.push(`album "${album.id}" has no photos`);
    else if (album.coverIndex >= photos.length) problems.push(`album "${album.id}": cover ${album.coverIndex + 1} does not exist (the album has ${photos.length} photos)`);
    if (album.titleKey) needKey(album.titleKey, `album "${album.id}"`);
  }
  for (const slot of Object.keys(state.images.gallery)) {
    if (!state.albums.some((a) => a.id === slot)) problems.push(`photos exist for "${slot}" but there is no such album`);
  }
  for (const id of duplicates(state.featured)) problems.push(`album "${id}" is featured twice`);
  for (const id of state.featured) if (!state.albums.some((a) => a.id === id)) problems.push(`featured album "${id}" does not exist`);

  for (const item of state.rental) {
    needKey(item.nameKey, `rental item "${item.id}"`);
    needKey(item.descriptionKey, `rental item "${item.id}"`);
    if (item.notesKey) needKey(item.notesKey, `rental item "${item.id}"`);
    if (!state.images.rental[item.id]?.length) problems.push(`rental item "${item.id}" has no photo`);
  }
  for (const testimonial of state.testimonials) needKey(testimonial.quoteKey, `testimonial "${testimonial.id}"`);

  if (state.contact.phoneHref.replace(/\D/g, '') !== state.contact.phoneDisplay.replace(/\D/g, '')) {
    problems.push('contact: the displayed phone number and the dial link are not the same number');
  }

  for (const issue of validateLocales(state.locales)) problems.push(`texts: ${issue.kind} "${issue.key}"${issue.locale ? ` in ${issue.locale}` : ''}`);
  for (const [key, hu] of texts.hu) {
    for (const l of LOCALES) {
      const value = texts[l].get(key);
      if (value === undefined) continue;
      if (placeholders(value) !== placeholders(hu)) problems.push(`texts: "${key}" in ${l} does not carry the same placeholders as the Hungarian text`);
      if (value.includes('—')) problems.push(`texts: "${key}" in ${l} contains an em dash; the site uses a spaced en dash ( – )`);
      if (/^meta\..*\.title$/.test(key) && value.length > 60) problems.push(`texts: "${key}" in ${l} is ${value.length} characters; a page title fits 60`);
      if (/^meta\..*\.description$/.test(key) && value.length > 160) problems.push(`texts: "${key}" in ${l} is ${value.length} characters; a page description fits 160`);
    }
  }
  return problems;
}

// ── Saving ────────────────────────────────────────────────────────────────────────────────────

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const allPhotos = (images: ImageMeta): ImageAsset[] => [...Object.values(images.gallery).flat(), ...Object.values(images.rental).flat()];

/**
 * Writes the difference between two states: only files whose content changed, and the WebP files of
 * gallery / rental photos that the new state no longer shows are deleted. Refuses an invalid state.
 * Returns the repo-relative paths that were written or deleted.
 */
export function saveState(root: string, before: ContentState, after: ContentState): string[] {
  const problems = validateState(after);
  if (problems.length) throw new ContentError('invalid-state', `the change would leave the site's content invalid:\n- ${problems.join('\n- ')}`);
  const touched: string[] = [];
  const write = (rel: string, content: string): void => {
    const file = path.join(root, rel);
    if (existsSync(file) && readFileSync(file, 'utf8') === content) return;
    writeFileSync(file, content);
    touched.push(rel);
  };

  if (!same(before.albums, after.albums) || !same(before.featured, after.featured)) {
    let source = read(root, FILES.albums);
    if (!same(before.albums, after.albums)) source = writeArray(source, 'albums', after.albums);
    if (!same(before.featured, after.featured)) source = replaceLiteral(source, 'featuredAlbumIds', inlineLiteral(after.featured));
    write(FILES.albums, source);
  }
  if (!same(before.rental, after.rental)) write(FILES.rental, writeArray(read(root, FILES.rental), 'rentalItems', after.rental));
  if (!same(before.testimonials, after.testimonials)) write(FILES.testimonials, writeArray(read(root, FILES.testimonials), 'testimonials', after.testimonials));
  if (!same(before.contact, after.contact)) write(FILES.contact, replaceLiteral(read(root, FILES.contact), 'contact', blockLiteral(after.contact, 0)));
  if (!same(before.areas, after.areas)) write(FILES.areas, replaceLiteral(read(root, FILES.areas), 'serviceAreas', blockLiteral(after.areas, 0)));
  for (const l of LOCALES) if (!same(before.locales[l], after.locales[l])) write(FILES.locale(l), renderLocale(after.locales[l]));

  if (!same(before.images, after.images)) {
    write(FILES.images, renderImageMeta(after.images));
    const kept = new Set(allPhotos(after.images).map((photo) => photo.src));
    for (const photo of allPhotos(before.images)) {
      if (kept.has(photo.src)) continue;
      const dir = path.join(root, 'public', path.dirname(photo.src));
      for (const name of Object.values(photoFiles(path.basename(photo.src, '.webp')))) {
        const file = path.join(dir, name);
        if (existsSync(file)) {
          rmSync(file);
          touched.push(path.relative(root, file));
        }
      }
      if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
    }
  }
  return touched;
}
