/**
 * generate-lockscreen-variants.ts
 *
 * Renders the three alternative Fiore Vera lock screen designs that did not
 * win the design round (see scripts/lockscreen/designs.ts). The shipped final
 * is produced by scripts/generate-lockscreen.ts.
 *
 * Inputs (public/assets/lockscreen/):
 *   wreath-source.jpg, ornate-frame.jpg, delicate-filigree-frame.jpg, frame-gold.jpg, logo-badge.jpg
 *
 * Outputs (public/assets/lockscreen/variants/, 1179×2556):
 *   fiore-vera-lockscreen-variant-01-ink-editorial.png
 *   fiore-vera-lockscreen-variant-02-sage-garland.png
 *   fiore-vera-lockscreen-variant-03-blush-minimal.png
 *
 * Usage:
 *   npm run lockscreen:variants
 */

import path from 'path';
import { VARIANTS_DIR, renderBlushMinimal, renderInkEditorial, renderSageGarland } from './lockscreen/designs';

async function run(): Promise<void> {
  await renderInkEditorial(path.join(VARIANTS_DIR, 'fiore-vera-lockscreen-variant-01-ink-editorial.png'));
  await renderSageGarland(path.join(VARIANTS_DIR, 'fiore-vera-lockscreen-variant-02-sage-garland.png'));
  await renderBlushMinimal(path.join(VARIANTS_DIR, 'fiore-vera-lockscreen-variant-03-blush-minimal.png'));
}

run().catch((err: unknown) => {
  console.error('❌ Lockscreen variant generation failed:', err);
  process.exit(1);
});
