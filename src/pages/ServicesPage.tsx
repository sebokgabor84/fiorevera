import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { services } from '../data/services';
import { SeoHead } from '../components/Seo/SeoHead';
import { PageHero } from '../components/Common/PageHero';
import { CtaStrip } from '../components/Common/CtaStrip';
import { LocalizedLink } from '../components/Common/LocalizedLink';
import styles from './pages.module.css';

/** Three pillars with anchors (PRD D-8, MASTER-PLAN 2.5). */
export const ServicesPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [full, floristry, rental] = services;
  return (
    <>
      <SeoHead locale={locale} page="services" />
      <PageHero eyebrow={t('services.hero.eyebrow')} title={t('services.hero.title')} intro={t('services.hero.intro')} />

      <section id={full.anchor} className={`${styles.pillar} ${styles.anchor}`}>
        <div className="container">
          <div className={styles.pillarHead}>
            <span className="eyebrow">{t('services.full.eyebrow')}</span>
            <h2>{t(full.titleKey)}</h2>
            <p className="lead">{t(full.introKey)}</p>
            <p>{t('services.full.scope')}</p>
          </div>
          <h3>{t('services.full.processTitle')}</h3>
          <ol className={styles.steps}>
            {full.stepKeys?.map((key) => (
              <li key={key} className={styles.step}>
                <h4>{t(`${key}.title`)}</h4>
                <p>{t(`${key}.body`)}</p>
              </li>
            ))}
          </ol>
          <h3 style={{ marginTop: 'var(--space-7)' }}>{t('services.full.checklistTitle')}</h3>
          <ul className={styles.checklist}>
            {full.checklistKeys?.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id={floristry.anchor} className={`${styles.pillar} ${styles.anchor} section--warm`}>
        <div className={`container ${styles.twoCol} ${styles.twoColWide}`}>
          <div>
            <span className="eyebrow">{t('services.floristry.eyebrow')}</span>
            <h2>{t(floristry.titleKey)}</h2>
            <p className="lead">{t(floristry.introKey)}</p>
            <p>{t('services.floristry.body')}</p>
            <LocalizedLink page="contact" className={`btn btn--primary ${styles.inlineCta}`}>
              {t(floristry.ctaKey)}
            </LocalizedLink>
          </div>
          <aside className="card" style={{ padding: 'var(--space-5)' }}>
            <h3>{t('services.floristry.seasonTitle')}</h3>
            <p style={{ margin: 0 }}>{t('services.floristry.season')}</p>
          </aside>
        </div>
      </section>

      <section id={rental.anchor} className={`${styles.pillar} ${styles.anchor}`}>
        <div className={`container ${styles.prose}`}>
          <span className="eyebrow">{t('services.rental.eyebrow')}</span>
          <h2>{t(rental.titleKey)}</h2>
          <p className="lead">{t(rental.introKey)}</p>
          <p>{t('services.rental.body')}</p>
          <LocalizedLink page="rental" className={`btn btn--gold ${styles.inlineCta}`}>
            {t(rental.ctaKey)}
          </LocalizedLink>
        </div>
      </section>

      <CtaStrip title={t('services.cta.title')} body={t('services.cta.body')} buttonLabel={t('services.cta.button')} />
    </>
  );
};
