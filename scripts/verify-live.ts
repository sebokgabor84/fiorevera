/**
 * verify-live.ts — is the live site healthy? Read-only: DNS lookups, one TLS handshake per host and
 * plain GET requests against https://www.fiorevera.hu. Nothing is written anywhere, no form is sent.
 *
 *   npm run verify:live
 *
 * Run it after every DNS or domain change (registrar transfer!), after touching vercel.json, and
 * whenever someone says "the site is down". It replaces the dig / openssl / curl commands that the
 * launch session typed by hand three times (docs/launch/domain-and-hosting-plan.md §0a A6).
 *
 * Checks, each printed as one ✓ / ✗ line with what was expected and what was found:
 *   DNS    A (apex), CNAME (www), NS family, TXT (Search Console verification, SPF)   → docs/launch/live-expectations.json
 *   TLS    certificate valid for apex and www, not about to expire
 *   HTTP   http → https, apex → www, all 21 routes 200 in the right language, the legacy Webnode URLs
 *          (references/legacy/manifest.json) still answer 200 or redirect permanently to a page that
 *          does, the two garden redirects, unknown paths answer 404, sitemap + robots, security headers
 *
 * Exit code 0 = all green, 1 = at least one ✗. A ✗ on DNS right after a planned change usually means
 * "wait for the TTL (1 hour) and run again"; anything else needs a human look.
 */
import { Resolver } from 'node:dns/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import { allRoutes, LOCALES, localePrefix, REDIRECTS, SITE_URL } from '../src/data/routes';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface Expectations {
  apex: string;
  www: string;
  apexA: string[];
  wwwCname: string;
  nameserverFamilies: Record<string, string>;
  txtMustInclude: { startsWith: string; why: string }[];
  certificateMinDaysLeft: number;
}
export interface Check {
  group: 'DNS' | 'TLS' | 'HTTP';
  name: string;
  ok: boolean;
  detail: string;
}

const trimDot = (host: string): string => host.replace(/\.$/, '').toLowerCase();

/** Legacy page URLs from the Webnode archive (the URLs Google and old links still know). */
export const legacyUrls = (manifest: { pages: Record<string, Record<string, { url: string }>> }): string[] =>
  Object.values(manifest.pages).flatMap((pages) => Object.values(pages).map((p) => p.url));

/** Which known family all nameservers belong to; null when they are mixed or unknown. */
export const nameserverFamily = (nameservers: string[], families: Record<string, string>): string | null => {
  const found = new Set(nameservers.map((ns) => Object.keys(families).find((family) => trimDot(ns).endsWith(`.${family}`)) ?? '?'));
  return found.size === 1 && !found.has('?') ? [...found][0] : null;
};

/** A permanent redirect is 301 or 308 (Vercel sends 308 for `permanent: true`). */
export const isPermanentRedirect = (status: number): boolean => status === 301 || status === 308;

/** Checks a certificate's names and remaining lifetime for one host. */
export const certificateVerdict = (host: string, cert: { subjectaltname?: string; valid_to: string }, minDaysLeft: number, now: Date = new Date()): { ok: boolean; detail: string } => {
  const names = (cert.subjectaltname ?? '').split(',').map((n) => n.trim().replace(/^DNS:/, '').toLowerCase());
  const covers = names.some((n) => n === host || (n.startsWith('*.') && host.endsWith(n.slice(1)) && !host.slice(0, -n.length + 1).includes('.')));
  const daysLeft = Math.floor((Date.parse(cert.valid_to) - now.getTime()) / 86_400_000);
  if (!covers) return { ok: false, detail: `certificate is for ${names.join(', ') || '(no names)'}, not for ${host}` };
  if (daysLeft < minDaysLeft) return { ok: false, detail: `certificate expires in ${daysLeft} day(s) (${cert.valid_to}); automatic renewal should have happened — check the domain in the Vercel dashboard` };
  return { ok: true, detail: `valid for ${host}, ${daysLeft} days left (until ${cert.valid_to})` };
};

const get = (url: string): Promise<Response> => fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'verify-live (read-only site check)' } });

export interface Hop {
  url: string;
  status: number;
}
/** Requests `url` and follows Location headers (at most `maxHops`); returns every answer in order. */
const followRedirects = async (url: string, maxHops = 4): Promise<Hop[]> => {
  const chain: Hop[] = [];
  let next: string | null = url;
  while (next && chain.length <= maxHops) {
    const res: Response = await get(next);
    chain.push({ url: next, status: res.status });
    const location = res.headers.get('location');
    next = res.status >= 300 && res.status < 400 && location ? new URL(location, next).href : null;
  }
  return chain;
};

/** A legacy URL is redirected correctly when every hop is permanent and the chain ends with 200 on `targetPath`. */
export const redirectVerdict = (chain: Hop[], targetPath: string): { ok: boolean } => {
  const last = chain.at(-1);
  const hops = chain.slice(0, -1);
  return { ok: hops.length > 0 && hops.every((hop) => isPermanentRedirect(hop.status)) && last?.status === 200 && new URL(last.url).pathname === targetPath };
};

const peerCertificate = (host: string): Promise<{ authorized: boolean; error: string; cert: tls.PeerCertificate }> =>
  new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 20_000 }, () => {
      const result = { authorized: socket.authorized, error: String(socket.authorizationError ?? ''), cert: socket.getPeerCertificate() };
      socket.end();
      resolve(result);
    });
    socket.on('error', reject);
    socket.on('timeout', () => socket.destroy(new Error('TLS handshake timed out')));
  });

export const verifyLive = async (expect: Expectations, legacy: string[]): Promise<Check[]> => {
  const checks: Check[] = [];
  const add = (group: Check['group'], name: string, ok: boolean, detail: string) => checks.push({ group, name, ok, detail });
  const attempt = async (group: Check['group'], name: string, run: () => Promise<{ ok: boolean; detail: string }>): Promise<void> => {
    try {
      const r = await run();
      add(group, name, r.ok, r.detail);
    } catch (err) {
      add(group, name, false, `could not be checked: ${(err as Error).message}`);
    }
  };

  // ── DNS (public resolvers, so a stale local cache cannot hide a change) ──
  const dns = new Resolver();
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  await attempt('DNS', `A ${expect.apex}`, async () => {
    const found = (await dns.resolve4(expect.apex)).sort();
    return { ok: JSON.stringify(found) === JSON.stringify([...expect.apexA].sort()), detail: `expected ${expect.apexA.join(', ')} (Vercel), found ${found.join(', ')}` };
  });
  await attempt('DNS', `CNAME ${expect.www}`, async () => {
    const found = (await dns.resolveCname(expect.www)).map(trimDot);
    return { ok: found.length === 1 && found[0] === trimDot(expect.wwwCname), detail: `expected ${trimDot(expect.wwwCname)} (Vercel), found ${found.join(', ')}` };
  });
  await attempt('DNS', `NS ${expect.apex}`, async () => {
    const found = (await dns.resolveNs(expect.apex)).map(trimDot).sort();
    const family = nameserverFamily(found, expect.nameserverFamilies);
    return { ok: family !== null, detail: family ? `${found.join(', ')} → ${expect.nameserverFamilies[family]}` : `unexpected nameservers ${found.join(', ')} (known: ${Object.keys(expect.nameserverFamilies).join(', ')})` };
  });
  await attempt('DNS', `TXT ${expect.apex}`, async () => {
    const found = (await dns.resolveTxt(expect.apex)).map((chunks) => chunks.join(''));
    const missing = expect.txtMustInclude.filter((t) => !found.some((f) => f.startsWith(t.startsWith)));
    return { ok: missing.length === 0, detail: missing.length ? `missing ${missing.map((m) => `"${m.startsWith.slice(0, 28)}…" (${m.why})`).join('; ')}` : `${found.length} record(s), Search Console verification and SPF present` };
  });

  // ── TLS ──
  for (const host of [expect.apex, expect.www]) {
    await attempt('TLS', `certificate ${host}`, async () => {
      const { authorized, error, cert } = await peerCertificate(host);
      if (!authorized) return { ok: false, detail: `not trusted: ${error}` };
      return certificateVerdict(host, cert, expect.certificateMinDaysLeft);
    });
  }

  // ── HTTP ──
  const home = `${SITE_URL}/`;
  await attempt('HTTP', `http://${expect.apex}/ → https`, async () => {
    const res = await get(`http://${expect.apex}/`);
    const to = res.headers.get('location') ?? '';
    return { ok: res.status >= 300 && res.status < 400 && to.startsWith('https://'), detail: `${res.status} → ${to || '(no Location)'}` };
  });
  await attempt('HTTP', `https://${expect.apex}/ → ${home}`, async () => {
    const res = await get(`https://${expect.apex}/`);
    const to = res.headers.get('location') ?? '';
    return { ok: res.status >= 300 && res.status < 400 && to === home, detail: `${res.status} → ${to || '(no Location)'}` };
  });

  const bad: string[] = [];
  for (const { locale, path: p } of allRoutes()) {
    try {
      const res = await get(`${SITE_URL}${p}`);
      const lang = /<html[^>]*\blang="([a-z-]+)"/i.exec(await res.text())?.[1];
      if (res.status !== 200) bad.push(`${p} answered ${res.status}`);
      else if (lang !== locale) bad.push(`${p} is served with lang="${lang}" instead of "${locale}"`);
    } catch (err) {
      bad.push(`${p}: ${(err as Error).message}`);
    }
  }
  add('HTTP', `all ${allRoutes().length} routes answer 200 in their language`, bad.length === 0, bad.length ? bad.join('; ') : 'ok');

  const legacyBad: string[] = [];
  let redirected = 0;
  for (const url of legacy) {
    try {
      const res = await get(url);
      if (res.status === 200) continue;
      const to = res.headers.get('location');
      if (!isPermanentRedirect(res.status) || !to) {
        legacyBad.push(`${url} answered ${res.status}`);
        continue;
      }
      const target = await get(new URL(to, url).href);
      if (target.status === 200) redirected += 1;
      else legacyBad.push(`${url} → ${to} answered ${target.status}`);
    } catch (err) {
      legacyBad.push(`${url}: ${(err as Error).message}`);
    }
  }
  add('HTTP', `${legacy.length} legacy Webnode URLs still lead somewhere`, legacyBad.length === 0, legacyBad.length ? legacyBad.join('; ') : `${legacy.length - redirected} answer 200, ${redirected} redirect permanently to a page that answers 200`);

  // The garden redirects, with and without the trailing slash. Without it Vercel first adds the slash
  // (trailingSlash: true), then redirects: two permanent hops are fine, a temporary one or a dead end is not.
  for (const { from, to } of REDIRECTS) {
    for (const source of [from, from.replace(/\/$/, '')]) {
      await attempt('HTTP', `redirect ${source} → ${to}`, async () => {
        const chain = await followRedirects(`${SITE_URL}${source}`);
        return { ...redirectVerdict(chain, to), detail: chain.map((hop) => `${hop.status} ${new URL(hop.url).pathname}`).join(' → ') };
      });
    }
  }

  for (const locale of LOCALES) {
    const unknown = `${localePrefix(locale)}/nincs-ilyen-oldal-verify-live/`;
    await attempt('HTTP', `unknown path ${unknown} answers 404`, async () => {
      const res = await get(`${SITE_URL}${unknown}`);
      return { ok: res.status === 404, detail: `${res.status}` };
    });
  }

  await attempt('HTTP', 'sitemap.xml lists every route', async () => {
    const res = await get(`${SITE_URL}/sitemap.xml`);
    const xml = await res.text();
    const missing = allRoutes().filter((r) => !xml.includes(`<loc>${SITE_URL}${r.path}</loc>`));
    return { ok: res.status === 200 && missing.length === 0, detail: res.status !== 200 ? `${res.status}` : missing.length ? `missing ${missing.map((m) => m.path).join(' ')}` : `${allRoutes().length} URLs` };
  });
  await attempt('HTTP', 'robots.txt points at the sitemap', async () => {
    const res = await get(`${SITE_URL}/robots.txt`);
    const text = await res.text();
    return { ok: res.status === 200 && text.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), detail: res.status === 200 ? 'ok' : `${res.status}` };
  });
  await attempt('HTTP', 'security headers on the home page', async () => {
    const res = await get(home);
    const missing = ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy'].filter((h) => !res.headers.get(h));
    return { ok: missing.length === 0, detail: missing.length ? `missing ${missing.join(', ')}` : 'CSP, HSTS, nosniff, referrer policy present' };
  });

  return checks;
};

if (process.argv[1]?.endsWith('verify-live.ts')) {
  const expectations = JSON.parse(readFileSync(path.join(ROOT, 'docs/launch/live-expectations.json'), 'utf8')) as Expectations;
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'references/legacy/manifest.json'), 'utf8')) as Parameters<typeof legacyUrls>[0];
  console.log(`verify-live: ${SITE_URL} (read-only)\n`);
  const checks = await verifyLive(expectations, legacyUrls(manifest));
  let group = '';
  for (const c of checks) {
    if (c.group !== group) console.log(`${group ? '\n' : ''}${(group = c.group)}`);
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail && c.detail !== 'ok' ? ` — ${c.detail}` : ''}`);
  }
  const failed = checks.filter((c) => !c.ok);
  console.log(failed.length ? `\nverify-live: ${failed.length} of ${checks.length} checks FAILED. DNS changes need up to an hour (TTL) to show; anything else needs a look now.` : `\nverify-live: all ${checks.length} checks green.`);
  process.exit(failed.length ? 1 : 0);
}
