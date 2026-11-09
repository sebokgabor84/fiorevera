/**
 * scripts/favicon/variants.ts
 *
 * The favicon design round of 2026-11-09 as data: every variant shown to the owner, with
 * its SVG, rationale and honest critique. scripts/favicon-variants.ts renders this into
 * docs/design/favicon-variants.html; scripts/generate-favicons.ts can ship any entry with
 * `--from <id>`. Add a round by appending entries — never silently edit a shipped one.
 */

import { COLOURWAYS, TOKENS, crestSvg, glyph, glyphWidth, monogram, monogramCrest, singleLetterCrest, tile, wrapSvg } from './crest';

export interface FaviconVariant {
  /** Stable id, also the `--from` argument of scripts/generate-favicons.ts. */
  id: string;
  /** Short label on the review page (A, B, … F1, G2). */
  label: string;
  name: string;
  rationale: readonly [string, string];
  critique: string;
  svg: string;
}

const { linen, sage, blush, gold, ink } = TOKENS;

// A — FV monogram, Cormorant Garamond 600, gold hairline rule
function monogramPlain(): string {
  const cap = 30;
  const total = glyphWidth('F', 600, cap) + 1.5 + glyphWidth('V', 600, cap);
  const x0 = (64 - total) / 2;
  return wrapSvg([
    tile(),
    ...monogram('FV', 600, cap, 47, 1.5, ink),
    `  <rect x="${(x0 + 1).toFixed(2)}" y="51.5" width="${(total - 2).toFixed(2)}" height="1.4" fill="${gold}"/>`,
  ]);
}

// B — magnolia after the badge bloom, blush petals with ink edges
function magnolia(): string {
  const petal = (cx: number, cy: number, rx: number, ry: number, rot: number): string =>
    `    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  return wrapSvg([
    tile(),
    `  <g fill="${blush}" stroke="${ink}" stroke-width="3">`,
    petal(22.5, 22.5, 6.6, 12.5, -30),
    petal(41.5, 22.5, 6.6, 12.5, 30),
    petal(32, 19, 6.8, 13.5, 0),
    petal(16.5, 38.5, 12.5, 6.2, -28),
    petal(47.5, 38.5, 12.5, 6.2, 28),
    `  </g>`,
    `  <path d="M22 31 C20 43.5 25.5 51 32 51 C38.5 51 44 43.5 42 31 C38 36 26 36 22 31 Z" fill="${blush}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
    `  <ellipse cx="32" cy="35.6" rx="2.6" ry="2.1" fill="${gold}"/>`,
  ]);
}

// C — V with a eucalyptus sprig
function sprigV(): string {
  const cap = 34;
  const x0 = (64 - glyphWidth('V', 600, cap)) / 2;
  const leaf = (cx: number, cy: number, rot: number): string =>
    `    <ellipse cx="${cx}" cy="${cy}" rx="4" ry="2.7" transform="rotate(${rot} ${cx} ${cy})"/>`;
  return wrapSvg([
    tile(),
    glyph('V', 600, x0, 51, cap, ink),
    `  <path d="M32.5 47.5 C31 40 31.5 32 33 26 C34 22 35.5 19 37.5 16" fill="none" stroke="${sage}" stroke-width="2.2" stroke-linecap="round"/>`,
    `  <g fill="${sage}">`,
    leaf(28.6, 41.5, -42),
    leaf(35.8, 37.6, 38),
    leaf(28.8, 33.6, -45),
    leaf(37.4, 30, 36),
    leaf(30.6, 25.8, -50),
    leaf(39.6, 22.6, 30),
    `    <ellipse cx="38.6" cy="15.4" rx="2.3" ry="3.4" transform="rotate(28 38.6 15.4)"/>`,
    `  </g>`,
  ]);
}

// D — gold petal rosette on an ink disc
function rosette(): string {
  const petals: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -90 + i * 72;
    const r = 13.5;
    const cx = 32 + r * Math.cos((a * Math.PI) / 180);
    const cy = 32 + r * Math.sin((a * Math.PI) / 180);
    petals.push(`    <ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="12.5" ry="5.6" transform="rotate(${a} ${cx.toFixed(2)} ${cy.toFixed(2)})"/>`);
  }
  return wrapSvg([
    `  <circle cx="32" cy="32" r="31" fill="${ink}"/>`,
    `  <circle cx="32" cy="32" r="28" fill="none" stroke="${gold}" stroke-width="1.2"/>`,
    `  <g fill="none" stroke="${gold}" stroke-width="2.8">`,
    ...petals,
    `  </g>`,
    `  <circle cx="32" cy="32" r="3.2" fill="${gold}"/>`,
  ]);
}

/** The variant currently in public/favicon.svg (owner's pick, 2026-11-09). */
export const SHIPPED_VARIANT_ID = 'crest-fv-sage';

export const VARIANTS: readonly FaviconVariant[] = [
  {
    id: 'monogram-fv',
    label: 'A',
    name: 'Monogram — FV in Cormorant Garamond',
    rationale: [
      'The site’s heading face at weight 600 (the header wordmark’s weight), set as a two-letter monogram on a linen tile, with a gold hairline rule echoing the header’s gold borders.',
      'Letters are converted to paths — no live font at render time.',
    ],
    critique:
      'Most legible of the five at 16 px and unmistakably typographic. It says “the site”, not “the badge”: Cormorant is the website’s face, while the badge uses calligraphy. FV monograms are a wedding-stationery cliché; what rescues this one is the exact face and weight. Safe, slightly impersonal.',
    svg: monogramPlain(),
  },
  {
    id: 'magnolia',
    label: 'B',
    name: 'Magnolia — the badge’s bloom as a silhouette',
    rationale: [
      'The open magnolia drawn at the bottom of the brand badge, reduced to five blush petals with ink edges, a cupped front petal and a gold stamen.',
      'The only variant that is literally the badge’s flower. Hand-drawn from the badge crop, not from a stock daisy.',
    ],
    critique:
      'At 16 px the ink edges and blush fills blend into a pinkish-brown bloom — still clearly a flower, but the petal count and the cup are gone, and the shape leans lily/orchid rather than magnolia. From 48 px up it is the most ownable image here. The badge’s charm is its fine line work, and that is exactly what cannot survive a tab icon — so this is the badge’s subject, not its drawing.',
    svg: magnolia(),
  },
  {
    id: 'sprig-v',
    label: 'C',
    name: 'Letter + botanical — V with a eucalyptus sprig',
    rationale: [
      'Vera’s V in Cormorant Garamond 600; a eucalyptus sprig grows out of the vertex, borrowing the foliage that wraps the badge.',
      'Letterform for legibility, leaf for warmth.',
    ],
    critique:
      'The V reads at 16 px; the sprig becomes a sage smudge — harmless texture, but it adds nothing at tab size. At 180 px the sprig is the charm and also the risk: drawn leaves tip towards cute. Two ideas in one mark; A and E are cleaner.',
    svg: sprigV(),
  },
  {
    id: 'rosette',
    label: 'D',
    name: 'Geometric — gold petal rosette on ink',
    rationale: [
      'Five petals built from the header’s gold hairlines inside a hairline ring on an ink disc — the lockscreen’s gold ring and its dark “ink editorial” edition translated to a tab.',
      'The brief’s geometric direction.',
    ],
    critique:
      'Highest contrast on a light tab strip, but on a dark strip the ink disc melts into the chrome and only the gold ring is left. More importantly it is the most generic of the five — overlapping-circle rosettes are stock “luxury” iconography — and it breaks the design skill’s mood veto on dark surfaces. Shown because the brief asked for it; not recommended.',
    svg: rosette(),
  },
  {
    id: 'crest-v',
    label: 'E',
    name: 'Crest — the badge’s arc and dots, bold V',
    rationale: [
      'The badge’s own frame — the open arc with three trailing dots on each side — and a bold Cormorant Garamond V where the badge puts the name.',
      'Ink on linen, strokes sized for 16 px: the badge’s composition, not its line drawing.',
    ],
    critique:
      'Arc and V survive 16 px cleanly; the dots blur into a dotted rhythm, which is fine. Anyone who has seen the badge, the header logo or the lockscreen connects it instantly — it is the one element nobody else owns. Weaknesses: at 16 px the arc can read as a gauge, and the single V says “Vera”, not “Fiore Vera”.',
    svg: crestSvg(singleLetterCrest('V')),
  },
  {
    id: 'crest-fv',
    label: 'F',
    name: 'A + E combined — the crest framing the FV monogram',
    rationale: [
      'The badge’s open arc and trailing dots from E, with the two-letter Cormorant Garamond monogram from A (weight 700) where the badge carries the name.',
      'Arc enlarged and dots pushed outward so the letters keep clear air; ink on linen, no hairlines.',
    ],
    critique:
      'Owner-requested hybrid. At 32 px and above it is the richest mark of the set and the closest to the badge’s composition. The cost is at 16 px: to fit two letters inside the arc the cap height drops from 28 to 22 units, so “FV” becomes a dark bar under the arc — the crest is still recognisable, the letters are not readable. If 16 px legibility is the priority, E alone wins; if the apple-touch and bookmark sizes matter more, this does.',
    svg: crestSvg(monogramCrest('FV')),
  },
  {
    id: 'crest-fv-blush-sage',
    label: 'F1',
    name: 'F colourway — blush tile, sage arc, gold dots',
    rationale: [
      'Blush tile, sage arc, gold dots, ink letters: three brand colours on one mark, the way the printed badge pairs blush petals with sage leaves and gold.',
      'Owner asked for more colour, not a rainbow — this is the most colourful fit that stays inside the four brand tints.',
    ],
    critique:
      'Reads as a warm pink tile at 16 px, which stands out on both light and dark strips. The sage arc on blush is only ~2.3:1 contrast, so at 16 px the arc softens to a hint while the ink letters carry the shape; from 32 px up everything is there. Recommended colourway if colour is the goal.',
    svg: crestSvg(monogramCrest('FV', 'blushSage')),
  },
  {
    id: 'crest-fv-blush-ink',
    label: 'F2',
    name: 'F colourway — blush tile, ink arc, gold dots',
    rationale: ['Same blush tile, but arc and letters both in ink; only the dots go gold.', 'Colour from the tile, structure from the ink.'],
    critique:
      'The sturdiest coloured version at 16 px — arc and letters stay crisp on the blush. Less playful than F1, but nothing is lost on rasterisation. Fallback if F1’s sage arc feels too faint on a tab.',
    svg: crestSvg(monogramCrest('FV', 'blushInk')),
  },
  {
    id: 'crest-fv-sage',
    label: 'F3',
    name: 'F colourway — sage tile, linen letters, gold and blush dots',
    rationale: ['Inverted: sage tile, linen arc and letters, gold and blush dots.', 'The “botanical” reading of the brand; distinct from every neighbouring tab.'],
    critique:
      'Strong silhouette at every size and the clearest on a dark strip. Linen on sage is ~3.3:1, so the letters go soft at 16 px, and a green tile moves the brand feel towards garden/organic rather than wedding-romantic. Good, but less “Fiore Vera” than the blush tiles.',
    svg: crestSvg(monogramCrest('FV', 'sage')),
  },
  {
    id: 'crest-fv-ink',
    label: 'F4',
    name: 'F colourway — ink tile, gold arc, linen letters, blush dots',
    rationale: ['The lockscreen’s shipped “ink editorial” palette: ink ground, gold arc, linen letters, blush dots.', 'Included because that edition is already the brand’s dark face.'],
    critique:
      'Most premium-looking and sharpest at 16 px on a light strip; on a dark strip the tile edge merges with the chrome and only arc and letters float. It is the one exception to the design skill’s “no dark surfaces” veto — defensible because the lockscreen already made it, but it is a decision, not a default.',
    svg: crestSvg(monogramCrest('FV', 'inkEditorial')),
  },
  {
    id: 'crest-clef-bars',
    label: 'G1',
    name: 'Crest — F as a treble clef, clef first',
    rationale: [
      'The badge frame with the F drawn as a violin key: a full treble clef whose stem carries the two F bars.',
      'Owner’s brief: the family crest always carries a letter, and for Fiore Vera the letter is an F shaped like a violin key.',
    ],
    critique:
      'Unmistakably a treble clef at every size, which is the point and the risk: at 16 px the F bars merge with the clef’s hook, so a stranger reads “music site”, not “F”. If Vera’s story has music in it, this is the most personal mark of the round; if not, it says something the site never explains.',
    svg: crestSvg({ kind: 'clef', style: 'clef-bars', colourway: 'ink' }),
  },
  {
    id: 'crest-clef-stem-bar',
    label: 'G2',
    name: 'Crest — F as a treble clef, letter first',
    rationale: [
      'Same frame; the clef’s top hook is straightened into the F’s top bar and the spiral branches off the stem.',
      'The F reads first, the violin key second — the letter is the crest’s subject, the clef its character.',
    ],
    critique:
      'The strongest “F” of the clef family: the top bar and the middle bar sit where an F has them, and the spiral and bottom curl make it a clef only on a second look. At 16 px it is a bold F with a loop — still legible as a letter. Best balance of the owner’s two requirements.',
    svg: crestSvg({ kind: 'clef', style: 'stem-bar', colourway: 'ink' }),
  },
  {
    id: 'crest-clef-stem-bar-blush-sage',
    label: 'G3',
    name: 'G2 in the F1 colourway — blush tile, sage arc, gold dots',
    rationale: ['G2 with the blush tile, sage arc and gold dots the owner liked on F1.', 'Colour on the frame and tile only; the clef stays ink so it survives 16 px.'],
    critique:
      'Carries the colour without touching the letter’s contrast, so it loses nothing at 16 px versus G2 and gains the warm tile on both strips. The sage arc fades at 16 px as on F1. If the clef direction is chosen, this is the colourway to ship.',
    svg: crestSvg({ kind: 'clef', style: 'stem-bar', colourway: 'blushSage' }),
  },
];

export const RECOMMENDATION = `
<p><strong>E (the crest)</strong>, with <strong>A (the monogram)</strong> as runner-up, for a pure 16 px tab icon. <strong>F (A + E combined)</strong>, added on request, is the best choice if the 180 px and larger sizes matter more than the 16 px tab — see its critique. For a <strong>more colourful F</strong>, F1 (blush tile, sage arc, gold dots) is my pick: it uses three brand tints without reading as a rainbow; F2 is the same tile with a sturdier ink arc for 16 px; F3 and F4 are the sage and ink grounds. Two further colourways (gold arc or sage arc on plain linen) were tested and dropped: their accents vanish at 16 px on a light tab strip.</p>
<p>The <strong>treble-clef F</strong> (G1–G3) answers the owner’s crest brief: a family “címer” that always carries a letter. <strong>G2</strong> is the version where the F stays a letter at 16 px; G3 is G2 in the F1 colourway and is what I would ship if the clef direction wins. Honest reservation: a violin key is a strong statement — it says music before it says flowers, and nothing on the site explains it. If there is a music story behind Fiore Vera, it is the most personal mark of the whole round; if there is not, F1 is the safer crest.</p>
<p><strong>Decision (2026-11-09): the owner picked F3 (<code>crest-fv-sage</code>), now shipped.</strong></p>
<p>Pick a label (or ask for a tweak) and <code>npm run favicon -- --from &lt;id&gt;</code> ships it across <code>favicon.svg</code>, the PNG sizes, the apple-touch and android-chrome icons.</p>
`;

/** Named palette for the review page’s legend. */
export const PALETTE_NOTE = `Palette: linen ${linen}, sage ${sage}, blush ${blush}, gold ${gold}, ink ${ink}. Colourways: ${Object.keys(COLOURWAYS).join(', ')}.`;
