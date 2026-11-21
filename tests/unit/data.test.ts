import { describe, it, expect } from 'vitest';
import { albums, featuredAlbumIds } from '../../src/data/albums';
import { rentalItems } from '../../src/data/rentalItems';
import { services } from '../../src/data/services';
import { testimonials } from '../../src/data/testimonials';
import { serviceAreas } from '../../src/data/serviceAreas';
import { contact, formatHuf } from '../../src/data/contact';
import {
  ContactSchema,
  ServiceAreasSchema,
  validateAlbums,
  validateRentalItems,
  validateServices,
  validateTestimonials,
} from '../../src/data/types';
import { IMAGE_META } from '../../src/data/generated/imageMeta';
import { flatten, loadLocales } from '../../scripts/validate-i18n';

const locales = loadLocales();
const keysOf = (l: string) => flatten(locales[l]);

const expectKeyEverywhere = (key: string) => {
  for (const l of ['hu', 'de', 'en']) expect(keysOf(l).has(key), `${key} missing in ${l}`).toBe(true);
};

describe('data contracts (MASTER-PLAN 1.3)', () => {
  it('albums validate, have unique ids and a cover inside their image list', () => {
    const parsed = validateAlbums(albums);
    // Counts are derived, never pinned: albums, photos, items and testimonials are content the
    // owner changes through `npm run content` (docs/vera-agent/PRD.md, R1).
    expect(new Set(parsed.map((a) => a.id)).size).toBe(parsed.length);
    for (const a of parsed) {
      const images = IMAGE_META.gallery[a.id];
      expect(images, `no generated images for album ${a.id}`).toBeDefined();
      expect(images.length).toBeGreaterThan(0);
      expect(a.coverIndex).toBeLessThan(images.length);
      if (a.titleKey) expectKeyEverywhere(a.titleKey);
    }
    for (const id of featuredAlbumIds) expect(parsed.some((a) => a.id === id)).toBe(true);
  });

  it('every photo folder of the gallery belongs to an album', () => {
    const ids = new Set(albums.map((a) => a.id));
    expect(Object.keys(IMAGE_META.gallery).filter((slot) => !ids.has(slot))).toEqual([]);
  });

  it('rental items validate and every key + image slot exists', () => {
    const parsed = validateRentalItems(rentalItems);
    expect(new Set(parsed.map((i) => i.id)).size).toBe(parsed.length);
    for (const item of parsed) {
      expectKeyEverywhere(item.nameKey);
      expectKeyEverywhere(item.descriptionKey);
      if (item.notesKey) expectKeyEverywhere(item.notesKey);
      expect(IMAGE_META.rental[item.id]?.length, `no image slot for rental/${item.id}`).toBeGreaterThan(0);
    }
  });

  it('services, testimonials, areas and contact validate', () => {
    for (const s of validateServices(services)) {
      expectKeyEverywhere(s.titleKey);
      expectKeyEverywhere(s.introKey);
      expectKeyEverywhere(s.ctaKey);
      for (const k of s.stepKeys ?? []) {
        expectKeyEverywhere(`${k}.title`);
        expectKeyEverywhere(`${k}.body`);
      }
      for (const k of s.checklistKeys ?? []) expectKeyEverywhere(k);
    }
    expect(services.find((s) => s.id === 'full')?.checklistKeys).toHaveLength(12);
    for (const tst of validateTestimonials(testimonials)) expectKeyEverywhere(tst.quoteKey);
    expect(new Set(testimonials.map((t) => t.id)).size).toBe(testimonials.length);
    ServiceAreasSchema.parse(serviceAreas);
    ContactSchema.parse(contact);
  });

  it('hero, about and brand slots are populated', () => {
    expect(IMAGE_META.hero.length).toBeGreaterThan(0);
    expect(IMAGE_META.about.length).toBeGreaterThan(0);
    expect(IMAGE_META.brand.length).toBe(1);
  });

  it('formats HUF deterministically', () => {
    expect(formatHuf(19990)).toBe('19 990 Ft');
    expect(formatHuf(3500)).toBe('3 500 Ft');
    expect(formatHuf(500)).toBe('500 Ft');
  });
});
