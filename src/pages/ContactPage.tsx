import { useTranslation } from 'react-i18next';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';
import { useLocale } from '../i18n/localeContext';
import { contact } from '../data/contact';
import { SeoHead } from '../components/Seo/SeoHead';
import { PageHero } from '../components/Common/PageHero';
import { InquiryForm } from '../components/Contact/InquiryForm';
import styles from './pages.module.css';

/** Contact block + inquiry form (PRD D-9, MASTER-PLAN 2.10). */
export const ContactPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const address = `${contact.address.postalCode} ${contact.address.city}, ${contact.address.street}`;
  return (
    <>
      <SeoHead locale={locale} page="contact" />
      <PageHero eyebrow={t('contact.hero.eyebrow')} title={t('contact.hero.title')} intro={t('contact.hero.intro')} />
      <section className="section--tight">
        <div className={`container ${styles.twoCol}`}>
          <div className={styles.sticky}>
            <div className={`card ${styles.contactCard}`}>
              <dl>
                <div>
                  <dt>{t('contact.ownerLabel')}</dt>
                  <dd>{contact.owner}</dd>
                </div>
                <div>
                  <dt>{t('common.phone')}</dt>
                  <dd>
                    <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
                  </dd>
                </div>
                <div>
                  <dt>{t('common.email')}</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>{t('common.address')}</dt>
                  <dd>
                    <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">
                      {address}
                      <span className="visually-hidden"> {t('common.newTab')}</span>
                    </a>
                  </dd>
                </div>
              </dl>
              <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>{t('contact.social.title')}</h2>
              <p className="muted" style={{ margin: 0 }}>
                {t('contact.social.body')}
              </p>
              <div className={styles.socialRow}>
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                  <FaInstagram aria-hidden="true" /> {contact.instagramHandle}
                  <span className="visually-hidden"> {t('common.newTab')}</span>
                </a>
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                  <FaFacebookF aria-hidden="true" /> Facebook
                  <span className="visually-hidden"> {t('common.newTab')}</span>
                </a>
              </div>
            </div>
          </div>
          <InquiryForm />
        </div>
      </section>
    </>
  );
};
