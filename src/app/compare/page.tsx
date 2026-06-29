/**
 * /compare — the interactive party comparison tool. Switch topic, filter parties,
 * toggle Plain/Detailed. Built on the same approved positions as the topic pages.
 * Where the homepage party grid and "Compare all parties" lead.
 */

import type { Metadata } from 'next'
import { Scale } from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { CompareTool } from '@/components/policy/compare-tool'
import { CoverageMatrix } from '@/components/policy/coverage-matrix'
import { SectionDivider } from '@/components/ui/section-divider'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Compare the parties',
  description: 'Compare where every party stands on the issues, side by side — summarised neutrally from official policy, with sources.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function ComparePage() {
  const positions = await getAllApprovedPositions()
  const withData = new Set(positions.map((p) => p.topic))
  const topics = POLICY_TOPIC_ORDER.map((slug) => ({ slug, label: POLICY_TOPICS[slug].label, hasData: withData.has(slug) }))

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 36px 30px' }}>
          <div style={{ marginBottom: 10 }}>
            <SectionDivider type="official" label="Sourced from official party policy" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Scale style={{ width: 23, height: 23, color: JADE }} />
            </span>
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>
                Compare the parties
              </h1>
              <p style={{ fontSize: 15.5, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '6px 0 0', maxWidth: 620, lineHeight: 1.55 }}>
                Pick an issue and see where each party stands, side by side. Toggle plain or detailed, and tap any card for the full breakdown.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 36px 64px' }}>
        {positions.length > 0 ? (
          <>
            {/* Coverage at a glance */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Coverage at a glance</h2>
              <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px' }}>Which party holds a published position on which topic. Gaps are being worked through one topic at a time.</p>
              <CoverageMatrix positions={positions} topics={topics} />
            </div>
            <CompareTool positions={positions} topics={topics} />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: SECONDARY, fontFamily: MANROPE }}>
            <Scale style={{ width: 30, height: 30, color: '#cbd0d6', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 6 }}>Comparisons are being compiled</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
              Party positions are summarised neutrally from official policy and editor-checked before they appear here. Check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
