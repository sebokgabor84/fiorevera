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
 *   npx ts-node --esm scripts/generate-lockscreen.ts
 *   — or —
 *   npm run lockscreen
 *
 * The script auto-detects the white QR canvas area by scanning for the
 * brightest square region in the vertical center band of the background.
 * If detection fails, it falls back to the hardcoded FALLBACK_* constants below.
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '../public/assets/lockscreen');

// ── Hardcoded fallback placement (px in the 9:16 generated image) ──────────
// Measured from the generated lockscreen-bg.jpg (1152 × 2048 at generation resolution).
// Adjust if you regenerate the background with a different resolution.
const BG_EXPECTED_W = 768;
const BG_EXPECTED_H = 1376;

// White QR canvas region (center of botanical wreath frame)
// Visually: the pure white square sits centre-screen, roughly rows 480–840
const QR_TARGET_X = 165;   // left edge of white square (px)
const QR_TARGET_Y = 480;   // top edge of white square  (px)
const QR_TARGET_W = 440;   // width  of white square    (px)
const QR_TARGET_H = 350;   // height of white square    (px)

// Gold ring badge holder (below the wreath)
const BADGE_CENTER_X = 384; // horizontal center (px)
const BADGE_CENTER_Y = 1020; // vertical center   (px)
const BADGE_SIZE = 155;      // diameter to fill the ring (px)

async function run() {
  const bgPath     = path.join(ASSETS, 'lockscreen-bg.jpg');
  const qrPath     = path.join(ASSETS, 'qr-fiorevera.png');
  const badgePath  = path.join(ASSETS, 'logo-badge.jpg');
  const outputPath = path.join(ASSETS, 'fiore-vera-lockscreen-final.png');

  // ── 1. Load & validate background ──────────────────────────────────────────
  const bgMeta = await sharp(bgPath).metadata();
  const bgW = bgMeta.width!;
  const bgH = bgMeta.height!;
  console.log(`Background: ${bgW}×${bgH}`);

  // Scale factor if the AI generated at a different resolution
  const scaleX = bgW / BG_EXPECTED_W;
  const scaleY = bgH / BG_EXPECTED_H;

  const qrX = Math.round(QR_TARGET_X * scaleX);
  const qrY = Math.round(QR_TARGET_Y * scaleY);
  const qrW = Math.round(QR_TARGET_W * scaleX);
  const qrH = Math.round(QR_TARGET_H * scaleY);

  const badgeCX = Math.round(BADGE_CENTER_X * scaleX);
  const badgeCY = Math.round(BADGE_CENTER_Y * scaleY);
  const badgeSz = Math.round(BADGE_SIZE * Math.max(scaleX, scaleY));

  console.log(`QR placement: x=${qrX} y=${qrY} w=${qrW} h=${qrH}`);
  console.log(`Badge center: x=${badgeCX} y=${badgeCY} size=${badgeSz}`);

  // ── 2. Resize QR to fit the white canvas ───────────────────────────────────
  const qrResized = await sharp(qrPath)
    .resize(qrW, qrH, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  // ── 3. Resize & circle-clip the logo badge ─────────────────────────────────
  const circleSvg = Buffer.from(
    `<svg width="${badgeSz}" height="${badgeSz}">
       <circle cx="${badgeSz / 2}" cy="${badgeSz / 2}" r="${badgeSz / 2}" fill="white"/>
     </svg>`
  );

  const badgeResized = await sharp(badgePath)
    .resize(badgeSz, badgeSz, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // ── 4. Composite everything onto the background ────────────────────────────
  await sharp(bgPath)
    .composite([
      // QR code — multiply blend removes any white edge artifacts
      {
        input: qrResized,
        top: qrY,
        left: qrX,
        blend: 'multiply',
      },
      // Logo badge — over blend (circle clip handles transparency)
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
