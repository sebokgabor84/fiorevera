import { useTranslation } from 'react-i18next';
import { contact } from '../../data/contact';
import type { PageId } from '../../data/routes';
import { LocalizedLink } from './LocalizedLink';
import styles from './cta-strip.module.css';

interface Props {
  title: string;
  body?: string;
  buttonLabel: string;
  page?: PageId;
  hash?: string;
  showContact?: boolean;
}

/** "Kérj árajánlatot" strip with the contact fallbacks (PRD D-13 §7). */
export const CtaStrip = ({ title, body, buttonLabel, page = 'contact', hash, showContact = true }: Props) => {
  const { t } = useTranslation();
  return (
    <section className={styles.strip}>
      <div className={`container ${styles.inner}`}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {body && <p className={styles.body}>{body}</p>}
        </div>
        <div className={styles.actions}>
          <LocalizedLink page={page} hash={hash} className="btn btn--gold">
            {buttonLabel}
          </LocalizedLink>
          {showContact && (
            <p className={styles.contact}>
              <span className="muted">{t('home.cta.or')}</span>{' '}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
