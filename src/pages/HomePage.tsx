import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { SeoHead } from '../components/Seo/SeoHead';
import { HomeHero } from '../components/Home/HomeHero';
import { AboutTeaser, GalleryTeaser, Pitch, ServiceCards, Testimonials } from '../components/Home/HomeSections';
import { CtaStrip } from '../components/Common/CtaStrip';

/** Homepage, sections in PRD D-13 order. */
export const HomePage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  return (
    <>
      <SeoHead locale={locale} page="home" />
      <HomeHero />
      <Pitch />
      <ServiceCards />
      <GalleryTeaser />
      <Testimonials />
      <AboutTeaser />
      <CtaStrip title={t('home.cta.title')} body={t('home.cta.body')} buttonLabel={t('home.cta.button')} />
    </>
  );
};
