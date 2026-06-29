/**
 * PolicyCoverage — a self-contained "coverage at a glance" band (the party × topic
 * matrix) for reuse across the policy hub: the index, each topic page, and the
 * party readers. Fetches approved positions itself; renders nothing if there are
 * none yet.
 */

import Link from 'next/link'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { CoverageMatrix } from './coverage-matrix'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export async function PolicyCoverage({ maxWidth = 1100 }: { maxWidth?: number }) {
  const positions = await getAllApprovedPositions()
  if (positions.length === 0) return null
  const topics = POLICY_TOPIC_ORDER.map((slug) => ({ slug, label: POLICY_TOPICS[slug].label }))

  return (
    <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '32px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Coverage at a glance</h2>
            <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>Which party holds a published position on which topic.</p>
          </div>
          <Link href="/compare" style={{ fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>Open the compare tool →</Link>
        </div>
        <CoverageMatrix positions={positions} topics={topics} />
      </div>
    </section>
  )
}
