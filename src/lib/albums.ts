import type { TFunction } from 'i18next';
import type { Album } from '../data/types';
import { IMAGE_META, type ImageAsset } from '../data/generated/imageMeta';

export const albumImages = (album: Album): ImageAsset[] => IMAGE_META.gallery[album.id] ?? [];

export const albumCover = (album: Album): ImageAsset | undefined => {
  const images = albumImages(album);
  return images[album.coverIndex] ?? images[0];
};

/** "Klaudia és Thomas" / "Klaudia und Thomas" / "Klaudia and Thomas" — the joiner is localized (QA M5). */
export const albumTitle = (album: Album, t: TFunction): string =>
  album.titleKey ? t(album.titleKey) : album.partners ? album.partners.join(` ${t('gallery.and')} `) : album.id;

/** "Venue, Town" plus the country for non-HU venues. */
export const albumVenue = (album: Album, t: TFunction): string =>
  [album.venue.name, album.venue.town, album.venue.country === 'HU' ? null : t(`gallery.countries.${album.venue.country}`)]
    .filter((part): part is string => Boolean(part))
    .join(', ');

/** Templated alt text per album (PRD D-5) — n is 1-based. */
export const albumAlt = (album: Album, t: TFunction, n: number): string => {
  const title = albumTitle(album, t);
  const venue = albumVenue(album, t);
  return venue ? t('gallery.albumAlt', { title, venue, n }) : t('gallery.albumAltNoVenue', { title, n });
};
