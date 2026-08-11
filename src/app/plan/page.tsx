/**
 * /plan — the persistent "Your Plan" page. Reads the saved survey answers
 * (client-side) and shows a tick-as-you-go checklist of how Arapono helps this
 * person, so they never have to revisit /start to find their next step.
 */

import type { Metadata } from 'next'
import { PlanView } from '@/components/onboarding/plan-view'
import { BORDER, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Your plan',
  description: 'Your personalised, tick-as-you-go plan — the issues you care about and the parts of Arapono that help you most.',
}

export default function PlanPage() {
  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '52px 36px 56px' }}>
          <PlanView />
        </div>
      </div>
    </div>
  )
}
