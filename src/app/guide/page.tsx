/**
 * /guide — the skippable "help me get started" on-ramp. Reached from the hero's
 * primary action. A calm three-question path for people who don't usually vote;
 * ends in concrete next steps rather than a wall of information. The deeper
 * 12-question compass lives at /start.
 */

import type { Metadata } from 'next'
import { QuickGuide } from '@/components/guide/quick-guide'
import { BORDER } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Get started — a quick, no-jargon guide',
  description:
    'New to this, or not sure where to start? Three quick questions and we’ll point you to where the parties stand on what you care about, how to enrol, and your local seat. Skippable, no account needed.',
}

export default function GuidePage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(32px, 6vh, 60px) clamp(20px, 5vw, 36px)' }}>
          <QuickGuide />
        </div>
      </div>
    </div>
  )
}
