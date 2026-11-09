import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const manifestPath = path.resolve('references/legacy/manifest.json');

const ManifestSchema = z.object({
  archivedAt: z.string(),
  albums: z
    .array(z.object({ slug: z.string(), couple: z.string(), images: z.array(z.object({ url: z.string().url() })).min(1) }))
    .length(15),
  pages: z.object({ hu: z.record(z.string(), z.unknown()), de: z.record(z.string(), z.unknown()) }),
  testimonials: z.array(z.object({ author: z.string(), quote: z.string() })).length(4),
  contact: z.object({ phone: z.string(), email: z.string().email() }),
  totals: z.object({ albums: z.literal(15), galleryImages: z.literal(169) }),
});

describe('legacy archive manifest (MASTER-PLAN 0.1, PRD D-17)', () => {
  it('exists and validates: 15 albums / 169 images, both locales incl. the flower garden', () => {
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = ManifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')));
    expect(Object.keys(manifest.pages.hu)).toContain('garden');
    expect(Object.keys(manifest.pages.de)).toContain('garden');
  });

  it('keeps the archived Markdown for every legacy page', () => {
    for (const slug of ['home', 'szolgaltatasok', 'munkaim', 'viragoskert', 'kellekberles', 'rolunk', 'kapcsolat'])
      expect(existsSync(path.resolve('references/legacy/hu', `${slug}.md`)), slug).toBe(true);
    for (const slug of ['home', 'dienstleistungen', 'referenzen', 'blumengarten', 'verleih', 'uebermich', 'kontakt'])
      expect(existsSync(path.resolve('references/legacy/de', `${slug}.md`)), slug).toBe(true);
  });
});
