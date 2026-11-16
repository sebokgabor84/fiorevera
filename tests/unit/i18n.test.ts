import { describe, it, expect } from 'vitest';
import { flatten, loadLocales, validateLocales, type LocaleTree } from '../../scripts/validate-i18n';

const locales = loadLocales();

describe('i18n parity gate (MASTER-PLAN 1.4)', () => {
  it('hu/de/en have the same keys, no empty strings, no untranslated duplicates', () => {
    expect(validateLocales(locales)).toEqual([]);
  });

  it('fails when a key is removed from one locale', () => {
    const broken = structuredClone(locales) as Record<string, LocaleTree>;
    delete (broken.de.nav as LocaleTree).rental;
    expect(validateLocales(broken)).toContainEqual({ kind: 'missing', key: 'nav.rental', locale: 'de' });
  });

  it('fails on an untranslated duplicate', () => {
    const broken = structuredClone(locales) as Record<string, LocaleTree>;
    for (const l of ['hu', 'de', 'en']) (broken[l].nav as LocaleTree).about = 'Same';
    expect(validateLocales(broken)).toContainEqual({ kind: 'identical', key: 'nav.about' });
  });

  it('mentions the flower garden only in the About "paused" paragraph (PRD D-16)', () => {
    const re = /virágoskert|virágos kert|blumengarten|flower garden|saját kertem|eigenen garten|my own garden/i;
    for (const [l, tree] of Object.entries(locales)) {
      for (const [key, value] of flatten(tree)) {
        if (key.startsWith('about.garden.')) continue;
        expect(re.test(value), `${l}:${key} mentions the garden: "${value}"`).toBe(false);
      }
    }
  });

  it('carries none of the legacy typos', () => {
    const typos = /bújtatott kéltségek|Eskövő|hozzárulok|Burgendland|REferenzen|FRag nach einen/;
    for (const [l, tree] of Object.entries(locales)) {
      for (const [key, value] of flatten(tree)) expect(typos.test(value), `${l}:${key}`).toBe(false);
    }
  });

  it('keeps SEO titles ≤ 60 and descriptions ≤ 160 characters', () => {
    for (const [l, tree] of Object.entries(locales)) {
      for (const [key, value] of flatten(tree)) {
        if (/^meta\..*\.title$/.test(key)) expect(value.length, `${l}:${key} (${value.length})`).toBeLessThanOrEqual(60);
        if (/^meta\..*\.description$/.test(key)) expect(value.length, `${l}:${key} (${value.length})`).toBeLessThanOrEqual(160);
      }
    }
  });
});
