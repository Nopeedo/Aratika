/**
 * /plan — the persistent "Your Plan" page. Reads the saved survey answers
 * (client-side) and shows a tick-as-you-go checklist of how Aratika helps this
 * person, so they never have to revisit /start to find their next step.
 */

import type { Metadata } from 'next'
import { PlanView } from '@/components/onboarding/plan-view'

export const metadata: Metadata = {
  title: 'Your plan',
  description: 'Your personalised, tick-as-you-go plan — the issues you care about and the parts of Aratika that help you most.',
}

const BORDER = '#e9e7e2'

export default function PlanPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '52px 36px 56px' }}>
          <PlanView />
        </div>
      </div>
    </div>
  )
}
