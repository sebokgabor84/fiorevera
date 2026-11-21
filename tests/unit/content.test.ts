// @vitest-environment node
/**
 * Content operations of the CMS Coordinator (scripts/content/, docs/vera-agent/PRD.md).
 * What is checked is what an operation leaves on disk: the data still validates against the real
 * contracts, the three languages stay in parity, the photo manifest matches the files, and nothing
 * outside the operation's own entry changed. Every operation also has a refusal case that must
 * leave the files byte for byte.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { MAX_BYTES, parseImageMeta, renderImageMeta } from '../../scripts/images/tiers.js';
import { run } from '../../scripts/content/cli';
import * as ops from '../../scripts/content/ops';
import { classifyChange, classifyCheckout, type ChangedFile } from '../../scripts/content/lib/classify';
import { mergeBase, workFingerprint } from '../../scripts/content/lib/checkout';
import { abandon } from '../../scripts/release/publish-content';
import { intakePhotos, lastPhotoNumber, listSourcePhotos } from '../../scripts/content/lib/photos';
import { ContentError, FILES, getText, loadState, renderLocale, validateState, type ContentState } from '../../scripts/content/lib/state';
import { blockLiteral, elementLiteral, readArray, readValue, writeArray } from '../../scripts/content/lib/tsData';

const REPO = path.resolve(__dirname, '../..');
const TEXT_FILES = [FILES.albums, FILES.rental, FILES.testimonials, FILES.contact, FILES.areas, FILES.images, FILES.locale('hu'), FILES.locale('de'), FILES.locale('en')];
const temps: string[] = [];

/** A throw-away copy of the site's content files (no photos, no code): what an operation works on. */
const fixture = (): string => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'fv-content-'));
  temps.push(root);
  for (const rel of TEXT_FILES) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    cpSync(path.join(REPO, rel), path.join(root, rel));
  }
  return root;
};
const snapshot = (root: string): Record<string, string> => Object.fromEntries(TEXT_FILES.map((rel) => [rel, readFileSync(path.join(root, rel), 'utf8')]));
const changedFiles = (before: Record<string, string>, root: string): string[] => TEXT_FILES.filter((rel) => readFileSync(path.join(root, rel), 'utf8') !== before[rel]);
/** Lines added or replaced (an inserted line counts once, wherever it lands). */
const changedLines = (before: string, after: string): number => {
  const old = before.split('\n');
  return after.split('\n').filter((line) => {
    const at = old.indexOf(line);
    if (at < 0) return true;
    old.splice(at, 1);
    return false;
  }).length;
};

/** A folder of generated photos (solid colours, so every file differs and encodes fast). */
const photoFolder = async (sizes: [number, number][], names?: string[]): Promise<string> => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'fv-photos-'));
  temps.push(dir);
  for (const [i, [width, height]] of sizes.entries()) {
    await sharp({ create: { width, height, channels: 3, background: { r: 40 + i * 30, g: 120, b: 200 - i * 20 } } })
      .jpeg()
      .toFile(path.join(dir, names?.[i] ?? `IMG_${String(i + 1).padStart(4, '0')}.jpg`));
  }
  return dir;
};

let real: ContentState;
beforeAll(() => {
  real = loadState(REPO);
});
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const refusal = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    if (error instanceof ContentError) return error.code;
    throw error;
  }
  return 'NOT REFUSED';
};

describe('data files are read and rewritten without collateral changes', () => {
  it.each([
    [FILES.albums, 'albums'],
    [FILES.rental, 'rentalItems'],
    [FILES.testimonials, 'testimonials'],
  ])('%s: writing back unchanged values reproduces the file byte for byte', (file, name) => {
    const source = readFileSync(path.join(REPO, file), 'utf8');
    const elements = readArray(source, name);
    expect(elements.length).toBeGreaterThan(0);
    expect(writeArray(source, name, elements.map((element) => element.value))).toBe(source);
  });

  it('writes a new or changed entry in the style the files already use', () => {
    for (const [file, name] of [[FILES.albums, 'albums'], [FILES.testimonials, 'testimonials']] as const) {
      for (const element of readArray(readFileSync(path.join(REPO, file), 'utf8'), name)) expect(elementLiteral(element.value)).toBe(element.text);
    }
    for (const element of readArray(readFileSync(path.join(REPO, FILES.rental), 'utf8'), 'rentalItems')) {
      expect(blockLiteral(element.value as Record<string, unknown>, 2)).toBe(element.text);
    }
  });

  it('refuses anything that is not a plain literal', () => {
    expect(() => readValue("export const contact = { phone: getPhone() };", 'contact')).toThrow(/not a data literal/);
    expect(() => readValue('export const other = 1;', 'contact')).toThrow(/not found/);
  });

  it('language files and the photo manifest round-trip (invisible characters stay escaped)', () => {
    for (const locale of ['hu', 'de', 'en'] as const) {
      const text = readFileSync(path.join(REPO, FILES.locale(locale)), 'utf8');
      expect(renderLocale(JSON.parse(text))).toBe(text);
    }
    const manifest = readFileSync(path.join(REPO, FILES.images), 'utf8');
    expect(renderImageMeta(parseImageMeta(manifest))).toBe(manifest);
  });
});

describe('validation of the whole content', () => {
  it('accepts the site as it is', () => {
    expect(validateState(real)).toEqual([]);
  });

  it('names what is wrong, in words a person can act on', () => {
    const broken = structuredClone(real);
    broken.albums[0] = { ...broken.albums[0], coverIndex: 999 };
    expect(validateState(broken).join('\n')).toMatch(/cover 1000 does not exist/);

    const orphan = structuredClone(real);
    orphan.images.gallery['nobody'] = orphan.images.gallery[orphan.albums[0].id];
    expect(validateState(orphan).join('\n')).toMatch(/photos exist for "nobody"/);

    const placeholder = structuredClone(real);
    (placeholder.locales.de.gallery as Record<string, string>).photoCount_one = 'ein Bild';
    expect(validateState(placeholder).join('\n')).toMatch(/gallery\.photoCount_one" in de does not carry the same placeholders/);

    const phone = structuredClone(real);
    phone.contact = { ...phone.contact, phoneHref: 'tel:+36000000000' };
    expect(validateState(phone).join('\n')).toMatch(/not the same number/);
  });
});

describe('operations (pure: state in, state out)', () => {
  it('rental-set changes one item and nothing else', () => {
    const next = ops.rentalSet(real, 'wooden-arch', { priceHuf: 21990 });
    expect(next.rental.find((r) => r.id === 'wooden-arch')?.priceHuf).toBe(21990);
    expect(next.rental.filter((r, i) => JSON.stringify(r) !== JSON.stringify(real.rental[i]))).toHaveLength(1);
    expect(validateState(next)).toEqual([]);
    expect(real.rental.find((r) => r.id === 'wooden-arch')?.priceHuf).not.toBe(21990); // input untouched
  });

  it('rental-set adds and removes a deposit and refuses nonsense', () => {
    const withDeposit = ops.rentalSet(real, 'wooden-arch', { depositHuf: 10000 });
    expect(withDeposit.rental[0].depositHuf).toBe(10000);
    expect(ops.rentalSet(withDeposit, 'wooden-arch', { depositHuf: null }).rental[0]).toEqual(real.rental[0]);
    expect(refusal(() => ops.rentalSet(real, 'wooden-arch', { priceHuf: 19990.5 }))).toBe('amount-invalid');
    expect(refusal(() => ops.rentalSet(real, 'wooden-arch', { priceHuf: -1 }))).toBe('amount-invalid');
    expect(refusal(() => ops.rentalSet(real, 'no-such-item', { priceHuf: 1 }))).toBe('not-found');
    expect(refusal(() => ops.rentalSet(real, 'wooden-arch', {}))).toBe('nothing-to-change');
  });

  it('album-cover takes the number a person sees (first photo = 1)', () => {
    const id = real.albums[0].id;
    expect(ops.albumCover(real, id, 3).albums[0].coverIndex).toBe(2);
    expect(refusal(() => ops.albumCover(real, id, 0))).toBe('cover-out-of-range');
    expect(refusal(() => ops.albumCover(real, id, real.images.gallery[id].length + 1))).toBe('cover-out-of-range');
  });

  it('album-move reorders without losing or duplicating an album', () => {
    const last = real.albums[real.albums.length - 1].id;
    const moved = ops.albumMove(real, last, 'first');
    expect(moved.albums[0].id).toBe(last);
    expect(moved.albums.map((a) => a.id).sort()).toEqual(real.albums.map((a) => a.id).sort());
    expect(ops.albumMove(moved, last, real.albums.length).albums.map((a) => a.id)).toEqual(real.albums.map((a) => a.id));
    expect(refusal(() => ops.albumMove(real, last, real.albums.length + 1))).toBe('position-out-of-range');
  });

  it('album-add: a couple gets an id from the names, goes first, and stays valid', () => {
    const photos = real.images.gallery[real.albums[0].id].slice(0, 3).map((p, i) => ({ ...p, src: `/assets/gallery/zsofi-bence/0${i + 1}.webp` }));
    const { state, id } = ops.albumAdd(real, { partners: ['Zsófi', 'Bence'], venue: { name: 'Kehida Kapuja', town: 'Kehidakustány', country: 'HU' }, photos, cover: 2 });
    expect(id).toBe('zsofi-bence');
    expect(state.albums[0]).toEqual({ id, partners: ['Zsófi', 'Bence'], venue: { name: 'Kehida Kapuja', town: 'Kehidakustány', country: 'HU' }, coverIndex: 1 });
    expect(state.albums).toHaveLength(real.albums.length + 1);
    expect(validateState(state)).toEqual([]);
    // the same couple again gets a new id instead of overwriting the first album
    expect(ops.albumAdd(state, { partners: ['Zsófi', 'Bence'], venue: { name: null, town: 'Pat', country: 'HU' }, photos }).id).toBe('zsofi-bence-2');
  });

  it('album-add: a titled album brings its title in all three languages, or is refused', () => {
    const photos = real.images.gallery[real.albums[0].id].slice(0, 1);
    const { state, id } = ops.albumAdd(real, {
      title: { hu: 'Őszi fotózás 2027', de: 'Herbstshooting 2027', en: 'Autumn shoot 2027' },
      venue: { name: null, town: 'Zalakaros', country: 'HU' },
      photos,
      position: 'last',
    });
    expect(state.albums[state.albums.length - 1].titleKey).toBe(`gallery.albumTitles.${id}`);
    expect(getText(state.locales.de, `gallery.albumTitles.${id}`)).toBe('Herbstshooting 2027');
    expect(validateState(state)).toEqual([]);
    expect(refusal(() => ops.albumAdd(real, { title: { hu: 'Csak magyarul' }, venue: { name: null, town: null, country: 'HU' }, photos }))).toBe('text-missing');
    expect(refusal(() => ops.albumAdd(real, { venue: { name: null, town: null, country: 'HU' }, photos }))).toBe('album-names');
    expect(refusal(() => ops.albumAdd(real, { partners: ['A', 'B'], venue: { name: null, town: null, country: 'HU' }, photos: [] }))).toBe('no-photos');
  });

  it('album-remove: a featured album needs a replacement; a titled album takes its texts with it', () => {
    const featured = real.featured[0];
    expect(refusal(() => ops.albumRemove(real, featured))).toBe('album-featured');
    const replacement = real.albums.find((a) => !real.featured.includes(a.id))!.id;
    const removed = ops.albumRemove(real, featured, replacement);
    expect(removed.featured).toContain(replacement);
    expect(removed.images.gallery[featured]).toBeUndefined();
    expect(validateState(removed)).toEqual([]);

    const titled = real.albums.find((a) => a.titleKey && !real.featured.includes(a.id))!;
    const without = ops.albumRemove(real, titled.id);
    for (const locale of ['hu', 'de', 'en'] as const) expect(getText(without.locales[locale], titled.titleKey!)).toBeUndefined();
    expect(validateState(without)).toEqual([]);
  });

  it('album-feature wants exactly four existing albums', () => {
    const four = real.albums.slice(0, 4).map((a) => a.id);
    expect(ops.albumFeature(real, four).featured).toEqual(four);
    expect(refusal(() => ops.albumFeature(real, four.slice(0, 3)))).toBe('featured-count');
    expect(refusal(() => ops.albumFeature(real, [four[0], four[0], four[1], four[2]]))).toBe('featured-duplicate');
    expect(refusal(() => ops.albumFeature(real, [...four.slice(0, 3), 'nobody']))).toBe('not-found');
  });

  it('album-edit changes names or venue and never the id', () => {
    const couple = real.albums.find((a) => a.partners)!;
    const edited = ops.albumEdit(real, couple.id, { partners: ['Klaudia', 'Tamás'], venue: { town: 'Sopron' } });
    const after = edited.albums.find((a) => a.id === couple.id)!;
    expect(after.partners).toEqual(['Klaudia', 'Tamás']);
    expect(after.venue).toEqual({ ...couple.venue, town: 'Sopron' });
    expect(refusal(() => ops.albumEdit(real, couple.id, { title: { hu: 'a', de: 'b', en: 'c' } }))).toBe('album-names');
  });

  it('photos: removing or moving photos keeps the same photo as the cover', () => {
    const album = real.albums.find((a) => a.coverIndex >= 2 && real.images.gallery[a.id].length > 4)!;
    const slot = `gallery/${album.id}`;
    const coverSrc = real.images.gallery[album.id][album.coverIndex].src;
    const removed = ops.photosRemove(real, slot, [1]);
    const coverAfter = removed.albums.find((a) => a.id === album.id)!.coverIndex;
    expect(removed.images.gallery[album.id][coverAfter].src).toBe(coverSrc);
    const moved = ops.photosMove(real, slot, album.coverIndex + 1, 1);
    expect(moved.albums.find((a) => a.id === album.id)!.coverIndex).toBe(0);
    expect(moved.images.gallery[album.id][0].src).toBe(coverSrc);
    // removing the cover itself needs a named successor
    expect(refusal(() => ops.photosRemove(real, slot, [album.coverIndex + 1]))).toBe('cover-removed');
    const successor = ops.photosRemove(real, slot, [album.coverIndex + 1], 1);
    expect(successor.images.gallery[album.id][successor.albums.find((a) => a.id === album.id)!.coverIndex].src).toBe(real.images.gallery[album.id][0].src);
    expect(refusal(() => ops.photosRemove(real, slot, real.images.gallery[album.id].map((_, i) => i + 1)))).toBe('last-photo');
    expect(refusal(() => ops.photosRemove(real, 'hero/x', [1]))).toBe('slot-unknown');
  });

  it('text-set changes an existing text in all three languages or not at all', () => {
    const next = ops.textSet(real, 'home.cta.title', { hu: 'Tetszik, amit látsz?', de: 'Gefällt euch, was ihr seht?', en: 'Like what you see?' });
    expect(getText(next.locales.de, 'home.cta.title')).toBe('Gefällt euch, was ihr seht?');
    expect(validateState(next)).toEqual([]);
    expect(refusal(() => ops.textSet(real, 'home.cta.title', { hu: 'Csak magyarul' }))).toBe('text-missing');
    expect(refusal(() => ops.textSet(real, 'home.cta.nincs', { hu: 'a', de: 'b', en: 'c' }))).toBe('key-unknown');
    const tooLong = ops.textSet(real, 'meta.home.title', { hu: 'x'.repeat(61), de: 'Hochzeitsdekoration', en: 'Wedding decoration' });
    expect(validateState(tooLong).join('\n')).toMatch(/61 characters; a page title fits 60/);
    const identical = ops.textSet(real, 'home.cta.title', { hu: 'Same', de: 'Same', en: 'Same' });
    expect(validateState(identical).join('\n')).toMatch(/identical "home\.cta\.title"/);
  });

  it('text-find answers "which text is this" from a few words in any language', () => {
    const matches = ops.textFind(real, 'Hívj  bátran');
    expect(matches.map((m) => m.key)).toContain('contact.hero.title');
    expect(ops.textFind(real, getText(real.locales.de, 'home.cta.title')!).map((m) => m.key)).toContain('home.cta.title');
    expect(refusal(() => ops.textFind(real, 'a'))).toBe('phrase-too-short');
  });

  it('testimonials: add puts the quote in three languages; remove takes it out again', () => {
    const { state, id } = ops.testimonialAdd(real, { author: 'Kovács Zsófia', quote: { hu: 'Csodás volt!', de: 'Es war wunderschön!', en: 'It was wonderful!' } });
    expect(id).toBe('kovacs-zsofia');
    expect(state.testimonials[0]).toEqual({ id, author: 'Kovács Zsófia', quoteKey: `testimonials.${id}` });
    expect(validateState(state)).toEqual([]);
    const removed = ops.testimonialRemove(state, id);
    expect(removed.testimonials).toEqual(real.testimonials);
    expect(removed.locales).toEqual(real.locales);
    expect(refusal(() => ops.testimonialAdd(real, { author: 'X Y', quote: { hu: 'csak' } }))).toBe('text-missing');
  });

  it('contact-set derives the dial link and the Instagram handle; refuses what is not a number or a profile', () => {
    const next = ops.contactSet(real, { phone: '+36 30 123 4567', instagram: 'https://instagram.com/fioreveraflowers/' });
    expect(next.contact.phoneHref).toBe('tel:+36301234567');
    expect(next.contact.instagram).toBe('https://www.instagram.com/fioreveraflowers');
    expect(next.contact.instagramHandle).toBe('@fioreveraflowers');
    expect(next.contact.email).toBe(real.contact.email);
    expect(validateState(next)).toEqual([]);
    expect(refusal(() => ops.contactSet(real, { phone: '06 30 123 4567' }))).toBe('phone-invalid');
    expect(refusal(() => ops.contactSet(real, { facebook: 'https://example.com/fiorevera' }))).toBe('link-invalid');
  });

  it('areas-set replaces one language and keeps the others', () => {
    const next = ops.areasSet(real, 'en', ['Lake Balaton', 'Zala county']);
    expect(next.areas).toEqual({ ...real.areas, en: ['Lake Balaton', 'Zala county'] });
    expect(refusal(() => ops.areasSet(real, 'en', [' ']))).toBe('areas-empty');
  });
});

describe('command line on a copy of the content (what ends up on disk)', () => {
  it('a price change is a one-line change in one file, and running it twice changes nothing more', async () => {
    const root = fixture();
    const before = snapshot(root);
    const answer = await run(['rental-set', 'wooden-arch', '--price', '21990'], root);
    expect(answer).toMatchObject({ ok: true, changed: [FILES.rental] });
    expect(changedFiles(before, root)).toEqual([FILES.rental]);
    expect(changedLines(before[FILES.rental], readFileSync(path.join(root, FILES.rental), 'utf8'))).toBe(1);
    const again = await run(['rental-set', 'wooden-arch', '--price', '21990'], root);
    expect(again).toMatchObject({ ok: true, changed: [] });
    expect(validateState(loadState(root))).toEqual([]);
  });

  it.each([
    [['rental-set', 'wooden-arch', '--price', 'sok']],
    [['album-cover', 'orsi-anti', '--photo', '99']],
    [['text-set', 'meta.home.title', '--hu', 'x'.repeat(80), '--de', 'Hochzeitsdekoration', '--en', 'Wedding decoration']],
    [['text-set', 'home.cta.title', '--hu', 'Csak magyarul']],
    [['album-remove', 'orsi-anti']],
    [['testimonial-add', '--author', 'Valaki', '--hu', 'Szép volt']],
    [['contact-set', '--phone', 'nincs']],
    [['no-such-operation']],
  ])('refuses %j and leaves every file byte for byte', async (argv) => {
    const root = fixture();
    const before = snapshot(root);
    const answer = await run(argv, root);
    expect(answer.ok).toBe(false);
    expect(typeof answer.code).toBe('string');
    expect(changedFiles(before, root)).toEqual([]);
  });

  it('--dry-run reports and writes nothing', async () => {
    const root = fixture();
    const before = snapshot(root);
    expect(await run(['album-cover', 'orsi-anti', '--photo', '2', '--dry-run'], root)).toMatchObject({ ok: true, dryRun: true });
    expect(changedFiles(before, root)).toEqual([]);
  });

  it('a text change touches the three language files and nothing else', async () => {
    const root = fixture();
    const before = snapshot(root);
    const answer = await run(['text-set', 'home.cta.title', '--hu', 'Tetszik, amit látsz?', '--de', 'Gefällt euch, was ihr seht?', '--en', 'Do you like what you see?'], root);
    expect(answer.ok).toBe(true);
    expect(changedFiles(before, root)).toEqual([FILES.locale('hu'), FILES.locale('de'), FILES.locale('en')]);
    for (const locale of ['hu', 'de', 'en'] as const) expect(changedLines(before[FILES.locale(locale)], readFileSync(path.join(root, FILES.locale(locale)), 'utf8'))).toBe(1);
  });

  it('list and show describe the content the way a person names it', async () => {
    const root = fixture();
    const list = (await run(['list', 'albums'], root)) as { albums: { id: string; name: string; cover: number }[] };
    expect(list.albums).toHaveLength(real.albums.length);
    expect(list.albums.find((a) => a.id === 'klaudia-thomas')?.name).toBe('Klaudia és Thomas');
    const show = (await run(['show', 'wedding-mirror'], root)) as { rentalItem: { names: Record<string, string> } };
    expect(show.rentalItem.names.de).toBe(getText(real.locales.de, 'rental.items.wedding-mirror.name'));
  });
});

describe('photo intake for one album', () => {
  it('writes three tiers per photo within the size limit, numbered on from what the album has', async () => {
    const root = fixture();
    const folder = await photoFolder([[2400, 1600], [1600, 2400], [2000, 1333]]);
    const first = await intakePhotos(root, 'gallery/test-album', listSourcePhotos(folder));
    expect(first.photos).toHaveLength(3);
    expect(first.photos[0]).toMatchObject({ src: '/assets/gallery/test-album/01-01-img-0001.webp', srcMedium: '/assets/gallery/test-album/01-01-img-0001-w1280.webp', width: 1920, height: 1280 });
    expect(first.photos[1]).toMatchObject({ width: 1280, height: 1920 });
    const dir = path.join(root, 'public/assets/gallery/test-album');
    expect(readdirSync(dir)).toHaveLength(9);
    for (const file of readdirSync(dir)) expect(statSync(path.join(dir, file)).size).toBeLessThanOrEqual(MAX_BYTES);
    expect(lastPhotoNumber(first.photos)).toBe(3);

    const more = await intakePhotos(root, 'gallery/test-album', listSourcePhotos(await photoFolder([[1800, 1200]], ['new.jpg'])), first.photos);
    expect(more.photos[0].src).toBe('/assets/gallery/test-album/04-04-new.webp');
    expect(readdirSync(path.join(root, 'assets-src/gallery/test-album'))).toContain('04-new.jpg');
  });

  it('skips an identical file, warns about a soft photo and refuses a tiny one without leaving files', async () => {
    const root = fixture();
    const folder = await photoFolder([[2000, 1333], [1200, 800]]);
    cpSync(path.join(folder, 'IMG_0001.jpg'), path.join(folder, 'IMG_0003.jpg'));
    const result = await intakePhotos(root, 'gallery/a', listSourcePhotos(folder));
    expect(result.photos).toHaveLength(2);
    expect(result.warnings.join('\n')).toMatch(/IMG_0003\.jpg" is the same file as "IMG_0001\.jpg"/);
    expect(result.warnings.join('\n')).toMatch(/IMG_0002\.jpg" is 1200×800 px; it will look soft/);

    const tiny = await photoFolder([[2000, 1333], [640, 480]]);
    await expect(intakePhotos(root, 'gallery/b', listSourcePhotos(tiny))).rejects.toMatchObject({ code: 'photo-too-small' });
    expect(existsSync(path.join(root, 'public/assets/gallery/b'))).toBe(false);
    await expect(intakePhotos(root, 'gallery/c', listSourcePhotos(await photoFolder([])))).rejects.toMatchObject({ code: 'no-photos' });
  });

  it.runIf(process.platform === 'darwin')('reads an iPhone HEIC photo on a Mac', async () => {
    const root = fixture();
    const folder = await photoFolder([[2000, 1500]]);
    execFileSync('/usr/bin/sips', ['-s', 'format', 'heic', path.join(folder, 'IMG_0001.jpg'), '--out', path.join(folder, 'IMG_0002.HEIC')], { stdio: 'pipe' });
    rmSync(path.join(folder, 'IMG_0001.jpg'));
    const result = await intakePhotos(root, 'gallery/heic', listSourcePhotos(folder));
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0]).toMatchObject({ src: '/assets/gallery/heic/01-01-img-0002.webp', width: 1920, height: 1440 });
  });

  it('album-add from a folder: the album is first, valid, and only its own files changed', async () => {
    const root = fixture();
    const before = snapshot(root);
    const folder = await photoFolder([[2000, 1333], [2000, 1333], [1333, 2000]]);
    const answer = await run(['album-add', '--from', folder, '--partners', 'Zsófi, Bence', '--venue-name', 'Kehida Kapuja', '--venue-town', 'Kehidakustány', '--cover', '2'], root);
    expect(answer).toMatchObject({ ok: true, id: 'zsofi-bence', photos: 3 });
    expect(changedFiles(before, root).sort()).toEqual([FILES.albums, FILES.images].sort());
    const state = loadState(root);
    expect(state.albums[0]).toMatchObject({ id: 'zsofi-bence', partners: ['Zsófi', 'Bence'], coverIndex: 1 });
    expect(state.images.gallery['zsofi-bence']).toHaveLength(3);
    expect(validateState(state)).toEqual([]);
    expect(changedLines(before[FILES.albums], readFileSync(path.join(root, FILES.albums), 'utf8'))).toBe(1);
    // every other album's manifest entry is untouched
    for (const album of real.albums) expect(state.images.gallery[album.id]).toEqual(real.images.gallery[album.id]);

    // and removing it again deletes its files and restores the content exactly
    expect(await run(['album-remove', 'zsofi-bence'], root)).toMatchObject({ ok: true });
    expect(existsSync(path.join(root, 'public/assets/gallery/zsofi-bence'))).toBe(false);
    expect(changedFiles(before, root)).toEqual([]);
  });

  it('album-add refuses bad names before it encodes anything', async () => {
    const root = fixture();
    const before = snapshot(root);
    const folder = await photoFolder([[2000, 1333]]);
    expect(await run(['album-add', '--from', folder, '--partners', 'Csak Egy'], root)).toMatchObject({ ok: false, code: 'album-names' });
    expect(await run(['album-add', '--from', folder, '--partners', 'A, B', '--cover', '5'], root)).toMatchObject({ ok: false, code: 'cover-out-of-range' });
    expect(existsSync(path.join(root, 'public/assets'))).toBe(false);
    expect(changedFiles(before, root)).toEqual([]);
  });
});

describe('change classifier: pure content, or does it need the technical owner?', () => {
  const classify = (files: Record<string, [string | null, string | null]>) =>
    classifyChange({
      files: Object.entries(files).map(([file, [a, b]]): ChangedFile => ({ path: file, status: a === null ? 'A' : b === null ? 'D' : 'M' })),
      base: (file) => files[file]?.[0] ?? null,
      head: (file) => files[file]?.[1] ?? null,
    });
  const source = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8');
  const withLocale = (mutate: (tree: Record<string, Record<string, unknown>>) => void): string => {
    const tree = JSON.parse(source(FILES.locale('hu'))) as Record<string, Record<string, unknown>>;
    mutate(tree);
    return renderLocale(tree as never);
  };

  it('content: a price, a text, photos, the files a content change regenerates', () => {
    const result = classify({
      [FILES.rental]: [source(FILES.rental), source(FILES.rental).replace('priceHuf: 19990', 'priceHuf: 21990')],
      [FILES.locale('hu')]: [source(FILES.locale('hu')), withLocale((t) => ((t.home.cta as Record<string, string>).title = 'Új cím'))],
      'public/assets/gallery/zsofi-bence/01-01-img.webp': [null, 'binary'],
      'tests/visual/__screenshots__/snapshots.spec.ts/rental-375.png': ['old', 'new'],
      'docs/qa/visual-baselines-log.md': ['a', 'b'],
      'public/sitemap.xml': ['a', 'b'],
      'scripts/sitemap-lastmod.json': ['a', 'b'],
      'docs/vera-agent/changelog.md': ['a', 'b'],
    });
    expect(result).toMatchObject({ class: 'content', reasons: [] });
  });

  it('content: phone and social links in the contact data', () => {
    expect(classify({ [FILES.contact]: [source(FILES.contact), source(FILES.contact).replace('+36 30 865 9108', '+36 30 865 9109').replace('tel:+36308659108', 'tel:+36308659109')] }).class).toBe('content');
  });

  it.each([
    ['a legal text', { [FILES.locale('hu')]: [source(FILES.locale('hu')), withLocale((t) => ((t.privacy as Record<string, string>).title = 'Más'))] }, /legal text "privacy\.title"/],
    ['the consent sentence', { [FILES.locale('hu')]: [source(FILES.locale('hu')), withLocale((t) => (((t.contact.form as Record<string, unknown>).consent as string) = 'Más'))] }, /legal text "contact\.form\.consent"/],
    ['the e-mail address', { [FILES.contact]: [source(FILES.contact), source(FILES.contact).replace('info.fiorevera@gmail.com', 'vera@example.com')] }, /"email" changed/],
    ['code next to the data', { [FILES.albums]: [source(FILES.albums), `${source(FILES.albums)}\nexport const extra = () => fetch('https://example.com');\n`] }, /something other than the content entries changed/],
    ['the privacy date', { [FILES.contact]: [source(FILES.contact), source(FILES.contact).replace('2026. november 16.', '2027. január 1.')] }, /something other than the content entries changed/],
    ['a component', { 'src/components/Home/HomeHero.tsx': ['a', 'b'] }, /not a content file/],
    ['a new file under src', { 'src/data/announcements.ts': [null, 'export const x = 1;'] }, /not a content file/],
    ['a test', { 'tests/unit/data.test.ts': ['a', 'b'] }, /not a content file/],
    ['a dependency', { 'package.json': ['a', 'b'] }, /not a content file/],
    ['a hero photo file', { 'public/assets/hero/01-new.webp': [null, 'binary'] }, /not a content file/],
    ['a deleted data file', { [FILES.testimonials]: [source(FILES.testimonials), null] }, /added or deleted/],
  ] as [string, Record<string, [string | null, string | null]>, RegExp][])('needs the technical owner: %s', (_label, files, reason) => {
    const result = classify(files);
    expect(result.class).toBe('needs-gabor');
    expect(result.reasons.join('\n')).toMatch(reason);
  });

  it('needs the technical owner: the hero entry of the photo manifest', () => {
    const manifest = parseImageMeta(source(FILES.images));
    const changed = structuredClone(manifest);
    changed.hero = [{ ...changed.hero[0], src: '/assets/hero/01-other.webp' }];
    expect(classify({ [FILES.images]: [renderImageMeta(manifest), renderImageMeta(changed)] }).reasons.join('\n')).toMatch(/the hero photo changed/);
    const album = structuredClone(manifest);
    album.gallery['zsofi-bence'] = manifest.gallery[Object.keys(manifest.gallery)[0]];
    expect(classify({ [FILES.images]: [renderImageMeta(manifest), renderImageMeta(album)] }).class).toBe('content');
  });

  it('an empty change is not a release', () => {
    expect(classify({})).toMatchObject({ class: 'needs-gabor', reasons: ['nothing changed'] });
  });
});

describe('classifier and fingerprint on a real git checkout', () => {
  const sh = (root: string, ...args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, FV_SKIP_HOOKS: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' } });
  /** A throw-away repository holding a copy of the content files, with `origin/main` at its first commit. */
  const repo = (): string => {
    const root = fixture();
    cpSync(path.join(REPO, '.gitignore'), path.join(root, '.gitignore')); // assets-src/ (the originals) and .content/ are ignored
    sh(root, 'init', '-q', '-b', 'main');
    sh(root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'add', '-A');
    sh(root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'base');
    sh(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    sh(root, 'switch', '-q', '-c', 'content/2027-01-10-test');
    return root;
  };

  it('an uncommitted price change is content; the same change committed keeps its fingerprint', async () => {
    const root = repo();
    const base = mergeBase(root);
    const clean = workFingerprint(root, base);
    expect(classifyCheckout(root)).toMatchObject({ class: 'needs-gabor', reasons: ['nothing changed'] });

    await run(['rental-set', 'wooden-arch', '--price', '21990'], root);
    expect(classifyCheckout(root)).toMatchObject({ class: 'content', reasons: [], files: [FILES.rental] });
    const changed = workFingerprint(root, base);
    expect(changed).not.toBe(clean);

    sh(root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-am', 'content: price');
    expect(workFingerprint(root, base)).toBe(changed);
    expect(classifyCheckout(root).class).toBe('content');

    // what an approval adds after the gates ran does not move the fingerprint …
    mkdirSync(path.join(root, 'docs/vera-agent'), { recursive: true });
    writeFileSync(path.join(root, 'docs/vera-agent/changelog.md'), 'log\n');
    expect(workFingerprint(root, base)).toBe(changed);
    expect(classifyCheckout(root).class).toBe('content');
    // … any other new file does, and it is not content
    mkdirSync(path.join(root, 'src/components'), { recursive: true });
    writeFileSync(path.join(root, 'src/components/New.tsx'), 'export const x = 1;\n');
    expect(workFingerprint(root, base)).not.toBe(changed);
    expect(classifyCheckout(root)).toMatchObject({ class: 'needs-gabor', reasons: ['src/components/New.tsx: not a content file'] });
  });

  it('a new album with its photos is content', async () => {
    const root = repo();
    const folder = await photoFolder([[2000, 1333], [2000, 1333]]);
    expect(await run(['album-add', '--from', folder, '--partners', 'Zsófi, Bence', '--venue-town', 'Zalakaros'], root)).toMatchObject({ ok: true });
    const result = classifyCheckout(root);
    expect(result.class, result.reasons.join('\n')).toBe('content');
    expect(result.files).toContain('public/assets/gallery/zsofi-bence/01-01-img-0001.webp');
    // the originals were archived next to the checkout but are git-ignored: they never travel with the change
    expect(existsSync(path.join(root, 'assets-src/gallery/zsofi-bence/01-IMG_0001.jpg'))).toBe(true);
    expect(result.files.some((file) => file.startsWith('assets-src/'))).toBe(false);
  });
});

describe('dropping an unreleased content change ("mégsem kérem")', () => {
  const sh = (root: string, ...args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, FV_SKIP_HOOKS: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' } });
  const repo = (): string => {
    const root = fixture();
    cpSync(path.join(REPO, '.gitignore'), path.join(root, '.gitignore'));
    sh(root, 'init', '-q', '-b', 'main');
    sh(root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'add', '-A');
    sh(root, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'base');
    sh(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    sh(root, 'switch', '-q', '-c', 'content/2027-01-10-test');
    return root;
  };

  it('puts every content file back, deletes the new photos and returns to main', async () => {
    const root = repo();
    const before = snapshot(root);
    await run(['rental-set', 'wooden-arch', '--price', '21990'], root);
    await run(['album-add', '--from', await photoFolder([[2000, 1333]]), '--partners', 'Zsófi, Bence'], root);
    expect(changedFiles(before, root).length).toBeGreaterThan(0);
    const answer = abandon(root, ['--abandon']);
    expect(answer).toMatchObject({ ok: true, stage: 'abandoned', backOnMain: true });
    expect(changedFiles(before, root)).toEqual([]);
    expect(existsSync(path.join(root, 'public/assets/gallery/zsofi-bence'))).toBe(false);
    expect(sh(root, 'status', '--porcelain')).toBe('');
    expect(sh(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
  });

  it('touches nothing when something other than content changed, or outside a content branch', async () => {
    const root = repo();
    await run(['rental-set', 'wooden-arch', '--price', '21990'], root);
    mkdirSync(path.join(root, 'src/components'), { recursive: true });
    writeFileSync(path.join(root, 'src/components/New.tsx'), 'export const x = 1;\n');
    expect(() => abandon(root, ['--abandon'])).toThrow(/not only content changed here/);
    expect(readFileSync(path.join(root, FILES.rental), 'utf8')).toContain('priceHuf: 21990');
    expect(existsSync(path.join(root, 'src/components/New.tsx'))).toBe(true);
    sh(root, 'switch', '-q', '-c', 'feature/x');
    expect(() => abandon(root, ['--abandon'])).toThrow(/only a content\/ branch/);
  });
});

describe('bulk image script (scripts/optimize-images.js) refuses to shrink the manifest', () => {
  it('stops before writing when assets-src/ lacks photos the manifest holds', async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'fv-bulk-'));
    temps.push(root);
    mkdirSync(path.join(root, 'assets-src/gallery/new-album'), { recursive: true });
    await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#888' } }).jpeg().toFile(path.join(root, 'assets-src/gallery/new-album/a.jpg'));
    mkdirSync(path.join(root, 'src/data/generated'), { recursive: true });
    const manifest = readFileSync(path.join(REPO, FILES.images), 'utf8');
    writeFileSync(path.join(root, FILES.images), manifest);
    const result = spawnSync(process.execPath, [path.join(REPO, 'scripts/optimize-images.js')], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/REFUSED — nothing was written/);
    expect(result.stderr).toMatch(/gallery\/orsi-anti: \d+ photo\(s\) in the manifest, no originals folder/);
    expect(readFileSync(path.join(root, FILES.images), 'utf8')).toBe(manifest);
    expect(existsSync(path.join(root, 'public'))).toBe(false);
  });
});
