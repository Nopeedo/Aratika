/**
 * /guide — the skippable "help me get started" on-ramp. Reached from the hero's
 * primary action. A calm three-question path for people who don't usually vote;
 * ends in concrete next steps rather than a wall of information. The deeper
 * 12-question compass lives at /start.
 */

import type { Metadata } from 'next'
import { QuickGuide } from '@/components/guide/quick-guide'
import { BORDER, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'
import { BackLink } from '@/components/ui/back-link'

export const metadata: Metadata = {
  title: 'Get started: a quick, no-jargon guide',
  description:
    'New to this, or not sure where to start? Three quick questions and we’ll point you to where the parties stand on what you care about, how to enrol, and your local seat. Skippable, no account needed.',
}

export default function GuidePage() {
  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(32px, 6vh, 60px) clamp(20px, 5vw, 36px)' }}>
          {/* The homepage hero’s primary action. QuickGuide has its own Skip
              link, but that goes to the homepage by design rather than back. */}
          <BackLink fallbackHref="/" label="Back" style={{ fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginBottom: 18 }} />
          <QuickGuide />
        </div>
      </div>
    </div>
  )
}
