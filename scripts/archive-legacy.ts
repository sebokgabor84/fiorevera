/**
 * archive-legacy.ts — MASTER-PLAN 0.1 (PRD D-17)
 *
 * Deterministic, re-runnable local archive of the legacy Webnode site
 * (www.fiorevera.hu): every HU + DE page as Markdown (+ raw HTML), every
 * gallery / page image at original resolution, and a Zod-validated
 * manifest.json (albums → images, page images, testimonials, contact).
 *
 * Usage:  npx tsx scripts/archive-legacy.ts [--no-images] [--seed-assets]
 *
 * Output: references/legacy/<locale>/<slug>.md
 *         references/legacy/raw/<locale>/<slug>.html
 *         references/legacy/images/gallery/<album-slug>/NN-<file>
 *         references/legacy/images/pages/<slug>/NN-<file>
 *         references/legacy/manifest.json
 * --seed-assets additionally copies the images into assets-src/<slot>/
 * (see scripts/optimize-images.js for the slot layout).
 */
import { mkdir, writeFile, stat, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const BASE_URL = 'https://www.fiorevera.hu';
const OUT_DIR = path.resolve('references/legacy');
const ASSETS_SRC = path.resolve('assets-src');
const CONCURRENCY = 6;

type Locale = 'hu' | 'de';
type PageId = 'home' | 'services' | 'gallery' | 'garden' | 'rental' | 'about' | 'contact';

const PAGES: Record<Locale, Record<PageId, string>> = {
  hu: {
    home: '/',
    services: '/szolgaltatasok/',
    gallery: '/munkaim/',
    garden: '/viragoskert/',
    rental: '/kellekberles/',
    about: '/rolunk/',
    contact: '/kapcsolat/',
  },
  de: {
    home: '/de/',
    services: '/de/dienstleistungen/',
    gallery: '/de/referenzen/',
    garden: '/de/blumengarten/',
    rental: '/de/verleih/',
    about: '/de/uebermich/',
    contact: '/de/kontakt/',
  },
};

// ---------- manifest schema ----------
const ImageSchema = z.object({
  url: z.string().url(),
  file: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
const AlbumSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  couple: z.string().min(1),
  venueRaw: z.string(),
  venueRawHu: z.string().optional(),
  galleryBlockId: z.string(),
  images: z.array(ImageSchema).min(1),
});
const TestimonialSchema = z.object({ author: z.string().min(1), quote: z.string().min(10) });
const ManifestSchema = z.object({
  archivedAt: z.string(),
  source: z.string().url(),
  pages: z.record(
    z.enum(['hu', 'de']),
    z.record(z.string(), z.object({ url: z.string().url(), title: z.string(), markdown: z.string() }))
  ),
  albums: z.array(AlbumSchema).min(1),
  pageImages: z.record(z.string(), z.array(ImageSchema)),
  testimonials: z.array(TestimonialSchema),
  contact: z.object({
    phone: z.string(),
    email: z.string().email(),
    address: z.string(),
    owner: z.string(),
  }),
  totals: z.object({ albums: z.number().int(), galleryImages: z.number().int() }),
});
type Manifest = z.infer<typeof ManifestSchema>;
type Album = z.infer<typeof AlbumSchema>;
type ImageRef = z.infer<typeof ImageSchema>;

// ---------- helpers ----------
const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));

const stripTags = (s: string): string => decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const stripUrl = (u: string): string => u.replace(/\?ph=\w+$/, '');

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\bes\b/g, '-') // "és" → separator
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const fileNameFromUrl = (u: string): string => decodeURIComponent(stripUrl(u).split('/').pop() ?? 'image');

/** Converts a Webnode page body to readable Markdown (content only, no chrome). */
const htmlToMarkdown = (html: string): string => {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  // Drop header/nav/footer/cookie chrome when identifiable
  h = h.replace(/<header[\s\S]*?<\/header>/gi, '').replace(/<footer[\s\S]*?<\/footer>/gi, '');
  h = h.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  const out: string[] = [];
  const re =
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<li[^>]*>([\s\S]*?)<\/li>|<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+src="([^"]+\.(?:jpe?g|png))\?[^"]*"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h))) {
    if (m[1]) out.push(`\n${'#'.repeat(Number(m[1]))} ${stripTags(m[2])}\n`);
    else if (m[3] !== undefined) out.push(`- ${stripTags(m[3])}`);
    else if (m[4] !== undefined) {
      const t = stripTags(m[4]);
      if (t) out.push(`${t}\n`);
    } else if (m[5] && !/logo/i.test(m[5])) out.push(`![](${stripUrl(m[5])})\n`);
  }
  // de-duplicate consecutive identical lines (Webnode repeats menus)
  return out.filter((l, i) => l.trim() && l !== out[i - 1]).join('\n');
};

const titleOf = (html: string): string => stripTags(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');

interface GalleryItem {
  img: { src: string };
  size: { width: number; height: number };
}
interface GalleryBlock {
  id: string;
  items: GalleryItem[];
}

/** Albums = (couple h2, venue h2) pairs followed by a PhotoGalleryBlock. */
const parseAlbums = (html: string): Album[] => {
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>|data-content="([^"]*PhotoGalleryBlock[^"]*)"/g;
  const headings: string[] = [];
  const albums: Album[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      headings.push(stripTags(m[1]));
      continue;
    }
    const block = JSON.parse(decodeEntities(m[2])) as GalleryBlock;
    const venueRaw = headings.pop() ?? '';
    const couple = headings.pop() ?? '';
    headings.length = 0;
    albums.push({
      slug: slugify(couple),
      couple,
      venueRaw: venueRaw.replace(/\s+-\s+/g, ' - '),
      galleryBlockId: block.id,
      images: block.items.map((it) => ({
        url: stripUrl(it.img.src),
        file: fileNameFromUrl(it.img.src),
        width: it.size.width,
        height: it.size.height,
      })),
    });
  }
  return albums;
};

/** Original-resolution page images (skips 450/700 derivatives and the logo). */
const parsePageImages = (html: string): ImageRef[] => {
  const re = /<img[^>]+src="(https?:\/\/[^"]+\.(?:jpe?g|png))\?ph=\w+"[^>]*width="(\d+)"[^>]*height="(\d+)"/g;
  const out: ImageRef[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const url = stripUrl(m[1]);
    if (/logo/i.test(url) || /\/\d{3}\/[^/]+$/.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, file: fileNameFromUrl(url), width: Number(m[2]), height: Number(m[3]) });
  }
  return out;
};

const parseTestimonials = (markdown: string): Manifest['testimonials'] => {
  const lines = markdown.split('\n').map((l) => l.replace(/^#+\s*/, '').trim()).filter(Boolean);
  const out: Manifest['testimonials'] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const l = lines[i];
    if (/^["„”]/.test(l) && l.length > 40) {
      out.push({ quote: l.replace(/^["„”\s]+|["”\s]+$/g, ''), author: lines[i + 1] });
    }
  }
  return out;
};

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url, { headers: { 'user-agent': 'fiorevera-archive/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

const downloadTo = async (url: string, dest: string): Promise<boolean> => {
  if (existsSync(dest) && (await stat(dest)).size > 0) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return true;
};

const pool = async <T>(items: T[], worker: (t: T) => Promise<void>): Promise<void> => {
  let i = 0;
  const run = async (): Promise<void> => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
};

const pad = (n: number): string => String(n + 1).padStart(2, '0');

// ---------- main ----------
const main = async (): Promise<void> => {
  const args = new Set(process.argv.slice(2));
  const withImages = !args.has('--no-images');
  const seedAssets = args.has('--seed-assets');

  const pages: Manifest['pages'] = { hu: {}, de: {} };
  const rawHtml: Record<Locale, Partial<Record<PageId, string>>> = { hu: {}, de: {} };

  for (const locale of ['hu', 'de'] as const) {
    for (const [pageId, route] of Object.entries(PAGES[locale]) as [PageId, string][]) {
      const url = BASE_URL + route;
      const html = await fetchText(url);
      rawHtml[locale][pageId] = html;
      const markdown = htmlToMarkdown(html);
      const slug = route.replace(/^\/de\//, '').replace(/\//g, '') || 'home';
      await mkdir(path.join(OUT_DIR, locale), { recursive: true });
      await mkdir(path.join(OUT_DIR, 'raw', locale), { recursive: true });
      await writeFile(
        path.join(OUT_DIR, locale, `${slug}.md`),
        `<!-- archived from ${url} -->\n# ${titleOf(html)}\n\n${markdown}\n`
      );
      await writeFile(path.join(OUT_DIR, 'raw', locale, `${slug}.html`), html);
      pages[locale][pageId] = { url, title: titleOf(html), markdown };
      console.log(`✓ ${locale} ${pageId} → ${slug}.md`);
    }
  }

  // Albums: DE gallery is the complete one (15 albums); HU adds HU venue strings.
  const albums = parseAlbums(rawHtml.de.gallery ?? '');
  const huAlbums = parseAlbums(rawHtml.hu.gallery ?? '');
  for (const a of albums) {
    const hu = huAlbums.find((h) => h.galleryBlockId === a.galleryBlockId);
    if (hu && hu.venueRaw !== a.venueRaw) a.venueRawHu = hu.venueRaw;
  }

  const pageImages: Manifest['pageImages'] = {};
  for (const [pageId, html] of Object.entries(rawHtml.hu) as [PageId, string][]) {
    if (pageId === 'gallery') continue;
    pageImages[pageId] = parsePageImages(html);
  }
  pageImages.gallery = parsePageImages(rawHtml.de.gallery ?? ''); // legacy hero only

  const homeMd = pages.hu.home?.markdown ?? '';
  const contactRaw = stripTags(rawHtml.hu.contact ?? '');
  const manifest: Manifest = {
    archivedAt: new Date().toISOString().slice(0, 10),
    source: BASE_URL,
    pages,
    albums,
    pageImages,
    testimonials: parseTestimonials(homeMd),
    contact: {
      phone: /\+36-[-\d]+/.exec(contactRaw)?.[0] ?? '',
      email: /[\w.]+@[\w.]+\.\w+/.exec(contactRaw)?.[0] ?? '',
      address: /\d{4} Zalakaros[^.]*\./.exec(contactRaw)?.[0]?.trim() ?? '',
      owner: /Sebőkné Antalics Veronika/.exec(contactRaw)?.[0] ?? '',
    },
    totals: { albums: albums.length, galleryImages: albums.reduce((n, a) => n + a.images.length, 0) },
  };
  ManifestSchema.parse(manifest);
  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✓ manifest: ${manifest.totals.albums} albums / ${manifest.totals.galleryImages} images`);

  if (withImages) {
    const jobs: { url: string; dest: string }[] = [];
    for (const a of albums) {
      a.images.forEach((img, i) =>
        jobs.push({ url: img.url, dest: path.join(OUT_DIR, 'images/gallery', a.slug, `${pad(i)}-${img.file}`) })
      );
    }
    for (const [pageId, imgs] of Object.entries(pageImages)) {
      imgs.forEach((img, i) =>
        jobs.push({ url: img.url, dest: path.join(OUT_DIR, 'images/pages', pageId, `${pad(i)}-${img.file}`) })
      );
    }
    let fresh = 0;
    await pool(jobs, async (j) => {
      if (await downloadTo(j.url, j.dest)) fresh++;
    });
    console.log(`✓ images: ${jobs.length} total, ${fresh} downloaded, ${jobs.length - fresh} already present`);
  }

  if (seedAssets) {
    // Gallery slots: assets-src/gallery/<slug>/ ← every album image (owner replaces later, D-5).
    for (const a of albums) {
      const src = path.join(OUT_DIR, 'images/gallery', a.slug);
      const dest = path.join(ASSETS_SRC, 'gallery', a.slug);
      await mkdir(dest, { recursive: true });
      for (const f of await readdir(src)) await copyFile(path.join(src, f), path.join(dest, f));
    }
    console.log(`✓ seeded assets-src/gallery for ${albums.length} albums (hero/rental/about are seeded by SEED_MAP)`);
    for (const [slot, from] of Object.entries(SEED_MAP)) {
      const dest = path.join(ASSETS_SRC, slot);
      await mkdir(dest, { recursive: true });
      for (const rel of from) await copyFile(path.join(OUT_DIR, 'images', rel), path.join(dest, path.basename(rel)));
    }
    console.log(`✓ seeded ${Object.keys(SEED_MAP).length} non-gallery slots`);
  }
};

/**
 * Non-gallery slots → archive files (relative to references/legacy/images/).
 * Chosen by eye from the archive (R-2); the owner replaces these later (D-5).
 */
const SEED_MAP: Record<string, string[]> = {
  hero: ['gallery/orsi-anti/03-Orsi - Anti-18.jpg'],
  about: ['pages/about/02-MJF_0138.jpg', 'pages/home/01-10.jpeg'],
  'rental/_page': ['pages/rental/01-KKF_00665.jpg'],
  'rental/wooden-arch': ['pages/rental/02-Auswahl_FioreVera-91.jpeg'],
  'rental/birch-arch': ['pages/rental/03-IMG_20221015_092353-2.jpg'],
  'rental/gold-flower-stands': [
    'pages/rental/04-SzL0008 (1).jpeg',
    'pages/rental/05-418696857_762197002046422_6264611722710801081_n.jpeg',
  ],
  'rental/cylinder-vase-set': ['pages/rental/06-Bildschirmfoto 2024-02-02 um 16.54.00.png'],
  'rental/gold-candle-holder-set': ['pages/rental/07-Bildschirmfoto 2024-02-09 um 06.52.55.png'],
  'rental/champagne-wall': ['pages/rental/08-IMG_1211.jpeg'],
  'rental/wedding-mirror': ['pages/rental/09-image0 (5).jpeg'],
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
