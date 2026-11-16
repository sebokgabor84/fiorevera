import { describe, it, expect } from 'vitest';
import { buildMailto } from '../../src/lib/inquiryMailto';
import { inquirySubject } from '../../src/lib/submitInquiry';

const TO = 'info.fiorevera@gmail.com';

describe('buildMailto (PRD D-9 fallback)', () => {
  it('targets the address and carries subject + body as encoded query parameters', () => {
    const href = buildMailto(TO, inquirySubject('Teszt Anna'), [
      { label: 'Név', value: 'Teszt Anna' },
      { label: 'Helyszín', value: 'Zalakaros' },
    ]);
    const url = new URL(href);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe(TO);
    expect(url.searchParams.get('subject')).toBe('Árajánlatkérés – fiorevera.hu (Teszt Anna)');
    expect(url.searchParams.get('body')).toBe('Név: Teszt Anna\r\nHelyszín: Zalakaros');
  });

  it('uses percent-encoding (no raw spaces, accents or line breaks) with CRLF between lines', () => {
    const href = buildMailto(TO, 'Árajánlat', [
      { label: 'A', value: 'első' },
      { label: 'B', value: 'második' },
    ]);
    expect(href).toMatch(/^mailto:info\.fiorevera@gmail\.com\?subject=%C3%81raj%C3%A1nlat&body=/);
    expect(href).not.toMatch(/[\sÀ-ſ]/);
    expect(href).toContain('%0D%0A');
  });

  it('drops empty optional lines and trims values', () => {
    const href = buildMailto(TO, 's', [
      { label: 'Név', value: '  Teszt Anna ' },
      { label: 'Telefonszám', value: '' },
      { label: 'Üzenet', value: '   ' },
      { label: 'Helyszín', value: 'Zalakaros' },
    ]);
    expect(new URL(href).searchParams.get('body')).toBe('Név: Teszt Anna\r\nHelyszín: Zalakaros');
  });

  it('keeps multi-line messages intact', () => {
    const href = buildMailto(TO, 's', [{ label: 'Üzenet', value: 'első sor\nmásodik sor' }]);
    expect(new URL(href).searchParams.get('body')).toBe('Üzenet: első sor\nmásodik sor');
  });
});
