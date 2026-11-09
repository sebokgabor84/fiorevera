import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { IMAGE_META } from '../../src/data/generated/imageMeta';

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );

describe('image pipeline output (MASTER-PLAN 0.2)', () => {
  const files = walk(path.resolve('public/assets')).filter(
    (f) => !f.includes('/lockscreen/') && !path.basename(f).startsWith('.')
  );

  it('ships only webp ≤ 200 KB outside the lockscreen workspace', () => {
    // The original logo PNG is the committed brand source (macOS stores its name in NFD); everything else must be webp.
    const isBrandSource = (f: string) => path.basename(f).normalize('NFC').includes('logó');
    const offenders = files.filter((f) => !isBrandSource(f) && (!f.endsWith('.webp') || statSync(f).size > 200 * 1024));
    expect(offenders).toEqual([]);
  });

  it('references only files that exist, with dimensions', () => {
    const all = [
      ...IMAGE_META.hero,
      ...IMAGE_META.about,
      ...IMAGE_META.brand,
      ...Object.values(IMAGE_META.gallery).flat(),
      ...Object.values(IMAGE_META.rental).flat(),
    ];
    expect(all.length).toBeGreaterThan(180);
    for (const a of all) {
      expect(a.width).toBeGreaterThan(0);
      expect(a.height).toBeGreaterThan(0);
      expect(statSync(path.resolve('public', a.src.slice(1))).size).toBeGreaterThan(0);
      expect(statSync(path.resolve('public', a.srcSmall.slice(1))).size).toBeGreaterThan(0);
    }
  });
});
