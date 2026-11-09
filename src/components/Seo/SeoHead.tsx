import { useTranslation } from 'react-i18next';
import { absoluteUrl, alternatesFor, pathFor, type Locale, type PageId, LOCALES } from '../../data/routes';
import { contact } from '../../data/contact';
import { serviceAreas } from '../../data/serviceAreas';
import { IMAGE_META } from '../../data/generated/imageMeta';

interface Props {
  locale: Locale;
  page: PageId | null;
  /** Extra JSON-LD block(s) for the page (e.g. ImageGallery). */
  jsonLd?: Record<string, unknown>[];
}

const OG_LOCALE: Record<Locale, string> = { hu: 'hu_HU', de: 'de_AT', en: 'en_GB' };

/**
 * Plain-JSX head (MASTER-PLAN 1.8, PRD D-18): React 19 hoists <title>/<meta>/<link>
 * into <head>, so the prerendered HTML carries them without JavaScript.
 */
export const SeoHead = ({ locale, page, jsonLd = [] }: Props) => {
  const { t } = useTranslation();
  const metaKey = page ?? 'notFound';
  const title = t(`meta.${metaKey}.title`);
  const description = t(`meta.${metaKey}.description`);
  const canonical = page ? absoluteUrl(pathFor(page, locale)) : absoluteUrl(pathFor('home', locale));
  const hero = IMAGE_META.hero[0];
  const ogImage = hero ? absoluteUrl(hero.src) : absoluteUrl('/assets/brand/01-logo-fiore-vera.webp');

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${absoluteUrl('/')}#business`,
    name: 'Fiore Vera',
    description,
    url: canonical,
    telephone: contact.phoneHref.replace('tel:', ''),
    email: contact.email,
    image: ogImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address.street,
      postalCode: contact.address.postalCode,
      addressLocality: contact.address.city,
      addressCountry: contact.address.countryCode,
    },
    areaServed: serviceAreas[locale].map((name) => ({ '@type': 'Place', name })),
    sameAs: [contact.instagram, contact.facebook],
    founder: { '@type': 'Person', name: contact.owner },
    inLanguage: LOCALES,
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={page ? 'index, follow' : 'noindex, follow'} />
      <link rel="canonical" href={canonical} />
      {page &&
        alternatesFor(page).map((alt) => (
          <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
        ))}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Fiore Vera" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={OG_LOCALE[locale]} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {[localBusiness, ...jsonLd].map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON-LD must be raw JSON; escape "<" so it can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
};
