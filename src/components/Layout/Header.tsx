import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_PAGE_IDS, pathFor } from '../../data/routes';
import { IMAGE_META } from '../../data/generated/imageMeta';
import { useLocale } from '../../i18n/localeContext';
import { LanguageSwitch } from './LanguageSwitch';
import { LocalizedLink } from '../Common/LocalizedLink';
import styles from './header.module.css';

const FOCUSABLE = 'a[href], button:not([disabled])';

/** Site header: logo, nav (6 pages), language switch, mobile menu with focus trap (MASTER-PLAN 1.5). */
export const Header = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { pathname } = useLocation();
  // Menu is "open for this pathname": navigating closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const logo = IMAGE_META.brand[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Focus first link when opened; lock body scroll
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const close = useCallback(() => {
    setOpenPath(null);
    toggleRef.current?.focus();
  }, []);

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <header className={`${styles.header} ${scrolled || open ? styles.scrolled : ''}`}>
      <div className={`container ${styles.bar}`}>
        <LocalizedLink page="home" className={styles.logo} aria-label={t('nav.logoLabel')}>
          {logo && <img src={logo.src} width={logo.width} height={logo.height} alt="" className={styles.logoImg} />}
          <span className={styles.wordmark}>
            <span className={styles.brand}>Fiore Vera</span>
            <span className={styles.tagline}>{t('meta.tagline')}</span>
          </span>
        </LocalizedLink>

        <nav className={styles.desktopNav} aria-label={t('nav.mainLabel')}>
          <ul className={styles.navList}>
            {NAV_PAGE_IDS.map((page) => (
              <li key={page}>
                <NavLink
                  to={pathFor(page, locale)}
                  end={page === 'home'}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                >
                  {t(`nav.${page}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <div className={styles.desktopOnly}>
            <LanguageSwitch />
          </div>
          <LocalizedLink page="contact" className={`btn btn--primary ${styles.quoteBtn}`}>
            {t('nav.quote')}
          </LocalizedLink>
          <button
            ref={toggleRef}
            type="button"
            className={styles.menuToggle}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            <span className={`${styles.burger} ${open ? styles.burgerOpen : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className={styles.menuWord}>{t('nav.menu')}</span>
          </button>
        </div>
      </div>

      {/* Mobile panel — always in the DOM for SSR parity; shown via [hidden] + CSS */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        id={menuId}
        ref={panelRef}
        className={styles.panel}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu')}
        onKeyDown={onPanelKeyDown}
      >
        <nav aria-label={t('nav.mainLabel')}>
          <ul className={styles.panelList}>
            {NAV_PAGE_IDS.map((page) => (
              <li key={page}>
                <NavLink
                  to={pathFor(page, locale)}
                  end={page === 'home'}
                  className={({ isActive }) => `${styles.panelLink} ${isActive ? styles.navActive : ''}`}
                >
                  {t(`nav.${page}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.panelFooter}>
          <LanguageSwitch compact />
          <LocalizedLink page="contact" className="btn btn--primary">
            {t('nav.quote')}
          </LocalizedLink>
        </div>
      </div>
    </header>
  );
};
