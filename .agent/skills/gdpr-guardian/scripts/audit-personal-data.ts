/**
 * audit-personal-data.ts — gdpr-guardian
 * Deterministic inventory gate: every place where the code collects, stores or sends
 * visitor data must be declared in docs/gdpr/data-register.json with a purpose and the
 * privacy-page key that explains it. Fails (exit 1) on any undeclared sink.
 *
 *   npm run audit:gdpr             # audit the repository (also runs inside `npm test`: tests/unit/gdpr.test.ts)
 *   npm run audit:gdpr -- --seal   # after an intended register change: stamp today's date as `version`
 *                                  # and record the register's fingerprint in data-register.seal.json
 *
 * The checks are pure functions over { register, files, huLocale }, so the unit test can feed them
 * fixtures (an iframe, a cookie write, a deleted register entry) and prove that each one is caught.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
export const REGISTER_PATH = 'docs/gdpr/data-register.json';
export const SEAL_PATH = 'docs/gdpr/data-register.seal.json';

interface Declared {
  privacyKey?: string;
}
export interface Register {
  version: string;
  formFields: (Declared & { name: string })[];
  /** Keys of the JSON body POSTed to the form provider (tests/unit/submitInquiry.test.ts and tests/e2e/contact.spec.ts compare the real request with this list). */
  inquiryPayload: (Declared & { key: string })[];
  storage: (Declared & { kind: 'localStorage' | 'sessionStorage' | 'cookie' | 'indexedDB'; key: string })[];
  env: (Declared & { name: string })[];
  networkSinks: (Declared & { file: string })[];
  /** Hosts the browser contacts without a click (requests, scripts, frames, preconnects) — processors. */
  hosts: (Declared & { host: string })[];
  /** Hosts that only appear in links the visitor has to click, or in vocabulary URLs that are never requested. */
  outboundLinks: { host: string }[];
  browserSignals: (Declared & { api: string; file: string })[];
}
export interface Seal {
  version: string;
  sha256: string;
}
export interface AuditInput {
  register: Register;
  /** Repo-relative path → content of every audited file (src/**.ts|tsx|css, index.html, vercel.json). */
  files: Record<string, string>;
  /** Parsed src/i18n/locales/hu.json — every privacyKey must resolve in it. */
  huLocale: Record<string, unknown>;
}

/** The site's own hosts: loading from them is not a transfer to anyone. */
const SELF_HOSTS = new Set(['www.fiorevera.hu', 'fiorevera.hu']);

const isScript = (file: string) => /\.tsx?$/.test(file);
/** Source without comments — a sink mentioned in a comment is not a sink. */
const code = (file: string, text: string): string => {
  if (isScript(file)) return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  if (file.endsWith('.css')) return text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (file.endsWith('.html')) return text.replace(/<!--[\s\S]*?-->/g, '');
  return text;
};
const matches = (re: RegExp, text: string): string[] => Array.from(text.matchAll(re), (m) => m[1]);
/** Host of an absolute or protocol-relative URL; null for a relative one (same origin). */
const externalHost = (url: string): string | null => /^(?:https?:)?\/\/([a-z0-9.-]+)/i.exec(url.trim())?.[1].toLowerCase() ?? null;

/**
 * Everything in `text` that makes the browser contact a host when the page opens, without a click:
 * <script src>, <iframe>, <embed>, <object>, media sources, resource <link>s (preconnect, dns-prefetch,
 * preload, stylesheet, …) and CSS @import / url(). `url: null` means the source is computed at runtime
 * and cannot be read from the file.
 */
export const loadedResources = (file: string, text: string): { tag: string; url: string | null }[] => {
  const out: { tag: string; url: string | null }[] = [];
  if (file.endsWith('.css')) {
    for (const url of matches(/@import\s+(?:url\()?\s*['"]?([^'")\s;]+)/g, text)) out.push({ tag: '@import', url });
    for (const url of matches(/\burl\(\s*['"]?([^'")\s]+)/g, text)) out.push({ tag: 'url()', url });
    return out;
  }
  // Frames, plugins and scripts: a computed source is reported too (url: null) — these load a whole third party.
  for (const m of text.matchAll(/<(iframe|embed|object|script)\b/g)) {
    const tag = m[1];
    const rest = text.slice(m.index, m.index + 800);
    const end = rest.search(new RegExp(`</${tag}>|/>`));
    const open = end === -1 ? rest : rest.slice(0, end);
    const attr = tag === 'object' ? 'data' : 'src';
    const literal = new RegExp(`\\b${attr}=(["'])(.*?)\\1`).exec(open);
    if (literal) out.push({ tag: `<${tag}>`, url: literal[2] });
    else if (new RegExp(`\\b${attr}=\\{`).test(open)) out.push({ tag: `<${tag}>`, url: null });
    else if (tag !== 'script') out.push({ tag: `<${tag}>`, url: null }); // a frame without a readable source
  }
  // Media with a literal source (computed sources are the site's own optimised assets).
  for (const m of text.matchAll(/<(img|source|video|audio|track)\b[^>]*?\bsrc(?:set)?=(["'])(.*?)\2/g)) out.push({ tag: `<${m[1]}>`, url: m[3] });
  // <link>: canonical and alternate only name a URL, every other rel makes the browser connect or fetch.
  for (const m of text.matchAll(/<link\b([^>]*)>/g)) {
    const rel = /\brel=(["'])(.*?)\1/.exec(m[1])?.[2] ?? '';
    if (/\b(canonical|alternate)\b/.test(rel)) continue;
    const literal = /\bhref=(["'])(.*?)\1/.exec(m[1]);
    if (literal) out.push({ tag: `<link rel="${rel}">`, url: literal[2] });
    else if (/\bhref=\{/.test(m[1])) out.push({ tag: `<link rel="${rel}">`, url: null });
  }
  return out;
};

/** Names of the cookies a file writes; `null` for a write whose name cannot be read from the source. */
export const cookieWrites = (text: string): (string | null)[] => {
  const out: (string | null)[] = [];
  for (const m of text.matchAll(/document\.cookie\s*=(?!=)\s*(.{0,80})/g)) out.push(/^['"`]\s*([A-Za-z0-9_.-]+)\s*=/.exec(m[1])?.[1] ?? null);
  for (const m of text.matchAll(/cookieStore\.set\(\s*(.{0,80})/g)) out.push(/^['"`]([A-Za-z0-9_.-]+)['"`]/.exec(m[1])?.[1] ?? /^\{\s*name:\s*['"`]([A-Za-z0-9_.-]+)['"`]/.exec(m[1])?.[1] ?? null);
  return out;
};

/** The audit: returns one line per undeclared sink, [] when everything is declared. */
export const auditPersonalData = ({ register, files, huLocale }: AuditInput): string[] => {
  const findings: string[] = [];
  const report = (msg: string) => {
    if (!findings.includes(msg)) findings.push(msg);
  };
  const names = Object.keys(files).sort();
  const scripts = names.filter(isScript);
  const src = (file: string): string => code(file, files[file]);

  // 1. Form fields: every <input|textarea|select name="…"> must be declared.
  const declaredFields = new Set(register.formFields.map((f) => f.name));
  for (const file of scripts.filter((f) => f.endsWith('.tsx'))) {
    for (const name of matches(/<(?:input|textarea|select)\b[^>]*\bname="([^"]+)"/g, src(file))) {
      if (!declaredFields.has(name)) report(`form field "${name}" in ${file} is not in ${REGISTER_PATH} formFields`);
    }
  }

  // 2. Storage: files touching Web Storage / cookies / IndexedDB must declare every key they use.
  const declaredKeys = new Set(register.storage.filter((s) => s.kind !== 'cookie').map((s) => s.key));
  const declaredCookies = new Set(register.storage.filter((s) => s.kind === 'cookie').map((s) => s.key));
  const declaredKinds = new Set(register.storage.map((s) => s.kind));
  for (const file of scripts) {
    const text = src(file);
    for (const cookie of cookieWrites(text)) {
      if (cookie === null) report(`${file} writes a cookie whose name cannot be read from the source — write it as a literal ('name=…') and declare it in ${REGISTER_PATH} storage (kind "cookie")`);
      else if (!declaredCookies.has(cookie)) report(`cookie "${cookie}" written in ${file} is not in ${REGISTER_PATH} storage (kind "cookie")`);
    }
    if (/document\.cookie|cookieStore\./.test(text) && !declaredKinds.has('cookie')) report(`${file} touches cookies but no cookie is declared in ${REGISTER_PATH} storage`);
    if (/indexedDB/.test(text) && !declaredKinds.has('indexedDB')) report(`${file} touches indexedDB but nothing is declared`);
    if (!/(localStorage|sessionStorage)/.test(text)) continue;
    const keys = [...matches(/\b(?:get|set|remove)Item\(\s*['"`]([^'"`]+)['"`]/g, text), ...matches(/const\s+[A-Z_]*KEY\s*=\s*['"`]([^'"`]+)['"`]/g, text)];
    if (keys.length === 0) report(`${file} uses Web Storage but no key literal could be found — declare the keys and name the constants *_KEY`);
    for (const key of keys) {
      if (!declaredKeys.has(key)) report(`storage key "${key}" in ${file} is not in ${REGISTER_PATH} storage`);
    }
  }

  // 3. Env endpoints: every import.meta.env.VITE_* read in src must be declared.
  const declaredEnv = new Set(register.env.map((e) => e.name));
  for (const file of scripts) {
    for (const name of matches(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g, src(file))) {
      if (!declaredEnv.has(name)) report(`env var ${name} read in ${file} is not in ${REGISTER_PATH} env`);
    }
  }

  // 4. Network sinks: every file that can send data must be declared.
  const declaredSinks = new Set(register.networkSinks.map((s) => s.file));
  for (const file of scripts) {
    if (/\b(fetch\(|sendBeacon\(|XMLHttpRequest|WebSocket\()/.test(src(file)) && !declaredSinks.has(file)) {
      report(`${file} sends network requests but is not in ${REGISTER_PATH} networkSinks`);
    }
  }

  // 5. External hosts anywhere (code, styles, index.html, the CSP): processor, outbound link, or undeclared.
  const processors = new Set(register.hosts.map((h) => h.host));
  const known = new Set([...processors, ...register.outboundLinks.map((l) => l.host)]);
  for (const file of names) {
    for (const host of matches(/https?:\/\/([a-z0-9.-]+)/gi, src(file))) {
      if (!known.has(host)) report(`host ${host} referenced in ${file} is neither a declared processor (hosts) nor an outboundLink`);
    }
  }

  // 6. Resources the browser loads on its own (script, iframe, embed, preconnect, stylesheet, CSS url()):
  //    the host is contacted — and sees the visitor's IP — before any click, so an outboundLinks entry is not enough.
  for (const file of names) {
    const text = src(file);
    const resources = loadedResources(file, text);
    for (const { tag, url } of resources) {
      if (url === null) continue;
      const host = externalHost(url);
      if (host && !SELF_HOSTS.has(host) && !processors.has(host)) {
        report(`${tag} in ${file} loads from ${host} when the page opens — declare ${host} in ${REGISTER_PATH} hosts with a privacyKey (outboundLinks only covers links the visitor clicks)`);
      }
    }
    // A computed source cannot be read: then every external host named in that file has to be a declared processor.
    const computed = resources.filter((r) => r.url === null);
    if (computed.length > 0) {
      const hosts = matches(/(?:https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})/gi, text).filter((h) => !SELF_HOSTS.has(h));
      const what = Array.from(new Set(computed.map((r) => r.tag))).join(', ');
      if (hosts.length === 0) report(`${what} in ${file} has a computed source, so the audit cannot tell which host it loads — use a literal URL`);
      for (const host of hosts) {
        if (!processors.has(host)) report(`${what} in ${file} has a computed source and the file names ${host} — declare ${host} in ${REGISTER_PATH} hosts with a privacyKey, or use a literal URL`);
      }
    }
  }

  // 7. Browser signals that reveal something about the visitor.
  const declaredSignals = new Set(register.browserSignals.map((s) => `${s.api}@${s.file}`));
  for (const file of scripts) {
    for (const api of matches(/\b(navigator\.(?:languages|language|geolocation|userAgent|connection|sendBeacon))\b/g, src(file))) {
      if (!declaredSignals.has(`${api}@${file}`)) report(`${api} read in ${file} is not in ${REGISTER_PATH} browserSignals`);
    }
  }

  // 8. Every privacyKey must exist in the HU locale (the privacy page explains what the register declares).
  const resolve = (key: string): boolean =>
    key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), huLocale) !== undefined;
  const entries: Declared[] = [...register.formFields, ...register.inquiryPayload, ...register.storage, ...register.env, ...register.networkSinks, ...register.hosts, ...register.browserSignals];
  for (const entry of entries) {
    if (!entry.privacyKey) report(`register entry ${JSON.stringify(entry)} has no privacyKey`);
    else if (!resolve(entry.privacyKey)) report(`privacyKey ${entry.privacyKey} is not in src/i18n/locales/hu.json`);
  }
  return findings;
};

/** Fingerprint of the register's content: everything except `version`, independent of whitespace. */
export const registerFingerprint = (register: Register): string => {
  const { version: _version, ...content } = register;
  void _version;
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
};

/**
 * The version rule: a change to the register must come with a new `version` date. The seal file records
 * the fingerprint and the version it was sealed with; returns the reason when they no longer match.
 */
export const checkSeal = (register: Register, seal: Seal): string[] => {
  const how = 'Review the change, then run `npm run audit:gdpr -- --seal` (it stamps today\'s date as `version` and records the new fingerprint) and commit both files.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(register.version) || Number.isNaN(Date.parse(register.version))) {
    return [`${REGISTER_PATH}: "version" must be a date (YYYY-MM-DD), found "${register.version}". ${how}`];
  }
  if (registerFingerprint(register) !== seal.sha256) {
    return [`${REGISTER_PATH} changed since it was sealed as version ${seal.version}, but ${SEAL_PATH} still holds the old fingerprint. ${how}`];
  }
  if (register.version !== seal.version) {
    return [`${REGISTER_PATH} says version ${register.version}, ${SEAL_PATH} says ${seal.version}. ${how}`];
  }
  return [];
};

const read = (rel: string, root: string): string => readFileSync(path.join(root, rel), 'utf8');

/** The real repository as audit input. */
export const loadRepo = (root: string = ROOT): AuditInput => {
  const files: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(path.join(root, dir))) {
      const rel = path.join(dir, entry);
      if (rel.startsWith(path.join('src', 'data', 'generated'))) continue;
      if (statSync(path.join(root, rel)).isDirectory()) walk(rel);
      else if (/\.(ts|tsx|css)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) files[rel] = read(rel, root);
    }
  };
  walk('src');
  for (const extra of ['index.html', 'vercel.json']) files[extra] = read(extra, root);
  return {
    register: JSON.parse(read(REGISTER_PATH, root)) as Register,
    files,
    huLocale: JSON.parse(read('src/i18n/locales/hu.json', root)) as Record<string, unknown>,
  };
};
export const loadSeal = (root: string = ROOT): Seal => JSON.parse(read(SEAL_PATH, root)) as Seal;

/** `--seal`: stamp today's date as the register's version (only when its content changed) and record the fingerprint. */
const seal = (root: string): void => {
  const registerFile = path.join(root, REGISTER_PATH);
  let text = readFileSync(registerFile, 'utf8');
  let register = JSON.parse(text) as Register;
  let previous: Seal | null = null;
  try {
    previous = loadSeal(root);
  } catch {
    previous = null;
  }
  const changed = previous?.sha256 !== registerFingerprint(register);
  if (changed) {
    const today = new Date().toISOString().slice(0, 10);
    text = text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${today}$2`);
    writeFileSync(registerFile, text);
    register = JSON.parse(text) as Register;
  }
  const next = {
    $comment: `Written by \`npm run audit:gdpr -- --seal\`; never edit by hand. tests/unit/gdpr.test.ts fails when ${REGISTER_PATH} changes without a new seal, so a register change always carries a new version date.`,
    version: register.version,
    sha256: registerFingerprint(register),
  };
  writeFileSync(path.join(root, SEAL_PATH), `${JSON.stringify(next, null, 2)}\n`);
  console.log(changed ? `gdpr-guardian: register content changed → version ${register.version}, sealed in ${SEAL_PATH}.` : `gdpr-guardian: register content unchanged; seal rewritten for version ${register.version}.`);
};

if (process.argv[1]?.endsWith('audit-personal-data.ts')) {
  if (process.argv.includes('--seal')) seal(ROOT);
  const input = loadRepo();
  const findings = auditPersonalData(input);
  let sealFindings: string[];
  try {
    sealFindings = checkSeal(input.register, loadSeal());
  } catch {
    sealFindings = [`${SEAL_PATH} is missing or unreadable — run \`npm run audit:gdpr -- --seal\`.`];
  }
  if (findings.length > 0) {
    console.error(`gdpr-guardian: ${findings.length} undeclared personal-data sink(s):`);
    for (const f of findings) console.error(`  - ${f}`);
  }
  for (const f of sealFindings) console.error(`gdpr-guardian: ${f}`);
  if (findings.length > 0 || sealFindings.length > 0) process.exit(1);
  const { register, files } = input;
  console.log(
    `gdpr-guardian: register ${register.version} — ${register.formFields.length} fields, ${register.inquiryPayload.length} payload keys, ${register.storage.length} storage keys, ${register.env.length} env vars, ${register.networkSinks.length} network sink(s), ${register.hosts.length} hosts — all sinks in ${Object.keys(files).length} files declared.`,
  );
}
