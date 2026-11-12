import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Album } from '../../data/types';
import { albumAlt, albumImages, albumTitle, albumVenue } from '../../lib/albums';
import { Picture } from '../Common/Picture';
import styles from './gallery.module.css';

interface Props {
  album: Album;
  /** First album on the page → eager first slide (LCP). */
  priority?: boolean;
}

/**
 * One album = one section with an anchor and an always-rendered in-place carousel
 * (PRD D-6/D-7, MASTER-PLAN 2.8 as amended 2026-11-09: no cover/hover swap).
 * Slides are rotated so Vera's cover is slide 1 — the prerendered HTML already shows it,
 * nothing scrolls or re-fits on load. Prev/next are always visible, also on touch.
 * Slides 2…n mount their <img> once the section is near the viewport (MASTER-PLAN 2.7),
 * otherwise browsers prefetch every album's neighbours on a long page.
 */
export const AlbumSection = ({ album, priority = false }: Props) => {
  const { t } = useTranslation();
  const images = albumImages(album);
  const start = Math.min(album.coverIndex, Math.max(images.length - 1, 0));
  const slides = [...images.slice(start), ...images.slice(0, start)].map((asset, i) => ({
    asset,
    /** 1-based position in the original album order, for alt text. */
    n: ((start + i) % Math.max(images.length, 1)) + 1,
  }));
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [near, setNear] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const statusId = useId();
  const title = albumTitle(album, t);
  const venue = albumVenue(album, t);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || near) return;
    if (!('IntersectionObserver' in window)) {
      requestAnimationFrame(() => setNear(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '25% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
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
    }
  };

  return (
    <section ref={sectionRef} id={album.id} className={styles.album} aria-labelledby={`${album.id}-title`}>
      <header className={styles.albumHead}>
        <h2 id={`${album.id}-title`} className={styles.albumTitle}>
          {title}
          {venue && <span className={styles.albumVenue}> — {venue}</span>}
        </h2>
        <p className={`muted ${styles.count}`}>{t('gallery.photoCount', { count: total })}</p>
      </header>

      {total > 0 && (
        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="carousel"
          aria-label={t('gallery.carousel.label', { title })}
          aria-describedby={statusId}
        >
          {/* The scrollable track is the keyboard target (arrow keys); scrollable regions must be focusable. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          <ul ref={trackRef} className={styles.track} onScroll={onScroll} onKeyDown={onKeyDown} tabIndex={0} aria-label={t('gallery.carousel.hint')}>
            {slides.map((slide, i) => (
              <li key={slide.asset.src} className={styles.slide} aria-hidden={i !== index}>
                {(i === 0 || near) && (
                  <Picture
                    asset={slide.asset}
                    alt={albumAlt(album, t, slide.n)}
                    priority={priority && i === 0}
                    className={styles.slideImg}
                    sizes="(min-width: 64rem) 60rem, 100vw"
                  />
                )}
              </li>
            ))}
          </ul>
          {total > 1 && (
            <>
              <button type="button" className={`${styles.navBtn} ${styles.prev}`} onClick={() => go(-1)} aria-label={t('gallery.carousel.prev')}>
                <FaChevronLeft aria-hidden="true" />
              </button>
              <button type="button" className={`${styles.navBtn} ${styles.next}`} onClick={() => go(1)} aria-label={t('gallery.carousel.next')}>
                <FaChevronRight aria-hidden="true" />
              </button>
            </>
          )}
          <p id={statusId} className={styles.status} aria-live="polite">
            {t('gallery.carousel.status', { n: index + 1, total })}
          </p>
        </div>
      )}
    </section>
  );
};
