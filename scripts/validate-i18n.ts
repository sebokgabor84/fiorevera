/**
 * validate-i18n.ts — MASTER-PLAN 1.4 (i18n-guardian)
 * Key parity across hu/de/en, no empty strings, no untranslated duplicates
 * (identical value in all locales) unless the key is whitelisted as a proper noun.
 * Used by tests/unit/i18n.test.ts and runnable: npx tsx scripts/validate-i18n.ts
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

export type LocaleTree = { [key: string]: string | LocaleTree };

/** Keys whose value is legitimately identical in every locale. */
export const IDENTICAL_WHITELIST = new Set<string>([
  'meta.siteName',
  'home.hero.title',
  'lang.hu',
  'lang.de',
  'lang.en',
  'common.instagram',
  'common.facebook',
  'notFound.eyebrow',
]);

export const flatten = (tree: LocaleTree, prefix = ''): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.set(key, v);
    else for (const [ck, cv] of flatten(v, key)) out.set(ck, cv);
  }
  return out;
};

export interface I18nIssue {
  kind: 'missing' | 'empty' | 'identical' | 'extra';
  key: string;
  locale?: string;
}

export const validateLocales = (resources: Record<string, LocaleTree>, reference = 'hu'): I18nIssue[] => {
  const issues: I18nIssue[] = [];
  const flat = Object.fromEntries(Object.entries(resources).map(([l, t]) => [l, flatten(t)]));
  const ref = flat[reference];
  if (!ref) throw new Error(`reference locale ${reference} missing`);
  const locales = Object.keys(flat);

  for (const key of ref.keys()) {
    for (const locale of locales) {
      const value = flat[locale].get(key);
      if (value === undefined) issues.push({ kind: 'missing', key, locale });
      else if (value.trim() === '') issues.push({ kind: 'empty', key, locale });
    }
    const values = locales.map((l) => flat[l].get(key));
    if (values.every((v) => v !== undefined && v === values[0]) && !IDENTICAL_WHITELIST.has(key)) {
      issues.push({ kind: 'identical', key });
    }
  }
  for (const locale of locales) {
    if (locale === reference) continue;
    for (const key of flat[locale].keys()) if (!ref.has(key)) issues.push({ kind: 'extra', key, locale });
  }
  return issues;
};

export const loadLocales = (dir = path.resolve('src/i18n/locales')): Record<string, LocaleTree> =>
  Object.fromEntries(
    ['hu', 'de', 'en'].map((l) => [l, JSON.parse(readFileSync(path.join(dir, `${l}.json`), 'utf8')) as LocaleTree])
  );

const isMain = process.argv[1]?.endsWith('validate-i18n.ts');
if (isMain) {
  const issues = validateLocales(loadLocales());
  if (issues.length === 0) {
    console.log('✓ i18n: hu/de/en in parity, no empty or untranslated strings');
  } else {
    for (const i of issues) console.error(`✗ ${i.kind} ${i.key}${i.locale ? ` [${i.locale}]` : ''}`);
    process.exit(1);
  }
}
