import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';
import { LOCALES, NAV_PAGE_IDS, pathFor } from '../../data/routes';
import { contact } from '../../data/contact';
import { serviceAreas } from '../../data/serviceAreas';
import { useLocale } from '../../i18n/localeContext';
import { rememberLanguageChoice } from '../../lib/languagePreference';
import { LocalizedLink } from '../Common/LocalizedLink';
import styles from './footer.module.css';

/** Footer: contact strip, pages, language links, privacy, dynamic year (MASTER-PLAN 1.7). */
export const Footer = () => {
  const { t } = useTranslation();
  const { locale, page } = useLocale();
  const year = new Date().getFullYear();
  const address = `${contact.address.postalCode} ${contact.address.city}, ${contact.address.street}`;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <p className={styles.brand}>Fiore Vera</p>
          <p className={styles.tagline}>{t('footer.tagline')}</p>
          <p className={`muted ${styles.areas}`}>{t('footer.areas', { areas: serviceAreas[locale].join(', ') })}</p>
          <ul className={styles.social} aria-label="Social">
            <li>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <FaInstagram aria-hidden="true" />
                <span>Instagram</span>
                <span className="visually-hidden"> {t('common.newTab')}</span>
              </a>
            </li>
            <li>
              <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <FaFacebookF aria-hidden="true" />
                <span>Facebook</span>
                <span className="visually-hidden"> {t('common.newTab')}</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={styles.colTitle}>{t('footer.contactTitle')}</h2>
          <address className={styles.address}>
            <p>{contact.owner}</p>
            <p>
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </p>
            <p>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
            <p>
              <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">
                {address}
                <span className="visually-hidden"> {t('common.newTab')}</span>
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className={styles.colTitle}>{t('footer.pagesTitle')}</h2>
          <ul className={styles.links}>
            {NAV_PAGE_IDS.map((p) => (
              <li key={p}>
                <LocalizedLink page={p}>{t(`nav.${p}`)}</LocalizedLink>
              </li>
            ))}
            <li>
              <LocalizedLink page="privacy">{t('nav.privacy')}</LocalizedLink>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={styles.colTitle}>{t('footer.languagesTitle')}</h2>
          <ul className={styles.links}>
            {LOCALES.map((code) => (
              <li key={code}>
                <Link
                  to={pathFor(page ?? 'home', code)}
                  hrefLang={code}
                  lang={code}
                  aria-current={code === locale ? 'true' : undefined}
                  onClick={() => rememberLanguageChoice(code)}
                >
                  {t(`lang.${code}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`container ${styles.legal}`}>
        <p>
          © {year} Fiore Vera · {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
};
