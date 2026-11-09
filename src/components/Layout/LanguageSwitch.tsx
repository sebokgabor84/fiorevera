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
          return (
            <li key={code}>
              <Link
                to={pathFor(page ?? 'home', code)}
                hrefLang={code}
                lang={code}
                className={`${styles.link} ${active ? styles.active : ''}`}
                aria-current={active ? 'true' : undefined}
                aria-label={active ? t('lang.current', { lang: t(`lang.${code}`) }) : t('lang.switchTo', { lang: t(`lang.${code}`) })}
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
