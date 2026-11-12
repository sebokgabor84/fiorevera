import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LOCALES, pathFor, type Locale } from '../../data/routes';
import { useLocale } from '../../i18n/localeContext';
import { rememberLanguageChoice } from '../../lib/languagePreference';
import styles from './language-switch.module.css';

interface Props {
  compact?: boolean;
}

/** HU / DE / EN links to the same page in the other locales (MASTER-PLAN 1.5). */
export const LanguageSwitch = ({ compact = false }: Props) => {
  const { t } = useTranslation();
  const { locale, page } = useLocale();
  return (
    <nav className={`${styles.switch} ${compact ? styles.compact : ''}`} aria-label={t('lang.label')}>
      <ul className={styles.list}>
        {LOCALES.map((code: Locale) => {
          const active = code === locale;
          // Accessible name starts with the visible "HU"/"DE"/"EN" (WCAG 2.5.3 Label in Name).
          const label = `${code.toUpperCase()} – ${t(`lang.${code}`)}`;
          return (
            <li key={code}>
              <Link
                to={pathFor(page ?? 'home', code)}
                hrefLang={code}
                lang={code}
                className={`${styles.link} ${active ? styles.active : ''}`}
                aria-current={active ? 'true' : undefined}
                aria-label={active ? `${label} (${t('lang.current')})` : label}
                onClick={() => rememberLanguageChoice(code)}
              >
                {code.toUpperCase()}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
