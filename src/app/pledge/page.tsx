/**
 * /pledge — the pledge on a page of its own.
 *
 * The card already lives on the homepage, but a campaign needs a URL you can
 * put in a bio, a caption or a QR code, where the thing you promised is the
 * first thing on screen rather than three scrolls down someone else's page.
 *
 * Gated with the feature itself. While PLEDGE_ENABLED is false this redirects
 * home rather than rendering an empty shell: a dead link from a social profile
 * is worse than no link, and the card hides itself anyway.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PledgeCounter } from '@/components/pledge/pledge-counter'
import { PLEDGE_ENABLED } from '@/constants/features'
import { INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Will you pledge to vote?',
  description:
    'Pledge to vote in the 2026 New Zealand general election. Enrolment closes midnight, Sunday 25 October.',
}

export default function PledgePage() {
  if (!PLEDGE_ENABLED) redirect('/')

  return (
    // WOVEN_PAGE carries minHeight 100vh so a short page still fills the screen
    // with the weave rather than stopping abruptly. This page is short AND the
    // footer below it is tall, so the page scrolls either way and the 100vh only
    // buys a screen of empty texture under the card. Overridden here rather than
    // in the constant, which 20 pages share.
    <div style={{ ...WOVEN_PAGE, minHeight: 'auto', paddingBottom: 48 }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 12px' }}>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 800, letterSpacing: '-.03em',
          color: INK, fontFamily: MANROPE, margin: '0 0 10px', lineHeight: 1.12,
        }}>
          829,396 New Zealanders were enrolled in 2023 and didn&rsquo;t vote.
        </h1>
        <p style={{ fontSize: 16.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0, maxWidth: 580 }}>
          That&rsquo;s nearly twice the number who weren&rsquo;t enrolled at all.
          <span style={{ display: 'block', fontSize: 13, color: '#9a9186', marginTop: 6 }}>
            Electoral Commission, 2023 General Election turnout statistics.
          </span>
        </p>
      </div>

      <PledgeCounter source="pledge-page" />
    </div>
  )
}
