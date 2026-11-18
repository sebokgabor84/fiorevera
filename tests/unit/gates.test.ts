import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { afterEach, describe, expect, it } from 'vitest';
import { assertDistIsFresh, assertServesThisCheckout, checkoutPort, CHECKOUT_ROOT, IDENTITY_PATH, isWorktree, type CheckoutIdentity } from '../../scripts/checkout';

/**
 * The gates themselves are tested: each one must fail on the mistake it exists for, with a message
 * that tells the reader what to do. If one of these goes red, a safety net has a hole — do not
 * loosen the gate to make it pass.
 */
const temp: string[] = [];
const scratch = (): string => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'fv-gates-')));
  temp.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temp.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const serverSaying = (identity: Partial<CheckoutIdentity> | null, status = 200): typeof fetch =>
  (async () => new Response(identity === null ? '<html>not json</html>' : JSON.stringify(identity), { status })) as typeof fetch;

describe('server identity: tests refuse a server from another checkout (scripts/checkout.ts)', () => {
  const origin = 'http://localhost:5173';

  it('accepts the dev server of this checkout', async () => {
    await expect(assertServesThisCheckout(origin, { mode: 'dev' }, serverSaying({ root: CHECKOUT_ROOT, mode: 'dev' }))).resolves.toMatchObject({ root: CHECKOUT_ROOT });
  });

  it('rejects a server started in another folder and names both folders', async () => {
    const other = '/Users/someone/fiorevera';
    await expect(assertServesThisCheckout(origin, { mode: 'dev' }, serverSaying({ root: other, mode: 'dev' }))).rejects.toThrow(
      new RegExp(`serves another checkout[\\s\\S]*${other}[\\s\\S]*${CHECKOUT_ROOT}[\\s\\S]*lsof -nP -iTCP:5173`)
    );
  });

  it('rejects a server that does not answer the identity question (foreign or outdated server)', async () => {
    await expect(assertServesThisCheckout(origin, { mode: 'dev' }, serverSaying(null))).rejects.toThrow(/does not say which checkout it serves/);
    await expect(assertServesThisCheckout(origin, { mode: 'dev' }, serverSaying({}, 404))).rejects.toThrow(new RegExp(IDENTITY_PATH));
  });

  it('rejects a dev server where the visual suite needs the production preview, and a preview of another folder', async () => {
    await expect(assertServesThisCheckout(origin, { mode: 'preview' }, serverSaying({ root: CHECKOUT_ROOT, mode: 'dev' }))).rejects.toThrow(/needs a vite preview server/);
    await expect(
      assertServesThisCheckout(origin, { mode: 'preview' }, serverSaying({ root: CHECKOUT_ROOT, mode: 'preview', outDir: path.join(CHECKOUT_ROOT, 'tests/visual') }))
    ).rejects.toThrow(/not .*dist \(the production build\)/);
    await expect(
      assertServesThisCheckout(origin, { mode: 'preview' }, serverSaying({ root: CHECKOUT_ROOT, mode: 'preview', outDir: path.join(CHECKOUT_ROOT, 'dist') }))
    ).resolves.toBeDefined();
  });

  it('the main checkout keeps the documented ports; a worktree gets its own stable port', () => {
    const main = scratch();
    mkdirSync(path.join(main, '.git'));
    expect(isWorktree(main)).toBe(false);
    expect(checkoutPort(5173, main)).toBe(5173);
    expect(checkoutPort(4173, main)).toBe(4173);

    const a = scratch();
    const b = scratch();
    for (const wt of [a, b]) writeFileSync(path.join(wt, '.git'), 'gitdir: /somewhere/.git/worktrees/x\n');
    expect(isWorktree(a)).toBe(true);
    expect(checkoutPort(5173, a)).toBe(checkoutPort(5173, a));
    for (const base of [5173, 4173]) {
      expect(checkoutPort(base, a)).toBeGreaterThanOrEqual(base + 100);
      expect(checkoutPort(base, a)).toBeLessThan(base + 900);
    }
    // dev and preview ranges never overlap, so one worktree's two servers cannot collide
    expect(checkoutPort(4173, a)).toBeLessThan(5173 + 100);
    expect(checkoutPort(4173, b)).toBeLessThan(checkoutPort(5173, a));
  });
});

describe('stale build: the visual suite refuses a dist/ older than the sources (scripts/checkout.ts)', () => {
  const project = (): string => {
    const root = scratch();
    mkdirSync(path.join(root, 'src'));
    mkdirSync(path.join(root, 'public'));
    writeFileSync(path.join(root, 'src', 'main.tsx'), 'export {};\n');
    writeFileSync(path.join(root, 'index.html'), '<html></html>\n');
    return root;
  };
  const at = (file: string, secondsAgo: number): void => {
    const t = new Date(Date.now() - secondsAgo * 1000);
    utimesSync(file, t, t);
  };

  it('fails without a build and says to run npm run build', () => {
    expect(() => assertDistIsFresh(project())).toThrow(/No production build[\s\S]*npm run build/);
  });

  it('passes when dist/ is newer than every source, fails as soon as one source is newer', () => {
    const root = project();
    mkdirSync(path.join(root, 'dist'));
    writeFileSync(path.join(root, 'dist', 'index.html'), '<html></html>\n');
    at(path.join(root, 'src', 'main.tsx'), 120);
    at(path.join(root, 'index.html'), 120);
    at(path.join(root, 'dist', 'index.html'), 60);
    expect(() => assertDistIsFresh(root)).not.toThrow();

    at(path.join(root, 'src', 'main.tsx'), 10);
    expect(() => assertDistIsFresh(root)).toThrow(/dist\/ is older than the sources: src\/main\.tsx[\s\S]*npm run build/);
  });

  it('ignores public/sitemap.xml, which the build itself rewrites', () => {
    const root = project();
    mkdirSync(path.join(root, 'dist'));
    writeFileSync(path.join(root, 'dist', 'index.html'), '<html></html>\n');
    writeFileSync(path.join(root, 'public', 'sitemap.xml'), '<urlset/>\n');
    at(path.join(root, 'src', 'main.tsx'), 120);
    at(path.join(root, 'index.html'), 120);
    at(path.join(root, 'dist', 'index.html'), 60);
    at(path.join(root, 'public', 'sitemap.xml'), 5);
    expect(() => assertDistIsFresh(root)).not.toThrow();
  });
});

describe('lint gate: Playwright specs must import from the fixtures (eslint.config.js)', () => {
  const eslint = new ESLint({ cwd: CHECKOUT_ROOT });
  const lint = async (code: string, filePath: string): Promise<string[]> => {
    const [result] = await eslint.lintText(code, { filePath: path.join(CHECKOUT_ROOT, filePath) });
    return result.messages.map((m) => `${m.ruleId}: ${m.message}`);
  };
  const bare = "import { test, expect } from '@playwright/test';\ntest('x', async ({ page }) => { await expect(page).toHaveTitle('x'); });\n";

  it.each(['tests/e2e/new.spec.ts', 'tests/visual/new.spec.ts', 'tests/visual/helpers.ts'])('a bare @playwright/test import in %s is an error that names the fixture', async (file) => {
    const messages = await lint(bare, file);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/no-restricted-imports: .*'\.\/fixtures'.*blocks requests to the real form providers/);
  });

  it('a type-only import and the fixture file itself are allowed', async () => {
    expect(await lint("import type { Page } from '@playwright/test';\nexport const title = (page: Page) => page.title();\n", 'tests/e2e/helper.ts')).toEqual([]);
    expect(await lint("import { test as base, expect } from '@playwright/test';\nexport const test = base;\nexport { expect };\n", 'tests/e2e/fixtures.ts')).toEqual([]);
  });
}, 30_000);
