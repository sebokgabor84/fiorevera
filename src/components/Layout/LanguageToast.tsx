import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pathFor, type Locale } from '../../data/routes';
import { getI18n } from '../../i18n/config';
import { useLocale } from '../../i18n/localeContext';
import {
  dismissLanguageToast,
  isLanguageToastDismissed,
  suggestedLocaleFor,
} from '../../lib/languagePreference';
import { useLanguageLink } from '../../lib/useLanguageLink';
import styles from './language-toast.module.css';

/**
 * Language suggestion toast (PRD D-4, MASTER-PLAN 1.6): after mount only, offers DE/EN
 * when the browser prefers it and the page is in another locale. Never redirects.
 */
export const LanguageToast = () => {
  const { locale, page } = useLocale();
  const [suggested, setSuggested] = useState<Locale | null>(null);
  const onLanguageClick = useLanguageLink();

  useEffect(() => {
    // Runs after paint, as a callback: hydration-safe and no synchronous setState in the effect body.
    const frame = requestAnimationFrame(() => {
      if (isLanguageToastDismissed()) {
        setSuggested(null);
        return;
      }
      const s = suggestedLocaleFor(navigator.languages ?? [navigator.language]);
      setSuggested(s && s !== locale ? s : null);
    });
    return () => cancelAnimationFrame(frame);
  }, [locale]);

  // Reserve space at the page bottom while the toast is shown, so footer links and form buttons
  // can always be scrolled above the fixed toast (global.css `body.toast-visible`).
  useEffect(() => {
    if (!suggested) return;
    document.body.classList.add('toast-visible');
    return () => document.body.classList.remove('toast-visible');
  }, [suggested]);

  if (!suggested) return null;
  const tt = getI18n(suggested).getFixedT(suggested);
  const to = pathFor(page ?? 'home', suggested);

  return (
    <div className={styles.toast} role="status" lang={suggested} data-testid="language-toast">
      <p className={styles.body}>{tt('toast.body')}</p>
      <div className={styles.actions}>
        <Link
          to={to}
          hrefLang={suggested}
          className="btn btn--primary"
          onClick={(event) => {
            onLanguageClick(suggested, to)(event);
            setSuggested(null);
          }}
        >
          {tt('toast.cta')}
        </Link>
        <button
          type="button"
          className={styles.dismiss}
          aria-label={tt('toast.dismiss')}
          onClick={() => {
            dismissLanguageToast();
            setSuggested(null);
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
};
