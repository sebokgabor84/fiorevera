import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import type { Album } from '../../data/types';
import { albumAlt, albumCover, albumImages, albumTitle, albumVenue } from '../../lib/albums';
import { Picture } from '../Common/Picture';
import styles from './gallery.module.css';

interface Props {
  album: Album;
  /** First album on the page → eager cover (LCP). */
  priority?: boolean;
}

/**
 * One album = one section with an anchor. The cover is a <button>; hover (fine pointer),
 * tap, Enter or focus swaps it for an in-place carousel (PRD D-6/D-7, MASTER-PLAN 2.7/2.8).
 * Only the active album mounts its slides.
 */
export const AlbumSection = ({ album, priority = false }: Props) => {
  const { t } = useTranslation();
  const images = albumImages(album);
  const cover = albumCover(album);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(album.coverIndex);
  const trackRef = useRef<HTMLUListElement>(null);
  const coverBtnRef = useRef<HTMLButtonElement>(null);
  /** Focus returning to the cover after Escape must not reopen the carousel. */
  const suppressFocusOpen = useRef(false);
  const statusId = useId();
  const title = albumTitle(album, t);
  const venue = albumVenue(album, t);
  const total = images.length;

  const scrollTo = useCallback((i: number, behavior: ScrollBehavior = 'smooth') => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[i] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft, behavior });
  }, []);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = (i + delta + total) % total;
        scrollTo(next);
        return next;
      });
    },
    [scrollTo, total]
  );

  const open = useCallback(
    (focusRegion: boolean) => {
      setActive(true);
      setIndex(album.coverIndex);
      if (focusRegion) requestAnimationFrame(() => trackRef.current?.focus());
    },
    [album.coverIndex]
  );

  const close = useCallback(() => {
    setActive(false);
    suppressFocusOpen.current = true;
    requestAnimationFrame(() => coverBtnRef.current?.focus());
  }, []);

  // Position the track on the cover when the carousel mounts
  useEffect(() => {
    if (active) scrollTo(album.coverIndex, 'auto');
  }, [active, album.coverIndex, scrollTo]);

  // Keep index in sync with manual swipes
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index && i >= 0 && i < total) setIndex(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const onCoverPointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') open(false);
  };

  return (
    <section id={album.id} className={styles.album} aria-labelledby={`${album.id}-title`}>
      <header className={styles.albumHead}>
        <h2 id={`${album.id}-title`} className={styles.albumTitle}>
          {title}
          {venue && <span className={styles.albumVenue}> — {venue}</span>}
        </h2>
        <p className={`muted ${styles.count}`}>{t('gallery.photoCount', { count: total })}</p>
      </header>

      {!active && cover && (
        <button
          ref={coverBtnRef}
          type="button"
          className={styles.coverBtn}
          aria-label={t('gallery.carousel.open', { title })}
          onClick={() => open(true)}
          onPointerEnter={onCoverPointerEnter}
          onFocus={() => {
            if (suppressFocusOpen.current) return;
            open(false);
          }}
          onBlur={() => {
            suppressFocusOpen.current = false;
          }}
        >
          <Picture
            asset={cover}
            alt={albumAlt(album, t, album.coverIndex + 1)}
            priority={priority}
            className={styles.coverImg}
            sizes="(min-width: 64rem) 60rem, 100vw"
          />
          <span className={styles.coverHint} aria-hidden="true">
            {t('gallery.photoCount', { count: total })}
          </span>
        </button>
      )}

      {active && (
        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="carousel"
          aria-label={t('gallery.carousel.label', { title })}
          aria-describedby={statusId}
        >
          {/* The scrollable track is the keyboard target (arrows / Escape); scrollable regions must be focusable. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          <ul ref={trackRef} className={styles.track} onScroll={onScroll} onKeyDown={onKeyDown} tabIndex={0} aria-label={t('gallery.carousel.hint')}>
            {images.map((img, i) => (
              <li key={img.src} className={styles.slide} aria-hidden={i !== index}>
                <Picture
                  asset={img}
                  alt={albumAlt(album, t, i + 1)}
                  priority={i === index}
                  className={styles.slideImg}
                  sizes="(min-width: 64rem) 60rem, 100vw"
                />
              </li>
            ))}
          </ul>
          <button type="button" className={`${styles.navBtn} ${styles.prev}`} onClick={() => go(-1)} aria-label={t('gallery.carousel.prev')}>
            <FaChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className={`${styles.navBtn} ${styles.next}`} onClick={() => go(1)} aria-label={t('gallery.carousel.next')}>
            <FaChevronRight aria-hidden="true" />
          </button>
          <button type="button" className={styles.closeBtn} onClick={close} aria-label={t('gallery.carousel.close')}>
            <FaTimes aria-hidden="true" />
          </button>
          <p id={statusId} className={styles.status} aria-live="polite">
            {t('gallery.carousel.status', { n: index + 1, total })}
          </p>
        </div>
      )}
    </section>
  );
};
