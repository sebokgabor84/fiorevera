import type { Locale } from '../data/routes';

const NBSP = '\u00a0';

/**
 * Rental sizes are one shared string per item ("2,8 m × 2,5 m", PRD D-8). For display the number
 * never separates from its unit, and English gets a decimal point instead of the comma.
 * Pure string work — no Intl, identical on server and client (PRD D-18).
 */
export const formatSize = (size: string, locale: Locale): string => {
  const localized = locale === 'en' ? size.replace(/(\d),(\d)/g, '$1.$2') : size;
  return localized.replace(/(\d) (?=(?:cm|m)\b)/g, `$1${NBSP}`);
};
