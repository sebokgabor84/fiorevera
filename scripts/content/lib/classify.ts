/**
 * scripts/content/lib/classify.ts — is this change pure content, or does it need the technical owner?
 *
 * The CMS Coordinator may put a change live on the business owner's yes ONLY when this classifier
 * says `content`. It is deliberately code, not judgement: an allowlist of paths, and inside the
 * allowed files a check that nothing but catalogue content moved (no code next to a data literal,
 * no legal text, no hero photo). Anything it does not recognise is `needs-gabor`.
 * The release lane (scripts/release/publish-content.ts) calls the same function again right before
 * it merges.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { flatten, type LocaleTree } from '../../validate-i18n';
import { parseImageMeta } from '../../images/tiers.js';
import { git, gitFile } from './checkout';
import { readValue, replaceLiteral } from './tsData';

export type ChangeClass = 'content' | 'needs-gabor';

export interface ChangedFile {
  path: string;
  /** A = added, M = modified, D = deleted (renames are reported as D + A). */
  status: 'A' | 'M' | 'D';
}

export interface Classification {
  class: ChangeClass;
  /** Why it is not pure content; empty for `content`. */
  reasons: string[];
  files: string[];
}

/** Texts that are legal statements: only the technical owner changes them (gdpr-guardian). */
export const LEGAL_KEYS = [/^privacy\./, /^contact\.form\.consent/, /^contact\.form\.errors\.consent$/];
/** Contact fields that are plain content. E-mail, address, owner name and map link also appear in legal texts. */
export const CONTACT_CONTENT_FIELDS = ['phoneDisplay', 'phoneHref', 'instagram', 'facebook', 'instagramHandle'];

/** Data modules and the exports that hold their content; everything else in the file is code. */
const DATA_FILES: Record<string, string[]> = {
  'src/data/albums.ts': ['albums', 'featuredAlbumIds'],
  'src/data/rentalItems.ts': ['rentalItems'],
  'src/data/testimonials.ts': ['testimonials'],
  'src/data/serviceAreas.ts': ['serviceAreas'],
  'src/data/contact.ts': ['contact'],
};
const LOCALE_FILE = /^src\/i18n\/locales\/(hu|de|en)\.json$/;
const IMAGE_META = 'src/data/generated/imageMeta.ts';

/** Files that are content, or that a content change regenerates, as a whole. */
const PLAIN_ALLOWED = [
  /^public\/assets\/(gallery|rental)\/[a-z0-9_-]+\/[^/]+\.webp$/,
  /^tests\/visual\/__screenshots__\/.+\.png$/,
  /^docs\/qa\/visual-baselines-log\.md$/,
  /^docs\/qa\/reviews\/[^/]+\.json$/,
  /^public\/sitemap\.xml$/,
  /^scripts\/sitemap-lastmod\.json$/,
  /^docs\/vera-agent\/changelog\.md$/,
];

const withoutLiterals = (source: string, names: readonly string[]): string => names.reduce((text, name) => replaceLiteral(text, name, 'null'), source);

export interface ClassifyInput {
  files: readonly ChangedFile[];
  /** File content before the change (null = did not exist). */
  base: (file: string) => string | null;
  /** File content after the change (null = deleted). */
  head: (file: string) => string | null;
}

export function classifyChange(input: ClassifyInput): Classification {
  const reasons: string[] = [];
  for (const file of input.files) {
    const rel = file.path;
    if (PLAIN_ALLOWED.some((pattern) => pattern.test(rel))) continue;
    const before = input.base(rel);
    const after = input.head(rel);

    if (rel in DATA_FILES) {
      if (before === null || after === null) {
        reasons.push(`${rel}: a data file was added or deleted`);
        continue;
      }
      try {
        if (withoutLiterals(before, DATA_FILES[rel]) !== withoutLiterals(after, DATA_FILES[rel])) reasons.push(`${rel}: something other than the content entries changed (code, types or comments)`);
        if (rel === 'src/data/contact.ts') {
          const a = readValue(before, 'contact') as Record<string, unknown>;
          const b = readValue(after, 'contact') as Record<string, unknown>;
          for (const field of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (JSON.stringify(a[field]) !== JSON.stringify(b[field]) && !CONTACT_CONTENT_FIELDS.includes(field)) {
              reasons.push(`${rel}: "${field}" changed — e-mail, postal address and owner name also appear in the privacy notice`);
            }
          }
        }
      } catch (error) {
        reasons.push(`${rel}: cannot be read as data (${error instanceof Error ? error.message : String(error)})`);
      }
      continue;
    }

    if (LOCALE_FILE.test(rel)) {
      if (before === null || after === null) {
        reasons.push(`${rel}: a language file was added or deleted`);
        continue;
      }
      try {
        const a = flatten(JSON.parse(before) as LocaleTree);
        const b = flatten(JSON.parse(after) as LocaleTree);
        for (const key of new Set([...a.keys(), ...b.keys()])) {
          if (a.get(key) !== b.get(key) && LEGAL_KEYS.some((pattern) => pattern.test(key))) reasons.push(`${rel}: legal text "${key}" changed`);
        }
      } catch {
        reasons.push(`${rel}: is not valid JSON`);
      }
      continue;
    }

    if (rel === IMAGE_META) {
      if (before === null || after === null) {
        reasons.push(`${rel}: the photo manifest was added or deleted`);
        continue;
      }
      try {
        const a = parseImageMeta(before);
        const b = parseImageMeta(after);
        for (const slot of ['hero', 'about', 'brand'] as const) {
          if (JSON.stringify(a[slot]) !== JSON.stringify(b[slot])) reasons.push(`${rel}: the ${slot} photo changed — it decides first impression and loading speed`);
        }
        if (JSON.stringify(a.rental._page ?? null) !== JSON.stringify(b.rental._page ?? null)) reasons.push(`${rel}: the rental page's header photo changed`);
      } catch (error) {
        reasons.push(`${rel}: ${error instanceof Error ? error.message : String(error)}`);
      }
      continue;
    }

    reasons.push(`${rel}: not a content file`);
  }
  if (input.files.length === 0) reasons.push('nothing changed');
  return { class: reasons.length ? 'needs-gabor' : 'content', reasons, files: input.files.map((file) => file.path) };
}

// ── Git wrapper ───────────────────────────────────────────────────────────────────────────────

/** Classifies the checkout's difference to `baseRef` (committed, staged, unstaged and untracked files). */
export function classifyCheckout(root: string, baseRef = 'origin/main'): Classification & { base: string } {
  const base = git(root, ['merge-base', baseRef, 'HEAD']);
  const files: ChangedFile[] = [];
  for (const line of git(root, ['diff', '--name-status', '--no-renames', base]).split('\n').filter(Boolean)) {
    const [status, file] = line.split('\t');
    files.push({ path: file, status: status.startsWith('A') ? 'A' : status.startsWith('D') ? 'D' : 'M' });
  }
  for (const file of git(root, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)) files.push({ path: file, status: 'A' });
  const result = classifyChange({
    files,
    base: (file) => gitFile(root, base, file),
    head: (file) => (existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), 'utf8') : null),
  });
  return { ...result, base };
}
