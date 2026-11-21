/**
 * scripts/content/cli.ts — `npm run content -- <operation> [arguments]`
 *
 * The one door for content changes (CMS Coordinator, .agent/skills/cms-coordinator). Every
 * operation: load the content, apply one pure function (ops.ts), check the whole result against the
 * site's contracts, write only what changed. Nothing is written when anything is refused.
 * The answer is always ONE JSON object on stdout: { ok: true, … } or { ok: false, code, message }
 * (exit 1), so the agent reads facts, not prose.
 *
 *   npm run content -- help                     every operation with its arguments
 *   npm run content -- <operation> … --dry-run  check and report, write nothing
 *
 * Names and texts with spaces go in quotes. Numbers a person gives are 1-based.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { LOCALES, allRoutes, type Locale } from '../../src/data/routes';
import { formatHuf } from '../../src/data/contact';
import type { ImageAsset } from '../images/tiers.js';
import { ContentError, getText, loadState, saveState, validateState, type ContentState } from './lib/state';
import { discardIntake, intakePhotos, listSourcePhotos, type IntakeResult } from './lib/photos';
import * as ops from './ops';

type Flags = Record<string, string>;
interface Parsed {
  operation: string;
  args: string[];
  flags: Flags;
}

/** `--name value` pairs and bare `--switch`es; everything else is a positional argument. */
export function parseArgs(argv: readonly string[]): Parsed {
  const args: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      if (eq > 0) flags[token.slice(2, eq)] = token.slice(eq + 1);
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) flags[token.slice(2)] = argv[++i];
      else flags[token.slice(2)] = 'true';
    } else args.push(token);
  }
  return { operation: args.shift() ?? 'help', args, flags };
}

const need = (value: string | undefined, what: string): string => {
  if (value === undefined || value === 'true' || value.trim() === '') throw new ContentError('argument-missing', `${what} is missing`);
  return value;
};
const number = (value: string | undefined, what: string): number => {
  const n = Number(need(value, what).replace(/[\s_.]/g, ''));
  if (!Number.isFinite(n)) throw new ContentError('argument-invalid', `${what} must be a number (got "${value}")`);
  return n;
};
const position = (value: string | undefined): ops.Position | undefined =>
  value === undefined ? undefined : value === 'first' || value === 'last' ? value : number(value, 'the position');
/** "none" clears an optional value. */
const optional = (value: string | undefined): string | null | undefined => (value === undefined ? undefined : /^(none|-)$/i.test(value) ? null : value);
const texts = (flags: Flags, prefix: string): Partial<ops.Texts> | undefined => {
  const out: Partial<ops.Texts> = {};
  for (const l of LOCALES) if (flags[`${prefix}${l}`] !== undefined) out[l] = flags[`${prefix}${l}`];
  return Object.keys(out).length ? out : undefined;
};
const pair = (value: string): [string, string] => {
  const parts = value.split(/\s*[,&+]\s*|\s+és\s+|\s+und\s+|\s+and\s+/).filter(Boolean);
  if (parts.length !== 2) throw new ContentError('album-names', `"${value}" is not two first names (write them as "Zsófi, Bence")`);
  return [parts[0], parts[1]];
};

// ── What a person would call things ───────────────────────────────────────────────────────────

const albumName = (state: ContentState, id: string, locale: Locale = 'hu'): string => {
  const album = state.albums.find((a) => a.id === id);
  if (!album) return id;
  if (album.titleKey) return getText(state.locales[locale], album.titleKey) ?? id;
  return (album.partners ?? []).join(` ${getText(state.locales[locale], 'gallery.and') ?? '&'} `);
};

const describe = {
  albums: (state: ContentState) =>
    state.albums.map((a, i) => ({
      position: i + 1,
      id: a.id,
      name: albumName(state, a.id),
      venue: [a.venue.name, a.venue.town, a.venue.country === 'HU' ? null : a.venue.country].filter(Boolean).join(', '),
      photos: state.images.gallery[a.id]?.length ?? 0,
      cover: a.coverIndex + 1,
      onHomePage: state.featured.includes(a.id),
    })),
  rental: (state: ContentState) =>
    state.rental.map((r, i) => ({
      position: i + 1,
      id: r.id,
      name: getText(state.locales.hu, r.nameKey),
      price: formatHuf(r.priceHuf),
      unit: r.unit,
      deposit: r.depositHuf ? formatHuf(r.depositHuf) : null,
      quantity: r.quantity,
      size: r.size ?? null,
      photos: state.images.rental[r.id]?.length ?? 0,
    })),
  testimonials: (state: ContentState) =>
    state.testimonials.map((t, i) => ({ position: i + 1, id: t.id, author: t.author, quote: Object.fromEntries(LOCALES.map((l) => [l, getText(state.locales[l], t.quoteKey)])) })),
};

/** Pages (route paths) whose prerendered HTML shows the text; null when there is no build to look at. */
function pagesShowing(root: string, values: ops.Texts): string[] | null {
  if (!existsSync(path.join(root, 'dist', 'index.html'))) return null;
  const escape = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  const pages: string[] = [];
  for (const route of allRoutes()) {
    const file = path.join(root, 'dist', route.path, 'index.html');
    if (!existsSync(file)) continue;
    // The longest piece between placeholders / inline tags is what must appear on the page.
    const fragment = values[route.locale]
      .split(/\{\{[^}]*\}\}|<\/?\d+>/)
      .sort((a, b) => b.length - a.length)[0]
      ?.trim();
    if (!fragment || fragment.length < 3) continue;
    const html = readFileSync(file, 'utf8');
    if (html.includes(escape(fragment)) || html.includes(fragment)) pages.push(route.path);
  }
  return pages;
}

/** One picture with every photo of a slot, numbered from 1 — what a person picks a cover from. */
async function contactSheet(root: string, slot: string, photos: readonly ImageAsset[]): Promise<string> {
  const columns = Math.min(4, photos.length);
  const cell = 360;
  const label = 44;
  const rows = Math.ceil(photos.length / columns);
  const tiles = await Promise.all(
    photos.map(async (photo, i) => {
      const thumb = await sharp(path.join(root, 'public', photo.srcSmall)).resize(cell - 16, cell - label - 16, { fit: 'inside' }).toBuffer();
      const meta = await sharp(thumb).metadata();
      const x = (i % columns) * cell;
      const y = Math.floor(i / columns) * cell;
      const text = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${label}"><text x="${cell / 2}" y="31" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#2c2825">${i + 1}</text></svg>`
      );
      return [
        { input: thumb, left: x + Math.round((cell - (meta.width ?? 0)) / 2), top: y + label + Math.round((cell - label - (meta.height ?? 0)) / 2) },
        { input: text, left: x, top: y },
      ];
    })
  );
  const out = path.join(root, '.content', 'sheets', `${slot.replace(/\//g, '-')}.jpg`);
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp({ create: { width: columns * cell, height: rows * cell, channels: 3, background: '#faf7f2' } })
    .composite(tiles.flat())
    .jpeg({ quality: 82 })
    .toFile(out);
  return path.relative(root, out);
}

// ── Operations ────────────────────────────────────────────────────────────────────────────────

interface Outcome {
  state?: ContentState;
  result?: Record<string, unknown>;
  intake?: IntakeResult;
}
type Handler = (state: ContentState, parsed: Parsed, root: string) => Outcome | Promise<Outcome>;

const HELP: Record<string, string> = {
  list: 'list [albums|rental|testimonials]                                   what is on the site, as a person would name it',
  show: 'show <album id | rental id | text key | contact | areas>            one thing in all three languages',
  sheet: 'sheet <gallery/<album id> | rental/<item id>>                       one picture with every photo numbered (for picking a cover)',
  'text-find': 'text-find "<a few words>"                                          which text is this, and on which pages',
  'text-set': 'text-set <key> --hu "…" --de "…" --en "…"                          change an existing text in all three languages',
  'album-add': 'album-add --from <folder> (--partners "A, B" | --title-hu … --title-de … --title-en …) [--venue-name …] [--venue-town …] [--country HU|AT] [--cover n] [--position first|last|n]',
  'album-remove': 'album-remove <id> [--replace-featured <id>]',
  'album-move': 'album-move <id> --to first|last|n',
  'album-cover': 'album-cover <id> --photo n',
  'album-edit': 'album-edit <id> [--partners "A, B"] [--title-hu … --title-de … --title-en …] [--venue-name …|none] [--venue-town …|none] [--country HU|AT]',
  'album-feature': 'album-feature <id> <id> <id> <id>                                    the four albums on the home page, in order',
  'photos-add': 'photos-add <slot> --from <folder> [--position first|last|n]',
  'photos-remove': 'photos-remove <slot> --photos 3,5 [--new-cover n]',
  'photos-move': 'photos-move <slot> --photo n --to n',
  'rental-set': 'rental-set <id> [--price n] [--deposit n|none] [--quantity n] [--size "…"|none]',
  'rental-add': 'rental-add --from <folder> --name-hu … --name-de … --name-en … --description-hu … --description-de … --description-en … [--notes-hu … --notes-de … --notes-en …] --unit occasion|piece|set|wall --quantity n --price n [--deposit n] [--size "…"] [--pickup-town …] [--position …]',
  'rental-remove': 'rental-remove <id>',
  'rental-move': 'rental-move <id> --to first|last|n',
  'testimonial-add': 'testimonial-add --author "…" --hu "…" --de "…" --en "…" [--position first|last|n]',
  'testimonial-remove': 'testimonial-remove <id>',
  'testimonial-move': 'testimonial-move <id> --to first|last|n',
  'contact-set': 'contact-set [--phone "+36 …"] [--instagram https://…] [--facebook https://…]',
  'areas-set': 'areas-set <hu|de|en> "Area" "Area" …                                 the service areas of one language',
};

const HANDLERS: Record<string, Handler> = {
  list: (state, { args }) => {
    const what = args[0];
    if (what && !(what in describe)) throw new ContentError('argument-invalid', `list knows albums, rental and testimonials (got "${what}")`);
    const result = what ? { [what]: describe[what as keyof typeof describe](state) } : { albums: describe.albums(state), rental: describe.rental(state), testimonials: describe.testimonials(state) };
    return { result };
  },
  show: (state, { args }) => {
    const what = need(args[0], 'what to show');
    if (what === 'contact') return { result: { contact: state.contact } };
    if (what === 'areas') return { result: { areas: state.areas } };
    const album = describe.albums(state).find((a) => a.id === what);
    if (album) return { result: { album: { ...album, names: Object.fromEntries(LOCALES.map((l) => [l, albumName(state, what, l)])) } } };
    const item = state.rental.find((r) => r.id === what);
    if (item) {
      const text = (key: string | undefined) => (key ? Object.fromEntries(LOCALES.map((l) => [l, getText(state.locales[l], key)])) : null);
      return { result: { rentalItem: { ...describe.rental(state).find((r) => r.id === what), names: text(item.nameKey), descriptions: text(item.descriptionKey), notes: text(item.notesKey) } } };
    }
    const hu = getText(state.locales.hu, what);
    if (hu !== undefined) return { result: { key: what, texts: Object.fromEntries(LOCALES.map((l) => [l, getText(state.locales[l], what)])) } };
    throw new ContentError('not-found', `"${what}" is not an album, a rental item or a text key`);
  },
  sheet: async (state, { args }, root) => {
    const slot = need(args[0], 'the album or item (gallery/<id> or rental/<id>)');
    const [kind, id] = slot.split('/');
    const photos = kind === 'gallery' || kind === 'rental' ? state.images[kind][id] : undefined;
    if (!photos?.length) throw new ContentError('not-found', `"${slot}" has no photos`);
    return { result: { slot, photos: photos.length, cover: kind === 'gallery' ? (state.albums.find((a) => a.id === id)?.coverIndex ?? 0) + 1 : null, sheet: await contactSheet(root, slot, photos) } };
  },
  'text-find': (state, { args }, root) => {
    const matches = ops.textFind(state, need(args.join(' '), 'the words to look for'));
    return { result: { matches: matches.map((m) => ({ ...m, pages: pagesShowing(root, m.texts) })), pagesKnown: existsSync(path.join(root, 'dist', 'index.html')) } };
  },
  'text-set': (state, { args, flags }) => ({ state: ops.textSet(state, need(args[0], 'the text key'), texts(flags, '') ?? {}) }),

  'album-add': async (state, { flags }, root) => {
    const sources = listSourcePhotos(path.resolve(need(flags.from, 'the folder with the photos (--from)')));
    const input = {
      partners: flags.partners ? pair(flags.partners) : undefined,
      title: texts(flags, 'title-'),
      venue: { name: optional(flags['venue-name']) ?? null, town: optional(flags['venue-town']) ?? null, country: (flags.country ?? 'HU').toUpperCase() as 'HU' | 'AT' },
      cover: flags.cover ? number(flags.cover, 'the cover photo') : undefined,
      position: position(flags.position),
      id: flags.id,
    };
    // Check everything that does not need the encoded photos first: refuse before the slow part.
    const placeholder: ImageAsset = { src: '/x.webp', srcMedium: '/x.webp', srcSmall: '/x.webp', width: 1, height: 1 };
    const { id } = ops.albumAdd(state, { ...input, photos: sources.map(() => placeholder) });
    const intake = await intakePhotos(root, `gallery/${id}`, sources);
    if (input.cover !== undefined && input.cover > intake.photos.length) {
      discardIntake(root, intake.written);
      throw new ContentError('cover-out-of-range', `cover photo ${input.cover} does not exist; ${intake.photos.length} photos were usable`);
    }
    const added = ops.albumAdd(state, { ...input, id, photos: intake.photos });
    return { state: added.state, intake, result: { id, photos: intake.photos.length } };
  },
  'album-remove': (state, { args, flags }) => ({ state: ops.albumRemove(state, need(args[0], 'the album id'), flags['replace-featured']) }),
  'album-move': (state, { args, flags }) => ({ state: ops.albumMove(state, need(args[0], 'the album id'), position(need(flags.to, 'the new position (--to)'))!) }),
  'album-cover': (state, { args, flags }) => ({ state: ops.albumCover(state, need(args[0], 'the album id'), number(flags.photo, 'the photo number (--photo)')) }),
  'album-edit': (state, { args, flags }) => {
    const venue: ops.AlbumEditInput['venue'] = {};
    if (flags['venue-name'] !== undefined) venue.name = optional(flags['venue-name']) ?? null;
    if (flags['venue-town'] !== undefined) venue.town = optional(flags['venue-town']) ?? null;
    if (flags.country !== undefined) venue.country = flags.country.toUpperCase() as 'HU' | 'AT';
    const input = { partners: flags.partners ? pair(flags.partners) : undefined, title: texts(flags, 'title-'), venue: Object.keys(venue).length ? venue : undefined };
    if (!input.partners && !input.title && !input.venue) throw new ContentError('nothing-to-change', 'no new value given');
    return { state: ops.albumEdit(state, need(args[0], 'the album id'), input) };
  },
  'album-feature': (state, { args }) => ({ state: ops.albumFeature(state, args) }),

  'photos-add': async (state, { args, flags }, root) => {
    const slot = need(args[0], 'the album or item (gallery/<id> or rental/<id>)');
    const [kind, id] = slot.split('/');
    const existing = (kind === 'gallery' || kind === 'rental' ? state.images[kind][id] : undefined) ?? [];
    ops.photosAdd(state, slot, [{ src: '/x.webp', srcMedium: '/x.webp', srcSmall: '/x.webp', width: 1, height: 1 }], position(flags.position));
    const intake = await intakePhotos(root, slot, listSourcePhotos(path.resolve(need(flags.from, 'the folder with the photos (--from)'))), existing);
    return { state: ops.photosAdd(state, slot, intake.photos, position(flags.position)), intake, result: { added: intake.photos.length } };
  },
  'photos-remove': (state, { args, flags }) => ({
    state: ops.photosRemove(
      state,
      need(args[0], 'the album or item'),
      need(flags.photos, 'the photo numbers (--photos 3,5)').split(/[,\s]+/).filter(Boolean).map((n) => number(n, 'a photo number')),
      flags['new-cover'] ? number(flags['new-cover'], 'the new cover') : undefined
    ),
  }),
  'photos-move': (state, { args, flags }) => ({ state: ops.photosMove(state, need(args[0], 'the album or item'), number(flags.photo, 'the photo number (--photo)'), number(flags.to, 'the new place (--to)')) }),

  'rental-set': (state, { args, flags }) => {
    const deposit = optional(flags.deposit);
    const size = optional(flags.size);
    return {
      state: ops.rentalSet(state, need(args[0], 'the rental item id'), {
        priceHuf: flags.price !== undefined ? number(flags.price, 'the price') : undefined,
        depositHuf: deposit === undefined ? undefined : deposit === null ? null : number(deposit, 'the deposit'),
        quantity: flags.quantity !== undefined ? number(flags.quantity, 'the quantity') : undefined,
        size,
      }),
    };
  },
  'rental-add': async (state, { flags }, root) => {
    const sources = listSourcePhotos(path.resolve(need(flags.from, 'the folder with the photos (--from)')));
    const input = {
      name: texts(flags, 'name-') ?? {},
      description: texts(flags, 'description-') ?? {},
      notes: texts(flags, 'notes-'),
      unit: need(flags.unit, 'the price unit (--unit)') as 'occasion' | 'piece' | 'set' | 'wall',
      quantity: number(flags.quantity, 'the quantity'),
      priceHuf: number(flags.price, 'the price'),
      depositHuf: flags.deposit !== undefined ? number(flags.deposit, 'the deposit') : undefined,
      size: flags.size,
      pickupTown: flags['pickup-town'],
      position: position(flags.position),
      id: flags.id,
    };
    const placeholder: ImageAsset = { src: '/x.webp', srcMedium: '/x.webp', srcSmall: '/x.webp', width: 1, height: 1 };
    const { id } = ops.rentalAdd(state, { ...input, photos: sources.map(() => placeholder) });
    const intake = await intakePhotos(root, `rental/${id}`, sources);
    const added = ops.rentalAdd(state, { ...input, id, photos: intake.photos });
    return { state: added.state, intake, result: { id, photos: intake.photos.length } };
  },
  'rental-remove': (state, { args }) => ({ state: ops.rentalRemove(state, need(args[0], 'the rental item id')) }),
  'rental-move': (state, { args, flags }) => ({ state: ops.rentalMove(state, need(args[0], 'the rental item id'), position(need(flags.to, 'the new position (--to)'))!) }),

  'testimonial-add': (state, { flags }) => {
    const added = ops.testimonialAdd(state, { author: need(flags.author, "the customer's name (--author)"), quote: texts(flags, '') ?? {}, position: position(flags.position), id: flags.id });
    return { state: added.state, result: { id: added.id } };
  },
  'testimonial-remove': (state, { args }) => ({ state: ops.testimonialRemove(state, need(args[0], 'the testimonial id')) }),
  'testimonial-move': (state, { args, flags }) => ({ state: ops.testimonialMove(state, need(args[0], 'the testimonial id'), position(need(flags.to, 'the new position (--to)'))!) }),

  'contact-set': (state, { flags }) => ({ state: ops.contactSet(state, { phone: flags.phone, instagram: flags.instagram, facebook: flags.facebook }) }),
  'areas-set': (state, { args }) => ({ state: ops.areasSet(state, need(args[0], 'the language (hu, de or en)') as Locale, args.slice(1)) }),
};

export const OPERATIONS = Object.keys(HANDLERS);

/** Runs one operation against the checkout at `root`. Never throws: a refusal is `{ ok: false, … }`. */
export async function run(argv: readonly string[], root: string = process.cwd()): Promise<Record<string, unknown>> {
  const parsed = parseArgs(argv);
  if (parsed.operation === 'help' || parsed.flags.help) return { ok: true, operations: HELP };
  const handler = HANDLERS[parsed.operation];
  let intake: IntakeResult | undefined;
  try {
    if (!handler) throw new ContentError('operation-unknown', `"${parsed.operation}" is not a content operation — see: npm run content -- help`);
    const before = loadState(root);
    const existing = validateState(before);
    if (existing.length) throw new ContentError('invalid-state', `the content is already invalid before this change — fix that first:\n- ${existing.join('\n- ')}`);
    const outcome = await handler(before, parsed, root);
    intake = outcome.intake;
    const dryRun = parsed.flags['dry-run'] !== undefined;
    let changed: string[] = [];
    if (outcome.state) {
      const problems = validateState(outcome.state);
      if (problems.length) throw new ContentError('invalid-state', `the change would leave the site's content invalid:\n- ${problems.join('\n- ')}`);
      if (dryRun) {
        if (intake) discardIntake(root, intake.written);
      } else changed = [...(intake?.written ?? []), ...saveState(root, before, outcome.state)];
      if (!dryRun && changed.length === 0) return { ok: true, operation: parsed.operation, changed: [], note: 'nothing changed: the site already has these values', ...outcome.result };
    }
    return { ok: true, operation: parsed.operation, ...(outcome.state ? { dryRun, changed } : {}), ...(intake?.warnings.length ? { warnings: intake.warnings } : {}), ...outcome.result };
  } catch (error) {
    if (intake) discardIntake(root, intake.written);
    if (error instanceof ContentError) return { ok: false, operation: parsed.operation, code: error.code, message: error.message };
    return { ok: false, operation: parsed.operation, code: 'unexpected', message: error instanceof Error ? error.message : String(error) };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then((answer) => {
    console.log(JSON.stringify(answer, null, 2));
    if (answer.ok !== true) process.exitCode = 1;
  });
}
