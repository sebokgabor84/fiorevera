import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Album } from '../../data/types';
import { albumAlt, albumImages, albumTitle, albumVenue } from '../../lib/albums';
import { Picture } from '../Common/Picture';
import styles from './gallery.module.css';

/** Slide the track is on (or nearest to). */
const positionOf = (track: HTMLUListElement): number => Math.round(track.scrollLeft / track.clientWidth);
/** Frames without movement before a move counts as cut short (≈ 0.2 s at 60 Hz), and how often it is restarted. */
const REST_FRAMES = 12;
const MAX_RESTARTS = 3;

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
  /** The slide shown by the counter — the same value as `index`, readable in handlers without a stale closure. */
  const shownRef = useRef(0);
  /** The slide an arrow or key press is animating towards; null while the track rests or is moved by hand. */
  const targetRef = useRef<number | null>(null);
  /** requestAnimationFrame handle of the arrival check that runs while a move is in flight. */
  const arrivalFrame = useRef(0);
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

  const show = useCallback((i: number) => {
    shownRef.current = i;
    setIndex(i);
  }, []);

  // A browser may drop a smooth scroll half-way: Chromium and WebKit do when the scroll container takes
  // focus (measured 2026-11-19: arrow click, then focus on the track — the track stayed where it was).
  // So while a move is in flight, check once per frame that it is still moving; if the track has rested
  // short of its target for about a fifth of a second, start the move again. After three attempts the
  // counter is set to where the track really is — it never shows a photo that is not on screen.
  const ensureArrival = useCallback(() => {
    let lastLeft = -1;
    let framesAtRest = 0;
    let restarts = 0;
    const tick = () => {
      const track = trackRef.current;
      const target = targetRef.current;
      if (!track || target === null) return; // arrived (onScroll) or taken over by hand
      if (track.scrollLeft !== lastLeft) {
        lastLeft = track.scrollLeft;
        framesAtRest = 0;
      } else if (++framesAtRest >= REST_FRAMES) {
        framesAtRest = 0;
        if (positionOf(track) === target || ++restarts > MAX_RESTARTS) {
          targetRef.current = null;
          show(positionOf(track));
          return;
        }
        scrollTo(target);
      }
      arrivalFrame.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(arrivalFrame.current);
    arrivalFrame.current = requestAnimationFrame(tick);
  }, [scrollTo, show]);

  useEffect(() => () => cancelAnimationFrame(arrivalFrame.current), []);

  // Arrows and keys: the counter shows the destination at once and the track animates to it. A second
  // press during the animation continues from that destination, not from wherever the track happens to be.
  const go = useCallback(
    (delta: number) => {
      const next = ((targetRef.current ?? shownRef.current) + delta + total) % total;
      targetRef.current = next;
      show(next);
      scrollTo(next);
      ensureArrival();
    },
    [ensureArrival, scrollTo, show, total]
  );

  // Swipes and scrolling by hand: the counter follows the track. While an arrow or key press is being
  // animated the positions on the way are ignored — following them made the counter (a live region) run
  // through every photo in between, and a key pressed early in the animation started from a stale slide
  // (next, then previous, landed on the LAST photo).
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = positionOf(track);
    if (targetRef.current !== null) {
      if (i === targetRef.current) targetRef.current = null;
      return;
    }
    if (i !== shownRef.current && i >= 0 && i < total) show(i);
  };

  // A finger, the mouse or the wheel takes the track over: stop steering towards the animation's target.
  const releaseTarget = () => {
    targetRef.current = null;
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
          {/* The dash belongs to the venue block (inline-block): it wraps together with the venue, never orphaned at a line end. */}
          {venue && (
            <>
              {' '}
              <span className={styles.albumVenue}>– {venue}</span>
            </>
          )}
        </h2>
        <p className={`muted ${styles.count}`}>{t('gallery.photoCount', { count: total })}</p>
      </header>

      {total > 0 && (
        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="carousel"
          // The venue keeps the landmark name unique: two albums share a couple's names (axe landmark-unique).
          // A keyed string, not a concatenation: word order and punctuation belong to each locale.
          aria-label={venue ? t('gallery.carousel.labelWithVenue', { title, venue }) : t('gallery.carousel.label', { title })}
          aria-describedby={statusId}
        >
          {/* The scrollable track is the keyboard target (arrow keys); scrollable regions must be focusable. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          <ul tabIndex={0}
            ref={trackRef}
            className={styles.track}
            onScroll={onScroll}
            onPointerDown={releaseTarget}
            onTouchStart={releaseTarget}
            onWheel={releaseTarget}
            onKeyDown={onKeyDown}
            aria-label={t('gallery.carousel.hint')}
          >
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
