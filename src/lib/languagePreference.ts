import { LOCALES, type Locale } from '../data/routes';

/**
 * Language preference (PRD D-4): consent-exempt user preference kept in
 * localStorage. Only ever touched after mount — never during render (D-18).
 */
const DISMISSED_KEY = 'fv-lang-toast-dismissed';
const CHOICE_KEY = 'fv-lang';

const storage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const rememberLanguageChoice = (locale: Locale): void => {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(CHOICE_KEY, locale);
    s.setItem(DISMISSED_KEY, '1');
  } catch {
    /* quota / private mode: preference simply isn't remembered */
  }
};

export const dismissLanguageToast = (): void => {
  try {
    storage()?.setItem(DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
};

export const isLanguageToastDismissed = (): boolean => {
  try {
    return storage()?.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

/** Resolves navigator.languages to a suggested locale: only `de` or `en` are ever suggested (D-4). */
export const suggestedLocaleFor = (languages: readonly string[] | undefined): Locale | null => {
  for (const tag of languages ?? []) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === 'hu') return null; // HU is the default — never suggest anything
    if (base === 'de' || base === 'en') return base;
  }
  return null;
};

export const isLocale = (value: string | null | undefined): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
