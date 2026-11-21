/**
 * scripts/content/ops.ts — the content operations of the CMS Coordinator as pure functions.
 *
 * Each operation takes the current ContentState and its arguments and returns the next state; it
 * never touches a file. Invalid input is refused with a ContentError (stable `code`, plain-English
 * message) before anything changes. Loading, validation of the whole state and saving live in
 * lib/state.ts; encoding photos in lib/photos.ts; the command line in cli.ts.
 *
 * Numbers a person gives are 1-based everywhere (photo 1 is the first photo); `coverIndex` in the
 * data stays 0-based.
 */
import { LOCALES, type Locale } from '../../src/data/routes';
import type { Album, Contact, RentalItem } from '../../src/data/types';
import { flatten } from '../validate-i18n';
import { slugify, type ImageAsset } from '../images/tiers.js';
import { ContentError, getText, removeText, setText, type ContentState } from './lib/state';

export type Texts = Record<Locale, string>;
/** Where an entry goes in its list: 'first', 'last' or a 1-based position. */
export type Position = 'first' | 'last' | number;

const clone = (state: ContentState): ContentState => structuredClone(state);

const requireTexts = (texts: Partial<Texts> | undefined, what: string): Texts => {
  for (const l of LOCALES) {
    if (!texts?.[l]?.trim()) throw new ContentError('text-missing', `${what}: the ${l.toUpperCase()} text is missing — every text exists in Hungarian, German and English`);
  }
  return { hu: texts!.hu!.trim(), de: texts!.de!.trim(), en: texts!.en!.trim() };
};

const insertAt = <T>(list: T[], item: T, position: Position): T[] => {
  const index = position === 'first' ? 0 : position === 'last' ? list.length : position - 1;
  if (!Number.isInteger(index) || index < 0 || index > list.length) {
    throw new ContentError('position-out-of-range', `position ${String(position)} does not exist; the list has ${list.length} entries`);
  }
  return [...list.slice(0, index), item, ...list.slice(index)];
};

const moveTo = <T extends { id: string }>(list: T[], id: string, position: Position, what: string): T[] => {
  const item = list.find((entry) => entry.id === id);
  if (!item) throw new ContentError('not-found', `${what} "${id}" does not exist`);
  const rest = list.filter((entry) => entry.id !== id);
  const target = position === 'last' ? 'last' : position === 'first' ? 'first' : position;
  if (typeof target === 'number' && (target < 1 || target > list.length)) {
    throw new ContentError('position-out-of-range', `position ${target} does not exist; the list has ${list.length} entries`);
  }
  return insertAt(rest, item, target);
};

/** A URL-safe id from names ("Zsófi", "Bence" → "zsofi-bence"); "-2", "-3" … when taken. */
export const freeId = (base: string, taken: readonly string[]): string => {
  const slug = slugify(base);
  if (!slug) throw new ContentError('id-empty', `cannot derive an id from "${base}"`);
  if (!taken.includes(slug)) return slug;
  for (let n = 2; ; n++) if (!taken.includes(`${slug}-${n}`)) return `${slug}-${n}`;
};

const album = (state: ContentState, id: string): Album => {
  const found = state.albums.find((a) => a.id === id);
  if (!found) throw new ContentError('not-found', `album "${id}" does not exist`);
  return found;
};

// ── Albums ────────────────────────────────────────────────────────────────────────────────────

export interface AlbumAddInput {
  /** Two first names for a wedding … */
  partners?: [string, string];
  /** … or a title in three languages for an album that is not a couple (photo shoot, magazine). */
  title?: Partial<Texts>;
  venue: { name: string | null; town: string | null; country: 'HU' | 'AT' };
  photos: ImageAsset[];
  /** 1-based number of the cover photo. */
  cover?: number;
  position?: Position;
  /** Only to force a specific id; normally derived from the names or the Hungarian title. */
  id?: string;
}

export function albumAdd(state: ContentState, input: AlbumAddInput): { state: ContentState; id: string } {
  if (Boolean(input.partners) === Boolean(input.title)) {
    throw new ContentError('album-names', 'an album has either the two first names of a couple or a title, not both and not neither');
  }
  const partners = input.partners?.map((name) => name.trim()) as [string, string] | undefined;
  if (partners && partners.some((name) => !name)) throw new ContentError('album-names', 'both first names are needed');
  const title = input.title ? requireTexts(input.title, 'album title') : undefined;
  if (input.photos.length === 0) throw new ContentError('no-photos', 'an album needs at least one photo');
  const cover = input.cover ?? 1;
  if (!Number.isInteger(cover) || cover < 1 || cover > input.photos.length) {
    throw new ContentError('cover-out-of-range', `cover photo ${cover} does not exist; the album has ${input.photos.length} photos`);
  }
  const next = clone(state);
  const taken = [...next.albums.map((a) => a.id), ...Object.keys(next.images.gallery)];
  const id = input.id ?? freeId(partners ? partners.join(' ') : title!.hu, taken);
  if (taken.includes(id)) throw new ContentError('id-taken', `an album with the id "${id}" already exists`);
  const venue = { name: input.venue.name?.trim() || null, town: input.venue.town?.trim() || null, country: input.venue.country };
  const entry: Album = partners
    ? { id, partners, venue, coverIndex: cover - 1 }
    : { id, titleKey: `gallery.albumTitles.${id}`, venue, coverIndex: cover - 1 };
  if (title) for (const l of LOCALES) setText(next.locales[l], `gallery.albumTitles.${id}`, title[l]);
  next.albums = insertAt(next.albums, entry, input.position ?? 'first');
  next.images.gallery[id] = input.photos;
  return { state: next, id };
}

export function albumRemove(state: ContentState, id: string, replaceFeaturedWith?: string): ContentState {
  const target = album(state, id);
  if (state.albums.length === 1) throw new ContentError('last-album', 'the gallery needs at least one album');
  const next = clone(state);
  if (next.featured.includes(id)) {
    if (!replaceFeaturedWith) {
      throw new ContentError('album-featured', `"${id}" is one of the albums shown on the home page — name the album that takes its place there`);
    }
    if (replaceFeaturedWith === id || !next.albums.some((a) => a.id === replaceFeaturedWith)) {
      throw new ContentError('not-found', `album "${replaceFeaturedWith}" does not exist`);
    }
    if (next.featured.includes(replaceFeaturedWith)) throw new ContentError('already-featured', `"${replaceFeaturedWith}" is already on the home page`);
    next.featured = next.featured.map((f) => (f === id ? replaceFeaturedWith : f));
  }
  next.albums = next.albums.filter((a) => a.id !== id);
  delete next.images.gallery[id];
  if (target.titleKey) for (const l of LOCALES) removeText(next.locales[l], target.titleKey);
  return next;
}

export function albumMove(state: ContentState, id: string, position: Position): ContentState {
  const next = clone(state);
  next.albums = moveTo(next.albums, id, position, 'album');
  return next;
}

export function albumCover(state: ContentState, id: string, photo: number): ContentState {
  album(state, id);
  const count = state.images.gallery[id]?.length ?? 0;
  if (!Number.isInteger(photo) || photo < 1 || photo > count) {
    throw new ContentError('cover-out-of-range', `photo ${photo} does not exist; album "${id}" has ${count} photos`);
  }
  const next = clone(state);
  next.albums = next.albums.map((a) => (a.id === id ? { ...a, coverIndex: photo - 1 } : a));
  return next;
}

export interface AlbumEditInput {
  partners?: [string, string];
  title?: Partial<Texts>;
  venue?: { name?: string | null; town?: string | null; country?: 'HU' | 'AT' };
}

/** Changes names, title or venue. The id — the page anchor and the photo folder — never changes. */
export function albumEdit(state: ContentState, id: string, input: AlbumEditInput): ContentState {
  const current = album(state, id);
  const next = clone(state);
  let updated: Album = { ...current, venue: { ...current.venue } };
  if (input.partners) {
    if (!current.partners) throw new ContentError('album-names', `"${id}" has a title, not a couple — change its title instead`);
    const partners = input.partners.map((name) => name.trim()) as [string, string];
    if (partners.some((name) => !name)) throw new ContentError('album-names', 'both first names are needed');
    updated = { ...updated, partners };
  }
  if (input.title) {
    if (!current.titleKey) throw new ContentError('album-names', `"${id}" is a couple's album — change the first names instead`);
    const title = requireTexts(input.title, 'album title');
    for (const l of LOCALES) setText(next.locales[l], current.titleKey, title[l]);
  }
  if (input.venue) {
    if (input.venue.name !== undefined) updated.venue.name = input.venue.name?.trim() || null;
    if (input.venue.town !== undefined) updated.venue.town = input.venue.town?.trim() || null;
    if (input.venue.country !== undefined) updated.venue.country = input.venue.country;
  }
  next.albums = next.albums.map((a) => (a.id === id ? updated : a));
  return next;
}

/** The albums of the home-page teaser, in order. The page is designed for exactly four. */
export function albumFeature(state: ContentState, ids: string[]): ContentState {
  if (ids.length !== 4) throw new ContentError('featured-count', `the home page shows exactly four albums (got ${ids.length})`);
  for (const id of ids) album(state, id);
  if (new Set(ids).size !== ids.length) throw new ContentError('featured-duplicate', 'an album can appear on the home page only once');
  const next = clone(state);
  next.featured = [...ids];
  return next;
}

// ── Photos inside a slot ("gallery/<album id>" or "rental/<item id>") ─────────────────────────

const slotOf = (state: ContentState, slot: string): { kind: 'gallery' | 'rental'; id: string; photos: ImageAsset[] } => {
  const [kind, id, ...rest] = slot.split('/');
  if ((kind !== 'gallery' && kind !== 'rental') || !id || rest.length) throw new ContentError('slot-unknown', `"${slot}" is not an album or a rental item`);
  const photos = state.images[kind][id];
  if (!photos) throw new ContentError('not-found', `${kind === 'gallery' ? 'album' : 'rental item'} "${id}" does not exist`);
  return { kind, id, photos };
};

/** Re-points an album's cover so that the same photo stays the cover after its photos changed. */
const keepCover = (state: ContentState, id: string, coverSrc: string | undefined, photos: ImageAsset[]): void => {
  const index = photos.findIndex((photo) => photo.src === coverSrc);
  state.albums = state.albums.map((a) => (a.id === id ? { ...a, coverIndex: Math.max(index, 0) } : a));
};

export function photosAdd(state: ContentState, slot: string, photos: ImageAsset[], position: Position = 'last'): ContentState {
  const target = slotOf(state, slot);
  if (photos.length === 0) throw new ContentError('no-photos', 'no photos to add');
  const next = clone(state);
  const coverSrc = target.kind === 'gallery' ? target.photos[album(state, target.id).coverIndex]?.src : undefined;
  const index = position === 'first' ? 0 : position === 'last' ? target.photos.length : position - 1;
  if (!Number.isInteger(index) || index < 0 || index > target.photos.length) {
    throw new ContentError('position-out-of-range', `position ${String(position)} does not exist; there are ${target.photos.length} photos`);
  }
  const list = [...target.photos.slice(0, index), ...photos, ...target.photos.slice(index)];
  next.images[target.kind][target.id] = list;
  if (target.kind === 'gallery') keepCover(next, target.id, coverSrc, list);
  return next;
}

export function photosRemove(state: ContentState, slot: string, numbers: number[], newCover?: number): ContentState {
  const target = slotOf(state, slot);
  const unique = [...new Set(numbers)];
  for (const n of unique) {
    if (!Number.isInteger(n) || n < 1 || n > target.photos.length) throw new ContentError('photo-out-of-range', `photo ${n} does not exist; there are ${target.photos.length} photos`);
  }
  if (unique.length === 0) throw new ContentError('no-photos', 'no photo numbers given');
  if (unique.length >= target.photos.length) throw new ContentError('last-photo', 'at least one photo must remain — remove the whole album or item instead');
  const next = clone(state);
  const list = target.photos.filter((_, i) => !unique.includes(i + 1));
  next.images[target.kind][target.id] = list;
  if (target.kind === 'gallery') {
    const cover = album(state, target.id).coverIndex + 1;
    if (unique.includes(cover)) {
      if (newCover === undefined) throw new ContentError('cover-removed', `photo ${cover} is the cover of "${target.id}" — name the photo that becomes the new cover`);
      if (!Number.isInteger(newCover) || newCover < 1 || newCover > target.photos.length || unique.includes(newCover)) {
        throw new ContentError('cover-out-of-range', `photo ${newCover} cannot be the new cover`);
      }
      keepCover(next, target.id, target.photos[newCover - 1].src, list);
    } else keepCover(next, target.id, target.photos[cover - 1].src, list);
  }
  return next;
}

export function photosMove(state: ContentState, slot: string, from: number, to: number): ContentState {
  const target = slotOf(state, slot);
  for (const n of [from, to]) {
    if (!Number.isInteger(n) || n < 1 || n > target.photos.length) throw new ContentError('photo-out-of-range', `photo ${n} does not exist; there are ${target.photos.length} photos`);
  }
  const next = clone(state);
  const list = [...target.photos];
  const [moved] = list.splice(from - 1, 1);
  list.splice(to - 1, 0, moved);
  next.images[target.kind][target.id] = list;
  if (target.kind === 'gallery') keepCover(next, target.id, target.photos[album(state, target.id).coverIndex]?.src, list);
  return next;
}

// ── Texts ─────────────────────────────────────────────────────────────────────────────────────

/** Changes an EXISTING text in all three languages at once. New keys only come with new entries. */
export function textSet(state: ContentState, key: string, texts: Partial<Texts>): ContentState {
  const values = requireTexts(texts, `text "${key}"`);
  for (const l of LOCALES) {
    if (getText(state.locales[l], key) === undefined) throw new ContentError('key-unknown', `there is no text "${key}" on the site — find the right one with: npm run content -- text-find "<a few words of it>"`);
  }
  const next = clone(state);
  for (const l of LOCALES) setText(next.locales[l], key, values[l]);
  return next;
}

export interface TextMatch {
  key: string;
  texts: Texts;
}

/** Every text that contains the phrase in any language (case and accents as written; spaces normalised). */
export function textFind(state: ContentState, phrase: string): TextMatch[] {
  const needle = phrase.replace(/\s+/g, ' ').trim().toLowerCase();
  if (needle.length < 3) throw new ContentError('phrase-too-short', 'give at least three characters of the text you are looking for');
  const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(state.locales[l])])) as Record<Locale, Map<string, string>>;
  const matches: TextMatch[] = [];
  for (const key of flat.hu.keys()) {
    const texts = { hu: flat.hu.get(key) ?? '', de: flat.de.get(key) ?? '', en: flat.en.get(key) ?? '' };
    if (key.toLowerCase().includes(needle) || LOCALES.some((l) => texts[l].replace(/\s+/g, ' ').toLowerCase().includes(needle))) matches.push({ key, texts });
  }
  return matches;
}

// ── Rental items ──────────────────────────────────────────────────────────────────────────────

const rentalItem = (state: ContentState, id: string): RentalItem => {
  const found = state.rental.find((r) => r.id === id);
  if (!found) throw new ContentError('not-found', `rental item "${id}" does not exist`);
  return found;
};

const wholeForints = (value: number, what: string): number => {
  if (!Number.isInteger(value) || value <= 0) throw new ContentError('amount-invalid', `${what} must be a whole number of forints above zero (got ${value})`);
  return value;
};

export interface RentalSetInput {
  priceHuf?: number;
  /** null removes the deposit. */
  depositHuf?: number | null;
  quantity?: number;
  /** null removes the size line. */
  size?: string | null;
}

export function rentalSet(state: ContentState, id: string, input: RentalSetInput): ContentState {
  const current = rentalItem(state, id);
  if (Object.values(input).every((value) => value === undefined)) throw new ContentError('nothing-to-change', 'no new value given');
  const next = clone(state);
  const updated: RentalItem = { ...current };
  if (input.priceHuf !== undefined) updated.priceHuf = wholeForints(input.priceHuf, 'the price');
  if (input.quantity !== undefined) {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new ContentError('amount-invalid', `the quantity must be a whole number above zero (got ${input.quantity})`);
    updated.quantity = input.quantity;
  }
  if (input.depositHuf === null) delete updated.depositHuf;
  else if (input.depositHuf !== undefined) updated.depositHuf = wholeForints(input.depositHuf, 'the deposit');
  if (input.size === null) delete updated.size;
  else if (input.size !== undefined) {
    if (!input.size.trim()) throw new ContentError('size-empty', 'the size is empty — say "no size" to remove the line');
    updated.size = input.size.trim();
  }
  // Keep the property order of the data file (id, keys, size, quantity, price, unit, deposit, pickup).
  const ordered: RentalItem = {
    id: updated.id,
    nameKey: updated.nameKey,
    descriptionKey: updated.descriptionKey,
    ...(updated.notesKey ? { notesKey: updated.notesKey } : {}),
    ...(updated.size ? { size: updated.size } : {}),
    quantity: updated.quantity,
    priceHuf: updated.priceHuf,
    unit: updated.unit,
    ...(updated.depositHuf ? { depositHuf: updated.depositHuf } : {}),
    pickupOnly: true,
    ...(updated.pickupTown ? { pickupTown: updated.pickupTown } : {}),
  };
  next.rental = next.rental.map((r) => (r.id === id ? ordered : r));
  return next;
}

export interface RentalAddInput {
  name: Partial<Texts>;
  description: Partial<Texts>;
  notes?: Partial<Texts>;
  unit: RentalItem['unit'];
  quantity: number;
  priceHuf: number;
  depositHuf?: number;
  size?: string;
  pickupTown?: string;
  photos: ImageAsset[];
  position?: Position;
  id?: string;
}

export function rentalAdd(state: ContentState, input: RentalAddInput): { state: ContentState; id: string } {
  const name = requireTexts(input.name, 'item name');
  const description = requireTexts(input.description, 'item description');
  const notes = input.notes ? requireTexts(input.notes, 'item notes') : undefined;
  if (!['occasion', 'piece', 'set', 'wall'].includes(input.unit)) throw new ContentError('unit-unknown', `the price unit must be occasion, piece, set or wall (got "${input.unit}")`);
  if (input.photos.length === 0) throw new ContentError('no-photos', 'a rental item needs at least one photo');
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new ContentError('amount-invalid', 'the quantity must be a whole number above zero');
  const next = clone(state);
  const taken = [...next.rental.map((r) => r.id), ...Object.keys(next.images.rental)];
  const id = input.id ?? freeId(name.en, taken);
  if (taken.includes(id)) throw new ContentError('id-taken', `a rental item with the id "${id}" already exists`);
  const base = `rental.items.${id}`;
  for (const l of LOCALES) {
    setText(next.locales[l], `${base}.name`, name[l]);
    setText(next.locales[l], `${base}.description`, description[l]);
    if (notes) setText(next.locales[l], `${base}.notes`, notes[l]);
  }
  const item: RentalItem = {
    id,
    nameKey: `${base}.name`,
    descriptionKey: `${base}.description`,
    ...(notes ? { notesKey: `${base}.notes` } : {}),
    ...(input.size?.trim() ? { size: input.size.trim() } : {}),
    quantity: input.quantity,
    priceHuf: wholeForints(input.priceHuf, 'the price'),
    unit: input.unit,
    ...(input.depositHuf !== undefined ? { depositHuf: wholeForints(input.depositHuf, 'the deposit') } : {}),
    pickupOnly: true,
    ...(input.pickupTown?.trim() ? { pickupTown: input.pickupTown.trim() } : {}),
  };
  next.rental = insertAt(next.rental, item, input.position ?? 'last');
  next.images.rental[id] = input.photos;
  return { state: next, id };
}

export function rentalRemove(state: ContentState, id: string): ContentState {
  rentalItem(state, id);
  if (state.rental.length === 1) throw new ContentError('last-item', 'the rental page needs at least one item');
  const next = clone(state);
  next.rental = next.rental.filter((r) => r.id !== id);
  delete next.images.rental[id];
  for (const l of LOCALES) for (const part of ['name', 'description', 'notes']) removeText(next.locales[l], `rental.items.${id}.${part}`);
  return next;
}

export function rentalMove(state: ContentState, id: string, position: Position): ContentState {
  const next = clone(state);
  next.rental = moveTo(next.rental, id, position, 'rental item');
  return next;
}

// ── Testimonials ──────────────────────────────────────────────────────────────────────────────

export function testimonialAdd(state: ContentState, input: { author: string; quote: Partial<Texts>; position?: Position; id?: string }): { state: ContentState; id: string } {
  const author = input.author.trim();
  if (!author) throw new ContentError('author-missing', "the customer's name is needed");
  const quote = requireTexts(input.quote, 'testimonial');
  const next = clone(state);
  const taken = next.testimonials.map((t) => t.id);
  const id = input.id ?? freeId(author, taken);
  if (taken.includes(id)) throw new ContentError('id-taken', `a testimonial with the id "${id}" already exists`);
  for (const l of LOCALES) setText(next.locales[l], `testimonials.${id}`, quote[l]);
  next.testimonials = insertAt(next.testimonials, { id, author, quoteKey: `testimonials.${id}` }, input.position ?? 'first');
  return { state: next, id };
}

export function testimonialRemove(state: ContentState, id: string): ContentState {
  const target = state.testimonials.find((t) => t.id === id);
  if (!target) throw new ContentError('not-found', `testimonial "${id}" does not exist`);
  if (state.testimonials.length === 1) throw new ContentError('last-testimonial', 'the home page needs at least one testimonial');
  const next = clone(state);
  next.testimonials = next.testimonials.filter((t) => t.id !== id);
  for (const l of LOCALES) removeText(next.locales[l], target.quoteKey);
  return next;
}

export function testimonialMove(state: ContentState, id: string, position: Position): ContentState {
  const next = clone(state);
  next.testimonials = moveTo(next.testimonials, id, position, 'testimonial');
  return next;
}

// ── Contact data and service areas ────────────────────────────────────────────────────────────

export interface ContactSetInput {
  /** As it should be shown, international format: "+36 30 865 9108". The dial link is derived. */
  phone?: string;
  instagram?: string;
  facebook?: string;
}

/** Phone and social links only. E-mail, postal address and owner name also live in legal texts → not content. */
export function contactSet(state: ContentState, input: ContactSetInput): ContentState {
  if (Object.values(input).every((value) => value === undefined)) throw new ContentError('nothing-to-change', 'no new value given');
  const next = clone(state);
  const contact: Contact = { ...next.contact };
  if (input.phone !== undefined) {
    const display = input.phone.replace(/\s+/g, ' ').trim();
    const digits = display.replace(/\D/g, '');
    if (!display.startsWith('+') || digits.length < 8 || digits.length > 15 || /[^+\d ]/.test(display)) {
      throw new ContentError('phone-invalid', `"${input.phone}" is not a phone number in international format (for example +36 30 865 9108)`);
    }
    contact.phoneDisplay = display;
    contact.phoneHref = `tel:+${digits}`;
  }
  const profile = (value: string, host: string, what: string): string => {
    let url: URL;
    try {
      url = new URL(value.trim());
    } catch {
      throw new ContentError('link-invalid', `the ${what} link must be a full address starting with https://`);
    }
    const handle = url.pathname.replace(/^\/+|\/+$/g, '');
    if (url.protocol !== 'https:' || url.hostname.replace(/^www\./, '') !== host || !handle || handle.includes('/')) {
      throw new ContentError('link-invalid', `the ${what} link must look like https://www.${host}/<your page name>`);
    }
    return `https://www.${host}/${handle}`;
  };
  if (input.instagram !== undefined) {
    contact.instagram = profile(input.instagram, 'instagram.com', 'Instagram');
    contact.instagramHandle = `@${contact.instagram.split('/').pop()}`;
  }
  if (input.facebook !== undefined) contact.facebook = profile(input.facebook, 'facebook.com', 'Facebook');
  next.contact = contact;
  return next;
}

export function areasSet(state: ContentState, locale: Locale, areas: string[]): ContentState {
  if (!LOCALES.includes(locale)) throw new ContentError('locale-unknown', `"${String(locale)}" is not one of ${LOCALES.join(', ')}`);
  const list = areas.map((area) => area.trim()).filter(Boolean);
  if (list.length === 0) throw new ContentError('areas-empty', 'at least one service area is needed per language');
  if (new Set(list).size !== list.length) throw new ContentError('areas-duplicate', 'a service area is listed twice');
  const next = clone(state);
  next.areas = { ...next.areas, [locale]: list };
  return next;
}
