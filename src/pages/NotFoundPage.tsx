import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { SeoHead } from '../components/Seo/SeoHead';
import { LocalizedLink } from '../components/Common/LocalizedLink';
import styles from './pages.module.css';

/** Localized 404 per prefix (PRD D-3, MASTER-PLAN 2.12). */
export const NotFoundPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  return (
    <>
      <SeoHead locale={locale} page={null} />
      <section className={`container ${styles.notFound}`}>
        <span className="eyebrow">{t('notFound.eyebrow')}</span>
        <h1>{t('notFound.title')}</h1>
        <p className="lead">{t('notFound.body')}</p>
        <div className={styles.notFoundActions}>
          <LocalizedLink page="home" className="btn btn--primary">
            {t('notFound.cta')}
          </LocalizedLink>
          <LocalizedLink page="gallery" className="btn btn--ghost">
            {t('notFound.ctaSecondary')}
          </LocalizedLink>
        </div>
      </section>
    </>
  );
};
