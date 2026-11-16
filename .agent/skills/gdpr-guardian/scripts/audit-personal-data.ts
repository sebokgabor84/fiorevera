/**
 * audit-personal-data.ts — gdpr-guardian
 * Deterministic inventory gate: every place where the code collects, stores or sends
 * visitor data must be declared in docs/gdpr/data-register.json with a purpose and the
 * privacy-page key that explains it. Fails (exit 1) on any undeclared sink.
 *
 * Run: npm run audit:gdpr
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const REGISTER_PATH = 'docs/gdpr/data-register.json';

interface Declared {
  privacyKey?: string;
}
interface Register {
  formFields: (Declared & { name: string })[];
  storage: (Declared & { kind: 'localStorage' | 'sessionStorage' | 'cookie' | 'indexedDB'; key: string })[];
  env: (Declared & { name: string })[];
  networkSinks: (Declared & { file: string })[];
  hosts: (Declared & { host: string })[];
  outboundLinks: { host: string }[];
  browserSignals: (Declared & { api: string; file: string })[];
}

const read = (rel: string): string => readFileSync(path.join(ROOT, rel), 'utf8');
/** Source without block and line comments — a sink mentioned in a comment is not a sink. */
const code = (rel: string): string => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(path.join(ROOT, dir))) {
    const rel = path.join(dir, entry);
    if (rel.startsWith(path.join('src', 'data', 'generated'))) continue;
    if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(rel);
  }
  return out;
};

const matches = (re: RegExp, text: string): string[] => Array.from(text.matchAll(re), (m) => m[1]);

const register: Register = JSON.parse(read(REGISTER_PATH)) as Register;
const files = walk('src');
const findings: string[] = [];
const seen = new Set<string>();
const report = (msg: string) => {
  if (!seen.has(msg)) {
    seen.add(msg);
    findings.push(msg);
  }
};

// 1. Form fields: every <input|textarea|select name="…"> must be declared.
const declaredFields = new Set(register.formFields.map((f) => f.name));
for (const file of files.filter((f) => f.endsWith('.tsx'))) {
  for (const name of matches(/<(?:input|textarea|select)\b[^>]*\bname="([^"]+)"/g, code(file))) {
    if (!declaredFields.has(name)) report(`form field "${name}" in ${file} is not in ${REGISTER_PATH} formFields`);
  }
}

// 2. Storage: files touching Web Storage / cookies / IndexedDB must declare every key they use.
const declaredKeys = new Set(register.storage.map((s) => s.key));
const declaredKinds = new Set(register.storage.map((s) => s.kind));
for (const file of files) {
  const src = code(file);
  if (/document\.cookie/.test(src) && !declaredKinds.has('cookie')) report(`${file} touches document.cookie but no cookie is declared`);
  if (/indexedDB/.test(src) && !declaredKinds.has('indexedDB')) report(`${file} touches indexedDB but nothing is declared`);
  if (!/(localStorage|sessionStorage)/.test(src)) continue;
  const keys = [
    ...matches(/\b(?:get|set|remove)Item\(\s*['"`]([^'"`]+)['"`]/g, src),
    ...matches(/const\s+[A-Z_]*KEY\s*=\s*['"`]([^'"`]+)['"`]/g, src),
  ];
  if (keys.length === 0) report(`${file} uses Web Storage but no key literal could be found — declare the keys and name the constants *_KEY`);
  for (const key of keys) {
    if (!declaredKeys.has(key)) report(`storage key "${key}" in ${file} is not in ${REGISTER_PATH} storage`);
  }
}

// 3. Env endpoints: every import.meta.env.VITE_* read in src must be declared.
const declaredEnv = new Set(register.env.map((e) => e.name));
for (const file of files) {
  for (const name of matches(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g, code(file))) {
    if (!declaredEnv.has(name)) report(`env var ${name} read in ${file} is not in ${REGISTER_PATH} env`);
  }
}

// 4. Network sinks: every file that can send data must be declared.
const declaredSinks = new Set(register.networkSinks.map((s) => s.file));
for (const file of files) {
  if (/\b(fetch\(|sendBeacon\(|XMLHttpRequest|WebSocket\()/.test(code(file)) && !declaredSinks.has(file)) {
    report(`${file} sends network requests but is not in ${REGISTER_PATH} networkSinks`);
  }
}

// 5. External hosts in src, index.html and the CSP: processor, outbound link, or undeclared.
const known = new Set([...register.hosts.map((h) => h.host), ...register.outboundLinks.map((l) => l.host)]);
for (const file of [...files, 'index.html', 'vercel.json']) {
  for (const host of matches(/https?:\/\/([a-z0-9.-]+)/gi, file.endsWith('.ts') || file.endsWith('.tsx') ? code(file) : read(file))) {
    if (!known.has(host)) report(`host ${host} referenced in ${file} is neither a declared processor (hosts) nor an outboundLink`);
  }
}

// 6. Browser signals that reveal something about the visitor.
const declaredSignals = new Set(register.browserSignals.map((s) => `${s.api}@${s.file}`));
for (const file of files) {
  for (const api of matches(/\b(navigator\.(?:languages|language|geolocation|userAgent|connection|sendBeacon))\b/g, code(file))) {
    if (!declaredSignals.has(`${api}@${file}`)) report(`${api} read in ${file} is not in ${REGISTER_PATH} browserSignals`);
  }
}

// 7. Every privacyKey must exist in the HU locale (the privacy page explains what the register declares).
const hu = JSON.parse(read('src/i18n/locales/hu.json')) as Record<string, unknown>;
const resolve = (key: string): boolean =>
  key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), hu) !== undefined;
const entries: Declared[] = [...register.formFields, ...register.storage, ...register.env, ...register.networkSinks, ...register.hosts, ...register.browserSignals];
for (const entry of entries) {
  if (!entry.privacyKey) report(`register entry ${JSON.stringify(entry)} has no privacyKey`);
  else if (!resolve(entry.privacyKey)) report(`privacyKey ${entry.privacyKey} is not in src/i18n/locales/hu.json`);
}

if (findings.length > 0) {
  console.error(`gdpr-guardian: ${findings.length} undeclared personal-data sink(s):`);
  for (const f of findings) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `gdpr-guardian: register ${register.formFields.length} fields, ${register.storage.length} storage keys, ${register.env.length} env vars, ${register.networkSinks.length} network sink(s), ${register.hosts.length} hosts — all sinks in ${files.length} source files declared.`,
);
