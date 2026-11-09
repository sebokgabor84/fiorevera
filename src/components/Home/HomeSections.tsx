import { useTranslation } from 'react-i18next';
import { albums, featuredAlbumIds } from '../../data/albums';
import { services } from '../../data/services';
import { testimonials } from '../../data/testimonials';
import { IMAGE_META } from '../../data/generated/imageMeta';
import { albumCover, albumTitle, albumVenue, albumAlt } from '../../lib/albums';
import { LocalizedLink } from '../Common/LocalizedLink';
import { Picture } from '../Common/Picture';
import styles from './home.module.css';

const REASONS = ['budget', 'planning', 'props'] as const;

/** D-13 §2: three reasons + the one "other events" sentence. */
export const Pitch = () => {
  const { t } = useTranslation();
  return (
    <section className="section">
      <div className="container">
        <div className={styles.pitchHead}>
          <span className="eyebrow">{t('home.pitch.eyebrow')}</span>
          <h2>{t('home.pitch.title')}</h2>
          <p className="lead">{t('home.pitch.intro')}</p>
        </div>
        <ul className={styles.reasons}>
          {REASONS.map((r, i) => (
            <li key={r} className={styles.reason}>
              <span className={styles.reasonIndex} aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className={styles.reasonTitle}>{t(`home.pitch.reasons.${r}.title`)}</h3>
              <p className={styles.reasonBody}>{t(`home.pitch.reasons.${r}.body`)}</p>
            </li>
          ))}
        </ul>
        <p className={`muted ${styles.events}`}>{t('home.pitch.events')}</p>
      </div>
    </section>
  );
};

/** D-13 §3: three service cards → Services anchors / Rental. */
export const ServiceCards = () => {
  const { t } = useTranslation();
  return (
    <section className="section section--warm">
      <div className="container">
        <span className="eyebrow">{t('home.services.eyebrow')}</span>
        <h2>{t('home.services.title')}</h2>
        <ul className={styles.cards}>
          {services.map((s) => {
            const rentalImg = IMAGE_META.rental['_page']?.[0];
            const img =
              s.id === 'rental' ? rentalImg : s.id === 'full' ? albumCover(albums[7]) : albumCover(albums[12]);
            return (
              <li key={s.id} className={`card ${styles.card}`}>
                {img && <Picture asset={img} alt="" className={styles.cardImg} sizes="(min-width: 48rem) 30vw, 100vw" />}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{t(`home.services.cards.${s.id}.title`)}</h3>
                  <p className={styles.cardText}>{t(`home.services.cards.${s.id}.body`)}</p>
                  <LocalizedLink
                    page={s.id === 'rental' ? 'rental' : 'services'}
                    hash={s.id === 'rental' ? undefined : s.anchor}
                    className={styles.cardLink}
                  >
                    {t(`home.services.cards.${s.id}.cta`)} →
                  </LocalizedLink>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

/** D-13 §4: four album covers → gallery anchors. */
export const GalleryTeaser = () => {
  const { t } = useTranslation();
  const featured = featuredAlbumIds.map((id) => albums.find((a) => a.id === id)).filter((a) => a !== undefined);
  return (
    <section className="section">
      <div className="container">
        <div className={styles.teaserHead}>
          <div>
            <span className="eyebrow">{t('home.gallery.eyebrow')}</span>
            <h2>{t('home.gallery.title')}</h2>
            <p className="lead">{t('home.gallery.intro')}</p>
          </div>
          <LocalizedLink page="gallery" className="btn btn--ghost">
            {t('home.gallery.cta')}
          </LocalizedLink>
        </div>
        <ul className={styles.teaserGrid}>
          {featured.map((album) => {
            const cover = albumCover(album);
            return (
              <li key={album.id}>
                <LocalizedLink page="gallery" hash={album.id} className={styles.teaserItem}>
                  {cover && (
                    <Picture
                      asset={cover}
                      alt={albumAlt(album, t, album.coverIndex + 1)}
                      className={styles.teaserImg}
                      sizes="(min-width: 48rem) 25vw, 50vw"
                    />
                  )}
                  <span className={styles.teaserCaption}>
                    <span className={styles.teaserCouple}>{albumTitle(album, t)}</span>
                    <span className={styles.teaserVenue}>{albumVenue(album, t)}</span>
                  </span>
                </LocalizedLink>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

/** D-13 §5: the four testimonials, verbatim. */
export const Testimonials = () => {
  const { t } = useTranslation();
  return (
    <section className="section section--white">
      <div className="container">
        <span className="eyebrow">{t('home.testimonials.eyebrow')}</span>
        <h2>{t('home.testimonials.title')}</h2>
        <ul className={styles.quotes}>
          {testimonials.map((item) => (
            <li key={item.id}>
              <figure className={styles.quote}>
                <blockquote className={styles.quoteText}>
                  <p>“{t(item.quoteKey)}”</p>
                </blockquote>
                <figcaption className={styles.quoteAuthor}>
                  <cite>{item.author}</cite>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

/** D-13 §6: about teaser with Vera's portrait. */
export const AboutTeaser = () => {
  const { t } = useTranslation();
  const portrait = IMAGE_META.about[1] ?? IMAGE_META.about[0];
  return (
    <section className="section">
      <div className={`container ${styles.about}`}>
        {portrait && (
          <Picture asset={portrait} alt={t('about.intro')} className={styles.aboutImg} sizes="(min-width: 48rem) 40vw, 100vw" />
        )}
        <div className={styles.aboutText}>
          <span className="eyebrow">{t('home.about.eyebrow')}</span>
          <h2>{t('home.about.title')}</h2>
          <p className="lead">{t('home.about.body')}</p>
          <LocalizedLink page="about" className="btn btn--ghost">
            {t('home.about.cta')}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
};
