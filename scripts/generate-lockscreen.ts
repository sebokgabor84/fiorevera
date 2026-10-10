/**
 * generate-lockscreen.ts
 *
 * Composites the Fiore Vera iPhone lock screen wallpaper.
 *
 * Inputs (in public/assets/lockscreen/):
 *   lockscreen-bg.jpg  — AI-generated background with botanical wreath frame + gold ring badge holder
 *   qr-fiorevera.png   — Deterministic QR code for https://www.fiorevera.hu (error-correction H)
 *   logo-badge.jpg     — Elevated Fiore Vera logo badge (watercolor, colour)
 *
 * Output:
 *   public/assets/lockscreen/fiore-vera-lockscreen-final.png
 *
 * Usage:
 *   npm run lockscreen
 *
 * Layout (all coords at 768×1376 native background resolution):
 *   White canvas square: x≈232 y≈450 w≈316 h≈390 (the clean white area in the botanical wreath)
 *   Gold ring badge:     centre ≈ (384, 1018)
 *
 * User feedback applied (2026-10-10):
 *   - QR moved DOWN to sit fully within the white canvas, not overlapping the top flowers
 *   - Gold decorative frame added around QR (matching logo's ring + dot accent style)
 *   - Logo moved DOWN + made bigger to clear the botanical frame beneath the gold ring
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '../public/assets/lockscreen');

// ── Reference resolution (native background px) ────────────────────────────
const BG_EXPECTED_W = 768;
const BG_EXPECTED_H = 1376;

// ── White QR canvas region ──────────────────────────────────────────────────
// The actual white square in the background sits roughly here (measured visually).
// QR is placed with a small inset so the gold frame SVG has room to appear around it.
const QR_INSET = 16;          // px gap between gold frame and QR edge
const QR_CANVAS_X = 232;     // left edge of the white canvas in the background
const QR_CANVAS_Y = 530;     // top edge  (moved DOWN — was 480, overlapping flowers)
const QR_CANVAS_W = 316;     // width  of white canvas
const QR_CANVAS_H = 310;     // height of white canvas

// ── Gold frame SVG dimensions ───────────────────────────────────────────────
// Frame is drawn around the QR inset; outer size = QR canvas size + 2*frame_border
const FRAME_BORDER = 4;       // gold line thickness (px) — bolder to match logo ring weight
const FRAME_CORNER_R = 6;     // rounded corner radius
const FRAME_DOT_R = 4;        // corner accent dot radius (matches logo dot accents)
const GOLD_COLOR = '#C9A96E'; // antique gold matching the logo ring

// ── Logo badge placement ────────────────────────────────────────────────────
// Moved DOWN so it clears the botanical elements that sit just below the gold ring.
// Made BIGGER so it's prominent and not swallowed by the flora.
const BADGE_CENTER_X = 384;
const BADGE_CENTER_Y = 1060;  // Nudged UP 30px — clears botanical frame, doesn't clip bottom zone
const BADGE_SIZE = 200;        // BIGGER from 155 — visible and dominant

async function run() {
  const bgPath     = path.join(ASSETS, 'lockscreen-bg.jpg');
  const qrPath     = path.join(ASSETS, 'qr-fiorevera.png');
  const badgePath  = path.join(ASSETS, 'logo-badge.jpg');
  const outputPath = path.join(ASSETS, 'fiore-vera-lockscreen-final.png');

  // ── 1. Load background & compute scale factors ─────────────────────────────
  const bgMeta = await sharp(bgPath).metadata();
  const bgW = bgMeta.width!;
  const bgH = bgMeta.height!;
  console.log(`Background: ${bgW}×${bgH}`);

  const scaleX = bgW / BG_EXPECTED_W;
  const scaleY = bgH / BG_EXPECTED_H;

  // Scaled QR canvas coords
  const canvasX = Math.round(QR_CANVAS_X * scaleX);
  const canvasY = Math.round(QR_CANVAS_Y * scaleY);
  const canvasW = Math.round(QR_CANVAS_W * scaleX);
  const canvasH = Math.round(QR_CANVAS_H * scaleY);

  // QR itself is inset from the canvas edge so frame has room
  const qrX = canvasX + QR_INSET;
  const qrY = canvasY + QR_INSET;
  const qrW = canvasW - 2 * QR_INSET;
  const qrH = canvasH - 2 * QR_INSET;

  // Badge coords
  const badgeCX = Math.round(BADGE_CENTER_X * scaleX);
  const badgeCY = Math.round(BADGE_CENTER_Y * scaleY);
  const badgeSz = Math.round(BADGE_SIZE * Math.max(scaleX, scaleY));

  console.log(`QR canvas: x=${canvasX} y=${canvasY} w=${canvasW} h=${canvasH}`);
  console.log(`QR placement: x=${qrX} y=${qrY} w=${qrW} h=${qrH}`);
  console.log(`Badge center: x=${badgeCX} y=${badgeCY} size=${badgeSz}`);

  // ── 2. Resize QR to fit the inset region ───────────────────────────────────
  const qrResized = await sharp(qrPath)
    .resize(qrW, qrH, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  // ── 3. Build gold decorative frame SVG ────────────────────────────────────
  // Frame outer size = canvas size. A thin gold rounded-rect border + 4 corner dot accents.
  // This exactly matches the logo's aesthetic: thin gold ring + small dot accents at cardinal points.
  const fw = canvasW;
  const fh = canvasH;
  const fb = FRAME_BORDER;
  const fr = FRAME_CORNER_R;
  const fd = FRAME_DOT_R;
  const gc = GOLD_COLOR;

  // Corner dot positions (just inside the corners of the frame)
  const dotOffset = fr + fd + 2;
  const frameSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${fw}" height="${fh}">
  <!-- Outer gold rounded-rect border -->
  <rect
    x="${fb / 2}" y="${fb / 2}"
    width="${fw - fb}" height="${fh - fb}"
    rx="${fr}" ry="${fr}"
    fill="none"
    stroke="${gc}"
    stroke-width="${fb}"
    stroke-opacity="0.9"
  />
  <!-- Inner thin hairline for double-line effect matching logo ring -->
  <rect
    x="${fb + 3}" y="${fb + 3}"
    width="${fw - 2 * fb - 6}" height="${fh - 2 * fb - 6}"
    rx="${fr - 2}" ry="${fr - 2}"
    fill="none"
    stroke="${gc}"
    stroke-width="0.8"
    stroke-opacity="0.5"
  />
  <!-- Corner dot accents — matches the 4 dots in the logo ring -->
  <circle cx="${dotOffset}"      cy="${dotOffset}"      r="${fd}" fill="${gc}" fill-opacity="0.85"/>
  <circle cx="${fw - dotOffset}" cy="${dotOffset}"      r="${fd}" fill="${gc}" fill-opacity="0.85"/>
  <circle cx="${dotOffset}"      cy="${fh - dotOffset}" r="${fd}" fill="${gc}" fill-opacity="0.85"/>
  <circle cx="${fw - dotOffset}" cy="${fh - dotOffset}" r="${fd}" fill="${gc}" fill-opacity="0.85"/>
  <!-- Mid-edge small diamonds on long sides (extra elegance) -->
  <polygon points="${fw / 2},${fb + 1} ${fw / 2 + 4},${fb + 6} ${fw / 2},${fb + 11} ${fw / 2 - 4},${fb + 6}" fill="${gc}" fill-opacity="0.7"/>
  <polygon points="${fw / 2},${fh - fb - 1} ${fw / 2 + 4},${fh - fb - 6} ${fw / 2},${fh - fb - 11} ${fw / 2 - 4},${fh - fb - 6}" fill="${gc}" fill-opacity="0.7"/>
</svg>`);

  // ── 4. Resize & circle-clip the logo badge ─────────────────────────────────
  // White filled circle mask for clean circular compositing
  const circleSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${badgeSz}" height="${badgeSz}">
       <circle cx="${badgeSz / 2}" cy="${badgeSz / 2}" r="${badgeSz / 2}" fill="white"/>
     </svg>`
  );

  const badgeResized = await sharp(badgePath)
    .resize(badgeSz, badgeSz, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // ── 5. Composite all layers onto the background ────────────────────────────
  // Layer order (bottom → top):
  //   1. background
  //   2. QR code (multiply blend — removes white-on-white edge artifacts)
  //   3. Gold frame SVG (over — renders on top of QR edges)
  //   4. Logo badge (over — sits cleanly in lower section)
  await sharp(bgPath)
    .composite([
      // Layer 1: QR code inside the white canvas
      {
        input: qrResized,
        top: qrY,
        left: qrX,
        blend: 'multiply',
      },
      // Layer 2: Gold decorative frame (positioned at canvas edge, surrounding QR + inset)
      {
        input: frameSvg,
        top: canvasY,
        left: canvasX,
        blend: 'over',
      },
      // Layer 3: Logo badge — bigger + moved down
      {
        input: badgeResized,
        top: badgeCY - Math.round(badgeSz / 2),
        left: badgeCX - Math.round(badgeSz / 2),
        blend: 'over',
      },
    ])
    .png({ quality: 100 })
    .toFile(outputPath);

  console.log(`\n✅ Lock screen saved to: ${outputPath}`);
  console.log('   → Set as iPhone lock screen wallpaper to use as digital visit card.');
}

run().catch((err) => {
  console.error('❌ Compositing failed:', err);
  process.exit(1);
});
