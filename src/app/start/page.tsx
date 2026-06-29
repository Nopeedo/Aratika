/**
 * /start — the onboarding journey. "What matters to you?" + your level, then a
 * personalised result pointing to where parties stand on the issues chosen.
 * No account required; choices are saved locally.
 */

import type { Metadata } from 'next'
import { CompassQuiz } from '@/components/compass/compass-quiz'

export const metadata: Metadata = {
  title: 'Your political compass',
  description:
    'A 12-question, no-jargon compass: find the tools that help you most and see where you overlap with each party on the issues — sourced, side by side. Not voting advice.',
}

const BORDER = '#e9e7e2'

export default function StartPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 36px 56px' }}>
          <CompassQuiz />
        </div>
      </div>
    </div>
  )
}
