import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Font coverage gate. The site ships its own font files, cut down to the characters it needs
 * (`unicode-range` in src/styles/fonts.css says which characters each file is for). A character
 * outside every range of a font is drawn in whatever system font the visitor's device picks — one
 * odd-looking letter in the middle of a heading, and no other gate sees it.
 *
 * Red here means: the copy (or a name in src/data, or a literal in a component) uses a character the
 * fonts do not declare. Either use a character the fonts have, or extend the font subset AND the
 * matching `unicode-range` (scripts/subset-fonts.mjs keeps the list once the subsetting work is on
 * main), rebuild, and look at the page. Do not widen a range without the glyph being in the file.
 *
 * Limit of this test: it reads the declared ranges, it does not open the .woff2 files. That the files
 * really contain the declared characters is the subsetting script's job.
 */
type Range = [from: number, to: number];
interface Face {
  family: string;
  style: string;
  /** null = no unicode-range declared: the face is used for every character. */
  ranges: Range[] | null;
}

const parseUnicodeRange = (value: string): Range[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = /^U\+([0-9A-F?]{1,6})(?:-([0-9A-F]{1,6}))?$/i.exec(part);
      if (!m) throw new Error(`cannot read unicode-range part "${part}"`);
      if (m[1].includes('?')) return [parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[1].replace(/\?/g, 'F'), 16)];
      return [parseInt(m[1], 16), parseInt(m[2] ?? m[1], 16)];
    });

const parseFontFaces = (css: string): Face[] =>
  Array.from(css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@font-face\s*\{([^}]*)\}/g), ([, body]) => {
    const prop = (name: string): string | undefined => new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, 'i').exec(body)?.[1].trim();
    const family = prop('font-family')?.replace(/^['"]|['"]$/g, '');
    if (!family) throw new Error(`@font-face without font-family: ${body.trim().slice(0, 60)}`);
    const range = prop('unicode-range');
    return { family, style: prop('font-style') ?? 'normal', ranges: range ? parseUnicodeRange(range) : null };
  });

/** Characters no text font is expected to carry: control characters (line breaks, tabs) and emoji with their joiners. */
const isExempt = (ch: string): boolean => ch.codePointAt(0)! < 0x20 || /\p{Extended_Pictographic}/u.test(ch) || ch === '️' || ch === '‍';

/** For every font family and style: the used characters that none of its files declares. */
const uncovered = (faces: Face[], used: Map<string, string>): string[] => {
  const groups = new Map<string, Face[]>();
  for (const face of faces) groups.set(`${face.family} (${face.style})`, [...(groups.get(`${face.family} (${face.style})`) ?? []), face]);
  const out: string[] = [];
  for (const [group, members] of groups) {
    if (members.some((m) => m.ranges === null)) continue;
    const ranges = members.flatMap((m) => m.ranges ?? []);
    for (const [ch, where] of used) {
      const code = ch.codePointAt(0)!;
      if (isExempt(ch) || ranges.some(([from, to]) => code >= from && code <= to)) continue;
      out.push(`"${ch}" (U+${code.toString(16).toUpperCase().padStart(4, '0')}), used in ${where}, is outside every unicode-range of ${group}`);
    }
  }
  return out;
};

/** Every character the site can render from the repository: all copy, plus literals and names in src/. */
const usedCharacters = (): Map<string, string> => {
  const used = new Map<string, string>();
  const note = (text: string, where: string): void => {
    for (const ch of text) if (!used.has(ch)) used.set(ch, where);
  };
  const strings = (node: unknown, where: string): void => {
    if (typeof node === 'string') note(node, where);
    else if (node && typeof node === 'object') for (const value of Object.values(node)) strings(value, where);
  };
  for (const locale of ['hu', 'de', 'en']) {
    const file = `src/i18n/locales/${locale}.json`;
    strings(JSON.parse(readFileSync(path.resolve(file), 'utf8')), file);
  }
  // Names in src/data and literals in components (e.g. "Sebőkné", "©", "→"). Comments are not rendered.
  const walk = (dir: string): void => {
    for (const entry of readdirSync(path.resolve(dir))) {
      const rel = path.join(dir, entry);
      if (statSync(path.resolve(rel)).isDirectory()) {
        if (entry !== 'generated') walk(rel);
      } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        const code = readFileSync(path.resolve(rel), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '')
          .replace(/\s\/\/\s.*$/gm, '');
        note(code, rel);
      }
    }
  };
  walk('src');
  return used;
};

const HOW =
  'The browser would draw it in a system font. Use a character the fonts have, or add it to the font subset (scripts/subset-fonts.mjs, once present) AND to the matching unicode-range in src/styles/fonts.css.';

describe('fonts: every character the site renders is declared in a font file (src/styles/fonts.css)', () => {
  const faces = parseFontFaces(readFileSync(path.resolve('src/styles/fonts.css'), 'utf8'));
  const used = usedCharacters();

  it('declares both brand families, upright, with a unicode-range per file', () => {
    const upright = new Set(faces.filter((f) => f.style === 'normal').map((f) => f.family));
    expect([...upright].sort()).toEqual(['Cormorant Garamond', 'Inter']);
    expect(faces.filter((f) => f.ranges === null).map((f) => f.family), 'a file without unicode-range is downloaded for every character').toEqual([]);
  });

  it('the copy in all three locales and every literal in src/ stay inside the declared ranges', () => {
    // Sanity: the scan really sees the characters this gate exists for.
    for (const ch of ['ő', 'ű', 'ß', 'ä', 'é', '–', '„']) expect(used.has(ch), `the scan found "${ch}"`).toBe(true);
    const missing = uncovered(faces, used);
    expect(missing, `${missing.join('\n')}\n\n${HOW}\n`).toEqual([]);
  });

  describe('the check itself (ranges in the format of the subsetted fonts)', () => {
    const subset = parseFontFaces(`
      /* latin-ext: only Ő ő Ű ű */
      @font-face { font-family: 'Inter'; font-style: normal; src: url('/fonts/inter-latin-ext.woff2') format('woff2'); unicode-range: U+0150-0151, U+0170-0171; }
      @font-face { font-family: 'Inter'; font-style: normal; src: url('/fonts/inter-latin.woff2') format('woff2'); unicode-range: U+0020-007E, U+00A0-00FF, U+2010-2027, U+20AC; }
      @font-face { font-family: 'Cormorant Garamond'; font-style: italic; src: url('/fonts/c-italic.woff2') format('woff2'); unicode-range: U+0020-007E; }
    `);
    const text = (s: string): Map<string, string> => new Map(Array.from(s, (ch) => [ch, 'fixture']));

    it('reads families, styles and ranges', () => {
      expect(subset.map((f) => `${f.family}/${f.style}/${f.ranges?.length}`)).toEqual(['Inter/normal/2', 'Inter/normal/4', 'Cormorant Garamond/italic/1']);
      expect(parseUnicodeRange('U+26, U+4??, U+0150-0151')).toEqual([[0x26, 0x26], [0x400, 0x4ff], [0x150, 0x151]]);
    });

    it('accepts Hungarian and German copy, reports a character from another alphabet per family', () => {
      const inter = subset.filter((f) => f.family === 'Inter');
      expect(uncovered(inter, text('Esküvői dekoráció – Blumenstrauß, „Größe“ € ű Ő'))).toEqual([]);
      const report = uncovered(inter, text('Dvořák, Łódź'));
      expect(report.map((r) => r.slice(0, 12))).toEqual(['"ř" (U+0159)', '"Ł" (U+0141)', '"ź" (U+017A)']);
      expect(report[0]).toContain('outside every unicode-range of Inter (normal)');
    });

    it('checks each family and style on its own, and skips emoji and line breaks', () => {
      expect(uncovered(subset, text('é'))).toEqual(['"é" (U+00E9), used in fixture, is outside every unicode-range of Cormorant Garamond (italic)']);
      expect(uncovered(subset, text('ok 🙂\n\t'))).toEqual([]);
    });
  });
});
