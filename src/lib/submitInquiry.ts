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

export const submitInquiry = async (payload: InquiryPayload, fetchImpl: typeof fetch = fetch): Promise<InquiryResult> => {
  if (payload.website) return { ok: true }; // silently drop bots
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
  if (!endpoint) return { ok: false, reason: 'config' };
  const accessKey = import.meta.env.VITE_FORM_ACCESS_KEY as string | undefined;
  const body: Record<string, string> = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    wedding_date: payload.date,
    venue: payload.venue,
    message: payload.message,
    locale: payload.locale,
    subject: `Árajánlatkérés – fiorevera.hu (${payload.name})`,
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
