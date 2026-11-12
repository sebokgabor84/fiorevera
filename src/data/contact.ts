import type { Contact } from './types';
import type { Locale } from './routes';

/** Business contact data (legacy site, archived 2026-11-09). */
export const contact: Contact = {
  owner: 'Sebőkné Antalics Veronika',
  phoneDisplay: '+36 30 865 9108',
  phoneHref: 'tel:+36308659108',
  email: 'info.fiorevera@gmail.com',
  address: { street: 'Rózsa utca 53.', postalCode: '8749', city: 'Zalakaros', countryCode: 'HU' },
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=8749+Zalakaros%2C+R%C3%B3zsa+utca+53.',
  instagram: 'https://www.instagram.com/fioreveradekor',
  facebook: 'https://www.facebook.com/fioreveradekor',
  instagramHandle: '@fioreveradekor',
};

/** Privacy notice revision date, pre-formatted per locale (deterministic for SSR). */
export const PRIVACY_UPDATED: Record<Locale, string> = {
  hu: '2026. november 9.',
  de: '9. November 2026',
  en: '9 November 2026',
};

const NARROW_NBSP = '\u202f';
const NBSP = '\u00a0';

/** Deterministic HUF formatting (no Intl, identical on server and client): "19 990 Ft". */
export const formatHuf = (amount: number): string =>
  amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP) + NBSP + 'Ft';
