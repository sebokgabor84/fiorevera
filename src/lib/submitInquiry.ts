/**
 * Inquiry submission (PRD D-9, R-4): one swappable function in front of the form
 * provider. Configure VITE_FORM_ENDPOINT (Web3Forms or Formspree) and, for
 * Web3Forms, VITE_FORM_ACCESS_KEY. Without an endpoint the submission fails
 * cleanly and the UI shows the email/phone fallback.
 */
export interface InquiryPayload {
  name: string;
  email: string;
  phone: string;
  date: string;
  venue: string;
  message: string;
  locale: string;
  /** Honeypot — must stay empty. */
  website: string;
}

export type InquiryResult = { ok: true } | { ok: false; reason: 'spam' | 'config' | 'network' | 'rejected' };

/** Subject line of the delivered mail — shared with the mailto fallback so both paths look the same in the inbox. */
export const inquirySubject = (name: string): string => `Árajánlatkérés – fiorevera.hu (${name})`;

/** Sender name shown in the inbox instead of the provider's default (Web3Forms `from_name`). */
export const INQUIRY_FROM_NAME = 'Fiore Vera weboldal';

/**
 * Field labels of the delivered mail. Web3Forms forwards every non-reserved key of the JSON body
 * as-is, so these keys are the labels Vera reads in her inbox — Hungarian, whatever language the
 * visitor used (the mail subject is Hungarian for the same reason). The object's order is the
 * order of the lines in the mail.
 */
export const INQUIRY_MAIL_LABELS = {
  name: 'Név',
  email: 'E-mail',
  phone: 'Telefonszám',
  date: 'Esküvő dátuma',
  venue: 'Helyszín',
  message: 'Üzenet',
  locale: 'Nyelv',
} as const;

export const submitInquiry = async (payload: InquiryPayload, fetchImpl: typeof fetch = fetch): Promise<InquiryResult> => {
  if (payload.website) return { ok: true }; // silently drop bots
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
  if (!endpoint) return { ok: false, reason: 'config' };
  const accessKey = import.meta.env.VITE_FORM_ACCESS_KEY as string | undefined;
  const L = INQUIRY_MAIL_LABELS;
  const body: Record<string, string> = {
    [L.name]: payload.name,
    [L.email]: payload.email,
    [L.phone]: payload.phone,
    [L.date]: payload.date,
    [L.venue]: payload.venue,
    [L.message]: payload.message,
    [L.locale]: payload.locale,
    // Reserved Web3Forms keys (not shown as fields): the reserved `email` key would set Reply-To,
    // but it is now labelled in Hungarian, so the visitor's address is passed as `replyto` instead.
    replyto: payload.email,
    subject: inquirySubject(payload.name),
    from_name: INQUIRY_FROM_NAME,
  };
  if (accessKey) body.access_key = accessKey;
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok ? { ok: true } : { ok: false, reason: 'rejected' };
  } catch {
    return { ok: false, reason: 'network' };
  }
};
