/**
 * checkout.ts — "which checkout does this server serve?"
 *
 * Several sessions work on this repo at once, each in its own git worktree. Playwright reuses a server
 * that already listens on the test port, so a run in one checkout could silently test another
 * checkout's code (2026-11-16: a preview and a dev server from the main checkout were live while a
 * worktree ran its gates). Three pieces close that hole:
 *
 *   1. checkoutIdentity()  — Vite plugin: the dev and the preview server answer IDENTITY_PATH with the
 *                            folder they serve. Dev/preview only, nothing reaches the production build.
 *   2. checkoutPort(base)  — the main checkout keeps the documented port (5173 dev, 4173 preview); a
 *                            worktree gets its own port, so it never collides with the owner's servers.
 *   3. assertServesThisCheckout() / assertDistIsFresh() — called from Playwright's global setup; a run
 *                            against a foreign server or a stale dist/ fails before the first test,
 *                            with a message that says what to do.
 */
import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

export const IDENTITY_PATH = '/__fv/checkout';

/** Root of THIS checkout (the folder that holds package.json), symlinks resolved. */
export const CHECKOUT_ROOT = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));

export interface CheckoutIdentity {
  /** Folder the server was started in. */
  root: string;
  /** 'dev' = vite dev server (sources), 'preview' = vite preview (a built folder). */
  mode: 'dev' | 'preview';
  /** Folder a preview server serves; absent for the dev server. */
  outDir?: string;
}

/** In a linked worktree `.git` is a file that points at the main repository; in the main checkout it is a folder. */
export const isWorktree = (root: string = CHECKOUT_ROOT): boolean => {
  const dotGit = path.join(root, '.git');
  return existsSync(dotGit) && statSync(dotGit).isFile();
};

/**
 * Port for this checkout. Main checkout → `base`. Worktree → a stable port derived from its path
 * (base + 100 … base + 899), so two checkouts never share a port unless their hashes collide — and
 * then --strictPort plus the identity check make that loud instead of silent.
 */
export const checkoutPort = (base: number, root: string = CHECKOUT_ROOT): number => {
  if (!isWorktree(root)) return base;
  let hash = 2166136261; // FNV-1a
  for (const ch of root) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return base + 100 + (hash % 800);
};

/** Vite plugin: identity endpoint on the dev server and on the preview server. */
export const checkoutIdentity = (): Plugin => {
  const respond = (identity: CheckoutIdentity) => (_req: unknown, res: { setHeader(name: string, value: string): void; end(body: string): void }) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(identity));
  };
  return {
    name: 'fv-checkout-identity',
    configureServer(server) {
      server.middlewares.use(IDENTITY_PATH, respond({ root: realpathSync(server.config.root), mode: 'dev' }));
    },
    configurePreviewServer(server) {
      const root = realpathSync(server.config.root);
      server.middlewares.use(IDENTITY_PATH, respond({ root, mode: 'preview', outDir: path.resolve(root, server.config.build.outDir) }));
    },
  };
};

const portOf = (origin: string): string => new URL(origin).port || '80';
const whoListens = (origin: string): string => `lsof -nP -iTCP:${portOf(origin)} -sTCP:LISTEN`;

/**
 * Fails unless the server at `origin` was started in this checkout (and, for a preview, serves its dist/).
 * `fetchImpl` is injectable for the unit test.
 */
export const assertServesThisCheckout = async (
  origin: string,
  expected: { mode: CheckoutIdentity['mode']; root?: string },
  fetchImpl: typeof fetch = fetch
): Promise<CheckoutIdentity> => {
  const root = expected.root ?? CHECKOUT_ROOT;
  const stop = `Find the process with \`${whoListens(origin)}\`, stop it, and run the tests again — they start their own server.`;
  let identity: CheckoutIdentity;
  try {
    const res = await fetchImpl(`${origin}${IDENTITY_PATH}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    identity = (await res.json()) as CheckoutIdentity;
    if (typeof identity?.root !== 'string') throw new Error('no "root" in the answer');
  } catch (err) {
    throw new Error(
      `The server on ${origin} does not say which checkout it serves (${IDENTITY_PATH}: ${(err as Error).message}).\n` +
        `It is not a server of this repository, or it was started before this check existed. A test run against it proves nothing.\n${stop}`
    );
  }
  if (identity.root !== root) {
    throw new Error(
      `The server on ${origin} serves another checkout.\n  server:   ${identity.root}\n  this run: ${root}\n` +
        `Results from it would describe the other checkout's code, not this one's.\n${stop}`
    );
  }
  if (identity.mode !== expected.mode) {
    throw new Error(
      `The server on ${origin} is a vite ${identity.mode} server, but this suite needs a vite ${expected.mode} server.\n${stop}`
    );
  }
  if (expected.mode === 'preview' && identity.outDir !== path.join(root, 'dist')) {
    throw new Error(
      `The preview server on ${origin} serves ${identity.outDir}, not ${path.join(root, 'dist')} (the production build).\n${stop}`
    );
  }
  return identity;
};

/** Newest modification time below `target` (file or folder), skipping names in `skip`. */
const newestMtime = (target: string, skip: ReadonlySet<string>): { mtimeMs: number; file: string } => {
  let newest = { mtimeMs: 0, file: target };
  const visit = (p: string): void => {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const entry of readdirSync(p)) if (!skip.has(entry)) visit(path.join(p, entry));
    } else if (st.mtimeMs > newest.mtimeMs) newest = { mtimeMs: st.mtimeMs, file: p };
  };
  if (existsSync(target)) visit(target);
  return newest;
};

/** What `npm run build` turns into dist/. `public/sitemap.xml` is written by the build itself, so it is skipped. */
export const BUILD_INPUTS = ['src', 'public', 'index.html', 'vite.config.ts', 'scripts/prerender.ts'] as const;

/**
 * Fails when dist/ is missing or older than any build input: the visual suite would compare the
 * baselines with a build that is not the code in this checkout.
 */
export const assertDistIsFresh = (root: string = CHECKOUT_ROOT): void => {
  const built = path.join(root, 'dist', 'index.html');
  if (!existsSync(built)) {
    throw new Error(`No production build in ${path.join(root, 'dist')}. The visual suite tests the built site: run \`npm run build\` first, then \`npm run test:visual\`.`);
  }
  const builtAt = statSync(built).mtimeMs;
  const skip = new Set(['sitemap.xml', '.DS_Store']);
  for (const input of BUILD_INPUTS) {
    const newest = newestMtime(path.join(root, input), skip);
    if (newest.mtimeMs > builtAt) {
      throw new Error(
        `dist/ is older than the sources: ${path.relative(root, newest.file)} changed at ${new Date(newest.mtimeMs).toISOString()}, ` +
          `dist/index.html was built at ${new Date(builtAt).toISOString()}.\n` +
          `The visual suite would test a stale build. Run \`npm run build\` first, then \`npm run test:visual\`.`
      );
    }
  }
};

// CLI: `tsx scripts/checkout.ts --assert-dist` — run by the visual suite's server command before `vite preview`.
if (process.argv[1]?.endsWith('checkout.ts') && process.argv.includes('--assert-dist')) {
  try {
    assertDistIsFresh();
  } catch (err) {
    console.error(`\n${(err as Error).message}\n`);
    process.exit(1);
  }
}
