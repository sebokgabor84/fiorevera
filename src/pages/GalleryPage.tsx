import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/localeContext';
import { albums } from '../data/albums';
import { absoluteUrl, pathFor } from '../data/routes';
import { albumAlt, albumImages, albumTitle } from '../lib/albums';
import { SeoHead } from '../components/Seo/SeoHead';
import { PageHero } from '../components/Common/PageHero';
import { AlbumSection } from '../components/Gallery/AlbumSection';
import { CtaStrip } from '../components/Common/CtaStrip';

/** One long page of album sections (PRD D-6, MASTER-PLAN 2.7/2.8) + ImageGallery JSON-LD. */
export const GalleryPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const imageGallery = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: t('meta.gallery.title'),
    url: absoluteUrl(pathFor('gallery', locale)),
    hasPart: albums.map((album) => ({
      '@type': 'ImageGallery',
      name: albumTitle(album, t),
      url: `${absoluteUrl(pathFor('gallery', locale))}#${album.id}`,
      image: albumImages(album).map((img, i) => ({
        '@type': 'ImageObject',
        contentUrl: absoluteUrl(img.src),
        width: img.width,
        height: img.height,
        caption: albumAlt(album, t, i + 1),
      })),
    })),
  };
  return (
    <>
      <SeoHead locale={locale} page="gallery" jsonLd={[imageGallery]} />
      <PageHero eyebrow={t('gallery.hero.eyebrow')} title={t('gallery.hero.title')} intro={t('gallery.hero.intro')} />
      <div className="container">
        {albums.map((album, i) => (
          <AlbumSection key={album.id} album={album} priority={i === 0} />
        ))}
      </div>
      <CtaStrip title={t('gallery.cta.title')} buttonLabel={t('gallery.cta.button')} />
    </>
  );
};
