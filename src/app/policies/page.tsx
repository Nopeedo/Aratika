/**
 * /policies — Policy Hub
 * The 10 policy topics, with which parties prioritise each. Links to per-topic
 * comparison pages.
 */

import type { Metadata } from 'next'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { FollowIssues } from '@/components/policy/follow-issues'
import { TopicChip } from '@/components/homepage/topic-chip'
import { SectionDivider } from '@/components/ui/section-divider'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Policy Hub',
  description:
    'Compare where New Zealand\'s political parties stand on the issues that matter — ' +
    'housing, health, the economy, climate and more.',
}

export default function PolicyHubPage() {
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
        {/* Following an issue was only possible from inside a topic page, which
            is why almost nobody had done it. */}
        <FollowIssues />
        {/* Pills, not cards. The eleven topic cards each carried an icon, a
            title, a description and a party-dot row, which pushed the grid past
            a full screen for what is a navigation list. Same TopicChip the
            homepage and party pages use, so an issue looks the same wherever it
            appears — in link mode here, because on this page the chip's job is
            to take you to the topic. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {POLICY_TOPIC_ORDER.map((key) => (
            <TopicChip key={key} topicKey={key} active={false} href={`/policies/${key}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
