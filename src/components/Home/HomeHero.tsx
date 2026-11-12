import { useTranslation } from 'react-i18next';
import { IMAGE_META } from '../../data/generated/imageMeta';
import { LocalizedLink } from '../Common/LocalizedLink';
import { Picture } from '../Common/Picture';
import styles from './home.module.css';

/** Full-bleed hero, LCP image eager with fetchpriority=high (MASTER-PLAN 2.1). */
export const HomeHero = () => {
  const { t } = useTranslation();
  const hero = IMAGE_META.hero[0];
  return (
    <section className={styles.hero}>
      {hero && <Picture asset={hero} alt="" priority className={styles.heroImg} sizes="100vw" />}
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={`container ${styles.heroContent}`}>
        <p className={styles.heroEyebrow}>{t('home.hero.eyebrow')}</p>
        <h1 className={styles.heroTitle}>{t('home.hero.title')}</h1>
        <p className={styles.heroSubtitle}>{t('home.hero.subtitle')}</p>
        <p className={styles.heroLead}>{t('home.hero.lead')}</p>
        <div className={styles.heroActions}>
          <LocalizedLink page="gallery" className="btn btn--light">
            {t('home.hero.cta')}
          </LocalizedLink>
          <LocalizedLink page="contact" className={`btn ${styles.heroGhost}`}>
            {t('home.hero.ctaSecondary')}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
};
