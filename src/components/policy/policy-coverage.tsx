/**
 * PolicyCoverage — a self-contained "coverage at a glance" band (the party × topic
 * matrix) for reuse across the policy hub: the index, each topic page, and the
 * party readers. Fetches approved positions itself; renders nothing if there are
 * none yet.
 */

import { getAllApprovedPositions } from '@/lib/positions/live'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { CoverageMatrix } from './coverage-matrix'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

export async function PolicyCoverage({ maxWidth = 1100, nested = false }: {
  maxWidth?: number
  /**
   * Set when the band is rendered INSIDE a page container that already has the
   * page's horizontal inset (the topic page, since the band moved up under the
   * comparison). It then adds none of its own, so the table lines up exactly
   * with the party cards above it instead of sitting inset twice.
   */
  nested?: boolean
}) {
  const positions = await getAllApprovedPositions()
  if (positions.length === 0) return null
  const topics = POLICY_TOPIC_ORDER.map((slug) => ({ slug, label: POLICY_TOPICS[slug].label }))

  // Transparent, so the page's weave runs behind the heading and the legend
  // the same way it does everywhere else. The band used to sit on its own flat
  // panel, which made it read as a separate page pasted into this one. The
  // table inside keeps its white ground.
  return (
    <section style={{ background: 'transparent', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: nested ? undefined : maxWidth, margin: '0 auto', padding: nested ? '32px 0' : '32px clamp(18px, 5vw, 36px)' }}>
        {/* No "Open the compare tool" link: on a topic page it pointed at the
            page you were already on, and the topic chips above are the way
            around the comparison. Removed by request. */}
        <div style={{ marginBottom: 12 }}>
          {/* Same scale as the page's own "Party Policy Comparison" h1: this
              is the other half of that comparison, the whole field at once
              rather than one topic, so it should carry the same weight on the
              page rather than read as a footnote to it. */}
          <h2 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.15 }}>Party Policy Table Comparison</h2>
          <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.45 }}>Which party holds a published position on which topic.</p>
        </div>
        <CoverageMatrix positions={positions} topics={topics} />
      </div>
    </section>
  )
}
