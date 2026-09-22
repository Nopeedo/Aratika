/**
 * PolicyCoverage — a self-contained "coverage at a glance" band (the party × topic
 * matrix) for reuse across the policy hub: the index, each topic page, and the
 * party readers. Fetches approved positions itself; renders nothing if there are
 * none yet.
 */

import { getAllApprovedPositions } from '@/lib/positions/live'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { CoverageMatrix } from './coverage-matrix'
import { BORDER, INK, MANROPE, SECONDARY, SURFACE } from '@/constants/theme'

export async function PolicyCoverage({ maxWidth = 1100 }: { maxWidth?: number }) {
  const positions = await getAllApprovedPositions()
  if (positions.length === 0) return null
  const topics = POLICY_TOPIC_ORDER.map((slug) => ({ slug, label: POLICY_TOPICS[slug].label }))

  return (
    <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '32px clamp(18px, 5vw, 36px)' }}>
        {/* No "Open the compare tool" link: on a topic page it pointed at the
            page you were already on, and the topic chips above are the way
            around the comparison. Removed by request. */}
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Coverage at a glance</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>Which party holds a published position on which topic.</p>
        </div>
        <CoverageMatrix positions={positions} topics={topics} />
      </div>
    </section>
  )
}
