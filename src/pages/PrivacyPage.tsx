import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { PRIVACY_UPDATED } from '../data/contact';
import { SeoHead } from '../components/Seo/SeoHead';
import { PageHero } from '../components/Common/PageHero';
import styles from './pages.module.css';

const SECTIONS = ['form', 'storage', 'analytics', 'rights'] as const;

/** Localized data-processing notice (PRD D-2/D-4/D-10, MASTER-PLAN 2.11). */
export const PrivacyPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  return (
    <>
      <SeoHead locale={locale} page="privacy" />
      <PageHero eyebrow={t('nav.privacy')} title={t('privacy.title')} intro={t('privacy.intro')}>
        <p className="muted" style={{ marginTop: 'var(--space-3)' }}>
          {t('privacy.updated', { date: PRIVACY_UPDATED[locale] })}
        </p>
      </PageHero>
      <div className={`container ${styles.prose}`}>
        {SECTIONS.map((s) => (
          <section key={s} className={styles.privacySection}>
            <h2>{t(`privacy.sections.${s}.title`)}</h2>
            <p>{t(`privacy.sections.${s}.body`)}</p>
          </section>
        ))}
      </div>
    </>
  );
};
