/**
 * Pure client-side validation for the quote-request form (MASTER-PLAN 2.10).
 * Returns error codes, not copy — the form maps codes to `contact.form.errors.*` strings.
 * Nothing here is a security boundary: React escapes every value it renders and the mailto fallback
 * percent-encodes the body, so the rules exist only to give visitors a specific, helpful message.
 */
export type InquiryField = 'name' | 'email' | 'phone' | 'date' | 'venue' | 'message' | 'consent';

export type InquiryError =
  | { code: 'required' }
  | { code: 'email' }
  | { code: 'phone' }
  | { code: 'consent' }
  | { code: 'tooLong'; max: number };

export type InquiryErrors = Partial<Record<InquiryField, InquiryError>>;

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  date: string;
  venue: string;
  message: string;
  consent: boolean;
  /** The browser's own verdict on the e-mail field (`input.validity.valid`); `undefined` when unavailable (tests, SSR). */
  emailValidByBrowser?: boolean;
}

/** Hard caps per free-text field — generous for real inquiries, a lid on pasted novels. */
export const MAX_LENGTH = { name: 100, email: 254, venue: 150, message: 2000 } as const;

/**
 * Optional leading `+`, 6–15 digits (ITU E.164 limit), single spaces allowed between digits.
 * Dashes, parentheses and dots are rejected on purpose — the owner asked for digits, spaces and `+` only.
 */
export const PHONE_RE = /^\+?\d(?: ?\d){5,14}$/;

/** Local part, `@`, and a domain that contains a dot — the browser accepts `anna@example`, we do not. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateInquiry = (input: InquiryInput): InquiryErrors => {
  const errors: InquiryErrors = {};
  const required = (field: 'name' | 'date' | 'venue' | 'message') => {
    const value = input[field].trim();
    if (!value) errors[field] = { code: 'required' };
    else if (field !== 'date' && value.length > MAX_LENGTH[field]) errors[field] = { code: 'tooLong', max: MAX_LENGTH[field] };
  };
  // Insertion order = focus order on submit: top of the form first.
  required('name');

  const email = input.email.trim();
  if (!email) errors.email = { code: 'required' };
  else if (email.length > MAX_LENGTH.email || input.emailValidByBrowser === false || !EMAIL_RE.test(email)) {
    errors.email = { code: 'email' };
  }

  const phone = input.phone.trim();
  if (phone && !PHONE_RE.test(phone)) errors.phone = { code: 'phone' };

  required('date');
  required('venue');
  required('message');
  if (!input.consent) errors.consent = { code: 'consent' };
  return errors;
};
