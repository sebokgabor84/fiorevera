import type { ServiceAreas } from './types';

/** Local-SEO service areas per locale (PRD D-11) — reused by SeoHead JSON-LD and the footer. */
export const serviceAreas: ServiceAreas = {
  hu: ['Zala megye', 'Balaton', 'Nagykanizsa', 'Zalaegerszeg', 'Keszthely'],
  de: ['Burgenland', 'Wien', 'Niederösterreich', 'Steiermark'],
  en: ['Lake Balaton', 'Western Hungary'],
};
