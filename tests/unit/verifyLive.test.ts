import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { certificateVerdict, isPermanentRedirect, legacyUrls, nameserverFamily, redirectVerdict, type Expectations } from '../../scripts/verify-live';
import { SITE_URL } from '../../src/data/routes';

/**
 * The judging logic of `npm run verify:live` (scripts/verify-live.ts), without any network access.
 * The script itself talks to the live site and is run by hand, never by this suite.
 */
const expectations = JSON.parse(readFileSync(path.resolve('docs/launch/live-expectations.json'), 'utf8')) as Expectations;

describe('verify-live: judging logic', () => {
  it('reads the 14 legacy page URLs (7 HU + 7 DE, incl. the two garden pages) from the Webnode archive', () => {
    const urls = legacyUrls(JSON.parse(readFileSync(path.resolve('references/legacy/manifest.json'), 'utf8')));
    expect(urls).toHaveLength(14);
    expect(urls.every((u) => u.startsWith(`${SITE_URL}/`))).toBe(true);
    expect(urls).toContain(`${SITE_URL}/viragoskert/`);
    expect(urls).toContain(`${SITE_URL}/de/blumengarten/`);
  });

  it('accepts the nameservers of Register.it (today) and of Rackhost (after the transfer), nothing else', () => {
    const families = expectations.nameserverFamilies;
    expect(nameserverFamily(['ns1.register.it', 'ns2.register.it.'], families)).toBe('register.it');
    expect(nameserverFamily(['ns1.dns24.hu', 'ns2.dns24.hu', 'ns3.dns24.hu', 'ns4.dns24.hu'], families)).toBe('dns24.hu');
    expect(nameserverFamily(['ns1.register.it', 'ns1.dns24.hu'], families)).toBeNull(); // half-moved zone
    expect(nameserverFamily(['ns1.example-parking.com'], families)).toBeNull();
    expect(nameserverFamily(['evilregister.it'], families)).toBeNull();
  });

  it('treats 301 and 308 as permanent, 302 and 307 as not', () => {
    expect([301, 308].every(isPermanentRedirect)).toBe(true);
    expect([302, 307, 200, 404].some(isPermanentRedirect)).toBe(false);
  });

  it('a redirect chain passes only when every hop is permanent and it ends with 200 on the target', () => {
    const hop = (p: string, status: number) => ({ url: `${SITE_URL}${p}`, status });
    expect(redirectVerdict([hop('/viragoskert/', 308), hop('/rolunk/', 200)], '/rolunk/').ok).toBe(true);
    expect(redirectVerdict([hop('/viragoskert', 308), hop('/viragoskert/', 308), hop('/rolunk/', 200)], '/rolunk/').ok).toBe(true);
    expect(redirectVerdict([hop('/viragoskert/', 302), hop('/rolunk/', 200)], '/rolunk/').ok).toBe(false); // temporary
    expect(redirectVerdict([hop('/viragoskert/', 308), hop('/rolunk/', 404)], '/rolunk/').ok).toBe(false); // dead end
    expect(redirectVerdict([hop('/viragoskert/', 308), hop('/', 200)], '/rolunk/').ok).toBe(false); // wrong page
    expect(redirectVerdict([hop('/viragoskert/', 200)], '/rolunk/').ok).toBe(false); // no redirect at all
  });

  it('a certificate must name the host and have enough days left', () => {
    const now = new Date('2026-11-16T12:00:00Z');
    const cert = { subjectaltname: 'DNS:www.fiorevera.hu', valid_to: 'Feb 14 07:39:36 2027 GMT' };
    expect(certificateVerdict('www.fiorevera.hu', cert, 10, now)).toMatchObject({ ok: true });
    expect(certificateVerdict('fiorevera.hu', cert, 10, now).detail).toMatch(/not for fiorevera\.hu/);
    expect(certificateVerdict('www.fiorevera.hu', { ...cert, valid_to: 'Nov 20 00:00:00 2026 GMT' }, 10, now).detail).toMatch(/expires in 3 day/);
    expect(certificateVerdict('www.fiorevera.hu', { subjectaltname: 'DNS:*.fiorevera.hu', valid_to: cert.valid_to }, 10, now).ok).toBe(true);
    expect(certificateVerdict('a.b.fiorevera.hu', { subjectaltname: 'DNS:*.fiorevera.hu', valid_to: cert.valid_to }, 10, now).ok).toBe(false);
  });

  it('the expectations file names the Vercel records from the launch plan', () => {
    expect(expectations.apexA).toEqual(['216.198.79.1']);
    expect(expectations.wwwCname).toMatch(/\.vercel-dns-\d+\.com$/);
    expect(expectations.txtMustInclude.map((t) => t.startsWith.split('=')[0])).toEqual(['google-site-verification', 'v']);
  });
});
