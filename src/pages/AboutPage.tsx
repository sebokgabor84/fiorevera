import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { IMAGE_META } from '../data/generated/imageMeta';
import { SeoHead } from '../components/Seo/SeoHead';
import { PageHero } from '../components/Common/PageHero';
import { Picture } from '../components/Common/Picture';
import { CtaStrip } from '../components/Common/CtaStrip';
import styles from './pages.module.css';

/** Vera's story + the one "garden paused" paragraph (PRD D-12, D-16; MASTER-PLAN 2.9). */
export const AboutPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const portrait = IMAGE_META.about[1] ?? IMAGE_META.about[0];
  return (
    <>
      <SeoHead locale={locale} page="about" />
      <PageHero eyebrow={t('about.hero.eyebrow')} title={t('about.hero.title')} />
      <section className="section--tight">
        <div className={`container ${styles.twoCol}`}>
          <div className={styles.sticky}>
            {portrait && <Picture asset={portrait} alt={t('about.intro')} className={styles.portrait} sizes="(min-width: 48rem) 40vw, 100vw" />}
            <dl className={styles.facts}>
              <div>
                <dt>{t('common.address')}</dt>
                <dd>{t('about.facts.based')}</dd>
              </div>
              <div>
                <dt>{t('home.about.eyebrow')}</dt>
                <dd>{t('about.facts.style')}</dd>
              </div>
            </dl>
          </div>
          <div className={styles.prose}>
            <p className="lead">{t('about.hero.greeting')}</p>
            <p>
              <strong>{t('about.intro')}</strong>
            </p>
            <p>{t('about.story1')}</p>
            <p>{t('about.story2')}</p>
            <p>{t('about.story3')}</p>
            <aside className={styles.gardenNote}>
              <h2>{t('about.garden.title')}</h2>
              <p>{t('about.garden.body')}</p>
            </aside>
          </div>
        </div>
      </section>
      <CtaStrip title={t('about.cta.title')} body={t('about.cta.body')} buttonLabel={t('about.cta.button')} />
    </>
  );
};
