/**
 * /start — the onboarding journey. "What matters to you?" + your level, then a
 * personalised result pointing to where parties stand on the issues chosen.
 * No account required; choices are saved locally.
 */

import type { Metadata } from 'next'
import { CompassQuiz } from '@/components/compass/compass-quiz'
import { BORDER, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Your political compass',
  description:
    'Twelve questions on the issues. See where you line up with each party, using their own sourced positions, and where to go next.',
}

export default function StartPage() {
  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px clamp(18px, 5vw, 36px) 56px' }}>
          <CompassQuiz />
        </div>
      </div>
    </div>
  )
}
