'use client'

/**
 * SiteTail — the mailing list and the tool signposts, under every page.
 *
 * Both started on the homepage, which is the one page a reader is least
 * likely to be on when they decide they want either of them: the email box is
 * worth most at the end of something they came to read, and "here is the rest
 * of the site" belongs wherever the site has just finished answering a
 * question. So they sit above the footer everywhere instead.
 *
 * Except the homepage, which renders both itself, in positions chosen for that
 * page — the email box under the 2023-term section rather than at the very
 * bottom. Rendering them here as well would show each twice.
 *
 * Both components take the party colour when a PartyCycleProvider is above
 * them and the site's jade when it is not, which is every page but home.
 */

import { usePathname } from 'next/navigation'
import { EmailUpdates } from '@/components/homepage/email-updates'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'

export function SiteTail() {
  const pathname = usePathname()
  // '/?full=1' is still pathname '/', so the query form is covered.
  if (pathname === '/') return null

  return (
    <>
      <EmailUpdates />
      <ExploreCarousel />
    </>
  )
}
