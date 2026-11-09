/**
 * scripts/favicon/crest.ts
 *
 * Side-effect-free builder for the Fiore Vera favicon "címer" (family crest): a 64-unit
 * SVG tile carrying the brand badge's frame — the open arc with three trailing dots on
 * each side — and a letter. Letters are either Cormorant Garamond outlines (see
 * ./glyphs.ts) or the hand-drawn treble-clef F. Every colour is one of the five locked
 * brand tokens; no gradients, no filters, no live fonts — everything must survive a
 * 16 px rasterisation (checked by scripts/favicon-variants.ts).
 *
 * Owned by the `favicon-builder` skill (.agent/skills/favicon-builder/SKILL.md).
 */

import { GLYPHS, type GlyphKey } from './glyphs';

// ── Brand tokens (src/styles/tokens.css) ─────────────────────────────────────
export const TOKENS = {
  linen: '#faf7f2',
  sage: '#7a8b7b',
  blush: '#e8c5c8',
  gold: '#d4af37',
  ink: '#2c2825',
} as const;
export type TokenName = keyof typeof TOKENS;

export interface Colourway {
  tile: TokenName;
  arc: TokenName;
  letter: TokenName;
  dots: readonly [TokenName, TokenName, TokenName];
}

export const COLOURWAYS = {
  ink: { tile: 'linen', arc: 'ink', letter: 'ink', dots: ['ink', 'ink', 'ink'] },
  blushSage: { tile: 'blush', arc: 'sage', letter: 'ink', dots: ['gold', 'gold', 'gold'] },
  blushInk: { tile: 'blush', arc: 'ink', letter: 'ink', dots: ['gold', 'gold', 'gold'] },
  sage: { tile: 'sage', arc: 'linen', letter: 'linen', dots: ['gold', 'blush', 'gold'] },
  inkEditorial: { tile: 'ink', arc: 'gold', letter: 'linen', dots: ['blush', 'blush', 'blush'] },
} as const satisfies Record<string, Colourway>;
export type ColourwayName = keyof typeof COLOURWAYS;

// ── Primitives ───────────────────────────────────────────────────────────────
const VIEWBOX = 64;
const num = (n: number): string => (Math.round(n * 100) / 100).toString();

export const wrapSvg = (body: readonly string[]): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}">\n${body.join('\n')}\n</svg>\n`;

export const tile = (fill: string = TOKENS.linen, rx = 14): string =>
  `  <rect width="${VIEWBOX}" height="${VIEWBOX}" rx="${rx}" fill="${fill}"/>`;

/** Cormorant Garamond cap height in font units. */
const CAP_UNITS = 625;

export type GlyphWeight = 600 | 700;

function glyphKey(weight: GlyphWeight, ch: string): GlyphKey {
  const key = `regular-${weight}-${ch}`;
  if (!(key in GLYPHS)) {
    throw new Error(
      `No outline for "${ch}" at weight ${weight}. Run scripts/favicon/extract-glyphs.py to add it to scripts/favicon/glyphs.ts.`,
    );
  }
  return key as GlyphKey;
}

/** Width of a glyph's bounding box when its cap height is scaled to `capH` units. */
export function glyphWidth(ch: string, weight: GlyphWeight, capH: number): number {
  const g = GLYPHS[glyphKey(weight, ch)];
  return ((g.bounds[2] - g.bounds[0]) * capH) / CAP_UNITS;
}

/** Place a glyph with its bbox left edge at `x`, baseline at `baseY`, cap height `capH`. */
export function glyph(ch: string, weight: GlyphWeight, x: number, baseY: number, capH: number, fill: string): string {
  const g = GLYPHS[glyphKey(weight, ch)];
  const s = capH / CAP_UNITS;
  const tx = x - g.bounds[0] * s;
  return `  <path transform="translate(${num(tx)} ${num(baseY)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" fill="${fill}" d="${g.d}"/>`;
}

/** Centred run of letters on one baseline. */
export function monogram(letters: string, weight: GlyphWeight, capH: number, baseY: number, gap: number, fill: string): string[] {
  const chars = [...letters];
  const widths = chars.map((ch) => glyphWidth(ch, weight, capH));
  const total = widths.reduce((a, w) => a + w, 0) + gap * (chars.length - 1);
  let x = (VIEWBOX - total) / 2;
  return chars.map((ch, i) => {
    const out = glyph(ch, weight, x, baseY, capH, fill);
    x += widths[i] + gap;
    return out;
  });
}

// ── The crest frame: open arc + three trailing dots per side ─────────────────
export interface FrameGeometry {
  /** Arc radius. */
  radius: number;
  /** Arc centre y (x is always 32). */
  centreY: number;
  /** Push the dot columns outward by this many units. */
  dotShift: number;
  /** Scale factor for the dot radii (3 / 2.4 / 1.8). */
  dotScale: number;
}

/** Frame used by the FV crest and the clef crests. */
export const FRAME_WIDE: FrameGeometry = { radius: 27, centreY: 38, dotShift: 2.6, dotScale: 0.9 };
/** Tighter frame used by the single-letter crest (variant E). */
export const FRAME_TIGHT: FrameGeometry = { radius: 25, centreY: 36, dotShift: 0, dotScale: 1 };

export function frame(c: Colourway, geo: FrameGeometry = FRAME_WIDE): string[] {
  const cx = VIEWBOX / 2;
  const polar = (deg: number): [number, number] => [
    cx + geo.radius * Math.cos((deg * Math.PI) / 180),
    geo.centreY + geo.radius * Math.sin((deg * Math.PI) / 180),
  ];
  const [ax, ay] = polar(200);
  const [bx, by] = polar(340);
  const oy = geo.centreY - 36;
  const dot = (x: number, y: number, r: number, fill: TokenName): string =>
    `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r * geo.dotScale)}" fill="${TOKENS[fill]}"/>`;
  const left = [
    dot(7.4 - geo.dotShift, 35.5 + oy, 3, c.dots[0]),
    dot(9.3 - geo.dotShift, 43 + oy, 2.4, c.dots[1]),
    dot(12.6 - geo.dotShift, 49.8 + oy, 1.8, c.dots[2]),
  ];
  const right = [
    dot(56.6 + geo.dotShift, 35.5 + oy, 3, c.dots[0]),
    dot(54.7 + geo.dotShift, 43 + oy, 2.4, c.dots[1]),
    dot(51.4 + geo.dotShift, 49.8 + oy, 1.8, c.dots[2]),
  ];
  return [
    `  <path d="M${num(ax)} ${num(ay)} A${geo.radius} ${geo.radius} 0 0 1 ${num(bx)} ${num(by)}" fill="none" stroke="${TOKENS[c.arc]}" stroke-width="4.2" stroke-linecap="round"/>`,
    `  ${left.join('')}`,
    `  ${right.join('')}`,
  ];
}

// ── Letter styles ────────────────────────────────────────────────────────────
export type ClefStyle = 'clef-bars' | 'stem-bar';

/**
 * The F drawn as a treble clef (violin key). `clef-bars`: a full clef with the two F bars
 * crossing the stem. `stem-bar`: the clef's top hook is straightened into the F's top bar
 * and the spiral branches off the stem — the F reads first, the clef second.
 */
export function clefLetter(style: ClefStyle, fill: string, strokeWidth = 4.4): string[] {
  const stroke = `fill="none" stroke="${fill}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;
  if (style === 'clef-bars') {
    return [
      `  <path d="M27.5 56.5 C27.5 59.5 31 60.5 32.2 58 C33 56 32.8 52 32.6 48 L33.8 16 C34 12.5 37.5 12 38.6 15 C40 19 36.5 23.5 33.5 27 C28.5 32.5 23 36 23.5 43 C24 49 30 52.5 35 51 C39.5 49.5 41 44 38.5 40.5 C36 37 30.5 38 30.5 42.5" ${stroke}/>`,
      `  <path d="M33.6 22 H48 M33 34 H45" ${stroke}/>`,
    ];
  }
  return [
    `  <path d="M27.5 56.5 C27.5 59.5 31 60.5 32.2 58 C33 56 32.8 52 32.6 48 L33.8 16.5 C36 16 42 15.8 48.5 17.2" ${stroke}/>`,
    `  <path d="M33.4 26.5 C28.5 32 23 36 23.5 43 C24 49 30 52.5 35 51 C39.5 49.5 41 44 38.5 40.5 C36 37 30.5 38 30.5 42.5" ${stroke}/>`,
    `  <path d="M33.2 30.5 H44.5" ${stroke}/>`,
  ];
}

// ── Crest compositions ───────────────────────────────────────────────────────
export interface MonogramCrestSpec {
  kind: 'monogram';
  letters: string;
  weight: GlyphWeight;
  capH: number;
  baseY: number;
  gap: number;
  frame: FrameGeometry;
  colourway: ColourwayName;
}
export interface ClefCrestSpec {
  kind: 'clef';
  style: ClefStyle;
  strokeWidth?: number;
  colourway: ColourwayName;
}
export type CrestSpec = MonogramCrestSpec | ClefCrestSpec;

export function crestSvg(spec: CrestSpec): string {
  const c = COLOURWAYS[spec.colourway];
  const letterFill = TOKENS[c.letter];
  const body = [tile(TOKENS[c.tile])];
  if (spec.kind === 'monogram') {
    body.push(...frame(c, spec.frame));
    body.push(...monogram(spec.letters, spec.weight, spec.capH, spec.baseY, spec.gap, letterFill));
  } else {
    body.push(...frame(c, FRAME_WIDE));
    body.push(...clefLetter(spec.style, letterFill, spec.strokeWidth));
  }
  return wrapSvg(body);
}

/** Single bold letter under the tight frame (variant E). */
export const singleLetterCrest = (letter: string, colourway: ColourwayName = 'ink'): CrestSpec => ({
  kind: 'monogram',
  letters: letter,
  weight: 700,
  capH: 28,
  baseY: 53,
  gap: 0,
  frame: FRAME_TIGHT,
  colourway,
});

/** Two-letter monogram under the wide frame (variant F and its colourways). */
export const monogramCrest = (letters: string, colourway: ColourwayName = 'ink'): CrestSpec => ({
  kind: 'monogram',
  letters,
  weight: 700,
  capH: 22,
  baseY: 54,
  gap: 1,
  frame: FRAME_WIDE,
  colourway,
});
