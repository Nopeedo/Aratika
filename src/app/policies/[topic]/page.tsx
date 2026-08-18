/**
 * /policies/[topic] — per-topic party comparison.
 * Topic explainer + which parties prioritise it (linked to party pages).
 * Detailed party position statements are sourced from official party policy
 * documents and shown as they are compiled.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Info } from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import { PolicyTopic } from '@/types'
import { SectionDivider } from '@/components/ui/section-divider'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { getApprovedPositions } from '@/lib/positions/live'
import { TopicSwitcher } from '@/components/policy/topic-switcher'
import { PolicyComparison } from '@/components/policy/policy-comparison'
import { PolicyCoverage } from '@/components/policy/policy-coverage'
import { BillsForTopic } from '@/components/bills/bills-for-topic'
import { BackLink } from '@/components/ui/back-link'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'


export function generateStaticParams() {
  return POLICY_TOPIC_ORDER.map((topic) => ({ topic }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ topic: string }> },
): Promise<Metadata> {
  const { topic } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  if (!t) return { title: 'Policy topic not found' }
  return { title: `${t.label} — Party Positions`, description: t.longDescription }
}

export default async function PolicyTopicPage(
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  if (!t) notFound()
  const Icon = TOPIC_ICONS[t.icon]


  const positions = await getApprovedPositions(topic)

  return (
    <div style={WOVEN_PAGE}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) clamp(18px, 5vw, 36px)' }}>
          <BackLink fallbackHref="/policies" label="All policy topics" style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginBottom: 22 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={t.color} style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {Icon && <Icon className={`size-7 ${t.textColor}`} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Policy Topic</div>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>{t.label}</h1>
            </div>
            <BookmarkButton entity={{
              kind: 'policy', refId: topic, label: t.label,
              sublabel: 'Policy topic', href: `/policies/${topic}`, accent: JADE,
            }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px clamp(18px, 5vw, 36px) 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* What this covers */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>What this covers</h2>
          <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{t.longDescription}</p>
        </div>

        {/* Every issue, so a reader can pivot topic without backing out to the
            index. The mirror of the party switcher on /parties/[slug] — the two
            pages are transposes of one dataset and now navigate the same way.

            This replaces a "Parties prioritising {t.label}" card grid. Every
            party in it appeared again in the comparison directly below, so it
            was a duplicate list standing between the reader and the content —
            and it ranked parties by hand-maintained keyPolicyAreas metadata
            rather than by anything sourced. */}
        <TopicSwitcher current={topic} />

        {/* Detailed party-by-party comparison */}
        {positions.length > 0 ? (
          <PolicyComparison positions={positions} topicLabel={t.label} topic={topic} />
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <b>Detailed party-by-party positions are being compiled.</b> Side-by-side position statements and
              plain-language summaries for each party on {t.label.toLowerCase()} will appear here, summarised
              neutrally from official party policy and editor-checked — never paraphrased without attribution.
            </p>
          </div>
        )}

        {/* What's been legislated this term (bills → record, beside the comparison) */}
        <BillsForTopic topic={topic as PolicyTopic} label={t.label} />

        {/* Source */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Topic framing is editorial. Party positions reflect each party&apos;s most recent published policy — not their stance at a past election — sourced from official party material.
          </p>
        </div>
      </div>
      <PolicyCoverage maxWidth={1000} />
    </div>
  )
}
