import { useMemo } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { allRoutes, matchRoute, type PageId } from './data/routes';
import { getI18n } from './i18n/config';
import { LocaleContext } from './i18n/localeContext';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { GalleryPage } from './pages/GalleryPage';
import { RentalPage } from './pages/RentalPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';

const PAGES: Record<PageId, () => React.JSX.Element> = {
  home: HomePage,
  services: ServicesPage,
  gallery: GalleryPage,
  rental: RentalPage,
  about: AboutPage,
  contact: ContactPage,
  privacy: PrivacyPage,
};

/**
 * Locale + page are derived purely from the pathname (PRD D-3 / D-18), so the
 * same tree renders identically in entry-server and entry-client.
 */
export const App = () => {
  const { pathname } = useLocation();
  const match = useMemo(() => matchRoute(pathname), [pathname]);
  const i18n = getI18n(match.locale);

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={match}>
        <Layout>
          <Routes>
            {allRoutes().map(({ page, path }) => {
              const Page = PAGES[page];
              return <Route key={path} path={path} element={<Page />} />;
            })}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </LocaleContext.Provider>
    </I18nextProvider>
  );
};
