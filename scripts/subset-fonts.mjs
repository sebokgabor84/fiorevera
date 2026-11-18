/**
 * subset-fonts.mjs — web-vitals (PageSpeed 2026-11-16: four font preloads ≈ 200 KB sat on the
 * hero's critical path; the LCP breakdown showed an 800 ms element render delay).
 *
 * Generates public/fonts/*.woff2 from the committed originals in scripts/fonts-src/ (the
 * Google-Fonts latin / latin-ext slices of the variable fonts), keeping only the code points the
 * HU / DE / EN copy can use:
 *
 *   latin      → printable Latin-1 (U+0020–007E, U+00A0–00FF), general punctuation
 *                (U+2010–2027, U+2030–203A), € ™ arrows − ∕ and the BOM / replacement glyphs
 *   latin-ext  → the four Hungarian letters outside Latin-1: Ő ő Ű ű (U+0150-0151, U+0170-0171)
 *
 * The variable weight axis survives the subset (fvar/gvar kept). The @font-face unicode-range
 * values in src/styles/fonts.css MUST match these ranges — a glyph outside them silently falls
 * back to the system font. Re-run after swapping a source font:  node scripts/subset-fonts.mjs
 */
import subsetFont from 'subset-font';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('scripts/fonts-src');
const OUT = path.resolve('public/fonts');
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('');
const LATIN_TEXT =
  range(0x20, 0x7e) +
  range(0xa0, 0xff) +
  range(0x2010, 0x2027) +
  range(0x2030, 0x203a) +
  '€™←↑→↓−∕﻿�';
const LATIN_EXT_TEXT = 'ŐőŰű';

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => f.endsWith('.woff2')).sort();
  let before = 0;
  let after = 0;
  for (const f of files) {
    const src = await readFile(path.join(SRC, f));
    const text = f.includes('-ext') ? LATIN_EXT_TEXT : LATIN_TEXT;
    const out = await subsetFont(src, text, { targetFormat: 'woff2' });
    await writeFile(path.join(OUT, f), out);
    before += src.length;
    after += out.length;
    console.log(`✓ ${f}: ${(src.length / 1024).toFixed(1)} → ${(out.length / 1024).toFixed(1)} KB`);
  }
  console.log(`✓ ${files.length} fonts: ${(before / 1024).toFixed(0)} → ${(after / 1024).toFixed(0)} KB`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
