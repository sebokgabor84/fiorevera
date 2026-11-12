import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale, type PageId } from '../data/routes';

export interface LocaleContextValue {
  locale: Locale;
  /** Current page, or null on the localized 404. */
  page: PageId | null;
}

export const LocaleContext = createContext<LocaleContextValue>({ locale: DEFAULT_LOCALE, page: 'home' });

export const useLocale = (): LocaleContextValue => useContext(LocaleContext);
