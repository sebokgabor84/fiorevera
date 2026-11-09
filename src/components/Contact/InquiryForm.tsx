import { useId, useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { contact } from '../../data/contact';
import { useLocale } from '../../i18n/localeContext';
import { submitInquiry } from '../../lib/submitInquiry';
import { LocalizedLink } from '../Common/LocalizedLink';
import styles from './inquiry-form.module.css';

type Field = 'name' | 'email' | 'phone' | 'date' | 'venue' | 'message' | 'consent';
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Exposed for the E2E suite so it can tell whether a provider endpoint is configured. */
const ENDPOINT_STATE = import.meta.env.VITE_FORM_ENDPOINT ? 'configured' : 'missing';

/** Quote request form (PRD D-9, US-10, MASTER-PLAN 2.10). */
export const InquiryForm = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (data: FormData): Errors => {
    const e: Errors = {};
    const req = (f: Field) => {
      if (!String(data.get(f) ?? '').trim()) e[f] = t('contact.form.errors.required');
    };
    req('name');
    req('date');
    req('venue');
    req('message');
    const email = String(data.get('email') ?? '').trim();
    if (!email) e.email = t('contact.form.errors.required');
    else if (!EMAIL_RE.test(email)) e.email = t('contact.form.errors.email');
    if (data.get('consent') !== 'on') e.consent = t('contact.form.errors.consent');
    return e;
  };

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    const nextErrors = validate(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus('sending');
    const result = await submitInquiry({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      date: String(data.get('date') ?? ''),
      venue: String(data.get('venue') ?? ''),
      message: String(data.get('message') ?? ''),
      website: String(data.get('website') ?? ''),
      locale,
    });
    if (result.ok) {
      setStatus('success');
      form.reset();
    } else {
      setStatus('error');
    }
  };

  const describedBy = (f: Field) => (errors[f] ? `${id}-${f}-error` : undefined);
  const errorEl = (f: Field) =>
    errors[f] ? (
      <p id={`${id}-${f}-error`} className={styles.error} role="alert">
        {errors[f]}
      </p>
    ) : null;

  if (status === 'success') {
    return (
      <div className={`card ${styles.form} ${styles.success}`} role="status" data-testid="inquiry-success">
        <h2 className={styles.title}>{t('contact.form.title')}</h2>
        <p>{t('contact.form.success')}</p>
      </div>
    );
  }

  return (
    <form
      className={`card ${styles.form}`}
      onSubmit={onSubmit}
      noValidate
      data-testid="inquiry-form"
      data-endpoint={ENDPOINT_STATE}
    >
      <h2 className={styles.title}>{t('contact.form.title')}</h2>
      <p className={`muted ${styles.hint}`}>{t('contact.form.intro')}</p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${id}-name`}>{t('contact.form.name')} *</label>
          <input id={`${id}-name`} name="name" type="text" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={describedBy('name')} />
          {errorEl('name')}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-email`}>{t('contact.form.email')} *</label>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={describedBy('email')} />
          {errorEl('email')}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${id}-phone`}>
            {t('contact.form.phone')} <span className="muted">({t('contact.form.optional')})</span>
          </label>
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-date`}>{t('contact.form.date')} *</label>
          <input id={`${id}-date`} name="date" type="date" required aria-invalid={!!errors.date} aria-describedby={describedBy('date')} />
          {errorEl('date')}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-venue`}>{t('contact.form.venue')} *</label>
        <input id={`${id}-venue`} name="venue" type="text" required aria-invalid={!!errors.venue} aria-describedby={describedBy('venue')} />
        {errorEl('venue')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-message`}>{t('contact.form.message')} *</label>
        <textarea id={`${id}-message`} name="message" rows={6} required placeholder={t('contact.form.messagePlaceholder')} aria-invalid={!!errors.message} aria-describedby={describedBy('message')} />
        {errorEl('message')}
      </div>

      {/* Honeypot — hidden from humans, tempting for bots */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={`${styles.field} ${styles.consent}`}>
        <input id={`${id}-consent`} name="consent" type="checkbox" required aria-invalid={!!errors.consent} aria-describedby={describedBy('consent')} />
        <label htmlFor={`${id}-consent`}>
          <Trans i18nKey="contact.form.consent" components={[<LocalizedLink key="privacy" page="privacy" />]} />
          {' *'}
        </label>
        {errorEl('consent')}
      </div>

      {status === 'error' && (
        <p className={styles.formError} role="alert">
          {t('contact.form.error')}{' '}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>
      )}

      <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
        {status === 'sending' ? t('contact.form.sending') : t('contact.form.submit')}
      </button>
    </form>
  );
};
