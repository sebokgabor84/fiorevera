/**
 * scripts/content/classify.ts — `npm run content:classify [-- --base origin/main]`
 *
 * Prints whether the checkout's change against `main` is pure catalogue content or needs the
 * technical owner, with the reasons. Exit 0 = content, 10 = needs-gabor. Rules: lib/classify.ts.
 */
import { classifyCheckout } from './lib/classify';

const baseArg = process.argv.indexOf('--base');
const result = classifyCheckout(process.cwd(), baseArg >= 0 ? process.argv[baseArg + 1] : 'origin/main');
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.class === 'content' ? 0 : 10;
