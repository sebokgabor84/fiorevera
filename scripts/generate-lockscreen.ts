/**
 * generate-lockscreen.ts
 *
 * Renders the shipped Fiore Vera iPhone lock screen wallpaper (the "linen
 * classic" design, see scripts/lockscreen/designs.ts) in two editions that
 * differ only in the URL the QR code encodes.
 *
 * Inputs (public/assets/lockscreen/):
 *   wreath-source.jpg, frame-gold.jpg, logo-badge.jpg
 *
 * Outputs (public/assets/lockscreen/, 1179×2556, iPhone 15/16 @3x):
 *   fiore-vera-lockscreen-final.png      — QR → https://www.fiorevera.hu
 *   fiore-vera-lockscreen-instagram.png  — QR → https://www.instagram.com/fioreveradekor/
 *
 * Usage:
 *   npm run lockscreen
 */

import path from 'path';
import { ASSETS, SITE_URL, renderLinenClassic } from './lockscreen/designs';

const INSTAGRAM_URL = 'https://www.instagram.com/fioreveradekor/';

async function run(): Promise<void> {
  await renderLinenClassic(path.join(ASSETS, 'fiore-vera-lockscreen-final.png'), SITE_URL);
  await renderLinenClassic(path.join(ASSETS, 'fiore-vera-lockscreen-instagram.png'), INSTAGRAM_URL);
}

run().catch((err: unknown) => {
  console.error('❌ Lockscreen generation failed:', err);
  process.exit(1);
});
