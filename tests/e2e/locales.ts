import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from '../../src/data/routes';

/** Locale JSON for the specs, read via fs (Node ESM needs import attributes for JSON). */
type LocaleJson = typeof import('../../src/i18n/locales/hu.json');

const load = (l: Locale): LocaleJson =>
  JSON.parse(readFileSync(path.resolve('src/i18n/locales', `${l}.json`), 'utf8')) as LocaleJson;

export const T: Record<Locale, LocaleJson> = { hu: load('hu'), de: load('de'), en: load('en') };
export const hu = T.hu;
export const de = T.de;
export const en = T.en;
