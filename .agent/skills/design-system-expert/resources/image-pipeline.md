# Image pipeline — `scripts/optimize-images.js` (MASTER-PLAN 0.2, PRD D-5)

Run: `npm run optimize:assets` (add `--force` to re-encode unchanged sources). Requires `assets-src/`; if missing, `npm run archive:legacy -- --seed-assets` restores it from the Webnode archive.

## Slots

| Source folder | Output folder | Mode |
|---|---|---|
| `assets-src/brand/` | `public/assets/brand/` | lossless-ish webp q90, alpha kept, **one** file (`srcMedium`/`srcSmall` = `src`) |
| `assets-src/hero/` | `public/assets/hero/` | photo |
| `assets-src/about/` | `public/assets/about/` | photo |
| `assets-src/gallery/<album>/` | `public/assets/gallery/<album>/` | photo, one sub-folder per album slug |
| `assets-src/rental/<item>/` | `public/assets/rental/<item>/` | photo, one sub-folder per rental `id` (`_page` = rental page hero) |

Output names: `NN-<slugified-source-name>` where `NN` is the 1-based position in the alphabetically sorted source folder — so ordering = file naming in the source folder, and the cover is `coverIndex` in `src/data/albums.ts`, not a filename.

## Tiers (photo mode)

| Tier | File | Long edge | Budget | Picked by |
|---|---|---|---|---|
| full | `NN-name.webp` (`src`) | ≤ 1920 px | ≤ 200 KB | desktop, hero/OG |
| medium | `NN-name-w1280.webp` (`srcMedium`) | ≤ 1280 px | ≤ 200 KB | phones at DPR 2–3 (QA M13) |
| small | `NN-name-w800.webp` (`srcSmall`) | ≤ 800 px | ≤ 200 KB | narrow layouts, teaser grid |

Encoder: `sharp().rotate().resize({ fit: 'inside', withoutEnlargement: true })`, webp quality stepping 82 → 34 in steps of 6; if still over budget the edge shrinks by 15 % and retries (max 6 rounds). Unchanged sources are skipped (mtime), orphaned outputs are deleted.

## Manifest — `src/data/generated/imageMeta.ts` (generated, never hand-edited)

```ts
export interface ImageAsset { src: string; srcMedium: string; srcSmall: string; width: number; height: number }
export interface ImageMeta { hero: ImageAsset[]; about: ImageAsset[]; brand: ImageAsset[]; gallery: Record<string, ImageAsset[]>; rental: Record<string, ImageAsset[]> }
export const IMAGE_META: ImageMeta = { … };
```

`width`/`height` are those of the full tier; `Picture` writes them as attributes so there is no CLS. `tests/unit/assets.test.ts` checks that `public/assets/` (minus `lockscreen/`) ships only webp ≤ 200 KB and that every manifest entry points at an existing file with dimensions.

## Rendering — `src/components/Common/Picture.tsx`

```tsx
// HomeHero.tsx — the LCP image
<Picture asset={hero} alt="" priority className={styles.heroImg} sizes="100vw" />
// a 4-up teaser grid item: tell the browser the rendered width, not 100vw
<Picture asset={img} alt={alt} sizes="(min-width: 48rem) 25vw, 50vw" />
```

- `srcset` = `srcSmall 800w, srcMedium 1280w, src {width}w`; the browser picks by `sizes` × DPR, so **set `sizes` to the rendered width**, not `100vw` by default for grid items.
- `priority` → `loading="eager" decoding="sync" fetchpriority="high"` (the LCP image only: home hero, first gallery cover). Everything else lazy.
- Hero/OG: `SeoHead.tsx` uses `IMAGE_META.hero[0].src`.

## Rules
- Never place a file in `public/assets/` by hand; never reference `/assets/...` paths in TSX or data.
- A new album = new folder under `assets-src/gallery/`, entry in `src/data/albums.ts` (Zod-validated), locale keys for couple/venue, run the script, pick `coverIndex`.
- `public/assets/lockscreen/` is outside this pipeline (PNG, > 200 KB allowed, see `lockscreen-qr-generator`).
