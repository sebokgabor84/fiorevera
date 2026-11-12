import { describe, it, expect } from 'vitest';
import { MAX_LENGTH, PHONE_RE, validateInquiry, type InquiryInput } from '../../src/lib/validateInquiry';

const valid: InquiryInput = {
  name: 'Teszt Anna',
  email: 'anna@example.com',
  phone: '',
  date: '2027-06-12',
  venue: 'Zalakaros',
  message: 'Szeretnénk árajánlatot kérni.',
  consent: true,
};

describe('validateInquiry (MASTER-PLAN 2.10)', () => {
  it('accepts a complete inquiry', () => {
    expect(validateInquiry(valid)).toEqual({});
  });

  it('flags every empty required field, top of the form first', () => {
    const errors = validateInquiry({ ...valid, name: '  ', email: '', date: '', venue: '', message: '\n', consent: false });
    expect(Object.keys(errors)).toEqual(['name', 'email', 'date', 'venue', 'message', 'consent']);
    expect(errors.name).toEqual({ code: 'required' });
    expect(errors.email).toEqual({ code: 'required' });
    expect(errors.consent).toEqual({ code: 'consent' });
  });

  it('rejects an e-mail without a dot in the domain even when the browser accepts it', () => {
    expect(validateInquiry({ ...valid, email: 'anna@example', emailValidByBrowser: true })).toEqual({ email: { code: 'email' } });
  });

  it('defers to the browser when it rejects the e-mail', () => {
    expect(validateInquiry({ ...valid, email: 'anna@example.com', emailValidByBrowser: false })).toEqual({ email: { code: 'email' } });
  });

  it('rejects malformed and over-long e-mails', () => {
    for (const email of ['anna', 'anna@', '@example.com', 'anna example@x.com', `${'a'.repeat(250)}@x.com`]) {
      expect(validateInquiry({ ...valid, email }), email).toEqual({ email: { code: 'email' } });
    }
  });

  it('accepts digits, single spaces and a leading plus in the phone, kept as typed', () => {
    for (const phone of ['+36 30 865 9108', '06308659108', '+4915112345678', '36 30 865 91 08', ' +36 30 865 9108 ']) {
      expect(validateInquiry({ ...valid, phone }), phone).toEqual({});
    }
  });

  it('rejects any other phone shape', () => {
    for (const phone of ['abc', '+36-30-865-9108', '(06) 30 865 9108', '+36  30 865', '12345', '1'.repeat(16), '36 30 865 9108+', '+']) {
      expect(validateInquiry({ ...valid, phone }), phone).toEqual({ phone: { code: 'phone' } });
    }
    expect(PHONE_RE.test('+36 30 865 9108')).toBe(true);
  });

  it('caps the free-text fields and reports the limit', () => {
    expect(validateInquiry({ ...valid, name: 'x'.repeat(MAX_LENGTH.name + 1) })).toEqual({ name: { code: 'tooLong', max: 100 } });
    expect(validateInquiry({ ...valid, venue: 'x'.repeat(MAX_LENGTH.venue + 1) })).toEqual({ venue: { code: 'tooLong', max: 150 } });
    expect(validateInquiry({ ...valid, message: 'x'.repeat(MAX_LENGTH.message + 1) })).toEqual({ message: { code: 'tooLong', max: 2000 } });
    expect(validateInquiry({ ...valid, message: 'x'.repeat(MAX_LENGTH.message) })).toEqual({});
  });

  it('does not reject angle brackets or quotes — escaping is the renderer’s job, not the validator’s', () => {
    expect(validateInquiry({ ...valid, name: 'Anna <3', venue: 'Kúria "Rózsa"', message: '<b>hi</b> & bye' })).toEqual({});
  });
});
