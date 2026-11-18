import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  auditPersonalData,
  checkSeal,
  cookieWrites,
  loadRepo,
  loadSeal,
  loadedResources,
  registerFingerprint,
  type AuditInput,
  type Register,
} from '../../.agent/skills/gdpr-guardian/scripts/audit-personal-data';
import { submitInquiry, type InquiryPayload } from '../../src/lib/submitInquiry';

/**
 * The personal-data audit as a unit gate (it used to run only when someone remembered `npm run audit:gdpr`).
 * A red test here means: the code collects, stores, sends or loads something that
 * docs/gdpr/data-register.json does not declare. Fix the register (and the privacy page), not the test.
 */
const repo = loadRepo();
/** The real repository plus extra files — every negative case starts from a green audit. */
const withFiles = (files: Record<string, string>): AuditInput => ({ ...repo, files: { ...repo.files, ...files } });
const withRegister = (change: (r: Register) => void): AuditInput => {
  const register = structuredClone(repo.register);
  change(register);
  return { ...repo, register };
};

describe('personal-data audit (gdpr-guardian)', () => {
  it('the repository declares every data sink', () => {
    expect(auditPersonalData(repo)).toEqual([]);
  });

  it('reports each register entry that is removed', () => {
    const findings = auditPersonalData(
      withRegister((r) => {
        r.formFields = r.formFields.filter((f) => f.name !== 'phone');
        r.storage = r.storage.filter((s) => s.key !== 'fv-lang-toast-dismissed');
      })
    );
    expect(findings).toHaveLength(2);
    expect(findings.join('\n')).toMatch(/form field "phone"/);
    expect(findings.join('\n')).toMatch(/storage key "fv-lang-toast-dismissed"/);
  });

  it('a host in a comment is not a sink', () => {
    expect(auditPersonalData(withFiles({ 'src/lib/note.ts': '// see https://tracker.example.com/docs\n/* https://other.example.org */\nexport const x = 1;\n' }))).toEqual([]);
  });

  describe('resources the browser loads without a click', () => {
    it('an iframe to a host that is only declared as an outbound link is a finding', () => {
      const findings = auditPersonalData(
        withFiles({ 'src/components/Contact/Map.tsx': 'export const Map = () => <iframe title="map" src="https://www.google.com/maps/embed?pb=1" />;\n' })
      );
      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatch(/<iframe> in src\/components\/Contact\/Map\.tsx loads from www\.google\.com when the page opens/);
    });

    it('an iframe with a computed source needs a declared processor', () => {
      const file = 'const url = "https://www.youtube.com/embed/abc";\nexport const Video = () => <iframe title="video" src={url} />;\n';
      const findings = auditPersonalData(withFiles({ 'src/components/Home/Video.tsx': file }));
      expect(findings.join('\n')).toMatch(/<iframe> in src\/components\/Home\/Video\.tsx has a computed source and the file names www\.youtube\.com/);
    });

    it('an external script, a preconnect and a web font are findings (index.html, tsx, css)', () => {
      const findings = auditPersonalData(
        withFiles({
          'index.html': `${repo.files['index.html']}\n<script src="https://cdn.example.com/widget.js"></script>\n<link rel="preconnect" href="//fonts.gstatic.com" crossorigin />`,
          'src/styles/extra.css': '@import url("https://fonts.googleapis.com/css2?family=Inter");\n.x { background: url(https://img.example.net/a.png); }\n',
        })
      ).join('\n');
      expect(findings).toMatch(/<script> in index\.html loads from cdn\.example\.com/);
      expect(findings).toMatch(/<link rel="preconnect"> in index\.html loads from fonts\.gstatic\.com/);
      expect(findings).toMatch(/@import in src\/styles\/extra\.css loads from fonts\.googleapis\.com/);
      expect(findings).toMatch(/url\(\) in src\/styles\/extra\.css loads from img\.example\.net/);
    });

    it('same-origin resources, canonical/alternate links and inline JSON-LD are not findings', () => {
      const html = '<link rel="canonical" href="https://www.fiorevera.hu/" /><link rel="alternate" hreflang="de" href="https://www.fiorevera.hu/de/" /><link rel="preload" href="/fonts/inter-latin.woff2" as="font" /><script type="module" src="/src/main.tsx"></script><script type="application/ld+json">{"@context":"https://schema.org"}</script><img src="/assets/a.webp" alt="" />';
      expect(loadedResources('index.html', html).filter((r) => r.url === null || /^(https?:)?\/\//.test(r.url))).toEqual([]);
    });
  });

  describe('cookies', () => {
    it('reads the name of a cookie write, and null when it is computed', () => {
      expect(cookieWrites("document.cookie = 'fv_consent=1; path=/';")).toEqual(['fv_consent']);
      expect(cookieWrites('document.cookie = `${name}=1`;')).toEqual([null]);
      expect(cookieWrites("cookieStore.set('fv_theme', 'dark');")).toEqual(['fv_theme']);
      expect(cookieWrites('if (document.cookie === "") return;')).toEqual([]);
    });

    it('an undeclared cookie write is a finding; a declared one passes', () => {
      const file = { 'src/lib/consent.ts': "export const remember = () => { document.cookie = 'fv_consent=1; path=/'; };\n" };
      const findings = auditPersonalData(withFiles(file));
      expect(findings.join('\n')).toMatch(/cookie "fv_consent" written in src\/lib\/consent\.ts is not in/);
      const declared: AuditInput = {
        ...withFiles(file),
        register: { ...repo.register, storage: [...repo.register.storage, { kind: 'cookie', key: 'fv_consent', privacyKey: 'privacy.sections.storage' }] },
      };
      expect(auditPersonalData(declared)).toEqual([]);
    });
  });

  describe('inquiry payload (what the form provider receives)', () => {
    afterEach(() => vi.unstubAllEnvs());
    const payload: InquiryPayload = { name: 'Teszt Anna', email: 'anna@example.com', phone: '', date: '2027-06-12', venue: 'Zalakaros', message: 'Üdv', locale: 'hu', website: '' };
    const sentKeys = async (accessKey: string): Promise<string[]> => {
      vi.stubEnv('VITE_FORM_ENDPOINT', 'https://api.web3forms.com/submit');
      vi.stubEnv('VITE_FORM_ACCESS_KEY', accessKey);
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"success":true}', { status: 200 }));
      await submitInquiry(payload, fetchImpl);
      return Object.keys(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)) as Record<string, unknown>).sort();
    };
    const declared = repo.register.inquiryPayload as { key: string; optional?: boolean }[];

    it('with an access key the request carries exactly the keys declared in the register', async () => {
      expect(await sentKeys('test-access-key')).toEqual(declared.map((p) => p.key).sort());
    });

    it('without an access key it carries exactly the non-optional ones; honeypot and consent flag are never sent', async () => {
      const keys = await sentKeys('');
      expect(keys).toEqual(declared.filter((p) => !p.optional).map((p) => p.key).sort());
      expect(keys).not.toContain('website');
      expect(keys).not.toContain('consent');
    });
  });

  describe('register version seal', () => {
    it('the committed register matches its seal', () => {
      expect(checkSeal(repo.register, loadSeal())).toEqual([]);
    });

    it('a register change without a new seal fails and says which command to run', () => {
      const changed = withRegister((r) => r.outboundLinks.push({ host: 'example.com' })).register;
      const findings = checkSeal(changed, loadSeal());
      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatch(/changed since it was sealed/);
      expect(findings[0]).toMatch(/npm run audit:gdpr -- --seal/);
    });

    it('a version edited by hand, or one that is not a date, fails', () => {
      const seal = loadSeal();
      expect(checkSeal({ ...repo.register, version: '2099-01-01' }, seal)[0]).toMatch(/says version 2099-01-01/);
      expect(checkSeal({ ...repo.register, version: 'v2' }, seal)[0]).toMatch(/must be a date/);
    });

    it('the fingerprint ignores the version and whitespace, nothing else', () => {
      expect(registerFingerprint({ ...repo.register, version: '2000-01-01' })).toBe(registerFingerprint(repo.register));
      expect(registerFingerprint(withRegister((r) => (r.formFields[0].name = 'fullname')).register)).not.toBe(registerFingerprint(repo.register));
    });
  });
});
