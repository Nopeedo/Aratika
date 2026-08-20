/**
 * /policies — Policy Hub
 * The 10 policy topics, with which parties prioritise each. Links to per-topic
 * comparison pages.
 */

import type { Metadata } from 'next'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { PolicyHubExplorer, type TopicCoverage } from '@/components/policy/policy-hub-explorer'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { SectionDivider } from '@/components/ui/section-divider'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Policy Hub',
  description:
    'Compare where New Zealand\'s political parties stand on the issues that matter — ' +
    'housing, health, the economy, climate and more.',
}

export default async function PolicyHubPage() {
  // Grouped on the server: the panel needs to know which parties have said
  // something on each issue, and the full position objects are far larger than
  // the summary the panel shows.
  const positions = await getAllApprovedPositions()
  const coverage: TopicCoverage[] = POLICY_TOPIC_ORDER.map((topic) => ({
    topic,
    // Current policy only. Parties can hold both a 2023 and a 2026 position on
    // the same issue, and including both listed a party twice in the panel with
    // two different stances — which reads as a contradiction rather than as a
    // change over time. Same filter the party pages use.
    parties: positions
      .filter((p) => p.topic === topic && p.period !== '2023')
      .map((p) => ({ slug: p.party, stance: p.stance, noPosition: p.noPosition })),
  }))

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 40px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Party Policy Comparison" />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
            Policy Hub
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            Where do the parties stand on the issues that matter to you? Explore each topic to see which
            parties make it a priority — and how their positions compare.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(18px, 5vw, 36px) clamp(18px, 5vw, 36px) 64px' }}>
        {/* Tapping an issue opens it here rather than replacing the page, and
            the follow button lives in that panel — it used to be two
            navigations deep, which is why almost nobody found it. */}
        <PolicyHubExplorer coverage={coverage} />
      </div>
    </div>
  )
}
