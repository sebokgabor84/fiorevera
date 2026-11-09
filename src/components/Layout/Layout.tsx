import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocale } from '../../i18n/localeContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { LanguageToast } from './LanguageToast';
import { ScrollToTop } from '../Common/ScrollToTop';

/** Page chrome. All browser access happens in effects (hydration-safe, PRD D-18). */
export const Layout = ({ children }: { children: ReactNode }) => {
  const { locale } = useLocale();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <>
      <Header />
      <LanguageToast />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
};
