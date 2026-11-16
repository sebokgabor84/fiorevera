import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { rentalItems } from '../data/rentalItems';
import { contact } from '../data/contact';
import { SeoHead } from '../components/Seo/SeoHead';
import { PageHero } from '../components/Common/PageHero';
import { RentalCard } from '../components/Rental/RentalCard';
import rentalStyles from '../components/Rental/rental.module.css';
import styles from './pages.module.css';

const HOW_TO = ['choose', 'reserve', 'pickup', 'ask'] as const;

/** Data-driven rental catalog, identical in all locales (PRD D-8, MASTER-PLAN 2.6). */
export const RentalPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(t('rental.cta.emailSubject'))}`;
  return (
    <>
      <SeoHead locale={locale} page="rental" />
      <PageHero eyebrow={t('rental.hero.eyebrow')} title={t('rental.hero.title')} intro={t('rental.hero.intro')} />

      <section className="section--tight">
        <div className="container">
          <h2 style={{ fontSize: 'var(--fs-xl)' }}>{t('rental.howTo.title')}</h2>
          <ol className={rentalStyles.howTo}>
            {HOW_TO.map((k) => (
              <li key={k}>{t(`rental.howTo.steps.${k}`, { phone: contact.phoneDisplay })}</li>
            ))}
          </ol>
          {locale !== 'hu' && <p className={rentalStyles.note}>{t('rental.currencyNote')}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className={rentalStyles.grid}>
            {rentalItems.map((item) => (
              <RentalCard key={item.id} item={item} />
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--warm">
        <div className={`container ${styles.prose}`}>
          <h2>{t('rental.cta.title')}</h2>
          <p className="lead">{t('rental.cta.body')}</p>
          <div className={styles.socialRow}>
            <a href={mailto} className="btn btn--gold">
              {t('rental.cta.email')}
            </a>
            <a href={contact.phoneHref} className="btn btn--ghost">
              {t('rental.cta.phone')}: {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  );
};
