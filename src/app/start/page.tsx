/**
 * /start — the onboarding journey. "What matters to you?" + your level, then a
 * personalised result pointing to where parties stand on the issues chosen.
 * No account required; choices are saved locally.
 */

import type { Metadata } from 'next'
import { OnboardingQuiz } from '@/components/onboarding/onboarding-quiz'

export const metadata: Metadata = {
  title: 'Find what matters to you',
  description:
    'A two-minute, no-jargon walkthrough to find the issues you care about and see where the parties stand — pitched at your level.',
}

const BORDER = '#e9e7e2'

export default function StartPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 36px 56px' }}>
          <OnboardingQuiz />
        </div>
      </div>
    </div>
  )
}
