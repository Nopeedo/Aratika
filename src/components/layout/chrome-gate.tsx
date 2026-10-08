'use client'

/**
 * ChromeGate — hides the site furniture on routes that are not part of the site.
 *
 * /links is a link-in-bio landing page. It is reached from an Instagram or
 * Facebook profile by someone who has never seen politika.nz, and it has one
 * job: send them to the right place in one tap. A navbar, a footer, a floating
 * companion and a sound toggle all compete with that, and the footer in
 * particular carries a Donate button, which must not appear on a page whose
 * whole purpose is a non-partisan enrolment and voting ask.
 *
 * Why a client gate rather than a second root layout: Next nests route-group
 * layouts INSIDE app/layout.tsx, so a group cannot drop the chrome. Multiple
 * root layouts need no root layout at all, which this site has. usePathname is
 * available during the server render too, so the gated chrome is absent from
 * the first paint rather than flashing in and disappearing.
 *
 * Takes its children already rendered, so a SERVER component (the footer) can be
 * passed through a client gate without becoming a client component itself.
 */

import { usePathname } from 'next/navigation'

export function ChromeGate({ hideOn, children }: {
  /** Exact paths, or a prefix — '/links' also covers '/links/anything'. */
  hideOn: string[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const bare = hideOn.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (bare) return null
  return <>{children}</>
}
