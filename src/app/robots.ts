/**
 * robots.txt — crawl rules, and where the sitemap lives.
 *
 * The disallow list is built from the same GATED_ROUTES/isEnabled() source the
 * app itself uses, so a phase flip opens the routes to crawlers at the same
 * moment it opens them to readers. Everything else here is permanently private:
 * auth flows, the editorial tools, the login-gated record pages, and the API.
 */

import type { MetadataRoute } from 'next'
import { SITE } from '@/constants/site'
import { GATED_ROUTES, isEnabled } from '@/constants/features'

/**
 * Never public, in any phase. These are either login-gated, deliberately
 * noindexed, or have no meaning to a search result (the auth flow, the
 * placeholder a gated route redirects to).
 */
const ALWAYS_PRIVATE = [
  '/api/',
  '/auth/',
  '/editor',
  '/record',
  '/dashboard',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/coming-soon',
]

export default function robots(): MetadataRoute.Robots {
  // Routes gated behind a later phase — they 302 to /coming-soon today, so
  // there's nothing worth crawling until their phase lands.
  const gated = GATED_ROUTES.filter((r) => !isEnabled(r.feature)).map((r) => r.prefix)

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ALWAYS_PRIVATE, ...gated].sort(),
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
