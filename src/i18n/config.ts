/**
 * i18n (MASTER-PLAN 1.2): one pre-initialised i18next instance per locale,
 * resolved synchronously from the route. No language detection, no
 * localStorage, no changeLanguage during render — hydration-safe (PRD D-18).
 */
import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../data/routes';
import hu from './locales/hu.json';
import de from './locales/de.json';
import en from './locales/en.json';

export const RESOURCES = {
  hu: { translation: hu },
  de: { translation: de },
  en: { translation: en },
} as const;

const instances = new Map<Locale, I18nInstance>();

export const getI18n = (locale: Locale): I18nInstance => {
  const existing = instances.get(locale);
  if (existing) return existing;
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...LOCALES],
    resources: RESOURCES,
    initImmediate: false, // synchronous init: resources are bundled
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  instances.set(locale, instance);
  return instance;
};
