/**
 * Organization structured data (schema.org JSON-LD).
 *
 * This is how Google works out that "Arapono" is a distinct organisation and
 * that this domain is its home — the thing a brand-name search depends on, and
 * a prerequisite for a knowledge panel. `sameAs` lists our official accounts;
 * Google treats the association as confirmed when those profiles link back
 * here, so the website field on each profile matters as much as this file.
 *
 * Rendered once, in the root layout.
 */

import { SITE } from '@/constants/site'

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    alternateName: `${SITE.name} NZ`,
    url: SITE.url,
    logo: `${SITE.url}/icon-512.png`,
    image: `${SITE.url}/icon-512.png`,
    description: SITE.description,
    slogan: SITE.tagline,
    email: SITE.email,
    areaServed: { '@type': 'Country', name: 'New Zealand' },
    // Non-partisanship is the core editorial claim — worth stating in the
    // machine-readable description too, not just the footer.
    knowsAbout: [
      'New Zealand politics',
      'New Zealand Parliament',
      'New Zealand elections',
      'political parties',
      'legislation',
    ],
    ...(SITE.socials.length > 0 && { sameAs: SITE.socials.map((s) => s.url) }),
  }

  return (
    <script
      type="application/ld+json"
      // The payload is built from our own constants — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
