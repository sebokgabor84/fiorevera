/**
 * Data contracts (PRD §5 "Data contracts", MASTER-PLAN 1.3).
 * Data files are validated against these schemas in tests/unit/data.test.ts —
 * if validation fails, fix the data, not the schema.
 */
import { z } from 'zod';
import { LOCALES, PAGE_IDS } from './routes';

const slug = z.string().regex(/^[a-z0-9-]+$/, 'kebab-case slug expected');
const i18nKey = z.string().regex(/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/, 'dotted i18n key expected');

export const CountryCodeSchema = z.enum(['HU', 'AT']);

export const AlbumSchema = z.object({
  id: slug,
  /** Couple (proper noun, not translated). */
  couple: z.string().min(1),
  /** Optional i18n key for albums that are not a couple (magazine shoot, styled shoot). */
  titleKey: i18nKey.optional(),
  venue: z.object({
    name: z.string().min(1).nullable(),
    town: z.string().min(1).nullable(),
    country: CountryCodeSchema,
  }),
  /** Index into IMAGE_META.gallery[id] — exactly one cover per album, chosen by Vera (D-6). */
  coverIndex: z.number().int().nonnegative(),
});
export type Album = z.infer<typeof AlbumSchema>;

export const RentalUnitSchema = z.enum(['occasion', 'piece', 'set', 'wall']);

export const RentalItemSchema = z.object({
  id: slug,
  nameKey: i18nKey,
  descriptionKey: i18nKey,
  notesKey: i18nKey.optional(),
  /** Free-text size, identical across locales (uses × and cm). */
  size: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  priceHuf: z.number().int().positive(),
  unit: RentalUnitSchema,
  depositHuf: z.number().int().positive().optional(),
  pickupOnly: z.literal(true),
  pickupTown: z.string().min(1).optional(),
});
export type RentalItem = z.infer<typeof RentalItemSchema>;

export const ServiceSchema = z.object({
  id: z.enum(['full', 'floristry', 'rental']),
  anchor: slug,
  titleKey: i18nKey,
  introKey: i18nKey,
  stepKeys: z.array(i18nKey).optional(),
  checklistKeys: z.array(i18nKey).optional(),
  ctaPage: z.enum(PAGE_IDS),
  ctaKey: i18nKey,
});
export type Service = z.infer<typeof ServiceSchema>;

export const TestimonialSchema = z.object({
  id: slug,
  author: z.string().min(1),
  quoteKey: i18nKey,
});
export type Testimonial = z.infer<typeof TestimonialSchema>;

export const ServiceAreasSchema = z.record(z.enum(LOCALES), z.array(z.string().min(1)).min(1));
export type ServiceAreas = z.infer<typeof ServiceAreasSchema>;

export const ContactSchema = z.object({
  owner: z.string().min(1),
  phoneDisplay: z.string().min(1),
  phoneHref: z.string().regex(/^tel:\+\d+$/),
  email: z.string().email(),
  address: z.object({
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    countryCode: z.literal('HU'),
  }),
  mapsUrl: z.string().url(),
  instagram: z.string().url(),
  facebook: z.string().url(),
  instagramHandle: z.string().min(1),
});
export type Contact = z.infer<typeof ContactSchema>;

export const validateAlbums = (data: unknown): Album[] => z.array(AlbumSchema).min(1).parse(data);
export const validateRentalItems = (data: unknown): RentalItem[] => z.array(RentalItemSchema).min(1).parse(data);
export const validateServices = (data: unknown): Service[] => z.array(ServiceSchema).length(3).parse(data);
export const validateTestimonials = (data: unknown): Testimonial[] => z.array(TestimonialSchema).min(1).parse(data);
