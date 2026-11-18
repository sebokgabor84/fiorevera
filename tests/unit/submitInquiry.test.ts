import { describe, it, expect, vi, afterEach } from 'vitest';
import { INQUIRY_MAIL_LABELS, submitInquiry, type InquiryPayload } from '../../src/lib/submitInquiry';

const ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = 'test-access-key';

const payload: InquiryPayload = {
  name: 'Teszt Anna',
  email: 'anna@example.com',
  phone: '+36 30 000 0000',
  date: '2027-06-12',
  venue: 'Zalakaros',
  message: 'Szeretnénk árajánlatot kérni.',
  locale: 'hu',
  website: '',
};

const fetchAnswering = (status: number) =>
  vi.fn<typeof fetch>().mockResolvedValue(new Response('{"success":true}', { status }));

const sentBody = (fetchImpl: ReturnType<typeof fetchAnswering>): Record<string, unknown> => {
  const init = fetchImpl.mock.calls[0][1];
  return JSON.parse(String(init?.body));
};

describe('submitInquiry (PRD D-9, MASTER-PLAN 2.10)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('fails with reason "config" and never calls fetch when no endpoint is configured', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', '');
    const fetchImpl = fetchAnswering(200);
    await expect(submitInquiry(payload, fetchImpl)).resolves.toEqual({ ok: false, reason: 'config' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('drops a filled honeypot silently: ok without any request, even with no endpoint', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', '');
    const fetchImpl = fetchAnswering(200);
    await expect(submitInquiry({ ...payload, website: 'http://spam.example' }, fetchImpl)).resolves.toEqual({ ok: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('labels the mail fields in Hungarian (the keys are what Vera reads in the delivered mail)', () => {
    expect(INQUIRY_MAIL_LABELS).toEqual({
      name: 'Név',
      email: 'E-mail',
      phone: 'Telefonszám',
      date: 'Esküvő dátuma',
      venue: 'Helyszín',
      message: 'Üzenet',
      locale: 'Nyelv',
    });
  });

  it('posts JSON to the configured endpoint with the Hungarian field labels, the reserved keys and the access key (Web3Forms)', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    vi.stubEnv('VITE_FORM_ACCESS_KEY', ACCESS_KEY);
    const fetchImpl = fetchAnswering(200);
    await expect(submitInquiry(payload, fetchImpl)).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });

    const body = sentBody(fetchImpl);
    // The exact key set, in mail order: seven labelled fields, then the reserved Web3Forms keys.
    expect(Object.keys(body)).toEqual([
      'Név',
      'E-mail',
      'Telefonszám',
      'Esküvő dátuma',
      'Helyszín',
      'Üzenet',
      'Nyelv',
      'replyto',
      'subject',
      'from_name',
      'access_key',
    ]);
    expect(body).toEqual({
      Név: payload.name,
      'E-mail': payload.email,
      Telefonszám: payload.phone,
      'Esküvő dátuma': payload.date,
      Helyszín: payload.venue,
      Üzenet: payload.message,
      Nyelv: 'hu',
      replyto: payload.email, // Reply in the mail client goes to the visitor
      subject: 'Árajánlatkérés – fiorevera.hu (Teszt Anna)',
      from_name: 'Fiore Vera weboldal',
      access_key: ACCESS_KEY,
    });
    // The provider's English-labelled keys are gone, so the mail cannot show "Wedding date" next to "Esküvő dátuma".
    for (const legacy of ['name', 'email', 'phone', 'wedding_date', 'venue', 'message', 'locale']) expect(body).not.toHaveProperty(legacy);
    expect(body.subject).toBe('Árajánlatkérés – fiorevera.hu (Teszt Anna)');
    expect(body.from_name).toBe('Fiore Vera weboldal');
    expect(body).not.toHaveProperty('website'); // the honeypot never reaches the provider
  });

  it('omits access_key when no key is configured (Formspree)', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', 'https://formspree.io/f/abc123');
    vi.stubEnv('VITE_FORM_ACCESS_KEY', '');
    const fetchImpl = fetchAnswering(200);
    await expect(submitInquiry(payload, fetchImpl)).resolves.toEqual({ ok: true });
    expect(sentBody(fetchImpl)).not.toHaveProperty('access_key');
  });

  it('returns reason "rejected" on a non-2xx response', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    const fetchImpl = fetchAnswering(422);
    await expect(submitInquiry(payload, fetchImpl)).resolves.toEqual({ ok: false, reason: 'rejected' });
  });

  it('returns reason "network" when fetch throws', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(submitInquiry(payload, fetchImpl)).resolves.toEqual({ ok: false, reason: 'network' });
  });
});
